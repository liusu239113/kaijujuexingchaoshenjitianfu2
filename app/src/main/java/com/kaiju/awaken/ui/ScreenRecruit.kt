package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Content2
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.TowerService
import com.kaiju.awaken.game.Unit

/** 佣兵招募所：花金币招募伙伴，可花金币刷新候选。 */
internal fun GameView.drawRecruitScreen(c: Canvas) {
    val p = run
    drawTopBar(c, "招募所", if (p == null) "需先开启远征" else "队伍 " + p.party.size + "/3 · 金币 " + p.gold, "rec_back", "rec_refresh", "刷新 " + refreshCost())
    var y = beginScroll(c, 112f)

    if (p == null) {
        card(c, 24f, y, w - 48f, 100f, r.withAlpha(Palette.BORDER_SOFT, 170), 14f)
        r.text(c, "尚未开启远征", w / 2f, y + 44f, 15f, Palette.TEXT_DIM, true, Paint.Align.CENTER)
        r.text(c, "回到主城点击「出发远征」后再来招募", w / 2f, y + 68f, 11.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        ghostButton(c, "rec_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
        return
    }

    if (recruitList.isEmpty()) recruitList = ArrayList(TowerService.tavernCandidates(p.floor))

    y = sectionHeader(c, "候选伙伴", y)
    for (i in recruitList.indices) {
        val u = recruitList[i]
        val col = rarityColor(u.rarity)
        val cost = TowerService.mercenaryCost(u)
        val full = p.party.size >= 3
        val afford = p.gold >= cost
        card(c, 20f, y, w - 40f, 108f, if (full) r.withAlpha(Palette.BORDER_SOFT, 150) else col, 14f)
        drawPortrait(c, u.avatarKey.ifEmpty { u.clsId }, 66f, y + 54f, 68f, col)
        r.text(c, u.name + " · " + (Data.classById[u.clsId]?.name ?: ""), 110f, y + 30f, 14.5f, Palette.TEXT, true)
        r.text(c, u.rarity.cn + " · Lv." + u.level + " · " + "★".repeat(u.star), 110f, y + 50f, 11.5f, col)
        val tr = u.traitId?.let { Content2.traitById[it] }
        r.text(c, "专长：" + (tr?.name ?: "无"), 110f, y + 68f, 11f, Palette.CYAN)
        r.text(c, tr?.desc ?: "", 110f, y + 86f, 9.5f, Palette.TEXT_DIM)
        if (full) {
            r.text(c, "队伍已满", w - 40f, y + 46f, 12f, Palette.RED, true, Paint.Align.RIGHT)
        } else {
            ghostButton(c, "rec_hire_$i", cost.toString() + " 金", w - 116f, y + 34f, 84f, 40f, if (afford) Palette.GOLD else Palette.TEXT_FAINT)
        }
        y += 118f
    }

    r.wrap(c, "提示：伙伴拥有独立专长与星级，可用金币升星；长按队伍可查看详情。", UiKit.MARGIN, y + 8f, contentW(), 11f, Palette.TEXT_FAINT, 17f)
    endScroll(c, y + 44f)
    ghostButton(c, "rec_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
}

internal fun refreshCost(): Int = 60

internal fun GameView.tapRecruit(id: String) {
    val p = run ?: return
    when {
        id == "rec_back" -> setScreen(GameView.Screen.HUB)
        id == "rec_refresh" -> {
            if (p.gold < refreshCost()) {
                audio.play("error")
                showToast("金币不足（需要 " + refreshCost() + "）")
                return
            }
            p.gold -= refreshCost()
            recruitList = ArrayList(TowerService.tavernCandidates(p.floor))
            audio.play("draw")
            showToast("已刷新候选")
        }
        id.startsWith("rec_hire_") -> {
            val idx = id.removePrefix("rec_hire_").toIntOrNull() ?: return
            val u = recruitList.getOrNull(idx) ?: return
            if (p.party.size >= 3) {
                showToast("队伍已满（含主角最多 3 人）")
                return
            }
            if (TowerService.recruit(p, u)) {
                recruitList.removeAt(idx)
                com.kaiju.awaken.game.RunService.recalcAll(p, perm)
                com.kaiju.awaken.game.Tracker.bump(perm, "recruit")
                if (p.party.size >= 3) com.kaiju.awaken.game.Tracker.bump(perm, "party3")
                Save.saveRun(context, p, perm)
                audio.play("levelup")
                showToast(u.name + " 加入了队伍")
            } else {
                audio.play("error")
                showToast("金币不足")
            }
        }
    }
}
