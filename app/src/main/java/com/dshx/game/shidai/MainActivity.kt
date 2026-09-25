package com.dshx.game.shidai

import android.app.Activity
import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.dshx.game.shidai.ads.AdPrivacy
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

        // 首启先显示系统原生隐私弹窗；未同意前不创建 GameView，也不初始化 SDK。
        if (AdPrivacy.isAccepted(this)) {
            startGame()
        } else {
            showPrivacyConsent()
        }
    }

    private fun startGame() {
        if (!AdPrivacy.isAccepted(this) || gameView != null) return
        val view = GameView(this)
        gameView = view
        setContentView(view)
        // window.insetsController 依赖 DecorView，必须在 setContentView 之后。
        applyImmersive()
        if (!isFinishing) view.onResumeGame()
    }

    private fun showPrivacyConsent() {
        val padding = (20 * resources.displayMetrics.density).toInt()
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding / 2, padding, padding / 2)
        }
        val terms = TextView(this).apply {
            textSize = 14f
            text = """欢迎使用《穿越星塔：全民登临时代》！请先阅读并决定是否同意以下条款。

一、我们收集的信息
设备型号、操作系统版本（用于适配和优化）；OAID、AndroidID（用于广告展示、效果统计与反作弊）；网络类型（用于广告加载）；游戏存档数据（仅存储在本地设备）；应用崩溃日志（用于修复问题）。

二、信息使用目的
提供游戏服务、保存游戏进度；展示广告支持免费运营；优化性能与修复问题。

三、第三方 SDK 及其收集的信息
TapTap 登录 SDK：获取 AndroidID、设备型号与系统版本，用于登录与身份鉴权。
TapTap 防沉迷 SDK：获取实名认证信息，用于未成年人保护。
移动安全联盟 OAID SDK：获取 OAID，用于生成广告标识。
Tosin / TopOn 及其穿山甲、优量汇、快手、百度、Sigmob 等广告平台：获取 OAID、AndroidID、设备型号与系统版本、网络状态和设备 IP，用于广告投放、效果归因与反作弊。

四、隐私保护与您的权利
已关闭 IMEI、设备序列号、MAC、定位、已安装应用列表及录音等敏感信息采集；点击同意之前不会初始化第三方 SDK 或读取设备标识。您可在游戏的「关于与隐私」中查看政策；不同意则退出游戏。""".trimIndent()
        }
        content.addView(terms)
        content.addView(Button(this).apply {
            text = "查看完整《隐私政策》"
            setOnClickListener { AdPrivacy.openPolicy(this@MainActivity) }
        })
        val scroll = ScrollView(this).apply { addView(content) }
        val dialog = AlertDialog.Builder(this)
            .setTitle("隐私政策与用户协议")
            .setView(scroll)
            .setNegativeButton("不同意并退出") { _, _ -> finishAffinity() }
            .setPositiveButton("同意并继续", null)
            .create()
        dialog.setCancelable(false)
        dialog.setCanceledOnTouchOutside(false)
        dialog.setOnShowListener {
            // 保存成功后才解除门控，避免按钮默认行为提前关闭协议弹窗。
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                AdPrivacy.accept(this, true)
                if (AdPrivacy.isAccepted(this)) {
                    dialog.dismiss()
                    startGame()
                } else {
                    Toast.makeText(this, "隐私授权保存失败，请重试", Toast.LENGTH_SHORT).show()
                }
            }
        }
        dialog.show()
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
