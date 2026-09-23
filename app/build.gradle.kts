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
        versionCode = 113
        versionName = "1.2.7"
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
        // 打开 BuildConfig：标题页的版本号直接读 BuildConfig.VERSION_NAME，
        // 免得 gradle 里改成 1.0.0、界面上还硬编码着 v1.5.0。
        buildConfig = true
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
    // ↓↓↓ 这两个是 ADX 业务的必需组件，之前只放进了 app/libs/topon/
    //     但忘了写进依赖，导致没打进 APK：SDK 每次启动都弹
    //     「检测到 anythink_network_adx_*.aar 重要组件缺失」，
    //     并且初始化直接失败 —— 表现就是所有「看广告」都提示没准备好。
    implementation(files("libs/topon/tosin-anythink_adx_sdk_kuying_necessary-adapter-6.5.48.aar"))
    implementation(files("libs/topon/tosin-anythink_network_adx_kuying_sdk_necessary-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_banner-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_china_core.aar"))
    implementation(files("libs/topon/tosin-anythink_core-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_interstitial-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_native-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_rewardvideo-adapter.aar"))
    implementation(files("libs/topon/tosin-anythink_splash-adapter.aar"))

    // TapTap 登录 + 防沉迷（compliance = 合规认证）
    implementation("com.taptap.sdk:tap-core:4.10.3")
    implementation("com.taptap.sdk:tap-login:4.10.3")
    implementation("com.taptap.sdk:tap-compliance:4.10.3")

    // 广告 SDK 的运行时依赖（与参考项目同款）
    implementation("androidx.appcompat:appcompat:1.6.1")
    // Tosin 的 TosinSDK 类内部用了 viewModelScope，直接引用 androidx.lifecycle.ViewModelKt。
    // 参考项目 school2-v2 是 Compose 工程，这个类由 Compose/Activity 传递带入；
    // 本工程是纯 Canvas，没有 Compose，classpath 上就缺了它 ——
    // TosinSDK 类一加载就抛 NoClassDefFoundError，被 TosinAdInitializer 兜住后显示成
    // 「广告 SDK 初始化异常：Failed resolution of: Landroidx/lifecycle/ViewModelKt」。
    // 版本取 2.6.1：与当前 appcompat/material 传递进来的 lifecycle-viewmodel 同版本，不引入升级。
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    implementation("com.squareup.retrofit2:adapter-rxjava2:2.2.0")
    implementation("io.reactivex.rxjava2:rxjava:2.2.21")
}
