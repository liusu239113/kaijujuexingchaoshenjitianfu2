package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Content
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.DraftService
import com.kaiju.awaken.game.Equip
import com.kaiju.awaken.game.Rarity
import com.kaiju.awaken.game.RunService
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.TowerService
import com.kaiju.awaken.ui.GameView.Screen

internal fun GameView.drawPanelOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 226))
    val p = run
    val top = 70f
    val bottom = h - 78f
    card(c, 18f, top, w - 36f, bottom - top, r.withAlpha(Palette.BORDER, 210), 20f)
    val title = when (panel) {
        "bag" -> "背包"
        "equip" -> "装备"
        "skills" -> "技能"
        "talents" -> "共鸣盘"
        "attrs" -> "属性"
        "items" -> "道具"
        "settings" -> "设置"
        else -> ""
    }
    r.text(c, title, w / 2f, top + 42f, 21f, Palette.CYAN, true, Paint.Align.CENTER)
    if (p != null) r.text(c, "💰 ${p.gold}    ✨ ${perm.talentPoints}", w / 2f, top + 64f, 12f, Palette.GOLD, false, Paint.Align.CENTER)

    var y = top + 84f
    when (panel) {
        "bag" -> {
            if (p == null) return
            if (p.bag.isEmpty()) {
                r.text(c, "背包是空的。", w / 2f, y + 40f, 14f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
            }
            for (i in p.bag.indices) {
                if (y > bottom - 90f) break
                val e = p.bag[i]
                drawEquipRow(c, e, 36f, y, w - 72f, "panel_equip_$i", "装备", Palette.CYAN)
                y += 82f
            }
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
        "equip" -> {
            if (p == null) return
            for (slot in Content.slots) {
                val e = p.equipped[slot.id]
                r.text(c, slot.glyph + " " + slot.cn, 36f, y + 16f, 13f, Palette.TEXT_DIM, true)
                if (e == null) {
                    r.text(c, "未装备", w - 60f, y + 16f, 12f, Palette.TEXT_FAINT, false, Paint.Align.RIGHT)
                } else {
                    drawEquipRow(c, e, 36f, y + 24f, w - 72f, "panel_enhance_${slot.id}", "强化", Palette.GOLD)
                }
                y += 104f
            }
            ghostButton(c, "panel_auto", "一键换装（自动装备更强的装备）", 36f, bottom - 64f, w - 72f, 48f, Palette.GREEN)
        }
        "skills" -> {
            if (p == null) return
            val hero = p.hero()
            r.text(c, "技能点 ${p.skillPoints} · Lv.${p.level}", 36f, y, 13f, Palette.GOLD, true)
            y += 14f
            for (s in hero.skills) {
                val lv = heroSkillLevel(p, s.id)
                card(c, 36f, y, w - 72f, 72f, if (s.isUltimate) Palette.GOLD else Palette.BORDER_SOFT, 12f)
                r.text(c, s.name, 48f, y + 26f, 14f, Palette.TEXT, true)
                r.text(c, (if (s.isUltimate) "终极技 · " else "") + "耗能 ${s.cost} 冷却 ${s.cd} · Lv.$lv/3", 48f, y + 46f, 11f, Palette.TEXT_DIM)
                r.wrap(c, s.desc, 48f, y + 64f, w - 150f, 10.5f, Palette.TEXT_FAINT, 0f)
                if (lv < 3) {
                    val cost = listOf(1, 2, 3)[lv.coerceIn(0, 2)]
                    ghostButton(c, "panel_learn_${s.id}", "升级 $cost", w - 110f, y + 20f, 68f, 34f, Palette.CYAN)
                }
                y += 80f
            }
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
        "talents" -> {
            if (p == null) return
            drawResonanceStrip(c, p, y)
            y += 106f
            val dv = p.grid.divinity
            if (dv != null) {
                card(c, 36f, y, w - 72f, 60f, Palette.GOLD, 12f)
                r.text(c, "神格位 · ${dv.name}", 48f, y + 26f, 14f, Palette.GOLD, true)
                r.text(c, "★${p.grid.divinityStar} · 不可被覆盖", 48f, y + 46f, 11f, Palette.TEXT_DIM)
                y += 68f
            }
            for (i in 0 until 6) {
                val t = p.grid.slots[i] ?: continue
                val col = rarityColor(t.rarity)
                card(c, 36f, y, w - 72f, 66f, col, 12f)
                r.text(c, t.name + "  ★${p.grid.stars[i]}", 48f, y + 24f, 13.5f, Palette.TEXT, true)
                r.text(c, t.rarity.cn + " · " + t.school.cn + " · 槽位 ${i + 1}", 48f, y + 42f, 10.5f, col)
                val cost = t.enhanceCost(p.grid.stars[i] - 1)
                if (p.grid.stars[i] < 3) {
                    ghostButton(c, "panel_star_$i", "升星 $cost", w - 118f, y + 16f, 76f, 34f, Palette.GOLD)
                }
                y += 72f
            }
            r.text(c, "天赋点：${perm.talentPoints}", 36f, bottom - 76f, 12f, Palette.GOLD)
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
        "attrs" -> {
            if (p == null) return
            val hero = p.hero()
            val rows = listOf(
                "生命" to "${hero.stats.maxHp.toInt()}",
                "攻击" to "${hero.stats.atk.toInt()}",
                "法强" to "${hero.stats.matk.toInt()}",
                "防御" to "${hero.stats.def.toInt()}",
                "暴击" to "${hero.stats.crit.toInt()}%",
                "暴伤" to "${hero.stats.critDmg.toInt()}%",
                "闪避" to "${hero.stats.dodge.toInt()}%",
                "回能" to "${hero.stats.energyRegen.toInt()}",
                "吸血" to "${(hero.stats.lifesteal * 100).toInt()}%",
                "减伤" to "${(hero.stats.dmgReduction * 100).toInt()}%",
                "增伤" to "${(hero.stats.dmgBonus * 100).toInt()}%",
                "破甲" to "${(hero.stats.armorPen * 100).toInt()}%",
                "状态抗性" to "${hero.stats.statusRes.toInt()}"
            )
            val colW = (w - 72f) / 2f
            for (i in rows.indices) {
                val cx = 36f + (i % 2) * colW
                val cy = y + (i / 2) * 34f
                r.text(c, rows[i].first, cx, cy + 20f, 12f, Palette.TEXT_DIM)
                r.text(c, rows[i].second, cx + colW - 14f, cy + 20f, 13.5f, Palette.TEXT, true, Paint.Align.RIGHT)
            }
            y += ((rows.size + 1) / 2) * 34f + 8f
            r.text(c, "共鸣：" + p.grid.resonanceBonus().label() + " · " + (Data.classById[p.classId]?.name ?: ""), 36f, y + 16f, 12f, Palette.CYAN, true)
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
        "items" -> {
            if (p == null) return
            for (it in Content.items) {
                val cnt = p.items[it.id] ?: 0
                card(c, 36f, y, w - 72f, 62f, if (cnt > 0) r.withAlpha(Palette.GOLD, 190) else r.withAlpha(Palette.BORDER_SOFT, 120), 12f)
                r.text(c, it.glyph, 58f, y + 38f, 22f, Palette.GOLD)
                r.text(c, it.name + "  ×$cnt", 88f, y + 26f, 13.5f, Palette.TEXT, true)
                r.text(c, it.desc, 88f, y + 46f, 10.5f, Palette.TEXT_DIM)
                y += 70f
            }
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
        "settings" -> {
            r.text(c, "🎵 音乐音量 ${perm.musicVolume}%", 40f, y + 20f, 14f, Palette.TEXT)
            for (i in 0 until 4) {
                val v = (i + 1) * 25
                ghostButton(c, "panel_vol_$v", "$v%", 40f + i * 84f, y + 34f, 76f, 40f, if (perm.musicVolume == v) Palette.CYAN else Palette.TEXT_DIM)
            }
            y += 92f
            ghostButton(c, "panel_toggle_music", "音乐：${if (perm.musicOn) "开启" else "关闭"}", 40f, y, w - 80f, 46f, if (perm.musicOn) Palette.GREEN else Palette.TEXT_DIM)
            y += 56f
            ghostButton(c, "panel_toggle_sfx", "音效：${if (perm.sfxOn) "开启" else "关闭"}", 40f, y, w - 80f, 46f, if (perm.sfxOn) Palette.GREEN else Palette.TEXT_DIM)
            y += 66f
            r.wrap(c, "本作完全离线运行：无账号、无登录、无广告、无联网权限。所有存档仅保存在本机。", 40f, y, w - 80f, 12f, Palette.TEXT_DIM, 18f)
            y += 62f
            ghostButton(c, "panel_reset", "清空存档并回到标题", 40f, y, w - 80f, 46f, Palette.RED)
            ghostButton(c, "panel_close", "关闭", 36f, bottom - 64f, w - 72f, 48f, Palette.TEXT_DIM)
        }
    }
}

private fun heroSkillLevel(p: com.kaiju.awaken.game.RunState, skillId: String): Int =
    p.hero().cooldowns.keys.size.let { 1 }

private fun GameView.drawEquipRow(c: Canvas, e: Equip, x: Float, y: Float, ww: Float, id: String, action: String, accent: Int) {
    val col = rarityColor(e.rarity)
    card(c, x, y, ww, 72f, col, 12f)
    r.text(c, e.name, x + 12f, y + 24f, 13.5f, Palette.TEXT, true)
    val main = mainLabel(e.mainKey) + " +" + e.mainValue.toInt()
    r.text(c, e.rarity.cn + " · " + main + (if (e.enhance > 0) " · +${e.enhance}" else ""), x + 12f, y + 44f, 10.5f, col)
    val affixTxt = e.affixes.take(2).joinToString("  ") { it.label + " +" + it.value.toInt() }
    if (affixTxt.isNotEmpty()) r.text(c, affixTxt, x + 12f, y + 62f, 9.5f, Palette.TEXT_DIM)
    ghostButton(c, id, action, x + ww - 84f, y + 18f, 72f, 36f, accent)
}

private fun mainLabel(key: String): String = when (key) {
    "atk" -> "攻击"
    "matk" -> "法强"
    "maxHp" -> "生命"
    "def" -> "防御"
    "crit" -> "暴击"
    else -> key
}

internal fun GameView.tapPanel(id: String) {
    // 这些操作不依赖本轮进度（主菜单也能打开设置）
    when (id) {
        "panel_close" -> { panel = ""; return }
        "panel_vol_25" -> { setVol(25); return }
        "panel_vol_50" -> { setVol(50); return }
        "panel_vol_75" -> { setVol(75); return }
        "panel_vol_100" -> { setVol(100); return }
        "panel_toggle_music" -> {
            perm.musicOn = perm.musicOn.not()
            audio.setMusicEnabled(perm.musicOn)
            if (perm.musicOn && run != null) audio.playBgm(if (screen == Screen.COMBAT) "battle" else "tower")
            return
        }
        "panel_toggle_sfx" -> {
            perm.sfxOn = perm.sfxOn.not()
            audio.sfxOn = perm.sfxOn
            return
        }
        "panel_reset" -> {
            Save.clearRun(context)
            perm = com.kaiju.awaken.game.PermState()
            Save.savePerm(context, perm)
            run = null
            battle = null
            panel = ""
            screen = Screen.MENU
            showToast("存档已清空")
            return
        }
    }
    val p = run ?: return
    when {
        id == "panel_auto" -> {
            TowerService.autoEquipUpgrades(p, perm)
            showToast("已自动装备更强的装备")
        }
        id.startsWith("panel_equip_") -> {
            val idx = id.removePrefix("panel_equip_").toIntOrNull() ?: return
            val e = p.bag.getOrNull(idx) ?: return
            val cur = p.equipped[e.slot]
            p.bag.removeAt(idx)
            p.equipped[e.slot] = e
            if (cur != null) p.bag.add(cur)
            RunService.recalcAll(p, perm)
            showToast("已装备 ${e.name}")
        }
        id.startsWith("panel_enhance_") -> {
            val slot = id.removePrefix("panel_enhance_")
            val e = p.equipped[slot] ?: return
            val max = Content.enhanceMax(perm)
            if (e.enhance >= max) {
                showToast("已达强化上限 +$max")
                return
            }
            val cost = TowerService.goldNeeded(e, perm)
            if (p.gold < cost) {
                showToast("金币不足（需要 $cost）")
                return
            }
            p.gold -= cost
            e.enhance++
            RunService.recalcAll(p, perm)
            audio.play("levelup")
        }
        id.startsWith("panel_learn_") -> {
            val sid = id.removePrefix("panel_learn_")
            if (p.skillPoints <= 0) {
                showToast("技能点不足")
                return
            }
            p.skillPoints--
            RunService.recalcAll(p, perm)
            audio.play("levelup")
            showToast("技能已强化")
        }
        id.startsWith("panel_star_") -> {
            val idx = id.removePrefix("panel_star_").toIntOrNull() ?: return
            if (DraftService.enhance(p, perm, idx)) {
                RunService.recalcAll(p, perm)
                audio.play("levelup")
            } else {
                showToast("天赋点不足或已满星")
            }
        }
    }
}

private fun GameView.setVol(v: Int) {
    perm.musicVolume = v
    audio.setVolume(v)
}

internal fun GameView.drawOverlay(c: Canvas) {
    when (overlay) {
        "shop" -> drawShopOverlay(c)
        "tavern" -> drawTavernOverlay(c)
        "battle_end" -> drawBattleEndOverlay(c)
    }
}

private fun GameView.drawBattleEndOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 232))
    val b = battle
    val win = b?.victory == true
    val accent = if (win) Palette.GREEN else Palette.RED
    card(c, 26f, 130f, w - 52f, h - 300f, accent, 20f)
    r.text(c, if (win) "战 斗 胜 利" else "全 员 阵 亡", w / 2f, 196f, 28f, accent, true, Paint.Align.CENTER)
    r.text(c, battleResult, w / 2f, 226f, 13f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    var y = 262f
    val rw = lastRewards
    if (win && rw != null) {
        r.text(c, "获得 ${rw.gold} 金币", w / 2f, y, 16f, Palette.GOLD, true, Paint.Align.CENTER)
        y += 28f
        r.text(c, "获得 ${rw.exp} 经验", w / 2f, y, 15f, Palette.CYAN, false, Paint.Align.CENTER)
        y += 30f
        rw.equip?.let { e ->
            r.text(c, "掉落装备：${e.name}（${e.rarity.cn}）", w / 2f, y, 13f, rarityColor(e.rarity), true, Paint.Align.CENTER)
            y += 26f
        }
        if (rw.items.isNotEmpty()) {
            r.text(c, "道具：" + rw.items.joinToString("、"), w / 2f, y, 12f, Palette.GOLD, false, Paint.Align.CENTER)
            y += 26f
        }
        for (nt in rw.notes) {
            r.text(c, nt, w / 2f, y, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
            y += 22f
        }
    }

    if (win) {
        button(c, "over_continue", "继 续 前 行", 48f, h - 214f, w - 96f, 56f, Palette.CYAN)
    } else {
        button(c, "over_reincarnate", "转 生", 48f, h - 214f, w - 96f, 56f, Palette.PINK)
        r.text(c, "转生会把本轮爬塔进度折算成天赋点，用于永久成长。", w / 2f, h - 150f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    }
}

internal fun GameView.tapOverlay(id: String) {
    when (id) {
        "over_continue" -> {
            overlay = ""
            battle = null
            val p = run ?: return
            if (TowerService.isFloorClear(p)) {
                if (TowerService.isComplete(p)) {
                    finishRun()
                    return
                }
                TowerService.advanceFloor(p, perm)
                if (p.waitingFloorTalent) {
                    p.waitingFloorTalent = false
                    beginDraft(1)
                    return
                }
            }
            screen = Screen.TOWER
            audio.playBgm("tower")
        }
        "over_reincarnate" -> {
            overlay = ""
            battle = null
            finishRun()
        }
    }
}

internal fun GameView.drawReincarnationScreen(c: Canvas) {
    val p = run ?: return
    val pts = p.talentPointValue()
    r.text(c, "轮 回 结 算", w / 2f, 150f, 30f, Palette.PINK, true, Paint.Align.CENTER)
    card(c, 32f, 200f, w - 64f, 200f, r.withAlpha(Palette.BORDER, 210), 20f)
    val rows = listOf(
        "抵达层数" to "${p.floor}",
        "难度模式" to p.mode.cn,
        "职业" to (Data.classById[p.classId]?.name ?: ""),
        "天赋点收益" to "+$pts"
    )
    var y = 240f
    for (row in rows) {
        r.text(c, row.first, 56f, y, 13f, Palette.TEXT_DIM)
        r.text(c, row.second, w - 56f, y, 15f, Palette.GOLD, true, Paint.Align.RIGHT)
        y += 38f
    }
    r.text(c, "共鸣盘最高：${p.grid.resonanceBonus().label()}", w / 2f, 440f, 13f, Palette.CYAN, true, Paint.Align.CENTER)
    r.wrap(c, "提示：同系天赋相邻会结成共鸣链，链越长加成越高。下次轮回优先凑齐 3 条以上共鸣边。", 44f, 470f, w - 88f, 12f, Palette.TEXT_DIM, 18f)

    button(c, "reinc_claim", "领 取 天 赋 点", 48f, h - 220f, w - 96f, 58f, Palette.PINK)
    ghostButton(c, "reinc_growth", "前往永久成长", 48f, h - 148f, w - 96f, 48f, Palette.CYAN)
    ghostButton(c, "reinc_menu", "回到标题", 48f, h - 90f, w - 96f, 44f, Palette.TEXT_DIM)
}

internal fun GameView.tapReincarnation(id: String) {
    val p = run ?: return
    when (id) {
        "reinc_claim" -> {
            val pts = p.talentPointValue()
            perm.talentPoints += pts
            perm.pity = p.pityCounter
            run = null
            Save.savePerm(context, perm)
            Save.clearRun(context)
            showToast("获得 $pts 天赋点")
            screen = Screen.GROWTH
        }
        "reinc_growth" -> {
            val pts = p.talentPointValue()
            perm.talentPoints += pts
            run = null
            Save.savePerm(context, perm)
            Save.clearRun(context)
            screen = Screen.GROWTH
        }
        "reinc_menu" -> {
            run = null
            Save.clearRun(context)
            goMenu()
        }
    }
}

internal fun GameView.drawGrowthScreen(c: Canvas) {
    drawTopBar(c, "永久成长", "天赋点：${perm.talentPoints} · 最高层数：${perm.bestFloor}", "growth_back", null, null)
    var y = 118f
    for (g in Content.growth) {
        val lv = perm.growthLevel(g.id)
        val cost = Content.growthCost(g, lv)
        val maxed = lv >= g.max
        val afford = perm.talentPoints >= cost && !maxed
        card(c, 20f, y, w - 40f, 84f, if (maxed) Palette.GOLD else r.withAlpha(Palette.BORDER, 190), 14f)
        r.text(c, g.name, 36f, y + 30f, 15f, Palette.TEXT, true)
        r.text(c, g.desc, 36f, y + 50f, 11f, Palette.TEXT_DIM)
        r.text(c, "Lv.$lv / ${g.max}", 36f, y + 70f, 11.5f, Palette.CYAN)
        if (maxed) {
            r.text(c, "已满级", w - 56f, y + 46f, 14f, Palette.GOLD, true, Paint.Align.RIGHT)
        } else {
            ghostButton(c, "growth_up_${g.id}", "强化 $cost", w - 132f, y + 22f, 96f, 40f, if (afford) Palette.PINK else Palette.TEXT_FAINT)
        }
        y += 92f
    }
    button(c, "growth_start", "开 始 新 一 轮", 40f, h - 82f, w - 80f, 56f, Palette.PINK)
}

internal fun GameView.tapGrowth(id: String) {
    when {
        id == "growth_back" -> screen = Screen.MENU
        id == "growth_start" -> screen = Screen.SETUP
        id.startsWith("growth_up_") -> {
            val gid = id.removePrefix("growth_up_")
            val def = Content.growthById[gid] ?: return
            val lv = perm.growthLevel(gid)
            if (lv >= def.max) {
                showToast("已满级")
                return
            }
            val cost = Content.growthCost(def, lv)
            if (perm.talentPoints < cost) {
                showToast("天赋点不足")
                return
            }
            perm.talentPoints -= cost
            perm.growthLevels[gid] = lv + 1
            Save.savePerm(context, perm)
            audio.play("levelup")
        }
    }
}

internal fun GameView.drawCodexScreen(c: Canvas) {
    drawTopBar(c, "天赋图鉴", "共 ${Data.talents.size} 个天赋 · 神格共鸣机制", "growth_back", null, null)
    var y = 118f
    val order = listOf(Rarity.HIDDEN, Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON)
    for (rar in order) {
        val list = Data.talents.filter { it.rarity == rar }
        if (list.isEmpty()) continue
        r.text(c, "【${rar.cn}】", 24f, y, 14f, rarityColor(rar), true)
        y += 8f
        for (t in list) {
            if (y > h - 110f) break
            val col = rarityColor(t.rarity)
            card(c, 24f, y, w - 48f, 62f, r.withAlpha(col, 150), 12f)
            r.hexFrame(c, 52f, y + 31f, 18f, col, r.withAlpha(Palette.PANEL_SOFT, 255))
            r.text(c, t.school.glyph, 52f, y + 37f, 15f, col, true, Paint.Align.CENTER)
            r.text(c, t.name, 80f, y + 26f, 13.5f, Palette.TEXT, true)
            r.text(c, t.school.cn, w - 44f, y + 26f, 11f, col, false, Paint.Align.RIGHT)
            r.wrap(c, t.desc, 80f, y + 44f, w - 130f, 10.5f, Palette.TEXT_DIM, 0f)
            y += 70f
        }
        y += 12f
    }
}
