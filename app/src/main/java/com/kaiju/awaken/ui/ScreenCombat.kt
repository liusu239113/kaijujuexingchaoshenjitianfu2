package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Battle
import com.kaiju.awaken.game.Skill
import com.kaiju.awaken.game.TargetKind
import com.kaiju.awaken.game.Unit
import kotlin.math.cos
import kotlin.math.sin

internal fun GameView.drawCombatScreen(c: Canvas) {
    val b = battle ?: return
    val accent = when (b.kind) {
        "boss" -> Palette.RED
        "elite" -> Palette.GOLD
        else -> Palette.PINK
    }
    // 顶栏
    r.panel(c, 0f, 0f, w, 78f, 0f, r.withAlpha(0xFF1B1040.toInt(), 240), r.withAlpha(0xFF120A2E.toInt(), 230), null)
    val kindLabel = when (b.kind) {
        "boss" -> "首领战"
        "elite" -> "精英战"
        else -> "战斗"
    }
    r.text(c, "$kindLabel · 第 ${b.turn}/500 回合", 20f, 34f, 17f, Palette.TEXT, true)
    r.text(c, "伤害 +${(b.escalation() * 100).toInt()}%   第 ${b.floor} 层", 20f, 58f, 12f, accent)
    ghostButton(c, "cb_auto", if (autoBattle) "自动中" else "自动", w - 82f, 20f, 68f, 38f, if (autoBattle) Palette.GREEN else Palette.TEXT_DIM)

    // 敌方
    drawUnitRow(c, b.enemies, 96f, true, b)
    // 我方
    drawUnitRow(c, b.allies, 96f + unitRowHeight(), false, b)

    // 日志
    val logTop = 96f + unitRowHeight() * 2f + 8f
    val logBottom = h - 216f
    card(c, 16f, logTop, w - 32f, logBottom - logTop, r.withAlpha(Palette.BORDER_SOFT, 180), 14f)
    val lines = b.log.takeLast(4)
    var ly = logTop + 24f
    for (s in lines) {
        ly = r.wrap(c, s, 30f, ly, w - 60f, 11.5f, Palette.TEXT_DIM, 15f)
    }

    // 浮动伤害
    for (ft in b.floatTexts) {
        val pos = unitPosition(ft.target, b) ?: continue
        val rise = (1f - ft.life) * 34f
        val alpha = (ft.life.coerceIn(0f, 1f) * 255).toInt()
        r.text(
            c, ft.text, pos.first, pos.second - rise, if (ft.isCrit) 22f else 17f,
            r.withAlpha(ft.color, alpha), true, Paint.Align.CENTER
        )
    }

    // 指令区
    drawCommandBar(c, b)
}

private fun unitRowHeight(): Float = 132f

private fun GameView.drawUnitRow(c: Canvas, list: List<Unit>, top: Float, isEnemy: Boolean, b: Battle) {
    val n = list.size.coerceAtLeast(1)
    val pad = 12f
    val cw = (w - pad * (n + 1)) / n
    val accentLabel = if (isEnemy) Palette.RED else Palette.CYAN
    r.text(c, if (isEnemy) "敌方" else "我方", 18f, top - 4f, 11.5f, accentLabel, true)
    for (i in list.indices) {
        val u = list[i]
        val x = pad + i * (cw + pad)
        val y = top + 8f
        val ch = unitRowHeight() - 20f
        val actor = b.currentActor() == u
        val border = when {
            !u.alive -> 0xFF3A2F60.toInt()
            actor -> Palette.PINK
            isEnemy -> r.withAlpha(Palette.RED, 190)
            else -> r.withAlpha(Palette.CYAN, 190)
        }
        card(c, x, y, cw, ch, border, 14f)
        if (actor && u.alive) r.glowPanel(c, x, y, cw, ch, 14f, Palette.PINK, 60)
        if (!u.alive) {
            r.solid(c, x, y, cw, ch, 14f, r.withAlpha(0xFF0A0618.toInt(), 170))
            r.text(c, "阵亡", x + cw / 2f, y + ch / 2f, 13f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
            continue
        }
        val key = if (isEnemy) u.avatarKey else u.clsId
        drawPortrait(c, key, x + cw / 2f, y + 30f, 44f, if (isEnemy) Palette.RED else classColor(u.clsId))
        val nameSize = if (cw < 108f) 10.5f else 12f
        r.text(c, u.name, x + cw / 2f, y + 62f, nameSize, Palette.TEXT, true, Paint.Align.CENTER)
        // 血条
        r.bar(c, x + 8f, y + 70f, cw - 16f, 8f, u.hpPct().toFloat(),
            if (u.hpPct() < 0.3) Palette.HP_LOW else Palette.HP_A,
            if (u.hpPct() < 0.3) Palette.HP_LOW else Palette.HP_B)
        r.text(c, "${u.hp.toInt()}", x + cw / 2f, y + 90f, 9.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        if (u.shield > 0.0) {
            r.bar(c, x + 8f, y + 94f, cw - 16f, 4f, (u.shield / u.stats.maxHp).toFloat().coerceIn(0f, 1f), Palette.SHIELD, Palette.SHIELD)
        }
        r.text(c, "攻${u.stats.atk.toInt()} 防${u.stats.def.toInt()}", x + cw / 2f, y + 108f, 9f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        val buffs = u.buffs.filter { !it.id.startsWith("affix_") }.take(3)
        if (buffs.isNotEmpty()) {
            var bx = x + 8f
            for (bf in buffs) {
                val label = bf.name.take(2)
                val col = if (bf.isDebuff) Palette.RED else Palette.GREEN
                r.solid(c, bx, y + 112f, 26f, 14f, 7f, r.withAlpha(col, 200))
                r.text(c, label, bx + 13f, y + 123f, 8.5f, 0xFF140B26.toInt(), true, Paint.Align.CENTER)
                bx += 29f
            }
        }
    }
}

private fun GameView.unitPosition(u: Unit, b: Battle): Pair<Float, Float>? {
    val enemyIdx = b.enemies.indexOf(u)
    if (enemyIdx >= 0) {
        val n = b.enemies.size.coerceAtLeast(1)
        val pad = 12f
        val cw = (w - pad * (n + 1)) / n
        return (pad + enemyIdx * (cw + pad) + cw / 2f) to (96f + 8f + 30f)
    }
    val allyIdx = b.allies.indexOf(u)
    if (allyIdx >= 0) {
        val n = b.allies.size.coerceAtLeast(1)
        val pad = 12f
        val cw = (w - pad * (n + 1)) / n
        return (pad + allyIdx * (cw + pad) + cw / 2f) to (96f + unitRowHeight() + 8f + 30f)
    }
    return null
}

private fun GameView.drawCommandBar(c: Canvas, b: Battle) {
    val p = run ?: return
    val top = h - 208f
    r.panel(c, 0f, top, w, 208f, 0f, r.withAlpha(0xFF170E36.toInt(), 244), r.withAlpha(0xFF0D0722.toInt(), 248), null)

    if (b.finished) {
        button(c, "cb_finish", "查看结算", 40f, top + 24f, w - 80f, 56f, Palette.CYAN)
        return
    }

    val actor = b.currentActor()
    if (!b.awaitingInput || actor == null || actor.isEnemy) {
        r.text(c, if (autoBattle) "自动战斗中…" else "敌方行动中…", w / 2f, top + 100f, 15f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        return
    }

    r.text(c, "选择技能 · ${actor.name}", 20f, top + 24f, 13f, Palette.CYAN, true)
    val usable = actor.skills.filter { (actor.cooldowns[it.id] ?: 0) <= 0 }
    val n = usable.size
    val cw = (w - 24f) / 3f
    for (i in usable.indices) {
        val s = usable[i]
        val col = i % 3
        val row = i / 3
        val x = 12f + col * (cw + 6f)
        val y = top + 34f + row * 56f
        val costOk = actor.energy >= s.cost
        val cdOk = (actor.cooldowns[s.id] ?: 0) <= 0
        val enabled = costOk && cdOk
        val accent = if (s.isUltimate) Palette.GOLD else if (enabled) Palette.PINK else Palette.TEXT_FAINT
        card(c, x, y, cw - 6f, 50f, accent, 12f)
        r.text(c, s.name, x + (cw - 6f) / 2f, y + 21f, 12.5f, if (enabled) Palette.TEXT else Palette.TEXT_FAINT, true, Paint.Align.CENTER)
        val sub = if (cdOk) "耗能 ${s.cost}" else "冷却 ${actor.cooldowns[s.id]}"
        r.text(c, sub, x + (cw - 6f) / 2f, y + 38f, 10f, if (enabled) Palette.TEXT_DIM else Palette.RED, false, Paint.Align.CENTER)
        hit("cb_skill_$i", x, y, cw - 6f, 50f).enabled = enabled
    }

    // 道具
    val itemIds = p.items.keys.toList()
    if (itemIds.isNotEmpty()) {
        val iy = top + 152f
        var ix = 12f
        r.text(c, "道具", 12f, iy - 4f, 11f, Palette.GOLD, true)
        for (id in itemIds.take(4)) {
            val def = com.kaiju.awaken.game.Content.itemById[id] ?: continue
            val cnt = p.items[id] ?: 0
            card(c, ix, iy + 4f, 78f, 40f, r.withAlpha(Palette.GOLD, 180), 10f)
            r.text(c, def.glyph + def.name.take(2), ix + 39f, iy + 22f, 11f, Palette.TEXT, true, Paint.Align.CENTER)
            r.text(c, "×$cnt", ix + 39f, iy + 36f, 10f, Palette.GOLD, false, Paint.Align.CENTER)
            hit("cb_item_$id", ix, iy + 4f, 78f, 40f)
            ix += 84f
        }
    } else {
        r.text(c, "没有可用道具", 14f, top + 172f, 11f, Palette.TEXT_FAINT)
    }
}

internal fun GameView.tapCombat(id: String) {
    val b = battle ?: return
    when {
        id == "cb_auto" -> {
            autoBattle = !autoBattle
            b.auto = autoBattle
        }
        id == "cb_finish" -> {
            overlay = "battle_end"
        }
        id.startsWith("cb_item_") -> {
            val itemId = id.removePrefix("cb_item_")
            b.useItem(itemId)
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
            val target = when (s.target) {
                TargetKind.ENEMY_ONE -> b.aliveEnemies().minByOrNull { it.hp }
                TargetKind.ALLY_ONE -> b.aliveAllies().minByOrNull { it.hpPct() }
                else -> actor
            }
            b.playerAct(s, target)
            audio.play(if (s.isUltimate) "crit" else "skill")
            combatDelay = 0.35f
        }
    }
}
