package com.heracross

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.scizor.feature.custom.DeveloperOption
import com.scizor.feature.deeplink.DeepLinkPreset
import com.scizor.feature.servers.ServerEnvironment

// Conversions from what JavaScript sends to Scizor's types. They read values
// by type, so an unexpected type is skipped rather than thrown on.

/** A cookie to record in Scizor's Cookie Browser. */
internal data class LoggedCookie(
  val name: String,
  val value: String,
  val domain: String,
  val path: String?,
  val secure: Boolean,
  val httpOnly: Boolean,
  val sameSite: String?,
  val expires: String?,
)

/** Environments without a non-empty `id` are skipped. */
internal fun ReadableArray.toServerEnvironments(): List<ServerEnvironment> =
  maps().mapNotNull { server ->
    val id = server.stringOrNull("id")?.takeIf { it.isNotEmpty() } ?: return@mapNotNull null
    ServerEnvironment(
      name = id,
      baseUrl = server.stringOrNull("baseUrl").orEmpty(),
      variables = server.mapOrNull("variables").toStringMap(),
    )
  }

/** Rows without a `name` are skipped. */
internal fun ReadableArray.toDeveloperOptions(): List<DeveloperOption> =
  maps().mapNotNull { option ->
    val name = option.stringOrNull("name") ?: return@mapNotNull null
    DeveloperOption.Value(title = name, value = option.stringOrNull("value").orEmpty())
  }

/** Presets without a `name` or `url` are skipped. */
internal fun ReadableArray.toDeepLinkPresets(): List<DeepLinkPreset> =
  maps().mapNotNull { preset ->
    val name = preset.stringOrNull("name") ?: return@mapNotNull null
    val url = preset.stringOrNull("url") ?: return@mapNotNull null
    DeepLinkPreset(name = name, url = url)
  }

/** `null` without a `name`, `value` and `domain`. */
internal fun ReadableMap.toLoggedCookie(): LoggedCookie? {
  val name = stringOrNull("name") ?: return null
  val value = stringOrNull("value") ?: return null
  val domain = stringOrNull("domain") ?: return null
  return LoggedCookie(
    name = name,
    value = value,
    domain = domain,
    path = stringOrNull("path"),
    secure = booleanOrFalse("secure"),
    httpOnly = booleanOrFalse("httpOnly"),
    sameSite = stringOrNull("sameSite"),
    expires = stringOrNull("expires"),
  )
}

internal fun ReadableArray.strings(): List<String> =
  (0 until size()).mapNotNull { index ->
    if (getType(index) == ReadableType.String) getString(index) else null
  }

internal fun ReadableArray.maps(): List<ReadableMap> =
  (0 until size()).mapNotNull { index ->
    if (getType(index) == ReadableType.Map) getMap(index) else null
  }

internal fun ReadableMap.stringOrNull(key: String): String? =
  if (hasKey(key) && getType(key) == ReadableType.String) getString(key) else null

internal fun ReadableMap.booleanOrFalse(key: String): Boolean =
  hasKey(key) && getType(key) == ReadableType.Boolean && getBoolean(key)

internal fun ReadableMap.mapOrNull(key: String): ReadableMap? =
  if (hasKey(key) && getType(key) == ReadableType.Map) getMap(key) else null

/** Values that aren't strings, such as nested maps, are skipped. */
internal fun ReadableMap?.toStringMap(): Map<String, String> {
  val map = this ?: return emptyMap()
  return map.toHashMap().keys.mapNotNull { key -> map.stringOrNull(key)?.let { key to it } }.toMap()
}
