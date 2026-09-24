package com.dshx.game.shidai.game

class SlotDef(val id: String, val cn: String, val glyph: String, val mainKey: String, val mainMin: Double, val mainMax: Double)

class EnemyAffix(val id: String, val cn: String, val desc: String, val kind: String, val value: Double)

class SetDef(val id: String, val cn: String, val desc: String, val desc2: String = "")

object Content {

    // ---------------------------------------------------------------- 敌人生成表

    val normalNames = listOf(
        "暮影狼", "枯骨射手", "沼毒蛙兵", "岩铠卫士",
        "鬼火术者", "枯骨骑士", "棘刺妖藤", "雾隐杀手",
        "熔岩蜥兵", "霜齿雪豹", "暮影蝠群", "铁颚巨魔",
        "朽木树人", "碎星机偶", "锈刃劫徒", "虚渊爬虫",
        "咒缚巫女", "绯翼魅姬", "霜寂怨灵", "雷羽巨鸦",
        "沼泥巨鳄", "晶簇魔像", "噬魂巨蛛", "炼金异变体",
        "霜语女妖", "熔核魔像", "千眼邪树", "铁翼狮鹫",
        "虚渊行者", "雷纹狼王", "腐化圣像", "虚空掠食者",
    )

    val elitePrefix = listOf("暴走", "绯纹", "虚像", "裂空", "焚炎", "霜铁", "虚渊", "棘刺")

    val bossNames = listOf(
        "虚渊领主·涅索斯", "枯骨之王·塔洛斯", "焚岩巨兵·赫菲斯", "冰翼龙王·瑟兰缇",
        "织网女王·阿拉喀", "霜骨法王·瓦伦", "暮影君主·诺克斯", "古岩泰坦·奥格斯",
        "蚀毒龙皇·维兹拉", "终焉大君·恩底斯", "千面教皇·塞拉菲姆", "机械神躯·奥米加",
    )

    val eliteNames = listOf(
        "暗黑骑士", "狂化巨魔", "圣殿守卫", "死灵术士",
        "寒铁骑士", "血术士", "雷霆巨兵", "幻影刺客",
    )

    val enemyAffixes = listOf(
        EnemyAffix("enrage", "沸血", "攻击 +25%", "atk", 0.25),
        EnemyAffix("bulwark", "铁壁", "防御 +30%", "def", 0.30),
        EnemyAffix("regen", "再生", "每回合回复 3% 生命", "regen", 0.03),
        EnemyAffix("swift", "迅捷", "闪避 +15%", "dodge", 15.0),
        EnemyAffix("thorns", "棘刺", "反弹 20% 伤害", "thorns", 0.20),
        EnemyAffix("drain", "吸魂", "吸血 20%", "lifesteal", 20.0),
        EnemyAffix("warded", "咒抗", "状态抗性 +30", "resist", 30.0),
        EnemyAffix("shielded", "守护", "开场获得 25% 生命护盾", "shield", 0.25),
        EnemyAffix("lethal", "致命", "暴击 +20%", "crit", 20.0)
    )

    // ---------------------------------------------------------------- 装备

    val slots = listOf(
        SlotDef("weapon", "兵刃", "🗡", "atk", 8.0, 16.0),
        SlotDef("helmet", "覆面", "⛑", "maxHp", 18.0, 36.0),
        SlotDef("chest", "护铠", "🛡", "def", 4.0, 9.0),
        SlotDef("amulet", "坠饰", "📿", "matk", 6.0, 13.0),
        SlotDef("ring", "指环", "💍", "crit", 3.0, 7.0)
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

    val namePrefix = listOf(
        "曜辉", "晨曦", "虚渊", "绯月", "苍雷", "霜寂", "幽兰", "琥珀", "绯樱", "银霜",
        "曜日", "碧落", "烬火", "寒星", "暮影", "鸣泉", "岚羽", "陨铁", "流光", "星陨",
        "赤曜", "青冥", "白露", "玄冰", "紫电", "灼华", "寂夜", "破晓", "长歌", "无相"
    )

    // v1.2.0 扩充：每部位后缀 4~5 -> 8，名字组合从约 60 种涨到 240 种
    val nameSuffix = mapOf(
        "weapon" to listOf("长刃", "太刃", "星杖", "战镰", "双刃", "裂空刃", "断岳刀", "逐星枪"),
        "helmet" to listOf("冠冕", "面铠", "兜帽", "覆面", "龙盔", "星冠", "霜旌", "玄冕"),
        "chest" to listOf("战铠", "星袍", "轻铠", "胸铠", "龙鳞铠", "曜金甲", "冥铁衣", "云纹袍"),
        "amulet" to listOf("坠饰", "魂珠", "星牌", "命绳", "龙牙坠", "星辰链", "血玉牌", "幽兰佩"),
        "ring" to listOf("指环", "戒印", "魂环", "誓约戒", "龙纹戒", "星辉环", "血契戒", "幽影环")
    )

    val affixPool = listOf(
        Affix("atk", "攻击", 0.0), Affix("matk", "法强", 0.0), Affix("maxHp", "生命", 0.0),
        Affix("def", "防御", 0.0), Affix("crit", "暴击", 0.0), Affix("critDmg", "暴伤", 0.0),
        Affix("dodge", "闪避", 0.0), Affix("lifesteal", "吸血", 0.0), Affix("energyRegen", "回能", 0.0),
        Affix("hpRegen", "回血", 0.0),
        // v1.2.0 新增：这 6 条以前只能靠天赋/套装拿，现在装备也能堆
        Affix("statusRes", "状态抗性", 0.0), Affix("armorPen", "破甲", 0.0),
        Affix("shieldPower", "护盾强度", 0.0), Affix("healPower", "治疗强度", 0.0),
        Affix("dmgBonus", "增伤", 0.0), Affix("dmgReduction", "减伤", 0.0)
    )

    // 重要：下面每一条都在战斗里有真实实现（见 Battle.kt 的 m_* 与 Run.kt 的 applyEquip）。
    // 旧版这 8 条只显示不生效 —— 玩家看到「双重施法 15%」却什么也没发生。
    val mechanicAffixes = listOf(
        Affix("m_double", "双重施法 15%", 0.15, true),
        Affix("m_shield", "被动护盾 20%", 0.20, true),
        Affix("m_leech", "生命窃取 8%", 0.08, true),
        Affix("m_burst", "暴击爆裂 3%", 0.03, true),
        Affix("m_kill", "击杀回能 +15", 15.0, true),
        Affix("m_guard", "开场壁垒 15%", 0.15, true),
        Affix("m_haste", "开场回能 +25", 25.0, true)
    )

    // v1.2.0：5 套 -> 9 套，并补上 4 件套效果。
    // desc 是 2 件套 —— 要真的凑满 2 件才生效（见 RunService.applySetBonuses）。
    val sets = listOf(
        SetDef("s_blade", "裂星之仪", "2 件：攻击 +12%，暴击 +8%", "4 件：暴击伤害 +45%"),
        SetDef("s_guard", "磐壁誓约", "2 件：防御 +18%，受到伤害 -8%", "4 件：最大生命 +20%"),
        SetDef("s_arcane", "星轨回廊", "2 件：法强 +14%，能量回复 +5", "4 件：增伤 +20%"),
        SetDef("s_life", "生机摇篮", "2 件：最大生命 +16%，每回合回复 2%", "4 件：治疗强度 +35%"),
        SetDef("s_fate", "命途纺线", "2 件：闪避 +10%，暴击增伤 +30%", "4 件：闪避 +10%，暴伤 +30%"),
        SetDef("s_hunt", "逐星猎约", "2 件：攻击 +10%，破甲 +8%", "4 件：破甲 +10%"),
        SetDef("s_blood", "绯色血契", "2 件：吸血 +10%，攻击 +8%", "4 件：吸血 +8%，生命 +12%"),
        SetDef("s_frost", "霜寂守望", "2 件：防御 +14%，状态抗性 +20", "4 件：受到伤害 -10%"),
        SetDef("s_storm", "苍雷疾行", "2 件：能量回复 +7，闪避 +8%", "4 件：攻击 +15%")
    )

    // ---------------------------------------------------------------- 道具

    val items = listOf(
        ItemDef("heal_potion", "愈合药剂", "🧪", "恢复 40% 最大生命值", 30, 30),
        ItemDef("energy_potion", "充能药剂", "⚡", "恢复 50 点能量", 35, 25),
        ItemDef("shield_scroll", "织盾卷轴", "📜", "获得 30% 最大生命护盾", 45, 18),
        ItemDef("bomb", "爆裂弹丸", "💣", "对全体敌人造成其 12% 最大生命伤害", 55, 15),
        ItemDef("cleanse_potion", "涤净药剂", "✨", "移除自身所有减益", 35, 15),
        ItemDef("rage_potion", "沸血药剂", "🔥", "3 回合内增伤 +30%", 65, 10),
        ItemDef("group_heal", "群体疗愈卷轴", "💚", "全体队友恢复 20% 最大生命", 80, 8),
        ItemDef("hourglass", "凝时沙漏", "⏳", "令全体敌人眩晕 1 回合", 95, 5)
    )

    val allItems: List<ItemDef> = items + Content2.extraItems

    val itemById: Map<String, ItemDef> = allItems.associateBy { it.id }

    // ---------------------------------------------------------------- 轮回淬炼

    val growth = listOf(
        GrowthDef("g_hp", "生命淬炼", "每级 +12 最大生命值", 2, 20),
        GrowthDef("g_atk", "攻击淬炼", "每级 +3 攻击", 2, 20),
        GrowthDef("g_matk", "法强淬炼", "每级 +3 法强", 2, 20),
        GrowthDef("g_def", "防御淬炼", "每级 +1 防御", 2, 20),
        GrowthDef("g_mythic_w", "神格亲和", "每级提升高精巧度神格出现率", 5, 20),
        GrowthDef("g_pity", "保底推进", "每级降低保底所需抽数", 25, 5),
        GrowthDef("g_enhance", "锻铸上限", "装备锻铸上限 +1", 3, 10),
        GrowthDef("g_init_sp", "初始战技点X", "开局战技点 +1", 10, 10)
    )

    val growthById: Map<String, GrowthDef> = growth.associateBy { it.id }

    fun growthCost(def: GrowthDef, current: Int): Int =
        (def.cost * (current + 1) * (current + 2) / 2)

    fun enhanceMax(perm: PermState): Int = 5 + perm.growthLevel("g_enhance")

    // ---------------------------------------------------------------- 随机事件

    private fun c(label: String, detail: String, kind: String, gold: Int = 0, amount: Double = 0.0, key: String = "") =
        EventChoice(label, detail, kind, gold, amount, key)

    val events = listOf(
        GameEvent("evt_merchant", "游商营地", "🛒", "披着斗篷的商人在野营篝火旁向你招手。", minFloor = 1, weight = 14, choices = listOf(
            c("购入神秘装备", "花费 70 金币获得一件装备", "buy_equip", gold = 70),
            c("购入战前增益", "花费 45 金币，下一场遭遇战增伤 +25%", "buff_dmg", gold = 45, amount = 0.25),
            c("礼貌离开", "什么也不做", "none")
        )),
        GameEvent("evt_blacksmith", "锻造铺", "🔨", "炉火正旺，铁匠示意你把装备递过去。", weight = 12, choices = listOf(
            c("锻铸兵刃", "花费 60 金币，兵刃锻铸 +1", "enhance", gold = 60, key = "weapon"),
            c("锻铸防具", "花费 60 金币，护铠锻铸 +1", "enhance", gold = 60, key = "chest"),
            c("离开", "保留金币", "none")
        )),
        GameEvent("evt_shrine", "旷野神龛", "⛩", "石像的眼窝里燃烧着幽蓝火焰。", weight = 12, choices = listOf(
            c("祈祷", "60% 获得攻击 +15%（3 场），40% 最大生命 -10%", "shrine_pray"),
            c("献上 70 金币", "必定获得攻击 +15%（3 场）", "buff_atk", gold = 70, amount = 0.15),
            c("不予理会", "转身离去", "none")
        )),
        GameEvent("evt_fountain", "生机泉", "⛲", "泉水泛着微光，饮下便能治愈伤口。", weight = 12, choices = listOf(
            c("畅饮", "全队恢复 45% 最大生命", "heal_all", amount = 0.45),
            c("汲取能量", "全队恢复 100% 能量", "energy_all"),
            c("装瓶带走", "获得 2 瓶愈合药剂", "get_item", key = "heal_potion", amount = 2.0)
        )),
        GameEvent("evt_gamble", "掷骰赌局", "🎲", "一名戴面铠的赌徒摇着骰盅。", weight = 9, choices = listOf(
            c("押 50 金币", "50% 概率翻倍返还", "gamble", gold = 50),
            c("押 100 金币", "50% 概率翻倍返还", "gamble", gold = 100),
            c("拒绝", "赌徒耸了耸肩", "none")
        )),
        GameEvent("evt_training", "操练场", "🎯", "木桩与沙袋静静立在月光下。", weight = 12, choices = listOf(
            c("力量训练", "攻击与法强永久 +6", "train_atk", amount = 6.0),
            c("防御训练", "防御永久 +4", "train_def", amount = 4.0),
            c("耐力训练", "最大生命永久 +40", "train_hp", amount = 40.0)
        )),
        GameEvent("evt_campfire", "野营篝火", "🔥", "火焰噼啪作响，照亮疲惫的脸。", weight = 14, choices = listOf(
            c("围火休息", "全队恢复 35% 生命并回满能量", "rest"),
            c("烤制干粮", "全队最大生命 +12%（本场景）", "buff_hp", amount = 0.12),
            c("擦拭兵刃", "下一场遭遇战增伤 +30%", "buff_dmg", amount = 0.30)
        )),
        GameEvent("evt_library", "残卷书库", "📚", "书架倒塌，仍有几卷完好的手札。", weight = 10, choices = listOf(
            c("研读战术手札", "获得 1 点战技点", "skill_point", amount = 1.0),
            c("抄录符文", "下一场遭遇战增伤 +25%", "buff_dmg", amount = 0.25),
            c("翻找暗格", "获得 35~60 金币", "gold_random", amount = 35.0)
        )),
        GameEvent("evt_hospital", "野战医帐", "⛑", "帐篷里传出低沉的呻吟声。", weight = 11, choices = listOf(
            c("全力治疗", "花费 70 金币，全队满血满能量", "full_restore", gold = 70),
            c("简单包扎", "花费 40 金币，全队恢复 50% 生命", "heal_all", gold = 40, amount = 0.50),
            c("免费处理", "恢复 20% 生命", "heal_all", amount = 0.20)
        )),
        GameEvent("evt_bounty", "通缉木牌", "📜", "木板钉满泛黄的通缉令。", weight = 10, choices = listOf(
            c("接下精锐悬赏", "下一场遭遇战变为精锐战，胜利额外 +90 金币与蓝装", "bounty_elite"),
            c("收集情报", "下一场遭遇战增伤 +25%，闪避 +10%", "bounty_intel"),
            c("撕下通缉木牌", "获得 25 金币", "gold_fixed", amount = 25.0)
        )),
        GameEvent("evt_enchanter", "符文匠", "🔮", "老妇人指尖缠绕着细碎的符文光。", minFloor = 3, weight = 10, choices = listOf(
            c("为兵刃附魔", "花费 120 金币，兵刃额外获得 1 条词缀", "enchant", gold = 120, key = "weapon"),
            c("为坠饰附魔", "花费 120 金币，坠饰额外获得 1 条词缀", "enchant", gold = 120, key = "amulet"),
            c("婉拒", "老妇人收回手", "none")
        )),
        GameEvent("evt_arcane_merchant", "星轨商人", "🌌", "一团会说话的星云漂浮在你面前。", minFloor = 5, weight = 9, choices = listOf(
            c("购入奥术卷轴", "花费 90 金币，全队法强 +15%（本场景）", "train_matk", gold = 90, amount = 15.0),
            c("购入虚渊石", "花费 90 金币，获得 1 个随机道具", "get_random_item", gold = 90),
            c("交换情报", "获得 45 金币", "gold_fixed", amount = 45.0)
        )),
        GameEvent("evt_treasury", "封纹宝库", "🗝", "符文封印在触碰下碎裂。", minFloor = 10, weight = 8, choices = listOf(
            c("开启宝箱", "获得一件紫装", "loot_epic"),
            c("取走钱袋", "获得 80~120 金币", "gold_random", amount = 80.0),
            c("搬走补给", "获得 2~4 个随机道具", "get_random_item", amount = 3.0)
        )),
        GameEvent("evt_battlefield", "旧日战场", "⚔", "断裂的兵刃插满焦土。", minFloor = 15, weight = 8, choices = listOf(
            c("搜寻遗物", "获得一件蓝装，最大生命 -10%", "loot_relic"),
            c("悼念亡者", "全队恢复 40% 生命，获得 30 金币", "mourn"),
            c("收集残骸", "获得 55 金币", "gold_fixed", amount = 55.0)
        )),
        GameEvent("evt_divine_forge", "曜金锻炉", "🏵", "炉中流淌着不属于凡间的金焰。", minFloor = 25, weight = 7, choices = listOf(
            c("重铸装备", "花费 200 金币，随机装备锻铸 +2", "enhance_random", gold = 200, amount = 2.0),
            c("追加词缀", "花费 150 金币，随机装备额外获得 1 条词缀", "enchant_random", gold = 150),
            c("淬炼自身", "全面板 +8%（本场景）", "train_all", amount = 0.08)
        )),
        GameEvent("evt_talent_fragment", "神格残晶", "💠", "空中悬浮着碎裂的觉醒结晶。", minFloor = 40, weight = 7, choices = listOf(
            c("吸收结晶", "获得 2 点战技点", "skill_point", amount = 2.0),
            c("淬炼面板", "攻击/法强 +10，防御 +6，生命 +50", "fragment_stats"),
            c("转化为经验", "获得大量经验", "fragment_exp")
        )),
        GameEvent("evt_immortal_throne", "永存王座", "👑", "王座上残留着神的余温。", minFloor = 55, weight = 6, choices = listOf(
            c("坐上王座", "获得一件橙装（必带 2 条机制词缀）", "loot_legendary"),
            c("撬下宝石", "获得 150 金币", "gold_fixed", amount = 150.0),
            c("顶礼膜拜", "全面板 +12%（本场景）", "train_all", amount = 0.12)
        )),
        GameEvent("evt_time_rift", "时序裂隙", "⏳", "裂隙中流淌着尚未发生的时间。", minFloor = 20, weight = 7, choices = listOf(
            c("跃入裂隙", "获得 90 金币与一件紫装", "time_rift"),
            c("窥视未来", "下一场遭遇战增伤 +40%", "buff_dmg", amount = 0.40),
            c("封印裂隙", "获得 1 点战技点与 30 金币", "skill_gold")
        )),
        GameEvent("evt_crossroads", "迷雾岔路", "🌫", "两条路都被雾气吞没。", weight = 12, choices = listOf(
            c("走左边的光路", "全队恢复 30% 生命", "heal_all", amount = 0.30),
            c("走右边的暗路", "获得 40 金币", "gold_fixed", amount = 40.0),
            c("原地扎营", "下一场遭遇战增伤 +20%", "buff_dmg", amount = 0.20)
        )),
        GameEvent("evt_lost_cart", "失落的补给车", "🛞", "车轮陷在泥里，货箱半开着。", minFloor = 3, weight = 11, choices = listOf(
            c("搜刮物资", "获得 2 个随机道具", "get_random_item", amount = 2.0),
            c("寻找主人", "获得 1 点战技点", "skill_point", amount = 1.0),
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
            c("切磋一场", "下一场遭遇战增伤 +30%", "buff_dmg", amount = 0.30),
            c("静候身旁", "全队能量回满", "energy_all")
        )),
        GameEvent("evt_war_room", "作战室", "🗺", "桌上摊着这座塔的残缺地图。", minFloor = 5, weight = 10, choices = listOf(
            c("制定战术", "下一场遭遇战增伤 +25%", "buff_dmg", amount = 0.25),
            c("加固阵地", "全队恢复 25% 生命", "heal_all", amount = 0.25),
            c("检阅部队", "防御永久 +5", "train_def", amount = 5.0)
        )),
        GameEvent("evt_unstable_alchemy", "不稳定炼金", "⚗", "坩埚里的液体正在自行翻涌。", minFloor = 12, weight = 9, choices = listOf(
            c("购入成品药剂", "花费 90 金币，攻击与法强永久 +15", "train_atk", gold = 90, amount = 15.0),
            c("打翻药锅", "获得 1 个随机道具", "get_random_item", amount = 1.0),
            c("观察反应", "下一场遭遇战增伤 +20%", "buff_dmg", amount = 0.20)
        )),
        GameEvent("evt_blood_banner", "血旗", "🚩", "旗面吸饱了血，仍在无风中飘动。", minFloor = 15, weight = 8, choices = listOf(
            c("拔起血旗", "攻击与法强永久 +12", "train_atk", amount = 12.0),
            c("焚烧血旗", "全队恢复 30% 生命", "heal_all", amount = 0.30),
            c("绕道而行", "获得 45 金币", "gold_fixed", amount = 45.0)
        )),
        GameEvent("evt_ancient_tome", "远古典籍", "📖", "书页在自己翻动。", minFloor = 18, weight = 9, choices = listOf(
            c("研读典籍", "获得 2 点战技点", "skill_point", amount = 2.0),
            c("抄录符文", "获得大量经验", "fragment_exp"),
            c("撕下书页", "获得 60 金币", "gold_fixed", amount = 60.0)
        )),
        GameEvent("evt_star_altar", "曜辉祭坛", "🌠", "祭坛上悬着一颗缓慢旋转的星核。", minFloor = 22, weight = 8, choices = listOf(
            c("献上 100 金币", "全面板提升 6%", "train_all", gold = 100, amount = 0.06),
            c("虔诚祈祷", "获得 1 战技点与 40 金币", "skill_gold"),
            c("触碰星核", "下一场遭遇战增伤 +35%", "buff_dmg", amount = 0.35)
        ))
    )

    // 注意：storyEvents（每 10 层的「回廊守望」）也必须进表 ——
    // 旧版只拼了 extraEvents，导致：
    //   ① 存档只存事件 id，读档时 Content.eventById 查不到 story 事件 ->
    //      事件数据丢失，界面退化成空壳「回廊守望」，点「进入」还没反应，玩家彻底卡死；
    //   ② pickEvent 的随机池里永远抽不到守望事件，成就「聆听回廊」也拿不到。
    val allEvents: List<GameEvent> = events + Content2.extraEvents + Content2.storyEvents

    val eventById: Map<String, GameEvent> = allEvents.associateBy { it.id }

    // ---------------------------------------------------------------- 成就/图鉴文案

    val flavorTips = listOf(
        "共鸣：让同源神格相邻，即可结成共鸣链获得全局增益。",
        "神格位只能容纳曜神级神格，且永不被覆盖。",
        "第 10 回合后每回合增伤 +1%，持久战对双方都危险。",
        "每 5 层会额外获得一次觉醒机会。",
        "轮回会把迭塔进度折算为神格点，用于永久淬炼。",
        "精锐与首领战时，注意保留控制战技打断敌方爆发。",
        "击败敌人可回复少量生命，连续击杀能滚起雪球。"
    )
}
