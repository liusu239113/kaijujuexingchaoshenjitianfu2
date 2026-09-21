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


    private var voice: MediaPlayer? = null

    /** 播放人物语音（覆盖式，同一时刻只播一条）。 */
    fun playVoice(name: String) {
        if (!sfxOn) return
        val id = rawId(name)
        if (id == 0) return
        try {
            voice?.release()
            voice = MediaPlayer.create(ctx, id)?.apply {
                setVolume(0.9f, 0.9f)
                start()
                setOnCompletionListener { it.release() }
            }
        } catch (t: Throwable) {
        }
    }

    /** 职阶 → 音色档案（4 套音色覆盖 8 个职阶）。 */
    fun voiceProfile(clsId: String): String = when (clsId) {
        "assassin", "vampire" -> "blade"    // 夜刃 · 冷冽男声
        "priest" -> "priest"                // 圣歌使 · 治愈女声
        "ranger" -> "ranger"                // 岚射手 · 元气女声
        "mage", "puppeteer" -> "f"          // 星咏者 · 清冷女声
        else -> "m"                         // 曜铁卫 · 热血男声（战士 / 德鲁伊）
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
            voice?.release()
            voice = null
        } catch (t: Throwable) {
        }
        try {
            pool?.release()
            pool = null
        } catch (t: Throwable) {
        }
    }
}
