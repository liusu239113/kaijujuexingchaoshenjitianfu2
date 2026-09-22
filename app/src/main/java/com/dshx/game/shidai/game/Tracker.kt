package com.dshx.game.shidai.game

/** 成就进度与星尘发放。所有累计量放在 perm.stats 里，跨局持久。 */
object Tracker {

    fun bump(perm: PermState, key: String, amount: Int = 1) {
        perm.stats[key] = (perm.stats[key] ?: 0) + amount
    }

    fun setMax(perm: PermState, key: String, value: Int) {
        val cur = perm.stats[key] ?: 0
        if (value > cur) perm.stats[key] = value
    }

    fun addDust(perm: PermState, amount: Int) {
        perm.dust += amount
        perm.dustTotal += amount
        bump(perm, "dustEarned", amount)
    }

    /** 当前成就进度值。 */
    fun progress(perm: PermState, kind: String): Int = when (kind) {
        "runs" -> perm.stats["runs"] ?: 0
        "bestFloor" -> perm.bestFloor
        "clear_normal" -> flag(perm.clearedModes.contains("normal"))
        "clear_adventure" -> flag(perm.clearedModes.contains("adventure"))
        "clear_hero" -> flag(perm.clearedModes.contains("hero"))
        "clear_king" -> flag(perm.clearedModes.contains("king"))
        "resEdge" -> perm.stats["resEdgePeak"] ?: 0
        "chain" -> perm.stats["chainPeak"] ?: 0
        "promote" -> perm.stats["promote"] ?: 0
        "tier2" -> perm.stats["tier2"] ?: 0
        "classClear" -> perm.classCleared.size
        "star3" -> perm.stats["star3"] ?: 0
        "star5" -> perm.stats["star5Peak"] ?: 0
        "divinity" -> perm.stats["divinity"] ?: 0
        "goldPeak" -> perm.stats["goldPeak"] ?: 0
        "kills" -> perm.stats["killsPeak"] ?: 0
        "recruit" -> perm.stats["recruit"] ?: 0
        "mercStar" -> perm.stats["mercStarPeak"] ?: 0
        "equipFull" -> perm.stats["equipFull"] ?: 0
        "equipMyth" -> perm.stats["equipMyth"] ?: 0
        "enhance" -> perm.stats["enhancePeak"] ?: 0
        "skillFull" -> perm.stats["skillFull"] ?: 0
        "flawless" -> perm.stats["flawlessPeak"] ?: 0
        "phoenix" -> perm.stats["phoenix"] ?: 0
        "gale" -> perm.stats["gale"] ?: 0
        "chapterBoss" -> perm.stats["chapterBoss"] ?: 0
        "story" -> perm.stats["story"] ?: 0
        "climbLevel" -> perm.stats["climbCleared"] ?: 0
        "growthMax" -> maxedNodes(perm).let { if (it >= 1) it else 0 }
        "growthAll" -> maxedNodes(perm)
        "dust" -> perm.dustTotal
        "codex" -> perm.codexSeen.size
        "timeout" -> perm.stats["timeout"] ?: 0
        "perfect" -> perm.stats["perfect"] ?: 0
        "talentsSeen" -> perm.stats["talentsSeen"] ?: 0
        "classPlay" -> perm.classPlayed.size
        "events" -> perm.stats["events"] ?: 0
        "items" -> perm.stats["items"] ?: 0
        "party3" -> perm.stats["party3"] ?: 0
        "climbBoss" -> perm.stats["climbBoss"] ?: 0
        "speedrun" -> perm.stats["speedrun"] ?: 0
        "nogold" -> perm.stats["nogoldPeak"] ?: 0
        "allModes" -> Achievements.mainModes.count { perm.clearedModes.contains(it) }
        "everything" -> perm.achProgress.size
        else -> 0
    }

    private fun flag(b: Boolean): Int = if (b) 1 else 0

    fun maxedNodes(perm: PermState): Int =
        Content.growth.count { perm.growthLevel(it.id) >= it.max }

    /** 重新计算所有成就进度；返回本帧新完成并已发奖的成就。 */
    fun evaluate(perm: PermState): List<AchDef> {
        val done = ArrayList<AchDef>()
        for (a in Achievements.all) {
            val p = progress(perm, a.kind)
            val cur = perm.achProgress[a.id] ?: 0
            if (p > cur) perm.achProgress[a.id] = p
            if (cur < a.target && p >= a.target) {
                perm.achProgress[a.id] = a.target
                addDust(perm, a.dust)
                done.add(a)
            }
        }
        return done
    }

    /** 单局进行中的实时统计采集（每层调用一次即可）。 */
    fun sampleRun(perm: PermState, run: RunState) {
        setMax(perm, "goldPeak", run.gold)
        setMax(perm, "resEdgePeak", run.grid.resonanceCount())
        setMax(perm, "chainPeak", run.grid.longestChain())
        val kills = run.party.sumOf { it.kills }
        setMax(perm, "killsPeak", kills)
        var stars = 0
        var star3 = 0
        for (i in 0 until 6) {
            val t = run.grid.slots[i]
            if (t == null) continue
            stars++
            if (run.grid.stars[i] >= 3) star3++
        }
        setMax(perm, "star3", star3)
        setMax(perm, "star5Peak", star3)
        perm.classPlayed.add(run.classId)
    }
}
