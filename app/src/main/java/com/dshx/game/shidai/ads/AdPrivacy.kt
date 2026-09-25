package com.dshx.game.shidai.ads

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * 隐私合规状态。
 *
 * 与游戏存档分开存（同意与否是整机级别的，不属于某个存档槽）。
 * 合规红线：**用户同意之前不初始化任何广告 SDK**，也不读取任何设备标识。
 */
object AdPrivacy {

    private const val PREF = "shidai_privacy"
    private const val KEY_ACCEPTED = "privacy_accepted"
    private const val KEY_PERSONALIZED = "personalized_ad"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    /** 是否已同意隐私政策。 */
    fun isAccepted(ctx: Context): Boolean = prefs(ctx).getBoolean(KEY_ACCEPTED, false)

    /** 是否允许个性化广告（默认关闭，合规更稳）。 */
    fun personalizedEnabled(ctx: Context): Boolean = prefs(ctx).getBoolean(KEY_PERSONALIZED, false)

    fun accept(ctx: Context, personalized: Boolean) {
        prefs(ctx).edit().putBoolean(KEY_ACCEPTED, true).putBoolean(KEY_PERSONALIZED, personalized).commit()
    }

    fun setPersonalized(ctx: Context, on: Boolean) {
        prefs(ctx).edit().putBoolean(KEY_PERSONALIZED, on).apply()
    }

    /** 撤销同意（设定里可调用；撤销后广告 SDK 应停止使用）。 */
    fun revoke(ctx: Context) {
        prefs(ctx).edit().remove(KEY_ACCEPTED).apply()
    }

    /** 用外部浏览器打开隐私政策链接。 */
    fun openPolicy(ctx: Context) {
        try {
            val i = Intent(Intent.ACTION_VIEW, Uri.parse(AdSdkConfig.privacyPolicyUrl))
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(i)
        } catch (t: Throwable) {
            // 没有浏览器等情况：静默失败，不影响游戏
        }
    }
}
