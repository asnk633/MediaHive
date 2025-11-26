# APK Build Guide

## Prerequisites

1. Android Studio installed
2. Android SDK configured
3. Java Development Kit (JDK) 11 or higher
4. Node.js and npm installed

## Building the APK

1. Ensure all dependencies are installed:
   ```
   npm install
   ```

2. Build the Next.js application:
   ```
   npm run build
   ```

3. Export the application as a static site:
   ```
   npm run export
   ```

4. Package the application using Capacitor:
   ```
   npx cap add android
   npx cap copy
   npx cap open android
   ```

5. In Android Studio, build the APK:
   - Go to Build > Build Bundle(s) / APK(s) > Build APK(s)

## Signing the APK

For production distribution, sign the APK with your keystore:

1. Generate a keystore (if you don't have one):
   ```
   keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Sign the APK using Android Studio:
   - Go to Build > Generate Signed Bundle / APK
   - Select APK and follow the wizard

## Troubleshooting

- Ensure all environment variables are properly set
- Check that the Android SDK path is correctly configured in Android Studio
- Verify that the application builds correctly in the web version before packaging