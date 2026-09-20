package com.kaiju.awaken.game

/** 星尘商店条目。 */
class UnlockDef(
    val id: String,
    val name: String,
    val desc: String,
    val cost: Int,
    val kind: String,
    val key: String
)

object Meta {

    /** 解锁类：金 150/300/500 逐级开放职阶。 */
    val unlocks: List<UnlockDef> = listOf(
        UnlockDef("u_class_night", "解锁职阶 · 夜刃", "在选人界面开放「夜刃」", 150, "class", "assassin"),
        UnlockDef("u_class_blood", "解锁职阶 · 绯血裔", "在选人界面开放「绯血裔」", 150, "class", "vampire"),
        UnlockDef("u_class_forest", "解锁职阶 · 森语者", "在选人界面开放「森语者」", 300, "class", "druid"),
        UnlockDef("u_class_thread", "解锁职阶 · 鸣丝使", "在选人界面开放「鸣丝使」", 300, "class", "puppeteer"),
        UnlockDef("u_class_romance", "解锁职阶 · 圣歌使", "在选人界面开放「圣歌使」", 500, "class", "priest"),
        UnlockDef("u_pool_1", "星语扩展 · 一", "把 12 颗新星语加入卡池", 400, "pool", "p1"),
        UnlockDef("u_pool_2", "星语扩展 · 二", "把 12 颗新星语加入卡池", 800, "pool", "p2"),
        UnlockDef("u_pool_3", "星语扩展 · 三", "把 12 颗新星语加入卡池", 1500, "pool", "p3")
    )

    val unlockById: Map<String, UnlockDef> = unlocks.associateBy { it.id }

    /** 初始开放的职阶。 */
    val starterClasses = listOf("warrior", "mage", "ranger")

    fun classUnlocked(perm: PermState, classId: String): Boolean =
        starterClasses.contains(classId) || perm.unlocked.contains("class:" + classId)

    fun poolUnlocked(perm: PermState, batch: String): Boolean = perm.unlocked.contains("pool:" + batch)

    fun availableClasses(perm: PermState): List<ClassDef> =
        Data.classes.filter { classUnlocked(perm, it.id) }

    /** 已解锁的星语池批次数量（0–3）。 */
    fun poolCount(perm: PermState): Int =
        listOf("p1", "p2", "p3").count { poolUnlocked(perm, it) }
}
