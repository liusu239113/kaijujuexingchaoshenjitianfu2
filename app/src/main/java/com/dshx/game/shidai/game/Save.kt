package com.dshx.game.shidai.game

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object Save {

    private const val PREF_BASE = "kaiju_awakening_save"
    private const val KEY_PERM = "perm_v1"
    private const val KEY_RUN = "run_v1"
    private const val KEY_SLOT = "current_slot"
    const val SLOT_COUNT = 3

    var currentSlot = 0
        private set

    fun init(ctx: Context) {
        currentSlot = ctx.getSharedPreferences(PREF_BASE + "_meta", Context.MODE_PRIVATE)
            .getInt(KEY_SLOT, 0).coerceIn(0, SLOT_COUNT - 1)
    }

    fun setSlot(ctx: Context, perm: PermState, n: Int) {
        if (n < 0 || n >= SLOT_COUNT) return
        savePerm(ctx, perm)
        currentSlot = n
        ctx.getSharedPreferences(PREF_BASE + "_meta", Context.MODE_PRIVATE)
            .edit().putInt(KEY_SLOT, n).apply()
    }

    /** 导出当前槽为可复制的 Base64 文本。 */
    fun exportSlot(ctx: Context): String {
        return try {
            val pr = prefs(ctx)
            val perm = pr.getString(KEY_PERM, "") ?: ""
            val runS = pr.getString(KEY_RUN, "") ?: ""
            val raw = "KAIJU1|" + perm + "|" + runS
            android.util.Base64.encodeToString(raw.toByteArray(Charsets.UTF_8), android.util.Base64.NO_WRAP)
        } catch (t: Throwable) {
            ""
        }
    }

    /** 从导出的 Base64 文本恢复当前槽。 */
    fun importSlot(ctx: Context, text: String): Boolean {
        return try {
            val raw = String(android.util.Base64.decode(text.trim(), android.util.Base64.DEFAULT), Charsets.UTF_8)
            if (!raw.startsWith("KAIJU1|")) return false
            val parts = raw.split("|")
            if (parts.size < 3) return false
            val ed = prefs(ctx).edit()
            if (parts[1].isNotEmpty()) ed.putString(KEY_PERM, parts[1])
            if (parts[2].isNotEmpty()) ed.putString(KEY_RUN, parts[2]) else ed.remove(KEY_RUN)
            ed.apply()
            true
        } catch (t: Throwable) {
            false
        }
    }

    class SlotInfo(val isEmpty: Boolean, val summary: String, val detail: String)

    fun slotSummaries(ctx: Context): List<SlotInfo> {
        val out = ArrayList<SlotInfo>()
        for (i in 0 until SLOT_COUNT) {
            val pr = ctx.getSharedPreferences(PREF_BASE + "_s" + i, Context.MODE_PRIVATE)
            val raw = pr.getString(KEY_PERM, null)
            if (raw == null) {
                out.add(SlotInfo(true, "", ""))
                continue
            }
            try {
                val o = JSONObject(raw)
                val best = o.optInt("bestFloor", 0)
                val runs = o.optInt("totalRuns", 0)
                val dust = o.optInt("dustTotal", 0)
                out.add(
                    SlotInfo(
                        false,
                        "最高 " + best + " 层 · 轮回 " + runs + " 次",
                        "累计星尘 " + dust + " · 神格点 " + o.optInt("talentPoints", 0)
                    )
                )
            } catch (t: Throwable) {
                out.add(SlotInfo(true, "", ""))
            }
        }
        return out
    }

    // ------------------------------------------------------------ 永久存档

    fun savePerm(ctx: Context, perm: PermState) {
        val o = JSONObject()
        o.put("talentPoints", perm.talentPoints)
        o.put("bestFloor", perm.bestFloor)
        o.put("totalRuns", perm.totalRuns)
        o.put("pity", perm.pity)
        o.put("climbMaxUnlocked", perm.climbMaxUnlocked)
        o.put("dust", perm.dust)
        o.put("petId", perm.petId ?: "")
        o.put("storyIndex", perm.storyIndex)
        o.put("petsOwned", strSet(perm.petsOwned))
        o.put("petTickets", perm.petTickets)
        o.put("petPity", perm.petPity)
        val petLv = JSONObject()
        for ((k, v) in perm.petLevels) petLv.put(k, v)
        o.put("petLevels", petLv)
        o.put("chapterClaimed", strSet(perm.chapterClaimed))
        o.put("dustTotal", perm.dustTotal)
        o.put("settingsVibration", perm.settingsVibration)
        o.put("settingsAutoBattle", perm.settingsAutoBattle)
        o.put("settingsManualTarget", perm.settingsManualTarget)
        o.put("settingsFontScale", perm.settingsFontScale)
        o.put("settingsColorBlind", perm.settingsColorBlind)
        o.put("settingsBattleSpeed", perm.settingsBattleSpeed)
        o.put("settingsFontSize", perm.settingsFontSize)
        o.put("unlocked", strSet(perm.unlocked))
        o.put("clearedModes", strSet(perm.clearedModes))
        o.put("classPlayed", strSet(perm.classPlayed))
        o.put("classCleared", strSet(perm.classCleared))
        o.put("codexSeen", strSet(perm.codexSeen))
        o.put("achProgress", intMap(perm.achProgress))
        o.put("stats", intMap(perm.stats))
        o.put("climbBest", perm.climbBest)
        o.put("musicOn", perm.musicOn)
        o.put("musicVolume", perm.musicVolume)
        o.put("sfxOn", perm.sfxOn)
        o.put("seenIntro", perm.seenIntro)
        o.put("playerName", perm.playerName)
        o.put("lastClass", perm.lastClass)
        o.put("lastMode", perm.lastMode)

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
            perm.climbMaxUnlocked = o.optInt("climbMaxUnlocked", 1)
            perm.dust = o.optInt("dust", 0)
            val pid2 = o.optString("petId", "")
            perm.petId = if (pid2.isEmpty()) null else pid2
            perm.storyIndex = o.optInt("storyIndex", 0)
            readStrSet(o.optJSONArray("petsOwned"), perm.petsOwned)
            perm.petTickets = o.optInt("petTickets", 0)
            perm.petPity = o.optInt("petPity", 0)
            o.optJSONObject("petLevels")?.let { g ->
                for (k in g.keys()) perm.petLevels[k] = g.optInt(k, 1)
            }
            // 老存档里已拥有的宠物补一个 1 级记录
            for (pid in perm.petsOwned) perm.petLevels.putIfAbsent(pid, 1)
            readStrSet(o.optJSONArray("chapterClaimed"), perm.chapterClaimed)
            perm.dustTotal = o.optInt("dustTotal", 0)
            perm.settingsVibration = o.optBoolean("settingsVibration", true)
            perm.settingsAutoBattle = o.optBoolean("settingsAutoBattle", false)
            perm.settingsManualTarget = o.optBoolean("settingsManualTarget", true)
            perm.settingsFontScale = o.optInt("settingsFontScale", 100)
            perm.settingsColorBlind = o.optBoolean("settingsColorBlind", false)
            perm.settingsBattleSpeed = o.optInt("settingsBattleSpeed", 1)
            perm.settingsFontSize = o.optInt("settingsFontSize", 1)
            readStrSet(o.optJSONArray("unlocked"), perm.unlocked)
            readStrSet(o.optJSONArray("clearedModes"), perm.clearedModes)
            readStrSet(o.optJSONArray("classPlayed"), perm.classPlayed)
            readStrSet(o.optJSONArray("classCleared"), perm.classCleared)
            readStrSet(o.optJSONArray("codexSeen"), perm.codexSeen)
            readIntMap(o.optJSONObject("achProgress"), perm.achProgress)
            readIntMap(o.optJSONObject("stats"), perm.stats)
            perm.climbBest = o.optInt("climbBest", 0)
            perm.musicOn = o.optBoolean("musicOn", true)
            perm.musicVolume = o.optInt("musicVolume", 70)
            perm.sfxOn = o.optBoolean("sfxOn", true)
            perm.seenIntro = o.optBoolean("seenIntro", false)
            perm.playerName = o.optString("playerName", "")
            perm.lastClass = o.optString("lastClass", "warrior")
            perm.lastMode = o.optString("lastMode", "normal")
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
        // run == null 只代表「这一刻内存里没有本轮」（例如刚启动还没读档），
        // 不能据此清档：旧实现在这种时机切后台会把玩家的远征进度直接抹掉。
        if (run == null) return
        if (run.runOver) {
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
            val slv = JSONObject()
            for ((k, v) in run.skillLevels) slv.put(k, v)
            o.put("skillLevels", slv)
            o.put("alive", run.alive)
            o.put("phoenixUsed", run.phoenixUsed)
            o.put("adReviveUsed", run.adReviveUsed)
            o.put("pityCounter", run.pityCounter)
            o.put("eventIdx", run.eventIdx)
            o.put("waitingFloorTalent", run.waitingFloorTalent)
            o.put("promotionId", run.promotionId ?: "")
            o.put("tier2Id", run.tier2Id ?: "")
            o.put("climbLevel", run.climbLevel)

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
                ju.put("avatarKey", u.avatarKey)
                ju.put("star", u.star)
                ju.put("traitId", u.traitId ?: "")
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
            o.put("draftPicksLeft", run.draftPicksLeft)
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
            // 战技等级随本轮存档持久化（旧版本没有这个字段，缺失时按 Lv.1 处理）
            o.optJSONObject("skillLevels")?.let { it ->
                for (k in it.keys()) run.skillLevels[k] = it.optInt(k, 1)
            }
            run.alive = o.optBoolean("alive", true)
            run.phoenixUsed = o.optBoolean("phoenixUsed", false)
            run.adReviveUsed = o.optBoolean("adReviveUsed", false)
            run.pityCounter = o.optInt("pityCounter", 0)
            run.eventIdx = o.optInt("eventIdx", 0)
            run.waitingFloorTalent = o.optBoolean("waitingFloorTalent", false)
            val pid = o.optString("promotionId", "")
            if (pid.isNotEmpty()) run.promotionId = pid
            val t2 = o.optString("tier2Id", "")
            if (t2.isNotEmpty()) run.tier2Id = t2
            run.climbLevel = o.optInt("climbLevel", 1)
            run.draftPicksLeft = o.optInt("draftPicksLeft", 0)

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
                        hero.avatarKey = ju.optString("avatarKey", hero.clsId)
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
                        m.avatarKey = ju.optString("avatarKey", m.avatarKey)
                        m.star = ju.optInt("star", 1)
                        val tid = ju.optString("traitId", "")
                        m.traitId = if (tid.isEmpty()) null else tid
                        run.party.add(m)
                    }
                }
            }

            run.floorEvents = ArrayList()
            o.optJSONArray("floorEvents")?.let { arr ->
                for (i in 0 until arr.length()) {
                    val je = arr.optJSONObject(i) ?: continue
                    val kind = je.optString("kind", "event")
                    val evId = je.optString("eventId", "")
                    var ev = Content.eventById[evId]
                    // 兜底：老存档里的 story 事件 id 查不回来（当时 storyEvents 没进索引表），
                    // 留 null 会退化成空壳事件、点「进入」还没反应，玩家直接卡死在这一层。
                    // 按层数补一个对应的事件数据。
                    if (ev == null && evId.isNotEmpty()) {
                        ev = Content2.storyFor(run.floor) ?: Content.allEvents.firstOrNull { it.id == evId }
                    }
                    val fe = FloorEvent(
                        kind,
                        ev,
                        je.optBoolean("resolved", false),
                        je.optString("result", "")
                    )
                    run.floorEvents.add(fe)
                }
            }
            RunService.rebuildSkills(hero, run.classId, run.promotionId, run.tier2Id)
            // 一转 / 二转欠账：转职界面上一按退出，pendingPromotion 已经被结算函数消费掉了，
            // 存档里只剩「到了 3 层却没转职」。读档时按层数把这份待选状态补回来，
            // 否则玩家读档后会永远错过整条进阶路线。
            if (run.promotionId == null) {
                if (run.floor >= 3) run.pendingPromotion = 1
            } else if (run.tier2Id == null && run.floor >= 30) {
                run.pendingPromotion = 2
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

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREF_BASE + "_s" + currentSlot, Context.MODE_PRIVATE)

    private fun strSet(set: Set<String>): JSONArray {
        val a = JSONArray()
        for (x in set) a.put(x)
        return a
    }

    private fun intMap(m: Map<String, Int>): JSONObject {
        val o = JSONObject()
        for ((k, v) in m) o.put(k, v)
        return o
    }

    private fun readStrSet(a: JSONArray?, target: MutableSet<String>) {
        if (a == null) return
        for (i in 0 until a.length()) {
            val v = a.optString(i, "")
            if (v.isNotEmpty()) target.add(v)
        }
    }

    private fun readIntMap(o: JSONObject?, target: MutableMap<String, Int>) {
        if (o == null) return
        for (k in o.keys()) target[k] = o.optInt(k, 0)
    }

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
