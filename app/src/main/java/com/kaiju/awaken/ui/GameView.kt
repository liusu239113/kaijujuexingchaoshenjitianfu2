package com.kaiju.awaken.ui

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View
import com.kaiju.awaken.audio.Audio
import com.kaiju.awaken.game.Battle
import com.kaiju.awaken.game.DraftOption
import com.kaiju.awaken.game.GameMode
import com.kaiju.awaken.game.PermState
import com.kaiju.awaken.game.Rarity
import com.kaiju.awaken.game.RunService
import com.kaiju.awaken.game.RunState
import com.kaiju.awaken.game.Save
import com.kaiju.awaken.game.Skill
import com.kaiju.awaken.game.Talent
import com.kaiju.awaken.game.TowerService
import com.kaiju.awaken.game.Unit
import kotlin.math.min
import kotlin.random.Random

class GameView(context: Context) : View(context), Choreographer.FrameCallback {

    enum class Screen { MENU, SETUP, DIVINITY, DRAFT, TOWER, COMBAT, GROWTH, REINCARNATION, CODEX }

    val r = Renderer()
    val audio = Audio(context)

    var perm = PermState()
    var run: RunState? = null
    var battle: Battle? = null
    var screen = Screen.MENU

    var w = 0f
    var h = 0f
    var time = 0f

    // 选人 / 抽卡
    var setupMode = GameMode.NORMAL
    var setupClass = "warrior"
    var draftOptions = ArrayList<DraftOption>()
    var divinityOptions = ArrayList<Talent>()
    var picksLeft = 0
    var picksTotal = 3
    var replacePick = false
    var pendingOption: DraftOption? = null

    // 交互
    val hits = ArrayList<HitRect>()
    var toast = ""
    var toastTime = 0f
    var panel = ""
    var eventResult = ""
    var shopStock = ArrayList<com.kaiju.awaken.game.ItemDef>()
    var tavernList = ArrayList<Unit>()
    var overlay = ""
    var lastRewards: TowerService.Rewards? = null

    // 战斗
    var autoBattle = false
    var combatDelay = 0f
    var selectedSkill: Skill? = null
    var selectedItem: String? = null
    var battleResult = ""

    // 成长
    var enhanceTarget = -1

    private var lastFrame = 0L
    private var running = false
    private val bitmaps = HashMap<String, Bitmap?>()
    private val rand = Random(20260920)
    private val particles = ArrayList<Particle>()

    class Particle(var x: Float, var y: Float, var vy: Float, var r: Float, var a: Float, var color: Int)

    init {
        setBackgroundColor(Color.BLACK)
        perm = Save.loadPerm(context)
        audio.init()
        audio.musicOn = perm.musicOn
        audio.musicVolume = perm.musicVolume / 100f
        audio.sfxOn = perm.sfxOn
        for (i in 0 until 26) {
            particles.add(
                Particle(
                    rand.nextFloat(), rand.nextFloat(), 0.02f + rand.nextFloat() * 0.05f,
                    1.2f + rand.nextFloat() * 2.6f, 0.25f + rand.nextFloat() * 0.5f,
                    if (rand.nextBoolean()) Palette.CYAN else Palette.PINK
                )
            )
        }
    }

    // ------------------------------------------------------------ 生命周期

    fun onResumeGame() {
        if (!running) {
            running = true
            lastFrame = 0L
            Choreographer.getInstance().postFrameCallback(this)
        }
        audio.resumeAll()
    }

    fun onPauseGame() {
        running = false
        Choreographer.getInstance().removeFrameCallback(this)
        audio.pauseAll()
        Save.savePerm(context, perm)
        Save.saveRun(context, run, perm)
    }

    fun destroy() {
        onPauseGame()
        audio.release()
        bitmaps.clear()
    }

    fun onBackPressed(): Boolean {
        if (panel.isNotEmpty()) {
            panel = ""
            return true
        }
        if (overlay.isNotEmpty()) {
            overlay = ""
            return true
        }
        return when (screen) {
            Screen.MENU -> false
            Screen.SETUP -> { screen = Screen.MENU; true }
            Screen.GROWTH -> { screen = Screen.MENU; true }
            Screen.CODEX -> { screen = Screen.MENU; true }
            Screen.TOWER -> { screen = Screen.MENU; true }
            Screen.REINCARNATION -> { screen = Screen.MENU; true }
            else -> false
        }
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (!running) return
        val dt = if (lastFrame == 0L) 0.016f else min(0.05f, (frameTimeNanos - lastFrame) / 1_000_000_000f)
        lastFrame = frameTimeNanos
        update(dt)
        invalidate()
        Choreographer.getInstance().postFrameCallback(this)
    }

    private fun update(dt: Float) {
        time += dt
        if (toastTime > 0f) toastTime -= dt
        for (p in particles) {
            p.y -= p.vy * dt
            if (p.y < -0.05f) {
                p.y = 1.05f
                p.x = rand.nextFloat()
            }
        }
        battle?.tickVisuals(dt)
        val b = battle
        if (b != null && screen == Screen.COMBAT && !b.finished) {
            if (autoBattle || b.currentActor()?.id != "player") {
                combatDelay -= dt
                if (combatDelay <= 0f) {
                    combatDelay = if (autoBattle) 0.18f else 0.5f
                    b.auto = autoBattle
                    b.advance()
                    playCombatSfx(b)
                }
            }
        }
        if (b != null && b.finished && battleResult.isEmpty()) {
            onBattleFinished(b)
        }
    }

    private fun playCombatSfx(b: Battle) {
        val ft = b.floatTexts.lastOrNull() ?: return
        when {
            ft.isCrit -> audio.play("crit")
            ft.color == Palette.RED || ft.color == 0xFFFF8A8A.toInt() -> audio.play("hit")
            ft.text.startsWith("+") -> audio.play("heal")
            ft.text.startsWith("盾") -> audio.play("shield")
        }
    }

    override fun onSizeChanged(nw: Int, nh: Int, ow: Int, oh: Int) {
        super.onSizeChanged(nw, nh, ow, oh)
        w = nw.toFloat()
        h = nh.toFloat()
    }

    // ------------------------------------------------------------ 绘制

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (w <= 0f) return
        hits.clear()
        drawBackground(canvas)
        when (screen) {
            Screen.MENU -> drawMenuScreen(canvas)
            Screen.SETUP -> drawSetupScreen(canvas)
            Screen.DIVINITY -> drawDivinityScreen(canvas)
            Screen.DRAFT -> drawDraftScreen(canvas)
            Screen.TOWER -> drawTowerScreen(canvas)
            Screen.COMBAT -> drawCombatScreen(canvas)
            Screen.GROWTH -> drawGrowthScreen(canvas)
            Screen.REINCARNATION -> drawReincarnationScreen(canvas)
            Screen.CODEX -> drawCodexScreen(canvas)
        }
        if (panel.isNotEmpty()) drawPanelOverlay(canvas)
        if (overlay.isNotEmpty()) drawOverlay(canvas)
        drawToast(canvas)
    }

    private fun drawBackground(c: Canvas) {
        if (screen == Screen.MENU || screen == Screen.SETUP) {
            val bmp = bitmap("bg_menu")
            if (bmp != null) {
                val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
                val dst = android.graphics.RectF(0f, 0f, w, h)
                r.fill.shader = null
                r.fill.alpha = 255
                c.drawBitmap(bmp, src, dst, r.fill)
                r.fill.color = r.withAlpha(0xFF0B0620.toInt(), if (screen == Screen.MENU) 132 else 196)
                c.drawRect(0f, 0f, w, h, r.fill)
            }
        }
        r.fill.shader = LinearGradient(0f, 0f, w * 0.4f, h, Palette.BG_TOP, Palette.BG_BOTTOM, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, r.fill)
        r.fill.shader = null

        // 极光光斑
        val t = time * 0.16f
        drawBlob(c, w * (0.25f + 0.12f * kotlin.math.sin(t)), h * 0.22f, w * 0.62f, Palette.PINK, 26)
        drawBlob(c, w * (0.75f + 0.10f * kotlin.math.cos(t * 1.3f)), h * 0.62f, w * 0.7f, Palette.CYAN, 20)
        drawBlob(c, w * 0.5f, h * (0.9f + 0.05f * kotlin.math.sin(t * 0.8f)), w * 0.8f, Palette.BORDER, 18)

        // 星尘
        for (p in particles) {
            r.fill.color = r.withAlpha(p.color, (p.a * 160).toInt())
            c.drawCircle(p.x * w, p.y * h, p.r, r.fill)
        }
    }

    private fun drawBlob(c: Canvas, cx: Float, cy: Float, radius: Float, color: Int, alpha: Int) {
        var i = 5
        while (i >= 1) {
            val rad = radius * (0.35f + i * 0.13f)
            r.fill.color = r.withAlpha(color, alpha / (i + 2))
            c.drawCircle(cx, cy, rad, r.fill)
            i--
        }
    }

    private fun drawToast(c: Canvas) {
        if (toastTime <= 0f || toast.isEmpty()) return
        val a = (toastTime.coerceAtMost(1f) * 200).toInt().coerceIn(0, 200)
        val tw = r.measure(toast, 15f, true) + 40f
        val x = (w - tw) / 2f
        val y = h - 150f
        r.solid(c, x, y, tw, 42f, 21f, r.withAlpha(0xFF120A2A.toInt(), a))
        r.outline(c, x, y, tw, 42f, 21f, r.withAlpha(Palette.CYAN, a), 1.5f)
        r.text(c, toast, w / 2f, y + 27f, 15f, r.withAlpha(Palette.TEXT, a), true, Paint.Align.CENTER)
    }

    fun showToast(msg: String) {
        toast = msg
        toastTime = 2.4f
    }

    // ------------------------------------------------------------ 控件

    fun hit(id: String, x: Float, y: Float, ww: Float, hh: Float): HitRect {
        val hr = HitRect(x, y, ww, hh, id)
        hits.add(hr)
        return hr
    }

    fun button(c: Canvas, id: String, label: String, x: Float, y: Float, ww: Float, hh: Float, accent: Int, enabled: Boolean = true, sub: String? = null) {
        val top = if (enabled) r.withAlpha(accent, 220) else 0xFF2A2244.toInt()
        val bottom = if (enabled) r.withAlpha(accent, 150) else 0xFF1B1533.toInt()
        r.glowPanel(c, x, y, ww, hh, hh * 0.28f, if (enabled) accent else 0xFF3A2F60.toInt(), 34)
        r.panel(c, x, y, ww, hh, hh * 0.28f, top, bottom, if (enabled) Palette.TEXT else Palette.TEXT_FAINT, 1.6f)
        val ty = if (sub == null) y + hh / 2f + 6f else y + hh / 2f - 2f
        r.text(c, label, x + ww / 2f, ty, 16f, if (enabled) 0xFF1A0F2E.toInt() else Palette.TEXT_FAINT, true, Paint.Align.CENTER)
        if (sub != null) {
            r.text(c, sub, x + ww / 2f, y + hh / 2f + 18f, 11f, r.withAlpha(0xFF1A0F2E.toInt(), 190), false, Paint.Align.CENTER)
        }
        hit(id, x, y, ww, hh).enabled = enabled
    }

    fun ghostButton(c: Canvas, id: String, label: String, x: Float, y: Float, ww: Float, hh: Float, accent: Int) {
        r.panel(c, x, y, ww, hh, hh * 0.28f, r.withAlpha(Palette.PANEL, 235), r.withAlpha(Palette.PANEL_DEEP, 235), r.withAlpha(accent, 200), 1.6f)
        r.text(c, label, x + ww / 2f, y + hh / 2f + 6f, 15f, accent, true, Paint.Align.CENTER)
        hit(id, x, y, ww, hh)
    }

    fun card(c: Canvas, x: Float, y: Float, ww: Float, hh: Float, border: Int, radius: Float = 16f) {
        r.panel(c, x, y, ww, hh, radius, r.withAlpha(Palette.PANEL, 240), r.withAlpha(Palette.PANEL_DEEP, 250), border, 1.8f)
    }

    fun drawTopBar(c: Canvas, title: String, subtitle: String, backId: String?, rightId: String?, rightLabel: String?) {
        r.panel(c, 0f, 0f, w, 96f, 0f, r.withAlpha(0xFF1B1040.toInt(), 235), r.withAlpha(0xFF120A2E.toInt(), 220), null)
        r.fill.color = r.withAlpha(Palette.CYAN, 60)
        c.drawRect(0f, 94f, w, 96f, r.fill)
        if (backId != null) {
            r.text(c, "‹", 22f, 62f, 34f, Palette.CYAN, true)
            hit(backId, 0f, 20f, 62f, 62f)
        }
        val cx = if (backId != null) 74f else 20f
        r.text(c, title, cx, 44f, 20f, Palette.TEXT, true)
        r.text(c, subtitle, cx, 70f, 12f, Palette.TEXT_DIM)
        if (rightId != null && rightLabel != null) {
            val tw = r.measure(rightLabel, 14f, true) + 26f
            r.panel(c, w - tw - 14f, 26f, tw, 40f, 20f, r.withAlpha(Palette.PANEL_SOFT, 230), r.withAlpha(Palette.PANEL, 230), r.withAlpha(Palette.PINK, 190), 1.4f)
            r.text(c, rightLabel, w - tw / 2f - 14f, 52f, 14f, Palette.PINK, true, Paint.Align.CENTER)
            hit(rightId, w - tw - 14f, 26f, tw, 40f)
        }
    }

    // ------------------------------------------------------------ 立绘 / 图标

    fun bitmap(name: String): Bitmap? {
        if (bitmaps.containsKey(name)) return bitmaps[name]
        var bmp: Bitmap? = null
        try {
            val id = resources.getIdentifier(name, "drawable", context.packageName)
            if (id != 0) bmp = BitmapFactory.decodeResource(resources, id)
        } catch (t: Throwable) {
            bmp = null
        }
        bitmaps[name] = bmp
        return bmp
    }

    fun drawPortrait(c: Canvas, key: String, cx: Float, cy: Float, size: Float, border: Int) {
        val bmp = bitmap("pt_$key")
        if (bmp != null) {
            val half = size / 2f
            val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
            val dst = android.graphics.RectF(cx - half, cy - half, cx + half, cy + half)
            r.fill.shader = null
            r.fill.alpha = 255
            c.drawBitmap(bmp, src, dst, r.fill)
            r.outline(c, cx - half, cy - half, size, size, size * 0.22f, border, 2.4f)
        } else {
            r.hexFrame(c, cx, cy, size * 0.5f, border, r.withAlpha(Palette.PANEL_SOFT, 255))
            val glyph = com.kaiju.awaken.game.Data.classById[key]?.glyph ?: "★"
            r.text(c, glyph, cx, cy + size * 0.16f, size * 0.42f, border, true, Paint.Align.CENTER)
        }
    }

    fun classColor(clsId: String): Int = when (clsId) {
        "warrior" -> 0xFFFF8A5C.toInt()
        "mage" -> 0xFF8C7BFF.toInt()
        "ranger" -> 0xFF5FE8A0.toInt()
        "priest" -> 0xFFFFD166.toInt()
        "assassin" -> 0xFFFF5FA2.toInt()
        "vampire" -> 0xFFE05CFF.toInt()
        "druid" -> 0xFF7CE07C.toInt()
        "puppeteer" -> 0xFF54E8FF.toInt()
        else -> Palette.CYAN
    }

    fun rarityColor(rr: Rarity): Int = rr.color

    // ------------------------------------------------------------ 输入

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) {
            val x = event.x
            val y = event.y
            var i = hits.size - 1
            while (i >= 0) {
                val hh = hits[i]
                if (hh.enabled && hh.contains(x, y)) {
                    audio.play("click")
                    handleTap(hh.id)
                    return true
                }
                i--
            }
        }
        return true
    }

    fun handleTap(id: String) {
        when {
            id.startsWith("menu_") -> tapMenu(id)
            id.startsWith("setup_") -> tapSetup(id)
            id.startsWith("div_") -> tapDivinity(id)
            id.startsWith("draft_") -> tapDraft(id)
            id.startsWith("tower_") -> tapTower(id)
            id.startsWith("evt_") -> tapEvent(id)
            id.startsWith("cb_") -> tapCombat(id)
            id.startsWith("panel_") -> tapPanel(id)
            id.startsWith("growth_") -> tapGrowth(id)
            id.startsWith("over_") -> tapOverlay(id)
            id.startsWith("shop_") -> tapShop(id)
            id.startsWith("tavern_") -> tapTavern(id)
            id.startsWith("reinc_") -> tapReincarnation(id)
        }
    }

    // ------------------------------------------------------------ 流程

    fun startRun() {
        val p = RunService.newRun(setupMode, setupClass, perm)
        run = p
        RunService.recalcAll(p, perm)
        divinityOptions = com.kaiju.awaken.game.DraftService.rollDivinityChoices()
        screen = Screen.DIVINITY
        audio.playBgm("city")
    }

    fun beginDraft(picks: Int) {
        val p = run ?: return
        picksTotal = picks
        picksLeft = picks
        draftOptions = com.kaiju.awaken.game.DraftService.roll(p, perm, com.kaiju.awaken.game.DraftService.optionCount(p, perm))
        replacePick = false
        pendingOption = null
        screen = Screen.DRAFT
        audio.play("draft")
    }

    fun afterDraft() {
        val p = run ?: return
        RunService.recalcAll(p, perm)
        if (p.floorEvents.isEmpty()) TowerService.generateFloor(p)
        screen = Screen.TOWER
        audio.playBgm("tower")
    }

    fun startBattle(kind: String) {
        val p = run ?: return
        RunService.recalcAll(p, perm)
        val b = Battle(p, perm, p.floor, kind, p.mode)
        b.start()
        battle = b
        battleResult = ""
        lastRewards = null
        autoBattle = false
        selectedSkill = null
        selectedItem = null
        combatDelay = 0.4f
        screen = Screen.COMBAT
        audio.playBgm("battle")
    }

    fun onBattleFinished(b: Battle) {
        val p = run ?: return
        if (b.victory) {
            val rw = TowerService.grantBattleRewards(p, perm, b)
            lastRewards = rw
            battleResult = if (b.timedOut) "回合耗尽 · 按胜利结算（奖励减半）" else "战斗胜利"
            audio.play("victory")
            val fe = TowerService.currentEvent(p)
            if (fe != null) fe.resolved = true
            p.eventIdx++
            Save.savePerm(context, perm)
            Save.saveRun(context, p, perm)
            TowerService.updateBest(perm, p)
        } else {
            p.alive = false
            battleResult = "全员阵亡"
            audio.play("defeat")
        }
        overlay = "battle_end"
        audio.playBgm("tower")
    }

    fun resolveEvent(choice: com.kaiju.awaken.game.EventChoice) {
        val p = run ?: return
        val msg = TowerService.resolveChoice(p, perm, choice)
        val fe = TowerService.currentEvent(p)
        if (fe != null) {
            fe.resolved = true
            fe.result = msg
        }
        eventResult = msg
        audio.play("coins")
        Save.saveRun(context, p, perm)
        Save.savePerm(context, perm)
    }

    fun continueAfterEvent() {
        eventResult = ""
        val p = run ?: return
        p.eventIdx++
        if (TowerService.isFloorClear(p)) {
            TowerService.updateBest(perm, p)
            if (TowerService.isComplete(p)) {
                finishRun()
                return
            }
            TowerService.advanceFloor(p, perm)
            if (p.waitingFloorTalent) {
                p.waitingFloorTalent = false
                beginDraft(1)
                return
            }
        }
        Save.saveRun(context, p, perm)
    }

    fun finishRun() {
        val p = run ?: return
        TowerService.updateBest(perm, p)
        perm.totalRuns++
        p.runOver = true
        screen = Screen.REINCARNATION
        audio.play("levelup")
        Save.savePerm(context, perm)
        Save.clearRun(context)
    }

    fun enterCurrentEvent() {
        val p = run ?: return
        val fe = TowerService.currentEvent(p) ?: return
        when (fe.kind) {
            "combat_normal" -> startBattle("normal")
            "combat_elite" -> startBattle("elite")
            "boss" -> startBattle("boss")
            "shop" -> {
                shopStock = TowerService.shopItems()
                overlay = "shop"
            }
            "tavern" -> {
                tavernList = TowerService.tavernCandidates(p.floor)
                overlay = "tavern"
            }
            "event" -> {
                // 事件选项直接显示在楼层界面
            }
        }
    }

    fun goMenu() {
        screen = Screen.MENU
        audio.playBgm("city")
        Save.saveRun(context, run, perm)
        Save.savePerm(context, perm)
    }
}
