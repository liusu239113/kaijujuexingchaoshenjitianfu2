package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Achievements
import com.kaiju.awaken.game.ArtIcon
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.RunService
import kotlin.math.min

/**
 * 通关结局演出。约 5 秒的分阶段动画，点任意处跳过。
 *  0.0–1.2s 星空粒子汇聚 + 黑幕淡出
 *  1.2–2.4s 标题「回廊重燃」放大 + 白闪
 *  2.4–3.6s 主角立绘与职阶徽记滑入
 *  3.6s+    战报与按钮淡入
 */
internal fun GameView.drawEndingScreen(c: Canvas) {
    val p = run ?: return
    val t = (time - endingStart).coerceAtLeast(0f)

    // ---- 0) 黑幕 ----
    val curtain = (1f - t / 1.0f).coerceIn(0f, 1f)
    if (curtain > 0f) {
        r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF000000.toInt(), (curtain * 255).toInt()))
    }

    // ---- 1) 汇聚粒子 ----
    if (t < 2.2f) {
        val k = (t / 2.2f).coerceIn(0f, 1f)
        val n = 24
        for (i in 0 until n) {
            val ang = (i.toFloat() / n) * 6.28318f + t * 0.8f
            val dist = (1f - k) * w * 0.9f + 20f
            val px = w / 2f + kotlin.math.cos(ang) * dist
            val py = h * 0.30f + kotlin.math.sin(ang) * dist * 0.7f
            r.fill.color = r.withAlpha(if (i % 2 == 0) Palette.CYAN else Palette.GOLD, (220 * (1f - k * 0.55f)).toInt())
            c.drawCircle(px, py, 2.5f + 3f * k, r.fill)
        }
    }

    // ---- 2) 标题 ----
    val titleK = ((t - 1.0f) / 1.0f).coerceIn(0f, 1f)
    if (titleK > 0f) {
        val a = (titleK * 255).toInt()
        // 白闪
        if (t in 1.0f..1.25f) {
            val fl = (1f - (t - 1.0f) / 0.25f).coerceIn(0f, 1f)
            r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFFFFFFFF.toInt(), (fl * 90).toInt()))
        }
        val size = 26f + 10f * (1f - titleK) * 2f
        r.text(c, "回 廊 重 燃", w / 2f, 104f, size, r.withAlpha(Palette.GOLD, a), true, Paint.Align.CENTER)
        r.text(c, p.mode.cn + " · 第 " + p.floor + " 层", w / 2f, 128f, 13f, r.withAlpha(Palette.CYAN, a), false, Paint.Align.CENTER)
        if (titleK >= 1f) {
            r.sparkle(c, w * 0.13f, 100f, 18f, Palette.GOLD)
            r.sparkle(c, w * 0.87f, 112f, 14f, Palette.CYAN)
        }
    }

    // ---- 3) 主体卡 ----
    // 主体（卡片 + 成就列表）在矮屏或大字号下会顶到底部操作区，
    // 因此整块放进裁剪区：装不下时可直接上下拖动查看。
    val bodyTop = 144f
    val bodyBottom = h - 176f
    val bodyK = ((t - 2.2f) / 1.2f).coerceIn(0f, 1f)
    if (bodyK > 0f) {
        val a = (bodyK * 255).toInt()
        val slide = (1f - bodyK) * 40f
        val scrolled = beginScroll(c, bodyTop, bodyBottom)
        var y = scrolled + (168f - bodyTop) + slide
        card(c, 26f, y, w - 52f, 186f, r.withAlpha(Palette.GOLD, a), 0f)

        val hero = p.party.firstOrNull()
        if (hero != null) {
            drawPortrait(c, hero.avatarKey.ifEmpty { hero.clsId }, 76f, y + 94f, 106f, r.withAlpha(Palette.GOLD, a))
        }
        RunService.promotionOf(p).lastOrNull()?.let { pr ->
            val emk = ArtIcon.emblem(pr.id)
            if (bitmap(emk) != null) drawIcon(c, emk, w - 62f, y + 42f, 48f, r.withAlpha(Palette.GOLD, a))
        }
        var ry = y + 34f
        val rows = listOf(
            "职阶" to (Data.classById[p.classId]?.name ?: ""),
            "抵达层数" to p.floor.toString(),
            "神格环" to p.grid.resonanceBonus().label(),
            "神格点收益" to ("+" + p.talentPointValue())
        )
        for (row in rows) {
            r.text(c, row.first, 140f, ry, 12f, r.withAlpha(Palette.TEXT_DIM, a))
            r.text(c, row.second, w - 42f, ry, 13.5f, r.withAlpha(Palette.GOLD, a), true, Paint.Align.RIGHT)
            ry += 32f
        }
        r.text(c, "星尘 " + perm.dust + "   ·   成就 " + perm.achProgress.values.count { it > 0 } + "/" + Achievements.all.size,
            w / 2f, y + 170f, 11f, r.withAlpha(Palette.CYAN, a), false, Paint.Align.CENTER)
        y += 200f

        // ---- 4) 成就 ----
        val achK = ((t - 3.4f) / 0.9f).coerceIn(0f, 1f)
        if (achK > 0f) {
            val aa = (achK * 255).toInt()
            val newAch = pendingAchievements
            if (newAch.isNotEmpty()) {
                r.text(c, "本次达成", w / 2f, y, 12.5f, r.withAlpha(Palette.GOLD, aa), true, Paint.Align.CENTER)
                y += 18f
                for (a2 in newAch.take(4)) {
                    r.text(c, "· " + a2.name + "   +" + a2.dust, w / 2f, y, 11.5f, r.withAlpha(Palette.CYAN, aa), false, Paint.Align.CENTER)
                    y += 17f
                }
            } else {
                y = r.wrap(c, "同源星语在环上相邻即结成共鸣链，链越长增益越高。下次轮回优先凑齐 3 条以上共鸣边。",
                    UiKit.MARGIN + 24f, y, contentW() - 48f, 12f, r.withAlpha(Palette.TEXT_DIM, aa), 18f)
            }
            endScroll(c, y)
        } else {
            endScroll(c, y)
        }
    }

    // ---- 5) 操作区（最后淡入）----
    val btnK = ((t - 3.9f) / 0.8f).coerceIn(0f, 1f)
    if (btnK > 0f) {
        val a = (btnK * 255).toInt()
        r.panel(c, 0f, h - 170f, w, 170f, 0f,
            r.withAlpha(Palette.PANEL_DEEP, (a * 0.9f).toInt()),
            r.withAlpha(Palette.BG_BOTTOM, (a * 0.9f).toInt()), null)
        button(c, "end_continue", "继 续 轮 回", UiKit.MARGIN + 14f, h - 150f, contentW() - 28f, 54f, r.withAlpha(Palette.GOLD, a))
        ghostButton(c, "end_skip", "查看全部战报", UiKit.MARGIN + 14f, h - 88f, contentW() - 28f, 44f, r.withAlpha(Palette.CYAN, a))
        r.text(c, "点击任意处可跳过演出", w / 2f, h - 22f, 10f, r.withAlpha(Palette.TEXT_FAINT, a), false, Paint.Align.CENTER)
    }

    // 全屏跳过热区（在最底层，按钮优先）
    hit("end_skip_all", 0f, 0f, w, h - 170f)
}

internal fun GameView.tapEnding(id: String) {
    when (id) {
        "end_continue" -> goScreen(GameView.Screen.REINCARNATION)
        "end_skip" -> {
            endingStart = time - 99f
        }
        "end_skip_all" -> {
            endingStart = time - 99f
        }
    }
}
