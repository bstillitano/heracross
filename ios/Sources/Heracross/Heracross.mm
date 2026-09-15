#import <Foundation/Foundation.h>
#import <HeracrossSpec/HeracrossSpec.h>

NS_ASSUME_NONNULL_BEGIN

// Implemented in Swift by the HeracrossScyther target. Declared here by hand
// rather than through `@import HeracrossScyther`, which would need C++ modules
// enabled across React's headers. Keep in sync with HeracrossScyther.swift;
// SelectorContractTests checks every selector below exists there.
@interface HeracrossScyther : NSObject
+ (void)startAllowingProductionBuilds:(BOOL)allowProductionBuilds;
+ (void)isStarted:(void (^)(BOOL started))completion;
+ (void)showMenu;
+ (void)hideMenu;
+ (void)isMenuOpen:(void (^)(BOOL open))completion;
+ (void)setInvocationGesture:(NSString *)gesture;
+ (void)registerFeatureFlag:(NSString *)key defaultValue:(BOOL)defaultValue;
+ (void)isFeatureFlagEnabled:(NSString *)key completion:(void (^)(BOOL enabled))completion;
+ (void)getFeatureFlags:(void (^)(NSArray<NSString *> *keys,
                                  NSArray<NSNumber *> *defaultValues,
                                  NSArray<NSNumber *> *enabled,
                                  NSArray<NSNumber *> *overrides))completion;
+ (void)getFeatureFlagOverride:(NSString *)key completion:(void (^)(BOOL hasOverride, BOOL value))completion;
+ (void)getFeatureFlagOverridesEnabled:(void (^)(BOOL enabled))completion;
+ (void)setFeatureFlagOverridesEnabled:(BOOL)enabled;
+ (void)setFeatureFlagOverride:(NSString *)key value:(BOOL)value;
+ (void)clearFeatureFlagOverride:(NSString *)key;
+ (void)resetFeatureFlagOverrides;
+ (void)configureServers:(NSArray<NSDictionary<NSString *, id> *> *)servers;
+ (void)selectServer:(NSString *)serverId;
+ (void)getSelectedServer:(void (^)(NSString *_Nullable serverId,
                                    NSString *baseUrl,
                                    NSDictionary<NSString *, NSString *> *variables))completion;
+ (void)getServers:(void (^)(NSArray<NSString *> *ids,
                             NSArray<NSString *> *baseUrls,
                             NSArray<NSDictionary<NSString *, NSString *> *> *variables))completion;
+ (void)setFeatureFlagChangeHandler:(void (^)(NSString *key, BOOL enabled))featureFlagHandler
                serverChangeHandler:(void (^)(NSString *serverId,
                                              NSString *baseUrl,
                                              NSDictionary<NSString *, NSString *> *variables))serverHandler;
+ (void)setEnvironmentVariables:(NSDictionary<NSString *, id> *)variables;
+ (void)getEnvironmentVariables:(void (^)(NSDictionary<NSString *, NSString *> *variables))completion;
+ (void)setDeveloperOptions:(NSArray<NSDictionary<NSString *, id> *> *)options;
+ (void)setDeepLinkPresets:(NSArray<NSDictionary<NSString *, id> *> *)presets;
+ (void)setApnsToken:(nullable NSString *)token;
+ (void)setFcmToken:(nullable NSString *)token;
+ (void)logNotification:(NSDictionary<NSString *, id> *)payload;
+ (void)triggerTestCrash;
+ (void)getLocationSpoofingState:(void (^)(BOOL enabled,
                                           BOOL swizzled,
                                           NSString *locationName,
                                           double latitude,
                                           double longitude))completion;
@end

NS_ASSUME_NONNULL_END

// Matches OverrideState in HeracrossModels.swift.
static const NSInteger HeracrossNoOverride = -1;

@interface Heracross : NativeHeracrossSpecBase <NativeHeracrossSpec>
@end

@implementation Heracross

+ (NSString *)moduleName
{
  return @"Heracross";
}

// The emitters can only be called once React has handed over its callback, so
// the change handlers are installed here rather than at init. A newer instance,
// such as after a reload, replaces an older one's handlers.
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  [super setEventEmitterCallback:eventEmitterCallbackWrapper];
  __weak Heracross *weakSelf = self;
  [HeracrossScyther
      setFeatureFlagChangeHandler:^(NSString *key, BOOL enabled) {
        [weakSelf emitOnFeatureFlagChange:@{@"key" : key, @"enabled" : @(enabled)}];
      }
      serverChangeHandler:^(NSString *serverId,
                            NSString *baseUrl,
                            NSDictionary<NSString *, NSString *> *variables) {
        [weakSelf emitOnServerChange:@{
          @"id" : serverId,
          @"baseUrl" : baseUrl,
          @"variables" : variables,
        }];
      }];
}

- (void)start:(BOOL)allowProductionBuilds captureNetwork:(BOOL)captureNetwork
{
  // Scyther intercepts URLSession traffic itself; captureNetwork is Android only.
  [HeracrossScyther startAllowingProductionBuilds:allowProductionBuilds];
}

- (void)isStarted:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther isStarted:^(BOOL started) {
    resolve(@(started));
  }];
}

- (void)showMenu
{
  [HeracrossScyther showMenu];
}

- (void)hideMenu
{
  [HeracrossScyther hideMenu];
}

- (void)isMenuOpen:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther isMenuOpen:^(BOOL open) {
    resolve(@(open));
  }];
}

- (void)setInvocationGesture:(NSString *)gesture
{
  [HeracrossScyther setInvocationGesture:gesture];
}

- (void)setDisabledFeatures:(NSArray *)features
{
  // Scyther has no way to hide its built-in tools; this is Android only.
}

- (void)registerFeatureFlag:(NSString *)key title:(NSString *)title defaultValue:(BOOL)defaultValue
{
  // Scyther labels a flag with its key; there is no separate title.
  [HeracrossScyther registerFeatureFlag:key defaultValue:defaultValue];
}

- (void)isFeatureFlagEnabled:(NSString *)key
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther isFeatureFlagEnabled:key
                              completion:^(BOOL enabled) {
                                resolve(@(enabled));
                              }];
}

- (void)getFeatureFlags:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getFeatureFlags:^(NSArray<NSString *> *keys,
                                      NSArray<NSNumber *> *defaultValues,
                                      NSArray<NSNumber *> *enabled,
                                      NSArray<NSNumber *> *overrides) {
    NSMutableArray *flags = [NSMutableArray arrayWithCapacity:keys.count];
    for (NSUInteger index = 0; index < keys.count; index++) {
      NSInteger override = overrides[index].integerValue;
      [flags addObject:@{
        @"key" : keys[index],
        @"title" : keys[index],
        @"defaultValue" : defaultValues[index],
        @"enabled" : enabled[index],
        @"override" : override == HeracrossNoOverride ? (id)[NSNull null] : @(override == 1),
      }];
    }
    resolve(flags);
  }];
}

- (void)getFeatureFlagOverride:(NSString *)key
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getFeatureFlagOverride:key
                                completion:^(BOOL hasOverride, BOOL value) {
                                  resolve(hasOverride ? @(value) : (id)[NSNull null]);
                                }];
}

- (void)getFeatureFlagOverridesEnabled:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getFeatureFlagOverridesEnabled:^(BOOL enabled) {
    resolve(@(enabled));
  }];
}

- (void)setFeatureFlagOverridesEnabled:(BOOL)enabled
{
  [HeracrossScyther setFeatureFlagOverridesEnabled:enabled];
}

- (void)setFeatureFlagOverride:(NSString *)key value:(BOOL)value
{
  [HeracrossScyther setFeatureFlagOverride:key value:value];
}

- (void)clearFeatureFlagOverride:(NSString *)key
{
  [HeracrossScyther clearFeatureFlagOverride:key];
}

- (void)resetFeatureFlagOverrides
{
  [HeracrossScyther resetFeatureFlagOverrides];
}

- (void)configureServers:(NSArray *)servers
{
  [HeracrossScyther configureServers:servers];
}

- (void)selectServer:(NSString *)serverId
{
  [HeracrossScyther selectServer:serverId];
}

- (void)getSelectedServer:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getSelectedServer:^(NSString *serverId,
                                        NSString *baseUrl,
                                        NSDictionary<NSString *, NSString *> *variables) {
    if (serverId == nil) {
      resolve([NSNull null]);
      return;
    }
    resolve(@{
      @"id" : serverId,
      @"baseUrl" : baseUrl,
      @"variables" : variables,
    });
  }];
}

- (void)getServers:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getServers:^(NSArray<NSString *> *ids,
                                 NSArray<NSString *> *baseUrls,
                                 NSArray<NSDictionary<NSString *, NSString *> *> *variables) {
    NSMutableArray *servers = [NSMutableArray arrayWithCapacity:ids.count];
    for (NSUInteger index = 0; index < ids.count; index++) {
      [servers addObject:@{
        @"id" : ids[index],
        @"baseUrl" : baseUrls[index],
        @"variables" : variables[index],
      }];
    }
    resolve(servers);
  }];
}

- (void)setEnvironmentVariables:(NSDictionary *)variables
{
  [HeracrossScyther setEnvironmentVariables:variables];
}

- (void)getEnvironmentVariables:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getEnvironmentVariables:^(NSDictionary<NSString *, NSString *> *variables) {
    resolve(variables);
  }];
}

- (void)setDeveloperOptions:(NSArray *)options
{
  [HeracrossScyther setDeveloperOptions:options];
}

- (void)setDeepLinkPresets:(NSArray *)presets
{
  [HeracrossScyther setDeepLinkPresets:presets];
}

- (void)setApnsToken:(NSString *_Nullable)token
{
  [HeracrossScyther setApnsToken:token];
}

- (void)setFcmToken:(NSString *_Nullable)token
{
  [HeracrossScyther setFcmToken:token];
}

- (void)logNotification:(NSDictionary *)payload
{
  [HeracrossScyther logNotification:payload];
}

// Scyther's Cookie Browser lists HTTPCookieStorage.sharedHTTPCookieStorage,
// which React Native's networking stores its cookies in, so there is nothing to
// log by hand on iOS.
- (void)logCookie:(NSDictionary *)cookie
{
}

- (void)captureWebViewCookies:(NSString *)url
{
}

- (void)clearLoggedCookies
{
}

- (void)triggerTestCrash
{
  [HeracrossScyther triggerTestCrash];
}

- (void)getLocationSpoofingState:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [HeracrossScyther getLocationSpoofingState:^(BOOL enabled,
                                               BOOL swizzled,
                                               NSString *locationName,
                                               double latitude,
                                               double longitude) {
    resolve(@{
      @"enabled" : @(enabled),
      @"swizzled" : @(swizzled),
      @"locationName" : locationName,
      @"latitude" : @(latitude),
      @"longitude" : @(longitude),
    });
  }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeHeracrossSpecJSI>(params);
}

@end
