package com.kaiju.awaken.game

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object Save {

    private const val PREF = "kaiju_awakening_save"
    private const val KEY_PERM = "perm_v1"
    private const val KEY_RUN = "run_v1"

    // ------------------------------------------------------------ 永久存档

    fun savePerm(ctx: Context, perm: PermState) {
        val o = JSONObject()
        o.put("talentPoints", perm.talentPoints)
        o.put("bestFloor", perm.bestFloor)
        o.put("totalRuns", perm.totalRuns)
        o.put("pity", perm.pity)
        o.put("musicOn", perm.musicOn)
        o.put("musicVolume", perm.musicVolume)
        o.put("sfxOn", perm.sfxOn)
        o.put("seenIntro", perm.seenIntro)

        val g = JSONObject()
        for ((k, v) in perm.growthLevels) g.put(k, v)
        o.put("growth", g)

        val mb = JSONObject()
        for ((k, v) in perm.modeBest) mb.put(k, v)
        o.put("modeBest", mb)

        val cb = JSONObject()
        for ((k, v) in perm.classBest) cb.put(k, v)
        o.put("classBest", cb)

        prefs(ctx).edit().putString(KEY_PERM, o.toString()).apply()
    }

    fun loadPerm(ctx: Context): PermState {
        val perm = PermState()
        val raw = prefs(ctx).getString(KEY_PERM, null) ?: return perm
        try {
            val o = JSONObject(raw)
            perm.talentPoints = o.optInt("talentPoints", 0)
            perm.bestFloor = o.optInt("bestFloor", 0)
            perm.totalRuns = o.optInt("totalRuns", 0)
            perm.pity = o.optInt("pity", 0)
            perm.musicOn = o.optBoolean("musicOn", true)
            perm.musicVolume = o.optInt("musicVolume", 70)
            perm.sfxOn = o.optBoolean("sfxOn", true)
            perm.seenIntro = o.optBoolean("seenIntro", false)
            o.optJSONObject("growth")?.let { g ->
                for (k in g.keys()) perm.growthLevels[k] = g.optInt(k, 0)
            }
            o.optJSONObject("modeBest")?.let { g ->
                for (k in g.keys()) perm.modeBest[k] = g.optInt(k, 0)
            }
            o.optJSONObject("classBest")?.let { g ->
                for (k in g.keys()) perm.classBest[k] = g.optInt(k, 0)
            }
        } catch (t: Throwable) {
            // 存档损坏：使用全新档
        }
        return perm
    }

    // ------------------------------------------------------------ 本轮存档

    fun clearRun(ctx: Context) {
        prefs(ctx).edit().remove(KEY_RUN).apply()
    }

    fun saveRun(ctx: Context, run: RunState?, perm: PermState) {
        if (run == null || run.runOver) {
            clearRun(ctx)
            return
        }
        try {
            val o = JSONObject()
            o.put("mode", run.mode.id)
            o.put("classId", run.classId)
            o.put("floor", run.floor)
            o.put("gold", run.gold)
            o.put("level", run.level)
            o.put("exp", run.exp)
            o.put("skillPoints", run.skillPoints)
            o.put("alive", run.alive)
            o.put("phoenixUsed", run.phoenixUsed)
            o.put("adReviveUsed", run.adReviveUsed)
            o.put("pityCounter", run.pityCounter)
            o.put("eventIdx", run.eventIdx)
            o.put("waitingFloorTalent", run.waitingFloorTalent)

            val items = JSONObject()
            for ((k, v) in run.items) items.put(k, v)
            o.put("items", items)

            o.put("permBonus", mapToJson(run.permBonus))
            o.put("nextBattleBonus", mapToJson(run.nextBattleBonus))

            val grid = JSONObject()
            val slotArr = JSONArray()
            for (i in 0 until 6) {
                val t = run.grid.slots[i]
                slotArr.put(t?.id ?: "")
            }
            grid.put("slots", slotArr)
            val starArr = JSONArray()
            for (i in 0 until 6) starArr.put(run.grid.stars[i])
            grid.put("stars", starArr)
            grid.put("divinity", run.grid.divinity?.id ?: "")
            grid.put("divinityStar", run.grid.divinityStar)
            o.put("grid", grid)

            val eq = JSONObject()
            for ((k, v) in run.equipped) eq.put(k, equipToJson(v))
            o.put("equipped", eq)

            val bag = JSONArray()
            for (e in run.bag) bag.put(equipToJson(e))
            o.put("bag", bag)

            val party = JSONArray()
            for (u in run.party) {
                val ju = JSONObject()
                ju.put("id", u.id)
                ju.put("name", u.name)
                ju.put("clsId", u.clsId)
                ju.put("level", u.level)
                ju.put("rarity", u.rarity.name)
                ju.put("hp", u.hp)
                ju.put("energy", u.energy)
                party.put(ju)
            }
            o.put("party", party)

            val evs = JSONArray()
            for (e in run.floorEvents) {
                val je = JSONObject()
                je.put("kind", e.kind)
                je.put("eventId", e.event?.id ?: "")
                je.put("resolved", e.resolved)
                je.put("result", e.result)
                evs.put(je)
            }
            o.put("floorEvents", evs)
            o.put("permTalentPoints", perm.talentPoints)

            prefs(ctx).edit().putString(KEY_RUN, o.toString()).apply()
        } catch (t: Throwable) {
            // 保存失败时保留上一次写入的存档
        }
    }

    fun loadRun(ctx: Context, perm: PermState): RunState? {
        val raw = prefs(ctx).getString(KEY_RUN, null) ?: return null
        try {
            val o = JSONObject(raw)
            val run = RunState()
            run.mode = GameMode.byId(o.optString("mode", "normal"))
            run.classId = o.optString("classId", "warrior")
            run.floor = o.optInt("floor", 1)
            run.gold = o.optInt("gold", 50)
            run.level = o.optInt("level", 1)
            run.exp = o.optInt("exp", 0)
            run.skillPoints = o.optInt("skillPoints", 0)
            run.alive = o.optBoolean("alive", true)
            run.phoenixUsed = o.optBoolean("phoenixUsed", false)
            run.adReviveUsed = o.optBoolean("adReviveUsed", false)
            run.pityCounter = o.optInt("pityCounter", 0)
            run.eventIdx = o.optInt("eventIdx", 0)
            run.waitingFloorTalent = o.optBoolean("waitingFloorTalent", false)

            o.optJSONObject("items")?.let { it ->
                for (k in it.keys()) run.items[k] = it.optInt(k, 0)
            }
            readMap(o.optJSONObject("permBonus"), run.permBonus)
            readMap(o.optJSONObject("nextBattleBonus"), run.nextBattleBonus)

            o.optJSONObject("grid")?.let { g ->
                val arr = g.optJSONArray("slots")
                if (arr != null) {
                    for (i in 0 until minOf(6, arr.length())) {
                        val id = arr.optString(i, "")
                        if (id.isNotEmpty()) run.grid.slots[i] = Data.talentById[id]
                    }
                }
                val st = g.optJSONArray("stars")
                if (st != null) {
                    for (i in 0 until minOf(6, st.length())) {
                        run.grid.stars[i] = st.optInt(i, 1)
                    }
                }
                val dv = g.optString("divinity", "")
                if (dv.isNotEmpty()) run.grid.divinity = Data.talentById[dv]
                run.grid.divinityStar = g.optInt("divinityStar", 1)
            }

            o.optJSONObject("equipped")?.let { it ->
                for (k in it.keys()) {
                    it.optJSONObject(k)?.let { e -> run.equipped[k] = jsonToEquip(e) }
                }
            }
            o.optJSONArray("bag")?.let { arr ->
                for (i in 0 until arr.length()) {
                    arr.optJSONObject(i)?.let { e -> run.bag.add(jsonToEquip(e)) }
                }
            }

            run.party.clear()
            val hero = RunService.makeHero(run.classId, perm, run)
            run.party.add(hero)
            o.optJSONArray("party")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val ju = arr.optJSONObject(i) ?: continue
                    if (ju.optString("id") == "player") {
                        hero.level = ju.optInt("level", 1)
                        hero.hp = ju.optDouble("hp", hero.stats.maxHp)
                        hero.energy = ju.optDouble("energy", 0.0)
                    } else {
                        val rar = runCatching { Rarity.valueOf(ju.optString("rarity", "COMMON")) }.getOrDefault(Rarity.COMMON)
                        val m = RunService.makeMercenary(
                            ju.optString("clsId", "warrior"),
                            ju.optInt("level", 1),
                            rar,
                            ju.optString("name", "佣兵")
                        )
                        m.id = ju.optString("id", m.id)
                        m.hp = ju.optDouble("hp", 1.0)
                        m.energy = ju.optDouble("energy", 0.0)
                        run.party.add(m)
                    }
                }
            }

            run.floorEvents = ArrayList()
            o.optJSONArray("floorEvents")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val je = arr.optJSONObject(i) ?: continue
                    val fe = FloorEvent(
                        je.optString("kind", "event"),
                        Content.eventById[je.optString("eventId", "")],
                        je.optBoolean("resolved", false),
                        je.optString("result", "")
                    )
                    run.floorEvents.add(fe)
                }
            }
            if (run.floorEvents.isEmpty()) TowerService.generateFloor(run)
            RunService.recalcAll(run, perm)
            if (hero.hp <= 0.0) hero.hp = hero.stats.maxHp * 0.5
            return run
        } catch (t: Throwable) {
            return null
        }
    }

    // ------------------------------------------------------------ 工具

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    private fun mapToJson(m: Map<String, Double>): JSONObject {
        val o = JSONObject()
        for ((k, v) in m) o.put(k, v)
        return o
    }

    private fun readMap(o: JSONObject?, target: MutableMap<String, Double>) {
        if (o == null) return
        for (k in o.keys()) target[k] = o.optDouble(k, 0.0)
    }

    private fun equipToJson(e: Equip): JSONObject {
        val o = JSONObject()
        o.put("slot", e.slot)
        o.put("name", e.name)
        o.put("rarity", e.rarity.name)
        o.put("level", e.level)
        o.put("enhance", e.enhance)
        o.put("mainKey", e.mainKey)
        o.put("mainValue", e.mainValue)
        o.put("setId", e.setId ?: "")
        val arr = JSONArray()
        for (a in e.affixes) {
            val ja = JSONObject()
            ja.put("key", a.key)
            ja.put("label", a.label)
            ja.put("value", a.value)
            ja.put("mech", a.isMechanic)
            arr.put(ja)
        }
        o.put("affixes", arr)
        return o
    }

    private fun jsonToEquip(o: JSONObject): Equip {
        val e = Equip()
        e.slot = o.optString("slot", "weapon")
        e.name = o.optString("name", "装备")
        e.rarity = runCatching { Rarity.valueOf(o.optString("rarity", "COMMON")) }.getOrDefault(Rarity.COMMON)
        e.level = o.optInt("level", 1)
        e.enhance = o.optInt("enhance", 0)
        e.mainKey = o.optString("mainKey", "atk")
        e.mainValue = o.optDouble("mainValue", 0.0)
        val sid = o.optString("setId", "")
        e.setId = if (sid.isEmpty()) null else sid
        o.optJSONArray("affixes")?.let { arr ->
            for (i in 0 until arr.length()) {
                val ja = arr.optJSONObject(i) ?: continue
                e.affixes.add(
                    Affix(
                        ja.optString("key", ""),
                        ja.optString("label", ""),
                        ja.optDouble("value", 0.0),
                        ja.optBoolean("mech", false)
                    )
                )
            }
        }
        return e
    }
}
