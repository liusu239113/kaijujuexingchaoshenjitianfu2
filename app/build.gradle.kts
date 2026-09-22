plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kaiju.awaken"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kaiju.awaken"
        minSdk = 24
        targetSdk = 34
        versionCode = 140
        versionName = "1.4.0"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = false
    }
}

dependencies {
    // Intentionally dependency-free: plain Android framework + Canvas rendering.
}
