package com.kaiju.awaken.game

/** 轻量国际化：以中文原文为键，Renderer.text 出口统一查表。 */
object I18n {

    const val ZH = "zh"
    const val EN = "en"

    val languages = listOf(ZH, EN)

    fun langName(code: String): String = when (code) {
        EN -> "English"
        else -> "简体中文"
    }

    /** 英文词典。未收录的词条原样返回中文。 */
    private val en: Map<String, String> = mapOf(
        // 品牌
        "觉醒" to "AWAKEN",
        "曜神天赋" to "Divine Talent",
        "曜 界 回 廊" to "CORRIDOR OF STARS",
        "神格环上同源共鸣，这一次轮回更接近晨曦。" to "Link same-origin talents on the ring. Every run brings dawn closer.",
        "最高层数" to "Best Floor",
        "神格点" to "Talent Pts",
        "轮回次数" to "Runs",
        "开 始 觉 醒" to "START",
        "继续" to "Continue",
        "延续轮回" to "Continue Run",
        "轮回淬炼" to "Permanent Growth",
        "星语图鉴" to "Talent Codex",
        "成就" to "Achievements",
        "星尘兑换" to "Star Dust Shop",
        "存档" to "Saves",
        "关于" to "About",
        "设定" to "Settings",

        // 主城
        "回 廊 前 厅" to "CORRIDOR HALL",
        "尚未开启远征" to "No active expedition",
        "行囊" to "Bag",
        "装备" to "Gear",
        "战技" to "Skills",
        "星语环" to "Talent Ring",
        "伙伴" to "Companions",
        "出 发 远 征" to "DEPART",
        "继 续 深 入" to "RESUME",
        "放弃本轮并结算" to "Abandon & Settle",
        "金币" to "Gold",
        "星尘" to "Dust",
        "最高" to "Best",
        "选择「出发」开始一次远征" to "Tap DEPART to begin an expedition",
        "每次倒下都会让下一次更远" to "Every defeat carries the next run further",

        // 编成
        "轮回编成" to "Expedition Setup",
        "选择模式与职业，随后觉醒神格" to "Pick a mode and a class, then awaken",
        "试炼强度" to "Difficulty",
        "职阶" to "Class",
        "主属性" to "Main Stat",
        "技能" to "Skills",
        "神 格 觉 醒" to "AWAKEN",
        "转 职 觉 醒" to "PROMOTION",
        "二 转 降 临" to "SECOND PROMOTION",
        "选择天赋" to "Choose a Talent",
        "选 择" to "SELECT",

        // 回廊
        "本层路径" to "Floor Route",
        "本层已肃清。" to "Floor cleared.",
        "前往下一层" to "Descend Further",
        "继 续" to "CONTINUE",
        "进 入" to "ENTER",
        "敌方" to "Enemies",
        "我方" to "Allies",
        "自动" to "Auto",
        "自动中" to "Auto",
        "行动中…" to "Acting...",
        "自动作战中…" to "Auto battling...",
        "查看战果" to "Results",
        "战 斗 胜 利" to "VICTORY",
        "全 员 阵 亡" to "DEFEAT",
        "没有可用道具" to "No items",
        "道具" to "Items",
        "阵亡" to "Down",
        "遭遇战" to "Battle",
        "首领战" to "Boss",
        "精锐战" to "Elite",

        // 面板
        "关 闭" to "CLOSE",
        "选择要被【" to "Choose a talent to replace with ",
        "神格环已满" to "Ring is full",
        "空位" to "Empty",
        "返回重选" to "Back",
        "背 包" to "BAG",
        "武器" to "Weapon",
        "兵刃" to "Weapon",
        "覆面" to "Helm",
        "护铠" to "Armor",
        "坠饰" to "Amulet",
        "指环" to "Ring",
        "装 备" to "EQUIP",
        "变卖" to "Sell",
        "选择一个格子查看详情" to "Tap a slot for details",
        "尚未招募伙伴。" to "No companions yet.",
        "升星" to "Star Up",
        "解雇" to "Dismiss",
        "满星" to "Max",
        "队伍上限 3 人（含主角）" to "Party limit: 3 (including hero)",
        "乐曲音量" to "Music Volume",
        "音效" to "Sound",
        "震动反馈" to "Vibration",
        "目标锁定" to "Target Lock",
        "手动" to "Manual",
        "色弱模式" to "Colorblind Mode",
        "战斗速度" to "Battle Speed",
        "慢" to "Slow",
        "中" to "Normal",
        "快" to "Fast",
        "语言" to "Language",
        "开启" to "On",
        "关闭" to "Off",
        "导出存档文本" to "Export Save",
        "清空存档" to "Erase Save",

        // 结算
        "轮 回 结 算" to "RUN SUMMARY",
        "回 廊 之 心" to "HEART OF THE CORRIDOR",
        "抵达层数" to "Floor Reached",
        "通关模式" to "Cleared",
        "已通关" to "Yes",
        "未通关" to "No",
        "神格点收益" to "Talent Points",
        "领 取 神 格 点" to "CLAIM",
        "前往永久成长" to "Permanent Growth",
        "回到标题" to "Title Screen",
        "本次达成成就" to "Achievements Unlocked",

        // 结局
        "回廊重燃" to "THE CORRIDOR REKINDLES",
        "你点亮了回廊之心，所有星语重新开始呼吸。" to "You lit the Heart. Every talent breathes again.",
        "继续轮回" to "Continue",
        "回到主城" to "Back to Hall",

        // 成就 / 兑换 / 图鉴
        "回廊成就" to "Achievements",
        "已达成" to "Unlocked",
        "达成" to "Done",
        "长期解锁内容" to "Long-term unlocks",
        "已解锁" to "Unlocked",
        "解锁职阶" to "Unlock Class",
        "星语扩展" to "Talent Pack",
        "星语" to "Talents",
        "遭遇" to "Encounters",
        "魔物" to "Monsters",
        "尚未觉醒" to "Undiscovered",
        "未遭遇" to "Unknown",
        "未知遭遇" to "Unknown Encounter",

        // 存档
        "存档管理" to "Save Slots",
        "空存档位" to "Empty Slot",
        "切换到此槽" to "Use This Slot",
        "使用中" to "Active",
        "存档导出文本" to "Exported Save",
        "长按可复制；粘贴到新设备的导入框即可恢复" to "Long-press to copy; paste on another device",

        // 确认
        "请 确 认" to "CONFIRM",
        "确 定" to "OK",
        "取消" to "Cancel",

        // 其它
        "第" to "F",
        "层" to "F",
        "回合" to "Turn",
        "增伤" to "Dmg",
        "退出" to "Exit",
        "返回" to "Back",
        "关于与隐私" to "About & Privacy",
        "本作完全离线运行" to "Fully offline"
    )

    fun translate(s: String, lang: String): String {
        if (lang != EN) return s
        return en[s] ?: s
    }

    val size: Int get() = en.size
}
