package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.RunService

/** 主城（回廊前厅）：远征前后的中枢页面。 */
internal fun GameView.drawHubScreen(c: Canvas) {
    val p = run
    // 整屏滚动化：功能格变多后内容会超过 16:9 的可视高度。
    // 首行基线必须落在裁剪顶边「之下一个字身」——旧值让基线正好压在裁剪线上，
    // 标题上半截永远看不见（截图里只剩半行字）。
    var y = beginScroll(c, 34f, h - 12f) + 26f

    r.text(c, "回 廊 前 厅", w / 2f, y, 24f, Palette.TEXT, true, Paint.Align.CENTER)
    y += 22f
    r.text(c, if (p == null) "尚未开启远征" else "第 " + p.floor + " 层 · " + p.mode.cn + "层域", w / 2f, y, 12f, Palette.CYAN, false, Paint.Align.CENTER)
    y += 18f

    // 主角卡
    val hero = p?.party?.firstOrNull()
    card(c, 20f, y, w - 40f, 128f, r.withAlpha(Palette.BORDER, 200), 18f)
    if (hero != null) {
        drawPortrait(c, hero.avatarKey.ifEmpty { hero.clsId }, 76f, y + 64f, 96f, classColor(hero.clsId))
        r.text(c, Data.classById[hero.clsId]?.name ?: "", 138f, y + 36f, 19f, Palette.TEXT, true)
        val promos = RunService.promotionOf(p)
        val emblemKey = promos.lastOrNull()?.let { com.kaiju.awaken.game.ArtIcon.emblem(it.id) }
        if (emblemKey != null && bitmap(emblemKey) != null) {
            drawIcon(c, emblemKey, w - 52f, y + 44f, 44f, Palette.GOLD)
        }
        val promo = promos.joinToString(" → ") { it.name }
        if (promo.isNotEmpty()) r.text(c, promo, 138f, y + 56f, 11f, Palette.GOLD)
        r.text(c, "Lv." + p.level + "   神格环 " + p.grid.resonanceBonus().label(), 138f, y + 78f, 11.5f, Palette.CYAN)
        r.text(c, "生命 " + hero.stats.maxHp.toInt() + "   攻 " + hero.stats.atk.toInt() + "   法 " + hero.stats.matk.toInt() + "   防 " + hero.stats.def.toInt(), 138f, y + 98f, 10.5f, Palette.TEXT_DIM)
        r.text(c, "伙伴 " + (p.party.size - 1) + "/2   行囊 " + p.bag.size, 138f, y + 116f, 10.5f, Palette.TEXT_FAINT)
    } else {
        // 没有进行中的远征时也要显示角色本身：这里是他轮回无数次攒下来的身份，
        // 旧版只写「拾语者 / 尚未开启远征」，玩家会以为角色被清空了。
        val cls = perm.lastClass.ifBlank { "warrior" }
        drawPortrait(c, cls, 76f, y + 64f, 96f, classColor(cls))
        r.text(c, if (perm.playerName.isBlank()) "拾语者" else perm.playerName, 138f, y + 36f, 19f, Palette.TEXT, true)
        r.text(c, "职阶 · " + (Data.classById[cls]?.name ?: ""), 138f, y + 58f, 11.5f, Palette.CYAN)
        r.text(c, "最高 " + perm.bestFloor + " 层   轮回 " + perm.totalRuns + " 次   神格点 " + perm.talentPoints, 138f, y + 80f, 10.5f, Palette.TEXT_DIM)
        r.text(c, "整备完毕就从下方「出发远征」再上路", 138f, y + 102f, 10.5f, Palette.TEXT_FAINT)
    }
    y += 138f

    // 货币条
    card(c, 20f, y, w - 40f, 44f, r.withAlpha(Palette.BORDER_SOFT, 190), 12f)
    val gold = p?.gold ?: 0
    val cols = listOf(
        com.kaiju.awaken.game.ArtIcon.GOLD to gold.toString(),
        com.kaiju.awaken.game.ArtIcon.TALENT to perm.talentPoints.toString(),
        com.kaiju.awaken.game.ArtIcon.DUST to perm.dust.toString(),
        com.kaiju.awaken.game.ArtIcon.FLOOR to perm.bestFloor.toString()
    )
    val cw = (w - 40f) / 4f
    for (i in cols.indices) {
        val cx = 20f + cw * i + cw / 2f
        drawIcon(c, cols[i].first, cx - 14f, y + 22f, 24f)
        r.text(c, cols[i].second, cx + 10f, y + 27f, 14f, Palette.GOLD, true, Paint.Align.CENTER)
    }
    y += 56f

    if (p == null) {
        r.text(c, "行囊 / 装备 / 战技 / 星语环 要先开始一次远征才会开放", 24f, y, 10.5f, Palette.TEXT_FAINT)
        y += 18f
    }

    // 功能宫格
    // 图鉴 / 成就 / 星尘兑换 / 存档 从标题界面迁移到这里（功能归属游戏内）
    val entries = listOf(
        Triple("hub_bag", "行囊", "enabled"),
        Triple("hub_equip", "装备", "enabled"),
        Triple("hub_skills", "战技", "enabled"),
        Triple("hub_talents", "星语环", "enabled"),
        Triple("hub_merc", "伙伴", "party"),
        Triple("hub_recruit", "招募所", "party"),
        Triple("hub_pet", "宠物", "always"),
        Triple("hub_story", "主线", "always"),
        Triple("hub_growth", "神格强化", "always"),
        Triple("hub_codex", "图鉴", "always"),
        Triple("hub_ach", "成就", "always"),
        Triple("hub_shop", "星尘兑换", "always"),
        Triple("hub_slots", "存档", "always")
    )
    val gw = (w - 40f - 3 * 8f) / 4f
    val gridRows = (entries.size + 3) / 4
    for (i in entries.indices) {
        val col = i % 4
        val row = i / 4
        val x = 20f + col * (gw + 8f)
        val yy = y + row * (gw + 10f)
        val active = p != null || entries[i].third == "always"
        card(c, x, yy, gw, gw, if (active) r.withAlpha(Palette.CYAN, 170) else r.withAlpha(Palette.BORDER_SOFT, 110), 14f)
        r.text(c, entries[i].second, x + gw / 2f, yy + gw / 2f + 6f, if (entries[i].second.length > 3) 11f else 13f, if (active) Palette.TEXT else Palette.TEXT_FAINT, true, Paint.Align.CENTER)
        if (active) hit(entries[i].first, x, yy, gw, gw)
    }
    y += (gw + 10f) * gridRows + 6f

    // 底部操作区一并纳入流式布局：13 个功能格在 16:9（h≈711）上会排到 700+，
    // 与固定在 h-168 的按钮直接硬碰撞。改为跟随内容滚动后，任意高度都不会重叠。
    val blockH = if (p == null) 58f + 12f + 40f + 16f else 58f + 12f + 44f + 12f + 40f + 16f
    val pushTo = h - 14f - blockH
    if (y + 16f < pushTo) y = pushTo - 16f
    y += 16f

    if (p == null) {
        button(c, "hub_start", "出 发 远 征", 40f, y, w - 80f, 58f, Palette.PINK)
        y += 70f
    } else {
        button(c, "hub_resume", "继 续 深 入", 40f, y, w - 80f, 58f, Palette.PINK)
        y += 70f
        ghostButton(c, "hub_abandon", "放弃本轮并结算", 40f, y, w - 80f, 44f, Palette.RED)
        y += 56f
    }
    ghostButton(c, "hub_settings", "设 定", 40f, y, w - 80f, 40f, Palette.TEXT_DIM)
    y += 40f + 16f
    endScroll(c, y)
}

internal fun GameView.tapHub(id: String) {
    val p = run
    when (id) {
        "hub_start" -> {
            prepareSetup()
            screen = GameView.Screen.SETUP
        }
        "hub_resume" -> {
            if (p != null) {
                if (p.floorEvents.isEmpty()) com.kaiju.awaken.game.TowerService.generateFloor(p)
                screen = GameView.Screen.TOWER
                audio.playBgm("tower")
            }
        }
        "hub_abandon" -> {
            if (p != null && p.floor > 1) {
                showConfirm("放弃本轮将立即按当前层数结算神格点，无法继续深入。", "abandon")
            } else {
                showToast("尚未深入，无需结算")
            }
        }
        "hub_bag" -> { panel = "bag"; panelScroll = 0f }
        "hub_equip" -> { panel = "equip"; panelScroll = 0f }
        "hub_skills" -> { panel = "skills"; panelScroll = 0f }
        "hub_talents" -> { panel = "talents"; panelScroll = 0f }
        "hub_merc" -> { panel = "merc"; panelScroll = 0f }
        "hub_settings" -> { panel = "settings"; panelScroll = 0f }
        "hub_recruit" -> {
            recruitList = ArrayList(com.kaiju.awaken.game.TowerService.tavernCandidates(run?.floor ?: 1))
            screen = GameView.Screen.RECRUIT
        }
        "hub_story" -> screen = GameView.Screen.STORY
        "hub_pet" -> screen = GameView.Screen.PET
        "hub_growth" -> { metaReturn = GameView.Screen.HUB; screen = GameView.Screen.GROWTH }
        "hub_codex" -> { metaReturn = GameView.Screen.HUB; screen = GameView.Screen.CODEX }
        "hub_ach" -> { metaReturn = GameView.Screen.HUB; screen = GameView.Screen.ACHIEVEMENTS }
        "hub_shop" -> { metaReturn = GameView.Screen.HUB; screen = GameView.Screen.SHOP }
        "hub_slots" -> { metaReturn = GameView.Screen.HUB; screen = GameView.Screen.SAVE_SLOTS }
    }
}
