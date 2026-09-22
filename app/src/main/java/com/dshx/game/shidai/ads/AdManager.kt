package com.dshx.game.shidai.ads

import android.app.Activity

/**
 * 激励视频广告管理（单例）。
 *
 * 对外只暴露 [showRewardVideo]：内部负责「加载 → 展示 → 回调是否发奖」。
 * 游戏侧通过 RewardAds.install 注入到这里，业务代码不直接依赖 SDK。
 */
class AdManager private constructor() {

    companion object {
        @Volatile
        private var instance: AdManager? = null

        fun getInstance(): AdManager = instance ?: synchronized(this) {
            instance ?: AdManager().also { instance = it }
        }
    }

    private var rewardVideoAd: com.tosin.sdk.loadAd.rewardvideo.RewardVideoAd? = null

    /** 当前是否具备展示条件（SDK 已初始化 + 广告位已配置）。 */
    fun isReady(): Boolean = TosinAdInitializer.isSdkInitialized && AdSdkConfig.rewardVideoId.isNotEmpty()

    /**
     * 加载并展示一条激励视频。无论成功失败，[onResult] 都会被调用一次：
     * true = 看完并满足发奖条件；false = 加载失败 / 中途关闭 / 未配置。
     */
    fun showRewardVideo(activity: Activity, onResult: (Boolean) -> Unit) {
        if (!isReady()) {
            onResult(false)
            return
        }
        try {
            rewardVideoAd?.destory()
            rewardVideoAd = null

            val ad = com.tosin.sdk.loadAd.rewardvideo.RewardVideoAd(
                activity,
                com.tosin.sdk.loadAd.rewardvideo.config.RewardVideoConfig.Builder()
                    .codeId(AdSdkConfig.rewardVideoId)
                    .build()
            )
            rewardVideoAd = ad

            var rewarded = false
            var finished = false
            fun finish(ok: Boolean) {
                if (finished) return
                finished = true
                onResult(ok)
            }

            ad.loadRewardVideo(object : com.tosin.sdk.loadAd.rewardvideo.RewardVideoListener {
                override fun onRewardVerify() {
                    rewarded = true
                }

                override fun onVideoComplete() {}

                override fun onAdClose() {
                    finish(rewarded)
                }

                override fun onExposure() {}

                override fun onADShowError(fail: String) {
                    finish(false)
                }

                override fun onADShow() {}

                override fun onLoadSuccess() {
                    ad.showAd(activity)
                }

                override fun onLoadFail(adError: com.tosin.sdk.loadAd.model.AdError?) {
                    finish(false)
                }

                override fun onADClick() {}
            })
        } catch (t: Throwable) {
            onResult(false)
        }
    }

    fun destroy() {
        try {
            rewardVideoAd?.destory()
        } catch (t: Throwable) {
        }
        rewardVideoAd = null
    }
}
