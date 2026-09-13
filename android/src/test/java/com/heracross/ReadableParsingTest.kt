package com.heracross

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.scizor.feature.custom.DeveloperOption
import com.scizor.feature.deeplink.DeepLinkPreset
import com.scizor.feature.servers.ServerEnvironment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ReadableParsingTest {

  @Test
  fun `servers need a non-empty string id and keep only string variables`() {
    val servers = JavaOnlyArray.of(
      JavaOnlyMap.of(
        "id", "Dev",
        "baseUrl", "https://dev",
        "variables", JavaOnlyMap.of("REGION", "au", "RETRIES", 3.0, "NESTED", JavaOnlyMap()),
      ),
      JavaOnlyMap.of("id", "Prod"),
      JavaOnlyMap.of("id", ""),
      JavaOnlyMap.of("id", 7.0),
      "not a map",
    )
    assertEquals(
      listOf(
        ServerEnvironment(name = "Dev", baseUrl = "https://dev", variables = mapOf("REGION" to "au")),
        ServerEnvironment(name = "Prod", baseUrl = "", variables = emptyMap()),
      ),
      servers.toServerEnvironments(),
    )
  }

  @Test
  fun `developer options need a name and default the value`() {
    val options = JavaOnlyArray.of(
      JavaOnlyMap.of("name", "Build", "value", "42"),
      JavaOnlyMap.of("name", "Empty"),
      JavaOnlyMap.of("value", "orphan"),
    )
    assertEquals(
      listOf(DeveloperOption.Value(title = "Build", value = "42"), DeveloperOption.Value(title = "Empty", value = "")),
      options.toDeveloperOptions(),
    )
  }

  @Test
  fun `deep link presets need a name and a url`() {
    val presets = JavaOnlyArray.of(
      JavaOnlyMap.of("name", "Home", "url", "myapp://home"),
      JavaOnlyMap.of("name", "No URL"),
      JavaOnlyMap.of("url", "myapp://nameless"),
    )
    assertEquals(listOf(DeepLinkPreset(name = "Home", url = "myapp://home")), presets.toDeepLinkPresets())
  }

  @Test
  fun `cookies read every field and treat missing flags as false`() {
    val full = JavaOnlyMap.of(
      "name", "session",
      "value", "abc",
      "domain", "example.com",
      "path", "/",
      "secure", true,
      "httpOnly", true,
      "sameSite", "Lax",
      "expires", "Wed, 21 Oct 2026 07:28:00 GMT",
    )
    assertEquals(
      LoggedCookie("session", "abc", "example.com", "/", true, true, "Lax", "Wed, 21 Oct 2026 07:28:00 GMT"),
      full.toLoggedCookie(),
    )
    val minimal = JavaOnlyMap.of("name", "a", "value", "b", "domain", "c", "path", null, "secure", "yes")
    assertEquals(LoggedCookie("a", "b", "c", null, false, false, null, null), minimal.toLoggedCookie())
  }

  @Test
  fun `cookies need a name, value and domain`() {
    assertNull(JavaOnlyMap.of("value", "b", "domain", "c").toLoggedCookie())
    assertNull(JavaOnlyMap.of("name", "a", "domain", "c").toLoggedCookie())
    assertNull(JavaOnlyMap.of("name", "a", "value", "b").toLoggedCookie())
  }

  @Test
  fun `only string entries of an array are kept`() {
    assertEquals(listOf("network", "console"), JavaOnlyArray.of("network", 1.0, null, "console").strings())
  }
}
