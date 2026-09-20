package com.kaiju.awaken.ui

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import kotlin.math.cos
import kotlin.math.sin

/** 二次元风格视觉基调：深紫夜色 + 霓虹粉/青 + 玻璃卡片。 */
object Palette {
    const val BG_TOP = 0xFF150B2E.toInt()
    const val BG_BOTTOM = 0xFF07041A.toInt()
    const val PANEL = 0xFF221549.toInt()
    const val PANEL_DEEP = 0xFF170E36.toInt()
    const val PANEL_SOFT = 0xFF2C1C5E.toInt()
    const val BORDER = 0xFF6C4CE0.toInt()
    const val BORDER_SOFT = 0xFF3B2A78.toInt()
    const val PINK = 0xFFFF5FA2.toInt()
    const val CYAN = 0xFF54E8FF.toInt()
    const val GOLD = 0xFFFFD166.toInt()
    const val GREEN = 0xFF5FE8A0.toInt()
    const val RED = 0xFFFF6B6B.toInt()
    const val TEXT = 0xFFF4EFFF.toInt()
    const val TEXT_DIM = 0xFFA99CD8.toInt()
    const val TEXT_FAINT = 0xFF6F5FA8.toInt()
    const val HP_A = 0xFF63F0B0.toInt()
    const val HP_B = 0xFF2FB77E.toInt()
    const val HP_LOW = 0xFFFF5F6D.toInt()
    const val EN_A = 0xFF7FD8FF.toInt()
    const val EN_B = 0xFF4A7BFF.toInt()
    const val SHIELD = 0xFFB9A6FF.toInt()
}

class Renderer {

    val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        textAlign = Paint.Align.LEFT
    }
    val boldPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        textAlign = Paint.Align.LEFT
    }

    /** 注入游戏字体（打包在 assets/fonts 下的中文黑体）。 */
    fun setTypeface(tf: Typeface) {
        textPaint.typeface = tf
        boldPaint.typeface = tf
    }

    private val rect = RectF()
    private val path = Path()

    fun text(c: Canvas, s: String, x: Float, y: Float, size: Float, color: Int, bold: Boolean = false, align: Paint.Align = Paint.Align.LEFT) {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size
        p.color = color
        p.textAlign = align
        c.drawText(s, x, y, p)
    }

    fun measure(s: String, size: Float, bold: Boolean = false): Float {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size
        return p.measureText(s)
    }

    fun wrap(c: Canvas, s: String, x: Float, y: Float, maxW: Float, size: Float, color: Int, lineH: Float, bold: Boolean = false): Float {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size
        p.color = color
        p.textAlign = Paint.Align.LEFT
        var line = StringBuilder()
        var cy = y
        for (ch in s) {
            val test = line.toString() + ch
            if (p.measureText(test) > maxW && line.isNotEmpty()) {
                c.drawText(line.toString(), x, cy, p)
                cy += lineH
                line = StringBuilder()
            }
            line.append(ch)
        }
        if (line.isNotEmpty()) {
            c.drawText(line.toString(), x, cy, p)
            cy += lineH
        }
        return cy
    }

    fun panel(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, top: Int, bottom: Int, border: Int?, borderW: Float = 2f) {
        rect.set(x, y, x + w, y + h)
        fill.shader = LinearGradient(x, y, x, y + h, top, bottom, Shader.TileMode.CLAMP)
        c.drawRoundRect(rect, radius, radius, fill)
        fill.shader = null
        if (border != null) {
            stroke.shader = null
            stroke.color = border
            stroke.strokeWidth = borderW
            c.drawRoundRect(rect, radius, radius, stroke)
        }
    }

    fun glowPanel(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, tint: Int, alpha: Int = 40) {
        var i = 4
        while (i >= 1) {
            rect.set(x - i * 2.5f, y - i * 2.5f, x + w + i * 2.5f, y + h + i * 2.5f)
            stroke.color = (tint and 0x00FFFFFF) or ((alpha / (i + 1)) shl 24)
            stroke.strokeWidth = 2.5f
            stroke.shader = null
            c.drawRoundRect(rect, radius + i, radius + i, stroke)
            i--
        }
    }

    fun solid(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, color: Int) {
        rect.set(x, y, x + w, y + h)
        fill.shader = null
        fill.color = color
        c.drawRoundRect(rect, radius, radius, fill)
    }

    fun outline(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, color: Int, width: Float = 2f) {
        rect.set(x, y, x + w, y + h)
        stroke.shader = null
        stroke.color = color
        stroke.strokeWidth = width
        c.drawRoundRect(rect, radius, radius, stroke)
    }

    fun bar(c: Canvas, x: Float, y: Float, w: Float, h: Float, pct: Float, a: Int, b: Int, bg: Int = 0x66000000) {
        solid(c, x, y, w, h, h / 2f, bg)
        val p = pct.coerceIn(0f, 1f)
        if (p <= 0f) return
        rect.set(x, y, x + w * p, y + h)
        fill.shader = LinearGradient(x, y, x + w, y, a, b, Shader.TileMode.CLAMP)
        c.drawRoundRect(rect, h / 2f, h / 2f, fill)
        fill.shader = null
    }

    fun softBar(c: Canvas, x: Float, y: Float, w: Float, h: Float, pct: Float, color: Int) {
        solid(c, x, y, w, h, h / 2f, 0x55000000)
        val p = pct.coerceIn(0f, 1f)
        if (p <= 0f) return
        val col = (color and 0x00FFFFFF) or (0xDD shl 24)
        solid(c, x, y, w * p, h, h / 2f, col)
    }

    /** 六边形头像底框，带霓虹描边。 */
    fun hexFrame(c: Canvas, cx: Float, cy: Float, radius: Float, border: Int, fillColor: Int) {
        path.reset()
        for (i in 0 until 6) {
            val ang = Math.toRadians((60.0 * i - 90.0))
            val px = cx + (radius * cos(ang)).toFloat()
            val py = cy + (radius * sin(ang)).toFloat()
            if (i == 0) path.moveTo(px, py) else path.lineTo(px, py)
        }
        path.close()
        fill.shader = null
        fill.color = fillColor
        c.drawPath(path, fill)
        stroke.color = border
        stroke.strokeWidth = 2.5f
        c.drawPath(path, stroke)
    }

    fun sparkle(c: Canvas, cx: Float, cy: Float, r: Float, color: Int, alpha: Int = 180) {
        stroke.shader = null
        stroke.color = (color and 0x00FFFFFF) or (alpha shl 24)
        stroke.strokeWidth = 2f
        c.drawLine(cx - r, cy, cx + r, cy, stroke)
        c.drawLine(cx, cy - r, cx, cy + r, stroke)
        val d = r * 0.5f
        stroke.color = (color and 0x00FFFFFF) or ((alpha / 2) shl 24)
        c.drawLine(cx - d, cy - d, cx + d, cy + d, stroke)
        c.drawLine(cx - d, cy + d, cx + d, cy - d, stroke)
    }

    fun withAlpha(color: Int, alpha: Int): Int = (color and 0x00FFFFFF) or ((alpha.coerceIn(0, 255)) shl 24)
}

class HitRect(val x: Float, val y: Float, val w: Float, val h: Float, val id: String, var enabled: Boolean = true) {
    fun contains(px: Float, py: Float): Boolean = px >= x && px <= x + w && py >= y && py <= y + h
}

object Colors {
    fun parse(hex: String): Int = Color.parseColor(hex)
}
