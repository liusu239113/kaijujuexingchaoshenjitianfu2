package com.kaiju.awaken.game

/**
 * 激励视频广告的接入位（占位）。
 *
 * 游戏侧只依赖这一个对象：等广告 SDK 接进来之后，在 SDK 初始化完成时调用
 * [install]，把「拉取并播放」的实现塞进来即可 —— UI 与发奖逻辑一行都不用改。
 * 未接入时 [isReady] 为 false，界面会显示「接入中」并给出替代获取途径，
 * 不会出现「点了没反应」。
 */
object RewardAds {

    /** 由广告 SDK 侧注入：参数是广告位用途，回调可能在非主线程触发。 */
    private var handler: ((String, (Boolean) -> Unit) -> Unit)? = null

    fun isReady(): Boolean = handler != null

    fun install(impl: (String, (Boolean) -> Unit) -> Unit) {
        handler = impl
    }

    /** 请求播放一条激励视频；[onResult] 参数为「是否发奖」。未接入时立即回调 false。 */
    fun request(placement: String, onResult: (Boolean) -> Unit) {
        val h = handler
        if (h == null) {
            onResult(false)
            return
        }
        try {
            h(placement, onResult)
        } catch (t: Throwable) {
            onResult(false)
        }
    }

    /** 广告位用途：看广告得宠缘券。 */
    const val PLACEMENT_PET_TICKET = "pet_ticket"
}
