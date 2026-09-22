package com.dshx.game.shidai.game

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
        "star_fragment" to "ic_it_star",
        // v1.6.0 扩充道具
        "war_brew" to "ic_it_warbrew",
        "thorn_scroll" to "ic_it_thorn",
        "gale_potion" to "ic_it_gale",
        "mithril_bandage" to "ic_it_bandage",
        "star_brew" to "ic_it_starbrew"
    )

    fun item(id: String): String = itemMap[id] ?: "ic_it_heal"

    // ------------------------------------------------------------ 全套图标映射
    // 以下映射把此前散落在 UI 里的 emoji / 符号统一换成 PNG 资源。
    // 全部走「有图标用图标、缺图回退原字符」的双轨，缺资源也不会出现空白。

    /** 试炼强度（选人页模式卡）。 */
    fun mode(m: GameMode): String = when (m) {
        GameMode.NORMAL -> "md_normal"
        GameMode.ADVENTURE -> "md_adventure"
        GameMode.HERO -> "md_hero"
        GameMode.KING -> "md_king"
        GameMode.ENDLESS -> "md_endless"
        GameMode.CLIMB -> "md_climb"
    }

    private val eventIcon = mapOf(
        "evt_hospital" to "ic_ev_medic",
        "evt_bounty" to "ic_ev_bounty",
        "evt_enchanter" to "ic_ev_enchanter",
        "evt_battlefield" to "ic_ev_battlefield",
        "evt_crossroads" to "ic_ev_crossroads",
        "evt_lost_cart" to "ic_ev_lost_cart",
        "evt_grove" to "ic_ev_grove",
        "evt_sealed_chest" to "ic_ev_chest",
        "evt_wandering_monk" to "ic_ev_monk",
        "evt_war_room" to "ic_ev_war_room",
        "evt_ancient_tome" to "ic_ev_tome",
        "evt_wandering_sage" to "ic_ev_tome",
        "evt_star_altar" to "ic_ev_star_altar",
        "evt_pilgrim" to "ic_ev_pilgrim",
        "evt_weapon_rack" to "ic_ev_weapon_rack",
        "evt_soul_forge" to "ic_ev_soul_forge",
        "evt_trap_corridor" to "ic_ev_trap",
        "evt_echoing_hall" to "ic_ev_echo_hall",
        "evt_alchemy_lab" to "ic_ev_alchemy",
        // 6 个回廊守望剧情节点共用同一张「守望之烛」
        "story_10" to "ic_ev_warden",
        "story_20" to "ic_ev_warden",
        "story_30" to "ic_ev_warden",
        "story_40" to "ic_ev_warden",
        "story_50" to "ic_ev_warden",
        "story_60" to "ic_ev_warden"
    )

    /** 事件兜底图标：这 25 个事件没有场景插画，此前用 emoji 顶替。未登记返回空串。 */
    fun event(id: String?): String = if (id == null) "" else eventIcon[id] ?: ""

    /** 塔层遭遇类型图标（战斗舞台左侧；有插画的走 sceneFor，这里是兜底）。 */
    fun towerKind(kind: String, eventId: String?): String = when (kind) {
        "boss" -> "ic_tw_boss"
        "combat_elite" -> "ic_tw_elite"
        "combat_normal" -> "ic_tw_normal"
        "shop" -> "ic_tw_shop"
        "tavern" -> "ic_tw_tavern"
        "story" -> "ic_ev_warden"
        else -> event(eventId).ifEmpty { "ic_tw_event" }
    }


    /** 伙伴头像小图标：cp03 → ic_cp_03；非伙伴则返回空串。 */
    fun companion(avatarKey: String): String =
        // 资源名是 ic_cp_01（带下划线），旧实现拼成 ic_cp01 永远取不到图。
        if (avatarKey.startsWith("cp") && avatarKey.length == 4) "ic_cp_" + avatarKey.substring(2) else ""

    /** 转职徽记：berserker → em_berserker。 */
    fun emblem(promoId: String): String = "em_" + promoId

    /** 天赋流派图标：School.EDGE -> ic_school_edge。 */
    fun school(s: School): String = "ic_school_" + s.name.lowercase()

    /**
     * 天赋专属图标：t_executioner -> ic_tal_executioner，
     * 曜神级的 ht_ 前缀保留（ic_tal_ht_divine_hand）。
     */
    fun talent(t: Talent): String = "ic_tal_" + t.id.removePrefix("t_")


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
        "war_brew" -> "starup"
        "thorn_scroll", "mithril_bandage" -> "heal"
        "gale_potion", "star_brew" -> "shield"
        else -> "skill"
    }

    const val GOLD = "ic_gold"
    const val TALENT = "ic_talent"
    const val DUST = "ic_dust"
    const val FLOOR = "ic_floor"
    const val SKILL_POINT = "ic_skillpoint"
    const val MUSIC = "ic_music"
    const val STAR = "ic_star"
}
