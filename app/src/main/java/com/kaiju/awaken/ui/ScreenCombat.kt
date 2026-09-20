package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Battle
import com.kaiju.awaken.game.TargetKind
import com.kaiju.awaken.game.Unit

private const val ROW_H = 146f
private const val TOP_H = 72f
private const val CMD_H = 208f

internal fun GameView.drawCombatScreen(c: Canvas) {
    val b = battle ?: return
    val accent = when (b.kind) {
        "boss" -> Palette.RED
        "elite" -> Palette.GOLD
        else -> Palette.PINK
    }
    r.panel(c, 0f, 0f, w, TOP_H, 0f, r.withAlpha(0xFF1B1040.toInt(), 242), r.withAlpha(0xFF120A2E.toInt(), 232), null)
    r.fill.color = r.withAlpha(accent, 80)
    c.drawRect(0f, TOP_H - 2f, w, TOP_H, r.fill)
    val kindLabel = when (b.kind) {
        "boss" -> "首领战"
        "elite" -> "精锐战"
        else -> "遭遇战"
    }
    r.text(c, kindLabel + " · 第 " + b.turn + "/500 回合", 16f, 30f, 16f, Palette.TEXT, true)
    r.text(c, "增伤 +" + (b.escalation() * 100).toInt() + "%   第 " + b.floor + " 层", 16f, 52f, 12f, accent)
    ghostButton(c, "cb_auto", if (autoBattle) "自动中" else "自动", w - 78f, 16f, 64f, 40f, if (autoBattle) Palette.GREEN else Palette.TEXT_DIM)

    val enemyTop = TOP_H + 6f
    val allyTop = enemyTop + ROW_H + 10f
    val logTop = allyTop + ROW_H + 8f
    val logBottom = minOf(h - CMD_H - 6f, logTop + 96f)

    drawUnitRow(c, b.enemies, enemyTop, true, b, accent)
    drawUnitRow(c, b.allies, allyTop, false, b, Palette.CYAN)

    if (logBottom > logTop + 40f) {
        card(c, 10f, logTop, w - 20f, logBottom - logTop, r.withAlpha(Palette.BORDER_SOFT, 170), 12f)
        var ly = logTop + 22f
        val maxLines = (((logBottom - logTop - 26f) / 16f).toInt()).coerceAtLeast(1)
        for (s in b.log.takeLast(maxLines)) {
            if (ly > logBottom - 8f) break
            r.text(c, s, 22f, ly, 11.5f, Palette.TEXT_DIM)
            ly += 16f
        }
    }

    for (ft in b.floatTexts) {
        val pos = unitPosition(ft.target, b) ?: continue
        val rise = (1f - ft.life) * 36f
        val alpha = (ft.life.coerceIn(0f, 1f) * 255).toInt()
        r.text(c, ft.text, pos.first, pos.second - rise, if (ft.isCrit) 23f else 18f,
            r.withAlpha(ft.color, alpha), true, Paint.Align.CENTER)
    }

    drawCommandBar(c, b)
}

private fun GameView.drawUnitRow(c: Canvas, list: List<Unit>, top: Float, isEnemy: Boolean, b: Battle, accent: Int) {
    val n = list.size.coerceAtLeast(1)
    val pad = 8f
    val cw = (w - pad * (n + 1)) / n
    r.text(c, if (isEnemy) "敌方 · 点击锁定目标" else "我方", 14f, top + 12f, 12f, accent, true)
    val gridTop = top + 18f
    val ch = ROW_H - 22f
    for (i in list.indices) {
        val u = list[i]
        val x = pad + i * (cw + pad)
        val actor = b.currentActor() == u
        val border = when {
            !u.alive -> 0xFF3A2F60.toInt()
            actor -> Palette.PINK
            isEnemy -> r.withAlpha(Palette.RED, 200)
            else -> r.withAlpha(Palette.CYAN, 200)
        }
        card(c, x, gridTop, cw, ch, border, 12f)
        if (actor && u.alive) r.glowPanel(c, x, gridTop, cw, ch, 12f, Palette.PINK, 70)
        if (isEnemy && u.alive) {
            val preferred = preferredTargetId == u.id
            if (preferred) r.glowPanel(c, x, gridTop, cw, ch, 12f, Palette.GOLD, 90)
            hit("cb_target_" + u.id, x, gridTop, cw, ch)
        }
        if (!u.alive) {
            r.solid(c, x, gridTop, cw, ch, 12f, r.withAlpha(0xFF0A0618.toInt(), 180))
            r.text(c, "战殁", x + cw / 2f, gridTop + ch / 2f, 14f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
            continue
        }
        val key = if (isEnemy) u.avatarKey else if (u.id == "player") u.clsId else u.avatarKey.ifEmpty { u.clsId }
        val psize = if (cw < 110f) 44f else 54f
        drawPortrait(c, key, x + cw / 2f, gridTop + psize * 0.52f, psize, if (isEnemy) Palette.RED else classColor(u.clsId))
        r.text(c, u.name, x + cw / 2f, gridTop + psize + 18f, if (cw < 110f) 10.5f else 12f, Palette.TEXT, true, Paint.Align.CENTER)
        val barY = gridTop + psize + 24f
        r.bar(c, x + 8f, barY, cw - 16f, 9f, u.hpPct().toFloat(),
            if (u.hpPct() < 0.3) Palette.HP_LOW else Palette.HP_A,
            if (u.hpPct() < 0.3) Palette.HP_LOW else Palette.HP_B)
        r.text(c, u.hp.toInt().toString() + "/" + u.stats.maxHp.toInt(), x + cw / 2f, barY + 21f, 10f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        if (u.shield > 0.0) {
            r.bar(c, x + 8f, barY + 24f, cw - 16f, 5f, (u.shield / u.stats.maxHp).toFloat().coerceIn(0f, 1f), Palette.SHIELD, Palette.SHIELD)
        }
        r.text(c, "攻" + u.stats.atk.toInt() + " 防" + u.stats.def.toInt(), x + cw / 2f, barY + 42f, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        val buffs = u.buffs.filter { !it.id.startsWith("affix_") }.take(3)
        if (buffs.isNotEmpty()) {
            var bx = x + 6f
            for (bf in buffs) {
                val col = if (bf.isDebuff) Palette.RED else Palette.GREEN
                r.solid(c, bx, barY + 46f, 30f, 15f, 7f, r.withAlpha(col, 210))
                r.text(c, bf.name.take(2), bx + 15f, barY + 58f, 9f, 0xFF140B26.toInt(), true, Paint.Align.CENTER)
                bx += 33f
            }
        }
    }
}

private fun GameView.unitPosition(u: Unit, b: Battle): Pair<Float, Float>? {
    val pad = 8f
    val enemyTop = TOP_H + 6f
    val allyTop = enemyTop + ROW_H + 10f
    val enemyIdx = b.enemies.indexOf(u)
    if (enemyIdx >= 0) {
        val n = b.enemies.size.coerceAtLeast(1)
        val cw = (w - pad * (n + 1)) / n
        return (pad + enemyIdx * (cw + pad) + cw / 2f) to (enemyTop + 18f + 30f)
    }
    val allyIdx = b.allies.indexOf(u)
    if (allyIdx >= 0) {
        val n = b.allies.size.coerceAtLeast(1)
        val cw = (w - pad * (n + 1)) / n
        return (pad + allyIdx * (cw + pad) + cw / 2f) to (allyTop + 18f + 30f)
    }
    return null
}

private fun GameView.drawCommandBar(c: Canvas, b: Battle) {
    val p = run ?: return
    val top = h - CMD_H
    r.panel(c, 0f, top, w, CMD_H, 0f, r.withAlpha(0xFF170E36.toInt(), 246), r.withAlpha(0xFF0D0722.toInt(), 250), null)
    r.fill.color = r.withAlpha(Palette.PINK, 60)
    c.drawRect(0f, top, w, top + 2f, r.fill)

    if (b.finished) {
        button(c, "cb_finish", "查看战果", 34f, top + 60f, w - 68f, 56f, Palette.CYAN)
        return
    }

    val actor = b.currentActor()
    if (!b.awaitingInput || actor == null || actor.isEnemy) {
        r.text(c, if (autoBattle) "自动作战中…" else "行动中…", w / 2f, top + 96f, 15f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        return
    }

    r.text(c, "选择战技 · " + actor.name + "   能量 " + actor.energy.toInt() + "/" + actor.stats.energyMax.toInt(), 16f, top + 24f, 12.5f, Palette.CYAN, true)
    val usable = actor.skills.filter { (actor.cooldowns[it.id] ?: 0) <= 0 }
    val cols = 3
    val cw = (w - 20f) / cols
    var shown = 0
    for (i in usable.indices) {
        if (shown >= 6) break
        val s = usable[i]
        val col = shown % cols
        val row = shown / cols
        val x = 10f + col * cw
        val y = top + 34f + row * 54f
        val costOk = actor.energy >= s.cost
        val accent = if (s.isUltimate) Palette.GOLD else if (costOk) Palette.PINK else Palette.TEXT_FAINT
        card(c, x, y, cw - 6f, 48f, accent, 11f)
        r.text(c, s.name, x + (cw - 6f) / 2f, y + 20f, 12.5f, if (costOk) Palette.TEXT else Palette.TEXT_FAINT, true, Paint.Align.CENTER)
        r.text(c, "耗能 " + s.cost, x + (cw - 6f) / 2f, y + 36f, 10f, if (costOk) Palette.TEXT_DIM else Palette.RED, false, Paint.Align.CENTER)
        hit("cb_skill_$i", x, y, cw - 6f, 48f).enabled = costOk
        shown++
    }

    val itemIds = p.items.keys.toList()
    val iy = top + 152f
    if (itemIds.isNotEmpty()) {
        r.text(c, "道具", 10f, iy + 8f, 11f, Palette.GOLD, true)
        var ix = 44f
        for (id in itemIds.take(5)) {
            val def = com.kaiju.awaken.game.Content.itemById[id] ?: continue
            val cnt = p.items[id] ?: 0
            card(c, ix, iy - 10f, 62f, 44f, r.withAlpha(Palette.GOLD, 190), 10f)
            r.text(c, def.glyph, ix + 31f, iy + 10f, 16f, Palette.TEXT, true, Paint.Align.CENTER)
            r.text(c, "×" + cnt, ix + 31f, iy + 28f, 10f, Palette.GOLD, false, Paint.Align.CENTER)
            hit("cb_item_$id", ix, iy - 10f, 62f, 44f)
            ix += 66f
        }
    } else {
        r.text(c, "无可用道具", 16f, iy + 10f, 11.5f, Palette.TEXT_FAINT)
    }
}

internal fun GameView.tapCombat(id: String) {
    val b = battle ?: return
    when {
        id == "cb_auto" -> {
            autoBattle = !autoBattle
            b.auto = autoBattle
        }
        id == "cb_finish" -> overlay = "battle_end"
        id.startsWith("cb_target_") -> {
            preferredTargetId = id.removePrefix("cb_target_")
            showToast("已锁定目标")
        }
        id.startsWith("cb_item_") -> {
            b.useItem(id.removePrefix("cb_item_"))
            selectedSkill = null
        }
        id.startsWith("cb_skill_") -> {
            val idx = id.removePrefix("cb_skill_").toIntOrNull() ?: return
            val actor = b.currentActor() ?: return
            val usable = actor.skills.filter { (actor.cooldowns[it.id] ?: 0) <= 0 }
            val s = usable.getOrNull(idx) ?: return
            if (actor.energy < s.cost) {
                showToast("能量不足")
                return
            }
            val preferred = b.aliveEnemies().firstOrNull { it.id == preferredTargetId }
            val target = when (s.target) {
                TargetKind.ENEMY_ONE -> preferred ?: b.aliveEnemies().minByOrNull { it.hp }
                TargetKind.ALLY_ONE -> b.aliveAllies().minByOrNull { it.hpPct() }
                else -> actor
            }
            b.playerAct(s, target)
            audio.play(if (s.isUltimate) "crit" else "skill")
            combatDelay = 0.32f
        }
    }
}
