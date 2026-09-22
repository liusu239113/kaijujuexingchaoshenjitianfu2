package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.tap.TapHelper

/**
 * 登录闸门 + 防沉迷拦截页。
 *
 * 视觉沿用本游戏自己的风格：玻璃卡片 + 霓虹描边。
 * 防沉迷被拦时（未成年人时段 / 时长上限 / 实名未通过）只显示说明与重试，
 * 不进入游戏 —— 这是上架合规的硬要求。
 */
internal fun GameView.drawLoginGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 244))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.22f
    val boxH = h * 0.52f
    card(c, 24f, top, w - 48f, boxH, r.withAlpha(Palette.CYAN, 220), 20f)
    r.text(c, "穿 越 星 塔", w / 2f, top + 52f, 26f, Palette.TEXT, true, Paint.Align.CENTER)
    r.text(c, "全 民 登 临 时 代", w / 2f, top + 80f, 14f, Palette.PINK, true, Paint.Align.CENTER)
    r.text(c, "登录后可同步防沉迷状态、参与排行", w / 2f, top + 116f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    button(c, "tap_login", if (loginBusy) "登 录 中…" else "TapTap 登 录", 44f, top + boxH - 168f, w - 88f, 54f, Palette.PINK)
    ghostButton(c, "tap_retry", "重 试 防 沉 迷 校 验", 44f, top + boxH - 104f, w - 88f, 44f, Palette.CYAN)
    r.text(c, "未成年人将按国家规定限制游戏时段与时长", w / 2f, top + boxH - 46f, 10.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)

    if (loginMsg.isNotEmpty()) {
        r.text(c, loginMsg, w / 2f, top + boxH + 34f, 12f, Palette.GOLD, false, Paint.Align.CENTER)
    }
}

/** 防沉迷拦截页：只有说明 + 重试 / 切换账号，没有入口能绕过。 */
internal fun GameView.drawComplianceGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 250))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.26f
    val boxH = h * 0.44f
    card(c, 24f, top, w - 48f, boxH, r.withAlpha(Palette.RED, 210), 20f)
    r.text(c, "健 康 游 戏 提 示", w / 2f, top + 48f, 21f, Palette.RED, true, Paint.Align.CENTER)
    r.solid(c, 44f, top + 64f, w - 88f, 1.5f, 1f, r.withAlpha(Palette.BORDER_SOFT, 200))
    r.wrap(c, complianceMsg, 46f, top + 96f, w - 92f, 13f, Palette.TEXT, 20f)
    r.text(c, "如需继续游戏，请稍后再试或切换账号", w / 2f, top + boxH - 92f, 11f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    ghostButton(c, "tap_retry", "重 试 / 切 换 账 号", 44f, top + boxH - 74f, w - 88f, 48f, Palette.CYAN)
}

internal fun GameView.tapLoginGate(id: String) {
    when (id) {
        "tap_login" -> {
            val act = context as? android.app.Activity ?: return
            if (loginBusy) return
            loginBusy = true
            loginMsg = "正在拉起 TapTap…"
            TapHelper.login(act) { ok2, msg ->
                post {
                    loginBusy = false
                    loginMsg = msg
                    if (ok2) {
                        loginGate = false
                        complianceBlocked = false
                        showToast("登录成功")
                    }
                }
            }
        }
        "tap_retry" -> {
            val act = context as? android.app.Activity ?: return
            // 切换账号：清掉本地记录的 openId，回到登录页重新登
            TapHelper.startup(act, TapHelper.currentOpenId() ?: com.dshx.game.shidai.tap.TapHelper.savedOpenId(context) ?: "")
            complianceBlocked = false
            complianceMsg = ""
            if (TapHelper.currentOpenId() == null) loginGate = true
        }
    }
}
