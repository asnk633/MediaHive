# Preservation for Capacitor and Firebase bridges
-keep class com.getcapacitor.** { *; }
-keep class com.google.firebase.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepattributes Signature,RuntimeVisibleAnnotations,AnnotationDefault
-dontwarn com.google.firebase.**
-dontwarn com.getcapacitor.**

# Keep Javascript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# HARDENING: Strip debug and verbose logs in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
