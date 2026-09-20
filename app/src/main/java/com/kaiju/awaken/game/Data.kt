package com.kaiju.awaken.game

class ClassDef(
    val id: String,
    val name: String,
    val glyph: String,
    val title: String,
    val desc: String,
    val baseHp: Double,
    val baseAtk: Double,
    val baseMatk: Double,
    val baseDef: Double,
    val growthHp: Double,
    val growthAtk: Double,
    val growthMatk: Double,
    val growthDef: Double,
    val crit: Double,
    val critDmg: Double,
    val energyRegen: Double,
    val dodge: Double,
    val primary: String,
    /** 该职阶的战技 id 列表，实际 Skill 由 Data.skillById 解析。 */
    val skills: List<String>
)

object Data {

    // ---------------------------------------------------------------- 战技

    private fun sk(
        id: String, name: String, cls: String, cost: Int, cd: Int, lv: Int,
        stat: String, coeff: Double, target: TargetKind, desc: String,
        tags: List<Tag> = emptyList(), hits: Int = 1, ult: Boolean = false,
        buffDur: Int = 0, buffStacks: Int = 1, dotDur: Int = 0, dotCoeff: Double = 0.0,
        extra: String? = null
    ) = Skill(id, name, cls, cost, cd, lv, stat, coeff, target, desc, tags, hits, ult, buffDur, buffStacks, dotDur, dotCoeff, extra)

    val skills: List<Skill> = listOf(
        // ---- 曜铁卫：正面压制，嘲讽与破甲
        sk("w_slash", "崩岳斩", "warrior", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "对单体造成 100% 攻击伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("w_shield_bash", "震铠撞", "warrior", 20, 2, 1, "atk", 1.25, TargetKind.ENEMY_ONE, "造成 125% 攻击伤害，30% 概率眩晕 1 回合。", listOf(Tag.DAMAGE, Tag.STUN), buffDur = 1),
        sk("w_taunt", "铁律咆哮", "warrior", 20, 3, 3, "def", 0.9, TargetKind.SELF, "获得 90% 防御护盾，并嘲讽敌人 2 回合。", listOf(Tag.SHIELD, Tag.TAUNT), buffDur = 2),
        sk("w_armor_break", "裂甲重锤", "warrior", 22, 2, 5, "atk", 1.35, TargetKind.ENEMY_ONE, "造成 135% 攻击伤害，附加 3 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 3, buffStacks = 3),
        sk("w_ult", "永峙壁垒", "warrior", 45, 6, 9, "def", 1.8, TargetKind.SELF, "获得 180% 防御护盾，2 回合内免疫控制。", listOf(Tag.SHIELD), buffDur = 2, ult = true),

        // ---- 星咏者：元素爆发与群体灼烧
        sk("m_bolt", "星尘矢", "mage", 0, 0, 1, "matk", 1.0, TargetKind.ENEMY_ONE, "对单体造成 100% 法强伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("m_fireball", "烈阳爆", "mage", 25, 2, 1, "matk", 1.6, TargetKind.ENEMY_ONE, "造成 160% 法强伤害，附加 3 回合灼烧。", listOf(Tag.DAMAGE, Tag.DOT_BURN), dotDur = 3, dotCoeff = 0.35),
        sk("m_frost", "霜牢锢", "mage", 20, 3, 3, "matk", 1.1, TargetKind.ENEMY_ONE, "造成 110% 法强伤害，附加 3 层破甲并沉默 1 回合。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK, Tag.SILENCE), buffDur = 1, buffStacks = 3),
        sk("m_arcane", "星轨奔涌", "mage", 30, 4, 5, "matk", 1.45, TargetKind.ENEMY_ALL, "对全体造成 145% 法强伤害。", listOf(Tag.DAMAGE)),
        sk("m_ult", "陨星天罚", "mage", 50, 6, 9, "matk", 2.5, TargetKind.ENEMY_ALL, "对全体造成 250% 法强伤害。", listOf(Tag.DAMAGE), ult = true),

        // ---- 岚射手：多段射击与追猎刻印
        sk("r_shot", "疾风射", "ranger", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "对单体造成 100% 攻击伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("r_volley", "三连岚矢", "ranger", 24, 2, 1, "atk", 0.75, TargetKind.ENEMY_ONE, "连射 3 次，每次 75% 攻击伤害。", listOf(Tag.DAMAGE), hits = 3),
        sk("r_mark", "追猎刻印", "ranger", 16, 2, 3, "atk", 0.0, TargetKind.ENEMY_ONE, "标记目标 3 回合，其受到增伤 +20%。", listOf(Tag.HUNTED), buffDur = 3),
        sk("r_pierce", "裂空箭", "ranger", 26, 3, 5, "atk", 1.6, TargetKind.ENEMY_ONE, "造成 160% 攻击伤害，无视 35% 防御。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffStacks = 2, extra = "pen35"),
        sk("r_ult", "万岚归一", "ranger", 50, 6, 9, "atk", 1.05, TargetKind.ENEMY_ALL, "对全体连射 4 次，每次 105% 攻击伤害。", listOf(Tag.DAMAGE), hits = 4, ult = true),

        // ---- 圣歌使：治疗与圣盾
        sk("p_smite", "辉光罚", "priest", 0, 0, 1, "matk", 1.0, TargetKind.ENEMY_ONE, "对单体造成 100% 法强伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("p_heal", "暖光疗愈", "priest", 24, 2, 1, "matk", 1.6, TargetKind.ALLY_ONE, "为生命最低的队友恢复 160% 法强生命。", listOf(Tag.HEAL)),
        sk("p_shield", "辉盾术", "priest", 20, 3, 3, "matk", 1.3, TargetKind.ALLY_ONE, "为生命最低的队友附加 130% 法强护盾。", listOf(Tag.SHIELD)),
        sk("p_bless", "颂歌祝福", "priest", 20, 3, 5, "matk", 0.22, TargetKind.ALLY_ALL, "全体队友攻击与法强 +22%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("p_ult", "曙光普照", "priest", 50, 6, 9, "matk", 1.7, TargetKind.ALLY_ALL, "全体恢复 170% 法强生命，并附加 70% 法强护盾。", listOf(Tag.HEAL, Tag.SHIELD), ult = true),

        // ---- 夜刃：高暴击与破甲斩尽
        sk("a_stab", "夜刺", "assassin", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "对单体造成 100% 攻击伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("a_backstab", "断息刺", "assassin", 25, 2, 1, "atk", 1.85, TargetKind.ENEMY_ONE, "造成 185% 攻击伤害，暴击率额外 +25%。", listOf(Tag.DAMAGE), extra = "crit25"),
        sk("a_expose", "觅隙", "assassin", 20, 3, 3, "atk", 1.1, TargetKind.ENEMY_ONE, "造成 110% 攻击伤害，附加 4 层破甲。", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 3, buffStacks = 4),
        sk("a_shadow", "潜形", "assassin", 18, 4, 5, "atk", 0.0, TargetKind.SELF, "闪避率 +40%，持续 2 回合。", listOf(Tag.BUFF_DODGE), buffDur = 2),
        sk("a_ult", "千影终章", "assassin", 45, 6, 9, "atk", 0.62, TargetKind.ENEMY_ONE, "连续斩击 5 次，每次 62% 攻击伤害。", listOf(Tag.DAMAGE), hits = 5, ult = true),

        // ---- 绯血裔：吸血与持续消耗
        sk("v_bite", "绯牙", "vampire", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "造成 100% 攻击伤害并吸取生命，回复 20 能量。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "energy20"),
        sk("v_bloodstrike", "赤潮涌袭", "vampire", 24, 2, 1, "atk", 1.55, TargetKind.ENEMY_ONE, "造成 155% 攻击伤害，吸血 35%。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "drain35"),
        sk("v_frenzy", "血沸", "vampire", 18, 3, 3, "atk", 0.30, TargetKind.SELF, "攻击提升 30%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("v_pool", "腐血沼", "vampire", 22, 3, 5, "atk", 0.0, TargetKind.ENEMY_ONE, "使目标中毒 4 回合，每回合损失 40% 攻击生命。", listOf(Tag.DOT_POISON), dotDur = 4, dotCoeff = 0.40),
        sk("v_ult", "绯月飨宴", "vampire", 50, 6, 9, "atk", 2.0, TargetKind.ENEMY_ALL, "对全体造成 200% 攻击伤害，吸血 45%。", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), ult = true, extra = "drain45"),

        // ---- 森语者：生命值驱动的自然之力
        sk("d_claw", "藤爪撕咬", "druid", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "造成 100% 攻击伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("d_nature_slam", "森灵重击", "druid", 24, 2, 1, "maxHp", 0.075, TargetKind.ENEMY_ONE, "造成 7.5% 最大生命伤害并回复自身等量生命。", listOf(Tag.DAMAGE, Tag.HEAL)),
        sk("d_regen", "复苏之息", "druid", 18, 3, 3, "maxHp", 0.09, TargetKind.SELF, "每回合恢复 9% 最大生命，持续 3 回合。", listOf(Tag.BUFF_REGEN), buffDur = 3),
        sk("d_bark", "厚树肤术", "druid", 20, 3, 5, "maxHp", 0.12, TargetKind.SELF, "获得 12% 最大生命护盾。", listOf(Tag.SHIELD)),
        sk("d_ult", "荒野震怒", "druid", 50, 6, 9, "maxHp", 0.16, TargetKind.ENEMY_ALL, "对全体造成 16% 最大生命伤害，并回复自身伤害的 50%。", listOf(Tag.DAMAGE, Tag.HEAL), ult = true),

        // ---- 鸣丝使：指令与魂链
        sk("pp_command", "丝线号令", "puppeteer", 0, 0, 1, "matk", 1.0, TargetKind.ENEMY_ONE, "造成 100% 法强伤害，回复 20 能量。", listOf(Tag.DAMAGE), extra = "energy20"),
        sk("pp_guard", "守护织网", "puppeteer", 20, 3, 1, "matk", 1.35, TargetKind.ALLY_ALL, "为全体队友附加 135% 法强护盾。", listOf(Tag.SHIELD)),
        sk("pp_link", "丝线渡魂", "puppeteer", 22, 3, 3, "matk", 1.5, TargetKind.ALLY_ONE, "为生命最低队友恢复 150% 法强生命。", listOf(Tag.HEAL)),
        sk("pp_overdrive", "丝鸣超载丝鸣", "puppeteer", 22, 3, 5, "matk", 0.28, TargetKind.ALLY_ALL, "全体队友攻击与法强 +28%，持续 3 回合。", listOf(Tag.BUFF_ATK), buffDur = 3),
        sk("pp_ult", "终焉机偶", "puppeteer", 50, 6, 9, "matk", 2.35, TargetKind.ENEMY_ALL, "对全体造成 235% 法强伤害，并附加 3 回合灼烧。", listOf(Tag.DAMAGE, Tag.DOT_BURN), dotDur = 3, dotCoeff = 0.3, ult = true)
    )

    val skillById: Map<String, Skill> = skills.associateBy { it.id }

    // ---------------------------------------------------------------- 职阶

    val classes: List<ClassDef> = listOf(
        ClassDef("warrior", "曜铁卫", "🛡", "碎阵铁壁", "以铁壁碾碎敌阵，专精嘲讽、裂甲与护盾。",
            260.0, 18.0, 4.0, 12.0, 26.0, 2.4, 0.4, 1.5, 5.0, 50.0, 12.0, 0.0, "str",
            listOf("w_slash", "w_shield_bash", "w_taunt", "w_armor_break", "w_ult")),
        ClassDef("mage", "星咏者", "✧", "曜辉低语", "驾驭星轨与大范围灼烧，脆身却可倾覆战局。",
            190.0, 5.0, 22.0, 6.0, 18.0, 0.5, 3.1, 0.8, 6.0, 55.0, 14.0, 0.0, "int",
            listOf("m_bolt", "m_fireball", "m_frost", "m_arcane", "m_ult")),
        ClassDef("ranger", "岚射手", "➶", "疾风之瞳", "以连射与追猎刻印叠加伤害，越战越锐。",
            215.0, 20.0, 5.0, 7.0, 21.0, 2.7, 0.6, 1.0, 12.0, 60.0, 13.0, 5.0, "agi",
            listOf("r_shot", "r_volley", "r_mark", "r_pierce", "r_ult")),
        ClassDef("priest", "圣歌使", "✚", "曙光颂歌", "队伍续航核心，治疗、辉盾与全体颂歌。",
            230.0, 6.0, 18.0, 8.0, 23.0, 0.6, 2.5, 1.1, 5.0, 50.0, 16.0, 0.0, "int",
            listOf("p_smite", "p_heal", "p_shield", "p_bless", "p_ult")),
        ClassDef("assassin", "夜刃", "⚔", "无痕刃影", "极致暴击与裂甲，专猎高价值目标。",
            185.0, 22.0, 5.0, 5.0, 17.0, 3.2, 0.5, 0.7, 22.0, 80.0, 13.0, 8.0, "agi",
            listOf("a_stab", "a_backstab", "a_expose", "a_shadow", "a_ult")),
        ClassDef("vampire", "绯血裔", "🦇", "绯月血脉", "以血养战，汲血与腐蚀的持久消耗。",
            250.0, 19.0, 8.0, 9.0, 25.0, 2.5, 0.9, 1.2, 7.0, 55.0, 12.0, 3.0, "con",
            listOf("v_bite", "v_bloodstrike", "v_frenzy", "v_pool", "v_ult")),
        ClassDef("druid", "森语者", "❧", "密林回响", "以最大生命驱动伤害，越厚越强。",
            300.0, 14.0, 12.0, 10.0, 34.0, 1.6, 1.2, 1.4, 5.0, 50.0, 13.0, 2.0, "con",
            listOf("d_claw", "d_nature_slam", "d_regen", "d_bark", "d_ult")),
        ClassDef("puppeteer", "鸣丝使", "❖", "万缕操线", "以鸣丝操纵战局，全能辅助与织盾。",
            200.0, 7.0, 20.0, 7.0, 19.0, 0.6, 2.9, 0.9, 5.0, 50.0, 15.0, 0.0, "int",
            listOf("pp_command", "pp_guard", "pp_link", "pp_overdrive", "pp_ult"))
    )

    val classById: Map<String, ClassDef> = classes.associateBy { it.id }

    fun skillsOf(clsId: String): List<Skill> {
        val c = classById[clsId] ?: classes[0]
        return c.skills.mapNotNull { skillById[it] }
    }

    // ---------------------------------------------------------------- 天赋

    private fun tl(
        id: String, name: String, r: Rarity, s: School, desc: String,
        mods: Map<String, Double> = emptyMap(),
        flat: Map<String, Double> = emptyMap(),
        passive: String? = null,
        cls: String? = null
    ) = Talent(id, name, r, s, desc, mods, flat, passive, cls)

    val talents: List<Talent> = listOf(
        // ===== 曜神级（开局必得，占神格位，唯一） =====
        tl("ht_divine_hand", "曜罚之手", Rarity.HIDDEN, School.EDGE,
            "普攻额外造成 8% 最大生命真实伤害；每次普攻永久 +1.5% 最大生命。", passive = "divine_hand"),
        tl("ht_arcane_echo", "星轨回响", Rarity.HIDDEN, School.ARC,
            "战技增伤 +30%；造成战技伤害时 25% 概率立刻刷新该战技冷却。", passive = "arcane_echo"),
        tl("ht_iron_heart", "磐心", Rarity.HIDDEN, School.WARD,
            "进入遭遇战获得 60% 防御护盾；每层额外 +2 防御。", passive = "iron_heart"),
        tl("ht_soul_harvest", "魂火拾取", Rarity.HIDDEN, School.EDGE,
            "每次击杀永久 +2 攻击；造成的增伤 +当前层数 × 0.5%。", passive = "soul_harvest"),
        tl("ht_gale_breath", "岚息", Rarity.HIDDEN, School.FATE,
            "每回合额外行动一次；闪避 +12%。", passive = "gale_breath"),

        // ===== 神话 =====
        tl("t_phoenix", "涅槃羽", Rarity.MYTHIC, School.VITA, "首次战殁时以 40% 生命复活（每轮 1 次）。", passive = "phoenix"),
        tl("t_god_slayer", "屠神者", Rarity.MYTHIC, School.EDGE, "对精锐与首领增伤 +35%，受到的伤害 -15%。", passive = "god_slayer"),
        tl("t_reincarnation_admin", "轮回执掌", Rarity.MYTHIC, School.FATE, "每层全面板 +3%；觉醒时额外多 1 个选项。", passive = "reincarnation_admin"),
        tl("t_blood_pact", "绯色誓约", Rarity.MYTHIC, School.EDGE, "最大生命 -10%，攻击与法强 +30%，暴击 +12%。",
            mods = mapOf("atk" to 0.30, "matk" to 0.30, "crit" to 12.0, "maxHp" to -0.10)),
        tl("t_unbroken_line", "永峙防线", Rarity.MYTHIC, School.WARD, "生命低于 40% 时自动获得 25% 最大生命护盾（每场 1 次）。", passive = "unbroken_line"),

        // ===== 辉耀 =====
        tl("t_dragon_blood", "龙裔血脉", Rarity.LEGENDARY, School.VITA, "最大生命 +22%，防御 +15%。", mods = mapOf("maxHp" to 0.22, "def" to 0.15)),
        tl("t_berserk", "狂战之魂", Rarity.LEGENDARY, School.EDGE, "攻击 +25%，受到增伤 +8%。", mods = mapOf("atk" to 0.25, "dmgTaken" to 0.08)),
        tl("t_arcane_surge", "星轨奔涌", Rarity.LEGENDARY, School.ARC, "法强 +28%，能量回复 +4。", mods = mapOf("matk" to 0.28), flat = mapOf("energyRegen" to 4.0)),
        tl("t_death_mark", "死亡印记", Rarity.LEGENDARY, School.EDGE, "攻击附带 18% 额外真实伤害。", passive = "death_mark"),
        tl("t_thick_skin", "厚皮", Rarity.LEGENDARY, School.WARD, "单次受到的伤害不超过最大生命的 18%。", passive = "thick_skin"),
        tl("t_shield_reflect", "棘刺壁垒", Rarity.LEGENDARY, School.WARD, "反弹 25% 受到的伤害。", passive = "thorns"),
        tl("t_lich_form", "巫妖形态", Rarity.LEGENDARY, School.ARC, "击杀敌人回复 12% 最大生命。", passive = "kill_heal"),
        tl("t_twin_fang", "双生獠牙", Rarity.LEGENDARY, School.FATE, "凡庸攻击额外攻击 1 次。", passive = "double_attack"),
        tl("t_phantom_step", "幻夜行步", Rarity.LEGENDARY, School.FATE, "闪避 +25%，闪避成功后回复 8 能量。", mods = mapOf("dodge" to 25.0), passive = "dodge_energy"),
        tl("t_life_spring", "生机泉", Rarity.LEGENDARY, School.VITA, "每回合回复 4% 最大生命。", passive = "regen4"),

        // ===== 灿烂 =====
        tl("t_iron_will", "钢铁意志", Rarity.EPIC, School.WARD, "防御 +20%，状态抗性 +20。", mods = mapOf("def" to 0.20), flat = mapOf("statusRes" to 20.0)),
        tl("t_flame_mastery", "炎爆精通", Rarity.EPIC, School.ARC, "法强 +18%，灼烧增伤 +50%。", mods = mapOf("matk" to 0.18), passive = "burn_boost"),
        tl("t_sharp_edge", "裂界", Rarity.EPIC, School.EDGE, "攻击 +18%，无视 12% 防御。", mods = mapOf("atk" to 0.18), flat = mapOf("armorPen" to 0.12)),
        tl("t_vitality", "生机勃发", Rarity.EPIC, School.VITA, "最大生命 +18%，每回合回复 1.5% 生命。", mods = mapOf("maxHp" to 0.18), passive = "regen1_5"),
        tl("t_keen_eye", "鹰眼", Rarity.EPIC, School.FATE, "暴击 +15%，暴击增伤 +35%。", mods = mapOf("crit" to 15.0, "critDmg" to 35.0)),
        tl("t_swift", "疾风", Rarity.EPIC, School.FATE, "闪避 +15%，能量回复 +3。", mods = mapOf("dodge" to 15.0), flat = mapOf("energyRegen" to 3.0)),
        tl("t_leech", "汲血", Rarity.EPIC, School.VITA, "吸血 +15%。", flat = mapOf("lifesteal" to 15.0)),
        tl("t_bulwark", "堡垒", Rarity.EPIC, School.WARD, "护盾效果 +40%。", flat = mapOf("shieldPower" to 0.40)),
        tl("t_holy_grace", "神恩", Rarity.EPIC, School.VITA, "治疗效果 +40%。", flat = mapOf("healPower" to 0.40)),
        tl("t_war_spirit", "战意", Rarity.EPIC, School.EDGE, "造成增伤 +12%，受到伤害 -6%。", mods = mapOf("dmgBonus" to 0.12, "dmgReduction" to 0.06)),
        tl("t_mana_flow", "魔力奔涌", Rarity.EPIC, School.ARC, "法强 +14%，能量回复 +5。", mods = mapOf("matk" to 0.14), flat = mapOf("energyRegen" to 5.0)),
        tl("t_stone_skin", "石化皮肤", Rarity.EPIC, School.WARD, "防御 +14%，最大生命 +10%。", mods = mapOf("def" to 0.14, "maxHp" to 0.10)),

        // ===== 精巧 =====
        tl("t_atk_up", "利刃", Rarity.RARE, School.EDGE, "攻击 +12%。", mods = mapOf("atk" to 0.12)),
        tl("t_matk_up", "秘能", Rarity.RARE, School.ARC, "法强 +12%。", mods = mapOf("matk" to 0.12)),
        tl("t_def_up", "护甲", Rarity.RARE, School.WARD, "防御 +12%。", mods = mapOf("def" to 0.12)),
        tl("t_hp_up", "体魄", Rarity.RARE, School.VITA, "最大生命 +12%。", mods = mapOf("maxHp" to 0.12)),
        tl("t_crit_up", "锐目", Rarity.RARE, School.FATE, "暴击 +8%。", mods = mapOf("crit" to 8.0)),
        tl("t_critdmg_up", "致命", Rarity.RARE, School.FATE, "暴击增伤 +25%。", mods = mapOf("critDmg" to 25.0)),
        tl("t_dodge_up", "轻身", Rarity.RARE, School.FATE, "闪避 +8%。", mods = mapOf("dodge" to 8.0)),
        tl("t_regen_up", "复苏", Rarity.RARE, School.VITA, "每回合回复 20 点生命。", flat = mapOf("hpRegen" to 20.0)),
        tl("t_energy_up", "星轨核心", Rarity.RARE, School.ARC, "能量回复 +4。", flat = mapOf("energyRegen" to 4.0)),
        tl("t_resist_up", "坚韧", Rarity.RARE, School.WARD, "状态抗性 +15。", flat = mapOf("statusRes" to 15.0)),
        tl("t_pierce_up", "穿甲", Rarity.RARE, School.EDGE, "无视 10% 防御。", flat = mapOf("armorPen" to 0.10)),
        tl("t_lifesteal_up", "嗜血", Rarity.RARE, School.VITA, "吸血 +8%。", flat = mapOf("lifesteal" to 8.0)),

        // ===== 凡庸 =====
        tl("t_atk_s", "力量", Rarity.COMMON, School.EDGE, "攻击 +6%。", mods = mapOf("atk" to 0.06)),
        tl("t_matk_s", "智力", Rarity.COMMON, School.ARC, "法强 +6%。", mods = mapOf("matk" to 0.06)),
        tl("t_def_s", "护体", Rarity.COMMON, School.WARD, "防御 +6%。", mods = mapOf("def" to 0.06)),
        tl("t_hp_s", "壮硕", Rarity.COMMON, School.VITA, "最大生命 +7%。", mods = mapOf("maxHp" to 0.07)),
        tl("t_crit_s", "专注", Rarity.COMMON, School.FATE, "暴击 +4%。", mods = mapOf("crit" to 4.0)),
        tl("t_dodge_s", "灵巧", Rarity.COMMON, School.FATE, "闪避 +4%。", mods = mapOf("dodge" to 4.0)),
        tl("t_flat_atk", "锋利石", Rarity.COMMON, School.EDGE, "攻击 +12。", flat = mapOf("atk" to 12.0)),
        tl("t_flat_matk", "能量石", Rarity.COMMON, School.ARC, "法强 +12。", flat = mapOf("matk" to 12.0)),
        tl("t_flat_hp", "生命石", Rarity.COMMON, School.VITA, "最大生命 +80。", flat = mapOf("maxHp" to 80.0)),
        tl("t_flat_def", "守护石", Rarity.COMMON, School.WARD, "防御 +8。", flat = mapOf("def" to 8.0)),
        tl("t_gold_find", "贪婪", Rarity.COMMON, School.FATE, "遭遇战金币收益 +20%。", passive = "gold_find"),
        tl("t_xp_up", "领悟", Rarity.COMMON, School.FATE, "经验获取 +20%。", passive = "xp_up"),
        tl("t_dmg_s", "战技", Rarity.COMMON, School.EDGE, "造成增伤 +5%。", mods = mapOf("dmgBonus" to 0.05)),
        tl("t_red_s", "韧性", Rarity.COMMON, School.WARD, "受到伤害 -4%。", mods = mapOf("dmgReduction" to 0.04)),
        tl("t_heal_s", "怜悯", Rarity.COMMON, School.VITA, "治疗效果 +15%。", flat = mapOf("healPower" to 0.15)),

        // ===== 扩展天赋池 =====
        tl("t_world_breaker", "破界者", Rarity.MYTHIC, School.EDGE, "攻击与法强 +28%，无视 30% 防御。",
            mods = mapOf("atk" to 0.28, "matk" to 0.28), flat = mapOf("armorPen" to 0.30)),
        tl("t_eternal_ward", "永恒守望", Rarity.MYTHIC, School.WARD, "受到伤害 -22%，每回合回复 3% 最大生命。",
            mods = mapOf("dmgReduction" to 0.22), passive = "regen3"),
        tl("t_executioner", "处刑人", Rarity.LEGENDARY, School.EDGE, "对生命低于 35% 的敌人增伤 +60%。", passive = "execute"),
        tl("t_blood_rain", "血雨", Rarity.LEGENDARY, School.VITA, "吸血 +20%，最大生命 +15%。",
            mods = mapOf("maxHp" to 0.15), flat = mapOf("lifesteal" to 20.0)),
        tl("t_arcane_resonance", "奥能谐振", Rarity.LEGENDARY, School.ARC, "战技增伤 +22%，能量回复 +6。",
            mods = mapOf("dmgBonus" to 0.22), flat = mapOf("energyRegen" to 6.0)),
        tl("t_iron_body", "铁躯", Rarity.EPIC, School.WARD, "防御 +18%，状态抗性 +25。",
            mods = mapOf("def" to 0.18), flat = mapOf("statusRes" to 25.0)),
        tl("t_wild_instinct", "野性直觉", Rarity.EPIC, School.FATE, "闪避 +12%，暴击 +8%。",
            mods = mapOf("dodge" to 12.0, "crit" to 8.0)),
        tl("t_soul_armor", "灵魂护甲", Rarity.EPIC, School.VITA, "最大生命 +15%，护盾效果 +30%。",
            mods = mapOf("maxHp" to 0.15), flat = mapOf("shieldPower" to 0.30)),
        tl("t_venom_edge", "毒刃", Rarity.EPIC, School.EDGE, "攻击 +12%，无视 12% 防御。",
            mods = mapOf("atk" to 0.12), flat = mapOf("armorPen" to 0.12)),
        tl("t_hp_flat", "坚石", Rarity.RARE, School.VITA, "最大生命 +110。", flat = mapOf("maxHp" to 110.0)),
        tl("t_atk_flat", "锐锋", Rarity.RARE, School.EDGE, "攻击 +18。", flat = mapOf("atk" to 18.0)),
        tl("t_matk_flat", "秘银", Rarity.RARE, School.ARC, "法强 +18。", flat = mapOf("matk" to 18.0)),
        tl("t_def_flat", "重甲", Rarity.RARE, School.WARD, "防御 +10。", flat = mapOf("def" to 10.0)),
        tl("t_critdmg_s", "精准", Rarity.RARE, School.FATE, "暴击增伤 +30%。", mods = mapOf("critDmg" to 30.0)),
        tl("t_hp_xs", "血肉", Rarity.COMMON, School.VITA, "最大生命 +5%。", mods = mapOf("maxHp" to 0.05)),
        tl("t_def_xs", "护佑", Rarity.COMMON, School.WARD, "防御 +5%。", mods = mapOf("def" to 0.05)),
        tl("t_dodge_xs", "灵步", Rarity.COMMON, School.FATE, "闪避 +3%。", mods = mapOf("dodge" to 3.0)),
        tl("t_critdmg_xs", "锐利", Rarity.COMMON, School.FATE, "暴击增伤 +12%。", mods = mapOf("critDmg" to 12.0)),
        tl("t_regen_flat", "回复", Rarity.COMMON, School.VITA, "每回合回复 14 点生命。", flat = mapOf("hpRegen" to 14.0)),
        tl("t_energy_flat", "灵脉", Rarity.COMMON, School.ARC, "能量回复 +2。", flat = mapOf("energyRegen" to 2.0))
    )

    /** 全部天赋 = 基础表 + 扩充表 */
    val allTalents: List<Talent> = talents + Content2.extraTalents

    val hiddenTalents: List<Talent> = allTalents.filter { it.rarity == Rarity.HIDDEN }
    val normalTalents: List<Talent> = allTalents.filter { it.rarity != Rarity.HIDDEN }
    val talentById: Map<String, Talent> = allTalents.associateBy { it.id }
}
