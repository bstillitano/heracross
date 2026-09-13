#import <Foundation/Foundation.h>
#import <HeracrossSpec/HeracrossSpec.h>

NS_ASSUME_NONNULL_BEGIN

// Implemented in Swift by the HeracrossScyther target. Declared here by hand
// rather than through `@import HeracrossScyther`, which would need C++ modules
// enabled across React's headers. Keep in sync with HeracrossScyther.swift.
@interface HeracrossScyther : NSObject
+ (void)startAllowingProductionBuilds:(BOOL)allowProductionBuilds;
+ (void)showMenu;
+ (void)hideMenu;
+ (void)setInvocationGesture:(NSString *)gesture;
+ (void)registerFeatureFlag:(NSString *)key defaultValue:(BOOL)defaultValue;
+ (void)isFeatureFlagEnabled:(NSString *)key completion:(void (^)(BOOL enabled))completion;
+ (void)configureServers:(NSArray<NSDictionary<NSString *, id> *> *)servers;
+ (void)selectServer:(NSString *)serverId;
+ (void)getSelectedServer:(void (^)(NSString *_Nullable serverId,
                                    NSDictionary<NSString *, NSString *> *variables))completion;
+ (void)setEnvironmentVariables:(NSDictionary<NSString *, NSString *> *)variables;
+ (void)setDeveloperOptions:(NSArray<NSDictionary<NSString *, id> *> *)options;
+ (void)setApnsToken:(nullable NSString *)token;
+ (void)setFcmToken:(nullable NSString *)token;
+ (void)triggerTestCrash;
+ (void)getLocationSpoofingState:(void (^)(BOOL enabled,
                                           BOOL swizzled,
                                           NSString *locationName,
                                           double latitude,
                                           double longitude))completion;
@end

NS_ASSUME_NONNULL_END

@interface Heracross : NSObject <NativeHeracrossSpec>
@end

@implementation Heracross

+ (NSString *)moduleName
{
  return @"Heracross";
}

- (void)start:(BOOL)allowProductionBuilds captureNetwork:(BOOL)captureNetwork
{
  // Scyther intercepts URLSession traffic itself; captureNetwork is Android only.
  [HeracrossScyther startAllowingProductionBuilds:allowProductionBuilds];
}

- (void)showMenu
{
  [HeracrossScyther showMenu];
}

- (void)hideMenu
{
  [HeracrossScyther hideMenu];
}

- (void)setInvocationGesture:(NSString *)gesture
{
  [HeracrossScyther setInvocationGesture:gesture];
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
  [HeracrossScyther getSelectedServer:^(NSString *serverId, NSDictionary<NSString *, NSString *> *variables) {
    if (serverId == nil) {
      resolve([NSNull null]);
      return;
    }
    resolve(@{
      @"id" : serverId,
      @"baseUrl" : variables[@"baseUrl"] ?: @"",
      @"variables" : variables,
    });
  }];
}

- (void)setEnvironmentVariables:(NSDictionary *)variables
{
  [HeracrossScyther setEnvironmentVariables:variables];
}

- (void)setDeveloperOptions:(NSArray *)options
{
  [HeracrossScyther setDeveloperOptions:options];
}

- (void)setApnsToken:(NSString *_Nullable)token
{
  [HeracrossScyther setApnsToken:token];
}

- (void)setFcmToken:(NSString *_Nullable)token
{
  [HeracrossScyther setFcmToken:token];
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
