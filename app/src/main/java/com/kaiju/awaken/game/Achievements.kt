package com.kaiju.awaken.game

/** 成就定义。kind 决定进度如何累计。 */
class AchDef(
    val id: String,
    val name: String,
    val desc: String,
    val kind: String,
    val target: Int,
    val dust: Int
)

object Achievements {

    val all: List<AchDef> = listOf(
        AchDef("ach_first", "初次拾语", "完成第一局轮回", "runs", 1, 20),
        AchDef("ach_runs10", "十度轮回", "累计完成 10 局", "runs", 10, 40),
        AchDef("ach_runs50", "轮回常客", "累计完成 50 局", "runs", 50, 120),
        AchDef("ach_f10", "拾级而上", "抵达第 10 层", "bestFloor", 10, 20),
        AchDef("ach_f30", "回廊初探", "抵达第 30 层", "bestFloor", 30, 40),
        AchDef("ach_f60", "长廊漫步", "抵达第 60 层", "bestFloor", 60, 60),
        AchDef("ach_f100", "深廊行者", "抵达第 100 层", "bestFloor", 100, 100),
        AchDef("ach_f150", "回廊之巅", "抵达第 150 层", "bestFloor", 150, 200),
        AchDef("ach_win_normal", "初阶通关", "通关初阶模式", "clear_normal", 1, 50),
        AchDef("ach_win_adv", "进阶通关", "通关进阶模式", "clear_adventure", 1, 80),
        AchDef("ach_win_hero", "试炼通关", "通关试炼模式", "clear_hero", 1, 130),
        AchDef("ach_win_king", "霸者通关", "通关霸者模式", "clear_king", 1, 200),
        AchDef("ach_res1", "初次共鸣", "单局达成 1 条共鸣边", "resEdge", 1, 15),
        AchDef("ach_res3", "三相共鸣", "单局达成 3 条共鸣边", "resEdge", 3, 40),
        AchDef("ach_res5", "神格回环", "单局达成 5 条共鸣边", "resEdge", 5, 120),
        AchDef("ach_chain5", "五连星语", "达成 5 连共鸣链", "chain", 5, 100),
        AchDef("ach_promote", "抉择之路", "完成一次转职", "promote", 1, 25),
        AchDef("ach_tier2", "终末形态", "完成一次二转", "tier2", 1, 70),
        AchDef("ach_allclass", "万象归一", "8 个职阶各通关一次", "classClear", 8, 250),
        AchDef("ach_star3", "三星耀世", "把一颗星语升到 3 星", "star3", 1, 40),
        AchDef("ach_star5", "满环皆星", "6 个槽位全部达到 3 星", "star5", 6, 180),
        AchDef("ach_divine", "神格降临", "获得任意曜神级星语", "divinity", 1, 30),
        AchDef("ach_gold1k", "小有积蓄", "单局持有 1000 金币", "goldPeak", 1000, 25),
        AchDef("ach_gold3k", "富甲一方", "单局持有 3000 金币", "goldPeak", 3000, 80),
        AchDef("ach_kill100", "百战之身", "单局击败 100 个敌人", "kills", 100, 35),
        AchDef("ach_kill500", "千锤百炼", "单局击败 500 个敌人", "kills", 500, 120),
        AchDef("ach_merc1", "同心之伴", "招募第一名伙伴", "recruit", 1, 20),
        AchDef("ach_merc5", "五星之伴", "把伙伴升到 5 星", "mercStar", 5, 70),
        AchDef("ach_equip_full", "全副武装", "5 个部位全部装备", "equipFull", 1, 30),
        AchDef("ach_equip_myth", "神话武装", "装备一件神话品阶装备", "equipMyth", 1, 90),
        AchDef("ach_enh10", "锻铸大师", "单件装备强化到 +10", "enhance", 10, 80),
        AchDef("ach_skill_full", "战技圆满", "装备 6 个战技", "skillFull", 1, 30),
        AchDef("ach_no_death", "毫发无伤", "不用复活通关 20 层", "flawless", 20, 150),
        AchDef("ach_phoenix", "涅槃之羽", "触发不死鸟复活", "phoenix", 1, 30),
        AchDef("ach_gale", "疾风之息", "在疾风之息下额外行动 50 次", "gale", 50, 60),
        AchDef("ach_boss10", "首领终结者", "击败 10 名章节首领", "chapterBoss", 10, 100),
        AchDef("ach_story5", "聆听回廊", "经历 5 次回廊守望剧情", "story", 5, 60),
        AchDef("ach_climb1", "迭塔起步", "通关迭塔 Lv.1", "climbLevel", 1, 40),
        AchDef("ach_climb10", "迭塔行者", "通关迭塔 Lv.10", "climbLevel", 10, 120),
        AchDef("ach_climb25", "迭塔强者", "通关迭塔 Lv.25", "climbLevel", 25, 250),
        AchDef("ach_climb50", "迭塔之巅", "通关迭塔 Lv.50", "climbLevel", 50, 600),
        AchDef("ach_growth_max", "淬炼圆满", "任一永久成长节点满级", "growthMax", 1, 60),
        AchDef("ach_growth_all", "淬炼大成", "全部永久成长节点满级", "growthAll", 8, 400),
        AchDef("ach_dust100", "星尘初积", "累计获得 100 星尘", "dust", 100, 30),
        AchDef("ach_dust1k", "星尘富者", "累计获得 1000 星尘", "dust", 1000, 120),
        AchDef("ach_codex30", "图鉴初成", "图鉴收录 30 项", "codex", 30, 40),
        AchDef("ach_codex80", "图鉴大成", "图鉴收录 80 项", "codex", 80, 150),
        AchDef("ach_timeout", "坚韧不屈", "经历过一次 500 回合战斗", "timeout", 1, 80),
        AchDef("ach_perfect", "完美战斗", "以满血状态赢得一场战斗", "perfect", 1, 50),
        AchDef("ach_talents100", "星语收集家", "见过 100 种不同星语", "talentsSeen", 100, 200),
        AchDef("ach_class8", "八面玲珑", "8 个职阶各游玩一次", "classPlay", 8, 120),
        AchDef("ach_event50", "见多识广", "经历 50 次随机事件", "events", 50, 60),
        AchDef("ach_item20", "道具行家", "使用 20 次道具", "items", 20, 40),
        AchDef("ach_party3", "结伴同行", "同时拥有 2 名伙伴", "party3", 1, 50),
        AchDef("ach_climb_boss", "双王终结", "击败迭塔终局双王", "climbBoss", 1, 300),
        AchDef("ach_speedrun", "疾行者", "30 分钟内通关初阶模式", "speedrun", 1, 150),
        AchDef("ach_nogold", "清贫之旅", "不购买任何东西抵达 20 层", "nogold", 20, 120),
        AchDef("ach_allmodes", "遍历回廊", "通关全部 4 个主线模式", "allModes", 4, 400),
        AchDef("ach_everything", "回廊之主", "达成其余全部成就", "everything", 58, 1000)
    )

    val byId: Map<String, AchDef> = all.associateBy { it.id }

    fun of(id: String): AchDef? = byId[id]

    val totalDust: Int = all.sumOf { it.dust }

    val mainModes: List<String> = listOf("normal", "adventure", "hero", "king")
}
