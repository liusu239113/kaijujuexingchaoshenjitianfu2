package com.dshx.game.shidai.ads

/**
 * TapTap SDK 凭据（登录 + 防沉迷）。
 *
 * 目前只落配置：等确认了防沉迷参数后，在 TapSdkInitializer 里初始化
 * （参考项目 school2-v2 的做法：隐私政策同意之后再 init）。
 */
object TapSdkConfig {

    /** TapTap 开发者后台的 client id。 */
    const val CLIENT_ID: String = "2i9yqjd9kk4ncfpcjg"

    /** TapTap 开发者后台的 client token。 */
    const val CLIENT_TOKEN: String = "Mgrdj0hXQmUkMrQDBCeRzCgvqW9kksu6wMfRWAOw"
}
