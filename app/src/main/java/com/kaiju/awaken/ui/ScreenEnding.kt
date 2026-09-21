package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Achievements
import com.kaiju.awaken.game.Data

/** 通关结局页：模式主线完成时的独立演出画面。 */
internal fun GameView.drawEndingScreen(c: Canvas) {
    val p = run ?: return

    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF0B0620.toInt(), 90))

    var y = 118f
    r.text(c, "回 廊 重 燃", w / 2f, y, 32f, Palette.GOLD, true, Paint.Align.CENTER)
    y += 26f
    r.text(c, p.mode.cn + " · 第 " + p.floor + " 层", w / 2f, y, 13f, Palette.CYAN, false, Paint.Align.CENTER)
    y += 20f
    r.sparkle(c, w * 0.13f, 126f, 18f, Palette.GOLD)
    r.sparkle(c, w * 0.87f, 138f, 14f, Palette.CYAN)
    r.sparkle(c, w * 0.5f, 92f, 12f, Palette.PINK)

    y = 178f
    r.wrap(c, "你点亮了回廊之心，所有星语重新开始呼吸。", w / 2f - 140f, y, 280f, 13f, Palette.TEXT, 20f)
    y += 46f

    card(c, 26f, y, w - 52f, 186f, r.withAlpha(Palette.GOLD, 200), 18f)
    var ry = y + 34f
    val hero = p.party.firstOrNull()
    if (hero != null) {
        drawPortrait(c, hero.avatarKey.ifEmpty { hero.clsId }, 76f, y + 94f, 106f, Palette.GOLD)
    }
    com.kaiju.awaken.game.RunService.promotionOf(p).lastOrNull()?.let { pr ->
        val emk = com.kaiju.awaken.game.ArtIcon.emblem(pr.id)
        if (bitmap(emk) != null) drawIcon(c, emk, w - 62f, y + 42f, 48f, Palette.GOLD)
    }
    val rows = listOf(
        "职阶" to (Data.classById[p.classId]?.name ?: ""),
        "抵达层数" to p.floor.toString(),
        "神格环" to p.grid.resonanceBonus().label(),
        "神格点收益" to ("+" + p.talentPointValue())
    )
    for (row in rows) {
        r.text(c, row.first, 140f, ry, 12f, Palette.TEXT_DIM)
        r.text(c, row.second, w - 42f, ry, 13.5f, Palette.GOLD, true, Paint.Align.RIGHT)
        ry += 32f
    }
    r.text(c, "星尘 " + perm.dust + "   ·   成就 " + perm.achProgress.values.count { it > 0 } + "/" + Achievements.all.size,
        w / 2f, y + 166f, 11f, Palette.CYAN, false, Paint.Align.CENTER)
    y += 198f

    val newAch = pendingAchievements
    if (newAch.isNotEmpty()) {
        r.text(c, "本次达成", w / 2f, y, 12.5f, Palette.GOLD, true, Paint.Align.CENTER)
        y += 18f
        for (a in newAch.take(4)) {
            r.text(c, "· " + a.name + "   +" + a.dust, w / 2f, y, 11.5f, Palette.CYAN, false, Paint.Align.CENTER)
            y += 17f
        }
    }

    button(c, "end_continue", "继 续 轮 回", 44f, h - 158f, w - 88f, 56f, Palette.GOLD)
    ghostButton(c, "end_hub", "回到主城", 44f, h - 92f, w - 88f, 44f, Palette.CYAN)
}

internal fun GameView.tapEnding(id: String) {
    when (id) {
        "end_continue" -> screen = GameView.Screen.REINCARNATION
        "end_hub" -> screen = GameView.Screen.REINCARNATION
    }
}
