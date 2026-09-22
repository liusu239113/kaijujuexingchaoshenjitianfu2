package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.tap.TapHelper

/**
 * 登录闸门 + 防沉迷拦截页。
 *
 * 三层门控（与参考项目 school2-v2 一致，顺序不可换）：
 *   隐私政策 -> TapTap 登录 -> 防沉迷认证
 * 只有防沉迷回调 LOGIN_SUCCESS(500) 才会解除门控进入游戏。
 * 视觉沿用本游戏自己的风格：玻璃卡片 + 霓虹描边。
 */

/** 第一层：TapTap 登录页。 */
internal fun GameView.drawLoginGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 246))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.22f
    val boxH = h * 0.54f
    card(c, 24f, top, w - 48f, boxH, r.withAlpha(Palette.CYAN, 220), 20f)
    r.text(c, "穿 越 星 塔", w / 2f, top + 52f, 26f, Palette.TEXT, true, Paint.Align.CENTER)
    r.text(c, "全 民 登 临 时 代", w / 2f, top + 80f, 14f, Palette.PINK, true, Paint.Align.CENTER)
    r.text(c, "登录后可同步防沉迷状态、参与排行", w / 2f, top + 116f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    button(c, "tap_login", if (loginBusy) "登 录 中…" else "TapTap 登 录", 44f, top + boxH - 168f, w - 88f, 54f, Palette.PINK)
    ghostButton(c, "tap_retry", "已登录过？重新校验防沉迷", 44f, top + boxH - 104f, w - 88f, 44f, Palette.CYAN)
    r.text(c, "未成年人将按国家规定限制游戏时段与时长", w / 2f, top + boxH - 46f, 10.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)

    if (loginMsg.isNotEmpty()) {
        r.text(c, loginMsg, w / 2f, top + boxH + 34f, 12f, Palette.GOLD, false, Paint.Align.CENTER)
    }
}

/**
 * 第二层：防沉迷校验中（中性提示）。
 * 校验期间同样阻断游戏 —— 不通过就不放行，避免校验窗口期可以玩。
 */
internal fun GameView.drawComplianceCheckingOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 246))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.34f
    val boxH = h * 0.28f
    card(c, 24f, top, w - 48f, boxH, r.withAlpha(Palette.CYAN, 220), 20f)
    r.text(c, "健 康 系 统 校 验 中", w / 2f, top + 48f, 18f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "正在向防沉迷服务确认账号状态", w / 2f, top + 78f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    // 三个呼吸点，和广告加载浮层同一套观感
    val t = r.pctPulse
    for (i in 0 until 3) {
        val a = (0.35f + 0.65f * kotlin.math.abs(kotlin.math.sin((t + i * 0.22f) * 3.14f)))
        r.solid(c, w / 2f - 18f + i * 18f, top + boxH - 62f, 10f, 10f, 5f, r.withAlpha(Palette.CYAN, (a * 255).toInt()))
    }
    r.text(c, "校验未通过前无法进入游戏", w / 2f, top + boxH - 28f, 10.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
}

/**
 * 第三层：防沉迷拦截页（宵禁 / 时长上限 / 年龄限制 / 实名未完成 / 网络异常）。
 *
 * 这里**没有任何可以就地解除拦截的按钮**：
 * 「重新校验」只是重新发起一次认证，拦截状态保持到 SDK 回调为止；
 * 「切换账号」会退出当前账号回到登录页。
 */
internal fun GameView.drawComplianceGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 250))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.24f
    val boxH = h * 0.50f
    card(c, 24f, top, w - 48f, boxH, r.withAlpha(Palette.RED, 210), 20f)
    r.text(c, "健 康 游 戏 提 示", w / 2f, top + 48f, 21f, Palette.RED, true, Paint.Align.CENTER)
    r.solid(c, 44f, top + 64f, w - 88f, 1.5f, 1f, r.withAlpha(Palette.BORDER_SOFT, 200))
    r.wrap(c, complianceMsg, 46f, top + 96f, w - 92f, 13f, Palette.TEXT, 20f)
    r.text(c, "本游戏严格遵守国家关于未成年人游戏时段与时长的规定", w / 2f, top + boxH - 96f, 10f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    ghostButton(c, "tap_retry", "重 新 校 验", 44f, top + boxH - 78f, w - 88f, 44f, Palette.CYAN)
    ghostButton(c, "tap_switch", "切 换 账 号", 44f, top + boxH - 28f, w - 88f, 34f, Palette.TEXT_FAINT)
}

internal fun GameView.tapLoginGate(id: String) {
    when (id) {
        "tap_login" -> {
            val act = context as? android.app.Activity ?: return
            if (loginBusy) return
            loginBusy = true
            loginMsg = "正在拉起 TapTap…"
            TapHelper.login(act) { _ok, msg ->
                post {
                    loginBusy = false
                    loginMsg = msg
                    // 登录成功也不能在这里放行：登录态变化由 onLoginChanged 处理，
                    // 放行必须等防沉迷回调的 LOGIN_SUCCESS(500)。
                }
            }
        }
        // 重新校验：只重新发起认证，拦截状态保持到 SDK 回调为止
        "tap_retry" -> {
            val act = context as? android.app.Activity ?: return
            val uid = TapHelper.currentOpenId() ?: TapHelper.savedOpenId(context)
            if (uid.isNullOrEmpty()) {
                // 本地没有登录记录：回登录页
                complianceChecking = false
                complianceBlocked = false
                complianceMsg = ""
                loginGate = true
            } else {
                loginMsg = "正在重新校验…"
                startComplianceCheck(act, uid)
            }
        }
        // 切换账号：退出当前账号，回登录页重新登
        "tap_switch" -> {
            TapHelper.logout(context)
            loginBusy = false
            loginMsg = ""
            complianceChecking = false
            complianceBlocked = false
            complianceMsg = ""
            loginGate = true
        }
    }
}
