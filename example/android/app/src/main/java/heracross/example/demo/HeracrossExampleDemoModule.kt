package heracross.example.demo

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteDatabase
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import kotlin.random.Random

/**
 * The example app's demo data on Android, ported from ScytherExample
 * (`ScytherExampleApp.swift`, `ContentView.swift`, `LocationTestView.swift`):
 * UserDefaults-style preferences and a SQLite database with the same records,
 * for Scizor's browsers, and `LocationManager` for the Location tab. Where
 * ScytherExample has nothing to port, it follows Scizor's sample app
 * (`SampleApp.kt`), whose `user_prefs` and `app_settings` SharedPreferences it
 * seeds at launch. The example's cookies, FCM token, deep link presets and
 * developer options are set from JavaScript, in `src/setup.ts`.
 */
class HeracrossExampleDemoModule(reactContext: ReactApplicationContext) :
  NativeHeracrossExampleDemoSpec(reactContext) {

  private val context: Context get() = reactApplicationContext

  private val locationManager: LocationManager?
    get() = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

  private val mainHandler = Handler(Looper.getMainLooper())

  private val continuousListener = LocationListener { emitOnLocationUpdate(it.toMap()) }

  /** Listeners waiting for one fix; all of them are removed on the first fix or the timeout. */
  private val pendingFix = mutableListOf<LocationListener>()

  private val fixTimeout = Runnable {
    if (cancelPendingFix()) emitOnLocationError("Timed out waiting for a location fix")
  }

  // Launch data

  override fun seedDemoData() {
    runCatching { seedPreferences() }
    runCatching { seedDatabase() }
  }

  /** The SharedPreferences values Scizor's sample writes in `SampleApp.seedDemoPreferences`. */
  private fun seedPreferences() {
    context.getSharedPreferences("user_prefs", Context.MODE_PRIVATE).edit()
      .putString("username", "brandon")
      .putString("email", "brandon@example.com")
      .putBoolean("onboarding_complete", true)
      .putBoolean("push_enabled", false)
      .putInt("launch_count", 7)
      .putLong("last_sync_ms", 1_721_000_000_000L)
      .putFloat("cart_total", 42.5f)
      .apply()

    context.getSharedPreferences("app_settings", Context.MODE_PRIVATE).edit()
      .putString("theme", "system")
      .putBoolean("analytics_opt_in", true)
      .apply()
  }

  // Preferences Demo, the equivalent of ContentView's UserDefaults.standard writes

  private val defaults
    get() = context.getSharedPreferences("${context.packageName}_preferences", Context.MODE_PRIVATE)

  override fun writeSampleDefaults() {
    defaults.edit()
      .putString("example_username", "John Doe")
      .putInt("example_age", 42)
      .putBoolean("example_premium_user", true)
      .putFloat("example_pi_value", 3.14159f)
      .putStringSet("example_tags", setOf("Swift", "iOS", "Scyther"))
      .putString(
        "example_user_profile",
        """{"name":"Test User","email":"test@example.com","settings":{"darkMode":true,"notifications":false}}""",
      )
      .putLong("example_last_login", System.currentTimeMillis())
      .apply()
  }

  override fun clearSampleDefaults() {
    defaults.edit().apply { SAMPLE_KEYS.forEach(::remove) }.apply()
  }

  // Database Demo

  override fun getRecordCounts(promise: Promise) = withDatabase(promise) { }

  override fun addDemoRecords(promise: Promise) = withDatabase(promise) { db ->
    val now = System.currentTimeMillis()
    val userId = db.insert(
      "INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)",
      "User ${Random.nextInt(1000, 10000)}",
      "user${Random.nextInt(1000, 10000)}@example.com",
      Random.nextInt(18, 66).toLong(),
      now,
    )
    if (userId != -1L) {
      db.insert(
        "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
        "Post ${Random.nextInt(1000, 10000)}",
        "This is a randomly generated post for testing purposes.",
        now,
        userId,
      )
    }
    val categories = listOf("Electronics", "Audio", "Accessories", "Wearables", "Software")
    db.insert(
      "INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)",
      "Product ${Random.nextInt(1000, 10000)}",
      Random.nextInt(10, 1001).toDouble(),
      if (Random.nextBoolean()) 1L else 0L,
      categories.random(),
    )
  }

  override fun clearDemoRecords(promise: Promise) = withDatabase(promise) { db ->
    db.execSQL("DELETE FROM posts")
    db.execSQL("DELETE FROM users")
    db.execSQL("DELETE FROM products")
  }

  private fun seedDatabase() {
    openDatabase().use { db ->
      if (DatabaseUtils.queryNumEntries(db, "users") > 0L) return
      val now = System.currentTimeMillis()
      val userIds = listOf(
        Triple("Alice Johnson", "alice@example.com", 28L),
        Triple("Bob Smith", "bob@example.com", 34L),
        Triple("Charlie Brown", "charlie@example.com", 22L),
        Triple("Diana Ross", "diana@example.com", 45L),
        Triple("Eve Williams", "eve@example.com", 31L),
      ).map { (name, email, age) ->
        db.insert("INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)", name, email, age, now)
      }
      listOf(
        Triple(
          "Getting Started with SwiftData",
          "SwiftData is Apple's new framework for data persistence in Swift apps. It provides a modern, " +
            "declarative approach to managing your app's data model.",
          0,
        ),
        Triple(
          "iOS Development Tips",
          "Here are some tips for iOS development that will help you build better apps faster.",
          0,
        ),
        Triple(
          "Building Debug Tools",
          "Learn how to build debugging tools for your iOS apps. This guide covers logging, network inspection, and more.",
          1,
        ),
        Triple(
          "SwiftUI Best Practices",
          "Explore best practices for building SwiftUI applications that are maintainable and performant.",
          2,
        ),
        Triple(
          "Understanding Core Data Migration",
          "A deep dive into Core Data migration strategies and how to handle schema changes.",
          3,
        ),
        Triple("Unit Testing in Swift", "Learn effective unit testing strategies for Swift applications.", 4),
      ).forEach { (title, content, userIndex) ->
        val userId = userIds[userIndex]
        if (userId != -1L) {
          db.insert(
            "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
            title, content, now, userId,
          )
        }
      }
      listOf(
        listOf("iPhone 16 Pro", 999.0, 1L, "Electronics"),
        listOf("MacBook Air M3", 1299.0, 1L, "Electronics"),
        listOf("AirPods Pro 2", 249.0, 0L, "Audio"),
        listOf("Magic Keyboard", 299.0, 1L, "Accessories"),
        listOf("Apple Watch Ultra", 799.0, 1L, "Wearables"),
        listOf("iPad Pro 13\"", 1299.0, 1L, "Tablets"),
        listOf("Studio Display", 1599.0, 0L, "Displays"),
        listOf("HomePod mini", 99.0, 1L, "Audio"),
      ).forEach { row ->
        db.insert("INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)", *row.toTypedArray())
      }
    }
  }

  private fun openDatabase(): SQLiteDatabase =
    context.openOrCreateDatabase(DATABASE, Context.MODE_PRIVATE, null).also { db ->
      db.execSQL(
        "CREATE TABLE IF NOT EXISTS users " +
          "(id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER, createdAt INTEGER)",
      )
      db.execSQL(
        "CREATE TABLE IF NOT EXISTS posts " +
          "(id INTEGER PRIMARY KEY, title TEXT, content TEXT, publishedAt INTEGER, userId INTEGER)",
      )
      db.execSQL(
        "CREATE TABLE IF NOT EXISTS products " +
          "(id INTEGER PRIMARY KEY, name TEXT, price REAL, inStock INTEGER, category TEXT)",
      )
    }

  /** Runs one parameterised insert and returns the new row id, or -1 if it failed. */
  private fun SQLiteDatabase.insert(sql: String, vararg values: Any): Long =
    compileStatement(sql).use { statement ->
      values.forEachIndexed { index, value ->
        val position = index + 1
        when (value) {
          is String -> statement.bindString(position, value)
          is Double -> statement.bindDouble(position, value)
          is Long -> statement.bindLong(position, value)
          else -> statement.bindString(position, value.toString())
        }
      }
      runCatching { statement.executeInsert() }.getOrDefault(-1L)
    }

  /** Runs [block] against the demo database, then resolves the record counts. */
  private fun withDatabase(promise: Promise, block: (SQLiteDatabase) -> Unit) {
    runCatching {
      openDatabase().use { db ->
        block(db)
        Arguments.createMap().apply {
          putInt("users", DatabaseUtils.queryNumEntries(db, "users").toInt())
          putInt("posts", DatabaseUtils.queryNumEntries(db, "posts").toInt())
          putInt("products", DatabaseUtils.queryNumEntries(db, "products").toInt())
        }
      }
    }.onSuccess(promise::resolve).onFailure { promise.reject("database", it) }
  }

  // Location

  private fun granted(permission: String) =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

  private fun hasLocationPermission() =
    granted(Manifest.permission.ACCESS_FINE_LOCATION) || granted(Manifest.permission.ACCESS_COARSE_LOCATION)

  override fun getLocationAuthorization(promise: Promise) {
    promise.resolve(locationAuthorization())
  }

  /** The example's own bookkeeping, kept apart from the preferences it seeds for Scizor's browser. */
  private val demoState
    get() = context.getSharedPreferences(STATE_PREFERENCES, Context.MODE_PRIVATE)

  /**
   * Whether the system would show a rationale for location, which it does once
   * the user has refused a request but can still be asked. `null` without a
   * current activity, where there's no way to tell.
   */
  private fun locationRationale(): Boolean? {
    val activity = reactApplicationContext.currentActivity ?: return null
    return LOCATION_PERMISSIONS.any(activity::shouldShowRequestPermissionRationale)
  }

  /**
   * Android has no "not determined" status, so it is inferred. `notDetermined`
   * means a request would show the system dialog: the user has never refused
   * one, or has refused but can still be asked (the system wants a rationale).
   * `denied` means the user has refused before and no rationale is wanted, so
   * they chose not to be asked again and a request returns without a dialog.
   *
   * "Has refused before" is recorded in [demoState], and only when a refusal
   * leaves a rationale to show. Dismissing the dialog leaves none, so it isn't
   * recorded and can't read as `denied`. On first launch nothing is recorded,
   * so the status is `notDetermined`; after a first refusal a request can
   * still show the dialog, so it stays `notDetermined` until the user refuses
   * for good.
   */
  private fun locationAuthorization(): String {
    if (hasLocationPermission()) return "authorized"
    val refusedBefore = demoState.getBoolean(KEY_LOCATION_REFUSED, false)
    val canAskAgain = locationRationale() ?: true
    return if (!refusedBefore || canAskAgain) "notDetermined" else "denied"
  }

  /**
   * Requests precise and approximate location together: from Android 12 the
   * system ignores a request for precise location on its own. Either grant
   * counts as authorized.
   */
  override fun requestLocationPermission() {
    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity ?: return
    val listener = PermissionListener { _, _, grantResults ->
      val granted = grantResults.any { it == PackageManager.PERMISSION_GRANTED }
      if (!granted && locationRationale() == true) {
        demoState.edit().putBoolean(KEY_LOCATION_REFUSED, true).apply()
      }
      emitOnLocationAuthorizationChange(locationAuthorization())
      if (granted) requestLocation()
      true
    }
    UiThreadUtil.runOnUiThread {
      activity.requestPermissions(LOCATION_PERMISSIONS, PERMISSION_REQUEST, listener)
    }
  }

  /** The equivalent of `CLLocationManager.requestLocation()`: one fix, then stop. */
  override fun requestLocation() = withLocationManager { manager, providers ->
    cancelPendingFix()
    bestLastKnown(manager, providers)?.let { emitOnLocationUpdate(it.toMap()) }
    providers.forEach { provider ->
      val listener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
          if (cancelPendingFix()) emitOnLocationUpdate(location.toMap())
        }
      }
      synchronized(pendingFix) { pendingFix += listener }
      manager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
    }
    mainHandler.postDelayed(fixTimeout, FIX_TIMEOUT_MS)
  }

  override fun startLocationUpdates() = withLocationManager { manager, providers ->
    providers.forEach { provider ->
      manager.requestLocationUpdates(provider, 1000L, 0f, continuousListener, Looper.getMainLooper())
    }
  }

  override fun stopLocationUpdates() {
    locationManager?.removeUpdates(continuousListener)
    cancelPendingFix()
  }

  /** Stops every location listener when React Native tears the module down, such as on a reload. */
  override fun invalidate() {
    stopLocationUpdates()
    super.invalidate()
  }

  /** Removes the listeners waiting for one fix. Returns whether any were waiting. */
  private fun cancelPendingFix(): Boolean {
    mainHandler.removeCallbacks(fixTimeout)
    val listeners = synchronized(pendingFix) { pendingFix.toList().also { pendingFix.clear() } }
    listeners.forEach { listener -> locationManager?.removeUpdates(listener) }
    return listeners.isNotEmpty()
  }

  /**
   * Runs [block] on the main thread with the providers the app may use: GPS
   * needs precise location, the network provider either permission.
   */
  private fun withLocationManager(block: (LocationManager, List<String>) -> Unit) {
    val manager = locationManager ?: return emitOnLocationError("Location services are unavailable")
    UiThreadUtil.runOnUiThread {
      val providers = buildList {
        if (granted(Manifest.permission.ACCESS_FINE_LOCATION)) add(LocationManager.GPS_PROVIDER)
        if (hasLocationPermission()) add(LocationManager.NETWORK_PROVIDER)
      }.filter(manager::isProviderEnabled)
      if (providers.isEmpty()) {
        emitOnLocationError(
          if (hasLocationPermission()) "Location services are turned off" else "Location permission not granted",
        )
        return@runOnUiThread
      }
      runCatching { block(manager, providers) }.onFailure { emitOnLocationError(it.message ?: it.toString()) }
    }
  }

  private fun bestLastKnown(manager: LocationManager, providers: List<String>): Location? =
    providers.mapNotNull(manager::getLastKnownLocation).maxByOrNull { it.time }

  private fun Location.toMap(): WritableMap = Arguments.createMap().apply {
    putDouble("latitude", latitude)
    putDouble("longitude", longitude)
    putDouble("accuracy", accuracy.toDouble())
    putDouble("altitude", altitude)
    putDouble("timestamp", time.toDouble())
  }

  // Layout

  /** The system bar and display cutout insets, in density-independent pixels. */
  override fun getSafeAreaInsets(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    UiThreadUtil.runOnUiThread {
      val insets = activity?.window?.decorView
        ?.let(ViewCompat::getRootWindowInsets)
        ?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      val density = context.resources.displayMetrics.density.toDouble()
      promise.resolve(
        Arguments.createMap().apply {
          putDouble("top", (insets?.top ?: 0) / density)
          putDouble("bottom", (insets?.bottom ?: 0) / density)
          putDouble("left", (insets?.left ?: 0) / density)
          putDouble("right", (insets?.right ?: 0) / density)
        }
      )
    }
  }

  companion object {
    const val NAME = NativeHeracrossExampleDemoSpec.NAME
    private const val DATABASE = "demo.db"
    private const val PERMISSION_REQUEST = 4201
    private const val STATE_PREFERENCES = "heracross_example_demo"
    private const val KEY_LOCATION_REFUSED = "location_permission_refused"
    private val LOCATION_PERMISSIONS =
      arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
    private const val FIX_TIMEOUT_MS = 30_000L
    private val SAMPLE_KEYS = listOf(
      "example_username",
      "example_age",
      "example_premium_user",
      "example_pi_value",
      "example_tags",
      "example_user_profile",
      "example_last_login",
    )
  }
}
