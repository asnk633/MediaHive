# Flutter Wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Hive
-keep class com.hivedb.** { *; }
-keep class io.hivedb.** { *; }
-dontwarn com.hivedb.**

# Supabase & Postgrest (JSON Serialization)
-keepattributes Signature,Annotation,EnclosingMethod
-keep class io.supabase.** { *; }
-keep class io.github.jan.supabase.** { *; }

# Awesome Notifications
-keep class me.carda.awesome_notifications.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# Prevent shrinking of generated code
-keep class com.thaibagarden.mediahive.MainActivity { *; }
-keep class * extends io.flutter.embedding.android.FlutterActivity
-keep class * extends io.flutter.embedding.android.FlutterFragment
-keep class * extends io.flutter.app.FlutterApplication

# Google Play Core (Fixes R8 missing classes error for production APK)
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }
