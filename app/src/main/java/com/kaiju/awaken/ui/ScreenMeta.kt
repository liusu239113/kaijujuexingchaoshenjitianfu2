package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Achievements
import com.kaiju.awaken.game.Content
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.Meta
import com.kaiju.awaken.game.Rarity
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.Tracker

internal fun GameView.drawAchievementsScreen(c: Canvas) {
    val done = Achievements.all.count { (perm.achProgress[it.id] ?: 0) >= it.target }
    drawTopBar(c, "回廊成就", "已达成 $done / ${Achievements.all.size} · 星尘 ${perm.dust}", "meta_back", null, null)
    var y = 118f
    for (a in Achievements.all) {
        val cur = (perm.achProgress[a.id] ?: 0).coerceAtMost(a.target)
        val ok = cur >= a.target
        val col = if (ok) Palette.GOLD else Palette.BORDER_SOFT
        card(c, 18f, y, w - 36f, 62f, col, 12f)
        r.text(c, a.name, 32f, y + 24f, 13.5f, if (ok) Palette.GOLD else Palette.TEXT, true)
        r.text(c, a.desc, 32f, y + 43f, 10.5f, Palette.TEXT_DIM)
        if (a.target > 1) {
            r.text(c, "$cur/${a.target}", w - 32f, y + 24f, 11.5f, if (ok) Palette.GOLD else Palette.TEXT_DIM, true, Paint.Align.RIGHT)
            val pct = cur.toFloat() / a.target
            r.bar(c, w - 112f, y + 34f, 80f, 6f, pct, Palette.CYAN, Palette.EN_B, 0x55000000)
        } else if (ok) {
            r.text(c, "达成", w - 32f, y + 30f, 12f, Palette.GOLD, true, Paint.Align.RIGHT)
        }
        r.text(c, "+${a.dust} 星尘", w - 32f, y + 50f, 10f, Palette.CYAN, false, Paint.Align.RIGHT)
        y += 70f
    }
}

internal fun GameView.drawShopScreen(c: Canvas) {
    drawTopBar(c, "星尘兑换", "星尘 ${perm.dust} · 长期解锁内容", "meta_back", null, null)
    r.text(c, "通关模式、达成成就、收集图鉴都会获得星尘。", 20f, 124f, 11.5f, Palette.TEXT_DIM)
    var y = 146f
    for (u in Meta.unlocks) {
        val owned = perm.unlocked.contains(u.kind + ":" + u.key)
        val afford = perm.dust >= u.cost
        val col = if (owned) Palette.GREEN else if (afford) Palette.PINK else Palette.BORDER_SOFT
        card(c, 18f, y, w - 36f, 72f, col, 12f)
        r.text(c, u.name, 32f, y + 28f, 14f, if (owned) Palette.GREEN else Palette.TEXT, true)
        r.text(c, u.desc, 32f, y + 48f, 10.5f, Palette.TEXT_DIM)
        if (owned) {
            r.text(c, "已解锁", w - 32f, y + 40f, 13f, Palette.GREEN, true, Paint.Align.RIGHT)
        } else {
            ghostButton(c, "dust_buy_" + u.id, "${u.cost} 尘", w - 122f, y + 16f, 86f, 40f, if (afford) Palette.PINK else Palette.TEXT_FAINT)
        }
        y += 80f
    }
    r.text(c, "累计获得星尘：${perm.dustTotal}", 20f, y + 16f, 11.5f, Palette.TEXT_FAINT)
}

internal fun GameView.drawAboutScreen(c: Canvas) {
    drawTopBar(c, "关于与隐私", "本作完全离线运行", "meta_back", null, null)
    var y = 124f
    val lines = listOf(
        "《共鸣觉醒 · 星塔回廊》  v1.1.6" to "",
        "开发与发行" to "本作为单机离线游戏，无服务器、无账号体系。",
        "隐私说明" to "本作不收集任何个人信息，不申请网络权限，不集成任何第三方 SDK。",
        "数据存储" to "全部进度保存在设备本地的应用私有目录中，卸载应用即彻底删除。",
        "权限说明" to "仅使用「保持屏幕常亮」与「震动反馈」，均可关闭。",
        "内容说明" to "战斗表现为星光消散，无血腥、恐怖表现。",
        "适龄提示" to "建议 12 岁以上玩家游玩。",
        "故障排查" to "若出现闪退，可在设定中清空数据后重试。",
        "联系方式" to "请通过应用商店的开发者页面反馈问题。"
    )
    for ((title, body) in lines) {
        r.text(c, title, 22f, y, 13f, Palette.CYAN, true)
        y += 20f
        if (body.isNotEmpty()) {
            y = r.wrap(c, body, 22f, y, w - 44f, 11.5f, Palette.TEXT_DIM, 17f) + 8f
        }
        y += 8f
    }
    ghostButton(c, "meta_back", "返回", 32f, h - 76f, w - 64f, 50f, Palette.TEXT_DIM)
}

internal fun GameView.drawCodexFullScreen(c: Canvas) {
    drawTopBar(c, "星语图鉴", "已见 ${perm.codexSeen.size} 项 · 击败过的魔物与首领也会收录", "meta_back", "codex_filter", codexFilterLabel())
    var y = 118f
    when (codexTab) {
        0 -> {
            val order = listOf(Rarity.HIDDEN, Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON)
            for (rar in order) {
                val list = Data.allTalents.filter { it.rarity == rar }
                if (list.isEmpty()) continue
                r.text(c, "【" + rar.cn + "】" + list.size + " 项", 20f, y, 13f, rarityColor(rar), true)
                y += 18f
                for (t in list) {
                    if (y > h - 120f) break
                    val seen = perm.codexSeen.contains("t:" + t.id)
                    val col = if (seen) rarityColor(t.rarity) else Palette.BORDER_SOFT
                    card(c, 18f, y, w - 36f, 56f, r.withAlpha(col, 170), 11f)
                    r.hexFrame(c, 44f, y + 28f, 16f, col, r.withAlpha(Palette.PANEL_SOFT, 255))
                    r.text(c, t.school.glyph, 44f, y + 34f, 13f, col, true, Paint.Align.CENTER)
                    r.text(c, if (seen) t.name else "？？？", 70f, y + 24f, 13f, if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                    if (seen) {
                        r.text(c, t.school.cn, w - 30f, y + 24f, 10.5f, col, false, Paint.Align.RIGHT)
                        r.wrap(c, t.desc, 70f, y + 42f, w - 110f, 10f, Palette.TEXT_DIM, 0f)
                    } else {
                        r.text(c, "尚未觉醒", w - 30f, y + 24f, 10.5f, Palette.TEXT_FAINT, false, Paint.Align.RIGHT)
                    }
                    y += 62f
                }
                y += 10f
            }
        }
        1 -> {
            for (e in Content.allEvents) {
                if (y > h - 120f) break
                val seen = perm.codexSeen.contains("e:" + e.id)
                card(c, 18f, y, w - 36f, 54f, if (seen) r.withAlpha(Palette.CYAN, 170) else Palette.BORDER_SOFT, 11f)
                r.text(c, if (seen) e.glyph else "？", 44f, y + 32f, 20f, if (seen) Palette.CYAN else Palette.TEXT_FAINT, true, Paint.Align.CENTER)
                r.text(c, if (seen) e.name else "未知遭遇", 70f, y + 24f, 13f, if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                if (seen) r.wrap(c, e.intro, 70f, y + 42f, w - 110f, 10f, Palette.TEXT_DIM, 0f)
                y += 60f
            }
        }
        2 -> {
            for (n in Content2.monsterAvatars + Content2.eliteAvatars + Content2.bossAvatars) {
                if (y > h - 120f) break
                val seen = perm.codexSeen.contains("m:" + n)
                card(c, 18f, y, w - 36f, 62f, if (seen) r.withAlpha(Palette.PINK, 160) else Palette.BORDER_SOFT, 11f)
                if (seen) {
                    drawPortrait(c, n, 50f, y + 31f, 44f, Palette.PINK)
                } else {
                    r.hexFrame(c, 50f, y + 31f, 20f, Palette.BORDER_SOFT, r.withAlpha(Palette.PANEL_SOFT, 255))
                    r.text(c, "？", 50f, y + 38f, 16f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
                }
                r.text(c, if (seen) monsterName(n) else "未遭遇", 86f, y + 36f, 13f, if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                y += 68f
            }
        }
    }
    ghostButton(c, "meta_back", "返回", 32f, h - 76f, w - 64f, 50f, Palette.TEXT_DIM)
}

private fun monsterName(key: String): String {
    val idx = key.drop(1).toIntOrNull() ?: 1
    return when {
        key.startsWith("b") -> Content.bossNames[(idx - 1).coerceIn(0, Content.bossNames.size - 1)]
        key.startsWith("e") -> "精锐 · " + Content.normalNames[(idx * 3) % Content.normalNames.size]
        else -> Content.normalNames[(idx - 1).coerceIn(0, Content.normalNames.size - 1)]
    }
}

private fun codexFilterLabel(): String = when (codexTab) {
    0 -> "星语"
    1 -> "遭遇"
    else -> "魔物"
}

internal fun GameView.tapMeta(id: String) {
    when (id) {
        "meta_back" -> screen = Screen.MENU
        "meta_growth" -> screen = Screen.GROWTH
        "meta_codex" -> screen = Screen.CODEX
        "meta_ach" -> screen = Screen.ACHIEVEMENTS
        "meta_shop" -> screen = Screen.SHOP
        "meta_about" -> screen = Screen.ABOUT
        "meta_slots" -> screen = Screen.SAVE_SLOTS
    }
}

internal fun GameView.tapCodex(id: String) {
    if (id == "codex_filter") {
        codexTab = (codexTab + 1) % 3
    }
}

internal fun GameView.tapDust(id: String) {
    if (!id.startsWith("dust_buy_")) return
    val uid = id.removePrefix("dust_buy_")
    val u = Meta.unlockById[uid] ?: return
    if (perm.unlocked.contains(u.kind + ":" + u.key)) {
        showToast("已解锁")
        return
    }
    if (perm.dust < u.cost) {
        showToast("星尘不足")
        return
    }
    perm.dust -= u.cost
    perm.unlocked.add(u.kind + ":" + u.key)
    Save.savePerm(context, perm)
    audio.play("levelup")
    showToast("已解锁：" + u.name)
}

internal fun GameView.tapSlot(id: String) {
    if (!id.startsWith("slot_pick_")) return
    val n = id.removePrefix("slot_pick_").toIntOrNull() ?: return
    Save.setSlot(context, perm, n)
    showToast("已切换到存档 " + (n + 1))
    screen = Screen.MENU
}

internal fun GameView.drawSaveSlotsScreen(c: Canvas) {
    drawTopBar(c, "存档管理", "当前存档槽：" + (Save.currentSlot + 1), "meta_back", null, null)
    val slots = Save.slotSummaries(context)
    var y = 130f
    for (i in slots.indices) {
        val info = slots[i]
        val cur = Save.currentSlot == i
        card(c, 20f, y, w - 40f, 108f, if (cur) Palette.GOLD else Palette.BORDER_SOFT, 14f)
        r.text(c, "存档 " + (i + 1), 36f, y + 30f, 17f, if (cur) Palette.GOLD else Palette.TEXT, true)
        if (info.isEmpty) {
            r.text(c, "空存档位", 36f, y + 56f, 12f, Palette.TEXT_FAINT)
        } else {
            r.text(c, info.summary, 36f, y + 54f, 11.5f, Palette.TEXT_DIM)
            r.text(c, info.detail, 36f, y + 74f, 10.5f, Palette.TEXT_FAINT)
        }
        if (cur) {
            r.text(c, "使用中", w - 40f, y + 40f, 13f, Palette.GOLD, true, Paint.Align.RIGHT)
        } else {
            ghostButton(c, "slot_pick_$i", "切换到此槽", w - 156f, y + 44f, 120f, 40f, Palette.CYAN)
        }
        y += 118f
    }
    r.wrap(c, "每个存档槽独立保存轮回淬炼、星尘、成就与图鉴进度。切换后原槽数据不会被覆盖。", 24f, y + 10f, w - 48f, 11.5f, Palette.TEXT_DIM, 17f)
    ghostButton(c, "meta_back", "返回", 32f, h - 76f, w - 64f, 50f, Palette.TEXT_DIM)
}
