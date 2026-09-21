package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint

/**
 * 剧情演出：全屏黑底 + 居中正文 + 点击任意处翻页。
 *
 * 刻意不画任何 HUD —— 玩家反馈要的就是「一进入全黑，中间是剧情在说话」。
 */
internal fun GameView.drawStoryScene(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, 0xFF000000.toInt())

    val pages = storyPages
    if (pages.isEmpty()) return
    val idx = storyPage.coerceIn(0, pages.size - 1)
    val a = (storyFade.coerceIn(0f, 1f) * 255f).toInt()

    // 正文：垂直居中偏上，留出底部提示的位置
    r.wrap(c, pages[idx], UiKit.MARGIN + 18f, h * 0.36f, contentW() - 36f, 15f,
        r.withAlpha(0xFFE8E2D6.toInt(), a), 31f)

    // 页码
    r.text(c, (idx + 1).toString() + " / " + pages.size, w / 2f, h - 72f, 11f,
        r.withAlpha(Palette.TEXT_FAINT, a), false, Paint.Align.CENTER)

    // 继续提示：呼吸闪烁，提示「这一屏是要点的」
    val pulse = 0.40f + 0.60f * r.pctPulse
    r.text(c, "点 击 继 续", w / 2f, h - 44f, 12.5f,
        r.withAlpha(Palette.CYAN, (pulse * a).toInt()), true, Paint.Align.CENTER)

    // 全屏热区：任意位置点击都翻页
    hit("sc_next", 0f, 0f, w, h)
}

internal fun GameView.tapStoryScene(id: String) {
    if (id == "sc_next") advanceStory()
}
