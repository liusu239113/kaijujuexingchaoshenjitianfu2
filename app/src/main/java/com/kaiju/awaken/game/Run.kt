package com.kaiju.awaken.game

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

// ---------------------------------------------------------------- 战技等级规则
// 集中在这里，避免「结算层」和「面板层」各写一套导致数值对不上。

/** 战技等级上限。 */
const val SKILL_LV_MAX = 3

/** 等级收敛到 1..3。 */
fun skillLvOf(lv: Int): Int = lv.coerceIn(1, SKILL_LV_MAX)

/**
 * 战技等级系数：Lv.1 = x1.00，每级 +12%。
 * 伤害 / 治疗 / 护盾 / 增益数值 / 持续伤害系数全部共用它。
 */
fun skillLvMul(lv: Int): Double = 1.0 + 0.12 * (skillLvOf(lv) - 1)

/** 实际段数：多段战技满级（Lv.3）追加一段，单段战技不变。 */
fun skillHits(baseHits: Int, lv: Int): Int =
    baseHits + if (skillLvOf(lv) >= SKILL_LV_MAX && baseHits >= 2) 1 else 0

class PermState {
    var talentPoints = 0
    var bestFloor = 0
    var climbMaxUnlocked = 1
    var climbBest = 0
    /** 星尘：长期解锁货币 */
    var dust = 0
    var dustTotal = 0
    /** 已解锁内容（class:xxx / pool:xxx） */
    val unlocked = HashSet<String>()
    /** 成就进度 */
    val achProgress = HashMap<String, Int>()
    /** 累计统计 */
    val stats = HashMap<String, Int>()
    /** 图鉴已见条目 */
    val codexSeen = HashSet<String>()
    /** 已通关的模式 */
    val clearedModes = HashSet<String>()
    val classPlayed = HashSet<String>()
    val classCleared = HashSet<String>()
    var settingsVibration = true
    var settingsAutoBattle = false
    var settingsManualTarget = true
    var settingsFontScale = 100
    var settingsColorBlind = false
    var settingsBattleSpeed = 1
    /** 已拥有的宠物 */
    val petsOwned = HashSet<String>()
    /** 当前出战宠物 */
    var petId: String? = null
    /** 角色名：创角时写入并永久保留，轮回后不必重新命名 */
    var playerName = ""
    /** 上次编成的职阶与试炼强度：前厅角色卡与编成页的默认值 */
    var lastClass = "warrior"
    var lastMode = "normal"
    /** 主线进度 */
    var storyIndex = 0
    val chapterClaimed = HashSet<String>()
    var settingsFontSize = 1
    var totalRuns = 0
    var pity = 0
    var musicOn = true
    var musicVolume = 70
    var sfxOn = true
    var seenIntro = false
    val growthLevels = HashMap<String, Int>()
    val modeBest = HashMap<String, Int>()
    val classBest = HashMap<String, Int>()

    fun growthLevel(id: String): Int = growthLevels[id] ?: 0
}

/** 楼层中的一个事件槽。 */
class FloorEvent(
    var kind: String,
    var event: GameEvent? = null,
    var resolved: Boolean = false,
    var result: String = "",
    var enemyName: String = "",
    var level: Int = 1
)

class RunState {
    var mode: GameMode = GameMode.NORMAL
    var classId: String = "warrior"
    var floor = 1
    var gold = 50
    var level = 1
    var exp = 0
    var skillPoints = 0
    /** 战技等级（skillId -> 1..3），战技点消耗的落点 */
    val skillLevels = HashMap<String, Int>()
    var alive = true

    val party = ArrayList<Unit>()
    val items = HashMap<String, Int>()
    val equipped = HashMap<String, Equip>()
    val bag = ArrayList<Equip>()
    val grid = TalentGrid()

    /** 本轮内永久面板加成（操练场、事件等）。 */
    val permBonus = HashMap<String, Double>()
    /** 仅下一场遭遇战生效的加成。 */
    val nextBattleBonus = HashMap<String, Double>()

    var climbLevel = 1
    var phoenixUsed = false
    var adReviveUsed = false
    var pityCounter = 0
    var draftExtraOption = false
    var ascensionCount = 0
    var bonusTalentPick = false
    var pendingTalentPick = false
    /** 0 = 无，1 = 一转待选，2 = 二转待选 */
    var pendingPromotion = 0
    var promotionId: String? = null
    var tier2Id: String? = null

    var floorEvents = ArrayList<FloorEvent>()
    var eventIdx = 0
    var waitingFloorTalent = false
    var runOver = false

    fun hero(): Unit = party.first()

    fun expToNext(): Int = 20 + level * 10

    fun talentPointValue(): Int {
        var base = 0
        for (i in 1..floor) base += min(10, (i - 1) / 5 + 1)
        val mult = when (mode) {
            GameMode.CLIMB -> 2.0 + 0.1 * climbLevel
            GameMode.ENDLESS -> 1.6
            else -> mode.mult
        }
        return floor(base * mult).toInt()
    }
}

object RunService {

    fun newRun(mode: GameMode, classId: String, perm: PermState): RunState {
        val run = RunState()
        run.mode = mode
        run.classId = classId
        run.gold = 50
        run.skillPoints = perm.growthLevel("g_init_sp")
        run.items["heal_potion"] = 1
        run.party.add(makeHero(classId, perm, run))
        return run
    }

    fun makeHero(classId: String, perm: PermState, run: RunState): Unit {
        val cd = Data.classById[classId] ?: Data.classes[0]
        val u = Unit(
            id = "player",
            name = "你",
            isPlayer = true,
            clsId = classId,
            level = 1,
            avatarKey = classId
        )
        u.base.maxHp = cd.baseHp + perm.growthLevel("g_hp") * 12.0
        u.base.atk = cd.baseAtk + perm.growthLevel("g_atk") * 3.0
        u.base.matk = cd.baseMatk + perm.growthLevel("g_matk") * 3.0
        u.base.def = cd.baseDef + perm.growthLevel("g_def") * 1.0
        u.base.crit = cd.crit
        u.base.critDmg = cd.critDmg
        u.base.energyRegen = cd.energyRegen
        u.base.dodge = cd.dodge
        rebuildSkills(u, classId, null, null)
        u.energy = 0.0
        u.hp = u.base.maxHp
        return u
    }

    /** 基础技 + 转职技，最多 6 个；优先保证有一个终极技。 */
    fun rebuildSkills(u: Unit, classId: String, promoId: String?, tier2Id: String?) {
        val base = Data.skillsOf(classId)
        val basic = base.firstOrNull { it.isBasic }
        val ult = base.firstOrNull { it.isUltimate }
        val t1 = promoId?.let { Promotions.byId[it] }
        val t2 = tier2Id?.let { Promotions.byId[it] }
        val t2Skills = t2?.skillIds?.mapNotNull { Promotions.skillOf(it) } ?: emptyList()
        val t1Skills = t1?.skillIds?.mapNotNull { Promotions.skillOf(it) } ?: emptyList()

        val ordered = ArrayList<Skill>()
        if (basic != null) ordered.add(basic)
        ordered.addAll(t2Skills)
        if (t2Skills.none { it.isUltimate } && ult != null) ordered.add(ult)
        ordered.addAll(t1Skills)
        for (s in base) {
            if (s.isBasic) continue
            if (s.isUltimate) continue
            ordered.add(s)
        }

        val out = ArrayList<Skill>()
        val seen = HashSet<String>()
        for (s in ordered) {
            if (seen.contains(s.id)) continue
            seen.add(s.id)
            out.add(s)
            if (out.size >= 6) break
        }
        u.skills.clear()
        u.skills.addAll(out)
        u.ultimateId = out.lastOrNull { it.isUltimate }?.id
    }

    fun promotionOf(run: RunState): List<PromotionDef> {
        val list = ArrayList<PromotionDef>()
        run.promotionId?.let { Promotions.byId[it]?.let { p -> list.add(p) } }
        run.tier2Id?.let { Promotions.byId[it]?.let { p -> list.add(p) } }
        return list
    }

    fun makeMercenary(classId: String, level: Int, rarity: Rarity, name: String): Unit {
        val cd = Data.classById[classId] ?: Data.classes[0]
        val mul = 1.0 + (rarity.rank - 1) * 0.12
        val u = Unit(
            id = "merc_" + Random.nextInt(100000),
            name = name,
            isPlayer = true,
            clsId = classId,
            level = level,
            rarity = rarity,
            avatarKey = Content2.companionAvatars.random()
        )
        u.base.maxHp = cd.baseHp * 0.8 * mul
        u.base.atk = cd.baseAtk * 0.8 * mul
        u.base.matk = cd.baseMatk * 0.8 * mul
        u.base.def = cd.baseDef * 0.8 * mul
        u.base.crit = cd.crit
        u.base.critDmg = cd.critDmg
        u.base.energyRegen = cd.energyRegen
        u.base.dodge = cd.dodge
        u.star = 1
        u.traitId = Content2.mercTraits.random().id
        rebuildSkills(u, classId, null, null)
        u.energy = 0.0
        u.hp = u.base.maxHp
        return u
    }

    /** 从职阶基础 + 等级成长 + 天赋 + 共鸣 + 装备 + 事件加成，计算最终面板。 */
    fun calcStats(run: RunState, u: Unit, perm: PermState) {
        val cd = Data.classById[u.clsId] ?: Data.classes[0]
        val lv = max(1, u.level)
        val s = Stats()
        s.maxHp = u.base.maxHp + cd.growthHp * (lv - 1)
        s.atk = u.base.atk + cd.growthAtk * (lv - 1)
        s.matk = u.base.matk + cd.growthMatk * (lv - 1)
        s.def = u.base.def + cd.growthDef * (lv - 1)
        s.crit = u.base.crit
        s.critDmg = u.base.critDmg
        s.energyRegen = u.base.energyRegen
        s.dodge = u.base.dodge
        s.energyMax = 100.0

        // 英雄：天赋、共鸣、装备
        if (u.isPlayer && u.id == "player") {
            val res = run.grid.resonanceBonus()
            val mods = HashMap<String, Double>()
            val flats = HashMap<String, Double>()

            for (t in run.grid.allTalents()) {
                val star = run.grid.stars[run.grid.indexOf(t.id)].coerceAtLeast(1)
                val k = t.scale(star)
                for ((key, v) in t.statMod) mods[key] = (mods[key] ?: 0.0) + v * k
                for ((key, v) in t.flatMod) flats[key] = (flats[key] ?: 0.0) + v * k
            }
            run.grid.divinity?.let { t ->
                val k = t.scale(run.grid.divinityStar)
                for ((key, v) in t.statMod) mods[key] = (mods[key] ?: 0.0) + v * k
                for ((key, v) in t.flatMod) flats[key] = (flats[key] ?: 0.0) + v * k
            }
            // 转职加成
            for (promo in promotionOf(run)) {
                for ((key, v) in promo.statMod) mods[key] = (mods[key] ?: 0.0) + v
                for ((key, v) in promo.flatMod) flats[key] = (flats[key] ?: 0.0) + v
            }

            s.maxHp *= 1.0 + (mods["maxHp"] ?: 0.0) + res.hp
            s.atk *= 1.0 + (mods["atk"] ?: 0.0)
            s.matk *= 1.0 + (mods["matk"] ?: 0.0)
            s.def *= 1.0 + (mods["def"] ?: 0.0) + res.def

            // 生命/攻击类共鸣与系别加成
            for (school in School.values()) {
                val n = run.grid.schoolCount(school)
                if (n <= 0) continue
                val bonus = 0.04 * n
                when (school) {
                    School.EDGE -> s.atk *= 1.0 + bonus
                    School.ARC -> s.matk *= 1.0 + bonus
                    School.WARD -> s.def *= 1.0 + bonus
                    School.VITA -> s.maxHp *= 1.0 + bonus
                    School.FATE -> s.crit += n * 2.0
                }
            }

            s.crit += mods["crit"] ?: 0.0
            s.critDmg += mods["critDmg"] ?: 0.0
            s.dodge += mods["dodge"] ?: 0.0
            s.dmgBonus += mods["dmgBonus"] ?: 0.0
            s.dmgReduction += mods["dmgReduction"] ?: 0.0
            s.energyRegen += flats["energyRegen"] ?: 0.0
            s.hpRegen += flats["hpRegen"] ?: 0.0
            s.lifesteal += flats["lifesteal"] ?: 0.0
            s.statusRes += flats["statusRes"] ?: 0.0
            s.armorPen += flats["armorPen"] ?: 0.0
            s.shieldPower += flats["shieldPower"] ?: 0.0
            s.healPower += flats["healPower"] ?: 0.0
            s.maxHp += flats["maxHp"] ?: 0.0
            s.atk += flats["atk"] ?: 0.0
            s.matk += flats["matk"] ?: 0.0
            s.def += flats["def"] ?: 0.0

            s.dmgBonus += run.grid.divinity?.let { if (it.passive == "soul_harvest") run.floor * 0.005 else 0.0 } ?: 0.0
            s.dmgReduction += run.grid.divinity?.let { if (it.passive == "god_slayer") 0.15 else 0.0 } ?: 0.0
            s.dodge += run.grid.divinity?.let { if (it.passive == "gale_breath") 12.0 else 0.0 } ?: 0.0
            s.def += run.grid.divinity?.let { if (it.passive == "iron_heart") run.floor * 2.0 else 0.0 } ?: 0.0


            // 宠物加成
            Pets.of(perm.petId)?.let { pet ->
                for ((key, v) in pet.statMod) {
                    when (key) {
                        "atk" -> s.atk *= 1.0 + v
                        "matk" -> s.matk *= 1.0 + v
                        "maxHp" -> s.maxHp *= 1.0 + v
                        "def" -> s.def *= 1.0 + v
                        "crit" -> s.crit += v
                        "dodge" -> s.dodge += v
                        "dmgReduction" -> s.dmgReduction += v
                    }
                }
                for ((key, v) in pet.flatMod) {
                    when (key) {
                        "energyRegen" -> s.energyRegen += v
                        "lifesteal" -> s.lifesteal += v / 100.0
                        "healPower" -> s.healPower += v
                        "shieldPower" -> s.shieldPower += v
                        "hpRegen" -> s.hpRegen += v
                    }
                }
            }
            s.energyRegen += res.energy

            // 装备
            for (slot in Content.slots) {
                val e = run.equipped[slot.id] ?: continue
                applyEquip(s, e)
            }
        } else if (u.isPlayer) {
            // 佣兵：装备简化处理
            for (slot in Content.slots) {
                val e = run.equipped[slot.id + "_" + u.id] ?: continue
                applyEquip(s, e)
            }
        }

        // 事件永久加成
        s.maxHp += run.permBonus["maxHp"] ?: 0.0
        s.atk += run.permBonus["atk"] ?: 0.0
        s.matk += run.permBonus["matk"] ?: 0.0
        s.def += run.permBonus["def"] ?: 0.0
        s.maxHp *= 1.0 + (run.permBonus["maxHpPct"] ?: 0.0)
        s.atk *= 1.0 + (run.permBonus["atkPct"] ?: 0.0)
        s.matk *= 1.0 + (run.permBonus["matkPct"] ?: 0.0)
        s.def *= 1.0 + (run.permBonus["defPct"] ?: 0.0)

        s.crit = min(s.crit, 80.0)
        s.dodge = min(s.dodge, 60.0)
        s.statusRes = min(s.statusRes, 75.0)
        s.dmgReduction = min(s.dmgReduction, 0.75)
        s.armorPen = min(s.armorPen, 0.9)
        s.lifesteal = min(s.lifesteal, 0.6)

        val prevMax = u.stats.maxHp
        u.stats.maxHp = s.maxHp
        u.stats.atk = s.atk
        u.stats.matk = s.matk
        u.stats.def = s.def
        u.stats.crit = s.crit
        u.stats.critDmg = s.critDmg
        u.stats.energyMax = s.energyMax
        u.stats.energyRegen = s.energyRegen
        u.stats.dodge = s.dodge
        u.stats.hpRegen = s.hpRegen
        u.stats.lifesteal = s.lifesteal
        u.stats.statusRes = s.statusRes
        u.stats.dmgBonus = s.dmgBonus
        u.stats.dmgReduction = s.dmgReduction
        u.stats.armorPen = s.armorPen
        u.stats.shieldPower = s.shieldPower
        u.stats.healPower = s.healPower

        if (prevMax <= 0.0) {
            u.hp = u.stats.maxHp
        } else {
            val ratio = (u.hp / prevMax).coerceIn(0.0, 1.0)
            u.hp = max(1.0, u.stats.maxHp * ratio)
        }
    }

    private fun applyEquip(s: Stats, e: Equip) {
        val mul = e.enhanceMul
        addStat(s, e.mainKey, e.mainValue * mul, true)
        for (a in e.affixes) {
            if (a.isMechanic) continue
            addStat(s, a.key, a.value * mul, true)
        }
        if (e.setId != null) {
            when (e.setId) {
                "s_blade" -> { s.atk *= 1.12; s.crit += 8.0 }
                "s_guard" -> { s.def *= 1.18; s.dmgReduction += 0.08 }
                "s_arcane" -> { s.matk *= 1.14; s.energyRegen += 5.0 }
                "s_life" -> { s.maxHp *= 1.16; s.hpRegen += s.maxHp * 0.02 }
                "s_fate" -> { s.dodge += 10.0; s.critDmg += 30.0 }
            }
        }
    }

    private fun addStat(s: Stats, key: String, value: Double, _flat: Boolean) {
        when (key) {
            "atk" -> s.atk += value
            "matk" -> s.matk += value
            "maxHp" -> s.maxHp += value
            "def" -> s.def += value
            "crit" -> s.crit += value
            "critDmg" -> s.critDmg += value
            "dodge" -> s.dodge += value
            "lifesteal" -> s.lifesteal += value / 100.0
            "energyRegen" -> s.energyRegen += value
            "hpRegen" -> s.hpRegen += value
            "statusRes" -> s.statusRes += value
            "armorPen" -> s.armorPen += value
            "shieldPower" -> s.shieldPower += value
            "healPower" -> s.healPower += value
        }
    }

    fun recalcAll(run: RunState, perm: PermState) {
        for (u in run.party) calcStats(run, u, perm)
        // 装备可能让队友血量上限变化，做一次保护
        for (u in run.party) if (u.hp > u.stats.maxHp) u.hp = u.stats.maxHp
    }

    fun grantExp(run: RunState, perm: PermState, amount: Int) {
        run.exp += amount
        while (run.exp >= run.expToNext()) {
            run.exp -= run.expToNext()
            run.level++
            run.skillPoints++
        }
        recalcAll(run, perm)
    }
}
