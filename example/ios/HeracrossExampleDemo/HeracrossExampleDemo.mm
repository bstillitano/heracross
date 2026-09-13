#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <HeracrossExampleSpec/HeracrossExampleSpec.h>
#import <Security/Security.h>
#import <UIKit/UIKit.h>
#import <sqlite3.h>

// The example app's demo data, ported from ScytherExampleApp.swift and
// ContentView.swift: cookies, keychain items, UserDefaults values and a SQLite
// database for Scyther's data browsers, and a CLLocationManager so the Location
// tab can show Scyther's location spoofer taking effect.
//
// ScytherExample stores its records with SwiftData. This port writes the same
// records to `Application Support/demo.sqlite`, which Scyther's Database
// Browser discovers the same way.

static NSString *const kDatabaseName = @"demo.sqlite";

#pragma mark - SQLite helpers

static NSString *DatabasePath(void)
{
  NSURL *directory = [[NSFileManager defaultManager] URLForDirectory:NSApplicationSupportDirectory
                                                            inDomain:NSUserDomainMask
                                                   appropriateForURL:nil
                                                              create:YES
                                                               error:nil];
  return [directory URLByAppendingPathComponent:kDatabaseName].path;
}

static sqlite3 *OpenDatabase(void)
{
  sqlite3 *db = NULL;
  if (sqlite3_open(DatabasePath().UTF8String, &db) != SQLITE_OK) {
    sqlite3_close(db);
    return NULL;
  }
  sqlite3_exec(db, "PRAGMA foreign_keys = ON", NULL, NULL, NULL);
  sqlite3_exec(db,
               "CREATE TABLE IF NOT EXISTS users ("
               "id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER, createdAt REAL)",
               NULL, NULL, NULL);
  sqlite3_exec(db,
               "CREATE TABLE IF NOT EXISTS posts ("
               "id INTEGER PRIMARY KEY, title TEXT, content TEXT, publishedAt REAL, "
               "userId INTEGER REFERENCES users(id) ON DELETE CASCADE)",
               NULL, NULL, NULL);
  sqlite3_exec(db,
               "CREATE TABLE IF NOT EXISTS products ("
               "id INTEGER PRIMARY KEY, name TEXT, price REAL, inStock INTEGER, category TEXT)",
               NULL, NULL, NULL);
  return db;
}

static int CountRows(sqlite3 *db, const char *table)
{
  NSString *sql = [NSString stringWithFormat:@"SELECT COUNT(*) FROM %s", table];
  sqlite3_stmt *statement = NULL;
  int count = 0;
  if (sqlite3_prepare_v2(db, sql.UTF8String, -1, &statement, NULL) == SQLITE_OK &&
      sqlite3_step(statement) == SQLITE_ROW) {
    count = sqlite3_column_int(statement, 0);
  }
  sqlite3_finalize(statement);
  return count;
}

/// Runs one parameterised insert, returning the new row id, or 0 if it failed.
static sqlite3_int64 Insert(sqlite3 *db, const char *sql, NSArray *values)
{
  sqlite3_stmt *statement = NULL;
  if (sqlite3_prepare_v2(db, sql, -1, &statement, NULL) != SQLITE_OK) {
    return 0;
  }
  [values enumerateObjectsUsingBlock:^(id value, NSUInteger index, BOOL *stop) {
    int position = (int)index + 1;
    if ([value isKindOfClass:[NSString class]]) {
      sqlite3_bind_text(statement, position, [value UTF8String], -1, SQLITE_TRANSIENT);
    } else if (CFNumberIsFloatType((CFNumberRef)value)) {
      sqlite3_bind_double(statement, position, [value doubleValue]);
    } else {
      sqlite3_bind_int64(statement, position, [value longLongValue]);
    }
  }];
  int result = sqlite3_step(statement);
  sqlite3_finalize(statement);
  return result == SQLITE_DONE ? sqlite3_last_insert_rowid(db) : 0;
}

static NSDictionary *RecordCounts(sqlite3 *db)
{
  return @{
    @"users" : @(CountRows(db, "users")),
    @"posts" : @(CountRows(db, "posts")),
    @"products" : @(CountRows(db, "products")),
  };
}

static NSNumber *Now(void)
{
  return @([NSDate date].timeIntervalSince1970);
}

static int RandomBetween(int lower, int upper)
{
  return lower + (int)arc4random_uniform((uint32_t)(upper - lower + 1));
}

#pragma mark - Module

@interface HeracrossExampleDemo : NativeHeracrossExampleDemoSpecBase <NativeHeracrossExampleDemoSpec, CLLocationManagerDelegate>
@end

@implementation HeracrossExampleDemo {
  CLLocationManager *_locationManager;
}

+ (NSString *)moduleName
{
  return @"HeracrossExampleDemo";
}

// CLLocationManager delivers delegate callbacks on the run loop it was created
// on, so every method, and the manager itself, lives on the main queue.
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeHeracrossExampleDemoSpecJSI>(params);
}

#pragma mark Launch data

- (void)seedDemoData
{
  [self seedCookies];
  [self seedKeychainItems];
  [self seedDatabase];
}

- (void)seedCookies
{
  NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
  NSArray<NSDictionary<NSHTTPCookiePropertyKey, id> *> *cookies = @[
    @{
      NSHTTPCookieDomain : @"example.com",
      NSHTTPCookiePath : @"/",
      NSHTTPCookieName : @"session_id",
      NSHTTPCookieValue : @"abc123def456",
      NSHTTPCookieSecure : @"TRUE",
      NSHTTPCookieExpires : [NSDate dateWithTimeIntervalSinceNow:86400 * 7],
    },
    @{
      NSHTTPCookieDomain : @"example.com",
      NSHTTPCookiePath : @"/",
      NSHTTPCookieName : @"user_prefs",
      NSHTTPCookieValue : @"theme=dark&lang=en",
      NSHTTPCookieExpires : [NSDate dateWithTimeIntervalSinceNow:86400 * 30],
    },
    @{
      NSHTTPCookieDomain : @"analytics.example.com",
      NSHTTPCookiePath : @"/",
      NSHTTPCookieName : @"_ga",
      NSHTTPCookieValue : @"GA1.2.1234567890.1234567890",
      NSHTTPCookieExpires : [NSDate dateWithTimeIntervalSinceNow:86400 * 365],
    },
    @{
      NSHTTPCookieDomain : @"api.example.com",
      NSHTTPCookiePath : @"/api",
      NSHTTPCookieName : @"auth_token",
      NSHTTPCookieValue : @"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      NSHTTPCookieSecure : @"TRUE",
      NSHTTPCookieExpires : [NSDate dateWithTimeIntervalSinceNow:86400],
    },
  ];
  for (NSDictionary *properties in cookies) {
    NSHTTPCookie *cookie = [NSHTTPCookie cookieWithProperties:properties];
    if (cookie != nil) {
      [storage setCookie:cookie];
    }
  }
}

- (void)seedKeychainItems
{
  // ScytherExample stores "sk_live_1234567890abcdef", which secret scanners
  // mistake for a Stripe key; this demo value can't be.
  [self saveToKeychainService:@"com.example.scyther" account:@"api_key" data:@"demo_api_key_1234567890abcdef"];
  [self saveToKeychainService:@"com.example.scyther"
                      account:@"access_token"
                         data:@"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"];
  [self saveToKeychainService:@"com.example.scyther" account:@"refresh_token" data:@"rt_abcdef123456"];
  [self saveToKeychainService:@"com.example.scyther.auth"
                      account:@"demo_user@example.com"
                         data:@"encrypted_password_hash"];
}

- (void)saveToKeychainService:(NSString *)service account:(NSString *)account data:(NSString *)data
{
  NSDictionary *query = @{
    (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService : service,
    (__bridge id)kSecAttrAccount : account,
  };
  SecItemDelete((__bridge CFDictionaryRef)query);

  NSMutableDictionary *item = [query mutableCopy];
  item[(__bridge id)kSecValueData] = [data dataUsingEncoding:NSUTF8StringEncoding];
  item[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleWhenUnlocked;
  SecItemAdd((__bridge CFDictionaryRef)item, NULL);
}

- (void)seedDatabase
{
  sqlite3 *db = OpenDatabase();
  if (db == NULL) {
    return;
  }
  if (CountRows(db, "users") > 0) {
    sqlite3_close(db);
    return;
  }

  NSArray *users = @[
    @[ @"Alice Johnson", @"alice@example.com", @28 ],
    @[ @"Bob Smith", @"bob@example.com", @34 ],
    @[ @"Charlie Brown", @"charlie@example.com", @22 ],
    @[ @"Diana Ross", @"diana@example.com", @45 ],
    @[ @"Eve Williams", @"eve@example.com", @31 ],
  ];
  NSMutableArray<NSNumber *> *userIds = [NSMutableArray array];
  for (NSArray *user in users) {
    sqlite3_int64 rowId = Insert(db,
                                 "INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)",
                                 [user arrayByAddingObject:Now()]);
    [userIds addObject:@(rowId)];
  }

  NSArray *posts = @[
    @[
      @"Getting Started with SwiftData",
      @"SwiftData is Apple's new framework for data persistence in Swift apps. It provides a modern, "
      @"declarative approach to managing your app's data model.",
      @0
    ],
    @[ @"iOS Development Tips", @"Here are some tips for iOS development that will help you build better apps faster.", @0 ],
    @[
      @"Building Debug Tools",
      @"Learn how to build debugging tools for your iOS apps. This guide covers logging, network inspection, and more.",
      @1
    ],
    @[
      @"SwiftUI Best Practices",
      @"Explore best practices for building SwiftUI applications that are maintainable and performant.",
      @2
    ],
    @[
      @"Understanding Core Data Migration",
      @"A deep dive into Core Data migration strategies and how to handle schema changes.",
      @3
    ],
    @[ @"Unit Testing in Swift", @"Learn effective unit testing strategies for Swift applications.", @4 ],
  ];
  for (NSArray *post in posts) {
    NSNumber *userId = userIds[[post[2] unsignedIntegerValue]];
    if (userId.longLongValue == 0) {
      continue;
    }
    Insert(db,
           "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
           @[ post[0], post[1], Now(), userId ]);
  }

  NSArray *products = @[
    @[ @"iPhone 16 Pro", @999.0, @YES, @"Electronics" ],
    @[ @"MacBook Air M3", @1299.0, @YES, @"Electronics" ],
    @[ @"AirPods Pro 2", @249.0, @NO, @"Audio" ],
    @[ @"Magic Keyboard", @299.0, @YES, @"Accessories" ],
    @[ @"Apple Watch Ultra", @799.0, @YES, @"Wearables" ],
    @[ @"iPad Pro 13\"", @1299.0, @YES, @"Tablets" ],
    @[ @"Studio Display", @1599.0, @NO, @"Displays" ],
    @[ @"HomePod mini", @99.0, @YES, @"Audio" ],
  ];
  for (NSArray *product in products) {
    Insert(db, "INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)", product);
  }

  sqlite3_close(db);
}

#pragma mark User Defaults Demo

- (void)writeSampleDefaults
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:@"John Doe" forKey:@"example_username"];
  [defaults setInteger:42 forKey:@"example_age"];
  [defaults setBool:YES forKey:@"example_premium_user"];
  [defaults setDouble:3.14159 forKey:@"example_pi_value"];
  [defaults setObject:@[ @"Swift", @"iOS", @"Scyther" ] forKey:@"example_tags"];
  [defaults setObject:@{
    @"name" : @"Test User",
    @"email" : @"test@example.com",
    @"settings" : @{@"darkMode" : @YES, @"notifications" : @NO},
  }
               forKey:@"example_user_profile"];
  [defaults setObject:[NSDate date] forKey:@"example_last_login"];
}

- (void)clearSampleDefaults
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  for (NSString *key in @[
         @"example_username",
         @"example_age",
         @"example_premium_user",
         @"example_pi_value",
         @"example_tags",
         @"example_user_profile",
         @"example_last_login",
       ]) {
    [defaults removeObjectForKey:key];
  }
}

#pragma mark Database Demo

- (void)getRecordCounts:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  sqlite3 *db = OpenDatabase();
  if (db == NULL) {
    reject(@"database", @"Could not open the demo database", nil);
    return;
  }
  resolve(RecordCounts(db));
  sqlite3_close(db);
}

- (void)addDemoRecords:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  sqlite3 *db = OpenDatabase();
  if (db == NULL) {
    reject(@"database", @"Could not open the demo database", nil);
    return;
  }

  sqlite3_int64 userId = Insert(db,
                                "INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)",
                                @[
                                  [NSString stringWithFormat:@"User %d", RandomBetween(1000, 9999)],
                                  [NSString stringWithFormat:@"user%d@example.com", RandomBetween(1000, 9999)],
                                  @(RandomBetween(18, 65)),
                                  Now(),
                                ]);
  if (userId != 0) {
    Insert(db,
           "INSERT INTO posts (title, content, publishedAt, userId) VALUES (?, ?, ?, ?)",
           @[
             [NSString stringWithFormat:@"Post %d", RandomBetween(1000, 9999)],
             @"This is a randomly generated post for testing purposes.",
             Now(),
             @(userId),
           ]);
  }
  NSArray *categories = @[ @"Electronics", @"Audio", @"Accessories", @"Wearables", @"Software" ];
  Insert(db,
         "INSERT INTO products (name, price, inStock, category) VALUES (?, ?, ?, ?)",
         @[
           [NSString stringWithFormat:@"Product %d", RandomBetween(1000, 9999)],
           @((double)RandomBetween(10, 1000)),
           @(arc4random_uniform(2) == 1),
           categories[arc4random_uniform((uint32_t)categories.count)],
         ]);

  resolve(RecordCounts(db));
  sqlite3_close(db);
}

- (void)clearDemoRecords:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  sqlite3 *db = OpenDatabase();
  if (db == NULL) {
    reject(@"database", @"Could not open the demo database", nil);
    return;
  }
  sqlite3_exec(db, "DELETE FROM posts; DELETE FROM users; DELETE FROM products;", NULL, NULL, NULL);
  resolve(RecordCounts(db));
  sqlite3_close(db);
}

#pragma mark Location

- (CLLocationManager *)locationManager
{
  if (_locationManager == nil) {
    _locationManager = [CLLocationManager new];
    _locationManager.delegate = self;
    _locationManager.desiredAccuracy = kCLLocationAccuracyBest;
  }
  return _locationManager;
}

static NSString *AuthorizationName(CLAuthorizationStatus status)
{
  switch (status) {
    case kCLAuthorizationStatusNotDetermined:
      return @"notDetermined";
    case kCLAuthorizationStatusDenied:
    case kCLAuthorizationStatusRestricted:
      return @"denied";
    default:
      return @"authorized";
  }
}

- (void)getLocationAuthorization:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(AuthorizationName(self.locationManager.authorizationStatus));
}

- (void)requestLocationPermission
{
  [self.locationManager requestWhenInUseAuthorization];
}

- (void)requestLocation
{
  [self.locationManager requestLocation];
}

- (void)startLocationUpdates
{
  [self.locationManager startUpdatingLocation];
}

- (void)stopLocationUpdates
{
  [self.locationManager stopUpdatingLocation];
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager
{
  NSString *status = AuthorizationName(manager.authorizationStatus);
  [self emitOnLocationAuthorizationChange:status];
  if ([status isEqualToString:@"authorized"]) {
    [manager requestLocation];
  }
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  CLLocation *location = locations.lastObject;
  if (location == nil) {
    return;
  }
  [self emitOnLocationUpdate:@{
    @"latitude" : @(location.coordinate.latitude),
    @"longitude" : @(location.coordinate.longitude),
    @"accuracy" : @(location.horizontalAccuracy),
    @"altitude" : @(location.altitude),
    @"timestamp" : @(location.timestamp.timeIntervalSince1970 * 1000),
  }];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  [self emitOnLocationError:error.localizedDescription];
}

#pragma mark Layout

- (void)getSafeAreaInsets:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  UIWindow *window = nil;
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }
    for (UIWindow *candidate in ((UIWindowScene *)scene).windows) {
      if (window == nil || candidate.isKeyWindow) {
        window = candidate;
      }
    }
  }
  UIEdgeInsets insets = window != nil ? window.safeAreaInsets : UIEdgeInsetsZero;
  resolve(@{
    @"top" : @(insets.top),
    @"bottom" : @(insets.bottom),
    @"left" : @(insets.left),
    @"right" : @(insets.right),
  });
}

@end
