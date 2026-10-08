module.exports = ({ config }) => {
  const isProduction = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';

  return {
    ...config,
    name: 'TrackIntern',
    slug: 'trackintern',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'trackintern',
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: 'com.trackintern.app',
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSLocationWhenInUseUsageDescription:
          'TrackIntern needs your location to verify attendance at your registered workplace office.',
      },
    },
    android: {
      ...config.android,
      package: 'com.trackintern.app',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
      ],
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      ...config.web,
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'TrackIntern needs your location to verify attendance at your registered workplace office.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
