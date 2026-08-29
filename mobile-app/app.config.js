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
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.trackintern.app',
    },
    android: {
      package: 'com.trackintern.app',
      // Cleartext HTTP enabled only in development for local emulator loopback (10.0.2.2:8000 / localhost)
      // Automatically disabled in production release builds to enforce HTTPS
      usesCleartextTraffic: !isProduction,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
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
