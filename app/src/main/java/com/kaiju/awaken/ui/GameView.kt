package com.kaiju.awaken.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View

/**
 * Root render surface. Placeholder build used to validate the CI pipeline.
 */
class GameView(context: Context) : View(context), Choreographer.FrameCallback {

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var lastFrame = 0L
    private var running = false

    init {
        setBackgroundColor(Color.BLACK)
    }

    fun onResumeGame() {
        if (\!running) {
            running = true
            lastFrame = 0L
            Choreographer.getInstance().postFrameCallback(this)
        }
    }

    fun onPauseGame() {
        running = false
        Choreographer.getInstance().removeFrameCallback(this)
    }

    fun dispose() {
        onPauseGame()
    }

    fun onBackPressed(): Boolean = false

    override fun doFrame(frameTimeNanos: Long) {
        if (\!running) return
        val dtMs = if (lastFrame == 0L) 0L else (frameTimeNanos - lastFrame) / 1_000_000L
        lastFrame = frameTimeNanos
        update(dtMs)
        invalidate()
        Choreographer.getInstance().postFrameCallback(this)
    }

    private fun update(dtMs: Long) {
        // placeholder
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        paint.color = Color.parseColor("#8CE7FF")
        paint.textSize = 48f
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText("BUILD OK", width / 2f, height / 2f, paint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        return true
    }
}
