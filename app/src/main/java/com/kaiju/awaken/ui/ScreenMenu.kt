package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.ArtIcon
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.GameMode
import com.kaiju.awaken.game.Rarity
import com.kaiju.awaken.game.School
import com.kaiju.awaken.game.Talent
import com.kaiju.awaken.game.RunService
import com.kaiju.awaken.game.TowerService
import com.kaiju.awaken.ui.GameView.Screen

internal fun GameView.drawMenuScreen(c: Canvas) {
    // 整屏滚动化：标题区 + 战绩卡 + 存档卡 + 7 个按钮在矮屏（4:3 平板 h≈533、3:2 h≈600）
    // 上必然重叠。把按钮一并纳入流式布局后，任何高度都不会再硬碰撞；
    // 够高的屏幕仍用留白把按钮压到底部，观感不变。
    var y = beginScroll(c, 18f, h - 12f)

    // 矮屏（4:3 平板 h≈533）压缩标题区留白，把纵向空间让给按钮
    val ts = if (h < 620f) 0.76f else 1f
    val titleY = y + 42f * ts
    // 主标题
    r.text(c, "觉醒", w / 2f, titleY, 46f, Palette.TEXT, true, Paint.Align.CENTER)
    r.text(c, "曜神天赋", w / 2f, titleY + 54f, 42f, Palette.PINK, true, Paint.Align.CENTER)
    r.sparkle(c, w * 0.16f, titleY - 18f, 16f, Palette.CYAN)
    r.sparkle(c, w * 0.85f, titleY + 30f, 12f, Palette.PINK)

    r.text(c, "曜 界 回 廊", w / 2f, titleY + 96f * ts, 17f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "神格环上同源共鸣，这一次轮回更接近晨曦。", w / 2f, titleY + 128f * ts, 12.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    // 战绩面板
    val pw = w - 48f
    val py = titleY + 158f * ts
    card(c, 24f, py, pw, 96f, r.withAlpha(Palette.BORDER, 190))
    val cols = 3
    val cellW = pw / cols
    val stats = listOf(
        "最高层数" to "${perm.bestFloor}",
        "神格点" to "${perm.talentPoints}",
        "轮回次数" to "${perm.totalRuns}"
    )
    for (i in 0 until cols) {
        val cx = 24f + cellW * i + cellW / 2f
        r.text(c, stats[i].first, cx, py + 36f, 12f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
        r.text(c, stats[i].second, cx, py + 70f, 24f, Palette.GOLD, true, Paint.Align.CENTER)
        if (i > 0) {
            r.fill.color = r.withAlpha(Palette.BORDER_SOFT, 180)
            c.drawRect(24f + cellW * i, py + 22f, 24f + cellW * i + 1.5f, py + 76f, r.fill)
        }
    }

    // 存档状态：只作信息展示，顶部主按钮按状态切换文案
    val savedRun = run
    var by = py + 96f
    if (savedRun != null) {
        by += 12f
        card(c, 24f, by, pw, 62f, r.withAlpha(Palette.CYAN, 170))
        r.text(c, "远征进行中", 40f, by + 27f, 14f, Palette.CYAN, true)
        r.text(c, "${Data.classById[savedRun.classId]?.name ?: ""} · ${savedRun.mode.cn}模式 · 第 ${savedRun.floor} 层", 40f, by + 48f, 12f, Palette.TEXT_DIM)
        by += 62f
    }

    // 标题界面只保留「开始/继续 · 设置 · 关于」。
    // 图鉴 / 成就 / 星尘兑换 / 存档 属于游戏内功能，已迁到「回廊前厅」，
    // 不再在开局堆一屏玩家看不懂用途的按钮。
    // 矮屏把按钮间距从 16 收到 6：整块高度从 218 降到 188，
    // 按钮之间不再挤成一片，也不会因为压缩而互相压叠。
    val bGap = if (h < 620f) 6f else 16f
    val blockH = 56f + 48f + 48f + bGap * 3 + 20f + 14f
    val pushTo = h - 12f - blockH - 8f
    if (by + 20f < pushTo) by = pushTo - 20f
    by += 20f

    val bw = w - 96f
    button(c, "menu_start", if (savedRun == null) "开 始 游 戏" else "继 续 游 戏", 48f, by, bw, 56f, Palette.PINK)
    by += 56f + bGap
    ghostButton(c, "menu_settings", "设 置", 48f, by, bw, 48f, Palette.CYAN)
    by += 48f + bGap
    ghostButton(c, "menu_about", "关 于", 48f, by, bw, 48f, Palette.TEXT_DIM)
    by += 48f + bGap

    r.text(c, "v1.3.0 · PixelForge", w / 2f, by, 11f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
    by += 14f
    endScroll(c, by)
}

internal fun GameView.tapMenu(id: String) {
    when (id) {
        // 统一走 goScreen：它会重置 screenScroll，否则主菜单滚过之后
        // 下一个可滚动屏幕会继承菜单的滚动位置
        "menu_start" -> {
            run?.let { RunService.recalcAll(it, perm) }
            goScreen(Screen.HUB)
        }
        "menu_about" -> { metaReturn = Screen.MENU; goScreen(Screen.ABOUT) }
        "menu_settings" -> panel = "settings"
    }
}

internal fun GameView.drawSetupScreen(c: Canvas) {
    drawTopBar(c, "轮回编成", "选择模式与职阶，随后觉醒神格", "setup_back", null, null)

    // 改为可滚动：旧实现内容总高约 740，在 h=711 的 16:9 屏上「职阶网格」
    // 会与底部「觉醒天赋」按钮重叠，职阶说明卡直接被挤出屏幕。
    var y = beginScroll(c, 100f)

    // 角色名：进入游戏前必须先命名，且命名后角色不可更换
    card(c, 24f, y, w - 48f, 58f, r.withAlpha(Palette.GOLD, 200), 14f)
    r.text(c, "角色名", 38f, y + 24f, 11.5f, Palette.TEXT_DIM)
    r.text(c, if (playerName.isBlank()) "点 击 命 名" else playerName, 38f, y + 46f, 16f,
        if (playerName.isBlank()) Palette.TEXT_FAINT else Palette.GOLD, true)
    hit("setup_name", 24f, y, w - 48f, 58f)
    y += 70f

    r.text(c, "试炼强度", 24f, y, 15f, Palette.CYAN, true)
    y += 12f
    val modes = GameMode.values()
    val mw = (w - 48f - 12f) / 2f
    // 模式卡高度与行距跟随字号：大字号下固定 60f 卡片会压住下一行
    val modeStep = r.lh(70f)
    val modeH = r.lh(60f)
    for (i in modes.indices) {
        val col = i % 2
        val row = i / 2
        val x = 24f + col * (mw + 12f)
        val yy = y + row * modeStep
        val sel = setupMode == modes[i]
        val border = if (sel) Palette.PINK else Palette.BORDER_SOFT
        card(c, x, yy, mw, modeH, border, 14f)
        if (sel) r.glowPanel(c, x, yy, mw, modeH, 14f, Palette.PINK, 46)
        // 模式 emoji 换成 PNG 图标（缺图自动回退原字符）
        val mcol = if (sel) Palette.PINK else Palette.TEXT
        val mtx = inlineIcon(c, ArtIcon.mode(modes[i]), modes[i].glyph, x + 14f, yy + 26f, 15f, mcol, 17f)
        r.text(c, modes[i].cn, mtx, yy + 26f, 15f, mcol, true)
        val sub = if (modes[i].endFloor == 0) "无界 · 难度 ×${modes[i].mult}" else "目标 ${modes[i].endFloor} 层 · 难度 ×${modes[i].mult}"
        r.text(c, sub, x + 14f, yy + 46f, 11f, Palette.TEXT_DIM)
        hit("setup_mode_" + modes[i].id, x, yy, mw, modeH)
    }
    y += modeStep * 3 + 6f

    if (setupMode == GameMode.CLIMB) {
        val tier = com.kaiju.awaken.game.Content2.climbTiers[(setupClimbLevel - 1).coerceIn(0, 49)]
        card(c, 24f, y, w - 48f, 62f, r.withAlpha(Palette.GOLD, 210), 14f)
        r.text(c, "迭塔难度 Lv." + tier.level, 38f, y + 22f, 13f, Palette.GOLD, true)
        r.text(c, tier.name + " · 敌军 ×" + String.format("%.1f", tier.enemyMul) + " · 神格点 ×" + String.format("%.1f", tier.tpMul), 38f, y + 40f, 10.5f, Palette.TEXT_DIM)
        r.text(c, tier.desc, 38f, y + 56f, 10f, Palette.TEXT_FAINT)
        ghostButton(c, "setup_climb_down", "－", w - 144f, y + 14f, 42f, 34f, Palette.TEXT_DIM)
        ghostButton(c, "setup_climb_up", "＋", w - 96f, y + 14f, 42f, 34f, Palette.CYAN)
        r.text(c, "已解锁 " + perm.climbMaxUnlocked + " 档", w - 154f, y + 34f, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.RIGHT)
        y += modeStep
    }
    y += 8f

    r.text(c, "职阶", 24f, y, 15f, Palette.CYAN, true)
    y += 12f
    val cw = (w - 48f - 3 * 8f) / 4f
    for (i in Data.classes.indices) {
        val cls = Data.classes[i]
        val col = i % 4
        val row = i / 4
        val x = 24f + col * (cw + 8f)
        val yy = y + row * (cw + 26f)
        val unlocked = com.kaiju.awaken.game.Meta.classUnlocked(perm, cls.id)
        val sel = setupClass == cls.id && unlocked
        val accent = if (unlocked) classColor(cls.id) else Palette.TEXT_FAINT
        card(c, x, yy, cw, cw + 18f, if (sel) accent else Palette.BORDER_SOFT, 14f)
        if (sel) r.glowPanel(c, x, yy, cw, cw + 18f, 14f, accent, 52)
        if (unlocked) {
            drawPortrait(c, cls.id, x + cw / 2f, yy + cw * 0.42f, cw * 0.66f, accent)
        } else {
            r.hexFrame(c, x + cw / 2f, yy + cw * 0.42f, cw * 0.3f, Palette.TEXT_FAINT, r.withAlpha(Palette.PANEL_SOFT, 255))
            r.text(c, "锁", x + cw / 2f, yy + cw * 0.46f, 14f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
        }
        r.text(c, if (unlocked) cls.name else "未解锁", x + cw / 2f, yy + cw + 6f, 13f, if (sel) accent else Palette.TEXT_DIM, true, Paint.Align.CENTER)
        hit("setup_class_" + cls.id, x, yy, cw, cw + 18f)
    }
    y += (cw + 26f) * 2f + 6f

    // 职阶说明
    val cls = Data.classById[setupClass] ?: Data.classes[0]
    card(c, 24f, y, w - 48f, 74f, r.withAlpha(classColor(cls.id), 170))
    r.text(c, "「${cls.title}」 ${cls.name}", 38f, y + 26f, 14f, classColor(cls.id), true)
    r.wrap(c, cls.desc, 38f, y + 46f, w - 76f, 12f, Palette.TEXT_DIM, 16f)
    r.text(c, "主面板：${primaryLabel(cls.primary)}   战技 ${cls.skills.size} 个", 38f, y + 66f, 11f, Palette.TEXT_FAINT)

    endScroll(c, y + 14f)

    button(c, "setup_go", "觉 醒 天 赋", 48f, h - 92f, w - 96f, 58f, Palette.PINK)
}

private fun primaryLabel(p: String): String = when (p) {
    "str" -> "力量"
    "agi" -> "敏捷"
    "int" -> "智力"
    else -> "体质"
}

internal fun GameView.tapSetup(id: String) {
    when {
        id == "setup_back" -> screen = Screen.MENU
        id.startsWith("setup_mode_") -> setupMode = GameMode.byId(id.removePrefix("setup_mode_"))
        id.startsWith("setup_class_") -> {
            val cid = id.removePrefix("setup_class_")
            if (com.kaiju.awaken.game.Meta.classUnlocked(perm, cid)) {
                setupClass = cid
            } else {
                showToast("该职阶未解锁，可在「星尘兑换」中解锁")
            }
        }
        id == "setup_name" -> askPlayerName()
        id == "setup_go" -> {
            if (playerName.isBlank()) {
                audio.play("error")
                showToast("请先给角色命名")
                return
            }
            startRun()
        }
        id == "setup_climb_up" -> {
            if (setupClimbLevel < perm.climbMaxUnlocked) setupClimbLevel++
            else showToast("通关当前档位后解锁下一档")
        }
        id == "setup_climb_down" -> {
            if (setupClimbLevel > 1) setupClimbLevel--
        }
    }
}

internal fun GameView.drawDivinityScreen(c: Canvas) {
    r.text(c, "曜神觉醒", w / 2f, 92f, 28f, Palette.GOLD, true, Paint.Align.CENTER)
    r.text(c, "命途选中了你。三选一，它将占据神格位，永不掉落。", w / 2f, 120f, 12.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    val cardW = w - 56f
    val cardH = 132f
    var y = beginScroll(c, 152f)
    for (i in divinityOptions.indices) {
        val t = divinityOptions[i]
        drawTalentCard(c, t, 28f, y, cardW, cardH, "div_pick_$i", 1)
        y += cardH + 14f
    }
    endScroll(c, y)
}

internal fun GameView.tapDivinity(id: String) {
    if (!id.startsWith("div_pick_")) return
    val idx = id.removePrefix("div_pick_").toIntOrNull() ?: return
    val t = divinityOptions.getOrNull(idx) ?: return
    val p = run ?: return
    com.kaiju.awaken.game.DraftService.applyDivinity(p, t)
    audio.play("levelup")
    beginDraft(3)
}

internal fun GameView.drawTalentCard(c: Canvas, t: Talent, x: Float, y: Float, ww: Float, hh: Float, id: String, star: Int) {
    val col = rarityColor(t.rarity)
    card(c, x, y, ww, hh, col, 16f)
    r.glowPanel(c, x, y, ww, hh, 16f, col, if (t.rarity.rank >= 5) 60 else 30)
    // 系别徽记
    val hexCx = x + 40f
    val hexCy = y + 40f
    r.hexFrame(c, hexCx, hexCy, 24f, col, r.withAlpha(Palette.PANEL_SOFT, 255))
    r.text(c, t.school.glyph, hexCx, hexCy + 8f, 20f, col, true, Paint.Align.CENTER)

    r.text(c, t.name, x + 74f, y + 32f, 18f, Palette.TEXT, true)
    val rl = t.rarity.cn + " · " + t.school.cn + " · "
    r.text(c, rl, x + 74f, y + 52f, 11.5f, col)
    starRow(c, star.coerceIn(1, 3), x + 74f + r.measure(rl, 11.5f), y + 52f, 12f, col)
    r.wrap(c, t.desc, x + 74f, y + 74f, ww - 92f, 12f, Palette.TEXT_DIM, 16f)
    hit(id, x, y, ww, hh)
}

internal fun GameView.drawDraftScreen(c: Canvas) {
    if (replacePick && pendingOption != null) {
        drawReplacePicker(c)
        return
    }
    r.text(c, "神格觉醒", w / 2f, 88f, 28f, Palette.PINK, true, Paint.Align.CENTER)
    r.text(c, "剩余 ${picksLeft} / ${picksTotal} 次抉择", w / 2f, 114f, 13f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    r.text(c, "同类天赋相邻放置会结成共鸣链，获得全局加成", w / 2f, 136f, 11.5f, Palette.CYAN, false, Paint.Align.CENTER)

    val p = run
    if (p != null) drawResonanceStrip(c, p, 158f)

    val cardW = w - 56f
    val cardH = r.lh(118f)
    // 加滚动：旧实现第 4 张天赋卡（大号字体/矮屏时连第 3 张）会落到屏幕外且无法触达。
    var y = beginScroll(c, if (p != null) 262f else 168f)
    for (i in draftOptions.indices) {
        val o = draftOptions[i]
        drawTalentCard(c, o.talent, 28f, y, cardW, cardH, "draft_pick_$i", o.star)
        if (p != null && p.grid.indexOf(o.talent.id) >= 0) {
            r.solid(c, cardW - 66f, y + 12f, 54f, 22f, 11f, r.withAlpha(Palette.GOLD, 220))
            r.text(c, "升星", cardW - 39f, y + 28f, 11f, 0xFF2A1A00.toInt(), true, Paint.Align.CENTER)
        }
        y += cardH + 12f
    }
    endScroll(c, y)
}

private fun GameView.drawReplacePicker(c: Canvas) {
    val p = run ?: return
    val opt = pendingOption ?: return
    r.text(c, "神格环已满", w / 2f, 88f, 26f, Palette.GOLD, true, Paint.Align.CENTER)
    r.text(c, "选择被【${opt.talent.name}】覆盖的神格", w / 2f, 114f, 12.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    val cw = (w - 48f - 12f) / 2f
    for (i in 0 until 6) {
        val t = p.grid.slots[i]
        val x = 24f + (i % 2) * (cw + 12f)
        val y = 140f + (i / 2) * 116f
        if (t == null) {
            card(c, x, y, cw, 104f, Palette.BORDER_SOFT)
            r.text(c, "空位", x + cw / 2f, y + 56f, 13f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
            hit("draft_slot_$i", x, y, cw, 104f)
        } else {
            val col = rarityColor(t.rarity)
            card(c, x, y, cw, 104f, col)
            r.hexFrame(c, x + 34f, y + 34f, 20f, col, r.withAlpha(Palette.PANEL_SOFT, 255))
            r.text(c, t.school.glyph, x + 34f, y + 41f, 17f, col, true, Paint.Align.CENTER)
            r.text(c, t.name, x + 62f, y + 28f, 14f, Palette.TEXT, true)
            val rs = t.rarity.cn + " · "
            r.text(c, rs, x + 62f, y + 46f, 11f, col)
            starLevel(c, p.grid.stars[i], x + 62f + r.measure(rs, 11f), y + 46f, 11.5f, Palette.GOLD)
            r.wrap(c, t.desc, x + 12f, y + 70f, cw - 24f, 10.5f, Palette.TEXT_DIM, 13f)
            hit("draft_slot_$i", x, y, cw, 104f)
        }
    }
    ghostButton(c, "draft_cancel_replace", "返回重选", 24f, h - 76f, w - 48f, 50f, Palette.TEXT_DIM)
}

internal fun GameView.drawResonanceStrip(c: Canvas, p: com.kaiju.awaken.game.RunState, top: Float) {
    val bonus = p.grid.resonanceBonus()
    val panelW = w - 48f
    card(c, 24f, top, panelW, 92f, r.withAlpha(Palette.CYAN, 170), 14f)
    r.text(c, "神格环 · " + bonus.label(), 38f, top + 24f, 13.5f, Palette.CYAN, true)
    val slotR = 15f
    val gap = (panelW - 60f - slotR * 12f) / 5f
    for (i in 0 until 6) {
        val cx = 38f + slotR + i * (slotR * 2f + gap)
        val cy = top + 62f
        val t = p.grid.slots[i]
        val edges = p.grid.resonanceEdges()
        val linked = edges.any { it.first == i || it.second == i }
        if (t == null) {
            r.hexFrame(c, cx, cy, slotR, Palette.BORDER_SOFT, r.withAlpha(Palette.PANEL_DEEP, 255))
        } else {
            val col = rarityColor(t.rarity)
            r.hexFrame(c, cx, cy, slotR, if (linked) Palette.CYAN else col, r.withAlpha(Palette.PANEL_SOFT, 255))
            r.text(c, t.school.glyph, cx, cy + 5.5f, 14f, col, true, Paint.Align.CENTER)
        }
        if (i < 5) {
            val lx = cx + slotR
            val rx = cx + slotR + gap
            val on = edges.any { it.first == i && it.second == i + 1 }
            r.stroke.shader = null
            r.stroke.color = if (on) Palette.CYAN else r.withAlpha(Palette.BORDER_SOFT, 160)
            r.stroke.strokeWidth = if (on) 3f else 1.5f
            c.drawLine(lx + 2f, cy, rx - 2f, cy, r.stroke)
        }
    }
    val dv = p.grid.divinity
    if (dv != null) {
        r.text(c, "神格：${dv.name}", 38f, top + 86f, 11f, Palette.GOLD)
    }
    r.text(c, "增伤 +${(bonus.damage * 100).toInt()}% 生命 +${(bonus.hp * 100).toInt()}%", w - 38f, top + 86f, 11f, Palette.PINK, false, Paint.Align.RIGHT)
}

internal fun GameView.tapDraft(id: String) {
    val p = run ?: return
    if (id == "draft_cancel_replace") {
        pendingOption = null
        replacePick = false
        return
    }
    if (id.startsWith("draft_slot_")) {
        val idx = id.removePrefix("draft_slot_").toIntOrNull() ?: return
        val opt = pendingOption ?: return
        com.kaiju.awaken.game.DraftService.place(p, opt, idx)
        com.kaiju.awaken.game.DraftService.notePicked(p, opt.talent)
        pendingOption = null
        replacePick = false
        finishDraftStep()
        return
    }
    if (!id.startsWith("draft_pick_")) return
    val idx = id.removePrefix("draft_pick_").toIntOrNull() ?: return
    val opt = draftOptions.getOrNull(idx) ?: return
    if (p.grid.isFull() && p.grid.indexOf(opt.talent.id) < 0) {
        pendingOption = opt
        replacePick = true
        return
    }
    com.kaiju.awaken.game.DraftService.place(p, opt, -1)
    com.kaiju.awaken.game.DraftService.notePicked(p, opt.talent)
    finishDraftStep()
}

private fun GameView.finishDraftStep() {
    audio.play("levelup")
    picksLeft--
    if (picksLeft > 0) {
        val p = run ?: return
        draftOptions = com.kaiju.awaken.game.DraftService.roll(p, perm, com.kaiju.awaken.game.DraftService.optionCount(p, perm))
    } else {
        afterDraft()
    }
}
