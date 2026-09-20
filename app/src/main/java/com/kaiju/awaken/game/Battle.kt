package com.kaiju.awaken.game

import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt
import kotlin.random.Random

class FloatText(
    var text: String,
    var color: Int,
    var life: Float,
    var target: Unit,
    var isCrit: Boolean = false
)

class Battle(
    val run: RunState,
    val perm: PermState,
    val floor: Int,
    val kind: String,
    val mode: GameMode
) {
    val allies = ArrayList<Unit>()
    val enemies = ArrayList<Unit>()
    val log = ArrayList<String>()
    val floatTexts = ArrayList<FloatText>()

    var turn = 0
    var finished = false
    var victory = false
    var timedOut = false
    var awaitingInput = false
    var auto = false
    var itemUsedThisTurn = false
    var pendingLevelUps = 0

    private val queue = ArrayList<Unit>()
    private var queueIdx = 0
    private var roundPrepared = false

    val isBoss: Boolean get() = kind == "boss"
    val isElite: Boolean get() = kind == "elite"

    fun escalation(): Double = max(0, turn - 10) * 0.01

    // ------------------------------------------------------------ 初始化

    fun start() {
        allies.clear()
        allies.addAll(run.party)
        for (u in allies) {
            u.alive = true
            u.shield = 0.0
            u.buffs.clear()
            u.cooldowns.clear()
            u.energy = min(u.energy, u.stats.energyMax)
            if (u.hp <= 0.0) u.hp = u.stats.maxHp * 0.5
        }
        buildEnemies()
        // 开场护盾类被动
        for (u in allies) {
            val dv = run.grid.divinity
            if (u.id == "player" && dv != null && dv.passive == "iron_heart") {
                u.addShield(u.stats.def * 0.6)
            }
            if (u.id == "player" && run.grid.slots.any { it?.passive == "shield_open" }) {
                u.addShield(u.stats.maxHp * 0.2)
            }
        }
        for (e in enemies) {
            if (e.hasBuff("affix_shielded")) {
                e.shield += e.stats.maxHp * 0.25
            }
        }
        if (isBoss && floor % 10 == 0) {
            val chapter = Content2.chapterOf(floor)
            for (e in enemies) {
                if (chapter >= 1) e.shield += e.stats.maxHp * 0.25
                if (chapter >= 2) e.addBuff(Buff("boss_regen", "首领再生", 999, 1, 0.04, false))
                if (chapter >= 4) e.stats.crit += 15.0
                if (chapter >= 5) {
                    e.stats.statusRes = 999.0
                    e.stats.armorPen = 0.30
                }
                if (mode == GameMode.CLIMB && run.climbLevel >= 5) e.stats.statusRes += 10.0
                if (mode == GameMode.CLIMB && run.climbLevel >= 20) e.stats.statusRes += 20.0
                if (chapter >= 6) e.addBuff(Buff("cc_immune", "免控", 999, 1, 0.0, false))
                if (mode == GameMode.CLIMB && run.climbLevel >= 30) {
                    e.addBuff(Buff("boss_regen", "首领再生", 999, 1, 0.02, false))
                }
            }
            if (mode == GameMode.CLIMB && run.climbLevel >= 49 && floor >= run.mode.endFloor) {
                for (e in enemies) e.shield += e.stats.maxHp * 0.25
                addLog("迭塔机制 · 终局护城：最终首领开场获得 25% 护盾。")
            }
            if (mode == GameMode.CLIMB && run.climbLevel >= 50 && floor >= run.mode.endFloor) {
                for (e in enemies) {
                    e.stats.atk *= 1.2
                    e.stats.matk *= 1.2
                }
                addLog("迭塔机制 · 双王终局：首领攻击 +20%。")
            }
            val mech = Content2.mechanicFor(floor)
            if (mech != null) addLog("章节机制 · " + mech.name + "：" + mech.desc)
        }
        turn = 0
        finished = false
        victory = false
        timedOut = false
        roundPrepared = false
        queue.clear()
        queueIdx = 0
        addLog("遭遇：${enemies.joinToString("、") { it.name }}")
        nextRound()
    }

    // ------------------------------------------------------------ 敌人生成

    private fun expectedPower(): Pair<Double, Double> {
        val f = floor.toDouble()
        val atk = 20.0 + 2.4 * f
        val hp = 400.0 + 24.0 * f
        return atk to hp
    }

    private fun enemyDef(): Double = 3.0 + floor * 0.6

    /** 反解需要的攻击力，使单次命中造成 desired 伤害。 */
    private fun solveAtk(desired: Double, def: Double): Double {
        val d = max(1.0, desired)
        val disc = d * d + 4.0 * d * def * 1.2
        return (d + sqrt(disc)) / 2.0
    }

    private fun buildEnemies() {
        enemies.clear()
        val (expAtk, expHp) = expectedPower()
        val hero = allies.firstOrNull() ?: return
        val heroPower = max(hero.stats.atk, hero.stats.matk) * 1.1 + hero.stats.maxHp * 0.05
        val expectedPower = (expAtk * 1.2) + expHp * 0.05
        val adapt = (heroPower / max(1.0, expectedPower)).coerceIn(0.75, 1.25)

        val chapter = Content2.chapterOf(floor)
        val isChapterBoss = isBoss && floor % 10 == 0
        val count = when (kind) {
            "boss" -> if ((isChapterBoss && chapter >= 3) || floor >= 40) 2 else 1
            "elite" -> if (floor >= 25) 3 else 2
            else -> min(4, 2 + floor / 14)
        }
        val kindHp = when (kind) {
            "boss" -> if (floor >= 40) 1.7 else 3.2
            "elite" -> 1.6
            else -> 1.0
        }
        val kindAtk = when (kind) {
            "boss" -> 1.35
            "elite" -> 1.15
            else -> 1.0
        }
        var eDef = enemyDef()
        if (mode == GameMode.CLIMB) {
            val lv = run.climbLevel
            if (lv >= 25) eDef *= 1.25
        }
        val refStat = max(hero.stats.atk, hero.stats.matk)
        val heroBasicDmg = refStat * refStat / (refStat + eDef * 1.2)
        val actions = 3.0 + floor * 0.02
        var hpBase = heroBasicDmg * actions * kindHp * (0.7 + 0.3 * adapt)
        var desiredHit = expHp * (0.035 + floor * 0.0006) * kindAtk * (0.75 + 0.25 * adapt)
        if (mode == GameMode.CLIMB) {
            val lv = run.climbLevel.coerceAtLeast(1)
            hpBase *= 1.0 + 0.06 * (lv - 1)
            desiredHit *= 1.0 + 0.04 * (lv - 1)
        }
        if (mode == GameMode.CLIMB && run.climbLevel >= 2) hpBase *= 1.05
        if (isChapterBoss) {
            if (chapter >= 2) hpBase *= 1.15
            if (chapter >= 4) desiredHit *= 1.30
            if (chapter >= 5) desiredHit *= 1.15
        }
        val atkBase = solveAtk(desiredHit, hero.stats.def)

        val names = mutableListOf<String>()
        if (kind == "boss") {
            names.add(Content.bossNames[(floor / 10 + floor) % Content.bossNames.size])
            if (count > 1) names.add(Content.bossNames[(floor / 7 + 3) % Content.bossNames.size])
        } else {
            val pool = Content.normalNames.shuffled(Random)
            for (i in 0 until count) {
                val base = pool[i % pool.size]
                names.add(if (kind == "elite") "精锐·" + Content.elitePrefix[i % Content.elitePrefix.size] + base else base)
            }
        }

        for (i in 0 until count) {
            val e = Unit(
                id = "enemy_$i",
                name = names.getOrElse(i) { "魔物" },
                isEnemy = true,
                clsId = "enemy",
                level = floor,
                avatarKey = pickAvatar(i, kind)
            )
            val hpMul = if (kind == "boss" && count > 1) 0.6 else 1.0
            e.base.maxHp = hpBase * hpMul
            e.base.atk = atkBase
            e.base.matk = atkBase
            e.base.def = eDef * (if (kind == "boss") 1.2 else 1.0) * mode.mult * 0.6
            e.base.crit = if (kind == "normal") 5.0 else 8.0
            e.base.critDmg = 50.0
            e.base.energyRegen = 18.0
            e.stats.maxHp = e.base.maxHp
            e.stats.atk = e.base.atk
            e.stats.matk = e.base.matk
            e.stats.def = e.base.def
            e.stats.crit = e.base.crit
            e.stats.critDmg = e.base.critDmg
            e.stats.energyRegen = e.base.energyRegen
            e.stats.energyMax = 100.0
            e.hp = e.stats.maxHp
            e.energy = 30.0
            e.skills.clear()
            e.skills.addAll(enemySkills())
            applyAffixes(e)
            e.hp = e.stats.maxHp
            enemies.add(e)
        }
    }

    private fun pickAvatar(i: Int, kind: String): String = when (kind) {
        "boss" -> Content2.bossAvatars[(floor + i * 3) % Content2.bossAvatars.size]
        "elite" -> Content2.eliteAvatars[(floor + i) % Content2.eliteAvatars.size]
        else -> Content2.monsterAvatars[(floor * 5 + i * 7) % Content2.monsterAvatars.size]
    }

    private fun enemySkills(): List<Skill> = listOf(
        Skill("e_strike", "撕咬", "enemy", 0, 0, 1, "atk", 1.0, TargetKind.ENEMY_ONE, "造成 100% 攻击伤害", listOf(Tag.DAMAGE), extra = "energy20"),
        Skill("e_heavy", "重击", "enemy", 30, 3, 1, "atk", 1.6, TargetKind.ENEMY_ONE, "造成 160% 攻击伤害", listOf(Tag.DAMAGE)),
        Skill("e_sweep", "横扫", "enemy", 40, 4, 1, "atk", 1.15, TargetKind.ENEMY_ALL, "对全体造成 115% 攻击伤害", listOf(Tag.DAMAGE)),
        Skill("e_curse", "诅咒", "enemy", 35, 4, 1, "atk", 1.2, TargetKind.ENEMY_ONE, "造成伤害并附加 3 层破甲", listOf(Tag.DAMAGE, Tag.ARMOR_BREAK), buffDur = 3, buffStacks = 3),
        Skill("e_drain", "汲魂", "enemy", 30, 3, 1, "atk", 1.35, TargetKind.ENEMY_ONE, "造成伤害并回复生命", listOf(Tag.DAMAGE, Tag.LIFESTEAL_HIT), extra = "drain40")
    )

    private fun applyAffixes(e: Unit) {
        var n = when (kind) {
            "boss" -> 3
            "elite" -> 2
            else -> if (floor >= 10) 1 else 0
        }
        if (mode == GameMode.CLIMB && run.climbLevel >= 10) n++
        val pool = Content.enemyAffixes.shuffled(Random)
        for (i in 0 until min(n, pool.size)) {
            val a = pool[i]
            e.buffs.add(Buff("affix_" + a.id, a.cn, 999, 1, a.value, false))
            when (a.kind) {
                "atk" -> { e.stats.atk *= 1.0 + a.value; e.stats.matk *= 1.0 + a.value }
                "def" -> e.stats.def *= 1.0 + a.value
                "dodge" -> e.stats.dodge += a.value
                "lifesteal" -> e.stats.lifesteal += a.value / 100.0
                "resist" -> e.stats.statusRes += a.value
                "crit" -> e.stats.crit += a.value
            }
        }
    }

    // ------------------------------------------------------------ 回合推进

    private fun nextRound() {
        turn++
        if (turn > 500) {
            finish(true, true)
            return
        }
        queue.clear()
        for (u in allies) if (u.alive) queue.add(u)
        for (e in enemies) if (e.alive) queue.add(e)
        queue.shuffle(Random)
        // 玩家单位优先，手感更稳
        val sorted = ArrayList<Unit>()
        for (u in queue) if (!u.isEnemy) sorted.add(u)
        for (u in queue) if (u.isEnemy) sorted.add(u)
        queue.clear()
        queue.addAll(sorted)
        queueIdx = 0
        roundPrepared = true
        addLog("—— 第 $turn 回合 ——")
        // 回合开始结算
        for (u in queue) if (u.alive) prepareUnit(u)
    }

    private fun prepareUnit(u: Unit) {
        u.actionCount = 0
        u.energy = min(u.stats.energyMax, u.energy + u.stats.energyRegen)
        // DOT
        val bossRegen = u.buffValue("boss_regen")
        if (bossRegen > 0.0 && u.alive) u.heal(u.stats.maxHp * bossRegen)
        val dots = u.buffs.filter { it.id == "burn" || it.id == "poison" }
        val dotBoost = if (u.isEnemy && run.grid.slots.any { it?.passive == "dot_boost" }) 1.8 else 1.0
        for (d in dots) {
            val real = max(1.0, d.value * dotBoost)
            u.hp -= real
            u.damageTaken += real
            addFloat("-${real.toInt()}", 0xFFFF7043.toInt(), u)
            if (u.hp <= 0.0) fatal(u)
        }
        // 再生
        val regen = u.stats.hpRegen + u.stats.maxHp * (u.buffValue("regen") + u.buffValue("regen_pct"))
        val dv = if (u.id == "player") run.grid.divinity else null
        var extraRegen = 0.0
        if (u.id == "player") {
            if (run.grid.slots.any { it?.passive == "regen4" }) extraRegen += 0.04
            if (run.grid.slots.any { it?.passive == "regen3" }) extraRegen += 0.03
            if (run.grid.slots.any { it?.passive == "regen1_5" }) extraRegen += 0.015
            if (run.grid.slots.any { it?.passive == "regen1" }) extraRegen += 0.01
            if (run.grid.slots.any { it?.passive == "turn_shield" }) u.addShield(u.stats.maxHp * 0.08)
            if (dv?.passive == "iron_heart") UnitSizes.noop()
        }
        if (u.alive) u.heal(regen + u.stats.maxHp * extraRegen)
        // 护盾衰减
        for (b in u.buffs) if (!b.id.startsWith("affix_")) b.dur--
        u.buffs.removeAll { it.dur <= 0 && !it.id.startsWith("affix_") }
        // 冷却
        val keys = u.cooldowns.keys.toList()
        for (k in keys) {
            val v = (u.cooldowns[k] ?: 0) - 1
            if (v <= 0) u.cooldowns.remove(k) else u.cooldowns[k] = v
        }
        if (!u.alive) checkEnd()
    }

    /** 推进一个行动单位。返回 true 表示需要玩家输入。 */
    fun advance() {
        if (finished) return
        if (awaitingInput) return
        if (!roundPrepared) nextRound()
        if (finished) return

        var guard = 0
        while (guard < 200) {
            guard++
            if (queueIdx >= queue.size) {
                if (checkEnd()) return
                nextRound()
                if (finished) return
                continue
            }
            val actor = queue[queueIdx]
            if (!actor.alive) {
                queueIdx++
                continue
            }
            if (!actor.isEnemy && !auto && actor.id == "player") {
                awaitingInput = true
                return
            }
            enemyOrAutoAct(actor)
            queueIdx++
            if (checkEnd()) return
            return
        }
    }

    private fun enemyOrAutoAct(actor: Unit) {
        val skill = chooseSkill(actor)
        val target = chooseTarget(actor, skill)
        resolveAction(actor, skill, target)
    }

    private fun chooseSkill(u: Unit): Skill {
        val usable = u.skills.filter { s ->
            (u.cooldowns[s.id] ?: 0) <= 0 && u.energy >= s.cost
        }
        if (usable.isEmpty()) return u.skills.first()
        // 优先大招，其次高费用战技
        val ult = usable.filter { it.isUltimate }
        if (ult.isNotEmpty() && Random.nextDouble() < 0.7) return ult.random()
        val nonBasic = usable.filter { !it.isBasic }
        if (nonBasic.isNotEmpty() && Random.nextDouble() < 0.85) return nonBasic.random()
        return usable.first()
    }

    private fun chooseTarget(u: Unit, s: Skill): Unit? {
        val foeList = if (u.isEnemy) allies.filter { it.alive } else enemies.filter { it.alive }
        val friendList = if (u.isEnemy) enemies.filter { it.alive } else allies.filter { it.alive }
        return when (s.target) {
            TargetKind.ENEMY_ONE -> foeList.minByOrNull { it.hp } ?: foeList.firstOrNull()
            TargetKind.ENEMY_ALL -> foeList.firstOrNull()
            TargetKind.ALLY_ONE -> friendList.minByOrNull { it.hpPct() } ?: friendList.firstOrNull()
            TargetKind.ALLY_ALL, TargetKind.SELF -> u
        }
    }

    fun playerAct(skill: Skill, target: Unit?) {
        if (finished) return
        val actor = queue.getOrNull(queueIdx) ?: return
        val t = when (skill.target) {
            TargetKind.ENEMY_ONE -> target ?: enemies.firstOrNull { it.alive }
            TargetKind.ALLY_ONE -> target ?: allies.minByOrNull { it.hpPct() }
            else -> actor
        }
        resolveAction(actor, skill, t)
        awaitingInput = false
        queueIdx++
        postAction(actor)
        checkEnd()
    }

    fun useItem(id: String) {
        val count = run.items[id] ?: 0
        if (count <= 0) return
        run.items[id] = count - 1
        if (run.items[id] == 0) run.items.remove(id)
        val item = Content.itemById[id] ?: return
        when (id) {
            "heal_potion" -> {
                val t = allies.filter { it.alive }.maxByOrNull { it.stats.maxHp - it.hp }
                t?.let { it.heal(it.stats.maxHp * 0.4); addFloat("+${(it.stats.maxHp * 0.4).toInt()}", 0xFF66E28A.toInt(), it) }
            }
            "energy_potion" -> allies.forEach { if (it.alive) it.energy = min(it.stats.energyMax, it.energy + 50) }
            "shield_scroll" -> allies.forEach { if (it.alive) it.addShield(it.stats.maxHp * 0.3) }
            "bomb" -> enemies.filter { it.alive }.forEach { e ->
                val d = e.stats.maxHp * 0.12
                applyDamage(e, d, null, 0xFFFF6B6B.toInt())
            }
            "cleanse_potion" -> allies.forEach { if (it.alive) it.clearDebuffs() }
            "rage_potion" -> allies.forEach { if (it.alive) it.addBuff(Buff("rage", "沸血", 3, 1, 0.30, false)) }
            "group_heal" -> allies.forEach { if (it.alive) it.heal(it.stats.maxHp * 0.2) }
            "hourglass" -> enemies.filter { it.alive }.forEach { it.addBuff(Buff("stun", "眩晕", 1, 1, 0.0, true)) }
            "revive_scroll" -> {
                val dead = allies.firstOrNull { !it.alive }
                if (dead != null) {
                    dead.alive = true
                    dead.hp = dead.stats.maxHp * 0.5
                    dead.buffs.clear()
                    addFloat("复活", 0xFF5FE8A0.toInt(), dead)
                }
            }
            "power_elixir" -> allies.forEach { if (it.alive) it.addBuff(Buff("rage", "沸血", 3, 1, 0.40, false)) }
            "iron_elixir" -> allies.forEach { if (it.alive) it.addBuff(Buff("iron", "铁壁", 3, 1, 0.60, false)) }
            "swift_elixir" -> allies.forEach { if (it.alive) it.addBuff(Buff("evasion", "疾风", 3, 1, 0.25, false)) }
            "vampire_elixir" -> allies.forEach { if (it.alive) it.addBuff(Buff("leech", "汲血", 3, 1, 0.35, false)) }
            "purge_scroll" -> allies.forEach { if (it.alive) it.clearDebuffs() }
            "stasis_orb" -> enemies.filter { it.alive }.forEach { e ->
                applyDamage(e, e.stats.maxHp * 0.18, null, 0xFFB9A6FF.toInt())
                e.addBuff(Buff("weaken", "虚弱", 3, 1, 0.20, true))
            }
            "star_fragment" -> {
                val opt = DraftService.roll(run, perm, 1).firstOrNull()
                if (opt != null) {
                    DraftService.place(run, opt, -1)
                    DraftService.notePicked(run, opt.talent)
                    RunService.recalcAll(run, perm)
                    addLog("曜辉残片：觉醒【" + opt.talent.name + "】")
                }
            }
        }
        addLog("使用了 ${item.name}。")
        checkEnd()
    }

    // ------------------------------------------------------------ 行动结算

    private fun resolveAction(actor: Unit, skill: Skill, target: Unit?) {
        addLog("${actor.name} 使用【${skill.name}】")
        if (skill.cost > 0) actor.energy = max(0.0, actor.energy - skill.cost)
        if (skill.cd > 0) actor.cooldowns[skill.id] = skill.cd + 1

        if (skill.extra == "energy20") actor.energy = min(actor.stats.energyMax, actor.energy + 20)
        if (actor.id == "player" && skill.cost > 0 && run.grid.slots.any { it?.passive == "skill_heal" }) {
            actor.heal(actor.stats.maxHp * 0.06)
        }
        if (skill.extra == "energy40") {
            for (f in if (actor.isEnemy) enemies else allies) {
                if (f.alive) f.energy = min(f.stats.energyMax, f.energy + 40)
            }
        }
        if (skill.extra == "cd2" || skill.extra == "cd3") {
            val cut = if (skill.extra == "cd3") 3 else 2
            for (f in if (actor.isEnemy) enemies else allies) {
                if (!f.alive) continue
                for (k in f.cooldowns.keys.toList()) {
                    val v = (f.cooldowns[k] ?: 0) - cut
                    if (v <= 0) f.cooldowns.remove(k) else f.cooldowns[k] = v
                }
            }
        }

        val foes = if (actor.isEnemy) allies.filter { it.alive } else enemies.filter { it.alive }
        val friends = if (actor.isEnemy) enemies.filter { it.alive } else allies.filter { it.alive }

        // 治疗
        if (skill.tags.contains(Tag.HEAL)) {
            val targets = when (skill.target) {
                TargetKind.ALLY_ALL -> friends
                TargetKind.SELF -> listOf(actor)
                else -> target?.let { listOf(it) } ?: listOfNotNull(friends.minByOrNull { it.hpPct() })
            }
            for (t in targets) {
                val amount = statOf(actor, skill.stat) * skill.coeff * (1.0 + actor.stats.healPower)
                t.heal(amount)
                addFloat("+${amount.toInt()}", 0xFF66E28A.toInt(), t)
            }
        }
        // 护盾
        if (skill.tags.contains(Tag.SHIELD)) {
            val targets = when (skill.target) {
                TargetKind.ALLY_ALL -> friends
                TargetKind.SELF -> listOf(actor)
                else -> listOfNotNull(target ?: friends.minByOrNull { it.hpPct() })
            }
            for (t in targets) {
                val amount = statOf(actor, skill.stat) * skill.coeff
                t.addShield(amount)
                addFloat("盾 ${amount.toInt()}", 0xFF7FD3FF.toInt(), t)
            }
        }
        // 增益
        if (skill.tags.contains(Tag.BUFF_ATK)) {
            val targets = if (skill.target == TargetKind.ALLY_ALL) friends else listOf(actor)
            for (t in targets) t.addBuff(Buff("atk_up", "攻击淬炼", skill.buffDur, 1, skill.coeff, false))
        }
        if (skill.tags.contains(Tag.BUFF_DODGE)) {
            actor.addBuff(Buff("evasion", "闪避提升", skill.buffDur, 1, skill.coeff, false))
        }
        if (skill.tags.contains(Tag.BUFF_REGEN)) {
            actor.addBuff(Buff("regen_pct", "再生", skill.buffDur, 1, skill.coeff, false))
        }
        if (skill.tags.contains(Tag.TAUNT)) {
            actor.addBuff(Buff("taunt", "嘲讽", skill.buffDur, 1, 0.0, false))
        }
        // 伤害
        if (skill.tags.contains(Tag.DAMAGE) || skill.coeff > 0.0 && skill.target == TargetKind.ENEMY_ONE) {
            val targets = when (skill.target) {
                TargetKind.ENEMY_ALL -> foes
                else -> listOfNotNull(target ?: foes.firstOrNull())
            }
            val critExtra = when (skill.extra) {
                "crit25" -> 25.0
                "crit30" -> 30.0
                else -> 0.0
            }
            val penExtra = when (skill.extra) {
                "pen35" -> 0.35
                "pen40" -> 0.40
                "pen50" -> 0.50
                else -> 0.0
            }
            val drain = when (skill.extra) {
                "drain30" -> 0.30
                "drain35" -> 0.35
                "drain40" -> 0.40
                "drain45" -> 0.45
                "drain60" -> 0.60
                else -> 0.0
            }
            var totalDealt = 0.0
            for (t in targets) {
                if (!t.alive) continue
                var sum = 0.0
                for (h in 0 until max(1, skill.hits)) {
                    if (!t.alive) break
                    val d = dealDamage(actor, t, skill, critExtra, penExtra)
                    sum += d
                }
                totalDealt += sum
                if (drain > 0.0 && sum > 0.0) {
                    actor.heal(sum * drain)
                    addFloat("+${(sum * drain).toInt()}", 0xFF66E28A.toInt(), actor)
                }
            }
            if (skill.tags.contains(Tag.LIFESTEAL_HIT) && totalDealt > 0.0 && drain == 0.0) {
                val amount = totalDealt * max(0.15, actor.stats.lifesteal)
                actor.heal(amount)
                addFloat("+${amount.toInt()}", 0xFF66E28A.toInt(), actor)
            }
        }
        // 减益
        if (skill.tags.contains(Tag.STUN)) {
            val t = target ?: foes.firstOrNull()
            if (t != null && tryApplyDebuff(t, "stun", "眩晕", skill.buffDur)) {
                addLog("${t.name} 被眩晕！")
            }
        }
        if (skill.tags.contains(Tag.SILENCE)) {
            val t = target ?: foes.firstOrNull()
            t?.let { tryApplyDebuff(it, "silence", "沉默", skill.buffDur) }
        }
        if (skill.tags.contains(Tag.ARMOR_BREAK)) {
            val t = target ?: foes.firstOrNull()
            if (t != null && tryApplyDebuff(t, "armor_break", "破甲", if (skill.buffDur > 0) skill.buffDur else 3)) {
                t.addBuff(Buff("armor_break", "破甲", if (skill.buffDur > 0) skill.buffDur else 3, skill.buffStacks, 0.0, true))
            }
        }
        if (skill.tags.contains(Tag.HUNTED)) {
            val t = target ?: foes.firstOrNull()
            t?.let { tryApplyDebuff(it, "hunted", "被猎杀", if (skill.buffDur > 0) skill.buffDur else 3) }
        }
        if (skill.tags.contains(Tag.DOT_BURN)) {
            val t = target ?: foes.firstOrNull()
            if (t != null) {
                val v = statOf(actor, skill.stat) * skill.dotCoeff
                t.addBuff(Buff("burn", "灼烧", if (skill.dotDur > 0) skill.dotDur else 3, 1, v, true))
            }
        }
        if (skill.tags.contains(Tag.DOT_POISON)) {
            val t = target ?: foes.firstOrNull()
            if (t != null) {
                val v = statOf(actor, skill.stat) * skill.dotCoeff
                t.addBuff(Buff("poison", "中毒", if (skill.dotDur > 0) skill.dotDur else 3, 1, v, true))
            }
        }
    }

    private fun postAction(actor: Unit) {
        actor.actionCount++
        // 岚息：额外行动
        val dv = if (actor.id == "player") run.grid.divinity else null
        if (dv != null && dv.passive == "gale_breath" && actor.actionCount < 2) {
            queue.add(queueIdx, actor)
        }
        if (dv != null && dv.passive == "arcane_echo" && Random.nextDouble() < 0.25) {
            val keys = actor.cooldowns.keys.toList()
            if (keys.isNotEmpty()) actor.cooldowns.remove(keys.random())
        }
    }

    private fun statOf(u: Unit, key: String): Double = when (key) {
        "maxHp" -> u.stats.maxHp
        "def" -> u.stats.def
        "matk" -> u.stats.matk
        else -> u.stats.atk
    }

    private fun tryApplyDebuff(t: Unit, id: String, name: String, dur: Int): Boolean {
        val resist = t.stats.statusRes / (100.0 + t.stats.statusRes)
        if (Random.nextDouble() < resist) {
            addFloat("抵抗", 0xFFAAB6CC.toInt(), t)
            return false
        }
        if (t.hasBuff("cc_immune") && (id == "stun" || id == "silence")) return false
        t.addBuff(Buff(id, name, dur, 1, 0.0, true))
        return true
    }

    // ------------------------------------------------------------ 伤害核心

    fun dealDamage(attacker: Unit, target: Unit, skill: Skill?, critExtra: Double, penExtra: Double): Double {
        if (!target.alive) return 0.0
        // 闪避
        var dodge = target.stats.dodge + target.buffValue("evasion") * 100.0
        if (target.hasBuff("dodge_next")) dodge = 100.0
        dodge = dodge.coerceIn(0.0, 75.0)
        if (Random.nextDouble() * 100.0 < dodge) {
            target.removeBuff("dodge_next")
            addFloat("闪避", 0xFFAAB6CC.toInt(), target)
            addLog("${target.name} 闪避了攻击。")
            return 0.0
        }

        val statKey = skill?.stat ?: "atk"
        val statVal = max(1.0, statOf(attacker, statKey))
        val coeff = skill?.coeff ?: 1.0
        var def = max(0.0, target.stats.def)
        val ab = target.buffStacks("armor_break")
        if (ab > 0) def *= max(0.0, 1.0 - 0.05 * min(ab, 15))
        var pen = attacker.stats.armorPen + penExtra
        pen = pen.coerceIn(0.0, 0.9)
        def *= 1.0 - pen

        var raw = statVal * statVal / (statVal + def * 1.2) * coeff

        var bonus = attacker.stats.dmgBonus
        bonus += attacker.buffValue("atk_up") * 0.5
        bonus += attacker.buffValue("rage")
        bonus += attacker.buffValue("death_mark")
        val dv = if (attacker.id == "player") run.grid.divinity else null
        if (dv?.passive == "soul_harvest") bonus += floor * 0.005
        if (dv?.passive == "arcane_echo" && (skill?.cost ?: 0) > 0) bonus += 0.30
        if (dv?.passive == "god_slayer" && (isBoss || isElite)) bonus += 0.35
        if (attacker.id == "player") {
            for (t in run.grid.allTalents()) {
                val star = run.grid.stars[run.grid.indexOf(t.id)]
                if (t.passive == "death_mark") bonus += 0.18 * t.scale(star)
                if (t.passive == "execute" && target.hpPct() < 0.35) bonus += 0.60 * t.scale(star)
            }
        }
        if (run.nextBattleBonus.containsKey("dmg")) bonus += run.nextBattleBonus["dmg"] ?: 0.0
        if (attacker.id == "player") {
            val g = run.grid
            if (g.slots.any { it?.passive == "executioner" } && target.hpPct() < 0.35) bonus += 0.60
            if (g.slots.any { it?.passive == "elite_hunter" } && (isBoss || isElite)) bonus += 0.18
            if (g.slots.any { it?.passive == "last_stand" }) bonus += 0.50 * (1.0 - attacker.hpPct())
            if (g.slots.any { it?.passive == "ambush" } && turn <= 1) bonus += 1.0
            if (g.slots.any { it?.passive == "first_strike" } && (skill?.isBasic == true) && attacker.actionCount == 0) bonus += 0.60
        }

        var reduction = target.stats.dmgReduction + target.buffValue("iron")
        if (target.id == "player" && dv?.passive == "god_slayer" && (isBoss || isElite)) reduction += 0.15
        reduction = reduction.coerceAtMost(0.85)

        var mult = max(0.1, (1.0 + bonus) / (1.0 + reduction))
        mult *= 1.0 + escalation()
        raw *= mult

        // 暴击
        val critChance = (attacker.stats.crit + critExtra).coerceIn(0.0, 95.0)
        var isCrit = false
        if (Random.nextDouble() * 100.0 < critChance) {
            isCrit = true
            raw *= 1.0 + attacker.stats.critDmg / 100.0
        }
        // 天赋额外真伤
        if (attacker.id == "player" && dv?.passive == "divine_hand" && (skill?.isBasic == true)) {
            raw += attacker.stats.maxHp * 0.08
        }

        val finalDmg = max(1.0, raw)
        applyDamage(target, finalDmg, attacker, if (isCrit) 0xFFFFD166.toInt() else 0xFFFFFFFF.toInt())

        // 吸血
        val totalLeech = attacker.stats.lifesteal + attacker.buffValue("leech")
        if (totalLeech > 0.0) {
            attacker.heal(finalDmg * min(0.6, totalLeech))
        }
        // 棘刺反伤
        val thorns = target.stats.let { if (target.hasBuff("affix_thorns")) 0.20 else 0.0 }
        var thornsTalent = if (target.id == "player" && run.grid.slots.any { it?.passive == "thorns" }) 0.25 else 0.0
        if (target.id == "player" && run.grid.slots.any { it?.passive == "thorns_small" }) thornsTalent = max(thornsTalent, 0.12)
        val totalThorns = max(thorns, thornsTalent)
        if (totalThorns > 0.0 && attacker.alive) {
            applyDamage(attacker, finalDmg * totalThorns, null, 0xFFFF8A8A.toInt())
        }
        return finalDmg
    }

    private fun applyDamage(target: Unit, amount: Double, attacker: Unit?, color: Int) {
        if (!target.alive) return
        var dmg = amount
        // 厚皮
        if (target.id == "player" && run.grid.slots.any { it?.passive == "thick_skin" }) {
            dmg = min(dmg, target.stats.maxHp * 0.18)
        }
        if (target.id == "player" && run.grid.slots.any { it?.passive == "unbroken_line" } && !target.hasBuff("unbroken_used")) {
            if (target.hp - dmg <= target.stats.maxHp * 0.4) {
                target.addBuff(Buff("unbroken_used", "永峙防线", 999, 1, 0.0, false))
                target.addShield(target.stats.maxHp * 0.25)
                addFloat("永峙防线", 0xFFFFE066.toInt(), target)
            }
        }
        if (target.shield > 0.0) {
            val absorbed = min(target.shield, dmg)
            target.shield -= absorbed
            dmg -= absorbed
        }
        if (dmg > 0.0) {
            target.hp -= dmg
            target.damageTaken += dmg
            if (attacker != null) attacker.damageDealt += dmg
            addFloat("-${dmg.toInt()}", color, target)
        }
        if (target.hp <= 0.0) fatal(target)
    }

    private fun fatal(u: Unit) {
        // 涅槃羽 / 复活类
        if (u.id == "player") {
            val phoenix = run.grid.slots.any { it?.passive == "phoenix" }
            if (phoenix && !run.phoenixUsed) {
                run.phoenixUsed = true
                u.hp = u.stats.maxHp * 0.4
                u.alive = true
                addFloat("涅槃羽", 0xFFFFB454.toInt(), u)
                addLog("${u.name} 触发【涅槃羽】，以 40% 生命复活！")
                return
            }
        }
        u.hp = 0.0
        u.alive = false
        u.buffs.clear()
        u.shield = 0.0
        addLog("${u.name} 倒下了。")
        if (u.isEnemy) {
            for (a in allies) if (a.alive) a.kills++
            // 巫妖形态
            if (run.grid.slots.any { it?.passive == "kill_heal" }) {
                val hero = allies.firstOrNull { it.id == "player" }
                hero?.let { it.heal(it.stats.maxHp * 0.12) }
            }
            val dv = run.grid.divinity
            if (dv != null && dv.passive == "soul_harvest") {
                val hero = allies.firstOrNull { it.id == "player" }
                hero?.let { it.base.atk += 2.0 }
            }
        }
    }

    private fun addFloat(text: String, color: Int, u: Unit) {
        floatTexts.add(FloatText(text, color, 1.0f, u))
        if (floatTexts.size > 40) floatTexts.removeAt(0)
    }

    private fun addLog(s: String) {
        log.add(s)
        if (log.size > 200) log.removeAt(0)
    }

    fun tickVisuals(dt: Float) {
        var i = floatTexts.size - 1
        while (i >= 0) {
            val f = floatTexts[i]
            f.life -= dt
            if (f.life <= 0f) floatTexts.removeAt(i)
            i--
        }
    }

    // ------------------------------------------------------------ 结束

    private fun checkEnd(): Boolean {
        if (finished) return true
        if (enemies.none { it.alive }) {
            finish(true, false)
            return true
        }
        if (allies.none { it.alive }) {
            finish(false, false)
            return true
        }
        return false
    }

    private fun finish(win: Boolean, byTimeout: Boolean) {
        finished = true
        victory = win
        timedOut = byTimeout
        awaitingInput = false
        if (byTimeout) addLog("⏳ 坚持到 500 回合仍未战败，按胜利结算，奖励减半。")
    }

    fun aliveAllies(): List<Unit> = allies.filter { it.alive }
    fun aliveEnemies(): List<Unit> = enemies.filter { it.alive }
    fun currentActor(): Unit? = queue.getOrNull(queueIdx)
}

object UnitSizes {
    fun noop() {}
}
