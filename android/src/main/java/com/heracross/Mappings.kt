package com.heracross

import com.scizor.ScizorGesture
import com.scizor.feature.featureflags.FlagOverride

// Decisions the module makes, kept apart from Android and React Native types
// so they can be unit tested.

/** `"shake"` and `"floatingButton"` map to Scizor's gestures; anything else to none. */
internal fun invocationGestureFor(gesture: String): ScizorGesture =
  when (gesture) {
    "shake" -> ScizorGesture.SHAKE
    "floatingButton" -> ScizorGesture.FLOATING_BUTTON
    else -> ScizorGesture.NONE
  }

/** Scizor's production gate: it starts only in a debuggable build, unless production builds are allowed. */
internal fun isStartAllowed(debuggable: Boolean, allowProductionBuilds: Boolean): Boolean =
  debuggable || allowProductionBuilds

/** Heracross adds Scizor's interceptor to React Native's networking only when Scizor may start. */
internal fun shouldInstallNetworkHook(captureNetwork: Boolean, startAllowed: Boolean): Boolean =
  captureNetwork && startAllowed

/** A stored override as JavaScript sees it: `true`, `false`, or `null` for none. */
internal fun FlagOverride.toOverrideValue(): Boolean? =
  when (this) {
    FlagOverride.ON -> true
    FlagOverride.OFF -> false
    FlagOverride.REMOTE -> null
  }
