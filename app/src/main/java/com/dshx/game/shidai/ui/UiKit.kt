package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint

/**
 * 统一版面度量。所有页面共用同一套安全区与行高，避免各写各的坐标导致重叠。
 *
 *  0                      ← 屏幕顶
 *  ┌────────────────────┐
 *  │ 标题栏 HEADER      │  0 .. 96
 *  ├────────────────────┤
 *  │ 可滚动内容区        │  CONTENT_TOP .. contentBottom
 *  │  (自动裁剪+滚动)    │
 *  ├────────────────────┤
 *  │ 底部操作区 FOOTER   │  h-96 .. h
 *  └────────────────────┘
 */
object UiKit {
    const val MARGIN = 20f          // 左右安全边距
    const val HEADER = 96f          // 标题栏高度
    const val CONTENT_TOP = 118f    // 内容起始 Y
    const val FOOTER = 96f          // 底部保留高度
    const val ROW_SMALL = 46f
    const val ROW_MED = 62f
    const val ROW_LARGE = 92f
    const val GAP = 8f
    const val RADIUS = 12f
}

/** 内容区底部（不含底部操作区）。 */
internal fun GameView.contentBottom(): Float = h - UiKit.FOOTER

/** 内容区宽度。 */
internal fun GameView.contentW(): Float = w - UiKit.MARGIN * 2f

/** 开始一个可滚动内容区：裁剪并返回起始 y。 */
internal fun GameView.beginScroll(c: Canvas, top: Float = UiKit.CONTENT_TOP, bottom: Float = contentBottom()): Float {
    scrollTopY = top
    scrollBottomY = bottom
    c.save()
    c.clipRect(0f, top, w, bottom)
    // 同步登记到 hit 系统：滚出可视区的控件不再可点
    setHitClip(top, bottom)
    screenScrollMax = 0f
    return top - screenScroll
}

/** 结束滚动区并绘制滚动条。 */
internal fun GameView.endScroll(c: Canvas, contentEndY: Float) {
    screenScrollMax = (contentEndY + screenScroll - scrollBottomY).coerceAtLeast(0f)
    screenScroll = screenScroll.coerceIn(0f, screenScrollMax)
    c.restore()
    clearHitClip()
    if (screenScrollMax > 2f) {
        val viewH = scrollBottomY - scrollTopY
        val frac = viewH / (viewH + screenScrollMax)
        val barH = (viewH * frac).coerceAtLeast(28f)
        val barY = scrollTopY + (viewH - barH) * (screenScroll / screenScrollMax)
        r.solid(c, w - 10f, scrollTopY + 4f, 3.5f, viewH - 8f, 1.75f, r.withAlpha(Palette.BORDER_SOFT, 140))
        r.solid(c, w - 10f, barY, 3.5f, barH, 1.75f, Palette.CYAN)
    }
}

/** 区块标题。返回下一行 Y。 */
internal fun GameView.sectionHeader(c: Canvas, text: String, y: Float, accent: Int = Palette.CYAN): Float {
    r.text(c, text, UiKit.MARGIN, y + r.lh(14f), 14f, accent, true)
    r.solid(c, UiKit.MARGIN, y + r.lh(20f), 26f, 2f, 1f, r.withAlpha(accent, 200))
    return y + r.lh(30f)
}

/** 空状态。 */
internal fun GameView.emptyState(c: Canvas, text: String, hint: String, y: Float) {
    r.text(c, text, w / 2f, y + r.lh(40f), 15f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
    if (hint.isNotEmpty()) {
        r.wrap(c, hint, UiKit.MARGIN + 20f, y + r.lh(66f), contentW() - 40f, 12f, Palette.TEXT_DIM, 18f)
    }
}

/** 带进度条的一行成就/图鉴条目。返回下一行 Y。 */
internal fun GameView.progressRow(
    c: Canvas, title: String, desc: String, cur: Int, target: Int,
    rightTop: String, rightBottom: String, accent: Int, y: Float, done: Boolean
): Float {
    val hRow = r.lh(62f)
    card(c, UiKit.MARGIN, y, contentW(), hRow, if (done) Palette.GOLD else Palette.BORDER_SOFT, UiKit.RADIUS)
    r.text(c, title, UiKit.MARGIN + 14f, y + r.lh(24f), 13.5f, if (done) Palette.GOLD else Palette.TEXT, true)
    r.text(c, desc, UiKit.MARGIN + 14f, y + r.lh(43f), 10.5f, Palette.TEXT_DIM)
    if (rightTop.isNotEmpty()) r.text(c, rightTop, w - UiKit.MARGIN - 14f, y + r.lh(24f), 11.5f, accent, true, Paint.Align.RIGHT)
    if (rightBottom.isNotEmpty()) r.text(c, rightBottom, w - UiKit.MARGIN - 14f, y + r.lh(50f), 10f, Palette.CYAN, false, Paint.Align.RIGHT)
    if (target > 1) {
        r.bar(c, UiKit.MARGIN + 14f, y + r.lh(50f), contentW() - 100f, 6f, cur.toFloat() / target, Palette.CYAN, Palette.EN_B, 0x55000000)
    }
    return y + hRow + UiKit.GAP
}

/** 底部操作按钮（固定在安全区内）。 */
internal fun GameView.footerButton(c: Canvas, id: String, label: String, accent: Int, sub: String? = null) {
    button(c, id, label, UiKit.MARGIN + 14f, h - UiKit.FOOTER + 22f, contentW() - 28f, 52f, accent, true, sub)
}
