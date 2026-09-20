package com.kaiju.awaken.game

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.random.Random

object TowerService {

    // ------------------------------------------------------------ 楼层生成

    fun generateFloor(run: RunState) {
        val f = run.floor
        val total = min(10, 6 + (f - 1) / 5)
        val mid = max(2, total - 1)
        val slots = ArrayList<FloorEvent>()

        slots.add(FloorEvent(if (f % 2 == 1) "tavern" else "shop"))

        val remaining = max(1, mid - 1)
        var combatCount = max(1, min(remaining - 1, (remaining * 0.5 + 0.5).roundToInt()))
        if (remaining <= 1) combatCount = 0
        val eventCount = remaining - combatCount

        val eliteChance = min(0.5, 0.1 + f * 0.02)
        val combatSlots = ArrayList<FloorEvent>()
        for (i in 0 until combatCount) {
            val isElite = Random.nextDouble() < eliteChance
            combatSlots.add(FloorEvent(if (isElite) "combat_elite" else "combat_normal"))
        }
        val eventSlots = ArrayList<FloorEvent>()
        for (i in 0 until eventCount) {
            val ev = pickEvent(f)
            eventSlots.add(FloorEvent("event", ev))
        }
        // 交错排列，避免同类连排
        val merged = ArrayList<FloorEvent>()
        var ci = 0
        var ei = 0
        var lastKind = ""
        while (ci < combatSlots.size || ei < eventSlots.size) {
            val preferCombat = if (ci >= combatSlots.size) false
            else if (ei >= eventSlots.size) true
            else Random.nextDouble() < 0.5
            var pick: FloorEvent
            if (preferCombat && lastKind != "combat") {
                pick = combatSlots[ci]; ci++
                lastKind = "combat"
            } else if (ei < eventSlots.size && lastKind != "event") {
                pick = eventSlots[ei]; ei++
                lastKind = "event"
            } else if (ci < combatSlots.size) {
                pick = combatSlots[ci]; ci++
                lastKind = "combat"
            } else {
                pick = eventSlots[ei]; ei++
                lastKind = "event"
            }
            merged.add(pick)
        }
        slots.addAll(merged)
        slots.add(FloorEvent("boss"))

        run.floorEvents = slots
        run.eventIdx = 0
    }

    private fun pickEvent(f: Int): GameEvent {
        val pool = Content.events.filter { it.minFloor <= f }
        if (pool.isEmpty()) return Content.events[0]
        var total = 0
        for (e in pool) total += e.weight
        var r = Random.nextInt(max(1, total))
        for (e in pool) {
            r -= e.weight
            if (r < 0) return e
        }
        return pool.last()
    }

    fun currentEvent(run: RunState): FloorEvent? = run.floorEvents.getOrNull(run.eventIdx)

    fun isFloorClear(run: RunState): Boolean = run.eventIdx >= run.floorEvents.size

    /** 进入下一层：回血回能、生成新楼层。 */
    fun advanceFloor(run: RunState, perm: PermState) {
        run.floor++
        for (u in run.party) {
            u.alive = true
            u.heal(u.stats.maxHp * 0.18)
            u.energy = min(u.stats.energyMax, u.energy + u.stats.energyMax * 0.35)
            u.buffs.clear()
            u.cooldowns.clear()
        }
        run.nextBattleBonus.clear()
        generateFloor(run)
        // 每 5 层额外觉醒
        if (run.floor % 5 == 0) run.waitingFloorTalent = true
    }

    // ------------------------------------------------------------ 事件结算

    fun resolveChoice(run: RunState, perm: PermState, choice: EventChoice): String {
        val f = run.floor
        var msg = ""
        fun gold(n: Int) {
            if (run.gold >= n) run.gold -= n else msg += "金币不足，未能支付。"
        }
        fun canPay(n: Int): Boolean = run.gold >= n

        when (choice.kind) {
            "none" -> msg = "你选择了离开。"
            "buy_equip" -> {
                if (!canPay(choice.gold)) return "金币不足，商人摇了摇头。"
                gold(choice.gold)
                val e = generateEquip(f, null)
                addEquip(run, e)
                msg = "获得装备【${e.name}】（${e.rarity.cn}）"
            }
            "buff_dmg" -> {
                if (choice.gold > 0) {
                    if (!canPay(choice.gold)) return "金币不足。"
                    gold(choice.gold)
                }
                run.nextBattleBonus["dmg"] = (run.nextBattleBonus["dmg"] ?: 0.0) + choice.amount
                msg = "下一场战斗伤害 +${(choice.amount * 100).roundToInt()}%"
            }
            "buff_atk" -> {
                if (choice.gold > 0) {
                    if (!canPay(choice.gold)) return "金币不足。"
                    gold(choice.gold)
                }
                run.nextBattleBonus["dmg"] = (run.nextBattleBonus["dmg"] ?: 0.0) + choice.amount
                msg = "下一场战斗伤害提升。"
            }
            "enhance" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                val e = run.equipped[choice.key]
                if (e == null) return "你没有可强化的该部位装备。"
                if (e.enhance >= Content.enhanceMax(perm)) return "${e.name} 已达强化上限。"
                gold(choice.gold)
                e.enhance++
                RunService.recalcAll(run, perm)
                msg = "${e.name} 强化至 +${e.enhance}"
            }
            "enhance_random" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                val list = run.equipped.values.toList()
                if (list.isEmpty()) return "你没有可强化的装备。"
                gold(choice.gold)
                val e = list.random()
                val step = choice.amount.roundToInt().coerceAtLeast(1)
                e.enhance = min(Content.enhanceMax(perm), e.enhance + step)
                RunService.recalcAll(run, perm)
                msg = "${e.name} 强化至 +${e.enhance}"
            }
            "enchant" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                val e = run.equipped[choice.key] ?: return "你没有该部位装备。"
                gold(choice.gold)
                e.affixes.add(randomAffix(f, e.rarity, false))
                RunService.recalcAll(run, perm)
                msg = "${e.name} 获得新词缀。"
            }
            "enchant_random" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                val list = run.equipped.values.toList()
                if (list.isEmpty()) return "你没有可附魔的装备。"
                gold(choice.gold)
                val e = list.random()
                e.affixes.add(randomAffix(f, e.rarity, false))
                RunService.recalcAll(run, perm)
                msg = "${e.name} 获得新词缀。"
            }
            "shrine_pray" -> {
                if (Random.nextDouble() < 0.6) {
                    run.nextBattleBonus["dmg"] = (run.nextBattleBonus["dmg"] ?: 0.0) + 0.15
                    msg = "神龛回应了你：下一场战斗伤害 +15%。"
                } else {
                    run.permBonus["maxHpPct"] = (run.permBonus["maxHpPct"] ?: 0.0) - 0.10
                    RunService.recalcAll(run, perm)
                    msg = "神龛沉默，你的最大生命 -10%。"
                }
            }
            "heal_all" -> {
                if (choice.gold > 0) {
                    if (!canPay(choice.gold)) return "金币不足。"
                    gold(choice.gold)
                }
                for (u in run.party) { u.alive = true; u.heal(u.stats.maxHp * choice.amount) }
                msg = "全队恢复 ${(choice.amount * 100).roundToInt()}% 生命。"
            }
            "full_restore" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                gold(choice.gold)
                for (u in run.party) {
                    u.alive = true
                    u.hp = u.stats.maxHp
                    u.energy = u.stats.energyMax
                }
                msg = "全队满血满能量。"
            }
            "energy_all" -> {
                for (u in run.party) u.energy = u.stats.energyMax
                msg = "全队能量回满。"
            }
            "get_item" -> {
                val n = max(1, choice.amount.roundToInt())
                run.items[choice.key] = (run.items[choice.key] ?: 0) + n
                msg = "获得 ${Content.itemById[choice.key]?.name ?: choice.key} ×$n"
            }
            "get_random_item" -> {
                val n = max(1, choice.amount.roundToInt())
                val got = ArrayList<String>()
                for (i in 0 until n) {
                    val it = Content.items.random()
                    run.items[it.id] = (run.items[it.id] ?: 0) + 1
                    got.add(it.name)
                }
                msg = "获得道具：" + got.joinToString("、")
            }
            "gold_fixed" -> {
                val n = choice.amount.roundToInt()
                run.gold += n
                msg = "获得 $n 金币。"
            }
            "gold_random" -> {
                val base = choice.amount.roundToInt()
                val n = base + Random.nextInt(0, max(1, (base * 0.5).roundToInt() + 1))
                run.gold += n
                msg = "获得 $n 金币。"
            }
            "gamble" -> {
                if (!canPay(choice.gold)) return "金币不足。"
                if (Random.nextDouble() < 0.5) {
                    run.gold += choice.gold
                    msg = "赌赢了！获得 ${choice.gold} 金币。"
                } else {
                    gold(choice.gold)
                    msg = "赌输了，失去 ${choice.gold} 金币。"
                }
            }
            "train_atk" -> {
                run.permBonus["atk"] = (run.permBonus["atk"] ?: 0.0) + choice.amount
                run.permBonus["matk"] = (run.permBonus["matk"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "攻击与法强永久 +${choice.amount.roundToInt()}。"
            }
            "train_def" -> {
                run.permBonus["def"] = (run.permBonus["def"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "防御永久 +${choice.amount.roundToInt()}。"
            }
            "train_hp" -> {
                run.permBonus["maxHp"] = (run.permBonus["maxHp"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "最大生命永久 +${choice.amount.roundToInt()}。"
            }
            "train_matk" -> {
                run.permBonus["matk"] = (run.permBonus["matk"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "法强永久 +${choice.amount.roundToInt()}。"
            }
            "train_all" -> {
                run.permBonus["atkPct"] = (run.permBonus["atkPct"] ?: 0.0) + choice.amount
                run.permBonus["matkPct"] = (run.permBonus["matkPct"] ?: 0.0) + choice.amount
                run.permBonus["maxHpPct"] = (run.permBonus["maxHpPct"] ?: 0.0) + choice.amount
                run.permBonus["defPct"] = (run.permBonus["defPct"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "全属性提升 ${(choice.amount * 100).roundToInt()}%。"
            }
            "buff_hp" -> {
                run.permBonus["maxHpPct"] = (run.permBonus["maxHpPct"] ?: 0.0) + choice.amount
                RunService.recalcAll(run, perm)
                msg = "全队最大生命 +${(choice.amount * 100).roundToInt()}%。"
            }
            "rest" -> {
                for (u in run.party) {
                    u.alive = true
                    u.heal(u.stats.maxHp * 0.35)
                    u.energy = u.stats.energyMax
                }
                msg = "全队恢复 35% 生命并回满能量。"
            }
            "skill_point" -> {
                val n = max(1, choice.amount.roundToInt())
                run.skillPoints += n
                msg = "获得 $n 点技能点。"
            }
            "skill_gold" -> {
                run.skillPoints += 1
                run.gold += 30
                msg = "获得 1 技能点与 30 金币。"
            }
            "fragment_stats" -> {
                run.permBonus["atk"] = (run.permBonus["atk"] ?: 0.0) + 10
                run.permBonus["matk"] = (run.permBonus["matk"] ?: 0.0) + 10
                run.permBonus["def"] = (run.permBonus["def"] ?: 0.0) + 6
                run.permBonus["maxHp"] = (run.permBonus["maxHp"] ?: 0.0) + 50
                RunService.recalcAll(run, perm)
                msg = "攻击/法强 +10，防御 +6，生命 +50。"
            }
            "fragment_exp" -> {
                val amount = 40 + f * 12
                RunService.grantExp(run, perm, amount)
                msg = "获得 $amount 点经验。"
            }
            "loot_random" -> {
                val e = generateEquip(f, null)
                addEquip(run, e)
                run.gold += 20 + Random.nextInt(0, 16)
                msg = "获得【${e.name}】与一些金币。"
            }
            "loot_epic" -> {
                val e = generateEquip(f, Rarity.EPIC)
                addEquip(run, e)
                msg = "获得紫装【${e.name}】"
            }
            "loot_legendary" -> {
                val e = generateEquip(f, Rarity.LEGENDARY)
                e.affixes.add(Content.mechanicAffixes.random())
                addEquip(run, e)
                msg = "获得橙装【${e.name}】"
            }
            "loot_relic" -> {
                val e = generateEquip(f, Rarity.RARE)
                addEquip(run, e)
                run.permBonus["maxHpPct"] = (run.permBonus["maxHpPct"] ?: 0.0) - 0.10
                RunService.recalcAll(run, perm)
                msg = "获得【${e.name}】，最大生命 -10%。"
            }
            "bounty_elite" -> {
                run.nextBattleBonus["bounty"] = 1.0
                msg = "下一场战斗将变为精英战，奖励提升。"
            }
            "bounty_intel" -> {
                run.nextBattleBonus["dmg"] = (run.nextBattleBonus["dmg"] ?: 0.0) + 0.25
                msg = "下一场战斗伤害 +25%。"
            }
            "mourn" -> {
                for (u in run.party) { u.alive = true; u.heal(u.stats.maxHp * 0.40) }
                run.gold += 30
                msg = "全队恢复 40% 生命，获得 30 金币。"
            }
            "time_rift" -> {
                run.gold += 90
                val e = generateEquip(f, Rarity.EPIC)
                addEquip(run, e)
                msg = "获得 90 金币与紫装【${e.name}】"
            }
            else -> msg = "什么也没有发生。"
        }
        return msg
    }

    fun addEquip(run: RunState, e: Equip) {
        val cur = run.equipped[e.slot]
        if (cur == null) {
            run.equipped[e.slot] = e
        } else {
            run.bag.add(e)
        }
    }

    // ------------------------------------------------------------ 装备生成

    fun generateEquip(floorNum: Int, force: Rarity?): Equip {
        val slotDef = Content.slots.random()
        val rarity = force ?: rollRarity(floorNum)
        val scale = (1.0 + floorNum * 0.16) * (Content.equipRarityMul[rarity] ?: 1.0)
        val e = Equip()
        e.slot = slotDef.id
        e.rarity = rarity
        e.level = floorNum
        e.mainKey = slotDef.mainKey
        e.mainValue = (slotDef.mainMin + Random.nextDouble() * (slotDef.mainMax - slotDef.mainMin)) * scale
        e.name = Content.namePrefix.random() + (Content.nameSuffix[slotDef.id]?.random() ?: "装备")
        val slots = Content.equipRarityAffix[rarity] ?: 0
        val pool = Content.affixPool.shuffled(Random)
        for (i in 0 until min(slots, pool.size)) {
            e.affixes.add(randomAffix(floorNum, rarity, false, pool[i].key))
        }
        if (slots > 0 && Random.nextDouble() < 0.42) {
            e.affixes.add(Content.mechanicAffixes.random())
        }
        if (rarity.rank >= 3 && Random.nextDouble() < 0.5) {
            e.setId = Content.sets.random().id
        }
        return e
    }

    private fun rollRarity(f: Int): Rarity {
        val r = Random.nextInt(100)
        return when {
            f >= 8 && r < 5 -> Rarity.MYTHIC
            f >= 5 && r < 15 -> Rarity.LEGENDARY
            f >= 3 && r < 35 -> Rarity.EPIC
            r < 60 -> Rarity.RARE
            else -> Rarity.COMMON
        }
    }

    private fun randomAffix(f: Int, rarity: Rarity, mechanic: Boolean, key: String? = null): Affix {
        if (mechanic) return Content.mechanicAffixes.random()
        val base = Content.affixPool.firstOrNull { it.key == key } ?: Content.affixPool.random()
        val mul = when (rarity) {
            Rarity.RARE -> 1.2; Rarity.EPIC -> 1.5; Rarity.LEGENDARY -> 2.0
            Rarity.MYTHIC -> 2.2; Rarity.HIDDEN -> 2.4; else -> 1.0
        }
        val v = when (base.key) {
            "crit", "critDmg", "dodge" -> (2.0 + Random.nextDouble() * 4.0) * mul
            "lifesteal" -> (2.0 + Random.nextDouble() * 3.0) * mul
            "energyRegen" -> (1.0 + Random.nextDouble() * 3.0) * mul
            "hpRegen" -> (4.0 + Random.nextDouble() * 10.0) * mul * (1 + f * 0.1)
            "maxHp" -> (14.0 + Random.nextDouble() * 22.0) * mul * (1 + f * 0.16)
            "def" -> (2.0 + Random.nextDouble() * 4.0) * mul * (1 + f * 0.12)
            else -> (4.0 + Random.nextDouble() * 7.0) * mul * (1 + f * 0.14)
        }
        return Affix(base.key, base.label, v)
    }

    // ------------------------------------------------------------ 战斗奖励

    class Rewards(
        var gold: Int = 0,
        var exp: Int = 0,
        var equip: Equip? = null,
        var items: MutableList<String> = ArrayList(),
        var notes: MutableList<String> = ArrayList()
    )

    fun grantBattleRewards(run: RunState, perm: PermState, b: Battle): Rewards {
        val r = Rewards()
        val f = b.floor
        var goldBase = when (b.kind) {
            "boss" -> 70; "elite" -> 34; else -> 12
        }
        goldBase = (goldBase * (1.0 + f * 0.06)).roundToInt()
        var gold = (goldBase * (0.85 + Random.nextDouble() * 0.3)).roundToInt()
        if (b.kind == "boss") gold += 30
        var exp = when (b.kind) {
            "boss" -> 30 + f * 6
            "elite" -> 15 + f * 3
            else -> 10 + f * 2
        }
        var dropChance = when (b.kind) {
            "boss" -> 1.0; "elite" -> 0.6; else -> 0.3
        }
        if (run.nextBattleBonus.containsKey("bounty") && b.kind == "elite") {
            gold += 90
            r.notes.add("悬赏达成：额外 +90 金币")
        }
        // 天赋金币/经验加成
        if (run.grid.slots.any { it?.passive == "gold_find" }) gold = (gold * 1.2).roundToInt()
        if (run.grid.slots.any { it?.passive == "xp_up" }) exp = (exp * 1.2).roundToInt()

        if (b.timedOut) {
            gold = gold / 2
            exp = exp / 2
            dropChance *= 0.5
            r.notes.add("回合耗尽：奖励减半")
        }

        run.gold += gold
        r.gold = gold
        r.exp = exp
        RunService.grantExp(run, perm, exp)

        if (Random.nextDouble() < dropChance) {
            val e = generateEquip(f, null)
            addEquip(run, e)
            r.equip = e
        }
        // 道具掉落
        var itemChance = when (b.kind) {
            "boss" -> 0.7; "elite" -> 0.45; else -> 0.25
        }
        if (run.grid.slots.any { it?.passive == "item_magnet" }) itemChance += 0.15
        if (Random.nextDouble() < itemChance) {
            var total = 0
            for (it in Content.items) total += it.weight
            var roll = Random.nextInt(max(1, total))
            for (it in Content.items) {
                roll -= it.weight
                if (roll < 0) {
                    run.items[it.id] = (run.items[it.id] ?: 0) + 1
                    r.items.add(it.name)
                    break
                }
            }
        }
        run.nextBattleBonus.clear()
        return r
    }

    // ------------------------------------------------------------ 商店 / 酒馆

    fun shopItems(): List<ItemDef> = Content.items.shuffled(Random).take(4)

    fun tavernCandidates(floorNum: Int): List<Unit> {
        val n = 2 + Random.nextInt(0, 2)
        val out = ArrayList<Unit>()
        val names = listOf("琳", "凯尔", "希尔", "诺亚", "薇拉", "雷恩", "艾可", "奥菲", "凛", "塞西尔")
        for (i in 0 until n) {
            val cls = Data.classes.random()
            val rarity = when {
                floorNum >= 30 && Random.nextDouble() < 0.25 -> Rarity.EPIC
                Random.nextDouble() < 0.5 -> Rarity.RARE
                else -> Rarity.COMMON
            }
            out.add(RunService.makeMercenary(cls.id, max(1, floorNum / 3), rarity, names.random()))
        }
        return out
    }

    fun mercenaryCost(u: Unit): Int = (40 + u.level * 8) * u.rarity.rank

    fun sellEquip(run: RunState, e: Equip) {
        run.bag.remove(e)
        run.gold += e.sellValue
    }

    fun recruit(run: RunState, u: Unit): Boolean {
        if (run.party.size >= 3) return false
        val cost = mercenaryCost(u)
        if (run.gold < cost) return false
        run.gold -= cost
        run.party.add(u)
        return true
    }

    fun floorScale(n: Int): Double {
        val k = n / 5.0 + 1.0
        return (k * (k + 1.0)) / 2.0
    }

    fun battleExpForFloor(f: Int, kind: String): Int = when (kind) {
        "boss" -> 30 + f * 6
        "elite" -> 15 + f * 3
        else -> 10 + f * 2
    }

    fun equipPower(e: Equip): Double = e.mainValue * e.enhanceMul + e.affixes.sumOf { it.value }

    fun bestInBagFor(run: RunState, slot: String): Equip? =
        run.bag.filter { it.slot == slot }.maxByOrNull { equipPower(it) }

    fun autoEquipUpgrades(run: RunState, perm: PermState) {
        var guard = 0
        while (guard < 30) {
            guard++
            var swapped = false
            for (e in ArrayList(run.bag)) {
                val cur = run.equipped[e.slot]
                if (cur == null || equipPower(e) > equipPower(cur)) {
                    run.bag.remove(e)
                    if (cur != null) run.bag.add(cur)
                    run.equipped[e.slot] = e
                    swapped = true
                    break
                }
            }
            if (!swapped) break
        }
        RunService.recalcAll(run, perm)
    }

    fun floorLabel(f: Int): String = "第 $f 层"

    fun floorBonusLabel(f: Int): String {
        val parts = ArrayList<String>()
        if (f % 5 == 0) parts.add("楼层觉醒")
        if (f % 10 == 0) parts.add("守塔剧情")
        return parts.joinToString(" · ")
    }

    fun progress(run: RunState): Float {
        val end = run.mode.endFloor
        if (end <= 0) return (run.floor % 100) / 100f
        return (run.floor.toFloat() / end.toFloat()).coerceIn(0f, 1f)
    }

    fun floorOf(perm: PermState, mode: GameMode): Int = perm.modeBest[mode.id] ?: 0

    fun updateBest(perm: PermState, run: RunState) {
        val cur = perm.modeBest[run.mode.id] ?: 0
        if (run.floor > cur) perm.modeBest[run.mode.id] = run.floor
        if (run.floor > perm.bestFloor) perm.bestFloor = run.floor
        val cb = perm.classBest[run.classId] ?: 0
        if (run.floor > cb) perm.classBest[run.classId] = run.floor
    }

    fun isComplete(run: RunState): Boolean {
        val end = run.mode.endFloor
        return end > 0 && run.floor > end
    }

    fun goldNeeded(e: Equip, perm: PermState): Int = 60 + e.enhance * 35
}
