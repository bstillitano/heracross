package com.heracross

import android.app.Application
import android.content.pm.ApplicationInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.network.NetworkingModule
import com.scizor.Scizor
import com.scizor.ScizorGesture
import com.scizor.feature.custom.DeveloperOption
import com.scizor.feature.deeplink.DeepLinkPreset
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
  NativeHeracrossSpec(reactContext) {

  private val debuggable: Boolean
    get() = (reactApplicationContext.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

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
    onMain { Scizor.start(application, allowProductionBuilds) }
  }

  override fun showMenu() = onMain { Scizor.show() }

  override fun hideMenu() = onMain { Scizor.dismiss() }

  override fun setInvocationGesture(gesture: String) = onMain {
    Scizor.invocationGesture = when (gesture) {
      "shake" -> ScizorGesture.SHAKE
      "floatingButton" -> ScizorGesture.FLOATING_BUTTON
      else -> ScizorGesture.NONE
    }
  }

  // Feature flags

  override fun registerFeatureFlag(key: String, title: String, defaultValue: Boolean) = onMain {
    Scizor.featureFlags.register(FeatureFlag(key = key, title = title, defaultValue = defaultValue))
  }

  override fun isFeatureFlagEnabled(key: String, promise: Promise) = onMain {
    promise.resolve(Scizor.featureFlags.isEnabled(key))
  }

  override fun setFeatureFlagOverridesEnabled(enabled: Boolean) = onMain {
    Scizor.featureFlags.overridesEnabled = enabled
  }

  override fun setFeatureFlagOverride(key: String, value: Boolean) = onMain {
    Scizor.featureFlags.setOverride(key, if (value) FlagOverride.ON else FlagOverride.OFF)
  }

  override fun clearFeatureFlagOverride(key: String) = onMain {
    Scizor.featureFlags.setOverride(key, FlagOverride.REMOTE)
  }

  override fun resetFeatureFlagOverrides() = onMain { Scizor.featureFlags.resetAllToRemote() }

  // Servers

  override fun configureServers(servers: ReadableArray) {
    val environments = servers.maps().mapNotNull { server ->
      val id = server.stringOrNull("id")?.takeIf { it.isNotEmpty() } ?: return@mapNotNull null
      ServerEnvironment(
        name = id,
        baseUrl = server.stringOrNull("baseUrl").orEmpty(),
        variables = server.mapOrNull("variables").toStringMap(),
      )
    }
    onMain { Scizor.servers.configure(environments) }
  }

  /** Scizor can only select a configured environment, so unknown ids are ignored. */
  override fun selectServer(id: String) = onMain {
    Scizor.servers.all().firstOrNull { it.name == id }?.let(Scizor.servers::select)
  }

  /** Scizor falls back to the first configured environment when none is saved. */
  override fun getSelectedServer(promise: Promise) = onMain {
    val selected = Scizor.servers.selected
    promise.resolve(
      selected?.let {
        Arguments.createMap().apply {
          putString("id", it.name)
          putString("baseUrl", it.baseUrl)
          putMap("variables", Arguments.makeNativeMap(it.variables))
        }
      }
    )
  }

  // Menu content

  override fun setEnvironmentVariables(variables: ReadableMap) {
    val map = variables.toStringMap()
    onMain { Scizor.environmentVariables = map }
  }

  override fun setDeveloperOptions(options: ReadableArray) {
    val rows = options.maps().mapNotNull { option ->
      val name = option.stringOrNull("name") ?: return@mapNotNull null
      DeveloperOption.Value(title = name, value = option.stringOrNull("value").orEmpty())
    }
    onMain { Scizor.developerOptions = rows }
  }

  override fun setDeepLinkPresets(presets: ReadableArray) {
    val links = presets.maps().mapNotNull { preset ->
      val name = preset.stringOrNull("name") ?: return@mapNotNull null
      val url = preset.stringOrNull("url") ?: return@mapNotNull null
      DeepLinkPreset(name = name, url = url)
    }
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

  private fun ReadableArray.maps(): List<ReadableMap> =
    (0 until size()).mapNotNull { index ->
      if (getType(index) == ReadableType.Map) getMap(index) else null
    }

  /** Reads a string without throwing when JavaScript sent another type. */
  private fun ReadableMap.stringOrNull(key: String): String? =
    if (hasKey(key) && getType(key) == ReadableType.String) getString(key) else null

  private fun ReadableMap.mapOrNull(key: String): ReadableMap? =
    if (hasKey(key) && getType(key) == ReadableType.Map) getMap(key) else null

  private fun ReadableMap?.toStringMap(): Map<String, String> =
    this?.toHashMap()?.mapValues { (_, value) -> value?.toString().orEmpty() }.orEmpty()

  companion object {
    const val NAME = NativeHeracrossSpec.NAME

    /**
     * Whether Heracross registered its builder with [NetworkingModule]. The
     * slot is static, so this outlives module instances across JS reloads.
     */
    @Volatile private var networkHookInstalled = false
  }
}
