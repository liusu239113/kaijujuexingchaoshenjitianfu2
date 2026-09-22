package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.game.ArtIcon as AI
import com.dshx.game.shidai.game.Content
import com.dshx.game.shidai.game.Data
import com.dshx.game.shidai.game.RunService
import com.dshx.game.shidai.game.Save
import com.dshx.game.shidai.game.TowerService
import com.dshx.game.shidai.game.Unit

internal fun GameView.drawTowerScreen(c: Canvas) {
    val p = run ?: return
    r.panel(c, 0f, 0f, w, 104f, 0f, r.withAlpha(0xFF1B1040.toInt(), 238), r.withAlpha(0xFF120A2E.toInt(), 225), null)
    r.fill.color = r.withAlpha(Palette.PINK, 70)
    c.drawRect(0f, 102f, w, 104f, r.fill)
    r.text(c, "第 ${p.floor} 层", 20f, 40f, 22f, Palette.TEXT, true)
    r.text(c, p.mode.cn + "模式 · 目标 ${if (p.mode.endFloor == 0) "无界" else p.mode.endFloor.toString() + " 层"}", 20f, 62f, 11.5f, Palette.TEXT_DIM)
    // 货币 / 战技点原本靠 emoji 提示，改为图标 + 数值（缺图自动回退原 emoji）
    var hx = statChip(c, "", "", "Lv.${p.level}", 20f, 86f, 13f, Palette.GOLD)
    hx = statChip(c, AI.GOLD, "💰", "${p.gold}", hx, 86f, 13f, Palette.GOLD)
    statChip(c, AI.SKILL_POINT, "✨", "${p.skillPoints}", hx, 86f, 13f, Palette.GOLD)

    val navY = 22f
    val bw = 62f
    ghostButton(c, "tower_menu", "回廊", w - bw * 3f - 30f, navY, bw, 34f, Palette.TEXT_DIM)
    ghostButton(c, "tower_panel_talents", "天赋", w - bw * 2f - 22f, navY, bw, 34f, Palette.CYAN)
    ghostButton(c, "tower_panel_attrs", "面板", w - bw - 14f, navY, bw, 34f, Palette.PINK)
    val healUsed = healAdFloor == p.floor
    ghostButton(
        c, "tower_ad_heal",
        if (healUsed) "已回血" else "看广告 · 回满血",
        20f, 62f, 118f, 30f, if (healUsed) Palette.TEXT_FAINT else Palette.GREEN
    )

    // 路径（只画一次）
    drawFloorPath(c, 118f)

    // 事件舞台：全屏唯一绘制点。
    // 旧实现把这一整段复制了两遍 —— 第二遍的 opaque card 会盖住第一遍已画好的内容，
    // 导致「事件标题/选项被色块压住」的 UI 重叠，同时 hit 被重复注册、音效与结算双触发。
    val stageY = 214f
    val fe = TowerService.currentEvent(p)
    card(c, 18f, stageY, w - 36f, h - stageY - 108f, r.withAlpha(Palette.BORDER, 200), 18f)
    if (fe == null) {
        r.text(c, "本层已肃清。", w / 2f, stageY + 80f, 18f, Palette.CYAN, true, Paint.Align.CENTER)
        button(c, "tower_next_floor", "深入下一层", 48f, stageY + 120f, w - 96f, 56f, Palette.PINK)
    } else {
        drawEventStage(c, stageY, fe)
    }
    drawBottomNav(c)
    if (perm.seenIntro == false) {
        r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 236))
        card(c, 26f, 150f, w - 52f, h - 320f, r.withAlpha(Palette.CYAN, 210), 20f)
        r.text(c, "回廊入门", w / 2f, 200f, 24f, Palette.CYAN, true, Paint.Align.CENTER)
        var iy = 240f
        val tips = listOf(
            "① 每层由「设施 + 若干遭遇 + 层末首领」组成。",
            "② 每 5 层获得一次星语觉醒，同源星语相邻会结成共鸣链。",
            "③ 神格环满 6 格后，新星语必须覆盖旧星语——这是构筑的核心取舍。",
            "④ 第 3 层可一转，第 30 层可二转，转职会带来专属战技。",
            "⑤ 战斗中可点击敌方卡锁定目标，单体战技会优先打锁定目标。",
            "⑥ 倒下不是结束：轮回会把层数折算成神格点，用于永久淬炼。"
        )
        for (t in tips) {
            iy = r.wrap(c, t, 44f, iy, w - 88f, 12f, Palette.TEXT_DIM, 18f) + 6f
        }
        ghostButton(c, "tower_intro_ok", "开 始 探 索", 44f, h - 200f, w - 88f, 52f, Palette.PINK)
    }
}

private fun GameView.drawFloorPath(c: Canvas, top: Float) {
    val p = run ?: return
    val list = p.floorEvents
    if (list.isEmpty()) return
    r.text(c, "本层路径", 22f, top + 2f, 11.5f, Palette.TEXT_DIM)
    val n = list.size
    val avail = w - 44f
    val step = if (n > 1) avail / (n - 1) else 0f
    val cy = top + 34f
    r.stroke.shader = null
    r.stroke.color = r.withAlpha(Palette.BORDER_SOFT, 200)
    r.stroke.strokeWidth = 2f
    if (n > 1) c.drawLine(22f, cy, 22f + avail, cy, r.stroke)
    for (i in 0 until n) {
        val cx = 22f + step * i
        val fe = list[i]
        val done = i < p.eventIdx
        val cur = i == p.eventIdx
        val col = when {
            done -> Palette.GREEN
            cur -> Palette.PINK
            else -> Palette.BORDER_SOFT
        }
        if (cur) r.glowPanel(c, cx - 13f, cy - 13f, 26f, 26f, 13f, Palette.PINK, 70)
        r.fill.shader = null
        r.fill.color = r.withAlpha(col, if (cur || done) 255 else 140)
        c.drawCircle(cx, cy, if (cur) 10f else 7f, r.fill)
        val glyph = when (fe.kind) {
            "boss" -> "王"
            "combat_elite" -> "精"
            "combat_normal" -> "战"
            "shop" -> "商"
            "tavern" -> "酒"
            "story" -> "灯"
            else -> "事"
        }
        r.text(c, glyph, cx, cy + 4f, 9f, 0xFF140B26.toInt(), true, Paint.Align.CENTER)
    }
}

private fun GameView.drawEventStage(c: Canvas, top: Float, fe: com.dshx.game.shidai.game.FloorEvent) {
    val p = run ?: return
    val accent = when (fe.kind) {
        "boss" -> Palette.RED
        "combat_elite" -> Palette.GOLD
        "combat_normal" -> Palette.PINK
        "shop" -> Palette.CYAN
        "tavern" -> Palette.GREEN
        else -> Palette.CYAN
    }
    if (fe.resolved) {
        r.text(c, "结果", w / 2f, top + 40f, 15f, accent, true, Paint.Align.CENTER)
        r.wrap(c, fe.result.ifEmpty { eventResult }, 44f, top + 78f, w - 88f, 15f, Palette.TEXT, 26f)
        button(c, "tower_continue", "继 续", 48f, top + 150f, w - 96f, 54f, Palette.CYAN)
        return
    }
    val (title, intro, glyph) = when (fe.kind) {
        "boss" -> Triple("守层首领", "塔层守卫挡住了去路。", "👑")
        "combat_elite" -> Triple("精锐遭遇", "更强的气息逼近。", "⚔")
        "combat_normal" -> Triple("魔物袭击", "几只魔物从阴影中扑出。", "🗡")
        "story" -> Triple(fe.event?.name ?: "回廊守望", fe.event?.intro ?: "", fe.event?.glyph ?: "🕯")
        "shop" -> Triple("道具商店", "商人摊开了货物。", "🛒")
        "tavern" -> Triple("佣兵酒馆", "佣兵们在角落里打量你。", "🍺")
        else -> Triple(fe.event?.name ?: "奇遇", fe.event?.intro ?: "", fe.event?.glyph ?: "❖")
    }
    val sceneKey = sceneFor(fe)
    if (sceneKey != null) {
        drawScene(c, sceneKey, w - 84f, top + 54f, 72f)
    } else {
        // 无场景插画时用图标顶替 emoji（glyph 仅作缺图回退）
        val iconKey = AI.towerKind(fe.kind, fe.event?.id)
        val iconW = 44f
        if (bitmap(iconKey) != null) {
            drawIcon(c, iconKey, 46f + iconW / 2f, top + 62f, iconW, accent)
        } else {
            r.text(c, glyph, 46f, top + 62f, 34f, accent, true)
        }
    }
    r.text(c, title, 92f, top + 50f, 19f, Palette.TEXT, true)
    r.text(c, "第 ${p.floor} 层", 92f, top + 72f, 11.5f, Palette.TEXT_DIM)
    r.wrap(c, intro, 30f, top + 104f, w - 96f, 12.5f, Palette.TEXT_DIM, 18f)

    val choices = fe.event?.choices ?: emptyList()
    val isFight = fe.kind == "boss" || fe.kind == "combat_elite" || fe.kind == "combat_normal"
    // 选项多 + 大字号时，旧实现会一路画到卡片外并压住底部导航。
    // 这里把选项区做成滚动区：卡片下沿再内缩，战斗提示留在滚动区之下。
    val listBottom = if (isFight) h - 162f else h - 118f
    var y = beginScroll(c, top + 150f, listBottom)
    if (choices.isEmpty()) {
        button(c, "evt_enter", "进 入", 48f, y, w - 96f, 54f, accent)
        y += 62f
    } else {
        for (i in choices.indices) {
            val ch = choices[i]
            card(c, 34f, y, w - 68f, 62f, r.withAlpha(accent, 170), 14f)
            r.text(c, ch.label, 48f, y + 26f, 14.5f, Palette.TEXT, true)
            r.text(c, ch.detail, 48f, y + 47f, 11f, Palette.TEXT_DIM)
            if (ch.gold > 0) {
                val afford = p.gold >= ch.gold
                priceRight(c, "${ch.gold}", AI.GOLD, "💰", w - 52f, y + 26f, 12f,
                    if (afford) Palette.GOLD else Palette.RED)
            }
            hit("evt_choice_$i", 34f, y, w - 68f, 62f).enabled = ch.gold <= 0 || p.gold >= ch.gold
            y += 70f
        }
    }
    endScroll(c, y)
    if (isFight) {
        val kindLabel = when (fe.kind) {
            "boss" -> "首领战 · 奖励丰厚"
            "combat_elite" -> "精锐战 · 掉落提升"
            else -> "凡庸战"
        }
        // 旧写法 top + h - 150f 把提示画到了屏幕外（top 已含 214 偏移），这里修正为贴底栏
        r.text(c, kindLabel, w / 2f, h - 138f, 12f, accent, true, Paint.Align.CENTER)
    }
}

private fun GameView.drawBottomNav(c: Canvas) {
    val p = run ?: return
    val y = h - 92f
    r.panel(c, 0f, y - 8f, w, 100f, 0f, r.withAlpha(0xFF170E36.toInt(), 240), r.withAlpha(0xFF0D0722.toInt(), 245), null)
    val items = listOf(
        Triple("tower_panel_bag", "行囊", p.bag.size.toString()),
        Triple("tower_panel_equip", "装备", p.equipped.size.toString()),
        Triple("tower_panel_skills", "战技", p.skillPoints.toString()),
        Triple("tower_panel_items", "道具", p.items.values.sum().toString()),
        Triple("tower_panel_merc", "佣兵", (p.party.size - 1).toString()),
        Triple("tower_panel_settings", "设定", "")
    )
    val cw = (w - 24f) / items.size
    for (i in items.indices) {
        val x = 12f + cw * i
        val label = items[i].second
        val badge = items[i].third
        r.text(c, label, x + cw / 2f, y + 44f, 13f, Palette.TEXT_DIM, true, Paint.Align.CENTER)
        if (badge.isNotEmpty() && badge != "0") {
            // 徽章要贴住文字右侧、又不能越出自己这一格。
            // 旧实现固定在 x + cw/2 + 12，格子只有 62.7 宽时会溢到隔壁格子上。
            val lw = r.measure(label, 13f, true)
            val badgeW = 22f
            var bx = x + cw / 2f + lw / 2f + 2f
            if (bx + badgeW > x + cw - 2f) bx = x + cw - 2f - badgeW
            r.solid(c, bx, y + 14f, badgeW, 15f, 7.5f, r.withAlpha(Palette.PINK, 235))
            r.text(c, badge, bx + badgeW / 2f, y + 25f, 9.5f, 0xFF1A0F2E.toInt(), true, Paint.Align.CENTER)
        }
        hit(items[i].first, x, y + 8f, cw, 62f)
    }
}

internal fun GameView.tapTower(id: String) {
    when {
        id == "tower_menu" -> {
            screen = GameView.Screen.HUB
            Save.saveRun(context, run, perm)
        }
        id == "tower_intro_ok" -> {
            perm.seenIntro = true
            Save.savePerm(context, perm)
        }
        id == "tower_ad_heal" -> {
            val p = run ?: return
            if (healAdFloor == p.floor) {
                showToast("本层已用过广告回血")
                return
            }
            requestAd(com.dshx.game.shidai.game.RewardAds.PLACEMENT_HEAL) {
                for (u in p.party) {
                    u.hp = u.stats.maxHp
                    u.energy = 0.0
                }
                healAdFloor = p.floor
                audio.play("heal")
                showToast("全队生命已回满")
            }
        }
        id == "tower_continue" -> continueAfterEvent()
        id == "tower_next_floor" -> {
            val p = run ?: return
            TowerService.advanceFloor(p, perm)
            afterFloorAdvance()
        }
        id == "tower_recruit" -> {
            recruitList = ArrayList(TowerService.tavernCandidates(run?.floor ?: 1))
            screen = GameView.Screen.RECRUIT
        }
        id.startsWith("tower_panel_") -> {
            panel = id.removePrefix("tower_panel_")
            panelScroll = 0f
        }
    }
}

internal fun GameView.tapEvent(id: String) {
    when {
        id == "evt_enter" -> enterCurrentEvent()
        id.startsWith("evt_choice_") -> {
            val idx = id.removePrefix("evt_choice_").toIntOrNull() ?: return
            val p = run ?: return
            val fe = TowerService.currentEvent(p) ?: return
            val ch = fe.event?.choices?.getOrNull(idx) ?: return
            resolveEvent(ch)
        }
    }
}

internal fun GameView.drawShopOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 220))
    hit("modal_block", 0f, 0f, w, h)
    card(c, 22f, 90f, w - 44f, h - 200f, r.withAlpha(Palette.CYAN, 200), 20f)
    r.text(c, "道具商店", w / 2f, 140f, 22f, Palette.CYAN, true, Paint.Align.CENTER)
    r.text(c, "金币 ${run?.gold ?: 0}", w / 2f, 164f, 13f, Palette.GOLD, false, Paint.Align.CENTER)
    val p = run ?: return
    var y = 186f
    for (i in shopStock.indices) {
        val it = shopStock[i]
        val afford = p.gold >= it.price
        card(c, 40f, y, w - 80f, 76f, if (afford) r.withAlpha(Palette.BORDER, 190) else r.withAlpha(Palette.BORDER_SOFT, 120), 14f)
        drawIcon(c, com.dshx.game.shidai.game.ArtIcon.item(it.id), 62f, y + 38f, 42f, Palette.CYAN)
        r.text(c, it.name, 96f, y + 30f, 15f, Palette.TEXT, true)
        // 描述必须避开右侧价格（价格右对齐于 w-60），否则长描述会铺到价格底下
        r.wrapClamp(c, it.desc, 96f, y + 52f, w - 200f, 11f, Palette.TEXT_DIM, 14f, 1)
        priceRight(c, "${it.price}", AI.GOLD, "💰", w - 60f, y + 44f, 14f,
            if (afford) Palette.GOLD else Palette.RED)
        hit("shop_buy_$i", 40f, y, w - 80f, 76f).enabled = afford
        y += 84f
    }
    val goldGain = 80 + (run?.floor ?: 1) * 20
    ghostButton(
        c, "shop_ad_gold",
        if (shopGoldClaimed) "已领取（本次已用）" else "看广告 · 领 $goldGain 金币",
        40f, h - 210f, w - 80f, 44f, if (shopGoldClaimed) Palette.TEXT_FAINT else Palette.GOLD
    )
    ghostButton(
        c, "shop_ad_refresh",
        if (shopAdRefreshed) "已刷新（本次已用）" else "看广告 · 免费刷新商品",
        40f, h - 154f, w - 80f, 44f, if (shopAdRefreshed) Palette.TEXT_FAINT else Palette.GREEN
    )
    ghostButton(c, "shop_close", "离开商铺", 40f, h - 96f, w - 80f, 52f, Palette.TEXT_DIM)
}

internal fun GameView.tapShop(id: String) {
    val p = run ?: return
    when {
        id == "shop_ad_gold" -> {
            if (shopGoldClaimed) {
                showToast("本次进店已领取过")
                return
            }
            val gain = 80 + p.floor * 20
            requestAd(com.dshx.game.shidai.game.RewardAds.PLACEMENT_GOLD) {
                p.gold += gain
                shopGoldClaimed = true
                audio.play("coins")
                showToast("获得 $gain 金币")
            }
        }
        id == "shop_ad_refresh" -> {
            if (shopAdRefreshed) {
                showToast("本次进店已刷新过")
                return
            }
            requestAd(com.dshx.game.shidai.game.RewardAds.PLACEMENT_SHOP_REFRESH) {
                shopStock = TowerService.shopItems()
                shopAdRefreshed = true
                showToast("商品已刷新")
            }
        }
        id == "shop_close" -> {
            overlay = ""
            val fe = TowerService.currentEvent(p)
            if (fe != null) {
                fe.resolved = true
                fe.result = "你带着补给离开了商店。"
            }
            continueAfterEvent()
        }
        id.startsWith("shop_buy_") -> {
            val idx = id.removePrefix("shop_buy_").toIntOrNull() ?: return
            val it = shopStock.getOrNull(idx) ?: return
            if (p.gold < it.price) {
                showToast("金币不足")
                return
            }
            p.gold -= it.price
            p.items[it.id] = (p.items[it.id] ?: 0) + 1
            showToast("购入 ${it.name}")
            audio.play("coins")
        }
    }
}

internal fun GameView.drawTavernOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 220))
    hit("modal_block", 0f, 0f, w, h)
    card(c, 22f, 90f, w - 44f, h - 200f, r.withAlpha(Palette.GREEN, 200), 20f)
    r.text(c, "佣兵酒馆", w / 2f, 140f, 22f, Palette.GREEN, true, Paint.Align.CENTER)
    val p = run ?: return
    r.text(c, "队伍 ${p.party.size}/3 · 金币 ${p.gold}", w / 2f, 164f, 13f, Palette.GOLD, false, Paint.Align.CENTER)
    var y = 186f
    for (i in tavernList.indices) {
        val u = tavernList[i]
        val cost = TowerService.mercenaryCost(u)
        val col = rarityColor(u.rarity)
        val full = p.party.size >= 3
        card(c, 40f, y, w - 80f, 96f, col, 14f)
        drawPortrait(c, u.avatarKey.ifEmpty { u.clsId }, 84f, y + 48f, 56f, col)
        r.text(c, u.name + " · " + (Data.classById[u.clsId]?.name ?: ""), 124f, y + 32f, 15f, Palette.TEXT, true)
        r.text(c, u.rarity.cn + " · Lv.${u.level} · 攻击 ${u.base.atk.toInt()} 生命 ${u.base.maxHp.toInt()}", 124f, y + 54f, 11f, Palette.TEXT_DIM)
        priceRight(c, "$cost", AI.GOLD, "💰", w - 60f, y + 60f, 15f,
            if (p.gold >= cost && !full) Palette.GOLD else Palette.RED)
        hit("tavern_hire_$i", 40f, y, w - 80f, 96f).enabled = !full && p.gold >= cost
        y += 104f
    }
    ghostButton(
        c, "tavern_ad_refresh",
        if (tavernAdRefreshed) "已刷新（本次已用）" else "看广告 · 免费刷新候选人",
        40f, h - 154f, w - 80f, 44f, if (tavernAdRefreshed) Palette.TEXT_FAINT else Palette.GREEN
    )
    ghostButton(c, "tavern_close", "离开酒肆", 40f, h - 96f, w - 80f, 52f, Palette.TEXT_DIM)
}

internal fun GameView.tapTavern(id: String) {
    val p = run ?: return
    when {
        id == "tavern_ad_refresh" -> {
            if (tavernAdRefreshed) {
                showToast("本次进店已刷新过")
                return
            }
            requestAd(com.dshx.game.shidai.game.RewardAds.PLACEMENT_TAVERN_REFRESH) {
                tavernList = ArrayList(TowerService.tavernCandidates(p.floor))
                tavernAdRefreshed = true
                showToast("候选人已刷新")
            }
        }
        id == "tavern_close" -> {
            overlay = ""
            val fe = TowerService.currentEvent(p)
            if (fe != null) {
                fe.resolved = true
                fe.result = "你离开了喧闹的酒馆。"
            }
            continueAfterEvent()
        }
        id.startsWith("tavern_hire_") -> {
            val idx = id.removePrefix("tavern_hire_").toIntOrNull() ?: return
            val u = tavernList.getOrNull(idx) ?: return
            if (TowerService.recruit(p, u)) {
                RunService.recalcAll(p, perm)
                tavernList.removeAt(idx)
                showToast("${u.name} 加入了队伍")
                audio.play("levelup")
            } else {
                showToast("无法招募（队伍已满或金币不足）")
            }
        }
    }
}
