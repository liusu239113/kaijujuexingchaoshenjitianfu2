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
        GROWTH, REINCARNATION, CODEX, ACHIEVEMENTS, SHOP, ABOUT, SAVE_SLOTS, ENDING, PET, STORY, RECRUIT,
        STORY_SCENE
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
    var recruitList: MutableList<com.kaiju.awaken.game.Unit> = ArrayList()
    var panelScroll = 0f
    var bagSelected = 0
    var metaReturn: Screen = Screen.MENU
    var screenScroll = 0f
    var screenScrollMax = 0f
    var endingStart = 0f
    var scrollTopY = 0f
    var scrollBottomY = 0f
    var detailTitle = ""
    var detailBody = ""
    var detailIcon = ""

    // ---- 剧情演出 ----
    /** 当前剧情的分页文本，每页一段。 */
    var storyPages: List<String> = emptyList()
    var storyPage = 0
    /** 剧情播完回到哪个屏幕。 */
    var storyReturn = Screen.TOWER
    /** 当前页淡入进度 0..1。 */
    var storyFade = 0f
    /** 已经播过开场剧情的章节号，避免来回切层重复弹。 */
    private var storyShownChapter = -1

    /** 玩家在创角时输入的名字。 */
    var playerName = ""

    fun heroName(): String = if (playerName.isBlank()) "拾语者" else playerName

    /** 开一段剧情演出；播完自动回到 ret。 */
    fun openStory(pages: List<String>, ret: Screen) {
        val list = pages.filter { it.isNotBlank() }
        if (list.isEmpty()) { goScreen(ret); return }
        storyPages = list
        storyPage = 0
        storyReturn = ret
        storyFade = 0f
        goScreen(Screen.STORY_SCENE)
    }

    fun advanceStory() {
        storyPage++
        if (storyPage >= storyPages.size) {
            goScreen(storyReturn)
        } else {
            storyFade = 0f
        }
    }

    /** 到达章节节点时插入章节剧情。返回 true 表示已接管本次跳转。 */
    fun maybeShowChapterStory(): Boolean {
        val p = run ?: return false
        val ch = com.kaiju.awaken.game.Story.current(perm.storyIndex) ?: return false
        if (p.floor < ch.goalFloor) return false
        if (perm.chapterClaimed.contains(ch.index.toString())) return false
        if (storyShownChapter == ch.index) return false
        storyShownChapter = ch.index
        openStory(com.kaiju.awaken.game.StoryScript.chapter(ch.index, heroName()), Screen.TOWER)
        return true
    }

    /** 弹出系统输入框为角色命名。 */
    fun askPlayerName() {
        try {
            val input = android.widget.EditText(context)
            input.setText(playerName)
            input.setSingleLine(true)
            input.filters = arrayOf<android.text.InputFilter>(android.text.InputFilter.LengthFilter(8))
            input.setHint("最多 8 个字")
            android.app.AlertDialog.Builder(context)
                .setTitle("为拾语者命名")
                .setView(input)
                .setPositiveButton("确定") { _, _ ->
                    val t = input.text.toString().trim()
                    if (t.isNotEmpty()) {
                        playerName = t
                        showToast("已命名为「" + t + "」")
                    }
                }
                .setNegativeButton("取消", null)
                .show()
        } catch (t: Throwable) {
            showToast("当前环境无法呼出输入框")
        }
    }
    private var touchDownMs = 0L
    private var lastTouchVX = 0f
    private var lastTouchVY = 0f
    private var longPressFired = false
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
        applyDisplaySettings()
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
            Screen.ENDING -> { screen = Screen.REINCARNATION; true }
            Screen.PET -> { screen = Screen.HUB; true }
            Screen.STORY -> { screen = Screen.HUB; true }
            Screen.RECRUIT -> { screen = Screen.HUB; true }
            Screen.STORY_SCENE -> { advanceStory(); true }
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

    private fun hitIdAt(x: Float, y: Float): String? {
        var i = hits.size - 1
        while (i >= 0) {
            val hh = hits[i]
            if (hh.enabled && hh.contains(x, y)) return hh.id
            i--
        }
        return null
    }


    private fun update(dt: Float) {
        time += dt
        if (touchDownMs > 0L && !longPressFired && dragMoved < 14f && System.currentTimeMillis() - touchDownMs > 420L) {
            longPressFired = true
            val hid = hitIdAt(lastTouchVX, lastTouchVY)
            if (hid != null) handleLongPress(hid)
            touchDownMs = 0L
        }
        r.pctPulse = (0.5f + 0.5f * kotlin.math.sin(time * 3.2f))
        if (storyFade < 1f) storyFade = (storyFade + dt * 2.6f).coerceAtMost(1f)
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
        if (ft.text == lastSfxText) return
        lastSfxText = ft.text
        when {
            ft.isCrit -> audio.play("crit")
            ft.text.startsWith("+") -> audio.play("heal")
            ft.text.startsWith("盾") -> audio.play("shield")
            ft.text.startsWith("复活") || ft.text.startsWith("涅槃") -> audio.play("revive")
            ft.text.startsWith("抵抗") || ft.text.startsWith("闪避") -> audio.play("error")
            else -> audio.play("hit")
        }
    }

    private var lastSfxText = ""

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
        // 每帧复位裁剪区，避免上一帧的裁剪状态泄漏到本帧
        clearHitClip()
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
            Screen.ENDING -> drawEndingScreen(canvas)
            Screen.PET -> drawPetScreen(canvas)
            Screen.STORY -> drawStoryScreen(canvas)
            Screen.RECRUIT -> drawRecruitScreen(canvas)
            Screen.CODEX -> drawCodexFullScreen(canvas)
            Screen.ACHIEVEMENTS -> drawAchievementsScreen(canvas)
            Screen.SHOP -> drawShopScreen(canvas)
            Screen.ABOUT -> drawAboutScreen(canvas)
            Screen.SAVE_SLOTS -> drawSaveSlotsScreen(canvas)
            Screen.STORY_SCENE -> drawStoryScene(canvas)
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
        Screen.ENDING -> "bg_ending"
        Screen.PET -> "bg_void"
        Screen.STORY -> "bg_corridor"
        Screen.RECRUIT -> "bg_menu"
        Screen.GROWTH, Screen.CODEX -> "bg_result"
        // 剧情演出是纯黑屏，背景图用不到，但这里是无 else 的穷尽 when 表达式，
        // 新增枚举值必须补分支，否则编译不过。
        Screen.STORY_SCENE -> "bg_void"
    }

    private fun drawBackground(c: Canvas) {
        run {
            val bmp = bitmap(bgNameForScreen())
            if (bmp != null) {
                val src = android.graphics.Rect(0, 0, bmp.width, bmp.height)
                val dst = android.graphics.RectF(0f, 0f, w, h)
                r.fill.shader = null
                r.fill.alpha = if (screen == Screen.MENU) 116 else 152
                c.drawBitmap(bmp, src, dst, r.fill)
                r.fill.alpha = 255
                r.fill.color = r.withAlpha(0xFF0B0620.toInt(), if (screen == Screen.MENU) 118 else 168)
                c.drawRect(0f, 0f, w, h, r.fill)
            }
        }
        // 只有「没有背景插画」时才铺全屏底色渐变；有插画时插画本身就是底色。
        // 旧实现无条件把不透明渐变画在插画之上，背景图被 100% 遮住，全部背景资源等于没接。
        if (bitmap(bgNameForScreen()) == null) {
            r.fill.shader = LinearGradient(0f, 0f, w * 0.4f, h, Palette.BG_TOP, Palette.BG_BOTTOM, Shader.TileMode.CLAMP)
            c.drawRect(0f, 0f, w, h, r.fill)
            r.fill.shader = null
        }

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
        // 抬到各屏底部操作区之上，避免盖住「领取神格点 / 前往轮回淬炼」等按钮
        val y = h - 252f
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

    /**
     * 当前生效的绘制裁剪区。滚出可视区的控件不应再响应点击 ——
     * 旧实现里背包靠下的格子、装备锻铸按钮滚出屏幕后仍可点到，会误扣金币。
     */
    private var hitClipActive = false
    private var hitClipTop = 0f
    private var hitClipBottom = 0f

    fun setHitClip(top: Float, bottom: Float) {
        hitClipActive = true
        hitClipTop = top
        hitClipBottom = bottom
    }

    fun clearHitClip() {
        hitClipActive = false
    }

    fun hit(id: String, x: Float, y: Float, ww: Float, hh: Float): HitRect {
        if (hitClipActive) {
            if (y + hh <= hitClipTop || y >= hitClipBottom) {
                // 完全在裁剪区外：返回一个落在屏幕外的空矩形，
                // 调用方即使把 .enabled 设回 true 也点不到。
                val dead = HitRect(0f, -10000f, 0f, 0f, id)
                hits.add(dead)
                return dead
            }
            // 部分可见：把矩形收缩到可见区间，只有露出来的那部分可点
            val cy = maxOf(y, hitClipTop)
            val chh = minOf(y + hh, hitClipBottom) - cy
            val hr = HitRect(x, cy, ww, chh, id)
            hits.add(hr)
            return hr
        }
        val hr = HitRect(x, y, ww, hh, id)
        hits.add(hr)
        return hr
    }

    /** PixelForge 按钮：3px 硬投影 + 左上高光斜面 + 2px 内描边。 */
    fun button(c: Canvas, id: String, label: String, x: Float, y: Float, ww: Float, hh: Float, accent: Int, enabled: Boolean = true, sub: String? = null) {
        r.solid(c, x + 3f, y + 3f, ww, hh, 0f, Palette.SHADOW)
        val top = if (enabled) accent else 0xFF2A2A4A.toInt()
        val bottom = if (enabled) Palette.darken(accent, 0.22f) else 0xFF1E1E38.toInt()
        r.panel(c, x, y, ww, hh, 0f, top, bottom, Palette.darken(accent, 0.45f), 2f)
        r.solid(c, x + 2f, y + 2f, ww - 4f, 2f, 0f, Palette.BEVEL)
        r.solid(c, x + 2f, y + 2f, 2f, hh - 4f, 0f, Palette.BEVEL)
        val txtCol = if (enabled) 0xFF0F0F23.toInt() else Palette.TEXT_FAINT
        val ty = if (sub == null) y + hh / 2f + 6f else y + hh / 2f - 1f
        r.text(c, label, x + ww / 2f, ty, 16f, txtCol, true, Paint.Align.CENTER)
        if (sub != null) r.text(c, sub, x + ww / 2f, y + hh / 2f + 18f, 11f, r.withAlpha(txtCol, 190), false, Paint.Align.CENTER)
        hit(id, x, y, ww, hh).enabled = enabled
    }

    /** PixelForge 次级按钮：直角 + 2px 描边 + 2px 硬投影。 */
    fun ghostButton(c: Canvas, id: String, label: String, x: Float, y: Float, ww: Float, hh: Float, accent: Int) {
        r.solid(c, x + 2f, y + 2f, ww, hh, 0f, Palette.SHADOW)
        r.panel(c, x, y, ww, hh, 0f, Palette.PANEL, Palette.PANEL_DEEP, accent, 2f)
        r.text(c, label, x + ww / 2f, y + hh / 2f + 6f, 15f, accent, true, Paint.Align.CENTER)
        hit(id, x, y, ww, hh)
    }

    /** PixelForge 卡片：直角 + 2px 内描边 + 4px 硬投影。 */
    fun card(c: Canvas, x: Float, y: Float, ww: Float, hh: Float, border: Int, radius: Float = 0f) {
        r.solid(c, x + 4f, y + 4f, ww, hh, 0f, Palette.SHADOW)
        r.panel(c, x, y, ww, hh, 0f, Palette.PANEL, Palette.PANEL_DEEP, border, 2f)
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
        // 立绘优先走 pt_ 前缀；宠物等直接用资源名命名（pet_01）的键回退原名，
        // 避免「资源明明存在却永远画成 ★ 占位」的立绘错配。
        val bmp = bitmap("pt_$key") ?: bitmap(key)
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

    /** 色弱安全的稀有度配色（蓝/橙/黄/紫/青 区分度更高）。 */
    private val cbRarity = intArrayOf(
        0xFFB0BEC5.toInt(), 0xFF64B5F6.toInt(), 0xFF4DD0E1.toInt(),
        0xFFFFB74D.toInt(), 0xFFFF7043.toInt(), 0xFFFFE082.toInt()
    )

    fun rarityColor(rr: Rarity): Int =
        if (perm.settingsColorBlind) cbRarity[(rr.rank - 1).coerceIn(0, 5)] else rr.color

    fun hpColor(pct: Double): Int = if (perm.settingsColorBlind) {
        if (pct < 0.3) 0xFFFF7043.toInt() else 0xFF64B5F6.toInt()
    } else {
        if (pct < 0.3) Palette.HP_LOW else Palette.HP_A
    }

    fun hpColorDark(pct: Double): Int = if (perm.settingsColorBlind) {
        if (pct < 0.3) 0xFFD84315.toInt() else 0xFF1E88E5.toInt()
    } else {
        if (pct < 0.3) Palette.HP_LOW else Palette.HP_B
    }

    /** 应用设置里的字号 / 语言。 */
    fun applyDisplaySettings() {
        // 上限收敛到 1.10：布局是固定像素行高，1.14 会让密集列表（战技/图鉴）开始压叠。
        // 配合 Renderer.wrap 的行距缩放，「大字号」现在是安全档位。
        r.fontScale = when (perm.settingsFontSize) {
            0 -> 0.92f
            2 -> 1.10f
            else -> 1f
        }
    }


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
                // 关键：每次按下都要复位长按标记。否则一次长按之后，本次会话内所有点击都被吞掉。
                longPressFired = false
                touchDownMs = System.currentTimeMillis()
                lastTouchVX = vx
                lastTouchVY = vy
            }
            MotionEvent.ACTION_MOVE -> {
                val dy = vy - dragLastY
                dragLastY = vy
                dragMoved += kotlin.math.abs(dy)
                if (panel.isNotEmpty() && panelScrollMax > 0f) {
                    panelScroll = (panelScroll - dy).coerceIn(0f, panelScrollMax)
                } else if (overlay.isEmpty() && detailTitle.isEmpty() && exportText.isEmpty() && screenScrollMax > 0f) {
                    screenScroll = (screenScroll - dy).coerceIn(0f, screenScrollMax)
                }
            }
            MotionEvent.ACTION_UP -> {
                val held = System.currentTimeMillis() - touchDownMs
                touchDownMs = 0L
                if (dragMoved < 14f && !longPressFired) {
                    var i = hits.size - 1
                    while (i >= 0) {
                        val hh = hits[i]
                        if (hh.enabled && hh.contains(vx, vy)) {
                            if (held >= 380L) {
                                audio.play("page")
                                handleLongPress(hh.id)
                            } else {
                                audio.play("click")
                                handleTap(hh.id)
                            }
                            return true
                        }
                        i--
                    }
                }
            }
        }
        return true
    }

    fun showDetail(title: String, body: String, icon: String = "") {
        detailTitle = title
        detailBody = body
        detailIcon = icon
        overlay = "detail"
    }

    fun handleLongPress(id: String) {
        when {
            id.startsWith("cb_skill_") -> {
                val b = battle ?: return
                val idx = id.removePrefix("cb_skill_").toIntOrNull() ?: return
                val actor = b.currentActor() ?: return
                val usable = actor.skills.filter { (actor.cooldowns[it.id] ?: 0) <= 0 }
                val sk = usable.getOrNull(idx) ?: return
                val tagText = sk.tags.joinToString(" · ") { tagName(it) }
                val body = buildString {
                    appendLine(sk.desc)
                    appendLine()
                    appendLine("类型：" + (if (sk.isUltimate) "终极技" else if (sk.isBasic) "普攻" else "战技"))
                    appendLine("耗能：" + sk.cost + "    冷却：" + sk.cd + " 回合")
                    appendLine("目标：" + when (sk.target) {
                        com.kaiju.awaken.game.TargetKind.ENEMY_ONE -> "单体敌人"
                        com.kaiju.awaken.game.TargetKind.ENEMY_ALL -> "全体敌人"
                        com.kaiju.awaken.game.TargetKind.ALLY_ONE -> "单体队友"
                        com.kaiju.awaken.game.TargetKind.ALLY_ALL -> "全体队友"
                        else -> "自身"
                    })
                    if (sk.hits > 1) appendLine("段数：" + sk.hits + " 段")
                    if (sk.coeff > 0.0) appendLine("系数：" + (sk.coeff * 100).toInt() + "% × " + sk.stat)
                    if (tagText.isNotEmpty()) appendLine("效果：" + tagText)
                }
                showDetail(sk.name, body, com.kaiju.awaken.game.ArtIcon.skill(sk))
            }
            id.startsWith("cb_item_") -> {
                val itemId = id.removePrefix("cb_item_")
                val def = com.kaiju.awaken.game.Content.itemById[itemId] ?: return
                val cnt = run?.items?.get(itemId) ?: 0
                showDetail(def.name, def.desc + "\n\n持有：" + cnt + " 个\n商店价格：" + def.price + " 金币", com.kaiju.awaken.game.ArtIcon.item(itemId))
            }
            id.startsWith("panel_skillinfo_") -> {
                val sid = id.removePrefix("panel_skillinfo_")
                val hero = run?.hero() ?: return
                val sk = hero.skills.firstOrNull { it.id == sid } ?: return
                val sb = StringBuilder()
                sb.appendLine(sk.desc)
                sb.appendLine()
                sb.appendLine("类型：" + (if (sk.isUltimate) "终极技" else if (sk.isBasic) "普攻" else "战技"))
                sb.appendLine("耗能：" + sk.cost + "    冷却：" + sk.cd + " 回合")
                sb.appendLine("目标：" + when (sk.target) {
                    com.kaiju.awaken.game.TargetKind.ENEMY_ONE -> "单体敌人"
                    com.kaiju.awaken.game.TargetKind.ENEMY_ALL -> "全体敌人"
                    com.kaiju.awaken.game.TargetKind.ALLY_ONE -> "单体队友"
                    com.kaiju.awaken.game.TargetKind.ALLY_ALL -> "全体队友"
                    else -> "自身"
                })
                if (sk.hits > 1) sb.appendLine("段数：" + sk.hits + " 段")
                if (sk.coeff > 0.0) sb.appendLine("系数：" + (sk.coeff * 100).toInt() + "% × " + sk.stat)
                val tg = sk.tags.joinToString(" · ") { tagName(it) }
                if (tg.isNotEmpty()) sb.appendLine("效果：" + tg)
                val lvNow = run?.skillLevels?.get(sk.id) ?: 1
                sb.appendLine()
                sb.appendLine("当前等级 Lv." + lvNow + " / 3（每级系数 +12%）")
                showDetail(sk.name, sb.toString(), com.kaiju.awaken.game.ArtIcon.skill(sk))
            }
            id.startsWith("panel_item_") -> {
                val itemId = id.removePrefix("panel_item_")
                val def = com.kaiju.awaken.game.Content.itemById[itemId] ?: return
                val cnt = run?.items?.get(itemId) ?: 0
                showDetail(def.name, def.desc + "\n\n持有：" + cnt + " 个\n商店价格：" + def.price + " 金币", com.kaiju.awaken.game.ArtIcon.item(itemId))
            }
            id.startsWith("panel_equip_") -> {
                val slotKey = id.removePrefix("panel_equip_")
                val e = run?.equipped?.get(slotKey) ?: return
                val sb = StringBuilder()
                val slotCn = com.kaiju.awaken.game.Content.slots.firstOrNull { it.id == slotKey }?.cn ?: slotKey
                sb.appendLine(e.rarity.cn + " · " + slotCn + " · Lv." + e.level)
                sb.appendLine()
                sb.appendLine(mainLabelOf(e.mainKey) + " +" + e.mainValue.toInt())
                for (a in e.affixes) {
                    // 机制型词条的 label 本身已含数值（「生命窃取 8%」），再拼一次就成了「8% +0」
                    if (a.isMechanic) sb.appendLine(a.label) else sb.appendLine(a.label + " +" + a.value.toInt())
                }
                if (e.setId != null) sb.appendLine("套装：" + e.setId)
                sb.appendLine()
                sb.appendLine("锻铸等级 +" + e.enhance + "（每级 +10% 主属性）")
                sb.appendLine("变卖价值 " + e.sellValue + " 金币")
                showDetail(e.name, sb.toString(), com.kaiju.awaken.game.ArtIcon.equip(e.slot))
            }
            id.startsWith("panel_merc_detail_") -> {
                val idx = id.removePrefix("panel_merc_detail_").toIntOrNull() ?: return
                val pt = run ?: return
                val u = pt.party.getOrNull(idx) ?: return
                showDetail(u.name, mercBody(u), "")
            }
            id.startsWith("panel_bagsel_") -> {
                val p = run ?: return
                val idx = id.removePrefix("panel_bagsel_").toIntOrNull() ?: return
                val e = p.bag.getOrNull(idx) ?: return
                val sb = StringBuilder()
                sb.appendLine(e.rarity.cn + " · " + e.slot)
                sb.appendLine()
                sb.appendLine(mainLabelOf(e.mainKey) + " +" + e.mainValue.toInt())
                for (a in e.affixes) {
                    // 机制型词条的 label 本身已含数值（「生命窃取 8%」），再拼一次就成了「8% +0」
                    if (a.isMechanic) sb.appendLine(a.label) else sb.appendLine(a.label + " +" + a.value.toInt())
                }
                if (e.setId != null) sb.appendLine("套装：" + e.setId)
                sb.appendLine()
                sb.appendLine("锻铸等级 +" + e.enhance + "    变卖 " + e.sellValue + " 金币")
                showDetail(e.name, sb.toString(), com.kaiju.awaken.game.ArtIcon.equip(e.slot))
            }
            id.startsWith("panel_merc_") || id == "tower_panel_merc" -> {
                val p = run ?: return
                val sb = StringBuilder()
                for (m in p.party.drop(1)) {
                    sb.appendLine(m.name + " · " + (com.kaiju.awaken.game.Data.classById[m.clsId]?.name ?: ""))
                    sb.appendLine("  " + m.rarity.cn + "  Lv." + m.level + "  " + "★".repeat(m.star))
                    val tr = m.traitId?.let { com.kaiju.awaken.game.Content2.traitById[it] }
                    sb.appendLine("  专长：" + (tr?.name ?: "无") + " — " + (tr?.desc ?: ""))
                    sb.appendLine()
                }
                if (sb.isEmpty()) sb.append("尚未招募伙伴。")
                showDetail("队伍", sb.toString())
            }
        }
    }

    /** 伙伴完整属性 + 战技，供点击查看详情使用。 */
    private fun mercBody(u: Unit): String {
        val sb = StringBuilder()
        sb.appendLine((com.kaiju.awaken.game.Data.classById[u.clsId]?.name ?: "") + " · " + u.rarity.cn + " · Lv." + u.level)
        sb.appendLine("星级 " + "★".repeat(u.star.coerceIn(1, 5)))
        val tr = u.traitId?.let { com.kaiju.awaken.game.Content2.traitById[it] }
        sb.appendLine("专长：" + (tr?.name ?: "无") + (if (tr != null) " — " + tr.desc else ""))
        sb.appendLine()
        sb.appendLine("生命 " + u.stats.maxHp.toInt() + "    攻击 " + u.stats.atk.toInt())
        sb.appendLine("法强 " + u.stats.matk.toInt() + "    防御 " + u.stats.def.toInt())
        sb.appendLine("暴击 " + u.stats.crit.toInt() + "%    暴伤 " + u.stats.critDmg.toInt() + "%")
        sb.appendLine("闪避 " + u.stats.dodge.toInt() + "%    回能 " + u.stats.energyRegen.toInt())
        sb.appendLine()
        sb.appendLine("战技：")
        for (sk in u.skills) {
            sb.appendLine("· " + sk.name + "（耗能 " + sk.cost + " / 冷却 " + sk.cd + "）")
            sb.appendLine("   " + sk.desc)
        }
        return sb.toString()
    }

    private fun mainLabelOf(key: String): String = when (key) {
        "atk" -> "攻击"
        "matk" -> "法强"
        "maxHp" -> "生命"
        "def" -> "防御"
        "crit" -> "暴击"
        "critDmg" -> "暴伤"
        "dodge" -> "闪避"
        "lifesteal" -> "吸血"
        "energyRegen" -> "回能"
        "hpRegen" -> "回血"
        else -> key
    }

    fun tagName(t: com.kaiju.awaken.game.Tag): String = when (t) {
        com.kaiju.awaken.game.Tag.DAMAGE -> "伤害"
        com.kaiju.awaken.game.Tag.HEAL -> "治疗"
        com.kaiju.awaken.game.Tag.SHIELD -> "护盾"
        com.kaiju.awaken.game.Tag.BUFF_ATK -> "攻击增益"
        com.kaiju.awaken.game.Tag.BUFF_DEF -> "防御增益"
        com.kaiju.awaken.game.Tag.BUFF_CRIT -> "暴击增益"
        com.kaiju.awaken.game.Tag.BUFF_DODGE -> "闪避增益"
        com.kaiju.awaken.game.Tag.BUFF_REGEN -> "再生"
        com.kaiju.awaken.game.Tag.DOT_BURN -> "灼烧"
        com.kaiju.awaken.game.Tag.DOT_POISON -> "中毒"
        com.kaiju.awaken.game.Tag.STUN -> "眩晕"
        com.kaiju.awaken.game.Tag.SILENCE -> "沉默"
        com.kaiju.awaken.game.Tag.ARMOR_BREAK -> "破甲"
        com.kaiju.awaken.game.Tag.WEAKEN -> "虚弱"
        com.kaiju.awaken.game.Tag.HUNTED -> "被追猎"
        com.kaiju.awaken.game.Tag.TAUNT -> "嘲讽"
        com.kaiju.awaken.game.Tag.THORNS -> "荆棘"
        com.kaiju.awaken.game.Tag.COUNTER -> "反击"
        com.kaiju.awaken.game.Tag.CLEANSE -> "净化"
        com.kaiju.awaken.game.Tag.DRAIN -> "吸取"
        com.kaiju.awaken.game.Tag.EXECUTE -> "斩杀"
        com.kaiju.awaken.game.Tag.LIFESTEAL_HIT -> "吸血"
        com.kaiju.awaken.game.Tag.EXTRA_TURN -> "额外行动"
        com.kaiju.awaken.game.Tag.DISPEL -> "驱散"
    }

    fun goScreen(s0: Screen) {
        if (screen != s0) screenScroll = 0f
        screen = s0
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
            id.startsWith("end_") -> tapEnding(id)
            id.startsWith("pet_") -> tapPet(id)
            id.startsWith("story_") -> tapStory(id)
            id.startsWith("rec_") -> tapRecruit(id)
            id.startsWith("codex_") -> tapCodex(id)
            id.startsWith("dust_") -> tapDust(id)
            id.startsWith("slot_") -> tapSlot(id)
            id.startsWith("confirm_") -> tapConfirm(id)
            id.startsWith("sc_") -> tapStoryScene(id)
            id == "detail_close" -> tapConfirm(id)
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
        if (playerName.isNotBlank()) p.hero().name = playerName
        RunService.recalcAll(p, perm)
        divinityOptions = com.kaiju.awaken.game.DraftService.rollDivinityChoices()
        for (t in divinityOptions) perm.codexSeen.add("t:" + t.id)
        // 创角后立刻进黑屏序章，播完再进神格三选一
        val clsName = com.kaiju.awaken.game.Data.classById[setupClass]?.name ?: ""
        openStory(com.kaiju.awaken.game.StoryScript.prologue(heroName(), clsName), Screen.DIVINITY)
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

    fun playLevelVoice() {
        run?.let { audio.playClassVoice(it.classId, "level") }
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
        audio.playClassVoice(p.classId, if (kind == "boss") "ult" else "start")
        if (b.playCry.isNotEmpty()) {
            audio.play(b.playCry)
            b.playCry = ""
        }
    }

    fun onBattleFinished(b: Battle) {
        val p = run ?: return
        if (b.victory) {
            val rw = TowerService.grantBattleRewards(p, perm, b)
            lastRewards = rw
            battleResult = if (b.timedOut) "回合耗尽 · 按胜利结算（奖励减半）" else "遭遇战告捷"
            audio.play("victory")
            audio.playClassVoice(p.classId, "win")
            Tracker.bump(perm, "chapterBoss", if (b.kind == "boss" && b.floor % 10 == 0) 1 else 0)
            if (b.timedOut) Tracker.bump(perm, "timeout")
            if (b.allies.all { it.hp >= it.stats.maxHp }) Tracker.bump(perm, "perfect")
            // 章节首领：首次击败掉落未拥有的宠物
            if (b.kind == "boss" && b.floor % 10 == 0) {
                val pet = com.kaiju.awaken.game.Pets.randomUnowned(perm.petsOwned)
                if (pet != null) {
                    perm.petsOwned.add(pet.id)
                    if (perm.petId == null) perm.petId = pet.id
                    showToast("获得宠物：" + pet.name)
                    audio.play("unlock")
                }
            }
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
            audio.playClassVoice(p.classId, "lose")
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
        // 抵达章节节点时插入剧情
        if (maybeShowChapterStory()) return
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
        // 主线推进
        var guard = 0
        while (guard < 30) {
            guard++
            val ch = com.kaiju.awaken.game.Story.current(perm.storyIndex) ?: break
            if (p.floor >= ch.goalFloor && !perm.chapterClaimed.contains(ch.index.toString())) break
            if (p.floor >= ch.goalFloor) { perm.storyIndex++; continue }
            break
        }
        val seenTalents = p.grid.allTalents().size
        val curSeen = perm.stats["talentsSeen"] ?: 0
        if (seenTalents > curSeen) perm.stats["talentsSeen"] = seenTalents
        val newly = Tracker.evaluate(perm)
        if (newly.isNotEmpty()) pendingAchievements = ArrayList(newly)
        p.runOver = true
        val clearedRun = p.mode.endFloor > 0 && p.floor > p.mode.endFloor
        endingStart = time
        screen = if (clearedRun) Screen.ENDING else Screen.REINCARNATION
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
            "story" -> {
                // 奇遇类事件：先把引子当成一屏剧情放出来，再回到楼层做选择
                val intro = fe.event?.intro ?: ""
                if (intro.isNotEmpty()) {
                    openStory(com.kaiju.awaken.game.StoryScript.encounter(intro, heroName()), Screen.TOWER)
                }
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
