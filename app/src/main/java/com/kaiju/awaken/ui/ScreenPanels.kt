package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.ArtIcon
import com.kaiju.awaken.game.Content
import com.kaiju.awaken.game.Content2
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.DraftService
import com.kaiju.awaken.game.Equip
import com.kaiju.awaken.game.Rarity
import com.kaiju.awaken.game.RunService
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.skillHits
import com.kaiju.awaken.game.skillLvMul
import com.kaiju.awaken.game.TowerService
import com.kaiju.awaken.ui.GameView.Screen

internal fun GameView.drawPanelOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 226))
    // 先注册全屏遮罩：hit 从末尾倒扫，后注册的面板内容优先，
    // 底层屏幕的按钮则被吃掉（旧实现点顶栏返回键会切屏但面板还开着）
    hit("modal_block", 0f, 0f, w, h)
    val p = run
    val top = 70f
    val bottom = h - 78f
    card(c, 18f, top, w - 36f, bottom - top, r.withAlpha(Palette.BORDER, 210), 20f)
    val title = when (panel) {
        "bag" -> "行囊"
        "equip" -> "装备"
        "skills" -> "战技"
        "talents" -> "神格环"
        "attrs" -> "面板"
        "items" -> "道具"
        "settings" -> "设定"
        "merc" -> "伙伴"
        else -> ""
    }
    r.text(c, title, w / 2f, top + 42f, 21f, Palette.CYAN, true, Paint.Align.CENTER)
    if (p != null) {
        // 两种货币：图标 + 数值整体居中，避免 emoji 在不同设备上宽度不一导致偏移
        val gTxt = "${p.gold}"
        val tTxt = "${perm.talentPoints}"
        val gap = 20f
        var cx = w / 2f - (chipW(gTxt, 12f) + gap + chipW(tTxt, 12f)) / 2f
        cx = statChip(c, ArtIcon.GOLD, "💰", gTxt, cx, top + 64f, 12f, Palette.GOLD, gap)
        statChip(c, ArtIcon.TALENT, "✨", tTxt, cx, top + 64f, 12f, Palette.GOLD, gap)
    }

    val scrollTop = top + 78f
    val scrollBottom = bottom - 58f
    c.save()
    c.clipRect(20f, scrollTop, w - 20f, scrollBottom)
    setHitClip(scrollTop, scrollBottom)
    panelScrollMax = 0f
    // 内容首行要低于裁剪顶边一个字身高，否则「战技点 / 行囊 N/40」这行上半截被切
    var y = scrollTop + 20f - panelScroll
    when (panel) {
        "bag" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            val gridTop = y
            val cols = 5
            val gap = 6f
            val cell = (w - 44f - gap * (cols - 1)) / cols
            r.text(c, "行囊 " + p.bag.size + " / 40   ·   点击格子查看", 24f, gridTop + 14f, 11f, Palette.TEXT_DIM)
            val gy = gridTop + 24f
            val rows = 8
            for (i in 0 until rows * cols) {
                val col = i % cols
                val row = i / cols
                val x = 22f + col * (cell + gap)
                val yy = gy + row * (cell + gap)
                val e = p.bag.getOrNull(i)
                val sel = bagSelected == i
                if (e == null) {
                    r.panel(c, x, yy, cell, cell, 10f, r.withAlpha(Palette.PANEL_DEEP, 220), r.withAlpha(Palette.PANEL_DEEP, 220), r.withAlpha(Palette.BORDER_SOFT, 120), 1.2f)
                } else {
                    val col2 = rarityColor(e.rarity)
                    card(c, x, yy, cell, cell, if (sel) Palette.GOLD else col2, 10f)
                    if (sel) r.glowPanel(c, x, yy, cell, cell, 10f, Palette.GOLD, 70)
                    drawIcon(c, com.kaiju.awaken.game.ArtIcon.equip(e.slot), x + cell / 2f, yy + cell * 0.44f, cell * 0.62f, col2)
                    r.text(c, e.name.take(4), x + cell / 2f, yy + cell * 0.72f, 9f, Palette.TEXT, false, Paint.Align.CENTER)
                    if (e.enhance > 0) r.text(c, "+" + e.enhance, x + cell / 2f, yy + cell * 0.9f, 9.5f, Palette.GOLD, true, Paint.Align.CENTER)
                    hit("panel_bagsel_" + i, x, yy, cell, cell)
                }
            }
            y = gy + rows * (cell + gap) + 10f
            val sel = p.bag.getOrNull(bagSelected)
            val bagCardH = r.lh(104f)
            card(c, 22f, y, w - 44f, bagCardH, if (sel == null) r.withAlpha(Palette.BORDER_SOFT, 140) else rarityColor(sel.rarity), 12f)
            if (sel == null) {
                r.text(c, "选择一个格子查看详情", w / 2f, y + 56f, 12f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
            } else {
                r.text(c, sel.name, 36f, y + 26f, 14f, Palette.TEXT, true)
                r.text(c, sel.rarity.cn + " · " + mainLabel(sel.mainKey) + " +" + sel.mainValue.toInt() + (if (sel.enhance > 0) "  ·  锻铸 +" + sel.enhance else ""), 36f, y + 46f, 11f, rarityColor(sel.rarity))
                r.text(c, sel.affixes.take(3).joinToString("  ") { if (it.isMechanic) it.label else it.label + " +" + it.value.toInt() }, 36f, y + 64f, 10f, Palette.TEXT_DIM)
                r.text(c, "变卖 " + sel.sellValue + " 金币", 36f, y + 86f, 10.5f, Palette.GOLD)
                button(c, "panel_bag_equip", "装 备", w - 190f, y + 64f, 76f, 34f, Palette.CYAN)
                ghostButton(c, "panel_bag_sell", "变卖", w - 106f, y + 64f, 76f, 34f, Palette.GOLD)
            }
            y += r.lh(116f)
        }
        "equip" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            for (slot in Content.slots) {
                val e = p.equipped[slot.id]
                val rowH = if (e == null) 46f else 92f
                card(c, 22f, y, w - 44f, rowH, r.withAlpha(Palette.BORDER_SOFT, 170), 12f)
                drawIcon(c, com.kaiju.awaken.game.ArtIcon.equip(slot.id), 46f, y + 23f, 30f, Palette.CYAN)
                r.text(c, slot.cn, 68f, y + 28f, 13.5f, Palette.TEXT, true)
                if (e == null) {
                    r.text(c, "未装备", w - 36f, y + 28f, 12f, Palette.TEXT_FAINT, false, Paint.Align.RIGHT)
                } else {
                    val ecol = rarityColor(e.rarity)
                    hit("panel_equip_" + slot.id, 36f, y, w - 152f, rowH)
                r.text(c, e.name, 68f, y + 48f, 12.5f, Palette.TEXT, true)
                    r.text(c, e.rarity.cn + " · " + mainLabel(e.mainKey) + " +" + e.mainValue.toInt() + (if (e.enhance > 0) "  ·  锻铸 +" + e.enhance else ""), 68f, y + 66f, 10.5f, ecol)
                    val eaff = e.affixes.take(2).joinToString("  ") { it.label + " +" + it.value.toInt() }
                    if (eaff.isNotEmpty()) r.text(c, eaff, 68f, y + 82f, 9.5f, Palette.TEXT_DIM)
                    val ecost = TowerService.goldNeeded(e, perm)
                    ghostButton(c, "panel_enhance_${slot.id}", "锻铸 " + ecost, w - 116f, y + 30f, 84f, 34f, if (p.gold >= ecost) Palette.GOLD else Palette.TEXT_FAINT)
                }
                y += rowH + 8f
            }
            // 旧实现把它钉在 bottom-64，正好落在裁剪线(h-136)以下，只剩 6px 可见，
            // 且与底栏「关 闭」重叠 —— 点到的按钮看不见。改为跟随列表滚动。
            y += 6f
            ghostButton(c, "panel_auto", "一键换装（自动装备更强的装备）", 36f, y, w - 72f, 48f, Palette.GREEN)
            y += 56f
        }
        "skills" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            val hero = p.hero()
            r.text(c, "战技点 ${p.skillPoints} · Lv.${p.level}", 36f, y, 13f, Palette.GOLD, true)
            y += 14f
            for (s in hero.skills) {
                val lv = heroSkillLevel(p, s.id)
                val skCardH = r.lh(106f)
                card(c, 36f, y, w - 72f, skCardH, if (s.isUltimate) Palette.GOLD else Palette.BORDER_SOFT, 12f)
                drawIcon(c, com.kaiju.awaken.game.ArtIcon.skill(s), 68f, y + 44f, 46f, if (s.isUltimate) Palette.GOLD else Palette.CYAN)
                r.text(c, s.name, 102f, y + 26f, 14f, Palette.TEXT, true)
                val lvTip = StringBuilder(if (s.isUltimate) "终极技 · " else "")
                lvTip.append("耗能 ${s.cost} 冷却 ${s.cd} · Lv.$lv/3")
                if (lv > 1) lvTip.append(" · 系数 +${((skillLvMul(lv) - 1.0) * 100).toInt()}%")
                val hitsNow = skillHits(s.hits, lv)
                if (hitsNow > s.hits) lvTip.append(" · ${s.hits}→$hitsNow 段")
                r.text(c, lvTip.toString(), 102f, y + 46f, 11f, Palette.TEXT_DIM)
                // 描述宽度必须避开右侧「升级」按钮（按钮左沿 x = w-108）。
                // 旧值 w-200 让文字一直铺到 302，直接压进按钮里；卡片也只有 88 高，
                // 第二行中文会被卡片底边切掉 —— 截图上的「并沉默」被裁就是这个原因。
                r.wrapClamp(c, s.desc, 102f, y + 66f, w - 228f, 10.5f, Palette.TEXT_FAINT, 14f, 3)
                if (lv < 3) {
                    val cost = listOf(1, 2, 3)[lv.coerceIn(0, 2)]
                    ghostButton(c, "panel_learn_${s.id}", "升级 $cost", w - 108f, y + 28f, 68f, 34f, Palette.CYAN)
                }
                hit("panel_skillinfo_${s.id}", 36f, y, w - 180f, skCardH)
                y += r.lh(114f)
            }
        }
        "talents" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            drawResonanceStrip(c, p, y)
            y += r.lh(106f)
            val dv = p.grid.divinity
            if (dv != null) {
                card(c, 36f, y, w - 72f, r.lh(60f), Palette.GOLD, 12f)
                r.text(c, "神格位 · ${dv.name}", 48f, y + 26f, 14f, Palette.GOLD, true)
                val dx = starLevel(c, p.grid.divinityStar, 48f, y + 46f, 11.5f, Palette.GOLD)
                r.text(c, " · 不可被覆盖", dx + 2f, y + 46f, 11f, Palette.TEXT_DIM)
                y += r.lh(68f)
            }
            for (i in 0 until 6) {
                val t = p.grid.slots[i] ?: continue
                val col = rarityColor(t.rarity)
                card(c, 36f, y, w - 72f, r.lh(66f), col, 12f)
                r.text(c, t.name, 48f, y + 24f, 13.5f, Palette.TEXT, true)
                starLevel(c, p.grid.stars[i], 48f + r.measure(t.name + "  ", 13.5f, true), y + 24f, 13.5f, Palette.GOLD)
                r.text(c, t.rarity.cn + " · " + t.school.cn + " · 槽位 ${i + 1}", 48f, y + 42f, 10.5f, col)
                val cost = t.enhanceCost(p.grid.stars[i] - 1)
                if (p.grid.stars[i] < 3) {
                    ghostButton(c, "panel_star_$i", "升星 $cost", w - 118f, y + 16f, 76f, 34f, Palette.GOLD)
                }
                y += r.lh(72f)
            }
            y += 6f
            r.text(c, "神格点：${perm.talentPoints}", 36f, y + 12f, 12f, Palette.GOLD)
            y += 26f
        }
        "attrs" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
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
        }
        "items" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            for (it in Content.allItems) {
                val cnt = p.items[it.id] ?: 0
                card(c, 36f, y, w - 72f, 62f, if (cnt > 0) r.withAlpha(Palette.GOLD, 190) else r.withAlpha(Palette.BORDER_SOFT, 120), 12f)
                drawIcon(c, com.kaiju.awaken.game.ArtIcon.item(it.id), 58f, y + 34f, 40f, Palette.GOLD)
                r.text(c, it.name + "  ×$cnt", 88f, y + 26f, 13.5f, Palette.TEXT, true)
                r.wrapClamp(c, it.desc, 88f, y + 46f, w - 130f, 10.5f, Palette.TEXT_DIM, 14f, 1)
                hit("panel_item_" + it.id, 36f, y, w - 72f, r.lh(62f))
                y += r.lh(70f)
            }
        }
        "merc" -> {
            if (p == null) { c.restore(); clearHitClip(); return }
            if (p.party.size <= 1) {
                r.text(c, "尚未招募伙伴。", w / 2f, y + 40f, 14f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
                r.wrap(c, "在「游侠营地」事件或酒肆中可以花金币招募伙伴。伙伴拥有独立专长、星级与装备。", 44f, y + 70f, w - 88f, 12f, Palette.TEXT_DIM, 18f)
            }
            for (i in 1 until p.party.size) {
                val u = p.party[i]
                val col = rarityColor(u.rarity)
                val mercH = r.lh(104f)
                card(c, 24f, y, w - 48f, mercH, col, 14f)
                drawPortrait(c, u.avatarKey.ifEmpty { u.clsId }, 62f, y + 52f, 58f, col)
                r.text(c, u.name + " · " + (Data.classById[u.clsId]?.name ?: ""), 104f, y + 30f, 14f, Palette.TEXT, true)
                val umeta2 = u.rarity.cn + " · Lv." + u.level + " · "
                r.text(c, umeta2, 104f, y + 50f, 11.5f, col)
                starRow(c, u.star, 104f + r.measure(umeta2, 11.5f), y + 50f, 12f, col)
                val tr = u.traitId?.let { Content2.traitById[it] }
                r.text(c, "专长：" + (tr?.name ?: "无"), 104f, y + 68f, 11f, Palette.CYAN)
                r.text(c, "攻 " + u.stats.atk.toInt() + "  防 " + u.stats.def.toInt() + "  生命 " + u.stats.maxHp.toInt(), 104f, y + 86f, 10.5f, Palette.TEXT_DIM)
                if (u.star < 5) {
                    val cost = 60 * u.star * u.rarity.rank
                    ghostButton(c, "panel_merc_star_" + i, "升星 " + cost, w - 126f, y + 14f, 90f, 36f, Palette.GOLD)
                } else {
                    r.text(c, "满星", w - 62f, y + 36f, 12f, Palette.GOLD, true, Paint.Align.RIGHT)
                }
                ghostButton(c, "panel_merc_fire_" + i, "解雇", w - 126f, y + 56f, 90f, 34f, Palette.RED)
                hit("panel_merc_detail_" + i, 24f, y, w - 150f, mercH)
                y += r.lh(112f)
            }
            y += 4f
            r.text(c, "队伍上限 3 人（含主角）", 24f, y + 12f, 11f, Palette.TEXT_FAINT)
            y += 26f
        }
        "settings" -> {
            val mx = inlineIcon(c, ArtIcon.MUSIC, "🎵", 40f, y + 20f, 14f, Palette.TEXT, 17f)
            r.text(c, "乐曲音量 ${perm.musicVolume}%", mx, y + 20f, 14f, Palette.TEXT)
            for (i in 0 until 4) {
                val v = (i + 1) * 25
                ghostButton(c, "panel_vol_$v", "$v%", 40f + i * 84f, y + 34f, 76f, 40f, if (perm.musicVolume == v) Palette.CYAN else Palette.TEXT_DIM)
            }
            y += r.lh(92f)
            ghostButton(c, "panel_toggle_music", "乐曲：${if (perm.musicOn) "开启" else "关闭"}", 40f, y, w - 80f, 46f, if (perm.musicOn) Palette.GREEN else Palette.TEXT_DIM)
            y += r.lh(56f)
            ghostButton(c, "panel_toggle_vib", "震动反馈：" + (if (perm.settingsVibration) "开启" else "关闭"), 40f, y, w - 80f, 46f, if (perm.settingsVibration) Palette.GREEN else Palette.TEXT_DIM)
            y += r.lh(56f)
            ghostButton(c, "panel_toggle_target", "目标锁定：" + (if (perm.settingsManualTarget) "手动" else "自动"), 40f, y, w - 80f, 46f, if (perm.settingsManualTarget) Palette.CYAN else Palette.TEXT_DIM)
            y += r.lh(56f)
            ghostButton(c, "panel_toggle_colorblind", "色弱模式：" + (if (perm.settingsColorBlind) "开启" else "关闭"), 40f, y, w - 80f, 46f, if (perm.settingsColorBlind) Palette.GREEN else Palette.TEXT_DIM)
            y += r.lh(56f)
            r.text(c, "界面字号", 40f, y, 13f, Palette.TEXT)
            ghostButton(c, "panel_font_0", "小", 40f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsFontSize == 0) Palette.CYAN else Palette.TEXT_DIM)
            ghostButton(c, "panel_font_1", "中", 40f + (w - 96f) / 3f + 8f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsFontSize == 1) Palette.CYAN else Palette.TEXT_DIM)
            ghostButton(c, "panel_font_2", "大", 40f + ((w - 96f) / 3f + 8f) * 2f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsFontSize == 2) Palette.CYAN else Palette.TEXT_DIM)
            y += r.lh(64f)
            r.text(c, "战斗速度", 40f, y, 13f, Palette.TEXT)
            ghostButton(c, "panel_speed_0", "慢", 40f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsBattleSpeed == 0) Palette.CYAN else Palette.TEXT_DIM)
            ghostButton(c, "panel_speed_1", "中", 40f + (w - 96f) / 3f + 8f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsBattleSpeed == 1) Palette.CYAN else Palette.TEXT_DIM)
            ghostButton(c, "panel_speed_2", "快", 40f + ((w - 96f) / 3f + 8f) * 2f, y + 12f, (w - 96f) / 3f, 42f, if (perm.settingsBattleSpeed == 2) Palette.CYAN else Palette.TEXT_DIM)
            y += r.lh(64f)
            ghostButton(c, "panel_toggle_sfx", "音效：${if (perm.sfxOn) "开启" else "关闭"}", 40f, y, w - 80f, 46f, if (perm.sfxOn) Palette.GREEN else Palette.TEXT_DIM)
            y += r.lh(66f)
            r.wrap(c, "本作完全离线运行：无账号、无登录、无广告、无联网权限，存档仅保存在本机。", 40f, y, w - 80f, 12f, Palette.TEXT_DIM, 18f)
            y += r.lh(62f)
            ghostButton(c, "panel_export", "导出存档文本", 40f, y, (w - 88f) / 2f, 46f, Palette.CYAN)
            ghostButton(c, "panel_reset", "清空存档", 40f + (w - 88f) / 2f + 8f, y, (w - 88f) / 2f, 46f, Palette.RED)
            // 旧实现漏了 y 累加，panelScrollMax 少算这一行，滚到底按钮仍贴着裁剪线（可见 0px）
            y += r.lh(54f)
        }
    }
    panelScrollMax = (y + panelScroll - scrollBottom).coerceAtLeast(0f)
    panelScroll = panelScroll.coerceIn(0f, panelScrollMax)
    c.restore()
    if (panelScrollMax > 0f) {
        r.solid(c, w - 14f, scrollTop + 6f, 3f, scrollBottom - scrollTop - 12f, 1.5f, r.withAlpha(Palette.BORDER_SOFT, 150))
        val viewH = scrollBottom - scrollTop
        val frac = viewH / (viewH + panelScrollMax)
        val barH = (viewH * frac).coerceAtLeast(24f)
        val barY = scrollTop + (viewH - barH) * (panelScroll / panelScrollMax)
        r.solid(c, w - 14f, barY, 3f, barH, 1.5f, Palette.CYAN)
    }
    // 底栏「关 闭」不在裁剪区内，先解除裁剪再绘制
    clearHitClip()
    ghostButton(c, "panel_close", "关 闭", 36f, bottom - 52f, w - 72f, 44f, Palette.TEXT_DIM)
}
private fun heroSkillLevel(p: com.kaiju.awaken.game.RunState, skillId: String): Int =
    p.skillLevels[skillId] ?: 1

private fun mainLabel(key: String): String = when (key) {
    "atk" -> "攻击"
    "matk" -> "法强"
    "maxHp" -> "生命"
    "def" -> "防御"
    "crit" -> "暴击"
    else -> key
}

internal fun GameView.tapPanel(id: String) {
    // 这些操作不依赖本轮进度（主菜单也能打开设定）
    when (id) {
        "panel_close" -> { panel = ""; return }
        "panel_vol_25" -> { setVol(25); Save.savePerm(context, perm); return }
        "panel_vol_50" -> { setVol(50); Save.savePerm(context, perm); return }
        "panel_vol_75" -> { setVol(75); Save.savePerm(context, perm); return }
        "panel_vol_100" -> { setVol(100); Save.savePerm(context, perm); return }
        "panel_toggle_music" -> {
            perm.musicOn = perm.musicOn.not()
            audio.setMusicEnabled(perm.musicOn)
            if (perm.musicOn && run != null) audio.playBgm(if (screen == Screen.COMBAT) "battle" else "tower")
            Save.savePerm(context, perm)
            return
        }
        "panel_toggle_sfx" -> {
            perm.sfxOn = perm.sfxOn.not()
            audio.sfxOn = perm.sfxOn
            Save.savePerm(context, perm)
            return
        }
        "panel_toggle_vib" -> {
            perm.settingsVibration = perm.settingsVibration.not()
            Save.savePerm(context, perm)
            return
        }
        "panel_toggle_target" -> {
            perm.settingsManualTarget = perm.settingsManualTarget.not()
            Save.savePerm(context, perm)
            return
        }
        "panel_toggle_colorblind" -> {
            perm.settingsColorBlind = perm.settingsColorBlind.not()
            applyDisplaySettings()
            Save.savePerm(context, perm)
            return
        }
        "panel_font_0" -> { perm.settingsFontSize = 0; applyDisplaySettings(); Save.savePerm(context, perm); return }
        "panel_font_1" -> { perm.settingsFontSize = 1; applyDisplaySettings(); Save.savePerm(context, perm); return }
        "panel_font_2" -> { perm.settingsFontSize = 2; applyDisplaySettings(); Save.savePerm(context, perm); return }
        "panel_speed_0" -> { perm.settingsBattleSpeed = 0; Save.savePerm(context, perm); return }
        "panel_speed_1" -> { perm.settingsBattleSpeed = 1; Save.savePerm(context, perm); return }
        "panel_speed_2" -> { perm.settingsBattleSpeed = 2; Save.savePerm(context, perm); return }
        "panel_export" -> {
            confirmAction = "export"
            val txt = Save.exportSlot(context)
            if (txt.isEmpty()) {
                showToast("导出失败")
            } else {
                exportText = txt
            }
            return
        }
        "panel_reset" -> {
            showConfirm("将清空当前存档槽的全部进度（含轮回淬炼、星尘、成就、图鉴），此操作不可撤销。", "reset")
            return
        }
        "panel_reset_do" -> {
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
                showToast("已达锻铸上限 +$max")
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
            // 旧实现取了 sid 却从不使用：等级永远 Lv.1、也没有满级拦截，
            // 连点会把战技点全部扣光而技能毫无变化（「逻辑不通」的直接来源）。
            val lv = p.skillLevels[sid] ?: 1
            if (lv >= 3) {
                showToast("该战技已满级")
                return
            }
            if (p.skillPoints <= 0) {
                showToast("战技点不足")
                return
            }
            p.skillPoints--
            p.skillLevels[sid] = lv + 1
            RunService.recalcAll(p, perm)
            audio.play("levelup")
            showToast("战技提升至 Lv." + (lv + 1))
        }
        id.startsWith("panel_bagsel_") -> {
            bagSelected = id.removePrefix("panel_bagsel_").toIntOrNull() ?: 0
            // 轻点即开详情：此前只有长按能看属性，玩家会以为「根本看不了详细信息」
            handleLongPress(id)
            return
        }
        id.startsWith("panel_skillinfo_") || id.startsWith("panel_item_") ||
            id.startsWith("panel_equip_") || id.startsWith("panel_merc_detail_") -> {
            handleLongPress(id)
            return
        }
        id == "panel_bag_equip" -> {
            val e = p.bag.getOrNull(bagSelected) ?: return
            val cur = p.equipped[e.slot]
            p.bag.removeAt(bagSelected)
            p.equipped[e.slot] = e
            if (cur != null) p.bag.add(cur)
            bagSelected = 0
            RunService.recalcAll(p, perm)
            audio.play("levelup")
            showToast("已装备 " + e.name)
        }
        id == "panel_bag_sell" -> {
            val e = p.bag.getOrNull(bagSelected) ?: return
            p.gold += e.sellValue
            p.bag.removeAt(bagSelected)
            bagSelected = 0
            audio.play("coins")
            showToast("变卖 " + e.name + " 获得 " + e.sellValue + " 金币")
        }
        id.startsWith("panel_merc_star_") -> {
            val idx = id.removePrefix("panel_merc_star_").toIntOrNull() ?: return
            val u = p.party.getOrNull(idx) ?: return
            if (u.star >= 5) { showToast("已满星"); return }
            val cost = 60 * u.star * u.rarity.rank
            if (p.gold < cost) { showToast("金币不足（需要 " + cost + "）"); return }
            p.gold -= cost
            u.star++
            RunService.recalcAll(p, perm)
            audio.play("starup")
            showToast(u.name + " 升至 " + u.star + " 星")
        }
        id.startsWith("panel_merc_fire_") -> {
            val idx = id.removePrefix("panel_merc_fire_").toIntOrNull() ?: return
            if (idx in 1 until p.party.size) {
                val u = p.party.removeAt(idx)
                val refund = 20 * u.level
                p.gold += refund
                showToast("已解雇 " + u.name + "，返还 " + refund + " 金币")
            }
        }
        id.startsWith("panel_star_") -> {
            val idx = id.removePrefix("panel_star_").toIntOrNull() ?: return
            if (DraftService.enhance(p, perm, idx)) {
                RunService.recalcAll(p, perm)
                audio.play("starup")
            } else {
                showToast("神格点不足或已满星")
            }
        }
    }
}

private fun GameView.setVol(v: Int) {
    perm.musicVolume = v
    audio.setVolume(v)
}

internal fun GameView.drawOverlay(c: Canvas) {
    if (detailTitle.isNotEmpty()) {
        drawDetailOverlay(c)
        return
    }
    if (exportText.isNotEmpty()) {
        drawExportOverlay(c)
        return
    }
    when (overlay) {
        "shop" -> drawShopOverlay(c)
        "tavern" -> drawTavernOverlay(c)
        "battle_end" -> drawBattleEndOverlay(c)
        "confirm" -> drawConfirmOverlay(c)
    }
}

private fun GameView.drawDetailOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 228))
    hit("modal_block", 0f, 0f, w, h)
    val top = h * 0.22f
    val boxH = h * 0.5f
    card(c, 26f, top, w - 52f, boxH, r.withAlpha(Palette.CYAN, 210), 18f)
    r.text(c, detailTitle, w / 2f, top + 40f, 20f, Palette.CYAN, true, Paint.Align.CENTER)
    r.solid(c, 46f, top + 54f, w - 92f, 1.5f, 1f, r.withAlpha(Palette.BORDER_SOFT, 200))
    var ty = top + 80f
    for (line in detailBody.split("\n")) {
        // 阈值要给「关 闭」按钮留出高度，旧值只留 16 导致最后 1-3 行正文被按钮覆盖
        if (ty > top + boxH - 74f) break
        if (line.isEmpty()) { ty += 10f; continue }
        // 星级行：行尾的连续 ★ 画成 ic_star（详情正文是纯文本拼接，这里按行解析）
        val stars = line.takeLastWhile { it == '★' }.length
        if (stars > 0) {
            val prefix = line.dropLast(stars)
            if (prefix.isEmpty() || r.measure(prefix, 12f) + stars * 14f <= w - 88f) {
                var sx = 44f
                if (prefix.isNotEmpty()) {
                    r.text(c, prefix, sx, ty, 12f, Palette.TEXT_DIM)
                    sx += r.measure(prefix, 12f) + 4f
                }
                starRow(c, stars, sx, ty, 14f, Palette.GOLD)
                ty += 17f * r.fontScale
                continue
            }
        }
        ty = r.wrap(c, line, 44f, ty, w - 88f, 12f, Palette.TEXT_DIM, 17f)
    }
    ghostButton(c, "detail_close", "关 闭", 40f, top + boxH - 58f, w - 80f, 46f, Palette.CYAN)
}

internal fun GameView.tapConfirm(id: String) {
    when (id) {
        "detail_close" -> {
            detailTitle = ""
            detailBody = ""
        }
        "confirm_no" -> {
            overlay = ""
            confirmAction = ""
            exportText = ""
        }
        "confirm_yes" -> {
            val act = confirmAction
            overlay = ""
            confirmAction = ""
            when (act) {
                "reset" -> {
                    Save.clearRun(context)
                    perm = com.kaiju.awaken.game.PermState()
                    Save.savePerm(context, perm)
                    run = null
                    // 统一复位：旧实现只清了 battle/panel，滚过的列表与详情浮层会留着
                    resetTransientUi()
                    screen = GameView.Screen.MENU
                    showToast("存档已清空")
                }
                "abandon" -> {
                    pendingAchievements = ArrayList()
                    finishRun()
                }
                "newrun" -> {
                    // 明确放弃当前存档后，才进入创角流程
                    run = null
                    resetTransientUi()
                    Save.clearRun(context)
                    goScreen(GameView.Screen.SETUP)
                }
                "export" -> {
                    exportText = Save.exportSlot(context)
                    overlay = ""
                }
            }
        }
    }
}

private fun GameView.drawConfirmOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 220))
    hit("modal_block", 0f, 0f, w, h)
    val top = h * 0.34f
    card(c, 34f, top, w - 68f, 196f, r.withAlpha(Palette.RED, 200), 18f)
    r.text(c, "请 确 认", w / 2f, top + 40f, 19f, Palette.RED, true, Paint.Align.CENTER)
    r.wrap(c, confirmMsg, 54f, top + 70f, w - 108f, 12.5f, Palette.TEXT_DIM, 18f)
    // 按钮下移，给最多 3 行确认文案留空间（长文案原本会压住按钮）
    button(c, "confirm_yes", "确 定", 52f, top + 132f, (w - 120f) / 2f, 44f, Palette.RED)
    ghostButton(c, "confirm_no", "取消", 52f + (w - 120f) / 2f + 16f, top + 132f, (w - 120f) / 2f, 44f, Palette.TEXT_DIM)
}

private fun GameView.drawExportOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 234))
    hit("modal_block", 0f, 0f, w, h)
    card(c, 20f, 90f, w - 40f, h - 200f, r.withAlpha(Palette.CYAN, 200), 18f)
    r.text(c, "存档导出文本", w / 2f, 134f, 19f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "长按可复制；粘贴到新设备的导入框即可恢复", w / 2f, 158f, 11f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    var y = 182f
    val chunk = 46
    var i = 0
    while (i < exportText.length && y < h - 140f) {
        val end = (i + chunk).coerceAtMost(exportText.length)
        r.text(c, exportText.substring(i, end), 34f, y, 9.5f, Palette.TEXT_DIM)
        y += 13f
        i = end
    }
    r.text(c, "共 " + exportText.length + " 字符", 34f, y + 10f, 10.5f, Palette.TEXT_FAINT)
    button(c, "confirm_no", "关 闭", 40f, h - 92f, w - 80f, 50f, Palette.CYAN)
}

/** 结算浮层的一行：先排版、再决定卡片高度与按钮位置。 */
private class OverlayLine(val text: String, val size: Float, val color: Int, val bold: Boolean, val step: Float)

private fun GameView.drawBattleEndOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 232))
    hit("modal_block", 0f, 0f, w, h)
    val b = battle
    val win = b?.victory == true
    val accent = if (win) Palette.GREEN else Palette.RED
    // 先排版算高度、再画卡片：卡片高度与按钮位置改由内容决定。
    // 旧实现卡片高度写死 h-300、按钮钉死 h-214，在 4:3 平板(h≈533)上
    // 奖励文字会溢出卡片并压住按钮。
    val lines = ArrayList<OverlayLine>()
    val rw = lastRewards
    if (win && rw != null) {
        lines.add(OverlayLine("获得 ${rw.gold} 金币", 16f, Palette.GOLD, true, 28f))
        lines.add(OverlayLine("获得 ${rw.exp} 经验", 15f, Palette.CYAN, false, 30f))
        rw.equip?.let { e ->
            lines.add(OverlayLine("掉落装备：${e.name}（${e.rarity.cn}）", 13f, rarityColor(e.rarity), true, 26f))
        }
        if (rw.items.isNotEmpty()) {
            lines.add(OverlayLine("道具：" + rw.items.joinToString("、"), 12f, Palette.GOLD, false, 26f))
        }
        for (nt in rw.notes) lines.add(OverlayLine(nt, 11.5f, Palette.TEXT_DIM, false, 22f))
    }

    if (!win) {
        // 失败时卡片原本是空的：补一段战报，玩家才知道这次死换来了什么
        lines.add(OverlayLine("抵达第 " + (b?.floor ?: 0) + " 层", 15f, Palette.CYAN, false, 30f))
        lines.add(OverlayLine("本轮收益 " + (run?.talentPointValue() ?: 0) + " 神格点，可带回前厅永久强化", 11.5f, Palette.TEXT_DIM, false, 22f))
    }

    val cardTop = 130f
    var contentEnd = cardTop + 132f
    for (l in lines) contentEnd += l.step
    val btnTop = maxOf(h - 214f, contentEnd + 24f)
    // 卡片下沿要包住按钮和按钮下方的说明文字：
    // 旧实现用 h-300f 兜底，在长屏上卡片底边落在说明文字之上，字被画到框外。
    val footerH = if (win) 74f else 106f
    val cardH = maxOf(contentEnd + 30f, btnTop - cardTop + footerH)

    card(c, 26f, cardTop, w - 52f, cardH, accent, 20f)
    r.text(c, if (win) "战 斗 胜 利" else "全 员 阵 亡", w / 2f, cardTop + 66f, 28f, accent, true, Paint.Align.CENTER)
    r.text(c, battleResult, w / 2f, cardTop + 96f, 13f, Palette.TEXT_DIM, false, Paint.Align.CENTER)

    var y = cardTop + 132f
    for (l in lines) {
        r.text(c, l.text, w / 2f, y, l.size, l.color, l.bold, Paint.Align.CENTER)
        y += l.step
    }

    if (win) {
        button(c, "over_continue", "继 续 深 入", 48f, btnTop, w - 96f, 56f, Palette.CYAN)
    } else {
        button(c, "over_reincarnate", "轮 回", 48f, btnTop, w - 96f, 56f, Palette.PINK)
        r.text(c, "轮回会把本轮迭塔进度折算为神格点，用于永久淬炼。", w / 2f, btnTop + 78f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
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
                afterFloorAdvance()
                return
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
    val cleared = p.mode.endFloor > 0 && p.floor > p.mode.endFloor

    if (cleared) {
        r.text(c, "回 廊 之 心", w / 2f, 92f, 30f, Palette.GOLD, true, Paint.Align.CENTER)
        r.text(c, "你点亮了「" + p.mode.cn + "」的全部星语，回廊重新开始呼吸。", w / 2f, 120f, 12f, Palette.CYAN, false, Paint.Align.CENTER)
        r.sparkle(c, w * 0.14f, 96f, 16f, Palette.GOLD)
        r.sparkle(c, w * 0.86f, 110f, 13f, Palette.GOLD)
    }

    r.text(c, "轮 回 结 算", w / 2f, if (cleared) 156f else 140f, 26f, Palette.PINK, true, Paint.Align.CENTER)
    // 结算卡 + 成就列表整体可滚动：矮屏 / 大字号下原本会顶到「领取神格点」按钮。
    val claimTop = h - 220f
    val listTop = if (cleared) 180f else 164f
    val top = beginScroll(c, listTop, claimTop - 12f)

    card(c, 32f, top, w - 64f, 216f, r.withAlpha(Palette.BORDER, 210), 20f)

    var y = top + 40f
    val rows = listOf(
        "抵达层数" to (p.floor.toString() + (if (cleared) " · 已通关" else "")),
        "试炼强度" to p.mode.cn,
        "职阶" to (Data.classById[p.classId]?.name ?: ""),
        "神格点收益" to ("+" + pts)
    )
    for (row in rows) {
        r.text(c, row.first, 56f, y, 13f, Palette.TEXT_DIM)
        r.text(c, row.second, w - 56f, y, 15f, Palette.GOLD, true, Paint.Align.RIGHT)
        y += 38f
    }

    val label = p.grid.resonanceBonus().label()
    // 基线原本落在卡片底边之外（top+208 > top+196），永远贴着/压着下边框
    r.text(c, "神格环最高：" + label, w / 2f, top + 196f, 13f, Palette.CYAN, true, Paint.Align.CENTER)

    // 成就列表放完为止，超出部分由滚动承接（不再截断成「还有 N 项」）
    var iy = top + 226f
    val newAch = pendingAchievements
    if (newAch.isNotEmpty()) {
        r.text(c, "本次达成成就", w / 2f, iy, 13f, Palette.GOLD, true, Paint.Align.CENTER)
        iy += 20f
        for (a2 in newAch) {
            r.text(c, "· " + a2.name + "   +" + a2.dust + " 星尘", w / 2f, iy, 11.5f, Palette.CYAN, false, Paint.Align.CENTER)
            iy += 17f * r.fontScale
        }
    } else {
        iy = r.wrap(c, "提示：同源星语在环上相邻即结成共鸣链，链越长增益越高。下次轮回优先凑齐 3 条以上共鸣边。", 44f, iy, w - 88f, 12f, Palette.TEXT_DIM, 18f)
    }
    endScroll(c, iy + 8f)

    button(c, "reinc_claim", "领 取 神 格 点", 48f, h - 220f, w - 96f, 58f, Palette.PINK)
    ghostButton(c, "reinc_growth", "前往轮回淬炼", 48f, h - 148f, w - 96f, 48f, Palette.CYAN)
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
            showToast("获得 $pts 神格点 · 可在「神格强化」中使用")
            // 轮回后回前厅，而不是直接塞进强化页：
            // 玩家在这里能看到角色卡、花掉神格点、整备完毕再「出发远征」，
            // 而不是被丢回创角流程（角色名已经存在存档里了）。
            resetTransientUi()
            metaReturn = Screen.HUB
            goScreen(Screen.HUB)
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
    // 改名：原名「轮回淬炼」会让玩家以为是重开角色，实际只是永久属性强化
    drawTopBar(c, "神格强化", "角色已锁定 · 神格点：${perm.talentPoints} · 最高层数：${perm.bestFloor}", "growth_back", null, null)
    var y = beginScroll(c, 112f)
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
            ghostButton(c, "growth_up_${g.id}", "锻铸 $cost", w - 132f, y + 22f, 96f, 40f, if (afford) Palette.PINK else Palette.TEXT_FAINT)
        }
        y += r.lh(92f)
    }
    endScroll(c, y + 10f)
}

internal fun GameView.tapGrowth(id: String) {
    when {
        id == "growth_back" -> goScreen(metaReturn)
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
                showToast("神格点不足")
                return
            }
            perm.talentPoints -= cost
            perm.growthLevels[gid] = lv + 1
            Save.savePerm(context, perm)
            audio.play("levelup")
        }
    }
}
