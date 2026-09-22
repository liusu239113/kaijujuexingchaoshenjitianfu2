package com.dshx.game.shidai.ui

import android.graphics.Canvas
import android.graphics.Paint
import com.dshx.game.shidai.game.Pets
import com.dshx.game.shidai.game.Rarity
import com.dshx.game.shidai.game.RewardAds
import com.dshx.game.shidai.game.Save
import kotlin.math.roundToInt

/** 属性键 → 中文名（宠物面板自用，避免依赖其它文件里的私有实现）。 */
private fun petStatLabel(key: String): String = when (key) {
    "atk" -> "攻击"
    "matk" -> "法强"
    "maxHp" -> "生命"
    "def" -> "防御"
    "crit" -> "暴击"
    "critDmg" -> "暴伤"
    "dodge" -> "闪避"
    "lifesteal" -> "吸血"
    "energyRegen" -> "回能"
    "hpRegen" -> "回血"
    "healPower" -> "治疗强度"
    "shieldPower" -> "护盾强度"
    "dmgReduction" -> "减伤"
    else -> key
}

/** 宠物：图鉴 / 详情预览 / 出战选择 / 召唤。 */
internal fun GameView.drawPetScreen(c: Canvas) {
    drawTopBar(
        c, "宠物",
        "已收集 " + perm.petsOwned.size + " / " + Pets.all.size + " · 宠缘券 " + perm.petTickets,
        "pet_back", null, null
    )
    var y = beginScroll(c, 112f)

    // ---- 召唤入口 ----
    card(c, 18f, y, w - 36f, 92f, r.withAlpha(Palette.GOLD, 200), 16f)
    r.text(c, "宠 物 召 唤", 34f, y + 30f, 16f, Palette.GOLD, true)
    r.text(c, "宠缘券只能看广告获得 · 单抽 " + Pets.COST_SINGLE + " 券 · 十连 " + Pets.COST_TEN + " 券", 34f, y + 52f, 11f, Palette.TEXT_DIM)
    r.text(
        c, "保底 " + perm.petPity + "/" + Pets.PITY_LIMIT + "（满则必出灿烂以上）",
        34f, y + 72f, 10f, Palette.TEXT_FAINT
    )
    button(c, "pet_gacha_open", "前 往 召 唤", w - 146f, y + 24f, 114f, 44f, Palette.GOLD)
    y += 104f

    // ---- 图鉴网格 ----
    val cols = 3
    val gap = 8f
    val cell = (w - 36f - gap * (cols - 1)) / cols
    for (i in Pets.all.indices) {
        val pet = Pets.all[i]
        val owned = perm.petsOwned.contains(pet.id)
        val active = perm.petId == pet.id
        val col = i % cols
        val row = i / cols
        val x = 18f + col * (cell + gap)
        val yy = y + row * (cell + 34f)
        val rc = rarityColor(pet.rarity)
        card(c, x, yy, cell, cell + 26f, if (active) Palette.GOLD else if (owned) rc else Palette.BORDER_SOFT, 14f)
        if (active) r.glowPanel(c, x, yy, cell, cell + 26f, 14f, Palette.GOLD, 60)
        if (owned) {
            drawPortrait(c, pet.avatar, x + cell / 2f, yy + cell * 0.40f, cell * 0.72f, if (active) Palette.GOLD else rc)
            r.text(c, pet.rarity.cn, x + 7f, yy + 16f, 9f, rc, true)
            r.text(c, "Lv." + perm.petLevel(pet.id), x + cell - 7f, yy + 16f, 9f, Palette.CYAN, true, Paint.Align.RIGHT)
            r.text(
                c, pet.name, x + cell / 2f, yy + cell + 9f, 11.5f,
                if (active) Palette.GOLD else Palette.TEXT, true, Paint.Align.CENTER
            )
            hit("pet_pick_" + pet.id, x, yy, cell, cell + 26f)
        } else {
            r.hexFrame(
                c, x + cell / 2f, yy + cell * 0.40f, cell * 0.26f, Palette.BORDER_SOFT,
                r.withAlpha(Palette.PANEL_SOFT, 255)
            )
            r.text(c, "？", x + cell / 2f, yy + cell * 0.46f, 20f, Palette.TEXT_FAINT, true, Paint.Align.CENTER)
            r.text(c, pet.rarity.cn, x + cell / 2f, yy + cell + 2f, 10f, rc, false, Paint.Align.CENTER)
            r.text(c, "未获得", x + cell / 2f, yy + cell + 16f, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        }
    }
    y += ((Pets.all.size + cols - 1) / cols) * (cell + 34f) + 8f

    // ---- 出击宠物 ----
    r.text(c, "出击宠物", 22f, y, 13f, Palette.CYAN, true)
    r.text(c, "点上方宠物可查看详情", w - 22f, y, 10f, Palette.TEXT_FAINT, false, Paint.Align.RIGHT)
    y += 10f
    val cur = Pets.of(perm.petId)
    if (cur == null) {
        card(c, 18f, y, w - 36f, 64f, r.withAlpha(Palette.BORDER_SOFT, 190), 12f)
        r.text(c, "尚未选择出击宠物（点任意已获得宠物可设为出击）", w / 2f, y + 38f, 11.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
        y += 74f
    } else {
        val rc = rarityColor(cur.rarity)
        card(c, 18f, y, w - 36f, 108f, Palette.GOLD, 12f)
        drawPortrait(c, cur.avatar, 66f, y + 54f, 74f, Palette.GOLD)
        r.text(c, cur.name + "   Lv." + perm.petLevel(cur.id), 112f, y + 32f, 15f, Palette.TEXT, true)
        r.text(c, cur.rarity.cn + " · " + cur.role, 112f, y + 52f, 11f, rc)
        r.wrapClamp(c, cur.desc, 112f, y + 72f, w - 152f, 11f, Palette.TEXT_DIM, 15f, 2)
        y += 120f
        ghostButton(c, "pet_off", "取 消 出 击", UiKit.MARGIN, y, contentW(), 42f, Palette.TEXT_DIM)
        y += 52f
    }
    endScroll(c, y)
    ghostButton(c, "pet_back", "返 回", UiKit.MARGIN, h - 74f, contentW(), 46f, Palette.TEXT_DIM)
}

internal fun GameView.tapPet(id: String) {
    when {
        id == "pet_back" -> goScreen(GameView.Screen.HUB)
        id == "pet_off" -> {
            perm.petId = null
            Save.savePerm(context, perm)
            showToast("已取消出击宠物")
        }
        id == "pet_gacha_open" -> {
            petPullResults = emptyList()
            overlay = "pet_gacha"
        }
        id == "pet_gacha_close" -> overlay = ""
        id == "pet_ok" -> overlay = ""
        id == "pet_roll1" -> petPull(1)
        id == "pet_roll10" -> petPull(10)
        id == "pet_ad" -> requestPetTicketAd()
        id == "pet_detail_close" -> overlay = ""
        id.startsWith("pet_deploy_") -> {
            val pid = id.removePrefix("pet_deploy_")
            if (!perm.petsOwned.contains(pid)) return
            perm.petId = pid
            Save.savePerm(context, perm)
            run?.let { com.dshx.game.shidai.game.RunService.recalcAll(it, perm) }
            audio.play("starup")
            audio.play(Pets.cry(pid))
            showToast("出击宠物：" + (Pets.of(pid)?.name ?: ""))
            overlay = ""
        }
        id.startsWith("pet_pick_") -> {
            val pid = id.removePrefix("pet_pick_")
            val pet = Pets.of(pid) ?: return
            if (!perm.petsOwned.contains(pid)) {
                audio.play("error")
                showToast("尚未获得「" + pet.name + "」，可在宠物召唤中获得")
                return
            }
            petDetailId = pid
            overlay = "pet_detail"
        }
    }
}

/** 抽卡：先扣券，再抽，最后把结果交给结果弹层。 */
internal fun GameView.petPull(times: Int) {
    val ten = times >= 10
    val cost = if (ten) Pets.COST_TEN else Pets.COST_SINGLE
    if (perm.petTickets < cost) {
        audio.play("error")
        showToast("宠缘券不足（当前 " + perm.petTickets + "）：看广告可获得宠缘券")
        return
    }
    perm.petTickets -= cost
    petPullResults = Pets.pull(perm, if (ten) 10 else 1)
    Save.savePerm(context, perm)
    audio.play("draw")
    if (petPullResults.any { it.isNew && it.pet.rarity.rank >= Rarity.LEGENDARY.rank }) audio.play("unlock")
    overlay = "pet_result"
}

/**
 * 看广告得宠缘券。
 * 广告尚未接入：接口已就绪，接入后把实现注入 RewardAds.install 即可，
 * 这里一行都不用改；未接入时给明确提示与替代途径，不会「点了没反应」。
 */
internal fun GameView.requestPetTicketAd() {
    if (!RewardAds.isReady()) {
        audio.play("error")
        showToast("广告接入中：接进来后这里每次发放 1 张宠缘券")
        return
    }
    // 统一走 requestAd：加载浮层、主线程回调、失败提示都在里面。
    // 旧实现直接调 RewardAds.request，点下去屏幕上没有任何反馈，
    // 而且回调不在主线程 —— 玩家会以为按钮坏了。
    requestAd(RewardAds.PLACEMENT_PET_TICKET) { grantPetTicketReward() }
}

/** 看完广告后的发奖：把实现换成真实 SDK 时这里不用改。 */
private fun GameView.grantPetTicketReward() {
    perm.petTickets += 1
    Save.savePerm(context, perm)
    audio.play("unlock")
    showToast("获得宠缘券 ×1（当前 " + perm.petTickets + "）")
}

/** 宠物详情预览：立绘 + 稀有度 + 等级 + 队伍加成 + 助战效果。 */
internal fun GameView.drawPetDetailOverlay(c: Canvas) {
    val pet = Pets.of(petDetailId) ?: return
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 232))
    hit("modal_block", 0f, 0f, w, h)
    val top = h * 0.10f
    val boxH = h * 0.78f
    val rc = rarityColor(pet.rarity)
    card(c, 22f, top, w - 44f, boxH, rc, 20f)

    val lv = perm.petLevel(pet.id)
    val lm = Pets.levelMul(lv)
    val psize = (boxH * 0.24f).coerceIn(84f, 148f)
    var y = top + 24f + psize / 2f
    drawPortrait(c, pet.avatar, w / 2f, y, psize, rc)
    y += psize / 2f + 26f
    r.text(c, pet.name, w / 2f, y, 21f, Palette.TEXT, true, Paint.Align.CENTER)
    y += 22f
    r.text(c, pet.rarity.cn + " · Lv." + lv + " · " + pet.role, w / 2f, y, 12f, rc, true, Paint.Align.CENTER)
    y += 18f
    r.text(c, "每升 1 级加成 +8%（重复获得可升级）", w / 2f, y, 9.5f, Palette.TEXT_FAINT, false, Paint.Align.CENTER)
    y += 24f

    // 队伍加成
    if (pet.statMod.isNotEmpty() || pet.flatMod.isNotEmpty()) {
        r.text(c, "队伍加成", 42f, y, 12.5f, Palette.CYAN, true)
        y += 20f
        for ((k, v) in pet.statMod) {
            r.text(c, petStatLabel(k), 52f, y, 11.5f, Palette.TEXT_DIM)
            r.text(c, "+" + (v * lm * 100).roundToInt() + "%", w - 52f, y, 11.5f, Palette.GOLD, true, Paint.Align.RIGHT)
            y += 18f
        }
        for ((k, v) in pet.flatMod) {
            r.text(c, petStatLabel(k), 52f, y, 11.5f, Palette.TEXT_DIM)
            r.text(c, "+" + (v * lm).roundToInt(), w - 52f, y, 11.5f, Palette.GOLD, true, Paint.Align.RIGHT)
            y += 18f
        }
        y += 6f
    }

    // 助战效果
    r.text(c, "助战效果", 42f, y, 12.5f, Palette.CYAN, true)
    y += 20f
    val bodyMax = ((top + boxH - 128f - y) / (17f * r.fontScale)).toInt().coerceIn(1, 4)
    y = r.wrapClamp(c, pet.desc, 52f, y, w - 104f, 11.5f, Palette.TEXT_DIM, 17f, bodyMax)

    val deployed = perm.petId == pet.id
    if (deployed) {
        ghostButton(c, "pet_off", "取 消 出 击", 40f, top + boxH - 104f, w - 80f, 44f, Palette.TEXT_DIM)
    } else {
        button(c, "pet_deploy_" + pet.id, "设 为 出 击", 40f, top + boxH - 104f, w - 80f, 44f, Palette.PINK)
    }
    ghostButton(c, "pet_detail_close", "关 闭", 40f, top + boxH - 54f, w - 80f, 44f, Palette.CYAN)
}

/** 召唤弹层：券数、概率公示、保底进度、单抽 / 十连 / 看广告得券。 */
internal fun GameView.drawPetGachaOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 238))
    hit("modal_block", 0f, 0f, w, h)
    val top = h * 0.11f
    val boxH = h * 0.78f
    card(c, 20f, top, w - 40f, boxH, r.withAlpha(Palette.GOLD, 210), 20f)

    r.text(c, "宠 物 召 唤", w / 2f, top + 42f, 21f, Palette.GOLD, true, Paint.Align.CENTER)
    r.text(c, "常驻池 · 全 " + Pets.all.size + " 只宠物", w / 2f, top + 64f, 11.5f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    r.text(
        c, "宠缘券：" + perm.petTickets, w / 2f, top + 94f, 14f,
        if (perm.petTickets > 0) Palette.CYAN else Palette.RED, true, Paint.Align.CENTER
    )

    var y = top + 122f
    r.text(c, "概率公示", 42f, y, 12.5f, Palette.TEXT, true)
    y += 22f
    for (rr in listOf(Rarity.MYTHIC, Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON)) {
        val cnt = Pets.all.count { it.rarity == rr }
        r.text(c, rr.cn + "（" + cnt + " 只）", 52f, y, 11.5f, rarityColor(rr))
        r.text(
            c, String.format("%.1f%%", Pets.rarityChance(rr)), w - 52f, y, 11.5f,
            Palette.TEXT_DIM, false, Paint.Align.RIGHT
        )
        y += 19f
    }
    y += 4f
    r.text(c, "保底：连续 " + Pets.PITY_LIMIT + " 抽必得「灿烂」以上", 52f, y, 11f, Palette.TEXT_DIM)
    y += 18f
    r.text(c, "当前进度 " + perm.petPity + " / " + Pets.PITY_LIMIT, 52f, y, 11f, Palette.TEXT_FAINT)
    y += 18f
    r.text(c, "重复获得：该宠物等级 +1（满级折算星尘）", 52f, y, 11f, Palette.TEXT_FAINT)

    val btnTop = top + boxH - 224f
    // 宠缘券的唯一来源就是广告，所以把它放第一位并做成主按钮
    button(c, "pet_ad", if (RewardAds.isReady()) "看广告得 1 券" else "看广告得券（接入中）", 40f, btnTop, w - 80f, 48f, Palette.CYAN)
    button(c, "pet_roll1", "单 抽（" + Pets.COST_SINGLE + " 券）", 40f, btnTop + 56f, w - 80f, 48f, Palette.PINK)
    button(c, "pet_roll10", "十 连（" + Pets.COST_TEN + " 券）", 40f, btnTop + 112f, w - 80f, 48f, Palette.GOLD)
    ghostButton(c, "pet_gacha_close", "关 闭", 40f, btnTop + 168f, w - 80f, 44f, Palette.TEXT_DIM)
}

/** 召唤结果弹层：单抽大图 / 十连网格。 */
internal fun GameView.drawPetResultOverlay(c: Canvas) {
    r.solid(c, 0f, 0f, w, h, 0f, r.withAlpha(0xFF06030F.toInt(), 238))
    hit("modal_block", 0f, 0f, w, h)
    val top = h * 0.10f
    val boxH = h * 0.78f
    card(c, 20f, top, w - 40f, boxH, r.withAlpha(Palette.GOLD, 210), 20f)
    r.text(c, "召 唤 结 果", w / 2f, top + 40f, 20f, Palette.GOLD, true, Paint.Align.CENTER)

    val list = petPullResults
    if (list.isEmpty()) {
        r.text(c, "没有结果", w / 2f, top + boxH / 2f, 14f, Palette.TEXT_DIM, false, Paint.Align.CENTER)
    } else if (list.size == 1) {
        val res = list[0]
        val rc = rarityColor(res.pet.rarity)
        drawPortrait(c, res.pet.avatar, w / 2f, top + boxH * 0.38f, 168f, rc)
        r.text(c, res.pet.name, w / 2f, top + boxH * 0.62f, 22f, Palette.TEXT, true, Paint.Align.CENTER)
        r.text(c, res.pet.rarity.cn + " · " + res.pet.role, w / 2f, top + boxH * 0.62f + 24f, 12f, rc, true, Paint.Align.CENTER)
        val tag = when {
            res.isNew -> "初次获得！已加入图鉴"
            res.levelUp -> "重复获得：等级 +1（Lv." + perm.petLevel(res.pet.id) + "）"
            res.maxed -> "已满级：折算星尘 +" + res.dust
            else -> ""
        }
        r.text(c, tag, w / 2f, top + boxH * 0.62f + 48f, 12f, Palette.CYAN, false, Paint.Align.CENTER)
    } else {
        val cols = 5
        val gap = 6f
        val cw = (w - 40f - 28f - gap * (cols - 1)) / cols
        val ch = cw + 34f
        val gridTop = top + 62f
        for (i in list.indices) {
            val res = list[i]
            val col = i % cols
            val row = i / cols
            val x = 34f + col * (cw + gap)
            val yy = gridTop + row * (ch + 6f)
            val rc = rarityColor(res.pet.rarity)
            card(c, x, yy, cw, ch, rc, 10f)
            drawPortrait(c, res.pet.avatar, x + cw / 2f, yy + cw * 0.42f, cw * 0.7f, rc)
            r.text(c, res.pet.name, x + cw / 2f, yy + cw + 8f, 9f, Palette.TEXT, false, Paint.Align.CENTER)
            val tag = when {
                res.isNew -> "NEW"
                res.levelUp -> "Lv+" + perm.petLevel(res.pet.id)
                res.maxed -> "星尘" + res.dust
                else -> ""
            }
            r.text(c, tag, x + cw / 2f, yy + cw + 22f, 8.5f, if (res.isNew) Palette.GOLD else Palette.CYAN, false, Paint.Align.CENTER)
        }
    }

    button(c, "pet_ok", "确 定", 44f, top + boxH - 66f, w - 88f, 50f, Palette.CYAN)
}
