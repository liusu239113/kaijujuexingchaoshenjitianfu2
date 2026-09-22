package com.dshx.game.shidai.game

import kotlin.random.Random

/** 宠物定义：提供队伍加成与开场/持续助战效果。 */
class PetDef(
    val id: String,
    val name: String,
    val avatar: String,
    val rarity: Rarity,
    val desc: String,
    val statMod: Map<String, Double> = emptyMap(),
    val flatMod: Map<String, Double> = emptyMap(),
    val passive: String? = null
) {
    /** 助战定位（展示用）。 */
    val role: String get() = when (passive) {
        "open_dmg" -> "开场增伤"
        "open_shield" -> "开场护盾"
        "regen" -> "持续回复"
        "gold" -> "金币增益"
        "dot" -> "持续伤害强化"
        "elite_hunter" -> "首领克星"
        else -> "属性增益"
    }
}

object Pets {

    val all: List<PetDef> = listOf(
        PetDef("pet_01", "火绒狐", "pet_01", Rarity.LEGENDARY,
            "攻击 +12%；进入战斗时全队增伤 +15%（3 回合）。",
            mapOf("atk" to 0.12), emptyMap(), "open_dmg"),
        PetDef("pet_02", "霜羽鸟", "pet_02", Rarity.EPIC,
            "能量回复 +5；进入战斗时全队获得 12% 最大生命护盾。",
            emptyMap(), mapOf("energyRegen" to 5.0), "open_shield"),
        PetDef("pet_03", "岩甲龟", "pet_03", Rarity.RARE,
            "防御 +20%，最大生命 +10%。",
            mapOf("def" to 0.20, "maxHp" to 0.10)),
        PetDef("pet_04", "雷纹猫", "pet_04", Rarity.EPIC,
            "暴击 +10%，能量回复 +3。",
            mapOf("crit" to 10.0), mapOf("energyRegen" to 3.0)),
        PetDef("pet_05", "翠叶鹿", "pet_05", Rarity.COMMON,
            "最大生命 +15%；每回合额外回复 1.5% 生命。",
            mapOf("maxHp" to 0.15), emptyMap(), "regen"),
        PetDef("pet_06", "星尘水母", "pet_06", Rarity.LEGENDARY,
            "法强 +14%；治疗效果 +20%。",
            mapOf("matk" to 0.14), mapOf("healPower" to 0.20)),
        PetDef("pet_07", "影蝙蝠", "pet_07", Rarity.RARE,
            "闪避 +10%，吸血 +8%。",
            mapOf("dodge" to 10.0), mapOf("lifesteal" to 8.0)),
        PetDef("pet_08", "金铃羊", "pet_08", Rarity.COMMON,
            "最大生命 +8%；战斗金币收益 +25%。",
            mapOf("maxHp" to 0.08), emptyMap(), "gold"),
        PetDef("pet_09", "毒沼蛙", "pet_09", Rarity.EPIC,
            "攻击 +10%；持续伤害 +40%。",
            mapOf("atk" to 0.10), emptyMap(), "dot"),
        PetDef("pet_10", "晶簇兔", "pet_10", Rarity.RARE,
            "防御 +12%；护盾效果 +25%。",
            mapOf("def" to 0.12), mapOf("shieldPower" to 0.25)),
        PetDef("pet_11", "云朵犬", "pet_11", Rarity.COMMON,
            "每回合回复 2% 生命；受到伤害 -6%。",
            mapOf("dmgReduction" to 0.06), emptyMap(), "regen"),
        PetDef("pet_12", "小骨龙", "pet_12", Rarity.MYTHIC,
            "攻击 +16%；对首领与精锐伤害 +20%。",
            mapOf("atk" to 0.16), emptyMap(), "elite_hunter")
    )

    val byId: Map<String, PetDef> = all.associateBy { it.id }

    fun of(id: String?): PetDef? = if (id == null) null else byId[id]

    /** 宠物叫声音效名（对应 res/raw/sfx_xxx.mp3）。 */
    fun cry(id: String?): String = when (id) {
        "pet_01" -> "pet_cry_fox"
        "pet_02" -> "pet_cry_bird"
        "pet_03" -> "pet_cry_beast"
        "pet_04" -> "pet_cry_bird"
        "pet_05" -> "pet_cry_beast"
        "pet_06" -> "pet_cry_magic"
        "pet_07" -> "pet_cry_bat"
        "pet_08" -> "pet_cry_beast"
        "pet_09" -> "pet_cry_beast"
        "pet_10" -> "pet_cry_magic"
        "pet_11" -> "pet_cry_beast"
        "pet_12" -> "pet_cry_dragon"
        else -> "pet_cry_beast"
    }

    fun randomUnowned(owned: Set<String>): PetDef? =
        all.filter { !owned.contains(it.id) }.randomOrNull()

    // ------------------------------------------------------------ 等级

    /** 等级上限：重复获得同一只宠物会 +1 级。 */
    const val MAX_LEVEL = 10

    /** 等级加成倍率：Lv.1 为 1.0，每级 +8%。 */
    fun levelMul(lv: Int): Double = 1.0 + (maxOf(1, lv) - 1) * 0.08

    // ------------------------------------------------------------ 召唤（卡池）

    /** 常驻池各星级权重。 */
    val poolWeights: Map<Rarity, Int> = mapOf(
        Rarity.COMMON to 45,
        Rarity.RARE to 30,
        Rarity.EPIC to 17,
        Rarity.LEGENDARY to 7,
        Rarity.MYTHIC to 1
    )

    /** 保底：连续 PITY_LIMIT 抽内必得「灿烂」及以上。 */
    const val PITY_LIMIT = 10

    const val COST_SINGLE = 1
    const val COST_TEN = 9

    /** 展示用：某星级在常驻池里的实际概率（按宠物条目加权）。 */
    fun rarityChance(r: Rarity): Double {
        val total = all.sumOf { poolWeights[it.rarity] ?: 1 }
        val mine = all.filter { it.rarity == r }.sumOf { poolWeights[it.rarity] ?: 1 }
        return mine * 100.0 / total
    }

    /** 一次召唤的结果。 */
    class PullResult(val pet: PetDef, val isNew: Boolean, val levelUp: Boolean, val dust: Int, val maxed: Boolean)

    /** 抽一次（推进保底计数）。 */
    fun rollOne(perm: PermState): PetDef {
        val pity = perm.petPity + 1
        // 保底触发：只在「灿烂」及以上里抽
        val forceHigh = pity >= PITY_LIMIT
        val pool = if (forceHigh) all.filter { it.rarity.rank >= Rarity.EPIC.rank } else all
        val total = pool.sumOf { poolWeights[it.rarity] ?: 1 }
        var roll = Random.nextInt(maxOf(1, total))
        var picked = pool.last()
        for (p in pool) {
            val wgt = poolWeights[p.rarity] ?: 1
            if (roll < wgt) {
                picked = p
                break
            }
            roll -= wgt
        }
        perm.petPity = if (picked.rarity.rank >= Rarity.EPIC.rank) 0 else pity
        return picked
    }

    /** 发奖：新宠物入库；重复则升级，满级后折算星尘。 */
    fun grant(perm: PermState, pet: PetDef): PullResult {
        val isNew = perm.petsOwned.add(pet.id)
        if (isNew) {
            perm.petLevels.putIfAbsent(pet.id, 1)
            if (perm.petId == null) perm.petId = pet.id
            return PullResult(pet, true, false, 0, false)
        }
        val lv = perm.petLevel(pet.id)
        if (lv < MAX_LEVEL) {
            perm.petLevels[pet.id] = lv + 1
            return PullResult(pet, false, true, 0, false)
        }
        val dust = 10 * pet.rarity.rank
        Tracker.addDust(perm, dust)
        return PullResult(pet, false, false, dust, true)
    }

    /** 连抽。调用方负责先扣券。 */
    fun pull(perm: PermState, times: Int): List<PullResult> {
        val out = ArrayList<PullResult>()
        for (i in 0 until times) out.add(grant(perm, rollOne(perm)))
        return out
    }
}
