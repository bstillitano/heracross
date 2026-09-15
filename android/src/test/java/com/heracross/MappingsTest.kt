package com.heracross

import com.scizor.ScizorGesture
import com.scizor.feature.featureflags.FlagOverride
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MappingsTest {

  @Test
  fun `gestures map to Scizor's, anything unknown to none`() {
    assertEquals(ScizorGesture.SHAKE, invocationGestureFor("shake"))
    assertEquals(ScizorGesture.FLOATING_BUTTON, invocationGestureFor("floatingButton"))
    assertEquals(ScizorGesture.NONE, invocationGestureFor("none"))
    assertEquals(ScizorGesture.NONE, invocationGestureFor("wave"))
  }

  @Test
  fun `start is allowed in debuggable builds or when production builds are allowed`() {
    assertTrue(isStartAllowed(debuggable = true, allowProductionBuilds = false))
    assertTrue(isStartAllowed(debuggable = false, allowProductionBuilds = true))
    assertFalse(isStartAllowed(debuggable = false, allowProductionBuilds = false))
  }

  @Test
  fun `the network hook is installed only when capturing and allowed to start`() {
    assertTrue(shouldInstallNetworkHook(captureNetwork = true, startAllowed = true))
    assertFalse(shouldInstallNetworkHook(captureNetwork = false, startAllowed = true))
    assertFalse(shouldInstallNetworkHook(captureNetwork = true, startAllowed = false))
  }

  @Test
  fun `overrides map to true, false or null`() {
    assertEquals(true, FlagOverride.ON.toOverrideValue())
    assertEquals(false, FlagOverride.OFF.toOverrideValue())
    assertNull(FlagOverride.REMOTE.toOverrideValue())
  }
}
