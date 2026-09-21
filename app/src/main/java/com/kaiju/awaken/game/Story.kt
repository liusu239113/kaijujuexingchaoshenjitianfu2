package com.kaiju.awaken.game

/** 主线章节定义。 */
class ChapterDef(
    val index: Int,
    val title: String,
    val goalFloor: Int,
    val brief: String,
    val rewardDust: Int,
    val rewardGold: Int
)

object Story {

    val chapters: List<ChapterDef> = listOf(
        ChapterDef(1, "回廊的回声", 5, "你听见回廊深处有人呼唤你的名字。", 30, 100),
        ChapterDef(2, "未熄灭的灯", 10, "第一盏星语灯重新亮起，雾散了一角。", 40, 150),
        ChapterDef(3, "石阶上的刻痕", 15, "石阶刻着历代拾语者的名字，最下面一行是你。", 50, 200),
        ChapterDef(4, "双生的门扉", 20, "两扇门同时打开，只有一扇通向塔顶。", 60, 250),
        ChapterDef(5, "沉默的守望", 30, "守望者第一次开口：你来得太晚了。", 90, 350),
        ChapterDef(6, "碎裂的星图", 40, "星图缺了一角，缺口正是你站的位置。", 110, 420),
        ChapterDef(7, "深处的低语", 50, "回廊开始用你的声音说话。", 140, 500),
        ChapterDef(8, "无声的钟", 60, "钟摆停了，时间却还在往前走。", 170, 580),
        ChapterDef(9, "被遗忘的章节", 75, "某一层的书页被整页撕去。", 200, 660),
        ChapterDef(10, "回廊之心", 90, "你终于看见了那颗一直在跳动的核心。", 240, 800),
        ChapterDef(11, "第二次呼吸", 110, "核心重新搏动，整座塔开始呼吸。", 280, 900),
        ChapterDef(12, "上行的风", 130, "风从塔顶灌下来，带着旧日的灰。", 320, 1000),
        ChapterDef(13, "镜中的塔", 150, "你在镜中看到另一座塔，和另一个自己。", 380, 1200),
        ChapterDef(14, "无声之诗", 175, "有人把整首诗烧了，只留下最后一个韵脚。", 440, 1400),
        ChapterDef(15, "终末的守望", 200, "守望者把灯递给你，说自己该休息了。", 520, 1700),
        ChapterDef(16, "边界之外", 230, "回廊尽头没有墙，只有一整片未写的空白。", 600, 2000),
        ChapterDef(17, "最初的星语", 260, "你找到了第一句星语，它写着你的名字。", 700, 2400),
        ChapterDef(18, "织者之线", 300, "所有星语在此收束成一条线。", 800, 2800),
        ChapterDef(19, "回廊之巅", 350, "塔顶只有一把椅子，和一片星空。", 950, 3400),
        ChapterDef(20, "拾语者", 400, "你成为了回廊新的守望。", 1200, 5000)
    )

    fun current(index: Int): ChapterDef? = chapters.getOrNull(index)

    val total: Int get() = chapters.size
}
