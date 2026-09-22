package com.dshx.game.shidai

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import com.dshx.game.shidai.ui.GameView

class MainActivity : Activity() {

    private var gameView: GameView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val attrs = window.attributes
            attrs.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            window.attributes = attrs
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }

        val view = GameView(this)
        gameView = view
        setContentView(view)

        // 关键：必须在 setContentView 之后。
        // Android R+ 的 window.insetsController 依赖 DecorView 已创建，
        // 过早调用会在 PhoneWindow.getInsetsController() 内部直接抛 NPE。
        applyImmersive()
    }

    private fun applyImmersive() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val controller = window.insetsController
                if (controller != null) {
                    controller.hide(WindowInsets.Type.systemBars())
                    controller.systemBarsBehavior =
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    )
            }
        } catch (t: Throwable) {
            // 沉浸式只是观感，失败绝不应当让游戏崩溃
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) applyImmersive()
    }

    override fun onResume() {
        super.onResume()
        applyImmersive()
        gameView?.onResumeGame()
    }

    override fun onPause() {
        super.onPause()
        gameView?.onPauseGame()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val handled = gameView?.onBackPressed() ?: false
        if (handled) return
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }

    override fun onDestroy() {
        gameView?.destroy()
        super.onDestroy()
    }
}
