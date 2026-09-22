package com.dshx.game.shidai.game

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
    private var handler: ((String, (Boolean) -> kotlin.Unit) -> kotlin.Unit)? = null

    /**
     * 广告是否真的可用（SDK 初始化成功 + 广告位已配置）。
     * 由接入方在初始化回调里设置；不设置时 UI 一律显示「接入中」。
     */
    @Volatile
    var available: Boolean = false

    fun isReady(): Boolean = handler != null && available

    fun install(impl: (String, (Boolean) -> kotlin.Unit) -> kotlin.Unit) {
        handler = impl
    }

    /** 请求播放一条激励视频；[onResult] 参数为「是否发奖」。未接入时立即回调 false。 */
    fun request(placement: String, onResult: (Boolean) -> kotlin.Unit) {
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

    /** 广告位用途。同一个激励视频位可复用，这里按用途分开统计。 */
    const val PLACEMENT_PET_TICKET = "pet_ticket"
    const val PLACEMENT_CLASS_UNLOCK = "class_unlock"
    const val PLACEMENT_EXTRA_TALENT = "extra_talent"
    const val PLACEMENT_REVIVE = "revive"
    const val PLACEMENT_DOUBLE_REWARD = "double_reward"
    const val PLACEMENT_SHOP_REFRESH = "shop_refresh"
    const val PLACEMENT_TAVERN_REFRESH = "tavern_refresh"
    const val PLACEMENT_HEAL = "heal"
    const val PLACEMENT_REINC_DOUBLE = "reinc_double"
}
