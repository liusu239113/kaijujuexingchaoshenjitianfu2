package com.dshx.game.shidai.game

/** 转职路线。tier1 为第 3 层解锁，tier2 为第 30 层解锁。 */
class PromotionDef(
    val id: String,
    val name: String,
    val baseClass: String,
    val tier: Int,
    val parent: String?,
    val glyph: String,
    val desc: String,
    val statMod: Map<String, Double> = emptyMap(),
    val flatMod: Map<String, Double> = emptyMap(),
    val skillIds: List<String> = emptyList()
)

object Promotions {

    private fun sk(
        id: String, name: String, cls: String, cost: Int, cd: Int, lv: Int,
        stat: String, coeff: Double, target: TargetKind, desc: String,
        tags: List<Tag> = emptyList(), hits: Int = 1, ult: Boolean = false,
        buffDur: Int = 0, buffStacks: Int = 1, dotDur: Int = 0, dotCoeff: Double = 0.0,
        extra: String? = null
    ) = Skill(id, name, cls, cost, cd, lv, stat, coeff, target, desc, tags, hits, ult, buffDur, buffStacks, dotDur, dotCoeff, extra)

    val skills: List<Skill> = listOf(
        // ================= 一转 · 曜铁卫 =================
        sk("bk_frenzy", "沸血", "berserker", 20, 3, 1, "atk", 0.30, TargetKind.SELF, "攻击 +30%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("bk_execute", "斩尽", "berserker", 25, 2, 1, "atk", 2.2, TargetKind.ENEMY_ONE, "造成 220% 攻击伤害。", listOf(Tag.DAMAGE)),
        sk("pa_holy_shield", "曜金壁垒", "paladin", 22, 3, 1, "def", 1.2, TargetKind.SELF, "获得 120% 防御护盾。", listOf(Tag.SHIELD)),
        sk("pa_judgement", "裁断", "paladin", 28, 3, 1, "atk", 1.6, TargetKind.ENEMY_ONE, "造成 160% 攻击伤害，50% 概率眩晕 1 回合。", listOf(Tag.DAMAGE, Tag.STUN), buffDur = 1),

        // ================= 一转 · 星咏者 =================
        sk("am_arcane_barrage", "星尘弹幕", "archmage", 28, 2, 1, "matk", 1.05, TargetKind.ENEMY_ONE, "连射 3 次，每次 105% 法强伤害。", listOf(Tag.DAMAGE), hits = 3),
        sk("am_time_warp", "时序扭曲", "archmage", 30, 4, 1, "matk", 0.85, TargetKind.ALLY_ALL, "为全体队友刷新 2 回合冷却并回复 85% 法强生命。", listOf(Tag.HEAL), extra = "cd2"),
        sk("el_inferno", "焚世", "elementalist", 30, 3, 1, "matk", 1.8, TargetKind.ENEMY_ALL, "对全体造成 180% 法强伤害，附加 3 回合灼烧。", listOf(Tag.DAMAGE, Tag.DOT_BURN), dotDur = 3, dotCoeff = 0.30),
        sk("el_ice_prison", "凝霜", "elementalist", 24, 3, 1, "matk", 1.3, TargetKind.ENEMY_ONE, "造成 130% 法强伤害并眩晕 1 回合。", listOf(Tag.DAMAGE, Tag.STUN), buffDur = 1),

        // ================= 一转 · 岚射手 =================
        sk("mk_aimed_shot", "瞄准岚射", "marksman", 26, 2, 1, "atk", 2.1, TargetKind.ENEMY_ONE, "造成 210% 攻击伤害，无视 40% 防御。", listOf(Tag.DAMAGE), extra = "pen40"),
        sk("mk_rapid_fire", "岚矢连射", "marksman", 28, 3, 1, "atk", 0.85, TargetKind.ENEMY_ONE, "连射 4 次，每次 85% 攻击伤害。", listOf(Tag.DAMAGE), hits = 4),
        sk("bm_feral_strike", "兽灵突袭", "beastmaster", 24, 2, 1, "atk", 1.7, TargetKind.ENEMY_ONE, "造成 170% 攻击伤害并附加 3 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 3, buffStacks = 3),
        sk("bm_natures_blessing", "森灵祝福", "beastmaster", 26, 4, 1, "atk", 0.25, TargetKind.ALLY_ALL, "全体队友攻击与法强 +25%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),

        // ================= 一转 · 圣歌使 =================
        sk("bp_greater_heal", "至臻疗愈", "bishop", 28, 2, 1, "matk", 2.2, TargetKind.ALLY_ONE, "为生命最低队友恢复 220% 法强生命。", listOf(Tag.HEAL)),
        sk("bp_sanctuary", "静谧圣域", "bishop", 30, 4, 1, "matk", 1.0, TargetKind.ALLY_ALL, "全体获得 100% 法强护盾。", listOf(Tag.SHIELD)),
        sk("ch_hymn", "韶光诗", "chanter", 24, 3, 1, "matk", 0.25, TargetKind.ALLY_ALL, "全体队友法强 +25%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("ch_purify", "涤罪咏", "chanter", 22, 3, 1, "matk", 1.1, TargetKind.ALLY_ALL, "全体清除减益并恢复 110% 法强生命。", listOf(Tag.HEAL, Tag.CLEANSE)),

        // ================= 一转 · 夜刃 =================
        sk("sb_shadow_step", "夜行步", "shadowblade", 20, 3, 1, "atk", 0.50, TargetKind.SELF, "闪避 +50%，持续 2 回合。", listOf(Tag.BUFF_DODGE), buffDur = 2),
        sk("sb_assassinate", "断命刺", "shadowblade", 30, 3, 1, "atk", 2.6, TargetKind.ENEMY_ONE, "造成 260% 攻击伤害，暴击率额外 +30%。", listOf(Tag.DAMAGE), extra = "crit30"),
        sk("bt_bleed", "裂脉", "bloodthorn", 24, 2, 1, "atk", 1.4, TargetKind.ENEMY_ONE, "造成 140% 攻击伤害，附加 4 回合中毒。", listOf(Tag.DAMAGE, Tag.DOT_POISON), dotDur = 4, dotCoeff = 0.45),
        sk("bt_venom_burst", "剧毒迸发", "bloodthorn", 28, 3, 1, "atk", 1.5, TargetKind.ENEMY_ONE, "造成 150% 攻击伤害并附加 5 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 4, buffStacks = 5),

        // ================= 一转 · 绯血裔 =================
        sk("bl_blood_pool", "绯血池", "bloodlord", 26, 3, 1, "atk", 1.5, TargetKind.ENEMY_ALL, "对全体造成 150% 攻击伤害，吸血 30%。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "drain30"),
        sk("bl_crimson_feast", "绯色飨宴", "bloodlord", 30, 4, 1, "atk", 2.2, TargetKind.ENEMY_ONE, "造成 220% 攻击伤害，吸血 60%。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "drain60"),
        sk("cp_blood_rite", "绯祭", "crimsonpriest", 22, 3, 1, "atk", 0.35, TargetKind.ALLY_ALL, "全体队友攻击与法强 +35%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("cp_sanguine_ward", "绯盾", "crimsonpriest", 24, 3, 1, "maxHp", 0.22, TargetKind.ALLY_ALL, "全体获得 22% 最大生命护盾。", listOf(Tag.SHIELD)),

        // ================= 一转 · 森语者 =================
        sk("ng_bark_skin", "厚树肤", "natureguardian", 20, 3, 1, "maxHp", 0.20, TargetKind.SELF, "获得 20% 最大生命护盾。", listOf(Tag.SHIELD)),
        sk("ng_wrath", "森灵怒", "natureguardian", 28, 3, 1, "maxHp", 0.11, TargetKind.ENEMY_ALL, "对全体造成 11% 最大生命伤害。", listOf(Tag.DAMAGE)),
        sk("ws_bear_form", "巨兽形态", "wildshaper", 24, 4, 1, "maxHp", 0.30, TargetKind.SELF, "最大生命 +30%，持续 3 回合。", listOf(Tag.BUFF_REGEN), buffDur = 3),
        sk("ws_primal_roar", "原初咆哮", "wildshaper", 26, 3, 1, "maxHp", 0.20, TargetKind.ALLY_ALL, "全体队友攻击与法强 +20%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),

        // ================= 一转 · 鸣丝使 =================
        sk("ar_overdrive", "丝鸣超载", "artificer", 24, 3, 1, "matk", 1.0, TargetKind.ALLY_ALL, "全体队友获得 40 点能量与 100% 法强护盾。", listOf(Tag.SHIELD), extra = "energy40"),
        sk("ar_repair", "织补协议", "artificer", 22, 3, 1, "matk", 1.6, TargetKind.ALLY_ALL, "全体恢复 160% 法强生命。", listOf(Tag.HEAL)),
        sk("sw_soul_link", "魂链", "soulweaver", 26, 4, 1, "matk", 1.1, TargetKind.ALLY_ALL, "全体获得 110% 法强护盾并清除减益。", listOf(Tag.SHIELD, Tag.CLEANSE)),
        sk("sw_puppet_army", "机偶军团", "soulweaver", 30, 4, 1, "matk", 1.6, TargetKind.ENEMY_ALL, "对全体造成 160% 法强伤害并附加 3 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 3, buffStacks = 3),

        // ================= 二转 =================
        sk("wl_rampage", "沸血冲锋", "warlord", 30, 3, 1, "atk", 2.0, TargetKind.ENEMY_ONE, "造成 200% 攻击伤害，自身攻击 +40%（3 回合）。", listOf(Tag.DAMAGE, Tag.BUFF_ATK), buffDur = 3),
        sk("wl_ult", "怒血终焉", "warlord", 50, 6, 1, "atk", 2.8, TargetKind.ENEMY_ALL, "对全体造成 280% 攻击伤害。", listOf(Tag.DAMAGE), ult = true),
        sk("lj_verdict", "裁断击", "lightjudge", 28, 3, 1, "atk", 1.8, TargetKind.ENEMY_ONE, "造成 180% 攻击伤害并附加 5 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 4, buffStacks = 5),
        sk("lj_ult", "曜金巨锤", "lightjudge", 50, 6, 1, "atk", 3.0, TargetKind.ENEMY_ONE, "造成 300% 攻击伤害并眩晕 2 回合。", listOf(Tag.DAMAGE, Tag.STUN), buffDur = 2, ult = true),
        sk("cm_rewind", "时序回溯", "chronomancer", 26, 4, 1, "matk", 1.2, TargetKind.ALLY_ALL, "全体回复 120% 法强生命并刷新 3 回合冷却。", listOf(Tag.HEAL), extra = "cd3"),
        sk("cm_ult", "时序停滞", "chronomancer", 50, 6, 1, "matk", 2.2, TargetKind.ENEMY_ALL, "对全体造成 220% 法强伤害并眩晕 1 回合。", listOf(Tag.DAMAGE, Tag.STUN), buffDur = 1, ult = true),
        sk("el_avatar", "元素降身", "elemental_lord", 28, 4, 1, "matk", 0.45, TargetKind.SELF, "法强 +45%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("el_ult", "天启元素X", "elemental_lord", 50, 6, 1, "matk", 3.2, TargetKind.ENEMY_ALL, "对全体造成 320% 法强伤害并附加灼烧。", listOf(Tag.DAMAGE, Tag.DOT_BURN), dotDur = 3, dotCoeff = 0.35, ult = true),
        sk("ss_starfall", "陨星箭", "starshooter", 28, 3, 1, "atk", 2.4, TargetKind.ENEMY_ONE, "造成 240% 攻击伤害，无视 50% 防御。", listOf(Tag.DAMAGE), extra = "pen50"),
        sk("ss_ult", "陨星雨", "starshooter", 50, 6, 1, "atk", 1.15, TargetKind.ENEMY_ALL, "对全体连射 5 次，每次 115% 攻击伤害。", listOf(Tag.DAMAGE), hits = 5, ult = true),
        sk("bk_summon", "群兽呼号", "beastking", 28, 4, 1, "atk", 0.35, TargetKind.ALLY_ALL, "全体队友攻击与法强 +35%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("bk_ult", "兽群碾踏", "beastking", 50, 6, 1, "atk", 2.4, TargetKind.ENEMY_ALL, "对全体造成 240% 攻击伤害并附加 4 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 4, buffStacks = 4, ult = true),
        sk("hp_divine", "辉光庇护", "highpriest", 28, 5, 1, "matk", 1.8, TargetKind.ALLY_ALL, "全体恢复 180% 法强生命并获得 80% 法强护盾。", listOf(Tag.HEAL, Tag.SHIELD)),
        sk("hp_ult", "曜恩降临", "highpriest", 50, 6, 1, "matk", 2.6, TargetKind.ALLY_ALL, "全体恢复 260% 法强生命并附加 150% 法强护盾。", listOf(Tag.HEAL, Tag.SHIELD), ult = true),
        sk("vc_anthem", "虚渊咏叹", "voidchanter", 26, 3, 1, "matk", 0.40, TargetKind.ALLY_ALL, "全体法强 +40%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("vc_ult", "终焉咏叹", "voidchanter", 50, 6, 1, "matk", 2.6, TargetKind.ENEMY_ALL, "对全体造成 260% 法强伤害，同时为全队恢复 120% 法强生命。", listOf(Tag.DAMAGE, Tag.HEAL), ult = true),
        sk("pb_shadow", "无痕", "phantomblade", 24, 4, 1, "atk", 0.60, TargetKind.SELF, "闪避 +60%，持续 2 回合。", listOf(Tag.BUFF_DODGE), buffDur = 2),
        sk("pb_ult", "千影绝杀", "phantomblade", 50, 6, 1, "atk", 0.85, TargetKind.ENEMY_ONE, "连续斩击 6 次，每次 85% 攻击伤害。", listOf(Tag.DAMAGE), hits = 6, ult = true),
        sk("bm_moon", "绯月", "bloodmoon", 26, 3, 1, "atk", 1.9, TargetKind.ENEMY_ONE, "造成 190% 攻击伤害并附加 4 回合中毒。", listOf(Tag.DAMAGE, Tag.DOT_POISON), dotDur = 4, dotCoeff = 0.50),
        sk("bm_ult", "绯月斩", "bloodmoon", 50, 6, 1, "atk", 2.6, TargetKind.ENEMY_ALL, "对全体造成 260% 攻击伤害并附加中毒。", listOf(Tag.DAMAGE, Tag.DOT_POISON), dotDur = 4, dotCoeff = 0.45, ult = true),
        sk("ta_domain", "始祖领域", "trueancestor", 28, 4, 1, "atk", 0.30, TargetKind.ALLY_ALL, "全体队友吸血 +30%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("ta_ult", "绯月降临", "trueancestor", 50, 6, 1, "atk", 3.0, TargetKind.ENEMY_ALL, "对全体造成 300% 攻击伤害，吸血 60%。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "drain60", ult = true),
        sk("cr_tide", "赤潮涌", "crimsonhigh", 26, 3, 1, "matk", 1.4, TargetKind.ALLY_ALL, "全体恢复 140% 法强生命。", listOf(Tag.HEAL)),
        sk("cr_ult", "绯海赞歌", "crimsonhigh", 50, 6, 1, "matk", 0.50, TargetKind.ALLY_ALL, "全体队友攻击与法强 +50%，并回满能量。", listOf(Tag.BUFF_ATK), buffDur = 3, ult = true),
        sk("wt_blessing", "巨木祝福", "worldtree", 28, 4, 1, "maxHp", 0.35, TargetKind.ALLY_ALL, "全体最大生命 +35%，持续 3 回合。", listOf(Tag.BUFF_REGEN), buffDur = 3),
        sk("wt_ult", "生机洪流", "worldtree", 50, 6, 1, "maxHp", 0.30, TargetKind.ALLY_ALL, "全体恢复 30% 最大生命并获得 20% 最大生命护盾。", listOf(Tag.HEAL, Tag.SHIELD), ult = true),
        sk("pr_form", "原初形态", "primal", 28, 4, 1, "maxHp", 0.50, TargetKind.SELF, "最大生命 +50%，持续 3 回合。", listOf(Tag.BUFF_REGEN), buffDur = 3),
        sk("pr_ult", "裂地之怒", "primal", 50, 6, 1, "maxHp", 0.22, TargetKind.ENEMY_ALL, "对全体造成 22% 最大生命伤害。", listOf(Tag.DAMAGE), ult = true),
        sk("ct_assembly", "万象组装", "creator", 26, 4, 1, "matk", 1.6, TargetKind.ALLY_ALL, "全体获得 160% 法强护盾。", listOf(Tag.SHIELD)),
        sk("ct_ult", "万象终焉", "creator", 50, 6, 1, "matk", 2.8, TargetKind.ENEMY_ALL, "对全体造成 280% 法强伤害。", listOf(Tag.DAMAGE), ult = true),
        sk("sg_weave", "织魂曲", "soulsinger", 26, 4, 1, "matk", 1.5, TargetKind.ALLY_ALL, "全体恢复 150% 法强生命并清除减益。", listOf(Tag.HEAL, Tag.CLEANSE)),
        sk("sg_ult", "魂风暴", "soulsinger", 50, 6, 1, "matk", 2.9, TargetKind.ENEMY_ALL, "对全体造成 290% 法强伤害，同时为全队恢复 140% 法强生命。", listOf(Tag.DAMAGE, Tag.HEAL), ult = true)
    )

    val skillById: Map<String, Skill> = skills.associateBy { it.id }

    val all: List<PromotionDef> = listOf(
        // ---- 曜铁卫 ----
        PromotionDef("berserker", "血怒斗士", "warrior", 1, null, "🪓", "以血换伤：攻击暴涨，防御下降。",
            mods(mapOf("atk" to 0.30, "dmgBonus" to 0.15, "def" to -0.10)), mapOf("lifesteal" to 8.0), listOf("bk_frenzy", "bk_execute")),
        PromotionDef("paladin", "曜金守卫", "warrior", 1, null, "✝", "攻守兼备：护盾与控制的结合。",
            mods(mapOf("def" to 0.28, "maxHp" to 0.15)), mapOf("shieldPower" to 0.25), listOf("pa_holy_shield", "pa_judgement")),
        // ---- 星咏者 ----
        PromotionDef("archmage", "曜辉贤者", "mage", 1, null, "🔮", "奥术洪流：多段法术与冷却操控。",
            mods(mapOf("matk" to 0.30)), mapOf("energyRegen" to 5.0), listOf("am_arcane_barrage", "am_time_warp")),
        PromotionDef("elementalist", "元素统御", "mage", 1, null, "🌋", "元素之座：大范围灼烧与凝霜。",
            mods(mapOf("matk" to 0.22, "dmgBonus" to 0.12)), emptyMap(), listOf("el_inferno", "el_ice_prison")),
        // ---- 岚射手 ----
        PromotionDef("marksman", "猎星射手", "ranger", 1, null, "🎯", "一击必杀：极高的单点爆发。",
            mods(mapOf("atk" to 0.32, "crit" to 8.0)), mapOf("armorPen" to 0.15), listOf("mk_aimed_shot", "mk_rapid_fire")),
        PromotionDef("beastmaster", "群兽之友", "ranger", 1, null, "🐺", "以兽为友：锻铸全队输出与破甲。",
            mods(mapOf("atk" to 0.18, "maxHp" to 0.12)), emptyMap(), listOf("bm_feral_strike", "bm_natures_blessing")),
        // ---- 圣歌使 ----
        PromotionDef("bishop", "大司祭", "priest", 1, null, "⛪", "圣光庇佑：最强单体治疗与群体护盾。",
            mods(mapOf("matk" to 0.26)), mapOf("healPower" to 0.30), listOf("bp_greater_heal", "bp_sanctuary")),
        PromotionDef("chanter", "虚咏者", "priest", 1, null, "🎼", "咏唱不止：全队法强与净化。",
            mods(mapOf("matk" to 0.20, "maxHp" to 0.10)), mapOf("energyRegen" to 6.0), listOf("ch_hymn", "ch_purify")),
        // ---- 夜刃 ----
        PromotionDef("shadowblade", "暗影锋", "assassin", 1, null, "🗡", "无形之刃：闪避与暴击极致。",
            mods(mapOf("atk" to 0.28, "crit" to 12.0, "dodge" to 10.0)), emptyMap(), listOf("sb_shadow_step", "sb_assassinate")),
        PromotionDef("bloodthorn", "毒棘", "assassin", 1, null, "🌹", "毒与血：持续伤害与破甲。",
            mods(mapOf("atk" to 0.24)), mapOf("lifesteal" to 12.0), listOf("bt_bleed", "bt_venom_burst")),
        // ---- 绯血裔 ----
        PromotionDef("bloodlord", "绯血领主", "vampire", 1, null, "🦇", "血之权柄：群体吸血。",
            mods(mapOf("atk" to 0.24, "maxHp" to 0.16)), mapOf("lifesteal" to 15.0), listOf("bl_blood_pool", "bl_crimson_feast")),
        PromotionDef("crimsonpriest", "赤潮涌祭司", "vampire", 1, null, "🩸", "以血献祭：全队增益与护盾。",
            mods(mapOf("maxHp" to 0.26)), mapOf("shieldPower" to 0.30), listOf("cp_blood_rite", "cp_sanguine_ward")),
        // ---- 森语者 ----
        PromotionDef("natureguardian", "森之守望", "druid", 1, null, "🌳", "大地之盾：生命驱动的攻防。",
            mods(mapOf("maxHp" to 0.34, "def" to 0.20)), emptyMap(), listOf("ng_bark_skin", "ng_wrath")),
        PromotionDef("wildshaper", "化形者", "druid", 1, null, "🐻", "化形之力：变身与铁律咆哮。",
            mods(mapOf("maxHp" to 0.28, "atk" to 0.16)), emptyMap(), listOf("ws_bear_form", "ws_primal_roar")),
        // ---- 鸣丝使 ----
        PromotionDef("artificer", "机枢师", "puppeteer", 1, null, "⚙", "机械支援：能量与修复。",
            mods(mapOf("matk" to 0.24, "def" to 0.15)), mapOf("energyRegen" to 7.0), listOf("ar_overdrive", "ar_repair")),
        PromotionDef("soulweaver", "魂织者", "puppeteer", 1, null, "🕸", "丝线缄缚：群体护盾与伤害。",
            mods(mapOf("matk" to 0.26, "maxHp" to 0.12)), mapOf("shieldPower" to 0.20), listOf("sw_soul_link", "sw_puppet_army")),

        // ================= 二转 =================
        PromotionDef("warlord", "怒战之巅", "warrior", 2, "berserker", "🔥", "沸血的终点：以战养战，越打越强。",
            mods(mapOf("atk" to 0.35, "dmgBonus" to 0.20)), mapOf("lifesteal" to 15.0), listOf("wl_rampage", "wl_ult")),
        PromotionDef("lightjudge", "曜金裁断", "warrior", 2, "paladin", "⚖", "裁断降临：控制与破甲兼备。",
            mods(mapOf("def" to 0.30, "atk" to 0.25)), mapOf("statusRes" to 30.0), listOf("lj_verdict", "lj_ult")),
        PromotionDef("chronomancer", "时序之主", "mage", 2, "archmage", "⏳", "操控时间：冷却与治疗的极致。",
            mods(mapOf("matk" to 0.38)), mapOf("energyRegen" to 8.0), listOf("cm_rewind", "cm_ult")),
        PromotionDef("elemental_lord", "元素之座", "mage", 2, "elementalist", "☄", "元素归一：毁天灭地的群体伤害。",
            mods(mapOf("matk" to 0.34, "dmgBonus" to 0.20)), emptyMap(), listOf("el_avatar", "el_ult")),
        PromotionDef("starshooter", "星陨猎手", "ranger", 2, "marksman", "🌟", "箭落如星：无视防御的极限爆发。",
            mods(mapOf("atk" to 0.42, "crit" to 12.0)), mapOf("armorPen" to 0.25), listOf("ss_starfall", "ss_ult")),
        PromotionDef("beastking", "群兽之王", "ranger", 2, "beastmaster", "🦁", "号令群兽：全队增益与践踏。",
            mods(mapOf("atk" to 0.28, "maxHp" to 0.22)), mapOf("lifesteal" to 10.0), listOf("bk_summon", "bk_ult")),
        PromotionDef("highpriest", "至高大司祭", "priest", 2, "bishop", "🕊", "神恩如海：团队生存的顶点。",
            mods(mapOf("matk" to 0.34, "maxHp" to 0.18)), mapOf("healPower" to 0.45), listOf("hp_divine", "hp_ult")),
        PromotionDef("voidchanter", "虚渊鸣者", "priest", 2, "chanter", "🌌", "虚渊回响：大幅锻铸全队法强。",
            mods(mapOf("matk" to 0.32, "dmgBonus" to 0.15)), mapOf("energyRegen" to 9.0), listOf("vc_anthem", "vc_ult")),
        PromotionDef("phantomblade", "无痕", "assassin", 2, "shadowblade", "👤", "无形无色：六段斩击。",
            mods(mapOf("atk" to 0.38, "crit" to 18.0, "dodge" to 15.0)), emptyMap(), listOf("pb_shadow", "pb_ult")),
        PromotionDef("bloodmoon", "绯月刃", "assassin", 2, "bloodthorn", "🌑", "绯月之下：剧毒与斩击。",
            mods(mapOf("atk" to 0.36)), mapOf("lifesteal" to 18.0, "armorPen" to 0.15), listOf("bm_moon", "bm_ult")),
        PromotionDef("trueancestor", "始祖", "vampire", 2, "bloodlord", "🦇", "血族顶点：全队吸血领域。",
            mods(mapOf("atk" to 0.34, "maxHp" to 0.24)), mapOf("lifesteal" to 22.0), listOf("ta_domain", "ta_ult")),
        PromotionDef("crimsonhigh", "赤潮涌祭司", "vampire", 2, "crimsonpriest", "🌊", "血海降临：全队满能与爆发。",
            mods(mapOf("maxHp" to 0.34, "atk" to 0.20)), mapOf("shieldPower" to 0.35), listOf("cr_tide", "cr_ult")),
        PromotionDef("worldtree", "巨木守卫", "druid", 2, "natureguardian", "🌲", "生命之源：无穷再生。",
            mods(mapOf("maxHp" to 0.48, "def" to 0.25)), mapOf("hpRegen" to 40.0), listOf("wt_blessing", "wt_ult")),
        PromotionDef("primal", "原初化身", "druid", 2, "wildshaper", "🦣", "回归原始：生命即力量。",
            mods(mapOf("maxHp" to 0.42, "atk" to 0.22)), emptyMap(), listOf("pr_form", "pr_ult")),
        PromotionDef("creator", "万象之主", "puppeteer", 2, "artificer", "🔧", "万象造物：终极护盾与爆发。",
            mods(mapOf("matk" to 0.34, "def" to 0.22)), mapOf("shieldPower" to 0.40), listOf("ct_assembly", "ct_ult")),
        PromotionDef("soulsinger", "千面魂歌", "puppeteer", 2, "soulweaver", "🎭", "织魂曲之歌：群体治疗与风暴。",
            mods(mapOf("matk" to 0.36, "maxHp" to 0.18)), mapOf("healPower" to 0.35), listOf("sg_weave", "sg_ult"))
    )

    private fun mods(m: Map<String, Double>): Map<String, Double> = m

    val byId: Map<String, PromotionDef> = all.associateBy { it.id }

    /**
     * 转职后「不换立绘」的转职。
     * 这些转职的立绘性别与职阶语音对不上（战士是男声但「怒战之巅」立绘是女性等），
     * 换上去只会制造新的错位；保持职阶立绘 + 转职称号更稳妥。
     * 其余转职照常切换立绘。
     */
    val artLocked = setOf(
        "warlord", "lightjudge",                          // 战士线（男声）：立绘为女性
        "shadowblade",                                    // 夜刃线（女声）：立绘为男性
        "crimsonpriest", "trueancestor", "crimsonhigh"    // 绯血裔线（男声）：立绘为女性
    )

    fun tier1For(classId: String): List<PromotionDef> =
        all.filter { it.tier == 1 && it.baseClass == classId }

    fun tier2For(tier1Id: String): List<PromotionDef> =
        all.filter { it.tier == 2 && it.parent == tier1Id }

    fun skillOf(id: String): Skill? = skillById[id]
}
