package com.dshx.game.shidai.game

/**
 * 剧情文本库。
 *
 * 正文按组分片存放在 StoryData1~4.kt（合计约 2 万字），本文件只负责拼接与占位符替换。
 * 文字里的 {name} 会替换成玩家取的名字。
 *
 * 语气基准：第二人称、短句、留白。回廊是「会记住人」的地方，
 * 叙述者是后来才揭晓的「守望者」，前期只以「有人」的形式出现。
 */
object StoryScript {

    fun fill(s: String, playerName: String, clsName: String): String =
        s.replace("{name}", playerName).replace("{cls}", clsName)

    /** 创角之后的序章。 */
    fun prologue(playerName: String, clsName: String): List<String> =
        PROLOGUE.map { fill(it, playerName, clsName) }

    /** 第 index 章（从 1 开始）的开场。 */
    fun chapter(index: Int, playerName: String): List<String> {
        val body = CHAPTERS.getOrNull(index - 1) ?: return emptyList()
        return body.map { fill(it, playerName, "") }
    }

    /** 楼层奇遇的引子。 */
    fun encounter(intro: String, playerName: String): List<String> =
        listOf(intro).map { fill(it, playerName, "") }

    fun chapterCount(): Int = CHAPTERS.size


    // ------------------------------------------------------------------ 正文

    /**
     * 正文分片：序章 + 20 章。
     * 拆成 4 个文件是为了单文件不至于过大，拼接顺序即章节顺序，
     * 追加新章节时只要在对应的 StoryDataN 里 push 一个 listOf(...) 即可。
     */
    private val PROLOGUE: List<String> = StoryData1.PROLOGUE

    private val CHAPTERS: List<List<String>> = StoryData1.CHAPTERS +
        StoryData2.CHAPTERS + StoryData3.CHAPTERS + StoryData4.CHAPTERS
}
