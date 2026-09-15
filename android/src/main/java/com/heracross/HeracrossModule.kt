package com.heracross

import android.app.Activity
import android.app.Application
import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.network.NetworkingModule
import com.scizor.Scizor
import com.scizor.core.ScizorActivity
import com.scizor.feature.featureflags.FeatureFlag
import com.scizor.feature.featureflags.FlagOverride
import com.scizor.feature.servers.ServerEnvironment
import java.util.concurrent.CopyOnWriteArraySet

/**
 * The Heracross Turbo Module on Android: a thin forwarder to [Scizor].
 *
 * Calls arrive on the native modules thread. Every Scizor call is posted to the
 * main thread, where Scizor's lifecycle and Compose state live, which also keeps
 * them in the order JavaScript made them.
 *
 * Scizor keeps flag overrides and the selected server in a store it only opens
 * in `start`, and silently drops writes made before then. So Heracross queues
 * those writes and applies them once Scizor starts.
 */
class HeracrossModule(reactContext: ReactApplicationContext) :
  NativeHeracrossSpec(reactContext), LifecycleEventListener {

  private val debuggable: Boolean
    get() = (reactApplicationContext.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

  private val mainHandler = Handler(Looper.getMainLooper())

  // Main thread only.
  private val flagTracker = FlagChangeTracker()
  private val selectionTracker = SelectionTracker()
  private var changeCheckScheduled = false

  /** Set once React tears the module down, after which it emits nothing. */
  @Volatile private var invalidated = false

  init {
    reactContext.addLifecycleEventListener(this)
    liveModules.add(this)
    (reactContext.applicationContext as? Application)?.let(::installProcessHooks)
    scheduleChangeCheck()
  }

  override fun invalidate() {
    invalidated = true
    reactApplicationContext.removeLifecycleEventListener(this)
    liveModules.remove(this)
    mainHandler.removeCallbacksAndMessages(null)
    super.invalidate()
  }

  override fun start(allowProductionBuilds: Boolean, captureNetwork: Boolean) {
    // Mirror Scizor's own production gate, so a refused start leaves React
    // Native's networking untouched.
    val allowed = isStartAllowed(debuggable, allowProductionBuilds)
    synchronized(Companion) {
      if (shouldInstallNetworkHook(captureNetwork, allowed)) {
        // React Native applies this builder to every request it sends from now
        // on, on top of the client its OkHttpClientFactory built.
        val interceptor = Scizor.network.interceptor()
        NetworkingModule.setCustomClientBuilder { builder -> builder.addInterceptor(interceptor) }
        networkHookInstalled = true
      } else if (networkHookInstalled) {
        NetworkingModule.setCustomClientBuilder(null)
        networkHookInstalled = false
      }
    }
    val application = reactApplicationContext.applicationContext as? Application ?: return
    onMain {
      Scizor.start(application, allowProductionBuilds)
      if (!allowed) {
        // Scizor refused, so the queued writes can never apply.
        pendingWrites.clear()
        return@onMain
      }
      if (!started) {
        started = true
        // Starting loads Scizor's saved overrides and server. They are where
        // things stand, not changes, so record them first; the writes queued
        // before start are changes, so apply them after.
        liveModules.forEach { it.recordCurrentState() }
        val writes = pendingWrites.toList()
        pendingWrites.clear()
        writes.forEach { it() }
      }
      liveModules.forEach { it.scheduleChangeCheck() }
    }
  }

  /** Posted behind any pending `start`, so it reflects that call. */
  override fun isStarted(promise: Promise) = onMain { promise.resolve(started) }

  override fun showMenu() = onMain { Scizor.show() }

  override fun hideMenu() = onMain { Scizor.dismiss() }

  override fun isMenuOpen(promise: Promise) = onMain { promise.resolve(openMenus > 0) }

  override fun setInvocationGesture(gesture: String) = onMain {
    Scizor.invocationGesture = invocationGestureFor(gesture)
  }

  override fun setDisabledFeatures(features: ReadableArray) {
    val ids = features.strings().toSet()
    onMain { Scizor.disabledFeatures = ids }
  }

  // Feature flags

  override fun registerFeatureFlag(key: String, title: String, defaultValue: Boolean) = onMain {
    Scizor.featureFlags.register(FeatureFlag(key = key, title = title, defaultValue = defaultValue))
    flagTracker.recordIfUnseen(key, Scizor.featureFlags.isEnabled(key))
    scheduleChangeCheck()
  }

  override fun isFeatureFlagEnabled(key: String, promise: Promise) = onMain {
    promise.resolve(Scizor.featureFlags.isEnabled(key))
  }

  override fun getFeatureFlags(promise: Promise) = onMain {
    val flags = Arguments.createArray()
    Scizor.featureFlags.all().forEach { flag ->
      flags.pushMap(
        Arguments.createMap().apply {
          putString("key", flag.key)
          putString("title", flag.title)
          putBoolean("defaultValue", flag.defaultValue)
          putBoolean("enabled", Scizor.featureFlags.isEnabled(flag.key))
          val override = Scizor.featureFlags.overrideState(flag.key).toOverrideValue()
          if (override == null) putNull("override") else putBoolean("override", override)
        }
      )
    }
    promise.resolve(flags)
  }

  /** `null` for a flag that isn't registered, as on iOS. */
  override fun getFeatureFlagOverride(key: String, promise: Promise) = onMain {
    val registered = Scizor.featureFlags.all().any { it.key == key }
    promise.resolve(if (registered) Scizor.featureFlags.overrideState(key).toOverrideValue() else null)
  }

  override fun getFeatureFlagOverridesEnabled(promise: Promise) = onMain {
    promise.resolve(Scizor.featureFlags.overridesEnabled)
  }

  override fun setFeatureFlagOverridesEnabled(enabled: Boolean) = whenStarted {
    Scizor.featureFlags.overridesEnabled = enabled
  }

  override fun setFeatureFlagOverride(key: String, value: Boolean) = whenStarted {
    Scizor.featureFlags.setOverride(key, if (value) FlagOverride.ON else FlagOverride.OFF)
  }

  override fun clearFeatureFlagOverride(key: String) = whenStarted {
    Scizor.featureFlags.setOverride(key, FlagOverride.REMOTE)
  }

  override fun resetFeatureFlagOverrides() = whenStarted { Scizor.featureFlags.resetAllToRemote() }

  // Servers

  override fun configureServers(servers: ReadableArray) {
    val environments = servers.toServerEnvironments()
    onMain {
      selectionTracker.recordIfUnseen(Scizor.servers.selected?.name)
      Scizor.servers.configure(environments)
      scheduleChangeCheck()
    }
  }

  /** Scizor can only select a configured environment, so unknown ids are ignored. */
  override fun selectServer(id: String) = whenStarted {
    selectionTracker.recordIfUnseen(Scizor.servers.selected?.name)
    Scizor.servers.all().firstOrNull { it.name == id }?.let(Scizor.servers::select)
  }

  /** Scizor falls back to the first configured environment when none is saved. */
  override fun getSelectedServer(promise: Promise) = onMain {
    promise.resolve(Scizor.servers.selected?.toWritableMap())
  }

  override fun getServers(promise: Promise) = onMain {
    val servers = Arguments.createArray()
    Scizor.servers.all().forEach { servers.pushMap(it.toWritableMap()) }
    promise.resolve(servers)
  }

  // Change events

  /** Returning to the app, for example from Scizor's menu, re-reads what may have changed. */
  override fun onHostResume() = scheduleChangeCheck()

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  /** Records the current flags and server as the starting point, without reporting them. */
  private fun recordCurrentState() {
    flagTracker.update(currentFlags())
    selectionTracker.update(Scizor.servers.selected?.name)
  }

  private fun currentFlags(): Map<String, Boolean> =
    Scizor.featureFlags.all().associate { it.key to Scizor.featureFlags.isEnabled(it.key) }

  /** Posts one check behind the work already queued, so a burst of changes is read once. */
  private fun scheduleChangeCheck() {
    if (invalidated) return
    mainHandler.post {
      if (changeCheckScheduled) return@post
      changeCheckScheduled = true
      mainHandler.post {
        changeCheckScheduled = false
        checkForChanges()
      }
    }
  }

  private fun checkForChanges() {
    if (invalidated) return
    val flagChanges = flagTracker.update(currentFlags())
    val selected = Scizor.servers.selected
    val serverChanged = selectionTracker.update(selected?.name) != null
    // React hands over the emitter once the module is in use; a check before
    // then can only be recording the first snapshot.
    if (mEventEmitterCallback == null) return
    flagChanges.forEach { change ->
      emitOnFeatureFlagChange(
        Arguments.createMap().apply {
          putString("key", change.key)
          putBoolean("enabled", change.enabled)
        }
      )
    }
    if (serverChanged && selected != null) emitOnServerChange(selected.toWritableMap())
  }

  // Menu content

  override fun setEnvironmentVariables(variables: ReadableMap) {
    val map = variables.toStringMap()
    onMain { Scizor.environmentVariables = map }
  }

  override fun getEnvironmentVariables(promise: Promise) = onMain {
    promise.resolve(Arguments.makeNativeMap(Scizor.environmentVariables))
  }

  override fun setDeveloperOptions(options: ReadableArray) {
    val rows = options.toDeveloperOptions()
    onMain { Scizor.developerOptions = rows }
  }

  override fun setDeepLinkPresets(presets: ReadableArray) {
    val links = presets.toDeepLinkPresets()
    onMain { Scizor.deepLinkPresets = links }
  }

  /** APNs is iOS only; Android has nothing to show. */
  override fun setApnsToken(token: String?) = Unit

  override fun setFcmToken(token: String?) = onMain { Scizor.fcmToken = token }

  /**
   * Scizor's Notification Logger reads the device's notifications itself, once
   * notification access is granted, so there is nothing to forward.
   */
  override fun logNotification(payload: ReadableMap) = Unit

  // Cookies

  override fun logCookie(cookie: ReadableMap) {
    val parsed = cookie.toLoggedCookie() ?: return
    onMain {
      Scizor.cookies.log(
        name = parsed.name,
        value = parsed.value,
        domain = parsed.domain,
        path = parsed.path,
        secure = parsed.secure,
        httpOnly = parsed.httpOnly,
        sameSite = parsed.sameSite,
        expires = parsed.expires,
      )
    }
  }

  override fun captureWebViewCookies(url: String) = onMain { Scizor.cookies.captureWebView(url) }

  override fun clearLoggedCookies() = onMain { Scizor.cookies.clear() }

  // Crashes and location

  /**
   * Scizor has no public crash trigger; an uncaught exception on the main thread
   * is what it records. Only debuggable builds crash, matching iOS, where
   * Scyther's test crash exists in Debug builds only.
   */
  override fun triggerTestCrash() = onMain {
    if (debuggable) throw RuntimeException("Heracross test crash")
  }

  /** Scizor keeps its location spoofer internal, so there is nothing to report. */
  override fun getLocationSpoofingState(promise: Promise) {
    promise.resolve(null)
  }

  // Helpers

  private fun onMain(work: () -> Unit) {
    UiThreadUtil.runOnUiThread(work)
  }

  /**
   * Runs [write] once Scizor has started: straight away if it has, otherwise
   * when `start` runs. Either way the change is then checked for.
   */
  private fun whenStarted(write: () -> Unit) = onMain {
    if (started) {
      write()
      scheduleChangeCheck()
    } else {
      pendingWrites += write
    }
  }

  private fun ServerEnvironment.toWritableMap() =
    Arguments.createMap().apply {
      putString("id", name)
      putString("baseUrl", baseUrl)
      putMap("variables", Arguments.makeNativeMap(variables))
    }

  companion object {
    const val NAME = NativeHeracrossSpec.NAME

    /**
     * Whether Heracross registered its builder with [NetworkingModule]. The
     * slot is static, so this outlives module instances across JS reloads.
     */
    @Volatile private var networkHookInstalled = false

    /**
     * Whether a `start` made through Heracross passed Scizor's gate. Like
     * Scizor itself, it outlives reloads. Scizor exposes no started state, so a
     * start made from native code isn't seen.
     */
    @Volatile private var started = false

    /** Flag and server writes made before Scizor started. Main thread only. */
    private val pendingWrites = mutableListOf<() -> Unit>()

    /** Scizor menus currently open. Main thread only. */
    private var openMenus = 0

    /** Every module that hasn't been invalidated; a process can host more than one React instance. */
    private val liveModules = CopyOnWriteArraySet<HeracrossModule>()

    private var processHooksInstalled = false

    /**
     * Installs, once per process, the two ways Heracross learns about changes
     * made in Scizor's menu:
     * - Scizor's override callback, a single slot. Heracross still calls the
     *   callback that was there before; a callback set after this replaces
     *   Heracross's, and then menu changes are only read when the menu closes.
     * - Activity callbacks for Scizor's menu activity, which also answer
     *   `isMenuOpen`. Scizor reports no server selection, so closing a menu
     *   is when a server picked there is read.
     */
    private fun installProcessHooks(application: Application) = synchronized(Companion) {
      if (processHooksInstalled) return
      processHooksInstalled = true
      val previous = Scizor.featureFlags.onOverrideChanged
      Scizor.featureFlags.onOverrideChanged = { key ->
        previous?.invoke(key)
        liveModules.forEach { it.scheduleChangeCheck() }
      }
      application.registerActivityLifecycleCallbacks(
        object : Application.ActivityLifecycleCallbacks {
          override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
            if (activity is ScizorActivity) openMenus++
          }

          override fun onActivityDestroyed(activity: Activity) {
            if (activity !is ScizorActivity) return
            openMenus = (openMenus - 1).coerceAtLeast(0)
            liveModules.forEach { it.scheduleChangeCheck() }
          }

          override fun onActivityStarted(activity: Activity) = Unit

          override fun onActivityResumed(activity: Activity) = Unit

          override fun onActivityPaused(activity: Activity) = Unit

          override fun onActivityStopped(activity: Activity) = Unit

          override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
        }
      )
    }
  }
}
