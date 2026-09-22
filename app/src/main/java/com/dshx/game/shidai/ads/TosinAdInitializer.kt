package com.dshx.game.shidai.ads

import android.app.Application

/**
 * Tosin 广告 SDK 初始化。
 *
 * 必须在用户同意隐私政策之后调用 —— 见 AdPrivacy / GameView 的首启隐私页。
 * 未配置 appId / 广告位时直接跳过（[AdSdkConfig.isConfigured]），
 * 让没有广告账号的调试包也能正常跑。
 */
object TosinAdInitializer {

    @Volatile
    var isSdkInitialized: Boolean = false
        private set

    @Volatile
    private var initializing = false

    /** 初始化 SDK；[onDone] 参数为是否可用。重复调用只会初始化一次。 */
    fun init(application: Application, onDone: (Boolean) -> Unit = {}) {
        if (isSdkInitialized) {
            onDone(true)
            return
        }
        if (!AdSdkConfig.isConfigured) {
            onDone(false)
            return
        }
        if (initializing) {
            onDone(false)
            return
        }
        initializing = true
        try {
            with(application) {
                val config = com.tosin.sdk.initsdk.init.TosinInitConfig.Builder()
                    .appId(AdSdkConfig.appId)
                    .isDebug(AdSdkConfig.isDebug)
                    // 隐私合规：关掉敏感信息采集（TapTap 审核点名的就是 IMEI）
                    .customController(object : com.tosin.sdk.initsdk.init.CustomController() {
                        override fun canUsePhoneState(): Boolean = false
                        override fun canUseMacAddress(): Boolean = false
                        override fun canReadLocation(): Boolean = false
                        override fun canGetInstallPackages(): Boolean = false
                        override fun canUsePermissionRecordAudio(): Boolean = false
                        override fun canUseOaid(): Boolean = true
                        override fun canUseAndroidId(): Boolean = true
                        override fun canUseWifiState(): Boolean = true
                    })
                    .build()

                com.tosin.sdk.initsdk.init.TosinSDK.instance.init(
                    this,
                    config,
                    object : com.tosin.sdk.initsdk.init.InitListener {
                        override fun onInitSuccess() {
                            isSdkInitialized = true
                            initializing = false
                            onDone(true)
                        }

                        override fun onInitFail(fail: String?) {
                            initializing = false
                            onDone(false)
                        }
                    }
                )
            }
        } catch (t: Throwable) {
            initializing = false
            onDone(false)
        }
    }
}
