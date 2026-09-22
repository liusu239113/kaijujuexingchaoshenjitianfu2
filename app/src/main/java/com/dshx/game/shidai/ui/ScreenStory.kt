package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.game.Save
import com.dshx.game.shidai.game.Story
import com.dshx.game.shidai.game.Tracker

/*
 * 主线章节页。
 * 这两个函数原先寄居在 ScreenPet.kt 里（宠物与主线混在一个文件），
 * 拆出来单独放，避免以后再改宠物面板时误删。
 */

/** 主线章节页。 */
internal fun GameView.drawStoryScreen(c: Canvas) {
    val cur = Story.current(perm.storyIndex)
    drawTopBar(c, "主线 · 回廊的回声", "进度 " + perm.storyIndex + " / " + Story.total, "story_back", null, null)
    var y = beginScroll(c, 112f)
    if (cur != null) {
        val floorNow = run?.floor ?: 0
        val done = floorNow >= cur.goalFloor
        card(c, 18f, y, w - 36f, 150f, if (done) Palette.GOLD else Palette.CYAN, 16f)
        r.text(c, "第 " + cur.index + " 章 · " + cur.title, 34f, y + 32f, 17f, if (done) Palette.GOLD else Palette.CYAN, true)
        r.wrap(c, cur.brief, 34f, y + 56f, w - 68f, 12f, Palette.TEXT_DIM, 17f)
        r.text(c, "目标：抵达第 " + cur.goalFloor + " 层", 34f, y + 104f, 12f, Palette.TEXT)
        r.bar(c, 34f, y + 116f, w - 68f, 8f, (floorNow.toFloat() / cur.goalFloor).coerceIn(0f, 1f), Palette.CYAN, Palette.EN_B)
        r.text(c, "奖励：星尘 " + cur.rewardDust + " · 金币 " + cur.rewardGold, 34f, y + 142f, 11f, Palette.TEXT_DIM)
        y += 162f
        if (done) {
            if (perm.chapterClaimed.contains(cur.index.toString())) {
                r.text(c, "本章已完成", w / 2f, y + 24f, 13f, Palette.GREEN, true, Paint.Align.CENTER)
                y += 44f
            } else {
                button(c, "story_claim", "领 取 奖 励", 40f, y, w - 80f, 50f, Palette.GOLD)
                y += 60f
            }
        } else {
            r.text(c, "继续深入即可推进本章", w / 2f, y + 24f, 12f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
            y += 44f
        }
    } else {
        card(c, 18f, y, w - 36f, 90f, Palette.GOLD, 16f)
        r.text(c, "全部章节已完成", w / 2f, y + 40f, 17f, Palette.GOLD, true, Paint.Align.CENTER)
        r.text(c, "你成为了回廊新的守望。", w / 2f, y + 64f, 12f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        y += 102f
    }
    r.text(c, "章节一览", 22f, y, 13f, Palette.CYAN, true)
    y += 10f
    for (ch in Story.chapters) {
        if (y > h + screenScroll - 60f) break
        val claimed = perm.chapterClaimed.contains(ch.index.toString())
        val passed = perm.storyIndex > ch.index - 1
        val col = if (claimed) Palette.GREEN else if (passed) Palette.GOLD else Palette.BORDER_SOFT
        card(c, 18f, y, w - 36f, r.lh(44f), r.withAlpha(col, 170), 10f)
        r.text(c, "第 " + ch.index + " 章  " + ch.title, 32f, y + 27f, 12.5f, if (passed) Palette.TEXT else Palette.TEXT_FAINT, true)
        val status = if (claimed) "已领取" else if (passed) "可领取" else ("目标 " + ch.goalFloor + " 层")
        r.text(c, status, w - 32f, y + 27f, 11f, col, false, Paint.Align.RIGHT)
        y += r.lh(50f)
    }
    endScroll(c, y)
    ghostButton(c, "story_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 46f, Palette.TEXT_DIM)
}

internal fun GameView.tapStory(id: String) {
    when (id) {
        "story_back" -> goScreen(GameView.Screen.HUB)
        "story_claim" -> {
            val ch = Story.current(perm.storyIndex) ?: return
            if (perm.chapterClaimed.contains(ch.index.toString())) return
            perm.chapterClaimed.add(ch.index.toString())
            Tracker.addDust(perm, ch.rewardDust)
            run?.let { it.gold += ch.rewardGold }
            perm.storyIndex++
            val newly = Tracker.evaluate(perm)
            if (newly.isNotEmpty()) pendingAchievements = ArrayList(newly)
            Save.savePerm(context, perm)
            audio.play("unlock")
            showToast("第 " + ch.index + " 章完成：星尘 +" + ch.rewardDust)
        }
    }
}
