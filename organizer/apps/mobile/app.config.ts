import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Dynamic Expo config (TS) so we can read env vars at config-eval time if
 * needed later (e.g. per-environment bundle identifiers). Static fields are
 * kept plain for clarity.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Organizer",
  slug: "organizer",
  scheme: "organizer",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0B0F19",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.organizer.app",
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription: "Organizer does not use the camera at this time.",
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    package: "com.organizer.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B0F19",
    },
    permissions: ["NOTIFICATIONS", "SCHEDULE_EXACT_ALARM"],
  },
  web: {
    bundler: "metro",
    favicon: "./assets/icon.png",
  },
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#D4AF37",
      },
    ],
    "expo-apple-authentication",
  ],
  extra: {
    eas: {
      projectId: "organizer-mobile-placeholder",
    },
  },
});
