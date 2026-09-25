package com.dshx.game.shidai.game

/** 佣兵专长。 */
class MercTrait(val id: String, val name: String, val desc: String, val statMod: Map<String, Double>)

/** 迭塔模式的 50 档难度。 */
class ClimbTier(val level: Int, val name: String, val desc: String, val enemyMul: Double, val tpMul: Double)

object Content2 {

    // ---------------------------------------------------------------- 佣兵专长

    val mercTraits = listOf(
        MercTrait("tr_blade", "锐锋专长", "攻击 +18%，暴击 +6%", mapOf("atk" to 0.18, "crit" to 6.0)),
        MercTrait("tr_guard", "磐壁专长", "防御 +25%，最大生命 +12%", mapOf("def" to 0.25, "maxHp" to 0.12)),
        MercTrait("tr_swift", "疾行专长", "闪避 +12%，能量回复 +4", mapOf("dodge" to 12.0)),
        MercTrait("tr_arcane", "星轨专长", "法强 +20%", mapOf("matk" to 0.20)),
        MercTrait("tr_vital", "生机专长", "最大生命 +22%", mapOf("maxHp" to 0.22)),
        MercTrait("tr_cruel", "残虐专长", "暴击增伤 +40%", mapOf("critDmg" to 40.0)),
        MercTrait("tr_leech", "汲血专长", "吸血 +12%", emptyMap()),
        MercTrait("tr_keen", "鹰目专长", "暴击 +12%", mapOf("crit" to 12.0))
    )

    val traitById: Map<String, MercTrait> = mercTraits.associateBy { it.id }

    // ---------------------------------------------------------------- 精锐怪与首领立绘

    val eliteAvatars = listOf("e01", "e02", "e03", "e04", "e05", "e06", "e07", "e08")
    val bossAvatars = listOf("b01", "b02", "b03", "b04", "b05", "b06", "b07", "b08", "b09", "b10", "b11", "b12")
    val monsterAvatars = (1..86).map { "m" + it.toString().padStart(2, '0') }
    /**
     * 伙伴立绘池，按「语音性别」分成两组。
     * 旧实现是 12 张男女混在一起随机抽，和职阶语音性别无关 ——
     * 男声的森语者伙伴会抽到少女立绘（真机反馈过）。cp02 是中性少年，两组都可出现。
     */
    val companionAvatarsFemale = listOf("cp01", "cp02", "cp04", "cp06", "cp07", "cp08", "cp09", "cp11")
    val companionAvatarsMale = listOf("cp02", "cp03", "cp05", "cp10", "cp12")

    /** 出男声的职阶（其余按女声处理），与 Audio.voiceProfile 的取向一一对应。 */
    private val maleVoiceClasses = setOf("warrior", "vampire")

    /** 按职阶语音性别取一张伙伴立绘。 */
    fun companionAvatarFor(classId: String): String =
        (if (classId in maleVoiceClasses) companionAvatarsMale else companionAvatarsFemale).random()

    // ---------------------------------------------------------------- 章节首领机制

    class ChapterMechanic(val chapter: Int, val name: String, val desc: String)

    val chapterMechanics = listOf(
        ChapterMechanic(1, "壁垒结界", "首领开场获得 25% 最大生命护盾。"),
        ChapterMechanic(2, "永续再生", "首领每回合回复 4% 最大生命。"),
        ChapterMechanic(3, "双王同临", "首领战出现两名首领（各自生命较低）。"),
        ChapterMechanic(4, "暴走化", "首领攻击 +30%，暴击 +15%。"),
        ChapterMechanic(5, "虚渊侵蚀", "首领无视 30% 防御，暴击 +15%。"),
        ChapterMechanic(6, "终末形态", "首领获得护盾、再生，控制抗性大幅提高。")
    )

    fun chapterOf(floorNum: Int): Int = (floorNum / 10).coerceIn(0, 6)

    fun mechanicFor(floorNum: Int): ChapterMechanic? {
        val c = floorNum / 10
        if (c < 1 || floorNum % 10 != 0) return null
        return chapterMechanics[(c - 1).coerceIn(0, chapterMechanics.size - 1)]
    }

    // ---------------------------------------------------------------- 迭塔 50 档

    val climbTiers: List<ClimbTier> = (1..50).map { lv ->
        val mul = 2.0 + 0.1 * lv
        val (name, desc) = when {
            lv == 50 -> "双王终局" to "最终战双首领，首领攻击 +20%。"
            lv == 49 -> "终局护城" to "最终首领开场护盾 25%。"
            lv == 30 -> "精锐再生" to "精锐与首领每回合回复 2% 生命。"
            lv == 25 -> "护甲精通" to "敌人防御 +25%。"
            lv == 20 -> "咒术抗性" to "敌人状态抗性 +20。"
            lv == 15 -> "资源紧缩" to "遭遇战金币收益 -10%。"
            lv == 10 -> "群落异化" to "敌人额外获得 1 条词缀。"
            lv == 5 -> "抗性训练" to "敌人状态抗性 +10。"
            lv == 2 -> "生机锻铸" to "敌人生命 +5%。"
            lv % 5 == 0 -> "凶暴" to "敌人攻击 +5%。"
            else -> "试炼" to "敌人面板小幅提升。"
        }
        ClimbTier(lv, name, desc, mul, mul)
    }

    // ---------------------------------------------------------------- 守塔剧情（每 10 层）

    private fun c(label: String, detail: String, kind: String, gold: Int = 0, amount: Double = 0.0, key: String = "") =
        EventChoice(label, detail, kind, gold, amount, key)

    val storyEvents = listOf(
        GameEvent("story_10", "回廊守望·烬", "🕯", "第十层的回廊守望只剩半具躯壳，他把三样东西推到你面前。",
            choices = listOf(
                c("承接神火", "攻击与法强永久 +12", "train_atk", amount = 12.0),
                c("承接神核", "最大生命永久 +70", "train_hp", amount = 70.0),
                c("承接遗物", "获得一件灿烂装备", "loot_epic")
            )),
        GameEvent("story_20", "回廊守望·铭", "🕯", "石壁刻满了历代挑战者的名字，最下方一行还空着。",
            choices = listOf(
                c("刻下战意", "下一场遭遇战增伤 +50%", "buff_dmg", amount = 0.50),
                c("刻下磐垒", "防御永久 +10", "train_def", amount = 10.0),
                c("刻下贪欲", "获得 140 金币", "gold_fixed", amount = 140.0)
            )),
        GameEvent("story_30", "回廊守望·默", "🕯", "他不再说话，只是把一柄断剑插进地面。",
            choices = listOf(
                c("拾起断剑", "获得一件辉耀装备", "loot_legendary"),
                c("折断剑柄", "获得 2 点战技点", "skill_point", amount = 2.0),
                c("绕行而过", "全队满血满能量", "full_restore")
            )),
        GameEvent("story_40", "回廊守望·响", "🕯", "空洞的声音从四面八方传来：你已走过太远。",
            choices = listOf(
                c("回应回响", "全面板 +10%（本场景）", "train_all", amount = 0.10),
                c("击碎回响", "下一场遭遇战增伤 +60%", "buff_dmg", amount = 0.60),
                c("聆听回响", "获得 3 点战技点", "skill_point", amount = 3.0)
            )),
        GameEvent("story_50", "回廊守望·终", "🕯", "塔顶的风带着神的气息，他终于抬起头看你。",
            choices = listOf(
                c("接受加冕", "全面板 +18%（本场景）", "train_all", amount = 0.18),
                c("拒绝神性", "获得 400 金币与一件灿烂装备", "time_rift"),
                c("献上一切", "最大生命永久 +200，生命 -30%（立即）", "story_sacrifice")
            )),
        GameEvent("story_60", "回廊守望·无名", "🕯", "他已没有名字，只剩塔还记着他。",
            choices = listOf(
                c("继承名号", "攻击与法强永久 +25", "train_atk", amount = 25.0),
                c("书写己名", "获得 4 点战技点", "skill_point", amount = 4.0),
                c("合上名册", "全队满血满能量并获得 200 金币", "story_rest")
            ))
    )

    fun storyFor(floorNum: Int): GameEvent? {
        if (floorNum % 10 != 0) return null
        val idx = (floorNum / 10 - 1).coerceAtLeast(0) % storyEvents.size
        return storyEvents[idx]
    }

    // ---------------------------------------------------------------- 扩充事件

    val extraEvents = listOf(
        GameEvent("evt_pilgrim", "远行者", "🧝", "一位独行的远行者向你伸出手。", weight = 10, choices = listOf(
            c("施舍金币", "花费 40 金币，全队恢复 30% 生命并获得祝福（增伤 +15%）", "buff_dmg", gold = 40, amount = 0.15),
            c("与他同行", "获得 1 点战技点", "skill_point", amount = 1.0),
            c("婉拒", "继续赶路", "none")
        )),
        GameEvent("evt_moonwell", "月影井", "🌙", "井水倒映着不属于此世的月亮。", weight = 10, choices = listOf(
            c("饮下井水", "最大生命 +15%（本场景），但损失 10% 当前生命", "moon_well"),
            c("投入硬币", "花费 30 金币，获得 1 个随机道具", "get_random_item", gold = 30),
            c("打捞井底", "获得 60 金币", "gold_fixed", amount = 60.0)
        )),
        GameEvent("evt_weapon_rack", "弃置兵架", "🗡", "架子上还插着几把没生锈的兵刃。", weight = 11, choices = listOf(
            c("挑选兵刃", "获得一件装备", "loot_random"),
            c("拆解零件", "随机装备锻铸 +1", "enhance_random", amount = 1.0),
            c("熔成金锭", "获得 45 金币", "gold_fixed", amount = 45.0)
        )),
        GameEvent("evt_oracle", "无目预言者", "👁", "先知的眼睛被布条缠着，却能叫出你的名字。", minFloor = 8, weight = 9, choices = listOf(
            c("询问命途", "下一场遭遇战增伤 +35%", "buff_dmg", amount = 0.35),
            c("询问弱点", "下一场遭遇战无视 25% 防御", "oracle_pen"),
            c("献上金币", "花费 80 金币，全队法强永久 +18", "train_matk", gold = 80, amount = 18.0)
        )),
        GameEvent("evt_arena", "地下竞技场", "🏟", "戴着铁面铠的庄家向你招手。", minFloor = 10, weight = 9, choices = listOf(
            c("挑战冠军", "下一场遭遇战变为精锐战，胜利额外 +120 金币", "bounty_elite"),
            c("押注自己", "花费 70 金币，胜利后获得 200 金币", "arena_bet", gold = 70),
            c("观察赛制", "下一场遭遇战闪避 +15%", "arena_dodge")
        )),
        GameEvent("evt_soul_forge", "魂火熔炉", "🔥", "炉中燃烧的并非火焰，而是被抽离的记忆。", minFloor = 12, weight = 8, choices = listOf(
            c("投入记忆", "攻击 +20，最大生命 -40", "soul_forge_atk"),
            c("投入鲜血", "最大生命 +120，当前生命 -25%", "soul_forge_hp"),
            c("熄灭炉火", "获得 90 金币", "gold_fixed", amount = 90.0)
        )),
        GameEvent("evt_wandering_sage", "浪游智者", "📖", "贤者翻开书页，上面写着你尚未做出的选择。", minFloor = 15, weight = 8, choices = listOf(
            c("请教战技", "获得 2 点战技点", "skill_point", amount = 2.0),
            c("请教哲理", "全面板 +6%（本场景）", "train_all", amount = 0.06),
            c("请教财富", "获得 110 金币", "gold_fixed", amount = 110.0)
        )),
        GameEvent("evt_cursed_chest", "咒印宝箱", "☠", "箱盖上刻着：代价与馈赠等价。", minFloor = 12, weight = 8, choices = listOf(
            c("打开宝箱", "获得紫装，最大生命 -12%", "loot_relic"),
            c("净化后开启", "花费 100 金币，获得紫装且无副作用", "loot_epic_paid", gold = 100),
            c("砸碎宝箱", "获得 50 金币", "gold_fixed", amount = 50.0)
        )),
        GameEvent("evt_star_shrine", "曜辉祭坛", "✨", "祭坛上的星图缓缓旋转。", minFloor = 18, weight = 8, choices = listOf(
            c("镶嵌曜辉", "全队暴击 +8%（本场景）", "star_crit"),
            c("点缀星轨", "全队能量回复 +6（永久）", "star_energy"),
            c("摘取星辰", "获得一件灿烂装备", "loot_epic")
        )),
        GameEvent("evt_blood_altar", "绯绯祭坛", "🩸", "石槽里还残留着未干的血。", minFloor = 16, weight = 8, choices = listOf(
            c("献上鲜血", "攻击与法强 +18%，最大生命 -15%", "blood_altar"),
            c("献上金币", "花费 130 金币，全面板 +10%（本场景）", "train_all", gold = 130, amount = 0.10),
            c("摧毁祭台", "获得 70 金币", "gold_fixed", amount = 70.0)
        )),
        GameEvent("evt_mercenary_camp", "岚射手营地", "⛺", "几个佣兵正在擦拭兵刃，看起来缺钱。", minFloor = 4, weight = 11, choices = listOf(
            c("雇佣一名", "打开佣兵招募", "open_tavern"),
            c("买下补给", "花费 60 金币，获得 2 个随机道具", "get_random_item", gold = 60, amount = 2.0),
            c("打听情报", "下一场遭遇战增伤 +20%", "buff_dmg", amount = 0.20)
        )),
        GameEvent("evt_trap_corridor", "机关长廊", "⚠", "地砖上密布着新旧不一的血迹。", weight = 10, choices = listOf(
            c("强行突破", "损失 15% 当前生命，获得 100 金币", "trap_break"),
            c("仔细排查", "花费 30 金币，安全通过并获得一件装备", "loot_random", gold = 30),
            c("绕道而行", "全队恢复 20% 生命", "heal_all", amount = 0.20)
        )),
        GameEvent("evt_echoing_hall", "余响大厅", "🔊", "你每走一步，大厅都在重复你的脚步。", minFloor = 20, weight = 8, choices = listOf(
            c("大声呐喊", "下一场遭遇战增伤 +45%", "buff_dmg", amount = 0.45),
            c("屏息前行", "闪避 +20%（本场景）", "hall_dodge"),
            c("聆听回音", "获得 2 点战技点", "skill_point", amount = 2.0)
        )),
        GameEvent("evt_alchemy_lab", "弃置炼金室", "⚗", "试管里还冒着一丝未散尽的烟。", minFloor = 14, weight = 8, choices = listOf(
            c("饮下药水", "随机获得一项强力增益或伤害", "alchemy_gamble"),
            c("收集材料", "获得 3 个随机道具", "get_random_item", amount = 3.0),
            c("翻找笔记", "获得 1 点战技点与 40 金币", "skill_gold")
        )),
        GameEvent("evt_dragon_hoard", "龙骸遗窟", "💎", "巨龙的骨架下堆积着未化的珍宝。", minFloor = 30, weight = 7, choices = listOf(
            c("搬走宝藏", "获得 220 金币", "gold_fixed", amount = 220.0),
            c("取走龙鳞", "获得一件辉耀装备", "loot_legendary"),
            c("汲取龙血", "最大生命永久 +150", "train_hp", amount = 150.0)
        )),
        GameEvent("evt_void_rift", "虚渊裂隙", "🕳", "裂隙深处传来无法理解的低语。", minFloor = 35, weight = 7, choices = listOf(
            c("凝视裂隙", "全面板 +15%（本场景），受到增伤 +10%（本场景）", "void_gaze"),
            c("投入装备", "随机装备额外获得 2 条词缀", "enchant_random"),
            c("封印裂隙", "获得 3 点战技点", "skill_point", amount = 3.0)
        )),
        GameEvent("evt_goddess_tears", "圣女泪泉", "💧", "泉水是温热的，像眼泪一样。", minFloor = 25, weight = 8, choices = listOf(
            c("沐浴泉水", "全队满血并获得 60 金币", "mourn"),
            c("收集泪珠", "获得一件灿烂装备", "loot_epic"),
            c("祈祷", "全队最大生命 +20%（本场景）", "buff_hp", amount = 0.20)
        ))
    )

    // ---------------------------------------------------------------- 扩充道具

    val extraItems = listOf(
        ItemDef("revive_scroll", "苏生卷轴", "📜", "复活一名战殁队友并恢复 50% 生命", 120, 4),
        ItemDef("power_elixir", "锐力药剂", "🧨", "3 回合内攻击与法强 +40%", 70, 9),
        ItemDef("iron_elixir", "磐壁药剂", "🛡", "3 回合内防御 +60%", 65, 9),
        ItemDef("swift_elixir", "迅风药剂", "🌀", "3 回合内闪避 +25%", 60, 9),
        ItemDef("vampire_elixir", "汲血药剂", "🩸", "3 回合内吸血 +35%", 75, 8),
        ItemDef("purge_scroll", "涤罪卷轴", "🌿", "移除全队所有减益", 70, 10),
        ItemDef("stasis_orb", "凝滞宝珠", "🔮", "对全体敌人造成其 18% 最大生命伤害并降低其攻击 20%", 110, 6),
        ItemDef("star_fragment", "曜辉残片", "💠", "立刻获得 1 次神格觉醒（本轮）", 150, 3),
        // v1.6.0 扩充：和已有道具错开定位（爆发能量 / 团队增益 / 长持续回复）
        ItemDef("war_brew", "破军药剂", "⚔", "3 回合内全队攻击 +45%", 80, 8),
        ItemDef("thorn_scroll", "荆棘卷轴", "🌵", "全队立刻回复 15% 生命，并吸血 +25% 持续 3 回合", 70, 9),
        ItemDef("gale_potion", "疾风药剂", "🌪", "全队立刻回复 45 能量，闪避 +18% 持续 3 回合", 60, 10),
        ItemDef("mithril_bandage", "秘银绷带", "🩹", "全队每回合回复 7% 生命，持续 4 回合", 55, 10),
        ItemDef("star_brew", "星辉药剂", "🌟", "全队能量回满，并附加 25% 最大生命护盾", 95, 6)
    )

    // ---------------------------------------------------------------- 天赋扩充

    val extraTalents = listOf(
        // 辉耀
        Talent("t_executioner", "处刑者", Rarity.LEGENDARY, School.EDGE, "对生命低于 35% 的目标增伤 +60%。", passive = "executioner"),
        Talent("t_arcane_shield", "奥术护盾", Rarity.LEGENDARY, School.WARD, "每回合开始获得 8% 最大生命护盾。", passive = "turn_shield"),
        Talent("t_soul_echo", "灵魂回响", Rarity.LEGENDARY, School.ARC, "每次施放战技回复 6% 最大生命。", passive = "skill_heal"),
        Talent("t_blood_moon", "绯月", Rarity.LEGENDARY, School.VITA, "吸血 +25%，生命上限 +12%。", flatMod = mapOf("lifesteal" to 25.0), passive = null),
        Talent("t_war_god", "战神", Rarity.LEGENDARY, School.EDGE, "攻击 +20%，暴击 +12%，暴伤 +40%。", mapOf("atk" to 0.20, "crit" to 12.0, "critDmg" to 40.0)),
        Talent("t_arcane_master", "奥法宗师", Rarity.LEGENDARY, School.ARC, "法强 +22%，战技伤害额外 +15%。", mapOf("matk" to 0.22, "dmgBonus" to 0.15)),
        Talent("t_eternal_guard", "永恒守卫", Rarity.LEGENDARY, School.WARD, "防御 +25%，最大生命 +18%，减伤 +8%。", mapOf("def" to 0.25, "maxHp" to 0.18, "dmgReduction" to 0.08)),
        Talent("t_fate_weaver", "织命者", Rarity.LEGENDARY, School.FATE, "闪避 +20%，暴击 +10%，能量回复 +6。", mapOf("dodge" to 20.0, "crit" to 10.0), flatMod = mapOf("energyRegen" to 6.0)),

        // 灿烂
        Talent("t_hunter", "猎手", Rarity.EPIC, School.EDGE, "对精锐与首领增伤 +18%。", passive = "elite_hunter"),
        Talent("t_medic", "急救专家", Rarity.EPIC, School.VITA, "治疗效果 +30%，每回合回复 1% 生命。", flatMod = mapOf("healPower" to 0.30), passive = "regen1"),
        Talent("t_haste", "急速", Rarity.EPIC, School.FATE, "能量回复 +7。", flatMod = mapOf("energyRegen" to 7.0)),
        Talent("t_thorn_mail", "棘刺甲", Rarity.EPIC, School.WARD, "受到伤害 -10%，反弹 12% 伤害。", mapOf("dmgReduction" to 0.10), passive = "thorns_small"),
        Talent("t_mana_burn", "燃魔", Rarity.EPIC, School.ARC, "灼烧与中毒增伤 +80%。", passive = "dot_boost"),
        Talent("t_combo", "连击", Rarity.EPIC, School.FATE, "每回合首次普攻额外造成 60% 伤害。", passive = "first_strike"),
        Talent("t_bulwark2", "重盾", Rarity.EPIC, School.WARD, "护盾效果 +30%，防御 +12%。", mapOf("def" to 0.12), flatMod = mapOf("shieldPower" to 0.30)),
        Talent("t_ambush", "伏击", Rarity.EPIC, School.FATE, "进入遭遇战首回合增伤 +100%。", passive = "ambush"),
        Talent("t_last_stand", "背水一战", Rarity.EPIC, School.EDGE, "生命越低伤害越高（最多 +50%）。", passive = "last_stand"),
        Talent("t_arcane_focus", "奥术专注", Rarity.EPIC, School.ARC, "法强 +16%，无视 10% 防御。", mapOf("matk" to 0.16), flatMod = mapOf("armorPen" to 0.10)),
        Talent("t_giant", "巨人之躯", Rarity.EPIC, School.VITA, "最大生命 +25%，防御 +8%。", mapOf("maxHp" to 0.25, "def" to 0.08)),
        Talent("t_duelist", "决斗者", Rarity.EPIC, School.EDGE, "攻击 +14%，闪避 +10%。", mapOf("atk" to 0.14, "dodge" to 10.0)),

        // 精巧
        Talent("t_atk_r2", "锐锋", Rarity.RARE, School.EDGE, "攻击 +10%，暴击 +4%。", mapOf("atk" to 0.10, "crit" to 4.0)),
        Talent("t_matk_r2", "秘典", Rarity.RARE, School.ARC, "法强 +10%，能量回复 +3。", mapOf("matk" to 0.10), flatMod = mapOf("energyRegen" to 3.0)),
        Talent("t_def_r2", "铁甲", Rarity.RARE, School.WARD, "防御 +10%，最大生命 +6%。", mapOf("def" to 0.10, "maxHp" to 0.06)),
        Talent("t_hp_r2", "坚韧体魄", Rarity.RARE, School.VITA, "最大生命 +14%，每回合回复 12 生命。", mapOf("maxHp" to 0.14), flatMod = mapOf("hpRegen" to 12.0)),
        Talent("t_critdmg_r2", "致命一击", Rarity.RARE, School.FATE, "暴击增伤 +35%。", mapOf("critDmg" to 35.0)),
        Talent("t_dodge_r2", "风影", Rarity.RARE, School.FATE, "闪避 +10%，能量回复 +2。", mapOf("dodge" to 10.0), flatMod = mapOf("energyRegen" to 2.0)),
        Talent("t_shield_r2", "护盾锻铸", Rarity.RARE, School.WARD, "护盾效果 +25%。", flatMod = mapOf("shieldPower" to 0.25)),
        Talent("t_heal_r2", "治愈之手", Rarity.RARE, School.VITA, "治疗效果 +25%。", flatMod = mapOf("healPower" to 0.25)),
        Talent("t_gold_r2", "寻宝", Rarity.RARE, School.FATE, "遭遇战金币收益 +35%。", passive = "gold_find2"),
        Talent("t_exp_r2", "博学", Rarity.RARE, School.FATE, "经验获取 +35%。", passive = "xp_up2"),

        // 凡庸
        Talent("t_atk_c2", "蛮力", Rarity.COMMON, School.EDGE, "攻击 +5%。", mapOf("atk" to 0.05)),
        Talent("t_matk_c2", "灵光", Rarity.COMMON, School.ARC, "法强 +5%。", mapOf("matk" to 0.05)),
        Talent("t_def_c2", "硬皮", Rarity.COMMON, School.WARD, "防御 +5%。", mapOf("def" to 0.05)),
        Talent("t_hp_c2", "健壮", Rarity.COMMON, School.VITA, "最大生命 +6%。", mapOf("maxHp" to 0.06)),
        Talent("t_crit_c2", "敏锐", Rarity.COMMON, School.FATE, "暴击 +3%。", mapOf("crit" to 3.0)),
        Talent("t_flat_hp2", "生命宝石", Rarity.COMMON, School.VITA, "最大生命 +60。", flatMod = mapOf("maxHp" to 60.0)),
        Talent("t_flat_atk2", "锐石", Rarity.COMMON, School.EDGE, "攻击 +10。", flatMod = mapOf("atk" to 10.0)),
        Talent("t_flat_matk2", "魔石", Rarity.COMMON, School.ARC, "法强 +10。", flatMod = mapOf("matk" to 10.0)),
        Talent("t_flat_def2", "岩片", Rarity.COMMON, School.WARD, "防御 +6。", flatMod = mapOf("def" to 6.0)),
        Talent("t_resist_c", "抗性", Rarity.COMMON, School.WARD, "状态抗性 +10。", flatMod = mapOf("statusRes" to 10.0)),
        Talent("t_pen_c", "破防", Rarity.COMMON, School.EDGE, "无视 6% 防御。", flatMod = mapOf("armorPen" to 0.06))
    )
}
