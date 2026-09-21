package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Pets
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.Story
import com.kaiju.awaken.game.Tracker

/** 宠物图鉴与出战选择。 */
internal fun GameView.drawPetScreen(c: Canvas) {
    drawTopBar(c, "宠物", "已收集 " + perm.petsOwned.size + " / " + Pets.all.size, "pet_back", null, null)
    var y = 120f
    val cols = 3
    val gap = 8f
    val cell = (w - 36f - gap * (cols - 1)) / cols
    for (i in Pets.all.indices) {
        val pet = Pets.all[i]
        val owned = perm.petsOwned.contains(pet.id)
        val active = perm.petId == pet.id
        val col = i % cols
        val row = i / cols
        val x = 18f + col * (cell + gap)
        val yy = y + row * (cell + 30f)
        card(c, x, yy, cell, cell + 22f, if (active) Palette.GOLD else if (owned) Palette.CYAN else Palette.BORDER_SOFT, 14f)
        if (active) r.glowPanel(c, x, yy, cell, cell + 22f, 14f, Palette.GOLD, 60)
        if (owned) {
            drawPortrait(c, pet.avatar, x + cell / 2f, yy + cell * 0.42f, cell * 0.78f, if (active) Palette.GOLD else Palette.CYAN)
            r.text(c, pet.name, x + cell / 2f, yy + cell + 8f, 11.5f, if (active) Palette.GOLD else Palette.TEXT, true, Paint.Align.CENTER)
            hit("pet_pick_" + pet.id, x, yy, cell, cell + 22f)
        } else {
            r.hexFrame(c, x + cell / 2f, yy + cell * 0.42f, cell * 0.28f, Palette.BORDER_SOFT, r.withAlpha(Palette.PANEL_SOFT, 255))
            r.text(c, "？", x + cell / 2f, yy + cell * 0.48f, 20f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
            r.text(c, "未获得", x + cell / 2f, yy + cell + 8f, 11f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        }
    }
    y += ((Pets.all.size + cols - 1) / cols) * (cell + 30f) + 6f
    r.text(c, "出击宠物", 22f, y, 13f, Palette.CYAN, true)
    y += 8f
    val cur = Pets.of(perm.petId)
    if (cur == null) {
        r.text(c, "尚未选择出击宠物（击败章节首领可获得）", w / 2f, y + 34f, 12f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        y += 60f
    } else {
        card(c, 18f, y, w - 36f, 96f, Palette.GOLD, 12f)
        drawPortrait(c, cur.avatar, 62f, y + 48f, 66f, Palette.GOLD)
        r.text(c, cur.name, 106f, y + 34f, 15f, Palette.TEXT, true)
        r.wrap(c, cur.desc, 106f, y + 54f, w - 140f, 11f, Palette.TEXT_DIM, 15f)
        y += 106f
    }
    ghostButton(c, "pet_off", "取消出击", 30f, y + 4f, w - 60f, 42f, Palette.TEXT_DIM)
    ghostButton(c, "pet_back", "返回", 30f, h - 74f, w - 60f, 46f, Palette.TEXT_DIM)
}

internal fun GameView.tapPet(id: String) {
    when {
        id == "pet_back" -> screen = GameView.Screen.HUB
        id == "pet_off" -> {
            perm.petId = null
            Save.savePerm(context, perm)
            showToast("已取消出击宠物")
        }
        id.startsWith("pet_pick_") -> {
            val pid = id.removePrefix("pet_pick_")
            if (!perm.petsOwned.contains(pid)) return
            perm.petId = pid
            Save.savePerm(context, perm)
            com.kaiju.awaken.game.RunService.recalcAll(run ?: return, perm)
            audio.play("starup")
            showToast("出击宠物：" + (Pets.of(pid)?.name ?: ""))
        }
    }
}

/** 主线章节页。 */
internal fun GameView.drawStoryScreen(c: Canvas) {
    val cur = Story.current(perm.storyIndex)
    drawTopBar(c, "主线 · 回廊的回声", "进度 " + perm.storyIndex + " / " + Story.total, "story_back", null, null)
    var y = 120f
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
        if (y > h - 110f) break
        val claimed = perm.chapterClaimed.contains(ch.index.toString())
        val passed = perm.storyIndex > ch.index - 1
        val col = if (claimed) Palette.GREEN else if (passed) Palette.GOLD else Palette.BORDER_SOFT
        card(c, 18f, y, w - 36f, 44f, r.withAlpha(col, 170), 10f)
        r.text(c, "第 " + ch.index + " 章  " + ch.title, 32f, y + 27f, 12.5f, if (passed) Palette.TEXT else Palette.TEXT_FAINT, true)
        val status = if (claimed) "已领取" else if (passed) "可领取" else ("目标 " + ch.goalFloor + " 层")
        r.text(c, status, w - 32f, y + 27f, 11f, col, false, Paint.Align.RIGHT)
        y += 50f
    }
    ghostButton(c, "story_back", "返回", 30f, h - 74f, w - 60f, 46f, Palette.TEXT_DIM)
}

internal fun GameView.tapStory(id: String) {
    when (id) {
        "story_back" -> screen = GameView.Screen.HUB
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
