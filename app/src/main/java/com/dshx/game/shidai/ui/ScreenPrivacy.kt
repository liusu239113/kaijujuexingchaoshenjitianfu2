package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.ads.AdPrivacy

/**
 * 首启隐私政策同意页。
 *
 * 合规红线：**用户点「同意」之前不初始化任何广告 SDK**，也不读取设备标识。
 * 视觉沿用本游戏自己的面板风格（玻璃卡片 + 霓虹描边 + PixelForge 按钮）。
 */
internal fun GameView.drawPrivacyGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 248))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.09f
    val boxH = h * 0.82f
    card(c, 22f, top, w - 44f, boxH, r.withAlpha(Palette.CYAN, 220), 20f)

    r.text(c, "隐 私 政 策", w / 2f, top + 42f, 22f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "《穿越星塔：全民登临时代》", w / 2f, top + 66f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    r.solid(c, 44f, top + 78f, w - 88f, 1.5f, 1f, r.withAlpha(Palette.BORDER_SOFT, 200))

    val sections = listOf(
        "一、数据存储" to "游戏存档、成就与设置只保存在本机，不上传服务器。",
        "二、广告与设备标识" to "为展示激励视频广告，广告 SDK 会读取设备标识（OAID / AndroidID）与网络状态，用于广告投放与统计。",
        "三、我们关掉的采集" to "已关闭 IMEI、MAC 地址、定位、已安装应用列表、录音等敏感信息采集。",
        "四、第三方广告平台" to "Tosin / TopOn 聚合广告及其合作平台（穿山甲、优量汇、快手、百度、Sigmob 等）。",
        "五、您的选择" to "不同意不会初始化广告 SDK，也不会读取任何设备标识；可随时在「关于与隐私」中查看完整政策。"
    )
    var y = top + 100f
    val limit = top + boxH - 232f
    for ((title, body) in sections) {
        if (y > limit) break
        r.text(c, title, 42f, y, 12.5f, Palette.GOLD, true)
        y += 17f
        y = r.wrap(c, body, 42f, y, w - 84f, 11.5f, Palette.TEXT_DIM, 16f) + 9f
    }

    // 个性化广告开关（默认关闭：合规更稳，关闭仍会展示广告）
    val tgY = top + boxH - 216f
    card(c, 40f, tgY, w - 80f, 46f, r.withAlpha(Palette.BORDER, 190), 12f)
    r.text(c, "允许个性化广告推荐", 54f, tgY + 28f, 12f, Palette.TEXT)
    val swX = w - 40f - 62f
    val on = privacyPersonalized
    r.panel(c, swX, tgY + 12f, 46f, 22f, 11f,
        if (on) Palette.GREEN else Palette.PANEL_DEEP,
        if (on) Palette.GREEN else Palette.PANEL_DEEP, null)
    r.solid(c, if (on) swX + 26f else swX + 2f, tgY + 14f, 18f, 18f, 9f, Palette.TEXT)
    hit("priv_toggle", 40f, tgY, w - 80f, 46f)
    r.text(c, "关闭后仍会展示广告，只是不按兴趣推荐", 42f, tgY + 64f, 10f, Palette.TEXT_FAINT)

    button(c, "priv_accept", "同 意 并 继 续", 40f, top + boxH - 142f, w - 80f, 50f, Palette.PINK)
    ghostButton(c, "priv_policy", "查看完整《隐私政策》", 40f, top + boxH - 88f, w - 80f, 42f, Palette.CYAN)
    ghostButton(c, "priv_decline", "不 同 意（退出游戏）", 40f, top + boxH - 40f, w - 80f, 32f, Palette.TEXT_FAINT)
}

/**
 * 激励视频加载浮层。
 * 广告 SDK 从 load 到真正播放有一段时间（弱网下更久），
 * 没有反馈玩家会以为「点了没反应」而反复点。
 */
internal fun GameView.drawAdLoadingOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 150))
    hit("modal_block", 0f, 0f, w, h)
    val boxW = w - 160f
    val x = 80f
    val y = h / 2f - 56f
    card(c, x, y, boxW, 112f, r.withAlpha(Palette.CYAN, 220), 16f)
    r.text(c, "广 告 加 载 中", w / 2f, y + 44f, 16f, Palette.CYAN, true, Paint.Align.CENTER)
    // 三个呼吸点，和主界面的呼吸提示同一套观感
    val t = r.pctPulse
    for (i in 0 until 3) {
        val a = (0.35f + 0.65f * kotlin.math.abs(kotlin.math.sin((t + i * 0.22f) * 3.14f)))
        r.solid(c, w / 2f - 18f + i * 18f, y + 68f, 10f, 10f, 5f, r.withAlpha(Palette.CYAN, (a * 255).toInt()))
    }
    // 超过 8 秒仍未回调：明确告知没有填充，别让玩家干等
    if (time - adLoadingSince > 8f) {
        r.text(c, "暂时没有广告填充，稍后再试", w / 2f, y + 100f, 11f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    }
}

internal fun GameView.tapPrivacy(id: String) {
    when (id) {
        "priv_toggle" -> privacyPersonalized = !privacyPersonalized
        "priv_policy" -> AdPrivacy.openPolicy(context)
        "priv_accept" -> {
            AdPrivacy.accept(context, privacyPersonalized)
            privacyGate = false
            // 同意之后才初始化广告 SDK
            setupAds()
            audio.play("unlock")
            showToast("已同意隐私政策，广告将在需要时展示")
        }
        "priv_decline" -> (context as? android.app.Activity)?.finish()
    }
}
