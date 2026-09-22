package com.dshx.game.shidai.tap

import android.app.Activity
import android.content.Context
import com.taptap.sdk.compliance.TapTapCompliance
import com.taptap.sdk.compliance.TapTapComplianceCallback
import com.taptap.sdk.compliance.constants.ComplianceMessage
import com.taptap.sdk.compliance.option.TapTapComplianceOptions
import com.taptap.sdk.core.TapTapRegion
import com.taptap.sdk.core.TapTapSdk
import com.taptap.sdk.core.TapTapSdkOptions
import com.taptap.sdk.kit.internal.callback.TapTapCallback
import com.taptap.sdk.kit.internal.exception.TapTapException
import com.taptap.sdk.login.Scopes
import com.taptap.sdk.login.TapTapAccount
import com.taptap.sdk.login.TapTapLogin

/**
 * TapTap 登录 + 防沉迷（合规认证）。
 *
 * 时序（与参考项目一致）：
 *   隐私同意 → TapTapSdk.init → 登录 → TapTapCompliance.startup(userId)
 * 防沉迷回调里的结果决定玩家能不能继续玩（未成年人时段/时长限制会拦在门外）。
 *
 * 必须在**用户同意隐私政策之后**再调用 [init]。
 */
object TapHelper {

    /** 防沉迷/登录状态回调（可能在非主线程触发，调用方自己切主线程）。 */
    interface Listener {
        /** 防沉迷结果，code 见 ComplianceMessage。 */
        fun onCompliance(code: Int)

        /** 登录态变化（登录成功/退出/切换账号）。 */
        fun onLoginChanged(openId: String?)
    }

    private const val PREF = "shidai_tap"

    @Volatile
    var listener: Listener? = null

    @Volatile
    private var initialized = false

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    fun savedOpenId(ctx: Context): String? = prefs(ctx).getString("open_id", null)

    private fun saveOpenId(ctx: Context, openId: String?) {
        if (openId == null) prefs(ctx).edit().remove("open_id").apply()
        else prefs(ctx).edit().putString("open_id", openId).apply()
    }

    /** 初始化 SDK（幂等；隐私同意后才可调用）。 */
    @Synchronized
    fun init(context: Context) {
        if (initialized) return
        try {
            TapTapSdk.init(
                context.applicationContext,
                TapTapSdkOptions(
                    clientId = TapConfig.CLIENT_ID,
                    clientToken = TapConfig.CLIENT_TOKEN,
                    region = TapTapRegion.CN,
                    enableLog = false
                ),
                options = arrayOf(
                    TapTapComplianceOptions(
                        showSwitchAccount = true,
                        useAgeRange = false
                    )
                )
            )
            TapTapCompliance.registerComplianceCallback(
                callback = object : TapTapComplianceCallback {
                    override fun onComplianceResult(code: Int, extra: Map<String, Any>?) {
                        when (code) {
                            ComplianceMessage.SWITCH_ACCOUNT -> listener?.onLoginChanged(null)
                            ComplianceMessage.EXITED -> listener?.onLoginChanged(null)
                            ComplianceMessage.LOGIN_SUCCESS -> listener?.onLoginChanged(currentOpenId())
                        }
                        listener?.onCompliance(code)
                    }
                }
            )
            initialized = true
        } catch (t: Throwable) {
            initialized = false
        }
    }

    fun isInitialized(): Boolean = initialized

    /** 当前已登录账号的 openId（未登录为 null）。 */
    fun currentOpenId(): String? = try {
        TapTapLogin.getCurrentTapAccount()?.openId
    } catch (t: Throwable) {
        null
    }

    /**
     * 拉起 TapTap 登录。[onDone] 参数：(是否成功, 提示语)。
     * 回调在主线程。
     */
    fun login(activity: Activity, onDone: (Boolean, String) -> Unit) {
        try {
            TapTapLogin.loginWithScopes(
                activity,
                arrayOf(Scopes.SCOPE_PUBLIC_PROFILE),
                object : TapTapCallback<TapTapAccount> {
                    override fun onSuccess(result: TapTapAccount) {
                        val openId = result.openId
                        saveOpenId(activity, openId)
                        listener?.onLoginChanged(openId)
                        // 登录成功后立刻做防沉迷校验
                        startup(activity, openId ?: "")
                        onDone(true, "登录成功")
                    }

                    override fun onCancel() {
                        onDone(false, "登录已取消")
                    }

                    override fun onFail(exception: TapTapException) {
                        onDone(false, "登录失败：" + (exception.message ?: "未知错误"))
                    }
                }
            )
        } catch (t: Throwable) {
            // 设备未安装 TapTap 客户端等情况，SDK 内部可能直接抛异常
            onDone(false, "无法拉起 TapTap 登录（是否未安装客户端？）")
        }
    }

    /** 启动防沉迷（合规认证）。未登录时用本地存档的 openId，仍为空则跳过。 */
    fun startup(activity: Activity, userId: String) {
        if (userId.isBlank()) return
        try {
            TapTapCompliance.startup(activity, userId)
        } catch (t: Throwable) {
        }
    }
}
