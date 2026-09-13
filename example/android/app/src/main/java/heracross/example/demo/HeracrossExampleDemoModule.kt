package heracross.example.demo

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteDatabase
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
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
import com.scizor.Scizor
import kotlin.random.Random

/**
 * The example app's demo data on Android, ported from Scizor's sample app
 * (`SampleApp.kt`, `HomeScreen.kt`, `SampleDatabase.kt`, `LocationScreen.kt`):
 * cookies, SharedPreferences and a SQLite database for Scizor's browsers, and
 * `LocationManager` for the Location tab.
 */
class HeracrossExampleDemoModule(reactContext: ReactApplicationContext) :
  NativeHeracrossExampleDemoSpec(reactContext) {

  private val context: Context get() = reactApplicationContext

  private val locationManager: LocationManager?
    get() = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

  private val continuousListener = LocationListener { emitOnLocationUpdate(it.toMap()) }

  // Launch data

  override fun seedDemoData() {
    Scizor.cookies.log(
      name = "session_id", value = "abc123def456", domain = "example.com",
      path = "/", secure = true, httpOnly = true, expires = "7 days",
    )
    Scizor.cookies.log(name = "user_prefs", value = "theme=dark&lang=en", domain = "example.com", path = "/")
    Scizor.cookies.log(name = "_ga", value = "GA1.2.1234567890.1234567890", domain = "analytics.example.com")
    Scizor.cookies.log(
      name = "auth_token", value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", domain = "api.example.com",
      path = "/api", secure = true,
    )

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

    seedDatabase()
  }

  // Preferences Demo

  override fun writeSampleDefaults() {
    context.getSharedPreferences(EXAMPLE_PREFS, Context.MODE_PRIVATE).edit()
      .putString("example_username", "John Doe")
      .putInt("example_age", 42)
      .putBoolean("example_premium_user", true)
      .putFloat("example_pi_value", 3.14159f)
      .putStringSet("example_tags", setOf("Kotlin", "Android", "Scizor"))
      .putLong("example_last_login", System.currentTimeMillis())
      .apply()
  }

  override fun clearSampleDefaults() {
    context.getSharedPreferences(EXAMPLE_PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }

  // Database Demo

  override fun getRecordCounts(promise: Promise) = withDatabase(promise) { }

  override fun addDemoRecords(promise: Promise) = withDatabase(promise) { db ->
    val n = Random.nextInt(1000, 9999)
    db.execSQL(
      "INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)",
      arrayOf("User $n", "user$n@example.com", Random.nextInt(18, 65), System.currentTimeMillis()),
    )
    db.execSQL(
      "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
      arrayOf("Post $n", "Randomly generated post.", System.currentTimeMillis(), 1),
    )
    val categories = listOf("Electronics", "Audio", "Accessories", "Wearables", "Software")
    db.execSQL(
      "INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)",
      arrayOf<Any>(
        "Product $n",
        Random.nextInt(10, 999).toDouble(),
        if (Random.nextBoolean()) 1 else 0,
        categories.random(),
      ),
    )
  }

  override fun clearDemoRecords(promise: Promise) = withDatabase(promise) { db ->
    db.execSQL("DELETE FROM users")
    db.execSQL("DELETE FROM posts")
    db.execSQL("DELETE FROM products")
  }

  private fun seedDatabase() {
    openDatabase().use { db ->
      if (DatabaseUtils.queryNumEntries(db, "users") > 0L) return
      val now = System.currentTimeMillis()
      listOf(
        Triple("Alice Johnson", "alice@example.com", 28),
        Triple("Bob Smith", "bob@example.com", 34),
        Triple("Charlie Brown", "charlie@example.com", 22),
        Triple("Diana Ross", "diana@example.com", 45),
        Triple("Eve Williams", "eve@example.com", 31),
      ).forEach { (name, email, age) ->
        db.execSQL(
          "INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)",
          arrayOf(name, email, age, now),
        )
      }
      listOf(
        "Getting Started with Room" to 1,
        "Android Development Tips" to 1,
        "Building Debug Tools" to 2,
        "Compose Best Practices" to 3,
        "Understanding Migrations" to 4,
        "Unit Testing in Kotlin" to 5,
      ).forEach { (title, userId) ->
        db.execSQL(
          "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
          arrayOf(title, "Sample content for “$title”.", now, userId),
        )
      }
      listOf(
        arrayOf<Any>("Pixel 9 Pro", 999.0, 1, "Electronics"),
        arrayOf<Any>("Pixelbook", 1299.0, 1, "Electronics"),
        arrayOf<Any>("Pixel Buds Pro", 199.0, 0, "Audio"),
        arrayOf<Any>("Mechanical Keyboard", 149.0, 1, "Accessories"),
        arrayOf<Any>("Pixel Watch 3", 349.0, 1, "Wearables"),
        arrayOf<Any>("Pixel Tablet", 499.0, 1, "Tablets"),
        arrayOf<Any>("Studio Monitor", 599.0, 0, "Displays"),
        arrayOf<Any>("Nest Mini", 49.0, 1, "Audio"),
      ).forEach { row ->
        db.execSQL("INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)", row)
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

  private fun hasLocationPermission() =
    ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
      PackageManager.PERMISSION_GRANTED

  override fun getLocationAuthorization(promise: Promise) {
    promise.resolve(if (hasLocationPermission()) "authorized" else "notDetermined")
  }

  override fun requestLocationPermission() {
    val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity ?: return
    val listener = PermissionListener { _, _, grantResults ->
      val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
      emitOnLocationAuthorizationChange(if (granted) "authorized" else "denied")
      if (granted) requestLocation()
      true
    }
    UiThreadUtil.runOnUiThread {
      activity.requestPermissions(
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
        PERMISSION_REQUEST,
        listener,
      )
    }
  }

  override fun requestLocation() = withLocationManager { manager ->
    bestLastKnown(manager)?.let { emitOnLocationUpdate(it.toMap()) }
    enabledProviders(manager).forEach { provider ->
      val once = object : LocationListener {
        override fun onLocationChanged(location: Location) {
          emitOnLocationUpdate(location.toMap())
          manager.removeUpdates(this)
        }
      }
      manager.requestLocationUpdates(provider, 0L, 0f, once, Looper.getMainLooper())
    }
  }

  override fun startLocationUpdates() = withLocationManager { manager ->
    enabledProviders(manager).forEach { provider ->
      manager.requestLocationUpdates(provider, 1000L, 0f, continuousListener, Looper.getMainLooper())
    }
  }

  override fun stopLocationUpdates() {
    locationManager?.removeUpdates(continuousListener)
  }

  private fun withLocationManager(block: (LocationManager) -> Unit) {
    val manager = locationManager ?: return emitOnLocationError("Location services are unavailable")
    UiThreadUtil.runOnUiThread {
      runCatching { block(manager) }.onFailure { emitOnLocationError(it.message ?: it.toString()) }
    }
  }

  private fun enabledProviders(manager: LocationManager) =
    listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
      .filter(manager::isProviderEnabled)

  private fun bestLastKnown(manager: LocationManager): Location? =
    enabledProviders(manager).mapNotNull(manager::getLastKnownLocation).maxByOrNull { it.time }

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
    private const val EXAMPLE_PREFS = "example_prefs"
    private const val PERMISSION_REQUEST = 4201
  }
}
