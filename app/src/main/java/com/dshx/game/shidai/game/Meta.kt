package com.dshx.game.shidai.game

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

    /** 星尘商店：职阶已全部开放，这里只保留星语卡池扩展。 */
    val unlocks: List<UnlockDef> = listOf(
        UnlockDef("u_pool_1", "星语扩展 · 一", "把 12 颗新星语加入卡池", 400, "pool", "p1"),
        UnlockDef("u_pool_2", "星语扩展 · 二", "把 12 颗新星语加入卡池", 800, "pool", "p2"),
        UnlockDef("u_pool_3", "星语扩展 · 三", "把 12 颗新星语加入卡池", 1500, "pool", "p3")
    )

    val unlockById: Map<String, UnlockDef> = unlocks.associateBy { it.id }

    /**
     * 开局免费开放的五个职阶；其余三个见 [adUnlockClasses]，看广告永久解锁。
     */
    val starterClasses = listOf(
        "warrior", "mage", "ranger", "priest", "assassin"
    )

    /** 需要看广告解锁的职阶（永久生效）。 */
    val adUnlockClasses = listOf("vampire", "druid", "puppeteer")

    fun classUnlocked(perm: PermState, classId: String): Boolean =
        starterClasses.contains(classId) || perm.unlocked.contains("class:" + classId)

    fun poolUnlocked(perm: PermState, batch: String): Boolean = perm.unlocked.contains("pool:" + batch)

    fun availableClasses(perm: PermState): List<ClassDef> =
        Data.classes.filter { classUnlocked(perm, it.id) }

    /** 已解锁的星语池批次数量（0–3）。 */
    fun poolCount(perm: PermState): Int =
        listOf("p1", "p2", "p3").count { poolUnlocked(perm, it) }
}
