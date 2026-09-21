package com.kaiju.awaken.game

/** 宠物定义：提供被动属性与开场效果。 */
class PetDef(
    val id: String,
    val name: String,
    val avatar: String,
    val desc: String,
    val statMod: Map<String, Double> = emptyMap(),
    val flatMod: Map<String, Double> = emptyMap(),
    val passive: String? = null
)

object Pets {

    val all: List<PetDef> = listOf(
        PetDef("pet_01", "火绒狐", "pet_01", "攻击 +12%；进入战斗时全队增伤 +15%（3 回合）。",
            mapOf("atk" to 0.12), emptyMap(), "open_dmg"),
        PetDef("pet_02", "霜羽鸟", "pet_02", "能量回复 +5；进入战斗时全队获得 12% 最大生命护盾。",
            emptyMap(), mapOf("energyRegen" to 5.0), "open_shield"),
        PetDef("pet_03", "岩甲龟", "pet_03", "防御 +20%，最大生命 +10%。",
            mapOf("def" to 0.20, "maxHp" to 0.10)),
        PetDef("pet_04", "雷纹猫", "pet_04", "暴击 +10%，能量回复 +3。",
            mapOf("crit" to 10.0), mapOf("energyRegen" to 3.0)),
        PetDef("pet_05", "翠叶鹿", "pet_05", "最大生命 +15%；每回合额外回复 1.5% 生命。",
            mapOf("maxHp" to 0.15), emptyMap(), "regen"),
        PetDef("pet_06", "星尘水母", "pet_06", "法强 +14%；治疗效果 +20%。",
            mapOf("matk" to 0.14), mapOf("healPower" to 0.20)),
        PetDef("pet_07", "影蝙蝠", "pet_07", "闪避 +10%，吸血 +8%。",
            mapOf("dodge" to 10.0), mapOf("lifesteal" to 8.0)),
        PetDef("pet_08", "金铃羊", "pet_08", "最大生命 +8%；战斗金币收益 +25%。",
            mapOf("maxHp" to 0.08), emptyMap(), "gold"),
        PetDef("pet_09", "毒沼蛙", "pet_09", "攻击 +10%；持续伤害 +40%。",
            mapOf("atk" to 0.10), emptyMap(), "dot"),
        PetDef("pet_10", "晶簇兔", "pet_10", "防御 +12%；护盾效果 +25%。",
            mapOf("def" to 0.12), mapOf("shieldPower" to 0.25)),
        PetDef("pet_11", "云朵犬", "pet_11", "每回合回复 2% 生命；受到伤害 -6%。",
            mapOf("dmgReduction" to 0.06), emptyMap(), "regen"),
        PetDef("pet_12", "小骨龙", "pet_12", "攻击 +16%；对首领与精锐伤害 +20%。",
            mapOf("atk" to 0.16), emptyMap(), "elite_hunter")
    )

    val byId: Map<String, PetDef> = all.associateBy { it.id }

    fun of(id: String?): PetDef? = if (id == null) null else byId[id]

    /** 未拥有的随机宠物；全拥有则返回 null。 */
    fun randomUnowned(owned: Set<String>): PetDef? =
        all.filter { !owned.contains(it.id) }.randomOrNull()
}
