package com.heracross

import com.facebook.react.bridge.ReactApplicationContext

class HeracrossModule(reactContext: ReactApplicationContext) :
  NativeHeracrossSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeHeracrossSpec.NAME
  }
}
