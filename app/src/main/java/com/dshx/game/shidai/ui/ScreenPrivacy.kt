package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.ads.AdPrivacy
import com.dshx.game.shidai.ads.AdSdkConfig

/**
 * 首启隐私政策同意页。
 *
 * 合规红线：**用户点「同意」之前不初始化任何 SDK**（TapTap 登录/防沉迷、广告），
 * 也不读取任何设备标识。「同意」之后才依次启动广告 SDK 与 TapTap SDK。
 *
 * 文案与参考项目 school2-v2 的 PrivacyPolicyDialog 对齐：逐条列出收集的信息、
 * 使用目的、第三方 SDK 及其获取的字段；视觉沿用本游戏的玻璃卡片 + 霓虹描边。
 */
internal fun GameView.drawPrivacyGateOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 252))
    hit("modal_block", 0f, 0f, w, h)

    val top = h * 0.045f
    val boxH = h * 0.91f
    card(c, 14f, top, w - 28f, boxH, r.withAlpha(Palette.CYAN, 220), 20f)

    r.text(c, "隐 私 政 策 与 用 户 协 议", w / 2f, top + 38f, 18.5f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "《穿越星塔：全民登临时代》", w / 2f, top + 59f, 10.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    r.solid(c, 32f, top + 70f, w - 64f, 1.5f, 1f, r.withAlpha(Palette.BORDER_SOFT, 200))

    // ---- 正文滚动区 ----
    val contentTop = top + 82f
    val bottomBlock = 140f                    // 底部固定区（查看政策 + 两个按钮）
    val contentBottom = top + boxH - bottomBlock

    c.save()
    c.clipRect(0f, contentTop, w, contentBottom)
    setHitClip(contentTop, contentBottom)

    var y = contentTop - privacyScroll
    r.text(c, "欢迎使用《穿越星塔：全民登临时代》！", 28f, y + 12f, 11.5f, Palette.TEXT, true)
    y += 22f
    y = r.wrap(
        c,
        "为保障您的权益，在使用本应用前，请您仔细阅读并同意以下条款：",
        28f, y, w - 56f, 11f, Palette.TEXT_DIM, 16f
    ) + 10f

    y = privacySection(c, "一、我们收集的信息", listOf(
        "设备型号、操作系统版本（用于适配和优化）",
        "设备标识符（用于广告展示和数据统计）",
        "广告标识符 OAID（本游戏为展示广告与统计广告效果而获取）",
        "网络类型（WiFi/移动数据，用于广告加载）",
        "游戏存档数据（仅存储在本地设备，不上传服务器）",
        "应用崩溃日志（用于定位与修复问题）"
    ), y)

    y = privacySection(c, "二、信息使用目的", listOf(
        "提供游戏服务、保存游戏进度",
        "展示广告以支持游戏免费运营",
        "优化应用性能、修复线上问题"
    ), y)

    y = privacySection(c, "三、第三方 SDK 及其收集的信息", listOf(
        "TapTap 登录 SDK：获取 AndroidID，用于账号登录与身份鉴权",
        "TapTap 防沉迷 SDK：获取实名认证信息，用于未成年人保护（法定要求）",
        "Tosin / TopOn 聚合广告 SDK：获取 OAID、AndroidID、WiFi 状态，用于广告展示与投放、反作弊与安全风控",
        "穿山甲 / 优量汇 / 快手 / 百度 / Sigmob 等广告平台（经聚合 SDK 调用）：获取 OAID、设备 IP，用于广告展示、效果归因与数据统计"
    ), y)

    y = privacySection(c, "四、我们已关闭的采集", listOf(
        "本游戏已关闭 IMEI、MAC 地址、定位、已安装应用列表、录音等敏感信息的采集；",
        "不申请「读取手机状态」「读写外部存储」「定位」「读取应用列表」等敏感权限。"
    ), y)

    y = privacySection(c, "五、您的权利", listOf(
        "您可以随时在「关于与隐私」中查看完整政策；",
        "不同意不会初始化任何 SDK，也不会读取任何设备标识；",
        "点击下方「不同意并退出」将直接退出游戏。"
    ), y)

    val contentEndY = y
    c.restore()
    clearHitClip()

    // 滚动位置与滚动条（与 UiKit.endScroll 同一套观感）
    privacyScrollMax = (contentEndY + privacyScroll - contentBottom).coerceAtLeast(0f)
    privacyScroll = privacyScroll.coerceIn(0f, privacyScrollMax)
    if (privacyScrollMax > 2f) {
        val viewH = contentBottom - contentTop
        val frac = viewH / (viewH + privacyScrollMax)
        val barH = (viewH * frac).coerceAtLeast(28f)
        val barY = contentTop + (viewH - barH) * (privacyScroll / privacyScrollMax)
        r.solid(c, w - 20f, contentTop + 4f, 3.5f, viewH - 8f, 1.75f, r.withAlpha(Palette.BORDER_SOFT, 140))
        r.solid(c, w - 20f, barY, 3.5f, barH, 1.75f, Palette.CYAN)
    }
    if (privacyScrollMax > 2f && privacyScroll < 8f) {
        r.text(c, "▾ 上滑查看完整条款", w / 2f, contentBottom - 6f, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
    }

    // ---- 底部固定区 ----
    // 与参考项目 school2-v2 的 PrivacyPolicyDialog 保持一致：
    // 只有「查看完整政策 / 不同意并退出 / 同意并继续」三个入口，
    // 没有个性化广告之类的额外开关。
    val tgY = contentBottom + 12f
    val halfW = (w - 62f) / 2f
    ghostButton(c, "priv_policy", "查看完整《隐私政策》", 26f, tgY, w - 52f, 36f, Palette.CYAN)
    button(c, "priv_decline", "不同意并退出", 26f, tgY + 46f, halfW, 46f, Palette.TEXT_FAINT)
    button(c, "priv_accept", "同意并继续", 26f + halfW + 10f, tgY + 46f, halfW, 46f, Palette.PINK)
}

/** 隐私条款的一节：金色小标题 + 逐条正文。返回下一节起始 Y。 */
private fun GameView.privacySection(c: Canvas, title: String, items: List<String>, yIn: Float): Float {
    var y = yIn
    r.text(c, title, 28f, y + 12f, 12.5f, Palette.GOLD, true)
    y += 20f
    for (item in items) {
        r.text(c, "·", 30f, y + 11f, 11f, Palette.CYAN)
        y = r.wrap(c, item, 42f, y + 11f, w - 72f, 11f, Palette.TEXT_DIM, 16f) + 5f
    }
    return y + 8f
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
        "priv_policy" -> AdPrivacy.openPolicy(context)
        "priv_accept" -> {
            // 与参考项目一致：同意即写入接受状态，不再单独询问个性化广告。
            AdPrivacy.accept(context, true)
            privacyGate = false
            privacyScroll = 0f
            privacyScrollMax = 0f
            // 同意之后才初始化 SDK：先广告，再 TapTap 登录 + 防沉迷。
            // 这里必须同时调 setupTap() —— 漏掉它会让首启玩家永远进不了
            // 登录页、防沉迷也永远不跑（登录/合规形同虚设）。
            setupAds()
            setupTap()
            audio.play("unlock")
            showToast("已同意隐私政策")
        }
        "priv_decline" -> (context as? android.app.Activity)?.finishAffinity()
    }
}
