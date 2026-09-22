package com.dshx.game.shidai.ui

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

    // 正文：垂直居中偏上，留出底部提示的位置。
    // 页长上限由可用高度反推：正文扩写后单页可能变长，超长页以「…」收尾，
    // 不会顶穿页码与「点击继续」。
    val bodyTop = h * 0.36f
    val bodyStep = 31f * r.fontScale
    val bodyLines = (((h - 138f) - bodyTop) / bodyStep).toInt().coerceAtLeast(3)
    r.wrapClamp(c, pages[idx], UiKit.MARGIN + 18f, bodyTop, contentW() - 36f, 15f,
        r.withAlpha(0xFFE8E2D6.toInt(), a), 31f, bodyLines)

    // 页码
    r.text(c, (idx + 1).toString() + " / " + pages.size, w / 2f, h - 72f, 11f,
        r.withAlpha(Palette.TEXT_FAINT, a), false, Paint.Align.CENTER)

    // 继续提示：呼吸闪烁，提示「这一屏是要点的」
    val pulse = 0.40f + 0.60f * r.pctPulse
    r.text(c, "点 击 继 续", w / 2f, h - 44f, 12.5f,
        r.withAlpha(Palette.CYAN, (pulse * a).toInt()), true, Paint.Align.CENTER)

    // 全屏热区必须先注册：hit 是「后注册者优先」，
    // 下面两个按钮晚于它注册，才能盖在热区上面被点到。
    hit("sc_next", 0f, 0f, w, h)

    // 淡入完成后才出现：正文扩到每章十余页后，逐页点击的成本太高
    if (a > 140) {
        ghostButton(c, "sc_skip", "跳 过", w - 84f, 22f, 64f, 34f, r.withAlpha(Palette.TEXT_DIM, a))
        if (idx > 0) {
            // 回看：误触翻过头时能退回上一页，不改变剧情进度
            ghostButton(c, "sc_prev", "上一页", UiKit.MARGIN, h - 56f, 78f, 34f, r.withAlpha(Palette.TEXT_DIM, a))
        }
    }
}

internal fun GameView.tapStoryScene(id: String) {
    when (id) {
        "sc_next" -> advanceStory()
        // 跳过：直接走完全部页，advanceStory 会把 screen 交还给 storyReturn
        "sc_skip" -> {
            storyPage = storyPages.size
            advanceStory()
        }
        "sc_prev" -> {
            if (storyPage > 0) {
                storyPage--
                storyFade = 0f
            }
        }
    }
}
