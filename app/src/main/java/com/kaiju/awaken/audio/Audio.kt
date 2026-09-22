package com.kaiju.awaken.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import android.util.Log

/**
 * BGM 用 MediaPlayer 流式循环播放，音效用 SoundPool 低延迟触发。
 * 资源缺失时不抛异常，静默降级。
 */
class Audio(private val ctx: Context) {

    private var bgm: MediaPlayer? = null
    private var currentTrack = ""
    private var pool: SoundPool? = null
    private val sfxIds = HashMap<String, Int>()
    private val loaded = HashSet<String>()

    var musicOn = true
    var sfxOn = true
    var musicVolume = 0.7f
    var sfxVolume = 0.9f

    private val trackFiles = mapOf(
        "city" to "bgm_city",
        "tower" to "bgm_tower",
        "battle" to "bgm_battle",
        "boss" to "bgm_boss"
    )

    private val sfxFiles = listOf(
        "click", "hit", "crit", "heal", "shield", "levelup",
        "victory", "defeat", "draw", "draft", "coins", "skill",
        "unlock", "error", "page", "starup", "ult", "revive",
        "amb_campfire", "amb_wind", "amb_water", "amb_bell"
    )

    private val ambienceFiles = listOf("amb_campfire", "amb_wind", "amb_water", "amb_bell")

    /** 宠物叫声（资源名即作为播放 key）。 */
    private val petCryFiles = listOf(
        "pet_cry_fox", "pet_cry_bird", "pet_cry_beast",
        "pet_cry_magic", "pet_cry_bat", "pet_cry_dragon"
    )
    private var ambience: MediaPlayer? = null
    private var currentAmbience = ""

    /** 环境音（与 BGM 并行播放）。 */
    fun playAmbience(name: String) {
        if (!sfxOn) return
        if (currentAmbience == name && ambience?.isPlaying == true) return
        val id = rawId("sfx_" + name)
        if (id == 0) return
        try {
            ambience?.release()
            ambience = MediaPlayer.create(ctx, id)?.apply {
                isLooping = true
                setVolume(0.25f, 0.25f)
                start()
            }
            currentAmbience = name
        } catch (t: Throwable) {
        }
    }

    fun stopAmbience() {
        try {
            ambience?.release()
            ambience = null
            currentAmbience = ""
        } catch (t: Throwable) {
        }
    }

    fun init() {
        try {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            pool = SoundPool.Builder().setMaxStreams(12).setAudioAttributes(attrs).build()
            for (name in sfxFiles) {
                val id = rawId("sfx_$name")
                if (id != 0) {
                    val sid = pool?.load(ctx, id, 1)
                    if (sid != null && sid != 0) sfxIds[name] = sid
                }
            }
            // 宠物叫声的资源名就是 pet_cry_xxx（不带 sfx_ 前缀），
            // 旧实现只加载 sfx_ 前缀，导致 Pets.cry() 拿到的名字永远查不到 → 叫声一直静音。
            for (name in petCryFiles) {
                val id = rawId(name)
                if (id != 0) {
                    val sid = pool?.load(ctx, id, 1)
                    if (sid != null && sid != 0) sfxIds[name] = sid
                }
            }
        } catch (t: Throwable) {
            Log.w("KaijuAudio", "sfx init failed", t)
        }
    }

    private fun rawId(name: String): Int = try {
        ctx.resources.getIdentifier(name, "raw", ctx.packageName)
    } catch (t: Throwable) {
        0
    }

    fun playBgm(track: String) {
        if (!musicOn) return
        if (currentTrack == track && bgm?.isPlaying == true) return
        val file = trackFiles[track] ?: return
        val id = rawId(file)
        if (id == 0) return
        try {
            bgm?.release()
            bgm = MediaPlayer.create(ctx, id)?.apply {
                isLooping = true
                setVolume(musicVolume, musicVolume)
                start()
            }
            currentTrack = track
            when (track) {
                "city" -> playAmbience("amb_campfire")
                "tower" -> playAmbience("amb_wind")
                "battle", "boss" -> playAmbience("amb_water")
                else -> stopAmbience()
            }
        } catch (t: Throwable) {
            Log.w("KaijuAudio", "bgm failed: $track", t)
        }
    }

    fun setMusicEnabled(on: Boolean) {
        musicOn = on
        if (!on) {
            bgm?.pause()
        } else {
            bgm?.start()
        }
    }

    fun setVolume(v: Int) {
        musicVolume = (v.coerceIn(0, 100)) / 100f
        bgm?.setVolume(musicVolume, musicVolume)
    }

    fun play(name: String) {
        if (!sfxOn) return
        val sid = sfxIds[name] ?: return
        if (loaded.contains(name)) {
            pool?.play(sid, sfxVolume, sfxVolume, 1, 0, 1f)
        } else {
            loaded.add(name)
            pool?.play(sid, sfxVolume, sfxVolume, 1, 0, 1f)
        }
    }


    private var voiceFallback: MediaPlayer? = null

    /**
     * 语音专用 SoundPool。
     * 旧实现每次都用 MediaPlayer.create() 现场解码，单次 30~80ms ——
     * 表现出来就是「点完技能要顿一下才出声」。SoundPool 首次加载后起播只要几毫秒。
     */
    private var voicePool: SoundPool? = null
    private val voiceIds = HashMap<String, Int>()
    private var voiceStream = 0
    /** 已解码完成的样本 id。SoundPool.load 是异步的，没解码完就 play 会静默失败。 */
    private val voiceReady = HashSet<Int>()
    /** 样本就绪后要补播的语音名。 */
    private var pendingVoice: String? = null

    /** 语音播放速率。1.0 = 原速；大于 1 更快、音调略高。 */
    var voiceRate = 1.10f

    private fun ensureVoicePool(): SoundPool? {
        if (voicePool == null) {
            try {
                val attrs = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
                val sp = SoundPool.Builder().setMaxStreams(2).setAudioAttributes(attrs).build()
                voicePool = sp
                // 「第一次点了没声音、第二次才有」的根因：load() 还没解码完，
                // play() 会返回 0 且不报错。这里记下待播语音，样本就绪后立刻补播。
                sp.setOnLoadCompleteListener { _, sampleId, status ->
                    if (status == 0) {
                        voiceReady.add(sampleId)
                        val pending = pendingVoice
                        if (pending != null && voiceIds[pending] == sampleId) {
                            pendingVoice = null
                            startVoice(sampleId)
                        }
                    }
                }
            } catch (t: Throwable) {
                voicePool = null
            }
        }
        return voicePool
    }

    private fun startVoice(sid: Int) {
        val vp = voicePool ?: return
        if (voiceStream != 0) vp.stop(voiceStream)
        voiceStream = vp.play(sid, 0.9f, 0.9f, 1, 0, voiceRate)
    }

    /** 播放人物语音（覆盖式，同一时刻只播一条）。 */
    fun playVoice(name: String) {
        if (!sfxOn) return
        val vp = ensureVoicePool() ?: return
        val cached = voiceIds[name]
        val sid: Int = if (cached == null) {
            val rid = rawId(name)
            if (rid == 0) return
            val s = try { vp.load(ctx, rid, 1) } catch (t: Throwable) { 0 }
            voiceIds[name] = s
            s
        } else {
            cached
        }
        if (sid == 0) return
        if (voiceReady.contains(sid)) startVoice(sid) else pendingVoice = name
    }

    /**
     * 预热：先把这些语音交给 SoundPool 解码。
     * 进战斗前调用，玩家第一次点技能就有声音。
     */
    fun preloadVoices(names: List<String>) {
        val vp = ensureVoicePool() ?: return
        for (n in names) {
            if (voiceIds.containsKey(n)) continue
            val rid = rawId(n)
            if (rid == 0) continue
            voiceIds[n] = try { vp.load(ctx, rid, 1) } catch (t: Throwable) { 0 }
        }
    }

    /** 职阶 → 音色档案（4 套音色覆盖 8 个职阶）。 */
    fun voiceProfile(clsId: String): String = when (clsId) {
        // 立绘为女性的职阶：夜刃 / 森语者 / 星咏者 / 鸣丝使。
        // 这三条线的专属技能语音已按女声重录，回退音色必须一起改，
        // 否则同一个角色会出现「放技能是女声、开场/获胜/倒下是男声」。
        "assassin", "druid", "mage", "puppeteer" -> "f"
        "vampire" -> "blade"                // 绯血裔 · 立绘为男性 → 冷冽男声
        "priest" -> "priest"                // 圣歌使 · 治愈女声
        "ranger" -> "ranger"                // 岚射手 · 元气女声
        else -> "m"                         // 曜铁卫 · 热血男声
    }

    fun playClassVoice(clsId: String, kind: String) {
        playVoice("v_" + voiceProfile(clsId) + "_" + kind)
    }

    /** 该技能是否有专属语音资源。 */
    fun hasSkillVoice(skillId: String): Boolean = rawId("v_sk_" + skillId) != 0

    /**
     * 技能语音：优先播放该技能的专属语音（v_sk_<skillId>，语气按技能名与效果定制），
     * 资源缺失时回退到职阶通用语音（v_<profile>_<kind>），保证任何情况下都不会静音。
     */
    fun playSkillVoice(clsId: String, skillId: String, kind: String) {
        val name = "v_sk_" + skillId
        if (rawId(name) != 0) playVoice(name) else playClassVoice(clsId, kind)
    }

    /** 任意角色（含伙伴）按自身职阶播放语音。 */
    fun playUnitVoice(clsId: String, kind: String) = playClassVoice(clsId, kind)

    fun pauseAll() {
        try {
            bgm?.pause()
        } catch (t: Throwable) {
        }
    }

    fun resumeAll() {
        if (musicOn) {
            try {
                bgm?.start()
            } catch (t: Throwable) {
            }
        }
    }

    fun release() {
        try {
            bgm?.release()
            bgm = null
        } catch (t: Throwable) {
        }
        stopAmbience()
        try {
            voiceFallback?.release()
            voiceFallback = null
        } catch (t: Throwable) {
        }
        try {
            voicePool?.release()
            voicePool = null
            voiceIds.clear()
        } catch (t: Throwable) {
        }
        try {
            pool?.release()
            pool = null
        } catch (t: Throwable) {
        }
    }
}
