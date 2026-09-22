import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/*
 * 正式签名。
 * 优先读环境变量（CI 用 GitHub Secrets 注入），其次读仓库根目录的 keystore.properties（本地用）。
 * 两者都没有时回退 debug 签名 —— 这样任何机器上都能直接跑 assembleDebug / assembleRelease，
 * 不会因为缺签名文件而卡住构建。
 */
val signingProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

fun signValue(key: String): String? = System.getenv(key) ?: signingProps.getProperty(key)

android {
    namespace = "com.dshx.game.shidai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.dshx.game.shidai"
        minSdk = 24
        targetSdk = 34
        versionCode = 150
        versionName = "1.5.0"
    }

    signingConfigs {
        create("release") {
            val path = signValue("KEYSTORE_FILE")
            if (path != null && rootProject.file(path).exists()) {
                storeFile = rootProject.file(path)
                storePassword = signValue("KEYSTORE_PASSWORD")
                keyAlias = signValue("KEY_ALIAS")
                keyPassword = signValue("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            // 配了正式签名就用正式签名；没配则退回 debug 签名（仅本地调试用）
            signingConfig = if (signingConfigs.getByName("release").storeFile != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
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
    // ------------------------------------------------------------------
    // 广告 SDK（Tosin / TopOn 聚合）——接法与参考项目 school2-v2 保持一致：
    // core + adx + oaid + 各平台 adapter（穿山甲/优量汇/快手/百度/sigmob/topon）
    // 游戏逻辑不直接依赖它们：所有调用都收在 ads/ 包里，通过 RewardAds 暴露。
    // ------------------------------------------------------------------
    implementation(files("libs/tosin-ad-Y260817.aar"))
    implementation(files("libs/tosin-adx-2.9.65.aar"))
    implementation(files("libs/oaid_sdk_1.0.25.aar"))
    implementation(files("libs/tosin-csj-adapter-7.6.1.1.aar"))
    implementation(files("libs/tosin-gdt-adapter-4.690.1560.aar"))
    implementation(files("libs/tosin-ks-adapter-5.1.20.1.aar"))
    implementation(files("libs/tosin-baidu-adapter-9.450.aar"))
    implementation(files("libs/sigmob/tosin-sigmob_common-adapter-1.9.4.aar"))
    implementation(files("libs/sigmob/tosin-sigmob_windsdk-adapter-4.25.11.aar"))
    implementation(files("libs/topon/tosin-anythink_banner-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_china_core.aar"))
    implementation(files("libs/topon/tosin-anythink_core-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_interstitial-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_native-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_rewardvideo-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_splash-adapter.aar"))

    // 广告 SDK 的运行时依赖（与参考项目同款）
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    implementation("com.squareup.retrofit2:adapter-rxjava2:2.2.0")
    implementation("io.reactivex.rxjava2:rxjava:2.2.21")
}
