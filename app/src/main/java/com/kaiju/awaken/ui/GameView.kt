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
import com.kaiju.awaken.game.Data
import com.kaiju.awaken.game.Tracker
import com.kaiju.awaken.game.DraftService
import com.kaiju.awaken.game.Promotions
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

    enum class Screen {
        MENU, HUB, SETUP, DIVINITY, DRAFT, PROMOTION, TOWER, COMBAT,
        GROWTH, REINCARNATION, CODEX, ACHIEVEMENTS, SHOP, ABOUT, SAVE_SLOTS
    }

    companion object {
        const val DESIGN_W = 400f
        const val DESIGN_H_DEFAULT = 860f
    }

    val r = Renderer()
    val audio = Audio(context)

    var perm = PermState()
    var run: RunState? = null
    var battle: Battle? = null
    var screen = Screen.MENU

    val w: Float get() = DESIGN_W
    var h = DESIGN_H_DEFAULT
    var scale = 1f
    var time = 0f

    // 选人 / 抽卡
    var setupMode = GameMode.NORMAL
    var setupClass = "warrior"
    var setupClimbLevel = 1
    var draftOptions: List<DraftOption> = emptyList()
    var divinityOptions: List<Talent> = emptyList()
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
    var shopStock: List<com.kaiju.awaken.game.ItemDef> = emptyList()
    var tavernList = ArrayList<Unit>()
    var overlay = ""
    var lastRewards: TowerService.Rewards? = null

    // 遭遇战
    var autoBattle = false
    var combatDelay = 0f
    var selectedSkill: Skill? = null
    var selectedItem: String? = null
    var battleResult = ""

    // 成长
    var enhanceTarget = -1
    var promoOptions: List<com.kaiju.awaken.game.PromotionDef> = emptyList()
    var promoTier = 1
    var runStartMs = 0L
    var pendingAchievements = ArrayList<com.kaiju.awaken.game.AchDef>()
    var codexTab = 0
    var panelScroll = 0f
    var bagSelected = 0
    var confirmMsg = ""
    var confirmAction = ""
    var exportText = ""
    var panelScrollMax = 0f
    private var dragLastY = 0f
    private var dragMoved = 0f
    var preferredTargetId: String? = null

    private var lastFrame = 0L
    private var running = false
    private var physW = 0f
    private var physH = 0f
    private val bitmaps = HashMap<String, Bitmap?>()
    private val rand = Random(20260920)
    private val particles = ArrayList<Particle>()

    class Particle(var x: Float, var y: Float, var vy: Float, var r: Float, var a: Float, var color: Int)

    init {
        setBackgroundColor(Color.BLACK)
        try {
            val tf = android.graphics.Typeface.createFromAsset(context.assets, "fonts/game_font.ttf")
            r.setTypeface(tf)
        } catch (t: Throwable) {
        }
        Save.init(context)
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
        // 标题界面默认播放回廊 BGM；playBgm 内部会跳过同一首
        if (screen == Screen.MENU || screen == Screen.SETUP) audio.playBgm("city")
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
            Screen.HUB -> { goMenu(); true }
            Screen.CODEX -> { screen = Screen.MENU; true }
            Screen.ACHIEVEMENTS -> { screen = Screen.MENU; true }
            Screen.SHOP -> { screen = Screen.MENU; true }
            Screen.ABOUT -> { screen = Screen.MENU; true }
            Screen.SAVE_SLOTS -> { screen = Screen.MENU; true }
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
        if (b != null && screen == Screen.COMBAT && !b.finished && !b.awaitingInput) {
            combatDelay -= dt
            if (combatDelay <= 0f) {
                val spd = perm.settingsBattleSpeed.coerceIn(0, 2)
                var d0 = if (autoBattle) 0.30f else 0.55f
                if (spd == 2) d0 *= 0.5f
                if (spd == 0) d0 *= 1.8f
                combatDelay = d0
                b.auto = autoBattle
                b.advance()
                playCombatSfx(b)
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
        physW = nw.toFloat()
        physH = nh.toFloat()
        scale = if (physW <= 0f) 1f else physW / DESIGN_W
        h = if (scale <= 0f) DESIGN_H_DEFAULT else physH / scale
    }

    // ------------------------------------------------------------ 绘制

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (physW <= 0f) return
        hits.clear()
        canvas.save()
        canvas.scale(scale, scale)
        drawBackground(canvas)
        when (screen) {
            Screen.MENU -> drawMenuScreen(canvas)
            Screen.HUB -> drawHubScreen(canvas)
            Screen.SETUP -> drawSetupScreen(canvas)
            Screen.DIVINITY -> drawDivinityScreen(canvas)
            Screen.DRAFT -> drawDraftScreen(canvas)
            Screen.PROMOTION -> drawPromotionScreen(canvas)
            Screen.TOWER -> drawTowerScreen(canvas)
            Screen.COMBAT -> drawCombatScreen(canvas)
            Screen.GROWTH -> drawGrowthScreen(canvas)
            Screen.REINCARNATION -> drawReincarnationScreen(canvas)
            Screen.CODEX -> drawCodexFullScreen(canvas)
            Screen.ACHIEVEMENTS -> drawAchievementsScreen(canvas)
            Screen.SHOP -> drawShopScreen(canvas)
            Screen.ABOUT -> drawAboutScreen(canvas)
            Screen.SAVE_SLOTS -> drawSaveSlotsScreen(canvas)
        }
        if (panel.isNotEmpty()) drawPanelOverlay(canvas)
        if (overlay.isNotEmpty()) drawOverlay(canvas)
        drawToast(canvas)
        canvas.restore()
    }

    private fun bgNameForScreen(): String = when (screen) {
        Screen.HUB -> "bg_corridor"
        Screen.MENU, Screen.SETUP, Screen.SHOP, Screen.ACHIEVEMENTS, Screen.ABOUT, Screen.SAVE_SLOTS -> "bg_menu"
        Screen.TOWER, Screen.DRAFT, Screen.DIVINITY, Screen.PROMOTION -> "bg_corridor"
        Screen.COMBAT -> "bg_battle"
        Screen.REINCARNATION -> "bg_ending"
        Screen.GROWTH, Screen.CODEX -> "bg_result"
    }

    private fun drawBackground(c: Canvas) {
        run {
            val bmp = bitmap(bgNameForScreen())
            if (bmp != null) {
                val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
                val dst = android.graphics.RectF(0f, 0f, w, h)
                r.fill.shader = null
                r.fill.alpha = 255
                c.drawBitmap(bmp, src, dst, r.fill)
                r.fill.color = r.withAlpha(0xFF0B0620.toInt(), 120)
                c.drawRect(0f, 0f, w, h, r.fill)
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

    fun showConfirm(msg: String, action: String) {
        confirmMsg = msg
        confirmAction = action
        overlay = "confirm"
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

    /** 画一个图标资源（无图时退回 hex 框）。 */
    fun drawIcon(c: Canvas, key: String, cx: Float, cy: Float, size: Float, border: Int? = null) {
        val bmp = bitmap(key)
        val half = size / 2f
        if (bmp != null) {
            val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
            val dst = android.graphics.RectF(cx - half, cy - half, cx + half, cy + half)
            r.fill.shader = null
            r.fill.alpha = 255
            c.drawBitmap(bmp, src, dst, r.fill)
            if (border != null) r.outline(c, cx - half, cy - half, size, size, size * 0.24f, border, 1.6f)
        } else {
            r.hexFrame(c, cx, cy, half * 0.9f, border ?: Palette.CYAN, r.withAlpha(Palette.PANEL_SOFT, 255))
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


    /** 事件 → 场景插画映射；没有对应插画时返回 null（回退到 emoji）。 */
    fun sceneFor(fe: com.kaiju.awaken.game.FloorEvent): String? {
        return when (fe.kind) {
            "shop" -> "pt_ev_shop"
            "tavern" -> "pt_ev_tavern"
            "story" -> "pt_ev_altar"
            else -> when (fe.event?.id) {
                "evt_blacksmith", "evt_divine_forge" -> "pt_ev_forge"
                "evt_shrine", "evt_star_shrine", "evt_blood_altar", "evt_goddess_tears" -> "pt_ev_shrine"
                "evt_campfire", "evt_mercenary_camp" -> "pt_ev_camp"
                "evt_library", "evt_talent_fragment" -> "pt_ev_library"
                "evt_treasury", "evt_sealed_treasury", "evt_cursed_chest", "evt_dragon_hoard", "evt_immortal_throne" -> "pt_ev_treasure"
                "evt_merchant", "evt_arcane_merchant", "evt_lost_supply_cart" -> "pt_ev_shop"
                "evt_training", "evt_merc_training", "evt_merc_trial" -> "pt_ev_train"
                "evt_gamble" -> "pt_ev_gamble"
                "evt_oracle" -> "pt_ev_oracle"
                "evt_arena" -> "pt_ev_arena"
                "evt_underground_grove", "evt_life_spring", "evt_fountain" -> "pt_ev_grove"
                "evt_time_rift", "evt_void_rift", "evt_unstable_alchemy" -> "pt_ev_rift"
                "evt_moonwell" -> "pt_ev_well"
                "evt_old_battlefield", "evt_ancient_tomb", "evt_blood_banner" -> "pt_ev_gate"
                else -> null
            }
        }
    }

    fun drawScene(c: Canvas, key: String, cx: Float, cy: Float, size: Float) {
        val bmp = bitmap(key)
        if (bmp == null) {
            r.hexFrame(c, cx, cy, size * 0.5f, Palette.CYAN, r.withAlpha(Palette.PANEL_SOFT, 255))
            return
        }
        val half = size / 2f
        val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
        val dst = android.graphics.RectF(cx - half, cy - half, cx + half, cy + half)
        r.fill.shader = null
        r.fill.alpha = 255
        c.drawBitmap(bmp, src, dst, r.fill)
        r.outline(c, cx - half, cy - half, size, size, size * 0.22f, r.withAlpha(Palette.CYAN, 200), 2.2f)
    }

    // ------------------------------------------------------------ 输入

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val vx = event.x / scale
        val vy = event.y / scale
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                dragLastY = vy
                dragMoved = 0f
            }
            MotionEvent.ACTION_MOVE -> {
                val dy = vy - dragLastY
                dragLastY = vy
                dragMoved += kotlin.math.abs(dy)
                if (panel.isNotEmpty() && panelScrollMax > 0f) {
                    panelScroll = (panelScroll - dy).coerceIn(0f, panelScrollMax)
                }
            }
            MotionEvent.ACTION_UP -> {
                if (dragMoved < 14f) {
                    var i = hits.size - 1
                    while (i >= 0) {
                        val hh = hits[i]
                        if (hh.enabled && hh.contains(vx, vy)) {
                            audio.play("click")
                            handleTap(hh.id)
                            return true
                        }
                        i--
                    }
                }
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
            id.startsWith("promo_") -> tapPromotion(id)
            id.startsWith("meta_") -> tapMeta(id)
            id.startsWith("hub_") -> tapHub(id)
            id.startsWith("codex_") -> tapCodex(id)
            id.startsWith("dust_") -> tapDust(id)
            id.startsWith("slot_") -> tapSlot(id)
            id.startsWith("confirm_") -> tapConfirm(id)
        }
    }

    // ------------------------------------------------------------ 流程

    fun startRun() {
        val p = RunService.newRun(setupMode, setupClass, perm)
        p.climbLevel = if (setupMode == GameMode.CLIMB) setupClimbLevel.coerceIn(1, perm.climbMaxUnlocked) else 1
        runStartMs = System.currentTimeMillis()
        perm.classPlayed.add(setupClass)
        Save.savePerm(context, perm)
        run = p
        RunService.recalcAll(p, perm)
        divinityOptions = com.kaiju.awaken.game.DraftService.rollDivinityChoices()
        for (t in divinityOptions) perm.codexSeen.add("t:" + t.id)
        screen = Screen.DIVINITY
        audio.playBgm("city")
    }

    fun beginDraft(picks: Int) {
        val p = run ?: return
        picksTotal = picks
        picksLeft = picks
        draftOptions = com.kaiju.awaken.game.DraftService.roll(p, perm, com.kaiju.awaken.game.DraftService.optionCount(p, perm))
        for (o in draftOptions) perm.codexSeen.add("t:" + o.talent.id)
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
        for (en in b.enemies) perm.codexSeen.add("m:" + en.avatarKey)
        for (sk in p.hero().skills) perm.codexSeen.add("t:" + sk.id)
        battle = b
        battleResult = ""
        lastRewards = null
        autoBattle = false
        selectedSkill = null
        selectedItem = null
        combatDelay = 0.4f
        screen = Screen.COMBAT
        audio.playBgm(if (kind == "boss") "boss" else "battle")
    }

    fun onBattleFinished(b: Battle) {
        val p = run ?: return
        if (b.victory) {
            val rw = TowerService.grantBattleRewards(p, perm, b)
            lastRewards = rw
            battleResult = if (b.timedOut) "回合耗尽 · 按胜利结算（奖励减半）" else "遭遇战告捷"
            audio.play("victory")
            Tracker.bump(perm, "chapterBoss", if (b.kind == "boss" && b.floor % 10 == 0) 1 else 0)
            if (b.timedOut) Tracker.bump(perm, "timeout")
            if (b.allies.all { it.hp >= it.stats.maxHp }) Tracker.bump(perm, "perfect")
            val fe = TowerService.currentEvent(p)
            if (fe != null) fe.resolved = true
            p.eventIdx++
            Save.savePerm(context, perm)
            Save.saveRun(context, p, perm)
            TowerService.updateBest(perm, p)
        } else {
            p.alive = false
            battleResult = "全员战殁"
            audio.play("defeat")
        }
        overlay = "battle_end"
        audio.playBgm("tower")
    }

    fun resolveEvent(choice: com.kaiju.awaken.game.EventChoice) {
        val p = run ?: return
        TowerService.currentEvent(p)?.event?.let { perm.codexSeen.add("e:" + it.id) }
        val msg = TowerService.resolveChoice(p, perm, choice)
        val fe = TowerService.currentEvent(p)
        if (fe != null) {
            fe.resolved = true
            fe.result = msg
        }
        eventResult = msg
        Tracker.bump(perm, "events")
        if (TowerService.currentEvent(p)?.kind == "story") Tracker.bump(perm, "story")
        Tracker.sampleRun(perm, p)
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
            Save.saveRun(context, p, perm)
            afterFloorAdvance()
            return
        }
        Save.saveRun(context, p, perm)
    }

    /** 楼层推进后的结算顺序：转职 > 层间觉醒 > 回到迭塔界面。 */
    fun afterFloorAdvance() {
        val p = run ?: return
        if (p.pendingPromotion > 0) {
            val tier = p.pendingPromotion
            p.pendingPromotion = 0
            beginPromotion(tier)
            return
        }
        if (p.waitingFloorTalent) {
            p.waitingFloorTalent = false
            beginDraft(1)
            return
        }
        screen = Screen.TOWER
        audio.playBgm("tower")
    }

    fun beginPromotion(tier: Int) {
        val p = run ?: return
        promoTier = tier
        val list = if (tier == 1) {
            com.kaiju.awaken.game.Promotions.tier1For(p.classId)
        } else {
            com.kaiju.awaken.game.Promotions.tier2For(p.promotionId ?: "")
        }
        promoOptions = list
        if (list.isEmpty()) {
            screen = Screen.TOWER
            return
        }
        screen = Screen.PROMOTION
        audio.play("draft")
    }

    fun notePromotion(tier: Int) {
        Tracker.bump(perm, if (tier == 1) "promote" else "tier2")
        run?.let { Tracker.sampleRun(perm, it) }
    }

    fun popAchievements(): List<com.kaiju.awaken.game.AchDef> {
        if (pendingAchievements.isEmpty()) return emptyList()
        val l = ArrayList(pendingAchievements)
        pendingAchievements.clear()
        return l
    }

    fun finishRun() {
        val p = run ?: return
        TowerService.updateBest(perm, p)
        TowerService.tryUnlockClimb(perm, p)
        perm.totalRuns++
        Tracker.bump(perm, "runs")
        if (p.mode.endFloor > 0 && p.floor > p.mode.endFloor) {
            perm.clearedModes.add(p.mode.id)
            perm.classCleared.add(p.classId)
            if (p.mode == GameMode.CLIMB) {
                val cur = perm.stats["climbCleared"] ?: 0
                if (p.climbLevel > cur) perm.stats["climbCleared"] = p.climbLevel
            }
            if (p.mode == GameMode.NORMAL && runStartMs > 0L && System.currentTimeMillis() - runStartMs < 30 * 60 * 1000L) {
                Tracker.bump(perm, "speedrun")
            }
        }
        Tracker.sampleRun(perm, p)
        val seenTalents = p.grid.allTalents().size
        val curSeen = perm.stats["talentsSeen"] ?: 0
        if (seenTalents > curSeen) perm.stats["talentsSeen"] = seenTalents
        val newly = Tracker.evaluate(perm)
        if (newly.isNotEmpty()) pendingAchievements = ArrayList(newly)
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
                tavernList = ArrayList(TowerService.tavernCandidates(p.floor))
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
