package com.kaiju.awaken.game

import kotlin.math.max
import kotlin.math.min

/** 天赋品阶。曜神级为开局必得且唯一。 */
enum class Rarity(val cn: String, val rank: Int, val weight: Int, val color: Int, val affixSlots: Int) {
    COMMON("凡庸", 1, 38, 0xFFB9C4D8.toInt(), 1),
    RARE("精巧", 2, 25, 0xFF6FD3FF.toInt(), 2),
    EPIC("灿烂", 3, 14, 0xFFC08BFF.toInt(), 3),
    LEGENDARY("辉耀", 4, 7, 0xFFFFB454.toInt(), 4),
    MYTHIC("神话", 5, 3, 0xFFFF6FA8.toInt(), 5),
    HIDDEN("曜神级", 6, 0, 0xFFFFE066.toInt(), 6);

    val stars: Int get() = rank
}

/** 神格亲和盘上的元素系。相邻同系会结成共鸣链。 */
enum class School(val cn: String, val glyph: String, val stat: String) {
    EDGE("裂界", "锋", "atk"),
    WARD("磐垒", "壁", "def"),
    ARC("星轨", "灵", "matk"),
    VITA("生命", "生", "maxHp"),
    FATE("命途", "运", "crit");

    companion object {
        fun of(index: Int): School = values()[((index % 5) + 5) % 5]
    }
}

enum class TargetKind { ENEMY_ONE, ENEMY_ALL, SELF, ALLY_ONE, ALLY_ALL }

/** 战技标签，遭遇战结算依据。 */
enum class Tag {
    DAMAGE, HEAL, SHIELD, BUFF_ATK, BUFF_DEF, BUFF_CRIT, BUFF_DODGE, BUFF_REGEN,
    DOT_BURN, DOT_POISON, STUN, SILENCE, ARMOR_BREAK, WEAKEN, HUNTED, TAUNT,
    THORNS, COUNTER, CLEANSE, DRAIN, EXECUTE, LIFESTEAL_HIT, EXTRA_TURN, DISPEL
}

class Skill(
    val id: String,
    val name: String,
    val clsId: String,
    val cost: Int,
    val cd: Int,
    val unlockLv: Int,
    val stat: String,
    val coeff: Double,
    val target: TargetKind,
    val desc: String,
    val tags: List<Tag> = emptyList(),
    val hits: Int = 1,
    val isUltimate: Boolean = false,
    val buffDur: Int = 0,
    val buffStacks: Int = 0,
    val dotDur: Int = 0,
    val dotCoeff: Double = 0.0,
    val extra: String? = null
) {
    val isBasic: Boolean get() = cost == 0 && cd == 0
}

class Talent(
    val id: String,
    val name: String,
    val rarity: Rarity,
    val school: School,
    val desc: String,
    val statMod: Map<String, Double> = emptyMap(),
    val flatMod: Map<String, Double> = emptyMap(),
    val passive: String? = null,
    val classReq: String? = null
) {
    /** 星级倍率：1★ ×1.0 / 2★ ×1.5 / 3★ ×2.0 */
    fun scale(star: Int): Double = 1.0 + (max(1, star) - 1) * 0.5
    fun enhanceCost(level: Int): Int {
        val r = rarity.rank
        return (r * (r + 1) / 2) * ((level + 1) * (level + 2) / 2) * 5
    }
}

class Affix(val key: String, val label: String, val value: Double, val isMechanic: Boolean = false)

class Equip(
    var slot: String = "weapon",
    var name: String = "",
    var rarity: Rarity = Rarity.COMMON,
    var level: Int = 1,
    var enhance: Int = 0,
    var mainKey: String = "atk",
    var mainValue: Double = 0.0,
    val affixes: MutableList<Affix> = ArrayList(),
    var setId: String? = null
) {
    val enhanceMul: Double get() = 1.0 + enhance * 0.1
    val sellValue: Int
        get() = when (rarity) {
            Rarity.COMMON -> 5; Rarity.RARE -> 15; Rarity.EPIC -> 30
            Rarity.LEGENDARY -> 50; Rarity.MYTHIC -> 75; Rarity.HIDDEN -> 105
        }
}

class Buff(
    var id: String = "",
    var name: String = "",
    var dur: Int = 0,
    var stacks: Int = 1,
    var value: Double = 0.0,
    var isDebuff: Boolean = false
) {
    fun copy(): Buff = Buff(id, name, dur, stacks, value, isDebuff)
}

class Stats {
    var maxHp = 100.0
    var atk = 20.0
    var matk = 20.0
    var def = 5.0
    var crit = 5.0
    var critDmg = 50.0
    var energyMax = 100.0
    var energyRegen = 12.0
    var dodge = 0.0
    var hpRegen = 0.0
    var lifesteal = 0.0
    var statusRes = 0.0
    var dmgBonus = 0.0
    var dmgReduction = 0.0
    var armorPen = 0.0
    var shieldPower = 0.0
    var healPower = 0.0

    fun copy(): Stats {
        val s = Stats()
        s.maxHp = maxHp; s.atk = atk; s.matk = matk; s.def = def
        s.crit = crit; s.critDmg = critDmg; s.energyMax = energyMax
        s.energyRegen = energyRegen; s.dodge = dodge; s.hpRegen = hpRegen
        s.lifesteal = lifesteal; s.statusRes = statusRes; s.dmgBonus = dmgBonus
        s.dmgReduction = dmgReduction; s.armorPen = armorPen
        s.shieldPower = shieldPower; s.healPower = healPower
        return s
    }
}

class Unit(
    var id: String = "",
    var name: String = "",
    var isPlayer: Boolean = false,
    var isEnemy: Boolean = false,
    var clsId: String = "warrior",
    var level: Int = 1,
    var rarity: Rarity = Rarity.COMMON,
    var avatarKey: String = ""
) {
    val base = Stats()
    val stats = Stats()
    var hp = 0.0
    var shield = 0.0
    var energy = 0.0
    var alive = true
    val buffs = ArrayList<Buff>()
    val skills = ArrayList<Skill>()
    val cooldowns = HashMap<String, Int>()
    var actionCount = 0
    var kills = 0
    var star = 1
    var traitId: String? = null
    var damageDealt = 0.0
    var damageTaken = 0.0
    var ultimateId: String? = null

    fun hpPct(): Double = if (stats.maxHp <= 0.0) 0.0 else (hp / stats.maxHp).coerceIn(0.0, 1.0)

    fun energyPct(): Double = if (stats.energyMax <= 0.0) 0.0 else (energy / stats.energyMax).coerceIn(0.0, 1.0)

    fun hasBuff(id: String): Boolean = buffs.any { it.id == id && it.dur > 0 }

    fun buffStacks(id: String): Int = buffs.filter { it.id == id && it.dur > 0 }.sumOf { it.stacks }

    fun buffValue(id: String): Double {
        var best = 0.0
        for (b in buffs) if (b.id == id && b.dur > 0 && b.value > best) best = b.value
        return best
    }

    fun addBuff(b: Buff) {
        val existing = buffs.firstOrNull { it.id == b.id }
        if (existing != null) {
            existing.dur = max(existing.dur, b.dur)
            existing.stacks = min(15, max(existing.stacks, b.stacks))
            existing.value = max(existing.value, b.value)
        } else {
            buffs.add(b)
        }
    }

    fun removeBuff(id: String) {
        buffs.removeAll { it.id == id }
    }

    fun clearDebuffs() {
        buffs.removeAll { it.isDebuff }
    }

    fun heal(amount: Double) {
        if (!alive) return
        hp = min(stats.maxHp, hp + max(0.0, amount))
    }

    fun addShield(amount: Double) {
        if (!alive) return
        shield += max(0.0, amount * (1.0 + stats.shieldPower))
    }
}

/** 神格亲和盘：6 个环形槽 + 1 个中心神格位。 */
class TalentGrid {
    val slots = arrayOfNulls<Talent>(6)
    val stars = IntArray(6) { 1 }
    var divinity: Talent? = null
    var divinityStar = 1

    fun filledCount(): Int = slots.count { it != null }

    fun isFull(): Boolean = filledCount() >= 6

    fun indexOf(id: String): Int {
        for (i in slots.indices) if (slots[i]?.id == id) return i
        return -1
    }

    fun add(t: Talent, star: Int = 1) {
        val empty = slots.indexOfFirst { it == null }
        if (empty >= 0) { slots[empty] = t; stars[empty] = star }
    }

    fun replace(index: Int, t: Talent, star: Int) {
        if (index in slots.indices) { slots[index] = t; stars[index] = star }
    }

    fun removeAt(index: Int) {
        if (index in slots.indices) { slots[index] = null; stars[index] = 1 }
    }

    /** 相邻同系形成共鸣边。返回每条边的两端下标。 */
    fun resonanceEdges(): List<Pair<Int, Int>> {
        val out = ArrayList<Pair<Int, Int>>()
        for (i in 0 until 6) {
            val a = slots[i] ?: continue
            val b = slots[(i + 1) % 6] ?: continue
            if (a.school == b.school) out.add(i to ((i + 1) % 6))
        }
        return out
    }

    fun resonanceCount(): Int = resonanceEdges().size

    /** 共鸣链长度（连成一片的同系槽位数），取最长链。 */
    fun longestChain(): Int {
        var best = 0
        for (start in 0 until 6) {
            val t = slots[start] ?: continue
            var run = 0
            for (k in 0 until 6) {
                val idx = (start + k) % 6
                val u = slots[idx] ?: break
                if (u.school == t.school) run++ else break
            }
            if (run > best) best = run
        }
        return min(best, 6)
    }

    /** 共鸣提供的全局乘区。 */
    fun resonanceBonus(): ResonanceBonus {
        val n = resonanceCount()
        val chain = longestChain()
        return ResonanceBonus(
            damage = 0.06 * n + 0.05 * max(0, chain - 2),
            hp = 0.05 * n,
            def = 0.04 * n,
            energy = 1.0 * n,
            chain = chain,
            edges = n
        )
    }

    fun schoolCount(s: School): Int = slots.count { it?.school == s }

    fun allTalents(): List<Talent> = slots.filterNotNull()
}

class ResonanceBonus(
    val damage: Double = 0.0,
    val hp: Double = 0.0,
    val def: Double = 0.0,
    val energy: Double = 0.0,
    val chain: Int = 0,
    val edges: Int = 0
) {
    fun label(): String = when {
        chain >= 5 -> "神格回环"
        chain == 4 -> "四方共鸣"
        edges >= 3 -> "三相共鸣"
        edges == 2 -> "双链共鸣"
        edges == 1 -> "单链共鸣"
        else -> "未共鸣"
    }
}

enum class GameMode(val id: String, val cn: String, val glyph: String, val mult: Double, val endFloor: Int) {
    NORMAL("normal", "凡庸", "🏰", 1.0, 50),
    ADVENTURE("adventure", "进阶", "🧭", 1.3, 100),
    HERO("hero", "试炼", "⚔", 1.6, 150),
    KING("king", "霸者", "👑", 2.0, 200),
    ENDLESS("endless", "无界", "∞", 2.0, 0),
    CLIMB("climb", "迭塔", "⛰", 2.1, 100);

    companion object {
        fun byId(id: String): GameMode = values().firstOrNull { it.id == id } ?: NORMAL
    }
}

class ItemDef(val id: String, val name: String, val glyph: String, val desc: String, val price: Int, val weight: Int)

class GrowthDef(val id: String, val name: String, val desc: String, val cost: Int, val max: Int)

class EventChoice(
    val label: String,
    val detail: String,
    val kind: String,
    val gold: Int = 0,
    val amount: Double = 0.0,
    val key: String = ""
)

class GameEvent(
    val id: String,
    val name: String,
    val glyph: String,
    val intro: String,
    val minFloor: Int = 1,
    val weight: Int = 10,
    val choices: List<EventChoice> = emptyList()
)
