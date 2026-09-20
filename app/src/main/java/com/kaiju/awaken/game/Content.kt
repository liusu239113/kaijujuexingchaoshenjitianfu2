package com.kaiju.awaken.game

class SlotDef(val id: String, val cn: String, val glyph: String, val mainKey: String, val mainMin: Double, val mainMax: Double)

class EnemyAffix(val id: String, val cn: String, val desc: String, val kind: String, val value: Double)

class SetDef(val id: String, val cn: String, val desc: String)

object Content {

    // ---------------------------------------------------------------- 敌人生成表

    val normalNames = listOf(
        "影狼", "骨弓手", "毒沼蛙人", "石铠守卫", "幽火术士", "骸骨骑士", "荆棘魔藤", "迷雾刺客",
        "熔岩蜥", "霜牙雪豹", "暗影蝠群", "铁颚食人魔", "腐叶树人", "碎星傀儡", "锈刃匪徒", "深渊爬行者"
    )

    val elitePrefix = listOf("狂化", "血纹", "虚影", "裂空", "灼炎", "寒铁", "深渊", "荆棘")

    val bossNames = listOf(
        "深渊领主·阿撒兹", "骸骨帝王·莫德雷", "熔岩巨像·伊格尼斯", "霜龙·涅瓦莉丝",
        "蜘蛛女王·阿拉克涅", "巫妖王·索伦提斯", "暗影君主·诺克提斯", "泰坦·盖亚核心",
        "剧毒龙皇·瓦兹拉", "虚空大君·恩底弥翁", "千面教皇·塞拉菲姆", "机械神躯·奥米加"
    )

    val enemyAffixes = listOf(
        EnemyAffix("enrage", "狂暴", "攻击 +25%", "atk", 0.25),
        EnemyAffix("bulwark", "铁壁", "防御 +30%", "def", 0.30),
        EnemyAffix("regen", "再生", "每回合回复 3% 生命", "regen", 0.03),
        EnemyAffix("swift", "迅捷", "闪避 +15%", "dodge", 15.0),
        EnemyAffix("thorns", "荆棘", "反弹 20% 伤害", "thorns", 0.20),
        EnemyAffix("drain", "吸魂", "吸血 20%", "lifesteal", 20.0),
        EnemyAffix("warded", "咒抗", "状态抗性 +30", "resist", 30.0),
        EnemyAffix("shielded", "守护", "开场获得 25% 生命护盾", "shield", 0.25),
        EnemyAffix("lethal", "致命", "暴击 +20%", "crit", 20.0)
    )

    // ---------------------------------------------------------------- 装备

    val slots = listOf(
        SlotDef("weapon", "武器", "🗡", "atk", 8.0, 16.0),
        SlotDef("helmet", "头盔", "⛑", "maxHp", 18.0, 36.0),
        SlotDef("chest", "胸甲", "🛡", "def", 4.0, 9.0),
        SlotDef("amulet", "护符", "📿", "matk", 6.0, 13.0),
        SlotDef("ring", "戒指", "💍", "crit", 3.0, 7.0)
    )

    val slotById: Map<String, SlotDef> = slots.associateBy { it.id }

    val equipRarityMul = mapOf(
        Rarity.COMMON to 1.0, Rarity.RARE to 1.2, Rarity.EPIC to 1.4,
        Rarity.LEGENDARY to 1.6, Rarity.MYTHIC to 1.8, Rarity.HIDDEN to 2.0
    )

    val equipRarityAffix = mapOf(
        Rarity.COMMON to 0, Rarity.RARE to 1, Rarity.EPIC to 2,
        Rarity.LEGENDARY to 3, Rarity.MYTHIC to 4, Rarity.HIDDEN to 5
    )

    val namePrefix = listOf("星辉", "破晓", "虚空", "赤月", "苍雷", "霜寂", "幽兰", "琥珀", "绯樱", "银霜", "曜日", "碧落")
    val nameSuffix = mapOf(
        "weapon" to listOf("长剑", "太刀", "法杖", "战镰", "双刃"),
        "helmet" to listOf("头冠", "面具", "兜帽", "头盔"),
        "chest" to listOf("战甲", "法袍", "轻铠", "胸铠"),
        "amulet" to listOf("坠饰", "护符", "念珠", "星牌"),
        "ring" to listOf("指环", "戒印", "魂环", "契约戒")
    )

    val affixPool = listOf(
        Affix("atk", "攻击", 0.0), Affix("matk", "法强", 0.0), Affix("maxHp", "生命", 0.0),
        Affix("def", "防御", 0.0), Affix("crit", "暴击", 0.0), Affix("critDmg", "暴伤", 0.0),
        Affix("dodge", "闪避", 0.0), Affix("lifesteal", "吸血", 0.0), Affix("energyRegen", "回能", 0.0),
        Affix("hpRegen", "回血", 0.0)
    )

    val mechanicAffixes = listOf(
        Affix("m_double", "双重施法 15%", 0.15, true),
        Affix("m_combo", "连击叠层", 1.0, true),
        Affix("m_shield", "被动护盾 20%", 0.20, true),
        Affix("m_leech", "生命窃取 8%", 0.08, true),
        Affix("m_burst", "暴击爆裂 3%", 0.03, true),
        Affix("m_spread", "灼烧蔓延 20%", 0.20, true),
        Affix("m_kill", "击杀回能 +15", 15.0, true),
        Affix("m_riposte", "闪避反击 80%", 0.80, true)
    )

    val sets = listOf(
        SetDef("s_blade", "斩星之仪", "2 件：攻击 +12%，暴击 +8%"),
        SetDef("s_guard", "铁壁誓约", "2 件：防御 +18%，受到伤害 -8%"),
        SetDef("s_arcane", "奥法回廊", "2 件：法强 +14%，能量回复 +5"),
        SetDef("s_life", "生命摇篮", "2 件：最大生命 +16%，每回合回复 2%"),
        SetDef("s_fate", "命运纺线", "2 件：闪避 +10%，暴击伤害 +30%")
    )

    // ---------------------------------------------------------------- 道具

    val items = listOf(
        ItemDef("heal_potion", "恢复药水", "🧪", "恢复 40% 最大生命值", 30, 30),
        ItemDef("energy_potion", "能量药剂", "⚡", "恢复 50 点能量", 35, 25),
        ItemDef("shield_scroll", "护盾卷轴", "📜", "获得 30% 最大生命护盾", 45, 18),
        ItemDef("bomb", "爆裂弹", "💣", "对全体敌人造成其 12% 最大生命伤害", 55, 15),
        ItemDef("cleanse_potion", "净化药水", "✨", "移除自身所有减益", 35, 15),
        ItemDef("rage_potion", "狂暴药剂", "🔥", "3 回合内伤害 +30%", 65, 10),
        ItemDef("group_heal", "群疗卷轴", "💚", "全体队友恢复 20% 最大生命", 80, 8),
        ItemDef("hourglass", "时停沙漏", "⏳", "令全体敌人眩晕 1 回合", 95, 5)
    )

    val itemById: Map<String, ItemDef> = items.associateBy { it.id }

    // ---------------------------------------------------------------- 永久成长

    val growth = listOf(
        GrowthDef("g_hp", "生命强化", "每级 +12 最大生命", 2, 20),
        GrowthDef("g_atk", "攻击强化", "每级 +3 攻击", 2, 20),
        GrowthDef("g_matk", "法强强化", "每级 +3 法强", 2, 20),
        GrowthDef("g_def", "防御强化", "每级 +1 防御", 2, 20),
        GrowthDef("g_mythic_w", "天赋共鸣", "每级提升高稀有度天赋出现率", 5, 20),
        GrowthDef("g_pity", "保底加速", "每级降低保底所需抽数", 25, 5),
        GrowthDef("g_enhance", "强化上限", "装备强化上限 +1", 3, 10),
        GrowthDef("g_init_sp", "初始技能点", "开局技能点 +1", 10, 10)
    )

    val growthById: Map<String, GrowthDef> = growth.associateBy { it.id }

    fun growthCost(def: GrowthDef, current: Int): Int =
        (def.cost * (current + 1) * (current + 2) / 2)

    fun enhanceMax(perm: PermState): Int = 5 + perm.growthLevel("g_enhance")

    // ---------------------------------------------------------------- 随机事件

    private fun c(label: String, detail: String, kind: String, gold: Int = 0, amount: Double = 0.0, key: String = "") =
        EventChoice(label, detail, kind, gold, amount, key)

    val events = listOf(
        GameEvent("evt_merchant", "行商营地", "🛒", "披着斗篷的商人在篝火旁向你招手。", minFloor = 1, weight = 14, choices = listOf(
            c("购买神秘装备", "花费 70 金币获得一件装备", "buy_equip", gold = 70),
            c("购买战前增益", "花费 45 金币，下一场战斗伤害 +25%", "buff_dmg", gold = 45, amount = 0.25),
            c("礼貌离开", "什么也不做", "none")
        )),
        GameEvent("evt_blacksmith", "铁匠铺", "🔨", "炉火正旺，铁匠示意你把装备递过去。", weight = 12, choices = listOf(
            c("强化武器", "花费 60 金币，武器强化 +1", "enhance", gold = 60, key = "weapon"),
            c("强化防具", "花费 60 金币，胸甲强化 +1", "enhance", gold = 60, key = "chest"),
            c("离开", "保留金币", "none")
        )),
        GameEvent("evt_shrine", "荒野神龛", "⛩", "石像的眼窝里燃烧着幽蓝火焰。", weight = 12, choices = listOf(
            c("祈祷", "60% 获得攻击 +15%（3 场），40% 最大生命 -10%", "shrine_pray"),
            c("献上 70 金币", "必定获得攻击 +15%（3 场）", "buff_atk", gold = 70, amount = 0.15),
            c("不予理会", "转身离去", "none")
        )),
        GameEvent("evt_fountain", "生命之泉", "⛲", "泉水泛着微光，饮下便能治愈伤口。", weight = 12, choices = listOf(
            c("畅饮", "全队恢复 45% 最大生命", "heal_all", amount = 0.45),
            c("汲取能量", "全队恢复 100% 能量", "energy_all"),
            c("装瓶带走", "获得 2 瓶恢复药水", "get_item", key = "heal_potion", amount = 2.0)
        )),
        GameEvent("evt_gamble", "赌局", "🎲", "一名戴面具的赌徒摇着骰盅。", weight = 9, choices = listOf(
            c("押 50 金币", "50% 概率翻倍返还", "gamble", gold = 50),
            c("押 100 金币", "50% 概率翻倍返还", "gamble", gold = 100),
            c("拒绝", "赌徒耸了耸肩", "none")
        )),
        GameEvent("evt_training", "训练场", "🎯", "木桩与沙袋静静立在月光下。", weight = 12, choices = listOf(
            c("力量训练", "攻击与法强永久 +6", "train_atk", amount = 6.0),
            c("防御训练", "防御永久 +4", "train_def", amount = 4.0),
            c("耐力训练", "最大生命永久 +40", "train_hp", amount = 40.0)
        )),
        GameEvent("evt_campfire", "篝火", "🔥", "火焰噼啪作响，照亮疲惫的脸。", weight = 14, choices = listOf(
            c("围火休息", "全队恢复 35% 生命并回满能量", "rest"),
            c("烤制干粮", "全队最大生命 +12%（本场景）", "buff_hp", amount = 0.12),
            c("擦拭武器", "下一场战斗伤害 +30%", "buff_dmg", amount = 0.30)
        )),
        GameEvent("evt_library", "废墟图书馆", "📚", "书架倒塌，仍有几卷完好的手札。", weight = 10, choices = listOf(
            c("研读战术手札", "获得 1 点技能点", "skill_point", amount = 1.0),
            c("抄录符文", "下一场战斗伤害 +25%", "buff_dmg", amount = 0.25),
            c("翻找暗格", "获得 35~60 金币", "gold_random", amount = 35.0)
        )),
        GameEvent("evt_hospital", "战地医院", "⛑", "帐篷里传出低沉的呻吟声。", weight = 11, choices = listOf(
            c("全力治疗", "花费 70 金币，全队满血满能量", "full_restore", gold = 70),
            c("简单包扎", "花费 40 金币，全队恢复 50% 生命", "heal_all", gold = 40, amount = 0.50),
            c("免费处理", "恢复 20% 生命", "heal_all", amount = 0.20)
        )),
        GameEvent("evt_bounty", "悬赏板", "📜", "木板钉满泛黄的通缉令。", weight = 10, choices = listOf(
            c("接下精英悬赏", "下一场战斗变为精英战，胜利额外 +90 金币与蓝装", "bounty_elite"),
            c("收集情报", "下一场战斗伤害 +25%，闪避 +10%", "bounty_intel"),
            c("撕下悬赏板", "获得 25 金币", "gold_fixed", amount = 25.0)
        )),
        GameEvent("evt_enchanter", "附魔师", "🔮", "老妇人指尖缠绕着细碎的符文光。", minFloor = 3, weight = 10, choices = listOf(
            c("为武器附魔", "花费 120 金币，武器额外获得 1 条词缀", "enchant", gold = 120, key = "weapon"),
            c("为护符附魔", "花费 120 金币，护符额外获得 1 条词缀", "enchant", gold = 120, key = "amulet"),
            c("婉拒", "老妇人收回手", "none")
        )),
        GameEvent("evt_arcane_merchant", "奥术商人", "🌌", "一团会说话的星云漂浮在你面前。", minFloor = 5, weight = 9, choices = listOf(
            c("购买奥术卷轴", "花费 90 金币，全队法强 +15%（本场景）", "train_matk", gold = 90, amount = 15.0),
            c("购买虚空石", "花费 90 金币，获得 1 个随机道具", "get_random_item", gold = 90),
            c("交换情报", "获得 45 金币", "gold_fixed", amount = 45.0)
        )),
        GameEvent("evt_treasury", "封印宝库", "🗝", "符文封印在触碰下碎裂。", minFloor = 10, weight = 8, choices = listOf(
            c("开启宝箱", "获得一件紫装", "loot_epic"),
            c("取走钱袋", "获得 80~120 金币", "gold_random", amount = 80.0),
            c("搬走补给", "获得 2~4 个随机道具", "get_random_item", amount = 3.0)
        )),
        GameEvent("evt_battlefield", "古战场", "⚔", "断裂的兵刃插满焦土。", minFloor = 15, weight = 8, choices = listOf(
            c("搜寻遗物", "获得一件蓝装，最大生命 -10%", "loot_relic"),
            c("悼念亡者", "全队恢复 40% 生命，获得 30 金币", "mourn"),
            c("收集残骸", "获得 55 金币", "gold_fixed", amount = 55.0)
        )),
        GameEvent("evt_divine_forge", "神圣锻炉", "🏵", "炉中流淌着不属于凡间的金焰。", minFloor = 25, weight = 7, choices = listOf(
            c("重铸装备", "花费 200 金币，随机装备强化 +2", "enhance_random", gold = 200, amount = 2.0),
            c("追加词缀", "花费 150 金币，随机装备额外获得 1 条词缀", "enchant_random", gold = 150),
            c("淬炼自身", "全属性 +8%（本场景）", "train_all", amount = 0.08)
        )),
        GameEvent("evt_talent_fragment", "天赋碎片", "💠", "空中悬浮着碎裂的觉醒结晶。", minFloor = 40, weight = 7, choices = listOf(
            c("吸收结晶", "获得 2 点技能点", "skill_point", amount = 2.0),
            c("淬炼属性", "攻击/法强 +10，防御 +6，生命 +50", "fragment_stats"),
            c("转化为经验", "获得大量经验", "fragment_exp")
        )),
        GameEvent("evt_immortal_throne", "不朽王座", "👑", "王座上残留着神的余温。", minFloor = 55, weight = 6, choices = listOf(
            c("坐上王座", "获得一件橙装（必带 2 条机制词缀）", "loot_legendary"),
            c("撬下宝石", "获得 150 金币", "gold_fixed", amount = 150.0),
            c("顶礼膜拜", "全属性 +12%（本场景）", "train_all", amount = 0.12)
        )),
        GameEvent("evt_time_rift", "时间裂隙", "⏳", "裂隙中流淌着尚未发生的时间。", minFloor = 20, weight = 7, choices = listOf(
            c("跃入裂隙", "获得 90 金币与一件紫装", "time_rift"),
            c("窥视未来", "下一场战斗伤害 +40%", "buff_dmg", amount = 0.40),
            c("封印裂隙", "获得 1 点技能点与 30 金币", "skill_gold")
        )),
        GameEvent("evt_crossroads", "迷雾岔路", "🌫", "两条路都被雾气吞没。", weight = 12, choices = listOf(
            c("走左边的光路", "全队恢复 30% 生命", "heal_all", amount = 0.30),
            c("走右边的暗路", "获得 40 金币", "gold_fixed", amount = 40.0),
            c("原地扎营", "下一场战斗伤害 +20%", "buff_dmg", amount = 0.20)
        )),
        GameEvent("evt_lost_cart", "失落的补给车", "🛞", "车轮陷在泥里，货箱半开着。", minFloor = 3, weight = 11, choices = listOf(
            c("搜刮物资", "获得 2 个随机道具", "get_random_item", amount = 2.0),
            c("寻找主人", "获得 1 点技能点", "skill_point", amount = 1.0),
            c("拆解车架", "获得 50 金币", "gold_fixed", amount = 50.0)
        )),
        GameEvent("evt_grove", "地下林地", "🌿", "发光的蘑菇照亮了地下溪谷。", minFloor = 4, weight = 11, choices = listOf(
            c("采摘草药", "全队恢复 40% 生命", "heal_all", amount = 0.40),
            c("砍伐古木", "获得一件蓝装，最大生命 -8%", "loot_relic"),
            c("静坐冥想", "法强永久 +8", "train_matk", amount = 8.0)
        )),
        GameEvent("evt_sealed_chest", "封印宝箱", "📦", "锁孔里透出微弱的蓝光。", minFloor = 6, weight = 12, choices = listOf(
            c("直接打开", "获得装备与一些金币", "loot_random"),
            c("撬锁赌一把", "押 50 金币，50% 概率翻倍", "gamble", gold = 50),
            c("不去碰它", "继续前进", "none")
        )),
        GameEvent("evt_wandering_monk", "云游武僧", "🧘", "老者闭目坐在断墙上。", minFloor = 8, weight = 10, choices = listOf(
            c("请求指点", "攻击与法强永久 +7", "train_atk", amount = 7.0),
            c("切磋一场", "下一场战斗伤害 +30%", "buff_dmg", amount = 0.30),
            c("静候身旁", "全队能量回满", "energy_all")
        )),
        GameEvent("evt_war_room", "作战室", "🗺", "桌上摊着这座塔的残缺地图。", minFloor = 5, weight = 10, choices = listOf(
            c("制定战术", "下一场战斗伤害 +25%", "buff_dmg", amount = 0.25),
            c("加固阵地", "全队恢复 25% 生命", "heal_all", amount = 0.25),
            c("检阅部队", "防御永久 +5", "train_def", amount = 5.0)
        )),
        GameEvent("evt_unstable_alchemy", "不稳定炼金", "⚗", "坩埚里的液体正在自行翻涌。", minFloor = 12, weight = 9, choices = listOf(
            c("购买成品药剂", "花费 90 金币，攻击与法强永久 +15", "train_atk", gold = 90, amount = 15.0),
            c("打翻药锅", "获得 1 个随机道具", "get_random_item", amount = 1.0),
            c("观察反应", "下一场战斗伤害 +20%", "buff_dmg", amount = 0.20)
        )),
        GameEvent("evt_blood_banner", "血旗", "🚩", "旗面吸饱了血，仍在无风中飘动。", minFloor = 15, weight = 8, choices = listOf(
            c("拔起血旗", "攻击与法强永久 +12", "train_atk", amount = 12.0),
            c("焚烧血旗", "全队恢复 30% 生命", "heal_all", amount = 0.30),
            c("绕道而行", "获得 45 金币", "gold_fixed", amount = 45.0)
        )),
        GameEvent("evt_ancient_tome", "远古典籍", "📖", "书页在自己翻动。", minFloor = 18, weight = 9, choices = listOf(
            c("研读典籍", "获得 2 点技能点", "skill_point", amount = 2.0),
            c("抄录符文", "获得大量经验", "fragment_exp"),
            c("撕下书页", "获得 60 金币", "gold_fixed", amount = 60.0)
        )),
        GameEvent("evt_star_altar", "星辰祭坛", "🌠", "祭坛上悬着一颗缓慢旋转的星核。", minFloor = 22, weight = 8, choices = listOf(
            c("献上 100 金币", "全属性提升 6%", "train_all", gold = 100, amount = 0.06),
            c("虔诚祈祷", "获得 1 技能点与 40 金币", "skill_gold"),
            c("触碰星核", "下一场战斗伤害 +35%", "buff_dmg", amount = 0.35)
        ))
    )

    val eventById: Map<String, GameEvent> = events.associateBy { it.id }

    // ---------------------------------------------------------------- 成就/图鉴文案

    val flavorTips = listOf(
        "共鸣：让同系天赋相邻，可结成共鸣链获得全局加成。",
        "神格位只能容纳超神级天赋，且永不掉落。",
        "第 10 回合后每回合伤害 +1%，持久战对双方都危险。",
        "每 5 层会额外获得一次觉醒机会。",
        "转生会把爬塔进度折算成天赋点，用于永久成长。",
        "精英与首领战时，注意保留控制技能打断敌方爆发。",
        "击败敌人可回复少量生命，连续击杀能滚起雪球。"
    )
}
