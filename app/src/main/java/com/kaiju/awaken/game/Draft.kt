package com.kaiju.awaken.game

import kotlin.random.Random

class DraftOption(val talent: Talent, var star: Int, val isUpgradeOf: Int)

object DraftService {

    /** 稀有度权重，受永久成长与保底影响。 */
    private fun weights(run: RunState, perm: PermState): MutableMap<Rarity, Double> {
        val w = HashMap<Rarity, Double>()
        w[Rarity.COMMON] = 38.0
        w[Rarity.RARE] = 25.0
        w[Rarity.EPIC] = 14.0
        w[Rarity.LEGENDARY] = 7.0
        w[Rarity.MYTHIC] = 3.0
        val g = perm.growthLevel("g_mythic_w")
        w[Rarity.RARE] = (w[Rarity.RARE] ?: 0.0) + g * 0.5
        w[Rarity.EPIC] = (w[Rarity.EPIC] ?: 0.0) + g * 1.0
        w[Rarity.LEGENDARY] = (w[Rarity.LEGENDARY] ?: 0.0) + g * 2.0
        w[Rarity.MYTHIC] = (w[Rarity.MYTHIC] ?: 0.0) + g * 3.0
        val pityNeed = maxOf(6, 15 - perm.growthLevel("g_pity"))
        if (run.pityCounter >= pityNeed) {
            w[Rarity.MYTHIC] = (w[Rarity.MYTHIC] ?: 0.0) + 60.0
        }
        return w
    }

    fun optionCount(run: RunState, perm: PermState): Int {
        var n = 3
        if (perm.growthLevel("g_mythic_w") >= 10) n = 4
        return n
    }

    /** 抽取候选天赋。若已有同名天赋则返回可升星的选项。 */
    fun roll(run: RunState, perm: PermState, count: Int): List<DraftOption> {
        val w = weights(run, perm)
        val owned = run.grid.allTalents().associateBy { it.id }
        val out = ArrayList<DraftOption>()
        val used = HashSet<String>()
        var guard = 0
        while (out.size < count && guard < 400) {
            guard++
            val r = pickRarity(w, perm)
            var pool = Data.normalTalents.filter { it.rarity == r && !used.contains(it.id) }
            if (pool.isEmpty()) pool = Data.normalTalents.filter { !used.contains(it.id) }
            if (pool.isEmpty()) break
            val t = pool[Random.nextInt(pool.size)]
            used.add(t.id)
            val ownedStar = if (owned.containsKey(t.id)) run.grid.stars[run.grid.indexOf(t.id)] else 0
            val star = if (ownedStar in 1..2) ownedStar + 1 else 1
            val idx = run.grid.indexOf(t.id)
            out.add(DraftOption(t, star.coerceAtMost(3), idx))
        }
        return out
    }

    private fun pickRarity(w: Map<Rarity, Double>, perm: PermState): Rarity {
        var total = 0.0
        for (r in listOf(Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHIC)) {
            total += w[r] ?: 0.0
        }
        var roll = Random.nextDouble() * total
        for (r in listOf(Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHIC)) {
            roll -= w[r] ?: 0.0
            if (roll <= 0.0) return r
        }
        return Rarity.COMMON
    }

    /** 开局必得：3 个超神级供选择。 */
    fun rollDivinityChoices(): List<Talent> =
        Data.hiddenTalents.shuffled(Random).take(3)

    fun applyDivinity(run: RunState, talent: Talent) {
        run.grid.divinity = talent
        run.grid.divinityStar = 1
        if (talent.passive == "reincarnation_admin") run.draftExtraOption = true
    }

    /** 把选中的天赋放进共鸣盘；满盘时替换指定槽位。 */
    fun place(run: RunState, opt: DraftOption, replaceIndex: Int) {
        val t = opt.talent
        val existing = run.grid.indexOf(t.id)
        if (existing >= 0 && opt.star > run.grid.stars[existing]) {
            run.grid.stars[existing] = opt.star
            return
        }
        if (run.grid.isFull()) {
            val idx = if (replaceIndex in 0..5) replaceIndex else 0
            run.grid.replace(idx, t, opt.star)
        } else {
            run.grid.add(t, opt.star)
        }
    }

    fun notePicked(run: RunState, t: Talent) {
        run.pityCounter = if (t.rarity.rank >= 5) 0 else run.pityCounter + 1
    }

    /** 神格升级：消耗天赋点强化天赋星级。 */
    fun enhanceCost(t: Talent, level: Int): Int = t.enhanceCost(level)

    fun canEnhance(run: RunState, perm: PermState, index: Int): Boolean {
        val t = run.grid.slots[index] ?: return false
        val star = run.grid.stars[index]
        if (star >= 3) return false
        return perm.talentPoints >= t.enhanceCost(star - 1)
    }

    fun enhance(run: RunState, perm: PermState, index: Int): Boolean {
        if (!canEnhance(run, perm, index)) return false
        val t = run.grid.slots[index] ?: return false
        val star = run.grid.stars[index]
        perm.talentPoints -= t.enhanceCost(star - 1)
        run.grid.stars[index] = star + 1
        return true
    }
}
