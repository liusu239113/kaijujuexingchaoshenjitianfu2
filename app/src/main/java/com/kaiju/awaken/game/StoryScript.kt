package com.kaiju.awaken.game

/**
 * 剧情文本。
 *
 * 每条是一个「页」，玩家点屏幕翻页。
 * 文字里可用 {name} / {cls} / {mode} 占位，渲染前替换。
 */
object StoryScript {

    fun fill(s: String, playerName: String, clsName: String): String =
        s.replace("{name}", playerName).replace("{cls}", clsName)

    /** 创角之后的序章。 */
    fun prologue(playerName: String, clsName: String): List<String> = listOf(
        "回廊深处没有风，却有温度。",
        "你睁开眼的时候，先看见的是自己的手——掌心有一道旧疤，你自己也不知道它从哪来。",
        "「{name}。」\n有人在很远的地方叫你的名字。声音很轻，像怕吵醒什么。",
        "你沿着石阶往上走。墙上的星语灯一盏接一盏亮起，照出历代拾语者刻下的名字。\n最下面那一行，是你的。",
        "灯焰在最后一格停住了。\n一团没有形状的光悬在你面前——它说，它会成为你的「神格」。",
        "「{cls}。」\n你报出了自己的道路。光散开，落进你身体里。\n\n从这一刻起，回廊开始记住你了。"
    ).map { fill(it, playerName, clsName) }

    /** 章节开场剧情。 */
    fun chapter(ch: ChapterDef, playerName: String): List<String> = listOf(
        "第 " + ch.index + " 章 · " + ch.title,
        ch.brief,
        if (ch.index >= Story.total) {
            "「{name}，」回廊轻声说，「你已经走到这里了。」"
        } else {
            "星语灯又亮起一盏。前方的雾，退开了一角。"
        }
    ).map { fill(it, playerName, "") }

    /** 楼层奇遇的引子（事件本身就是剧情时使用）。 */
    fun encounter(intro: String, playerName: String): List<String> =
        listOf(intro).map { fill(it, playerName, "") }
}
