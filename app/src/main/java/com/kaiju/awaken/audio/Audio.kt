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
        "victory", "defeat", "draw", "draft", "coins", "skill"
    )

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
        try {
            pool?.release()
            pool = null
        } catch (t: Throwable) {
        }
    }
}
