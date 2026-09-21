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
    // ---- 顶栏 ----
    r.panel(c, 0f, 0f, w, TOP_H, 0f, r.withAlpha(0xFF1B1040.toInt(), 244), r.withAlpha(0xFF120A2E.toInt(), 236), null)
    r.fill.color = r.withAlpha(accent, 90)
    c.drawRect(0f, TOP_H - 2f, w, TOP_H, r.fill)
    val kindLabel = when (b.kind) {
        "boss" -> "首领战"
        "elite" -> "精锐战"
        else -> "遭遇战"
    }
    r.text(c, kindLabel + " · 第 " + b.turn + "/500 回合", 14f, 30f, 16f, Palette.TEXT, true)
    r.text(c, "增伤 +" + (b.escalation() * 100).toInt() + "%   第 " + b.floor + " 层", 14f, 52f, 11.5f, accent)
    ghostButton(c, "cb_auto", if (autoBattle) "自动中" else "自动", w - 74f, 16f, 62f, 40f, if (autoBattle) Palette.GREEN else Palette.TEXT_DIM)

    // ---- 自适应行高 ----
    val cmdTop = h - CMD_H
    val avail = cmdTop - TOP_H - 46f
    val rowH = ((avail - 70f) / 2f).coerceIn(118f, 176f)
    val enemyTop = TOP_H + 8f
    val allyTop = enemyTop + rowH + 14f
    val logTop = allyTop + rowH + 10f

    drawUnitRow(c, b.enemies, enemyTop, rowH, true, b, accent)
    drawUnitRow(c, b.allies, allyTop, rowH, false, b, Palette.CYAN)

    val logBottom = (cmdTop - 8f).coerceAtLeast(logTop + 46f)
    card(c, 10f, logTop, w - 20f, logBottom - logTop, r.withAlpha(Palette.BORDER_SOFT, 180), 12f)
    var ly = logTop + 20f
    val maxLines = (((logBottom - logTop - 22f) / 15f).toInt()).coerceAtLeast(1)
    for (s in b.log.takeLast(maxLines)) {
        if (ly > logBottom - 6f) break
        r.text(c, s, 22f, ly, 11f, Palette.TEXT_DIM)
        ly += 15f
    }

    // ---- 飘字（在日志之上）----
    for (ft in b.floatTexts) {
        val pos = unitPosition(ft.target, b, rowH) ?: continue
        val rise = (1f - ft.life) * 38f
        val alpha = (ft.life.coerceIn(0f, 1f) * 255).toInt()
        val size = if (ft.isCrit) 24f else 18f
        r.text(c, ft.text, pos.first + 1f, pos.second - rise + 1f, size, r.withAlpha(0xFF000000.toInt(), alpha / 2), true, Paint.Align.CENTER)
        r.text(c, ft.text, pos.first, pos.second - rise, size, r.withAlpha(ft.color, alpha), true, Paint.Align.CENTER)
    }

    drawCommandBar(c, b)
}

/** 每行卡片的几何：返回 (起始X, 卡宽, 行高)。 */
private fun GameView.rowGeom(count: Int, rowH: Float): Triple<Float, Float, Float> {
    val n = count.coerceAtLeast(1)
    val gap = 8f
    val maxW = 128f
    var cw = (w - gap * (n + 1)) / n
    if (cw > maxW) cw = maxW
    val totalW = cw * n + gap * (n - 1)
    val startX = (w - totalW) / 2f
    return Triple(startX, cw, rowH)
}

private fun GameView.drawUnitRow(c: Canvas, list: List<Unit>, top: Float, rowH: Float, isEnemy: Boolean, b: Battle, accent: Int) {
    r.text(c, if (isEnemy) "敌方 · 点击锁定目标" else "我方", 14f, top + 11f, 11.5f, accent, true)
    val gridTop = top + 16f
    val ch = rowH - 18f
    val (startX, cw, _) = rowGeom(list.size, rowH)
    val gap = 8f
    for (i in list.indices) {
        val u = list[i]
        val x = startX + i * (cw + gap)
        val actor = b.currentActor() == u
        val border = when {
            !u.alive -> 0xFF3A2F60.toInt()
            actor -> Palette.PINK
            isEnemy -> r.withAlpha(Palette.RED, 200)
            else -> r.withAlpha(Palette.CYAN, 200)
        }
        card(c, x, gridTop, cw, ch, border, 12f)
        if (actor && u.alive) r.glowPanel(c, x, gridTop, cw, ch, 12f, Palette.PINK, 70)
        if (!u.alive) {
            r.solid(c, x, gridTop, cw, ch, 12f, r.withAlpha(0xFF0A0618.toInt(), 185))
            r.text(c, "战殁", x + cw / 2f, gridTop + ch / 2f, 14f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
            continue
        }
        val key = u.avatarKey.ifEmpty { u.clsId }
        val psize = (cw * 0.52f).coerceIn(40f, 62f)
        val cpIcon = if (isEnemy) "" else com.kaiju.awaken.game.ArtIcon.companion(key)
        if (cpIcon.isNotEmpty() && bitmap(cpIcon) != null) {
            drawIcon(c, cpIcon, x + cw / 2f, gridTop + 8f + psize / 2f, psize, if (isEnemy) Palette.RED else Palette.CYAN)
        } else {
            drawPortrait(c, key, x + cw / 2f, gridTop + 8f + psize / 2f, psize, if (isEnemy) Palette.RED else classColor(u.clsId))
        }
        // 旧值 gridTop+12+psize 只比立绘下沿低 4px，中文名的字身会压进立绘里
        // （截图上就是「名字糊在人物图上」）。改为立绘下沿再留 13px。
        var cy = gridTop + 8f + psize + 13f
        r.text(c, u.name, x + cw / 2f, cy, 11.5f, Palette.TEXT, true, Paint.Align.CENTER)
        cy += 10f
        if (isEnemy && cw > 112f) {
            r.text(c, "攻" + u.stats.atk.toInt() + " 防" + u.stats.def.toInt(), x + cw / 2f, cy, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
            cy += 10f
        }
        r.bar(c, x + 8f, cy, cw - 16f, 8f, u.hpPct().toFloat(), hpColor(u.hpPct()), hpColorDark(u.hpPct()))
        cy += 15f
        r.text(c, u.hp.toInt().toString() + "/" + u.stats.maxHp.toInt(), x + cw / 2f, cy, 10f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        cy += 8f
        if (u.shield > 0.0) {
            r.bar(c, x + 8f, cy, cw - 16f, 4f, (u.shield / u.stats.maxHp).toFloat().coerceIn(0f, 1f), Palette.SHIELD, Palette.SHIELD)
            cy += 7f
        }
        val buffs = u.buffs.filter { !it.id.startsWith("affix_") }.take(3)
        if (buffs.isNotEmpty()) {
            var bx = x + 6f
            for (bf in buffs) {
                val col = if (bf.isDebuff) Palette.RED else Palette.GREEN
                r.solid(c, bx, cy, 28f, 14f, 7f, r.withAlpha(col, 215))
                r.text(c, bf.name.take(2), bx + 14f, cy + 11f, 8.5f, 0xFF140B26.toInt(), true, Paint.Align.CENTER)
                bx += 31f
            }
        }
    }
}

private fun GameView.unitPosition(u: Unit, b: Battle, rowH: Float): Pair<Float, Float>? {
    val enemyTop = TOP_H + 8f
    val allyTop = enemyTop + rowH + 14f
    val ei = b.enemies.indexOf(u)
    if (ei >= 0) {
        val (sx, cw, _) = rowGeom(b.enemies.size, rowH)
        return (sx + ei * (cw + 8f) + cw / 2f) to (enemyTop + 16f + 30f)
    }
    val ai = b.allies.indexOf(u)
    if (ai >= 0) {
        val (sx, cw, _) = rowGeom(b.allies.size, rowH)
        return (sx + ai * (cw + 8f) + cw / 2f) to (allyTop + 16f + 30f)
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
        drawIcon(c, com.kaiju.awaken.game.ArtIcon.skill(s), x + 20f, y + 24f, 30f, accent)
        r.text(c, s.name, x + 38f, y + 21f, 11.5f, if (costOk) Palette.TEXT else Palette.TEXT_FAINT, true)
        r.text(c, "耗能 " + s.cost, x + 38f, y + 37f, 9.5f, if (costOk) Palette.TEXT_DIM else Palette.RED)
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
            drawIcon(c, com.kaiju.awaken.game.ArtIcon.item(id), ix + 20f, iy + 12f, 30f, Palette.GOLD)
            r.text(c, "×" + cnt, ix + 46f, iy + 18f, 11f, Palette.GOLD, true, Paint.Align.CENTER)
            hit("cb_item_$id", ix, iy - 10f, 62f, 44f)
            ix += 66f
        }
    } else {
        r.text(c, "无可用道具", 16f, iy + 10f, 11.5f, Palette.TEXT_FAINT)
    }
}

private var lastVoiceMs = 0L

internal fun GameView.tapCombat(id: String) {
    val b = battle ?: return
    when {
        id == "cb_auto" -> {
            autoBattle = !autoBattle
            b.auto = autoBattle
            b.awaitingInput = false
            combatDelay = 0.15f
            showToast(if (autoBattle) "已开启自动战斗" else "已切回手动")
        }
        id == "cb_finish" -> overlay = "battle_end"
        id.startsWith("cb_target_") -> {
            preferredTargetId = id.removePrefix("cb_target_")
            showToast("已锁定目标")
        }
        id.startsWith("cb_item_") -> {
            val iid = id.removePrefix("cb_item_")
            b.useItem(iid)
            audio.play(com.kaiju.awaken.game.ArtIcon.itemSfx(iid))
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
            audio.play(com.kaiju.awaken.game.ArtIcon.skillSfx(s))
            if (s.isUltimate) {
                (run)?.let { audio.playSkillVoice(it.classId, s.id, "ult") }
            } else if (System.currentTimeMillis() - lastVoiceMs > 900L) {
                // 节流放宽到 0.9s：playVoice 是覆盖式播放，同一时刻只会响一条，
                // 旧值 4.5s 会让大部分技能根本轮不到自己的专属语音。
                lastVoiceMs = System.currentTimeMillis()
                (run)?.let { audio.playSkillVoice(it.classId, s.id, "skill") }
            }
            combatDelay = 0.32f
        }
    }
}
