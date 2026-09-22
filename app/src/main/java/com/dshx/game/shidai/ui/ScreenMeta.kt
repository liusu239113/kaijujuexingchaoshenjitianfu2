package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.game.Achievements
import com.dshx.game.shidai.game.Content
import com.dshx.game.shidai.game.Content2
import com.dshx.game.shidai.game.Data
import com.dshx.game.shidai.game.Meta
import com.dshx.game.shidai.game.Rarity
import com.dshx.game.shidai.game.Save
import com.dshx.game.shidai.game.Tracker

internal fun GameView.drawAchievementsScreen(c: Canvas) {
    val done = Achievements.all.count { (perm.achProgress[it.id] ?: 0) >= it.target }
    drawTopBar(c, "回廊成就", "已达成 $done / ${Achievements.all.size} · 星尘 ${perm.dust}", "meta_back", null, null)
    var y = beginScroll(c)
    for (a in Achievements.all) {
        val cur = (perm.achProgress[a.id] ?: 0).coerceAtMost(a.target)
        val ok = cur >= a.target
        y = progressRow(
            c, a.name, a.desc, cur, a.target,
            if (a.target > 1) "$cur/${a.target}" else if (ok) "达成" else "",
            "+" + a.dust + " 星尘", Palette.CYAN, y, ok
        )
    }
    endScroll(c, y)
    ghostButton(c, "priv_policy", "查看完整《隐私政策》", UiKit.MARGIN, h - 132f, contentW(), 46f, Palette.CYAN)
    ghostButton(c, "meta_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
}

internal fun GameView.drawShopScreen(c: Canvas) {
    // 旧版这一屏只丢出三个「星语扩展 · 一/二/三」和一行「长线解锁内容」，
    // 玩家完全不知道星尘是什么、打哪来、买了会发生什么 —— 反馈就是「看不懂」。
    drawTopBar(c, "星尘兑换", "用星尘永久扩充神格卡池", "meta_back", null, null)
    var y = beginScroll(c, 112f)

    // ---- 这是什么 ----
    card(c, UiKit.MARGIN, y, contentW(), 100f, r.withAlpha(Palette.CYAN, 190), UiKit.RADIUS)
    r.text(c, "星尘能做什么", UiKit.MARGIN + 14f, y + 26f, 13.5f, Palette.CYAN, true)
    r.wrapClamp(
        c,
        "在下面解锁「星语扩展」，把新的星语（天赋）永久加进每局开始时的神格觉醒卡池。" +
            "解锁是账号级的，之后每一局都能抽到这些新星语。",
        UiKit.MARGIN + 14f, y + 46f, contentW() - 28f, 11f, Palette.TEXT_DIM, 15f, 3
    )
    y += 112f

    // ---- 从哪来 ----
    y = sectionHeader(c, "星尘从哪来", y)
    val src = listOf(
        "回廊成就" to "每达成一个成就立即发放",
        "章节奖励" to "推进主线章节时结算",
        "通关模式" to "打穿一个试炼强度即发放",
        "宠物召唤" to "抽到已满级宠物时折算"
    )
    for (s in src) {
        r.text(c, "· " + s.first, UiKit.MARGIN + 6f, y + 12f, 11.5f, Palette.GOLD)
        r.text(c, s.second, w - UiKit.MARGIN - 6f, y + 12f, 11f, Palette.TEXT_DIM, false, Paint.Align.RIGHT)
        y += 20f
    }
    y += 6f

    // ---- 可兑换内容 ----
    val poolN = Meta.unlocks.count { perm.unlocked.contains(it.kind + ":" + it.key) }
    y = sectionHeader(c, "星语扩展（已解锁 " + poolN + " / " + Meta.unlocks.size + " 批）", y)
    for (u in Meta.unlocks) {
        val owned = perm.unlocked.contains(u.kind + ":" + u.key)
        val afford = perm.dust >= u.cost
        card(
            c, UiKit.MARGIN, y, contentW(), UiKit.ROW_MED + 22f,
            if (owned) Palette.GREEN else if (afford) Palette.PINK else Palette.BORDER_SOFT, UiKit.RADIUS
        )
        r.text(c, u.name, UiKit.MARGIN + 14f, y + 24f, 13.5f, if (owned) Palette.GREEN else Palette.TEXT, true)
        r.text(c, u.desc, UiKit.MARGIN + 14f, y + 44f, 10.5f, Palette.TEXT_DIM)
        r.text(
            c, if (owned) "已加入卡池 · 每局都能抽到" else "解锁后本局卡池 +12 颗星语",
            UiKit.MARGIN + 14f, y + 64f, 10f, if (owned) Palette.GREEN else Palette.CYAN
        )
        if (owned) {
            r.text(c, "已解锁", w - UiKit.MARGIN - 14f, y + 44f, 13f, Palette.GREEN, true, Paint.Align.RIGHT)
        } else {
            ghostButton(
                c, "dust_buy_" + u.id, u.cost.toString() + " 尘",
                w - UiKit.MARGIN - 104f, y + 20f, 90f, 40f,
                if (afford) Palette.PINK else Palette.TEXT_FAINT
            )
        }
        y += UiKit.ROW_MED + 30f
    }

    // ---- 累计 ----
    y = sectionHeader(c, "累计", y + 4f)
    r.text(c, "累计获得星尘：" + perm.dustTotal, UiKit.MARGIN, y + 12f, 11.5f, Palette.GOLD)
    r.text(c, "当前持有：" + perm.dust, UiKit.MARGIN, y + 30f, 11.5f, Palette.CYAN)
    endScroll(c, y + 40f)
    ghostButton(c, "meta_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)

}

internal fun GameView.drawAboutScreen(c: Canvas) {
    drawTopBar(c, "关于与隐私", "本作完全离线运行", "meta_back", null, null)
    var y = beginScroll(c, 112f)
    val lines = listOf(
        "《穿越星塔：全民登临时代》  v1.5.0" to "",
        "运行方式" to "单机离线游戏，无服务器、无账号体系、无联网权限。",
        "隐私说明" to "不收集任何个人信息，不集成任何第三方 SDK，不申请网络权限。",
        "数据存储" to "全部进度保存在设备本地的应用私有目录中，卸载应用即彻底删除。可在设定中导出为文本换机。",
        "广告说明" to "激励视频广告由 Tosin / TopOn 聚合提供，已关闭 IMEI、MAC、定位、应用列表等敏感采集。",
        "内容说明" to "战斗表现为星光消散，无血腥、恐怖表现。",
        "适龄提示" to "建议 12 岁以上玩家游玩。",
        "故障排查" to "若出现异常，可在设定中导出存档后清空数据重试。",
        "联系方式" to "请通过应用商店的开发者页面反馈问题。"
    )
    for ((title, body) in lines) {
        y = sectionHeader(c, title, y)
        if (body.isNotEmpty()) y = r.wrap(c, body, UiKit.MARGIN, y, contentW(), 12f, Palette.TEXT_DIM, 18f) + 10f
    }
    endScroll(c, y + 10f)
    ghostButton(c, "meta_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
}

internal fun GameView.drawCodexFullScreen(c: Canvas) {
    val total = Data.allTalents.size + Content.allEvents.size + Content2.monsterAvatars.size +
        Content2.eliteAvatars.size + Content2.bossAvatars.size
    drawTopBar(c, "星语图鉴", "已收录 ${perm.codexSeen.size} / $total", "meta_back", "codex_filter", codexFilterLabel())
    var y = beginScroll(c, 112f)
    when (codexTab) {
        0 -> {
            val order = listOf(Rarity.HIDDEN, Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON)
            for (rar in order) {
                val list = Data.allTalents.filter { it.rarity == rar }
                if (list.isEmpty()) continue
                y = sectionHeader(c, rar.cn + " · " + list.size + " 项", y, rarityColor(rar))
                for (t in list) {
                    val seen = perm.codexSeen.contains("t:" + t.id)
                    val col = if (seen) rarityColor(t.rarity) else Palette.BORDER_SOFT
                    card(c, UiKit.MARGIN, y, contentW(), r.lh(58f), r.withAlpha(col, 170), UiKit.RADIUS)
                    // 已收录：画这颗天赋自己的图标。未收录保留字符徽记，不提前剧透。
                    if (seen) {
                        drawIcon(
                            c, com.dshx.game.shidai.game.ArtIcon.talent(t),
                            UiKit.MARGIN + 30f, y + r.lh(29f), r.lh(36f), col
                        )
                    } else {
                        r.hexFrame(c, UiKit.MARGIN + 28f, y + 29f, 17f, col, r.withAlpha(Palette.PANEL_SOFT, 255))
                        r.text(c, t.school.glyph, UiKit.MARGIN + 28f, y + 35f, 14f, col, true, Paint.Align.CENTER)
                    }
                    r.text(c, if (seen) t.name else "？？？", UiKit.MARGIN + 54f, y + 24f, 13f,
                        if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                    r.text(c, if (seen) t.school.cn else "未觉醒", w - UiKit.MARGIN - 12f, y + 24f, 10.5f, col, false, Paint.Align.RIGHT)
                    if (seen) r.wrap(c, t.desc, UiKit.MARGIN + 54f, y + 42f, contentW() - 90f, 10f, Palette.TEXT_DIM, 13f)
                    y += r.lh(64f)
                }
                y += 6f
            }
        }
        1 -> {
            y = sectionHeader(c, "随机遭遇 · " + Content.allEvents.size + " 项", y)
            for (e in Content.allEvents) {
                val seen = perm.codexSeen.contains("e:" + e.id)
                card(c, UiKit.MARGIN, y, contentW(), r.lh(56f), if (seen) r.withAlpha(Palette.CYAN, 170) else Palette.BORDER_SOFT, UiKit.RADIUS)
                r.text(c, if (seen) e.name else "未知遭遇", UiKit.MARGIN + 14f, y + 26f, 13f,
                    if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                if (seen) r.wrap(c, e.intro, UiKit.MARGIN + 14f, y + 44f, contentW() - 28f, 10f, Palette.TEXT_DIM, 13f)
                y += r.lh(62f)
            }
        }
        else -> {
            y = sectionHeader(c, "魔物 · 精锐 · 首领", y, Palette.PINK)
            for (n in Content2.monsterAvatars + Content2.eliteAvatars + Content2.bossAvatars) {
                val seen = perm.codexSeen.contains("m:" + n)
                card(c, UiKit.MARGIN, y, contentW(), r.lh(64f), if (seen) r.withAlpha(Palette.PINK, 160) else Palette.BORDER_SOFT, UiKit.RADIUS)
                if (seen) drawPortrait(c, n, UiKit.MARGIN + 34f, y + 32f, 48f, Palette.PINK)
                else {
                    r.hexFrame(c, UiKit.MARGIN + 34f, y + 32f, 22f, Palette.BORDER_SOFT, r.withAlpha(Palette.PANEL_SOFT, 255))
                    r.text(c, "？", UiKit.MARGIN + 34f, y + 39f, 17f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
                }
                r.text(c, if (seen) monsterName(n) else "未遭遇", UiKit.MARGIN + 70f, y + 36f, 13f,
                    if (seen) Palette.TEXT else Palette.TEXT_FAINT, true)
                y += r.lh(70f)
            }
        }
    }
    endScroll(c, y)
    ghostButton(c, "meta_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
}

private fun monsterName(key: String): String {
    val idx = key.drop(1).toIntOrNull() ?: 1
    return when {
        key.startsWith("b") -> Content.bossNames[(idx - 1).coerceIn(0, Content.bossNames.size - 1)]
        key.startsWith("e") -> "精锐 · " + Content.eliteNames[(idx - 1).coerceIn(0, Content.eliteNames.size - 1)]
        else -> Content.normalNames[(idx - 1).coerceIn(0, Content.normalNames.size - 1)]
    }
}

private fun GameView.codexFilterLabel(): String = when (codexTab) {
    0 -> "星语"
    1 -> "遭遇"
    else -> "魔物"
}

internal fun GameView.tapMeta(id: String) {
    when (id) {
        "meta_back" -> goScreen(metaReturn)
        "meta_hub" -> goScreen(GameView.Screen.HUB)
        "meta_growth" -> goScreen(GameView.Screen.GROWTH)
        "meta_codex" -> goScreen(GameView.Screen.CODEX)
        "meta_ach" -> goScreen(GameView.Screen.ACHIEVEMENTS)
        "meta_shop" -> goScreen(GameView.Screen.SHOP)
        "meta_about" -> goScreen(GameView.Screen.ABOUT)
        "meta_slots" -> goScreen(GameView.Screen.SAVE_SLOTS)
    }
}

internal fun GameView.tapCodex(id: String) {
    if (id == "codex_filter") {
        codexTab = (codexTab + 1) % 3
        screenScroll = 0f
        audio.play("page")
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
        audio.play("error")
        showToast("星尘不足")
        return
    }
    perm.dust -= u.cost
    perm.unlocked.add(u.kind + ":" + u.key)
    Save.savePerm(context, perm)
    audio.play("unlock")
    showToast("已解锁：" + u.name)
}

internal fun GameView.tapSlot(id: String) {
    if (!id.startsWith("slot_pick_")) return
    val n = id.removePrefix("slot_pick_").toIntOrNull() ?: return
    Save.setSlot(context, perm, n)
    perm = Save.loadPerm(context)
    applyDisplaySettings()
    run = Save.loadRun(context, perm)
    // 换档等于换了一整份进度：弹层、详情、战斗、抽卡、剧情分页全部重建
    resetTransientUi()
    runStartMs = System.currentTimeMillis()
    showToast("已切换到存档 " + (n + 1))
    goScreen(GameView.Screen.MENU)
}

internal fun GameView.drawSaveSlotsScreen(c: Canvas) {
    drawTopBar(c, "存档管理", "当前存档槽：" + (Save.currentSlot + 1), "meta_back", null, null)
    val slots = Save.slotSummaries(context)
    var y = beginScroll(c, 112f)
    y = sectionHeader(c, "存档槽", y)
    for (i in slots.indices) {
        val info = slots[i]
        val cur = Save.currentSlot == i
        card(c, UiKit.MARGIN, y, contentW(), r.lh(104f), if (cur) Palette.GOLD else Palette.BORDER_SOFT, 14f)
        r.text(c, "存档 " + (i + 1), UiKit.MARGIN + 16f, y + 30f, 16f, if (cur) Palette.GOLD else Palette.TEXT, true)
        if (info.isEmpty) {
            r.text(c, "空存档位", UiKit.MARGIN + 16f, y + 56f, 12f, Palette.TEXT_FAINT)
        } else {
            r.text(c, info.summary, UiKit.MARGIN + 16f, y + 54f, 11.5f, Palette.TEXT_DIM)
            r.text(c, info.detail, UiKit.MARGIN + 16f, y + 74f, 10.5f, Palette.TEXT_FAINT)
        }
        if (cur) r.text(c, "使用中", w - UiKit.MARGIN - 16f, y + 40f, 13f, Palette.GOLD, true, Paint.Align.RIGHT)
        else ghostButton(c, "slot_pick_$i", "切换到此槽", w - UiKit.MARGIN - 130f, y + 44f, 116f, 40f, Palette.CYAN)
        y += r.lh(114f)
    }
    y = sectionHeader(c, "说明", y + 4f)
    r.wrap(c, "每个存档槽独立保存轮回淬炼、星尘、成就、图鉴与当前远征进度。切换后原槽数据不会被覆盖。", UiKit.MARGIN, y, contentW(), 11.5f, Palette.TEXT_DIM, 18f)
    endScroll(c, y + 60f)
    ghostButton(c, "meta_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 48f, Palette.TEXT_DIM)
}
