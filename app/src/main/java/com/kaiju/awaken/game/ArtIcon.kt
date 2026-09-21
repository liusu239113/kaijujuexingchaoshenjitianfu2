package com.kaiju.awaken.game

/** 图标资源映射：技能 / 装备 / 道具 / 货币。 */
object ArtIcon {

    fun skill(s: Skill): String = when {
        s.isUltimate -> "ic_sk_ult"
        s.tags.contains(Tag.HEAL) && s.target == TargetKind.ALLY_ALL -> "ic_sk_regen"
        s.tags.contains(Tag.HEAL) -> "ic_sk_heal"
        s.tags.contains(Tag.SHIELD) -> "ic_sk_shield"
        s.tags.contains(Tag.DOT_POISON) -> "ic_sk_poison"
        s.tags.contains(Tag.DOT_BURN) -> "ic_sk_fire"
        s.tags.contains(Tag.STUN) -> "ic_sk_stun"
        s.tags.contains(Tag.SILENCE) -> "ic_sk_silence"
        s.tags.contains(Tag.ARMOR_BREAK) -> "ic_sk_armor_break"
        s.tags.contains(Tag.TAUNT) -> "ic_sk_taunt"
        s.tags.contains(Tag.BUFF_DODGE) -> "ic_sk_dodge"
        s.tags.contains(Tag.BUFF_ATK) -> "ic_sk_buff_atk"
        s.tags.contains(Tag.BUFF_REGEN) -> "ic_sk_regen"
        s.tags.contains(Tag.LIFESTEAL_HIT) -> "ic_sk_lifesteal"
        s.tags.contains(Tag.HUNTED) -> "ic_sk_buff_crit"
        s.tags.contains(Tag.THORNS) -> "ic_sk_thorns"
        s.hits >= 3 -> "ic_sk_multi"
        s.target == TargetKind.ENEMY_ALL -> "ic_sk_aoe"
        s.stat == "matk" -> "ic_sk_magic"
        s.stat == "maxHp" -> "ic_sk_regen"
        s.id.contains("pierce") || s.id.contains("arrow") || s.id.contains("shot") -> "ic_sk_pierce"
        else -> "ic_sk_slash"
    }

    fun equip(slot: String): String = when (slot) {
        "weapon" -> "ic_eq_weapon"
        "helmet" -> "ic_eq_helmet"
        "chest" -> "ic_eq_chest"
        "amulet" -> "ic_eq_amulet"
        else -> "ic_eq_ring"
    }

    private val itemMap = mapOf(
        "heal_potion" to "ic_it_heal",
        "energy_potion" to "ic_it_energy",
        "shield_scroll" to "ic_it_shield_scroll",
        "bomb" to "ic_it_bomb",
        "cleanse_potion" to "ic_it_cleanse",
        "rage_potion" to "ic_it_rage",
        "group_heal" to "ic_it_groupheal",
        "hourglass" to "ic_it_hourglass",
        "revive_scroll" to "ic_it_revive",
        "power_elixir" to "ic_it_power",
        "iron_elixir" to "ic_it_iron",
        "swift_elixir" to "ic_it_swift",
        "vampire_elixir" to "ic_it_vampire",
        "purge_scroll" to "ic_it_purge",
        "stasis_orb" to "ic_it_stasis",
        "star_fragment" to "ic_it_star"
    )

    fun item(id: String): String = itemMap[id] ?: "ic_it_heal"


    /** 伙伴头像小图标：cp03 → ic_cp_03；非伙伴则返回空串。 */
    fun companion(avatarKey: String): String =
        // 资源名是 ic_cp_01（带下划线），旧实现拼成 ic_cp01 永远取不到图。
        if (avatarKey.startsWith("cp") && avatarKey.length == 4) "ic_cp_" + avatarKey.substring(2) else ""

    /** 转职徽记：berserker → em_berserker。 */
    fun emblem(promoId: String): String = "em_" + promoId


    /** 技能音效名（对应 res/raw/sfx_xxx.mp3）。 */
    fun skillSfx(s: Skill): String = when {
        s.isUltimate -> "ult"
        s.tags.contains(Tag.HEAL) -> "heal"
        s.tags.contains(Tag.SHIELD) -> "shield"
        s.tags.contains(Tag.STUN) || s.tags.contains(Tag.SILENCE) -> "draft"
        s.tags.contains(Tag.BUFF_ATK) || s.tags.contains(Tag.BUFF_DEF) || s.tags.contains(Tag.BUFF_REGEN) -> "starup"
        s.tags.contains(Tag.DOT_POISON) || s.tags.contains(Tag.DOT_BURN) -> "hit"
        s.tags.contains(Tag.LIFESTEAL_HIT) -> "hit"
        s.isBasic -> "hit"
        else -> "skill"
    }

    /** 道具音效名。 */
    fun itemSfx(id: String): String = when (id) {
        "heal_potion" -> "heal"
        "energy_potion" -> "starup"
        "shield_scroll" -> "shield"
        "bomb" -> "crit"
        "cleanse_potion", "purge_scroll" -> "unlock"
        "rage_potion", "power_elixir" -> "starup"
        "group_heal" -> "heal"
        "hourglass", "stasis_orb" -> "draft"
        "revive_scroll" -> "revive"
        "iron_elixir", "swift_elixir", "vampire_elixir" -> "shield"
        "star_fragment" -> "unlock"
        else -> "skill"
    }

    const val GOLD = "ic_gold"
    const val TALENT = "ic_talent"
    const val DUST = "ic_dust"
    const val FLOOR = "ic_floor"
    const val SKILL_POINT = "ic_skillpoint"
}
