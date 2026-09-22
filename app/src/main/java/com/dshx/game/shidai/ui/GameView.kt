package com.dshx.game.shidai.ui

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
import com.dshx.game.shidai.game.Data
import com.dshx.game.shidai.game.Tracker
import com.dshx.game.shidai.game.DraftService
import com.dshx.game.shidai.game.Promotions
import com.dshx.game.shidai.audio.Audio
import com.dshx.game.shidai.game.Battle
import com.dshx.game.shidai.game.DraftOption
import com.dshx.game.shidai.game.GameMode
import com.dshx.game.shidai.game.PermState
import com.dshx.game.shidai.game.Rarity
import com.dshx.game.shidai.game.RunService
import com.dshx.game.shidai.game.RunState
import com.dshx.game.shidai.game.Save
import com.dshx.game.shidai.game.Skill
import com.dshx.game.shidai.game.Talent
import com.dshx.game.shidai.game.TowerService
import com.dshx.game.shidai.game.Unit
import kotlin.math.min
import kotlin.random.Random

class GameView(context: Context) : View(context), Choreographer.FrameCallback,
    com.dshx.game.shidai.tap.ComplianceManager.Listener {

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
    var shopStock: List<com.dshx.game.shidai.game.ItemDef> = emptyList()
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
    var promoOptions: List<com.dshx.game.shidai.game.PromotionDef> = emptyList()
    var promoTier = 1
    var runStartMs = 0L
    var pendingAchievements = ArrayList<com.dshx.game.shidai.game.AchDef>()
    var codexTab = 0
    var recruitList: MutableList<com.dshx.game.shidai.game.Unit> = ArrayList()
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
    /** 本次觉醒是否用过「看广告 +1 次」（每次觉醒限一次）。 */
    var draftAdUsed = false
    /** 本场战斗是否用过「看广告战果翻倍」。 */
    var rewardDoubleUsed = false
    /** 商店本次是否已用广告刷新过。 */
    var shopAdRefreshed = false
    /** 酒肆本次是否已用广告刷新过。 */
    var tavernAdRefreshed = false
    /** 已用广告回满血的层号（换层后可再用）。 */
    var healAdFloor = -1
    /** 轮回结算是否已用广告翻倍。 */
    var reincAdDoubled = false
    /** 本次进店是否已看过「领金币」广告。 */
    var shopGoldClaimed = false
    /** 是否正在等待广告加载（用于显示加载浮层）。 */
    var adLoading = false
    /** 登录闸门：未登录时挡在最前面（TapTap 登录 + 防沉迷）。 */
    var loginGate = false
    var loginBusy = false
    var loginMsg = ""
    /** 防沉迷校验中（阻断中，中性提示，不是违规）。 */
    var complianceChecking = false
    /** 防沉迷拦截（未成年人时段 / 时长上限 / 实名未通过）。 */
    var complianceBlocked = false
    var complianceMsg = ""
    /** 首启隐私页正文的滚动位置（披露条款较长，一屏放不下）。 */
    var privacyScroll = 0f
    var privacyScrollMax = 0f
    /** 加载浮层开始时间：超过一定时长给「暂时没有广告」的提示。 */
    var adLoadingSince = 0f
    /** 首启隐私政策闸门：未同意前不初始化任何广告 SDK。 */
    var privacyGate = false
    /** 是否允许个性化广告（默认关闭，合规更稳）。 */
    var privacyPersonalized = false
    /** 宠物详情浮层当前展示的宠物 id。 */
    var petDetailId = ""
    /** 上次召唤的结果（单抽 1 条 / 十连 10 条）。 */
    var petPullResults: List<com.dshx.game.shidai.game.Pets.PullResult> = emptyList()

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

    // ---- 战斗打击感 ----
    /** 镜头震动剩余时间 / 强度（设计单位）。 */
    var shakeTime = 0f
    private var shakeMag = 0f
    /** 刚受击的单位与其闪光剩余时间。 */
    var hitFlashTarget: Unit? = null
    var hitFlashTime = 0f

    /** 触发一次打击反馈。isCrit 时震动更强、闪光更亮。 */
    fun punch(target: Unit?, isCrit: Boolean) {
        hitFlashTarget = target
        hitFlashTime = if (isCrit) 0.26f else 0.18f
        shakeTime = if (isCrit) 0.26f else 0.12f
        shakeMag = if (isCrit) 7f else 2.6f
    }

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
        val ch = com.dshx.game.shidai.game.Story.current(perm.storyIndex) ?: return false
        if (p.floor < ch.goalFloor) return false
        if (perm.chapterClaimed.contains(ch.index.toString())) return false
        if (storyShownChapter == ch.index) return false
        storyShownChapter = ch.index
        openStory(com.dshx.game.shidai.game.StoryScript.chapter(ch.index, heroName()), Screen.TOWER)
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
                        perm.playerName = t
                        Save.savePerm(context, perm)
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
        // 角色名跟着存档走：轮回之后不该再让玩家重打一遍名字
        playerName = perm.playerName
        // 隐私合规：没同意过就把隐私页顶在最前，同意之前不初始化任何广告 SDK
        privacyPersonalized = com.dshx.game.shidai.ads.AdPrivacy.personalizedEnabled(context)
        privacyGate = !com.dshx.game.shidai.ads.AdPrivacy.isAccepted(context)
        if (!privacyGate) {
            setupAds()
            setupTap()
        }
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
            // 编成页返回：有角色就回前厅（那里才是中枢），没角色才回标题
            Screen.SETUP -> { screen = if (perm.playerName.isBlank()) Screen.MENU else Screen.HUB; true }
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
        if (shakeTime > 0f) shakeTime = (shakeTime - dt).coerceAtLeast(0f)
        if (hitFlashTime > 0f) hitFlashTime = (hitFlashTime - dt).coerceAtLeast(0f)
        if (toastTime > 0f) toastTime -= dt
        for (p in particles) {
            p.y -= p.vy * dt
            if (p.y < -0.05f) {
                p.y = 1.05f
                p.x = rand.nextFloat()
            }
        }
        // 门控期间冻结战斗推进：只盖一层浮盖而让战斗继续跑，
        // 等于未成年人被拦截时游戏仍在后台推进（合规不允许）。
        if (gateBlocking) return
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
        // 每出一条飘字就打一次反馈：受击方闪一下 + 镜头抖一下
        punch(ft.target, ft.isCrit)
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
        // 受击/暴击时整屏轻微抖动（幅度随时间线性衰减）
        if (shakeTime > 0f) {
            val k = (shakeTime / 0.26f).coerceIn(0f, 1f)
            canvas.translate(
                (rand.nextFloat() - 0.5f) * 2f * shakeMag * k,
                (rand.nextFloat() - 0.5f) * 2f * shakeMag * k
            )
        }
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
        // 隐私同意页永远在最上层：没同意之前其它交互都不该生效
        if (privacyGate) drawPrivacyGateOverlay(canvas)
        if (adLoading) drawAdLoadingOverlay(canvas)
        // 登录 / 防沉迷闸门：未通过之前不允许进入游戏
        if (loginGate) drawLoginGateOverlay(canvas)
        if (complianceChecking) drawComplianceCheckingOverlay(canvas)
        if (complianceBlocked) drawComplianceGateOverlay(canvas)
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

    /**
     * 统一的激励视频入口：未接入 / 未配置 / 中途关闭都会给出明确提示，
     * 只有真正看完（onRewardVerify）才会执行 [onReward]。
     */
    fun requestAd(placement: String, onReward: () -> kotlin.Unit) {
        if (!com.dshx.game.shidai.game.RewardAds.isReady()) {
            audio.play("error")
            showToast("广告还没准备好，稍后再试")
            return
        }
        audio.play("click")
        adLoading = true
        adLoadingSince = time
        com.dshx.game.shidai.game.RewardAds.request(placement) { ok ->
            post {
                adLoading = false
                if (ok) {
                    audio.play("unlock")
                    onReward()
                } else {
                    audio.play("error")
                    showToast("广告未完成，未发放奖励")
                }
                // 播完立刻预热下一条，保持「点开即看」（转化率的关键）
                val act = context as? android.app.Activity
                if (act != null) com.dshx.game.shidai.ads.AdBridge.preload(act)
            }
        }
    }

    /** 门控是否正在阻断游戏（隐私未同意 / 未登录 / 防沉迷校验中或未通过）。 */
    val gateBlocking: Boolean
        get() = privacyGate || loginGate || complianceChecking || complianceBlocked

    /**
     * 初始化 TapTap（登录 + 防沉迷）。
     * 必须在同意隐私政策之后调用 —— 首启路径由隐私页的「同意并继续」触发，
     * 已同意过的老玩家在 View 构造时触发。
     */
    fun setupTap() {
        val act = context as? android.app.Activity ?: return
        // 1) 初始化 SDK
        com.dshx.game.shidai.tap.TapHelper.init(context)
        // 2) 登录态回调
        com.dshx.game.shidai.tap.TapHelper.listener =
            object : com.dshx.game.shidai.tap.TapHelper.Listener {
                override fun onLoginChanged(openId: String?) {
                    post {
                        loginGate = openId == null
                        if (openId.isNullOrEmpty()) {
                            complianceChecking = false
                            complianceBlocked = false
                        } else {
                            // 登录成功也不能直接放行，先进校验中状态
                            complianceChecking = true
                            complianceBlocked = false
                            complianceMsg = ""
                        }
                    }
                }
            }
        // 3) 防沉迷回调（唯一放行入口是 onLoginSuccess）
        com.dshx.game.shidai.tap.ComplianceManager.register(this)
        // 4) 老玩家续校验；新玩家走登录页
        val openId = com.dshx.game.shidai.tap.TapHelper.currentOpenId()
            ?: com.dshx.game.shidai.tap.TapHelper.savedOpenId(context)
        if (openId.isNullOrEmpty()) {
            loginGate = true
        } else {
            startComplianceCheck(act, openId)
        }
    }

    /**
     * 发起一次防沉迷校验。
     * 校验期间保持阻断（complianceChecking=true），
     * 只有 SDK 回调 onLoginSuccess 才会解除 —— 没有「点一下就地放行」的路径。
     */
    fun startComplianceCheck(act: android.app.Activity, openId: String) {
        complianceChecking = true
        complianceBlocked = false
        complianceMsg = ""
        com.dshx.game.shidai.tap.ComplianceManager.register(this)
        com.dshx.game.shidai.tap.ComplianceManager.startup(act, openId)
    }

    // ----- ComplianceManager.Listener：只有 onLoginSuccess 放行 -----

    override fun onLoginSuccess() {
        post {
            complianceChecking = false
            complianceBlocked = false
            complianceMsg = ""
            loginGate = false
        }
    }

    override fun onExited() {
        post {
            complianceChecking = false
            complianceBlocked = false
            complianceMsg = ""
            loginGate = true
        }
    }

    override fun onSwitchAccount() {
        post {
            complianceChecking = false
            complianceBlocked = false
            complianceMsg = ""
            loginGate = true
        }
    }

    override fun onPeriodRestrict() {
        post {
            complianceChecking = false
            complianceMsg = "根据国家新闻出版署规定，未成年人仅可在周五、周六、周日及法定节假日的 20:00-21:00 游玩。当前时段无法进入游戏。"
            complianceBlocked = true
        }
    }

    override fun onDurationLimit() {
        post {
            complianceChecking = false
            complianceMsg = "今日游戏时长已达上限。未成年人工作日每日限玩 1.5 小时，法定节假日每日 3 小时。"
            complianceBlocked = true
        }
    }

    override fun onAgeLimit() {
        post {
            complianceChecking = false
            complianceMsg = "根据国家相关规定，该账号年龄暂不符合进入本游戏的条件。"
            complianceBlocked = true
        }
    }

    override fun onRealNameStop() {
        post {
            complianceChecking = false
            complianceMsg = "需要完成实名认证才能进入游戏，请重新校验并完成实名流程。"
            complianceBlocked = true
        }
    }

    override fun onError(message: String) {
        post {
            complianceChecking = false
            complianceMsg = message
            complianceBlocked = true
        }
    }

    /** 初始化广告并把「播放激励视频」注入 RewardAds（必须在同意隐私政策之后调用）。 */
    fun setupAds() {
        val act = context as? android.app.Activity ?: return
        com.dshx.game.shidai.ads.AdBridge.setup(act)
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
            val glyph = com.dshx.game.shidai.game.Data.classById[key]?.glyph ?: "★"
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

    // ------------------------------------------------------------ 行内图标
    // 游戏内所有「emoji 夹在文字里」的位置都改用这几个助手：
    // 有 PNG 就画图、没 PNG 就回退原来的字符，两边宽度算法一致，不会串位。

    /** 图标相对字号的默认边长。 */
    fun iconSz(textSize: Float): Float = textSize * 1.2f

    /**
     * 在 [x] 处画一个行内图标，返回后续文字应起始的 X。
     * [baselineY] 是该行文字的基线；[glyph] 为缺图时回退的原字符。
     */
    fun inlineIcon(
        c: Canvas, key: String, glyph: String, x: Float, baselineY: Float,
        textSize: Float, color: Int, size: Float = iconSz(textSize)
    ): Float {
        val gap = 4f
        if (key.isNotEmpty() && bitmap(key) != null) {
            drawIcon(c, key, x + size / 2f, baselineY - textSize * 0.34f, size, null)
            return x + size + gap
        }
        if (glyph.isEmpty()) return x
        r.text(c, glyph, x, baselineY, textSize, color, true)
        return x + r.measure(glyph, textSize, true) + gap
    }

    /** 「图标 + 数值」小片的宽度，与 [statChip] 保持一致，便于居中排版。 */
    fun chipW(value: String, textSize: Float, size: Float = iconSz(textSize)): Float =
        size + 4f + r.measure(value, textSize, true)

    /** 画一组「图标 + 数值」，返回下一组的起始 X。 */
    fun statChip(
        c: Canvas, key: String, glyph: String, value: String, x: Float, baselineY: Float,
        textSize: Float, color: Int, gap: Float = 14f, size: Float = iconSz(textSize)
    ): Float {
        val cx = inlineIcon(c, key, glyph, x, baselineY, textSize, color, size)
        r.text(c, value, cx, baselineY, textSize, color, true)
        return cx + r.measure(value, textSize, true) + gap
    }

    /** 右对齐的「数值 + 图标」：图标贴右边界，数值在左；返回整组左边界 X。 */
    fun priceRight(
        c: Canvas, text: String, key: String, glyph: String, rightX: Float,
        baselineY: Float, textSize: Float, color: Int, size: Float = iconSz(textSize)
    ): Float {
        val gap = 3f
        val tw = r.measure(text, textSize, true)
        if (key.isNotEmpty() && bitmap(key) != null) {
            drawIcon(c, key, rightX - size / 2f, baselineY - textSize * 0.34f, size, null)
            r.text(c, text, rightX - size - gap, baselineY, textSize, color, true, Paint.Align.RIGHT)
            return rightX - size - gap - tw
        }
        if (glyph.isEmpty()) return rightX
        r.text(c, glyph, rightX, baselineY, textSize, color, true, Paint.Align.RIGHT)
        r.text(c, text, rightX - r.measure(glyph, textSize, true), baselineY, textSize, color, true, Paint.Align.RIGHT)
        return rightX - r.measure(glyph, textSize, true) - tw
    }

    /** 画 [n] 颗星（ic_star），返回结束 X；缺图时回退连续 ★ 文字。 */
    fun starRow(c: Canvas, n: Int, x: Float, baselineY: Float, size: Float, color: Int): Float {
        val cnt = n.coerceIn(0, 6)
        if (cnt == 0) return x
        if (bitmap("ic_star") == null) {
            val t = "★".repeat(cnt)
            r.text(c, t, x, baselineY, size, color, true)
            return x + r.measure(t, size, true)
        }
        var cx = x
        for (i in 0 until cnt) {
            drawIcon(c, "ic_star", cx + size / 2f, baselineY - size * 0.34f, size, null)
            cx += size + 1f
        }
        return cx
    }

    /** 「星级数字」写法（★ + 数字，如 ★2），返回结束 X。 */
    fun starLevel(c: Canvas, n: Int, x: Float, baselineY: Float, size: Float, color: Int): Float {
        val cx = starRow(c, 1, x, baselineY, size, color)
        val t = n.toString()
        r.text(c, t, cx + 1f, baselineY, size * 0.88f, color, true)
        return cx + 1f + r.measure(t, size * 0.88f, true)
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
    fun sceneFor(fe: com.dshx.game.shidai.game.FloorEvent): String? {
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
                if (privacyGate) {
                    privacyScroll = (privacyScroll - dy).coerceIn(0f, privacyScrollMax)
                } else if (panel.isNotEmpty() && panelScrollMax > 0f) {
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
                        com.dshx.game.shidai.game.TargetKind.ENEMY_ONE -> "单体敌人"
                        com.dshx.game.shidai.game.TargetKind.ENEMY_ALL -> "全体敌人"
                        com.dshx.game.shidai.game.TargetKind.ALLY_ONE -> "单体队友"
                        com.dshx.game.shidai.game.TargetKind.ALLY_ALL -> "全体队友"
                        else -> "自身"
                    })
                    if (sk.hits > 1) appendLine("段数：" + sk.hits + " 段")
                    if (sk.coeff > 0.0) appendLine("系数：" + (sk.coeff * 100).toInt() + "% × " + sk.stat)
                    if (tagText.isNotEmpty()) appendLine("效果：" + tagText)
                }
                showDetail(sk.name, body, com.dshx.game.shidai.game.ArtIcon.skill(sk))
            }
            id.startsWith("cb_item_") -> {
                val itemId = id.removePrefix("cb_item_")
                val def = com.dshx.game.shidai.game.Content.itemById[itemId] ?: return
                val cnt = run?.items?.get(itemId) ?: 0
                showDetail(def.name, def.desc + "\n\n持有：" + cnt + " 个\n商店价格：" + def.price + " 金币", com.dshx.game.shidai.game.ArtIcon.item(itemId))
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
                    com.dshx.game.shidai.game.TargetKind.ENEMY_ONE -> "单体敌人"
                    com.dshx.game.shidai.game.TargetKind.ENEMY_ALL -> "全体敌人"
                    com.dshx.game.shidai.game.TargetKind.ALLY_ONE -> "单体队友"
                    com.dshx.game.shidai.game.TargetKind.ALLY_ALL -> "全体队友"
                    else -> "自身"
                })
                val lvNow = com.dshx.game.shidai.game.skillLvOf(run?.skillLevels?.get(sk.id) ?: 1)
                val mulNow = com.dshx.game.shidai.game.skillLvMul(lvNow)
                val hitsNow = com.dshx.game.shidai.game.skillHits(sk.hits, lvNow)
                if (sk.hits > 1) {
                    sb.appendLine(if (hitsNow > sk.hits) "段数：" + sk.hits + " → " + hitsNow + " 段（满级追加）"
                    else "段数：" + sk.hits + " 段")
                }
                if (sk.coeff > 0.0) sb.appendLine("系数：" + (sk.coeff * 100).toInt() + "% × " + sk.stat)
                if (sk.dotCoeff > 0.0) sb.appendLine("持续伤害系数：" + (sk.dotCoeff * 100).toInt() + "% × " + sk.stat)
                val tg = sk.tags.joinToString(" · ") { tagName(it) }
                if (tg.isNotEmpty()) sb.appendLine("效果：" + tg)
                sb.appendLine()
                // 等级收益要给出实数，否则玩家无法判断战技点花得值不值
                sb.appendLine("当前等级 Lv." + lvNow + " / 3（每级 +12%，作用于伤害/治疗/护盾/增益/持续伤害）")
                if (lvNow > 1) {
                    if (sk.coeff > 0.0) sb.appendLine("  · 系数 " + (sk.coeff * 100).toInt() + "% → " + ((sk.coeff * mulNow) * 100).toInt() + "%")
                    if (sk.dotCoeff > 0.0) sb.appendLine("  · 持续伤害 " + (sk.dotCoeff * 100).toInt() + "% → " + ((sk.dotCoeff * mulNow) * 100).toInt() + "%")
                    if (hitsNow > sk.hits) sb.appendLine("  · 段数 " + sk.hits + " → " + hitsNow)
                }
                showDetail(sk.name, sb.toString(), com.dshx.game.shidai.game.ArtIcon.skill(sk))
            }
            id.startsWith("panel_item_") -> {
                val itemId = id.removePrefix("panel_item_")
                val def = com.dshx.game.shidai.game.Content.itemById[itemId] ?: return
                val cnt = run?.items?.get(itemId) ?: 0
                showDetail(def.name, def.desc + "\n\n持有：" + cnt + " 个\n商店价格：" + def.price + " 金币", com.dshx.game.shidai.game.ArtIcon.item(itemId))
            }
            id.startsWith("panel_equip_") -> {
                val slotKey = id.removePrefix("panel_equip_")
                val e = run?.equipped?.get(slotKey) ?: return
                val sb = StringBuilder()
                val slotCn = com.dshx.game.shidai.game.Content.slots.firstOrNull { it.id == slotKey }?.cn ?: slotKey
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
                showDetail(e.name, sb.toString(), com.dshx.game.shidai.game.ArtIcon.equip(e.slot))
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
                showDetail(e.name, sb.toString(), com.dshx.game.shidai.game.ArtIcon.equip(e.slot))
            }
            id.startsWith("panel_merc_") || id == "tower_panel_merc" -> {
                val p = run ?: return
                val sb = StringBuilder()
                for (m in p.party.drop(1)) {
                    sb.appendLine(m.name + " · " + (com.dshx.game.shidai.game.Data.classById[m.clsId]?.name ?: ""))
                    sb.appendLine("  " + m.rarity.cn + "  Lv." + m.level + "  " + "★".repeat(m.star))
                    val tr = m.traitId?.let { com.dshx.game.shidai.game.Content2.traitById[it] }
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
        sb.appendLine((com.dshx.game.shidai.game.Data.classById[u.clsId]?.name ?: "") + " · " + u.rarity.cn + " · Lv." + u.level)
        sb.appendLine("星级 " + "★".repeat(u.star.coerceIn(1, 5)))
        val tr = u.traitId?.let { com.dshx.game.shidai.game.Content2.traitById[it] }
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

    fun tagName(t: com.dshx.game.shidai.game.Tag): String = when (t) {
        com.dshx.game.shidai.game.Tag.DAMAGE -> "伤害"
        com.dshx.game.shidai.game.Tag.HEAL -> "治疗"
        com.dshx.game.shidai.game.Tag.SHIELD -> "护盾"
        com.dshx.game.shidai.game.Tag.BUFF_ATK -> "攻击增益"
        com.dshx.game.shidai.game.Tag.BUFF_DEF -> "防御增益"
        com.dshx.game.shidai.game.Tag.BUFF_CRIT -> "暴击增益"
        com.dshx.game.shidai.game.Tag.BUFF_DODGE -> "闪避增益"
        com.dshx.game.shidai.game.Tag.BUFF_REGEN -> "再生"
        com.dshx.game.shidai.game.Tag.DOT_BURN -> "灼烧"
        com.dshx.game.shidai.game.Tag.DOT_POISON -> "中毒"
        com.dshx.game.shidai.game.Tag.STUN -> "眩晕"
        com.dshx.game.shidai.game.Tag.SILENCE -> "沉默"
        com.dshx.game.shidai.game.Tag.ARMOR_BREAK -> "破甲"
        com.dshx.game.shidai.game.Tag.WEAKEN -> "虚弱"
        com.dshx.game.shidai.game.Tag.HUNTED -> "被追猎"
        com.dshx.game.shidai.game.Tag.TAUNT -> "嘲讽"
        com.dshx.game.shidai.game.Tag.THORNS -> "荆棘"
        com.dshx.game.shidai.game.Tag.COUNTER -> "反击"
        com.dshx.game.shidai.game.Tag.CLEANSE -> "净化"
        com.dshx.game.shidai.game.Tag.DRAIN -> "吸取"
        com.dshx.game.shidai.game.Tag.EXECUTE -> "斩杀"
        com.dshx.game.shidai.game.Tag.LIFESTEAL_HIT -> "吸血"
        com.dshx.game.shidai.game.Tag.EXTRA_TURN -> "额外行动"
        com.dshx.game.shidai.game.Tag.DISPEL -> "驱散"
    }

    fun goScreen(s0: Screen) {
        if (screen != s0) screenScroll = 0f
        screen = s0
    }

    /**
     * 清空所有「属于当前存档 / 当前这一局」的界面状态。
     * 换存档槽、开新档、结算回标题都要走一遍，否则上一档的弹层、详情页、
     * 战斗对象、剧情分页会被下一个存档原样继承（含滚动位置）。
     */
    fun resetTransientUi() {
        // 滚动
        screenScroll = 0f
        screenScrollMax = 0f
        panelScroll = 0f
        panelScrollMax = 0f
        // 弹层
        panel = ""
        overlay = ""
        detailTitle = ""
        detailBody = ""
        detailIcon = ""
        petDetailId = ""
        petPullResults = emptyList()
        adLoading = false
        complianceChecking = false
        complianceBlocked = false
        complianceMsg = ""
        exportText = ""
        confirmMsg = ""
        confirmAction = ""
        // 局内交互
        shopStock = emptyList()
        tavernList = ArrayList()
        recruitList = ArrayList()
        bagSelected = 0
        enhanceTarget = -1
        preferredTargetId = null
        // 战斗
        battle = null
        autoBattle = false
        combatDelay = 0f
        selectedSkill = null
        selectedItem = null
        battleResult = ""
        lastRewards = null
        hitFlashTarget = null
        hitFlashTime = 0f
        shakeTime = 0f
        shakeMag = 0f
        // 抽卡 / 觉醒
        draftOptions = emptyList()
        divinityOptions = emptyList()
        picksLeft = 0
        picksTotal = 3
        replacePick = false
        pendingOption = null
        promoOptions = emptyList()
        promoTier = 1
        // 剧情
        storyPages = emptyList()
        storyPage = 0
        storyFade = 0f
        storyShownChapter = -1
        // 进度展示
        pendingAchievements = ArrayList()
        codexTab = 0
        metaReturn = Screen.MENU
        eventResult = ""
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
            id.startsWith("priv_") -> tapPrivacy(id)
            id.startsWith("tap_") -> tapLoginGate(id)
            id == "detail_close" -> tapConfirm(id)
        }
    }

    // ------------------------------------------------------------ 流程

    /** 用存档里的角色档案初始化编成页（角色名 / 职阶 / 试炼强度）。 */
    fun prepareSetup() {
        if (perm.playerName.isNotBlank()) {
            playerName = perm.playerName
            setupClass = perm.lastClass
            setupMode = GameMode.byId(perm.lastMode)
            setupClimbLevel = setupClimbLevel.coerceIn(1, perm.climbMaxUnlocked)
        }
    }

    /**
     * 创建角色：只写入角色档案（名字 / 职阶 / 试炼强度），随即播一次序章，
     * 播完进「回廊前厅」。真正的远征要玩家在城镇里按「出发远征」才开始 ——
     * 旧流程是剧情一完就直接丢进塔里，城镇变成了一个看不懂的空页面。
     */
    fun createCharacter() {
        perm.playerName = playerName
        perm.lastClass = setupClass
        perm.lastMode = setupMode.id
        Save.savePerm(context, perm)
        audio.playBgm("city")
        val clsName = com.dshx.game.shidai.game.Data.classById[setupClass]?.name ?: ""
        openStory(com.dshx.game.shidai.game.StoryScript.prologue(heroName(), clsName), Screen.HUB)
    }

    fun startRun() {
        val p = RunService.newRun(setupMode, setupClass, perm)
        p.climbLevel = if (setupMode == GameMode.CLIMB) setupClimbLevel.coerceIn(1, perm.climbMaxUnlocked) else 1
        runStartMs = System.currentTimeMillis()
        perm.classPlayed.add(setupClass)
        // 记住本局的编成：下次从回廊前厅出发时沿用同一套默认值
        perm.lastClass = setupClass
        perm.lastMode = setupMode.id
        Save.savePerm(context, perm)
        run = p
        if (playerName.isNotBlank()) p.hero().name = playerName
        RunService.recalcAll(p, perm)
        divinityOptions = com.dshx.game.shidai.game.DraftService.rollDivinityChoices()
        for (t in divinityOptions) perm.codexSeen.add("t:" + t.id)
        // 序章只在「创建角色」时播一次；从城镇出发直接进神格觉醒
        goScreen(Screen.DIVINITY)
        audio.playBgm("city")
    }

    fun beginDraft(picks: Int) {
        val p = run ?: return
        draftAdUsed = false
        picksTotal = picks
        picksLeft = picks
        draftOptions = com.dshx.game.shidai.game.DraftService.roll(p, perm, com.dshx.game.shidai.game.DraftService.optionCount(p, perm))
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

    /**
     * 把本队可能用到的语音先解码好。
     * SoundPool 首次 load 是异步的，不预热的话第一次释放技能会「点了没声音」。
     */
    private fun preloadBattleVoices() {
        val p = run ?: return
        val names = ArrayList<String>()
        for (u in p.party) {
            for (sk in u.skills) names.add("v_sk_" + sk.id)
        }
        audio.preloadVoices(names)
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
        rewardDoubleUsed = false
        autoBattle = false
        selectedSkill = null
        selectedItem = null
        combatDelay = 0.4f
        screen = Screen.COMBAT
        preloadBattleVoices()
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
            // 宠物不再由首领掉落：召唤券只能看广告获得（见 ScreenPet 的宠物召唤）
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

    fun resolveEvent(choice: com.dshx.game.shidai.game.EventChoice) {
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
            com.dshx.game.shidai.game.Promotions.tier1For(p.classId)
        } else {
            com.dshx.game.shidai.game.Promotions.tier2For(p.promotionId ?: "")
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

    fun popAchievements(): List<com.dshx.game.shidai.game.AchDef> {
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
            val ch = com.dshx.game.shidai.game.Story.current(perm.storyIndex) ?: break
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
        reincAdDoubled = false
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
                shopGoldClaimed = false
                shopAdRefreshed = false
                overlay = "shop"
            }
            "tavern" -> {
                tavernList = ArrayList(TowerService.tavernCandidates(p.floor))
                tavernAdRefreshed = false
                overlay = "tavern"
            }
            "story" -> {
                // 奇遇类事件：先把引子当成一屏剧情放出来，再回到楼层做选择
                val intro = fe.event?.intro ?: ""
                if (intro.isNotEmpty()) {
                    openStory(com.dshx.game.shidai.game.StoryScript.encounter(intro, heroName()), Screen.TOWER)
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
