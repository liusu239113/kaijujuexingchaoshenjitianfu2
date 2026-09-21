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

/**
 * PixelForge 像素风设计令牌（移植自 ui-pixelforge 设计规范）。
 * 规则：圆角恒为 0 / 2px 内描边（填充色的暗一档）/ 零模糊硬投影 / 深色高对比底。
 */
object Palette {
    // 底色
    const val BG_TOP = 0xFF0F0F23.toInt()
    const val BG_BOTTOM = 0xFF08081A.toInt()
    const val PANEL = 0xFF1B1B3A.toInt()
    const val PANEL_DEEP = 0xFF14142C.toInt()
    const val PANEL_SOFT = 0xFF252550.toInt()
    const val BORDER = 0xFF3A3A6A.toInt()
    const val BORDER_SOFT = 0xFF2E2E56.toInt()

    // 强调色（高饱和）
    const val PINK = 0xFF21BDAE.toInt()      // primary 青绿
    const val CYAN = 0xFF45AAF2.toInt()      // info 亮蓝
    const val GOLD = 0xFFFFD93D.toInt()      // warning 亮黄
    const val GREEN = 0xFF50C878.toInt()     // success 亮绿
    const val RED = 0xFFFF4757.toInt()       // error 亮红
    const val PURPLE = 0xFF6C5CE7.toInt()    // secondary 紫

    // 文本
    const val TEXT = 0xFFF0F0F0.toInt()
    const val TEXT_DIM = 0xFFA0A0C0.toInt()
    const val TEXT_FAINT = 0xFF505070.toInt()

    // 状态条
    const val HP_A = 0xFF50C878.toInt()
    const val HP_B = 0xFF3AA85E.toInt()
    const val HP_LOW = 0xFFFF4757.toInt()
    const val EN_A = 0xFF45AAF2.toInt()
    const val EN_B = 0xFF2E7BD6.toInt()
    const val SHIELD = 0xFF6C5CE7.toInt()

    /** 零模糊硬投影颜色。 */
    const val SHADOW = 0xCC0A0A1A.toInt()
    /** 按钮左上高光斜面。 */
    const val BEVEL = 0x30FFFFFF

    /** 12 阶暗化，用于内描边。 */
    fun darken(color: Int, amount: Float = 0.30f): Int {
        val a = (color ushr 24) and 0xFF
        val r = ((color ushr 16) and 0xFF) * (1f - amount)
        val g = ((color ushr 8) and 0xFF) * (1f - amount)
        val b = (color and 0xFF) * (1f - amount)
        return (a shl 24) or (r.toInt().coerceIn(0, 255) shl 16) or
            (g.toInt().coerceIn(0, 255) shl 8) or b.toInt().coerceIn(0, 255)
    }

    /** 提亮，用于高光/悬停。 */
    fun lighten(color: Int, amount: Float = 0.18f): Int {
        val a = (color ushr 24) and 0xFF
        val r = ((color ushr 16) and 0xFF) + (255 - ((color ushr 16) and 0xFF)) * amount
        val g = ((color ushr 8) and 0xFF) + (255 - ((color ushr 8) and 0xFF)) * amount
        val b = (color and 0xFF) + (255 - (color and 0xFF)) * amount
        return (a shl 24) or (r.toInt().coerceIn(0, 255) shl 16) or
            (g.toInt().coerceIn(0, 255) shl 8) or b.toInt().coerceIn(0, 255)
    }
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

    /** 全局字号缩放（1.0 = 100%）。 */
    var fontScale = 1f
    /** 0..1 脉冲值，用于血条高光呼吸。 */
    var pctPulse = 0f

    /**
     * 行高随字号等比缩放。调用方传「设计基准行高」，
     * 保证选「大字号」时文字变大、行距同步变大，而不会互相压叠。
     */
    fun lh(base: Float): Float = base * fontScale

    /** 注入游戏字体（打包在 assets/fonts 下的中文黑体）。 */
    fun setTypeface(tf: Typeface) {
        textPaint.typeface = tf
        boldPaint.typeface = tf
    }

    private val rect = RectF()
    private val path = Path()

    fun text(c: Canvas, s: String, x: Float, y: Float, size: Float, color: Int, bold: Boolean = false, align: Paint.Align = Paint.Align.LEFT) {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size * fontScale
        p.color = color
        p.textAlign = align
        c.drawText(s, x, y, p)
    }

    fun measure(s: String, size: Float, bold: Boolean = false): Float {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size * fontScale
        return p.measureText(s)
    }

    fun wrap(c: Canvas, s: String, x: Float, y: Float, maxW: Float, size: Float, color: Int, lineH: Float, bold: Boolean = false): Float {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size * fontScale
        p.color = color
        p.textAlign = Paint.Align.LEFT
        var line = StringBuilder()
        var cy = y
        for (ch in s) {
            val test = line.toString() + ch
            if (p.measureText(test) > maxW && line.isNotEmpty()) {
                c.drawText(line.toString(), x, cy, p)
                // 行距随 fontScale 一起放大，否则大字号下多行文本会逐行压叠
                cy += lineH * fontScale
                line = StringBuilder()
            }
            line.append(ch)
        }
        if (line.isNotEmpty()) {
            c.drawText(line.toString(), x, cy, p)
            cy += lineH * fontScale
        }
        return cy
    }

fun panel(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, top: Int, bottom: Int, border: Int?, borderW: Float = 2f, shadow: Float = 0f) {
        if (shadow > 0f) {
            fill.shader = null
            fill.color = Palette.SHADOW
            c.drawRect(x + shadow, y + shadow, x + w + shadow, y + h + shadow, fill)
        }
        rect.set(x, y, x + w, y + h)
        fill.shader = LinearGradient(x, y, x, y + h, top, bottom, Shader.TileMode.CLAMP)
        c.drawRect(rect, fill)
        fill.shader = null
        if (border != null) {
            val ins = borderW / 2f
            stroke.shader = null
            stroke.color = border
            stroke.strokeWidth = borderW
            rect.set(x + ins, y + ins, x + w - ins, y + h - ins)
            c.drawRect(rect, stroke)
        }
    }

fun glowPanel(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, tint: Int, alpha: Int = 40) {
        fill.shader = null
        fill.color = Palette.SHADOW
        c.drawRect(x + 3f, y + 3f, x + w + 3f, y + h + 3f, fill)
        stroke.shader = null
        stroke.color = (tint and 0x00FFFFFF) or (alpha.coerceIn(0, 255) shl 24)
        stroke.strokeWidth = 2f
        c.drawRect(x - 1f, y - 1f, x + w + 1f, y + h + 1f, stroke)
    }

fun solid(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, color: Int) {
        fill.shader = null
        fill.color = color
        c.drawRect(x, y, x + w, y + h, fill)
    }

fun outline(c: Canvas, x: Float, y: Float, w: Float, h: Float, radius: Float, color: Int, width: Float = 2f) {
        stroke.shader = null
        stroke.color = color
        stroke.strokeWidth = width
        val ins = width / 2f
        c.drawRect(x + ins, y + ins, x + w - ins, y + h - ins, stroke)
    }

    fun bar(c: Canvas, x: Float, y: Float, w: Float, h: Float, pct: Float, a: Int, b: Int, bg: Int = 0x66000000) {
        solid(c, x, y, w, h, 0f, bg)
        val p = pct.coerceIn(0f, 1f)
        val vp = pctPulse
        if (p <= 0f) return
        fill.shader = null
        fill.color = a
        c.drawRect(x, y, x + w * p, y + h, fill)
        // 高光条（脉冲变化，便于肉眼确认条在动）
        fill.color = Palette.lighten(a, 0.25f + 0.25f * vp)
        c.drawRect(x, y, x + w * p, y + h * 0.45f, fill)
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
        rect.set(cx - radius, cy - radius, cx + radius, cy + radius)
        fill.shader = null
        fill.color = fillColor
        c.drawRect(rect, fill)
        stroke.shader = null
        stroke.color = border
        stroke.strokeWidth = 2f
        c.drawRect(rect, stroke)
    }

    /**
     * 同 wrap，但最多输出 maxLines 行；被截断时在末行补「…」。
     * 用于「描述可能超长、但卡片高度固定」的场景，避免文字溢出卡片被裁掉。
     */
    fun wrapClamp(c: Canvas, s: String, x: Float, y: Float, maxW: Float, size: Float, color: Int, lineH: Float, maxLines: Int, bold: Boolean = false): Float {
        val p = if (bold) boldPaint else textPaint
        p.textSize = size * fontScale
        p.color = color
        p.textAlign = Paint.Align.LEFT
        val step = lineH * fontScale
        val linesList = ArrayList<String>()
        var line = StringBuilder()
        var cut = false
        for (ch in s) {
            val test = line.toString() + ch
            if (p.measureText(test) > maxW && line.isNotEmpty()) {
                linesList.add(line.toString())
                line = StringBuilder()
                if (linesList.size >= maxLines) { cut = true; break }
            }
            line.append(ch)
        }
        if (linesList.size < maxLines) {
            if (line.isNotEmpty()) linesList.add(line.toString())
        } else if (line.isNotEmpty()) {
            cut = true
        }
        if (cut && linesList.isNotEmpty()) {
            var t = linesList[linesList.size - 1]
            while (t.isNotEmpty() && p.measureText(t + "…") > maxW) t = t.substring(0, t.length - 1)
            linesList[linesList.size - 1] = t + "…"
        }
        var cy = y
        for (t in linesList) {
            c.drawText(t, x, cy, p)
            cy += step
        }
        return cy
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
