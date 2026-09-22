package com.dshx.game.shidai.ads

import android.app.Activity
import com.dshx.game.shidai.game.RewardAds

/**
 * 把广告 SDK 接到游戏侧的 [RewardAds] 接入位上。
 *
 * 游戏逻辑只认 RewardAds；以后换广告平台只需要改这一个文件。
 * 调用时机：**用户同意隐私政策之后**（合规要求，见 MainActivity）。
 */
object AdBridge {

    /** 用户同意隐私政策后调用：初始化 SDK，并把「播放激励视频」注入 RewardAds。 */
    fun setup(activity: Activity) {
        RewardAds.install { _, callback ->
            AdManager.getInstance().showRewardVideo(activity, callback)
        }
        TosinAdInitializer.init(activity.application) { ok ->
            // 初始化成功才把 available 置 true：UI 上「看广告得券」按钮据此显示可用/接入中
            RewardAds.available = ok && AdSdkConfig.rewardVideoId.isNotEmpty()
        }
    }

    /** 广告当前是否真的可用。 */
    fun isReady(): Boolean = RewardAds.available && AdManager.getInstance().isReady()
}
