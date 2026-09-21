package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.Promotions
import com.kaiju.awaken.game.RunService

internal fun GameView.drawPromotionScreen(c: Canvas) {
    val p = run ?: return
    r.text(c, if (promoTier == 1) "职 阶 觉 醒" else "二 转 降 临", w / 2f, 76f, 26f, Palette.GOLD, true, Paint.Align.CENTER)
    r.text(
        c,
        if (promoTier == 1) "第 3 层的试炼回应了你，选择一条进阶路线。" else "第 30 层的门扉开启，选择你的终末形态。",
        w / 2f, 102f, 12f, Palette.TEXT_DIM, false, Paint.Align.CENTER
    )
    r.text(c, "当前职阶：" + (Data.classById[p.classId]?.name ?: ""), w / 2f, 124f, 12f, Palette.CYAN, false, Paint.Align.CENTER)

    var y = 146f
    val cardH = 216f
    for (i in promoOptions.indices) {
        val promo = promoOptions[i]
        val col = if (promoTier == 1) Palette.PINK else Palette.GOLD
        card(c, 22f, y, w - 44f, cardH, col, 18f)
        r.glowPanel(c, 22f, y, w - 44f, cardH, 18f, col, 42)
        drawPortrait(c, "pc_" + promo.id, 64f, y + 54f, 78f, col)
        val emk = com.kaiju.awaken.game.ArtIcon.emblem(promo.id)
        if (bitmap(emk) != null) drawIcon(c, emk, w - 66f, y + 44f, 44f, col)
        r.text(c, promo.name, 116f, y + 40f, 20f, Palette.TEXT, true)
        r.text(c, if (promoTier == 1) "一转路线" else "二转路线", w - 42f, y + 32f, 11.5f, col, false, Paint.Align.RIGHT)
        r.wrap(c, promo.desc, 116f, y + 60f, w - 154f, 11.5f, Palette.TEXT_DIM, 16f)

        // 面板加成
        var by = y + 104f
        val mods = promo.statMod.entries.joinToString("  ") { statLabel(it.key) + " " + pctText(it.value) }
        if (mods.isNotEmpty()) {
            r.text(c, mods, 40f, by, 11.5f, Palette.GREEN)
            by += 18f
        }
        val flats = promo.flatMod.entries.joinToString("  ") { statLabel(it.key) + " +" + it.value.toInt() }
        if (flats.isNotEmpty()) {
            r.text(c, flats, 40f, by, 11.5f, Palette.CYAN)
            by += 18f
        }
        // 战技
        for (sid in promo.skillIds) {
            val sk = Promotions.skillOf(sid) ?: continue
            r.text(c, "◆ " + sk.name + "  ", 40f, by, 12f, Palette.TEXT, true)
            val nx = 40f + r.measure("◆ " + sk.name + "  ", 12f, true)
            r.text(c, sk.desc, nx, by, 10.5f, Palette.TEXT_DIM)
            by += 17f
        }
        button(c, "promo_pick_$i", "选 择 " + promo.name, 40f, y + cardH - 58f, w - 80f, 46f, col)
        y += cardH + 14f
    }
    r.text(c, "转职会永久改变本轮的能力与战技组，无法更改。", w / 2f, h - 30f, 11f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
}

private fun statLabel(k: String): String = when (k) {
    "atk" -> "攻击"
    "matk" -> "法强"
    "maxHp" -> "生命"
    "def" -> "防御"
    "crit" -> "暴击"
    "critDmg" -> "暴伤"
    "dodge" -> "闪避"
    "dmgBonus" -> "增伤"
    "dmgReduction" -> "减伤"
    "lifesteal" -> "吸血"
    "energyRegen" -> "回能"
    "hpRegen" -> "回血"
    "shieldPower" -> "护盾"
    "healPower" -> "治疗"
    "armorPen" -> "破甲"
    "statusRes" -> "抗性"
    else -> k
}

private fun pctText(v: Double): String {
    val pct = (v * 100).toInt()
    return (if (pct >= 0) "+" else "") + pct + "%"
}

internal fun GameView.tapPromotion(id: String) {
    if (!id.startsWith("promo_pick_")) return
    val idx = id.removePrefix("promo_pick_").toIntOrNull() ?: return
    val promo = promoOptions.getOrNull(idx) ?: return
    val p = run ?: return
    if (promo.tier == 1) p.promotionId = promo.id else p.tier2Id = promo.id
    p.hero().avatarKey = "pc_" + promo.id
    RunService.rebuildSkills(p.hero(), p.classId, p.promotionId, p.tier2Id)
    RunService.recalcAll(p, perm)
    audio.play("levelup")
    notePromotion(promo.tier)
    showToast("转职为 " + promo.name)
    screen = GameView.Screen.TOWER
}
