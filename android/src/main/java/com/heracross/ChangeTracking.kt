package com.heracross

/** A registered flag whose effective value changed. */
internal data class FlagChange(val key: String, val enabled: Boolean)

/**
 * Works out which flags changed between successive snapshots of every
 * registered flag's effective value.
 */
internal class FlagChangeTracker {
  private var last: MutableMap<String, Boolean> = mutableMapOf()

  /**
   * Records [current] and returns the flags in both it and the previous
   * snapshot whose value differs, sorted by key. A flag that first appears in
   * [current] is recorded without being reported.
   */
  fun update(current: Map<String, Boolean>): List<FlagChange> {
    val changes = current
      .filter { (key, value) -> last[key]?.let { it != value } ?: false }
      .toSortedMap()
      .map { (key, value) -> FlagChange(key, value) }
    last = current.toMutableMap()
    return changes
  }

  /**
   * Records a flag's value when it hasn't been seen, so the next snapshot
   * compares with it. A change made straight after registering a flag is then
   * reported instead of becoming the flag's first value.
   */
  fun recordIfUnseen(key: String, enabled: Boolean) {
    if (key !in last) last[key] = enabled
  }
}

/** Works out when the selected server changes between successive snapshots. */
internal class SelectionTracker {
  private var last: String? = null

  /**
   * Records [current] and returns it when it differs from the last non-null
   * selection. A first selection, or none at all, isn't a change.
   */
  fun update(current: String?): String? {
    if (current == null) return null
    val previous = last
    last = current
    return current.takeIf { previous != null && previous != it }
  }

  /**
   * Records [current] when nothing has been recorded yet, so a change made
   * straight after it is reported instead of becoming the first value.
   */
  fun recordIfUnseen(current: String?) {
    if (last == null) last = current
  }
}
