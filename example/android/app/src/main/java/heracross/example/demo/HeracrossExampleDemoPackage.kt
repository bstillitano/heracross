package heracross.example.demo

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Registers the example app's own [HeracrossExampleDemoModule]. */
class HeracrossExampleDemoPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == HeracrossExampleDemoModule.NAME) HeracrossExampleDemoModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      HeracrossExampleDemoModule.NAME to ReactModuleInfo(
        name = HeracrossExampleDemoModule.NAME,
        className = HeracrossExampleDemoModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      )
    )
  }
}
