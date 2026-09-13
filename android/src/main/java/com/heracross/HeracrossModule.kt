package com.heracross

import android.app.Application
import android.content.pm.ApplicationInfo
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
import com.scizor.ScizorGesture
import com.scizor.feature.featureflags.FeatureFlag
import com.scizor.feature.featureflags.FlagOverride
import com.scizor.feature.servers.ServerEnvironment

/**
 * The Heracross Turbo Module on Android: a thin forwarder to [Scizor].
 *
 * Calls arrive on the native modules thread. Every Scizor call is posted to the
 * main thread, where Scizor's lifecycle and Compose state live, which also keeps
 * them in the order JavaScript made them.
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

  init {
    reactContext.addLifecycleEventListener(this)
    activeModule = this
    installOverrideHook()
    scheduleChangeCheck()
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    if (activeModule === this) activeModule = null
    mainHandler.removeCallbacksAndMessages(null)
    super.invalidate()
  }

  override fun start(allowProductionBuilds: Boolean, captureNetwork: Boolean) {
    // Mirror Scizor's own production gate, so a refused start leaves React
    // Native's networking untouched.
    val allowed = debuggable || allowProductionBuilds
    synchronized(Companion) {
      if (captureNetwork && allowed) {
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
      // Scizor refuses exactly when `allowed` is false, and ignores later calls.
      if (allowed) started = true
      // Starting loads Scizor's store, so saved overrides and the saved
      // server now apply.
      scheduleChangeCheck()
    }
  }

  /** Posted behind any pending `start`, so it reflects that call. */
  override fun isStarted(promise: Promise) = onMain { promise.resolve(started) }

  override fun showMenu() = onMain { Scizor.show() }

  override fun hideMenu() = onMain { Scizor.dismiss() }

  override fun setInvocationGesture(gesture: String) = onMain {
    Scizor.invocationGesture = when (gesture) {
      "shake" -> ScizorGesture.SHAKE
      "floatingButton" -> ScizorGesture.FLOATING_BUTTON
      else -> ScizorGesture.NONE
    }
  }

  override fun setDisabledFeatures(features: ReadableArray) {
    val ids = features.strings().toSet()
    onMain { Scizor.disabledFeatures = ids }
  }

  // Feature flags

  override fun registerFeatureFlag(key: String, title: String, defaultValue: Boolean) = onMain {
    Scizor.featureFlags.register(FeatureFlag(key = key, title = title, defaultValue = defaultValue))
    scheduleChangeCheck()
  }

  override fun isFeatureFlagEnabled(key: String, promise: Promise) = onMain {
    promise.resolve(Scizor.featureFlags.isEnabled(key))
  }

  override fun setFeatureFlagOverridesEnabled(enabled: Boolean) = onMain {
    Scizor.featureFlags.overridesEnabled = enabled
    scheduleChangeCheck()
  }

  override fun setFeatureFlagOverride(key: String, value: Boolean) = onMain {
    Scizor.featureFlags.setOverride(key, if (value) FlagOverride.ON else FlagOverride.OFF)
    scheduleChangeCheck()
  }

  override fun clearFeatureFlagOverride(key: String) = onMain {
    Scizor.featureFlags.setOverride(key, FlagOverride.REMOTE)
    scheduleChangeCheck()
  }

  override fun resetFeatureFlagOverrides() = onMain {
    Scizor.featureFlags.resetAllToRemote()
    scheduleChangeCheck()
  }

  // Servers

  override fun configureServers(servers: ReadableArray) {
    val environments = servers.toServerEnvironments()
    onMain {
      Scizor.servers.configure(environments)
      scheduleChangeCheck()
    }
  }

  /** Scizor can only select a configured environment, so unknown ids are ignored. */
  override fun selectServer(id: String) = onMain {
    Scizor.servers.all().firstOrNull { it.name == id }?.let(Scizor.servers::select)
    scheduleChangeCheck()
  }

  /** Scizor falls back to the first configured environment when none is saved. */
  override fun getSelectedServer(promise: Promise) = onMain {
    promise.resolve(Scizor.servers.selected?.toWritableMap())
  }

  // Change events

  /**
   * Scizor's menu runs in its own Activity, and it reports no server changes,
   * so returning to the app is when a server picked in the menu is noticed.
   */
  override fun onHostResume() = scheduleChangeCheck()

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  /** Posts one check behind the work already queued, so a burst of changes is read once. */
  private fun scheduleChangeCheck() {
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
    val flags = Scizor.featureFlags.all().associate { it.key to Scizor.featureFlags.isEnabled(it.key) }
    val flagChanges = flagTracker.update(flags)
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

    /** Whether Scizor has started, which, like Scizor, outlives reloads. */
    @Volatile private var started = false

    /** The module that receives Scizor's override callback. */
    @Volatile private var activeModule: HeracrossModule? = null

    private var overrideHookInstalled = false

    /**
     * Scizor reports override changes, including those made in the menu,
     * through a single callback. Heracross installs it once per process and
     * still calls whatever callback was there before.
     */
    private fun installOverrideHook() = synchronized(Companion) {
      if (overrideHookInstalled) return
      overrideHookInstalled = true
      val previous = Scizor.featureFlags.onOverrideChanged
      Scizor.featureFlags.onOverrideChanged = { key ->
        previous?.invoke(key)
        activeModule?.scheduleChangeCheck()
      }
    }
  }
}
