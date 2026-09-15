package com.heracross

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ChangeTrackingTest {

  @Test
  fun `the first snapshot reports nothing`() {
    val tracker = FlagChangeTracker()
    assertEquals(emptyList<FlagChange>(), tracker.update(mapOf("a" to true, "b" to false)))
  }

  @Test
  fun `flags whose value changed are reported in key order`() {
    val tracker = FlagChangeTracker()
    tracker.update(mapOf("b" to false, "a" to true, "c" to true))
    assertEquals(
      listOf(FlagChange("a", false), FlagChange("b", true)),
      tracker.update(mapOf("b" to true, "a" to false, "c" to true)),
    )
  }

  @Test
  fun `a newly registered flag is recorded but not reported`() {
    val tracker = FlagChangeTracker()
    tracker.update(mapOf("a" to true))
    assertEquals(emptyList<FlagChange>(), tracker.update(mapOf("a" to true, "b" to true)))
    assertEquals(listOf(FlagChange("b", false)), tracker.update(mapOf("a" to true, "b" to false)))
  }

  @Test
  fun `an unchanged snapshot reports nothing`() {
    val tracker = FlagChangeTracker()
    tracker.update(mapOf("a" to true))
    tracker.update(mapOf("a" to false))
    assertEquals(emptyList<FlagChange>(), tracker.update(mapOf("a" to false)))
  }

  @Test
  fun `a change right after registering is reported`() {
    val tracker = FlagChangeTracker()
    tracker.recordIfUnseen("a", false)
    assertEquals(listOf(FlagChange("a", true)), tracker.update(mapOf("a" to true)))
  }

  @Test
  fun `recording does not overwrite a seen flag`() {
    val tracker = FlagChangeTracker()
    tracker.update(mapOf("a" to true))
    tracker.recordIfUnseen("a", false)
    assertEquals(emptyList<FlagChange>(), tracker.update(mapOf("a" to true)))
  }

  @Test
  fun `the first selection is not a change`() {
    val tracker = SelectionTracker()
    assertNull(tracker.update(null))
    assertNull(tracker.update("Development"))
    assertNull(tracker.update("Development"))
  }

  @Test
  fun `a different selection is reported`() {
    val tracker = SelectionTracker()
    tracker.update("Development")
    assertEquals("Staging", tracker.update("Staging"))
    assertNull(tracker.update("Staging"))
  }

  @Test
  fun `no selection keeps the last one`() {
    val tracker = SelectionTracker()
    tracker.update("Development")
    assertNull(tracker.update(null))
    assertNull(tracker.update("Development"))
    assertEquals("Production", tracker.update("Production"))
  }

  @Test
  fun `a select right after the first read is reported`() {
    val tracker = SelectionTracker()
    tracker.recordIfUnseen("Development")
    assertEquals("Staging", tracker.update("Staging"))
  }

  @Test
  fun `recording does not overwrite a seen selection`() {
    val tracker = SelectionTracker()
    tracker.update("Development")
    tracker.recordIfUnseen("Staging")
    assertNull(tracker.update("Development"))
  }
}
