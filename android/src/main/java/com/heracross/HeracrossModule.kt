package com.heracross

import android.app.Application
import android.content.pm.ApplicationInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.network.OkHttpClientProvider
import com.scizor.Scizor
import com.scizor.ScizorGesture
import com.scizor.feature.custom.DeveloperOption
import com.scizor.feature.featureflags.FeatureFlag
import com.scizor.feature.servers.ServerEnvironment

/**
 * The Heracross Turbo Module on Android: a thin forwarder to [Scizor].
 *
 * Calls arrive on the native modules thread. Every one is posted to the main
 * thread, where Scizor's lifecycle and Compose state live, which also keeps
 * them in the order JavaScript made them.
 */
class HeracrossModule(reactContext: ReactApplicationContext) :
  NativeHeracrossSpec(reactContext) {

  override fun start(allowProductionBuilds: Boolean, captureNetwork: Boolean) {
    val application = reactApplicationContext.applicationContext as Application
    val debuggable =
      (application.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    // Mirror Scizor's own production gate so a refused start leaves React
    // Native's networking untouched.
    if (captureNetwork && (debuggable || allowProductionBuilds)) {
      OkHttpClientProvider.setOkHttpClientFactory {
        OkHttpClientProvider.createClientBuilder(application)
          .addInterceptor(Scizor.network.interceptor())
          .build()
      }
    }
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

  override fun registerFeatureFlag(key: String, title: String, defaultValue: Boolean) = onMain {
    Scizor.featureFlags.register(FeatureFlag(key = key, title = title, defaultValue = defaultValue))
  }

  override fun isFeatureFlagEnabled(key: String, promise: Promise) = onMain {
    promise.resolve(Scizor.featureFlags.isEnabled(key))
  }

  override fun configureServers(servers: ReadableArray) {
    val environments = (0 until servers.size()).mapNotNull { index ->
      val server = servers.getMap(index) ?: return@mapNotNull null
      val id = server.getString("id") ?: return@mapNotNull null
      ServerEnvironment(
        name = id,
        baseUrl = server.getString("baseUrl").orEmpty(),
        variables = server.getMap("variables").toStringMap(),
      )
    }
    onMain { Scizor.servers.configure(environments) }
  }

  override fun selectServer(id: String) = onMain {
    Scizor.servers.all().firstOrNull { it.name == id }?.let(Scizor.servers::select)
  }

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

  override fun setEnvironmentVariables(variables: ReadableMap) {
    val map = variables.toStringMap()
    onMain { Scizor.environmentVariables = map }
  }

  override fun setDeveloperOptions(options: ReadableArray) {
    val rows = (0 until options.size()).mapNotNull { index ->
      val option = options.getMap(index) ?: return@mapNotNull null
      val name = option.getString("name") ?: return@mapNotNull null
      DeveloperOption.Value(title = name, value = option.getString("value").orEmpty())
    }
    onMain { Scizor.developerOptions = rows }
  }

  /** APNs is iOS only; Android has nothing to show. */
  override fun setApnsToken(token: String?) = Unit

  override fun setFcmToken(token: String?) = onMain { Scizor.fcmToken = token }

  /** Scizor has no crash trigger; an uncaught exception on the main thread is what it records. */
  override fun triggerTestCrash() = onMain {
    throw RuntimeException("Heracross test crash")
  }

  /** Scizor keeps its location spoofer internal, so there is nothing to report. */
  override fun getLocationSpoofingState(promise: Promise) {
    promise.resolve(null)
  }

  private fun onMain(work: () -> Unit) {
    UiThreadUtil.runOnUiThread(work)
  }

  private fun ReadableMap?.toStringMap(): Map<String, String> =
    this?.toHashMap()?.mapValues { (_, value) -> value?.toString().orEmpty() }.orEmpty()

  companion object {
    const val NAME = NativeHeracrossSpec.NAME
  }
}
