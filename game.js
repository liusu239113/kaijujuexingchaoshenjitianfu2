var _c, _d, _e, _f;
const APP_VERSION = "1.1.6";
const BATTLE_MAX_TURNS = 500;
const BATTLE_DAMAGE_ESCALATION_START_TURN = 10;
const BATTLE_DAMAGE_BONUS_PER_TURN = 0.01;
const BATTLE_TURN_LIMIT_REWARD_MULTIPLIER = 0.5;
const BATTLE_LOW_HP_WARNING_RATIO = 0.35;
const ENEMY_COUNTER_SINGLE_TARGET_HP_PCT = 0.1;
const ENEMY_COUNTER_ACTION_TARGET_HP_PCT = 0.2;
const STORAGE_KEY = "tower-of-reincarnation-web-save-v2";
const STORAGE_BACKUP_KEY = "".concat(STORAGE_KEY, "-backup");
const STORAGE_STAGING_KEY = "".concat(STORAGE_KEY, "-staging");
const SAVE_SCHEMA_VERSION = 3;
const FIRST_SUPPORTED_SAVE_SCHEMA_VERSION = 2;
const PRIVACY_CONSENT_KEY = "divine-talent-privacy-consent-v1";
const PRIVACY_POLICY_VERSION = "2026-08-01";
const PRIVACY_POLICY_URL = "https://docs.qq.com/doc/p/6c67458e1f0a3d5e8fc3db0183250cfdc581e506?nlc=1";
const SAVE_MIGRATIONS = Object.freeze({
  2: (payload) => {
    var _a, _b, _c2;
    if (!Object.prototype.hasOwnProperty.call(payload, "run")) return null;
    if (payload.run !== null && payload.activeMode !== ((_b = (_a = payload.run) == null ? void 0 : _a.run) == null ? void 0 : _b.mode)) return null;
    const { run, ...rest } = payload;
    const isClimb = ((_c2 = run == null ? void 0 : run.run) == null ? void 0 : _c2.mode) === "climb";
    return {
      ...rest,
      version: 3,
      runs: {
        adventure: isClimb ? null : run || null,
        climb: isClimb ? run || null : null
      }
    };
  }
});
let saveSystemNotice = "";
function loadPrivacyConsent() {
  try {
    const stored = JSON.parse(localStorage.getItem(PRIVACY_CONSENT_KEY) || "null");
    if ((stored == null ? void 0 : stored.version) === PRIVACY_POLICY_VERSION && ["accepted", "declined"].includes(stored.status)) {
      return stored;
    }
  } catch (error) {
    console.warn("Privacy consent state is unavailable", error);
  }
  return { status: "pending", version: PRIVACY_POLICY_VERSION, decidedAt: "" };
}
function persistPrivacyConsent(status) {
  const consent = {
    status,
    version: PRIVACY_POLICY_VERSION,
    decidedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.warn("Privacy consent could not be persisted", error);
  }
  return consent;
}
const RARITY_LABEL = {
  hidden: "超神级",
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
  mythic: "神级",
  white: "白色",
  green: "精良",
  blue: "稀有",
  purple: "史诗",
  orange: "传说",
  red: "红色"
};
const TALENT_RARITY_ICON = {
  common: "⚪",
  rare: "🟢",
  epic: "🟣",
  legendary: "🟠",
  mythic: "🔴",
  hidden: "✨"
};
const TALENT_RARITY_RANK = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
  hidden: 6
};
const TALENT_ENHANCE_MAX_LEVEL = 2;
const TALENT_STAR_EFFECTS = Object.freeze({
  gold_10pct: { values: [0.1, 0.15, 0.2], label: "战斗金币", prefix: "+", unit: "%" },
  gold_30pct: { values: [0.3, 0.45, 0.6], label: "战斗金币", prefix: "+", unit: "%" },
  scavenger: { values: [0.1, 0.15, 0.2], label: "道具掉落概率", prefix: "+", unit: "%" },
  xp_boost: { values: [0.2, 0.3, 0.4], label: "战斗经验", prefix: "+", unit: "%" },
  regen_1pct: { values: [0.01, 0.015, 0.02], label: "每回合回复", unit: "%最大生命" },
  potion_boost: { values: [0.2, 0.3, 0.4], label: "道具治疗", prefix: "+", unit: "%" },
  merc_hp: { values: [0.15, 0.225, 0.3], label: "佣兵生命", prefix: "+", unit: "%" },
  thorn_minor: { values: [0.05, 0.075, 0.1], label: "反伤", unit: "%" },
  battle_will: { values: [2, 3, 4], label: "每回合攻击", prefix: "+", unit: "（本场）" },
  first_strike: { values: [0.15, 0.225, 0.3], label: "前3回合伤害", prefix: "+", unit: "%" },
  shield_expert: { values: [0.25, 0.375, 0.5], label: "护盾效果", prefix: "+", unit: "%" },
  executioner: { values: [0.2, 0.3, 0.4], label: "斩杀伤害", prefix: "+", unit: "%" },
  thick_skin: { values: [0.3, 0.45, 0.6], label: "超额伤害减免", unit: "%" },
  loot_luck: { values: [0.2, 0.3, 0.4], label: "品质提升概率", unit: "%" },
  counter_30pct: { values: [0.25, 0.375, 0.5], label: "反击概率", unit: "%" },
  armor_pierce: { values: [1, 1, 2], label: "破甲层数" },
  dodge_master: { values: [0.1, 0.15, 0.2], label: "闪避", unit: "%" },
  heal_boost: { values: [0.2, 0.3, 0.4], label: "受疗", prefix: "+", unit: "%" },
  item_saver: { values: [0.2, 0.3, 0.4], label: "不消耗概率", unit: "%" },
  merc_atk: { values: [0.15, 0.225, 0.3], label: "佣兵攻击、法强", prefix: "+", unit: "%" },
  opening_shield: { values: [0.1, 0.15, 0.2], label: "开局护盾", unit: "%最大生命" },
  vampiric: { values: [0.05, 0.075, 0.1], label: "吸血", unit: "%" },
  bomb_expert: { values: [0.5, 0.75, 1], label: "消耗品伤害", prefix: "+", unit: "%" },
  lucky_dodge: { values: [0.25, 0.375, 0.5], label: "抵消额外暴伤概率", unit: "%" },
  enemy_counter_guard: { values: [0.25, 0.375, 0.5], format: (value) => "反击、荆棘伤害 -".concat(Number((value * 100).toFixed(2)), "%") },
  stun_extend: { values: [1, 1, 2], label: "控制时长", prefix: "+", unit: "回合" },
  multi_hit: { values: [0.1, 0.15, 0.2], label: "追击概率", unit: "%" },
  elem_chain: { values: [0.2, 0.3, 0.4], label: "元素连锁真实伤害", unit: "%攻击" },
  crisis: { values: [0.25, 0.375, 0.5], format: (value) => "低血伤害、受疗 +".concat(Number((value * 100).toFixed(2)), "%") },
  bloodthirst: { values: [0.15, 0.225, 0.3], label: "击杀回复", unit: "%最大生命" },
  overcharge: { values: [0.02, 0.03, 0.04], format: (value) => "每10溢能伤害 +".concat(Number((value * 100).toFixed(2)), "% · 上限 +").concat(Number((value * 2500).toFixed(2)), "%") },
  combo_master: { values: [0.05, 0.075, 0.1], label: "每层连招伤害", prefix: "+", unit: "%" },
  last_stand: { values: [0.2, 0.3, 0.4], label: "触发血线", prefix: "<", unit: "%" },
  mana_burst: { values: [0.25, 0.375, 0.5], label: "高耗能技能伤害", prefix: "+", unit: "%" },
  overkill: { values: [1, 1.5, 2], format: (value) => "溢出伤害分摊 ".concat(Number((value * 100).toFixed(2)), "%") },
  energy_drain: { values: [20, 30, 40], label: "击杀回能", prefix: "+" },
  burn_master: { values: [0.4, 0.6, 0.8], label: "灼烧伤害", prefix: "+", unit: "%" },
  double_strike: { values: [0.2, 0.3, 0.4], label: "普攻追击概率", unit: "%" },
  item_double: { values: [1, 1.5, 2], label: "道具效果", prefix: "+", unit: "%" },
  fury_stack: { values: [0.03, 0.045, 0.06], label: "每层怒气伤害", prefix: "+", unit: "%" },
  tough_body: { values: [0.05, 0.075, 0.1], format: (value) => "伤害减免 +".concat(Number((value * 100).toFixed(2)), "%") },
  adapt: { values: [3, 4, 5], format: (value) => "每层伤害减免 +5% · 最多 ".concat(value, " 层") },
  chain_kill: { values: [0.15, 0.225, 0.3], format: (value) => "击杀回能 +".concat(Number((value * 100).toFixed(2)), " · 下次伤害 +").concat(Number((value * 100).toFixed(2)), "%") },
  mastery_awake: { values: [0.5, 0.75, 1], format: (value) => "暴击伤害 +".concat(Number((value * 100).toFixed(2)), "% · 防御 -10%") },
  phoenix: { values: [0.3, 0.45, 0.6], label: "复活生命", unit: "%" },
  time_warp: { values: [1, 1.5, 2], format: (value) => "前3回合伤害 +".concat(Number((15 * value).toFixed(2)), "% · 四维 +").concat(Number((5 * value).toFixed(2)), "%") },
  shield_reflect: { values: [0.15, 0.225, 0.3], label: "护盾反伤", unit: "%" },
  merc_fury: { values: [1, 1.5, 2], format: (value) => "每名佣兵：伤害 +".concat(Number((8 * value).toFixed(2)), "% · 伤害减免 +").concat(Number((5 * value).toFixed(2)), "%") },
  item_magnet: { values: [0.7, 0.55, 0.4], label: "商店价格", unit: "%" },
  mirror: { values: [6, 5, 4], label: "镜像间隔", unit: "回合" },
  death_mark: { values: [5, 4, 3], label: "死亡宣告触发", unit: "次攻击" },
  sp_boost: { values: [3, 2, 1], label: "额外技能点间隔", unit: "级" },
  reincarnation_admin: { values: [1, 1.5, 2], format: (value) => "每层全属性 +".concat(2 * value, " · 额外天赋轮与选项固定") },
  meteor_spam: { values: [2, 3, 4], label: "每次陨星永久法强", prefix: "+" },
  undying: { values: [0.5, 0.75, 1], label: "复活生命", unit: "%" },
  venom_blast: { values: [1, 1.5, 2], format: (value) => "多段技能最后一段伤害 +".concat(value * 100, "%") },
  holy_echo: { values: [0.5, 0.75, 1], label: "治疗转化神圣伤害", unit: "%" },
  divine_accumulation: { values: [1, 1.5, 2], label: "每次治疗永久治疗量", prefix: "+" },
  merc_last_breath: { values: [0.5, 0.75, 1], format: (value) => "回光返照 1回合 · 攻击、法强 +".concat(value * 100, "%") },
  god_slayer: { values: [1, 1.5, 2], format: (value) => "对Boss伤害 +".concat(30 * value, "% · 受Boss伤害减免 +").concat(20 * value, "%") },
  dmg_escalate: { values: [0.01, 0.015, 0.02], format: (value) => "每层首次胜利伤害 +".concat(value * 100, "% · 上限随层数成长") },
  war_council: { values: [1, 1.5, 2], format: (value) => "佣兵攻击、法强 +".concat(25 * value, "% · 开局护盾 ").concat(15 * value, "%最大生命") },
  chaos_lord: { values: [0.1, 0.15, 0.2], duration: [1, 2, 3], format: (value, level) => "随机减益 ".concat([1, 2, 3][level], "回合 · 减益目标伤害 +").concat(value * 100, "%") },
  sword_saint: { values: [1, 1.5, 2], format: (value) => "普攻必暴 · 追加 ".concat(value * 100, "%攻击伤害") },
  archmage: { values: [0.2, 0.3, 0.4], label: "技能消耗", prefix: "-", unit: "%" },
  hunter_eye: { values: [0.05, 0.075, 0.1], format: (value) => "攻击标记目标后，对其伤害 +".concat(value * 100, "%/层（最多5层）") },
  death_sentence: { values: [1, 1.5, 2], format: (value) => "处决血线 <".concat(10 * value, "% · 处决回能 +").concat(30 * value) },
  shadow_clone: { values: [0.5, 0.75, 1], format: (value) => "分身概率 ".concat(value * 100, "% · 分身伤害 ").concat(value * 100, "%攻击") },
  blood_lord: { values: [1, 1.5, 2], format: (value) => "吸血效果 +".concat(50 * value, "% · 溢出护盾上限 ").concat(50 * value, "%最大生命") },
  night_terror: { values: [0.01, 0.015, 0.02], label: "额外真实伤害", unit: "%目标最大生命" },
  natures_wrath: { values: [1, 1.5, 2], format: (value) => "变身技能伤害 +".concat(35 * value, "% · DOT伤害 +").concat(40 * value, "%") },
  primal_fortitude: { values: [1, 1.5, 2], format: (value) => "受击/受疗生命 +".concat(value, " · 低血伤害减免 +").concat(30 * value, "% · 高血伤害 +").concat(15 * value, "%") },
  shield_rebuke: { values: [0.4, 0.55, 0.7], label: "反射吸收伤害", unit: "%" },
  unbroken_line: { values: [0.12, 0.16, 0.2], format: (value) => "残血护盾 ".concat(value * 100, "%最大生命 · 减伤15%") },
  triad_resonance: { values: [20, 30, 40], damageValues: [0.2, 0.3, 0.4], format: (value, level) => "三相完成回能 +".concat(value, " · 下次攻击伤害 +").concat([20, 30, 40][level], "%") },
  mana_tide: { values: [10, 15, 20], damageValues: [0.15, 0.2, 0.25], format: (value, level) => "满能技能消耗 -".concat(value, " · 伤害 +").concat([15, 20, 25][level], "%") },
  pursuit_mark: { values: [0.03, 0.04, 0.05], bossRawValues: [0.02, 0.03, 0.04], format: (value) => "三层追猎：".concat(value * 100, "%目标最大生命真实伤害") },
  gale_arrow: { values: [0.4, 0.5, 0.6], label: "追射伤害", unit: "%攻击" },
  sacred_covenant: { values: [0.08, 0.12, 0.16], healValues: [0.15, 0.2, 0.25], shieldValues: [0.1, 0.15, 0.2], format: (value, level) => "圣约减伤 ".concat(value * 100, "% · 受疗 +").concat([15, 20, 25][level], "% · 残血护盾 ").concat([10, 15, 20][level], "%") },
  judgment_cycle: { values: [0.4, 0.55, 0.7], energyValues: [10, 15, 20], format: (value, level) => "每4次治疗：".concat(value, "倍法强真实伤害 · 回能 +").concat([10, 15, 20][level]) },
  vital_insight: { values: [0.1, 0.15, 0.2], label: "双减益目标暴击", prefix: "+", unit: "%" },
  shadow_return: { values: [0.25, 0.35, 0.45], energyValues: [10, 15, 20], format: (value, level) => "闪避后下次攻击暴击 +".concat(value * 100, "% · 回能 +").concat([10, 15, 20][level]) },
  blood_pool_recovery: { values: [0.04, 0.06, 0.08], label: "大额自疗护盾", unit: "%最大生命" },
  crimson_hunt: { values: [0.25, 0.22, 0.2], damageValues: [0.2, 0.3, 0.4], energyValues: [10, 15, 20], format: (value, level) => "累计自疗 ".concat(value * 100, "%生命：下次攻击 +").concat([20, 30, 40][level], "% · 回能 +").concat([10, 15, 20][level]) },
  dual_shift: { values: [0.1, 0.15, 0.2], strikeValues: [0.2, 0.3, 0.4], format: (value, level) => "熊转鹰减伤 ".concat(value * 100, "% · 鹰转熊下击 +").concat([20, 30, 40][level], "%") },
  thornwood_domain: { values: [0.06, 0.08, 0.1], poisonValues: [0.01, 0.015, 0.02], format: (value, level) => "开局全队护盾 ".concat(value * 100, "% · 破盾中毒 ").concat([1, 1.5, 2][level], "%生命/回合") },
  afterglow_pursuit: { values: [0.18, 0.27, 0.36], label: "余韵增伤", prefix: "+", unit: "%" },
  bulwark_rebound: { values: [0.04, 0.06, 0.08], label: "破盾反震", unit: "%最大生命真实伤害" },
  steady_line: { values: [0.08, 0.12, 0.16], label: "持盾减伤", unit: "%" },
  emergency_barrier: { values: [0.12, 0.18, 0.24], label: "应急护盾", unit: "%最大生命" },
  weakness_exploit: { values: [0.08, 0.12, 0.16], label: "减益目标伤害", prefix: "+", unit: "%" },
  exploit_opening: { values: [0.1, 0.15, 0.2], label: "双减益穿透", unit: "%" },
  purification_reversal: { values: [0.1, 0.15, 0.2], healValues: [0.04, 0.06, 0.08], format: (value, level) => "净化回复 ".concat([4, 6, 8][level], "%生命 · 下次伤害 +").concat(value * 100, "%（最多3层）") },
  desperate_edge: { values: [0.15, 0.22, 0.3], healValues: [0.2, 0.3, 0.4], format: (value, level) => "生命低于40%：伤害 +".concat(value * 100, "% · 受治疗 +").concat([20, 30, 40][level], "%") },
  soul_link: { values: [0.08, 0.12, 0.16], energyValues: [5, 8, 10], format: (value, level) => "主人减伤 ".concat(value * 100, "% · 傀儡受创回能 +").concat([5, 8, 10][level]) },
  command_circuit: { values: [0.08, 0.12, 0.16], energyValues: [10, 15, 20], damageValues: [0.15, 0.22, 0.3], format: (value, level) => "三种指令：修复 ".concat(value * 100, "% · 回能 +").concat([10, 15, 20][level], " · 下次指令 +").concat([15, 22, 30][level], "%") },
  grand_puppeteer: { values: [0.25, 0.375, 0.5], hpValues: [0.15, 0.25, 0.35], format: (value, level) => "傀儡指令伤害 +".concat(value * 100, "% · 傀儡生命 +").concat([15, 25, 35][level], "%") },
  immortal_core: { values: [0.35, 0.5, 0.65], shieldValues: [0.1, 0.15, 0.2], format: (value, level) => "首次损毁重构 ".concat(value * 100, "%生命 · 护盾 ").concat([10, 15, 20][level], "%生命") }
});
const SKILL_MAX_LEVEL = 3;
const SKILL_DISPLAY_BASE_LEVEL = 1;
const SKILL_UNLOCK_LEVELS = [1, 1, 3, 5, 7, 9, 12];
const SKILL_POINT_COSTS = [1, 2, 3];
const SKILL_POSITION_EXTRA_COST = [0, 0, 0, 1, 1, 2, 2];
const SKILL_LEARN_COST = 1;
const PRIMARY_ATTRIBUTE_DEFS = Object.freeze([
  { key: "str", label: "力量", icon: "💪", statKey: "atk", factor: 2 },
  { key: "agi", label: "敏捷", icon: "🦶", statKey: "def", factor: 1 },
  { key: "int", label: "智力", icon: "🧠", statKey: "matk", factor: 2 },
  { key: "con", label: "体质", icon: "❤", statKey: "hp", factor: 10 }
]);
function roundPrimaryAttribute(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
function formatPrimaryAttribute(value) {
  const rounded = roundPrimaryAttribute(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
function primaryAttributesFromStats(stats = {}) {
  return {
    str: roundPrimaryAttribute((Number(stats.atk) || 0) / 2),
    agi: roundPrimaryAttribute(Number(stats.def) || 0),
    int: roundPrimaryAttribute((Number(stats.matk) || 0) / 2),
    con: roundPrimaryAttribute((Number(stats.hp) || 0) / 10)
  };
}
function primaryAttributesAtLevel(cls, level = 1, growthMul = 1) {
  const base = cls.baseAttributes || primaryAttributesFromStats(cls.baseStats);
  const growth = cls.growthAttributes || {};
  const numericLevel = Number(level);
  const levelSteps = Math.max(0, Number.isFinite(numericLevel) ? numericLevel : 1);
  const qualityGrowthMul = Math.max(0, Number(growthMul) || 1);
  const attributes = {};
  for (const def of PRIMARY_ATTRIBUTE_DEFS) {
    attributes[def.key] = roundPrimaryAttribute(
      (Number(base[def.key]) || 0) + (Number(growth[def.key]) || 0) * levelSteps * qualityGrowthMul
    );
  }
  return attributes;
}
function primaryStatsFromAttributes(attributes = {}) {
  const stats = {};
  for (const def of PRIMARY_ATTRIBUTE_DEFS) {
    stats[def.statKey] = roundPrimaryAttribute((Number(attributes[def.key]) || 0) * def.factor);
  }
  return stats;
}
function classBaseStats(cls) {
  const baseStats = { ...(cls == null ? void 0 : cls.baseStats) || {} };
  const attributes = (cls == null ? void 0 : cls.baseAttributes) || primaryAttributesFromStats(baseStats);
  return { ...baseStats, ...primaryStatsFromAttributes(attributes) };
}
const ENHANCE_CHOICE_SLOT = {
  enhance_weapon: "weapon",
  enhance_helmet: "helmet",
  enhance_chest: "chest",
  enhance_amulet: "amulet",
  enhance_ring: "ring"
};
const GOLD_ECONOMY = Object.freeze({
  enhanceBase: 60,
  enhanceStep: 35,
  mercTraining: 75,
  mercTraitTrial: 160,
  bossStoryRelic: 80
});
const STAT_LABEL = {
  hp: "生命",
  atk: "攻击",
  matk: "法强",
  def: "防御",
  crit: "暴击",
  critDmg: "暴伤",
  energy: "能量",
  energyRegen: "回能",
  hpRegen: "回血",
  statusRes: "状态抗性"
};
const CLASS_PORTRAIT_ART = {
  warrior: "assets/generated/portrait-warrior.png",
  mage: "assets/generated/portrait-mage.png",
  ranger: "assets/generated/portrait-ranger.png",
  priest: "assets/generated/portrait-priest.png",
  assassin: "assets/generated/portrait-assassin.png",
  vampire: "assets/generated/portrait-vampire.png",
  druid: "assets/generated/portrait-druid.png",
  puppeteer: "assets/generated/portrait-puppeteer.png",
  enemy: "assets/generated/portrait-enemy.png"
};
const SUMMON_PORTRAIT_ART = {
  commandPuppet: "assets/generated/portrait-command-puppet.png"
};
const ENEMY_PORTRAIT_IDS = [
  "slime",
  "skeleton",
  "bat_swarm",
  "fungus",
  "goblin",
  "wolf",
  "bandit",
  "skeleton_archer",
  "mage_mob",
  "treant",
  "imp",
  "ghoul",
  "golem",
  "fire_spirit",
  "frost_spirit",
  "gargoyle",
  "fire_demon",
  "bone_lord",
  "spore_mother",
  "elite_knight",
  "elite_shaman",
  "elite_berserker",
  "elite_necro",
  "elite_pyro",
  "elite_guardian",
  "elite_assassin",
  "boss_crypt_guard",
  "boss_spider_queen",
  "boss_lich",
  "boss_venom_drake",
  "boss_dragon",
  "boss_lava_giant",
  "boss_shadow_lord",
  "boss_necro_king",
  "boss_abyss_lord",
  "boss_titan"
];
const ENEMY_PORTRAIT_ART = Object.fromEntries(ENEMY_PORTRAIT_IDS.map((id) => [id, "assets/generated/monsters/".concat(id, ".png")]));
const SKILL_EFFECT_IDS = [
  "w_slash",
  "w_shield_bash",
  "w_taunt",
  "w_counter",
  "w_armor_break",
  "w_warcry",
  "w_ult",
  "m_bolt",
  "m_fireball",
  "m_frost",
  "m_lightning",
  "m_shield",
  "m_resonance",
  "m_ult",
  "r_shot",
  "r_rapid",
  "r_poison",
  "r_pierce",
  "r_dodge",
  "r_mark",
  "r_ult",
  "p_smite",
  "p_heal",
  "p_prayer",
  "p_dispel",
  "p_holy",
  "p_bless",
  "p_ult",
  "a_stab",
  "a_backstab",
  "a_venom",
  "a_shadow",
  "a_expose",
  "a_execute",
  "a_ult",
  "v_claw",
  "v_thirst",
  "v_mist",
  "v_eruption",
  "v_siphon",
  "v_pact",
  "v_ult",
  "d_strike",
  "d_thorns",
  "d_bear",
  "d_hawk",
  "d_nature_slam",
  "d_swarm",
  "d_ult",
  "bk_bloodstrike",
  "bk_frenzy",
  "pd_holy_strike",
  "pd_divine_aegis",
  "am_arcane_barrage",
  "am_inferno",
  "ch_time_lock",
  "ch_rewind",
  "sb_backstab",
  "sb_vanish",
  "bm_feral_strike",
  "bm_natures_blessing",
  "ab_greater_heal",
  "ab_sanctuary",
  "iq_judgment",
  "iq_holy_fire",
  "pb_phantom_strike",
  "pb_blade_storm",
  "vm_plague",
  "vm_toxin_burst",
  "bl_crimson_feast",
  "bl_blood_pool",
  "ns_shadow_fang",
  "ns_night_veil",
  "ng_ironbark",
  "ng_entangle",
  "pb_savage_strike",
  "pb_feral_roar",
  "e_attack",
  "e_shield_bash",
  "e_poison_dagger",
  "e_bite",
  "e_shadow_bolt",
  "e_curse",
  "e_slam",
  "e_warcry",
  "e_heal_self",
  "e_enrage",
  "e_cleave",
  "e_fireball",
  "e_frost_nova",
  "e_shadow_nova",
  "e_poison_cloud",
  "e_dragon_breath",
  "e_multi_shot",
  "e_backstab",
  "e_frenzy_strike",
  "e_lifedrain",
  "e_soul_harvest",
  "e_explode",
  "e_shield_self",
  "e_iron_shell",
  "e_rally",
  "e_war_stomp",
  "e_thorns_aura",
  "e_mega_slam",
  "e_dark_ritual",
  "e_meteor",
  "e_death_coil",
  "e_titan_smash"
];
const SKILL_EFFECT_ART = Object.fromEntries(SKILL_EFFECT_IDS.map((id) => [id, "assets/generated/skillfx/".concat(id, ".png")]));
Object.assign(SKILL_EFFECT_ART, {
  r_poison: SKILL_EFFECT_ART.r_pierce,
  sb_backstab: SKILL_EFFECT_ART.r_pierce,
  sb_vanish: SKILL_EFFECT_ART.r_mark,
  bm_feral_strike: SKILL_EFFECT_ART.r_rapid,
  bm_natures_blessing: SKILL_EFFECT_ART.r_dodge,
  u_thread: "assets/generated/skillfx/u_thread.svg",
  u_break_order: "assets/generated/skillfx/u_break_order.svg",
  u_guard_order: "assets/generated/skillfx/u_guard_order.svg",
  u_shift: "assets/generated/skillfx/u_shift.svg",
  u_rebuild: "assets/generated/skillfx/u_rebuild.svg",
  u_overdrive: "assets/generated/skillfx/u_overdrive.svg",
  u_ult: "assets/generated/skillfx/u_ult.svg",
  im_shock_order: "assets/generated/skillfx/im_shock_order.svg",
  im_bulwark_protocol: "assets/generated/skillfx/im_bulwark_protocol.svg",
  sw_soul_barrage: "assets/generated/skillfx/sw_soul_barrage.svg",
  sw_sacrifice: "assets/generated/skillfx/sw_sacrifice.svg",
  mu_repair_wave: "assets/generated/skillfx/mu_repair_wave.svg",
  mu_annihilation: "assets/generated/skillfx/mu_annihilation.svg"
});
const IMPACT_FALLBACK_ART = {
  damage: "assets/generated/effect-hit.png",
  crit: "assets/generated/effect-crit.png",
  shield: "assets/generated/effect-shield.png",
  heal: "assets/generated/effect-heal.png"
};
const SOURCE_EFFECT_SKILL_ART = {
  "灼烧吐息": "e_dragon_breath",
  "生命汲取": "e_lifedrain",
  "灼烧": "e_fireball",
  "中毒": "e_poison_dagger",
  "元素连锁": "m_lightning",
  "血契": "v_pact",
  "暴击爆裂": "a_execute",
  "暗夜恐惧": "ns_shadow_fang",
  "疾风箭阵": "r_ult",
  "贯日箭": "r_pierce",
  "神迹回响": "p_ult",
  "赶尽杀绝": "a_execute",
  "爆裂弹": "e_explode",
  "荆棘护盾": "d_thorns",
  "荆棘体质": "d_thorns",
  "荆棘": "d_thorns",
  "闪避反击": "w_counter",
  "以牙还牙": "w_counter",
  "反击姿态": "w_counter"
};
const EVENT_SCENE_BY_ID = {
  evt_merchant: "shop",
  evt_arcane_merchant: "shop",
  evt_item_shop: "shop",
  evt_blacksmith: "forge",
  evt_shrine: "shrine",
  evt_fountain: "spring",
  evt_life_spring: "spring",
  evt_campfire: "camp",
  evt_library: "library",
  evt_gamble: "gamble",
  evt_bounty_board: "bounty",
  evt_field_hospital: "healer",
  evt_enchanter: "arcane",
  evt_training: "training",
  evt_merc_training: "training",
  evt_merc_quartermaster: "shop",
  evt_merc_guild: "training",
  evt_merc_trial: "training"
};
const EVENT_SCENE_BY_TYPE = {
  boss: "boss",
  combat: "combat",
  shop: "shop",
  blessing: "shrine",
  heal: "spring",
  loot: "treasure",
  danger: "danger",
  story: "story"
};
const EVENT_ICON_ART = Object.freeze({
  evt_merchant: "assets/generated/events/evt_merchant.png",
  evt_blacksmith: "assets/generated/events/evt_blacksmith.png",
  evt_shrine: "assets/generated/events/evt_shrine.png",
  evt_fountain: "assets/generated/events/evt_fountain.png",
  evt_gamble: "assets/generated/events/evt_gamble.png",
  evt_training: "assets/generated/events/evt_training.png",
  evt_merc_training: "assets/generated/events/evt_training.png",
  evt_merc_quartermaster: "assets/generated/events/evt_merchant.png",
  evt_merc_guild: "assets/generated/events/evt_tavern.png",
  evt_merc_trial: "assets/generated/events/evt_training.png",
  evt_campfire: "assets/generated/events/evt_campfire.png",
  evt_library: "assets/generated/events/evt_library.png",
  evt_field_hospital: "assets/generated/events/evt_field_hospital.png",
  evt_bounty_board: "assets/generated/events/evt_bounty_board.png",
  evt_enchanter: "assets/generated/events/evt_enchanter.png",
  evt_arcane_merchant: "assets/generated/events/evt_arcane_merchant.png",
  evt_life_spring: "assets/generated/events/evt_life_spring.png",
  evt_sealed_treasury: "assets/generated/events/evt_sealed_treasury.png",
  evt_old_battlefield: "assets/generated/events/evt_old_battlefield.png",
  evt_divine_forge: "assets/generated/events/evt_divine_forge.png",
  evt_talent_fragment: "assets/generated/events/evt_talent_fragment.png",
  evt_combat_normal: "assets/generated/events/evt_combat_normal.png",
  evt_combat_elite: "assets/generated/events/evt_combat_elite.png",
  evt_item_shop: "assets/generated/events/evt_item_shop.png",
  evt_tavern: "assets/generated/events/evt_tavern.png",
  evt_boss: "assets/generated/events/evt_boss.png",
  evt_misty_crossroads: "assets/generated/events/evt_misty_crossroads.png"
});
const DATA = {
  classes: {
    warrior: {
      id: "warrior",
      name: "战士",
      icon: "🛡️",
      desc: "钢铁防线，以盾护队、以力反击。",
      baseStats: { crit: 5, critDmg: 50, energy: 100, energyRegen: 0, aggro: 50 },
      baseAttributes: { str: 15, agi: 20, int: 2.75, con: 25 },
      growthAttributes: { str: 1.4, agi: 0.9, int: 0, con: 1.2 },
      skills: [
        { id: "w_slash", name: "斩击", cost: 0, cooldown: 0, targets: "single", desc: "造成{1.0倍攻击|red}伤害，恢复{20能量|blue}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "energy", amount: 20 }] },
        { id: "w_shield_bash", name: "盾击", cost: 20, cooldown: 2, targets: "single", desc: "造成{1.2倍攻击|red}伤害，30%概率眩晕", effects: [{ type: "damage", coeff: 1.2, statKey: "atk" }, { type: "stun", chance: 0.3, turns: 1 }] },
        { id: "w_taunt", name: "嘲讽", cost: 20, cooldown: 3, targets: "self", desc: "获得{0.6倍防御|blue}护盾并嘲讽", effects: [{ type: "shield", coeff: 0.6, statKey: "def" }, { type: "buff", buffId: "taunt", turns: 2 }] },
        { id: "w_counter", name: "反击姿态", cost: 25, cooldown: 3, targets: "self", desc: "被攻击时自动反击", effects: [{ type: "buff", buffId: "counter_stance", turns: 2, stacks: 3 }] },
        { id: "w_armor_break", name: "破甲打击", cost: 20, cooldown: 2, targets: "single", desc: "伤害并叠加破甲", effects: [{ type: "damage", coeff: 1.3, statKey: "atk" }, { type: "debuff", buffId: "armor_break", turns: 3, stacks: 2 }] },
        { id: "w_warcry", name: "战吼", cost: 25, cooldown: 4, targets: "self", desc: "攻击提升，伤害减免{+20%|blue}", effects: [{ type: "buff", buffId: "strengthen", turns: 3 }, { type: "buff", buffId: "fortify", turns: 3 }] },
        { id: "w_ult", name: "不屈壁垒", cost: 45, cooldown: 6, targets: "self", desc: "获得大量护盾并免疫控制", isUlt: true, effects: [{ type: "shield", coeff: 1.5, statKey: "def" }, { type: "buff", buffId: "cc_immune", turns: 1 }] }
      ]
    },
    mage: {
      id: "mage",
      name: "法师",
      icon: "🔮",
      desc: "元素之力的掌控者，毁天灭地。",
      baseStats: { crit: 10, critDmg: 50, energy: 100, energyRegen: 0, aggro: 20 },
      baseAttributes: { str: 2.75, agi: 10, int: 22.5, con: 20 },
      growthAttributes: { str: 0, agi: 0, int: 2, con: 1.2 },
      skills: [
        { id: "m_bolt", name: "奥术弹", cost: 0, cooldown: 0, targets: "single", desc: "造成{0.8倍法强|red}伤害，恢复{20能量|blue}", effects: [{ type: "damage", coeff: 0.8, statKey: "matk" }, { type: "energy", amount: 20 }] },
        { id: "m_fireball", name: "火球术", cost: 22, cooldown: 2, targets: "single", desc: "高额法伤并附加灼烧", effects: [{ type: "damage", coeff: 1.6, statKey: "matk" }, { type: "dot", buffId: "burn", turns: 2, dmgCoeff: 0.3 }] },
        { id: "m_frost", name: "冰霜新星", cost: 28, cooldown: 3, targets: "all", desc: "对全体敌人造成法术伤害", effects: [{ type: "damage", coeff: 1, statKey: "matk" }] },
        { id: "m_lightning", name: "闪电链", cost: 25, cooldown: 2, targets: "single", desc: "三段闪电伤害", effects: [{ type: "damage", coeff: 0.6, statKey: "matk", hits: 3 }] },
        { id: "m_shield", name: "法力护盾", cost: 25, cooldown: 3, targets: "self", desc: "获得{1.0倍法强|blue}护盾", effects: [{ type: "shield", coeff: 1, statKey: "matk" }] },
        { id: "m_resonance", name: "元素共鸣", cost: 15, cooldown: 3, targets: "self", desc: "下次技能伤害提升", effects: [{ type: "buff", buffId: "elemental_resonance", turns: 2 }] },
        { id: "m_ult", name: "陨星", cost: 50, cooldown: 6, targets: "all", desc: "对全体敌人造成{2.5倍法强|red}伤害", isUlt: true, effects: [{ type: "damage", coeff: 2.5, statKey: "matk" }] }
      ]
    },
    ranger: {
      id: "ranger",
      name: "游侠",
      icon: "🏹",
      desc: "疾风迅矢，百步穿杨。",
      baseStats: { crit: 10, critDmg: 60, energy: 100, energyRegen: 0, aggro: 25 },
      baseAttributes: { str: 17.5, agi: 15, int: 7.5, con: 22.5 },
      growthAttributes: { str: 1.5, agi: 1, int: 0, con: 0.8 },
      skills: [
        { id: "r_shot", name: "射击", cost: 0, cooldown: 0, targets: "single", desc: "造成攻击伤害并恢复{20能量|blue}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "energy", amount: 20 }] },
        { id: "r_rapid", name: "连射", cost: 22, cooldown: 2, targets: "single", desc: "快速射击三次", effects: [{ type: "damage", coeff: 0.5, statKey: "atk", hits: 3 }] },
        { id: "r_poison", name: "震荡箭", cost: 20, cooldown: 3, targets: "single", desc: "造成{1.0倍攻击|red}伤害，{35%概率|purple}眩晕{1回合|yellow}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "stun", chance: 0.35, turns: 1 }] },
        { id: "r_pierce", name: "穿甲箭", cost: 22, cooldown: 2, targets: "single", desc: "伤害并叠加破甲", effects: [{ type: "damage", coeff: 1.2, statKey: "atk" }, { type: "debuff", buffId: "armor_break", turns: 3, stacks: 3 }] },
        { id: "r_dodge", name: "翻滚", cost: 15, cooldown: 3, targets: "self", desc: "获得{25%闪避|blue}和伤害减免{+20%|blue}", effects: [{ type: "buff", buffId: "evasion", turns: 2 }, { type: "buff", buffId: "fortify", turns: 1 }] },
        { id: "r_mark", name: "猎杀标记", cost: 18, cooldown: 3, targets: "single", desc: "标记目标{3回合|yellow}，使其受到游侠的伤害{+20%|red}", effects: [{ type: "debuff", buffId: "ranger_mark", turns: 3 }] },
        { id: "r_ult", name: "风暴箭雨", cost: 48, cooldown: 6, targets: "all", desc: "全体三段伤害", isUlt: true, effects: [{ type: "damage", coeff: 0.7, statKey: "atk", hits: 3 }] }
      ]
    },
    priest: {
      id: "priest",
      name: "牧师",
      icon: "✨",
      desc: "圣光庇护，驱散黑暗。",
      baseStats: { crit: 5, critDmg: 50, energy: 100, energyRegen: 0, aggro: 15 },
      baseAttributes: { str: 2.75, agi: 15, int: 17.5, con: 22.5 },
      growthAttributes: { str: 0, agi: 0.9, int: 1.5, con: 0.9 },
      skills: [
        { id: "p_smite", name: "圣光弹", cost: 0, cooldown: 0, targets: "single", desc: "造成法术伤害并恢复{20能量|blue}", effects: [{ type: "damage", coeff: 0.7, statKey: "matk" }, { type: "energy", amount: 20 }] },
        { id: "p_heal", name: "治疗术", cost: 22, cooldown: 1, targets: "party_single", desc: "治疗最低生命队友", effects: [{ type: "heal", coeff: 1.2, statKey: "matk" }] },
        { id: "p_prayer", name: "群体祷言", cost: 30, cooldown: 3, targets: "party", desc: "治疗全队并添加护盾", effects: [{ type: "heal", coeff: 0.5, statKey: "matk" }, { type: "shield", coeff: 0.3, statKey: "matk" }] },
        { id: "p_dispel", name: "驱散", cost: 15, cooldown: 2, targets: "party_single", desc: "移除减益", effects: [{ type: "dispel", count: 1 }] },
        { id: "p_holy", name: "神圣惩击", cost: 22, cooldown: 2, targets: "single", desc: "对亡灵伤害更高", effects: [{ type: "damage", coeff: 1.4, statKey: "matk", bonusTag: "undead", bonusMul: 1.5 }] },
        { id: "p_bless", name: "祝福", cost: 22, cooldown: 4, targets: "party_single", desc: "为队友提供全能增益：伤害{+10%|red}、伤害减免{+10%|blue}", effects: [{ type: "buff", buffId: "haste", turns: 3 }, { type: "buff", buffId: "versatile", turns: 3 }] },
        { id: "p_ult", name: "神迹", cost: 50, cooldown: 7, targets: "party", desc: "全队大量治疗、净化并获得伤害减免{+20%|blue}", isUlt: true, effects: [{ type: "heal", coeff: 1.5, statKey: "matk" }, { type: "dispel", count: 99 }, { type: "buff", buffId: "fortify", turns: 2 }] }
      ]
    },
    assassin: {
      id: "assassin",
      name: "刺客",
      icon: "🗡️",
      desc: "暗影潜行，一击致命。",
      baseStats: { crit: 20, critDmg: 75, energy: 100, energyRegen: 0, aggro: 20 },
      baseAttributes: { str: 20, agi: 10, int: 1.75, con: 22.5 },
      growthAttributes: { str: 1.6, agi: 0.5, int: 0, con: 1 },
      skills: [
        { id: "a_stab", name: "刺击", cost: 0, cooldown: 0, targets: "single", desc: "造成攻击伤害并恢复{20能量|blue}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "energy", amount: 20 }] },
        { id: "a_backstab", name: "背刺", cost: 20, cooldown: 2, targets: "single", desc: "高伤害并获得暴击提升", effects: [{ type: "damage", coeff: 1.5, statKey: "atk" }, { type: "buff", buffId: "focus", turns: 2 }] },
        { id: "a_venom", name: "淬毒", cost: 18, cooldown: 2, targets: "single", desc: "伤害并附加中毒", effects: [{ type: "damage", coeff: 0.7, statKey: "atk" }, { type: "dot", buffId: "poison", turns: 3, dmgCoeff: 0.3 }] },
        { id: "a_shadow", name: "暗影步", cost: 18, cooldown: 3, targets: "self", desc: "获得闪避和攻击提升", effects: [{ type: "buff", buffId: "evasion", turns: 2 }, { type: "buff", buffId: "strengthen", turns: 2 }] },
        { id: "a_expose", name: "破绽打击", cost: 22, cooldown: 3, targets: "single", desc: "造成{1.0倍攻击|red}伤害并使目标{被猎杀|purple}{2回合|yellow}，期间受到我方全体伤害{+20%|red}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "debuff", buffId: "hunted", turns: 2 }] },
        { id: "a_execute", name: "处决", cost: 25, cooldown: 3, targets: "single", desc: "造成{2.0倍攻击|red}伤害", effects: [{ type: "damage", coeff: 2, statKey: "atk" }] },
        { id: "a_ult", name: "影舞连斩", cost: 50, cooldown: 7, targets: "all", desc: "全体五段伤害", isUlt: true, effects: [{ type: "damage", coeff: 0.5, statKey: "atk", hits: 5 }] }
      ]
    },
    vampire: {
      id: "vampire",
      name: "吸血鬼",
      icon: "🧛",
      desc: "暗夜掠食者，以血为力、以伤为治。",
      baseStats: { crit: 10, critDmg: 60, energy: 100, energyRegen: 0, aggro: 30 },
      baseAttributes: { str: 15, agi: 15, int: 10, con: 22.5 },
      growthAttributes: { str: 1.4, agi: 0.5, int: 0.7, con: 0.8 },
      skills: [
        { id: "v_claw", name: "血爪", cost: 0, cooldown: 0, targets: "single", desc: "攻击、吸血并恢复{20能量|blue}", effects: [{ type: "damage", coeff: 1, statKey: "atk", lifestealPct: 0.1 }, { type: "energy", amount: 20 }] },
        { id: "v_thirst", name: "血之饥渴", cost: 22, cooldown: 2, targets: "single", desc: "高伤害并吸血", effects: [{ type: "damage", coeff: 1.6, statKey: "atk", lifestealPct: 0.25 }] },
        { id: "v_mist", name: "暗夜迷雾", cost: 20, cooldown: 3, targets: "self", desc: "获得闪避", effects: [{ type: "buff", buffId: "evasion", turns: 2, targets: "self" }] },
        { id: "v_eruption", name: "鲜血炸裂", cost: 25, cooldown: 3, targets: "all", desc: "全体法伤并灼烧", effects: [{ type: "damage", coeff: 1.1, statKey: "matk" }, { type: "dot", buffId: "burn", turns: 2, dmgCoeff: 0.25 }] },
        { id: "v_siphon", name: "生命虹吸", cost: 22, cooldown: 2, targets: "single", desc: "伤害并治疗最低生命队友", effects: [{ type: "damage", coeff: 1.3, statKey: "atk" }, { type: "heal", coeff: 0.5, statKey: "atk", targets: "party_lowest" }] },
        { id: "v_pact", name: "血之契约", cost: 15, cooldown: 4, targets: "self", desc: "献祭当前HP获得强化", effects: [{ type: "selfDmgPct", pct: 0.1 }, { type: "buff", buffId: "v_blood_frenzy", turns: 3 }] },
        { id: "v_ult", name: "鲜血盛宴", cost: 48, cooldown: 6, targets: "all", desc: "全体四段吸血伤害", isUlt: true, effects: [{ type: "damage", coeff: 0.55, statKey: "atk", hits: 4, lifestealPct: 0.3 }] }
      ]
    },
    druid: {
      id: "druid",
      name: "德鲁伊",
      icon: "🌿",
      desc: "大地之力的化身，以生命为盾、以荆棘为甲。",
      baseStats: { crit: 5, critDmg: 50, energy: 100, energyRegen: 0, aggro: 45 },
      baseAttributes: { str: 12.5, agi: 20, int: 5, con: 25 },
      growthAttributes: { str: 1.1, agi: 0.9, int: 0.1, con: 1.4 },
      skills: [
        { id: "d_strike", name: "大地打击", cost: 0, cooldown: 0, targets: "single", desc: "造成攻击伤害并恢复{20能量|blue}", effects: [{ type: "damage", coeff: 1, statKey: "atk" }, { type: "energy", amount: 20 }] },
        { id: "d_thorns", name: "荆棘甲", cost: 18, cooldown: 2, targets: "self", desc: "获得荆棘和生命护盾", effects: [{ type: "buff", buffId: "d_thorns_buff", turns: 2 }, { type: "shield", coeff: 0.06, statKey: "maxHp" }] },
        { id: "d_bear", name: "熊形态", cost: 22, cooldown: 4, targets: "self", desc: "提高防御并获得伤害减免{+25%|blue}", effects: [{ type: "buff", buffId: "d_bear_form", turns: 3 }] },
        { id: "d_hawk", name: "猛禽形态", cost: 22, cooldown: 4, targets: "self", desc: "提高攻击", effects: [{ type: "buff", buffId: "d_hawk_form", turns: 3 }] },
        { id: "d_nature_slam", name: "自然震击", cost: 24, cooldown: 3, targets: "all", desc: "生命上限伤害并概率眩晕", effects: [{ type: "damage", coeff: 0.06, statKey: "maxHp" }, { type: "stun", chance: 0.25, turns: 1 }] },
        { id: "d_swarm", name: "虫群", cost: 25, cooldown: 3, targets: "all", desc: "全体生命上限伤害并中毒", effects: [{ type: "damage", coeff: 0.06, statKey: "maxHp" }, { type: "dot", buffId: "poison", turns: 2, dmgCoeff: 0.02, statKey: "maxHp" }] },
        { id: "d_ult", name: "大地之怒", cost: 48, cooldown: 6, targets: "all", desc: "全体伤害，全队护盾", isUlt: true, effects: [{ type: "damage", coeff: 0.1, statKey: "maxHp" }, { type: "shield", coeff: 0.04, statKey: "maxHp", targets: "party" }] }
      ]
    },
    puppeteer: {
      id: "puppeteer",
      name: "傀儡师",
      icon: "🧵",
      desc: "双体指令流：操纵可被攻击的机关傀儡，攻防随指令切换。",
      baseStats: { crit: 8, critDmg: 55, energy: 110, energyRegen: 0, aggro: 15 },
      baseAttributes: { str: 2.75, agi: 12, int: 22.5, con: 20 },
      growthAttributes: { str: 0, agi: 0.5, int: 2.1, con: 1.1 },
      skills: [
        { id: "u_thread", name: "引线针", cost: 0, cooldown: 0, targets: "single", desc: "自身造成{0.72倍法强|red}伤害并回20能量，傀儡追击{0.52倍法强|red}", effects: [{ type: "damage", coeff: 0.72, statKey: "matk" }, { type: "energy", amount: 20 }], puppetCommand: { type: "strike", coeff: 0.52 } },
        { id: "u_break_order", name: "破阵令", cost: 20, cooldown: 2, targets: "single", desc: "傀儡造成{1.65倍法强|red}伤害并叠加3层破甲", effects: [], puppetCommand: { type: "strike", coeff: 1.65, armorBreak: 3 } },
        { id: "u_guard_order", name: "守御令", cost: 18, cooldown: 3, targets: "self", desc: "傀儡获得{30%最大生命|blue}护盾并嘲讽2回合", effects: [], puppetCommand: { type: "guard", shieldPct: 0.3, turns: 2 } },
        { id: "u_shift", name: "移形换位", cost: 20, cooldown: 4, targets: "self", desc: "接下来2次针对主人的单体攻击转移给傀儡，转移伤害{-25%|blue}", effects: [], puppetCommand: { type: "link", charges: 2, reduction: 0.25, turns: 2 } },
        { id: "u_rebuild", name: "归线重构", cost: 24, cooldown: 4, targets: "self", desc: "傀儡存活时修复45%生命；损毁时以50%生命重构", effects: [], puppetCommand: { type: "repair", healPct: 0.45, revivePct: 0.5 } },
        { id: "u_overdrive", name: "核心过载", cost: 25, cooldown: 4, targets: "self", desc: "接下来2次攻击指令追加65%回响；每次消耗傀儡7%生命且不会自毁", effects: [], puppetCommand: { type: "overdrive", charges: 2, echoScale: 0.65, healthCostPct: 0.07 } },
        { id: "u_ult", name: "百机同调", cost: 50, cooldown: 6, targets: "all", desc: "完全修复傀儡，对全体造成{1.15倍法强|red}伤害，随后3次攻击指令追加55%回响", isUlt: true, effects: [], puppetCommand: { type: "ultimate", coeff: 1.15, echoCharges: 3, echoScale: 0.55 } }
      ]
    }
  },
  hiddenTalents: [
    { id: "ht_divine_hand", name: "天罚之手", rarity: "hidden", icon: "🖐️", desc: "每次{普攻|red}永久增加{1/1/2最大生命|green}，并附加{最大生命1%/1.5%/2%|purple}真实伤害（随星级提升）", passive: "divine_hand" },
    { id: "ht_arcane_echo", name: "奥术回响", rarity: "hidden", icon: "🔮", desc: "每次释放{攻击技能|blue}永久增加{+1法术强度|blue}，并有{20%|gold}概率立即刷新冷却", passive: "arcane_echo" },
    { id: "ht_iron_heart", name: "铁壁之心", rarity: "hidden", icon: "🛡️", desc: "每层首次进入战斗时获得{+当前层数|blue}防御；开局获得{当前防御50%|blue}护盾", passive: "iron_heart" },
    { id: "ht_soul_harvest", name: "灵魂收割", rarity: "hidden", icon: "👻", desc: "击杀敌人{永久攻击+1|red}，精英{+2|red}，Boss{+3|red}；战斗内全伤害{+当前层数%|red}", passive: "soul_harvest" },
    { id: "ht_gale_breath", name: "疾风之息", rarity: "hidden", icon: "💨", desc: "风之加护赋予极致迅捷，{每回合行动两次|red}，获得{10%闪避|blue}", passive: "gale_breath" }
  ]
};
DATA.talents = [
  { id: "t_hp_up", name: "轮回适应", rarity: "common", desc: "生命值{+10%|green}", statMod: { hpPct: 0.1 } },
  { id: "t_atk_up", name: "锋利", rarity: "common", desc: "攻击力{+10%|red}", statMod: { atkPct: 0.1 } },
  { id: "t_matk_up", name: "法术涌动", rarity: "common", desc: "法术强度{+10%|blue}", statMod: { matkPct: 0.1 } },
  { id: "t_def_up", name: "铁壁", rarity: "common", desc: "防御{+10%|blue}", statMod: { defPct: 0.1 } },
  { id: "t_energy_up", name: "精力充沛", rarity: "common", desc: "能量上限{+15|blue}", statMod: { energy: 15 } },
  { id: "t_regen1", name: "生命汲取", rarity: "common", desc: "每回合回复{1%|green}最大生命", passive: "regen_1pct" },
  { id: "t_gold_up", name: "财运", rarity: "common", desc: "战斗金币{+10%|gold}", passive: "gold_10pct" },
  { id: "t_potion_up", name: "药剂强化", rarity: "common", desc: "道具回复效果{+20%|green}", passive: "potion_boost" },
  { id: "t_crit_up", name: "鹰眼", rarity: "common", desc: "暴击率{+5%|red}", statMod: { critPct: 0.05 } },
  { id: "t_merc_hp", name: "同袍之谊", rarity: "common", desc: "佣兵生命值{+15%|green}", passive: "merc_hp" },
  { id: "t_thorn_minor", name: "荆棘体质", rarity: "common", desc: "受攻击时反弹{5%|purple}伤害", passive: "thorn_minor" },
  { id: "t_battle_will", name: "战意", rarity: "common", desc: "每回合攻击{+2|red}（本场战斗）", passive: "battle_will" },
  { id: "t_tough_body", name: "铜皮铁骨", rarity: "common", desc: "受到伤害时，伤害减免{+5%|blue}", passive: "tough_body" },
  { id: "t_sharp_eye", name: "锐利", rarity: "common", desc: "暴击伤害{+10%|red}", statMod: { critDmgPct: 0.1 } },
  { id: "t_scavenger", name: "拾荒者", rarity: "common", desc: "战斗掉落道具概率{+10%|green}", passive: "scavenger" },
  { id: "t_crit_train", name: "暴击训练", rarity: "rare", desc: "暴击{+5%|red}，暴伤{+10%|red}", statMod: { critPct: 0.05, critDmgPct: 0.1 } },
  { id: "t_first_strike", name: "先发制人", rarity: "rare", desc: "前3回合全伤害{+15%|red}", passive: "first_strike" },
  { id: "t_shield_exp", name: "护盾专家", rarity: "rare", desc: "所有护盾效果{+25%|blue}", passive: "shield_expert" },
  { id: "t_executioner", name: "处刑者", rarity: "rare", desc: "目标血量<30%时伤害{+20%|red}", passive: "executioner" },
  { id: "t_thick_skin", name: "厚皮", rarity: "rare", desc: "单次伤害超15%血量时，超出部分减免30%", passive: "thick_skin" },
  { id: "t_energy_flow", name: "能量涌流", rarity: "rare", desc: "能量回复{+4|blue}", statMod: { energyRegen: 4 } },
  { id: "t_loot_luck", name: "探宝直觉", rarity: "rare", desc: "装备品质提升概率{+20%|gold}", passive: "loot_luck" },
  { id: "t_counter_atk", name: "以牙还牙", rarity: "rare", desc: "受击后{25%|gold}概率反击，造成{50%攻击|red}真实伤害", passive: "counter_30pct" },
  { id: "t_armor_pierce", name: "破甲强化", rarity: "rare", desc: "每次攻击叠加{1层破甲|red}", passive: "armor_pierce" },
  { id: "t_dodge_master", name: "闪避大师", rarity: "rare", desc: "{10%|gold}概率完全闪避攻击", passive: "dodge_master" },
  { id: "t_gold_mult", name: "点金术", rarity: "rare", desc: "战斗金币{+30%|gold}", passive: "gold_30pct" },
  { id: "t_heal_boost", name: "治愈之力", rarity: "rare", desc: "受到治疗{+20%|green}", passive: "heal_boost" },
  { id: "t_item_saver", name: "节俭", rarity: "rare", desc: "使用道具时{20%|gold}概率不消耗", passive: "item_saver" },
  { id: "t_merc_atk", name: "军团指挥", rarity: "rare", desc: "佣兵攻击和法强{+15%|red}", passive: "merc_atk" },
  { id: "t_opening_shield", name: "先手护盾", rarity: "rare", desc: "战斗开始获得{10%|blue}最大生命护盾", passive: "opening_shield" },
  { id: "t_vampiric", name: "吸血体质", rarity: "rare", desc: "每次造成伤害回复{5%|green}伤害值的HP", passive: "vampiric" },
  { id: "t_bomb_expert", name: "爆破专家", rarity: "rare", desc: "消耗品造成伤害{+50%|red}", passive: "bomb_expert" },
  { id: "t_lucky_dodge", name: "幸运闪避", rarity: "rare", desc: "被暴击时{25%|gold}概率抵消额外暴击伤害", passive: "lucky_dodge" },
  { id: "t_enemy_counter_guard", name: "反击守护", rarity: "rare", desc: "受到的怪物反击和荆棘伤害减少{25%|blue}", passive: "enemy_counter_guard" },
  { id: "t_stun_master", name: "控制强化", rarity: "rare", desc: "眩晕/沉默持续时间{+1回合|gold}", passive: "stun_extend" },
  { id: "t_sp_boost", name: "万法通明", rarity: "mythic", desc: "每{3级|gold}额外获得{1|gold}技能点", passive: "sp_boost" },
  { id: "t_xp_boost", name: "经验丰富", rarity: "rare", desc: "战斗经验获取{+20%|gold}", passive: "xp_boost" },
  { id: "t_multi_hit", name: "多段狂热", rarity: "epic", desc: "攻击{10%|gold}概率追击，造成{50%攻击|red}伤害", passive: "multi_hit" },
  { id: "t_elem_chain", name: "元素连锁", rarity: "epic", desc: "每次施加{灼烧或中毒|purple}时，额外造成{20%攻击|red}真实伤害", passive: "elem_chain" },
  { id: "t_crisis", name: "逆境爆发", rarity: "epic", desc: "血量<35%时伤害和受疗{+25%|red}", passive: "crisis" },
  { id: "t_bloodthirst", name: "嗜血", rarity: "epic", desc: "击杀回复{15%|green}最大生命", passive: "bloodthirst" },
  { id: "t_overcharge", name: "超载", rarity: "epic", desc: "溢出能量每10点提升{+2%|red}伤害，至多{+50%|red}", passive: "overcharge" },
  { id: "t_combo_master", name: "连招大师", rarity: "epic", desc: "连续使用不同技能时，每层伤害{+5%|red}，最多5层", passive: "combo_master" },
  { id: "t_last_stand", name: "背水一战", rarity: "epic", desc: "血量<20%时{受伤减半|blue}", passive: "last_stand" },
  { id: "t_mana_burst", name: "法力爆发", rarity: "epic", desc: "消耗{40点及以上能量|blue}的攻击技能，额外造成{25%|red}伤害", passive: "mana_burst" },
  { id: "t_overkill", name: "赶尽杀绝", rarity: "epic", desc: "击杀时将{100%溢出伤害|red}分摊给其余敌人", passive: "overkill" },
  { id: "t_energy_drain", name: "能量虹吸", rarity: "epic", desc: "击杀敌人回复{20|blue}能量", passive: "energy_drain" },
  { id: "t_burn_master", name: "焚天", rarity: "epic", desc: "灼烧伤害{+40%|red}，持续+1回合", passive: "burn_master" },
  { id: "t_double_strike", name: "双刃斩", rarity: "epic", desc: "普攻{20%|gold}概率追加攻击", passive: "double_strike" },
  { id: "t_merc_revive", name: "战友之魂", rarity: "epic", desc: "佣兵阵亡后可继续战斗1回合，期间攻击{+50%|red}", passive: "merc_last_breath" },
  { id: "t_item_double", name: "博学炼金", rarity: "epic", desc: "道具效果{翻倍|gold}", passive: "item_double" },
  { id: "t_fury_stack", name: "狂怒叠加", rarity: "epic", desc: "受到敌方攻击技能伤害后获得1层怒气，持续{3回合|gold}；每层伤害{+3%|red}，可叠加", passive: "fury_stack" },
  { id: "t_adapt", name: "适应力", rarity: "epic", desc: "受到同一敌人攻击后，对其伤害减免{+5%|blue}，最多叠加3层", passive: "adapt" },
  { id: "t_chain_kill", name: "连斩", rarity: "epic", desc: "击杀后恢复15能量并使下次伤害{+15%|red}", passive: "chain_kill" },
  { id: "t_turn_accel", name: "回合加速器", rarity: "legendary", desc: "能量回复{+8|blue}", statMod: { energyRegen: 8 } },
  { id: "t_mastery_awake", name: "专精觉醒", rarity: "legendary", desc: "暴击伤害{+50%|red}，防御{-10%|red}", statMod: { critDmgPct: 0.5 }, fixedStatMod: { defPct: -0.1 }, passive: "mastery_awake" },
  { id: "t_phoenix", name: "浴火重生", rarity: "legendary", desc: "首次阵亡以30%血量复活", passive: "phoenix" },
  { id: "t_time_warp", name: "时间扭曲", rarity: "legendary", desc: "前3回合全伤害{+15%|red}；生命、攻击、法强、防御{+5%|blue}", statMod: { hpPct: 0.05, atkPct: 0.05, matkPct: 0.05, defPct: 0.05 }, passive: "time_warp" },
  { id: "t_shield_reflect", name: "荆棘护盾", rarity: "legendary", desc: "拥有护盾时反弹{15%|red}受到的伤害", passive: "shield_reflect" },
  { id: "t_merc_fury", name: "军团之怒", rarity: "legendary", desc: "每名存活佣兵使全队伤害{+8%|red}、伤害减免{+5%|blue}", passive: "merc_fury" },
  { id: "t_item_magnet", name: "道具磁石", rarity: "legendary", desc: "战斗胜利必掉道具，商店价格{70%|gold}", passive: "item_magnet" },
  { id: "t_blood_pact", name: "血之契约", rarity: "legendary", desc: "最大生命{-10%|red}；攻击、法强{+20%|red}；暴击率{+10%|red}", statMod: { hpPct: -0.1, atkPct: 0.2, matkPct: 0.2, critPct: 0.1 }, passive: "blood_pact" },
  { id: "t_mirror", name: "镜像之力", rarity: "legendary", desc: "每{6回合|gold}复制上一个使用的技能并免费释放", passive: "mirror" },
  { id: "t_death_mark", name: "死亡宣告", rarity: "legendary", desc: "连续攻击同一敌人{5次|gold}时，该次攻击必定暴击并附带真伤", passive: "death_mark" },
  { id: "t_reincarnation_admin", name: "轮回管理员", rarity: "mythic", desc: "天赋轮数+1且每轮可选+1；每层生命、攻击、法强、防御{+2|blue}", passive: "reincarnation_admin" },
  { id: "t_meteor_spam", name: "陨星连发", rarity: "mythic", classReq: "mage", desc: "法师专属：陨星无冷却；本轮每次施放后，后续魔法消耗{+10|red}，最高100；每次施放永久{+2法强|blue}", passive: "meteor_spam" },
  { id: "t_undying", name: "永不倒下", rarity: "mythic", classReq: "warrior", desc: "战士专属：致死以{50%生命|green}复活并强化", passive: "undying" },
  { id: "t_venom_blast", name: "风暴箭阵", rarity: "mythic", classReq: "ranger", desc: "游侠专属：多段技能的{最后一段伤害+100%|red}", passive: "venom_blast" },
  { id: "t_holy_echo", name: "神迹回响", rarity: "mythic", classReq: "priest", desc: "牧师专属：治疗时对全体敌人造成治疗量{50%|red}真实伤害", passive: "holy_echo" },
  { id: "t_divine_accumulation", name: "神恩积蓄", rarity: "mythic", classReq: "priest", desc: "牧师专属：每次治疗友方永久提升{+1治疗量|green}", passive: "divine_accumulation" },
  { id: "t_god_slayer", name: "弑神者", rarity: "mythic", desc: "对Boss伤害+30%，受Boss伤害减免+20%", passive: "god_slayer" },
  { id: "t_dmg_escalate", name: "战意凝聚", rarity: "mythic", desc: "每层首次胜利永久+1%伤害", passive: "dmg_escalate" },
  { id: "t_war_council", name: "全军出击", rarity: "mythic", desc: "佣兵攻击、法强{+25%|red}；开局全队获得{15%最大生命|blue}护盾", passive: "war_council" },
  { id: "t_chaos_lord", name: "混沌领主", rarity: "mythic", desc: "攻击施加随机减益{1回合|purple}；减益目标伤害{+10%|red}", passive: "chaos_lord" },
  { id: "t_sword_saint", name: "剑圣", rarity: "mythic", classReq: "warrior", desc: "战士专属：普攻必暴击且追加一次造成{100%攻击伤害|red}的普攻", passive: "sword_saint" },
  { id: "t_archmage", name: "大魔导师", rarity: "mythic", classReq: "mage", desc: "法师专属：技能消耗{-20%|blue}，法术暴击时眩晕", passive: "archmage" },
  { id: "t_hunter_eye", name: "猎手之眼", rarity: "mythic", classReq: "ranger", desc: "游侠专属：攻击{猎杀标记|purple}目标后，本场对其伤害{+5%|red}，最多{5层|purple}；切换目标清空", passive: "hunter_eye" },
  { id: "t_death_sentence", name: "死神宣判", rarity: "mythic", classReq: "assassin", desc: "刺客专属：攻击标记敌人，低于{10%生命|red}时处决并恢复{30能量|blue}", passive: "death_sentence" },
  { id: "t_shadow_clone", name: "影分身", rarity: "mythic", classReq: "assassin", desc: "刺客专属：攻击有{50%|gold}概率追加{50%攻击|red}分身攻击", passive: "shadow_clone" },
  { id: "t_blood_lord", name: "鲜血领主", rarity: "mythic", classReq: "vampire", desc: "吸血效果{+50%|green}，溢出治疗转护盾（上限50%最大生命）", passive: "blood_lord" },
  { id: "t_night_terror", name: "暗夜恐惧", rarity: "mythic", classReq: "vampire", desc: "吸血鬼专属：每次攻击额外造成目标{1%最大生命|red}真实伤害并回复", passive: "night_terror" },
  { id: "t_natures_wrath", name: "自然之怒", rarity: "mythic", classReq: "druid", desc: "德鲁伊专属：变身状态下技能伤害{+35%|red}、DOT伤害{+40%|red}", passive: "natures_wrath" },
  { id: "t_primal_fortitude", name: "原始坚韧", rarity: "mythic", classReq: "druid", desc: "德鲁伊专属：受击/受疗永久{+1最大生命|green}；低血伤害减免+30%，高血伤害+15%", passive: "primal_fortitude" },
  { id: "t_shield_rebuke", name: "誓盾反击", rarity: "legendary", classReq: "warrior", desc: "战士专属：护盾单次吸收≥{10%最大生命|blue}伤害时，反射{40%吸收伤害|red}真实伤害；每回合一次", passive: "shield_rebuke" },
  { id: "t_unbroken_line", name: "不灭战线", rarity: "legendary", classReq: "warrior", desc: "战士专属：每场首次生命低于{30%|red}时，解除眩晕、沉默，获得{12%最大生命|blue}护盾与15%减伤1回合", passive: "unbroken_line" },
  { id: "t_triad_resonance", name: "三相共鸣", rarity: "legendary", classReq: "mage", desc: "法师专属：本场依次施放火球、冰霜新星、闪电链后，回能{20|blue}，下次攻击技能伤害{+20%|red}", passive: "triad_resonance" },
  { id: "t_mana_tide", name: "法力潮汐", rarity: "legendary", classReq: "mage", desc: "法师专属：能量蓄满后，下一次非终极技能消耗{-10|blue}、伤害{+15%|red}；触发后冷却3回合", passive: "mana_tide" },
  { id: "t_pursuit_mark", name: "追猎印记", rarity: "legendary", classReq: "ranger", desc: "游侠专属：攻击{猎杀标记|purple}目标叠加追猎；3层造成{3%目标最大生命|red}真实伤害", passive: "pursuit_mark" },
  { id: "t_gale_arrow", name: "风行连矢", rarity: "legendary", classReq: "ranger", desc: "游侠专属：用普攻或单体技能击杀敌人后，向生命最低敌人免费追射{40%攻击|red}；每回合一次", passive: "gale_arrow" },
  { id: "t_sacred_covenant", name: "圣约庇佑", rarity: "legendary", classReq: "priest", desc: "牧师专属：开局守护生命最低友军，受伤{-8%|blue}、受治疗{+15%|green}；首次残血获{10%最大生命|blue}护盾", passive: "sacred_covenant" },
  { id: "t_judgment_cycle", name: "神罚循环", rarity: "legendary", classReq: "priest", desc: "牧师专属：每施放4次直接治疗，对最低生命敌人造成{0.4倍法强|red}真实伤害并回能{10|blue}", passive: "judgment_cycle" },
  { id: "t_vital_insight", name: "命门洞察", rarity: "legendary", classReq: "assassin", desc: "刺客专属：攻击带至少2个减益的敌人时，暴击率{+10%|red}；本回合首次暴击使最长非终极冷却-1", passive: "vital_insight" },
  { id: "t_shadow_return", name: "影返", rarity: "legendary", classReq: "assassin", desc: "刺客专属：成功闪避后，下次攻击暴击率{+25%|red}并回能{10|blue}；每回合一次", passive: "shadow_return" },
  { id: "t_blood_pool_recovery", name: "血池反哺", rarity: "legendary", classReq: "vampire", desc: "吸血鬼专属：单次有效自疗达到{8%最大生命|green}时，获得{4%最大生命|blue}护盾；每回合一次", passive: "blood_pool_recovery" },
  { id: "t_crimson_hunt", name: "猩红狩猎", rarity: "legendary", classReq: "vampire", desc: "吸血鬼专属：累计有效自疗达{25%最大生命|green}时，下次攻击伤害{+20%|red}并回能{10|blue}；每场最多2次", passive: "crimson_hunt" },
  { id: "t_dual_shift", name: "双相更替", rarity: "legendary", classReq: "druid", desc: "德鲁伊专属：3回合内切换熊、猛禽形态：熊转鹰减伤{10%|blue}，鹰转熊下次攻击{+20%|red}；每4回合一次", passive: "dual_shift" },
  { id: "t_thornwood_domain", name: "荆棘森域", rarity: "legendary", classReq: "druid", desc: "德鲁伊专属：开局全队获得{6%最大生命|blue}护盾；友方破盾时使攻击者中毒2回合，每回合{1%最大生命|purple}", passive: "thornwood_domain" },
  { id: "t_afterglow_pursuit", name: "余韵追击", rarity: "epic", desc: "施放非终极且不直接造成伤害的技能后，下一次伤害{+18%|red}", passive: "afterglow_pursuit" },
  { id: "t_bulwark_rebound", name: "壁垒反震", rarity: "rare", desc: "自身护盾被击破时，对攻击者造成{4%最大生命|red}真实伤害；每回合最多一次", passive: "bulwark_rebound" },
  { id: "t_steady_line", name: "稳固阵线", rarity: "epic", desc: "回合开始时若自身带有护盾，本回合受到伤害{-8%|blue}", passive: "steady_line" },
  { id: "t_emergency_barrier", name: "应急屏障", rarity: "rare", desc: "每场战斗首次生命低于{35%|red}时，获得{12%最大生命|blue}护盾，并解除1个减益", passive: "emergency_barrier" },
  { id: "t_weakness_exploit", name: "弱点扩散", rarity: "rare", desc: "攻击带有任意减益的敌人时，伤害{+8%|red}", passive: "weakness_exploit" },
  { id: "t_exploit_opening", name: "乘隙而入", rarity: "epic", desc: "攻击带有2个及以上减益的敌人时，额外无视{10%|red}防御", passive: "exploit_opening" },
  { id: "t_purification_reversal", name: "净化反转", rarity: "rare", desc: "自身每解除1个减益，回复{4%最大生命|green}，下一次伤害{+10%|red}；最多叠加3层", passive: "purification_reversal" },
  { id: "t_desperate_edge", name: "绝境锋芒", rarity: "epic", desc: "生命低于{40%|red}时，伤害{+15%|red}，受到治疗{+20%|green}", passive: "desperate_edge" },
  { id: "t_soul_link", name: "魂线共生", rarity: "legendary", classReq: "puppeteer", desc: "傀儡存活时主人减伤{8%|blue}；傀儡每回合首次受到生命伤害时主人回复{5能量|blue}", passive: "soul_link" },
  { id: "t_command_circuit", name: "指令回路", rarity: "legendary", classReq: "puppeteer", desc: "连续使用3种不同指令后修复傀儡{8%生命|green}、回复{10能量|blue}，下次攻击指令伤害{+15%|red}", passive: "command_circuit" },
  { id: "t_grand_puppeteer", name: "傀儡之王", rarity: "mythic", classReq: "puppeteer", desc: "傀儡指令伤害{+25%|red}，最大生命{+15%|green}", passive: "grand_puppeteer" },
  { id: "t_immortal_core", name: "不灭机心", rarity: "mythic", classReq: "puppeteer", desc: "傀儡每战首次损毁时自动以{35%生命|green}重构，并获得{10%生命|blue}护盾", passive: "immortal_core" }
];
DATA.equipSlots = ["weapon", "helmet", "chest", "amulet", "ring"];
DATA.equipSlotNames = { weapon: "武器", helmet: "头盔", chest: "胸甲", amulet: "护符", ring: "戒指" };
DATA.equipSlotIcons = { weapon: "⚔️", helmet: "🪖", chest: "🛡️", amulet: "📿", ring: "💍" };
DATA.equipRarityOrder = ["white", "green", "blue", "purple", "orange", "red"];
DATA.equipRarityBaseMult = { white: 1, green: 1.2, blue: 1.4, purple: 1.6, orange: 1.8, red: 2 };
DATA.equipRarityAffixSlots = { white: 0, green: 1, blue: 2, purple: 3, orange: 4, red: 5 };
DATA.equipNamePool = {
  weapon: {
    white: [["铁剑", "🗡️"], ["木杖", "🪄"], ["短刀", "🔪"], ["石锤", "🔨"]],
    green: [["锋刃长剑", "🗡️"], ["橡木法杖", "🪄"], ["精钢匕首", "🔪"], ["猎弓", "🏹"]],
    blue: [["秘银弯刀", "⚔️"], ["符文之杖", "🪄"], ["暗影短剑", "🗡️"], ["精灵长弓", "🏹"]],
    purple: [["龙牙巨剑", "⚔️"], ["虚空权杖", "🔮"], ["噬魂之刃", "🗡️"], ["星陨弓", "🏹"]],
    orange: [["天罚圣剑", "⚔️"], ["诸神之杖", "🔮"], ["弑神者", "🗡️"], ["灭世弓", "🏹"]],
    red: [["终焉神剑", "⚔️"], ["万象法杖", "🪄"], ["血狱断罪", "🗡️"], ["天劫神弓", "🏹"]]
  },
  helmet: {
    white: [["皮帽", "🧢"], ["铁盔", "🪖"], ["布巾", "👒"]],
    green: [["锁甲头盔", "🪖"], ["猎人皮帽", "🧢"], ["法师兜帽", "🎩"]],
    blue: [["秘银头冠", "👑"], ["暗影兜帽", "🎩"], ["狮鹫盔", "🪖"]],
    purple: [["龙鳞战盔", "🪖"], ["贤者之冠", "👑"], ["暗夜面甲", "🎭"]],
    orange: [["王者之冠", "👑"], ["不灭头盔", "🪖"], ["凤羽冠", "👑"]],
    red: [["赤霄神冠", "👑"], ["不朽战盔", "🪖"], ["天命面甲", "🎭"]]
  },
  chest: {
    white: [["粗布衣", "👕"], ["皮甲", "🦺"], ["铁胸甲", "🛡️"]],
    green: [["锁子甲", "🦺"], ["猎人皮甲", "🧥"], ["法师长袍", "👘"]],
    blue: [["秘银铠甲", "🛡️"], ["暗影披风", "🧥"], ["符文法袍", "👘"]],
    purple: [["龙鳞铠", "🛡️"], ["虚空斗篷", "🧥"], ["大贤者之袍", "👘"]],
    orange: [["神圣铠甲", "🛡️"], ["天神战袍", "🧥"], ["不朽之铠", "🛡️"]],
    red: [["赤霄神铠", "🛡️"], ["天命战袍", "🥋"], ["永劫法袍", "👘"]]
  },
  amulet: {
    white: [["石头坠子", "📿"], ["木制挂坠", "🪬"], ["铜铃铛", "🔔"]],
    green: [["翡翠挂坠", "📿"], ["祈福护符", "🪬"], ["银十字架", "✝️"]],
    blue: [["月光宝石", "🌙"], ["符文护符", "🪬"], ["星光坠", "⭐"]],
    purple: [["龙心坠", "💎"], ["虚空之眼", "🔮"], ["凤凰羽坠", "🪶"]],
    orange: [["神谕之心", "💎"], ["永恒之泪", "💧"], ["创世挂坠", "🌟"]],
    red: [["万象之瞳", "🪄"], ["天命神核", "💎"], ["赤霄神坠", "✨"]]
  },
  ring: {
    white: [["铜戒", "💍"], ["铁指环", "⭕"], ["骨戒", "🦴"]],
    green: [["银戒", "💍"], ["翡翠指环", "💚"], ["猎手指环", "🎯"]],
    blue: [["秘银指环", "💍"], ["蓝宝石戒", "💙"], ["雷鸣戒", "⚡"]],
    purple: [["龙纹戒", "💍"], ["虚空指环", "🔮"], ["命运之环", "♾️"]],
    orange: [["至尊魔戒", "💍"], ["诸神指环", "🌟"], ["永恒之环", "♾️"]],
    red: [["终焉指环", "💍"], ["天命神戒", "✨"], ["诸界之环", "☸️"]]
  }
};
DATA.equipBaseStats = {
  weapon: [{ stat: "atk", name: "攻击", min: 5, max: 10 }, { stat: "matk", name: "法强", min: 5, max: 10 }],
  helmet: [{ stat: "hp", name: "生命", min: 12, max: 25 }, { stat: "def", name: "防御", min: 2, max: 5 }],
  chest: [{ stat: "hp", name: "生命", min: 18, max: 35 }, { stat: "def", name: "防御", min: 3, max: 7 }],
  amulet: [{ stat: "atk", name: "攻击", min: 3, max: 6 }, { stat: "matk", name: "法强", min: 3, max: 6 }, { stat: "energyRegen", name: "能量回复", min: 1, max: 3 }, { stat: "hpRegen", name: "生命恢复", min: 3, max: 8 }],
  ring: [{ stat: "crit", name: "暴击", min: 2, max: 5 }, { stat: "critDmg", name: "暴伤", min: 5, max: 12 }]
};
DATA.statAffixes = [
  { id: "af_atk", name: "攻击", stat: "atk", min: 3, max: 12 },
  { id: "af_matk", name: "法强", stat: "matk", min: 3, max: 12 },
  { id: "af_hp", name: "生命", stat: "hp", min: 15, max: 55 },
  { id: "af_def", name: "防御", stat: "def", min: 3, max: 9 },
  { id: "af_crit", name: "暴击", stat: "crit", min: 3, max: 7 },
  { id: "af_critdmg", name: "暴伤", stat: "critDmg", min: 8, max: 20 },
  { id: "af_energy", name: "能量回复", stat: "energyRegen", min: 1, max: 3 },
  { id: "af_hpregen", name: "生命恢复", stat: "hpRegen", min: 3, max: 10 },
  { id: "af_status_res", name: "状态抗性", stat: "statusRes", min: 5, max: 15 }
];
DATA.mechAffixes = [
  { id: "mx_double_cast", name: "双重施法", desc: "技能有15%概率免费再次施放" },
  { id: "mx_combo_stack", name: "连击叠层", desc: "普攻命中+1层连击，每层+2%暴击，最多10层" },
  { id: "mx_shield_proc", name: "被动护盾", desc: "受击20%概率获得0.75倍防御护盾" },
  { id: "mx_lifesteal", name: "生命窃取", desc: "造成伤害回复8%生命" },
  { id: "mx_crit_burst", name: "暴击爆裂", desc: "每次行动首次暴击时，额外造成目标当前HP3%伤害" },
  { id: "mx_burn_spread", name: "灼烧蔓延", desc: "灼烧伤害有20%概率扩散到其他敌人" },
  { id: "mx_energy_on_kill", name: "击杀回能", desc: "击杀敌人恢复15能量" },
  { id: "mx_dodge_counter", name: "闪避反击", desc: "闪避攻击后自动反击80%伤害" }
];
DATA.sets = [
  { id: "set_iron_wall", name: "铁壁套装", classReq: "warrior", slots: ["helmet", "chest"], bonus2: { desc: "盾击必定眩晕小怪", passive: "stun_guarantee_minion" } },
  { id: "set_berserker", name: "狂战士套装", classReq: "warrior", slots: ["weapon", "ring"], bonus2: { desc: "反击追加40%攻击真伤，吸血10%", passive: "counter_lifesteal" } },
  { id: "set_arcane", name: "奥术套装", classReq: "mage", slots: ["weapon", "amulet"], bonus2: { desc: "法力护盾强度+50%", passive: "mana_shield_boost" } },
  { id: "set_inferno", name: "地狱火套装", classReq: "mage", slots: ["helmet", "ring"], bonus2: { desc: "灼烧伤害+40%", passive: "burn_boost" } },
  { id: "set_wind", name: "疾风套装", classReq: "ranger", slots: ["weapon", "chest"], bonus2: { desc: "连射次数+1", passive: "rapid_extra" } },
  { id: "set_venom", name: "鹰眼套装", classReq: "ranger", slots: ["amulet", "ring"], bonus2: { desc: "攻击猎杀标记目标时额外无视15%防御", passive: "poison_boost" } },
  { id: "set_dawn", name: "黎明套装", classReq: "priest", slots: ["weapon", "helmet"], bonus2: { desc: "治疗暴击率+25%", passive: "heal_crit_boost" } },
  { id: "set_devotion", name: "虔诚套装", classReq: "priest", slots: ["chest", "amulet"], bonus2: { desc: "祝福效果持续+1回合", passive: "bless_extend" } },
  { id: "set_shadow", name: "暗影套装", classReq: "assassin", slots: ["weapon", "ring"], bonus2: { desc: "暴击伤害+35%", passive: "shadow_crit" } },
  { id: "set_nightblade", name: "夜刺套装", classReq: "assassin", slots: ["amulet", "chest"], bonus2: { desc: "攻击后15%概率获得1回合25%闪避", passive: "nightblade_stealth" } },
  { id: "set_bloodthirst", name: "嗜血套装", classReq: "vampire", slots: ["weapon", "ring"], bonus2: { desc: "吸血效果+15%", passive: "bloodthirst_boost" } },
  { id: "set_nightfall", name: "暗夜套装", classReq: "vampire", slots: ["amulet", "chest"], bonus2: { desc: "伤害减免+15%", passive: "nightfall_dmg_reduce" } },
  { id: "set_wildgrowth", name: "野性套装", classReq: "druid", slots: ["weapon", "ring"], bonus2: { desc: "多个变身形态可共存（切换仍触发形态效果）", passive: "wildgrowth_extend" } },
  { id: "set_thornvine", name: "荆蔓套装", classReq: "druid", slots: ["amulet", "chest"], bonus2: { desc: "荆棘反弹伤害+50%", passive: "thornvine_thorns" } },
  { id: "set_clockwork", name: "机巧套装", classReq: "puppeteer", slots: ["weapon", "amulet"], bonus2: { desc: "傀儡攻击指令伤害+15%", passive: "puppet_command_amp" } },
  { id: "set_threadguard", name: "护线套装", classReq: "puppeteer", slots: ["helmet", "chest"], bonus2: { desc: "傀儡最大生命+20%，修复效果+20%", passive: "puppet_guardian_set" } }
];
DATA.items = {
  heal_potion: { id: "heal_potion", name: "恢复药水", icon: "🧪", desc: "恢复40%最大生命值", type: "heal", shopPrice: 30, dropWeight: 30 },
  energy_potion: { id: "energy_potion", name: "能量药剂", icon: "⚡", desc: "恢复50点能量", type: "energy", shopPrice: 35, dropWeight: 25 },
  shield_scroll: { id: "shield_scroll", name: "护盾卷轴", icon: "📜", desc: "获得30%最大生命值护盾", type: "shield", shopPrice: 45, dropWeight: 18 },
  bomb: { id: "bomb", name: "爆裂弹", icon: "💣", desc: "对全体敌人造成最大生命百分比伤害", type: "damage", shopPrice: 55, dropWeight: 15 },
  cleanse_potion: { id: "cleanse_potion", name: "净化药水", icon: "✨", desc: "移除自身所有减益效果", type: "cleanse", shopPrice: 35, dropWeight: 15 },
  rage_potion: { id: "rage_potion", name: "狂暴药剂", icon: "🔥", desc: "3回合内伤害+30%", type: "buff", shopPrice: 65, dropWeight: 10 },
  group_heal: { id: "group_heal", name: "群疗卷轴", icon: "💚", desc: "全体队友恢复20%最大生命值", type: "heal_all", shopPrice: 80, dropWeight: 8 },
  hourglass: { id: "hourglass", name: "时停沙漏", icon: "⏳", desc: "令全体敌人眩晕1回合", type: "control", shopPrice: 95, dropWeight: 5 }
};
DATA.growthTree = [
  { id: "g_hp", name: "生命强化", desc: "每级额外+10生命", cost: 2, maxLv: 20, perLv: { hp: 10 }, category: "基础" },
  { id: "g_atk", name: "力量强化", desc: "每级额外+3攻击", cost: 2, maxLv: 20, perLv: { atk: 3 }, category: "基础" },
  { id: "g_matk", name: "智力强化", desc: "每级额外+3法术强度", cost: 2, maxLv: 20, perLv: { matk: 3 }, category: "基础" },
  { id: "g_def", name: "防御强化", desc: "每级额外+1防御", cost: 2, maxLv: 20, perLv: { def: 1 }, category: "基础" },
  { id: "g_mythic_w", name: "稀有天赋概率", desc: "提升高稀有度天赋出现概率", cost: 5, maxLv: 20, perLv: { rareBonus: 1 }, category: "天赋" },
  { id: "g_pity", name: "保底加速", desc: "减少神话保底所需轮数", cost: 25, maxLv: 5, perLv: { pityReduction: 1 }, category: "天赋" },
  { id: "g_enhance", name: "强化上限", desc: "装备强化上限+1", cost: 3, maxLv: 10, perLv: { enhanceMax: 1 }, category: "锻造" },
  { id: "g_init_sp", name: "技能天赋", desc: "每级初始技能点+1", cost: 10, maxLv: 10, perLv: { initSP: 1 }, category: "基础" }
];
const GAME_MODES = Object.freeze([
  { id: "normal", name: "普通", icon: "🏰", difficulty: 1, endFloor: 50, desc: "敌军强度 x1.0 · 通关第50层" },
  { id: "adventure", name: "冒险", icon: "🧭", difficulty: 1.3, endFloor: 100, desc: "敌军强度 x1.3 · 通关第100层" },
  { id: "hero", name: "勇士", icon: "⚔️", difficulty: 1.6, endFloor: 150, desc: "敌军强度 x1.6 · 通关第150层" },
  { id: "king", name: "王者", icon: "👑", difficulty: 2, endFloor: 200, desc: "敌军强度 x2.0 · 通关第200层" },
  { id: "endless", name: "无尽", icon: "♾️", difficulty: 2, endFloor: null, desc: "敌军强度 x2.0 · 无尽推进" },
  { id: "climb", name: "攀登", icon: "⛰️", difficulty: 2.1, endFloor: 100, desc: "固定100层 · 通关后逐级解锁 Lv.1–Lv.50" }
]);
const GAME_MODE_BY_ID = Object.freeze(Object.fromEntries(GAME_MODES.map((mode) => [mode.id, mode])));
const CLIMB_MIN_LEVEL = 1;
const CLIMB_MAX_LEVEL = 50;
const CLIMB_BASE_MULTIPLIER = 2;
const CLIMB_ENEMY_SCALAR_PER_LEVEL = 0.1;
const CLIMB_TALENT_POINT_BONUS_PER_LEVEL = 0.1;
const CLIMB_DIFFICULTIES = Object.freeze([
  { level: 1, name: "起步", desc: "无额外机制。", effects: {} },
  { level: 2, name: "生机强化", desc: "所有敌军最大生命额外 +5%。", effects: { enemyHpPct: 0.05 } },
  { level: 3, name: "锐刃强化", desc: "所有敌军攻击与法强额外 +5%。", effects: { enemyAtkPct: 0.05 } },
  { level: 4, name: "铁壁强化", desc: "所有敌军防御额外 +5%。", effects: { enemyDefPct: 0.05 } },
  { level: 5, name: "抗性训练", desc: "所有敌军状态抗性 +10。", effects: { enemyStatusResFlat: 10 } },
  { level: 6, name: "护阵初成", desc: "所有敌军开战时获得5%最大生命护盾。", effects: { enemyStartShieldPct: 0.05 } },
  { level: 7, name: "精英血脉", desc: "精英敌军最大生命额外 +10%。", effects: { eliteHpPct: 0.1 } },
  { level: 8, name: "精英威压", desc: "精英敌军攻击与法强额外 +10%。", effects: { eliteAtkPct: 0.1 } },
  { level: 9, name: "精英壁垒", desc: "精英敌军开战时额外获得10%最大生命护盾。", effects: { eliteStartShieldPct: 0.1 } },
  { level: 10, name: "群落异化", desc: "普通敌军额外获得1条被动词缀。", effects: { normalExtraAffixes: 1 } },
  { level: 11, name: "巨兽之躯", desc: "Boss 最大生命额外 +15%。", effects: { bossHpPct: 0.15 } },
  { level: 12, name: "君王之怒", desc: "Boss 攻击与法强额外 +15%。", effects: { bossAtkPct: 0.15 } },
  { level: 13, name: "王者护阵", desc: "Boss 开战时额外获得10%最大生命护盾。", effects: { bossStartShieldPct: 0.1 } },
  { level: 14, name: "物资高价", desc: "行商道具价格 +10%。", effects: { shopPricePct: 0.1 } },
  { level: 15, name: "资源紧缩", desc: "所有战斗金币奖励 -10%。", effects: { battleGoldPenaltyPct: 0.1 } },
  { level: 16, name: "枯竭之伤", desc: "战斗内所有友方受到的治疗 -10%。", effects: { allyHealingPenaltyPct: 0.1 } },
  { level: 17, name: "先声夺人", desc: "每场战斗前3回合，敌军造成伤害 +10%。", effects: { enemyOpeningDamagePct: 0.1 } },
  { level: 18, name: "王者循环", desc: "Boss 每3回合获得8%最大生命护盾。", effects: { bossCycleShieldPct: 0.08 } },
  { level: 19, name: "群落再变", desc: "普通敌军再额外获得1条被动词缀。", effects: { normalExtraAffixes: 1 } },
  { level: 20, name: "精英异化", desc: "精英敌军额外获得1条被动词缀。", effects: { eliteExtraAffixes: 1 } },
  { level: 21, name: "王者异化", desc: "Boss 额外获得1条被动词缀。", effects: { bossExtraAffixes: 1 } },
  { level: 22, name: "抗性进阶", desc: "所有敌军状态抗性再 +10。", effects: { enemyStatusResFlat: 10 } },
  { level: 23, name: "护阵进阶", desc: "所有敌军开战护盾再 +5%最大生命。", effects: { enemyStartShieldPct: 0.05 } },
  { level: 24, name: "商路封锁", desc: "行商道具价格再 +10%。", effects: { shopPricePct: 0.1 } },
  { level: 25, name: "战利削减", desc: "所有战斗金币奖励再 -10%。", effects: { battleGoldPenaltyPct: 0.1 } },
  { level: 26, name: "治疗抑制", desc: "战斗内所有友方受到的治疗再 -5%。", effects: { allyHealingPenaltyPct: 0.05 } },
  { level: 27, name: "开场威压", desc: "每场战斗前3回合，敌军造成伤害再 +5%。", effects: { enemyOpeningDamagePct: 0.05 } },
  { level: 28, name: "精英重甲", desc: "精英敌军开战护盾再 +10%最大生命。", effects: { eliteStartShieldPct: 0.1 } },
  { level: 29, name: "王者重甲", desc: "Boss 开战护盾再 +15%最大生命。", effects: { bossStartShieldPct: 0.15 } },
  { level: 30, name: "精英再生", desc: "精英敌军行动前恢复2%最大生命。", effects: { eliteRegenPct: 0.02 } },
  { level: 31, name: "残血狂怒", desc: "敌军生命低于50%时，造成伤害 +10%。", effects: { enemyLowHpDamagePct: 0.1 } },
  { level: 32, name: "处决威压", desc: "敌军攻击生命低于35%的友方时，造成伤害 +10%。", effects: { enemyExecuteDamagePct: 0.1 } },
  { level: 33, name: "开场坚守", desc: "每场战斗前3回合，敌军受到伤害 -10%。", effects: { enemyOpeningDamageReductionPct: 0.1 } },
  { level: 34, name: "精英永续", desc: "精英敌军行动前恢复的最大生命再 +1%。", effects: { eliteRegenPct: 0.01 } },
  { level: 35, name: "王者轮转", desc: "Boss 每3回合获得的护盾再 +4%最大生命。", effects: { bossCycleShieldPct: 0.04 } },
  { level: 36, name: "群落终变", desc: "普通敌军再额外获得1条被动词缀。", effects: { normalExtraAffixes: 1 } },
  { level: 37, name: "精英终变", desc: "精英敌军再额外获得1条被动词缀。", effects: { eliteExtraAffixes: 1 } },
  { level: 38, name: "王者终变", desc: "Boss 再额外获得1条被动词缀。", effects: { bossExtraAffixes: 1 } },
  { level: 39, name: "狂怒进阶", desc: "敌军生命低于50%时，造成伤害再 +10%。", effects: { enemyLowHpDamagePct: 0.1 } },
  { level: 40, name: "处决进阶", desc: "敌军攻击生命低于35%的友方时，造成伤害再 +10%。", effects: { enemyExecuteDamagePct: 0.1 } },
  { level: 41, name: "坚守进阶", desc: "每场战斗前3回合，敌军受到伤害再 -10%。", effects: { enemyOpeningDamageReductionPct: 0.1 } },
  { level: 42, name: "护阵终式", desc: "所有敌军开战护盾再 +5%最大生命。", effects: { enemyStartShieldPct: 0.05 } },
  { level: 43, name: "精英堡垒", desc: "精英敌军开战护盾再 +10%最大生命。", effects: { eliteStartShieldPct: 0.1 } },
  { level: 44, name: "王者堡垒", desc: "Boss 开战护盾再 +10%最大生命。", effects: { bossStartShieldPct: 0.1 } },
  { level: 45, name: "商路断绝", desc: "行商道具价格再 +10%。", effects: { shopPricePct: 0.1 } },
  { level: 46, name: "战利匮乏", desc: "所有战斗金币奖励再 -5%。", effects: { battleGoldPenaltyPct: 0.05 } },
  { level: 47, name: "王者再生", desc: "Boss 行动前恢复2%最大生命。", effects: { bossRegenPct: 0.02 } },
  { level: 48, name: "王者永续", desc: "Boss 每3回合获得的护盾再 +3%最大生命。", effects: { bossCycleShieldPct: 0.03 } },
  { level: 49, name: "终局护城", desc: "第100层Boss开战时额外获得25%最大生命护盾。", effects: { finalBossStartShieldPct: 0.25 } },
  { level: 50, name: "双王终局", desc: "第100层变为双Boss战，终局Boss攻击与法强额外 +20%。", effects: { finalDoubleBoss: true, finalBossAtkPct: 0.2 } }
]);
const DUAL_HERO_MODE_VISIBLE = false;
const SAVE_CLASS_IDS = /* @__PURE__ */ new Set([
  ...Object.keys(DATA.classes),
  "berserker",
  "paladin",
  "archmage_adv",
  "chronomancer",
  "shadowblade_adv",
  "beastmaster",
  "archbishop",
  "inquisitor",
  "phantomblade",
  "venomancer",
  "bloodlord_adv",
  "nightstalker",
  "nature_guardian",
  "primal_beast",
  "iron_machinist",
  "soul_weaver",
  "doombringer",
  "templar_guardian",
  "elemental_overlord",
  "time_lord",
  "shadow_hunter_king",
  "beast_king",
  "formless_blade_saint",
  "calamity_poison_king",
  "holy_pope",
  "divine_judge",
  "blood_progenitor",
  "eternal_night_king",
  "world_tree_guardian",
  "ancient_beast_god",
  "clockwork_bastion",
  "puppet_emperor"
]);
const state = {
  screen: "menu",
  setup: { mode: "normal", classId: "warrior", secondClassId: "mage", climbLevel: CLIMB_MIN_LEVEL },
  activeMode: "normal",
  cityModeId: "normal",
  climbSelection: CLIMB_MIN_LEVEL,
  draft: null,
  run: null,
  floorEvents: [],
  eventIdx: 0,
  eventResult: null,
  shopOpen: false,
  pendingEquip: null,
  reincarnationResult: null,
  combat: null,
  modal: null,
  toast: "",
  pendingSkill: null,
  combatCheckpoint: null,
  audioEnabled: true,
  privacyConsent: loadPrivacyConsent(),
  perm: loadPermanent()
};
state.audioEnabled = state.perm.musicEnabled !== false;
if (saveSystemNotice) state.toast = saveSystemNotice;
let pendingEquipResolve = null;
const BOSS_STORY_INTERVAL = 10;
const BOSS_STORY_ENDLESS_FLOOR = 200;
const BOSS_STORY_ENDLESS_FIRE_STAT_PCT = 0.01;
const BOSS_STORY_ENDLESS_CORE_STAT_PCT = 0.01;
const BOSS_STORY_ENDLESS_RELIC_STAT_PCT = 0.01;
const BOSS_STORY_CHAPTERS = Object.freeze([
  {
    maxFloor: 50,
    arc: "初燃神火",
    guardian: "石甲守卫",
    beats: [
      "石甲守卫放下长戟，胸前熄灭多年的火纹亮了一下：“别紧张，我不是要再打一次，只是终于能说话了。”",
      "守卫指向塔壁上逐一点亮的火盏：“深渊裂隙入侵时，诸神把神性封进塔里。火还在，塔就还守得住。”",
      "一枚旧徽章从裂开的甲胄中掉下。背面刻着一句很朴素的话：‘看见火，就知道有人还在守。’",
      "守卫看了看你身后的楼梯：“上面还有不少老同事。脾气不一定好，但大多只是被裂隙困住了。”",
      "第一盏神火重新燃起。守卫轻声说：“好，永恒之塔又能照亮一点路了。”"
    ]
  },
  {
    maxFloor: 100,
    arc: "守塔者的遗志",
    guardian: "旧日骑士",
    beats: [
      "旧日骑士摘下破损头盔，先确认了你没受重伤，才放心地叹气：“守塔的人习惯先看别人。”",
      "他告诉你，永恒之塔原本是守卫人间的堡垒；裂隙降临后，守卫们选择留在塔内拖住污染。",
      "骑士把佩剑横在膝前，像是在交代值班表：“我们没等到援军，不过等到了你，也算没白守。”",
      "塔壁上的旧壁画露出原貌：凡人与守卫并肩封住裂隙，画角还留着孩子画的小太阳。",
      "骑士向你行礼：“往上走吧。你不是替我们报仇，是替所有人把门重新关上。”"
    ]
  },
  {
    maxFloor: 150,
    arc: "裂隙之影",
    guardian: "神核观测者",
    beats: [
      "观测者从破碎的法阵里醒来，第一句话是：“检测结果：你比裂隙更难缠。恭喜，这是好事。”",
      "他摊开记录卷轴：污染并非从塔外闯入，而是顺着受损的神核一路爬向更高处。",
      "你终于看清裂隙的目标——它想借永恒之塔的力量撕开人间与深渊之间的门。",
      "观测者把最后一枚校准符交给你：“核心还没完全失守。别让它把‘永恒’误解成‘永远加班’。”",
      "法阵重新稳定下来，通往塔心的道路显现。裂隙的阴影，已经在上层等着你。"
    ]
  },
  {
    maxFloor: 200,
    arc: "守界之誓",
    guardian: "终焉守界者",
    beats: [
      "终焉守界者从污染中恢复片刻清醒：“我守了太久，连敌人和来客都快分不清了。幸好你打得很有礼貌。”",
      "他承认，主封印已经裂开；再往前一步，便是永恒之塔最初的职责：替人间挡住深渊。",
      "守界者把残缺的印记交到你手中：“封印不会自己修好。有人愿意站在这里，它才叫守护。”",
      "塔心的神火与裂隙彼此拉扯。守界者望向你：“这一战之后，你可以离开，也可以继续守望。”",
      "主封印重获光芒。永恒之塔不再只是战场，而成为一座仍有人愿意点灯的塔。"
    ]
  }
]);
function permanentDefaults() {
  return {
    bestFloor: 0,
    bestClassId: "",
    classBestFloor: {},
    modeBestFloors: {},
    climbMaxUnlocked: CLIMB_MIN_LEVEL,
    climbBestFloors: {},
    climbClearedLevels: {},
    hardcoreBestFloor: 0,
    dualHeroBestFloor: 0,
    totalRuns: 0,
    talentPoints: 0,
    growthLevels: {},
    pityCounter: 0,
    unlockedTalents: {},
    talentEnhanceLevels: {},
    musicVolume: 50,
    musicEnabled: true,
    autoSelectTarget: true,
    autoSelectMercEquipment: true,
    quickSelect: {
      equip: "manual",
      itemShop: "normal",
      tavern: "manual",
      bossStory: "smart",
      events: {}
    }
  };
}
function normalizeRunSaveMode(mode) {
  return GAME_MODE_BY_ID[mode] ? mode : "normal";
}
function modeOfRun(run) {
  return normalizeRunSaveMode(run == null ? void 0 : run.mode);
}
function gameMode(mode) {
  return GAME_MODE_BY_ID[normalizeRunSaveMode(mode)] || GAME_MODE_BY_ID.normal;
}
function visibleGameModes() {
  return GAME_MODES;
}
function modeBestFloor(mode, perm = state.perm) {
  var _a;
  return Math.max(0, Math.floor(((_a = perm == null ? void 0 : perm.modeBestFloors) == null ? void 0 : _a[normalizeRunSaveMode(mode)]) || 0));
}
function normalizeClimbLevel(level, max = CLIMB_MAX_LEVEL) {
  const numeric = Number(level);
  const normalizedMax = Math.max(CLIMB_MIN_LEVEL, Math.min(CLIMB_MAX_LEVEL, Math.floor(Number(max) || CLIMB_MAX_LEVEL)));
  return Math.max(CLIMB_MIN_LEVEL, Math.min(normalizedMax, Math.floor(Number.isFinite(numeric) ? numeric : CLIMB_MIN_LEVEL)));
}
function climbUnlockedLevel(perm = state.perm) {
  return normalizeClimbLevel((perm == null ? void 0 : perm.climbMaxUnlocked) || CLIMB_MIN_LEVEL);
}
function climbDifficulty(level) {
  return CLIMB_DIFFICULTIES[normalizeClimbLevel(level) - CLIMB_MIN_LEVEL] || CLIMB_DIFFICULTIES[0];
}
function climbLevelOfRun(run = state.run) {
  return modeOfRun(run) === "climb" ? normalizeClimbLevel((run == null ? void 0 : run.climbLevel) || CLIMB_MIN_LEVEL) : 0;
}
function isClimbRun(run = state.run) {
  return modeOfRun(run) === "climb";
}
function climbEnemyBaseMultiplier(level) {
  return Number((CLIMB_BASE_MULTIPLIER + normalizeClimbLevel(level) * CLIMB_ENEMY_SCALAR_PER_LEVEL).toFixed(3));
}
function climbTalentPointMultiplier(level) {
  return Number((CLIMB_BASE_MULTIPLIER + normalizeClimbLevel(level) * CLIMB_TALENT_POINT_BONUS_PER_LEVEL).toFixed(3));
}
function climbEffects(runOrLevel = state.run) {
  if (typeof runOrLevel !== "number" && !isClimbRun(runOrLevel)) return {};
  const level = typeof runOrLevel === "number" ? normalizeClimbLevel(runOrLevel) : climbLevelOfRun(runOrLevel);
  const totals = {};
  for (const difficulty of CLIMB_DIFFICULTIES.filter((entry) => entry.level <= level)) {
    for (const [key, value] of Object.entries(difficulty.effects || {})) {
      totals[key] = typeof value === "boolean" ? !!(totals[key] || value) : (Number(totals[key]) || 0) + (Number(value) || 0);
    }
  }
  return totals;
}
function climbBestFloor(level, perm = state.perm) {
  var _a;
  return Math.max(0, Math.floor(((_a = perm == null ? void 0 : perm.climbBestFloors) == null ? void 0 : _a[normalizeClimbLevel(level)]) || 0));
}
function climbLevelCleared(level, perm = state.perm) {
  var _a;
  return !!((_a = perm == null ? void 0 : perm.climbClearedLevels) == null ? void 0 : _a[normalizeClimbLevel(level)]);
}
function classBestFloor(classId, perm = state.perm) {
  var _a;
  const baseClassId = getBaseClassId(classId || "warrior");
  return Math.max(0, Math.floor(((_a = perm == null ? void 0 : perm.classBestFloor) == null ? void 0 : _a[baseClassId]) || 0));
}
function recordClassBestFloor(classId, floor, perm = state.perm) {
  const baseClassId = getBaseClassId(classId || "warrior");
  const normalizedFloor = Math.max(0, Math.floor(Number(floor) || 0));
  perm.classBestFloor || (perm.classBestFloor = {});
  perm.classBestFloor[baseClassId] = Math.max(classBestFloor(baseClassId, perm), normalizedFloor);
  return perm.classBestFloor[baseClassId];
}
function runDifficultyMultiplier(run = state.run) {
  const stored = Number(run == null ? void 0 : run.difficultyMultiplier);
  return Number.isFinite(stored) && stored > 0 ? stored : gameMode(modeOfRun(run)).difficulty;
}
function runTalentPointMultiplier(run = state.run) {
  const stored = Number(run == null ? void 0 : run.talentPointMultiplier);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return isClimbRun(run) ? climbTalentPointMultiplier(climbLevelOfRun(run)) : runDifficultyMultiplier(run);
}
function runEndFloor(run = state.run) {
  const stored = Number(run == null ? void 0 : run.endFloor);
  if (Number.isFinite(stored) && stored > 0) return Math.floor(stored);
  return gameMode(modeOfRun(run)).endFloor;
}
function isCampaignComplete(run = state.run) {
  const endFloor = runEndFloor(run);
  return Number.isFinite(endFloor) && ((run == null ? void 0 : run.floor) || 0) >= endFloor;
}
function syncRunModeState(run) {
  if (!run) return null;
  const mode = run.mode;
  if (mode === "climb") {
    run.climbLevel = normalizeClimbLevel(run.climbLevel || CLIMB_MIN_LEVEL);
    run.difficultyMultiplier = climbEnemyBaseMultiplier(run.climbLevel);
    run.talentPointMultiplier = climbTalentPointMultiplier(run.climbLevel);
    run.endFloor = 100;
  } else {
    run.difficultyMultiplier = gameMode(mode).difficulty;
    run.talentPointMultiplier = gameMode(mode).difficulty;
    run.endFloor = gameMode(mode).endFloor;
  }
  return run;
}
function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isFiniteNumber(value, min = -Infinity) {
  return Number.isFinite(value) && value >= min;
}
function isValidPermanentSave(perm) {
  if (!isPlainObject(perm)) return false;
  for (const key of ["bestFloor", "hardcoreBestFloor", "dualHeroBestFloor", "totalRuns", "talentPoints", "pityCounter", "musicVolume", "climbMaxUnlocked"]) {
    if (perm[key] !== void 0 && !isFiniteNumber(perm[key], 0)) return false;
  }
  for (const key of ["classBestFloor", "modeBestFloors", "climbBestFloors", "climbClearedLevels", "growthLevels", "unlockedTalents", "talentEnhanceLevels", "quickSelect"]) {
    if (perm[key] !== void 0 && !isPlainObject(perm[key])) return false;
  }
  return true;
}
function isValidRunSave(run) {
  if (!isPlainObject(run) || !GAME_MODE_BY_ID[run.mode]) return false;
  if (run.mode === "climb" && (!Number.isInteger(run.climbLevel) || run.climbLevel < 0 || run.climbLevel > CLIMB_MAX_LEVEL)) return false;
  if (!SAVE_CLASS_IDS.has(run.classId) || !Number.isInteger(run.floor) || run.floor < 1) return false;
  for (const key of ["gold", "level", "exp", "skillPoints"]) {
    if (!isFiniteNumber(run[key], 0)) return false;
  }
  if (!Array.isArray(run.party) || !run.party.length || !run.party.some((member) => (member == null ? void 0 : member.isPlayer) === true)) return false;
  const unitIds = /* @__PURE__ */ new Set();
  for (const member of run.party) {
    if (!isPlainObject(member) || typeof member.unitId !== "string" || !member.unitId || unitIds.has(member.unitId)) return false;
    if (!SAVE_CLASS_IDS.has(member.classId)) return false;
    if (member.mercData !== void 0 && !isPlainObject(member.mercData)) return false;
    unitIds.add(member.unitId);
  }
  for (const key of ["currentHp", "currentEnergy", "equipment", "enhanceLevels", "items", "buffs", "eventBonuses", "hiddenStacks"]) {
    if (!isPlainObject(run[key])) return false;
  }
  for (const unitId of unitIds) {
    if (!isFiniteNumber(run.currentHp[unitId], 0) || !isFiniteNumber(run.currentEnergy[unitId], 0)) return false;
  }
  if (!Array.isArray(run.talents) || !Array.isArray(run.log) || typeof run.alive !== "boolean") return false;
  if (run.pendingBattle !== void 0) {
    if (!isPlainObject(run.pendingBattle) || !["normal", "elite", "boss"].includes(run.pendingBattle.kind)) return false;
    if (run.pendingBattle.encounter !== void 0 && !isPlainObject(run.pendingBattle.encounter)) return false;
  }
  return true;
}
function isValidRunSnapshot(snapshot) {
  if (!isPlainObject(snapshot) || !isValidRunSave(snapshot.run)) return false;
  if (!Array.isArray(snapshot.floorEvents) || !Number.isInteger(snapshot.eventIdx) || snapshot.eventIdx < 0) return false;
  if (snapshot.eventResult !== null && !isPlainObject(snapshot.eventResult)) return false;
  return typeof snapshot.shopOpen === "boolean";
}
function runSaveSlotKey(mode) {
  return normalizeRunSaveMode(mode) === "climb" ? "climb" : "adventure";
}
function emptyRunSaveSlots() {
  return { adventure: null, climb: null };
}
function cloneRunSaveSlots(payload = null) {
  const stored = (payload == null ? void 0 : payload.runs) || emptyRunSaveSlots();
  return {
    adventure: cloneSaveData(stored == null ? void 0 : stored.adventure) || null,
    climb: cloneSaveData(stored == null ? void 0 : stored.climb) || null
  };
}
function isCurrentSavePayload(payload) {
  if (!isPlainObject(payload)) return false;
  if (payload.version !== SAVE_SCHEMA_VERSION) return false;
  if (!isValidPermanentSave(payload.perm)) return false;
  if (!GAME_MODE_BY_ID[payload.activeMode]) return false;
  if (payload.revision !== void 0 && (!Number.isInteger(payload.revision) || payload.revision < 0)) return false;
  if (!isPlainObject(payload.runs) || "run" in payload || "runSlots" in payload) return false;
  if (!("adventure" in payload.runs) || !("climb" in payload.runs)) return false;
  const adventure = payload.runs.adventure;
  const climb = payload.runs.climb;
  if (adventure !== null && (!isValidRunSnapshot(adventure) || modeOfRun(adventure.run) === "climb")) return false;
  if (climb !== null && (!isValidRunSnapshot(climb) || modeOfRun(climb.run) !== "climb")) return false;
  return true;
}
function migrateSavePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  let version = Number(payload.version);
  if (!Number.isInteger(version) || version < FIRST_SUPPORTED_SAVE_SCHEMA_VERSION || version > SAVE_SCHEMA_VERSION) return null;
  let migrated = payload;
  while (version < SAVE_SCHEMA_VERSION) {
    const migrate = SAVE_MIGRATIONS[version];
    if (typeof migrate !== "function") return null;
    const next = migrate(migrated);
    if (!next || typeof next !== "object" || next.version !== version + 1) return null;
    migrated = next;
    version += 1;
  }
  return isCurrentSavePayload(migrated) ? migrated : null;
}
function parseSaveCandidate(key, priority) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const source = JSON.parse(raw);
    const payload = migrateSavePayload(source);
    if (!payload) return null;
    return {
      key,
      payload,
      serialized: JSON.stringify(payload),
      sourceSerialized: raw,
      needsRewrite: source.version !== payload.version,
      revision: Number.isInteger(payload.revision) ? payload.revision : 0,
      priority
    };
  } catch (e) {
    return null;
  }
}
function readSavePayload() {
  try {
    const keys = [STORAGE_KEY, STORAGE_STAGING_KEY, STORAGE_BACKUP_KEY];
    const hadStoredData = keys.some((key) => !!localStorage.getItem(key));
    const candidates = [
      parseSaveCandidate(STORAGE_KEY, 3),
      parseSaveCandidate(STORAGE_STAGING_KEY, 2),
      parseSaveCandidate(STORAGE_BACKUP_KEY, 1)
    ].filter(Boolean).sort((a, b) => b.revision - a.revision || b.priority - a.priority);
    const selected = candidates[0] || null;
    if (!selected) {
      if (hadStoredData) saveSystemNotice = "检测到存档损坏，且没有可恢复的备份，已使用新存档。";
      return null;
    }
    if (selected.key !== STORAGE_KEY || selected.needsRewrite) {
      if (selected.key !== STORAGE_KEY) {
        saveSystemNotice = selected.key === STORAGE_BACKUP_KEY ? "检测到主存档异常，已自动从备份恢复。" : "检测到上次保存未完成，已自动恢复进度。";
      }
      try {
        if (selected.key === STORAGE_KEY && selected.needsRewrite) {
          localStorage.setItem(STORAGE_BACKUP_KEY, selected.sourceSerialized);
        }
        localStorage.setItem(STORAGE_KEY, selected.serialized);
        if (selected.key === STORAGE_STAGING_KEY) localStorage.removeItem(STORAGE_STAGING_KEY);
      } catch (error) {
        console.warn("Recovered save could not replace the primary copy", error);
      }
    }
    return selected.payload;
  } catch (error) {
    console.warn("Save data is unavailable", error);
    return null;
  }
}
function getSavedRunSnapshot(mode = null) {
  const payload = readSavePayload();
  if (!(payload == null ? void 0 : payload.runs)) return null;
  if (mode != null) return payload.runs[runSaveSlotKey(mode)] || null;
  const preferred = payload.runs[runSaveSlotKey(payload.activeMode)];
  return preferred || payload.runs.adventure || payload.runs.climb || null;
}
function quickEventOptions() {
  return DATA.events.map((event) => ({
    id: event.id,
    icon: event.icon,
    name: event.name,
    options: (event.choices || []).map((choice) => ({ label: choice.text, result: choice.result }))
  }));
}
const ABILITY_STATS = PRIMARY_ATTRIBUTE_DEFS.map((def) => ({ ...def, percentPerPoint: 0.01 }));
function loadPermanent() {
  try {
    const parsed = readSavePayload();
    if (!parsed) return permanentDefaults();
    const incoming = parsed.perm;
    return mergeDeep(permanentDefaults(), incoming);
  } catch (e) {
    return permanentDefaults();
  }
}
function currentRunSnapshot() {
  if (!state.run) return null;
  return {
    run: state.run,
    floorEvents: state.floorEvents,
    eventIdx: state.eventIdx,
    eventResult: state.eventResult,
    shopOpen: state.shopOpen
  };
}
function cloneSaveData(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
function writeSavePayload(runs = null) {
  const previous = readSavePayload();
  const storedRuns = runs || cloneRunSaveSlots(previous);
  const activeMode = state.run ? modeOfRun(state.run) : GAME_MODE_BY_ID[state.activeMode] ? state.activeMode : "normal";
  const payload = {
    version: SAVE_SCHEMA_VERSION,
    revision: (Number.isInteger(previous == null ? void 0 : previous.revision) ? previous.revision : 0) + 1,
    savedAt: (/* @__PURE__ */ new Date()).toISOString(),
    perm: state.perm,
    activeMode,
    runs: {
      adventure: storedRuns.adventure || null,
      climb: storedRuns.climb || null
    }
  };
  const serialized = JSON.stringify(payload);
  localStorage.removeItem(STORAGE_STAGING_KEY);
  localStorage.setItem(STORAGE_STAGING_KEY, serialized);
  const primary = parseSaveCandidate(STORAGE_KEY, 3);
  if (primary) localStorage.setItem(STORAGE_BACKUP_KEY, primary.serialized);
  localStorage.setItem(STORAGE_KEY, serialized);
  localStorage.removeItem(STORAGE_STAGING_KEY);
  return payload;
}
function reportSaveFailure(error) {
  console.error("Game progress could not be saved", error);
  saveSystemNotice = "存档失败：当前进度尚未写入，请不要退出游戏。";
  toast(saveSystemNotice);
}
function saveGame({ persistDurableChangesDuringCombat = false } = {}) {
  if (state.combat && state.combatCheckpoint && !persistDurableChangesDuringCombat) return true;
  try {
    const previous = readSavePayload();
    const runs = cloneRunSaveSlots(previous);
    if (state.run) {
      const snapshot = state.combat && state.combatCheckpoint ? state.combatCheckpoint : currentRunSnapshot();
      state.activeMode = modeOfRun(state.run);
      runs[runSaveSlotKey(state.run.mode)] = snapshot;
    }
    writeSavePayload(runs);
    return true;
  } catch (error) {
    reportSaveFailure(error);
    return false;
  }
}
function clearRunSave(mode = ((_a) => (_a = state.run) == null ? void 0 : _a.mode)() || state.activeMode) {
  try {
    const previous = readSavePayload();
    const runs = cloneRunSaveSlots(previous);
    runs[runSaveSlotKey(mode)] = null;
    writeSavePayload(runs);
    return true;
  } catch (error) {
    reportSaveFailure(error);
    return false;
  }
}
function loadRunSave(mode = null) {
  var _a, _b;
  const snapshot = getSavedRunSnapshot(mode);
  const recoveryNotice = saveSystemNotice;
  saveSystemNotice = "";
  if (!(snapshot == null ? void 0 : snapshot.run)) return false;
  if (mode != null && modeOfRun(snapshot.run) !== normalizeRunSaveMode(mode)) return false;
  state.run = snapshot.run;
  state.combat = null;
  state.combatCheckpoint = null;
  state.pendingSkill = null;
  state.pendingEquip = null;
  state.modal = null;
  state.draft = null;
  normalizeRangerReworkRun(state.run);
  syncRunModeState(state.run);
  state.activeMode = modeOfRun(state.run);
  state.cityModeId = state.activeMode;
  const refundedSkillPoints = initializeSkillState(state.run);
  initializeAbilityState(state.run);
  for (const member of state.run.party) {
    if (!member.mercData) continue;
    (_a = member.mercData).equipment || (_a.equipment = {});
    member.mercData.traitLevel = Math.max(1, Math.floor(member.mercData.traitLevel || 1));
    member.mercData.battleStrategy = mercBattleStrategyKey(member);
  }
  refreshPartyHpCaps();
  state.floorEvents = ((_b = snapshot.floorEvents) == null ? void 0 : _b.length) ? snapshot.floorEvents : generateFloorEvents(state.run.floor || 1);
  state.eventIdx = snapshot.eventIdx || 0;
  state.eventResult = snapshot.eventResult || null;
  state.shopOpen = !!snapshot.shopOpen;
  state.screen = "tower";
  if (refundedSkillPoints > 0) saveGame();
  const passiveRefundNotice = refundedSkillPoints > 0 ? "被动技能树已重做，旧投入已返还 ".concat(refundedSkillPoints, " 技能点。") : "";
  const runLabel = isClimbRun(state.run) ? "攀登" : "冒险";
  if (state.run.pendingBattle) {
    resumePendingBattle();
    toast([recoveryNotice || "已从战斗开始处重新挑战。", passiveRefundNotice].filter(Boolean).join(" "));
  } else {
    toast([recoveryNotice || "已继续上次".concat(runLabel, "。"), passiveRefundNotice].filter(Boolean).join(" "));
  }
  return true;
}
function mergeDeep(base, incoming) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (["__proto__", "prototype", "constructor"].includes(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      out[key] = mergeDeep(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
function quickSettings() {
  var _a, _b, _c2, _d2, _e2;
  (_a = state.perm).quickSelect || (_a.quickSelect = {});
  if (!["manual", "ask", "equip", "discard"].includes(state.perm.quickSelect.equip)) {
    state.perm.quickSelect.equip = "manual";
  }
  (_b = state.perm.quickSelect).itemShop || (_b.itemShop = "normal");
  (_c2 = state.perm.quickSelect).tavern || (_c2.tavern = "manual");
  (_d2 = state.perm.quickSelect).bossStory || (_d2.bossStory = "smart");
  (_e2 = state.perm.quickSelect).events || (_e2.events = {});
  return state.perm.quickSelect;
}
function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function pct(part, total) {
  if (!total) return 0;
  return clamp(Math.round(part / total * 100), 0, 100);
}
function floorScale(floor) {
  const n = floor || 1;
  return (n / 5 + 1) * (n / 5 + 2) / 2;
}
function enemyFloorDamageBonus(floor = ((_b) => (_b = state.run) == null ? void 0 : _b.floor)()) {
  const level = Math.max(1, Math.floor(Number(floor) || 1));
  return (level - 1) * 0.01;
}
function goldGain(amount) {
  return Math.floor(Math.max(0, amount || 0));
}
function goldCost(amount) {
  return Math.ceil(Math.max(0, amount || 0));
}
function localizeGameText(text) {
  return String(text != null ? text : "").replace(/\bHP\b/gi, "生命").replace(/\bSP\b/g, "技能点").replace(/\b(?:DoT|DOT)\b/g, "持续伤害").replace(/\bCD\b/g, "冷却");
}
function esc(text) {
  return localizeGameText(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeRegExp(text) {
  return String(text != null ? text : "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function colorText(text) {
  const source = localizeGameText(text);
  let out = "";
  let pos = 0;
  const re = /\{([^}|]+)\|([^}]+)\}/g;
  let match;
  while (match = re.exec(source)) {
    if (match.index > pos) out += autoColorText(source.slice(pos, match.index));
    out += '<span class="'.concat(inlineColorClass(match[2]), '">').concat(esc(match[1]), "</span>");
    pos = match.index + match[0].length;
  }
  if (pos < source.length) out += autoColorText(source.slice(pos));
  return out;
}
function inlineColorClass(color) {
  const c = String(color || "").trim().toLowerCase();
  return ["red", "green", "blue", "cyan", "purple", "gold", "yellow", "orange", "white", "common", "rare", "epic", "legendary", "mythic", "hidden"].includes(c) ? c : "gold";
}
const TALENT_TEXT_RULES = [
  { cls: "purple", re: /(?:战士|法师|游侠|牧师|刺客|吸血鬼|德鲁伊|傀儡师)专属/g },
  { cls: "gold", re: /(?:无冷却|免费释放|额外|翻倍|永久|立即|开局|每场|每战|每回合|每层|每次|概率|随机|品质|金币|技能点|Boss|精英|必得|必掉|必暴击|可叠加|至多|全队|全属性|本场)/g },
  { cls: "green", re: /(?:生命值|最大生命|生命|回复|治疗量|治疗|受疗|吸血|复活)/g },
  { cls: "red", re: /(?:攻击力|攻击|全伤害|伤害|暴击伤害|暴击率|暴击|暴伤|普攻|处决|击杀)/g },
  { cls: "blue", re: /(?:法术强度|法强|法术|攻击技能|技能|能量|冷却|防御|护盾|速度|闪避|状态抗性|抗性|抵抗|减免|减伤|受伤减半|免疫|免控|消耗)/g },
  { cls: "purple", re: /(?:中毒|剧毒|真伤|减益|沉默|眩晕|减速|破甲|标记|暗影|分身|镜像|诅咒|灵魂|控制)/g },
  { cls: "orange", re: /(?:灼烧|陨星|烈焰|狂暴|怒气|火)/g },
  { cls: "gold", re: /(?:x\d+(?:\.\d+)?|\d+(?:\.\d+)?%)/g },
  { cls: "signed", re: /[+-]\d+(?:\.\d+)?%?/g }
];
function autoColorText(text) {
  const raw = String(text != null ? text : "");
  let pos = 0;
  let out = "";
  while (pos < raw.length) {
    let best = null;
    for (const rule of TALENT_TEXT_RULES) {
      rule.re.lastIndex = pos;
      const m = rule.re.exec(raw);
      if (!m) continue;
      if (!best || m.index < best.index || m.index === best.index && m[0].length > best.text.length) {
        best = { index: m.index, text: m[0], cls: rule.cls };
      }
    }
    if (!best) {
      out += esc(raw.slice(pos));
      break;
    }
    if (best.index > pos) out += esc(raw.slice(pos, best.index));
    const cls = best.cls === "signed" ? best.text.startsWith("-") ? "blue" : "red" : best.cls;
    out += '<span class="'.concat(cls, '">').concat(esc(best.text), "</span>");
    pos = best.index + best.text.length;
  }
  return out;
}
function talentIcon(t) {
  var _a;
  return (t == null ? void 0 : t.icon) || ((t == null ? void 0 : t.classReq) ? (_a = getClass(t.classReq)) == null ? void 0 : _a.icon : "") || TALENT_RARITY_ICON[t == null ? void 0 : t.rarity] || "⚪";
}
function talentIconArt(t) {
  const id = String((t == null ? void 0 : t.id) || "").replace(/[^a-z0-9_-]/gi, "");
  return id ? "assets/generated/talents/".concat(id, ".svg") : "";
}
function talentIconHtml(t, extraClass = "") {
  const art = talentIconArt(t);
  const fallback = esc(talentIcon(t));
  const className = extraClass ? " ".concat(extraClass) : "";
  if (!art) return '<span class="talent-icon">'.concat(fallback, "</span>");
  return '<span class="talent-icon talent-icon-art-wrap'.concat(className, '"><img class="talent-icon-art" src="').concat(esc(art), '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\'"><span class="talent-icon-fallback">').concat(fallback, "</span></span>");
}
function talentName(t) {
  return "".concat(talentIcon(t), " ").concat(esc((t == null ? void 0 : t.name) || ""));
}
function talentTitleHtml(t, { rarityLabel = false, showIcon = true } = {}) {
  const rarity = String((t == null ? void 0 : t.rarity) || "common").replace(/[^a-z0-9_-]/gi, "");
  const icon = showIcon ? "".concat(talentIconHtml(t), " ") : "";
  return "".concat(rarityLabel ? '<span class="talent-rarity-label '.concat(rarity, '">[').concat(RARITY_LABEL[t.rarity] || t.rarity, "]</span> ") : "").concat(icon, '<span class="talent-name-text ').concat(rarity, '">').concat(esc((t == null ? void 0 : t.name) || ""), "</span>");
}
function talentRarityFilterLabel(rarity, fallback) {
  return "".concat(TALENT_RARITY_ICON[rarity] || "", " ").concat(fallback || RARITY_LABEL[rarity] || rarity).trim();
}
function combatUnitNamePattern() {
  const c = state.combat;
  if (!c) return null;
  const names = Array.from(new Set([...c.allies || [], ...c.enemies || []].map((unit) => unit == null ? void 0 : unit.name).filter(Boolean))).sort((a, b) => b.length - a.length);
  if (!names.length) return null;
  const key = names.join("");
  if (c._logUnitPatternKey !== key) {
    c._logUnitPatternKey = key;
    c._logUnitPattern = new RegExp("(".concat(names.map((name) => escapeRegExp(esc(name))).join("|"), ")"), "g");
  }
  return c._logUnitPattern;
}
function colorCombatLog(text) {
  const colorClass = (color) => {
    const c = String(color || "").trim().toLowerCase();
    return ["red", "green", "blue", "gold", "purple", "orange", "white", "cyan", "common", "rare", "legendary"].includes(c) ? c : "muted";
  };
  const tokens = [];
  let html = esc(localizeGameText(text)).replace(/\{([^}|]+)\|([^}]+)\}/g, (_, body, color) => {
    const token = "@@LOGTOKEN".concat(tokens.length, "@@");
    tokens.push('<span class="log-token log-'.concat(colorClass(color), '">').concat(body, "</span>"));
    return token;
  });
  const unitPattern = combatUnitNamePattern();
  if (unitPattern) html = html.replace(unitPattern, '<span class="log-unit">$1</span>');
  html = html.replace(/\n?\s*(?:[—─-]+\s*)?(第\s*\d+\s*回合)(?:\s*[—─-]+)?/g, '<span class="log-round">$1</span>');
  html = html.replace(/(战斗开始|被击败|击败|倒下|死亡|处决|炸毁|战败|胜利|僵持)/g, '<span class="log-gold">$1</span>');
  html = html.replace(/(使用了?|释放了?|免费释放|开始蓄力)\s*[「【]([^」】]+)[」】]/g, '<span class="log-muted">$1</span>「<span class="log-skill">$2</span>」');
  html = html.replace(/[「【]([^」】]+)[」】]/g, '「<span class="log-skill">$1</span>」');
  html = html.replace(/(受到|造成|附加|反弹|吸取生命力)\s*(\d+)\s*((?:真实|暗影|自然|爆破|毒爆|神圣)?伤害)/g, '$1 <span class="log-damage">$2</span> <span class="log-damage-word">$3</span>');
  html = html.replace(/(回复|恢复|生命恢复|汲取恢复)\s*(\d+)\s*(生命)?/g, '<span class="log-heal">$1 $2$3</span>');
  html = html.replace(/(恢复|回复)\s*(\d+)\s*(能量)/g, '<span class="log-energy">$1 $2 $3</span>');
  html = html.replace(/(获得|吸收|转化)\s*(\d+)\s*(护盾)/g, '<span class="log-shield">$1 $2$3</span>');
  html = html.replace(/(生命[:：]?\s*\d+\/\d+|\(\s*生命[:：]?\s*\d+\/\d+\s*\))/g, '<span class="log-hp">$1</span>');
  html = html.replace(/(中毒|剧毒|毒爆|毒云|灼烧|燃烧|流血|破甲|死亡标记|沉默|减速|眩晕|嘲讽|潜行|回光返照|狂暴)/g, '<span class="log-debuff">$1</span>');
  html = html.replace(/(护盾|祝福|强化|闪避|完美闪避|抵抗|复活|额外行动|能量全满|冷却重置|追加一击|追加攻击|连击|追击|反击|吸血|治疗暴击)/g, '<span class="log-buff">$1</span>');
  html = html.replace(/(暴击|伤害\+\d+%|伤害永久|攻击大幅提升|攻击提升)/g, '<span class="log-crit">$1</span>');
  html = html.replace(/(金币|掉落|装备|道具|药水|卷轴|奖励|经验|升级)/g, '<span class="log-loot">$1</span>');
  html = html.replace(/([+]\d+%?|永久[+]\d+%?)/g, '<span class="log-gain">$1</span>');
  html = html.replace(/(-\d+%?)/g, '<span class="log-loss">$1</span>');
  tokens.forEach((value, idx) => {
    html = html.replace("@@LOGTOKEN".concat(idx, "@@"), value);
  });
  return html;
}
function toast(message) {
  state.toast = message;
  window.setTimeout(() => {
    if (state.toast === message) {
      state.toast = "";
      render();
    }
  }, 2800);
}
let rewardedAdPending = false;
let rewardedAdRequestSerial = 0;
let rewardedAdBlurredWhilePending = false;
let rewardedAdResumeTimer = 0;
let rewardedAdStartedAt = 0;
const REWARDED_AD_RESUME_RECOVERY_DELAY_MS = 2e3;
const REWARDED_AD_STUCK_CLICK_RECOVERY_MS = 500;
function rewardedAdMessage(message) {
  toast(message);
  render();
}
function nativeRewardedAdPlugin() {
  var _a, _b;
  return ((_b = (_a = window.Capacitor) == null ? void 0 : _a.Plugins) == null ? void 0 : _b.TosinAds) || null;
}
function nativePrivacyBridgePlugin() {
  var _a, _b;
  return ((_b = (_a = window.Capacitor) == null ? void 0 : _a.Plugins) == null ? void 0 : _b.PrivacyBridge) || null;
}
function privacyNeedsDecision() {
  return !privacyAllowsNetworkServices();
}
function privacyAllowsNetworkServices() {
  var _a, _b;
  return ((_a = state.privacyConsent) == null ? void 0 : _a.status) === "accepted" && ((_b = state.privacyConsent) == null ? void 0 : _b.version) === PRIVACY_POLICY_VERSION;
}
async function openPrivacyPolicy() {
  const plugin = nativePrivacyBridgePlugin();
  try {
    if (plugin == null ? void 0 : plugin.openPolicy) {
      await plugin.openPolicy();
      return true;
    }
    const opened = window.open(PRIVACY_POLICY_URL, "_blank", "noopener,noreferrer");
    if (!opened) toast("未能打开隐私协议，请检查浏览器弹窗设置。");
    return !!opened;
  } catch (error) {
    console.error("Privacy policy could not be opened", error);
    toast("未能打开隐私协议，请稍后重试。");
    render();
    return false;
  }
}
async function initializeApprovedNativeServices() {
  if (!privacyAllowsNetworkServices()) return;
  const adPlugin = nativeRewardedAdPlugin();
  if (adPlugin == null ? void 0 : adPlugin.initialize) {
    try {
      await adPlugin.initialize();
    } catch (error) {
      console.warn("Rewarded ad SDK initialization failed", error);
    }
  }
  await initializeTapTapAccess();
}
async function disablePrivacyControlledServices() {
  var _a, _b, _c2;
  const adPlugin = nativeRewardedAdPlugin();
  try {
    await ((_a = adPlugin == null ? void 0 : adPlugin.disable) == null ? void 0 : _a.call(adPlugin));
  } catch (error) {
    console.warn("Rewarded ad SDK could not be disabled", error);
  }
  try {
    await ((_c2 = (_b = nativeTapTapAccessPlugin()) == null ? void 0 : _b.logout) == null ? void 0 : _c2.call(_b));
  } catch (error) {
    console.warn("TapTap account could not be logged out during privacy withdrawal", error);
  }
}
function acceptPrivacyConsent() {
  state.privacyConsent = persistPrivacyConsent("accepted");
  tapTapGate.consented = true;
  tapTapGate.allowed = !nativeTapTapAccessPlugin();
  tapTapGate.phase = nativeTapTapAccessPlugin() ? "checking" : "ready";
  tapTapGate.message = nativeTapTapAccessPlugin() ? "正在连接 TapTap 登录服务……" : "";
  state.modal = null;
  render();
  initializeApprovedNativeServices();
}
async function exitApplicationForPrivacy() {
  const plugin = nativePrivacyBridgePlugin();
  try {
    if (plugin == null ? void 0 : plugin.exitApp) {
      await plugin.exitApp();
      return;
    }
  } catch (error) {
    console.warn("Application could not be closed by the native privacy bridge", error);
  }
  window.close();
  render();
}
function declinePrivacyConsentAndExit() {
  state.privacyConsent = persistPrivacyConsent("declined");
  tapTapGate.consented = false;
  tapTapGate.allowed = false;
  tapTapGate.phase = "privacy";
  tapTapGate.message = "";
  state.modal = null;
  exitApplicationForPrivacy();
}
function requestPrivacyWithdrawal() {
  state.modal = {
    title: "撤回隐私授权",
    className: "privacy-confirm-modal",
    body: '\n      <div class="privacy-confirm-copy">\n        <p>撤回后将停用 TapTap 登录与激励广告，并退出客户端；下次启动时需要重新阅读并同意隐私协议才能进入游戏。</p>\n        <p>游戏本地存档不受影响。已初始化的第三方 SDK 会立即停止新的调用，并在客户端退出后完全结束本次运行。</p>\n      </div>\n    ',
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } },
      { label: "确认撤回", className: "danger", onClick: () => confirmPrivacyWithdrawal() }
    ]
  };
  render();
}
async function confirmPrivacyWithdrawal() {
  state.privacyConsent = persistPrivacyConsent("declined");
  tapTapGate.consented = false;
  tapTapGate.allowed = false;
  tapTapGate.phase = "privacy";
  tapTapGate.message = "";
  state.modal = null;
  await disablePrivacyControlledServices();
  await exitApplicationForPrivacy();
}
function renderPrivacyConsentGate() {
  var _a;
  const previouslyDeclined = ((_a = state.privacyConsent) == null ? void 0 : _a.status) === "declined";
  return '\n    <div class="privacy-gate-backdrop" role="dialog" aria-modal="true" aria-labelledby="privacy-gate-title">\n      <section class="privacy-gate-card">\n        <div class="privacy-gate-icon" aria-hidden="true">🛡️</div>\n        <div class="privacy-gate-kicker">首次使用提示</div>\n        <h2 id="privacy-gate-title">隐私保护说明</h2>\n        <div class="privacy-gate-copy">\n          <p>为了保存游戏进度，我们会在本机存储游戏存档与隐私选择。只有在你同意后，Android 客户端才会主动初始化 TapSDK 登录/合规服务和 Tosin 广告服务，用于 TapTap 登录、实名认证、防沉迷及你主动选择的激励广告。</p>\n          <p>你可以阅读完整的<button type="button" class="privacy-policy-link" onclick="openPrivacyPolicy()">《隐私协议》</button>，了解处理的信息类型、第三方 SDK、使用目的与撤回方式。</p>\n          <p>如不同意本协议，将无法进入游戏。你可以选择退出客户端，并在下次启动时重新查看和选择。</p>\n        </div>\n        '.concat(previouslyDeclined ? '<div class="privacy-required-note">需要同意隐私协议后才能进入游戏。</div>' : "", '\n        <div class="privacy-policy-meta">协议版本 / 发布及生效日期：').concat(PRIVACY_POLICY_VERSION, '</div>\n        <div class="privacy-gate-actions">\n          <button type="button" class="privacy-exit-button" onclick="declinePrivacyConsentAndExit()">不同意并退出</button>\n          <button type="button" class="privacy-accept-button" onclick="acceptPrivacyConsent()">同意并继续</button>\n        </div>\n      </section>\n    </div>\n  ');
}
const TAPTAP_LOGIN_SUCCESS = 500;
const DEFAULT_PLAYER_NAME = "TapTap玩家";
const PLAYER_NAME_DISPLAY_LIMIT = 15;
const TAPTAP_ACCESS_MESSAGES = Object.freeze({
  1e3: "认证已退出，请重新登录。",
  1001: "请使用新的 TapTap 账号登录。",
  1030: "当前时段无法进入游戏。",
  1050: "今日可玩时长已用完。",
  1100: "当前账号不符合游戏适龄要求。",
  1200: "认证请求失败，请检查网络后重试。",
  9002: "实名认证尚未完成，请继续认证。"
});
function nativeTapTapAccessPlugin() {
  var _a, _b;
  return ((_b = (_a = window.Capacitor) == null ? void 0 : _a.Plugins) == null ? void 0 : _b.TapTapAccess) || null;
}
const tapTapGate = {
  required: !!nativeTapTapAccessPlugin(),
  allowed: !nativeTapTapAccessPlugin(),
  consented: privacyAllowsNetworkServices(),
  phase: privacyAllowsNetworkServices() ? "checking" : "privacy",
  message: "",
  playerName: "",
  listenerReady: false
};
function updateTapTapPlayerName(result = {}) {
  const playerName = String(result.playerName || "").trim();
  if (playerName) tapTapGate.playerName = playerName;
}
function currentPlayerName() {
  return tapTapGate.playerName || DEFAULT_PLAYER_NAME;
}
function playerNameForHud() {
  const characters = Array.from(currentPlayerName());
  if (characters.length <= PLAYER_NAME_DISPLAY_LIMIT) return characters.join("");
  return "".concat(characters.slice(0, PLAYER_NAME_DISPLAY_LIMIT - 1).join(""), "…");
}
async function ensureTapTapComplianceListener(plugin) {
  if (tapTapGate.listenerReady || !(plugin == null ? void 0 : plugin.addListener)) return;
  await plugin.addListener("complianceResult", (result) => applyTapTapAccessResult(result));
  tapTapGate.listenerReady = true;
}
async function initializeTapTapAccess() {
  const plugin = nativeTapTapAccessPlugin();
  if (!plugin) {
    tapTapGate.required = false;
    tapTapGate.allowed = true;
    tapTapGate.phase = "ready";
    return;
  }
  tapTapGate.required = true;
  tapTapGate.allowed = false;
  if (!tapTapGate.consented) {
    tapTapGate.phase = "privacy";
    render();
    return;
  }
  tapTapGate.phase = "checking";
  tapTapGate.message = "正在连接 TapTap 登录服务……";
  render();
  try {
    await ensureTapTapComplianceListener(plugin);
    const status = await plugin.initialize();
    if (!(status == null ? void 0 : status.configured)) {
      tapTapGate.phase = "unconfigured";
      tapTapGate.message = (status == null ? void 0 : status.message) || "TapTap 登录参数尚未配置。";
      render();
      return;
    }
    updateTapTapPlayerName(status);
    if (status == null ? void 0 : status.signedIn) {
      await startTapTapLogin(true);
      return;
    }
    await startTapTapLogin(false);
    return;
  } catch (error) {
    console.error("TapTap access initialization failed", error);
    tapTapGate.phase = "error";
    tapTapGate.message = (error == null ? void 0 : error.message) || "TapTap 登录服务初始化失败，请稍后重试。";
  }
  render();
}
function acceptTapTapPrivacy() {
  acceptPrivacyConsent();
}
function declineTapTapPrivacy() {
  declinePrivacyConsentAndExit();
}
async function startTapTapLogin(resumeExistingAccount = false) {
  const plugin = nativeTapTapAccessPlugin();
  if (!(plugin == null ? void 0 : plugin.authenticate)) return false;
  tapTapGate.allowed = false;
  tapTapGate.phase = "verifying";
  tapTapGate.message = resumeExistingAccount ? "正在检查实名认证与防沉迷状态……" : "正在登录并进行合规认证……";
  render();
  try {
    const result = await plugin.authenticate();
    applyTapTapAccessResult(result);
    return !!(result == null ? void 0 : result.allowed);
  } catch (error) {
    console.error("TapTap login or compliance failed", error);
    tapTapGate.phase = "error";
    tapTapGate.message = (error == null ? void 0 : error.message) || "TapTap 登录失败，请稍后重试。";
    render();
    return false;
  }
}
async function cancelTapTapAuthentication() {
  var _a;
  const plugin = nativeTapTapAccessPlugin();
  tapTapGate.allowed = false;
  tapTapGate.phase = "login";
  tapTapGate.message = "登录认证已取消，请重新尝试。";
  render();
  try {
    await ((_a = plugin == null ? void 0 : plugin.cancelAuthentication) == null ? void 0 : _a.call(plugin));
  } catch (error) {
    console.warn("TapTap authentication could not be canceled cleanly", error);
  }
}
function applyTapTapAccessResult(result = {}) {
  const code = Number(result.code) || 0;
  if (result.allowed || code === TAPTAP_LOGIN_SUCCESS) {
    updateTapTapPlayerName(result);
    tapTapGate.allowed = true;
    tapTapGate.phase = "ready";
    tapTapGate.message = "";
    render();
    return;
  }
  tapTapGate.allowed = false;
  if (code === 1e3 || code === 1001) tapTapGate.playerName = "";
  tapTapGate.message = TAPTAP_ACCESS_MESSAGES[code] || result.message || "登录或认证未完成。";
  if (code === 1e3 || code === 1001 || code === 0) tapTapGate.phase = "login";
  else if (code === 1030 || code === 1050 || code === 1100) tapTapGate.phase = "restricted";
  else if (code === 9002) tapTapGate.phase = "realname";
  else tapTapGate.phase = "error";
  render();
}
async function logoutTapTapAccount() {
  var _a;
  const plugin = nativeTapTapAccessPlugin();
  tapTapGate.playerName = "";
  tapTapGate.allowed = false;
  tapTapGate.phase = "checking";
  tapTapGate.message = "正在切换 TapTap 账号……";
  render();
  try {
    await ((_a = plugin == null ? void 0 : plugin.logout) == null ? void 0 : _a.call(plugin));
  } catch (error) {
    console.warn("TapTap logout failed", error);
  }
  tapTapGate.phase = "login";
  tapTapGate.message = "请使用 TapTap 账号重新登录。";
  render();
}
function renderTapTapGate() {
  let body = "";
  if (tapTapGate.phase === "privacy") {
    body = '\n      <div class="taptap-gate-copy">\n        <h2>登录与合规认证说明</h2>\n        <p>Android 客户端使用易玩（上海）网络科技有限公司提供的 TapSDK 完成 TapTap 登录、实名认证与防沉迷检查。</p>\n        <p>同意后才会初始化 TapSDK。为提供登录与合规认证，TapSDK 会按官方说明处理系统版本、设备型号、CPU 与内存信息、网络类型及 Android ID；本游戏仅使用 TapTap <code>openId</code> 作为账号唯一标识，不读取公开昵称，也不接收身份证号码等实名明文信息。</p>\n        <div class="taptap-policy-links">\n          <a href="https://developer.taptap.cn/docs/sdk/start/agreement/" target="_blank" rel="noopener noreferrer">TapSDK 隐私政策</a>\n          <a href="https://developer.taptap.cn/docs/sdk/start/compliance/" target="_blank" rel="noopener noreferrer">TapSDK 合规使用说明</a>\n          <a href="https://developer.taptap.cn/docs/sdk/anti-addiction/features/" target="_blank" rel="noopener noreferrer">实名认证与防沉迷说明</a>\n        </div>\n      </div>\n      <div class="taptap-gate-actions">\n        <button class="taptap-consent-primary" onclick="acceptTapTapPrivacy()">同意并继续</button>\n        <button class="taptap-consent-secondary" onclick="declineTapTapPrivacy()">暂不同意</button>\n      </div>\n    ';
  } else if (tapTapGate.phase === "login") {
    body = '\n      <div class="taptap-gate-copy">\n        <h2>TapTap 账号登录</h2>\n        <p>'.concat(esc(tapTapGate.message || "登录后将自动进行实名认证与防沉迷检查，通过后即可进入游戏。"), '</p>\n      </div>\n      <button class="taptap-official-button" onclick="startTapTapLogin()" aria-label="TapTap 登录">\n        <img src="assets/taptap-login-mobile-blue.png" alt="TapTap 登录">\n      </button>\n    ');
  } else if (tapTapGate.phase === "declined") {
    body = '\n      <div class="taptap-gate-copy">\n        <h2>TapSDK 尚未启用</h2>\n        <p>'.concat(esc(tapTapGate.message), '</p>\n      </div>\n      <button class="taptap-consent-primary" onclick="tapTapGate.phase=\'privacy\'; render()">返回查看说明</button>\n    ');
  } else if (tapTapGate.phase === "unconfigured") {
    body = '\n      <div class="taptap-gate-copy">\n        <h2>登录服务待配置</h2>\n        <p>'.concat(esc(tapTapGate.message), '</p>\n        <small>请在 Android 构建配置中填写 TapTap Client ID 与 Client Token。</small>\n      </div>\n      <button class="taptap-consent-secondary" onclick="initializeTapTapAccess()">重新检查</button>\n    ');
  } else if (tapTapGate.phase === "restricted") {
    body = '\n      <div class="taptap-gate-copy restricted">\n        <h2>当前无法进入游戏</h2>\n        <p>'.concat(esc(tapTapGate.message), '</p>\n      </div>\n      <div class="taptap-gate-actions">\n        <button class="taptap-consent-primary" onclick="startTapTapLogin(true)">重新检查</button>\n        <button class="taptap-consent-secondary" onclick="logoutTapTapAccount()">切换账号</button>\n      </div>\n    ');
  } else if (tapTapGate.phase === "realname" || tapTapGate.phase === "error") {
    body = '\n      <div class="taptap-gate-copy">\n        <h2>'.concat(tapTapGate.phase === "realname" ? "请完成实名认证" : "登录认证未完成", "</h2>\n        <p>").concat(esc(tapTapGate.message), '</p>\n      </div>\n      <div class="taptap-gate-actions">\n        <button class="taptap-consent-primary" onclick="startTapTapLogin(true)">重试认证</button>\n        <button class="taptap-consent-secondary" onclick="logoutTapTapAccount()">切换账号</button>\n      </div>\n    ');
  } else {
    body = '\n      <div class="taptap-loading" aria-hidden="true"></div>\n      <div class="taptap-gate-copy">\n        <h2>正在验证账号</h2>\n        <p>'.concat(esc(tapTapGate.message || "正在连接 TapTap 服务……"), "</p>\n      </div>\n      ").concat(tapTapGate.phase === "verifying" ? '\n        <button class="taptap-consent-secondary" onclick="cancelTapTapAuthentication()">取消并返回</button>\n      ' : "", "\n    ");
  }
  return '\n    <section class="menu-screen taptap-access-screen">\n      <div class="taptap-access-center">\n        <div class="menu-crest" aria-hidden="true"><span>✦</span></div>\n        <div class="menu-kicker">永恒之塔 · 守望重燃</div>\n        <h1 class="taptap-access-title">开局觉醒<br><span>超神级天赋</span></h1>\n        <div class="taptap-access-card">'.concat(body, '</div>\n        <div class="taptap-access-foot">TapTap 登录 · 实名认证 · 防沉迷</div>\n      </div>\n    </section>\n  ');
}
function markRewardedAdHostPaused() {
  if (!rewardedAdPending) return;
  rewardedAdBlurredWhilePending = true;
  if (rewardedAdResumeTimer) window.clearTimeout(rewardedAdResumeTimer);
  rewardedAdResumeTimer = 0;
}
function scheduleRewardedAdResumeRecovery() {
  if (!rewardedAdPending || !rewardedAdBlurredWhilePending) return;
  const requestSerial = rewardedAdRequestSerial;
  if (rewardedAdResumeTimer) window.clearTimeout(rewardedAdResumeTimer);
  rewardedAdResumeTimer = window.setTimeout(async () => {
    rewardedAdResumeTimer = 0;
    if (!rewardedAdPending || !rewardedAdBlurredWhilePending || requestSerial !== rewardedAdRequestSerial) return;
    const plugin = nativeRewardedAdPlugin();
    try {
      if (plugin == null ? void 0 : plugin.resetRewardedAd) await plugin.resetRewardedAd();
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    } catch (error) {
      console.warn("Rewarded ad state reset failed", error);
    }
    if (!rewardedAdPending || requestSerial !== rewardedAdRequestSerial) return;
    rewardedAdRequestSerial += 1;
    rewardedAdPending = false;
    rewardedAdBlurredWhilePending = false;
    rewardedAdStartedAt = 0;
    rewardedAdMessage("广告播放已中断，请重新观看");
  }, REWARDED_AD_RESUME_RECOVERY_DELAY_MS);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    markRewardedAdHostPaused();
    saveGame();
  } else {
    scheduleRewardedAdResumeRecovery();
  }
});
document.addEventListener("resume", scheduleRewardedAdResumeRecovery);
document.addEventListener("pause", saveGame);
(_c = window.addEventListener) == null ? void 0 : _c.call(window, "pagehide", saveGame);
(_d = window.addEventListener) == null ? void 0 : _d.call(window, "blur", markRewardedAdHostPaused);
(_e = window.addEventListener) == null ? void 0 : _e.call(window, "focus", scheduleRewardedAdResumeRecovery);
(_f = window.addEventListener) == null ? void 0 : _f.call(window, "pageshow", scheduleRewardedAdResumeRecovery);
async function showRewardedAd(placement, grantReward) {
  if (!privacyAllowsNetworkServices()) {
    rewardedAdMessage("请先同意隐私协议后使用广告服务。");
    return false;
  }
  const plugin = nativeRewardedAdPlugin();
  if (rewardedAdPending) {
    const requestAge = Date.now() - rewardedAdStartedAt;
    if (requestAge < REWARDED_AD_STUCK_CLICK_RECOVERY_MS) {
      rewardedAdMessage("广告正在加载或播放，请稍候。");
      return false;
    }
    const stuckRequestSerial = rewardedAdRequestSerial;
    try {
      if (plugin == null ? void 0 : plugin.resetRewardedAd) await plugin.resetRewardedAd();
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    } catch (error) {
      console.warn("Rewarded ad click recovery failed", error);
    }
    if (rewardedAdPending && stuckRequestSerial === rewardedAdRequestSerial) {
      rewardedAdRequestSerial += 1;
      rewardedAdPending = false;
      rewardedAdBlurredWhilePending = false;
      rewardedAdStartedAt = 0;
    }
  }
  if (!(plugin == null ? void 0 : plugin.showRewardedAd)) {
    rewardedAdMessage("请在 Android 客户端中观看广告。");
    return false;
  }
  rewardedAdPending = true;
  rewardedAdBlurredWhilePending = false;
  rewardedAdStartedAt = Date.now();
  const requestSerial = ++rewardedAdRequestSerial;
  if (rewardedAdResumeTimer) window.clearTimeout(rewardedAdResumeTimer);
  rewardedAdResumeTimer = 0;
  rewardedAdMessage("正在加载激励视频……");
  try {
    const result = await plugin.showRewardedAd({ placement });
    if (requestSerial !== rewardedAdRequestSerial) return false;
    if (!(result == null ? void 0 : result.success)) {
      rewardedAdMessage((result == null ? void 0 : result.message) || "广告未完成，未发放奖励。");
      return false;
    }
    grantReward();
    return true;
  } catch (error) {
    console.error("Rewarded ad failed", error);
    rewardedAdMessage((error == null ? void 0 : error.message) || "广告暂时不可用，请稍后再试。");
    return false;
  } finally {
    if (requestSerial === rewardedAdRequestSerial) {
      rewardedAdPending = false;
      rewardedAdBlurredWhilePending = false;
      rewardedAdStartedAt = 0;
      if (rewardedAdResumeTimer) window.clearTimeout(rewardedAdResumeTimer);
      rewardedAdResumeTimer = 0;
    }
  }
}
function addRunLog(message) {
  var _a;
  if (!state.run) return;
  (_a = state.run).log || (_a.log = []);
  state.run.log.push(message);
  while (state.run.log.length > 160) state.run.log.shift();
}
function classList() {
  return Object.values(DATA.classes).filter((c) => !c.baseOf);
}
function getClass(id) {
  ensurePromotionClass(id);
  return DATA.classes[id] || DATA.classes.warrior;
}
function allClassSkills(classId) {
  return getClass(classId).skills || [];
}
function findSkillDef(skillId) {
  var _a;
  if ((_a = state.run) == null ? void 0 : _a.classId) ensurePromotionClass(state.run.classId);
  for (const cls of Object.values(DATA.classes)) {
    const skill = allClassSkills(cls.id).find((s) => s.id === skillId);
    if (skill) return { skill, classId: cls.id };
  }
  return null;
}
function skillUnlockLevel(index) {
  return SKILL_UNLOCK_LEVELS[index] || 99;
}
function skillLearnCost() {
  return SKILL_LEARN_COST;
}
function skillPositionIndex(skillId) {
  const found = findSkillDef(skillId);
  if (!found) return -1;
  const classId = heroClassIdForSkill(skillId) || found.classId;
  return allClassSkills(classId).findIndex((s) => s.id === skillId);
}
function skillEnhanceLevel(skillId, run = state.run) {
  var _a;
  const displayLevel = Math.max(SKILL_DISPLAY_BASE_LEVEL, Math.floor(((_a = run == null ? void 0 : run.skillLevels) == null ? void 0 : _a[skillId]) || SKILL_DISPLAY_BASE_LEVEL));
  return Math.min(SKILL_MAX_LEVEL, Math.max(0, displayLevel - SKILL_DISPLAY_BASE_LEVEL));
}
function skillUpgradeCost(skillId) {
  const level = skillEnhanceLevel(skillId);
  const base = SKILL_POINT_COSTS[level] || SKILL_POINT_COSTS[SKILL_POINT_COSTS.length - 1] || 1;
  const extra = SKILL_POSITION_EXTRA_COST[skillPositionIndex(skillId)] || 0;
  return base + extra;
}
function ownedHeroClassIds(run = state.run) {
  if (!run) return [];
  return [...new Set([run.classId, run.dualHeroMode ? run.secondClassId : ""].filter(Boolean))];
}
function classHasSkill(classId, skillId) {
  if (!classId || !skillId) return false;
  ensurePromotionClass(classId);
  return allClassSkills(classId).some((skill) => skill.id === skillId);
}
function heroClassIdForSkill(skillId, run = state.run) {
  return ownedHeroClassIds(run).find((classId) => classHasSkill(classId, skillId)) || "";
}
const SKILL_PASSIVE_TREE_VERSION = 2;
const LEGACY_SKILL_PASSIVE_COSTS = Object.freeze({
  steel_will: 1,
  thorn_armor: 2,
  revenge: 2,
  unyielding: 2,
  death_grip: 3
});
function migrateSkillPassiveTrees(run = state.run) {
  if (!run) return 0;
  const current = run.unlockedSkillPassives;
  const alreadyNested = !!current && typeof current.first === "object" && typeof current.second === "object";
  if (run.skillPassiveTreeVersion === SKILL_PASSIVE_TREE_VERSION && alreadyNested) return 0;
  let refund = 0;
  if (current && !alreadyNested) {
    for (const [passiveId, cost] of Object.entries(LEGACY_SKILL_PASSIVE_COSTS)) {
      if (current[passiveId]) refund += cost;
    }
  }
  run.skillPoints = Math.max(0, Math.floor(run.skillPoints || 0)) + refund;
  run.unlockedSkillPassives = { first: {}, second: {} };
  run.skillPassiveTreeVersion = SKILL_PASSIVE_TREE_VERSION;
  return refund;
}
function initializeSkillState(run = state.run) {
  var _a, _b, _c2, _d2, _e2;
  if (!run) return 0;
  const refundedSkillPoints = migrateSkillPassiveTrees(run);
  run.learnedSkills || (run.learnedSkills = {});
  run.skillLevels || (run.skillLevels = {});
  run.equippedSkills || (run.equippedSkills = []);
  for (const classId of ownedHeroClassIds(run)) {
    const skills = allClassSkills(classId);
    const basic = skills[0];
    const starter = skills[1] || skills[0];
    if (basic) {
      run.learnedSkills[basic.id] = true;
      (_a = run.skillLevels)[_b = basic.id] || (_a[_b] = 1);
    }
    if (!starter) continue;
    const isNewStarterGrant = !run.learnedSkills[starter.id];
    if (isNewStarterGrant) {
      run.learnedSkills[starter.id] = true;
      (_c2 = run.skillLevels)[_d2 = starter.id] || (_c2[_d2] = 1);
    }
    if (classId === run.classId && isNewStarterGrant && !run.equippedSkills.includes(starter.id) && run.equippedSkills.length < 6) run.equippedSkills.push(starter.id);
  }
  const mainClassSkillList = allClassSkills(run.classId);
  const mainBasicSkillId = ((_e2 = mainClassSkillList[0]) == null ? void 0 : _e2.id) || "";
  const mainClassSkills = new Set(mainClassSkillList.map((skill) => skill.id));
  const normalizedEquippedSkills = run.equippedSkills.filter((id, idx, arr) => arr.indexOf(id) === idx).filter((id) => mainClassSkills.has(id) && run.learnedSkills[id] && findSkillDef(id));
  run.equippedSkills = mainBasicSkillId ? [mainBasicSkillId, ...normalizedEquippedSkills.filter((id) => id !== mainBasicSkillId).slice(0, 5)] : normalizedEquippedSkills.slice(0, 6);
  return refundedSkillPoints;
}
function initializeAbilityState(run = state.run) {
  if (!run) return;
  run.abilityPoints || (run.abilityPoints = {});
  for (const def of ABILITY_STATS) run.abilityPoints[def.key] = Math.max(0, Math.floor(run.abilityPoints[def.key] || 0));
}
function abilityPrimaryAttributes(run = state.run) {
  var _a;
  initializeAbilityState(run);
  const attributes = {};
  for (const def of ABILITY_STATS) attributes[def.key] = Math.max(0, Number((_a = run == null ? void 0 : run.abilityPoints) == null ? void 0 : _a[def.key]) || 0);
  return attributes;
}
function applyAbilityPrimaryAttributes(attributes, member, run = state.run) {
  const result = { ...attributes };
  if (!(member == null ? void 0 : member.isPlayer) || !run) return result;
  const abilityAttributes = abilityPrimaryAttributes(run);
  for (const def of ABILITY_STATS) {
    result[def.key] = roundPrimaryAttribute((Number(result[def.key]) || 0) + abilityAttributes[def.key]);
  }
  return result;
}
function learnedSkillIdsForClass(classId, run = state.run) {
  initializeSkillState(run);
  return allClassSkills(classId).filter((s) => {
    var _a;
    return (_a = run == null ? void 0 : run.learnedSkills) == null ? void 0 : _a[s.id];
  });
}
function equippedSkillIdsForClass(classId, run = state.run) {
  initializeSkillState(run);
  const allowed = new Set(allClassSkills(classId).map((s) => s.id));
  return ((run == null ? void 0 : run.equippedSkills) || []).filter((id) => {
    var _a;
    return allowed.has(id) && ((_a = run.learnedSkills) == null ? void 0 : _a[id]);
  });
}
function isFixedSkill(skillId, run = state.run) {
  return ownedHeroClassIds(run).some((classId) => {
    var _a;
    return ((_a = allClassSkills(classId)[0]) == null ? void 0 : _a.id) === skillId;
  });
}
function scaledSkill(skill) {
  const enhanceLevel = skillEnhanceLevel(skill.id);
  if (enhanceLevel <= 0) return skill;
  const coeffMultiplier = 1 + 0.15 * enhanceLevel;
  const costMultiplier = 1 - 0.05 * enhanceLevel;
  return {
    ...skill,
    level: SKILL_DISPLAY_BASE_LEVEL + enhanceLevel,
    cost: Math.max(0, Math.ceil((skill.cost || 0) * costMultiplier)),
    effects: (skill.effects || []).map((effect) => {
      const next = { ...effect };
      if (typeof next.coeff === "number") next.coeff = Number((next.coeff * coeffMultiplier).toFixed(3));
      if (typeof next.dmgCoeff === "number") next.dmgCoeff = Number((next.dmgCoeff * coeffMultiplier).toFixed(3));
      return next;
    }),
    puppetCommand: skill.puppetCommand ? {
      ...skill.puppetCommand,
      ...typeof skill.puppetCommand.coeff === "number" ? { coeff: Number((skill.puppetCommand.coeff * coeffMultiplier).toFixed(3)) } : {}
    } : void 0
  };
}
function hasTalent(passiveId) {
  var _a, _b;
  const combatCache = (_a = state.combat) == null ? void 0 : _a._passiveCache;
  if (combatCache) return !!combatCache[passiveId];
  if ((((_b = state.run) == null ? void 0 : _b.talents) || []).some((t) => t.passive === passiveId)) return true;
  return hasActiveSetPassive(passiveId);
}
function isTalentOwner(unit) {
  return !!(unit == null ? void 0 : unit.isPlayer) && !unit.isSecondHero;
}
function skillPassiveHeroKey(unit = null) {
  const resolved = (unit == null ? void 0 : unit.isCommandPuppet) ? commandPuppetOwner(unit, true) || unit : unit;
  return (resolved == null ? void 0 : resolved.isSecondHero) || (resolved == null ? void 0 : resolved.unitId) === "player2" ? "second" : "first";
}
function skillPassiveClassId(heroKey = "first", run = state.run) {
  return getBaseClassId(heroKey === "second" ? run == null ? void 0 : run.secondClassId : run == null ? void 0 : run.classId);
}
function skillPassiveDefinition(passiveId) {
  return (DATA.passiveSkillTree || []).find((passive) => passive.id === passiveId) || null;
}
function isSkillPassiveUnlocked(passiveId, heroKey = "first", run = state.run) {
  var _a, _b;
  if (!run) return false;
  migrateSkillPassiveTrees(run);
  return !!((_b = (_a = run.unlockedSkillPassives) == null ? void 0 : _a[heroKey]) == null ? void 0 : _b[passiveId]);
}
function hasSkillPassive(passiveId, unit = null) {
  const run = state.run;
  if (!run) return false;
  const resolved = (unit == null ? void 0 : unit.isCommandPuppet) ? commandPuppetOwner(unit, true) || unit : unit;
  if (!resolved || resolved.side !== "ally" || !resolved.isPlayer) return false;
  const heroKey = skillPassiveHeroKey(resolved);
  const passive = skillPassiveDefinition(passiveId);
  if (!passive || passive.classId !== skillPassiveClassId(heroKey, run)) return false;
  return isSkillPassiveUnlocked(passiveId, heroKey, run);
}
function talentPassiveMultiplier(passiveId) {
  var _a;
  const talent = (((_a = state.run) == null ? void 0 : _a.talents) || []).find((entry) => entry.passive === passiveId);
  return talent ? talentEnhanceMultiplier(talent) : 1;
}
function talentStarValue(passiveId, enhanceLevel = null, run = state.run, field = "values") {
  const spec = TALENT_STAR_EFFECTS[passiveId];
  if (!spec) return null;
  const talent = ((run == null ? void 0 : run.talents) || []).find((entry) => entry.passive === passiveId);
  const savedLevel = talent ? talentEnhanceLevel(talent.id) : 0;
  const level = enhanceLevel == null && (run == null ? void 0 : run.hardcoreMode) ? 0 : enhanceLevel != null ? enhanceLevel : savedLevel;
  const values = spec[field] || spec.values;
  return values[Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, level))];
}
function talentStarEffectText(passiveId, enhanceLevel) {
  var _a;
  const spec = TALENT_STAR_EFFECTS[passiveId];
  const value = talentStarValue(passiveId, enhanceLevel);
  if (!spec || value === null) return "";
  if (spec.format) return spec.format(value, enhanceLevel);
  const display = ((_a = spec.unit) == null ? void 0 : _a.includes("%")) ? Number((value * 100).toFixed(2)) : value;
  return "".concat(spec.label, " ").concat(spec.prefix || "").concat(display).concat(spec.unit || "");
}
function isTalentEnhanceable(talent) {
  if (!(talent == null ? void 0 : talent.id)) return false;
  return DATA.hiddenTalents.some((entry) => entry.id === talent.id) || DATA.talents.some((entry) => entry.id === talent.id);
}
function normalizedTalentEnhanceLevel(talent, enhanceLevel = null) {
  var _a;
  if (!isTalentEnhanceable(talent)) return 0;
  const savedLevel = ((_a = state.run) == null ? void 0 : _a.hardcoreMode) ? 0 : talentEnhanceLevel(talent.id);
  const raw = enhanceLevel == null ? savedLevel : Number(enhanceLevel);
  return Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, Math.floor(Number.isFinite(raw) ? raw : 0)));
}
function formatTalentDescriptionNumber(value, percentage = false) {
  const numeric = (Number(value) || 0) * (percentage ? 100 : 1);
  return String(Number(numeric.toFixed(2)));
}
function replaceTalentDescriptionValue(description, baseValue, currentValue, percentage = false) {
  const source = String(description || "");
  const suffix = percentage ? "%" : "";
  const baseText = "".concat(formatTalentDescriptionNumber(baseValue, percentage)).concat(suffix);
  const currentText = "".concat(formatTalentDescriptionNumber(currentValue, percentage)).concat(suffix);
  if (baseText === currentText) return source;
  const pattern = new RegExp("(^|[^\\d.])".concat(escapeRegExp(baseText), "(?![\\d.])"));
  return source.replace(pattern, (_match, prefix) => "".concat(prefix).concat(currentText));
}
function replaceTalentDescriptionValues(description, replacements) {
  let updated = String(description || "");
  const pending = [];
  for (const [idx, replacement] of replacements.entries()) {
    const percentage = !!replacement.percentage;
    const suffix = percentage ? "%" : "";
    const baseText = "".concat(formatTalentDescriptionNumber(replacement.baseValue, percentage)).concat(suffix);
    const currentText = "".concat(formatTalentDescriptionNumber(replacement.currentValue, percentage)).concat(suffix);
    if (baseText === currentText) continue;
    const placeholder = "__TALENT_VALUE_".concat(String.fromCharCode(65 + idx), "__");
    const pattern = new RegExp("(^|[^\\d.])".concat(escapeRegExp(baseText), "(?![\\d.])"));
    const next = updated.replace(pattern, (_match, prefix) => "".concat(prefix).concat(placeholder));
    if (next === updated) continue;
    updated = next;
    pending.push([placeholder, currentText]);
  }
  for (const [placeholder, currentText] of pending) updated = updated.replace(placeholder, currentText);
  return updated;
}
function hiddenTalentDescriptionAtLevel(talent, level) {
  const passiveId = talent == null ? void 0 : talent.passive;
  const multiplier = 1 + level * 0.5;
  if (passiveId === "divine_hand") {
    const effect = hiddenTalentStarValues(passiveId, level);
    return "每次{普攻|red}永久增加{".concat(effect.hp, "最大生命|green}，并附加{最大生命").concat(formatTalentDescriptionNumber(effect.damagePct, true), "%|purple}真实伤害");
  }
  if (passiveId === "arcane_echo") {
    const effect = hiddenTalentStarValues(passiveId, level);
    return "每次释放{攻击技能|blue}永久增加{+".concat(effect.matk, "法术强度|blue}，并有{").concat(formatTalentDescriptionNumber(effect.refreshChance, true), "%|gold}概率立即刷新冷却");
  }
  if (passiveId === "iron_heart") {
    return "每层首次进入战斗时获得{当前层数×".concat(formatTalentDescriptionNumber(multiplier), "|blue}防御；开局获得{当前防御").concat(formatTalentDescriptionNumber(0.5 * multiplier, true), "%|blue}护盾");
  }
  if (passiveId === "soul_harvest") {
    return "击杀敌人{永久攻击+".concat(formatTalentDescriptionNumber(multiplier), "|red}，精英{+").concat(formatTalentDescriptionNumber(2 * multiplier), "|red}，Boss{+").concat(formatTalentDescriptionNumber(3 * multiplier), "|red}；战斗内全伤害{+当前层数×").concat(formatTalentDescriptionNumber(multiplier), "%|red}");
  }
  if (passiveId === "gale_breath") {
    return "风之加护赋予极致迅捷，{每回合行动两次|red}，获得{".concat(formatTalentDescriptionNumber(0.1 * multiplier, true), "%闪避|blue}");
  }
  return (talent == null ? void 0 : talent.desc) || "";
}
function talentDescriptionAtLevel(talent, enhanceLevel = null) {
  var _a;
  if (!talent) return "";
  if (!isTalentEnhanceable(talent)) return talent.desc || "";
  const level = normalizedTalentEnhanceLevel(talent, enhanceLevel);
  if (level === 0) return talent.desc || "";
  if (talent.rarity === "hidden") return hiddenTalentDescriptionAtLevel(talent, level);
  const spec = TALENT_STAR_EFFECTS[talent.passive];
  if (spec == null ? void 0 : spec.format) return spec.format(talentStarValue(talent.passive, level), level);
  if (spec) {
    const values = spec.values || [];
    const percentage = !!((_a = spec.unit) == null ? void 0 : _a.includes("%"));
    const updated = replaceTalentDescriptionValue(talent.desc, values[0], values[level], percentage);
    return updated !== talent.desc ? updated : talentStarEffectText(talent.passive, level);
  }
  if (talent.statMod) {
    const multiplier = 1 + level * 0.5;
    const replacedValues = /* @__PURE__ */ new Set();
    const replacements = [];
    for (const [stat, baseValue] of Object.entries(talent.statMod)) {
      const percentage = stat.endsWith("Pct");
      const token = "".concat(formatTalentDescriptionNumber(baseValue, percentage)).concat(percentage ? "%" : "");
      if (replacedValues.has(token)) continue;
      replacedValues.add(token);
      replacements.push({ baseValue, currentValue: baseValue * multiplier, percentage });
    }
    return replaceTalentDescriptionValues(talent.desc, replacements);
  }
  return talent.desc || "";
}
function talentDescriptionHtml(talent, enhanceLevel = null, { showLevel = true } = {}) {
  const enhanceable = isTalentEnhanceable(talent);
  const level = normalizedTalentEnhanceLevel(talent, enhanceLevel);
  const stars = "".concat("★".repeat(level + 1)).concat("☆".repeat(TALENT_ENHANCE_MAX_LEVEL - level));
  const levelText = showLevel && enhanceable ? '<span class="talent-current-level" aria-label="当前'.concat(level + 1, '星">').concat(stars, "</span> ") : "";
  return "".concat(levelText).concat(colorText(talentDescriptionAtLevel(talent, level)));
}
function controlTalentExtraTurns(attacker, buffId) {
  if (!(attacker == null ? void 0 : attacker.isPlayer) || !hasTalent("stun_extend") || !isControlDebuffId(buffId)) return 0;
  return talentStarValue("stun_extend");
}
function hiddenTalentStarValues(passiveId, enhanceLevel = null) {
  var _a, _b;
  const talent = (((_a = state.run) == null ? void 0 : _a.talents) || []).find((entry) => entry.passive === passiveId);
  const savedLevel = talent ? talentEnhanceLevel(talent.id) : 0;
  const level = enhanceLevel == null && ((_b = state.run) == null ? void 0 : _b.hardcoreMode) ? 0 : enhanceLevel != null ? enhanceLevel : savedLevel;
  const multiplier = 1 + Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, level)) * 0.5;
  if (passiveId === "divine_hand") return [
    { hp: 1, damagePct: 0.01 },
    { hp: 1, damagePct: 0.015 },
    { hp: 2, damagePct: 0.02 }
  ][Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, level))];
  if (passiveId === "arcane_echo") return [
    { matk: 1, refreshChance: 0.2 },
    { matk: 1, refreshChance: 0.3 },
    { matk: 2, refreshChance: 0.4 }
  ][Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, level))];
  if (passiveId === "iron_heart" || passiveId === "soul_harvest") return { multiplier };
  return null;
}
function rebuildCombatPassiveCache(c = state.combat) {
  if (!c || !state.run) return;
  const cache = /* @__PURE__ */ Object.create(null);
  for (const t of state.run.talents || []) {
    if (t == null ? void 0 : t.passive) cache[t.passive] = true;
  }
  for (const { bonus } of activeSetBonuses(state.run)) {
    if (bonus == null ? void 0 : bonus.passive) cache[bonus.passive] = true;
  }
  c._passiveCache = cache;
}
function getSetDef(setId) {
  return (DATA.sets || []).find((set) => set.id === setId) || null;
}
function activeSetBonusesForEquipment(equipment = {}) {
  const bonuses = [];
  for (const set of DATA.sets || []) {
    const count = (set.slots || []).filter((slot) => {
      var _a;
      return ((_a = equipment == null ? void 0 : equipment[slot]) == null ? void 0 : _a.setId) === set.id;
    }).length;
    if (count >= 2 && set.bonus2) bonuses.push({ set, bonus: set.bonus2, count });
  }
  return bonuses;
}
function activeSetBonuses(run = state.run) {
  return activeSetBonusesForEquipment((run == null ? void 0 : run.equipment) || {});
}
function hasActiveSetPassive(passiveId, run = state.run) {
  return activeSetBonuses(run).some(({ bonus }) => (bonus == null ? void 0 : bonus.passive) === passiveId);
}
function unitHasSetPassive(unit, passiveId) {
  return activeSetBonusesForEquipment(combatEquipmentForUnit(unit)).some(({ bonus }) => (bonus == null ? void 0 : bonus.passive) === passiveId);
}
function unitHasCombatPassive(unit, passiveId) {
  var _a;
  if (unit == null ? void 0 : unit.isPlayer) {
    if ((((_a = state.run) == null ? void 0 : _a.talents) || []).some((talent) => talent.passive === passiveId)) return true;
    return !unit.isSecondHero && hasActiveSetPassive(passiveId);
  }
  return unitHasSetPassive(unit, passiveId);
}
function talentBoostByPassive(passiveId) {
  return hasTalent(passiveId) ? 1 : 0;
}
function armManaTideOnFullEnergy(unit, beforeEnergy) {
  var _a;
  if (!(unit == null ? void 0 : unit.isPlayer) || !hasTalent("mana_tide")) return false;
  const cap = Math.max(1, ((_a = unit.stats) == null ? void 0 : _a.energy) || 0);
  if ((beforeEnergy || 0) >= cap || unit.energy < cap || unit.manaTideReady || (unit.manaTideCooldown || 0) > 0) return false;
  unit.manaTideReady = true;
  unit.manaTideCooldown = 3;
  combatLog("🌊 法力潮汐：".concat(unit.name, " 的下一次非终极攻击技能获得强化。"));
  return true;
}
function talentCap(base, step = 5) {
  var _a;
  return base + Math.floor(((((_a = state.run) == null ? void 0 : _a.floor) || 1) - 1) / step);
}
function talentCapPct(basePct) {
  var _a;
  return basePct + Math.floor(((((_a = state.run) == null ? void 0 : _a.floor) || 1) - 1) / 5) * 0.05;
}
function growthLevel(id) {
  return state.perm.growthLevels[id] || 0;
}
function growthCost(def, cur = growthLevel(def.id)) {
  return Math.floor(def.cost * (cur + 1) * (cur + 2) / 2);
}
function talentEnhanceLevel(id) {
  var _a;
  const raw = Number(((_a = state.perm.talentEnhanceLevels) == null ? void 0 : _a[id]) || 0);
  return Math.max(0, Math.min(TALENT_ENHANCE_MAX_LEVEL, Math.floor(Number.isFinite(raw) ? raw : 0)));
}
function talentEnhanceCost(talent, lv = talentEnhanceLevel(talent.id)) {
  const n = Math.max(0, Math.floor(Number(lv) || 0));
  if (!talent || n >= TALENT_ENHANCE_MAX_LEVEL) return 0;
  const r = TALENT_RARITY_RANK[talent.rarity] || 1;
  return Math.floor(r * (r + 1) / 2 * ((n + 1) * (n + 2) / 2) * 5);
}
function talentEnhanceMultiplier(talent, run = state.run) {
  if (!talent || (run == null ? void 0 : run.hardcoreMode)) return 1;
  return 1 + talentEnhanceLevel(talent.id) * 0.5;
}
function scaledTalentStatMod(talent, run = state.run) {
  if (!(talent == null ? void 0 : talent.statMod)) return null;
  const mult = talentEnhanceMultiplier(talent, run);
  if (mult === 1) return talent.statMod;
  return Object.fromEntries(Object.entries(talent.statMod).map(([key, value]) => [key, Number((value * mult).toFixed(4))]));
}
function growthStatBonus(stat, run = state.run) {
  var _a;
  if (!run || run.hardcoreMode) return 0;
  let total = 0;
  for (const g of DATA.growthTree) {
    const lv = growthLevel(g.id);
    if ((_a = g.perLv) == null ? void 0 : _a[stat]) total += g.perLv[stat] * lv;
  }
  return total;
}
function getEnhanceMax() {
  var _a;
  if ((_a = state.run) == null ? void 0 : _a.hardcoreMode) return 5;
  return 5 + growthLevel("g_enhance");
}
const MAX_MERC_ROSTER = 10;
const MAX_DEPLOYED_MERCS = 2;
function deployedMercRoster() {
  return mercRoster().filter((member) => {
    var _a;
    return ((_a = member.mercData) == null ? void 0 : _a.alive) !== false;
  }).slice(0, MAX_DEPLOYED_MERCS);
}
function standbyMercRoster() {
  const deployedIds = new Set(deployedMercRoster().map((member) => member.unitId));
  return mercRoster().filter((member) => {
    var _a;
    return ((_a = member.mercData) == null ? void 0 : _a.alive) !== false && !deployedIds.has(member.unitId);
  });
}
function expForLevel(level) {
  return 20 + level * 10;
}
function battleExpForFloor(floor, kind) {
  if (kind === "boss") return 30 + floor * 6;
  if (kind === "elite") return 15 + floor * 3;
  return 10 + floor * 2;
}
function mercExpForLevel(level) {
  return expForLevel(level);
}
function statValueLabel(stat, value) {
  if (stat === "crit" || stat === "critDmg") return "".concat(STAT_LABEL[stat], " +").concat(value, "%");
  return "".concat(STAT_LABEL[stat] || stat, " +").concat(value);
}
DATA.enemyTemplates = [
  { id: "slime", name: "史莱姆", icon: "🟢", tag: "beast", baseLv: 1, hp: 62, atk: 13, def: 3, skills: ["e_attack"] },
  { id: "skeleton", name: "骷髅战士", icon: "💀", tag: "undead", baseLv: 1, hp: 76, atk: 14, def: 7, skills: ["e_attack", "e_shield_bash"] },
  { id: "bat_swarm", name: "蝙蝠群", icon: "🦇", tag: "beast", baseLv: 1, hp: 44, atk: 14, def: 3, skills: ["e_attack", "e_bite"] },
  { id: "fungus", name: "毒蘑菇", icon: "🍄", tag: "plant", baseLv: 1, hp: 48, atk: 12, def: 5, skills: ["e_attack", "e_poison_dagger"] },
  { id: "goblin", name: "哥布林", icon: "👹", tag: "humanoid", baseLv: 2, hp: 58, atk: 18, def: 3, skills: ["e_attack", "e_poison_dagger"] },
  { id: "wolf", name: "暗狼", icon: "🐺", tag: "beast", baseLv: 2, hp: 66, atk: 20, def: 5, skills: ["e_attack", "e_bite"] },
  { id: "bandit", name: "盗贼", icon: "🗡️", tag: "humanoid", baseLv: 2, hp: 52, atk: 21, def: 4, skills: ["e_attack", "e_backstab"] },
  { id: "skeleton_archer", name: "骷髅弓手", icon: "🏹", tag: "undead", baseLv: 2, hp: 48, atk: 19, def: 3, skills: ["e_attack", "e_multi_shot"] },
  { id: "mage_mob", name: "暗影法师", icon: "🧙", tag: "humanoid", baseLv: 3, hp: 62, atk: 0, matk: 17, def: 4, skills: ["e_shadow_bolt", "e_curse"] },
  { id: "treant", name: "树人", icon: "🌳", tag: "plant", baseLv: 3, hp: 104, atk: 14, def: 14, skills: ["e_attack", "e_thorns_aura", "e_heal_self"] },
  { id: "imp", name: "小恶魔", icon: "😈", tag: "demon", baseLv: 3, hp: 48, atk: 0, matk: 21, def: 3, skills: ["e_shadow_bolt", "e_curse", "e_attack"] },
  { id: "ghoul", name: "食尸鬼", icon: "🧟", tag: "undead", baseLv: 3, hp: 80, atk: 21, def: 7, skills: ["e_attack", "e_bite", "e_lifedrain"] },
  { id: "golem", name: "石像鬼", icon: "🗿", tag: "construct", baseLv: 4, hp: 124, atk: 19, def: 14, skills: ["e_attack", "e_slam", "e_mega_slam"] },
  { id: "fire_spirit", name: "火元素", icon: "🔥", tag: "elemental", baseLv: 4, hp: 62, atk: 0, matk: 20, def: 3, skills: ["e_fireball", "e_attack"] },
  { id: "frost_spirit", name: "冰元素", icon: "❄️", tag: "elemental", baseLv: 4, hp: 66, atk: 0, matk: 17, def: 7, skills: ["e_frost_nova", "e_attack"] },
  { id: "gargoyle", name: "石像怪", icon: "🦅", tag: "construct", baseLv: 4, hp: 96, atk: 18, def: 16, skills: ["e_attack", "e_shield_self", "e_slam"] },
  { id: "fire_demon", name: "炎魔", icon: "🔥", tag: "demon", baseLv: 5, hp: 76, atk: 26, def: 6, skills: ["e_attack", "e_fireball", "e_dragon_breath"] },
  { id: "bone_lord", name: "尸骨领主", icon: "💀", tag: "undead", baseLv: 5, hp: 96, atk: 22, def: 10, skills: ["e_attack", "e_multi_shot", "e_lifedrain"] },
  { id: "spore_mother", name: "孢子母体", icon: "🍄", tag: "plant", baseLv: 5, hp: 72, atk: 0, matk: 14, def: 7, skills: ["e_poison_cloud", "e_explode", "e_attack"] },
  { id: "elite_knight", name: "精英暗骑", icon: "⚔️", tag: "undead", baseLv: 3, isElite: true, hp: 156, atk: 22, def: 12, skills: ["e_attack", "e_shield_bash", "e_warcry"] },
  { id: "elite_shaman", name: "精英萨满", icon: "🔮", tag: "humanoid", baseLv: 4, isElite: true, hp: 132, atk: 0, matk: 18, def: 7, skills: ["e_shadow_bolt", "e_heal_self", "e_curse", "e_dark_ritual"] },
  { id: "elite_berserker", name: "精英狂战士", icon: "🪓", tag: "humanoid", baseLv: 4, isElite: true, hp: 142, atk: 27, def: 7, skills: ["e_attack", "e_cleave", "e_frenzy_strike", "e_enrage"] },
  { id: "elite_necro", name: "精英死灵师", icon: "💀", tag: "undead", baseLv: 4, isElite: true, hp: 124, atk: 0, matk: 20, def: 7, skills: ["e_shadow_bolt", "e_lifedrain", "e_shadow_nova", "e_heal_self"] },
  { id: "elite_pyro", name: "精英烈焰师", icon: "🌋", tag: "elemental", baseLv: 5, isElite: true, hp: 114, atk: 0, matk: 26, def: 6, skills: ["e_fireball", "e_meteor", "e_attack"] },
  { id: "elite_guardian", name: "精英守卫", icon: "🏰", tag: "construct", baseLv: 5, isElite: true, hp: 190, atk: 20, def: 18, skills: ["e_attack", "e_shield_self", "e_iron_shell", "e_rally", "e_war_stomp"] },
  { id: "elite_assassin", name: "精英刺客", icon: "🥷", tag: "humanoid", baseLv: 5, isElite: true, hp: 100, atk: 29, def: 4, skills: ["e_attack", "e_backstab", "e_poison_dagger", "e_multi_shot"] }
];
DATA.enemySkills = {
  e_attack: { name: "攻击", coeff: 1, intent: "attack" },
  e_shield_bash: { name: "盾击", coeff: 1.2, stun: 0.2, intent: "stun" },
  e_poison_dagger: { name: "毒刃", coeff: 0.8, dot: "poison", dotTurns: 2, dotCoeff: 0.25, intent: "dot" },
  e_bite: { name: "撕咬", coeff: 1.3, intent: "heavy" },
  e_shadow_bolt: { name: "暗影箭", coeff: 1.4, statKey: "matk", intent: "heavy" },
  e_curse: { name: "诅咒", coeff: 0.5, statKey: "matk", debuff: "weaken", debuffTurns: 2, intent: "debuff" },
  e_slam: { name: "重击", coeff: 1.6, stun: 0.15, intent: "heavy" },
  e_warcry: { name: "战吼", buff: "strengthen", buffTurns: 2, selfTarget: true, intent: "buff" },
  e_heal_self: { name: "自愈", healPct: 0.15, selfTarget: true, intent: "heal" },
  e_enrage: { name: "狂暴", buff: "strengthen", buffTurns: 99, selfTarget: true, intent: "buff" },
  e_cleave: { name: "横扫", coeff: 0.8, aoe: true, intent: "heavy" },
  e_fireball: { name: "火球术", coeff: 0.9, statKey: "matk", aoe: true, dot: "burn", dotTurns: 2, dotCoeff: 0.24, intent: "heavy" },
  e_frost_nova: { name: "冰霜新星", coeff: 0.7, statKey: "matk", aoe: true, intent: "heavy" },
  e_shadow_nova: { name: "暗影新星", coeff: 0.6, statKey: "matk", aoe: true, debuff: "weaken", debuffTurns: 2, intent: "debuff" },
  e_poison_cloud: { name: "毒雾", coeff: 0.5, statKey: "matk", aoe: true, dot: "poison", dotTurns: 3, dotCoeff: 0.2, intent: "dot" },
  e_dragon_breath: { name: "龙息", coeff: 1.1, aoe: true, dot: "burn", dotTurns: 2, dotCoeff: 0.26, intent: "heavy" },
  e_multi_shot: { name: "连射", coeff: 0.5, hits: 3, intent: "heavy" },
  e_backstab: { name: "背刺", coeff: 1.8, intent: "heavy" },
  e_frenzy_strike: { name: "狂乱打击", coeff: 0.4, hits: 4, intent: "heavy" },
  e_lifedrain: { name: "生命吸取", coeff: 1.2, lifestealPct: 0.35, intent: "heavy" },
  e_soul_harvest: { name: "灵魂收割", coeff: 0.8, statKey: "matk", aoe: true, lifestealPct: 0.25, intent: "heavy" },
  e_explode: { name: "自爆", coeff: 1.8, statKey: "matk", aoe: true, selfDmgPct: 1, intent: "heavy" },
  e_shield_self: { name: "结晶护甲", shieldPct: 0.25, selfTarget: true, intent: "buff" },
  e_iron_shell: { name: "铁壳", shieldPct: 0.35, selfTarget: true, intent: "buff" },
  e_rally: { name: "鼓舞", buffAllies: "strengthen", buffTurns: 2, intent: "buff" },
  e_war_stomp: { name: "战争践踏", coeff: 0.6, aoe: true, stun: 0.25, intent: "stun" },
  e_thorns_aura: { name: "荆棘外壳", buff: "d_thorns_buff", buffTurns: 3, selfTarget: true, intent: "buff" },
  e_mega_slam: { name: "蓄力重击", coeff: 2.5, intent: "heavy", chargeUp: true, chargeTurns: 1 },
  e_dark_ritual: { name: "暗黑仪式", coeff: 0, statKey: "matk", aoeHpPct: 0.15, intent: "heavy", chargeUp: true, chargeTurns: 1 },
  e_meteor: { name: "陨石术", coeff: 1.8, statKey: "matk", aoe: true, dot: "burn", dotTurns: 2, dotCoeff: 0.3, intent: "heavy", chargeUp: true, chargeTurns: 1 },
  e_death_coil: { name: "死亡缠绕", coeff: 2.2, statKey: "matk", lifestealPct: 0.4, intent: "heavy", chargeUp: true, chargeTurns: 1 },
  e_titan_smash: { name: "泰坦践踏", coeff: 1.5, aoe: true, stun: 0.3, intent: "heavy", chargeUp: true, chargeTurns: 2 }
};
DATA.enemyPassiveAffixQualities = {
  common: { id: "common", name: "普通" },
  rare: { id: "rare", name: "稀有" },
  legendary: { id: "legendary", name: "传说" }
};
DATA.enemyPassiveAffixes = [
  { id: "common_vigor", quality: "common", name: "强壮", desc: "首次失去生命时，获得 12% 最大生命护盾", mechanic: "first_blood_shield", shieldPct: 0.12 },
  { id: "common_ferocity", quality: "common", name: "凶性", desc: "首次命中每名英雄时，施加“被猎杀”2回合；期间其受到全体敌军伤害+20%", mechanic: "first_hit_mark" },
  { id: "common_carapace", quality: "common", name: "硬壳", desc: "每回合首次受伤时，以20%攻击反震攻击者", mechanic: "round_counter", counterPct: 0.2 },
  { id: "common_brute", quality: "common", name: "蛮力", desc: "每第 3 次有效命中时，对目标施加破甲 2 回合", mechanic: "third_hit_break" },
  { id: "common_guard", quality: "common", name: "守势", desc: "友军每回合首次受伤时，以15%攻击反击；每回合最多触发1次", mechanic: "ally_guard_counter", counterPct: 0.15 },
  { id: "common_skirmish", quality: "common", name: "战意", desc: "首次本应被眩晕时，解除眩晕并获得强化 2 回合", mechanic: "stun_breakout" },
  { id: "rare_colossus", quality: "rare", name: "巨躯", desc: "生命首次低于 50% 时，获得坚韧与免控各 2 回合", mechanic: "half_hp_bulwark" },
  { id: "rare_rage", quality: "rare", name: "狂怒", desc: "生命首次低于 50% 时，获得强化 3 回合并立即追加一次行动", mechanic: "half_hp_rage" },
  { id: "rare_fortress", quality: "rare", name: "重甲", desc: "友军首次倒下时，为全体存活敌军施加 15% 最大生命护盾与坚韧 2 回合", mechanic: "last_stand_barrier", shieldPct: 0.15 },
  { id: "rare_bloodthirst", quality: "rare", name: "嗜血", desc: "击败英雄后回复 25% 最大生命，并获得强化 2 回合", mechanic: "kill_frenzy", healPct: 0.25 },
  { id: "rare_regrowth", quality: "rare", name: "再生", desc: "每次行动前清除灼烧与中毒，并回复 6% 最大生命", mechanic: "turn_cleanse_regen", healPct: 0.06 },
  { id: "rare_barrier", quality: "rare", name: "壁垒", desc: "开战获得 12% 最大生命护盾；首次被击破时重置 20% 护盾并获得坚韧 2 回合", mechanic: "shield_rebuild", startShieldPct: 0.12, rebuildShieldPct: 0.2 },
  { id: "legendary_undying", quality: "legendary", name: "不灭", desc: "每场战斗首次受到致命伤害时保留 1 点生命，并获得坚韧 2 回合", mechanic: "prevent_death" },
  { id: "legendary_destroyer", quality: "legendary", name: "毁灭", desc: "攻击生命低于 30% 的英雄时伤害 +50%；首次击败英雄后立即追加一次行动", mechanic: "execute_and_chain", executePct: 0.5 },
  { id: "legendary_citadel", quality: "legendary", name: "天铠", desc: "首次踏入 75% / 50% / 25% 生命阶段时，净化至多 2 个减益并获得坚韧 2 回合", mechanic: "threshold_cleanse" },
  { id: "legendary_overlord", quality: "legendary", name: "霸主", desc: "开战时使全体敌军获得强化 2 回合", mechanic: "battle_command" },
  { id: "legendary_titanborn", quality: "legendary", name: "泰坦血脉", desc: "每第 3 次行动前，对全体英雄造成 45% 攻击的践踏并施加虚弱 1 回合", mechanic: "third_turn_stomp", stompPct: 0.45 },
  { id: "legendary_aegis", quality: "legendary", name: "神盾", desc: "每第 2 次行动前，为全体敌军施加 8% 最大生命护盾", mechanic: "second_turn_party_shield", shieldPct: 0.08 }
];
DATA.intentIcons = { attack: "⚔️", heavy: "💥", debuff: "📉", heal: "💚", buff: "⬆️", stun: "💫", dot: "☠️", charge: "🔴" };
DATA.bosses = [
  { id: "boss_crypt_guard", name: "墓穴守卫", icon: "👹", tag: "undead", floor: 1, hp: 140, atk: 11, def: 8, skills: ["e_attack", "e_shield_bash", "e_slam", "e_shield_self"], mechanics: [{ type: "shield_phase", triggerHpPct: 0.7, shieldPct: 0.2, interval: 3 }, { type: "enrage", triggerHpPct: 0.3 }], desc: "古老的守卫者，每3回合获得护盾，低血量狂暴。" },
  { id: "boss_spider_queen", name: "蛛后·亚拉克涅", icon: "🕷️", tag: "beast", floor: 2, hp: 192, atk: 14, def: 6, skills: ["e_attack", "e_poison_dagger", "e_bite"], mechanics: [{ type: "summon", triggerHpPct: 0.5, summonId: "slime", count: 2 }, { type: "enrage", triggerHpPct: 0.25 }], desc: "剧毒蛛后，半血召唤援军，低血量狂暴。" },
  { id: "boss_lich", name: "巫妖·瓦尔图斯", icon: "💀", tag: "undead", floor: 3, hp: 240, atk: 0, matk: 17, def: 7, skills: ["e_shadow_bolt", "e_curse", "e_heal_self"], mechanics: [{ type: "shield_phase", triggerHpPct: 0.6, shieldPct: 0.15, interval: 4 }, { type: "silence", triggerHpPct: 0.4, turns: 1, interval: 5 }, { type: "enrage", triggerHpPct: 0.2 }], desc: "不死巫妖，护盾、沉默，低血量狂暴。" },
  { id: "boss_venom_drake", name: "毒龙·希多拉", icon: "🐲", tag: "dragon", floor: 4, hp: 288, atk: 15, def: 8, skills: ["e_attack", "e_bite", "e_poison_cloud", "e_lifedrain"], mechanics: [{ type: "poison_cloud", interval: 3, turns: 3, dmgCoeff: 0.35 }, { type: "summon", triggerHpPct: 0.4, summonId: "fungus", count: 2 }, { type: "frenzy", triggerHpPct: 0.25, atkMult: 1.25 }], desc: "剧毒龙种，全场毒云弥漫，低血量狂暴。" },
  { id: "boss_dragon", name: "炎龙·伊格尼斯", icon: "🐉", tag: "dragon", floor: 5, hp: 344, atk: 21, def: 10, skills: ["e_attack", "e_bite", "e_dragon_breath", "e_mega_slam"], mechanics: [{ type: "aoe_burn", interval: 3, dmgPct: 0.08 }, { type: "enrage", triggerHpPct: 0.25 }], desc: "远古炎龙，每3回合释放全体灼烧吐息。" },
  { id: "boss_lava_giant", name: "熔岩巨人·洛坎", icon: "🌋", tag: "elemental", floor: 6, hp: 416, atk: 19, def: 15, skills: ["e_attack", "e_slam", "e_fireball", "e_thorns_aura", "e_iron_shell"], mechanics: [{ type: "aoe_burn", interval: 3, dmgPct: 0.1 }, { type: "shield_phase", triggerHpPct: 0.5, shieldPct: 0.25, interval: 4 }, { type: "enrage", triggerHpPct: 0.2 }], desc: "炽热的岩浆巨人，荆棘外壳与铁壳防御并存。" },
  { id: "boss_shadow_lord", name: "暗影领主·莫甘", icon: "👿", tag: "demon", floor: 7, hp: 448, atk: 0, matk: 24, def: 12, skills: ["e_shadow_bolt", "e_curse", "e_shadow_nova", "e_soul_harvest"], mechanics: [{ type: "summon", triggerHpPct: 0.6, summonId: "skeleton", count: 2 }, { type: "shield_phase", triggerHpPct: 0.4, shieldPct: 0.25, interval: 3 }, { type: "drain_life", interval: 4, dmgPct: 0.06, healPct: 0.5 }, { type: "enrage", triggerHpPct: 0.2 }], desc: "暗影之主，召唤亡灵、灵魂收割、生命汲取。" },
  { id: "boss_necro_king", name: "死灵之王·艾尔文", icon: "☠️", tag: "undead", floor: 8, hp: 520, atk: 0, matk: 22, def: 11, skills: ["e_shadow_bolt", "e_lifedrain", "e_soul_harvest", "e_dark_ritual", "e_heal_self"], mechanics: [{ type: "summon", triggerHpPct: 0.7, summonId: "ghoul", count: 2 }, { type: "summon", triggerHpPct: 0.35, summonId: "skeleton", count: 3 }, { type: "drain_life", interval: 3, dmgPct: 0.07, healPct: 0.6 }, { type: "silence", triggerHpPct: 0.3, turns: 2, interval: 4 }, { type: "enrage", triggerHpPct: 0.15 }], desc: "掌控死亡之力的王者，两次召唤亡灵大军，持续汲取生命。" },
  { id: "boss_abyss_lord", name: "深渊领主·巴尔", icon: "👹", tag: "demon", floor: 9, hp: 584, atk: 26, def: 14, skills: ["e_attack", "e_dragon_breath", "e_soul_harvest", "e_war_stomp", "e_death_coil"], mechanics: [{ type: "aoe_burn", interval: 2, dmgPct: 0.08 }, { type: "summon", triggerHpPct: 0.5, summonId: "imp", count: 3 }, { type: "frenzy", triggerHpPct: 0.3, atkMult: 1.25 }, { type: "enrage", triggerHpPct: 0.15 }], desc: "来自深渊的恐怖领主，毁灭吐息与灵魂收割，召唤恶魔军团。" },
  { id: "boss_titan", name: "远古泰坦·奥罗斯", icon: "🏔️", tag: "construct", floor: 10, hp: 624, atk: 28, def: 18, skills: ["e_attack", "e_slam", "e_warcry", "e_war_stomp", "e_titan_smash"], mechanics: [{ type: "shield_phase", triggerHpPct: 0.7, shieldPct: 0.3, interval: 3 }, { type: "aoe_burn", interval: 4, dmgPct: 0.1 }, { type: "frenzy", triggerHpPct: 0.2, atkMult: 1.25 }, { type: "enrage", triggerHpPct: 0.15 }], desc: "沉睡万年的泰坦，拥有毁天灭地之力，低血量狂暴。" }
];
DATA.chapterBosses = Object.freeze({
  50: {
    id: "boss_chapter_flame_guardian",
    name: "神火守卫·伊莱恩",
    icon: "🛡️",
    tag: "construct",
    hp: 448,
    atk: 20,
    def: 16,
    skills: ["e_attack", "e_shield_bash", "e_slam", "e_shield_self"],
    mechanics: [{ type: "chapter_flame_barrier", triggerHpPct: 0.65, shieldPct: 0.12, interval: 3 }],
    mechanicHint: "神火壁垒：生命低于65%后，每3回合获得12%最大生命护盾。",
    desc: "守卫第一盏神火的石甲骑士。"
  },
  100: {
    id: "boss_chapter_oath_commander",
    name: "守塔骑士长·阿尔顿",
    icon: "⚔️",
    tag: "humanoid",
    hp: 640,
    atk: 25,
    def: 15,
    skills: ["e_attack", "e_shield_bash", "e_warcry", "e_war_stomp"],
    mechanics: [{ type: "chapter_guard_call", triggerHpPct: 0.55, summonId: "elite_knight", summonName: "守塔骑士残影", count: 2, scaleMul: 0.25 }],
    mechanicHint: "守卫誓约：生命低于55%时，召唤2名守塔骑士残影。",
    desc: "仍在履行旧日誓约的骑士长。"
  },
  150: {
    id: "boss_chapter_rift_observer",
    name: "神核观测者·赛勒斯",
    icon: "🔮",
    tag: "humanoid",
    hp: 700,
    atk: 0,
    matk: 31,
    def: 13,
    skills: ["e_shadow_bolt", "e_curse", "e_shadow_nova", "e_heal_self"],
    mechanics: [{ type: "chapter_rift_mark", interval: 3, turns: 2 }],
    mechanicHint: "裂隙标记：每3回合使全体英雄虚弱2回合。",
    desc: "负责观测神核，却被裂隙侵蚀的法师。"
  },
  200: {
    id: "boss_chapter_final_warden",
    name: "终焉守界者·维兰",
    icon: "🌟",
    tag: "construct",
    hp: 800,
    atk: 32,
    def: 20,
    skills: ["e_attack", "e_slam", "e_war_stomp", "e_titan_smash"],
    mechanics: [{ type: "chapter_seal_rebuild", triggerHpPct: 0.5, shieldPct: 0.2 }],
    mechanicHint: "封印重构：生命低于50%时，净化减益并获得20%最大生命护盾与2回合坚韧。",
    desc: "主封印最后的守界者。"
  }
});
DATA.enemyCompositions = {
  early: [["slime", "slime"], ["skeleton"], ["slime", "goblin"], ["goblin", "goblin"], ["slime", "slime", "slime"], ["bat_swarm", "slime"], ["fungus", "slime"], ["skeleton", "skeleton_archer"], ["bat_swarm", "goblin"], ["fungus", "fungus"]],
  mid: [["wolf", "wolf"], ["skeleton", "mage_mob"], ["golem"], ["wolf", "goblin", "goblin"], ["fire_spirit", "frost_spirit"], ["bandit", "bandit", "skeleton_archer"], ["treant", "fungus"], ["imp", "imp"], ["ghoul", "skeleton_archer"], ["gargoyle"], ["mage_mob", "wolf", "goblin"]],
  late: [["golem", "mage_mob"], ["mage_mob", "mage_mob"], ["wolf", "wolf", "wolf"], ["fire_demon", "imp", "imp"], ["bone_lord", "ghoul", "skeleton_archer"], ["spore_mother", "treant"], ["fire_spirit", "frost_spirit", "imp"], ["gargoyle", "mage_mob", "ghoul"], ["fire_demon", "frost_spirit"], ["bone_lord", "bone_lord"], ["spore_mother", "fungus", "fungus"]]
};
DATA.enemyTemplateRoles = {
  slime: "消耗前排",
  skeleton: "盾击前排",
  bat_swarm: "轻袭输出",
  fungus: "中毒骚扰",
  goblin: "毒刃输出",
  wolf: "突袭输出",
  bandit: "爆发刺客",
  skeleton_archer: "后排射手",
  mage_mob: "诅咒法师",
  treant: "荆棘守卫",
  imp: "暗影法师",
  ghoul: "吸血斗士",
  golem: "重甲前排",
  fire_spirit: "灼烧法师",
  frost_spirit: "群体压制",
  gargoyle: "护盾守卫",
  fire_demon: "灼烧爆发",
  bone_lord: "连射吸血",
  spore_mother: "自爆毒群",
  elite_knight: "精英护卫",
  elite_shaman: "精英治疗",
  elite_berserker: "精英爆发",
  elite_necro: "精英死灵",
  elite_pyro: "精英法师",
  elite_guardian: "精英堡垒",
  elite_assassin: "精英刺客"
};
DATA.enemyFormationScales = {
  normal: { 1: 2, 2: 1.5, 3: 1.25, 4: 1 },
  elite: { 1: 1.5, 2: 0.75, 3: 0.5 },
  boss: { 1: 1, 2: 0.5 }
};
DATA.enemyStages = [
  { id: "recruit", name: "初探塔境", minFloor: 1, maxFloor: 10, hint: "基础怪物职责与低人数编队。" },
  { id: "veteran", name: "险境深入", minFloor: 11, maxFloor: 30, hint: "精英开始护卫后排，Boss 从阶段池中现身。" },
  { id: "renowned", name: "威名远扬", minFloor: 31, maxFloor: 60, hint: "精锐单位按各自职责施展完整基础技能；F51 起敌军获得额外技能。" },
  { id: "army", name: "军势压境", minFloor: 61, maxFloor: 100, hint: "编队规模与技能配合进一步提升。" },
  { id: "generals", name: "王者试炼", minFloor: 101, maxFloor: 150, hint: "高阶怪物拥有更多主动技能。" },
  { id: "destiny", name: "命运决战", minFloor: 151, hint: "终局编队拥有完整的怪物技能组。" }
];
DATA.enemyFormations = {
  normal: {
    recruit: [
      { id: "slime_swarm", name: "黏液群", unitIds: ["slime", "slime", "slime"] },
      { id: "crypt_patrol", name: "墓穴巡逻", unitIds: ["skeleton", "skeleton_archer"], minFloor: 2 },
      { id: "wild_hunt", name: "荒野猎群", unitIds: ["wolf", "goblin"], minFloor: 2 },
      { id: "spore_nest", name: "孢子巢穴", unitIds: ["fungus", "fungus", "bat_swarm"] },
      { id: "root_guard", name: "古树拦路", unitIds: ["treant"], minFloor: 3 }
    ],
    veteran: [
      { id: "elemental_press", name: "元素压境", unitIds: ["fire_spirit", "frost_spirit", "imp"] },
      { id: "golem_escort", name: "石卫护法", unitIds: ["golem", "mage_mob"] },
      { id: "grave_feast", name: "坟场猎食", unitIds: ["ghoul", "skeleton_archer", "wolf"] },
      { id: "gargoyle_watch", name: "石像哨戒", unitIds: ["gargoyle"] },
      { id: "raider_ambush", name: "暗巷伏袭", unitIds: ["bandit", "wolf", "skeleton_archer"] }
    ],
    renowned: [
      { id: "inferno_pack", name: "炎狱小队", unitIds: ["fire_demon", "imp", "imp"] },
      { id: "bone_battery", name: "尸骨火力", unitIds: ["bone_lord", "ghoul", "skeleton_archer"] },
      { id: "spore_ward", name: "孢子护巢", unitIds: ["spore_mother", "treant", "fungus"] },
      { id: "crystal_line", name: "结晶战线", unitIds: ["gargoyle", "frost_spirit", "mage_mob"] }
    ],
    army: [
      { id: "demon_phalanx", name: "恶魔方阵", unitIds: ["gargoyle", "fire_demon", "imp", "imp"] },
      { id: "crypt_bulwark", name: "亡灵壁垒", unitIds: ["golem", "bone_lord", "ghoul", "skeleton_archer"] },
      { id: "fungal_siege", name: "孢子围城", unitIds: ["treant", "spore_mother", "fungus", "fungus"] }
    ],
    generals: [
      { id: "inferno_command", name: "炎狱统领", unitIds: ["gargoyle", "fire_demon", "bone_lord", "mage_mob"] },
      { id: "grave_command", name: "墓军统领", unitIds: ["golem", "bone_lord", "ghoul", "mage_mob"] },
      { id: "toxin_command", name: "毒巢统领", unitIds: ["treant", "spore_mother", "fungus", "fire_spirit"] }
    ],
    destiny: [
      { id: "abyss_encirclement", name: "深渊合围", unitIds: ["gargoyle", "fire_demon", "bone_lord", "imp"] },
      { id: "undead_finale", name: "亡灵终阵", unitIds: ["golem", "bone_lord", "ghoul", "skeleton_archer"] },
      { id: "blight_finale", name: "腐化终阵", unitIds: ["treant", "spore_mother", "fungus", "mage_mob"] }
    ]
  },
  elite: {
    recruit: [
      { id: "elite_knight_trial", name: "暗骑试炼", unitIds: ["elite_knight"], minFloor: 3 }
    ],
    veteran: [
      { id: "elite_guarded_shaman", name: "萨满护列", unitIds: ["elite_shaman", "skeleton_archer"] },
      { id: "elite_berserker_pair", name: "狂战突袭", unitIds: ["elite_berserker", "wolf"] },
      { id: "elite_knight_guard", name: "暗骑护阵", unitIds: ["elite_knight", "goblin"] }
    ],
    renowned: [
      { id: "elite_necro_line", name: "死灵护列", unitIds: ["elite_necro", "elite_knight", "skeleton_archer"] },
      { id: "elite_pyro_guard", name: "烈焰护卫", unitIds: ["elite_pyro", "gargoyle"] },
      { id: "elite_assassin_hunt", name: "刺客围猎", unitIds: ["elite_assassin", "wolf"] }
    ],
    army: [
      { id: "elite_guardian_line", name: "精英城防", unitIds: ["elite_guardian", "elite_pyro", "elite_necro"] },
      { id: "elite_blade_hunt", name: "精英猎杀", unitIds: ["elite_berserker", "elite_assassin", "wolf"] }
    ],
    generals: [
      { id: "elite_command_line", name: "精英统领", unitIds: ["elite_guardian", "elite_necro", "elite_pyro"] },
      { id: "elite_execution_line", name: "精英处刑", unitIds: ["elite_knight", "elite_berserker", "elite_assassin"] }
    ],
    destiny: [
      { id: "elite_final_command", name: "末日精英军", unitIds: ["elite_guardian", "elite_necro", "elite_pyro"] },
      { id: "elite_final_hunt", name: "末日猎杀队", unitIds: ["elite_knight", "elite_berserker", "elite_assassin"] }
    ]
  }
};
function materializeFormationScales() {
  var _a, _b, _c2;
  for (const [kind, stageGroups] of Object.entries(DATA.enemyFormations)) {
    for (const groups of Object.values(stageGroups)) {
      for (const formation of groups) {
        const count = Math.max(1, ((_a = formation.unitIds) == null ? void 0 : _a.length) || 1);
        formation.formationScale || (formation.formationScale = {
          hp: (_c2 = (_b = DATA.enemyFormationScales[kind]) == null ? void 0 : _b[count]) != null ? _c2 : 1
        });
      }
    }
  }
}
materializeFormationScales();
DATA.bossStagePools = [
  { id: "recruit", minFloor: 1, maxFloor: 10, singleWeight: 3, doubleWeight: 1, singleIds: ["boss_crypt_guard", "boss_spider_queen", "boss_lich", "boss_venom_drake"], doublePairs: [["boss_crypt_guard", "boss_spider_queen"]] },
  { id: "veteran", minFloor: 11, maxFloor: 30, singleWeight: 3, doubleWeight: 1, singleIds: ["boss_spider_queen", "boss_lich", "boss_venom_drake", "boss_dragon"], doublePairs: [["boss_crypt_guard", "boss_spider_queen"], ["boss_lich", "boss_venom_drake"]] },
  { id: "renowned", minFloor: 31, maxFloor: 60, singleWeight: 3, doubleWeight: 1, singleIds: ["boss_venom_drake", "boss_dragon", "boss_lava_giant", "boss_shadow_lord"], doublePairs: [["boss_dragon", "boss_lava_giant"], ["boss_shadow_lord", "boss_lich"]] },
  { id: "army", minFloor: 61, maxFloor: 100, singleWeight: 3, doubleWeight: 1, singleIds: ["boss_lava_giant", "boss_shadow_lord", "boss_necro_king", "boss_abyss_lord"], doublePairs: [["boss_shadow_lord", "boss_necro_king"], ["boss_lava_giant", "boss_abyss_lord"]] },
  { id: "generals", minFloor: 101, maxFloor: 150, singleWeight: 2, doubleWeight: 1, singleIds: ["boss_necro_king", "boss_abyss_lord", "boss_titan", "boss_dragon"], doublePairs: [["boss_necro_king", "boss_abyss_lord"], ["boss_titan", "boss_dragon"], ["boss_shadow_lord", "boss_lava_giant"]] },
  { id: "destiny", minFloor: 151, singleWeight: 3, doubleWeight: 2, singleIds: ["boss_titan", "boss_abyss_lord", "boss_necro_king", "boss_shadow_lord"], doublePairs: [["boss_titan", "boss_abyss_lord"], ["boss_necro_king", "boss_shadow_lord"], ["boss_dragon", "boss_lava_giant"]] }
];
DATA.eventRarities = {
  common: { name: "普通", weight: 60 },
  rare: { name: "稀有", weight: 25 },
  epic: { name: "史诗", weight: 10 },
  legendary: { name: "传说", weight: 5 }
};
DATA.events = [
  { id: "evt_merc_training", name: "战术训练场", icon: "🏟️", type: "blessing", rarity: "rare", minFloor: 3, text: "教官正为待命佣兵安排实战轮训。", choices: [{ text: "安排待命轮训", result: "merc_training", desc: "所有待命且存活的佣兵各获得一场普通战斗经验" }, { text: "暂不训练", result: "nothing" }] },
  { id: "evt_merc_quartermaster", name: "佣兵军需官", icon: "📦", type: "shop", rarity: "rare", minFloor: 5, text: "军需官带来一箱适合佣兵的前线装备。", choices: [{ text: "购买军需箱", result: "merc_supply", cost: 75, desc: "获得当前层装备，仅自动分配给佣兵；无法提升时自动出售" }, { text: "离开", result: "nothing" }] },
  { id: "evt_merc_guild", name: "佣兵协会", icon: "📜", type: "story", rarity: "epic", minFloor: 10, text: "协会按战线进度寄来一份高品质佣兵契约。10-29层：精良70%、稀有30%；30-59层：精良35%、稀有50%、史诗15%；60-99层：稀有55%、史诗35%、传说10%；100层起：稀有25%、史诗50%、传说25%。", choices: [{ text: "签收协会契约", result: "merc_guild_recruit", desc: "免费随机获得精良及以上佣兵；层数越高，出现高品质的概率越高" }, { text: "暂不签收", result: "nothing" }] },
  { id: "evt_merc_trial", name: "佣兵试炼场", icon: "⭐", type: "blessing", rarity: "rare", minFloor: 8, text: "试炼场能磨炼佣兵的开局专长，最高可升至★3。", choices: [{ text: "支付试炼费", result: "merc_trait_trial", desc: "选择一名佣兵，将其开局专长提升1星" }, { text: "暂不试炼", result: "nothing" }] },
  { id: "evt_merchant", name: "流浪商人", icon: "🧳", type: "shop", rarity: "common", text: "一个披着斗篷的商人从阴影中走出。", choices: [{ text: "购买随机装备", result: "buy_equip", cost: 70, desc: "获得随机品质装备" }, { text: "购买临时强化", result: "buy_buff", cost: 45, desc: "全属性临时+10%" }, { text: "不买，走了", result: "nothing" }] },
  { id: "evt_blacksmith", name: "铁匠铺", icon: "🔨", type: "shop", rarity: "common", text: "铁匠能将已装备的部位强化 +1。费用会随该部位当前强化等级提高。", choices: [{ text: "强化武器", result: "enhance_weapon", desc: "武器强化 +1" }, { text: "强化头盔", result: "enhance_helmet", desc: "头盔强化 +1" }, { text: "强化胸甲", result: "enhance_chest", desc: "胸甲强化 +1" }, { text: "强化护符", result: "enhance_amulet", desc: "护符强化 +1" }, { text: "强化戒指", result: "enhance_ring", desc: "戒指强化 +1" }, { text: "离开", result: "nothing" }] },
  { id: "evt_shrine", name: "神秘祭坛", icon: "⛩️", type: "blessing", rarity: "rare", text: "古老祭坛散发着神秘光芒。", choices: [{ text: "触碰祭坛", result: "shrine_bless" }, { text: "献祭金币", result: "shrine_pay", cost: 70, desc: "必定获得强力增益" }, { text: "敬而远之", result: "nothing" }] },
  { id: "evt_fountain", name: "治愈泉水", icon: "⛲", type: "heal", rarity: "common", text: "清澈的泉水从裂缝中涌出。", choices: [{ text: "饮用泉水", result: "heal_full" }, { text: "装瓶带走", result: "heal_potion" }] },
  { id: "evt_gamble", name: "赌徒", icon: "🎲", type: "shop", rarity: "common", text: "一个戴帽子的家伙冲你招手。", choices: [{ text: "押注小额", result: "gamble_40", cost: 50 }, { text: "押注大额", result: "gamble_80", cost: 100 }, { text: "不赌", result: "nothing" }] },
  { id: "evt_training", name: "修炼场", icon: "🏋️", type: "blessing", rarity: "common", text: "古老的修炼场地里弥漫着灵力。", choices: [{ text: "修炼攻击", result: "train_atk" }, { text: "修炼法强", result: "train_matk" }, { text: "修炼防御", result: "train_def" }, { text: "修炼生命", result: "train_hp" }] },
  { id: "evt_campfire", name: "篝火营地", icon: "🔥", type: "heal", rarity: "common", text: "温暖的篝火在风中摇曳。你可以疗伤、烹饪，或借火静心。", choices: [{ text: "休息恢复", result: "campfire_rest", desc: "全员回复50%生命" }, { text: "烹饪食物", result: "campfire_cook", desc: "回复25%生命；接下来2战最大生命+15%" }, { text: "冥想修炼", result: "campfire_meditate", desc: "全员能量回满" }] },
  { id: "evt_library", name: "古代图书馆", icon: "📚", type: "blessing", rarity: "rare", text: "书页上记着可以立刻掌握的知识，也记着只够支撑一场战斗的战术。", choices: [{ text: "阅读魔法书", result: "library_magic", desc: "获得1技能点" }, { text: "阅读战术书", result: "library_tactic", desc: "仅下一场战斗伤害+25%" }, { text: "翻找值钱的书", result: "library_sell", desc: "获得金币" }] },
  { id: "evt_field_hospital", name: "战地医馆", icon: "🏥", type: "heal", rarity: "common", text: "老军医正在整理药材。", choices: [{ text: "全面治疗", result: "hospital_full", cost: 70 }, { text: "购买急救包", result: "hospital_kit", cost: 45 }, { text: "简单包扎", result: "hospital_free" }] },
  { id: "evt_bounty_board", name: "悬赏公告", icon: "📜", type: "story", rarity: "rare", text: "公告栏上贴满了悬赏任务。", choices: [{ text: "接受精英悬赏", result: "bounty_elite", cost: 50 }, { text: "购买情报", result: "bounty_intel", cost: 40 }, { text: "只是看看", result: "nothing" }] },
  { id: "evt_enchanter", name: "附魔师", icon: "🔮", type: "shop", rarity: "rare", text: "附魔师摆满了发光的符文石。", choices: [{ text: "追加词条", result: "enchant_add", cost: 125 }, { text: "不需要", result: "nothing" }] },
  { id: "evt_arcane_merchant", name: "秘法商人", icon: "🧪", type: "shop", rarity: "rare", text: "旅行商人提着药箱向你招手。", choices: [{ text: "力量秘药", result: "potion_atk", cost: 100 }, { text: "法力秘药", result: "potion_matk", cost: 100 }, { text: "铁壁秘药", result: "potion_def", cost: 100 }, { text: "生命秘药", result: "potion_hp", cost: 85 }, { text: "不买了", result: "nothing" }] },
  { id: "evt_life_spring", name: "生命之泉", icon: "🌿", type: "blessing", rarity: "epic", text: "碧绿的泉水从古树根部涌出。", choices: [{ text: "饮用泉水", result: "spring_drink" }, { text: "浸泡疗伤", result: "spring_heal" }, { text: "收集泉水", result: "spring_bottle", cost: 60 }, { text: "离开", result: "nothing" }] },
  { id: "evt_sealed_treasury", name: "封印宝库", icon: "🗝️", type: "loot", rarity: "epic", minFloor: 10, text: "布满轮回刻痕的石门缓缓开启，历代挑战者遗失的宝物堆积其中。", choices: [{ text: "👑 夺取核心装备", result: "late_treasure_equip", desc: "获得紫装；100层起必为红装" }, { text: "💰 收集轮回金币", result: "late_treasure_gold", desc: "获得80–120金币" }, { text: "🎒 搜寻补给", result: "late_treasure_item", desc: "获得2–4个随机道具" }] },
  { id: "evt_old_battlefield", name: "轮回古战场", icon: "🪦", type: "story", rarity: "epic", minFloor: 20, quickFallbackResult: "hospital_free", text: "无数败者的武器插在焦土上，残留的执念仍在重复最后一战。", choices: [{ text: "💎 拾取染血遗物", result: "late_cursed_relic", desc: "获得紫装；100层起必为红装，但全员当前生命-15%" }, { text: "📜 读取残破战报", result: "bounty_intel", cost: 40, desc: "下次战斗伤害+25%" }, { text: "🩹 整理遗留药品", result: "hospital_free", desc: "免费回复25%生命" }] },
  { id: "evt_divine_forge", name: "劫火神炉", icon: "🌋", type: "danger", rarity: "legendary", minFloor: 30, quickFallbackResult: "hospital_free", text: "一座由劫火驱动的神炉仍在运转。炉中火焰渴望新的灵魂与意志。", choices: [{ text: "💎 铸造诅咒遗物", result: "late_cursed_relic", desc: "获得紫装；100层起必为红装，但全员当前生命-15%" }, { text: "🔺 升阶橙色装备", result: "upgrade_red_equip", cost: 240, desc: "随机将一件已装备的橙装升为红装" }, { text: "🔮 追加装备词条", result: "enchant_add", cost: 150, desc: "为一件未附魔装备追加1条新词条（每件限1次）" }, { text: "🩹 借火疗伤", result: "hospital_free", desc: "免费回复25%生命" }] },
  { id: "evt_talent_fragment", name: "天赋残响", icon: "🌠", type: "blessing", rarity: "legendary", minFloor: 50, text: "破碎的天赋星光在此汇聚，触碰不同残响会唤醒不同的战斗记忆。", choices: [{ text: "📘 聆听秘法残响", result: "late_fragment_magic", desc: "获得1–2技能点" }, { text: "📕 聆听战术残响", result: "late_fragment_tactic", desc: "全队永久全属性提升" }, { text: "🪞 凝视自身残响", result: "late_fragment_exp", desc: "获得(20 + 层数×3)经验" }] },
  { id: "evt_lost_supply_cart", name: "失落补给车", icon: "🛒", type: "loot", rarity: "common", text: "一辆翻倒的补给车卡在碎石间，箱盖尚未完全破裂。", choices: [{ text: "🎒 翻找补给", result: "lost_supply_items", desc: "获得2个随机道具" }, { text: "💰 变卖残件", result: "lost_supply_gold", desc: "获得45金币" }, { text: "🩹 包扎伤员", result: "lost_supply_heal", desc: "全员回复20%生命" }] },
  { id: "evt_misty_crossroads", name: "迷雾岔路", icon: "🌫️", type: "story", rarity: "common", text: "浓雾将前路分成三条，每一条都隐约传来不同的回声。", choices: [{ text: "🔭 派人侦察", result: "mist_scout", desc: "下一场战斗全队伤害+15%" }, { text: "🛡️ 谨慎绕行", result: "mist_detour", desc: "下一场战斗全队减伤+15%" }, { text: "⚔️ 强行穿越", result: "mist_force", desc: "全员当前生命-10%，获得70金币" }] },
  { id: "evt_underground_grove", name: "地下菌圃", icon: "🍄", type: "heal", rarity: "common", text: "幽暗洞穴中长满了发光菌株，颜色各异，药性也各不相同。", choices: [{ text: "🔴 采摘红菌", result: "mushroom_red", desc: "全员回复35%生命" }, { text: "🔵 采摘蓝菌", result: "mushroom_blue", desc: "全员回复30%能量" }, { text: "🟡 采摘金菌", result: "mushroom_gold", desc: "获得2个随机道具" }] },
  { id: "evt_battlefield_messenger", name: "战场信使", icon: "📯", type: "story", rarity: "common", text: "负伤的信使将一卷未送达的战报和一只沉甸甸的钱袋递到你面前。", choices: [{ text: "📜 阅读战报", result: "messenger_exp", desc: "获得本层普通战斗经验" }, { text: "💰 接下护送", result: "messenger_gold", desc: "下一场战斗金币+50%" }, { text: "👋 婉拒请求", result: "nothing" }] },
  { id: "evt_war_room", name: "战术演算厅", icon: "🧭", type: "blessing", rarity: "rare", minFloor: 5, text: "旧时代的演算装置仍在推演战局，只差有人为它选定阵型。", choices: [{ text: "⚔️ 进攻阵型", result: "war_room_assault", desc: "接下来2场战斗全队伤害+25%" }, { text: "🛡️ 铁壁阵型", result: "war_room_bulwark", desc: "接下来2场战斗全队减伤+20%" }, { text: "⚡ 蓄能阵型", result: "war_room_reserve", desc: "接下来2场战斗开局能量+40" }] },
  { id: "evt_ancient_tomb", name: "古王陵寝", icon: "⚱️", type: "danger", rarity: "rare", minFloor: 10, text: "陵门后的王座前摆着陪葬品与残碑，亡魂正等待你的抉择。", choices: [{ text: "💎 夺取陪葬品", result: "tomb_relic", desc: "获得蓝色装备，但全员当前生命-10%" }, { text: "📖 研究残碑", result: "tomb_study", desc: "获得1技能点" }, { text: "🕯️ 安抚亡魂", result: "tomb_appease", desc: "全员回复40%生命" }] },
  { id: "evt_unstable_alchemy", name: "失控炼金台", icon: "⚗️", type: "shop", rarity: "rare", minFloor: 12, text: "炼金台的火焰忽明忽暗，投放材料或许能换来意外的收获。", choices: [{ text: "🧪 投入一件道具", result: "alchemy_transmute", desc: "消耗1个随机道具，获得2个随机道具" }, { text: "✨ 注入80金币", result: "alchemy_empower", cost: 80, desc: "随机获得一项永久属性提升" }, { text: "离开", result: "nothing" }] },
  { id: "evt_blood_banner", name: "血色祭旗", icon: "🚩", type: "danger", rarity: "rare", minFloor: 15, text: "祭旗上的血纹仍在流动，它索取代价，也允诺战意与庇护。", choices: [{ text: "🩸 以血换战意", result: "blood_banner_power", desc: "全员当前生命-20%，全队永久攻击、法强提升" }, { text: "🛡️ 接受守护", result: "blood_banner_guard", desc: "全队永久生命、防御提升" }, { text: "离开祭坛", result: "nothing" }] },
  { id: "evt_time_rift", name: "时空裂隙", icon: "🌀", type: "danger", rarity: "epic", minFloor: 15, text: "裂隙另一端传来精英守卫的咆哮。跨过去，可能带回不属于这个时代的战利品。", choices: [{ text: "⚔️ 挑战裂隙精英", result: "time_rift_challenge", desc: "胜利额外获得紫色装备和80金币；失败按正常战败处理" }, { text: "🚪 封闭裂隙", result: "nothing" }] },
  { id: "evt_immortal_throne", name: "不朽王座", icon: "👑", type: "danger", rarity: "legendary", minFloor: 60, text: "王座上的不朽守卫睁开双眼。只有击败它，才有资格带走王座赐下的神兵。", choices: [{ text: "👑 挑战不朽守卫", result: "immortal_throne_challenge", desc: "胜利额外获得一件至少2条词缀的橙色装备；失败按正常战败处理" }, { text: "转身离开", result: "nothing" }] }
];
DATA.mercNames = {
  warrior: ["铁卫·卡尔", "盾墙·奥丁", "钢骨·雷克", "守卫·赫尔"],
  mage: ["星火·莉娜", "冰霜·凯尔", "奥术·薇拉", "霜华·诺拉"],
  ranger: ["疾风·艾拉", "鹰眼·菲尔", "猎影·希拉", "迅矢·雷娜"],
  priest: ["圣光·艾米", "祝祷·赛勒", "恩泽·安娜", "曙光·黛西"],
  assassin: ["暗影·凯恩", "利刃·席拉", "夜刺·艾文", "毒牙·达克"],
  vampire: ["血牙·德古拉", "暗夜·莉莉丝", "血月·赛琳娜", "血爵·弗拉德"],
  druid: ["翠叶·艾琳", "古木·塞纳", "野棘·菲恩", "熊掌·格伦"],
  puppeteer: ["牵星·墨羽", "机巧·洛琳", "银线·诺雅", "偶心·弥莎"]
};
DATA.mercQuality = {
  white: { name: "普通", outputMul: 0.95, growthMul: 0.9, survivalMul: 0.9, statBonus: {}, recruitCostBase: 50 },
  green: { name: "精良", outputMul: 1, growthMul: 1, survivalMul: 1, statBonus: { hp: 10, atk: 5, matk: 5 }, recruitCostBase: 50 },
  blue: { name: "稀有", outputMul: 1.15, growthMul: 1.3, survivalMul: 1.3, statBonus: { hp: 30, atk: 10, matk: 10, def: 5 }, recruitCostBase: 50 },
  purple: { name: "史诗", outputMul: 1.3, growthMul: 1.6, survivalMul: 1.6, statBonus: { hp: 60, atk: 30, matk: 30, def: 15, crit: 5 }, recruitCostBase: 50 },
  orange: { name: "传说", outputMul: 1.5, growthMul: 2, survivalMul: 2, statBonus: { hp: 100, atk: 50, matk: 50, def: 25, crit: 10, critDmg: 25 }, recruitCostBase: 50 }
};
DATA.mercTraits = {
  warrior: { id: "vanguard", name: "先锋护卫", desc: "开局获得20%生命护盾并嘲讽敌人2回合" },
  mage: { id: "arcane_rally", name: "奥术激励", desc: "开局全队获得激励2回合" },
  ranger: { id: "hunter_mark", name: "猎手标记", desc: "开局标记首个敌人2回合，使其受到伤害提高" },
  priest: { id: "battle_prayer", name: "战地祷言", desc: "开局全队获得坚韧1回合，伤害减免+20%" },
  assassin: { id: "shadow_entry", name: "暗影突袭", desc: "开局获得闪避与强化2回合" },
  vampire: { id: "blood_awaken", name: "血契苏醒", desc: "开局恢复20%生命并获得强化2回合" },
  druid: { id: "nature_blessing", name: "自然祝福", desc: "开局全队获得再生2回合" },
  puppeteer: { id: "puppet_screen", name: "机关护阵", desc: "开局傀儡获得20%生命护盾，主人获得10%生命护盾" }
};
DATA.mercQualityOrder = ["white", "green", "blue", "purple", "orange"];
DATA.mercQualityWeights = {
  early: { white: 100 },
  mid: { white: 100 },
  late: { white: 100 }
};
const TAVERN_HIGHER_QUALITY_CHANCE = 0.2;
const TAVERN_HIGHER_QUALITY_COST_MULTIPLIER = 2;
const MERC_SKILL_SLOT_COUNT = 3;
const MERC_SKILL_RARITY_ORDER = ["common", "rare", "epic", "legendary"];
const MERC_SKILL_RARITY_LABELS = {
  basic: "普攻",
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说"
};
const MERC_SKILL_DEFAULT_RARITIES = ["common", "rare", "rare", "epic", "epic", "legendary"];
const MERC_SKILL_RARITY_WEIGHTS = {
  white: { common: 60, rare: 30, epic: 9, legendary: 1 },
  green: { common: 45, rare: 38, epic: 14, legendary: 3 },
  blue: { common: 25, rare: 42, epic: 25, legendary: 8 },
  purple: { common: 12, rare: 36, epic: 35, legendary: 17 },
  orange: { common: 5, rare: 24, epic: 42, legendary: 29 }
};
DATA.mercSkills = {
  warrior: [
    { id: "mw_guardwall", name: "壁垒姿态", mercRarity: "rare", cost: 20, cooldown: 3, targets: "self", desc: "获得{0.9倍防御|blue}护盾与{坚韧|blue}", effects: [{ type: "shield", coeff: 0.9, statKey: "def" }, { type: "buff", buffId: "fortify", turns: 2 }] },
    { id: "mw_colossus_break", name: "巨像破击", mercRarity: "legendary", cost: 42, cooldown: 5, targets: "single", desc: "造成{2.2倍攻击|red}伤害，并叠加3层破甲", effects: [{ type: "damage", coeff: 2.2, statKey: "atk" }, { type: "debuff", buffId: "armor_break", turns: 3, stacks: 3 }] }
  ],
  mage: [
    { id: "mm_arcane_burst", name: "奥术爆流", mercRarity: "rare", cost: 28, cooldown: 3, targets: "all", desc: "对全体敌人造成{1.05倍法强|red}伤害", effects: [{ type: "damage", coeff: 1.05, statKey: "matk" }] },
    { id: "mm_comet_shower", name: "彗星雨", mercRarity: "legendary", cost: 45, cooldown: 5, targets: "all", desc: "对全体敌人造成{1.75倍法强|red}伤害并灼烧", effects: [{ type: "damage", coeff: 1.75, statKey: "matk" }, { type: "dot", buffId: "burn", turns: 2, dmgCoeff: 0.35, statKey: "matk" }] }
  ],
  ranger: [
    { id: "mr_scattershot", name: "散射箭雨", mercRarity: "rare", cost: 26, cooldown: 3, targets: "all", desc: "对全体敌人造成{0.85倍攻击|red}伤害", effects: [{ type: "damage", coeff: 0.85, statKey: "atk" }] },
    { id: "mr_deadeye", name: "鹰眼绝杀", mercRarity: "legendary", cost: 40, cooldown: 4, targets: "single", desc: "造成{2.4倍攻击|red}伤害，忽略40%防御", effects: [{ type: "damage", coeff: 2.4, statKey: "atk", armorPen: 0.4 }] }
  ],
  priest: [
    { id: "mp_sanctify", name: "净化圣光", mercRarity: "rare", cost: 24, cooldown: 2, targets: "party_single", desc: "治疗队友并驱散1个减益", effects: [{ type: "heal", coeff: 1.05, statKey: "matk" }, { type: "dispel", count: 1 }] },
    { id: "mp_divine_aegis", name: "神圣庇护", mercRarity: "legendary", cost: 42, cooldown: 5, targets: "party", desc: "治疗全队并获得{0.5倍法强|blue}护盾", effects: [{ type: "heal", coeff: 0.75, statKey: "matk" }, { type: "shield", coeff: 0.5, statKey: "matk" }] }
  ],
  assassin: [
    { id: "ma_shadow_flurry", name: "影袭连舞", mercRarity: "rare", cost: 25, cooldown: 3, targets: "single", desc: "连续3次造成{0.6倍攻击|red}伤害", effects: [{ type: "damage", coeff: 0.6, statKey: "atk", hits: 3 }] },
    { id: "ma_assassinate", name: "寂灭处决", mercRarity: "legendary", cost: 42, cooldown: 5, targets: "single", desc: "造成{2.5倍攻击|red}伤害", effects: [{ type: "damage", coeff: 2.5, statKey: "atk" }] }
  ],
  vampire: [
    { id: "mv_blood_lance", name: "血枪贯穿", mercRarity: "rare", cost: 24, cooldown: 2, targets: "single", desc: "造成{1.35倍攻击|red}伤害并吸血30%", effects: [{ type: "damage", coeff: 1.35, statKey: "atk", lifestealPct: 0.3 }] },
    { id: "mv_crimson_wave", name: "绯红潮汐", mercRarity: "legendary", cost: 44, cooldown: 5, targets: "all", desc: "对全体敌人造成2段{0.95倍攻击|red}伤害并吸血", effects: [{ type: "damage", coeff: 0.95, statKey: "atk", hits: 2, lifestealPct: 0.18 }] }
  ],
  druid: [
    { id: "md_rootsnare", name: "根须缠缚", mercRarity: "rare", cost: 22, cooldown: 3, targets: "single", desc: "造成{0.09倍最大生命|red}伤害，35%概率眩晕", effects: [{ type: "damage", coeff: 0.09, statKey: "maxHp" }, { type: "stun", chance: 0.35, turns: 1 }] },
    { id: "md_earthshatter", name: "大地裂变", mercRarity: "legendary", cost: 44, cooldown: 5, targets: "all", desc: "对全体敌人造成2段{0.11倍最大生命|red}伤害", effects: [{ type: "damage", coeff: 0.11, statKey: "maxHp", hits: 2 }] }
  ],
  puppeteer: [
    { id: "mu_repair_wave", name: "维护波", mercRarity: "rare", cost: 22, cooldown: 3, targets: "self", desc: "修复傀儡35%生命并获得20%生命护盾", effects: [], puppetCommand: { type: "bulwark", healPct: 0.35, shieldPct: 0.2, turns: 1 } },
    { id: "mu_annihilation", name: "歼灭演算", mercRarity: "legendary", cost: 44, cooldown: 5, targets: "all", desc: "傀儡对全体造成{1.45倍法强|red}伤害", effects: [], puppetCommand: { type: "strike", coeff: 1.45, aoe: true } }
  ]
};
DATA.passiveSkillTree = [
  { classId: "warrior", id: "steel_will", tier: 1, name: "钢铁意志", icon: "🛡️", cost: 1, desc: "生命值低于{30%|red}时，受到的所有伤害{减少15%|blue}" },
  { classId: "warrior", id: "thorn_armor", tier: 2, name: "荆棘铠甲", icon: "🌵", cost: 2, desc: "受到敌人的直接攻击伤害时，向攻击者反弹{8%伤害|red}" },
  { classId: "warrior", id: "revenge", tier: 2, name: "复仇之怒", icon: "🔥", cost: 2, desc: "生命值低于{50%|red}时，造成的伤害{+15%|red}" },
  { classId: "warrior", id: "unyielding", tier: 2, name: "坚韧不拔", icon: "❤️", cost: 2, desc: "每回合开始时恢复{3%最大生命|green}" },
  { classId: "warrior", id: "death_grip", tier: 3, name: "孤注一掷", icon: "⚔️", cost: 3, desc: "每场战斗首次受到致命伤害时，保留{1HP|red}并获得{20%最大生命|blue}护盾" },
  { classId: "mage", id: "mage_arcane_efficiency", tier: 1, name: "奥术节流", icon: "🔷", cost: 1, desc: "消耗能量的技能能量消耗{-3|blue}，最低为1" },
  { classId: "mage", id: "mage_elemental_amp", tier: 2, name: "元素增幅", icon: "🔥", cost: 2, desc: "火球、冰霜、闪电与陨星技能伤害{+12%|red}" },
  { classId: "mage", id: "mage_mana_barrier", tier: 2, name: "法力屏障", icon: "🛡️", cost: 2, desc: "魔法护盾的护盾量{+25%|blue}；拥有护盾时受到伤害{-8%|blue}" },
  { classId: "mage", id: "mage_mana_surge", tier: 2, name: "魔力回涌", icon: "💠", cost: 2, desc: "每场战斗首次在施法后能量低于20时，恢复{30能量|green}" },
  { classId: "mage", id: "mage_arcane_release", tier: 3, name: "奥能倾泻", icon: "🌠", cost: 3, desc: "释放终极技能后恢复{20能量|green}，其他技能冷却{-1回合|blue}" },
  { classId: "ranger", id: "ranger_precision", tier: 1, name: "精准校射", icon: "🎯", cost: 1, desc: "单体伤害技能造成的伤害{+8%|red}" },
  { classId: "ranger", id: "ranger_final_volley", tier: 2, name: "连珠箭术", icon: "🏹", cost: 2, desc: "多段技能最后一击伤害{+25%|red}" },
  { classId: "ranger", id: "ranger_gale_hunt", tier: 2, name: "破风追猎", icon: "🌪️", cost: 2, desc: "攻击带有猎杀标记或破甲的目标时，伤害{+10%|red}（不叠加）" },
  { classId: "ranger", id: "ranger_tumble_shot", tier: 2, name: "乘风翻滚", icon: "💨", cost: 2, desc: "使用翻滚后，下一个伤害技能的伤害{+20%|red}" },
  { classId: "ranger", id: "ranger_roaming_instinct", tier: 3, name: "游猎本能", icon: "🦅", cost: 3, desc: "若上一回合未损失生命，本回合首个伤害技能伤害{+18%|red}" },
  { classId: "priest", id: "priest_mercy", tier: 1, name: "仁慈之光", icon: "✨", cost: 1, desc: "治疗量{+10%|green}" },
  { classId: "priest", id: "priest_prayer_afterglow", tier: 2, name: "祷言余辉", icon: "🛡️", cost: 2, desc: "由自身技能施加的护盾量{+20%|blue}" },
  { classId: "priest", id: "priest_purifying_grace", tier: 2, name: "净化恩典", icon: "💧", cost: 2, desc: "成功净化减益后，治疗目标{8%最大生命|green}" },
  { classId: "priest", id: "priest_blessing_extension", tier: 2, name: "祝福延续", icon: "🙏", cost: 2, desc: "由自身施加的增益持续时间{+1回合|blue}" },
  { classId: "priest", id: "priest_holy_echo", tier: 3, name: "圣光回响", icon: "☀️", cost: 3, desc: "每第3次使用治疗技能，为受疗目标附加相当于本次实际治疗量{30%|blue}的护盾" },
  { classId: "assassin", id: "assassin_deadly_instinct", tier: 1, name: "致命本能", icon: "🗡️", cost: 1, desc: "暴击伤害{+15%|red}" },
  { classId: "assassin", id: "assassin_poison_mastery", tier: 2, name: "淬毒专精", icon: "☠️", cost: 2, desc: "自身施加的中毒伤害{+25%|red}" },
  { classId: "assassin", id: "assassin_shadow_counter", tier: 2, name: "暗影回击", icon: "🌑", cost: 2, desc: "闪避后，下一个直接伤害技能的伤害{+20%|red}" },
  { classId: "assassin", id: "assassin_flaw_hunt", tier: 2, name: "破绽猎杀", icon: "🔪", cost: 2, desc: "攻击带有猎杀标记的目标时，无视其{20%防御|red}" },
  { classId: "assassin", id: "assassin_cold_rhythm", tier: 3, name: "冷血节奏", icon: "❄️", cost: 3, desc: "每回合首次暴击时，使剩余冷却最高的非终极技能冷却{-1回合|blue}" },
  { classId: "vampire", id: "vampire_blood_drain", tier: 1, name: "血液汲取", icon: "🩸", cost: 1, desc: "已有吸血效果额外获得{5个百分点|green}吸血" },
  { classId: "vampire", id: "vampire_blood_boil", tier: 2, name: "鲜血沸腾", icon: "🔥", cost: 2, desc: "生命值低于{50%|red}时，造成伤害{+12%|red}" },
  { classId: "vampire", id: "vampire_coagulation", tier: 2, name: "凝血护体", icon: "🛡️", cost: 2, desc: "吸血溢出治疗的{50%|blue}转为护盾，护盾上限为{15%最大生命|blue}" },
  { classId: "vampire", id: "vampire_pact_backlash", tier: 2, name: "血契反噬", icon: "📜", cost: 2, desc: "释放血之契约后恢复{10能量|green}，下一个直接伤害技能伤害{+20%|red}" },
  { classId: "vampire", id: "vampire_blood_resonance", tier: 3, name: "鲜血共鸣", icon: "💞", cost: 3, desc: "每回合首次吸血时恢复{10能量|green}，并以实际自疗量的{50%|green}治疗生命最低的其他友军" },
  { classId: "druid", id: "druid_thick_bark", tier: 1, name: "厚实树皮", icon: "🌳", cost: 1, desc: "最大生命{+8%|green}，同时增强最大生命系数技能" },
  { classId: "druid", id: "druid_thorn_growth", tier: 2, name: "荆棘滋长", icon: "🌿", cost: 2, desc: "荆棘反伤造成的伤害{+35%|red}" },
  { classId: "druid", id: "druid_natural_recovery", tier: 2, name: "自然复苏", icon: "🍃", cost: 2, desc: "每回合开始时恢复{2%最大生命|green}" },
  { classId: "druid", id: "druid_form_mastery", tier: 2, name: "形态精通", icon: "🐻", cost: 2, desc: "熊形态与猛禽形态持续时间{+1回合|blue}" },
  { classId: "druid", id: "druid_natural_cycle", tier: 3, name: "自然轮回", icon: "♻️", cost: 3, desc: "使用3个不同的德鲁伊技能后，恢复{8%最大生命|green}与{15能量|green}，随后重置计数" },
  { classId: "puppeteer", id: "puppeteer_reinforced_core", tier: 1, name: "强化核心", icon: "⚙️", cost: 1, desc: "机关傀儡最大生命{+10%|green}" },
  { classId: "puppeteer", id: "puppeteer_precision_drive", tier: 2, name: "精密传动", icon: "🦾", cost: 2, desc: "攻击指令造成的伤害{+10%|red}" },
  { classId: "puppeteer", id: "puppeteer_maintenance_matrix", tier: 2, name: "维护矩阵", icon: "🔧", cost: 2, desc: "傀儡受到的修复量与指令护盾量{+15%|green}" },
  { classId: "puppeteer", id: "puppeteer_substitute_protocol", tier: 2, name: "替身协议", icon: "🧵", cost: 2, desc: "移形换位的转移伤害减免由25%提高至{35%|blue}" },
  { classId: "puppeteer", id: "puppeteer_cycle_protocol", tier: 3, name: "攻守轮转", icon: "🔄", cost: 3, desc: "非攻击指令使下次攻击指令伤害{+20%|red}；攻击指令使下次守御或重构效果{+20%|green}" }
];
function startSetup() {
  state.setup = { mode: "normal", classId: "warrior", secondClassId: "mage" };
  state.activeMode = "normal";
  state.screen = "setup";
  state.modal = null;
  state.reincarnationResult = null;
  render();
}
function beginDraft() {
  const maxPicks = 3;
  state.activeMode = normalizeRunSaveMode(state.setup.mode);
  state.draft = { pickIndex: 0, maxPicks, candidates: rollTalentCandidates(1, []) };
  state.screen = "draft";
  state.run = createRunSkeleton();
  state.eventResult = null;
  state.shopOpen = false;
  state.reincarnationResult = null;
  render();
}
function createRunSkeleton() {
  var _a;
  const mode = normalizeRunSaveMode(state.setup.mode);
  const modeDef = gameMode(mode);
  const climbLevel = mode === "climb" ? normalizeClimbLevel(((_a = state.setup) == null ? void 0 : _a.climbLevel) || CLIMB_MIN_LEVEL, climbUnlockedLevel()) : 0;
  const cls = getClass(state.setup.classId);
  const run = {
    mode,
    climbLevel,
    difficultyMultiplier: mode === "climb" ? climbEnemyBaseMultiplier(climbLevel) : modeDef.difficulty,
    talentPointMultiplier: mode === "climb" ? climbTalentPointMultiplier(climbLevel) : modeDef.difficulty,
    endFloor: mode === "climb" ? 100 : modeDef.endFloor,
    hardcoreMode: false,
    dualHeroMode: false,
    classId: cls.id,
    secondClassId: "",
    floor: 1,
    gold: 50,
    level: 1,
    exp: 0,
    skillPoints: growthLevel("g_init_sp"),
    abilityPoints: { str: 0, agi: 0, int: 0, con: 0 },
    learnedSkills: {},
    skillLevels: {},
    equippedSkills: [],
    skillPassiveTreeVersion: SKILL_PASSIVE_TREE_VERSION,
    unlockedSkillPassives: { first: {}, second: {} },
    talents: [],
    equipment: {},
    enhanceLevels: {},
    equipmentLocks: {},
    items: { heal_potion: 1 },
    party: [],
    currentHp: {},
    currentEnergy: {},
    buffs: {},
    eventBonuses: { hp: 0, atk: 0, matk: 0, def: 0, energyRegen: 0, hpRegen: 0, statusRes: 0 },
    hiddenStacks: { hp: 0, atk: 0, matk: 0, def: 0 },
    ironHeartLastFloor: 0,
    log: [],
    alive: true,
    promoted: false,
    tier2Promoted: false,
    bountyReward: false,
    tacticBoost: false,
    messengerGoldBonus: false,
    dmgEscalateStacks: 0,
    divineAccumulationStacks: 0,
    phoenixUsed: false,
    adTalentRerollFloors: {},
    adReviveUsed: false,
    bossStoryChoices: {}
  };
  run.party.push({ unitId: "player", classId: cls.id, name: "你", isPlayer: true, isHero: true });
  for (const m of run.party) {
    const stats = calcUnitStats(m, run);
    run.currentHp[m.unitId] = stats.hp;
    run.currentEnergy[m.unitId] = stats.energy || 100;
  }
  initializeSkillState(run);
  return run;
}
function rollTalentCandidates(pickIndex, selectedTalents, rareWeightMultiplier = 1) {
  var _a, _b, _c2;
  if (pickIndex === 1) return shuffle(DATA.hiddenTalents).slice(0, 3);
  const selectedIds = new Set(selectedTalents.map((t) => t.id));
  const baseClass = getBaseClassId(((_a = state.run) == null ? void 0 : _a.classId) || state.setup.classId);
  const pool = DATA.talents.filter((t) => {
    var _a2;
    if (selectedIds.has(t.id)) return false;
    if (!t.classReq) return true;
    return t.classReq === baseClass || t.classReq === ((_a2 = state.run) == null ? void 0 : _a2.classId);
  });
  const rarityWeight = { common: 38, rare: 25, epic: 14, legendary: 7, mythic: 3 };
  const rewardedRarityMultiplier = Math.max(1, Number(rareWeightMultiplier) || 1);
  const rareBonus = ((_b = state.run) == null ? void 0 : _b.hardcoreMode) ? 0 : growthLevel("g_mythic_w");
  const pityReduction = ((_c2 = state.run) == null ? void 0 : _c2.hardcoreMode) ? 0 : growthLevel("g_pity");
  const pity = state.perm.pityCounter >= Math.max(6, 15 - pityReduction);
  const count = selectedTalents.some((t) => t.passive === "reincarnation_admin") ? 4 : 3;
  const chosen = [];
  const used = /* @__PURE__ */ new Set();
  while (chosen.length < count && used.size < pool.length) {
    let total = 0;
    const weights = pool.map((t, idx) => {
      if (used.has(idx)) return 0;
      let w = rarityWeight[t.rarity] || 10;
      const isRareOrBetter = ["rare", "epic", "legendary", "mythic"].includes(t.rarity);
      if (isRareOrBetter) w += rareBonus * ({ rare: 0.5, epic: 1, legendary: 2, mythic: 3 }[t.rarity] || 0);
      if (pity && t.rarity === "mythic") w += 60;
      if (isRareOrBetter) w *= rewardedRarityMultiplier;
      total += w;
      return w;
    });
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0 && !used.has(i)) {
        used.add(i);
        chosen.push(pool[i]);
        break;
      }
    }
  }
  return chosen.length ? chosen : shuffle(pool).slice(0, count);
}
function selectDraftTalent(talentId) {
  const talent = state.draft.candidates.find((t) => t.id === talentId);
  if (!talent || !state.run) return;
  state.run.talents.push(talent);
  state.perm.unlockedTalents[talent.id] = true;
  if (talent.rarity === "mythic" || talent.rarity === "hidden") state.perm.pityCounter = 0;
  else state.perm.pityCounter += 1;
  applyTalentOnPick(talent);
  if (talent.passive === "reincarnation_admin") {
    state.draft.maxPicks = 4;
  }
  state.draft.pickIndex += 1;
  if (state.draft.pickIndex >= state.draft.maxPicks) {
    finishDraft();
    return;
  }
  state.draft.candidates = rollTalentCandidates(state.draft.pickIndex + 1, state.run.talents);
  saveGame();
  render();
}
function applyTalentOnPick(talent) {
  if (!state.run) return;
  if (talent.passive === "init_gold") state.run.gold += 100;
  if (talent.passive === "init_potion") {
    addItem("heal_potion", 1);
    addItem("energy_potion", 1);
  }
  if (talent.passive === "init_free_merc") {
    state.run.nextMercFree = true;
    addRunLog("一张免费佣兵招募券已送达酒馆。");
  }
}
function finishDraft() {
  state.floorEvents = generateFloorEvents(1);
  state.eventIdx = 0;
  state.eventResult = null;
  state.shopOpen = false;
  refreshPartyHpCaps();
  addRunLog("轮回开始。觉醒的天赋在灵魂中燃起。");
  state.screen = "tower";
  saveGame();
  playMusic("tower");
  render();
}
function getBaseClassId(classId) {
  const cls = DATA.classes[classId];
  return (cls == null ? void 0 : cls.baseOf) || PROMOTION_BASE_CLASS[classId] || classId;
}
function safeToken(value, fallback = "default") {
  const token = String(value || fallback).replace(/[^a-z0-9_-]/gi, "");
  return token || fallback;
}
function classArtId(classId) {
  return safeToken(getBaseClassId(classId || "warrior"), "warrior");
}
function classPortraitUrl(classId) {
  return CLASS_PORTRAIT_ART[classArtId(classId)] || CLASS_PORTRAIT_ART.warrior;
}
function classPortraitStyle(classId) {
  return "style=\"--portrait-image:url('".concat(classPortraitUrl(classId), "')\"");
}
function enemyPortraitId(unit) {
  var _a;
  return safeToken(((_a = unit == null ? void 0 : unit.template) == null ? void 0 : _a.id) || (unit == null ? void 0 : unit.id) || "", "");
}
function enemyPortraitUrl(unit) {
  return ENEMY_PORTRAIT_ART[enemyPortraitId(unit)] || CLASS_PORTRAIT_ART.enemy;
}
function renderClassPortrait(classId, className = "class-portrait", { showBadge = true } = {}) {
  const cls = getClass(classId || "warrior");
  const artId = classArtId(classId || cls.id);
  return '<div class="'.concat(className, " portrait-").concat(artId, '" ').concat(classPortraitStyle(classId || cls.id), ">").concat(showBadge ? "<span>".concat(esc(cls.icon || ""), "</span>") : "", "</div>");
}
function renderEquipArt(slot, className = "equip-art", rarity = "") {
  const slotToken = safeToken(slot, "unknown");
  const rarityToken = rarity ? safeToken(rarity, "white") : "";
  const frameClass = rarityToken ? " equipment-art-frame rarity-".concat(rarityToken) : "";
  return '<span class="'.concat(className).concat(frameClass, '" aria-hidden="true"><span class="equip-art-image equip-art-').concat(slotToken, '"></span></span>');
}
function renderSkillIcon(skill) {
  const id = safeToken(skill == null ? void 0 : skill.id, "attack");
  const art = SKILL_EFFECT_ART[id] || IMPACT_FALLBACK_ART.damage;
  return '<span class="skill-icon skill-icon-'.concat(id, '" style="--skill-icon:url(\'').concat(art, '\')" aria-hidden="true"></span>');
}
function enemyTier(unit) {
  var _a, _b, _c2, _d2;
  const id = String(((_a = unit == null ? void 0 : unit.template) == null ? void 0 : _a.id) || "");
  if (id.startsWith("boss_") || ((_c2 = (_b = unit == null ? void 0 : unit.template) == null ? void 0 : _b.mechanics) == null ? void 0 : _c2.length)) return "boss";
  if (((_d2 = unit == null ? void 0 : unit.template) == null ? void 0 : _d2.isElite) || (unit == null ? void 0 : unit.isElite) || id.startsWith("elite_")) return "elite";
  return "normal";
}
function unitPortraitFrameClass(unit) {
  if (!(unit == null ? void 0 : unit.alive)) return "portrait-frame frame-dead";
  if (unit.side === "enemy") return "portrait-frame frame-enemy frame-".concat(enemyTier(unit));
  if (unit.isCommandPuppet) return "portrait-frame frame-puppet";
  if (unit.isMerc) return "portrait-frame frame-merc";
  return "portrait-frame frame-hero";
}
function eventIconId(event) {
  if (!event || typeof event === "string") return "";
  return safeToken(event.id || event.eventId, "");
}
function renderEventIcon(event, className = "event-icon-art") {
  const fallbackIcon = typeof event === "string" ? event : (event == null ? void 0 : event.icon) || (event == null ? void 0 : event.eventIcon) || "✦";
  const art = EVENT_ICON_ART[eventIconId(event)];
  if (!art) return '<span class="'.concat(className, ' event-icon-fallback" aria-hidden="true">').concat(esc(fallbackIcon), "</span>");
  return '<span class="'.concat(className, ' event-icon-art" style="--event-icon:url(\'').concat(art, '\')" aria-hidden="true"></span>');
}
function renderEventBadge(event) {
  return '<div class="event-scene-badge">'.concat(renderEventIcon(event, "event-badge-icon"), "</div>");
}
function eventRarityId(event) {
  var _a;
  const rarity = safeToken(event == null ? void 0 : event.rarity, "common");
  return ((_a = DATA.eventRarities) == null ? void 0 : _a[rarity]) ? rarity : "common";
}
function eventSpawnWeight(event) {
  var _a, _b;
  const rarityWeight = Number((_b = (_a = DATA.eventRarities) == null ? void 0 : _a[eventRarityId(event)]) == null ? void 0 : _b.weight);
  const eventWeight = Number(event == null ? void 0 : event.weight);
  const baseWeight = Number.isFinite(rarityWeight) ? Math.max(0, rarityWeight) : 0;
  const multiplier = Number.isFinite(eventWeight) ? Math.max(0, eventWeight) : 1;
  return baseWeight * multiplier;
}
function pickWeightedEvent(events) {
  const candidates = (events || []).filter(Boolean);
  if (!candidates.length) return null;
  const weighted = candidates.filter((event) => eventSpawnWeight(event) > 0);
  const pool = weighted.length ? weighted : candidates;
  const total = pool.reduce((sum, event) => sum + eventSpawnWeight(event), 0);
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
  let roll = Math.random() * total;
  for (const event of pool) {
    roll -= eventSpawnWeight(event);
    if (roll <= 0) return event;
  }
  return pool[pool.length - 1];
}
function renderEventRarity(event, className = "event-rarity-label") {
  const rarity = eventRarityId(event);
  return '<span class="'.concat(className, " event-rarity-").concat(rarity, '">').concat(esc(DATA.eventRarities[rarity].name), "</span>");
}
function eventSceneClass(event) {
  const scene = EVENT_SCENE_BY_ID[event == null ? void 0 : event.id] || EVENT_SCENE_BY_TYPE[event == null ? void 0 : event.type] || "tower";
  return "scene-".concat(safeToken(scene, "tower"));
}
function combatSceneClass(combat) {
  const enemies = (combat == null ? void 0 : combat.enemies) || [];
  if (enemies.some((e) => {
    var _a, _b, _c2, _d2;
    return ((_b = (_a = e.template) == null ? void 0 : _a.mechanics) == null ? void 0 : _b.length) || ((_d2 = (_c2 = e.template) == null ? void 0 : _c2.id) == null ? void 0 : _d2.startsWith("boss_"));
  })) return "scene-boss";
  const tags = new Set(enemies.map((e) => e.tag).filter(Boolean));
  if (tags.has("dragon") || tags.has("demon") || tags.has("elemental")) return "scene-inferno";
  if (tags.has("plant") || tags.has("beast")) return "scene-wild";
  if (tags.has("undead") || tags.has("construct")) return "scene-crypt";
  return "scene-combat";
}
function renderUnitPortrait(unit) {
  if (!(unit == null ? void 0 : unit.alive)) {
    return '<div class="unit-portrait unit-portrait-dead '.concat(unitPortraitFrameClass(unit), '"><span>☠️</span></div>');
  }
  if (unit.side === "enemy") {
    const art = enemyPortraitUrl(unit);
    const hasCustomArt = art !== CLASS_PORTRAIT_ART.enemy;
    const tier = enemyTier(unit);
    return '<div class="unit-portrait enemy-portrait enemy-'.concat(safeToken(unit.tag, "unknown"), " enemy-tier-").concat(tier, " ").concat(unitPortraitFrameClass(unit), " ").concat(hasCustomArt ? "enemy-custom-portrait" : "", '" style="--portrait-image:url(\'').concat(art, "')\">").concat(hasCustomArt ? "" : "<span>".concat(esc(unit.icon || ""), "</span>"), "</div>");
  }
  if (unit.isCommandPuppet) {
    const art = SUMMON_PORTRAIT_ART.commandPuppet;
    return '<div class="unit-portrait ally-portrait puppet-portrait '.concat(unitPortraitFrameClass(unit), '" style="--portrait-image:url(\'').concat(art, "')\"><span>🤖</span></div>");
  }
  return renderClassPortrait(unit.classId, "unit-portrait ally-portrait ".concat(unit.isMerc ? "merc-portrait" : "", " ").concat(unitPortraitFrameClass(unit)));
}
function generateFloorEvents(floor) {
  const totalCount = Math.min(10, 6 + Math.floor((floor - 1) / 5));
  const reserved = 1;
  const showTavern = floor % 2 === 1;
  const showShop = !showTavern;
  const eventCount = Math.max(2, totalCount - reserved - (showTavern ? 1 : 0) - (showShop ? 1 : 0));
  const combatCount = Math.min(eventCount - 1, Math.max(1, Math.floor(eventCount * 0.5 + 0.5)));
  const nonCombatCount = eventCount - combatCount;
  const combatPool = [];
  const eliteChance = Math.min(0.5, 0.1 + floor * 0.02);
  for (let i = 0; i < combatCount; i += 1) {
    const isElite = Math.random() < eliteChance;
    const encounter = createEnemyEncounter(floor, isElite ? "elite" : "normal");
    combatPool.push({ event: combatEvent(isElite ? "elite" : "normal", encounter), encounter });
  }
  const eligibleEvents = DATA.events.filter((event) => event.type !== "combat" && (event.minFloor || 0) <= floor && (event.maxFloor == null || event.maxFloor >= floor));
  const nonCombatPool = [];
  if (floor >= 20) {
    const highTierEvent = pickWeightedEvent(eligibleEvents.filter((event) => (event.minFloor || 0) >= 10));
    if (highTierEvent) {
      nonCombatPool.push(floorEventWrap(highTierEvent, floor));
      eligibleEvents.splice(eligibleEvents.indexOf(highTierEvent), 1);
    }
  }
  for (let i = nonCombatPool.length; i < nonCombatCount && eligibleEvents.length; i += 1) {
    const event = pickWeightedEvent(eligibleEvents);
    if (!event) break;
    nonCombatPool.push(floorEventWrap(event, floor));
    eligibleEvents.splice(eligibleEvents.indexOf(event), 1);
  }
  const mixed = interleaveFloorEvents(combatPool, nonCombatPool);
  if (showShop) mixed.splice(rng(0, mixed.length), 0, { event: itemShopEvent() });
  if (showTavern) mixed.splice(rng(0, mixed.length), 0, { event: tavernEvent() });
  const bossEncounter = createEnemyEncounter(floor, "boss");
  const boss = bossEncounter.preview;
  mixed.push({
    event: {
      id: "evt_boss",
      name: "Boss: ".concat(boss.name),
      icon: boss.icon,
      type: "boss",
      rarity: "legendary",
      text: "".concat(boss.desc || "塔中的守护者正等待你的挑战。").concat(boss.mechanicHint ? "\n⭐ 招牌机制：".concat(boss.mechanicHint) : "").concat(bossEncounter.isDoubleBoss ? "\n⚠️ 双Boss联手出现。" : ""),
      choices: [{ text: "决一死战", result: "fight_boss" }]
    },
    encounter: bossEncounter,
    bossData: bossEncounter
  });
  return mixed.map((e, index) => ({ ...e, done: false, index }));
}
function interleaveFloorEvents(combatPool, nonCombatPool) {
  const events = [];
  let ci = 0;
  let ni = 0;
  let combatStreak = 0;
  let nonCombatStreak = 0;
  while (ci < combatPool.length || ni < nonCombatPool.length) {
    let addCombat;
    if (ci >= combatPool.length) addCombat = false;
    else if (ni >= nonCombatPool.length) addCombat = true;
    else if (combatStreak >= 2) addCombat = false;
    else if (nonCombatStreak >= 2) addCombat = true;
    else if (combatStreak === 1) addCombat = Math.random() < 0.35;
    else if (nonCombatStreak === 1) addCombat = Math.random() < 0.65;
    else addCombat = Math.random() < 0.5;
    if (addCombat) {
      events.push(combatPool[ci++]);
      combatStreak += 1;
      nonCombatStreak = 0;
    } else {
      events.push(nonCombatPool[ni++]);
      nonCombatStreak += 1;
      combatStreak = 0;
    }
  }
  return events;
}
function combatEvent(kind, encounter = null) {
  var _a;
  const formationName = ((_a = encounter == null ? void 0 : encounter.formation) == null ? void 0 : _a.name) ? "敌军编队「".concat(encounter.formation.name, "」。") : "";
  if (kind === "elite") {
    return { id: "evt_combat_elite", name: "精英遭遇", icon: "💀", type: "combat", rarity: "rare", text: "强大的气息从前方涌来。".concat(formationName), choices: [{ text: "挑战精英", result: "fight_elite" }] };
  }
  return { id: "evt_combat_normal", name: "遭遇战", icon: "⚔️", type: "combat", rarity: "common", text: "前方通道中传来低沉的咆哮声。".concat(formationName), choices: [{ text: "迎战", result: "fight_normal" }] };
}
function floorEventWrap(event, floor) {
  if ((event == null ? void 0 : event.id) === "evt_bounty_board") {
    return { event, encounter: createEnemyEncounter(floor, "elite") };
  }
  if ((event == null ? void 0 : event.id) === "evt_time_rift") {
    return { event, encounter: createEnemyEncounter(floor, "elite") };
  }
  if ((event == null ? void 0 : event.id) === "evt_immortal_throne") {
    return { event, encounter: createImmortalThroneEncounter(floor) };
  }
  return { event };
}
function itemShopEvent() {
  return { id: "evt_item_shop", name: "行商", icon: "🎒", type: "shop", rarity: "common", text: "一位神秘的行商拦住了你，打开了装满药剂和卷轴的背包。", choices: [{ text: "🎒 浏览道具", result: "buy_item", desc: "购买消耗品道具" }, { text: "离开", result: "nothing" }] };
}
function tavernEvent() {
  return { id: "evt_tavern", name: "佣兵酒馆", icon: "🍺", type: "tavern", rarity: "common", text: "喧闹酒馆里，各路佣兵在此等待雇主。", choices: [{ text: "招募佣兵", result: "tavern_recruit" }, { text: "整备复苏", result: "tavern_rest", cost: 50 }, { text: "离开", result: "nothing" }] };
}
function getEnemyStage(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  return DATA.enemyStages.find((stage) => level >= stage.minFloor && (stage.maxFloor == null || level <= stage.maxFloor)) || DATA.enemyStages[DATA.enemyStages.length - 1];
}
function getBossStagePool(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  return DATA.bossStagePools.find((pool) => level >= pool.minFloor && (pool.maxFloor == null || level <= pool.maxFloor)) || DATA.bossStagePools[DATA.bossStagePools.length - 1];
}
function getChapterBossForFloor(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  return DATA.chapterBosses[level] || null;
}
function makeFormationTemplate(template, formation, kind, stage, extra = {}) {
  var _a, _b, _c2, _d2, _e2, _f2, _g;
  const count = Math.max(1, ((_a = formation == null ? void 0 : formation.unitIds) == null ? void 0 : _a.length) || 1);
  const formationScale = (formation == null ? void 0 : formation.formationScale) || {};
  const hpScale = (_e2 = (_d2 = (_b = extra.hpScale) != null ? _b : formationScale.hp) != null ? _d2 : (_c2 = DATA.enemyFormationScales[kind]) == null ? void 0 : _c2[count]) != null ? _e2 : 1;
  const statScale = (_g = (_f2 = extra.statScale) != null ? _f2 : formationScale.stat) != null ? _g : 1 + (hpScale - 1) / 10;
  return {
    ...template,
    ...extra,
    role: DATA.enemyTemplateRoles[template.id] || "怪物",
    formationId: (formation == null ? void 0 : formation.id) || "solo",
    formationName: (formation == null ? void 0 : formation.name) || template.name,
    formationHpScale: hpScale,
    formationStatScale: statScale,
    stageId: (stage == null ? void 0 : stage.id) || "recruit"
  };
}
function selectEnemyFormation(floor, kind, stage) {
  var _a, _b;
  const pool = ((_a = DATA.enemyFormations[kind]) == null ? void 0 : _a[stage.id]) || ((_b = DATA.enemyFormations[kind]) == null ? void 0 : _b.recruit) || [];
  const available = pool.filter((formation) => floor >= (formation.minFloor || 1) && (formation.maxFloor == null || floor <= formation.maxFloor));
  return pick(available.length ? available : pool);
}
function enemyBonusSkillsForFloor(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  if (level <= 50) return 0;
  if (level <= 100) return 1;
  if (level <= 150) return 2;
  return 3;
}
function activeEnemySkills(template, floor) {
  var _a;
  const skills = template.skills || ["e_attack"];
  if (template.isBoss) return [...skills];
  const baseSlots = (_a = template.skillSlots) != null ? _a : template.isElite ? Math.min(3, skills.length) : Math.min(2, skills.length);
  const slots = Math.max(1, Math.min(skills.length, baseSlots + enemyBonusSkillsForFloor(floor)));
  return skills.slice(0, slots);
}
function enemyPassiveAffixCountForFloor(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  let count = 0;
  while (count < 10 && level >= 5 * (count + 1) * (count + 2)) count += 1;
  return count;
}
function enemyPassiveAffixQualityForFloor(floor) {
  const level = Math.max(1, Math.floor(floor || 1));
  const progress = clamp((level - 1) / 9999, 0, 1);
  const weights = [
    { id: "common", weight: 6 - 4 * progress },
    { id: "rare", weight: 3 + 3 * progress },
    { id: "legendary", weight: 1 + progress }
  ];
  let roll = Math.random() * weights.reduce((total, entry) => total + entry.weight, 0);
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll < 0) return entry.id;
  }
  return "legendary";
}
function rollEnemyPassiveAffixes(floor, excludedMechanics = [], countOverride = null) {
  const count = Number.isInteger(countOverride) ? Math.max(0, countOverride) : enemyPassiveAffixCountForFloor(floor);
  const excluded = new Set(excludedMechanics || []);
  const available = DATA.enemyPassiveAffixes.filter((affix) => !excluded.has(affix.mechanic));
  const result = [];
  for (let index = 0; index < count && available.length; index += 1) {
    const quality = enemyPassiveAffixQualityForFloor(floor);
    const qualityPool = available.filter((affix2) => affix2.quality === quality);
    const affix = pick(qualityPool.length ? qualityPool : available);
    result.push({ ...affix, effects: { ...affix.effects || {} } });
    available.splice(available.indexOf(affix), 1);
  }
  return result;
}
function assignEnemyPassiveAffixes(templates, floor) {
  for (const template of templates || []) template.passiveAffixes = rollEnemyPassiveAffixes(floor);
  return templates;
}
function climbExtraAffixCount(kind, run = state.run) {
  const effects = climbEffects(run);
  if (kind === "boss") return Math.max(0, Math.floor(effects.bossExtraAffixes || 0));
  if (kind === "elite") return Math.max(0, Math.floor(effects.eliteExtraAffixes || 0));
  return Math.max(0, Math.floor(effects.normalExtraAffixes || 0));
}
function appendClimbEnemyAffixes(templates, floor, kind) {
  const extraCount = climbExtraAffixCount(kind);
  if (!extraCount) return templates;
  for (const template of templates || []) {
    const current = template.passiveAffixes || [];
    const excluded = current.map((affix) => affix.mechanic).filter(Boolean);
    template.passiveAffixes = [...current, ...rollEnemyPassiveAffixes(floor, excluded, extraCount)];
  }
  return templates;
}
function enemyPassiveAffixEffects(affixes = []) {
  const totals = {};
  for (const affix of affixes) {
    for (const [key, value] of Object.entries((affix == null ? void 0 : affix.effects) || {})) totals[key] = (totals[key] || 0) + (Number(value) || 0);
  }
  return totals;
}
function enemyPassiveAffixLabel(affix) {
  return (affix == null ? void 0 : affix.name) || "未知词条";
}
function enemyPassiveAffixLogLabel(affix) {
  const quality = DATA.enemyPassiveAffixQualities[affix == null ? void 0 : affix.quality] || DATA.enemyPassiveAffixQualities.common;
  return "{".concat(enemyPassiveAffixLabel(affix), "|").concat(quality.id, "}");
}
function enemyPassiveAffixByMechanic(unit, mechanic) {
  if ((unit == null ? void 0 : unit.side) !== "enemy") return null;
  return (unit.passiveAffixes || []).find((affix) => (affix == null ? void 0 : affix.mechanic) === mechanic) || null;
}
function enemyPassiveAffixState(unit) {
  unit.passiveAffixState || (unit.passiveAffixState = {});
  return unit.passiveAffixState;
}
function logEnemyPassiveAffix(unit, affix, detail) {
  if (affix) combatLog("✦ ".concat(unit.name, " 触发").concat(enemyPassiveAffixLogLabel(affix), "：").concat(detail));
}
function grantEnemyPassiveShield(target, pct2, owner, affix, detail) {
  if (!(target == null ? void 0 : target.alive) || pct2 <= 0) return 0;
  const amount = Math.max(1, Math.floor(target.maxHp * pct2));
  target.shield += amount;
  emitCombatFloat(target, "+".concat(amount), "shield");
  logEnemyPassiveAffix(owner, affix, detail || "".concat(target.name, " 获得 ").concat(amount, " 护盾。"));
  return amount;
}
function queueEnemyExtraAction(enemy, affix, detail) {
  const c = state.combat;
  if (!c || !(enemy == null ? void 0 : enemy.alive)) return false;
  const idx = c.enemies.indexOf(enemy);
  if (idx < 0) return false;
  const target = pickAllyTarget();
  const skillId = pickEnemySkill(enemy, target, { allowCharge: false });
  const skill = DATA.enemySkills[skillId] || DATA.enemySkills.e_attack;
  c.order.splice(c.currentIdx, 0, { side: "enemy", idx, skillId, targetUnitId: (target == null ? void 0 : target.unitId) || "", extra: true });
  logEnemyPassiveAffix(enemy, affix, "".concat(detail || "获得一次额外行动。", "追加「").concat(skill.name, "」。"));
  return true;
}
function applyEnemyPassiveAffixBattleStart() {
  const c = state.combat;
  if (!c) return;
  for (const enemy of c.enemies.filter((unit) => unit.alive)) {
    const barrier = enemyPassiveAffixByMechanic(enemy, "shield_rebuild");
    if (barrier) grantEnemyPassiveShield(enemy, barrier.startShieldPct || 0, enemy, barrier, "开战获得 ".concat(Math.round((barrier.startShieldPct || 0) * 100), "% 最大生命护盾。"));
    const overlord = enemyPassiveAffixByMechanic(enemy, "battle_command");
    if (overlord) {
      for (const ally of c.enemies.filter((unit) => unit.alive)) applyBuff(ally, "strengthen", 2);
      logEnemyPassiveAffix(enemy, overlord, "全体敌军获得强化 2 回合。 ");
    }
  }
}
function triggerEnemyBattleSpirit(unit) {
  const affix = enemyPassiveAffixByMechanic(unit, "stun_breakout");
  const affixState = enemyPassiveAffixState(unit);
  if (!affix || affixState.stunBreakoutUsed) return false;
  affixState.stunBreakoutUsed = true;
  delete unit.buffs.stun;
  applyBuff(unit, "strengthen", 2);
  logEnemyPassiveAffix(unit, affix, "解除眩晕，并获得强化 2 回合。 ");
  return true;
}
function triggerEnemyPassiveAffixTurnStart(unit) {
  if (!(unit == null ? void 0 : unit.alive) || unit.side !== "enemy") return;
  const c = state.combat;
  const affixState = enemyPassiveAffixState(unit);
  const regrowth = enemyPassiveAffixByMechanic(unit, "turn_cleanse_regen");
  if (regrowth) {
    let removed = 0;
    for (const id of ["burn", "poison"]) {
      if (!unit.buffs[id]) continue;
      delete unit.buffs[id];
      removed += 1;
    }
    const healed = healRaw(unit, Math.max(1, Math.floor(unit.maxHp * (regrowth.healPct || 0))));
    if (removed || healed > 0) logEnemyPassiveAffix(unit, regrowth, "".concat(removed ? "净化 ".concat(removed, " 个持续伤害；") : "", "回复 ").concat(healed, " 生命。"));
  }
  const titanborn = enemyPassiveAffixByMechanic(unit, "third_turn_stomp");
  if (titanborn) {
    affixState.titanbornActions = (affixState.titanbornActions || 0) + 1;
    if (affixState.titanbornActions % 3 === 0) {
      logEnemyPassiveAffix(unit, titanborn, "发动践踏。 ");
      for (const ally of (c == null ? void 0 : c.allies.filter((member) => member.alive)) || []) {
        dealDamage(unit, ally, { coeff: titanborn.stompPct || 0.45, statKey: "atk", noTier2Offense: true }, "泰坦践踏");
        if (ally.alive) applyBuff(ally, "weaken", 1);
      }
    }
  }
  const aegis = enemyPassiveAffixByMechanic(unit, "second_turn_party_shield");
  if (aegis) {
    affixState.aegisActions = (affixState.aegisActions || 0) + 1;
    if (affixState.aegisActions % 2 === 0) {
      const allies = (c == null ? void 0 : c.enemies.filter((member) => member.alive)) || [];
      for (const ally of allies) {
        const amount = Math.max(1, Math.floor(ally.maxHp * (aegis.shieldPct || 0)));
        ally.shield += amount;
        emitCombatFloat(ally, "+".concat(amount), "shield");
      }
      logEnemyPassiveAffix(unit, aegis, "为全体敌军施加护盾。 ");
    }
  }
}
function triggerEnemyPassiveAffixOnHit(attacker, target, dealt) {
  if (!(attacker == null ? void 0 : attacker.alive) || attacker.side !== "enemy" || !(target == null ? void 0 : target.alive) || dealt <= 0) return;
  const affixState = enemyPassiveAffixState(attacker);
  const ferocity = enemyPassiveAffixByMechanic(attacker, "first_hit_mark");
  if (ferocity) {
    affixState.ferocityTargets || (affixState.ferocityTargets = {});
    if (!affixState.ferocityTargets[target.unitId]) {
      affixState.ferocityTargets[target.unitId] = true;
      applyBuff(target, "hunted", 2);
      logEnemyPassiveAffix(attacker, ferocity, "".concat(target.name, " 被施加“被猎杀”。"));
    }
  }
  const brute = enemyPassiveAffixByMechanic(attacker, "third_hit_break");
  if (brute) {
    affixState.bruteHits = (affixState.bruteHits || 0) + 1;
    if (affixState.bruteHits % 3 === 0) {
      applyBuff(target, "armor_break", 2);
      logEnemyPassiveAffix(attacker, brute, "".concat(target.name, " 被击破防御。"));
    }
  }
}
function triggerEnemyPassiveAffixOnDamaged(target, attacker, damage) {
  if (!(target == null ? void 0 : target.alive) || target.side !== "enemy" || damage <= 0) return;
  const fatalWillBePrevented = target.hp <= 0 && !!enemyPassiveAffixByMechanic(target, "prevent_death") && !enemyPassiveAffixState(target).undyingUsed;
  if (target.hp <= 0 && !fatalWillBePrevented) return;
  const c = state.combat;
  const affixState = enemyPassiveAffixState(target);
  const vigor = enemyPassiveAffixByMechanic(target, "first_blood_shield");
  if (vigor && !affixState.vigorUsed) {
    affixState.vigorUsed = true;
    grantEnemyPassiveShield(target, vigor.shieldPct || 0, target, vigor, "首次受伤后获得护盾。 ");
  }
  const carapace = enemyPassiveAffixByMechanic(target, "round_counter");
  if (carapace && (attacker == null ? void 0 : attacker.alive) && affixState.carapaceRound !== (c == null ? void 0 : c.turn)) {
    affixState.carapaceRound = c == null ? void 0 : c.turn;
    triggerEnemyCounterAttack(target, attacker, carapace.counterPct || 0.2, "硬壳反震");
    logEnemyPassiveAffix(target, carapace, "反震 ".concat(attacker.name, "。"));
  }
  const colossus = enemyPassiveAffixByMechanic(target, "half_hp_bulwark");
  if (colossus && !affixState.colossusUsed && target.hp / target.maxHp < 0.5) {
    affixState.colossusUsed = true;
    applyBuff(target, "fortify", 2);
    applyBuff(target, "cc_immune", 2);
    logEnemyPassiveAffix(target, colossus, "进入半血防守，获得坚韧与免控。 ");
  }
  const rage = enemyPassiveAffixByMechanic(target, "half_hp_rage");
  if (rage && !affixState.rageUsed && target.hp / target.maxHp < 0.5) {
    affixState.rageUsed = true;
    applyBuff(target, "strengthen", 3);
    queueEnemyExtraAction(target, rage, "进入狂怒，获得强化并追加一次行动。 ");
  }
  const citadel = enemyPassiveAffixByMechanic(target, "threshold_cleanse");
  if (citadel) {
    const hpPct = target.hp / target.maxHp;
    const threshold = hpPct <= 0.25 ? 3 : hpPct <= 0.5 ? 2 : hpPct <= 0.75 ? 1 : 0;
    const previousThreshold = affixState.citadelThreshold || 0;
    const stageLabels = [75, 50, 25];
    for (let stage = previousThreshold + 1; stage <= threshold; stage += 1) {
      dispelDebuffs(target, 2);
      applyBuff(target, "fortify", 2);
      logEnemyPassiveAffix(target, citadel, "进入 ".concat(stageLabels[stage - 1], "% 生命阶段，净化减益并获得坚韧。"));
    }
    affixState.citadelThreshold = Math.max(previousThreshold, threshold);
  }
  if ((attacker == null ? void 0 : attacker.alive) && c) {
    for (const guardian of c.enemies.filter((unit) => unit.alive && unit !== target)) {
      const guard = enemyPassiveAffixByMechanic(guardian, "ally_guard_counter");
      const guardState = enemyPassiveAffixState(guardian);
      if (!guard || guardState.guardRound === c.turn) continue;
      guardState.guardRound = c.turn;
      triggerEnemyCounterAttack(guardian, attacker, guard.counterPct || 0.15, "守势反击");
      logEnemyPassiveAffix(guardian, guard, "为 ".concat(target.name, " 反击 ").concat(attacker.name, "。"));
    }
  }
}
function triggerEnemyPassiveAffixOnShieldBreak(target) {
  const barrier = enemyPassiveAffixByMechanic(target, "shield_rebuild");
  const affixState = enemyPassiveAffixState(target);
  if (!barrier || affixState.barrierRebuilt) return;
  affixState.barrierRebuilt = true;
  grantEnemyPassiveShield(target, barrier.rebuildShieldPct || 0, target, barrier, "护盾被击破后重新构筑护盾。 ");
  applyBuff(target, "fortify", 2);
}
function triggerEnemyPassiveAffixOnAllyDefeated(defeated) {
  const c = state.combat;
  if (!c || (defeated == null ? void 0 : defeated.side) !== "enemy") return;
  for (const enemy of c.enemies.filter((unit) => unit.alive)) {
    const fortress = enemyPassiveAffixByMechanic(enemy, "last_stand_barrier");
    const affixState = enemyPassiveAffixState(enemy);
    if (!fortress || affixState.fortressUsed) continue;
    affixState.fortressUsed = true;
    for (const ally of c.enemies.filter((unit) => unit.alive)) {
      const amount = Math.max(1, Math.floor(ally.maxHp * (fortress.shieldPct || 0)));
      ally.shield += amount;
      emitCombatFloat(ally, "+".concat(amount), "shield");
      applyBuff(ally, "fortify", 2);
    }
    logEnemyPassiveAffix(enemy, fortress, "".concat(defeated.name, " 倒下，全体存活敌军获得护盾与坚韧。"));
  }
}
function tryEnemyPassiveAffixPreventDeath(unit) {
  const undying = enemyPassiveAffixByMechanic(unit, "prevent_death");
  const affixState = enemyPassiveAffixState(unit);
  if (!undying || affixState.undyingUsed) return false;
  affixState.undyingUsed = true;
  unit.hp = 1;
  unit.alive = true;
  applyBuff(unit, "fortify", 2);
  logEnemyPassiveAffix(unit, undying, "抵挡了致命伤害，保留 1 点生命。 ");
  return true;
}
function applyEnemyPassiveAffixStats(unit) {
  const effects = enemyPassiveAffixEffects(unit == null ? void 0 : unit.passiveAffixes);
  unit.passiveAffixEffects = effects;
  unit.passiveAffixState || (unit.passiveAffixState = {});
  if (!Object.keys(effects).length) return unit;
  const hpScale = 1 + (effects.hpPct || 0);
  const atkScale = 1 + (effects.atkPct || 0);
  const defScale = 1 + (effects.defPct || 0);
  unit.maxHp = Math.max(1, Math.floor(unit.maxHp * hpScale));
  unit.hp = unit.maxHp;
  unit.stats.hp = unit.maxHp;
  unit.stats.atk = Math.max(1, Math.floor(unit.stats.atk * atkScale));
  unit.stats.matk = Math.max(0, Math.floor((unit.stats.matk || 0) * atkScale));
  unit.stats.def = Math.max(0, Math.floor(unit.stats.def * defScale));
  const shield = Math.max(0, Math.floor(unit.maxHp * (effects.startShieldPct || 0)));
  if (shield > 0) unit.shield += shield;
  return unit;
}
function climbEnemyModifierValues(template, battleKind = "normal", run = state.run) {
  const effects = climbEffects(run);
  const kind = (template == null ? void 0 : template.isBoss) ? "boss" : (template == null ? void 0 : template.isElite) || battleKind === "elite" ? "elite" : "normal";
  const hpPct = (effects.enemyHpPct || 0) + (kind === "elite" ? effects.eliteHpPct || 0 : 0) + (kind === "boss" ? effects.bossHpPct || 0 : 0);
  const atkPct = (effects.enemyAtkPct || 0) + (kind === "elite" ? effects.eliteAtkPct || 0 : 0) + (kind === "boss" ? effects.bossAtkPct || 0 : 0) + (kind === "boss" && ((run == null ? void 0 : run.floor) || 0) === 100 ? effects.finalBossAtkPct || 0 : 0);
  const defPct = effects.enemyDefPct || 0;
  const startShieldPct = (effects.enemyStartShieldPct || 0) + (kind === "elite" ? effects.eliteStartShieldPct || 0 : 0) + (kind === "boss" ? effects.bossStartShieldPct || 0 : 0) + (kind === "boss" && ((run == null ? void 0 : run.floor) || 0) === 100 ? effects.finalBossStartShieldPct || 0 : 0);
  return {
    kind,
    hpMultiplier: 1 + hpPct,
    atkMultiplier: 1 + atkPct,
    defMultiplier: 1 + defPct,
    statusResFlat: effects.enemyStatusResFlat || 0,
    startShieldPct
  };
}
function applyClimbEnemyStartModifiers(unit, template, battleKind = "normal", run = state.run) {
  if (!unit || !isClimbRun(run)) return unit;
  const modifiers = climbEnemyModifierValues(template, battleKind, run);
  unit.maxHp = Math.max(1, Math.floor(unit.maxHp * modifiers.hpMultiplier));
  unit.hp = unit.maxHp;
  unit.stats.hp = unit.maxHp;
  unit.stats.atk = Math.max(1, Math.floor((unit.stats.atk || 0) * modifiers.atkMultiplier));
  unit.stats.matk = Math.max(0, Math.floor((unit.stats.matk || 0) * modifiers.atkMultiplier));
  unit.stats.def = Math.max(0, Math.floor((unit.stats.def || 0) * modifiers.defMultiplier));
  unit.stats.statusRes = Math.max(0, Math.floor((unit.stats.statusRes || 0) + modifiers.statusResFlat));
  const shield = Math.max(0, Math.floor(unit.maxHp * modifiers.startShieldPct));
  if (shield > 0) unit.shield = (unit.shield || 0) + shield;
  unit.climbEnemyKind = modifiers.kind;
  return unit;
}
function createBossEncounter(floor, stage) {
  var _a, _b, _c2;
  const chapterBoss = getChapterBossForFloor(floor);
  if (chapterBoss) {
    const formation2 = {
      id: "chapter_".concat(floor),
      name: "章节守卫",
      unitIds: [chapterBoss.id],
      formationScale: { hp: 1, stat: 1 }
    };
    const template = makeFormationTemplate({
      ...chapterBoss,
      isBoss: true,
      isChapterBoss: true,
      floor,
      passiveAffixes: []
    }, formation2, "boss", stage);
    return { kind: "boss", stage, formation: formation2, templates: [template], preview: { ...template }, isDoubleBoss: false, isChapterBoss: true };
  }
  const pool = getBossStagePool(floor);
  const useDouble = Math.random() * ((pool.singleWeight || 0) + (pool.doubleWeight || 0)) >= (pool.singleWeight || 0);
  const ids = useDouble && ((_a = pool.doublePairs) == null ? void 0 : _a.length) ? [...pick(pool.doublePairs)] : [pick(pool.singleIds)];
  if (((_b = state.run) == null ? void 0 : _b.dualHeroMode) && ids.length === 1 && ((_c2 = pool.doublePairs) == null ? void 0 : _c2.length)) {
    const pair = pick(pool.doublePairs);
    const partnerId = pair.find((id) => id !== ids[0]) || pair[0];
    if (partnerId) ids.push(partnerId);
  }
  const isDoubleBoss = ids.length > 1;
  const formation = {
    id: "".concat(pool.id, "_").concat(ids.join("_")),
    name: isDoubleBoss ? "双首领合击" : "阶段首领",
    unitIds: ids,
    formationScale: { hp: isDoubleBoss ? 0.5 : 1, stat: 1 }
  };
  const templates = ids.map((id) => {
    const source = DATA.bosses.find((boss) => boss.id === id) || DATA.bosses[0];
    return makeFormationTemplate({
      ...source,
      isBoss: true,
      floor
    }, formation, "boss", stage);
  });
  assignEnemyPassiveAffixes(templates, floor);
  const preview = { ...templates[0], name: templates.map((boss) => boss.name).join(" + "), desc: templates.map((boss) => boss.desc).filter(Boolean).join(" ") };
  return { kind: "boss", stage, formation, templates, preview, isDoubleBoss };
}
function applyClimbFinalBossEncounter(encounter, floor, stage) {
  var _a;
  const effects = climbEffects(state.run);
  if (!effects.finalDoubleBoss || floor !== 100 || !((_a = encounter == null ? void 0 : encounter.templates) == null ? void 0 : _a.length) || encounter.templates.length > 1) return encounter;
  const firstSource = encounter.templates[0];
  const partnerSource = DATA.bosses.find((boss) => boss.id === "boss_titan") || DATA.bosses[DATA.bosses.length - 1];
  if (!partnerSource || partnerSource.id === firstSource.id) return encounter;
  const formation = {
    id: "climb_final_".concat(firstSource.id, "_").concat(partnerSource.id),
    name: "攀登终局·双王",
    unitIds: [firstSource.id, partnerSource.id],
    formationScale: { hp: 0.65, stat: 1 }
  };
  const first = {
    ...firstSource,
    formationId: formation.id,
    formationName: formation.name,
    formationHpScale: formation.formationScale.hp,
    formationStatScale: formation.formationScale.stat
  };
  const partner = makeFormationTemplate({ ...partnerSource, isBoss: true, floor }, formation, "boss", stage);
  encounter.formation = formation;
  encounter.templates = [first, partner];
  encounter.preview = {
    ...first,
    name: "".concat(first.name, " + ").concat(partner.name),
    desc: "Lv.50终局由两名Boss共同镇守，单体生命按双王编队修正。"
  };
  encounter.isDoubleBoss = true;
  return encounter;
}
function createEnemyEncounter(floor, kind) {
  var _a, _b;
  const stage = getEnemyStage(floor);
  if (kind === "boss") {
    const encounter = applyClimbFinalBossEncounter(createBossEncounter(floor, stage), floor, stage);
    appendClimbEnemyAffixes(encounter.templates, floor, "boss");
    return encounter;
  }
  const formation = selectEnemyFormation(floor, kind, stage);
  const byId = Object.fromEntries(DATA.enemyTemplates.map((enemy) => [enemy.id, enemy]));
  let templates = ((formation == null ? void 0 : formation.unitIds) || []).map((id) => byId[id]).filter(Boolean);
  if (!templates.length) {
    const fallback = kind === "elite" ? DATA.enemyTemplates.filter((enemy) => enemy.isElite) : DATA.enemyTemplates.filter((enemy) => !enemy.isElite);
    templates = [pick(fallback)];
  }
  if (((_a = state.run) == null ? void 0 : _a.dualHeroMode) && kind === "normal") {
    const elitePool = DATA.enemyTemplates.filter((enemy) => enemy.isElite && enemy.baseLv <= Math.max(3, floor));
    const pool = elitePool.length ? elitePool : DATA.enemyTemplates.filter((enemy) => enemy.isElite);
    templates = templates.map(() => pick(pool)).filter(Boolean);
  }
  const normalizedFormation = { ...formation, unitIds: templates.map((template) => template.id) };
  const encounterTemplates = templates.map((template) => makeFormationTemplate({ ...template, isElite: kind === "elite" || template.isElite }, normalizedFormation, kind, stage));
  assignEnemyPassiveAffixes(encounterTemplates, floor);
  appendClimbEnemyAffixes(encounterTemplates, floor, kind);
  return {
    kind,
    stage,
    formation: normalizedFormation,
    templates: encounterTemplates,
    preview: { name: normalizedFormation.name, icon: ((_b = templates[0]) == null ? void 0 : _b.icon) || "⚔️", desc: "" },
    isDoubleBoss: false
  };
}
function createImmortalThroneEncounter(floor) {
  const encounter = createEnemyEncounter(floor, "elite");
  const templates = encounter.templates.map((template) => ({
    ...template,
    name: "不朽·".concat(template.name),
    hp: Math.floor(template.hp * 1.25),
    atk: Math.floor(template.atk * 1.15),
    matk: Math.floor((template.matk || 0) * 1.15),
    def: Math.floor((template.def || 0) * 1.15)
  }));
  const formation = { ...encounter.formation, name: "不朽守卫" };
  return {
    ...encounter,
    formation,
    templates,
    preview: { ...encounter.preview, name: "不朽守卫", desc: "王座赐福让精英守卫获得更高生命与攻防。" }
  };
}
function generateEnemies(floor, kind) {
  return createEnemyEncounter(floor, kind).templates;
}
function generateEquip(floor, forcedRarity = "", forcedSlot = "") {
  var _a;
  const slot = forcedSlot || pick(DATA.equipSlots);
  let rarity = forcedRarity;
  if (!rarity) {
    const roll = rng(1, 100);
    if (floor >= 8 && roll <= 5) rarity = "orange";
    else if (floor >= 5 && roll <= 15) rarity = "purple";
    else if (floor >= 3 && roll <= 35) rarity = "blue";
    else if (roll <= 60) rarity = "green";
    else rarity = "white";
    if (hasTalent("loot_luck") && Math.random() < talentStarValue("loot_luck")) rarity = upgradeRarity(rarity);
    if (hasTalent("treasure_eye")) rarity = upgradeRarity(rarity);
  }
  const affixCount = DATA.equipRarityAffixSlots[rarity] || 0;
  const baseStats = (DATA.equipBaseStats[slot] || []).map((bd) => {
    let value = rng(bd.min, bd.max);
    if (["hp", "atk", "matk", "def"].includes(bd.stat)) value = Math.floor(value * floorScale(floor));
    value = Math.max(1, Math.floor(value * (DATA.equipRarityBaseMult[rarity] || 1)));
    return { stat: bd.stat, name: bd.name, value };
  });
  const affixes = [];
  const used = /* @__PURE__ */ new Set();
  const statCount = Math.min(affixCount, affixCount ? rng(1, Math.min(rarity === "red" ? 4 : 3, affixCount)) : 0);
  for (let i = 0; i < statCount; i += 1) {
    const pool2 = DATA.statAffixes.filter((a) => !used.has(a.id));
    if (!pool2.length) break;
    const af = pick(pool2);
    used.add(af.id);
    let value = rng(af.min, af.max);
    if (["hp", "atk", "matk", "def"].includes(af.stat)) value = Math.floor(value * floorScale(floor));
    if (rarity === "blue") value = Math.floor(value * 1.2);
    if (rarity === "purple") value = Math.floor(value * 1.5);
    if (rarity === "orange") value = Math.floor(value * 2);
    if (rarity === "red") value = Math.floor(value * 2.2);
    affixes.push({ stat: af.stat, value: Math.max(1, value), name: af.name });
  }
  if (!["white", "green"].includes(rarity) && affixes.length < affixCount && Math.random() <= 0.42) {
    const mx = pick(DATA.mechAffixes);
    affixes.push({ mechanic: mx.id, name: mx.name, desc: mx.desc });
  }
  const pool = ((_a = DATA.equipNamePool[slot]) == null ? void 0 : _a[rarity]) || [["".concat(RARITY_LABEL[rarity]).concat(DATA.equipSlotNames[slot]), DATA.equipSlotIcons[slot]]];
  const [name, icon] = pick(pool);
  const set = rollEquipmentSet(slot, rarity);
  const displayName = set ? "".concat(set.name, "·").concat(name) : name;
  return { id: crypto.randomUUID ? crypto.randomUUID() : "".concat(Date.now(), "-").concat(Math.random()), slot, rarity, name: displayName, icon, baseStats, affixes, setId: (set == null ? void 0 : set.id) || "", level: floor };
}
function ensureEquipmentAffixes(item, minCount = 2) {
  var _a;
  if (!item) return item;
  item.affixes || (item.affixes = []);
  const targetCount = Math.min(Math.max(0, minCount), DATA.equipRarityAffixSlots[item.rarity] || 0);
  const used = new Set(item.affixes.filter((affix) => affix.stat).map((affix) => affix.stat));
  while (item.affixes.length < targetCount) {
    const pool = DATA.statAffixes.filter((affix2) => !used.has(affix2.stat));
    if (!pool.length) break;
    const affix = pick(pool);
    used.add(affix.stat);
    let value = rng(affix.min, affix.max);
    if (["hp", "atk", "matk", "def"].includes(affix.stat)) value = Math.floor(value * floorScale(item.level || ((_a = state.run) == null ? void 0 : _a.floor) || 1));
    if (item.rarity === "blue") value = Math.floor(value * 1.2);
    if (item.rarity === "purple") value = Math.floor(value * 1.5);
    if (item.rarity === "orange") value = Math.floor(value * 2);
    if (item.rarity === "red") value = Math.floor(value * 2.2);
    item.affixes.push({ stat: affix.stat, value: Math.max(1, value), name: affix.name });
  }
  return item;
}
function generateImmortalThroneEquipment(floor) {
  return ensureEquipmentAffixes(generateEquip(floor, "orange"), 2);
}
function upgradeRarity(rarity, { allowRed = false } = {}) {
  const idx = DATA.equipRarityOrder.indexOf(rarity);
  const maxIdx = allowRed ? DATA.equipRarityOrder.length - 1 : DATA.equipRarityOrder.indexOf("orange");
  return DATA.equipRarityOrder[Math.min(maxIdx, idx + 1)] || rarity;
}
function rollEquipmentSet(slot, rarity) {
  if (!["purple", "orange", "red"].includes(rarity) || !state.run) return null;
  const classId = state.run.classId;
  const baseClassId = getBaseClassId(classId);
  const candidates = (DATA.sets || []).filter((set) => {
    if (!(set.slots || []).includes(slot)) return false;
    if (!set.classReq) return true;
    return set.classReq === classId || set.classReq === baseClassId;
  });
  if (!candidates.length || Math.random() > 0.3) return null;
  return pick(candidates);
}
function equipItem(item) {
  var _a, _b;
  if (!state.run) return null;
  const old = state.run.equipment[item.slot] || null;
  state.run.equipment[item.slot] = item;
  (_a = state.run.enhanceLevels)[_b = item.slot] || (_a[_b] = 0);
  refreshPartyHpCaps();
  saveGame();
  return old;
}
const EQUIPMENT_SCORE_WEIGHTS = {
  warrior: { hp: 0.09, atk: 1.15, matk: 0.2, def: 2.5, crit: 1.1, critDmg: 0.45, energy: 0.25, energyRegen: 2.2, hpRegen: 3, statusRes: 0.8 },
  mage: { hp: 0.06, atk: 0.25, matk: 2.25, def: 1.15, crit: 1.25, critDmg: 0.55, energy: 0.45, energyRegen: 3, hpRegen: 1.5, statusRes: 0.65 },
  ranger: { hp: 0.07, atk: 2.05, matk: 0.25, def: 1.25, crit: 1.55, critDmg: 0.75, energy: 0.3, energyRegen: 2.1, hpRegen: 1.5, statusRes: 0.65 },
  priest: { hp: 0.08, atk: 0.2, matk: 2.05, def: 1.65, crit: 0.8, critDmg: 0.35, energy: 0.6, energyRegen: 3.2, hpRegen: 3.2, statusRes: 0.85 },
  assassin: { hp: 0.06, atk: 2.15, matk: 0.2, def: 1, crit: 1.7, critDmg: 0.85, energy: 0.3, energyRegen: 2, hpRegen: 1.25, statusRes: 0.55 },
  vampire: { hp: 0.09, atk: 1.65, matk: 1.05, def: 1.45, crit: 1.2, critDmg: 0.6, energy: 0.35, energyRegen: 2.25, hpRegen: 3.5, statusRes: 0.7 },
  druid: { hp: 0.1, atk: 1.2, matk: 1.45, def: 1.85, crit: 0.9, critDmg: 0.45, energy: 0.45, energyRegen: 2.6, hpRegen: 3.3, statusRes: 0.85 },
  puppeteer: { hp: 0.075, atk: 0.2, matk: 2.2, def: 1.45, crit: 1.15, critDmg: 0.55, energy: 0.55, energyRegen: 3, hpRegen: 1.8, statusRes: 0.75 }
};
const EQUIPMENT_MECHANIC_SCORE_BONUS = {
  mx_double_cast: 0.1,
  mx_combo_stack: 0.08,
  mx_shield_proc: 0.05,
  mx_lifesteal: 0.1,
  mx_crit_burst: 0.12,
  mx_burn_spread: 0.07,
  mx_energy_on_kill: 0.08,
  mx_dodge_counter: 0.08
};
function equipmentForScoring(member) {
  var _a, _b;
  if ((member == null ? void 0 : member.isPlayer) && member.unitId === "player") return ((_a = state.run) == null ? void 0 : _a.equipment) || {};
  return ((_b = member == null ? void 0 : member.mercData) == null ? void 0 : _b.equipment) || {};
}
function equipmentPassiveScoreBonus(item, member) {
  let bonus = 0;
  for (const affix of (item == null ? void 0 : item.affixes) || []) bonus += EQUIPMENT_MECHANIC_SCORE_BONUS[affix == null ? void 0 : affix.mechanic] || 0;
  const set = getSetDef(item == null ? void 0 : item.setId);
  const classId = getBaseClassId(member == null ? void 0 : member.classId);
  if (!set || set.classReq && set.classReq !== classId) return bonus;
  bonus += 0.04;
  const worn = equipmentForScoring(member);
  if ((set.slots || []).some((slot) => {
    var _a;
    return slot !== item.slot && ((_a = worn == null ? void 0 : worn[slot]) == null ? void 0 : _a.setId) === set.id;
  })) bonus += 0.15;
  return bonus;
}
function isMercEquipmentCompatible(member, item) {
  if (!(member == null ? void 0 : member.mercData) || !item || !DATA.equipSlots.includes(item.slot)) return false;
  const set = getSetDef(item.setId);
  if (!(set == null ? void 0 : set.classReq)) return true;
  const classId = getBaseClassId(member.classId);
  return set.classReq === member.classId || set.classReq === classId;
}
function equipmentScoreForMember(item, member) {
  var _a, _b;
  if (!item || !member) return 0;
  const weights = EQUIPMENT_SCORE_WEIGHTS[getBaseClassId(member.classId)] || EQUIPMENT_SCORE_WEIGHTS.warrior;
  const enhance = member.isPlayer && member.unitId === "player" ? 1 + (((_b = (_a = state.run) == null ? void 0 : _a.enhanceLevels) == null ? void 0 : _b[item.slot]) || 0) * 0.1 : 1;
  const stats = equipStatMap(item);
  let score = 0;
  for (const [stat, value] of Object.entries(stats)) score += (weights[stat] || 0.25) * value * enhance;
  score += Math.max(0, equipRarityRank(item.rarity)) * 2;
  score *= 1 + equipmentPassiveScoreBonus(item, member);
  return Math.max(0, Math.round(score));
}
function mercEquipmentScore(member) {
  var _a;
  return Object.values(((_a = member == null ? void 0 : member.mercData) == null ? void 0 : _a.equipment) || {}).reduce((sum, item) => sum + equipmentScoreForMember(item, member), 0);
}
function autoSelectMercEquipmentEnabled() {
  return state.perm.autoSelectMercEquipment !== false;
}
function bestEquipmentAssignment(item, { includeHero = true, includeMercenaries = autoSelectMercEquipmentEnabled() } = {}) {
  var _a, _b;
  if (!state.run || !item) return null;
  const candidates = [];
  const hero = state.run.party.find((member) => member.isPlayer && member.unitId === "player");
  if (includeHero && hero && !((_a = state.run.equipmentLocks) == null ? void 0 : _a[item.slot])) {
    const old = state.run.equipment[item.slot] || null;
    candidates.push({ member: hero, old, score: equipmentScoreForMember(item, hero), oldScore: equipmentScoreForMember(old, hero) });
  }
  if (includeMercenaries) {
    for (const member of mercRoster()) {
      if (!isMercEquipmentCompatible(member, item)) continue;
      const old = ((_b = member.mercData.equipment) == null ? void 0 : _b[item.slot]) || null;
      candidates.push({ member, old, score: equipmentScoreForMember(item, member), oldScore: equipmentScoreForMember(old, member) });
    }
  }
  return candidates.map((entry) => ({ ...entry, gain: entry.score - entry.oldScore })).sort((a, b) => b.gain - a.gain || b.score - a.score)[0] || null;
}
function equipMercItem(member, item) {
  var _a;
  if (!isMercEquipmentCompatible(member, item)) return null;
  (_a = member.mercData).equipment || (_a.equipment = {});
  const old = member.mercData.equipment[item.slot] || null;
  member.mercData.equipment[item.slot] = item;
  refreshPartyHpCaps();
  return old;
}
function autoAssignMercEquipment(item) {
  if (!autoSelectMercEquipmentEnabled()) return { assigned: false, item };
  const target = bestEquipmentAssignment(item, { includeHero: false });
  if (!target || target.gain <= 0) return { assigned: false, item };
  const replaced = equipMercItem(target.member, item);
  addRunLog("🗡️ 智能装备：".concat(item.name, " 分配给 ").concat(target.member.name, "（评分 ").concat(target.oldScore, "→").concat(target.score, "）。"));
  return { assigned: true, target, replaced };
}
function sellUnassignedEquipment(item) {
  if (!item || !state.run) return;
  const gold = sellValue(item);
  state.run.gold += gold;
  addRunLog("分解 ".concat(item.name, "，获得 ").concat(gold, " 金币。"));
}
function autoAssignEquipment(item) {
  const target = bestEquipmentAssignment(item);
  if (!target || target.gain <= 0) return { assigned: false, item };
  let replaced = null;
  if (target.member.mercData) {
    replaced = equipMercItem(target.member, item);
    addRunLog("🗡️ 智能装备：".concat(item.name, " 分配给 ").concat(target.member.name, "（评分 ").concat(target.oldScore, "→").concat(target.score, "）。"));
  } else {
    replaced = equipItem(item);
    addRunLog("⚔️ 智能装备：".concat(item.name, " 装备给主角（评分 ").concat(target.oldScore, "→").concat(target.score, "）。"));
  }
  if (replaced) {
    const handoff = autoAssignMercEquipment(replaced);
    if (!handoff.assigned) sellUnassignedEquipment(replaced);
    else if (handoff.replaced) sellUnassignedEquipment(handoff.replaced);
  }
  return { assigned: true, target };
}
function equipEquipmentToHero(item) {
  const replaced = equipItem(item);
  addRunLog("⚔️ 装备：".concat(item.name, " 装备给主角。"));
  if (!replaced) return { equipped: true, replaced: null, pendingItem: null };
  if (!autoSelectMercEquipmentEnabled()) {
    addRunLog("📦 ".concat(replaced.name, " 已换下，请继续选择去向。"));
    return { equipped: true, replaced, pendingItem: replaced };
  }
  const handoff = autoAssignMercEquipment(replaced);
  if (!handoff.assigned) sellUnassignedEquipment(replaced);
  else if (handoff.replaced) sellUnassignedEquipment(handoff.replaced);
  return { equipped: true, replaced, handoff, pendingItem: null };
}
function manualMercEquipmentTargets(item) {
  if (!item) return [];
  return mercRoster().filter((member) => isMercEquipmentCompatible(member, item)).map((member) => {
    var _a;
    const old = ((_a = member.mercData.equipment) == null ? void 0 : _a[item.slot]) || null;
    const oldScore = equipmentScoreForMember(old, member);
    const score = equipmentScoreForMember(item, member);
    return { member, old, oldScore, score, gain: score - oldScore };
  }).sort((a, b) => b.gain - a.gain || b.score - a.score);
}
function openMercEquipmentAssignModal() {
  var _a;
  const item = (_a = state.pendingEquip) == null ? void 0 : _a.item;
  if (!item) return;
  const targets = manualMercEquipmentTargets(item);
  state.modal = {
    title: "🗡️ 分配佣兵装备",
    className: "merc-equipment-modal",
    body: '\n      <div class="merc-equipment-picker">\n        <div class="merc-equipment-new-item">\n          '.concat(renderEquipArt(item.slot, "equip-art merc-equipment-art", item.rarity || "white"), "\n          <div><small>").concat(esc(DATA.equipSlotNames[item.slot] || item.slot), "</small><b>").concat(esc(item.name), '</b></div>\n        </div>\n        <p class="merc-equipment-hint">选择穿戴者后立即替换；被换下的装备会回到装备选择页，继续由你分配或分解。</p>\n        <div class="merc-equipment-target-list">\n          ').concat(targets.length ? targets.map(({ member, old, oldScore, score, gain }) => '\n            <button class="merc-equipment-target" onclick="assignPendingEquipmentToMerc(\''.concat(member.unitId, '\')">\n              <span class="merc-equipment-target-copy"><b>').concat(esc(member.name), "</b><small>").concat(esc(getClass(member.classId).name), " · 当前").concat(old ? esc(old.name) : "空位", '</small></span>\n              <span class="merc-equipment-score ').concat(gain >= 0 ? "upgrade" : "downgrade", '">').concat(oldScore, " → ").concat(score, "<small>").concat(gain >= 0 ? "+" : "").concat(gain, "</small></span>\n            </button>\n          ")).join("") : '<div class="empty-small">没有可穿戴这件装备的佣兵。</div>', "\n        </div>\n      </div>\n    "),
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } }
    ]
  };
  render();
}
function assignPendingEquipmentToMerc(unitId) {
  var _a;
  const item = (_a = state.pendingEquip) == null ? void 0 : _a.item;
  const member = mercRoster().find((entry) => entry.unitId === unitId);
  if (!item || !member || !isMercEquipmentCompatible(member, item)) return;
  const replaced = equipMercItem(member, item);
  addRunLog("🗡️ 手动装备：".concat(item.name, " 分配给 ").concat(member.name, "。"));
  state.modal = null;
  if (replaced) {
    state.pendingEquip = { item: replaced };
    addRunLog("📦 ".concat(replaced.name, " 已换下，请继续选择去向。"));
    saveGame({ persistDurableChangesDuringCombat: true });
    render();
    return;
  }
  const done = pendingEquipResolve;
  state.pendingEquip = null;
  pendingEquipResolve = null;
  saveGame({ persistDurableChangesDuringCombat: true });
  if (done) done();
  else render();
}
function equipmentAssignmentHint(item) {
  const target = bestEquipmentAssignment(item);
  if (!target || target.gain <= 0) return "智能分配：没有更高评分的穿戴者，将分解为金币。";
  const owner = target.member.mercData ? "佣兵 ".concat(target.member.name) : "主角";
  return "智能分配：".concat(owner, "（评分 ").concat(target.oldScore, " → ").concat(target.score, "）");
}
function enhanceCostForSlot(slot, run = state.run) {
  var _a;
  const cur = ((_a = run == null ? void 0 : run.enhanceLevels) == null ? void 0 : _a[slot]) || 0;
  return GOLD_ECONOMY.enhanceBase + cur * GOLD_ECONOMY.enhanceStep;
}
function eventChoiceCost(choice) {
  const slot = ENHANCE_CHOICE_SLOT[choice == null ? void 0 : choice.result];
  const baseCost = (choice == null ? void 0 : choice.result) === "merc_training" ? GOLD_ECONOMY.mercTraining : (choice == null ? void 0 : choice.result) === "merc_trait_trial" ? GOLD_ECONOMY.mercTraitTrial : slot ? enhanceCostForSlot(slot) : (choice == null ? void 0 : choice.cost) || 0;
  return goldCost(baseCost);
}
function eventChoiceDisabledReason(choice, run = state.run) {
  var _a, _b;
  if (!run) return "当前没有进行中的轮回。";
  if ((choice == null ? void 0 : choice.result) === "merc_training" && !standbyMercRoster().length) return "没有可训练的待命佣兵。";
  if ((choice == null ? void 0 : choice.result) === "merc_supply" && !mercRoster().length) return "当前没有可接收装备的佣兵。";
  if ((choice == null ? void 0 : choice.result) === "merc_guild_recruit" && mercRoster().length >= MAX_MERC_ROSTER) return "佣兵招募已达上限（".concat(MAX_MERC_ROSTER, "名）。");
  if ((choice == null ? void 0 : choice.result) === "merc_trait_trial" && !mercTraitTrainingCandidates().length) return "没有可继续升星的存活佣兵。";
  if ((choice == null ? void 0 : choice.result) === "alchemy_transmute" && !Object.values(run.items || {}).some((count) => count > 0)) return "没有可投入炼金台的道具。";
  if ((choice == null ? void 0 : choice.result) === "upgrade_red_equip" && !Object.values(run.equipment || {}).some((item) => (item == null ? void 0 : item.rarity) === "orange")) return "需要至少一件已装备的橙色装备。";
  if ((choice == null ? void 0 : choice.result) === "enchant_add" && !Object.values(run.equipment || {}).some(canAddForgeAffix)) return "没有可追加词条的装备（每件限1次且不能超过词缀槽数）。";
  const slot = ENHANCE_CHOICE_SLOT[choice == null ? void 0 : choice.result];
  if (slot) {
    const slotName = DATA.equipSlotNames[slot] || slot;
    if (!((_a = run.equipment) == null ? void 0 : _a[slot])) return "未装备".concat(slotName, "。");
    const level = ((_b = run.enhanceLevels) == null ? void 0 : _b[slot]) || 0;
    const max = getEnhanceMax();
    if (level >= max) return "".concat(slotName, "已达强化上限 +").concat(max, "。");
  }
  const cost = eventChoiceCost(choice);
  if (cost && (run.gold || 0) < cost) return "金币不足（持有 ".concat(run.gold || 0, " / 需要 ").concat(cost, "）。");
  return "";
}
function enhanceEquip(slot, cost = null) {
  if (!state.run) return "无进行中的轮回。";
  const item = state.run.equipment[slot];
  if (!item) return "没有装备".concat(DATA.equipSlotNames[slot], "。");
  const cur = state.run.enhanceLevels[slot] || 0;
  const max = getEnhanceMax();
  const actualCost = cost == null ? goldCost(enhanceCostForSlot(slot)) : cost;
  if (cur >= max) return "已达强化上限 +".concat(max, "。");
  if (state.run.gold < actualCost) return "金币不足，需要 ".concat(actualCost, "。");
  state.run.gold -= actualCost;
  state.run.enhanceLevels[slot] = cur + 1;
  refreshPartyHpCaps();
  saveGame();
  return "".concat(item.icon).concat(item.name, " 强化到 +").concat(cur + 1, "。");
}
function equipText(item) {
  var _a;
  if (!item) return "空";
  const lines = ["".concat(item.icon, " ").concat(item.name, "  Lv.").concat(item.level), "品质：".concat(RARITY_LABEL[item.rarity], "  部位：").concat(DATA.equipSlotNames[item.slot])];
  const set = getSetDef(item.setId);
  if (set) lines.push("【套装】".concat(set.name, "：").concat(((_a = set.bonus2) == null ? void 0 : _a.desc) || ""));
  for (const bs of item.baseStats || []) lines.push(statValueLabel(bs.stat, bs.value));
  for (const af of item.affixes || []) {
    if (af.stat) lines.push("".concat(af.name, " +").concat(af.value).concat(af.stat === "crit" || af.stat === "critDmg" ? "%" : ""));
    if (af.mechanic) lines.push("★ ".concat(af.name, ": ").concat(af.desc));
  }
  return lines.join("\n");
}
function addItem(itemId, count = 1) {
  if (!state.run) return;
  state.run.items[itemId] = (state.run.items[itemId] || 0) + count;
}
function removeItem(itemId, count = 1) {
  if (!state.run || (state.run.items[itemId] || 0) < count) return false;
  state.run.items[itemId] -= count;
  if (state.run.items[itemId] <= 0) delete state.run.items[itemId];
  return true;
}
function calcUnitStats(member, run = state.run) {
  var _a;
  const cls = getClass(member.classId);
  const level = ((_a = member.mercData) == null ? void 0 : _a.level) || (run == null ? void 0 : run.level) || 1;
  const mercQuality = member.mercData ? DATA.mercQuality[member.mercData.quality || "white"] || DATA.mercQuality.white : null;
  const base = classBaseStats(cls);
  const primaryAttributes = applyAbilityPrimaryAttributes(
    primaryAttributesAtLevel(cls, level, (mercQuality == null ? void 0 : mercQuality.growthMul) || 1),
    member,
    run
  );
  Object.assign(base, primaryStatsFromAttributes(primaryAttributes));
  if (member.isPlayer && run && !run.hardcoreMode) {
    base.hp += growthStatBonus("hp", run);
    base.atk += growthStatBonus("atk", run);
    base.matk += growthStatBonus("matk", run);
    base.def += growthStatBonus("def", run);
  }
  if (member.mercData) {
    const q = mercQuality;
    for (const [stat, val] of Object.entries(q.statBonus || {})) base[stat] = (base[stat] || 0) + val;
    base.hp = Math.floor(base.hp * (q.survivalMul || 1));
    base.def = Math.floor(base.def * (q.survivalMul || 1));
    base.atk = Math.floor(base.atk * q.outputMul);
    base.matk = Math.floor(base.matk * q.outputMul);
    for (const item of Object.values(member.mercData.equipment || {})) {
      if (!item) continue;
      for (const stat of item.baseStats || []) base[stat.stat] = (base[stat.stat] || 0) + Math.floor(stat.value || 0);
      for (const affix of item.affixes || []) {
        if (affix.stat) base[affix.stat] = (base[affix.stat] || 0) + Math.floor(affix.value || 0);
      }
    }
  }
  if (run == null ? void 0 : run.eventBonuses) {
    for (const [stat, val] of Object.entries(run.eventBonuses)) base[stat] = (base[stat] || 0) + val;
  }
  if ((run == null ? void 0 : run.hiddenStacks) && member.isPlayer) {
    base.hp += run.hiddenStacks.hp || 0;
    base.atk += run.hiddenStacks.atk || 0;
    base.matk += run.hiddenStacks.matk || 0;
    base.def += run.hiddenStacks.def || 0;
  }
  for (const t of (run == null ? void 0 : run.talents) || []) {
    if (t.statMod && member.isPlayer) applyStatMod(base, scaledTalentStatMod(t, run));
    if (t.fixedStatMod && member.isPlayer) applyStatMod(base, t.fixedStatMod);
    if (t.passive === "reincarnation_admin" && member.isPlayer) {
      const bonus = 2 * ((run == null ? void 0 : run.floor) || 1) * talentStarValue("reincarnation_admin", null, run);
      for (const stat of ["hp", "atk", "matk", "def"]) base[stat] += bonus;
    }
    if (t.passive === "merc_hp" && member.mercData) base.hp = Math.floor(base.hp * (1 + talentStarValue("merc_hp", null, run)));
    if (t.passive === "merc_atk" && member.mercData) {
      const bonus = talentStarValue("merc_atk", null, run);
      base.atk = Math.floor(base.atk * (1 + bonus));
      base.matk = Math.floor(base.matk * (1 + bonus));
    }
    if (t.passive === "war_council" && member.mercData) {
      const bonus = 0.25 * talentStarValue("war_council", null, run);
      base.atk = Math.floor(base.atk * (1 + bonus));
      base.matk = Math.floor(base.matk * (1 + bonus));
    }
  }
  if (member.isPlayer && (run == null ? void 0 : run.equipment) && member.unitId === "player") {
    for (const slot of DATA.equipSlots) {
      const item = run.equipment[slot];
      if (!item) continue;
      const enhance = 1 + (run.enhanceLevels[slot] || 0) * 0.1;
      for (const bs of item.baseStats || []) base[bs.stat] = (base[bs.stat] || 0) + Math.floor(bs.value * enhance);
      for (const af of item.affixes || []) {
        if (af.stat) base[af.stat] = (base[af.stat] || 0) + Math.floor(af.value * enhance);
      }
    }
  }
  if (member.isPlayer && (run == null ? void 0 : run.abilityPoints)) {
    for (const def of ABILITY_STATS) {
      const points = Math.max(0, Number(run.abilityPoints[def.key]) || 0);
      if (points > 0) base[def.statKey] = Math.floor((base[def.statKey] || 0) * (1 + points * def.percentPerPoint));
    }
  }
  if (run == null ? void 0 : run.bossStoryStatPct) applyStatMod(base, run.bossStoryStatPct);
  const passiveHeroKey = member.isSecondHero || member.unitId === "player2" ? "second" : "first";
  if (member.isPlayer && getBaseClassId(member.classId) === "druid" && isSkillPassiveUnlocked("druid_thick_bark", passiveHeroKey, run)) {
    base.hp = Math.floor(base.hp * 1.08);
  }
  base.hp = Math.max(1, Math.floor(base.hp));
  base.atk = Math.max(1, Math.floor(base.atk || 1));
  base.matk = Math.max(0, Math.floor(base.matk || 0));
  base.def = Math.max(0, Math.floor(base.def || 0));
  base.crit = Math.max(0, Math.floor(base.crit || 0));
  base.critDmg = Math.max(0, Math.floor(base.critDmg || 50));
  base.energy = Math.max(50, Math.floor(base.energy || 100));
  base.energyRegen = Math.max(0, Math.floor(Number(base.energyRegen) || 0));
  base.hpRegen = Math.max(0, Math.floor(base.hpRegen || 0));
  base.statusRes = Math.max(0, Math.floor(base.statusRes || 0));
  return base;
}
function applyStatMod(base, mod) {
  for (const [stat, raw] of Object.entries(mod)) {
    if (stat === "hpPct") base.hp = Math.floor(base.hp * (1 + raw));
    else if (stat === "atkPct") base.atk = Math.floor(base.atk * (1 + raw));
    else if (stat === "matkPct") base.matk = Math.floor(base.matk * (1 + raw));
    else if (stat === "defPct") base.def = Math.floor(base.def * (1 + raw));
    else if (stat === "critPct") base.crit = (base.crit || 0) + Math.floor(raw * 100);
    else if (stat === "critDmgPct") base.critDmg = (base.critDmg || 50) + Math.floor(raw * 100);
    else if (stat === "statusResPct") base.statusRes = Math.floor((base.statusRes || 0) * (1 + raw));
    else base[stat] = (base[stat] || 0) + raw;
  }
}
function refreshPartyHpCaps() {
  var _a;
  if (!state.run) return;
  for (const m of state.run.party) {
    const stats = calcUnitStats(m);
    state.run.currentHp[m.unitId] = clamp(state.run.currentHp[m.unitId] || stats.hp, 1, stats.hp);
    state.run.currentEnergy[m.unitId] = clamp((_a = state.run.currentEnergy[m.unitId]) != null ? _a : stats.energy, 0, stats.energy);
  }
}
function mercQualityWeightsForFloor(floor = 1) {
  const tier = floor >= 7 ? "late" : floor >= 4 ? "mid" : "early";
  const weights = DATA.mercQualityWeights[tier] || DATA.mercQualityWeights.early;
  return DATA.mercQualityOrder.map((id) => ({ id, w: weights[id] || 0 })).filter((entry) => entry.w > 0);
}
function mercGuildQualityForFloor(floor = 1) {
  const weights = floor >= 100 ? [{ id: "blue", w: 25 }, { id: "purple", w: 50 }, { id: "orange", w: 25 }] : floor >= 60 ? [{ id: "blue", w: 55 }, { id: "purple", w: 35 }, { id: "orange", w: 10 }] : floor >= 30 ? [{ id: "green", w: 35 }, { id: "blue", w: 50 }, { id: "purple", w: 15 }] : [{ id: "green", w: 70 }, { id: "blue", w: 30 }];
  return weightedPick(weights);
}
function currentMercExcludes(extra = []) {
  var _a, _b;
  const ids = new Set(extra);
  if ((_a = state.run) == null ? void 0 : _a.classId) ids.add(getBaseClassId(state.run.classId));
  for (const member of ((_b = state.run) == null ? void 0 : _b.party) || []) {
    if (member.mercData) ids.add(getBaseClassId(member.classId));
  }
  return ids;
}
function rollMercQuality(forcedQuality = "") {
  if (forcedQuality && DATA.mercQuality[forcedQuality]) return forcedQuality;
  return "white";
}
function nextMercUnitId() {
  if (!state.run.nextMercId) {
    const ids = state.run.party.map((m) => {
      var _a;
      return (_a = /^merc(\d+)$/.exec(m.unitId || "")) == null ? void 0 : _a[1];
    }).filter(Boolean).map(Number);
    state.run.nextMercId = Math.max(0, ...ids) + 1;
  }
  const idx = state.run.nextMercId;
  state.run.nextMercId += 1;
  return "merc".concat(idx);
}
function generateMercCandidate({ quality = "", free = false, excludeClassIds = [] } = {}) {
  var _a, _b, _c2;
  const excludes = new Set(excludeClassIds);
  const allClasses = classList().map((c) => c.id);
  const classPool = allClasses.filter((id) => !excludes.has(getBaseClassId(id)));
  const classId = pick(classPool.length ? classPool : allClasses);
  const usedNames = new Set((((_a = state.run) == null ? void 0 : _a.party) || []).filter((m) => m.mercData).map((m) => m.name));
  const names = DATA.mercNames[classId] || [getClass(classId).name];
  const unusedNames = names.filter((name) => !usedNames.has(name));
  const finalQuality = rollMercQuality(quality);
  const qdef = DATA.mercQuality[finalQuality] || DATA.mercQuality.white;
  const candidate = {
    classId,
    name: pick(unusedNames.length ? unusedNames : names),
    quality: finalQuality,
    cost: qdef.recruitCostBase || 35,
    free,
    level: Math.max(1, ((_b = state.run) == null ? void 0 : _b.floor) || 1, ((_c2 = state.run) == null ? void 0 : _c2.level) || 1)
  };
  candidate.skillIds = rollMercenarySkillIds(candidate.classId, candidate.quality);
  return candidate;
}
function generateMercRecruitOptions(count = 3) {
  var _a;
  const excludes = currentMercExcludes();
  const promisedFree = !!((_a = state.run) == null ? void 0 : _a.nextMercFree);
  const options = [];
  for (let i = 0; i < count; i += 1) {
    const higherQuality = Math.random() < TAVERN_HIGHER_QUALITY_CHANCE;
    const candidate = generateMercCandidate({
      quality: higherQuality ? "green" : "white",
      free: promisedFree,
      excludeClassIds: [...excludes]
    });
    if (higherQuality) candidate.cost *= TAVERN_HIGHER_QUALITY_COST_MULTIPLIER;
    options.push(candidate);
    excludes.add(getBaseClassId(candidate.classId));
  }
  return options;
}
function addMercenaryFromCandidate(candidate, { free = false, log = true } = {}) {
  var _a;
  if (!state.run || !candidate) return null;
  if (mercRoster().length >= MAX_MERC_ROSTER) {
    toast("佣兵招募已达上限（".concat(MAX_MERC_ROSTER, "名）。"));
    return null;
  }
  const cost = candidate.cost || ((_a = DATA.mercQuality[candidate.quality]) == null ? void 0 : _a.recruitCostBase) || 35;
  const isFree = free || !!candidate.free;
  if (!isFree && state.run.gold < cost) {
    toast("金币不足，需要 ".concat(cost, "。"));
    return null;
  }
  if (!isFree) state.run.gold -= cost;
  const member = {
    unitId: nextMercUnitId(),
    classId: candidate.classId,
    name: candidate.name,
    isPlayer: false,
    mercData: {
      quality: candidate.quality || "white",
      level: candidate.level || Math.max(1, state.run.floor || 1),
      exp: 0,
      traitLevel: 1,
      battleStrategy: "balanced",
      alive: true,
      equipment: {},
      recruitFloor: state.run.floor || 1
    }
  };
  member.mercData.skillIds = Array.isArray(candidate.skillIds) ? [...candidate.skillIds] : [];
  ensureMercenarySkillState(member, { rollIfMissing: true });
  state.run.party.push(member);
  const stats = calcUnitStats(member);
  state.run.currentHp[member.unitId] = stats.hp;
  state.run.currentEnergy[member.unitId] = stats.energy;
  if (state.run.nextMercFree) delete state.run.nextMercFree;
  if (log) addRunLog("🍺 ".concat(member.name, " 加入队伍。"));
  saveGame();
  return member;
}
function recruitRandomMerc(forcedQuality = "", free = false) {
  if (!state.run) return false;
  const candidate = generateMercCandidate({
    quality: forcedQuality,
    free: free || !!state.run.nextMercFree,
    excludeClassIds: [...currentMercExcludes()]
  });
  return !!addMercenaryFromCandidate(candidate, { free });
}
function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.w, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.w;
    if (roll <= 0) return item.id;
  }
  return items[0].id;
}
function currentEventWrap() {
  return state.floorEvents[state.eventIdx] || null;
}
function resolveEventChoice(choiceIndex, options = {}) {
  const wrap = currentEventWrap();
  if (!wrap || !state.run) return;
  const choice = wrap.event.choices[choiceIndex];
  if (!choice) return;
  const disabledReason = eventChoiceDisabledReason(choice);
  if (disabledReason) {
    toast(disabledReason);
    return;
  }
  const cost = eventChoiceCost(choice);
  if (cost) state.run.gold -= cost;
  wrap.selectedChoice = { text: choice.text, result: choice.result, cost };
  state.eventResult = null;
  state.shopOpen = false;
  const result = choice.result;
  if (result === "fight_normal") return startBattle("normal", wrap.encounter || null);
  if (result === "fight_elite") return startBattle("elite", wrap.encounter || null);
  if (result === "fight_boss") return startBattle("boss", wrap.encounter || wrap.bossData || null);
  if (result === "buy_item") {
    if (options.quick && quickSettings().itemShop === "auto") return autoResolveItemShop(wrap);
    return openItemShop();
  }
  if (result === "tavern_recruit") {
    if (options.quick && quickSettings().tavern === "auto") return autoResolveTavernRecruit(wrap);
    openTavernRecruitModal();
    return;
  }
  if (result === "tavern_rest") {
    healParty(0.5);
    const revived = reviveFallenMercenaries(0.4);
    completeEvent("队伍在酒馆整备，存活成员恢复50%生命".concat(revived ? "，复活了".concat(revived, "名佣兵") : "", "。"));
    return;
  }
  if (result === "merc_trait_trial") {
    if (options.quick) return autoResolveMercTraitTrial();
    openMercTraitTrialModal();
    return;
  }
  let message = "你继续前行。";
  let item = null;
  switch (result) {
    case "loot_random":
      item = generateEquip(state.run.floor);
      {
        const gold = goldGain(rng(20, 35));
        state.run.gold += gold;
        message = "你获得了 ".concat(item.icon).concat(item.name, " 和 ").concat(gold, " 金币。");
      }
      break;
    case "gold_small": {
      const gold = goldGain(rng(15, 25));
      state.run.gold += gold;
      message = "你获得了 ".concat(gold, " 金币。");
      break;
    }
    case "buy_equip":
      item = generateEquip(state.run.floor);
      message = "你购买了 ".concat(item.icon).concat(item.name, "。");
      break;
    case "buy_buff":
      addRunBuff("temp_boost", "商人强化", { hpPct: 0.1, atkPct: 0.1, matkPct: 0.1, defPct: 0.1 }, 3);
      message = "商人强化生效：接下来3场战斗全属性+10%。";
      break;
    case "shrine_bless":
      if (Math.random() < 0.6) {
        addRunBuff("shrine_buff", "祭坛祝福", { atkPct: 0.15 }, 3);
        message = "祭坛散发温暖光芒：接下来3场战斗攻击+15%。";
      } else {
        damagePartyPct(0.1);
        message = "祭坛闪过诡异光芒，全员生命-10%。";
      }
      break;
    case "shrine_pay":
      addRunBuff("shrine_strong", "强力祝福", { hpPct: 0.15, atkPct: 0.15, matkPct: 0.15, defPct: 0.15 }, 5);
      message = "祭坛接受供奉：接下来5场战斗全属性+15%。";
      break;
    case "heal_full":
      healParty(1);
      message = "清凉泉水恢复了全部体力。";
      break;
    case "heal_potion":
      addItem("heal_potion", 1);
      message = "获得1瓶恢复药水。";
      break;
    case "gamble_40":
    case "gamble_80": {
      const bet = cost || 0;
      if (Math.random() < 0.5) {
        state.run.gold += bet * 2;
        message = "你赢了，获得 ".concat(bet * 2, " 金币。");
      } else message = "你输了，".concat(bet, " 金币留在了桌上。");
      break;
    }
    case "train_atk": {
      const gain = addEventBonus("atk", 4 + Math.floor(state.run.floor * 0.4));
      message = "修炼完成，永久".concat(gain.text, "。");
      break;
    }
    case "train_matk": {
      const gain = addEventBonus("matk", 4 + Math.floor(state.run.floor * 0.4));
      message = "修炼完成，永久".concat(gain.text, "。");
      break;
    }
    case "train_def": {
      const gain = addEventBonus("def", 2 + Math.floor(state.run.floor * 0.2));
      message = "修炼完成，永久".concat(gain.text, "。");
      break;
    }
    case "train_hp": {
      const gain = addEventBonus("hp", 20 + state.run.floor * 2);
      healPartyFlat(gain.value);
      message = "修炼完成，永久".concat(gain.text, "。");
      break;
    }
    case "merc_training": {
      const mercs = standbyMercRoster();
      const exp = 10 + state.run.floor;
      const progress = awardMercenaryExp(mercs, exp);
      message = "待命轮训完成：".concat(progress.members, "名佣兵各获得").concat(exp, "经验").concat(progress.levels ? "，共升级".concat(progress.levels, "次") : "", "。");
      break;
    }
    case "merc_supply": {
      const supply = generateEquip(state.run.floor);
      const handoff = autoAssignMercEquipment(supply);
      if (!handoff.assigned) {
        const gold = sellValue(supply);
        sellUnassignedEquipment(supply);
        message = "军需箱开出".concat(supply.icon).concat(supply.name, "，没有佣兵可从中获益，自动出售获得").concat(gold, "金币。");
      } else {
        if (handoff.replaced) sellUnassignedEquipment(handoff.replaced);
        message = "军需箱开出".concat(supply.icon).concat(supply.name, "，已自动分配给").concat(handoff.target.member.name).concat(handoff.replaced ? "，替换的旧装备已自动出售" : "", "。");
      }
      break;
    }
    case "merc_guild_recruit": {
      const quality = mercGuildQualityForFloor(state.run.floor);
      const candidate = generateMercCandidate({
        quality,
        free: true,
        excludeClassIds: [...currentMercExcludes()]
      });
      const member = addMercenaryFromCandidate(candidate, { free: true, log: false });
      const qdef = DATA.mercQuality[quality] || DATA.mercQuality.green;
      message = member ? "协会契约生效：".concat(member.name, " 加入队伍，品质为").concat(qdef.name, "。") : "协会暂时没有可安排的新佣兵。";
      break;
    }
    case "campfire_rest":
      healParty(0.5);
      message = "篝火让伤口合拢，全员回复50%生命。";
      break;
    case "campfire_cook":
      addRunBuff("campfire_food", "营地料理", { hpPct: 0.15 }, 2);
      healParty(0.25);
      message = "料理让队伍精神一振：接下来2场战斗最大生命+15%，全员回复25%生命。";
      break;
    case "campfire_meditate":
      restoreEnergyParty(1);
      message = "冥想后，能量完全恢复。";
      break;
    case "library_magic":
      state.run.skillPoints += 1;
      message = "古书让你顿悟，获得1技能点。";
      break;
    case "library_tactic":
      state.run.tacticBoost = true;
      message = "战术书已记入行军笔记：仅下一场战斗伤害+25%。";
      break;
    case "library_sell": {
      const gold = goldGain(rng(35, 60));
      state.run.gold += gold;
      message = "你找到了值钱的古书，卖得 ".concat(gold, " 金币。");
      break;
    }
    case "hospital_full":
      healParty(1);
      restoreEnergyParty(1);
      message = "老军医妙手回春，全员完全恢复。";
      break;
    case "hospital_kit":
      addItem("heal_potion", 2);
      message = "获得2瓶恢复药水。";
      break;
    case "hospital_free":
      healParty(0.25);
      message = "简单包扎后，全员回复25%生命。";
      break;
    case "lost_supply_items": {
      const items = [addRandomItem(), addRandomItem()].filter(Boolean);
      message = "补给车里还留着物资：获得".concat(items.map((it) => "".concat(it.icon).concat(it.name)).join("、"), "。");
      break;
    }
    case "lost_supply_gold":
      state.run.gold += 45;
      message = "残件卖给路过商队，获得45金币。";
      break;
    case "lost_supply_heal":
      healParty(0.2);
      message = "你用补给车中的绷带处理伤势，全员回复20%生命。";
      break;
    case "mist_scout":
      addRunBuff("mist_scout", "迷雾侦察", {}, 1, { damageBonus: 0.15 });
      message = "侦察队标出了弱点：下一场战斗全队伤害+15%。";
      break;
    case "mist_detour":
      addRunBuff("mist_detour", "谨慎绕行", {}, 1, { damageReduction: 0.15 });
      message = "队伍避开了埋伏：下一场战斗全队减伤+15%。";
      break;
    case "mist_force":
      damagePartyPct(0.1);
      state.run.gold += 70;
      message = "强行穿过迷雾，全员当前生命-10%，获得70金币。";
      break;
    case "mushroom_red":
      healParty(0.35);
      message = "红菌温暖地化开，全员回复35%生命。";
      break;
    case "mushroom_blue":
      restoreEnergyParty(0.3);
      message = "蓝菌的灵光涌入体内，全员回复30%能量。";
      break;
    case "mushroom_gold": {
      const items = [addRandomItem(), addRandomItem()].filter(Boolean);
      message = "金菌孢子凝成了补给：获得".concat(items.map((it) => "".concat(it.icon).concat(it.name)).join("、"), "。");
      break;
    }
    case "messenger_exp": {
      const exp = 10 + state.run.floor;
      const levels = addExp(exp);
      const mercProgress = awardDeployedMercenaryProgress(exp);
      message = "战报补全了实战心得：获得".concat(exp, "经验").concat(levels ? "，升级到 Lv.".concat(state.run.level) : "").concat(mercProgress.members ? "；".concat(mercProgress.members, "名上阵佣兵各获得").concat(exp, "经验") : "", "。");
      break;
    }
    case "messenger_gold":
      state.run.messengerGoldBonus = true;
      message = "你接下护送委托：下一场战斗金币+50%。";
      break;
    case "war_room_assault":
      addRunBuff("war_room_assault", "进攻阵型", {}, 2, { damageBonus: 0.25 });
      message = "进攻阵型推演完成：接下来2场战斗全队伤害+25%。";
      break;
    case "war_room_bulwark":
      addRunBuff("war_room_bulwark", "铁壁阵型", {}, 2, { damageReduction: 0.2 });
      message = "铁壁阵型推演完成：接下来2场战斗全队减伤+20%。";
      break;
    case "war_room_reserve":
      addRunBuff("war_room_reserve", "蓄能阵型", {}, 2, { startEnergy: 40 });
      message = "蓄能阵型推演完成：接下来2场战斗全队开局能量+40。";
      break;
    case "tomb_relic":
      item = generateEquip(state.run.floor, "blue");
      damagePartyPct(0.1);
      message = "你带走了陪葬品：获得".concat(item.icon).concat(item.name, "，但全员当前生命-10%。");
      break;
    case "tomb_study":
      state.run.skillPoints += 1;
      message = "残碑记载的秘术让你顿悟，获得1技能点。";
      break;
    case "tomb_appease":
      healParty(0.4);
      message = "亡魂放下执念，全员回复40%生命。";
      break;
    case "alchemy_transmute": {
      const input = consumeRandomRunItem();
      const outputs = [addRandomItem(), addRandomItem()].filter(Boolean);
      message = "炼金台吞没了".concat((input == null ? void 0 : input.icon) || "").concat((input == null ? void 0 : input.name) || "一件道具", "，吐出").concat(outputs.map((it) => "".concat(it.icon).concat(it.name)).join("、"), "。");
      break;
    }
    case "alchemy_empower": {
      const gains = randomEventStat(1);
      message = "炼金火焰淬炼了全队：永久".concat(formatEventGains(gains), "。");
      break;
    }
    case "blood_banner_power": {
      damagePartyPct(0.2);
      const gains = [
        addEventBonus("atk", 4 + Math.floor(state.run.floor * 0.3)),
        addEventBonus("matk", 4 + Math.floor(state.run.floor * 0.3))
      ];
      message = "祭旗收下鲜血：全员当前生命-20%，全队永久".concat(formatEventGains(gains), "。");
      break;
    }
    case "blood_banner_guard": {
      const gains = [
        addEventBonus("hp", 18 + Math.floor(state.run.floor * 1.5)),
        addEventBonus("def", 2 + Math.floor(state.run.floor * 0.2))
      ];
      healPartyFlat(gains[0].value);
      message = "祭旗赐下守护：全队永久".concat(formatEventGains(gains), "。");
      break;
    }
    case "time_rift_challenge":
      startBattle("elite", wrap.encounter || createEnemyEncounter(state.run.floor, "elite"), { id: "time_rift" });
      return;
    case "immortal_throne_challenge":
      startBattle("elite", wrap.encounter || createImmortalThroneEncounter(state.run.floor), { id: "immortal_throne" });
      return;
    case "bounty_elite":
      state.run.bountyReward = true;
      message = "你接下了精英悬赏。";
      startBattle("elite", wrap.encounter || createEnemyEncounter(state.run.floor, "elite"));
      return;
    case "bounty_intel":
      state.run.tacticBoost = true;
      message = "情报到手，下次战斗伤害+25%。";
      break;
    case "enchant_add":
      message = addAffixToRandomEquipment();
      break;
    case "upgrade_red_equip":
      message = upgradeRandomOrangeEquipment();
      break;
    case "potion_atk": {
      const gain = addEventBonus("atk", 6 + Math.floor(state.run.floor * 0.4));
      message = "力量秘药入口，永久".concat(gain.text, "。");
      break;
    }
    case "potion_matk": {
      const gain = addEventBonus("matk", 6 + Math.floor(state.run.floor * 0.4));
      message = "法力秘药入口，永久".concat(gain.text, "。");
      break;
    }
    case "potion_def": {
      const gain = addEventBonus("def", 3 + Math.floor(state.run.floor * 0.2));
      message = "铁壁秘药入口，永久".concat(gain.text, "。");
      break;
    }
    case "potion_hp": {
      const gain = addEventBonus("hp", 30 + state.run.floor * 2);
      healParty(0.2);
      message = "生命秘药入口，永久".concat(gain.text, "，全员回复20%生命。");
      break;
    }
    case "spring_drink": {
      const gain = addEventBonus("hp", 10 + state.run.floor);
      message = "生命之泉滋养躯体，永久".concat(gain.text, "。");
      break;
    }
    case "spring_heal":
      healParty(0.7);
      message = "泉水恢复了全员70%生命。";
      break;
    case "spring_bottle": {
      const gain = addEventBonus("hpRegen", 2 + Math.floor(state.run.floor * 0.2));
      message = "收集泉水后，永久".concat(gain.text, "/回合。");
      break;
    }
    case "late_treasure_gold": {
      const gold = rng(80, 120);
      state.run.gold += gold;
      message = "轮回金币产生共鸣，你获得了 ".concat(gold, " 金币。");
      break;
    }
    case "late_treasure_equip":
      item = generateEquip(state.run.floor, state.run.floor >= 100 ? "red" : "purple");
      message = "宝库核心开启，你获得了 ".concat(item.icon).concat(item.name, "。");
      break;
    case "late_treasure_item": {
      const count = rng(2, 4);
      const items = Array.from({ length: count }, () => addRandomItem()).filter(Boolean);
      message = "你获得了 ".concat(count, " 个随机道具：").concat(items.map((it) => "".concat(it.icon).concat(it.name)).join("、"), "。");
      break;
    }
    case "late_cursed_relic":
      item = generateEquip(state.run.floor, state.run.floor >= 100 ? "red" : "purple");
      damagePartyPct(0.15);
      message = "诅咒遗物认可了你的层数：获得 ".concat(item.icon).concat(item.name, "，但全员当前生命-15%。");
      break;
    case "late_fragment_magic": {
      const skillPoints = rng(1, 2);
      state.run.skillPoints += skillPoints;
      message = "秘法残响汇入灵魂，获得 ".concat(skillPoints, " 技能点。");
      break;
    }
    case "late_fragment_tactic": {
      const gains = randomEventStat(5);
      message = "战术残响淬炼了全队：永久".concat(formatEventGains(gains), "。");
      break;
    }
    case "late_fragment_exp": {
      const exp = 20 + state.run.floor * 3;
      const levels = addExp(exp);
      const mercProgress = awardDeployedMercenaryProgress(exp);
      message = "自身残响与轮回共鸣，获得 ".concat(exp, " 经验").concat(levels ? "，升级到 Lv.".concat(state.run.level) : "").concat(mercProgress.members ? "；".concat(mercProgress.members, "名上阵佣兵各获得 ").concat(exp, " 经验") : "", "。");
      break;
    }
    default:
      if (result == null ? void 0 : result.startsWith("enhance_")) message = enhanceEquip(result.replace("enhance_", ""), 0);
      break;
  }
  refreshPartyHpCaps();
  if (item) openEquipModal(item, () => completeEvent(message));
  else completeEvent(message);
}
function completeEvent(message) {
  var _a, _b, _c2, _d2, _e2;
  const wrap = currentEventWrap();
  if (!wrap) return;
  wrap.done = true;
  state.shopOpen = false;
  state.eventResult = {
    eventIdx: state.eventIdx,
    eventId: ((_a = wrap.event) == null ? void 0 : _a.id) || "",
    eventType: ((_b = wrap.event) == null ? void 0 : _b.type) || "",
    eventName: ((_c2 = wrap.event) == null ? void 0 : _c2.name) || "事件",
    eventIcon: ((_d2 = wrap.event) == null ? void 0 : _d2.icon) || "📜",
    choiceText: ((_e2 = wrap.selectedChoice) == null ? void 0 : _e2.text) || "",
    message: message || "你继续前行。"
  };
  addRunLog(message);
  saveGame();
  render();
}
function continueEventResult() {
  if (!state.eventResult) return;
  const resultIdx = state.eventResult.eventIdx;
  state.eventResult = null;
  if (state.eventIdx === resultIdx) state.eventIdx += 1;
  saveGame();
  render();
}
function tavernCandidatesFor(wrap = currentEventWrap()) {
  if (!wrap) return [];
  if (!Array.isArray(wrap.tavernCandidates) || !wrap.tavernCandidates.length) {
    wrap.tavernCandidates = generateMercRecruitOptions(3);
  }
  return wrap.tavernCandidates;
}
function openTavernRecruitModal() {
  const wrap = currentEventWrap();
  if (!wrap || !state.run) return;
  state.modal = {
    body: renderTavernRecruitPanel(tavernCandidatesFor(wrap)),
    className: "tavern-recruit-modal",
    actions: []
  };
  render();
}
function closeTavernRecruitModal() {
  state.modal = null;
  render();
}
function openMercSkillModal(unitId) {
  const member = mercRoster().find((candidate) => candidate.unitId === unitId);
  if (!member) return;
  openMercSkillDetail(member);
}
function openMercSkillDetail(member) {
  state.modal = {
    body: renderMercSkillDetailPanel(member),
    className: "merc-skill-modal",
    actions: []
  };
  render();
}
function closeMercSkillModal() {
  state.modal = null;
  render();
}
function renderMercSkillDetailPanel(member) {
  var _a;
  const cls = getClass(member.classId);
  const level = ((_a = member.mercData) == null ? void 0 : _a.level) || member.level || 1;
  const skills = mercenarySkillsFor(member);
  const progress = mercSkillProgress(member);
  const unlockedCount = progress.unlocked.length;
  return '\n    <div class="merc-skill-modal-panel">\n      <header class="merc-skill-modal-head">\n        '.concat(renderClassPortrait(member.classId, "class-portrait merc-profile-art portrait-frame frame-merc", { showBadge: false }), "\n        <div>\n          <span>").concat(esc(cls.name), " · Lv.").concat(level, "</span>\n          <h2>").concat(esc(member.name), '的技能</h2>\n        </div>\n        <button class="merc-skill-modal-close" onclick="closeMercSkillModal()" aria-label="关闭技能详情">×</button>\n      </header>\n      <div class="merc-skill-modal-summary">\n        <span>技能 <b>').concat(unlockedCount, "/").concat(skills.length, '</b></span>\n      </div>\n      <div class="merc-skill-detail-list">\n        ').concat(skills.map((skill, index) => {
    const unlocked = index < unlockedCount;
    const unlockLevel = skillUnlockLevel(index);
    const rarity = mercSkillRarity(skill);
    return '\n            <article class="merc-skill-detail merc-skill-'.concat(rarity, " ").concat(unlocked ? "unlocked" : "locked", '">\n              <div class="merc-skill-detail-head">\n                ').concat(renderSkillIcon(skill), "\n                <div>\n                  <h3>").concat(esc(skill.name), '</h3>\n                  <em class="merc-skill-rarity-label">').concat(esc(mercSkillRarityLabel(skill)), "</em>\n                  <span>").concat(unlocked ? "已解锁" : "Lv.".concat(unlockLevel, " 解锁"), "</span>\n                </div>\n              </div>\n              <p>").concat(colorText(skill.desc || "暂无技能说明。"), "</p>\n              <small>").concat(unlocked ? "消耗 ".concat(skill.cost || 0, " 能量 · 冷却 ").concat(skill.cooldown || 0, " 回合") : "当前佣兵 Lv.".concat(level, "，达到 Lv.").concat(unlockLevel, " 后自动解锁"), "</small>\n            </article>\n          ");
  }).join(""), "\n      </div>\n    </div>\n  ");
}
function openMercTraitTrialModal() {
  if (!state.run || !mercTraitTrainingCandidates().length) return;
  state.modal = {
    body: renderMercTraitTrialPanel(),
    className: "merc-trait-trial-modal",
    actions: []
  };
  render();
}
function renderMercTraitTrialPanel() {
  const candidates = mercTraitTrainingCandidates();
  return '\n    <div class="merc-trait-trial-panel">\n      <div class="merc-trait-trial-head">\n        <div>\n          <h2>⭐ 佣兵试炼场</h2>\n          <p>选择一名存活佣兵，将其开局专长提升1星。专长最高★'.concat(MAX_MERC_TRAIT_LEVEL, '。</p>\n        </div>\n      </div>\n      <div class="merc-trait-trial-list">\n        ').concat(candidates.map((member) => {
    var _a;
    const cls = getClass(member.classId);
    const trait = mercTraitFor(member);
    const current = mercTraitEffect(trait, mercTraitLevel(member));
    const next = mercTraitEffect(trait, current.star + 1);
    return '\n            <article class="merc-trait-option rarity-'.concat(esc(((_a = member.mercData) == null ? void 0 : _a.quality) || "white"), '">\n              <div class="merc-trait-option-head">\n                <h3>').concat(cls.icon, " ").concat(esc(member.name), "</h3>\n                <span>").concat("★".repeat(current.star)).concat("☆".repeat(MAX_MERC_TRAIT_LEVEL - current.star), '</span>\n              </div>\n              <p class="merc-trait-name">专长·').concat(esc((trait == null ? void 0 : trait.name) || "未命名专长"), "</p>\n              <p>当前：").concat(esc(current.text), '</p>\n              <p class="merc-trait-next">升至★').concat(current.star + 1, "：").concat(esc(next.text), "</p>\n              <button onclick=\"trainMercTrait('").concat(member.unitId, "')\">专长升至★").concat(current.star + 1, "</button>\n            </article>\n          ");
  }).join(""), "\n      </div>\n    </div>\n  ");
}
function trainMercTrait(unitId) {
  if (!state.run) return;
  const member = mercTraitTrainingCandidates().find((candidate) => candidate.unitId === unitId);
  if (!member) {
    toast("该佣兵无法继续进行专长试炼。");
    return;
  }
  const trait = mercTraitFor(member);
  member.mercData.traitLevel = mercTraitLevel(member) + 1;
  const effect = mercTraitEffect(trait, member.mercData.traitLevel);
  state.modal = null;
  completeEvent("".concat(member.name, " 的专长「").concat((trait == null ? void 0 : trait.name) || "佣兵专长", "」升至★").concat(effect.star, "：").concat(effect.text, "。"));
}
function autoResolveMercTraitTrial() {
  const member = mercTraitTrainingCandidates().slice().sort((a, b) => mercTraitLevel(a) - mercTraitLevel(b))[0];
  if (!member) {
    completeEvent("没有可继续升星的存活佣兵，队伍离开了试炼场。");
    return;
  }
  trainMercTrait(member.unitId);
}
function renderTavernRecruitPanel(candidates) {
  const mercs = mercRoster();
  return '\n    <div class="tavern-recruit-panel">\n      <div class="tavern-recruit-head">\n        <div>\n          <h2>佣兵酒馆</h2>\n          <span>挑选与你同行的冒险者</span>\n        </div>\n        <button class="tavern-close" onclick="closeTavernRecruitModal()">×</button>\n      </div>\n      <div class="tavern-rule"></div>\n      <div class="tavern-summary">\n        <div class="tavern-summary-group">\n          <span>招募 <b>'.concat(mercs.length, "/").concat(MAX_MERC_ROSTER, "</b></span>\n          <span>上阵 <b>").concat(deployedMercRoster().length, "/").concat(MAX_DEPLOYED_MERCS, '</b></span>\n        </div>\n        <b class="tavern-gold"><i aria-hidden="true"></i>').concat(state.run.gold || 0, '</b>\n      </div>\n      <div class="tavern-quality-notice">💡 两名同品质佣兵可以合成，保留目标并消耗另一名材料，使目标提升至高一阶品质。</div>\n      <div class="tavern-candidate-list">\n        ').concat(candidates.map((candidate, idx) => renderTavernCandidate(candidate, idx)).join(""), "\n      </div>\n    </div>\n  ");
}
function renderTavernCandidate(candidate, idx) {
  var _a, _b;
  const cls = getClass(candidate.classId);
  const qdef = DATA.mercQuality[candidate.quality] || DATA.mercQuality.white;
  const trait = mercTraitFor(candidate);
  const skillProgress = mercSkillProgress(candidate);
  const canAfford = !!candidate.free || (((_a = state.run) == null ? void 0 : _a.gold) || 0) >= (candidate.cost || qdef.recruitCostBase || 0);
  const hasSlot = mercRoster().length < MAX_MERC_ROSTER;
  const disabled = !canAfford || !hasSlot;
  const cost = candidate.cost || qdef.recruitCostBase || 0;
  const disabledReason = !hasSlot ? "佣兵已满（".concat(mercRoster().length, "/").concat(MAX_MERC_ROSTER, "）") : !canAfford ? "金币不足（持有 ".concat(((_b = state.run) == null ? void 0 : _b.gold) || 0, " / 需要 ").concat(cost, "）") : "";
  const btnText = candidate.free ? "免费招募" : "招募 (".concat(cost, "金)");
  const output = Math.round((qdef.outputMul || 1) * 100);
  const growth = Math.round((qdef.growthMul || 1) * 100);
  const visibleSkills = skillProgress.unlocked;
  return '\n    <article class="tavern-candidate rarity-'.concat(esc(candidate.quality || "white"), " ").concat(disabled ? "unavailable" : "", '">\n      <div class="merc-card-identity">\n        ').concat(renderClassPortrait(candidate.classId, "class-portrait merc-profile-art portrait-frame frame-merc", { showBadge: false }), '\n        <div class="merc-card-copy">\n          <div class="merc-card-title-row">\n            <h3>').concat(esc(candidate.name), '</h3>\n            <span class="merc-quality-badge">').concat(esc(qdef.name), '</span>\n          </div>\n          <p class="merc-card-meta">').concat(esc(cls.name), " · Lv.").concat(candidate.level || 1, '</p>\n          <div class="merc-snapshot" aria-label="佣兵基础倍率">\n            <span><b>').concat(output, "%</b><small>输出</small></span>\n            <span><b>").concat(growth, "%</b><small>成长</small></span>\n            ").concat(trait ? '<span class="merc-trait-mini"><b>★</b><small>'.concat(esc(trait.name), "</small></span>") : "", '\n          </div>\n        </div>\n      </div>\n      <div class="merc-skill-row">\n        <div class="merc-skill-strip" aria-label="已解锁主动技能">\n          ').concat(visibleSkills.map((skill) => renderMercSkillChip(skill)).join(""), '\n        </div>\n      </div>\n      <button class="tavern-recruit-button" ').concat(disabled ? "disabled" : "", ' onclick="recruitMercCandidate(').concat(idx, ')" aria-label="招募').concat(esc(candidate.name), '">').concat(btnText, "</button>\n      ").concat(disabledReason ? '<small class="choice-disabled-reason">无法招募：'.concat(esc(disabledReason), "</small>") : "", '\n      <details class="merc-card-details tavern-details">\n        <summary>查看培养详情</summary>\n        <div class="merc-detail-copy">\n          <p><b>品质加成</b>').concat(esc(mercBonusText(qdef)), "</p>\n          ").concat(trait ? "<p><b>开局专长 · ".concat(esc(trait.name), "</b>").concat(esc(trait.desc), "</p>") : "", "\n        </div>\n      </details>\n    </article>\n  ");
}
function recruitMercCandidate(idx) {
  var _a;
  const wrap = currentEventWrap();
  const candidates = tavernCandidatesFor(wrap);
  const candidate = candidates[idx];
  const member = addMercenaryFromCandidate(candidate, { log: false });
  if (!member) return openTavernRecruitModal();
  wrap.tavernCandidates = candidates.filter((_, i) => i !== idx);
  state.modal = null;
  const qdef = DATA.mercQuality[((_a = member.mercData) == null ? void 0 : _a.quality) || "white"] || DATA.mercQuality.white;
  completeEvent("🍺 ".concat(member.name, "（").concat(qdef.name, "）加入了队伍。"));
}
function autoResolveTavernRecruit(wrap = currentEventWrap()) {
  var _a;
  if (!wrap || !state.run) return;
  const revived = reviveFallenMercenaries(0.5);
  if (mercRoster().length >= MAX_MERC_ROSTER) {
    completeEvent("".concat(revived ? "酒馆复活了".concat(revived, "名佣兵，") : "", "佣兵招募已达上限，队伍离开了酒馆。"));
    return;
  }
  const qualityRank = { white: 1, green: 2, blue: 3, purple: 4, orange: 5 };
  const candidates = tavernCandidatesFor(wrap);
  const affordable = candidates.filter((candidate) => candidate.free || state.run.gold >= (candidate.cost || 0));
  if (!affordable.length) {
    completeEvent("".concat(revived ? "酒馆复活了".concat(revived, "名佣兵，") : "", "没有合适的佣兵加入。"));
    return;
  }
  const best = affordable.slice().sort((a, b) => (qualityRank[b.quality] || 0) - (qualityRank[a.quality] || 0) || (b.cost || 0) - (a.cost || 0))[0];
  const member = addMercenaryFromCandidate(best, { log: false });
  if (!member) {
    completeEvent("没有合适的佣兵加入。");
    return;
  }
  const qdef = DATA.mercQuality[((_a = member.mercData) == null ? void 0 : _a.quality) || "white"] || DATA.mercQuality.white;
  completeEvent("🍺 ".concat(member.name, "（").concat(qdef.name, "）加入了队伍。").concat(revived ? " 同时复活了".concat(revived, "名佣兵。") : ""));
}
function addRunBuff(id, name, statMod, battles, effects = {}) {
  state.run.buffs[id] = { id, name, statMod, battles, ...effects };
}
function decayRunBuffs() {
  var _a;
  if (!((_a = state.run) == null ? void 0 : _a.buffs)) return;
  for (const [id, buff] of Object.entries(state.run.buffs)) {
    if (buff.battles == null) continue;
    buff.battles -= 1;
    if (buff.battles <= 0) delete state.run.buffs[id];
  }
}
function healParty(pctValue) {
  if (!state.run) return;
  for (const m of state.run.party) {
    if (m.mercData && !m.mercData.alive) continue;
    const stats = calcUnitStats(m);
    const gain = Math.floor(stats.hp * pctValue);
    state.run.currentHp[m.unitId] = Math.min(stats.hp, (state.run.currentHp[m.unitId] || 1) + gain);
  }
}
function healPartyFlat(amount) {
  if (!state.run) return;
  for (const m of state.run.party) {
    if (m.mercData && !m.mercData.alive) continue;
    const stats = calcUnitStats(m);
    state.run.currentHp[m.unitId] = Math.min(stats.hp, (state.run.currentHp[m.unitId] || 1) + Math.max(0, amount));
  }
}
function restoreEnergyParty(pctValue) {
  if (!state.run) return;
  for (const m of state.run.party) {
    const stats = calcUnitStats(m);
    state.run.currentEnergy[m.unitId] = Math.min(stats.energy, (state.run.currentEnergy[m.unitId] || 0) + Math.floor(stats.energy * pctValue));
  }
}
function damagePartyPct(pctValue) {
  if (!state.run) return;
  for (const m of state.run.party) {
    const hp = state.run.currentHp[m.unitId] || 1;
    state.run.currentHp[m.unitId] = Math.max(1, hp - Math.floor(hp * pctValue));
  }
}
function addRandomItem() {
  const items = Object.values(DATA.items);
  const itemId = weightedPick(items.map((it) => ({ id: it.id, w: it.dropWeight })));
  addItem(itemId);
  return DATA.items[itemId] || null;
}
function consumeRandomRunItem() {
  var _a;
  const itemIds = Object.entries(((_a = state.run) == null ? void 0 : _a.items) || {}).filter(([, count]) => count > 0).map(([id]) => id);
  if (!itemIds.length) return null;
  const itemId = pick(itemIds);
  if (!removeItem(itemId)) return null;
  return DATA.items[itemId] || null;
}
const EVENT_STAT_LABELS = {
  hp: "最大生命",
  atk: "攻击",
  matk: "法强",
  def: "防御",
  hpRegen: "生命恢复",
  energyRegen: "能量回复",
  statusRes: "状态抗性"
};
function addEventBonus(stat, value) {
  state.run.eventBonuses[stat] = (state.run.eventBonuses[stat] || 0) + value;
  const label = EVENT_STAT_LABELS[stat] || stat;
  return { stat, value, label, text: "".concat(label, "+").concat(value) };
}
function formatEventGains(gains) {
  return gains.filter(Boolean).map((gain) => gain.text || "".concat(gain.label, "+").concat(gain.value)).join("，");
}
function randomEventStat(power) {
  const f = state.run.floor;
  if (power >= 5) {
    return [
      addEventBonus("hp", 20 + f * 2),
      addEventBonus("atk", 4 + Math.floor(f * 0.4)),
      addEventBonus("matk", 4 + Math.floor(f * 0.4)),
      addEventBonus("def", 2 + Math.floor(f * 0.2)),
      addEventBonus("statusRes", 2 + Math.floor(f * 0.2))
    ];
  }
  const stat = pick(["hp", "atk", "matk", "def", "statusRes"]);
  const values = { hp: 15 + f, atk: 2 + Math.floor(f * 0.2), matk: 2 + Math.floor(f * 0.2), def: 2 + Math.floor(f * 0.2), statusRes: 2 + Math.floor(f * 0.15) };
  return [addEventBonus(stat, values[stat])];
}
function canAddForgeAffix(item) {
  if (!item || item.enchantApplied || (item.affixes || []).length >= (DATA.equipRarityAffixSlots[item.rarity] || 0)) return false;
  const used = new Set((item.affixes || []).filter((a) => a.stat).map((a) => a.stat));
  return DATA.statAffixes.some((affix) => !used.has(affix.stat));
}
function addAffixToRandomEquipment() {
  const equippedSlots = DATA.equipSlots.filter((s) => canAddForgeAffix(state.run.equipment[s]));
  if (!equippedSlots.length) return "没有可追加词条的装备（每件限1次且不能超过词缀槽数）。";
  const slot = pick(equippedSlots);
  const item = state.run.equipment[slot];
  const used = new Set((item.affixes || []).filter((a) => a.stat).map((a) => a.stat));
  const pool = DATA.statAffixes.filter((a) => !used.has(a.stat));
  if (!pool.length) return "".concat(item.name, " 的词条已经很满。");
  const af = pick(pool);
  let value = rng(af.min, af.max);
  if (["hp", "atk", "matk", "def"].includes(af.stat)) value = Math.floor(value * floorScale(state.run.floor));
  item.affixes.push({ stat: af.stat, name: af.name, value });
  item.enchantApplied = true;
  return "附魔师为 ".concat(item.icon).concat(item.name, " 追加 ").concat(af.name, "+").concat(value, "。");
}
function upgradeRandomOrangeEquipment() {
  const equippedSlots = DATA.equipSlots.filter((s) => {
    var _a;
    return ((_a = state.run.equipment[s]) == null ? void 0 : _a.rarity) === "orange";
  });
  if (!equippedSlots.length) return "需要至少一件已装备的橙色装备。";
  const item = state.run.equipment[pick(equippedSlots)];
  const ratio = DATA.equipRarityBaseMult.red / DATA.equipRarityBaseMult.orange;
  for (const stat of [...item.baseStats || [], ...item.affixes || []]) {
    if ((stat == null ? void 0 : stat.stat) && Number.isFinite(stat.value)) stat.value = Math.max(1, Math.floor(stat.value * ratio));
  }
  item.rarity = "red";
  item.name = item.name.startsWith("赤红·") ? item.name : "赤红·".concat(item.name);
  return "劫火淬炼完成：".concat(item.icon).concat(item.name, " 升阶为红色装备。");
}
function isPuppeteerUnit(unit) {
  return !!unit && !unit.isCommandPuppet && getBaseClassId(unit.classId) === "puppeteer";
}
function makeCommandPuppet(owner) {
  var _a;
  const ownsGrandPuppeteer = isTalentOwner(owner) && (((_a = state.run) == null ? void 0 : _a.talents) || []).some((talent) => talent.passive === "grand_puppeteer");
  const grandHp = ownsGrandPuppeteer ? talentStarValue("grand_puppeteer", null, state.run, "hpValues") : 0;
  const guardianHp = unitHasCombatPassive(owner, "puppet_guardian_set") ? 0.2 : 0;
  const ironHp = ["iron_machinist", "clockwork_bastion"].includes(owner.classId) ? 0.25 : 0;
  const reinforcedCoreHp = hasSkillPassive("puppeteer_reinforced_core", owner) ? 0.1 : 0;
  const maxHp = Math.max(1, Math.floor(owner.maxHp * 0.48 * (1 + grandHp + guardianHp + ironHp + reinforcedCoreHp)));
  const ironDef = ["iron_machinist", "clockwork_bastion"].includes(owner.classId) ? 1.3 : 1;
  const stats = {
    hp: maxHp,
    atk: Math.max(1, Math.floor((owner.stats.matk || owner.stats.atk || 1) * 0.4)),
    matk: Math.max(1, Math.floor((owner.stats.matk || owner.stats.atk || 1) * 0.72)),
    def: Math.max(1, Math.floor((owner.stats.def || 1) * 0.85 * ironDef)),
    crit: owner.stats.crit || 0,
    critDmg: owner.stats.critDmg || 50,
    energy: 0,
    energyRegen: 0,
    aggro: 55
  };
  return {
    side: "ally",
    unitId: "puppet_".concat(owner.unitId),
    ownerUnitId: owner.unitId,
    classId: owner.classId,
    name: "机关傀儡",
    icon: "🤖",
    isCommandPuppet: true,
    isPlayer: false,
    isSecondHero: false,
    isMerc: false,
    stats,
    hp: maxHp,
    maxHp,
    energy: 0,
    shield: 0,
    buffs: {},
    cooldowns: {},
    alive: true,
    memberRef: null
  };
}
function commandPuppetFor(owner, includeDead = false) {
  var _a;
  const puppet = (((_a = state.combat) == null ? void 0 : _a.allies) || []).find((unit) => unit.isCommandPuppet && unit.ownerUnitId === (owner == null ? void 0 : owner.unitId)) || null;
  return includeDead || (puppet == null ? void 0 : puppet.alive) ? puppet : null;
}
function commandPuppetOwner(unit, includeDead = true) {
  var _a;
  if (!(unit == null ? void 0 : unit.isCommandPuppet) || !unit.ownerUnitId) return null;
  const owner = (((_a = state.combat) == null ? void 0 : _a.allies) || []).find((ally) => !ally.isCommandPuppet && ally.unitId === unit.ownerUnitId) || null;
  return includeDead || (owner == null ? void 0 : owner.alive) ? owner : null;
}
function combatCreditUnit(unit) {
  return (unit == null ? void 0 : unit.isCommandPuppet) ? commandPuppetOwner(unit, true) || unit : unit;
}
function captureCombatCheckpoint(kind, eventBattleReward = null, encounter = null) {
  if (!state.run) return false;
  state.run.pendingBattle = {
    kind: ["normal", "elite", "boss"].includes(kind) ? kind : "normal",
    eventBattleReward: cloneSaveData(eventBattleReward),
    encounter: cloneSaveData(encounter)
  };
  state.combatCheckpoint = cloneSaveData(currentRunSnapshot());
  if (saveGame()) return true;
  delete state.run.pendingBattle;
  state.combatCheckpoint = null;
  return false;
}
function pendingBattleEncounter(pending = ((_g) => (_g = state.run) == null ? void 0 : _g.pendingBattle)()) {
  var _a, _b;
  if (!pending || !state.run) return null;
  if (pending.encounter) return cloneSaveData(pending.encounter);
  if (((_a = pending.eventBattleReward) == null ? void 0 : _a.id) === "immortal_throne") return createImmortalThroneEncounter(state.run.floor);
  if (((_b = pending.eventBattleReward) == null ? void 0 : _b.id) === "time_rift") return createEnemyEncounter(state.run.floor, "elite");
  const wrap = currentEventWrap();
  return (wrap == null ? void 0 : wrap.encounter) || (wrap == null ? void 0 : wrap.bossData) || null;
}
function resumePendingBattle() {
  var _a;
  const pending = (_a = state.run) == null ? void 0 : _a.pendingBattle;
  if (!pending || state.combat) return false;
  startBattle(pending.kind, pendingBattleEncounter(pending), pending.eventBattleReward || null);
  return !!state.combat;
}
function restoreCombatCheckpoint() {
  if (!state.combatCheckpoint) return false;
  const snapshot = cloneSaveData(state.combatCheckpoint);
  state.run = snapshot.run;
  state.floorEvents = snapshot.floorEvents;
  state.eventIdx = snapshot.eventIdx;
  state.eventResult = snapshot.eventResult;
  state.shopOpen = snapshot.shopOpen;
  state.combat = null;
  state.combatCheckpoint = null;
  state.pendingSkill = null;
  state.pendingEquip = null;
  return true;
}
function startBattle(kind, encounterOverride = null, eventBattleReward = null) {
  var _a, _b;
  if (!state.run) return;
  const encounter = encounterOverride || createEnemyEncounter(state.run.floor, kind);
  if (!captureCombatCheckpoint(kind, eventBattleReward, encounter)) return;
  const enemies = encounter.templates || generateEnemies(state.run.floor, kind);
  const stage = encounter.stage || getEnemyStage(state.run.floor);
  const battleStartEnergy = Object.values(state.run.buffs || {}).reduce((total, buff) => total + Math.max(0, Number(buff.startEnergy) || 0), 0);
  const heroes = state.run.party.filter((member) => !member.mercData);
  const allyMembers = [...heroes, ...deployedMercRoster()];
  const allies = allyMembers.map((m) => {
    var _a2;
    const stats = calcUnitStats(m);
    return {
      side: "ally",
      unitId: m.unitId,
      classId: m.classId,
      name: m.name,
      icon: getClass(m.classId).icon,
      isPlayer: m.isPlayer,
      isSecondHero: m.isSecondHero,
      isMerc: !!m.mercData,
      stats,
      hp: clamp(state.run.currentHp[m.unitId] || stats.hp, 1, stats.hp),
      maxHp: stats.hp,
      energy: clamp(((_a2 = state.run.currentEnergy[m.unitId]) != null ? _a2 : stats.energy) + battleStartEnergy, 0, stats.energy),
      shield: 0,
      buffs: {},
      cooldowns: {},
      alive: true,
      memberRef: m
    };
  });
  const puppets = allies.filter(isPuppeteerUnit).map(makeCommandPuppet);
  allies.push(...puppets);
  const scale = floorScale(state.run.floor) * runDifficultyMultiplier(state.run);
  const combatEnemies = enemies.map((e, idx) => {
    var _a2, _b2, _c2;
    const formationHpScale = (_a2 = e.formationHpScale) != null ? _a2 : 1;
    const formationStatScale = (_b2 = e.formationStatScale) != null ? _b2 : 1;
    const hp = Math.floor(e.hp * scale * formationHpScale);
    const matk = Math.floor((e.matk || 0) * scale * formationStatScale);
    const aggro = (_c2 = e.aggro) != null ? _c2 : (e.def || 0) >= 12 ? 40 : (e.atk || 0) >= 20 ? 25 : 20;
    const enemyUnit = applyEnemyPassiveAffixStats({
      side: "enemy",
      unitId: "enemy".concat(idx + 1),
      name: e.name,
      icon: e.icon,
      tag: e.tag,
      role: e.role || DATA.enemyTemplateRoles[e.id] || "怪物",
      stats: { hp, atk: Math.floor(e.atk * scale * formationStatScale), matk, def: Math.floor((e.def || 3) * scale * formationStatScale), aggro },
      hp,
      maxHp: hp,
      shield: 0,
      buffs: {},
      cooldowns: {},
      alive: true,
      skills: activeEnemySkills(e, state.run.floor),
      passiveAffixes: e.passiveAffixes || [],
      template: e,
      mechanicsTriggered: {},
      charging: null,
      nextSkillId: null,
      intentIcon: DATA.intentIcons.attack,
      intentText: "攻击"
    });
    return applyClimbEnemyStartModifiers(enemyUnit, e, kind);
  });
  state.combat = {
    kind,
    eventBattleReward,
    allies,
    enemies: combatEnemies,
    enemyStage: stage,
    enemyFormation: encounter.formation || null,
    turn: 1,
    order: [],
    currentIdx: 0,
    phase: "running",
    activeUnitId: "",
    log: [],
    rewardPending: false,
    result: null,
    overchargePool: 0,
    comboStack: 0,
    lastSkillId: "",
    currentEffectSkillId: "",
    chainKillBonus: false,
    adaptStacks: {},
    mirrorTurnCounter: 0,
    mirrorLastSkill: null,
    tier2CastSerial: 0,
    deathMarkState: {},
    actionSerial: 0,
    multiHitCount: 0,
    floaters: [],
    floaterSeq: 0,
    floatCleanupTimer: 0,
    advanceTimer: 0,
    advanceMaxStepsSeen: 0,
    quickBattleMode: false,
    turnLimitReached: false,
    inputSerial: 0,
    targetSelectSerial: 0,
    _passiveCache: null,
    _logUnitPatternKey: "",
    _logUnitPattern: null
  };
  rebuildCombatPassiveCache(state.combat);
  state.pendingSkill = null;
  state.screen = "combat";
  playMusic("battle");
  combatLog("⚔️ 战斗开始：".concat(kindLabel(kind), "。"));
  combatLog("⏳ 回合上限 ".concat(BATTLE_MAX_TURNS, "；第 ").concat(BATTLE_DAMAGE_ESCALATION_START_TURN + 1, " 回合起，双方伤害每回合 +").concat(BATTLE_DAMAGE_BONUS_PER_TURN * 100, "%。"));
  if ((_a = encounter.formation) == null ? void 0 : _a.name) combatLog("👥 敌军编队：".concat(encounter.formation.name, "。"));
  if (stage == null ? void 0 : stage.name) combatLog("🗺️ 敌军阶段：".concat(stage.name, "。"));
  for (const enemy of state.combat.enemies) {
    if (!((_b = enemy.passiveAffixes) == null ? void 0 : _b.length)) continue;
    combatLog("✦ ".concat(enemy.name, " 的被动词条：").concat(enemy.passiveAffixes.map((affix) => enemyPassiveAffixLogLabel(affix)).join("、"), "。"));
  }
  applyEnemyPassiveAffixBattleStart();
  const enemyRuleHint = enemyCombatRuleHint(state.combat.enemies);
  if (enemyRuleHint) combatLog("🧿 ".concat(enemyRuleHint));
  applyBattleStartTalents();
  applyMercBattleStartTraits();
  applyTier2BattleStartMechanics();
  captureBattleEntryHealth();
  buildTurnOrder();
  advanceCombat();
  saveGame();
  if (!state.combat || !["player_choose", "victory", "defeat"].includes(state.combat.phase)) render();
}
function kindLabel(kind) {
  return kind === "boss" ? "Boss战" : kind === "elite" ? "精英战" : "遭遇战";
}
function captureBattleEntryHealth(combat = state.combat) {
  if (!combat) return [];
  combat.entryPlayerStates = combat.allies.filter((unit) => unit.isPlayer && unit.alive).map((unit) => ({
    unitId: unit.unitId,
    name: unit.name,
    hp: Math.max(0, Math.floor(unit.hp)),
    maxHp: Math.max(1, Math.floor(unit.maxHp)),
    shield: Math.max(0, Math.floor(unit.shield || 0))
  }));
  for (const entry of combat.entryPlayerStates.filter((unit) => unit.hp / unit.maxHp <= BATTLE_LOW_HP_WARNING_RATIO)) {
    combatLog("⚠️ 低血量入场：".concat(entry.name, "仅剩 ").concat(entry.hp, "/").concat(entry.maxHp, " 生命，建议先治疗；快速战斗可能被集火击败。"));
  }
  return combat.entryPlayerStates;
}
function lowHealthBattleEntryStates(combat = state.combat) {
  return ((combat == null ? void 0 : combat.entryPlayerStates) || []).filter((entry) => entry.hp / Math.max(1, entry.maxHp) <= BATTLE_LOW_HP_WARNING_RATIO);
}
function renderBattleEntryLowHealthWarning(combat = state.combat) {
  const entries = lowHealthBattleEntryStates(combat);
  if (!entries.length) return "";
  const healthText = entries.map((entry) => "".concat(esc(entry.name), " ").concat(entry.hp, "/").concat(entry.maxHp)).join("、");
  return '<div class="battle-low-hp-warning" role="alert">⚠️ 低血量入场：'.concat(healthText, "<span>快速战斗可能被集火击败</span></div>");
}
function battleTurnDamageBonus(combat = state.combat) {
  const turn = Math.min(BATTLE_MAX_TURNS, Math.max(0, Math.floor(Number(combat == null ? void 0 : combat.turn) || 0)));
  return Math.max(0, turn - BATTLE_DAMAGE_ESCALATION_START_TURN) * BATTLE_DAMAGE_BONUS_PER_TURN;
}
function battleTurnDamageMultiplier(combat = state.combat) {
  return 1 + battleTurnDamageBonus(combat);
}
function combatLog(message) {
  var _a, _b, _c2;
  if ((_a = state.combat) == null ? void 0 : _a.quickBattleMode) return;
  (_b = state.combat) == null ? void 0 : _b.log.push(message);
  if (((_c2 = state.combat) == null ? void 0 : _c2.log.length) > 180) state.combat.log.shift();
  addRunLog(message);
}
function sourceEffectSkillId(sourceName) {
  const id = SOURCE_EFFECT_SKILL_ART[sourceName] || "";
  return SKILL_EFFECT_ART[id] ? id : "";
}
function combatFloatSkillId(explicitSkillId = "") {
  var _a;
  const id = explicitSkillId || ((_a = state.combat) == null ? void 0 : _a.currentEffectSkillId) || "";
  return SKILL_EFFECT_ART[id] ? id : "";
}
function pushCombatEffectSkill(skillId) {
  const c = state.combat;
  if (!c) return () => {
  };
  const prev = c.currentEffectSkillId || "";
  c.currentEffectSkillId = SKILL_EFFECT_ART[skillId] ? skillId : "";
  return () => {
    if (state.combat === c) c.currentEffectSkillId = prev;
  };
}
function enemySkillId(skill) {
  var _a;
  return ((_a = Object.entries(DATA.enemySkills || {}).find(([, def]) => def === skill)) == null ? void 0 : _a[0]) || "";
}
function emitCombatFloat(unit, text, kind = "damage", skillId = "") {
  const c = state.combat;
  if (!c || !(unit == null ? void 0 : unit.unitId) || !text) return;
  if (c.quickBattleMode) return;
  c.floaters || (c.floaters = []);
  c.floaterSeq = (c.floaterSeq || 0) + 1;
  const id = c.floaterSeq;
  const cleanKind = String(kind || "damage");
  const rawText = String(text);
  const now = Date.now();
  const isCrit = cleanKind === "crit";
  const isDown = cleanKind === "down";
  const recentSameTarget = c.floaters.filter((f) => f.unitId === unit.unitId && now - (f.createdAt || 0) < 400).length;
  const stagger = Math.min(recentSameTarget, 4);
  const x = Math.round((Math.random() - 0.5) * 30);
  const top = Math.round((isDown ? 36 : 20) + Math.random() * 6);
  const y = -stagger * 16;
  const duration = isDown ? 900 : 1e3;
  c.floaters.push({
    id,
    unitId: unit.unitId,
    text: rawText,
    kind: cleanKind,
    skillId: combatFloatSkillId(skillId),
    createdAt: now,
    impactPlayed: false,
    top,
    x,
    y,
    anchorRatio: isDown ? 0.52 : 0.48,
    rise: isDown ? -30 : 50,
    fontSize: isCrit ? 26 : 18,
    scale: 1,
    peakScale: isCrit ? 1.3 : 1,
    duration,
    delay: 0
  });
  if (c.floaters.length > 28) c.floaters.splice(0, c.floaters.length - 28);
  scheduleCombatFloatCleanup(c);
}
function cleanupCombatFloaters(c = state.combat) {
  var _a;
  if (!((_a = c == null ? void 0 : c.floaters) == null ? void 0 : _a.length)) return;
  const now = Date.now();
  c.floaters = c.floaters.filter((f) => now - (f.createdAt || 0) < 1200);
}
function scheduleCombatFloatCleanup(c = state.combat) {
  if (!c || c.quickBattleMode || c.floatCleanupTimer) return;
  const defer = typeof window !== "undefined" && typeof window.setTimeout === "function" ? window.setTimeout.bind(window) : typeof setTimeout === "function" ? setTimeout : null;
  if (!defer) return;
  c.floatCleanupTimer = defer(() => {
    var _a;
    if (state.combat !== c) return;
    c.floatCleanupTimer = 0;
    cleanupCombatFloaters(c);
    if ((_a = c.floaters) == null ? void 0 : _a.length) scheduleCombatFloatCleanup(c);
  }, 1250);
}
function cssAttrValue(value) {
  return String(value != null ? value : "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function combatFloatLayer(kind) {
  const layers = { shield: 12, energy: 16, heal: 20, dodge: 28, damage: 32, crit: 40, down: 44 };
  return layers[kind] || 30;
}
function combatFloatStyle(f, now = Date.now()) {
  const kind = String(f.kind || "damage").replace(/[^a-z0-9_-]/gi, "");
  const screenX = Number.isFinite(f.screenX) ? f.screenX : -9999;
  const screenY = Number.isFinite(f.screenY) ? f.screenY : -9999;
  const rise = Number.isFinite(f.rise) ? f.rise : 50;
  const fontSize = Number.isFinite(f.fontSize) ? f.fontSize : kind === "crit" ? 26 : 18;
  const scale = Number.isFinite(f.scale) ? f.scale : 1;
  const peakScale = Number.isFinite(f.peakScale) ? f.peakScale : kind === "crit" ? 1.3 : 1;
  const duration = Number.isFinite(f.duration) ? f.duration : 1e3;
  const baseDelay = Number.isFinite(f.delay) ? f.delay : 0;
  const createdAt = Number.isFinite(f.createdAt) ? f.createdAt : now;
  const age = Math.max(0, now - createdAt);
  const delay = Math.max(-duration, Math.round(baseDelay - age));
  const rise10 = Math.round(-rise * 0.19);
  const rise25 = Math.round(-rise * 0.4375);
  const rise60 = Math.round(-rise * 0.84);
  const riseEnd = Math.round(-rise);
  return "--float-screen-x:".concat(screenX, "px;--float-screen-y:").concat(screenY, "px;--float-rise-10:").concat(rise10, "px;--float-rise-25:").concat(rise25, "px;--float-rise-60:").concat(rise60, "px;--float-rise-end:").concat(riseEnd, "px;--float-font:").concat(fontSize, "px;--float-scale:").concat(scale, ";--float-peak-scale:").concat(peakScale, ";--float-duration:").concat(duration, "ms;--float-delay:").concat(delay, "ms;--float-layer:").concat(combatFloatLayer(kind));
}
function renderCombatFloatLayer() {
  var _a;
  const c = state.combat;
  if (!((_a = c == null ? void 0 : c.floaters) == null ? void 0 : _a.length)) return "";
  cleanupCombatFloaters();
  if (!c.floaters.length) return "";
  const now = Date.now();
  return '<div class="combat-float-viewport">'.concat(c.floaters.map((f) => {
    const kind = String(f.kind || "damage").replace(/[^a-z0-9_-]/gi, "");
    const unresolved = Number.isFinite(f.screenX) && Number.isFinite(f.screenY) ? "" : " float-unresolved";
    return '<span class="combat-float float-'.concat(kind).concat(unresolved, '" data-float-id="').concat(f.id, '" style="').concat(combatFloatStyle(f, now), '"><span class="combat-float-text">').concat(esc(f.text), "</span></span>");
  }).join(""), "</div>");
}
function applyCombatFloatPosition(f, screenRect) {
  if (!(f == null ? void 0 : f.unitId)) return false;
  const selector = '.unit-card[data-unit-id="'.concat(cssAttrValue(f.unitId), '"]');
  const card = document.querySelector(selector);
  if (!card) return false;
  const rect = card.getBoundingClientRect();
  const anchorRatio = Number.isFinite(f.anchorRatio) ? f.anchorRatio : 0.48;
  f.screenX = Math.round(rect.left - screenRect.left + rect.width / 2 + (Number.isFinite(f.x) ? f.x : 0));
  f.screenY = Math.round(rect.top - screenRect.top + rect.height * anchorRatio + (Number.isFinite(f.y) ? f.y : 0));
  return true;
}
function syncCombatFloatElements() {
  var _a;
  const c = state.combat;
  if (!((_a = c == null ? void 0 : c.floaters) == null ? void 0 : _a.length) || state.screen !== "combat") return;
  const screen = document.querySelector(".combat-screen");
  if (!screen) return;
  const screenRect = screen.getBoundingClientRect();
  const now = Date.now();
  for (const f of c.floaters) {
    if (!Number.isFinite(f.screenX) || !Number.isFinite(f.screenY)) applyCombatFloatPosition(f, screenRect);
    const el = screen.querySelector('.combat-float[data-float-id="'.concat(f.id, '"]'));
    if (!el || !Number.isFinite(f.screenX) || !Number.isFinite(f.screenY)) continue;
    el.setAttribute("style", combatFloatStyle(f, now));
    el.classList.remove("float-unresolved");
  }
}
function recentCombatImpactFloat(unit) {
  var _a;
  const c = state.combat;
  if (!((_a = c == null ? void 0 : c.floaters) == null ? void 0 : _a.length) || !(unit == null ? void 0 : unit.unitId)) return null;
  const now = Date.now();
  const recent = c.floaters.filter((f) => f.unitId === unit.unitId && !f.impactPlayed && now - (f.createdAt || 0) < 360).slice().reverse();
  for (const kind of ["crit", "damage", "shield", "down"]) {
    const found = recent.find((f) => f.kind === kind);
    if (found) return found;
  }
  return null;
}
function consumeCombatImpactFloat(unit) {
  const recent = recentCombatImpactFloat(unit);
  if (recent) recent.impactPlayed = true;
  return recent;
}
function combatImpactClass(recent) {
  if ((recent == null ? void 0 : recent.kind) === "crit") return "impact-crit";
  if ((recent == null ? void 0 : recent.kind) === "damage") return "impact-hit";
  if ((recent == null ? void 0 : recent.kind) === "shield") return "impact-shield";
  if ((recent == null ? void 0 : recent.kind) === "down") return "impact-down";
  return "";
}
function combatImpactEffectUrl(recent) {
  if (!recent) return "";
  if (recent.skillId && SKILL_EFFECT_ART[recent.skillId]) return SKILL_EFFECT_ART[recent.skillId];
  return IMPACT_FALLBACK_ART[recent.kind] || "";
}
function combatImpactStyle(recent) {
  const url = combatImpactEffectUrl(recent);
  return url ? " style=\"--impact-image:url('".concat(url, "')\"") : "";
}
function applyBattleStartTalents() {
  const c = state.combat;
  if (!c || !state.run) return;
  if (hasTalent("iron_heart")) {
    const hero = c.allies[0];
    const { multiplier } = hiddenTalentStarValues("iron_heart");
    if (state.run.ironHeartLastFloor !== state.run.floor) {
      const add = state.run.floor * multiplier;
      state.run.hiddenStacks.def = (state.run.hiddenStacks.def || 0) + add;
      hero.stats.def += add;
      state.run.ironHeartLastFloor = state.run.floor;
      combatLog("🛡️ 铁壁之心：防御永久 +".concat(add, "。"));
    }
    const shield = Math.max(1, Math.floor(hero.stats.def * 0.5 * multiplier));
    const gained = grantShield(hero, shield);
    combatLog("🛡️ 铁壁之心：获得 ".concat(gained, " 护盾。"));
  }
  if (hasTalent("soul_harvest")) {
    const { multiplier } = hiddenTalentStarValues("soul_harvest");
    const bonusPct = state.run.floor * multiplier;
    combatLog("👻 灵魂收割：本场全伤害 +".concat(bonusPct, "%。"));
  }
  if (hasTalent("opening_shield")) {
    const shieldPct = talentStarValue("opening_shield");
    for (const a of c.allies) grantShield(a, Math.floor(a.maxHp * shieldPct), { emit: false });
    combatLog("🛡️ 先手护盾：全员获得护盾。");
  }
  if (hasTalent("war_council")) {
    for (const a of c.allies) grantShield(a, Math.floor(a.maxHp * 0.15 * talentStarValue("war_council")), { emit: false });
    combatLog("🛡️ 全军出击：队伍整备完成。");
  }
  const player = c.allies.find((ally) => ally.isPlayer && ally.alive);
  if (player && hasTalent("sacred_covenant")) {
    const target = c.allies.filter((ally) => ally.alive && ally !== player && !ally.isCommandPuppet).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (target) {
      applyBuff(target, "sacred_covenant", null, 1, player);
      combatLog("✦ 圣约庇佑：".concat(target.name, " 成为守护目标。"));
    }
  }
  if (player && hasTalent("thornwood_domain")) {
    const shieldPct = talentStarValue("thornwood_domain");
    for (const ally of c.allies.filter((unit) => unit.alive)) grantShield(ally, Math.floor(ally.maxHp * shieldPct), { emit: false });
    combatLog("🌿 荆棘森域：全队获得开局护盾。 ");
  }
  if (hasTalent("earth_bulwark")) {
    for (const a of c.allies.filter((unit) => unit.isPlayer)) {
      const gain = Math.floor(a.maxHp * 0.2);
      a.maxHp += gain;
      a.hp += gain;
      a.stats.hp = a.maxHp;
    }
    combatLog("🛡️ 大地壁垒：英雄最大生命提升。");
  }
  for (const owner of c.allies.filter((unit) => unit.alive && ["iron_machinist", "clockwork_bastion"].includes(unit.classId))) {
    const puppet = commandPuppetFor(owner);
    if (!puppet) continue;
    const shield = grantShield(puppet, Math.floor(puppet.maxHp * 0.2), { applyTalent: false });
    combatLog("⚙️ 钢躯机关：".concat(puppet.name, " 获得 ").concat(shield, " 开局护盾。"));
  }
  for (const [id, buff] of Object.entries(state.run.buffs || {})) {
    combatLog("✨ ".concat(buff.name, " 生效。"));
    if (buff.statMod) {
      for (const a of c.allies) {
        const hpBefore = Math.max(1, a.maxHp || a.stats.hp || 1);
        const hpRatio = a.hp / hpBefore;
        applyStatMod(a.stats, buff.statMod);
        if (a.stats.hp !== hpBefore) {
          a.maxHp = Math.max(1, a.stats.hp);
          a.hp = clamp(Math.floor(a.maxHp * hpRatio), 1, a.maxHp);
        }
      }
    }
  }
}
function mercTraitFor(unit) {
  return DATA.mercTraits[getBaseClassId((unit == null ? void 0 : unit.classId) || "")] || null;
}
const MAX_MERC_TRAIT_LEVEL = 3;
const MERC_BATTLE_STRATEGIES = Object.freeze({
  balanced: { name: "均衡", desc: "根据战况兼顾救援、防护与输出" },
  aggressive: { name: "强攻", desc: "优先使用伤害最高的可用技能" },
  cautious: { name: "稳健", desc: "优先治疗、驱散与防护技能" }
});
function mercBattleStrategyKey(memberOrUnit) {
  var _a, _b, _c2;
  const member = (memberOrUnit == null ? void 0 : memberOrUnit.mercData) ? memberOrUnit : (memberOrUnit == null ? void 0 : memberOrUnit.memberRef) || ((_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b.find((entry) => entry.unitId === (memberOrUnit == null ? void 0 : memberOrUnit.unitId)));
  const key = (_c2 = member == null ? void 0 : member.mercData) == null ? void 0 : _c2.battleStrategy;
  return Object.prototype.hasOwnProperty.call(MERC_BATTLE_STRATEGIES, key) ? key : "balanced";
}
function setMercBattleStrategy(unitId, strategyKey, selectElement = null) {
  var _a, _b;
  if (!state.run || !Object.prototype.hasOwnProperty.call(MERC_BATTLE_STRATEGIES, strategyKey)) return false;
  const member = state.run.party.find((entry) => entry.unitId === unitId && entry.mercData);
  if (!member) return false;
  member.mercData.battleStrategy = strategyKey;
  const strategy = MERC_BATTLE_STRATEGIES[strategyKey];
  const control = (_a = selectElement == null ? void 0 : selectElement.closest) == null ? void 0 : _a.call(selectElement, ".merc-strategy-control");
  const description = (_b = control == null ? void 0 : control.querySelector) == null ? void 0 : _b.call(control, ".merc-strategy-description");
  if (description) description.textContent = strategy.desc;
  saveGame();
  return true;
}
function mercTraitLevel(memberOrUnit) {
  var _a;
  const member = (memberOrUnit == null ? void 0 : memberOrUnit.mercData) ? memberOrUnit : memberOrUnit == null ? void 0 : memberOrUnit.memberRef;
  return clamp(Math.floor(((_a = member == null ? void 0 : member.mercData) == null ? void 0 : _a.traitLevel) || 1), 1, MAX_MERC_TRAIT_LEVEL);
}
function mercTraitEffect(trait, level = 1) {
  const star = clamp(Math.floor(level || 1), 1, MAX_MERC_TRAIT_LEVEL);
  const values = [null, 1, 2, 3];
  if (!trait) return { star, text: "" };
  if (trait.id === "vanguard") {
    const shieldPct = [0, 20, 30, 40][star];
    const tauntTurns = star === 3 ? 3 : 2;
    return { star, shieldPct, tauntTurns, text: "开局获得".concat(shieldPct, "%生命护盾，并嘲讽敌人").concat(tauntTurns, "回合") };
  }
  if (trait.id === "arcane_rally") {
    const turns = values[star] + 1;
    return { star, turns, text: "开局全队获得急速".concat(turns, "回合") };
  }
  if (trait.id === "hunter_mark") {
    const turns = values[star] + 1;
    return { star, turns, text: "开局标记首个敌人".concat(turns, "回合，使其受到伤害提高") };
  }
  if (trait.id === "battle_prayer") {
    const turns = values[star];
    return { star, turns, text: "开局全队获得坚韧".concat(turns, "回合，伤害减免20%") };
  }
  if (trait.id === "shadow_entry") {
    const turns = values[star] + 1;
    return { star, turns, text: "开局获得闪避与强化".concat(turns, "回合") };
  }
  if (trait.id === "blood_awaken") {
    const healPct = [0, 20, 30, 40][star];
    const turns = values[star] + 1;
    return { star, healPct, turns, text: "开局恢复".concat(healPct, "%生命，并获得强化").concat(turns, "回合") };
  }
  if (trait.id === "nature_blessing") {
    const turns = values[star] + 1;
    return { star, turns, text: "开局全队获得再生".concat(turns, "回合") };
  }
  if (trait.id === "puppet_screen") {
    const puppetShieldPct = [0, 20, 30, 40][star];
    const ownerShieldPct = [0, 10, 15, 20][star];
    return { star, puppetShieldPct, ownerShieldPct, text: "开局傀儡获得".concat(puppetShieldPct, "%生命护盾，主人获得").concat(ownerShieldPct, "%生命护盾") };
  }
  return { star, text: trait.desc || "" };
}
function mercTraitTrainingCandidates() {
  return mercRoster().filter((member) => {
    var _a;
    return ((_a = member.mercData) == null ? void 0 : _a.alive) !== false && mercTraitLevel(member) < MAX_MERC_TRAIT_LEVEL;
  });
}
function mercenarySkillStore(mercenary) {
  return (mercenary == null ? void 0 : mercenary.mercData) || mercenary || null;
}
function mercSkillRarity(skill) {
  return (skill == null ? void 0 : skill._mercRarity) || (skill == null ? void 0 : skill.mercRarity) || "common";
}
function mercSkillRarityLabel(skill) {
  return MERC_SKILL_RARITY_LABELS[mercSkillRarity(skill)] || MERC_SKILL_RARITY_LABELS.common;
}
function mercSkillRarityRank(skillOrRarity) {
  const rarity = typeof skillOrRarity === "string" ? skillOrRarity : mercSkillRarity(skillOrRarity);
  return MERC_SKILL_RARITY_ORDER.indexOf(rarity);
}
function mercenaryBasicSkill(classId) {
  const basic = allClassSkills(classId)[0];
  if (!basic) return null;
  return {
    ...basic,
    effects: (basic.effects || []).map((effect) => ({ ...effect })),
    _mercBasic: true,
    _mercRarity: "basic"
  };
}
function mercenarySkillDefinitions(classId) {
  var _a;
  const baseClassId = getBaseClassId(classId);
  const classSkills = allClassSkills(classId).slice(1).map((skill, index) => ({
    ...skill,
    effects: (skill.effects || []).map((effect) => ({ ...effect })),
    _mercRarity: skill.mercRarity || MERC_SKILL_DEFAULT_RARITIES[index] || "common"
  }));
  const mercOnlySkills = (((_a = DATA.mercSkills) == null ? void 0 : _a[baseClassId]) || []).map((skill) => ({
    ...skill,
    effects: (skill.effects || []).map((effect) => ({ ...effect })),
    _mercRarity: skill.mercRarity || "rare"
  }));
  const known = /* @__PURE__ */ new Set();
  return [...classSkills, ...mercOnlySkills].filter((skill) => {
    if (!(skill == null ? void 0 : skill.id) || known.has(skill.id)) return false;
    known.add(skill.id);
    return true;
  });
}
function rollMercSkillRarity(quality = "white") {
  const weights = MERC_SKILL_RARITY_WEIGHTS[quality] || MERC_SKILL_RARITY_WEIGHTS.white;
  return weightedPick(MERC_SKILL_RARITY_ORDER.map((id) => ({ id, w: weights[id] || 0 })).filter((entry) => entry.w > 0));
}
function fillMercenarySkillIds(classId, selectedIds = []) {
  const pool = mercenarySkillDefinitions(classId);
  const selected = [];
  for (const id of selectedIds) {
    if (pool.some((skill) => skill.id === id) && !selected.includes(id)) selected.push(id);
  }
  for (const skill of pool) {
    if (selected.length >= MERC_SKILL_SLOT_COUNT - 1) break;
    if (!selected.includes(skill.id)) selected.push(skill.id);
  }
  return selected.slice(0, MERC_SKILL_SLOT_COUNT - 1);
}
function rollMercenarySkillIds(classId, quality = "white") {
  const basic = mercenaryBasicSkill(classId);
  if (!basic) return [];
  const available = mercenarySkillDefinitions(classId);
  const selected = [];
  while (selected.length < MERC_SKILL_SLOT_COUNT - 1 && available.length) {
    const desiredRarity = rollMercSkillRarity(quality);
    let candidates = available.filter((skill) => mercSkillRarity(skill) === desiredRarity);
    if (!candidates.length) {
      const desiredRank = mercSkillRarityRank(desiredRarity);
      candidates = [...available].sort((a, b) => {
        const aGap = Math.abs(mercSkillRarityRank(a) - desiredRank);
        const bGap = Math.abs(mercSkillRarityRank(b) - desiredRank);
        return aGap - bGap || mercSkillRarityRank(a) - mercSkillRarityRank(b);
      });
    }
    const chosen = pick(candidates);
    if (!chosen) break;
    selected.push(chosen.id);
    const index = available.findIndex((skill) => skill.id === chosen.id);
    if (index >= 0) available.splice(index, 1);
  }
  return [basic.id, ...fillMercenarySkillIds(classId, selected)];
}
function ensureMercenarySkillState(mercenary, { rollIfMissing = false } = {}) {
  const store = mercenarySkillStore(mercenary);
  const classId = mercenary == null ? void 0 : mercenary.classId;
  const basic = mercenaryBasicSkill(classId);
  if (!store || !basic) return [];
  const available = new Set(mercenarySkillDefinitions(classId).map((skill) => skill.id));
  const existing = Array.isArray(store.skillIds) ? store.skillIds : [];
  const selected = existing.filter((id) => id !== basic.id && available.has(id));
  const ids = selected.length ? [basic.id, ...fillMercenarySkillIds(classId, selected)] : rollIfMissing ? rollMercenarySkillIds(classId, store.quality || (mercenary == null ? void 0 : mercenary.quality) || "white") : [basic.id];
  store.skillIds = ids;
  return ids;
}
function mercenarySkillsFor(mercenary) {
  const classId = mercenary == null ? void 0 : mercenary.classId;
  const basic = mercenaryBasicSkill(classId);
  if (!basic) return [];
  const definitions = new Map(mercenarySkillDefinitions(classId).map((skill) => [skill.id, skill]));
  return ensureMercenarySkillState(mercenary).map((id) => {
    const skill = id === basic.id ? basic : definitions.get(id);
    return skill ? { ...skill, effects: (skill.effects || []).map((effect) => ({ ...effect })) } : null;
  }).filter(Boolean);
}
function tryUpgradeMercenarySkill(member) {
  var _a;
  ensureMercenarySkillState(member);
  const store = mercenarySkillStore(member);
  if (!((_a = store == null ? void 0 : store.skillIds) == null ? void 0 : _a.length)) return null;
  const basic = mercenaryBasicSkill(member.classId);
  const current = mercenarySkillsFor(member).filter((skill) => skill.id !== (basic == null ? void 0 : basic.id));
  const lowest = [...current].sort((a, b) => mercSkillRarityRank(a) - mercSkillRarityRank(b))[0];
  if (!lowest) return null;
  const desiredRarity = rollMercSkillRarity(store.quality || "white");
  if (mercSkillRarityRank(desiredRarity) <= mercSkillRarityRank(lowest)) return null;
  const currentIds = new Set(current.map((skill) => skill.id));
  const candidates = mercenarySkillDefinitions(member.classId).filter((skill) => mercSkillRarity(skill) === desiredRarity && !currentIds.has(skill.id));
  const replacement = pick(candidates);
  if (!replacement) return null;
  store.skillIds = store.skillIds.map((id) => id === lowest.id ? replacement.id : id);
  return { previous: lowest, replacement };
}
function unlockedMercSkills(mercenary, level = 1) {
  if (typeof mercenary === "string") {
    return allClassSkills(mercenary).filter((skill, index) => Math.max(1, Math.floor(level || 1)) >= skillUnlockLevel(index));
  }
  return mercenarySkillsFor(mercenary);
}
function mercSkillProgress(mercenary, level = 1) {
  const unlocked = typeof mercenary === "string" ? unlockedMercSkills(mercenary, level) : mercenarySkillsFor(mercenary);
  return {
    unlocked,
    next: null,
    nextLevel: 0,
    total: typeof mercenary === "string" ? allClassSkills(mercenary).length : MERC_SKILL_SLOT_COUNT
  };
}
function renderMercSkillChip(skill, detailUnitId = "") {
  const rarity = mercSkillRarity(skill);
  const label = mercSkillRarityLabel(skill);
  const content = "".concat(renderSkillIcon(skill), "<span>").concat(esc(skill.name), "</span><em>").concat(esc(label), "</em>");
  const title = "".concat(label, "技能：").concat(skill.name);
  if (detailUnitId) {
    return '<button type="button" class="merc-skill-chip merc-skill-chip-button merc-skill-'.concat(rarity, '" title="').concat(esc(title), '" aria-label="查看').concat(esc(skill.name), '技能详情" onclick="openMercSkillModal(\'').concat(detailUnitId, "')\">").concat(content, "</button>");
  }
  return '<span class="merc-skill-chip merc-skill-'.concat(rarity, '" title="').concat(esc(title), '">').concat(content, "</span>");
}
function applyMercBattleStartTraits() {
  const c = state.combat;
  if (!c) return;
  for (const unit of c.allies.filter((ally) => ally.alive && ally.isMerc)) {
    const trait = mercTraitFor(unit);
    if (!trait) continue;
    const effect = mercTraitEffect(trait, mercTraitLevel(unit));
    combatLog("⭐ ".concat(unit.name, " 的佣兵专长★").concat(effect.star, "「").concat(trait.name, "」发动：").concat(effect.text, "。"));
    if (trait.id === "vanguard") {
      const shield = Math.floor(unit.maxHp * (effect.shieldPct || 0) / 100);
      grantShield(unit, shield);
      applyBuff(unit, "taunt", effect.tauntTurns);
    } else if (trait.id === "arcane_rally") {
      for (const ally of c.allies.filter((member) => member.alive)) applyBuff(ally, "haste", effect.turns);
    } else if (trait.id === "hunter_mark") {
      const target = c.enemies.find((enemy) => enemy.alive);
      if (target) applyBuff(target, "hunted", effect.turns);
    } else if (trait.id === "battle_prayer") {
      for (const ally of c.allies.filter((member) => member.alive)) applyBuff(ally, "fortify", effect.turns);
    } else if (trait.id === "shadow_entry") {
      applyBuff(unit, "evasion", effect.turns);
      applyBuff(unit, "strengthen", effect.turns);
    } else if (trait.id === "blood_awaken") {
      healRaw(unit, Math.floor(unit.maxHp * (effect.healPct || 0) / 100));
      applyBuff(unit, "strengthen", effect.turns);
    } else if (trait.id === "nature_blessing") {
      for (const ally of c.allies.filter((member) => member.alive)) applyBuff(ally, "regen", effect.turns);
    } else if (trait.id === "puppet_screen") {
      const puppet = commandPuppetFor(unit, true);
      if (puppet == null ? void 0 : puppet.alive) grantShield(puppet, Math.floor(puppet.maxHp * (effect.puppetShieldPct || 0) / 100));
      grantShield(unit, Math.floor(unit.maxHp * (effect.ownerShieldPct || 0) / 100));
    }
  }
}
function tier2State(unit) {
  if (!unit) return {};
  unit._tier2 || (unit._tier2 = {});
  return unit._tier2;
}
function isTier2Class(unit, classId) {
  return !!unit && unit.classId === classId;
}
function hasSkillEffect(skill, effectType) {
  return ((skill == null ? void 0 : skill.effects) || []).some((effect) => effect.type === effectType);
}
function isMultiHitSkill(skill) {
  return ((skill == null ? void 0 : skill.effects) || []).some((effect) => effect.type === "damage" && Math.max(1, effect.hits || 1) >= 2);
}
function consumeBuffStack(unit, buffId) {
  var _a;
  const buff = (_a = unit == null ? void 0 : unit.buffs) == null ? void 0 : _a[buffId];
  if (!buff) return false;
  buff.stacks = Math.max(0, (buff.stacks || 1) - 1);
  if (buff.stacks <= 0) delete unit.buffs[buffId];
  return true;
}
function tier2AliveAlly(classId, exclude = null) {
  var _a;
  return (((_a = state.combat) == null ? void 0 : _a.allies) || []).find((ally) => ally.alive && ally !== exclude && isTier2Class(ally, classId)) || null;
}
function tier2LowestAliveEnemy() {
  var _a;
  return (((_a = state.combat) == null ? void 0 : _a.enemies) || []).filter((enemy) => enemy.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null;
}
function tier2LowestAliveAlly() {
  var _a;
  return (((_a = state.combat) == null ? void 0 : _a.allies) || []).filter((ally) => ally.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null;
}
function tier2QueueExtraAction(unit, message) {
  const c = state.combat;
  if (!c || !(unit == null ? void 0 : unit.alive)) return;
  const idx = c.allies.indexOf(unit);
  if (idx < 0) return;
  c.order.splice(c.currentIdx, 0, { side: "ally", idx });
  if (message) combatLog(message);
}
function tier2CopyCooldowns(cooldowns) {
  return Object.fromEntries(Object.entries(cooldowns || {}).map(([id, value]) => [id, value]));
}
function tier2CaptureTimeAnchor(unit) {
  const tier2 = tier2State(unit);
  tier2.anchor = {
    hp: Math.max(1, unit.hp),
    energy: unit.energy,
    cooldowns: tier2CopyCooldowns(unit.cooldowns)
  };
}
function applyTier2BattleStartMechanics() {
  const c = state.combat;
  if (!c) return;
  for (const ally of c.allies) {
    ally._tier2 = {};
    if (isTier2Class(ally, "time_lord")) tier2CaptureTimeAnchor(ally);
  }
}
function tier2OnActionReady(unit) {
  if (isTier2Class(unit, "time_lord") && !tier2State(unit).anchorUsed) tier2CaptureTimeAnchor(unit);
}
function tier2CheckDoomAwakening(unit) {
  if (!isTier2Class(unit, "doombringer") || !unit.alive || unit.hp <= 0) return;
  const tier2 = tier2State(unit);
  if (tier2.doomUsed || unit.hp > unit.maxHp * 0.35) return;
  tier2.doomUsed = true;
  tier2.doomCharges = 3;
  tier2QueueExtraAction(unit, "🔥 终焉血怒觉醒：".concat(unit.name, "立即获得额外行动，接下来3次技能血焰施法。"));
}
function tier2OnSkillCommitted(unit, skill, doomBloodCast, opts = {}) {
  const tier2 = tier2State(unit);
  tier2.currentDoomBoost = false;
  tier2.currentMiracle = false;
  tier2.miracleApplied = false;
  tier2.currentBeastGod = false;
  if (opts.echo) return;
  if (doomBloodCast) {
    tier2.doomCharges = Math.max(0, (tier2.doomCharges || 0) - 1);
    tier2.currentDoomBoost = true;
    const hpCost = Math.min(Math.max(1, Math.floor(unit.hp * 0.08)), Math.max(0, unit.hp - 1));
    unit.hp -= hpCost;
    combatLog("🩸 血焰施法：消耗".concat(hpCost, "生命，本次伤害+35%（剩余").concat(tier2.doomCharges, "次）。"));
  }
  if (isTier2Class(unit, "holy_pope") && hasSkillEffect(skill, "heal") && tier2.miracleReady) {
    tier2.miracleReady = false;
    tier2.currentMiracle = true;
  }
  if (isTier2Class(unit, "ancient_beast_god") && (tier2.beastGodActions || 0) > 0) {
    tier2.currentBeastGod = true;
  }
}
function tier2FinishSkill(unit) {
  tier2State(unit).currentDoomBoost = false;
}
function tier2ResolveHealTargets(caster, targets) {
  var _a, _b;
  const tier2 = tier2State(caster);
  if (!isTier2Class(caster, "holy_pope") || !tier2.currentMiracle || tier2.miracleApplied) return targets;
  tier2.miracleApplied = true;
  const dead = !tier2.miracleReviveUsed ? (((_a = state.combat) == null ? void 0 : _a.allies) || []).find((ally) => !ally.alive) : null;
  if (dead) {
    tier2.miracleReviveUsed = true;
    dead.alive = true;
    dead.hp = Math.max(1, Math.floor(dead.maxHp * 0.3));
    dead.shield || (dead.shield = 0);
    emitCombatFloat(dead, "+".concat(dead.hp), "heal");
    combatLog("✨ 神迹降临：".concat(dead.name, "以30%生命复活。"));
    return [];
  }
  combatLog("✨ 神迹降临：本次治疗扩展至全体友方。");
  return (((_b = state.combat) == null ? void 0 : _b.allies) || []).filter((ally) => ally.alive);
}
function tier2BeforeHealthDamage(target, dmg, attacker = null, opts = {}) {
  var _a;
  const attackerSide = (attacker == null ? void 0 : attacker.side) || opts.sourceSide || "";
  if (attackerSide !== "enemy" || !(target == null ? void 0 : target.alive) || dmg <= 0) return dmg;
  if (!opts.noTier2RootShare) {
    const guardian = tier2AliveAlly("world_tree_guardian", target);
    if (guardian) {
      const tier2 = tier2State(guardian);
      const turn = ((_a = state.combat) == null ? void 0 : _a.turn) || 1;
      if (tier2.rootTurn !== turn) {
        tier2.rootTurn = turn;
        tier2.rootAbsorbed = 0;
      }
      const cap = Math.max(1, Math.floor(guardian.maxHp * 0.3));
      const remain = Math.max(0, cap - (tier2.rootAbsorbed || 0));
      const shared = Math.min(Math.floor(dmg * 0.25), remain);
      if (shared > 0) {
        tier2.rootAbsorbed = (tier2.rootAbsorbed || 0) + shared;
        const redirected = Math.max(1, Math.floor(shared * 0.6));
        dmg = Math.max(0, dmg - shared);
        combatLog("🌳 根系共生：".concat(guardian.name, "分担").concat(shared, "伤害，实际承受").concat(redirected, "。"));
        takeDamage(guardian, redirected, attacker, { trueDamage: true, sourceName: "根系共生", sourceSide: attackerSide, noTier2RootShare: true });
      }
    }
  }
  const templar = tier2AliveAlly("templar_guardian", target);
  if (templar && dmg >= target.hp) {
    const tier2 = tier2State(templar);
    if (!tier2.sanctuaryUsed) {
      tier2.sanctuaryUsed = true;
      dmg = Math.max(0, target.hp - 1);
      const shield = Math.max(1, Math.floor(target.maxHp * 0.3 + templar.stats.def * 1.5));
      const gained = grantShield(target, shield);
      combatLog("🛡️ 永恒圣域：".concat(target.name, "保留1生命并获得").concat(gained, "护盾。"));
    }
  }
  return dmg;
}
function tier2TryPreventDeath(unit) {
  if (!unit || unit.hp > 0) return false;
  const tier2 = tier2State(unit);
  if (isTier2Class(unit, "time_lord") && !tier2.anchorUsed && tier2.anchor) {
    tier2.anchorUsed = true;
    unit.hp = Math.max(1, Math.min(unit.maxHp, tier2.anchor.hp || 1));
    unit.energy = Math.min(unit.stats.energy || 100, tier2.anchor.energy || 0);
    unit.cooldowns = tier2CopyCooldowns(tier2.anchor.cooldowns);
    unit.alive = true;
    tier2QueueExtraAction(unit, "⏳ 时之锚逆转死亡：".concat(unit.name, "恢复行动开始时的生命、能量和冷却，并立即行动。"));
    return true;
  }
  if (isTier2Class(unit, "blood_progenitor") && !tier2.bloodReviveUsed) {
    const pool = tier2.bloodPool || 0;
    const minimum = Math.max(1, Math.floor(unit.maxHp * 0.15));
    if (pool >= minimum) {
      tier2.bloodReviveUsed = true;
      const reviveHp = Math.min(Math.floor(unit.maxHp * 0.35), pool);
      const remaining = pool - reviveHp;
      tier2.bloodPool = 0;
      unit.hp = Math.max(1, reviveHp);
      unit.alive = true;
      const shield = Math.min(Math.floor(unit.maxHp * 0.5), remaining);
      const gained = grantShield(unit, shield);
      emitCombatFloat(unit, "+".concat(unit.hp), "heal");
      combatLog("🩸 不灭血海：消耗血池复活".concat(unit.name, "至").concat(unit.hp, "生命，余量化为").concat(gained, "护盾。"));
      return true;
    }
  }
  return false;
}
function tier2AfterDamage(target, dealt, attacker, wasCrit) {
  var _a, _b;
  if (!(attacker == null ? void 0 : attacker.alive) || attacker.side !== "ally" || dealt <= 0) return;
  const tier2 = tier2State(attacker);
  if (isTier2Class(attacker, "eternal_night_king") && wasCrit) {
    const turn = ((_a = state.combat) == null ? void 0 : _a.turn) || 1;
    if (tier2.nightCritTurn !== turn) {
      tier2.nightCritTurn = turn;
      const prey = tier2LowestAliveEnemy();
      if (prey) {
        const damage = Math.max(1, Math.floor((attacker.stats.atk || 1) * 0.6));
        combatLog("🌑 永夜追猎：追击".concat(prey.name, "，造成").concat(damage, "真实伤害。"));
        takeDamage(prey, damage, attacker, { trueDamage: true, sourceName: "永夜追猎", noTier2Offense: true });
      }
    }
  }
  if (isTier2Class(attacker, "divine_judge") && target.alive) {
    tier2.sinSerials || (tier2.sinSerials = {});
    const serial = ((_b = state.combat) == null ? void 0 : _b.tier2CastSerial) || 0;
    if (tier2.sinSerials[target.unitId] !== serial) {
      tier2.sinSerials[target.unitId] = serial;
      target._tier2Sin = (target._tier2Sin || 0) + 1;
      if (target._tier2Sin >= 4) {
        target._tier2Sin = 0;
        const power = Math.max(attacker.stats.atk || 1, attacker.stats.matk || 1);
        const damage = Math.max(1, Math.min(Math.floor(target.maxHp * 0.06), Math.floor(power * 1.5)));
        combatLog("⚖️ 罪业清算：造成".concat(damage, "真实伤害。"));
        dealPercentTrueDamage(target, damage, attacker, { sourceName: "罪业清算", noTier2Offense: true });
        const ally = tier2LowestAliveAlly();
        if (ally) {
          const heal = Math.max(1, Math.floor(power * 0.6));
          const actual = healRaw(ally, heal);
          combatLog("✨ 神罚余辉：治疗".concat(ally.name).concat(actual, "生命。"));
        }
      }
    }
  }
}
function tier2RecordLifesteal(unit, attemptedHeal, actualHeal) {
  if (!isTier2Class(unit, "blood_progenitor")) return;
  const overflow = Math.max(0, (attemptedHeal || 0) - (actualHeal || 0));
  if (overflow <= 0) return;
  const tier2 = tier2State(unit);
  const before = tier2.bloodPool || 0;
  tier2.bloodPool = Math.min(unit.maxHp, before + overflow);
  const oldQuarter = Math.floor(before / Math.max(1, unit.maxHp * 0.25));
  const newQuarter = Math.floor(tier2.bloodPool / Math.max(1, unit.maxHp * 0.25));
  if (before === 0 || newQuarter > oldQuarter) {
    combatLog("🩸 不灭血海：储存".concat(tier2.bloodPool, "血池（").concat(Math.floor(tier2.bloodPool / unit.maxHp * 100), "%最大生命）。"));
  }
}
function tier2OnEnemyDefeated(enemy) {
  var _a, _b;
  if (!enemy || enemy._tier2PoisonMigrated || !((_a = enemy.buffs) == null ? void 0 : _a.poison)) return;
  const poisonKing = tier2AliveAlly("calamity_poison_king");
  if (!poisonKing) return;
  enemy._tier2PoisonMigrated = true;
  const poison = enemy.buffs.poison;
  const targets = (((_b = state.combat) == null ? void 0 : _b.enemies) || []).filter((other) => other.alive && other !== enemy && other.hp > 0).slice(0, 2);
  if (!targets.length) return;
  const stacks = Math.max(1, Math.floor((poison.stacks || 1) * 0.6));
  for (const target of targets) {
    if (!applyDot(poisonKing, target, "poison", Math.max(2, poison.turns || 2), poison.power || 1)) continue;
    target.buffs.poison.stacks = Math.max(1, (target.buffs.poison.stacks || 1) + stacks - 1);
  }
  combatLog("☠️ 灾厄迁徙：".concat(enemy.name, "的毒素迁徙至").concat(targets.length, "个目标，各").concat(stacks, "层。"));
}
function tier2BuildEchoSkill(skill) {
  const echo = cloneSkill(skill);
  echo.name = "".concat(skill.name, "·无相");
  echo.cost = 0;
  echo.cooldown = 0;
  echo.effects = (skill.effects || []).filter((effect) => !["energy", "selfDmgPct"].includes(effect.type)).map((effect) => {
    const next = { ...effect };
    if (typeof next.coeff === "number") next.coeff *= 0.45;
    if (typeof next.dmgCoeff === "number") next.dmgCoeff *= 0.45;
    if (typeof next.chance === "number") next.chance *= 0.5;
    if (typeof next.turns === "number") next.turns = Math.max(1, Math.floor(next.turns * 0.5));
    if (typeof next.stacks === "number") next.stacks = Math.max(1, Math.floor(next.stacks * 0.5));
    return next;
  });
  return echo;
}
function tier2BuildWindEchoSkill(skill) {
  const echo = tier2BuildEchoSkill(skill);
  echo.name = "".concat(skill.name, "·风暴回响");
  echo.effects = (echo.effects || []).map((effect) => ({ ...effect, noWindArrowStack: true }));
  return echo;
}
function tier2AfterSkill(caster, skill, targetIdx, targets = []) {
  var _a, _b, _c2, _d2;
  const tier2 = tier2State(caster);
  if (isTier2Class(caster, "elemental_overlord")) {
    const element = { m_fireball: "fire", m_frost: "frost", m_lightning: "lightning" }[skill.id];
    if (element) {
      tier2.elements || (tier2.elements = {});
      tier2.elements[element] = true;
      if (Object.keys(tier2.elements).length >= 3) {
        tier2.elements = {};
        const power = caster.stats.matk || 1;
        combatLog("🧬 元素坍缩：三元素共鸣，对全体造成真实伤害并使全部冷却-1。");
        for (const enemy of (((_a = state.combat) == null ? void 0 : _a.enemies) || []).filter((unit) => unit.alive)) {
          const damage = Math.max(1, Math.min(Math.floor(enemy.maxHp * 0.05), Math.floor(power * 1.8)));
          dealPercentTrueDamage(enemy, damage, caster, { sourceName: "元素坍缩", noTier2Offense: true });
        }
        for (const [id, cooldown] of Object.entries(caster.cooldowns || {})) {
          if (cooldown > 0) caster.cooldowns[id] = Math.max(0, cooldown - 1);
        }
      }
    }
  }
  if (isTier2Class(caster, "formless_blade_saint") && skill.cost > 0) {
    tier2.formlessSkills || (tier2.formlessSkills = {});
    if (!tier2.formlessSkills[skill.id]) tier2.formlessSkills[skill.id] = true;
    else tier2.formlessSkills = { [skill.id]: true };
    if (Object.keys(tier2.formlessSkills).length >= 3) {
      tier2.formlessSkills = {};
      combatLog("⚔️ 无相连式：第三式以45%效果免费复现。");
      useSkill(caster, tier2BuildEchoSkill(skill), targetIdx, { free: true, echo: true });
    }
  }
  if (isTier2Class(caster, "shadow_hunter_king") && skill.targets === "single" && hasSkillEffect(skill, "damage")) {
    const target = targets.find((unit) => (unit == null ? void 0 : unit.side) === "enemy") || ((_c2 = (_b = state.combat) == null ? void 0 : _b.enemies) == null ? void 0 : _c2[Number.isInteger(targetIdx) ? targetIdx : -1]) || null;
    if (target == null ? void 0 : target.unitId) {
      if (tier2.sunTargetId !== target.unitId) {
        tier2.sunTargetId = target.unitId;
        tier2.sunAimCasts = 0;
      }
      tier2.sunAimCasts = (tier2.sunAimCasts || 0) + 1;
      if (tier2.sunAimCasts >= 4) {
        tier2.sunAimCasts = 0;
        const prey = target.alive ? target : null;
        if (prey) {
          combatLog("☀️ 贯日准星锁定：向".concat(prey.name, "追加贯日箭。"));
          dealDamage(caster, prey, { coeff: 1.5, statKey: "atk", armorPen: 0.5, noTier2Offense: true }, "贯日箭", 0);
        }
      }
    }
  }
  if (isTier2Class(caster, "beast_king") && isMultiHitSkill(skill)) {
    const turn = ((_d2 = state.combat) == null ? void 0 : _d2.turn) || 1;
    if (tier2.windEchoTurn !== turn) {
      tier2.windEchoTurn = turn;
      combatLog("🌪️ 万箭回响：以45%效果重复「".concat(skill.name, "」。"));
      useSkill(caster, tier2BuildWindEchoSkill(skill), targetIdx, { free: true, echo: true });
    }
  }
  if (isTier2Class(caster, "holy_pope") && hasSkillEffect(skill, "heal")) {
    if (tier2.currentMiracle) tier2.currentMiracle = false;
    else {
      tier2.healCasts = (tier2.healCasts || 0) + 1;
      if (tier2.healCasts >= 3) {
        tier2.healCasts = 0;
        tier2.miracleReady = true;
        combatLog("✨ 神迹降临已就绪：下一次治疗将强化。");
      }
    }
  }
  if (isTier2Class(caster, "ancient_beast_god")) {
    const form = { d_bear: "bear", d_hawk: "hawk", d_swarm: "swarm" }[skill.id];
    if (form) {
      tier2.beastForms || (tier2.beastForms = {});
      tier2.beastForms[form] = true;
      if (Object.keys(tier2.beastForms).length >= 3) {
        tier2.beastForms = {};
        tier2.beastGodActions = 3;
        combatLog("🐾 三相归一：进入兽神姿态3次行动，受伤-25%，攻击后追加远古冲击。");
      }
    }
    if (tier2.currentBeastGod) {
      if (hasSkillEffect(skill, "damage")) {
        const prey = tier2LowestAliveEnemy();
        if (prey) {
          const power = Math.max(caster.stats.atk || 1, caster.stats.matk || 1);
          const damage = Math.max(1, Math.floor(power * 0.7));
          combatLog("🐾 远古冲击：追击".concat(prey.name, "，造成").concat(damage, "真实伤害。"));
          takeDamage(prey, damage, caster, { trueDamage: true, sourceName: "远古冲击", noTier2Offense: true });
        }
      }
      tier2.beastGodActions = Math.max(0, (tier2.beastGodActions || 0) - 1);
      tier2.currentBeastGod = false;
      if (tier2.beastGodActions === 0) combatLog("🐾 兽神姿态结束。");
    }
  }
}
function buildTurnOrder() {
  const c = state.combat;
  if (!c) return;
  clearCombatStatusEffectCaches();
  c.order = [];
  c.multiHitCount = 0;
  c.currentIdx = 0;
  const turnDamageBonus = battleTurnDamageBonus(c);
  combatLog("第 ".concat(c.turn, " 回合").concat(turnDamageBonus > 0 ? " · 双方伤害 +".concat(Math.round(turnDamageBonus * 100), "%") : ""));
  for (const [idx, a] of c.allies.entries()) {
    if (!a.alive || a.isCommandPuppet) continue;
    c.order.push({ side: "ally", idx });
    if (a.isPlayer && hasTalent("gale_breath")) c.order.push({ side: "ally", idx });
  }
  for (const [idx, e] of c.enemies.entries()) {
    if (e.alive) c.order.push({ side: "enemy", idx });
  }
  rollEnemyIntents();
}
function rollEnemyIntents() {
  const c = state.combat;
  if (!c) return;
  for (const enemy of c.enemies) {
    if (!enemy.alive) continue;
    if (enemy.charging) {
      enemy.intentIcon = DATA.intentIcons.charge;
      enemy.intentText = "蓄力中";
      continue;
    }
    const target = pickAllyTarget();
    const sid = pickEnemySkill(enemy, target);
    const skill = DATA.enemySkills[sid] || DATA.enemySkills.e_attack;
    enemy.nextSkillId = sid;
    enemy.nextTargetUnitId = (target == null ? void 0 : target.unitId) || "";
    enemy.intentIcon = skill.chargeUp ? DATA.intentIcons.charge : DATA.intentIcons[skill.intent || "attack"] || DATA.intentIcons.attack;
    enemy.intentText = skill.name || "攻击";
  }
}
function advanceCombat() {
  const c = state.combat;
  if (!c || c.phase === "victory" || c.phase === "defeat") return;
  if (c.turn > BATTLE_MAX_TURNS) {
    finishBattleByTurnLimit();
    return;
  }
  const startMs = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const maxSteps = c.quickBattleMode ? 80 : 32;
  const timeBudgetMs = c.quickBattleMode ? Infinity : 8;
  let guard = 0;
  while (guard < maxSteps) {
    guard += 1;
    if (checkBattleEnd()) return;
    if (c.currentIdx >= c.order.length) {
      if (c.turn >= BATTLE_MAX_TURNS) {
        finishBattleByTurnLimit();
        return;
      }
      c.turn += 1;
      buildTurnOrder();
      continue;
    }
    const step = c.order[c.currentIdx];
    c.currentIdx += 1;
    const unit = step.side === "ally" ? c.allies[step.idx] : c.enemies[step.idx];
    if (!unit || !unit.alive) continue;
    c.actionSerial = (c.actionSerial || 0) + 1;
    prepareUnitTurn(unit);
    if (!unit.alive || checkBattleEnd()) continue;
    if (statusEffectApplies(unit, "stun", { scope: currentActionStatusScope() })) {
      if (unit.side === "enemy" && triggerEnemyBattleSpirit(unit)) {
      } else {
        if (unit.side === "enemy" && unit.charging) {
          combatLog("💥 ".concat(unit.name, " 的蓄力被打断了。"));
          unit.charging = null;
          unit.intentIcon = DATA.intentIcons.stun;
          unit.intentText = "被打断";
        }
        combatLog("💫 ".concat(unit.name, " 被眩晕，跳过行动。"));
        tickBuffs(unit);
        continue;
      }
    }
    if (unit.side === "enemy") {
      checkBossMechanics(unit);
      triggerEnemyPassiveAffixTurnStart(unit);
      if (!unit.alive || checkBattleEnd()) continue;
    }
    if (unit.side === "ally" && unit.isPlayer) {
      c.phase = "player_choose";
      c.activeUnitId = unit.unitId;
      c.advanceTimer = 0;
      c.inputSerial = (c.inputSerial || 0) + 1;
      c.targetSelectSerial = 0;
      state.pendingSkill = null;
      if (!c.quickBattleMode) {
        saveGame();
        render();
      }
      return;
    }
    if (unit.side === "ally") mercAct(unit);
    else enemyAct(unit, step);
    tickBuffs(unit);
    if (!c.quickBattleMode && guard % 8 === 0) {
      const elapsed2 = (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startMs;
      if (elapsed2 >= timeBudgetMs) break;
    }
  }
  c.advanceMaxStepsSeen = Math.max(c.advanceMaxStepsSeen || 0, guard);
  const elapsed = (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startMs;
  if (c.phase === "running") {
    if (!c.quickBattleMode && (elapsed > 16 || guard >= maxSteps)) {
      console.warn("[combat] advance yielded after ".concat(guard, " steps, ").concat(elapsed.toFixed ? elapsed.toFixed(1) : Math.round(elapsed), "ms"));
    }
    if (!c.quickBattleMode) scheduleAdvanceCombat(c);
    return;
  }
  state.pendingSkill = null;
  c.activeUnitId = "";
  combatLog("⚠️ 战斗推进异常，已暂停在当前状态。");
  if (!c.quickBattleMode) render();
}
function scheduleAdvanceCombat(c = state.combat) {
  if (!c || c.advanceTimer || c.phase === "victory" || c.phase === "defeat") return;
  const defer = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" ? window.requestAnimationFrame.bind(window) : typeof window !== "undefined" && typeof window.setTimeout === "function" ? (fn) => window.setTimeout(fn, 0) : typeof setTimeout === "function" ? (fn) => setTimeout(fn, 0) : null;
  if (!defer) {
    advanceCombat();
    return;
  }
  c.advanceTimer = defer(() => {
    if (state.combat !== c) return;
    c.advanceTimer = 0;
    if (c.phase === "running") advanceCombat();
  }, 0);
}
function prepareUnitTurn(unit) {
  var _a;
  if (!unit.alive) return;
  tier2OnActionReady(unit);
  if (unit.side === "ally" && unit.lastBreathTurns != null) {
    unit.lastBreathTurns -= 1;
    if (unit.lastBreathTurns < 0) {
      unit.hp = 0;
      unit.alive = false;
      combatLog("💀 ".concat(unit.name, " 的回光返照结束，倒下了。"));
      return;
    }
  }
  if (unit.side === "ally") {
    if (unit.isPlayer && (unit.manaTideCooldown || 0) > 0) unit.manaTideCooldown -= 1;
    if (isTalentOwner(unit) && hasTalent("steady_line")) {
      if (unit.shield > 0) {
        applyBuff(unit, "steady_line", 1, 1, unit);
        unit.steadyLineTurn = (_a = state.combat) == null ? void 0 : _a.turn;
        combatLog("🛡️ 稳固阵线：".concat(unit.name, " 本回合受到伤害降低。"));
      } else {
        delete unit.buffs.steady_line;
        delete unit.steadyLineTurn;
      }
    }
    const beforeEnergy = unit.energy;
    const energyRegen = (unit.stats.energyRegen || 0) + (hasBuff(unit, "haste") ? 3 : 0);
    const nextEnergy = unit.energy + energyRegen;
    if (unit.isPlayer && hasTalent("overcharge") && nextEnergy > unit.stats.energy) {
      state.combat.overchargePool = (state.combat.overchargePool || 0) + (nextEnergy - unit.stats.energy);
    }
    unit.energy = Math.min(unit.stats.energy, nextEnergy);
    armManaTideOnFullEnergy(unit, beforeEnergy);
    if (unit.isPlayer && hasTalent("battle_will")) {
      const gain = talentStarValue("battle_will");
      unit.stats.atk += gain;
      combatLog("🔥 战意：".concat(unit.name, " 攻击 +").concat(gain, "。"));
    }
    if (unit.isPlayer && hasTalent("mirror")) {
      state.combat.mirrorTurnCounter = (state.combat.mirrorTurnCounter || 0) + 1;
    }
    const buffRegen = hasBuff(unit, "regen") ? 0.02 : 0;
    const talentRegen = unit.isPlayer ? hasTalent("regen_2pct") ? 0.02 : hasTalent("regen_1pct") ? talentStarValue("regen_1pct") : 0 : 0;
    const passiveRegen = (hasSkillPassive("unyielding", unit) ? 0.03 : 0) + (hasSkillPassive("druid_natural_recovery", unit) ? 0.02 : 0);
    const regen = Math.floor(unit.maxHp * (talentRegen + buffRegen + passiveRegen)) + (unit.stats.hpRegen || 0);
    if (regen > 0) {
      healRaw(unit, regen, { selfHeal: true });
    }
  } else if (unit.side === "enemy") {
    const effects = climbEffects(state.run);
    const regenPct = unit.climbEnemyKind === "elite" ? effects.eliteRegenPct || 0 : unit.climbEnemyKind === "boss" ? effects.bossRegenPct || 0 : 0;
    if (regenPct > 0 && unit.hp < unit.maxHp) healRaw(unit, Math.max(1, Math.floor(unit.maxHp * regenPct)));
  }
  for (const [sid, cd] of Object.entries(unit.cooldowns || {})) unit.cooldowns[sid] = Math.max(0, cd - 1);
  processDots(unit);
}
function makeSummonedEnemy(template, idx, scaleMul = 0.6, options = {}) {
  var _a, _b, _c2;
  const scale = floorScale(((_a = state.run) == null ? void 0 : _a.floor) || 1) * runDifficultyMultiplier(state.run) * scaleMul;
  const hp = Math.max(1, Math.floor(template.hp * scale));
  const atk = Math.max(1, Math.floor(template.atk * scale));
  const matk = Math.max(0, Math.floor((template.matk || 0) * scale));
  const def = Math.max(0, Math.floor((template.def || 3) * scale));
  const aggro = (_b = template.aggro) != null ? _b : (template.def || 0) >= 12 ? 40 : (template.atk || 0) >= 20 ? 25 : 20;
  const summoned = applyEnemyPassiveAffixStats({
    side: "enemy",
    unitId: "summon".concat(idx),
    name: options.name || template.name,
    icon: template.icon,
    tag: template.tag,
    stats: { hp, atk, matk, def, aggro },
    hp,
    maxHp: hp,
    shield: 0,
    buffs: {},
    cooldowns: {},
    alive: true,
    skills: template.skills || ["e_attack"],
    passiveAffixes: options.skipPassiveAffixes ? [] : rollEnemyPassiveAffixes(((_c2 = state.run) == null ? void 0 : _c2.floor) || 1),
    template,
    mechanicsTriggered: {},
    charging: null,
    nextSkillId: null,
    intentIcon: DATA.intentIcons.attack,
    intentText: "攻击"
  });
  return applyClimbEnemyStartModifiers(summoned, template, "normal");
}
function checkBossMechanics(enemy) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k;
  const c = state.combat;
  if (!c || !(enemy == null ? void 0 : enemy.alive)) return;
  enemy.mechanicsTriggered || (enemy.mechanicsTriggered = {});
  const climbBossShieldPct = climbEffects(state.run).bossCycleShieldPct || 0;
  if (((_a = enemy.template) == null ? void 0 : _a.isBoss) && climbBossShieldPct > 0 && c.turn % 3 === 0 && enemy.mechanicsTriggered.climbBossShieldTurn !== c.turn) {
    enemy.mechanicsTriggered.climbBossShieldTurn = c.turn;
    const shield = Math.max(1, Math.floor(enemy.maxHp * climbBossShieldPct));
    enemy.shield += shield;
    emitCombatFloat(enemy, "+".concat(shield), "shield");
    combatLog("⛰️ 攀登规则：".concat(enemy.name, " 的王者循环生成 ").concat(shield, " 护盾。"));
  }
  if (!((_b = enemy.template) == null ? void 0 : _b.mechanics)) return;
  const hpPct = enemy.hp / enemy.maxHp;
  for (const [idx, mech] of enemy.template.mechanics.entries()) {
    const key = String(idx);
    const triggered = !!enemy.mechanicsTriggered[key];
    const triggerOnceThisTurn = () => {
      const turnKey = "".concat(key, ":turn");
      if (enemy.mechanicsTriggered[turnKey] === c.turn) return false;
      enemy.mechanicsTriggered[turnKey] = c.turn;
      return true;
    };
    if (mech.type === "enrage" && !triggered && hpPct <= ((_c2 = mech.triggerHpPct) != null ? _c2 : 0.3)) {
      enemy.mechanicsTriggered[key] = true;
      applyBuff(enemy, "strengthen", 99, 1);
      enemy.stats.atk = Math.floor(enemy.stats.atk * 1.3);
      combatLog("🔥 ".concat(enemy.name, " 进入狂暴，攻击大幅提升。"));
    } else if (mech.type === "shield_phase" && hpPct <= ((_d2 = mech.triggerHpPct) != null ? _d2 : 0.7)) {
      if (c.turn % (mech.interval || 3) === 0 && triggerOnceThisTurn()) {
        const shield = Math.floor(enemy.maxHp * (mech.shieldPct || 0.2));
        enemy.shield += shield;
        if (shield > 0) emitCombatFloat(enemy, "+".concat(shield), "shield");
        combatLog("🛡️ ".concat(enemy.name, " 释放护盾，获得 ").concat(shield, " 护盾。"));
      }
    } else if (mech.type === "chapter_flame_barrier" && hpPct <= ((_e2 = mech.triggerHpPct) != null ? _e2 : 0.65)) {
      if (c.turn % (mech.interval || 3) === 0 && triggerOnceThisTurn()) {
        const shield = Math.floor(enemy.maxHp * (mech.shieldPct || 0.12));
        enemy.shield += shield;
        if (shield > 0) emitCombatFloat(enemy, "+".concat(shield), "shield");
        combatLog("🕯️ ".concat(enemy.name, " 点燃神火壁垒，获得 ").concat(shield, " 护盾。"));
      }
    } else if (mech.type === "chapter_guard_call" && !triggered && hpPct <= ((_f2 = mech.triggerHpPct) != null ? _f2 : 0.55)) {
      enemy.mechanicsTriggered[key] = true;
      const template = DATA.enemyTemplates.find((unit) => unit.id === mech.summonId);
      if (template) {
        combatLog("⚔️ ".concat(enemy.name, " 高呼守卫誓约，召唤骑士残影。"));
        for (let i = 0; i < (mech.count || 2); i += 1) {
          c.enemies.push(makeSummonedEnemy(template, c.enemies.length + 1, mech.scaleMul || 0.25, {
            name: mech.summonName || template.name,
            skipPassiveAffixes: true
          }));
        }
      }
    } else if (mech.type === "chapter_rift_mark" && c.turn % (mech.interval || 3) === 0 && triggerOnceThisTurn()) {
      combatLog("🌀 ".concat(enemy.name, " 展开裂隙标记，所有英雄虚弱 ").concat(mech.turns || 2, " 回合。"));
      for (const ally of c.allies.filter((unit) => unit.alive)) applyBuff(ally, "weaken", mech.turns || 2, 1, enemy);
    } else if (mech.type === "chapter_seal_rebuild" && !triggered && hpPct <= ((_g = mech.triggerHpPct) != null ? _g : 0.5)) {
      enemy.mechanicsTriggered[key] = true;
      dispelDebuffs(enemy, 2);
      applyBuff(enemy, "fortify", 2, 1, enemy);
      const shield = Math.floor(enemy.maxHp * (mech.shieldPct || 0.2));
      enemy.shield += shield;
      if (shield > 0) emitCombatFloat(enemy, "+".concat(shield), "shield");
      combatLog("✨ ".concat(enemy.name, " 重构封印，净化减益并获得 ").concat(shield, " 护盾与坚韧。"));
    } else if (mech.type === "summon" && !triggered && hpPct <= ((_h = mech.triggerHpPct) != null ? _h : 0.5)) {
      enemy.mechanicsTriggered[key] = true;
      const template = DATA.enemyTemplates.find((e) => e.id === mech.summonId);
      if (template) {
        combatLog("👥 ".concat(enemy.name, " 召唤了援军。"));
        for (let i = 0; i < (mech.count || 1); i += 1) {
          const summon = makeSummonedEnemy(template, c.enemies.length + 1, 0.6);
          c.enemies.push(summon);
          if ((_i = summon.passiveAffixes) == null ? void 0 : _i.length) combatLog("✦ ".concat(summon.name, " 的被动词条：").concat(summon.passiveAffixes.map((affix) => enemyPassiveAffixLogLabel(affix)).join("、"), "。"));
        }
      }
    } else if (mech.type === "aoe_burn" && c.turn % (mech.interval || 3) === 0 && triggerOnceThisTurn()) {
      combatLog("🔥 ".concat(enemy.name, " 释放全体灼烧吐息。"));
      for (const ally of c.allies.filter((a) => a.alive)) {
        const dmg = Math.max(1, Math.floor(ally.maxHp * (mech.dmgPct || 0.08)));
        takeDamage(ally, dmg, enemy, { trueDamage: true, sourceName: "灼烧吐息" });
        if (ally.alive) applyDot(enemy, ally, "burn", mech.turns || 2, Math.max(1, Math.floor(enemy.stats.atk * (mech.dmgCoeff || 0.2))));
      }
    } else if (mech.type === "silence" && hpPct <= ((_j = mech.triggerHpPct) != null ? _j : 0.4) && c.turn % (mech.interval || 5) === 0 && triggerOnceThisTurn()) {
      combatLog("🤐 ".concat(enemy.name, " 释放沉默领域。"));
      for (const ally of c.allies.filter((a) => a.alive)) applyBuff(ally, "silence", mech.turns || 1, 1);
    } else if (mech.type === "drain_life" && c.turn % (mech.interval || 3) === 0 && triggerOnceThisTurn()) {
      combatLog("🩸 ".concat(enemy.name, " 释放生命汲取。"));
      let total = 0;
      for (const ally of c.allies.filter((a) => a.alive)) {
        total += takeDamage(ally, Math.floor(ally.maxHp * (mech.dmgPct || 0.06)), enemy, { trueDamage: true, sourceName: "生命汲取" });
      }
      const heal = Math.floor(total * (mech.healPct || 0.5));
      const beforeHp = enemy.hp;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      const real = enemy.hp - beforeHp;
      if (real > 0) emitCombatFloat(enemy, "+".concat(real), "heal");
      if (real > 0) combatLog("💚 ".concat(enemy.name, " 汲取恢复 ").concat(real, " 生命。"));
    } else if (mech.type === "poison_cloud" && c.turn % (mech.interval || 4) === 0 && triggerOnceThisTurn()) {
      combatLog("☁️ ".concat(enemy.name, " 释放毒云。"));
      for (const ally of c.allies.filter((a) => a.alive)) {
        applyDot(enemy, ally, "poison", mech.turns || 2, Math.max(1, Math.floor(enemy.stats.atk * (mech.dmgCoeff || 0.3))));
      }
    } else if (mech.type === "frenzy" && !triggered && hpPct <= ((_k = mech.triggerHpPct) != null ? _k : 0.4)) {
      enemy.mechanicsTriggered[key] = true;
      enemy.stats.atk = Math.floor(enemy.stats.atk * (mech.atkMult || 1.25));
      combatLog("⚡ ".concat(enemy.name, " 进入狂暴，攻击大幅提升。"));
    }
  }
}
function processDots(unit) {
  var _a, _b, _c2, _d2;
  for (const id of ["burn", "poison"]) {
    const b = unit.buffs[id];
    if (!b || !unit.alive) continue;
    if (!statusEffectApplies(unit, id, { scope: "dot:".concat(((_a = state.combat) == null ? void 0 : _a.turn) || 0, ":").concat(unit.unitId || unit.name) })) continue;
    let dmg = Math.max(1, Math.floor(b.power || unit.maxHp * 0.04));
    const dotSource = [...((_b = state.combat) == null ? void 0 : _b.allies) || [], ...((_c2 = state.combat) == null ? void 0 : _c2.enemies) || []].find((source) => source.unitId === b.sourceUnitId) || null;
    const playerOwnedDot = !!(dotSource == null ? void 0 : dotSource.isPlayer) && unit.side === "enemy";
    if (playerOwnedDot && id === "burn" && hasTalent("burn_master")) dmg = Math.floor(dmg * (1 + talentStarValue("burn_master")));
    if ((dotSource == null ? void 0 : dotSource.side) === "ally" && id === "burn" && unitHasCombatPassive(dotSource, "burn_boost")) dmg = Math.floor(dmg * 1.4);
    if (playerOwnedDot && id === "poison" && hasTalent("venom_mastery")) dmg = Math.floor(dmg * (1 + 0.08 * Math.max(1, b.stacks || 1)));
    if (id === "poison" && hasSkillPassive("assassin_poison_mastery", dotSource)) dmg = Math.floor(dmg * 1.25);
    takeDamage(unit, dmg, dotSource, { trueDamage: true, sourceName: id === "burn" ? "灼烧" : "中毒", sourceSide: b.sourceSide || "" });
    if (b.sourceSide === "ally" && id === "burn" && unitHasMech(dotSource, "mx_burn_spread") && Math.random() < Math.min(0.6, mechChance(0.2, dotSource))) {
      const candidates = ((_d2 = state.combat) == null ? void 0 : _d2.enemies.filter((e) => e.alive && e !== unit && !e.buffs.burn)) || [];
      const target = candidates.length ? pick(candidates) : null;
      if (target) {
        applyDot(null, target, "burn", Math.max(1, b.turns || 2), b.power || dmg, 1, b);
        combatLog("★ 灼烧蔓延到 ".concat(target.name, "。"));
      }
    }
  }
}
function tickBuffs(unit) {
  var _a;
  for (const [id, buff] of Object.entries(unit.buffs || {})) {
    if (id === "dodge_next") continue;
    if (buff.turns == null) continue;
    if (buff.appliedActionSerial === ((_a = state.combat) == null ? void 0 : _a.actionSerial)) continue;
    buff.turns -= 1;
    if (buff.turns <= 0) delete unit.buffs[id];
  }
}
function hasBuff(unit, id) {
  var _a;
  return !!((_a = unit == null ? void 0 : unit.buffs) == null ? void 0 : _a[id]);
}
function getActivePlayer() {
  const c = state.combat;
  if (!c) return null;
  return c.allies.find((a) => a.unitId === c.activeUnitId) || null;
}
function combatInputSerialMatches(serial, expected) {
  if (serial == null) return true;
  return Number(serial) === Number(expected || 0);
}
function canAcceptCombatInput(serial = null) {
  const c = state.combat;
  if (!c || c.phase !== "player_choose" || !getActivePlayer()) return false;
  return combatInputSerialMatches(serial, c.inputSerial || 0);
}
function recoverCombatInputState() {
  const c = state.combat;
  if (!c || c.phase === "victory" || c.phase === "defeat") return;
  state.pendingSkill = null;
  c.targetSelectSerial = 0;
  if (c.phase !== "player_choose") {
    c.activeUnitId = "";
    return;
  }
  if (!getActivePlayer()) {
    c.phase = "running";
    advanceCombat();
    return;
  }
  render();
}
function classSkillsFor(unit) {
  var _a, _b;
  if (!unit || unit.isCommandPuppet) return [];
  const skills = allClassSkills(unit.classId);
  const withBasicSkill = (list) => {
    const base = skills[0];
    const clean = (list || []).filter(Boolean);
    if (base && !clean.some((skill) => skill.id === base.id)) clean.unshift(base);
    return clean.map(scaledSkill);
  };
  if (unit.isMerc) {
    const memberRef = unit.memberRef || ((_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b.find((entry) => entry.unitId === unit.unitId)) || { classId: unit.classId, mercData: { level: 1, equipment: {} } };
    const member = memberRef.classId ? memberRef : { ...memberRef, classId: unit.classId };
    return mercenarySkillsFor(member).map((skill) => ({
      ...skill,
      effects: (skill.effects || []).map((effect) => ({ ...effect }))
    }));
  }
  if (!state.run) return withBasicSkill(skills);
  initializeSkillState(state.run);
  if (unit.isSecondHero && state.run.dualHeroMode) {
    return withBasicSkill(learnedSkillIdsForClass(unit.classId, state.run));
  }
  const equipped = equippedSkillIdsForClass(unit.classId, state.run);
  const visible = equipped.length ? equipped.map((id) => skills.find((s) => s.id === id)).filter(Boolean) : learnedSkillIdsForClass(unit.classId, state.run);
  return withBasicSkill(visible);
}
function isBasicAttackSkill(attacker, skill) {
  var _a;
  if (!attacker || !skill) return false;
  return ((_a = allClassSkills(attacker.classId)[0]) == null ? void 0 : _a.id) === skill.id;
}
function skillUseBlockReason(unit, skill) {
  if (!skill || !(unit == null ? void 0 : unit.alive)) return "unavailable";
  if ((unit.cooldowns[skill.id] || 0) > 0) return "cooldown";
  if (skill.puppetCommand && skill.id !== "u_thread") {
    const puppet = commandPuppetFor(unit, true);
    if (!(puppet == null ? void 0 : puppet.alive) && skill.puppetCommand.type !== "repair") return "puppet";
  }
  if (statusEffectApplies(unit, "silence", { scope: currentActionStatusScope() }) && actualSkillCost(unit, skill) > 0) return "silence";
  if (unit.energy < actualSkillCost(unit, skill)) return "energy";
  return "";
}
function canUseSkill(unit, skill) {
  return !skillUseBlockReason(unit, skill);
}
function skillUseBlockFeedback(unit, skill, reason) {
  var _a;
  const skillName = (skill == null ? void 0 : skill.name) || "该技能";
  const unitName = (unit == null ? void 0 : unit.name) || "当前角色";
  if (reason === "cooldown") {
    const turns = Math.max(1, Math.floor(((_a = unit == null ? void 0 : unit.cooldowns) == null ? void 0 : _a[skill == null ? void 0 : skill.id]) || 0));
    return {
      hint: "冷却中 · ".concat(turns, "回合"),
      message: "「".concat(skillName, "」冷却中，还剩 ").concat(turns, " 回合。"),
      log: "⏳ ".concat(unitName, " 的「").concat(skillName, "」冷却中，还剩 ").concat(turns, " 回合。"),
      floater: "冷却 ".concat(turns)
    };
  }
  if (reason === "puppet") {
    return {
      hint: "傀儡损毁 · 点击查看",
      message: "机关傀儡已损毁，无法释放「".concat(skillName, "」；请先重构傀儡。"),
      log: "⚙️ ".concat(unitName, " 的机关傀儡已损毁，无法释放「").concat(skillName, "」。"),
      floater: "傀儡损毁"
    };
  }
  if (reason === "silence") {
    return {
      hint: "沉默中 · 点击查看",
      message: "沉默中，无法释放「".concat(skillName, "」。"),
      log: "🤐 ".concat(unitName, " 被沉默，无法释放「").concat(skillName, "」。"),
      floater: "沉默"
    };
  }
  if (reason === "energy") {
    const current = Math.max(0, Math.floor((unit == null ? void 0 : unit.energy) || 0));
    const required = Math.max(0, Math.floor(actualSkillCost(unit, skill)));
    return {
      hint: "魔法不足 · ".concat(current, "/").concat(required),
      message: "魔法不足，无法释放「".concat(skillName, "」（当前 ").concat(current, " / 需要 ").concat(required, "）。"),
      log: "💧 ".concat(unitName, " 魔法不足，无法释放「").concat(skillName, "」（").concat(current, " / ").concat(required, "）。"),
      floater: "魔法不足"
    };
  }
  return {
    hint: "暂不可用 · 点击查看",
    message: "当前状态无法释放「".concat(skillName, "」。"),
    log: "🚫 ".concat(unitName, " 当前无法释放「").concat(skillName, "」。"),
    floater: "无法释放"
  };
}
function showSkillUseBlockedMessage(unit, skill, reason) {
  if (!reason) return false;
  const feedback = skillUseBlockFeedback(unit, skill, reason);
  combatLog(feedback.log);
  emitCombatFloat(unit, feedback.floater, "dodge");
  toast(feedback.message);
  render();
  return true;
}
function baseSkillCost(unit, skill) {
  let cost = skill.cost || 0;
  if (unit.isPlayer && hasTalent("archmage")) cost = Math.floor(cost * (1 - talentStarValue("archmage")));
  if (unit.isPlayer && skill.id === "m_ult" && hasTalent("meteor_spam")) cost = Math.min(100, cost + (state.run.meteorSpamCount || 0) * 10);
  if (cost > 0 && hasSkillPassive("mage_arcane_efficiency", unit)) cost = Math.max(1, cost - 3);
  return Math.max(0, cost);
}
function actualSkillCost(unit, skill) {
  if (isTier2Class(unit, "doombringer") && (tier2State(unit).doomCharges || 0) > 0) return 0;
  return baseSkillCost(unit, skill);
}
function clickSkill(skillId, inputSerial = null) {
  const c = state.combat;
  if (!canAcceptCombatInput(inputSerial)) return;
  const unit = getActivePlayer();
  if (!unit) return;
  const skill = classSkillsFor(unit).find((s) => s.id === skillId);
  if (!skill) return;
  const blockReason = skillUseBlockReason(unit, skill);
  if (blockReason) {
    showSkillUseBlockedMessage(unit, skill, blockReason);
    return;
  }
  if (skill.targets === "single") {
    if (state.perm.autoSelectTarget !== false) {
      playerUseSkill(skill.id, firstAliveEnemyIdx(), c.inputSerial || 0);
      return;
    }
    state.pendingSkill = skill.id;
    c.targetSelectSerial = c.inputSerial || 0;
    render();
    return;
  }
  playerUseSkill(skill.id, null, c.inputSerial || 0);
}
function clickTarget(idx, inputSerial = null) {
  if (!state.pendingSkill) return;
  const c = state.combat;
  const targetSerial = (c == null ? void 0 : c.targetSelectSerial) || (c == null ? void 0 : c.inputSerial) || 0;
  if (!canAcceptCombatInput(targetSerial) || !combatInputSerialMatches(inputSerial, targetSerial)) return;
  playerUseSkill(state.pendingSkill, idx, targetSerial);
}
function playerUseSkill(skillId, targetIdx = null, inputSerial = null) {
  const c = state.combat;
  if (!canAcceptCombatInput(inputSerial)) return;
  const unit = getActivePlayer();
  if (!unit) return;
  const skill = classSkillsFor(unit).find((s) => s.id === skillId);
  if (!skill) return;
  const blockReason = skillUseBlockReason(unit, skill);
  if (blockReason) {
    showSkillUseBlockedMessage(unit, skill, blockReason);
    return;
  }
  const activeUnitId = unit.unitId;
  c.phase = "running";
  c.targetSelectSerial = 0;
  state.pendingSkill = null;
  try {
    const used = useSkill(unit, skill, targetIdx);
    if (used === false) {
      c.phase = "player_choose";
      c.activeUnitId = activeUnitId;
      render();
      return;
    }
    tickBuffs(unit);
    c.activeUnitId = "";
    c.phase = "running";
    advanceCombat();
    saveGame();
    if (state.combat === c && c.phase === "running" && !c.quickBattleMode) render();
  } catch (err) {
    console.error("Combat action failed", err);
    if (state.combat === c) {
      c.phase = "player_choose";
      c.activeUnitId = activeUnitId;
      c.inputSerial = (c.inputSerial || 0) + 1;
      c.targetSelectSerial = 0;
      state.pendingSkill = null;
      render();
    }
  }
}
function skillHasEffect(skill, type) {
  var _a;
  if ((_a = skill == null ? void 0 : skill.effects) == null ? void 0 : _a.some((effect) => effect.type === type)) return true;
  const command = skill == null ? void 0 : skill.puppetCommand;
  if (!command) return false;
  if (type === "damage") return ["strike", "sacrifice", "ultimate"].includes(command.type);
  if (type === "heal") return ["repair", "bulwark", "ultimate"].includes(command.type);
  if (type === "shield") return ["guard", "bulwark"].includes(command.type);
  return false;
}
function skillDamageScore(skill, enemyCount = 1) {
  let score = 0;
  for (const effect of (skill == null ? void 0 : skill.effects) || []) {
    if (effect.type === "damage") score += Math.max(0, effect.coeff || 0) * Math.max(1, effect.hits || 1);
    if (effect.type === "dot") score += Math.max(0, effect.dmgCoeff || 0) * Math.max(1, effect.turns || 1) * 0.6;
    if (effect.type === "debuff" || effect.type === "stun") score += 0.35;
  }
  const command = skill == null ? void 0 : skill.puppetCommand;
  if (command && ["strike", "sacrifice", "ultimate"].includes(command.type)) {
    let commandScore = Math.max(0, command.coeff || 0) * Math.max(1, command.hits || 1);
    if (command.aoe || skill.targets === "all" || command.type === "ultimate" || command.type === "sacrifice") commandScore *= Math.max(1, enemyCount * 0.85);
    score += commandScore;
  }
  if ((skill == null ? void 0 : skill.targets) === "all") score *= Math.max(1, enemyCount * 0.85);
  return score;
}
function mercSkillIsSafe(unit, skill) {
  const selfDamage = (skill.effects || []).find((effect) => effect.type === "selfDmgPct");
  if (!selfDamage) return true;
  const sacrifice = Math.max(1, Math.floor(unit.hp * (selfDamage.pct || 0)));
  return unit.hp / unit.maxHp > 0.35 && unit.hp - sacrifice > 0;
}
function mercFriendlyTarget(skill, allies, preferred = []) {
  if (skill.targets !== "party_single") return null;
  const pool = (preferred.length ? preferred : allies).filter((ally) => !ally.isCommandPuppet);
  return [...pool].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null;
}
function chooseAutoCombatSkill(unit, strategy = "balanced", options = {}) {
  var _a, _b, _c2, _d2;
  const c = state.combat;
  const skills = classSkillsFor(unit);
  const usable = skills.filter((skill) => canUseSkill(unit, skill) && mercSkillIsSafe(unit, skill));
  const allies = c.allies.filter((ally) => ally.alive && !ally.isCommandPuppet);
  const enemies = c.enemies.filter((enemy) => enemy.alive);
  const lowHealthThreshold = (_a = options.lowHealthThreshold) != null ? _a : strategy === "cautious" ? 0.7 : 0.45;
  const lowAllies = allies.filter((ally) => ally.hp / ally.maxHp < lowHealthThreshold);
  const debuffedAllies = allies.filter((ally) => Object.keys(ally.buffs || {}).some(isDebuffId));
  const targetEnemy = c.enemies[firstAliveEnemyIdx()] || enemies[0] || null;
  if (isPuppeteerUnit(unit)) {
    const puppet = commandPuppetFor(unit, true);
    if (!(puppet == null ? void 0 : puppet.alive)) {
      const rebuild = usable.find((skill) => {
        var _a2;
        return ((_a2 = skill.puppetCommand) == null ? void 0 : _a2.type) === "repair";
      });
      if (rebuild) return { skill: rebuild, allyTarget: null };
    } else if (puppet.hp / puppet.maxHp < 0.45) {
      const repair = usable.find((skill) => {
        var _a2;
        return ["repair", "bulwark"].includes((_a2 = skill.puppetCommand) == null ? void 0 : _a2.type);
      });
      if (repair) return { skill: repair, allyTarget: null };
    }
  }
  if (strategy === "aggressive") {
    const attacks2 = usable.filter((skill) => skillHasEffect(skill, "damage"));
    const chosen2 = [...attacks2].sort((a, b) => skillDamageScore(b, enemies.length) - skillDamageScore(a, enemies.length))[0];
    if (chosen2) return { skill: chosen2, allyTarget: mercFriendlyTarget(chosen2, allies) };
  }
  if (lowAllies.length) {
    const healing = usable.filter((skill) => skillHasEffect(skill, "heal"));
    const chosen2 = [...healing].sort((a, b) => {
      const aParty = a.targets === "party" ? lowAllies.length : 1;
      const bParty = b.targets === "party" ? lowAllies.length : 1;
      return bParty - aParty || skillDamageScore(b, enemies.length) - skillDamageScore(a, enemies.length);
    })[0];
    if (chosen2) return { skill: chosen2, allyTarget: mercFriendlyTarget(chosen2, allies, lowAllies) };
  }
  if (debuffedAllies.length) {
    const cleanse = usable.find((skill) => skillHasEffect(skill, "dispel"));
    if (cleanse) return { skill: cleanse, allyTarget: mercFriendlyTarget(cleanse, allies, debuffedAllies) };
  }
  const defensiveHealthThreshold = (_b = options.defensiveHealthThreshold) != null ? _b : strategy === "cautious" ? 0.7 : 0.55;
  if (unit.hp / unit.maxHp < defensiveHealthThreshold) {
    const defensive = usable.find((skill) => skill.targets === "self" && (skillHasEffect(skill, "shield") || (skill.effects || []).some((effect) => effect.type === "buff" && ["evasion", "fortify", "d_bear_form", "cc_immune"].includes(effect.buffId))));
    if (defensive) return { skill: defensive, allyTarget: null };
  }
  let utilityTarget = null;
  const usefulUtility = usable.find((skill) => {
    if (skillHasEffect(skill, "damage") || skillHasEffect(skill, "heal") || skillHasEffect(skill, "dispel")) return false;
    const buffIds = (skill.effects || []).filter((effect) => effect.type === "buff").map((effect) => effect.buffId);
    if (!buffIds.length) return false;
    if (skill.targets === "self") {
      if (buffIds.some((id) => ["d_bear_form", "d_hawk_form"].includes(id)) && (hasBuff(unit, "d_bear_form") || hasBuff(unit, "d_hawk_form"))) return false;
      return buffIds.some((id) => !hasBuff(unit, id));
    }
    if (skill.targets === "party_single") {
      utilityTarget = allies.find((ally) => buffIds.some((id) => !hasBuff(ally, id))) || null;
      return !!utilityTarget;
    }
    return allies.some((ally) => buffIds.some((id) => !hasBuff(ally, id)));
  });
  if (usefulUtility) return { skill: usefulUtility, allyTarget: utilityTarget || mercFriendlyTarget(usefulUtility, allies) };
  const enemyUtility = usable.find((skill) => !skillHasEffect(skill, "damage") && (skill.effects || []).some((effect) => {
    if (!["debuff", "dot", "stun"].includes(effect.type) || !targetEnemy) return false;
    return !effect.buffId || !hasBuff(targetEnemy, effect.buffId);
  }));
  if (enemyUtility) return { skill: enemyUtility, allyTarget: null };
  const attacks = usable.filter((skill) => skillHasEffect(skill, "damage"));
  const valuableUlt = enemies.length >= 2 || !!((_c2 = targetEnemy == null ? void 0 : targetEnemy.template) == null ? void 0 : _c2.isBoss) || !!((_d2 = targetEnemy == null ? void 0 : targetEnemy.template) == null ? void 0 : _d2.isElite) || targetEnemy && targetEnemy.hp / targetEnemy.maxHp < 0.5;
  const candidates = attacks.filter((skill) => !skill.isUlt || valuableUlt);
  const chosen = [...candidates.length ? candidates : attacks].sort((a, b) => skillDamageScore(b, enemies.length) - skillDamageScore(a, enemies.length))[0] || usable[0] || null;
  return chosen ? { skill: chosen, allyTarget: mercFriendlyTarget(chosen, allies) } : null;
}
function chooseMercSkill(unit) {
  return chooseAutoCombatSkill(unit, mercBattleStrategyKey(unit));
}
function choosePlayerAutoSkill(unit) {
  return chooseAutoCombatSkill(unit, "balanced", {
    lowHealthThreshold: 0.65,
    defensiveHealthThreshold: 0.55
  });
}
function mercAct(unit) {
  var _a;
  const decision = chooseMercSkill(unit);
  if (decision) useSkill(unit, decision.skill, firstAliveEnemyIdx(), { allyTargetId: ((_a = decision.allyTarget) == null ? void 0 : _a.unitId) || "" });
}
function enemyAct(unit, step = {}) {
  var _a;
  if (unit.charging) {
    useEnemySkill(unit, null, unit.charging.targetUnitId || step.targetUnitId || "");
    return;
  }
  const target = ((_a = state.combat) == null ? void 0 : _a.allies.find((ally) => ally.alive && ally.unitId === (step.targetUnitId || unit.nextTargetUnitId))) || pickAllyTarget();
  const sid = step.skillId || unit.nextSkillId || pickEnemySkill(unit, target);
  if (!step.extra) {
    unit.nextSkillId = null;
    unit.nextTargetUnitId = "";
  }
  const skill = DATA.enemySkills[sid] || DATA.enemySkills.e_attack;
  useEnemySkill(unit, skill, (target == null ? void 0 : target.unitId) || "");
}
function pickEnemySkill(enemy, target = null, options = {}) {
  const c = state.combat;
  const skills = enemy.skills || ["e_attack"];
  const hasSkill = (sid) => skills.includes(sid);
  const hpPct = enemy.hp / enemy.maxHp;
  target || (target = pickAllyTarget());
  if (hpPct < 0.3 && hasSkill("e_heal_self")) return "e_heal_self";
  if (hpPct < 0.2) {
    const explode = skills.find((sid) => {
      var _a;
      return (_a = DATA.enemySkills[sid]) == null ? void 0 : _a.selfDmgPct;
    });
    if (explode) return explode;
  }
  if (hpPct < 0.3 && hasSkill("e_enrage") && !hasBuff(enemy, "strengthen")) return "e_enrage";
  if (!hasBuff(enemy, "strengthen") && hasSkill("e_warcry")) return "e_warcry";
  if (!hasBuff(enemy, "d_thorns_buff") && hasSkill("e_thorns_aura")) return "e_thorns_aura";
  if (hpPct < 0.6 && (enemy.shield || 0) <= 0) {
    const shield = skills.find((sid) => {
      var _a, _b;
      return ((_a = DATA.enemySkills[sid]) == null ? void 0 : _a.selfTarget) && ((_b = DATA.enemySkills[sid]) == null ? void 0 : _b.shieldPct);
    });
    if (shield) return shield;
  }
  const aliveEnemies = (c == null ? void 0 : c.enemies.filter((e) => e.alive).length) || 0;
  if (aliveEnemies >= 2) {
    const buffAllies = skills.find((sid) => {
      var _a;
      return (_a = DATA.enemySkills[sid]) == null ? void 0 : _a.buffAllies;
    });
    if (buffAllies && Math.random() < 0.3) return buffAllies;
  }
  if (options.allowCharge !== false && hpPct > 0.5) {
    const charge = skills.find((sid) => {
      var _a;
      return (_a = DATA.enemySkills[sid]) == null ? void 0 : _a.chargeUp;
    });
    if (charge && Math.random() < 0.2) return charge;
  }
  const aliveAllies = (c == null ? void 0 : c.allies.filter((a) => a.alive).length) || 0;
  if (aliveAllies >= 2) {
    const aoe = skills.find((sid) => {
      var _a, _b;
      return ((_a = DATA.enemySkills[sid]) == null ? void 0 : _a.aoe) && !((_b = DATA.enemySkills[sid]) == null ? void 0 : _b.chargeUp);
    });
    if (aoe && Math.random() < 0.35) return aoe;
  }
  if (target && !hasBuff(target, "stun") && !hasBuff(target, "cc_immune")) {
    const stun = skills.find((sid) => {
      var _a;
      return (_a = DATA.enemySkills[sid]) == null ? void 0 : _a.stun;
    });
    if (stun && Math.random() < 0.3) return stun;
  }
  if (target) {
    const dot = skills.find((sid) => {
      const skill = DATA.enemySkills[sid];
      return (skill == null ? void 0 : skill.dot) && !hasBuff(target, skill.dot);
    });
    if (dot) return dot;
    const debuff = skills.find((sid) => {
      const skill = DATA.enemySkills[sid];
      return (skill == null ? void 0 : skill.debuff) && !hasBuff(target, skill.debuff);
    });
    if (debuff) return debuff;
  }
  const heavy = skills.find((sid) => {
    const skill = DATA.enemySkills[sid];
    return ((skill == null ? void 0 : skill.coeff) || 0) * Math.max(1, (skill == null ? void 0 : skill.hits) || 1) >= 1.1 && !skill.chargeUp && !skill.selfTarget && !skill.aoe;
  });
  if (heavy && Math.random() < 0.4) return heavy;
  return hasSkill("e_attack") ? "e_attack" : skills[0] || "e_attack";
}
function pickTargetIdxByAggro(units) {
  const taunt = units.findIndex((u) => u.alive && hasBuff(u, "taunt"));
  if (taunt >= 0) return taunt;
  const pool = units.map((u, idx) => {
    var _a;
    return { idx, weight: u.alive ? Math.max(1, ((_a = u.stats) == null ? void 0 : _a.aggro) || 20) : 0 };
  }).filter((entry) => entry.weight > 0);
  if (!pool.length) return 0;
  if (pool.length === 1) return pool[0].idx;
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.idx;
  }
  return pool[pool.length - 1].idx;
}
function runSkillEffects(attacker, skill, targetIdx, context = {}) {
  const targets = resolveTargets(attacker, skill, targetIdx, context);
  const consumeResonance = hasBuff(attacker, "elemental_resonance") && (skill.effects || []).some((effect) => effect.type === "damage");
  for (const effect of skill.effects || []) {
    applySkillEffect(attacker, skill, effect, targets, context);
  }
  if (attacker.isPlayer && hasTalent("armor_pierce") && (skill.effects || []).some((effect) => effect.type === "damage")) {
    for (const target of targets.filter((unit) => (unit == null ? void 0 : unit.alive) && unit.side === "enemy")) {
      applyBuff(target, "armor_break", 2, talentStarValue("armor_pierce"));
    }
  }
  if (hasSkillPassive("priest_holy_echo", attacker) && (skill.effects || []).some((effect) => effect.type === "heal")) {
    attacker.priestHolyEchoCasts = (attacker.priestHolyEchoCasts || 0) + 1;
    if (attacker.priestHolyEchoCasts >= 3) {
      attacker.priestHolyEchoCasts = 0;
      const healingByTarget = /* @__PURE__ */ new Map();
      for (const entry of context.passiveHealResults || []) {
        if (!entry.target || entry.real <= 0) continue;
        healingByTarget.set(entry.target, (healingByTarget.get(entry.target) || 0) + entry.real);
      }
      for (const [target, actualHealing] of healingByTarget) {
        grantShield(target, Math.floor(actualHealing * 0.3));
      }
      if (healingByTarget.size) combatLog("☀️ 圣光回响：实际治疗量转化为护盾。");
    }
  }
  if (consumeResonance) {
    delete attacker.buffs.elemental_resonance;
    combatLog("🌀 元素共鸣释放，效果消散。");
  }
  return targets;
}
function isDamagingPuppetCommand(command) {
  return !!command && ["strike", "sacrifice", "ultimate"].includes(command.type);
}
function puppetCommandDamageMultiplier(owner) {
  let multiplier = 1;
  if (["soul_weaver", "puppet_emperor"].includes(owner.classId)) multiplier *= 1.18;
  if (isTalentOwner(owner) && hasTalent("grand_puppeteer")) multiplier *= 1 + talentStarValue("grand_puppeteer");
  if (unitHasCombatPassive(owner, "puppet_command_amp")) multiplier *= 1.15;
  if (owner.commandCircuitBoostReady) multiplier *= 1 + talentStarValue("command_circuit", null, state.run, "damageValues");
  if (hasSkillPassive("puppeteer_precision_drive", owner)) multiplier *= 1.1;
  if (hasSkillPassive("puppeteer_cycle_protocol", owner) && owner.puppetAttackCycleReady) multiplier *= 1.2;
  return multiplier;
}
function puppetMaintenanceMultiplier(owner, cycleBoost = false) {
  let multiplier = hasSkillPassive("puppeteer_maintenance_matrix", owner) ? 1.15 : 1;
  if (cycleBoost && hasSkillPassive("puppeteer_cycle_protocol", owner)) multiplier *= 1.2;
  return multiplier;
}
function repairCommandPuppet(owner, puppet, pct2, { revivePct = 0, full = false, cycleBoost = false } = {}) {
  if (!puppet) return 0;
  const repairMul = (unitHasCombatPassive(owner, "puppet_guardian_set") ? 1.2 : 1) * puppetMaintenanceMultiplier(owner, cycleBoost);
  if (!puppet.alive) {
    if (revivePct <= 0) return 0;
    puppet.alive = true;
    puppet.hp = Math.max(1, Math.floor(puppet.maxHp * revivePct * repairMul));
    puppet.shield = 0;
    puppet.buffs = {};
    combatLog("🧵 归线重构：".concat(puppet.name, " 以 ").concat(puppet.hp, " 生命重新启动。"));
    return puppet.hp;
  }
  const before = puppet.hp;
  puppet.hp = full ? puppet.maxHp : Math.min(puppet.maxHp, puppet.hp + Math.floor(puppet.maxHp * pct2 * repairMul));
  const healed = puppet.hp - before;
  if (healed > 0) emitCombatFloat(puppet, "+".concat(healed), "heal", "u_rebuild");
  if (healed > 0) combatLog("🔧 ".concat(puppet.name, " 修复 ").concat(healed, " 生命。"));
  return healed;
}
function puppetCommandTargets(command, targetIdx) {
  var _a, _b, _c2;
  const enemies = (((_a = state.combat) == null ? void 0 : _a.enemies) || []).filter((enemy) => enemy.alive);
  if (command.aoe || ["sacrifice", "ultimate"].includes(command.type)) return enemies;
  const chosen = (_c2 = (_b = state.combat) == null ? void 0 : _b.enemies) == null ? void 0 : _c2[targetIdx];
  return [(chosen == null ? void 0 : chosen.alive) ? chosen : enemies[0]].filter(Boolean);
}
function triggerPuppetAttackProcs(owner, puppet, target, command, skillCost = 0) {
  if (!(owner == null ? void 0 : owner.isPlayer) || !(target == null ? void 0 : target.alive)) return;
  if (hasTalent("armor_pierce")) {
    applyBuff(target, "armor_break", 2, talentStarValue("armor_pierce"), owner);
  }
  if (hasTalent("multi_hit") && (state.combat.multiHitCount || 0) < talentCap(2) && Math.random() < talentStarValue("multi_hit")) {
    state.combat.multiHitCount = (state.combat.multiHitCount || 0) + 1;
    combatLog("🔥 多段狂热追击。");
    dealDamage(puppet, target, { coeff: 0.5, statKey: command.statKey || "matk" }, "追击", skillCost);
  }
  if (target.alive && hasTalent("shadow_clone") && Math.random() < talentStarValue("shadow_clone")) {
    combatLog("👥 影分身追加攻击。");
    dealDamage(puppet, target, { coeff: talentStarValue("shadow_clone"), statKey: "atk" }, "影分身", 0);
  }
}
function runPuppetAttack(owner, puppet, command, targetIdx, scale = 1, sourceName = "傀儡指令", skillCost = 0) {
  var _a, _b;
  if (!(puppet == null ? void 0 : puppet.alive)) return 0;
  const targets = puppetCommandTargets(command, targetIdx);
  const hits = Math.max(1, command.hits || 1);
  let total = 0;
  for (let target of targets) {
    for (let i = 0; i < hits; i += 1) {
      if (!(target == null ? void 0 : target.alive) && !command.aoe) target = (_b = (_a = state.combat) == null ? void 0 : _a.enemies) == null ? void 0 : _b.find((enemy) => enemy.alive);
      if (!(target == null ? void 0 : target.alive)) break;
      total += dealDamage(puppet, target, {
        coeff: (command.coeff || 1) * scale * puppetCommandDamageMultiplier(owner),
        statKey: command.statKey || "matk",
        armorPen: command.armorPen || 0
      }, sourceName, skillCost);
    }
    if ((target == null ? void 0 : target.alive) && command.armorBreak) applyBuff(target, "armor_break", command.debuffTurns || 3, command.armorBreak, puppet);
    if ((target == null ? void 0 : target.alive) && command.stunChance && Math.random() < command.stunChance) applyBuff(target, "stun", command.stunTurns || 1, 1, puppet);
    triggerPuppetAttackProcs(owner, puppet, target, command, skillCost);
  }
  return total;
}
function trackCommandCircuit(owner, puppet, skill) {
  if (!owner || !puppet || !isTalentOwner(owner) || !hasTalent("command_circuit")) return;
  owner.commandCircuitIds || (owner.commandCircuitIds = []);
  if (!owner.commandCircuitIds.includes(skill.id)) owner.commandCircuitIds.push(skill.id);
  if (owner.commandCircuitIds.length < 3) return;
  owner.commandCircuitIds = [];
  repairCommandPuppet(owner, puppet, talentStarValue("command_circuit"));
  const gain = talentStarValue("command_circuit", null, state.run, "energyValues");
  const before = owner.energy;
  owner.energy = Math.min(owner.stats.energy, owner.energy + gain);
  owner.commandCircuitBoostReady = true;
  combatLog("🧵 指令回路完成：回复 ".concat(owner.energy - before, " 能量，下次攻击指令强化。"));
}
function afterDamagingPuppetCommand(owner, puppet, command, targetIdx) {
  if (["soul_weaver", "puppet_emperor"].includes(owner.classId) && puppet.alive) repairCommandPuppet(owner, puppet, 0.04);
  if (owner.classId === "puppet_emperor") {
    owner.puppetEmperorCommands = (owner.puppetEmperorCommands || 0) + 1;
    if (owner.puppetEmperorCommands >= 3) {
      owner.puppetEmperorCommands = 0;
      combatLog("🎭 万偶齐鸣：第三次攻击指令引发全场回响。");
      runPuppetAttack(owner, puppet, { type: "strike", coeff: 0.5, aoe: true }, targetIdx, 1, "万偶齐鸣");
    }
  }
  if (owner.commandCircuitBoostReady) owner.commandCircuitBoostReady = false;
  if (hasSkillPassive("puppeteer_cycle_protocol", owner)) {
    owner.puppetAttackCycleReady = false;
    owner.puppetDefenseCycleReady = true;
  }
  const echo = puppet.commandEcho;
  if ((echo == null ? void 0 : echo.charges) > 0 && puppet.alive) {
    echo.charges -= 1;
    if (echo.healthCostPct) puppet.hp = Math.max(1, puppet.hp - Math.floor(puppet.maxHp * echo.healthCostPct));
    combatLog("⚙️ 核心回响：傀儡追加 ".concat(Math.round(echo.scale * 100), "% 指令攻击。"));
    runPuppetAttack(owner, puppet, command, targetIdx, echo.scale, "核心回响");
    if (echo.charges <= 0) puppet.commandEcho = null;
  }
}
function executePuppetCommand(owner, skill, targetIdx, context = {}) {
  var _a, _b, _c2, _d2, _e2;
  const command = skill == null ? void 0 : skill.puppetCommand;
  if (!command || !isPuppeteerUnit(owner)) return [];
  const puppet = commandPuppetFor(owner, true);
  if (!puppet) return [];
  const cycleDefenseBoost = hasSkillPassive("puppeteer_cycle_protocol", owner) && !!owner.puppetDefenseCycleReady;
  if (command.type === "repair") {
    repairCommandPuppet(owner, puppet, command.healPct || 0, { revivePct: command.revivePct || 0, cycleBoost: cycleDefenseBoost });
    if (cycleDefenseBoost) owner.puppetDefenseCycleReady = false;
    if (hasSkillPassive("puppeteer_cycle_protocol", owner)) owner.puppetAttackCycleReady = true;
    trackCommandCircuit(owner, puppet, skill);
    return [puppet];
  }
  if (!puppet.alive) return [];
  if (command.type === "guard") {
    const shield = grantShield(puppet, Math.floor(puppet.maxHp * (command.shieldPct || 0) * puppetMaintenanceMultiplier(owner, cycleDefenseBoost)), { applyTalent: false });
    applyBuff(puppet, "taunt", command.turns || 2, 1, owner);
    combatLog("🛡️ 守御令：傀儡获得 ".concat(shield, " 护盾并接管仇恨。"));
  } else if (command.type === "link") {
    const substituteBonus = hasSkillPassive("puppeteer_substitute_protocol", owner) ? 0.1 : 0;
    puppet.redirectState = { charges: command.charges || 1, reduction: Math.min(0.9, (command.reduction || 0) + substituteBonus), expiresTurn: (((_a = state.combat) == null ? void 0 : _a.turn) || 1) + (command.turns || 1) };
    applyBuff(owner, "puppet_link", command.turns || 2, command.charges || 1, owner);
    combatLog("🧵 移形换位：接下来 ".concat(puppet.redirectState.charges, " 次单体攻击由傀儡承受。"));
  } else if (command.type === "overdrive") {
    puppet.commandEcho = { charges: command.charges || 1, scale: command.echoScale || 0.5, healthCostPct: command.healthCostPct || 0 };
    combatLog("⚙️ 核心过载：接下来 ".concat(puppet.commandEcho.charges, " 次攻击指令产生回响。"));
  } else if (command.type === "bulwark") {
    repairCommandPuppet(owner, puppet, command.healPct || 0, { cycleBoost: cycleDefenseBoost });
    grantShield(puppet, Math.floor(puppet.maxHp * (command.shieldPct || 0) * puppetMaintenanceMultiplier(owner, cycleDefenseBoost)), { applyTalent: false });
    applyBuff(puppet, "taunt", command.turns || 1, 1, owner);
    if (command.ownerFortifyTurns) applyBuff(owner, "fortify", command.ownerFortifyTurns, 1, owner);
  } else if (command.type === "ultimate") {
    repairCommandPuppet(owner, puppet, 1, { full: true });
    runPuppetAttack(owner, puppet, command, targetIdx, 1, skill.name, (_c2 = (_b = context.paidCost) != null ? _b : skill.cost) != null ? _c2 : 0);
    const nextEcho = { charges: command.echoCharges || 3, scale: command.echoScale || 0.55, healthCostPct: 0 };
    afterDamagingPuppetCommand(owner, puppet, command, targetIdx);
    puppet.commandEcho = nextEcho;
  } else if (isDamagingPuppetCommand(command)) {
    runPuppetAttack(owner, puppet, command, targetIdx, 1, skill.name, (_e2 = (_d2 = context.paidCost) != null ? _d2 : skill.cost) != null ? _e2 : 0);
    if (command.type === "sacrifice") puppet.hp = Math.max(1, puppet.hp - Math.floor(puppet.maxHp * (command.healthCostPct || 0.12)));
    afterDamagingPuppetCommand(owner, puppet, command, targetIdx);
  }
  if (!isDamagingPuppetCommand(command) && hasSkillPassive("puppeteer_cycle_protocol", owner)) {
    if (["guard", "bulwark"].includes(command.type) && cycleDefenseBoost) owner.puppetDefenseCycleReady = false;
    owner.puppetAttackCycleReady = true;
  }
  trackCommandCircuit(owner, puppet, skill);
  return [puppet];
}
function useSkill(attacker, skill, targetIdx, opts = {}) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h;
  const baseCost = baseSkillCost(attacker, skill);
  const isBasicAttack = isBasicAttackSkill(attacker, skill);
  const hasDamageEffect = (skill.effects || []).some((effect) => effect.type === "damage") || isDamagingPuppetCommand(skill.puppetCommand);
  const doomBloodCast = !opts.free && isTier2Class(attacker, "doombringer") && (tier2State(attacker).doomCharges || 0) > 0;
  const effectiveFree = !!opts.free || doomBloodCast;
  if (!effectiveFree && baseCost > 0 && statusEffectApplies(attacker, "silence", { scope: currentActionStatusScope() })) {
    combatLog("🤐 ".concat(attacker.name, " 被沉默，无法释放「").concat(skill.name, "」。"));
    emitCombatFloat(attacker, "沉默", "dodge");
    return false;
  }
  let manaTideActive = false;
  let cost = effectiveFree ? 0 : baseCost;
  if (!effectiveFree && attacker.isPlayer && hasTalent("mana_tide") && attacker.manaTideReady && !skill.isUlt && !isBasicAttack && hasDamageEffect && baseCost > 0) {
    manaTideActive = true;
    attacker.manaTideReady = false;
    cost = Math.max(0, baseCost - talentStarValue("mana_tide"));
    combatLog("🌊 法力潮汐：".concat(skill.name, " 消耗降低，伤害提升。"));
  }
  recordQuickBattleSkillUse(attacker, skill, cost, effectiveFree);
  if (!effectiveFree) {
    attacker.energy = Math.max(0, attacker.energy - cost);
    if (cost > 0 && attacker.energy < 20 && hasSkillPassive("mage_mana_surge", attacker) && !attacker.mageManaSurgeUsed) {
      attacker.mageManaSurgeUsed = true;
      const beforeEnergy = attacker.energy;
      attacker.energy = Math.min(attacker.stats.energy, attacker.energy + 30);
      combatLog("💠 魔力回涌：".concat(attacker.name, " 恢复 ").concat(attacker.energy - beforeEnergy, " 能量。"));
    }
  }
  if (!opts.free) {
    if (skill.cooldown) attacker.cooldowns[skill.id] = skill.cooldown + 1;
  }
  const restoreEffectSkill = pushCombatEffectSkill(skill.id);
  combatLog("".concat(attacker.icon || "", " ").concat(attacker.name).concat(effectiveFree ? " 免费释放" : " 使用", "「").concat(skill.name, "」。"));
  if (!opts.echo) state.combat.tier2CastSerial = (state.combat.tier2CastSerial || 0) + 1;
  tier2OnSkillCommitted(attacker, skill, doomBloodCast, opts);
  if (attacker.isPlayer && hasTalent("combo_master") && !opts.echo) {
    const c = state.combat;
    if (c.lastSkillId && c.lastSkillId !== skill.id) c.comboStack = Math.min(5, (c.comboStack || 0) + 1);
    else if (c.lastSkillId === skill.id) c.comboStack = 0;
    c.lastSkillId = skill.id;
  }
  if (attacker.isPlayer && hasTalent("sword_saint") && isBasicAttack) attacker.forceCritNext = true;
  const triadActive = attacker.isPlayer && hasTalent("triad_resonance") && hasBuff(attacker, "triad_resonance") && hasDamageEffect;
  const crimsonHuntActive = attacker.isPlayer && hasTalent("crimson_hunt") && attacker.crimsonHuntReady && hasDamageEffect;
  const shadowReturnActive = attacker.isPlayer && hasTalent("shadow_return") && attacker.shadowReturnReady && hasDamageEffect;
  const dualShiftStrikeActive = attacker.isPlayer && hasTalent("dual_shift") && hasBuff(attacker, "dual_shift_strike") && hasDamageEffect;
  const afterglowPursuitActive = isTalentOwner(attacker) && hasTalent("afterglow_pursuit") && attacker.afterglowPursuitReady && hasDamageEffect;
  const purificationReversalStacks = isTalentOwner(attacker) && hasTalent("purification_reversal") && hasDamageEffect ? Math.max(0, ((_b = (_a = attacker.buffs) == null ? void 0 : _a.purification_reversal) == null ? void 0 : _b.stacks) || 0) : 0;
  const rangerTumbleActive = hasDamageEffect && hasSkillPassive("ranger_tumble_shot", attacker) && !!attacker.rangerTumbleReady;
  const assassinShadowCounterActive = hasDamageEffect && hasSkillPassive("assassin_shadow_counter", attacker) && !!attacker.assassinShadowCounterReady;
  const vampirePactBacklashActive = hasDamageEffect && hasSkillPassive("vampire_pact_backlash", attacker) && !!attacker.vampirePactBacklashReady;
  const rangerRoamingActive = hasDamageEffect && hasSkillPassive("ranger_roaming_instinct", attacker) && attacker.rangerRoamingUsedTurn !== ((_c2 = state.combat) == null ? void 0 : _c2.turn) && attacker.rangerLastHealthDamageTurn !== (((_d2 = state.combat) == null ? void 0 : _d2.turn) || 0) - 1;
  if (triadActive) delete attacker.buffs.triad_resonance;
  if (crimsonHuntActive) attacker.crimsonHuntReady = false;
  if (shadowReturnActive) attacker.shadowReturnReady = false;
  if (dualShiftStrikeActive) delete attacker.buffs.dual_shift_strike;
  if (afterglowPursuitActive) {
    attacker.afterglowPursuitReady = false;
    delete attacker.buffs.afterglow_pursuit;
  }
  if (purificationReversalStacks > 0) delete attacker.buffs.purification_reversal;
  if (rangerTumbleActive) attacker.rangerTumbleReady = false;
  if (assassinShadowCounterActive) attacker.assassinShadowCounterReady = false;
  if (vampirePactBacklashActive) attacker.vampirePactBacklashReady = false;
  if (rangerRoamingActive) attacker.rangerRoamingUsedTurn = (_e2 = state.combat) == null ? void 0 : _e2.turn;
  attacker.manaTideActive = manaTideActive;
  attacker.triadResonanceActive = triadActive;
  attacker.crimsonHuntActive = crimsonHuntActive;
  attacker.shadowReturnActive = shadowReturnActive;
  attacker.dualShiftStrikeActive = dualShiftStrikeActive;
  attacker.afterglowPursuitActive = afterglowPursuitActive;
  attacker.purificationReversalStacksActive = purificationReversalStacks;
  attacker.rangerTumbleActive = rangerTumbleActive;
  attacker.assassinShadowCounterActive = assassinShadowCounterActive;
  attacker.vampirePactBacklashActive = vampirePactBacklashActive;
  attacker.rangerRoamingActive = rangerRoamingActive;
  const consumeSteadyAim = !opts.echo && hasDamageEffect && skill.targets === "single" && hasBuff(attacker, "sharpshooter_aim");
  const consumeWindVolley = !opts.echo && isMultiHitSkill(skill) && hasBuff(attacker, "wind_volley");
  const previousTalentSkillContext = attacker._talentSkillContext;
  attacker._talentSkillContext = { isBasicAttack, isSingleTarget: skill.targets === "single", isEcho: !!opts.echo };
  const targets = runSkillEffects(attacker, skill, targetIdx, { paidCost: cost, isBasicAttack, isEcho: !!opts.echo, allyTargetId: opts.allyTargetId || "" });
  if (!opts.echo) targets.push(...executePuppetCommand(attacker, skill, targetIdx, { paidCost: cost }));
  if (consumeSteadyAim) consumeBuffStack(attacker, "sharpshooter_aim");
  if (consumeWindVolley) consumeBuffStack(attacker, "wind_volley");
  attacker._talentSkillContext = previousTalentSkillContext;
  attacker.manaTideActive = false;
  attacker.triadResonanceActive = false;
  attacker.crimsonHuntActive = false;
  attacker.shadowReturnActive = false;
  attacker.dualShiftStrikeActive = false;
  attacker.afterglowPursuitActive = false;
  attacker.purificationReversalStacksActive = 0;
  attacker.rangerTumbleActive = false;
  attacker.assassinShadowCounterActive = false;
  attacker.vampirePactBacklashActive = false;
  attacker.rangerRoamingActive = false;
  if (!opts.echo && skill.id === "r_dodge" && hasSkillPassive("ranger_tumble_shot", attacker)) {
    attacker.rangerTumbleReady = true;
    combatLog("💨 乘风翻滚：下一个伤害技能获得强化。");
  }
  if (!opts.echo && skill.id === "v_pact" && hasSkillPassive("vampire_pact_backlash", attacker)) {
    const beforeEnergy = attacker.energy;
    attacker.energy = Math.min(attacker.stats.energy, attacker.energy + 10);
    attacker.vampirePactBacklashReady = true;
    combatLog("📜 血契反噬：恢复 ".concat(attacker.energy - beforeEnergy, " 能量，下一个直接伤害技能获得强化。"));
  }
  if (!opts.echo && skill.id === "m_ult" && hasSkillPassive("mage_arcane_release", attacker)) {
    const beforeEnergy = attacker.energy;
    attacker.energy = Math.min(attacker.stats.energy, attacker.energy + 20);
    for (const [skillId, cooldown] of Object.entries(attacker.cooldowns || {})) {
      if (skillId !== skill.id && cooldown > 0) attacker.cooldowns[skillId] = Math.max(0, cooldown - 1);
    }
    combatLog("🌠 奥能倾泻：恢复 ".concat(attacker.energy - beforeEnergy, " 能量，其他技能冷却 -1。"));
  }
  if (!opts.echo && hasSkillPassive("druid_natural_cycle", attacker)) {
    attacker.druidNaturalCycleSkills || (attacker.druidNaturalCycleSkills = []);
    if (!attacker.druidNaturalCycleSkills.includes(skill.id)) attacker.druidNaturalCycleSkills.push(skill.id);
    if (attacker.druidNaturalCycleSkills.length >= 3) {
      attacker.druidNaturalCycleSkills = [];
      healRaw(attacker, Math.floor(attacker.maxHp * 0.08), { selfHeal: true });
      const beforeEnergy = attacker.energy;
      attacker.energy = Math.min(attacker.stats.energy, attacker.energy + 15);
      combatLog("♻️ 自然轮回：恢复生命与 ".concat(attacker.energy - beforeEnergy, " 能量。"));
    }
  }
  if (!opts.echo && isTalentOwner(attacker) && hasTalent("afterglow_pursuit") && !skill.isUlt && !isBasicAttack && !hasDamageEffect) {
    attacker.afterglowPursuitReady = true;
    applyBuff(attacker, "afterglow_pursuit", null, 1, attacker);
    combatLog("✨ 余韵追击：".concat(attacker.name, " 的下一次伤害获得强化。"));
  }
  if (!opts.echo && attacker.isPlayer && hasTalent("triad_resonance") && ["m_fireball", "m_frost", "m_lightning"].includes(skill.id)) {
    attacker.triadElements || (attacker.triadElements = {});
    attacker.triadElements[skill.id] = true;
    if (["m_fireball", "m_frost", "m_lightning"].every((id) => attacker.triadElements[id])) {
      attacker.triadElements = {};
      const energy = talentStarValue("triad_resonance");
      const beforeEnergy = attacker.energy;
      attacker.energy = Math.min(attacker.stats.energy, attacker.energy + energy);
      armManaTideOnFullEnergy(attacker, beforeEnergy);
      applyBuff(attacker, "triad_resonance", 3, 1, attacker);
      combatLog("🔮 三相共鸣：恢复 ".concat(attacker.energy - beforeEnergy, " 能量，下一次攻击技能强化。"));
    }
  }
  if (!opts.echo && attacker.isPlayer && hasTalent("hunter_eye") && hasDamageEffect && skill.targets === "single") {
    const target = targets.find((unit) => (unit == null ? void 0 : unit.side) === "enemy") || null;
    if ((target == null ? void 0 : target.unitId) && hasBuff(target, "ranger_mark")) {
      if (attacker.hunterEyeTargetId !== target.unitId) {
        attacker.hunterEyeTargetId = target.unitId;
        attacker.hunterEyeStacks = 0;
      }
      attacker.hunterEyeStacks = Math.min(5, (attacker.hunterEyeStacks || 0) + 1);
      combatLog("🎯 猎手之眼：对".concat(target.name, "的专注提升至").concat(attacker.hunterEyeStacks, "/5层。"));
    } else if ((target == null ? void 0 : target.unitId) && attacker.hunterEyeTargetId !== target.unitId) {
      attacker.hunterEyeTargetId = target.unitId;
      attacker.hunterEyeStacks = 0;
    }
  }
  if (!opts.echo && attacker.isPlayer && hasTalent("pursuit_mark") && hasDamageEffect) {
    for (const target of targets.filter((unit) => (unit == null ? void 0 : unit.side) === "enemy" && unit.alive && hasBuff(unit, "ranger_mark"))) {
      target.pursuitStacks = (target.pursuitStacks || 0) + 1;
      if (target.pursuitStacks < 3) continue;
      target.pursuitStacks = 0;
      const field = ((_f2 = target.template) == null ? void 0 : _f2.isBoss) ? "bossRawValues" : "values";
      const damage = Math.max(1, Math.floor(target.maxHp * talentStarValue("pursuit_mark", null, state.run, field)));
      const dealt = dealPercentTrueDamage(target, damage, attacker, { sourceName: "追猎印记" });
      combatLog("🏹 追猎印记：对 ".concat(target.name, " 造成 ").concat(dealt, " 真实伤害。"));
    }
  }
  if (!opts.echo && attacker.isPlayer && hasTalent("judgment_cycle") && (skill.effects || []).some((effect) => effect.type === "heal")) {
    attacker.judgmentCycleCasts = (attacker.judgmentCycleCasts || 0) + 1;
    if (attacker.judgmentCycleCasts >= 4) {
      attacker.judgmentCycleCasts = 0;
      const target = state.combat.enemies.filter((enemy) => enemy.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (target) {
        const damage = Math.max(1, Math.floor(attacker.stats.matk * talentStarValue("judgment_cycle")));
        const dealt = takeDamage(target, damage, attacker, { trueDamage: true, sourceName: "神罚循环" });
        const gain = talentStarValue("judgment_cycle", null, state.run, "energyValues");
        const beforeEnergy = attacker.energy;
        attacker.energy = Math.min(attacker.stats.energy, attacker.energy + gain);
        armManaTideOnFullEnergy(attacker, beforeEnergy);
        combatLog("✦ 神罚循环：造成 ".concat(dealt, " 真实伤害，恢复 ").concat(attacker.energy - beforeEnergy, " 能量。"));
      }
    }
  }
  if (attacker.side === "ally" && isBasicAttack && unitHasMech(attacker, "mx_combo_stack") && (skill.effects || []).some((effect) => effect.type === "damage")) {
    addComboStack(attacker);
  }
  if (!opts.echo && hasTalent("arcane_echo") && attacker.isPlayer && !isBasicAttack && hasDamageEffect) {
    const { matk, refreshChance } = hiddenTalentStarValues("arcane_echo");
    state.run.hiddenStacks.matk = (state.run.hiddenStacks.matk || 0) + matk;
    attacker.stats.matk += matk;
    combatLog("🔮 奥术回响：法强永久 +".concat(matk, "。"));
    if (Math.random() < refreshChance && (attacker.cooldowns[skill.id] || 0) > 0) {
      attacker.cooldowns[skill.id] = 0;
      combatLog("🔮 奥术回响：".concat(skill.name, " 冷却刷新。"));
    }
  }
  if (!opts.echo && hasTalent("divine_hand") && attacker.isPlayer && isBasicAttack && (skill.effects || []).some((effect) => effect.type === "damage")) {
    const { hp, damagePct } = hiddenTalentStarValues("divine_hand");
    state.run.hiddenStacks.hp = (state.run.hiddenStacks.hp || 0) + hp;
    attacker.maxHp += hp;
    attacker.hp += hp;
    const damage = Math.max(1, Math.floor(attacker.maxHp * damagePct));
    for (const target of targets.filter((unit) => (unit == null ? void 0 : unit.alive) && unit.side === "enemy")) {
      takeDamage(target, damage, attacker, { trueDamage: true, sourceName: "天罚之手" });
    }
    combatLog("🖐️ 天罚之手：最大生命永久 +".concat(hp, "，附加最大生命 ").concat(Number((damagePct * 100).toFixed(1)), "%（").concat(damage, "真实伤害）。"));
  }
  if (!opts.echo && attacker.isPlayer && skill.id === "m_ult" && hasTalent("meteor_spam")) {
    const gain = talentStarValue("meteor_spam");
    state.run.meteorSpamCount = (state.run.meteorSpamCount || 0) + 1;
    state.run.hiddenStacks.matk = (state.run.hiddenStacks.matk || 0) + gain;
    combatLog("🌠 陨星连发：法强永久 +".concat(gain, "。"));
    attacker.cooldowns[skill.id] = 0;
  }
  if (!opts.echo && hasTalent("double_strike") && attacker.isPlayer && isBasicAttack && Math.random() < talentStarValue("double_strike")) {
    const target = targets.find((t) => t == null ? void 0 : t.alive) || ((_g = state.combat) == null ? void 0 : _g.enemies.find((e) => e.alive));
    if (target) {
      combatLog("⚔️ 双刃斩触发，追加一次普攻。");
      dealDamage(attacker, target, { coeff: 0.7, statKey: "atk" }, "双刃斩", 0);
    }
  }
  if (!opts.echo && hasTalent("sword_saint") && attacker.isPlayer && isBasicAttack) {
    const target = targets.find((unit) => (unit == null ? void 0 : unit.alive) && unit.side === "enemy") || ((_h = state.combat) == null ? void 0 : _h.enemies.find((unit) => unit.alive));
    combatLog("⚔️ 剑圣：剑速如风，追加一击。");
    attacker.forceCritNext = true;
    if (target) dealDamage(attacker, target, { coeff: talentStarValue("sword_saint"), statKey: "atk" }, "剑圣追击", 0);
  }
  if (!opts.echo && hasTalent("mirror") && attacker.isPlayer) {
    state.combat.mirrorLastSkill = { skill, targetIdx };
    if ((state.combat.mirrorTurnCounter || 0) >= talentStarValue("mirror")) {
      state.combat.mirrorTurnCounter = 0;
      const mirror = state.combat.mirrorLastSkill;
      combatLog("🪞 镜像之力：复制「".concat(mirror.skill.name, "」。"));
      runSkillEffects(attacker, mirror.skill, mirror.targetIdx, { paidCost: 0, isBasicAttack: isBasicAttackSkill(attacker, mirror.skill), echo: true });
      if (mirror.skill.puppetCommand) executePuppetCommand(attacker, mirror.skill, mirror.targetIdx, { paidCost: 0 });
    }
  }
  if (!opts.echo && unitHasMech(attacker, "mx_double_cast") && !isBasicAttack && Math.random() < mechChance(0.15, attacker)) {
    combatLog("★ 双重施法触发。");
    runSkillEffects(attacker, skill, targetIdx, { paidCost: 0, isBasicAttack, echo: true });
    if (skill.puppetCommand) executePuppetCommand(attacker, skill, targetIdx, { paidCost: 0 });
  }
  if (!opts.echo) tier2AfterSkill(attacker, skill, targetIdx, targets);
  tier2FinishSkill(attacker);
  restoreEffectSkill();
  return true;
}
function resolvePuppetRedirectTarget(target, attacker, eligible = true) {
  var _a, _b;
  if (!eligible || !(target == null ? void 0 : target.alive) || !isPuppeteerUnit(target) || (attacker == null ? void 0 : attacker.side) !== "enemy") return { target, multiplier: 1 };
  const puppet = commandPuppetFor(target, true);
  const link = puppet == null ? void 0 : puppet.redirectState;
  if (!(puppet == null ? void 0 : puppet.alive) || !link || link.charges <= 0 || (((_a = state.combat) == null ? void 0 : _a.turn) || 0) > link.expiresTurn) return { target, multiplier: 1 };
  link.charges -= 1;
  if ((_b = target.buffs) == null ? void 0 : _b.puppet_link) {
    target.buffs.puppet_link.stacks = link.charges;
    if (link.charges <= 0) delete target.buffs.puppet_link;
  }
  combatLog("🧵 移形换位：".concat(puppet.name, " 替 ").concat(target.name, " 承受单体攻击。"));
  return { target: puppet, multiplier: 1 - (link.reduction || 0) };
}
function useEnemySkill(attacker, skill, targetUnitId = "") {
  var _a, _b, _c2, _d2, _e2, _f2;
  const c = state.combat;
  if (!c || !attacker.alive) return;
  let releasingCharged = false;
  if (attacker.charging) {
    if (statusEffectApplies(attacker, "stun", { scope: currentActionStatusScope() })) {
      combatLog("💥 ".concat(attacker.name, " 的蓄力被打断了。"));
      attacker.charging = null;
      return;
    }
    attacker.charging.turnsLeft -= 1;
    if (attacker.charging.turnsLeft > 0) {
      combatLog("🔴 ".concat(attacker.name, " 正在蓄力。"));
      return;
    }
    skill = DATA.enemySkills[attacker.charging.skillId] || DATA.enemySkills.e_attack;
    targetUnitId = attacker.charging.targetUnitId || targetUnitId;
    attacker.charging = null;
    releasingCharged = true;
  }
  if (statusEffectApplies(attacker, "silence", { scope: currentActionStatusScope() })) {
    combatLog("🤐 ".concat(attacker.name, " 被沉默，无法行动。"));
    emitCombatFloat(attacker, "沉默", "dodge");
    return;
  }
  if (!skill) skill = DATA.enemySkills.e_attack;
  const skillStatKey = skill.statKey || "atk";
  const skillStat = Math.max(0, (_d2 = (_c2 = (_a = attacker.stats) == null ? void 0 : _a[skillStatKey]) != null ? _c2 : (_b = attacker.stats) == null ? void 0 : _b.atk) != null ? _d2 : 0);
  if (skill.chargeUp && !releasingCharged) {
    const skillId = ((_e2 = Object.entries(DATA.enemySkills).find(([, def]) => def === skill)) == null ? void 0 : _e2[0]) || "e_attack";
    attacker.charging = { skillId, turnsLeft: skill.chargeTurns || 1, targetUnitId };
    attacker.intentIcon = DATA.intentIcons.charge;
    attacker.intentText = "蓄力中";
    combatLog("🔴 ".concat(attacker.name, " 开始蓄力「").concat(skill.name, "」。"));
    return;
  }
  const restoreEffectSkill = pushCombatEffectSkill(enemySkillId(skill) || "e_attack");
  combatLog("".concat(attacker.icon || "", " ").concat(attacker.name, " ").concat(releasingCharged ? "释放了" : "使用", "「").concat(skill.name, "」。"));
  if (skill.selfTarget) {
    if (skill.healPct) {
      const amt = Math.floor(attacker.maxHp * skill.healPct);
      const beforeHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + amt);
      const real = attacker.hp - beforeHp;
      if (real > 0) emitCombatFloat(attacker, "+".concat(real), "heal");
      if (real > 0) combatLog("💚 ".concat(attacker.name, " 回复 ").concat(real, " 生命。"));
    }
    if (skill.shieldPct) {
      const amt = Math.floor(attacker.maxHp * skill.shieldPct);
      attacker.shield += amt;
      if (amt > 0) emitCombatFloat(attacker, "+".concat(amt), "shield");
      combatLog("🛡️ ".concat(attacker.name, " 获得 ").concat(amt, " 护盾。"));
    }
    if (skill.buff) applyBuff(attacker, skill.buff, skill.buffTurns || 2);
    restoreEffectSkill();
    return;
  }
  if (skill.buffAllies) {
    for (const e of c.enemies.filter((x) => x.alive)) applyBuff(e, skill.buffAllies, skill.buffTurns || 2);
    restoreEffectSkill();
    return;
  }
  if (skill.aoeHpPct) {
    for (const ally of c.allies.filter((a) => a.alive)) {
      takeDamage(ally, Math.floor(ally.maxHp * skill.aoeHpPct) + Math.floor(skillStat * 0.5), attacker, { trueDamage: true, sourceName: skill.name });
    }
    restoreEffectSkill();
    return;
  }
  if (skill.selfDmgPct) {
    const plannedTarget2 = c.allies.find((ally) => ally.alive && ally.unitId === targetUnitId) || pickAllyTarget();
    const redirect2 = resolvePuppetRedirectTarget(plannedTarget2, attacker, !skill.aoe);
    const targets2 = skill.aoe ? c.allies.filter((a) => a.alive) : [redirect2.target];
    for (const target of targets2) {
      if (target == null ? void 0 : target.alive) dealDamage(attacker, target, { coeff: (skill.coeff || 1.5) * (skill.aoe ? 1 : redirect2.multiplier), statKey: skillStatKey }, skill.name);
    }
    attacker.hp = 0;
    attacker.alive = false;
    triggerEnemyPassiveAffixOnAllyDefeated(attacker);
    combatLog("☠️ ".concat(attacker.name, " 自爆身亡。"));
    restoreEffectSkill();
    return;
  }
  const plannedTarget = c.allies.find((ally) => ally.alive && ally.unitId === targetUnitId) || pickAllyTarget();
  const redirect = resolvePuppetRedirectTarget(plannedTarget, attacker, !skill.aoe);
  const targets = skill.aoe ? c.allies.filter((a) => a.alive) : [redirect.target];
  for (let target of targets) {
    if (!target) continue;
    let total = 0;
    const hits = skill.hits || 1;
    for (let i = 0; i < hits; i += 1) {
      if (!target.alive) target = pickAllyTarget();
      if (!(target == null ? void 0 : target.alive)) break;
      total += dealDamage(attacker, target, { coeff: (skill.coeff || 1) * (skill.aoe ? 1 : redirect.multiplier), statKey: skillStatKey, lifestealPct: (skill.lifestealPct || 0) + (((_f2 = attacker.passiveAffixEffects) == null ? void 0 : _f2.lifestealPct) || 0) }, skill.name);
    }
    if (skill.dot && (target == null ? void 0 : target.alive)) applyDot(attacker, target, skill.dot, skill.dotTurns || 2, Math.floor(skillStat * (skill.dotCoeff || 0.22)));
    if (skill.debuff && (target == null ? void 0 : target.alive)) applyBuff(target, skill.debuff, skill.debuffTurns || 2);
    if (skill.stun && (target == null ? void 0 : target.alive) && Math.random() < skill.stun && !hasBuff(target, "cc_immune")) applyBuff(target, "stun", 1);
    if (total > 0 && (target == null ? void 0 : target.isPlayer) && hasTalent("fury_stack")) applyBuff(target, "fury_stack", 3, 1);
  }
  restoreEffectSkill();
}
function resolveTargets(attacker, skill, targetIdx, context = {}) {
  const c = state.combat;
  if (skill.targets === "all") return c.enemies.filter((e) => e.alive);
  if (skill.targets === "self") return [attacker];
  if (skill.targets === "party") return c.allies.filter((a) => a.alive);
  if (skill.targets === "party_single") {
    const chosen = c.allies.find((ally) => ally.alive && !ally.isCommandPuppet && ally.unitId === context.allyTargetId);
    return [chosen || lowestHpAlly()].filter(Boolean);
  }
  const enemy = c.enemies[targetIdx] && c.enemies[targetIdx].alive ? c.enemies[targetIdx] : c.enemies.find((e) => e.alive);
  return enemy ? [enemy] : [];
}
function applySkillEffect(attacker, skill, effect, targets, context = {}) {
  var _a, _b, _c2, _d2, _e2;
  if (effect.targets === "all") targets = state.combat.enemies.filter((e) => e.alive);
  if (effect.targets === "party") targets = state.combat.allies.filter((a) => a.alive);
  if (effect.targets === "party_lowest") targets = [lowestHpAlly()];
  if (effect.targets === "self") targets = [attacker];
  if (effect.selfOnly) targets = [attacker];
  if (effect.type === "damage") {
    let hits = Math.max(1, effect.hits || 1);
    if (skill.id === "r_rapid" && unitHasCombatPassive(attacker, "rapid_extra")) hits += 1;
    if (!((_a = attacker._talentSkillContext) == null ? void 0 : _a.isEcho) && hasBuff(attacker, "wind_volley") && hits >= 2) hits += 1;
    const stormFinalHit = attacker.isPlayer && hasTalent("venom_blast") && hits >= 2;
    const performHit = (target, hitIdx) => {
      var _a2;
      if (!(target == null ? void 0 : target.alive)) return 0;
      let finalHitMultiplier = 1;
      if (stormFinalHit && hitIdx === hits - 1 && typeof effect.coeff === "number") {
        finalHitMultiplier *= 1 + talentStarValue("venom_blast");
        if (!context.stormFinalHitLogged) {
          context.stormFinalHitLogged = true;
          combatLog("🏹 风暴箭阵：多段技能的最后一段获得强化。");
        }
      }
      if (hits >= 2 && hitIdx === hits - 1 && hasSkillPassive("ranger_final_volley", attacker)) {
        finalHitMultiplier *= 1.25;
        if (!context.passiveFinalHitLogged) {
          context.passiveFinalHitLogged = true;
          combatLog("🏹 连珠箭术：多段技能最后一击获得强化。");
        }
      }
      const hitEffect = {
        ...effect,
        skillId: skill.id,
        ...typeof effect.coeff === "number" ? { coeff: effect.coeff * finalHitMultiplier } : {}
      };
      const dealt = dealDamage(attacker, target, hitEffect, skill.name, (_a2 = context.paidCost) != null ? _a2 : skill.cost);
      if (dealt > 0 && effect.onHitDodgeChance && Math.random() < effect.onHitDodgeChance) {
        applyBuff(attacker, "dodge_next", null, 1);
        combatLog("💨 ".concat(attacker.name, " 蓄积了一次必定闪避。"));
      }
      return dealt;
    };
    const postTargetProcs = (target) => {
      var _a2;
      if (attacker.isPlayer && hasTalent("multi_hit") && (state.combat.multiHitCount || 0) < talentCap(2) && Math.random() < talentStarValue("multi_hit") && target.alive) {
        state.combat.multiHitCount = (state.combat.multiHitCount || 0) + 1;
        combatLog("🔥 多段狂热追击。");
        dealDamage(attacker, target, { ...effect, coeff: 0.5, statKey: effect.statKey || "atk", onHitDodgeChance: 0 }, "追击", (_a2 = context.paidCost) != null ? _a2 : skill.cost);
      }
      if (attacker.isPlayer && hasTalent("shadow_clone") && Math.random() < talentStarValue("shadow_clone") && target.alive) {
        combatLog("👥 影分身追加攻击。");
        dealDamage(attacker, target, { coeff: talentStarValue("shadow_clone"), statKey: "atk" }, "影分身", 0);
      }
    };
    if (effect.distributedHits) {
      const selected = targets.find((target) => target == null ? void 0 : target.alive) || null;
      const ordered = [selected, ...(((_b = state.combat) == null ? void 0 : _b.enemies) || []).filter((target) => target.alive && target !== selected)].filter(Boolean);
      const touched = /* @__PURE__ */ new Set();
      for (let i = 0; i < hits; i += 1) {
        let target = ordered[i % Math.max(1, ordered.length)] || null;
        if (!(target == null ? void 0 : target.alive)) {
          const alive = (((_c2 = state.combat) == null ? void 0 : _c2.enemies) || []).filter((enemy) => enemy.alive);
          target = alive[i % Math.max(1, alive.length)] || null;
        }
        if (!target) break;
        performHit(target, i);
        touched.add(target);
      }
      for (const target of touched) postTargetProcs(target);
    } else {
      for (const target of targets) {
        for (let i = 0; i < hits; i += 1) performHit(target, i);
        postTargetProcs(target);
      }
    }
  }
  if (effect.type === "heal") {
    const healTargets = tier2ResolveHealTargets(attacker, targets);
    for (const target of healTargets) {
      const healResult = healUnit(attacker, target, effect);
      if (healResult) {
        context.passiveHealResults || (context.passiveHealResults = []);
        context.passiveHealResults.push({ target, real: healResult.real || 0 });
      }
    }
  }
  if (effect.type === "shield") {
    for (const target of targets) shieldUnit(attacker, target, effect, skill);
  }
  if (effect.type === "energy") {
    const beforeEnergy = attacker.energy;
    attacker.energy = Math.min(attacker.stats.energy, attacker.energy + effect.amount);
    const energyGain = attacker.energy - beforeEnergy;
    if (energyGain > 0) emitCombatFloat(attacker, "+".concat(energyGain), "energy");
    armManaTideOnFullEnergy(attacker, beforeEnergy);
  }
  if (effect.type === "buff") {
    for (const target of targets) {
      if (effect.chance && Math.random() >= effect.chance) continue;
      applyBuff(target, effect.buffId, effect.turns || 1, effect.stacks || 1, attacker);
      if (effect.buffId === "ch_rewind_buff") resetLongestCooldown(target);
    }
  }
  if (effect.type === "debuff") {
    const extraTurns = controlTalentExtraTurns(attacker, effect.buffId);
    for (const target of targets) applyBuff(target, effect.buffId, (effect.turns || 1) + extraTurns, effect.stacks || 1, attacker);
  }
  if (effect.type === "dot") {
    for (const target of targets) {
      const statKey = effect.statKey || effect.stat || (effect.dmgCoeff <= 0.04 ? "maxHp" : "atk");
      const stat = statKey === "maxHp" ? attacker.maxHp : attacker.stats[statKey] || attacker.stats.atk;
      let power = Math.max(1, Math.floor(stat * (effect.dmgCoeff || 0.25)));
      if (attacker.isPlayer && hasTalent("natures_wrath")) power = Math.floor(power * (1 + 0.4 * talentStarValue("natures_wrath")));
      const burnExtraTurn = attacker.isPlayer && effect.buffId === "burn" && hasTalent("burn_master") ? 1 : 0;
      const applied = applyDot(attacker, target, effect.buffId, (effect.turns || 2) + burnExtraTurn, power, effect.stacks || 1);
      if (applied && attacker.isPlayer && hasTalent("elem_chain")) takeDamage(target, Math.floor(attacker.stats.atk * talentStarValue("elem_chain")), attacker, { trueDamage: true, sourceName: "元素连锁" });
    }
  }
  if (effect.type === "stun") {
    for (const target of targets) {
      let chance = effect.chance || 1;
      if (unitHasCombatPassive(attacker, "stun_guarantee_minion") && !((_d2 = target.template) == null ? void 0 : _d2.isBoss) && !((_e2 = target.template) == null ? void 0 : _e2.isElite)) chance = 1;
      const extraTurns = controlTalentExtraTurns(attacker, "stun");
      if (Math.random() < chance) applyBuff(target, "stun", (effect.turns || 1) + extraTurns, 1, attacker);
    }
  }
  if (effect.type === "selfDmgPct") {
    takeDamage(attacker, Math.max(1, Math.floor(attacker.hp * effect.pct)), null, { trueDamage: true, bypassShield: true, sourceName: "血契" });
  }
  if (effect.type === "dispel") {
    for (const target of targets) dispelDebuffs(target, effect.count || 1, attacker);
  }
}
function recordWindArrowHit(attacker, effect = {}) {
  var _a, _b;
  if (!(attacker == null ? void 0 : attacker.isPlayer) || getBaseClassId(attacker.classId) !== "ranger" || !hasTalent("wild_bond") || effect.noWindArrowStack || ((_a = attacker._talentSkillContext) == null ? void 0 : _a.isEcho)) return;
  attacker.windArrowHits = (attacker.windArrowHits || 0) + 1;
  if (attacker.windArrowHits < 8) return;
  attacker.windArrowHits -= 8;
  combatLog("💨 疾风箭阵：累计8次命中，箭阵席卷全场。");
  for (const enemy of (((_b = state.combat) == null ? void 0 : _b.enemies) || []).filter((unit) => unit.alive)) {
    dealDamage(attacker, enemy, { coeff: 0.6, statKey: "atk", noWindArrowStack: true, noTier2Offense: true }, "疾风箭阵", 0);
  }
}
function dealDamage(attacker, target, effect, sourceName, skillCost = 0) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h, _i, _j;
  if (!attacker || !target || !target.alive) return 0;
  const combatSource = combatCreditUnit(attacker) || attacker;
  const sourceSkillId = effect.skillId || sourceEffectSkillId(sourceName);
  const statKey = effect.statKey === "maxHp" ? "maxHp" : effect.statKey || "atk";
  const statVal = Math.max(1, statKey === "maxHp" ? attacker.maxHp : attacker.stats[statKey] || attacker.stats.atk);
  let consumedDotStacks = 0;
  if (effect.consumeDot) {
    const dot = (_a = target.buffs) == null ? void 0 : _a[effect.consumeDot];
    if (!dot || (dot.stacks || 0) <= 0) {
      combatLog("💨 ".concat(target.name, " 身上没有可引爆的").concat(buffName(effect.consumeDot), "。"));
      return 0;
    }
    consumedDotStacks = Math.max(1, dot.stacks || 1);
  }
  let def = Math.max(0, ((_b = target.stats) == null ? void 0 : _b.def) || 0);
  if (hasBuff(target, "pb_feral_roar_buff")) def *= 1.2;
  let armorPen = effect.armorPen || 0;
  if (combatSource.isPlayer && getBaseClassId(combatSource.classId) === "ranger" && ((_c2 = combatSource._talentSkillContext) == null ? void 0 : _c2.isSingleTarget) && hasTalent("lethality")) {
    armorPen += 0.25;
  }
  if (combatSource.side === "ally" && getBaseClassId(combatSource.classId) === "ranger" && hasBuff(target, "ranger_mark") && unitHasCombatPassive(combatSource, "poison_boost")) armorPen += 0.15;
  if (hasSkillPassive("assassin_flaw_hunt", combatSource) && hasBuff(target, "hunted")) armorPen += 0.2;
  if (isTalentOwner(combatSource) && hasTalent("exploit_opening") && Object.keys(target.buffs || {}).filter(isDebuffId).length >= 2) {
    armorPen += talentStarValue("exploit_opening");
  }
  armorPen = Math.min(0.9, armorPen);
  const ab = statusEffectApplies(target, "armor_break", { scope: currentActionStatusScope() }) ? target.buffs.armor_break : null;
  if (ab) def *= Math.max(0, 1 - 0.05 * Math.min(ab.stacks || 1, 15));
  def *= 1 - armorPen;
  let raw = statVal * statVal / (statVal + def * 2);
  const effectCoeff = typeof effect.coeff === "number" ? effect.coeff : 1;
  raw *= effectCoeff * (consumedDotStacks || 1);
  if (hasSkillPassive("mage_elemental_amp", combatSource) && ["m_fireball", "m_frost", "m_lightning", "m_ult"].includes(sourceSkillId)) raw *= 1.12;
  if (effect.bonusIfTargetBuff && hasBuff(target, effect.bonusIfTargetBuff)) raw *= effect.bonusMul || 1;
  if (statKey === "matk" && unitHasCombatPassive(combatSource, "arcane_surge")) raw *= 1.12;
  let mult = damageMultiplier(attacker, target, skillCost);
  raw *= mult;
  let critChance = attacker.stats.crit || 0;
  if (hasBuff(combatSource, "focus")) critChance += 15;
  if (hasBuff(combatSource, "bk_frenzy_buff")) critChance += 15;
  if (hasBuff(combatSource, "v_blood_frenzy")) critChance += 10;
  if (combatSource.isPlayer && hasTalent("vital_insight") && Object.keys(target.buffs || {}).filter(isDebuffId).length >= 2) critChance += 100 * talentStarValue("vital_insight");
  if (combatSource.isPlayer && combatSource.shadowReturnActive) critChance += 100 * talentStarValue("shadow_return");
  if (combatSource.side === "ally" && unitHasMech(combatSource, "mx_combo_stack")) critChance += (combatSource.equipmentComboStacks || 0) * 2 * mechAmp(combatSource);
  let forceCrit = false;
  let deathMarkProc = false;
  if (combatSource.side === "ally" && combatSource.isPlayer && hasTalent("death_mark") && target.unitId) {
    (_d2 = state.combat).deathMarkState || (_d2.deathMarkState = {});
    const attackerId = combatSource.unitId || "player";
    const previous = state.combat.deathMarkState[attackerId] || { targetId: "", hits: 0 };
    const hits = previous.targetId === target.unitId ? previous.hits + 1 : 1;
    if (hits >= talentStarValue("death_mark")) {
      forceCrit = true;
      deathMarkProc = true;
      state.combat.deathMarkState[attackerId] = { targetId: "", hits: 0 };
    } else {
      state.combat.deathMarkState[attackerId] = { targetId: target.unitId, hits };
    }
  }
  if (combatSource.forceCritNext) {
    forceCrit = true;
    combatSource.forceCritNext = false;
  }
  let crit = forceCrit || (effect.autocritIf && hasBuff(combatSource, effect.autocritIf) ? true : Math.random() * 100 < critChance);
  let dmg = raw;
  let critExtraDamage = 0;
  let deathMarkBonus = 0;
  if (crit) {
    let critDmg = attacker.stats.critDmg || 50;
    if (unitHasCombatPassive(combatSource, "shadow_crit")) critDmg += 35;
    if (hasSkillPassive("assassin_deadly_instinct", combatSource)) critDmg += 15;
    dmg *= 1 + critDmg / 100;
    critExtraDamage = dmg - raw;
    if (deathMarkProc) {
      deathMarkBonus = Math.max(1, Math.floor(target.maxHp * 0.05));
    }
    if (combatSource.isPlayer && hasTalent("archmage") && (statKey === "matk" || (combatSource.stats.matk || 0) >= (combatSource.stats.atk || 0))) {
      applyBuff(target, "stun", 1 + controlTalentExtraTurns(attacker, "stun"));
      combatLog("✨ 大魔导师：法术暴击附带眩晕。");
    }
  }
  if (effect.bonusTag && target.tag === effect.bonusTag) {
    const bonusMul = effect.bonusMul || 1;
    dmg *= bonusMul;
    critExtraDamage *= bonusMul;
  }
  const destroyer = enemyPassiveAffixByMechanic(attacker, "execute_and_chain");
  if (destroyer && target.hp / target.maxHp < 0.3) {
    dmg *= 1 + (destroyer.executePct || 0);
    critExtraDamage *= 1 + (destroyer.executePct || 0);
    logEnemyPassiveAffix(attacker, destroyer, "".concat(target.name, " 生命低于 30%，触发处决伤害。"));
  }
  if (consumedDotStacks > 0) {
    delete target.buffs[effect.consumeDot];
    combatLog("💥 毒爆：引爆并消耗 ".concat(consumedDotStacks, " 层毒素。"));
  }
  if (hasTalent("chaos_lord") && combatSource.isPlayer) applyBuff(target, pick(["armor_break", "burn", "poison", "weaken"]), talentStarValue("chaos_lord", null, state.run, "duration"), 1, combatSource);
  const deathSentenceKills = /* @__PURE__ */ new Set();
  if (isTier2Class(target, "ancient_beast_god") && (tier2State(target).beastGodActions || 0) > 0) {
    dmg *= 0.75;
  }
  const damageOpts = { crit, critExtraDamage: Math.floor(critExtraDamage), ignoreDefense: true, sourceName };
  if (sourceSkillId) damageOpts.skillId = sourceSkillId;
  const hpBeforeHit = target.hp;
  let dealt = takeDamage(target, Math.max(1, Math.floor(dmg + 1e-9)), attacker, damageOpts);
  if (attacker.side === "enemy" && dealt > 0 && target.alive) triggerEnemyPassiveAffixOnHit(attacker, target, dealt);
  if (deathMarkBonus > 0 && target.alive) {
    const bonusDealt = dealPercentTrueDamage(target, deathMarkBonus, attacker, { sourceName: "死亡宣告" });
    dealt += bonusDealt;
    combatLog("💀 死亡宣告：追加 ".concat(bonusDealt, " 真实伤害。"));
  }
  if (!effect.noTier2Offense) tier2AfterDamage(target, dealt, combatSource, crit);
  let pctLife = effect.lifestealPct || 0;
  if (combatSource.side === "ally") {
    if (combatSource.isPlayer) {
      pctLife += (hasTalent("vampiric") ? talentStarValue("vampiric") : 0) + (hasTalent("blood_dominion") ? 0.15 : 0);
      if (pctLife > 0 && hasTalent("blood_lord")) pctLife *= 1 + 0.5 * talentStarValue("blood_lord");
    }
    if (unitHasCombatPassive(combatSource, "bloodthirst_boost")) pctLife += 0.15;
    if (unitHasMech(combatSource, "mx_lifesteal")) pctLife += 0.08 * mechAmp(combatSource);
    if (pctLife > 0 && hasSkillPassive("vampire_blood_drain", combatSource)) pctLife += 0.05;
  }
  pctLife = Math.min(0.6, pctLife);
  if (pctLife > 0) {
    const heal = Math.floor(dealt * pctLife);
    if (heal > 0) {
      const healResult = healRaw(combatSource, heal, { overflowToShield: !!effect.overflowShield, returnResult: true, selfHeal: true });
      if (healResult.overflow > 0 && hasSkillPassive("vampire_coagulation", combatSource)) {
        grantShield(combatSource, Math.floor(healResult.overflow * 0.5), { maxTotal: Math.floor(combatSource.maxHp * 0.15) });
      }
      if (healResult.amount > 0 && hasSkillPassive("vampire_blood_resonance", combatSource) && combatSource.vampireBloodResonanceTurn !== ((_e2 = state.combat) == null ? void 0 : _e2.turn)) {
        combatSource.vampireBloodResonanceTurn = (_f2 = state.combat) == null ? void 0 : _f2.turn;
        const beforeEnergy = combatSource.energy;
        combatSource.energy = Math.min(combatSource.stats.energy, combatSource.energy + 10);
        const otherAlly = (((_g = state.combat) == null ? void 0 : _g.allies) || []).filter((ally) => ally.alive && ally !== combatSource && !ally.isCommandPuppet).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (otherAlly) healRaw(otherAlly, Math.floor(healResult.real * 0.5));
        combatLog("💞 鲜血共鸣：".concat(combatSource.name, " 恢复 ").concat(combatSource.energy - beforeEnergy, " 能量").concat(otherAlly ? "并治疗 ".concat(otherAlly.name) : "", "。"));
      }
      tier2RecordLifesteal(combatSource, healResult.amount, healResult.real);
    }
  }
  if (combatSource.isPlayer && crit && dealt > 0 && hasTalent("vital_insight") && Object.keys(target.buffs || {}).filter(isDebuffId).length >= 2 && state.combat.vitalInsightTurn !== state.combat.turn) {
    state.combat.vitalInsightTurn = state.combat.turn;
    reduceLongestNonUltimateCooldown(combatSource);
  }
  if (crit && dealt > 0 && hasSkillPassive("assassin_cold_rhythm", combatSource) && combatSource.assassinColdRhythmTurn !== ((_h = state.combat) == null ? void 0 : _h.turn)) {
    combatSource.assassinColdRhythmTurn = (_i = state.combat) == null ? void 0 : _i.turn;
    reduceLongestNonUltimateCooldown(combatSource);
  }
  const actionSerial = ((_j = state.combat) == null ? void 0 : _j.actionSerial) || 0;
  if (combatSource.side === "ally" && crit && target.alive && unitHasMech(combatSource, "mx_crit_burst") && combatSource.equipmentCritBurstActionSerial !== actionSerial) {
    combatSource.equipmentCritBurstActionSerial = actionSerial;
    dealPercentTrueDamage(target, Math.floor(target.hp * 0.03 * mechAmp(combatSource)), combatSource, { sourceName: "暴击爆裂" });
  }
  if (combatSource.isPlayer && crit && hasTalent("night_hunter")) {
    const gain = 15;
    combatSource.energy = Math.min(combatSource.stats.energy, combatSource.energy + gain);
    combatLog("⚡ 暴击回能：".concat(combatSource.name, " 恢复 ").concat(gain, " 能量。"));
  }
  if (combatSource.isPlayer && dealt > 0 && hasTalent("judgment_heal")) {
    const ally = lowestHpAlly();
    if (ally) healRaw(ally, Math.floor(dealt * 0.15));
  }
  if (dealt > 0 && unitHasCombatPassive(combatSource, "nightblade_stealth") && Math.random() < 0.15) {
    applyBuff(combatSource, "evasion", 1, 1);
    combatLog("🌑 夜刺套装：".concat(combatSource.name, " 获得 1 回合25%闪避。"));
  }
  if (combatSource.isPlayer && hasTalent("night_terror") && target.alive && !state.combat.nightTerrorActive) {
    state.combat.nightTerrorActive = true;
    let vampMult = 1 + (hasTalent("blood_dominion") ? 0.15 : 0) + (hasTalent("bloodthirst_boost") ? 0.15 : 0);
    if (hasTalent("blood_lord")) vampMult *= 1 + 0.5 * talentStarValue("blood_lord");
    const terror = Math.max(1, Math.floor(target.maxHp * talentStarValue("night_terror") * vampMult));
    const terrorDealt = dealPercentTrueDamage(target, terror, combatSource, { sourceName: "暗夜恐惧" });
    if (terrorDealt > 0) healRaw(combatSource, terrorDealt, { selfHeal: true });
    state.combat.nightTerrorActive = false;
  }
  if (combatSource.isPlayer && hasTalent("death_sentence") && combatSource.alive) {
    if (target.alive) target.deathSentenceMarked = true;
    for (const e of state.combat.enemies.filter((enemy) => enemy.alive && enemy.deathSentenceMarked && enemy.hp / enemy.maxHp < 0.1 * talentStarValue("death_sentence"))) {
      combatLog("💀 死神宣判：".concat(e.name, " 被处决。"));
      e.hp = 0;
      handleFatalDamage(e);
      if (e.alive) continue;
      combatSource.energy = Math.min(combatSource.stats.energy, combatSource.energy + 30 * talentStarValue("death_sentence"));
      deathSentenceKills.add(e.unitId);
      onUnitKilled(combatSource, e, e.maxHp);
    }
  }
  if (!target.alive && !deathSentenceKills.has(target.unitId)) onUnitKilled(attacker, target, dealt, Math.max(0, dealt - hpBeforeHit));
  if (dealt > 0) recordWindArrowHit(combatSource, effect);
  return dealt;
}
function damageMultiplier(attacker, target, skillCost, options = {}) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k, _l, _m;
  attacker = combatCreditUnit(attacker) || attacker;
  let damageBonus = 0;
  let damageReduction = 0;
  let extraMultiplier = 1;
  const addDamageBonus = (value) => {
    damageBonus += Math.max(0, Number(value) || 0);
  };
  const addDamageReduction = (value) => {
    damageReduction += Math.max(0, Number(value) || 0);
  };
  const enemyFloorBonus = enemyFloorDamageBonus();
  const climbRuleEffects = climbEffects(state.run);
  if ((attacker == null ? void 0 : attacker.side) === "enemy") {
    addDamageBonus(enemyFloorBonus);
    if ((((_a = state.combat) == null ? void 0 : _a.turn) || 0) <= 3) addDamageBonus(climbRuleEffects.enemyOpeningDamagePct || 0);
    if ((attacker.hp || 0) / Math.max(1, attacker.maxHp || 1) < 0.5) addDamageBonus(climbRuleEffects.enemyLowHpDamagePct || 0);
    if ((target == null ? void 0 : target.side) === "ally" && (target.hp || 0) / Math.max(1, target.maxHp || 1) < 0.35) addDamageBonus(climbRuleEffects.enemyExecuteDamagePct || 0);
  }
  if ((target == null ? void 0 : target.side) === "enemy") {
    addDamageReduction(enemyFloorBonus);
    if ((((_b = state.combat) == null ? void 0 : _b.turn) || 0) <= 3) addDamageReduction(climbRuleEffects.enemyOpeningDamageReductionPct || 0);
  }
  for (const buff of Object.values(((_c2 = state.run) == null ? void 0 : _c2.buffs) || {})) {
    if ((attacker == null ? void 0 : attacker.side) === "ally") addDamageBonus(buff.damageBonus);
    if ((target == null ? void 0 : target.side) === "ally") addDamageReduction(buff.damageReduction);
  }
  if (hasBuff(attacker, "strengthen")) addDamageBonus(0.2);
  if (hasBuff(attacker, "v_blood_frenzy")) addDamageBonus(0.25);
  if (hasBuff(attacker, "bk_frenzy_buff")) addDamageBonus(0.3);
  if (hasBuff(attacker, "pb_feral_roar_buff")) addDamageBonus(0.3);
  if (hasBuff(attacker, "pb_roar_party_buff")) addDamageBonus(0.1);
  if (hasBuff(attacker, "elemental_resonance")) addDamageBonus(0.4);
  if (hasBuff(attacker, "d_hawk_form")) addDamageBonus(0.25);
  if (hasBuff(attacker, "versatile")) addDamageBonus(0.1);
  if (hasBuff(attacker, "fury_stack")) addDamageBonus((attacker.buffs.fury_stack.stacks || 1) * talentStarValue("fury_stack"));
  if (statusEffectApplies(target, "hunted", { scope: currentActionStatusScope() })) addDamageBonus(0.2);
  if ((attacker == null ? void 0 : attacker.side) === "ally" && getBaseClassId(attacker.classId) === "ranger" && statusEffectApplies(target, "ranger_mark", { scope: currentActionStatusScope() })) addDamageBonus(0.2);
  if (statusEffectApplies(target, "weaken", { scope: currentActionStatusScope() })) addDamageBonus(0.12);
  if (hasBuff(target, "fortify")) addDamageReduction(0.2);
  if ((attacker == null ? void 0 : attacker.side) === "ally") {
    if (isTier2Class(attacker, "doombringer") && tier2State(attacker).currentDoomBoost) addDamageBonus(0.35);
    if (attacker.isPlayer && hasTalent("first_strike") && state.combat.turn <= 3) addDamageBonus(talentStarValue("first_strike"));
    if (attacker.isPlayer && hasTalent("time_warp") && state.combat.turn <= 3) addDamageBonus(0.15 * talentStarValue("time_warp"));
    if (attacker.isPlayer && hasTalent("executioner") && target.hp / target.maxHp < 0.3) addDamageBonus(talentStarValue("executioner"));
    if (attacker.isPlayer && hasTalent("crisis") && attacker.hp / attacker.maxHp < 0.35) addDamageBonus(talentStarValue("crisis"));
    if (isTalentOwner(attacker) && hasTalent("desperate_edge") && attacker.hp / attacker.maxHp < 0.4) addDamageBonus(talentStarValue("desperate_edge"));
    if (attacker.isPlayer && hasSkillPassive("revenge", attacker) && attacker.hp / attacker.maxHp < 0.5) addDamageBonus(0.15);
    if (hasSkillPassive("vampire_blood_boil", attacker) && attacker.hp / attacker.maxHp < 0.5) addDamageBonus(0.12);
    if (hasSkillPassive("ranger_precision", attacker) && ((_d2 = attacker._talentSkillContext) == null ? void 0 : _d2.isSingleTarget)) addDamageBonus(0.08);
    if (hasSkillPassive("ranger_gale_hunt", attacker) && (hasBuff(target, "ranger_mark") || hasBuff(target, "hunted") || hasBuff(target, "armor_break"))) addDamageBonus(0.1);
    if (attacker.rangerTumbleActive) addDamageBonus(0.2);
    if (attacker.rangerRoamingActive) addDamageBonus(0.18);
    if (attacker.assassinShadowCounterActive) addDamageBonus(0.2);
    if (attacker.vampirePactBacklashActive) addDamageBonus(0.2);
    if (isTalentOwner(attacker) && hasTalent("weakness_exploit") && target.side === "enemy" && Object.keys(target.buffs || {}).some(isDebuffId)) {
      addDamageBonus(talentStarValue("weakness_exploit"));
    }
    if (attacker.isPlayer && hasTalent("mana_burst") && skillCost >= 40) addDamageBonus(talentStarValue("mana_burst"));
    if (attacker.isPlayer && hasTalent("god_slayer") && ((_e2 = target.template) == null ? void 0 : _e2.isBoss)) addDamageBonus(0.3 * talentStarValue("god_slayer"));
    if (attacker.isPlayer && hasTalent("soul_harvest")) {
      const { multiplier } = hiddenTalentStarValues("soul_harvest");
      addDamageBonus(state.run.floor * 0.01 * multiplier);
    }
    if ((_f2 = state.run) == null ? void 0 : _f2.tacticBoost) addDamageBonus(0.25);
    if (attacker.isPlayer && hasTalent("dmg_escalate")) {
      const perWin = talentStarValue("dmg_escalate");
      addDamageBonus(Math.min(talentCapPct(0.3) * talentPassiveMultiplier("dmg_escalate"), (state.run.dmgEscalateStacks || 0) * perWin));
    }
    if (attacker.isPlayer && hasTalent("natures_wrath") && (hasBuff(attacker, "d_bear_form") || hasBuff(attacker, "d_hawk_form"))) addDamageBonus(0.35 * talentStarValue("natures_wrath"));
    if (hasTalent("primal_fortitude") && attacker.isPlayer && attacker.hp / attacker.maxHp > 0.8) addDamageBonus(0.15 * talentStarValue("primal_fortitude"));
    if (attacker.isPlayer && hasTalent("combo_master")) addDamageBonus(Math.min(5, state.combat.comboStack || 0) * talentStarValue("combo_master"));
    if (attacker.isPlayer && hasTalent("overcharge") && (state.combat.overchargePool || 0) > 0) {
      const perTenEnergy = talentStarValue("overcharge");
      addDamageBonus(Math.min(perTenEnergy * 25, Math.floor((state.combat.overchargePool || 0) / 10) * perTenEnergy));
    }
    if (attacker.isPlayer && hasTalent("chain_kill") && state.combat.chainKillBonus) {
      addDamageBonus(talentStarValue("chain_kill"));
      state.combat.chainKillBonus = false;
    }
    if (isTalentOwner(attacker) && attacker.afterglowPursuitActive) addDamageBonus(talentStarValue("afterglow_pursuit"));
    if (isTalentOwner(attacker) && attacker.purificationReversalStacksActive > 0) {
      addDamageBonus(attacker.purificationReversalStacksActive * talentStarValue("purification_reversal"));
    }
    if (attacker.isPlayer && attacker.manaTideActive) addDamageBonus(talentStarValue("mana_tide", null, state.run, "damageValues"));
    if (attacker.isPlayer && attacker.triadResonanceActive) addDamageBonus(talentStarValue("triad_resonance", null, state.run, "damageValues"));
    if (attacker.isPlayer && attacker.crimsonHuntActive) addDamageBonus(talentStarValue("crimson_hunt", null, state.run, "damageValues"));
    if (attacker.isPlayer && attacker.dualShiftStrikeActive) addDamageBonus(talentStarValue("dual_shift", null, state.run, "strikeValues"));
    if (attacker.isPlayer && hasTalent("chaos_lord") && Object.keys(target.buffs || {}).some(isDebuffId)) addDamageBonus(talentStarValue("chaos_lord"));
    if (attacker.isPlayer && hasTalent("infinity")) addDamageBonus(Math.min(0.6, Math.floor((((_g = state.run) == null ? void 0 : _g.floor) || 1) / 3) * 0.12));
    if (hasTalent("merc_fury")) {
      const mercs = state.combat.allies.filter((a) => a.isMerc && a.alive).length;
      addDamageBonus(mercs * 0.08 * talentStarValue("merc_fury"));
    }
    if (attacker.isPlayer && hasTalent("berserker_rage") && attacker.hp / attacker.maxHp < 0.5) addDamageBonus(0.25);
    if (attacker.isPlayer && getBaseClassId(attacker.classId) === "ranger") {
      if (((_h = attacker._talentSkillContext) == null ? void 0 : _h.isSingleTarget) && hasTalent("lethality") && hasBuff(target, "ranger_mark")) addDamageBonus(0.15);
      if (((_i = attacker._talentSkillContext) == null ? void 0 : _i.isSingleTarget) && hasBuff(attacker, "sharpshooter_aim")) addDamageBonus(0.25);
    }
    if (attacker.isPlayer && hasTalent("hunter_eye") && attacker.hunterEyeTargetId === target.unitId && (attacker.hunterEyeStacks || 0) > 0) {
      addDamageBonus(attacker.hunterEyeStacks * talentStarValue("hunter_eye"));
    }
  } else if ((target == null ? void 0 : target.side) === "ally") {
    if (hasBuff(target, "versatile")) addDamageReduction(0.1);
    if (hasBuff(target, "d_bear_form")) addDamageReduction(0.25);
    if (hasBuff(target, "dual_shift_guard")) addDamageReduction(talentStarValue("dual_shift"));
    if (hasBuff(target, "unbroken_line")) addDamageReduction(0.15);
    if (isTalentOwner(target) && hasBuff(target, "steady_line") && target.steadyLineTurn === ((_j = state.combat) == null ? void 0 : _j.turn)) addDamageReduction(talentStarValue("steady_line"));
    if (hasBuff(target, "sacred_covenant")) addDamageReduction(talentStarValue("sacred_covenant"));
    if (hasBuff(target, "bk_frenzy_buff")) addDamageBonus(0.1);
    if (unitHasCombatPassive(target, "nightfall_dmg_reduce")) addDamageReduction(0.15);
    if (hasSkillPassive("mage_mana_barrier", target) && (target.shield || 0) > 0) addDamageReduction(0.08);
    if (isTalentOwner(target) && hasTalent("soul_link") && ((_k = commandPuppetFor(target)) == null ? void 0 : _k.alive)) {
      addDamageReduction(talentStarValue("soul_link"));
    }
    if (options.includeLastStand !== false && hasTalent("last_stand") && target.isPlayer && target.hp / target.maxHp < talentStarValue("last_stand")) extraMultiplier *= 0.5;
    if (hasTalent("tough_body") && target.isPlayer) addDamageReduction(0.05 * talentPassiveMultiplier("tough_body"));
    if (hasTalent("primal_fortitude") && target.isPlayer && target.hp / target.maxHp < 0.25) addDamageReduction(0.3 * talentStarValue("primal_fortitude"));
    if (hasTalent("adapt") && target.isPlayer && attacker.unitId) {
      const stacks = ((_l = state.combat.adaptStacks) == null ? void 0 : _l[attacker.unitId]) || 0;
      if (stacks > 0) addDamageReduction(stacks * 0.05);
    }
    if (hasTalent("god_slayer") && ((_m = attacker.template) == null ? void 0 : _m.isBoss)) addDamageReduction(0.2 * talentStarValue("god_slayer"));
    if (hasTalent("merc_fury")) {
      const mercs = state.combat.allies.filter((a) => a.isMerc && a.alive).length;
      addDamageReduction(mercs * 0.05 * talentStarValue("merc_fury"));
    }
  }
  if (options.includeTurnEscalation !== false) extraMultiplier *= battleTurnDamageMultiplier();
  return Math.max(0.1, (1 + damageBonus) / (1 + damageReduction) * extraMultiplier);
}
function trueDamageMultiplier(attacker, target, opts = {}) {
  if (!attacker) return 1;
  const multiplier = damageMultiplier(attacker, target, opts.skillCost || 0, { includeLastStand: false, includeTurnEscalation: false });
  const boundedMultiplier = opts.percentTrueDamage ? Math.min(1.5, multiplier) : multiplier;
  return boundedMultiplier * battleTurnDamageMultiplier();
}
function takeDamage(target, amount, attacker = null, opts = {}) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
  if (!target.alive) return 0;
  const canReflect = !opts.reflectedDamage;
  if (!opts.trueDamage) {
    if (hasBuff(target, "dodge_next")) {
      const dodgeBuff = target.buffs.dodge_next;
      dodgeBuff.stacks = Math.max(0, (dodgeBuff.stacks || 1) - 1);
      if (dodgeBuff.stacks <= 0) delete target.buffs.dodge_next;
      emitCombatFloat(target, "闪避", "dodge");
      combatLog("💨 ".concat(target.name, " 闪避了下一次攻击。"));
      if (hasSkillPassive("assassin_shadow_counter", target)) target.assassinShadowCounterReady = true;
      triggerShadowReturn(target);
      return 0;
    }
    const dodge = dodgeChance(target);
    if (Math.random() < dodge) {
      emitCombatFloat(target, "闪避", "dodge");
      combatLog("💨 ".concat(target.name, " 闪避了攻击。"));
      if (hasSkillPassive("assassin_shadow_counter", target)) target.assassinShadowCounterReady = true;
      triggerShadowReturn(target);
      if (target.side === "ally" && (attacker == null ? void 0 : attacker.alive) && unitHasMech(target, "mx_dodge_counter")) {
        triggerCounterAttack(target, attacker, 0.8 * mechAmp(target), "闪避反击");
      }
      return 0;
    }
  }
  let dmg = amount;
  let shieldAbsorbed = 0;
  if (opts.trueDamage && attacker) {
    dmg = Math.max(1, Math.floor(dmg * trueDamageMultiplier(attacker, target, opts) + 1e-9));
  }
  if (!opts.trueDamage && !opts.ignoreDefense) {
    let def = target.stats.def || 0;
    if (hasBuff(target, "pb_feral_roar_buff")) def *= 1.2;
    const ab = statusEffectApplies(target, "armor_break", { scope: currentActionStatusScope() }) ? target.buffs.armor_break : null;
    if (ab) def *= Math.max(0, 1 - 0.05 * Math.min(ab.stacks || 1, 15));
    def *= 1 - (opts.armorPen || 0);
    dmg = Math.max(1, Math.floor(dmg - def * 0.75));
  }
  if (target.side === "enemy" && (((_a = target.passiveAffixEffects) == null ? void 0 : _a.damageReductionPct) || 0) > 0) {
    dmg = Math.max(1, Math.floor(dmg * (1 - Math.min(0.9, target.passiveAffixEffects.damageReductionPct))));
  }
  if (hasSkillPassive("steel_will", target) && target.hp / target.maxHp < 0.3) {
    dmg = Math.max(1, Math.floor(dmg * 0.85));
  }
  if (!opts.trueDamage && target.isPlayer && opts.crit && hasTalent("lucky_dodge") && Math.random() < talentStarValue("lucky_dodge")) {
    const reduced = Math.min(Math.max(0, dmg - 1), Math.max(0, opts.critExtraDamage || 0));
    if (reduced > 0) {
      dmg -= reduced;
      emitCombatFloat(target, "-".concat(reduced), "shield");
      combatLog("🍀 幸运闪避：".concat(target.name, " 抵消 ").concat(reduced, " 点额外暴击伤害。"));
    }
  }
  if (target.isPlayer && hasTalent("thick_skin")) {
    const threshold = Math.floor(target.maxHp * 0.15);
    if (dmg > threshold) dmg = threshold + Math.floor((dmg - threshold) * (1 - talentStarValue("thick_skin")));
  }
  const hardDamageCap = Number(opts.damageCap);
  if (Number.isFinite(hardDamageCap) && hardDamageCap > 0) {
    dmg = Math.min(dmg, Math.max(1, Math.floor(hardDamageCap)));
  }
  const postCapDamageMultiplier = Number(opts.postCapDamageMultiplier);
  if (Number.isFinite(postCapDamageMultiplier) && postCapDamageMultiplier >= 0) {
    dmg = Math.max(1, Math.floor(dmg * postCapDamageMultiplier));
  }
  const shieldReflectBase = dmg;
  const hadShield = !opts.bypassShield && (target.shield || 0) > 0;
  const damageSkillId = opts.skillId || sourceEffectSkillId(opts.sourceName);
  if (!opts.bypassShield && target.shield > 0) {
    const absorb = Math.min(target.shield, dmg);
    shieldAbsorbed = absorb;
    target.shield -= absorb;
    dmg -= absorb;
    if (absorb > 0) emitCombatFloat(target, "-".concat(absorb), "shield", damageSkillId);
    if (absorb > 0) combatLog("🛡️ ".concat(target.name, " 护盾吸收 ").concat(absorb, "。"));
  }
  if (target.side === "enemy" && hadShield && target.shield <= 0) triggerEnemyPassiveAffixOnShieldBreak(target);
  if (hadShield && target.side === "ally" && target.shield <= 0 && shieldAbsorbed > 0 && (attacker == null ? void 0 : attacker.alive) && attacker.side === "enemy") {
    const player = (_c2 = (_b = state.combat) == null ? void 0 : _b.allies) == null ? void 0 : _c2.find((ally) => ally.isPlayer && ally.alive);
    const key = "".concat(((_d2 = state.combat) == null ? void 0 : _d2.turn) || 0, ":").concat(attacker.unitId || "enemy");
    if (player && hasTalent("thornwood_domain") && !((_e2 = state.combat.thornwoodTriggers) == null ? void 0 : _e2[key])) {
      (_f2 = state.combat).thornwoodTriggers || (_f2.thornwoodTriggers = {});
      state.combat.thornwoodTriggers[key] = true;
      const poison = Math.max(1, Math.floor(attacker.maxHp * talentStarValue("thornwood_domain", null, state.run, "poisonValues")));
      applyDot(player, attacker, "poison", 2, poison);
      combatLog("🌿 荆棘森域：".concat(attacker.name, " 因击破护盾而中毒。"));
    }
    if (target.isCommandPuppet) {
      const owner = (_h = (_g = state.combat) == null ? void 0 : _g.allies) == null ? void 0 : _h.find((ally) => ally.unitId === target.ownerUnitId && ally.alive);
      if ((owner == null ? void 0 : owner.classId) === "clockwork_bastion" && target.clockworkShieldTurn !== ((_i = state.combat) == null ? void 0 : _i.turn)) {
        target.clockworkShieldTurn = (_j = state.combat) == null ? void 0 : _j.turn;
        const shield = grantShield(target, Math.floor(target.maxHp * 0.1), { applyTalent: false });
        combatLog("⚙️ 不落机城：傀儡重新获得 ".concat(shield, " 护盾并反制攻击者。"));
        if (attacker.alive) dealDamage(target, attacker, { coeff: 0.7, statKey: "matk" }, "机城反制", 0);
      }
    }
  }
  if (canReflect && hadShield && target.isPlayer && hasTalent("shield_reflect") && (attacker == null ? void 0 : attacker.alive) && attacker.side === "enemy") {
    takeDamage(attacker, Math.max(1, Math.floor(shieldReflectBase * talentStarValue("shield_reflect"))), target, { trueDamage: true, reflectedDamage: true, sourceName: "荆棘护盾" });
  }
  if (canReflect && hadShield && isTalentOwner(target) && hasTalent("bulwark_rebound") && (attacker == null ? void 0 : attacker.alive) && attacker.side === "enemy" && target.shield <= 0 && shieldAbsorbed > 0 && target.bulwarkReboundTurn !== ((_k = state.combat) == null ? void 0 : _k.turn)) {
    target.bulwarkReboundTurn = (_l = state.combat) == null ? void 0 : _l.turn;
    const rebound = Math.max(1, Math.floor(target.maxHp * talentStarValue("bulwark_rebound")));
    takeDamage(attacker, rebound, target, { trueDamage: true, reflectedDamage: true, sourceName: "壁垒反震" });
    combatLog("🛡️ 壁垒反震：".concat(attacker.name, " 受到 ").concat(rebound, " 真实伤害。"));
  }
  if (canReflect && target.isPlayer && hasTalent("shield_rebuke") && (attacker == null ? void 0 : attacker.alive) && attacker.side === "enemy" && shieldAbsorbed >= target.maxHp * 0.1 && target.shieldRebukeTurn !== state.combat.turn) {
    target.shieldRebukeTurn = state.combat.turn;
    const reflected = Math.max(1, Math.floor(shieldAbsorbed * talentStarValue("shield_rebuke")));
    takeDamage(attacker, reflected, target, { trueDamage: true, reflectedDamage: true, sourceName: "誓盾反击" });
    combatLog("🛡️ 誓盾反击：反射 ".concat(reflected, " 真实伤害。"));
  }
  dmg = tier2BeforeHealthDamage(target, dmg, attacker, opts);
  if (dmg <= 0) return 0;
  const hpBeforeDamage = Math.max(0, Math.floor(target.hp));
  target.hp -= dmg;
  recordQuickBattleDamage(target, attacker, Math.min(hpBeforeDamage, dmg), shieldAbsorbed);
  if (hasSkillPassive("ranger_roaming_instinct", target) && dmg > 0) target.rangerLastHealthDamageTurn = (_m = state.combat) == null ? void 0 : _m.turn;
  emitCombatFloat(target, "-".concat(dmg), opts.crit ? "crit" : "damage", damageSkillId);
  combatLog("".concat(opts.crit ? "💥" : "⚔️", " ").concat(target.name, " 受到 ").concat(dmg, " 伤害").concat(opts.sourceName ? "（".concat(opts.sourceName, "）") : "", "。"));
  if (target.isCommandPuppet && (attacker == null ? void 0 : attacker.side) === "enemy") {
    const owner = (_o = (_n = state.combat) == null ? void 0 : _n.allies) == null ? void 0 : _o.find((ally) => ally.unitId === target.ownerUnitId && ally.alive);
    if (isTalentOwner(owner) && hasTalent("soul_link") && target.soulLinkEnergyTurn !== ((_p = state.combat) == null ? void 0 : _p.turn)) {
      target.soulLinkEnergyTurn = (_q = state.combat) == null ? void 0 : _q.turn;
      const gain = talentStarValue("soul_link", null, state.run, "energyValues");
      const before = owner.energy;
      owner.energy = Math.min(owner.stats.energy, owner.energy + gain);
      combatLog("🧵 魂线共生：".concat(owner.name, " 回复 ").concat(owner.energy - before, " 能量。"));
    }
  }
  if (target.isPlayer && target.hp > 0 && hasTalent("unbroken_line") && !target.unbrokenLineUsed && target.hp / target.maxHp < 0.3) {
    target.unbrokenLineUsed = true;
    const removedDebuffs = Number(!!target.buffs.stun) + Number(!!target.buffs.silence);
    delete target.buffs.stun;
    delete target.buffs.silence;
    if (removedDebuffs > 0) triggerPurificationReversal(target, removedDebuffs);
    const shield = grantShield(target, Math.floor(target.maxHp * talentStarValue("unbroken_line")));
    applyBuff(target, "unbroken_line", 1, 1, target);
    combatLog("🛡️ 不灭战线：解除控制并获得 ".concat(shield, " 护盾。"));
  }
  if (isTalentOwner(target) && target.hp > 0 && hasTalent("emergency_barrier") && !target.emergencyBarrierUsed && target.hp / target.maxHp < 0.35) {
    target.emergencyBarrierUsed = true;
    const shield = grantShield(target, Math.floor(target.maxHp * talentStarValue("emergency_barrier")));
    const removed = dispelDebuffs(target, 1);
    combatLog("🛡️ 应急屏障：".concat(target.name, " 获得 ").concat(shield, " 护盾").concat(removed > 0 ? "并解除一个减益" : "", "。"));
  }
  const covenant = (_r = target.buffs) == null ? void 0 : _r.sacred_covenant;
  if (target.side === "ally" && target.hp > 0 && covenant && !covenant.triggered && target.hp / target.maxHp < 0.3) {
    covenant.triggered = true;
    const shield = grantShield(target, Math.floor(target.maxHp * talentStarValue("sacred_covenant", null, state.run, "shieldValues")));
    combatLog("✦ 圣约庇佑：".concat(target.name, " 获得 ").concat(shield, " 残血护盾。"));
  }
  if (target.side === "enemy") triggerEnemyPassiveAffixOnDamaged(target, attacker, dmg);
  if (target.side === "ally" && unitHasMech(target, "mx_shield_proc") && Math.random() < Math.min(0.6, mechChance(0.2, target))) {
    const shield = Math.max(1, Math.floor((target.stats.def || 1) * 0.75 * mechAmp(target)));
    const gained = grantShield(target, shield);
    combatLog("★ 被动护盾触发，".concat(target.name, " 获得 ").concat(gained, " 护盾。"));
  }
  if (canReflect && target.isPlayer && hasTalent("thorn_minor") && (attacker == null ? void 0 : attacker.alive)) takeDamage(attacker, Math.floor(dmg * talentStarValue("thorn_minor")), target, { trueDamage: true, reflectedDamage: true, sourceName: "荆棘体质" });
  if (canReflect && !opts.trueDamage && hasSkillPassive("thorn_armor", target) && (attacker == null ? void 0 : attacker.alive) && attacker.side === "enemy") {
    takeDamage(attacker, Math.max(1, Math.floor(dmg * 0.08)), target, { trueDamage: true, reflectedDamage: true, sourceName: "荆棘铠甲" });
  }
  if (canReflect && hasBuff(target, "d_thorns_buff") && (attacker == null ? void 0 : attacker.alive)) {
    const enemyThorns = target.side === "enemy";
    const bossThorns = enemyThorns && !!((_s = target.template) == null ? void 0 : _s.isBoss);
    const thornPct = (enemyThorns ? bossThorns ? 0.06 : 0.08 : 0.12) * (unitHasCombatPassive(target, "thornvine_thorns") ? 1.5 : 1) * (target.isPlayer && hasTalent("primal_rage") ? 1.5 : 1) * (hasSkillPassive("druid_thorn_growth", target) ? 1.35 : 1);
    let thornDamage = Math.max(1, Math.floor(dmg * thornPct));
    let thornDamageCap;
    if (enemyThorns) {
      thornDamageCap = Math.max(1, Math.floor((attacker.maxHp || 1) * ENEMY_COUNTER_SINGLE_TARGET_HP_PCT));
      thornDamage = Math.min(thornDamage, thornDamageCap);
    }
    const thornTalentReduction = enemyThorns && isTalentOwner(attacker) && hasTalent("enemy_counter_guard") ? talentStarValue("enemy_counter_guard") : 0;
    takeDamage(attacker, thornDamage, target, {
      trueDamage: true,
      reflectedDamage: true,
      sourceName: "荆棘",
      damageCap: thornDamageCap,
      postCapDamageMultiplier: 1 - thornTalentReduction
    });
  }
  if (target.isPlayer && target.alive && hasTalent("earth_bulwark") && Math.random() < 0.15) {
    const shield = Math.max(1, Math.floor(target.maxHp * 0.05));
    const gained = grantShield(target, shield);
    combatLog("🛡️ 大地壁垒：".concat(target.name, " 获得 ").concat(gained, " 护盾。"));
  }
  if (target.isPlayer && target.alive && (attacker == null ? void 0 : attacker.side) === "enemy" && hasTalent("primal_fortitude")) {
    const gain = talentStarValue("primal_fortitude");
    state.run.hiddenStacks.hp = (state.run.hiddenStacks.hp || 0) + gain;
    target.maxHp += gain;
    target.stats.hp = target.maxHp;
    combatLog("💪 原始坚韧：最大生命永久 +".concat(gain, "。"));
  }
  if (target.isPlayer && target.alive && (attacker == null ? void 0 : attacker.side) === "enemy" && hasTalent("adapt") && attacker.unitId) {
    const cap = talentStarValue("adapt");
    const next = Math.min(cap, (state.combat.adaptStacks[attacker.unitId] || 0) + 1);
    state.combat.adaptStacks[attacker.unitId] = next;
    combatLog("🛡️ 适应力：对 ".concat(attacker.name, " 减伤层数 ").concat(next, "/").concat(cap, "。"));
  }
  if (target.isPlayer && target.hp > 0 && (attacker == null ? void 0 : attacker.alive) && hasTalent("counter_30pct") && Math.random() < talentStarValue("counter_30pct")) {
    triggerCounterAttack(target, attacker, 0.5, "以牙还牙");
  }
  if (target.side === "ally" && target.hp > 0 && (attacker == null ? void 0 : attacker.alive) && hasBuff(target, "counter_stance")) {
    const berserkerSet = unitHasCombatPassive(target, "counter_lifesteal");
    triggerCounterAttack(target, attacker, 0.8, "反击姿态", berserkerSet ? 0.1 : 0);
    if (berserkerSet && target.alive && attacker.alive) triggerCounterAttack(target, attacker, 0.4, "狂战士套装追击", 0.1);
    const stance = target.buffs.counter_stance;
    if (stance) {
      stance.stacks = (stance.stacks || 1) - 1;
      if (stance.stacks <= 0) delete target.buffs.counter_stance;
    }
  }
  if (target.hp <= 0) {
    handleFatalDamage(target);
    if (!target.alive && target.side === "ally" && target.isPlayer && state.combat) {
      state.combat.lastPlayerFatalHit = {
        unitId: target.unitId,
        targetName: target.name,
        attackerName: (attacker == null ? void 0 : attacker.name) || "未知来源",
        sourceName: opts.sourceName || "",
        damage: Math.max(1, Math.floor(dmg)),
        hpBefore: hpBeforeDamage,
        shieldAbsorbed: Math.max(0, Math.floor(shieldAbsorbed))
      };
    }
  }
  tier2CheckDoomAwakening(target);
  return dmg;
}
function triggerEnemyCounterAttack(defender, attacker, ratio, sourceName) {
  var _a;
  if (!(defender == null ? void 0 : defender.alive) || !(attacker == null ? void 0 : attacker.alive)) return 0;
  const actionSerial = ((_a = state.combat) == null ? void 0 : _a.actionSerial) || 0;
  if (attacker.enemyCounterDamageActionSerial !== actionSerial) {
    attacker.enemyCounterDamageActionSerial = actionSerial;
    attacker.enemyCounterDamageThisAction = 0;
  }
  const actionCap = Math.max(1, Math.floor((attacker.maxHp || 1) * ENEMY_COUNTER_ACTION_TARGET_HP_PCT));
  const remaining = Math.max(0, actionCap - (attacker.enemyCounterDamageThisAction || 0));
  if (remaining <= 0) return 0;
  const talentReduction = isTalentOwner(attacker) && hasTalent("enemy_counter_guard") ? talentStarValue("enemy_counter_guard") : 0;
  const dealt = triggerCounterAttack(defender, attacker, ratio, sourceName, 0, {
    maxTargetHpPct: ENEMY_COUNTER_SINGLE_TARGET_HP_PCT,
    maxDamage: remaining,
    postCapDamageMultiplier: 1 - talentReduction
  });
  attacker.enemyCounterDamageThisAction += dealt;
  return dealt;
}
function triggerCounterAttack(defender, attacker, ratio, sourceName, lifestealPct = 0, options = {}) {
  var _a;
  if (!(defender == null ? void 0 : defender.alive) || !(attacker == null ? void 0 : attacker.alive)) return 0;
  let dmg = Math.max(1, Math.floor((((_a = defender.stats) == null ? void 0 : _a.atk) || 1) * ratio));
  let hardDamageCap = Number.POSITIVE_INFINITY;
  const maxTargetHpPct = Number(options.maxTargetHpPct);
  if (Number.isFinite(maxTargetHpPct) && maxTargetHpPct > 0) {
    hardDamageCap = Math.min(hardDamageCap, Math.max(1, Math.floor((attacker.maxHp || 1) * maxTargetHpPct)));
  }
  const maxDamage = Number(options.maxDamage);
  if (Number.isFinite(maxDamage) && maxDamage > 0) {
    hardDamageCap = Math.min(hardDamageCap, Math.max(1, Math.floor(maxDamage)));
  }
  if (Number.isFinite(hardDamageCap)) dmg = Math.min(dmg, hardDamageCap);
  combatLog("⚔️ ".concat(sourceName, "：").concat(defender.name, " 反击 ").concat(attacker.name, "。"));
  const dealt = takeDamage(attacker, dmg, defender, {
    trueDamage: true,
    sourceName,
    skillId: sourceEffectSkillId(sourceName),
    damageCap: Number.isFinite(hardDamageCap) ? hardDamageCap : void 0,
    postCapDamageMultiplier: options.postCapDamageMultiplier
  });
  if (lifestealPct > 0 && dealt > 0 && defender.alive) {
    healRaw(defender, Math.max(1, Math.floor(dealt * lifestealPct)));
  }
  return dealt;
}
function triggerShadowReturn(unit) {
  var _a, _b;
  if (!(unit == null ? void 0 : unit.isPlayer) || !hasTalent("shadow_return")) return false;
  if (unit.shadowReturnTurn === ((_a = state.combat) == null ? void 0 : _a.turn)) return false;
  unit.shadowReturnTurn = (_b = state.combat) == null ? void 0 : _b.turn;
  unit.shadowReturnReady = true;
  const gain = talentStarValue("shadow_return", null, state.run, "energyValues");
  const beforeEnergy = unit.energy;
  unit.energy = Math.min(unit.stats.energy, unit.energy + gain);
  combatLog("🌑 影返：下次攻击暴击提升，恢复 ".concat(unit.energy - beforeEnergy, " 能量。"));
  return true;
}
function dodgeChance(unit) {
  let chance = 0;
  if (hasBuff(unit, "evasion")) chance += 0.25;
  if (hasBuff(unit, "sb_stealth")) chance += 0.5;
  if (hasBuff(unit, "ns_night_veil_buff")) chance += 0.2;
  if (hasTalent("dodge_master") && unit.isPlayer) chance += talentStarValue("dodge_master");
  if (hasTalent("gale_breath") && unit.isPlayer) chance += 0.1 * talentPassiveMultiplier("gale_breath");
  return clamp(chance, 0, 0.75);
}
function handleFatalDamage(unit) {
  var _a, _b;
  if (unit.isCommandPuppet) {
    const owner = (_b = (_a = state.combat) == null ? void 0 : _a.allies) == null ? void 0 : _b.find((ally) => ally.unitId === unit.ownerUnitId);
    if (isTalentOwner(owner) && hasTalent("immortal_core") && !unit.immortalCoreUsed) {
      unit.immortalCoreUsed = true;
      unit.alive = true;
      unit.hp = Math.max(1, Math.floor(unit.maxHp * talentStarValue("immortal_core")));
      const shield = grantShield(unit, Math.floor(unit.maxHp * talentStarValue("immortal_core", null, state.run, "shieldValues")), { applyTalent: false });
      combatLog("⚙️ 不灭机心：傀儡自动重构至 ".concat(unit.hp, " 生命并获得 ").concat(shield, " 护盾。"));
      return;
    }
    unit.hp = 0;
    unit.alive = false;
    emitCombatFloat(unit, "损毁", "down");
    combatLog("💥 ".concat(unit.name, " 损毁了。"));
    return;
  }
  if (tier2TryPreventDeath(unit)) return;
  if (unit.side === "enemy" && tryEnemyPassiveAffixPreventDeath(unit)) return;
  if (unit.side === "ally" && unit.isPlayer) {
    if (hasSkillPassive("death_grip", unit) && !unit.deathGripUsed) {
      unit.deathGripUsed = true;
      unit.hp = 1;
      unit.alive = true;
      const shield = grantShield(unit, Math.floor(unit.maxHp * 0.2));
      combatLog("💀 孤注一掷：".concat(unit.name, " 保留1生命并获得").concat(shield, "护盾。"));
      return;
    }
    if (hasTalent("phoenix") && !state.run.phoenixUsed) {
      state.run.phoenixUsed = true;
      unit.hp = Math.floor(unit.maxHp * talentStarValue("phoenix"));
      combatLog("🔥 ".concat(unit.name, " 浴火重生。"));
      return;
    }
    if (unit.isPlayer && hasTalent("undying") && !unit.undyingUsed) {
      unit.undyingUsed = true;
      unit.hp = Math.floor(unit.maxHp * talentStarValue("undying"));
      applyBuff(unit, "strengthen", 3);
      combatLog("🛡️ ".concat(unit.name, " 永不倒下。"));
      return;
    }
  }
  if (unit.side === "ally" && unit.isMerc && hasTalent("merc_last_breath") && !unit.lastBreathUsed) {
    unit.lastBreathUsed = true;
    unit.lastBreathTurns = 1;
    unit.hp = 1;
    unit.alive = true;
    const bonus = talentStarValue("merc_last_breath");
    unit.stats.atk = Math.floor((unit.stats.atk || 1) * (1 + bonus));
    unit.stats.matk = Math.floor((unit.stats.matk || 0) * (1 + bonus));
    combatLog("💀🔥 战友之魂：".concat(unit.name, " 回光返照，攻击提升。"));
    return;
  }
  unit.hp = 0;
  unit.alive = false;
  if (isPuppeteerUnit(unit)) {
    const puppet = commandPuppetFor(unit, true);
    if (puppet == null ? void 0 : puppet.alive) {
      puppet.hp = 0;
      puppet.alive = false;
      emitCombatFloat(puppet, "失控", "down");
      combatLog("💥 ".concat(unit.name, " 倒下，").concat(puppet.name, " 同步停机。"));
    }
  }
  if (unit.side === "enemy") {
    tier2OnEnemyDefeated(unit);
    triggerEnemyPassiveAffixOnAllyDefeated(unit);
  }
  emitCombatFloat(unit, "倒下", "down");
  combatLog("☠️ ".concat(unit.name, " 倒下了。"));
}
function healUnit(caster, target, effect) {
  const stat = effect.useMaxHp || effect.statKey === "hp" ? target.maxHp : caster.stats[effect.statKey || "matk"] || caster.stats.matk || caster.stats.atk;
  let amount = Math.floor(stat * (effect.coeff || 1));
  if (unitHasCombatPassive(caster, "heal_crit_boost") && Math.random() < 0.25) {
    amount = Math.floor(amount * 1.5);
    combatLog("✨ 黎明套装：治疗暴击。");
  }
  if (caster.isPlayer && hasTalent("divine_grace")) amount = Math.floor(amount * 1.2);
  if (hasSkillPassive("priest_mercy", caster)) amount = Math.floor(amount * 1.1);
  if (caster.isPlayer && target.side === "ally" && hasTalent("divine_accumulation")) amount += state.run.divineAccumulationStacks || 0;
  if (hasBuff(target, "versatile")) amount = Math.floor(amount * 1.08);
  const healResult = healRaw(target, amount, { returnResult: true, selfHeal: caster === target });
  const { real, overflow } = healResult;
  if (caster.isPlayer && target.side === "ally" && hasTalent("divine_accumulation") && real > 0) {
    const gain = talentStarValue("divine_accumulation");
    state.run.divineAccumulationStacks = (state.run.divineAccumulationStacks || 0) + gain;
    combatLog("✨ 神恩积蓄：治疗量永久 +".concat(gain, "（累计 +").concat(state.run.divineAccumulationStacks, "）。"));
  }
  if (caster.isPlayer && hasTalent("holy_shield") && overflow > 0) {
    const shield = Math.floor(overflow * 0.4);
    if (shield > 0) {
      const gained = grantShield(target, shield);
      combatLog("🛡️ 圣盾：溢出治疗转化 ".concat(gained, " 护盾。"));
    }
  }
  if (caster.isPlayer && hasTalent("holy_echo")) {
    for (const e of state.combat.enemies.filter((x) => x.alive)) takeDamage(e, Math.floor(healResult.amount * talentStarValue("holy_echo")), caster, { trueDamage: true, sourceName: "神迹回响" });
  }
  return healResult;
}
function shieldEffectAmount(target, amount, applyTalent = true) {
  let result = Math.max(0, Math.floor(amount || 0));
  if (applyTalent && unitHasCombatPassive(target, "shield_expert")) {
    result = Math.floor(result * (1 + talentStarValue("shield_expert")));
  }
  return result;
}
function grantShield(target, amount, options = {}) {
  if (!target || amount <= 0) return 0;
  const scaled = shieldEffectAmount(target, amount, options.applyTalent !== false);
  const maxTotal = Number.isFinite(options.maxTotal) ? Math.max(0, Math.floor(options.maxTotal)) : Infinity;
  const gain = Math.max(0, Math.min(scaled, maxTotal - (target.shield || 0)));
  if (gain <= 0) return 0;
  target.shield = (target.shield || 0) + gain;
  recordQuickBattleShieldGain(target, gain);
  if (options.emit !== false) emitCombatFloat(target, "+".concat(gain), "shield");
  return gain;
}
function healRaw(target, amount, options = {}) {
  var _a, _b;
  const emptyResult = { real: 0, overflow: 0, amount: 0 };
  if (!target.alive || amount <= 0) return options.returnResult ? emptyResult : 0;
  if (target.side === "ally" && hasBuff(target, "sacred_covenant")) {
    amount = Math.floor(amount * (1 + talentStarValue("sacred_covenant", null, state.run, "healValues")));
  }
  if (target.isPlayer && hasTalent("crisis") && target.hp / target.maxHp < 0.35) {
    amount = Math.floor(amount * (1 + talentStarValue("crisis")));
  }
  if (target.isPlayer && hasTalent("heal_boost")) {
    amount = Math.floor(amount * (1 + talentStarValue("heal_boost")));
  }
  if (isTalentOwner(target) && hasTalent("desperate_edge") && target.hp / target.maxHp < 0.4) {
    amount = Math.floor(amount * (1 + talentStarValue("desperate_edge", null, state.run, "healValues")));
  }
  if (target.side === "ally") {
    const healingPenalty = clamp(climbEffects(state.run).allyHealingPenaltyPct || 0, 0, 0.95);
    if (healingPenalty > 0) amount = Math.max(1, Math.floor(amount * (1 - healingPenalty)));
  }
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const real = target.hp - before;
  recordQuickBattleHealing(target, real, amount - real);
  if (real > 0) emitCombatFloat(target, "+".concat(real), "heal");
  if (real > 0) combatLog("💚 ".concat(target.name, " 回复 ").concat(real, " 生命。"));
  const overflow = amount - real;
  if (real > 0 && options.selfHeal && target.isPlayer) {
    if (hasTalent("blood_pool_recovery") && real >= target.maxHp * 0.08 && target.bloodPoolRecoveryTurn !== ((_a = state.combat) == null ? void 0 : _a.turn)) {
      target.bloodPoolRecoveryTurn = (_b = state.combat) == null ? void 0 : _b.turn;
      const shield = grantShield(target, Math.floor(target.maxHp * talentStarValue("blood_pool_recovery")));
      combatLog("🩸 血池反哺：".concat(target.name, " 获得 ").concat(shield, " 护盾。"));
    }
    if (hasTalent("crimson_hunt") && !target.crimsonHuntReady && (target.crimsonHuntTriggers || 0) < 2) {
      target.crimsonHuntProgress = (target.crimsonHuntProgress || 0) + real;
      const threshold = target.maxHp * talentStarValue("crimson_hunt");
      if (target.crimsonHuntProgress >= threshold) {
        target.crimsonHuntProgress = 0;
        target.crimsonHuntTriggers = (target.crimsonHuntTriggers || 0) + 1;
        target.crimsonHuntReady = true;
        const gain = talentStarValue("crimson_hunt", null, state.run, "energyValues");
        const beforeEnergy = target.energy;
        target.energy = Math.min(target.stats.energy, target.energy + gain);
        combatLog("🩸 猩红狩猎：下次攻击强化，恢复 ".concat(target.energy - beforeEnergy, " 能量。"));
      }
    }
  }
  if (real > 0 && target.isPlayer && target.side === "ally" && hasTalent("primal_fortitude")) {
    const gain = talentStarValue("primal_fortitude");
    state.run.hiddenStacks.hp = (state.run.hiddenStacks.hp || 0) + gain;
    target.maxHp += gain;
    target.hp += gain;
    target.stats.hp = target.maxHp;
    combatLog("💪 原始坚韧：受疗后最大生命永久 +".concat(gain, "。"));
  }
  if (overflow > 0 && options.overflowToShield) {
    grantShield(target, overflow);
  } else if (overflow > 0 && target.isPlayer && hasTalent("blood_lord")) {
    const cap = Math.floor(target.maxHp * 0.5 * talentStarValue("blood_lord"));
    grantShield(target, overflow, { maxTotal: cap });
  }
  const result = { real, overflow, amount };
  return options.returnResult ? result : real;
}
function shieldUnit(caster, target, effect, skill = null) {
  const statKey = effect.statKey || "matk";
  const stat = statKey === "maxHp" ? target.maxHp : caster.stats[statKey] || caster.stats.def || 1;
  let amount = Math.floor(stat * (effect.coeff || 1));
  if ((skill == null ? void 0 : skill.id) === "m_shield" && unitHasCombatPassive(caster, "mana_shield_boost")) amount = Math.floor(amount * 1.5);
  if ((skill == null ? void 0 : skill.id) === "m_shield" && hasSkillPassive("mage_mana_barrier", caster)) amount = Math.floor(amount * 1.25);
  if (hasSkillPassive("priest_prayer_afterglow", caster)) amount = Math.floor(amount * 1.2);
  const shield = grantShield(target, Math.max(1, amount));
  combatLog("🛡️ ".concat(target.name, " 获得 ").concat(shield, " 护盾。"));
}
function isDebuffId(buffId) {
  return ["stun", "armor_break", "hunted", "ranger_mark", "poison", "burn", "weaken", "silence"].includes(buffId);
}
function isControlDebuffId(buffId) {
  return ["stun", "silence"].includes(buffId);
}
function enemyHardControlResistChance(target, buffId) {
  var _a, _b;
  if ((target == null ? void 0 : target.side) !== "enemy" || !isControlDebuffId(buffId)) return 0;
  if ((_a = target.template) == null ? void 0 : _a.isBoss) return 0.5;
  if ((_b = target.template) == null ? void 0 : _b.isElite) return 0.25;
  return 0;
}
function enemyCombatRuleHint(enemies = []) {
  var _a;
  const hints = [];
  const floorBonus = enemyFloorDamageBonus();
  if (floorBonus > 0) hints.push("第".concat(Math.max(1, Math.floor(((_a = state.run) == null ? void 0 : _a.floor) || 1)), "层敌军增伤、减伤+").concat(Math.round(floorBonus * 100), "%"));
  if (enemies.some((enemy) => {
    var _a2;
    return (_a2 = enemy == null ? void 0 : enemy.template) == null ? void 0 : _a2.isBoss;
  })) {
    hints.push("Boss 获得50%韧性，百分比伤害 -50%。");
  } else if (enemies.some((enemy) => {
    var _a2;
    return (_a2 = enemy == null ? void 0 : enemy.template) == null ? void 0 : _a2.isElite;
  })) {
    hints.push("精英获得25%韧性，百分比伤害 -25%。");
  }
  return hints.join(" ");
}
function enemyPercentTrueDamageMultiplier(target) {
  var _a, _b;
  if ((target == null ? void 0 : target.side) !== "enemy") return 1;
  if ((_a = target.template) == null ? void 0 : _a.isBoss) return 0.5;
  if ((_b = target.template) == null ? void 0 : _b.isElite) return 0.75;
  return 1;
}
function dealPercentTrueDamage(target, amount, attacker = null, opts = {}) {
  const raw = Math.max(1, Math.floor(Number(amount) || 0));
  const multiplier = enemyPercentTrueDamageMultiplier(target);
  const adjusted = Math.max(1, Math.floor(raw * multiplier));
  if (multiplier < 1) {
    combatLog("🛡️ ".concat(target.name, " 的百分比真伤减免生效：").concat(raw, " → ").concat(adjusted, "。"));
  }
  return takeDamage(target, adjusted, attacker, { ...opts, trueDamage: true, percentTrueDamage: true });
}
function statusResistChanceFromValue(value) {
  const res = Math.max(0, Number(value) || 0);
  return res / (100 + res);
}
function statusResistChance(unit) {
  var _a;
  return statusResistChanceFromValue((_a = unit == null ? void 0 : unit.stats) == null ? void 0 : _a.statusRes);
}
function statusResistText(value) {
  return "".concat(Math.round(statusResistChanceFromValue(value) * 100), "%");
}
function currentActionStatusScope() {
  var _a;
  const c = state.combat;
  return "action:".concat((c == null ? void 0 : c.turn) || 0, ":").concat((_a = c == null ? void 0 : c.currentIdx) != null ? _a : 0);
}
function statusEffectApplies(unit, buffId, options = {}) {
  if (!hasBuff(unit, buffId)) return false;
  if (!isDebuffId(buffId)) return true;
  const scope = options.scope || currentActionStatusScope();
  const key = "".concat(scope, ":").concat(buffId);
  unit._statusEffectCache || (unit._statusEffectCache = {});
  if (Object.prototype.hasOwnProperty.call(unit._statusEffectCache, key)) return unit._statusEffectCache[key];
  if (isControlDebuffId(buffId) && hasBuff(unit, "cc_immune")) {
    emitCombatFloat(unit, "免疫", "dodge");
    combatLog("🛡️ ".concat(unit.name, " 免疫了 ").concat(buffName(buffId), "。"));
    unit._statusEffectCache[key] = false;
    return false;
  }
  const hardControlResist = enemyHardControlResistChance(unit, buffId);
  if (hardControlResist > 0 && Math.random() < hardControlResist) {
    emitCombatFloat(unit, "韧性", "dodge");
    combatLog("🛡️ ".concat(unit.name, " 本回合凭借").concat(Math.round(hardControlResist * 100), "%韧性抵抗了 ").concat(buffName(buffId), "。"));
    unit._statusEffectCache[key] = false;
    return false;
  }
  const chance = statusResistChance(unit);
  if (chance > 0 && Math.random() < chance) {
    emitCombatFloat(unit, "抵抗", "dodge");
    combatLog("🧿 ".concat(unit.name, " 抵抗了 ").concat(buffName(buffId), "，本次未受影响。"));
    unit._statusEffectCache[key] = false;
    return false;
  }
  unit._statusEffectCache[key] = true;
  return true;
}
function shouldBlockDebuffApplication(target, buffId) {
  if (!target || !isControlDebuffId(buffId) || !hasBuff(target, "cc_immune")) return false;
  emitCombatFloat(target, "免疫", "dodge");
  combatLog("🛡️ ".concat(target.name, " 免疫了 ").concat(buffName(buffId), "。"));
  return true;
}
function clearStatusEffectCache(unit) {
  if (unit) unit._statusEffectCache = {};
}
function clearCombatStatusEffectCaches() {
  const c = state.combat;
  if (!c) return;
  for (const unit of [...c.allies || [], ...c.enemies || []]) clearStatusEffectCache(unit);
}
function statusResolutionHint() {
  return "结算负面效果时有概率本次无效";
}
function statusResolutionFormulaText() {
  return "概率=抗性/(100+抗性)";
}
function statusResolutionDesc() {
  return "".concat(statusResolutionHint(), "，").concat(statusResolutionFormulaText());
}
function isNonStackingBuff(buffId) {
  return buffId === "hunted" || buffId === "ranger_mark";
}
function applyBuff(target, buffId, turns = 1, stacks = 1, source = null) {
  var _a, _b, _c2, _d2, _e2, _f2;
  if (!target.alive && !["poison", "burn"].includes(buffId)) return false;
  const debuff = isDebuffId(buffId);
  if (debuff && shouldBlockDebuffApplication(target, buffId)) return false;
  let switchedForm = "";
  let switchedWithinWindow = false;
  if (turns != null && ["d_bear_form", "d_hawk_form"].includes(buffId) && hasSkillPassive("druid_form_mastery", source)) turns += 1;
  if (turns != null && !debuff && target.side === "ally" && hasSkillPassive("priest_blessing_extension", source)) turns += 1;
  if (["d_bear_form", "d_hawk_form"].includes(buffId)) {
    const otherForms = ["d_bear_form", "d_hawk_form"].filter((id) => id !== buffId);
    for (const formId of otherForms) {
      if (!target.buffs[formId]) continue;
      switchedForm || (switchedForm = formId);
      if (unitHasCombatPassive(source, "wildgrowth_extend")) {
        combatLog("🌿 野性套装：".concat(buffName(formId), "保留，多形态共存。"));
      } else {
        delete target.buffs[formId];
        combatLog("🔄 ".concat(target.name, " 解除").concat(buffName(formId), "，切换形态。"));
      }
    }
  }
  if ((buffId === "haste" || buffId === "versatile") && unitHasCombatPassive(source, "bless_extend")) turns += 1;
  const existing = target.buffs[buffId];
  if (existing) {
    existing.turns = turns == null || existing.turns == null ? null : Math.max(existing.turns || 0, turns);
    existing.stacks = isNonStackingBuff(buffId) ? 1 : (existing.stacks || 1) + stacks;
    if (buffId === "armor_break") existing.stacks = Math.min(existing.stacks, 15);
    existing.appliedActionSerial = (_b = (_a = state.combat) == null ? void 0 : _a.actionSerial) != null ? _b : null;
  } else {
    target.buffs[buffId] = {
      id: buffId,
      turns,
      stacks: isNonStackingBuff(buffId) ? 1 : buffId === "armor_break" ? Math.min(stacks, 15) : stacks,
      appliedActionSerial: (_d2 = (_c2 = state.combat) == null ? void 0 : _c2.actionSerial) != null ? _d2 : null
    };
  }
  if (["d_bear_form", "d_hawk_form"].includes(buffId)) {
    const combatTurn = (_f2 = (_e2 = state.combat) == null ? void 0 : _e2.turn) != null ? _f2 : 0;
    switchedWithinWindow = !!switchedForm && (target.dualShiftLastTurn == null || combatTurn - target.dualShiftLastTurn <= 3);
    if (target.isPlayer && hasTalent("dual_shift") && switchedWithinWindow && (target.dualShiftLastProcTurn == null || combatTurn - target.dualShiftLastProcTurn >= 4)) {
      target.dualShiftLastProcTurn = combatTurn;
      if (buffId === "d_hawk_form") {
        applyBuff(target, "dual_shift_guard", 1, 1, target);
        combatLog("🌿 双相更替：熊转猛禽，获得短暂减伤。 ");
      } else {
        applyBuff(target, "dual_shift_strike", 2, 1, target);
        combatLog("🌿 双相更替：猛禽转熊，下一次攻击获得强化。 ");
      }
    }
    target.dualShiftLastTurn = combatTurn;
  }
  if (debuff) {
    combatLog("📌 ".concat(target.name, " 获得 ").concat(buffName(buffId), "。"));
  }
  return true;
}
function applyDot(attacker, target, buffId, turns, power, stacks = 1, sourceInfo = null) {
  if (!applyBuff(target, buffId, turns, stacks, attacker)) return false;
  if (!target.buffs[buffId]) return false;
  target.buffs[buffId].power = Math.max(target.buffs[buffId].power || 0, power);
  const sourceSide = (attacker == null ? void 0 : attacker.side) || (sourceInfo == null ? void 0 : sourceInfo.sourceSide) || "";
  const sourceUnitId = (attacker == null ? void 0 : attacker.unitId) || (sourceInfo == null ? void 0 : sourceInfo.sourceUnitId) || "";
  if (sourceSide) target.buffs[buffId].sourceSide = sourceSide;
  if (sourceUnitId) target.buffs[buffId].sourceUnitId = sourceUnitId;
  return true;
}
function buffName(id) {
  const map = {
    burn: "灼烧",
    poison: "中毒",
    stun: "眩晕",
    silence: "沉默",
    armor_break: "破甲",
    hunted: "被猎杀",
    ranger_mark: "猎杀标记",
    weaken: "虚弱",
    strengthen: "强化",
    fortify: "坚韧",
    evasion: "闪避",
    dodge_next: "必定闪避",
    regen: "再生",
    haste: "激励",
    counter_stance: "反击姿态",
    taunt: "嘲讽",
    d_thorns_buff: "荆棘",
    d_bear_form: "熊形态",
    d_hawk_form: "猛禽",
    triad_resonance: "三相共鸣",
    sacred_covenant: "圣约庇佑",
    unbroken_line: "不灭战线",
    afterglow_pursuit: "余韵追击",
    steady_line: "稳固阵线",
    purification_reversal: "净化反转",
    dual_shift_guard: "双相守势",
    dual_shift_strike: "双相攻势",
    elemental_resonance: "元素共鸣",
    bk_frenzy_buff: "狂暴",
    sb_stealth: "潜行",
    sharpshooter_aim: "稳固瞄准",
    wind_volley: "乘风连射",
    ch_rewind_buff: "时光回溯",
    ns_night_veil_buff: "暗夜帷幕",
    pb_feral_roar_buff: "野兽咆哮",
    pb_roar_party_buff: "战吼鼓舞",
    cc_immune: "免控",
    tenacity: "坚韧",
    puppet_link: "魂线转移"
  };
  return map[id] || id;
}
function triggerPurificationReversal(target, removedCount = 1) {
  var _a, _b;
  if (!isTalentOwner(target) || !hasTalent("purification_reversal") || removedCount <= 0) return 0;
  const healed = healRaw(target, Math.floor(target.maxHp * talentStarValue("purification_reversal", null, state.run, "healValues") * removedCount));
  const currentStacks = ((_b = (_a = target.buffs) == null ? void 0 : _a.purification_reversal) == null ? void 0 : _b.stacks) || 0;
  const addedStacks = Math.max(0, Math.min(3, currentStacks + removedCount) - currentStacks);
  if (addedStacks > 0) applyBuff(target, "purification_reversal", null, addedStacks, target);
  combatLog("✨ 净化反转：".concat(target.name, " 回复 ").concat(healed, " 生命，下一次伤害强化").concat(addedStacks > 0 ? "（".concat(currentStacks + addedStacks, "/3层）") : "", "。"));
  return healed;
}
function dispelDebuffs(target, count, source = null) {
  const debuffs = ["burn", "poison", "stun", "silence", "armor_break", "hunted", "ranger_mark", "weaken"];
  let removed = 0;
  for (const id of debuffs) {
    if (target.buffs[id]) {
      delete target.buffs[id];
      removed += 1;
      if (removed >= count) break;
    }
  }
  combatLog("✨ ".concat(target.name, " 净化了 ").concat(removed, " 个减益。"));
  if (removed > 0) triggerPurificationReversal(target, removed);
  if (removed > 0 && hasSkillPassive("priest_purifying_grace", source)) {
    healRaw(target, Math.floor(target.maxHp * 0.08));
  }
  return removed;
}
function resetLongestCooldown(unit) {
  var _a;
  if (!(unit == null ? void 0 : unit.cooldowns)) return;
  let bestId = "";
  let bestCd = 0;
  for (const [id, cd] of Object.entries(unit.cooldowns)) {
    if (cd > bestCd) {
      bestId = id;
      bestCd = cd;
    }
  }
  if (!bestId) return;
  unit.cooldowns[bestId] = 0;
  const skillName = ((_a = classSkillsFor(unit).find((skill) => skill.id === bestId)) == null ? void 0 : _a.name) || bestId;
  combatLog("⏪ 时光回溯：".concat(skillName, " 冷却重置。"));
}
function reduceLongestNonUltimateCooldown(unit) {
  var _a;
  if (!(unit == null ? void 0 : unit.cooldowns)) return false;
  const allSkills = allClassSkills(unit.classId);
  const ultIds = new Set(allSkills.filter((skill) => skill.isUlt).map((skill) => skill.id));
  let bestId = "";
  let bestCooldown = 0;
  for (const [id, cooldown] of Object.entries(unit.cooldowns)) {
    if (ultIds.has(id) || cooldown <= bestCooldown) continue;
    bestId = id;
    bestCooldown = cooldown;
  }
  if (!bestId) return false;
  unit.cooldowns[bestId] = Math.max(0, bestCooldown - 1);
  const skillName = ((_a = allSkills.find((skill) => skill.id === bestId)) == null ? void 0 : _a.name) || bestId;
  combatLog("🗡️ 命门洞察：".concat(skillName, " 冷却 -1。"));
  return true;
}
function firstAliveEnemyIdx() {
  var _a;
  const enemies = ((_a = state.combat) == null ? void 0 : _a.enemies) || [];
  const idx = enemies.findIndex((enemy) => enemy.alive);
  return idx >= 0 ? idx : 0;
}
function lowestHpAlly() {
  return state.combat.allies.filter((a) => a.alive && !a.isCommandPuppet).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}
function pickAllyTarget() {
  const idx = pickTargetIdxByAggro(state.combat.allies);
  return state.combat.allies[idx] || state.combat.allies.find((a) => a.alive) || null;
}
function onUnitKilled(attacker, target, dealt, overflowDamage = 0) {
  var _a, _b;
  if (!attacker) return;
  if (attacker.side === "enemy") {
    const affixState = enemyPassiveAffixState(attacker);
    const bloodthirst = enemyPassiveAffixByMechanic(attacker, "kill_frenzy");
    if (bloodthirst) {
      const healed = healRaw(attacker, Math.max(1, Math.floor(attacker.maxHp * (bloodthirst.healPct || 0))), { selfHeal: true });
      applyBuff(attacker, "strengthen", 2);
      logEnemyPassiveAffix(attacker, bloodthirst, "击败 ".concat(target.name, "，回复 ").concat(healed, " 生命并获得强化。"));
    }
    const destroyer = enemyPassiveAffixByMechanic(attacker, "execute_and_chain");
    if (destroyer && !affixState.destroyerChainUsed) {
      affixState.destroyerChainUsed = true;
      queueEnemyExtraAction(attacker, destroyer, "击败 ".concat(target.name, " 后追加一次行动。"));
    }
    return;
  }
  attacker = combatCreditUnit(attacker) || attacker;
  if (attacker.side !== "ally") return;
  const galeContext = attacker._talentSkillContext;
  if (attacker.isPlayer && hasTalent("gale_arrow") && ((galeContext == null ? void 0 : galeContext.isBasicAttack) || (galeContext == null ? void 0 : galeContext.isSingleTarget)) && state.combat.galeArrowTurn !== state.combat.turn) {
    state.combat.galeArrowTurn = state.combat.turn;
    const nextTarget = state.combat.enemies.filter((enemy) => enemy.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (nextTarget) {
      combatLog("🏹 风行连矢：追射 ".concat(nextTarget.name, "。"));
      dealDamage(attacker, nextTarget, { coeff: talentStarValue("gale_arrow"), statKey: "atk" }, "风行连矢", 0);
    }
  }
  if (hasTalent("soul_harvest") && attacker.isPlayer) {
    const baseGain = ((_a = target.template) == null ? void 0 : _a.isBoss) ? 3 : ((_b = target.template) == null ? void 0 : _b.isElite) ? 2 : 1;
    const { multiplier } = hiddenTalentStarValues("soul_harvest");
    const gain = baseGain * multiplier;
    state.run.hiddenStacks.atk = (state.run.hiddenStacks.atk || 0) + gain;
    attacker.stats.atk += gain;
    combatLog("👻 灵魂收割：攻击永久 +".concat(gain, "。"));
  }
  if (attacker.isPlayer && (hasTalent("bloodthirst") || hasTalent("blood_dominion") || hasTalent("primal_rage"))) {
    const healPct = hasTalent("bloodthirst") ? talentStarValue("bloodthirst") : 0.15;
    healRaw(attacker, Math.floor(attacker.maxHp * healPct), { selfHeal: true });
  }
  if (attacker.isPlayer && hasTalent("temporal_distortion")) {
    for (const ally of state.combat.allies.filter((unit) => unit.alive)) {
      for (const id of Object.keys(ally.cooldowns || {})) ally.cooldowns[id] = Math.max(0, ally.cooldowns[id] - 1);
    }
    combatLog("⏳ 时间扭曲：全队技能冷却 -1。");
  }
  if (attacker.isPlayer && hasTalent("energy_drain")) attacker.energy = Math.min(attacker.stats.energy, attacker.energy + talentStarValue("energy_drain"));
  if (attacker.isPlayer && hasTalent("chain_kill")) {
    const bonus = talentStarValue("chain_kill");
    const energy = Math.round(bonus * 100);
    attacker.energy = Math.min(attacker.stats.energy, attacker.energy + energy);
    state.combat.chainKillBonus = true;
    combatLog("⚡ 连斩：恢复".concat(energy, "能量，下次伤害 +").concat(Number((bonus * 100).toFixed(2)), "%。"));
  }
  if (attacker.isPlayer && hasTalent("phantom_chain")) {
    const idx = state.combat.allies.indexOf(attacker);
    if (idx >= 0) {
      state.combat.order.splice(state.combat.currentIdx, 0, { side: "ally", idx });
      combatLog("👻 幻影连斩：击杀后获得额外行动。");
    }
  }
  if (unitHasMech(attacker, "mx_energy_on_kill")) {
    const gain = Math.floor(15 * mechAmp(attacker));
    attacker.energy = Math.min(attacker.stats.energy, attacker.energy + gain);
    combatLog("⚡ 击杀回能：".concat(attacker.name, " 恢复 ").concat(gain, " 能量。"));
  }
  if (attacker.isPlayer && hasTalent("overkill") && overflowDamage > 0) {
    const enemies = state.combat.enemies.filter((x) => x.alive);
    if (enemies.length) {
      const totalSplash = Math.floor(overflowDamage * talentStarValue("overkill"));
      const splash = Math.floor(totalSplash / enemies.length);
      if (splash > 0) {
        combatLog("💥 赶尽杀绝：分摊 ".concat(totalSplash, " 点溢出伤害。"));
        for (const e of enemies) takeDamage(e, splash, attacker, { trueDamage: true, sourceName: "赶尽杀绝" });
      }
    }
  }
}
function checkBattleEnd() {
  const c = state.combat;
  if (!c) return true;
  const playerAlive = c.allies.some((a) => a.isPlayer && a.alive);
  const enemyAlive = c.enemies.some((e) => e.alive);
  if (!playerAlive) {
    state.pendingSkill = null;
    c.activeUnitId = "";
    c.targetSelectSerial = 0;
    c.advanceTimer = 0;
    c.floatCleanupTimer = 0;
    c.phase = "defeat";
    state.run.alive = false;
    syncCombatBackToRun();
    combatLog("💀 你被击败了。");
    saveGame();
    if (!c.quickBattleMode) render();
    return true;
  }
  if (!enemyAlive) {
    state.pendingSkill = null;
    c.activeUnitId = "";
    c.targetSelectSerial = 0;
    c.advanceTimer = 0;
    c.floatCleanupTimer = 0;
    c.phase = "victory";
    syncCombatBackToRun();
    grantBattleRewards();
    if (!c.quickBattleMode) render();
    return true;
  }
  return false;
}
function finishBattleByTurnLimit() {
  const c = state.combat;
  if (!c || ["victory", "defeat"].includes(c.phase)) return false;
  state.pendingSkill = null;
  c.activeUnitId = "";
  c.targetSelectSerial = 0;
  c.advanceTimer = 0;
  c.floatCleanupTimer = 0;
  c.turnLimitReached = true;
  c.rewardMultiplier = BATTLE_TURN_LIMIT_REWARD_MULTIPLIER;
  c.phase = "victory";
  syncCombatBackToRun();
  combatLog("⏳ 坚持到 ".concat(BATTLE_MAX_TURNS, " 回合仍未战败，按胜利结算，奖励减半。"));
  grantBattleRewards();
  if (!c.quickBattleMode) render();
  return true;
}
function syncCombatBackToRun() {
  if (!state.combat || !state.run) return;
  for (const a of state.combat.allies) {
    if (a.isCommandPuppet) continue;
    state.run.currentHp[a.unitId] = Math.max(0, Math.floor(a.hp));
    state.run.currentEnergy[a.unitId] = Math.floor(a.energy);
    const member = state.run.party.find((m) => m.unitId === a.unitId);
    if ((member == null ? void 0 : member.mercData) && !a.alive) member.mercData.alive = false;
  }
}
function grantBattleRewards() {
  var _a, _b, _c2;
  const c = state.combat;
  if (!c || c.rewardPending || !state.run) return;
  c.rewardPending = true;
  const isElite = c.kind === "elite";
  const isBoss = c.kind === "boss";
  const rewardMultiplier = c.turnLimitReached ? BATTLE_TURN_LIMIT_REWARD_MULTIPLIER : 1;
  const climbBattleGoldMultiplier = 1 - clamp(climbEffects(state.run).battleGoldPenaltyPct || 0, 0, 0.95);
  const scaleRewardAmount = (value) => Math.max(0, Math.floor((Number(value) || 0) * rewardMultiplier));
  const scaleGoldReward = (value) => scaleRewardAmount((Number(value) || 0) * climbBattleGoldMultiplier);
  const grantsIndivisibleReward = () => rewardMultiplier >= 1 || Math.random() < rewardMultiplier;
  const result = {
    title: c.turnLimitReached ? "⏳ 极限胜利！" : "🎉 胜利！",
    gold: 0,
    exp: 0,
    levelUps: 0,
    extras: [],
    drops: [],
    rewardMultiplier,
    turnLimitReached: !!c.turnLimitReached
  };
  if (c.turnLimitReached) result.extras.push("".concat(BATTLE_MAX_TURNS, "回合结算：奖励减半"));
  let goldBase = isBoss ? 60 : isElite ? 30 : 10;
  const hasMessengerGoldBonus = !!state.run.messengerGoldBonus;
  if (hasMessengerGoldBonus) goldBase *= 1.5;
  const goldTalentPassive = hasTalent("gold_10pct") ? "gold_10pct" : hasTalent("gold_15pct") ? "gold_15pct" : "";
  if (goldTalentPassive) goldBase *= 1 + 0.1 * talentPassiveMultiplier(goldTalentPassive);
  if (hasTalent("gold_30pct")) goldBase *= 1 + 0.3 * talentPassiveMultiplier("gold_30pct");
  const gold = scaleGoldReward(rng(Math.floor(goldBase * 0.8), Math.floor(goldBase * 1.2)));
  state.run.gold += gold;
  result.gold += gold;
  let exp = battleExpForFloor(state.run.floor, isBoss ? "boss" : isElite ? "elite" : "normal");
  if (hasTalent("xp_boost")) exp = Math.floor(exp * (1 + 0.2 * talentPassiveMultiplier("xp_boost")));
  exp = scaleRewardAmount(exp);
  const levels = addExp(exp);
  result.exp = exp;
  result.levelUps = levels;
  const mercProgress = awardMercenaryProgress(c, exp);
  result.mercExp = mercProgress.exp;
  result.mercLevelUps = mercProgress.levels;
  let summary = "".concat(c.turnLimitReached ? "⏳ 极限胜利（奖励".concat(rewardMultiplier * 100, "%）！") : "🎉 胜利！", "获得 ").concat(gold, " 金币，").concat(exp, " 经验");
  if (levels) summary += "，升级到 Lv.".concat(state.run.level);
  if (mercProgress.exp) summary += "，佣兵获得 ".concat(mercProgress.exp, " 经验");
  if (mercProgress.levels) summary += "（".concat(mercProgress.levels, " 次升级）");
  if (isBoss) {
    const bonus = scaleGoldReward(30);
    state.run.gold += bonus;
    result.gold += bonus;
    result.extras.push("Boss奖励".concat(bonus, "金币"));
    summary += "，Boss奖励".concat(bonus, "金币");
  }
  if (hasTalent("dmg_escalate")) {
    (_a = state.run).dmgEscalateFloors || (_a.dmgEscalateFloors = {});
    if (!state.run.dmgEscalateFloors[state.run.floor]) {
      state.run.dmgEscalateFloors[state.run.floor] = true;
      state.run.dmgEscalateStacks = (state.run.dmgEscalateStacks || 0) + talentStarValue("dmg_escalate");
      const bonusPct = Number((state.run.dmgEscalateStacks * 100).toFixed(2));
      result.extras.push("战意+".concat(bonusPct, "%"));
      summary += "，战意+".concat(bonusPct, "%");
    }
  }
  if (state.run.tacticBoost) state.run.tacticBoost = false;
  if (hasMessengerGoldBonus) {
    state.run.messengerGoldBonus = false;
    result.extras.push("信使护送金币+50%");
    summary += "，信使护送金币+50%";
  }
  if (state.run.bountyReward && isElite) {
    const bonus = scaleGoldReward(80);
    state.run.gold += bonus;
    result.gold += bonus;
    state.run.bountyReward = false;
    const bountyItem = grantsIndivisibleReward() ? generateEquip(state.run.floor, "blue") : null;
    if (bountyItem) {
      queueRewardEquipment(result, bountyItem);
      result.drops.push("".concat(bountyItem.icon).concat(bountyItem.name));
    }
    result.extras.push("悬赏奖励".concat(bonus, "金币").concat(bountyItem ? "和蓝色装备" : ""));
    summary += "，悬赏奖励".concat(bonus, "金币").concat(bountyItem ? "和".concat(bountyItem.name) : "");
  }
  if (((_b = c.eventBattleReward) == null ? void 0 : _b.id) === "time_rift") {
    const bonus = scaleGoldReward(80);
    const riftItem = grantsIndivisibleReward() ? generateEquip(state.run.floor, "purple") : null;
    state.run.gold += bonus;
    result.gold += bonus;
    if (riftItem) {
      queueRewardEquipment(result, riftItem);
      result.drops.push("".concat(riftItem.icon).concat(riftItem.name));
    }
    result.extras.push("裂隙战利品".concat(bonus, "金币").concat(riftItem ? "和紫色装备" : ""));
    summary += "，裂隙战利品".concat(bonus, "金币").concat(riftItem ? "和".concat(riftItem.name) : "");
  }
  if (((_c2 = c.eventBattleReward) == null ? void 0 : _c2.id) === "immortal_throne") {
    const throneItem = grantsIndivisibleReward() ? generateImmortalThroneEquipment(state.run.floor) : null;
    if (throneItem) {
      queueRewardEquipment(result, throneItem);
      result.drops.push("".concat(throneItem.icon).concat(throneItem.name));
      result.extras.push("王座赐福：橙色装备至少2条词缀");
      summary += "，王座赐下".concat(throneItem.name, "（至少2条词缀）");
    }
  }
  combatLog(summary);
  const dropChance = (isBoss ? 1 : isElite ? 0.6 : 0.3) * rewardMultiplier;
  if (Math.random() < dropChance) {
    const item = generateEquip(state.run.floor);
    result.drops.push("".concat(item.icon).concat(item.name));
    queueRewardEquipment(result, item);
    combatLog("🎁 掉落 ".concat(item.icon).concat(item.name, "。"));
  }
  const itemDropChance = Math.min(1, (hasTalent("item_magnet") ? 1 : (isBoss ? 0.7 : isElite ? 0.45 : 0.25) + (hasTalent("scavenger") ? 0.1 * talentPassiveMultiplier("scavenger") : 0)) * rewardMultiplier);
  if (Math.random() < itemDropChance) {
    const item = addRandomItem();
    result.drops.push(item ? "".concat(item.icon).concat(item.name) : "随机道具");
    combatLog(item ? "🎒 获得 ".concat(item.icon).concat(item.name, "。") : "🎒 获得一个随机道具。");
  }
  c.result = result;
  saveGame();
}
function queueRewardEquipment(result, item) {
  if (!result || !item) return;
  result.pendingEquipItems || (result.pendingEquipItems = []);
  result.pendingEquipItems.push(item);
  result.pendingEquipItem || (result.pendingEquipItem = item);
}
function addExp(amount) {
  let levels = 0;
  state.run.exp += amount;
  while (state.run.exp >= expForLevel(state.run.level)) {
    state.run.exp -= expForLevel(state.run.level);
    state.run.level += 1;
    state.run.skillPoints += 1;
    if (hasTalent("sp_boost") && state.run.level % talentStarValue("sp_boost") === 0) state.run.skillPoints += 1;
    levels += 1;
  }
  return levels;
}
function addMercenaryExp(member, amount) {
  if (!(member == null ? void 0 : member.mercData) || amount <= 0) return 0;
  const data = member.mercData;
  data.level = Math.max(1, Math.floor(data.level || 1));
  data.exp = Math.max(0, Math.floor(data.exp || 0)) + Math.floor(amount);
  let levels = 0;
  while (data.exp >= mercExpForLevel(data.level)) {
    data.exp -= mercExpForLevel(data.level);
    data.level += 1;
    levels += 1;
  }
  return levels;
}
function awardMercenaryExp(members, amount) {
  if (!state.run) return { exp: 0, levels: 0, members: 0 };
  const expGain = Math.max(1, Math.floor(amount));
  const result = { exp: 0, levels: 0, members: 0 };
  for (const member of members || []) {
    if (!(member == null ? void 0 : member.mercData) || member.mercData.alive === false) continue;
    result.exp += expGain;
    result.levels += addMercenaryExp(member, expGain);
    result.members += 1;
  }
  refreshPartyHpCaps();
  return result;
}
function awardMercenaryProgress(combat, heroExp) {
  if (!combat || !state.run) return { exp: 0, levels: 0, members: 0 };
  const members = combat.allies.filter((ally) => ally.isMerc && ally.alive).map((ally) => state.run.party.find((candidate) => candidate.unitId === ally.unitId));
  return awardMercenaryExp(members, heroExp);
}
function awardDeployedMercenaryProgress(amount) {
  return awardMercenaryExp(deployedMercRoster(), amount);
}
function reviveFallenMercenaries(hpPercent = 0.4) {
  var _a;
  if (!state.run) return 0;
  let revived = 0;
  for (const member of mercRoster()) {
    if (((_a = member.mercData) == null ? void 0 : _a.alive) !== false) continue;
    member.mercData.alive = true;
    const stats = calcUnitStats(member);
    state.run.currentHp[member.unitId] = Math.max(1, Math.floor(stats.hp * hpPercent));
    state.run.currentEnergy[member.unitId] = Math.floor((stats.energy || 0) * 0.5);
    revived += 1;
  }
  return revived;
}
function afterBattleContinue() {
  var _a, _b;
  if (!state.run || !state.combat) return;
  const c = state.combat;
  const kind = c.kind;
  const pendingItems = ((_a = c.result) == null ? void 0 : _a.pendingEquipItems) || (((_b = c.result) == null ? void 0 : _b.pendingEquipItem) ? [c.result.pendingEquipItem] : []);
  const pendingItem = pendingItems.shift();
  if (pendingItem) {
    c.result.pendingEquipItems = pendingItems;
    c.result.pendingEquipItem = pendingItems[0] || null;
    state.screen = "tower";
    state.pendingSkill = null;
    state.eventResult = null;
    state.shopOpen = false;
    playMusic("tower");
    openEquipModal(pendingItem, () => afterBattleContinue());
    return;
  }
  finishBattleProgress(kind);
}
function finishBattleProgress(kind) {
  if (!state.run) return;
  state.screen = "tower";
  delete state.run.pendingBattle;
  state.combat = null;
  state.combatCheckpoint = null;
  state.pendingSkill = null;
  state.eventResult = null;
  state.shopOpen = false;
  decayRunBuffs();
  const wrap = currentEventWrap();
  if (wrap) wrap.done = true;
  state.eventIdx += 1;
  playMusic("tower");
  if (kind === "boss") {
    handleBossCleared();
  } else {
    saveGame();
    render();
  }
}
function handleBossCleared() {
  if (!state.run) return;
  if (tryOpenBossStoryEvent(() => handleBossClearedAfterStory())) return;
  handleBossClearedAfterStory();
}
function handleBossClearedAfterStory() {
  if (!state.run) return;
  if (isCampaignComplete(state.run)) {
    completeCampaign();
    return;
  }
  if (state.run.floor >= 3 && !state.run.promoted && !state.run.dualHeroMode) {
    openPromotionModal();
    return;
  }
  if (canTier2Promote()) {
    openTier2PromotionModal();
    return;
  }
  maybeFloorTalentThenAdvance();
}
function bossStoryChapterForFloor(floor) {
  if (floor > BOSS_STORY_ENDLESS_FLOOR) {
    return {
      arc: "无尽守望",
      guardian: "裂隙残响",
      beats: [
        "裂隙残响在风里发出不甘心的低语。你拍了拍剑柄：‘排队，前面还有不少。’",
        "塔外的夜色很安静，只有新点亮的火盏提醒你：守望从来不是一个人的事。",
        "残响试图模仿旧日守卫的声音，结果被塔壁回音纠正得很有礼貌。",
        "神火照亮更高的阶梯。每多走一步，裂隙便少一分伸向人间的机会。",
        "永恒之塔没有终点的钟声，只有一盏又一盏被重新点亮的灯。"
      ]
    };
  }
  return BOSS_STORY_CHAPTERS.find((chapter) => floor <= chapter.maxFloor) || BOSS_STORY_CHAPTERS[BOSS_STORY_CHAPTERS.length - 1];
}
function bossStoryBeatForFloor(floor) {
  const chapter = bossStoryChapterForFloor(floor);
  const beatIndex = Math.max(0, Math.min(chapter.beats.length - 1, (Math.floor(floor / BOSS_STORY_INTERVAL) - 1) % 5));
  return { chapter, text: chapter.beats[beatIndex] };
}
function isBossStoryFloor(run = state.run) {
  const floor = Math.floor((run == null ? void 0 : run.floor) || 0);
  return floor > 0 && floor % BOSS_STORY_INTERVAL === 0;
}
function tryOpenBossStoryEvent(onContinue) {
  var _a;
  const run = state.run;
  const floor = Math.floor((run == null ? void 0 : run.floor) || 0);
  if (!run || !isBossStoryFloor(run) || ((_a = run.bossStoryChoices) == null ? void 0 : _a[floor])) return false;
  openBossStoryEvent(onContinue);
  return true;
}
function bossStoryRewardOptions(isFinale, floor = ((_h) => (_h = state.run) == null ? void 0 : _h.floor)() || 0) {
  if (isFinale) {
    return [
      { id: "inherit_flame", label: "承接神火" },
      { id: "restore_seal", label: "修复封印" },
      { id: "farewell_guardian", label: "送别守卫" }
    ];
  }
  if (floor > BOSS_STORY_ENDLESS_FLOOR) {
    return [
      { id: "kindle", label: "点亮守卫的神火", reward: "回满生命、能量并复活佣兵；生命永久 +1%" },
      { id: "purify", label: "净化残存神核", reward: "攻击、法强永久 +1%" },
      { id: "relic", label: "收下守卫遗物", reward: "金币 +".concat(GOLD_ECONOMY.bossStoryRelic, "；防御永久 +1%") }
    ];
  }
  return [
    { id: "kindle", label: "点亮守卫的神火", reward: "全队恢复 35% 生命与 30% 能量" },
    { id: "purify", label: "净化残存神核", reward: "获得 1 项本轮永久属性" },
    { id: "relic", label: "收下守卫遗物", reward: "金币 +80，获得 3 场守卫遗志" }
  ];
}
function bossStoryQuickChoiceId(run = state.run) {
  if (!run) return "purify";
  if (isCampaignComplete(run)) return "inherit_flame";
  const configured = quickSettings().bossStory || "smart";
  if (["kindle", "purify", "relic"].includes(configured)) return configured;
  const livingParty = (run.party || []).filter((member) => {
    var _a;
    return ((_a = member.mercData) == null ? void 0 : _a.alive) !== false;
  });
  const hasFallenMercenary = (run.party || []).some((member) => {
    var _a;
    return ((_a = member.mercData) == null ? void 0 : _a.alive) === false;
  });
  const needsRecovery = livingParty.some((member) => {
    var _a, _b, _c2, _d2;
    const stats = calcUnitStats(member, run);
    const hpRatio = ((_b = (_a = run.currentHp) == null ? void 0 : _a[member.unitId]) != null ? _b : stats.hp) / Math.max(1, stats.hp);
    const energyRatio = ((_d2 = (_c2 = run.currentEnergy) == null ? void 0 : _c2[member.unitId]) != null ? _d2 : stats.energy) / Math.max(1, stats.energy);
    return hpRatio < 0.65 || energyRatio < 0.4;
  });
  return hasFallenMercenary || needsRecovery ? "kindle" : "purify";
}
function bossStoryQuickChoiceLabel(choiceId, isFinale = false, floor = ((_i) => (_i = state.run) == null ? void 0 : _i.floor)() || 0) {
  var _a;
  return ((_a = bossStoryRewardOptions(isFinale, floor).find((option) => option.id === choiceId)) == null ? void 0 : _a.label) || "继续守望";
}
function addBossStoryPermanentStats(statKeys, pctValue) {
  var _a;
  if (!state.run) return;
  (_a = state.run).bossStoryStatPct || (_a.bossStoryStatPct = { hpPct: 0, atkPct: 0, matkPct: 0, defPct: 0 });
  for (const stat of statKeys || []) {
    state.run.bossStoryStatPct[stat] = Number(((state.run.bossStoryStatPct[stat] || 0) + pctValue).toFixed(4));
  }
}
function openBossStoryEvent(onContinue) {
  const run = state.run;
  if (!run) return;
  const floor = Math.floor(run.floor || 0);
  const { chapter, text } = bossStoryBeatForFloor(floor);
  const isFinale = isCampaignComplete(run);
  const options = bossStoryRewardOptions(isFinale, floor);
  const quickChoiceId = bossStoryQuickChoiceId(run);
  const quickChoiceLabel2 = bossStoryQuickChoiceLabel(quickChoiceId, isFinale, floor);
  const nextHint = isFinale ? "第".concat(floor, "层守卫已被净化。选择如何回应这份遗志，再完成本次关卡。") : "守卫的意识即将散去。你决定如何回应这份遗志？";
  state.modal = {
    title: "🕯️ 永恒之塔 · ".concat(chapter.arc),
    className: "boss-story-modal",
    backdropClassName: "boss-story-backdrop",
    body: '\n      <div class="boss-story-body">\n        <div class="boss-story-meta">第 '.concat(floor, " 层 · ").concat(chapter.guardian, '</div>\n        <p class="boss-story-copy">').concat(esc(text), '</p>\n        <p class="boss-story-hint">').concat(esc(nextHint), "</p>\n      </div>\n    "),
    actions: [
      ...options.map((option) => ({
        label: option.reward ? "".concat(option.label, " · ").concat(option.reward) : option.label,
        onClick: () => chooseBossStoryReward(option.id, onContinue)
      })),
      {
        label: "⚡ 快速选择（".concat(quickChoiceLabel2, "）"),
        className: "quick-select boss-story-quick",
        onClick: () => chooseBossStoryReward(quickChoiceId, onContinue)
      }
    ]
  };
  render();
}
function chooseBossStoryReward(choiceId, onContinue) {
  var _a;
  const run = state.run;
  const floor = Math.floor((run == null ? void 0 : run.floor) || 0);
  if (!run || !floor || ((_a = run.bossStoryChoices) == null ? void 0 : _a[floor])) return;
  const isFinale = isCampaignComplete(run);
  const isEndlessReward = floor > BOSS_STORY_ENDLESS_FLOOR;
  let rewardText = "";
  if (isFinale) {
    rewardText = "你回应了守卫的遗志，永恒之塔的神火重新照亮了前路。";
  } else if (choiceId === "kindle") {
    if (isEndlessReward) {
      const revived = reviveFallenMercenaries(1);
      addBossStoryPermanentStats(["hpPct"], BOSS_STORY_ENDLESS_FIRE_STAT_PCT);
      refreshPartyHpCaps();
      healParty(1);
      restoreEnergyParty(1);
      rewardText = "全队生命与能量回满".concat(revived ? "，复活".concat(revived, "名阵亡佣兵") : "", "；生命永久+1%。");
    } else {
      healParty(0.35);
      restoreEnergyParty(0.3);
      rewardText = "全队恢复35%生命与30%能量。";
    }
  } else if (choiceId === "purify") {
    if (isEndlessReward) {
      addBossStoryPermanentStats(["atkPct", "matkPct"], BOSS_STORY_ENDLESS_CORE_STAT_PCT);
      refreshPartyHpCaps();
      rewardText = "净化神核，全队攻击、法强永久+1%。";
    } else {
      const gains = randomEventStat(1);
      refreshPartyHpCaps();
      rewardText = "净化神核，获得".concat(formatEventGains(gains), "。");
    }
  } else if (choiceId === "relic") {
    const gold = goldGain(GOLD_ECONOMY.bossStoryRelic);
    run.gold += gold;
    if (isEndlessReward) {
      addBossStoryPermanentStats(["defPct"], BOSS_STORY_ENDLESS_RELIC_STAT_PCT);
      refreshPartyHpCaps();
      rewardText = "获得".concat(gold, "金币；防御永久+1%。");
    } else {
      addRunBuff("boss_story_".concat(floor), "守卫遗志", { hpPct: 0.1, atkPct: 0.1, matkPct: 0.1, defPct: 0.1 }, 3);
      rewardText = "获得".concat(gold, "金币；接下来3场战斗全队生命、攻击、法强、防御+10%。");
    }
  } else {
    return;
  }
  run.bossStoryChoices || (run.bossStoryChoices = {});
  run.bossStoryChoices[floor] = choiceId;
  addRunLog("🕯️ 第".concat(floor, "层守卫遗志：").concat(rewardText));
  state.modal = null;
  saveGame();
  onContinue == null ? void 0 : onContinue();
}
function maybeFloorTalentThenAdvance() {
  if (!state.run) return;
  if (state.run.floor % 5 === 0) {
    openSingleTalentModal(() => advanceFloor());
  } else {
    advanceFloor();
  }
}
function advanceFloor() {
  if (!state.run) return;
  state.run.floor += 1;
  state.floorEvents = generateFloorEvents(state.run.floor);
  state.eventIdx = 0;
  state.eventResult = null;
  state.shopOpen = false;
  healParty(0.18);
  restoreEnergyParty(0.35);
  addRunLog("你进入第 ".concat(state.run.floor, " 层。"));
  saveGame();
  render();
}
function reincarnate() {
  if (!state.run) return;
  const floor = state.run.floor || 1;
  state.modal = {
    title: "🔁 确认转生",
    className: "reincarnate-modal",
    body: '\n      <div class="reincarnate-confirm">\n        <strong>当前在第 '.concat(floor, " 层</strong>\n        <p>确定要放弃本次探索并转生吗？</p>\n        <b>转生后将获得天赋点用于永久成长</b>\n      </div>\n    "),
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } },
      { label: "确认转生", className: "danger", onClick: () => performReincarnation() }
    ]
  };
  render();
}
function completeCampaign() {
  completeRun(true);
}
function performReincarnation() {
  completeRun(false);
}
function completeRun(cleared) {
  var _a, _b, _c2;
  if (!state.run) return;
  const run = state.run;
  const floor = run.floor || 1;
  const classId = getBaseClassId(run.classId || "warrior");
  const mode = modeOfRun(run);
  const modeDef = gameMode(mode);
  let baseTalentPoints = 0;
  for (let i = 1; i <= floor; i += 1) baseTalentPoints += Math.min(10, Math.floor((i - 1) / 5) + 1);
  const talentPointDifficultyMultiplier = runTalentPointMultiplier(run);
  const tp = Math.floor(baseTalentPoints * talentPointDifficultyMultiplier);
  const difficultyTalentPointBonus = tp - baseTalentPoints;
  state.perm.talentPoints += tp;
  state.perm.totalRuns += 1;
  (_a = state.perm).modeBestFloors || (_a.modeBestFloors = {});
  state.perm.modeBestFloors[mode] = Math.max(modeBestFloor(mode), floor);
  let climbNewUnlock = null;
  let completedClimbLevel = null;
  if (mode === "climb") {
    completedClimbLevel = climbLevelOfRun(run);
    (_b = state.perm).climbBestFloors || (_b.climbBestFloors = {});
    (_c2 = state.perm).climbClearedLevels || (_c2.climbClearedLevels = {});
    state.perm.climbBestFloors[completedClimbLevel] = Math.max(climbBestFloor(completedClimbLevel), floor);
    if (cleared && floor >= 100) {
      state.perm.climbClearedLevels[completedClimbLevel] = true;
      const unlocked = climbUnlockedLevel();
      if (completedClimbLevel === unlocked && unlocked < CLIMB_MAX_LEVEL) {
        climbNewUnlock = unlocked + 1;
        state.perm.climbMaxUnlocked = climbNewUnlock;
      }
    }
  }
  if (floor > (state.perm.bestFloor || 0)) {
    state.perm.bestFloor = floor;
    state.perm.bestClassId = classId;
  }
  recordClassBestFloor(classId, floor);
  state.reincarnationResult = {
    floor,
    talentPointsGained: tp,
    baseTalentPoints,
    talentPointDifficultyMultiplier,
    difficultyTalentPointBonus,
    doubled: false,
    mode,
    modeName: mode === "climb" ? "".concat(modeDef.name, " Lv.").concat(completedClimbLevel) : modeDef.name,
    difficultyMultiplier: runDifficultyMultiplier(run),
    endFloor: runEndFloor(run),
    cleared: !!cleared,
    bestFloor: modeBestFloor(mode),
    totalRuns: state.perm.totalRuns || 0,
    currentTalentPoints: state.perm.talentPoints || 0,
    climbLevel: completedClimbLevel,
    climbNewUnlock,
    climbMaxUnlocked: climbUnlockedLevel(),
    climbHighestCompleted: completedClimbLevel === CLIMB_MAX_LEVEL && !!cleared
  };
  state.run = null;
  state.combat = null;
  state.combatCheckpoint = null;
  state.modal = null;
  state.floorEvents = [];
  state.eventIdx = 0;
  state.eventResult = null;
  state.shopOpen = false;
  clearRunSave(mode);
  state.screen = "reincarnation";
  saveGame();
  playMusic("city");
  render();
}
function claimReincarnationDouble() {
  showRewardedAd("reincarnation_double", grantReincarnationDoubleReward);
}
function grantReincarnationDoubleReward() {
  const result = state.reincarnationResult;
  if (!result || result.doubled) return;
  const bonus = result.talentPointsGained || 0;
  state.perm.talentPoints += bonus;
  result.doubled = true;
  result.currentTalentPoints = state.perm.talentPoints || 0;
  saveGame();
  render();
}
function canUseAdRevive(run = state.run) {
  return !!run && !run.adReviveUsed;
}
function reviveFromAd() {
  if (!canUseAdRevive()) {
    toast("本轮已使用过广告复活。");
    return;
  }
  showRewardedAd("defeat_revive", grantAdRevive);
}
function grantAdRevive() {
  const combat = state.combat;
  const run = state.run;
  if (!combat || !run || combat.phase !== "defeat" || !canUseAdRevive(run)) return;
  for (const ally of combat.allies) {
    ally.hp = ally.maxHp;
    ally.energy = ally.stats.energy || 100;
    ally.alive = true;
    run.currentHp[ally.unitId] = ally.hp;
    run.currentEnergy[ally.unitId] = ally.energy;
    const member = run.party.find((unit) => unit.unitId === ally.unitId);
    if (member == null ? void 0 : member.mercData) member.mercData.alive = true;
  }
  run.alive = true;
  run.adReviveUsed = true;
  combat.quickBattleMode = false;
  combat.phase = "running";
  combat.activeUnitId = "";
  combat.advanceTimer = 0;
  combat.floatCleanupTimer = 0;
  combatLog("📺 广告复活：全队恢复满生命与能量。\n");
  buildTurnOrder();
  saveGame();
  advanceCombat();
}
function useCombatItem(itemId, inputSerial = null) {
  var _a;
  if (!state.combat || !state.run) return;
  if (!canAcceptCombatInput(inputSerial)) return;
  const item = DATA.items[itemId];
  if (!item || !removeItem(itemId, 1)) return;
  const active = getActivePlayer() || state.combat.allies.find((a) => a.isPlayer && a.alive);
  const itemMul = hasTalent("item_double") ? 1 + talentStarValue("item_double") : 1;
  if (hasTalent("item_saver") && Math.random() < talentStarValue("item_saver")) {
    addItem(itemId, 1);
    combatLog("💰 节俭触发，道具未消耗。");
  }
  combatLog("".concat(item.icon, " 使用 ").concat(item.name, "。"));
  if (item.type === "heal") {
    const potionMul = hasTalent("potion_boost") ? 1 + talentStarValue("potion_boost") : 1;
    healRaw(active, Math.floor(active.maxHp * 0.4 * potionMul * itemMul));
  }
  if (item.type === "energy") {
    const beforeEnergy = active.energy;
    active.energy = Math.min(active.stats.energy, active.energy + 50 * itemMul);
    const energyGain = active.energy - beforeEnergy;
    if (energyGain > 0) emitCombatFloat(active, "+".concat(energyGain), "energy");
  }
  if (item.type === "shield") {
    const shield = Math.floor(active.maxHp * 0.3 * itemMul);
    grantShield(active, shield);
  }
  if (item.type === "damage") {
    for (const e of state.combat.enemies.filter((x) => x.alive)) {
      let dmg = Math.floor(e.maxHp * (((_a = e.template) == null ? void 0 : _a.isBoss) ? 0.15 : 0.3));
      if (hasTalent("bomb_expert")) dmg = Math.floor(dmg * (1 + talentStarValue("bomb_expert")));
      dealPercentTrueDamage(e, dmg * itemMul, active, { sourceName: "爆裂弹" });
    }
  }
  if (item.type === "cleanse") dispelDebuffs(active, 99);
  if (item.type === "buff") applyBuff(active, "strengthen", 3 * itemMul);
  if (item.type === "heal_all") {
    const potionMul = hasTalent("potion_boost") ? 1 + talentStarValue("potion_boost") : 1;
    for (const a of state.combat.allies.filter((x) => x.alive)) healRaw(a, Math.floor(a.maxHp * 0.2 * potionMul * itemMul));
  }
  if (item.type === "control") for (const e of state.combat.enemies.filter((x) => x.alive)) applyBuff(e, "stun", itemMul);
  checkBattleEnd();
  saveGame();
  render();
}
function combatEquipmentForUnit(unit) {
  var _a, _b, _c2, _d2, _e2, _f2, _g;
  if (!unit || unit.side !== "ally") return {};
  if (unit.isCommandPuppet) {
    const owner = commandPuppetOwner(unit, true);
    return owner ? combatEquipmentForUnit(owner) : {};
  }
  if (unit.isMerc) {
    return ((_b = (_a = unit.memberRef) == null ? void 0 : _a.mercData) == null ? void 0 : _b.equipment) || ((_f2 = (_e2 = (_d2 = (_c2 = state.run) == null ? void 0 : _c2.party) == null ? void 0 : _d2.find((member) => member.unitId === unit.unitId)) == null ? void 0 : _e2.mercData) == null ? void 0 : _f2.equipment) || {};
  }
  return unit.isPlayer && !unit.isSecondHero ? ((_g = state.run) == null ? void 0 : _g.equipment) || {} : {};
}
function unitHasMech(unit, id) {
  return Object.values(combatEquipmentForUnit(unit)).some((item) => item && (item.affixes || []).some((affix) => affix.mechanic === id));
}
function hasMech(id) {
  var _a, _b;
  const player = ((_b = (_a = state.combat) == null ? void 0 : _a.allies) == null ? void 0 : _b.find((unit) => unit.isPlayer)) || { side: "ally", isPlayer: true };
  return unitHasMech(player, id);
}
function mechAmp(unit = null) {
  return (unit == null ? void 0 : unit.isPlayer) && hasTalent("affix_amp") ? 1.25 : 1;
}
function mechChance(value, unit = null) {
  return value * mechAmp(unit);
}
function addComboStack(unit) {
  if (!state.combat || !unit) return;
  unit.equipmentComboStacks = Math.min(10, (unit.equipmentComboStacks || 0) + 1);
  const stacks = unit.equipmentComboStacks;
  if (stacks === 1 || stacks % 3 === 0 || stacks === 10) {
    combatLog("🔗 ".concat(unit.name, " 连击叠层：暴击 +").concat(Math.floor(stacks * 2 * mechAmp(unit)), "%（").concat(stacks, "/10）。"));
  }
}
function openEquipModal(item, onClose) {
  var _a, _b;
  (_a = state.run).equipmentLocks || (_a.equipmentLocks = {});
  const old = ((_b = state.run) == null ? void 0 : _b.equipment[item.slot]) || null;
  const mode = quickSettings().equip;
  if (mode === "equip") {
    const assigned = autoAssignEquipment(item);
    if (!assigned.assigned) sellUnassignedEquipment(item);
    onClose == null ? void 0 : onClose();
    saveGame();
    render();
    return;
  }
  if (state.perm.autoDiscardLowQualityEquip && old && equipRarityRank(item.rarity) < equipRarityRank(old.rarity)) {
    const target = bestEquipmentAssignment(item);
    if (!target || target.gain <= 0) {
      sellUnassignedEquipment(item);
      onClose == null ? void 0 : onClose();
      render();
      return;
    }
  }
  if (mode === "discard") {
    const gold = sellValue(item);
    state.run.gold += gold;
    addRunLog("分解 ".concat(item.name, "，获得 ").concat(gold, " 金币。"));
    onClose == null ? void 0 : onClose();
    render();
    return;
  }
  pendingEquipResolve = onClose || null;
  state.modal = null;
  state.pendingEquip = { item };
  render();
}
function resolvePendingEquip(action = "auto") {
  var _a;
  if (!state.run || !((_a = state.pendingEquip) == null ? void 0 : _a.item)) return;
  const item = state.pendingEquip.item;
  const done = pendingEquipResolve;
  state.pendingEquip = null;
  let nextItem = null;
  if (action === "discard") {
    sellUnassignedEquipment(item);
  } else if (action === "equip") {
    nextItem = equipEquipmentToHero(item).pendingItem;
  } else {
    const assigned = autoAssignEquipment(item);
    if (!assigned.assigned) sellUnassignedEquipment(item);
  }
  saveGame({ persistDurableChangesDuringCombat: true });
  if (nextItem) {
    state.pendingEquip = { item: nextItem };
    pendingEquipResolve = done;
    render();
    return;
  }
  pendingEquipResolve = null;
  if (done) done();
  else render();
}
function equipStatMap(item) {
  const out = {};
  if (!item) return out;
  for (const stat of item.baseStats || []) {
    out[stat.stat] = (out[stat.stat] || 0) + Math.floor(stat.value || 0);
  }
  for (const affix of item.affixes || []) {
    if (!affix.stat) continue;
    out[affix.stat] = (out[affix.stat] || 0) + Math.floor(affix.value || 0);
  }
  return out;
}
function statCssClass(stat) {
  if (stat === "hp" || stat === "hpRegen") return "stat-hp";
  if (stat === "atk" || stat === "crit" || stat === "critDmg") return "stat-atk";
  if (stat === "matk" || stat === "energy" || stat === "energyRegen") return "stat-matk";
  if (stat === "def" || stat === "statusRes") return "stat-def";
  return "";
}
function renderEquipCompareCard(item, title) {
  if (!item) {
    return '\n      <article class="loot-compare-card empty-slot-card">\n        <div class="loot-card-title">'.concat(esc(title), '</div>\n        <div class="loot-empty-slot">空槽位</div>\n      </article>\n    ');
  }
  const set = getSetDef(item.setId);
  const statRows = Object.entries(equipStatMap(item)).map(([stat, value]) => {
    const suffix = ["crit", "critDmg"].includes(stat) ? "%" : "";
    return '<p class="'.concat(statCssClass(stat), '">').concat(STAT_LABEL[stat] || stat, " +").concat(value).concat(suffix, "</p>");
  }).join("");
  const mechanicRows = (item.affixes || []).filter((affix) => affix.mechanic).map((affix) => '<p class="stat-mechanic">✦ '.concat(esc(affix.name), "：").concat(esc(affix.desc || ""), "</p>")).join("");
  return '\n    <article class="loot-compare-card rarity-'.concat(esc(item.rarity || "white"), '">\n      <div class="loot-card-title">').concat(title === "新装备" ? "<span>NEW</span>" : "").concat(esc(title), '</div>\n      <div class="loot-equip-head">\n        ').concat(renderEquipArt(item.slot, "equip-art loot-equip-art", item.rarity || "white"), "\n        <div>\n          <h3>").concat(esc(item.name), '</h3>\n          <div class="loot-sub">').concat(DATA.equipSlotNames[item.slot] || item.slot, " Lv.").concat(item.level || 1, " · ").concat(RARITY_LABEL[item.rarity] || item.rarity, "</div>\n        </div>\n      </div>\n      ").concat(set ? '<div class="loot-set">套装：'.concat(esc(set.name), "</div>") : "", '\n      <div class="loot-stat-lines">').concat(statRows || '<p class="subtle">无属性</p>').concat(mechanicRows, "</div>\n    </article>\n  ");
}
function renderEquipDelta(newItem, oldItem) {
  const next = equipStatMap(newItem);
  const prev = equipStatMap(oldItem);
  const keys = Array.from(/* @__PURE__ */ new Set([...Object.keys(next), ...Object.keys(prev)]));
  const rows = keys.map((stat) => {
    const diff = (next[stat] || 0) - (prev[stat] || 0);
    if (!diff) return "";
    const suffix = ["crit", "critDmg"].includes(stat) ? "%" : "";
    const sign = diff > 0 ? "+" : "";
    return '<span class="'.concat(diff > 0 ? "delta-plus" : "delta-minus", " ").concat(statCssClass(stat), '">').concat(STAT_LABEL[stat] || stat, " ").concat(sign).concat(diff).concat(suffix, "</span>");
  }).filter(Boolean);
  if (!rows.length) return '<div class="loot-delta"><b>属性变化：</b><span class="subtle">无明显变化</span></div>';
  return '<div class="loot-delta"><b>属性变化：</b>'.concat(rows.join(""), "</div>");
}
function equipRarityRank(rarity) {
  return Math.max(0, DATA.equipRarityOrder.indexOf(rarity));
}
function sellValue(item) {
  const price = { white: 5, green: 15, blue: 30, purple: 50, orange: 75, red: 105 }[item == null ? void 0 : item.rarity] || 5;
  return goldGain(price);
}
function itemShopPrice(item) {
  const discount = hasTalent("item_magnet") ? talentStarValue("item_magnet") : 1;
  const climbPriceMultiplier = 1 + (climbEffects(state.run).shopPricePct || 0);
  return Math.max(1, goldCost(Math.floor(item.shopPrice * discount * climbPriceMultiplier)));
}
function defaultShopItems() {
  return ["heal_potion", "hourglass", "rage_potion", "cleanse_potion"].filter((id) => DATA.items[id]);
}
function openItemShop() {
  var _a;
  const wrap = currentEventWrap();
  if (!wrap || ((_a = wrap.event) == null ? void 0 : _a.id) !== "evt_item_shop") return;
  wrap.shopItems || (wrap.shopItems = defaultShopItems());
  wrap.shopSoldOut || (wrap.shopSoldOut = {});
  wrap.shopBought || (wrap.shopBought = []);
  state.shopOpen = true;
  state.modal = null;
  saveGame();
  render();
}
function autoResolveItemShop(wrap = currentEventWrap()) {
  var _a;
  if (!state.run || !wrap || ((_a = wrap.event) == null ? void 0 : _a.id) !== "evt_item_shop") return;
  wrap.shopItems || (wrap.shopItems = defaultShopItems());
  wrap.shopSoldOut || (wrap.shopSoldOut = {});
  wrap.shopBought || (wrap.shopBought = []);
  for (const itemId of wrap.shopItems) {
    const item = DATA.items[itemId];
    if (!item || wrap.shopSoldOut[itemId]) continue;
    const price = itemShopPrice(item);
    if (state.run.gold < price) continue;
    state.run.gold -= price;
    addItem(itemId, 1);
    wrap.shopSoldOut[itemId] = true;
    wrap.shopBought.push(itemId);
  }
  const bought = wrap.shopBought.map((id) => DATA.items[id]).filter(Boolean);
  const summary = bought.length ? "自动购买了：".concat(bought.map((item) => "".concat(item.icon).concat(item.name)).join("、"), "。") : "没有当前可负担的道具，队伍离开了行商。";
  completeEvent(summary);
}
function buyShopItem(itemId) {
  const wrap = currentEventWrap();
  const item = DATA.items[itemId];
  if (!state.run || !state.shopOpen || !wrap || !item) return;
  wrap.shopSoldOut || (wrap.shopSoldOut = {});
  wrap.shopBought || (wrap.shopBought = []);
  if (wrap.shopSoldOut[itemId]) {
    toast("".concat(item.name, "已经售罄。"));
    return;
  }
  const price = itemShopPrice(item);
  if (state.run.gold < price) {
    toast("金币不足，需要 ".concat(price, "。"));
    return;
  }
  state.run.gold -= price;
  addItem(itemId, 1);
  wrap.shopSoldOut[itemId] = true;
  wrap.shopBought.push(itemId);
  toast("购买了 ".concat(item.name, "。"));
  saveGame();
  render();
}
function leaveItemShop() {
  const wrap = currentEventWrap();
  if (!wrap) return;
  const bought = (wrap.shopBought || []).map((id) => DATA.items[id]).filter(Boolean);
  const summary = bought.length ? "你在行商处购买了：".concat(bought.map((it) => "".concat(it.icon).concat(it.name)).join("、"), "。") : "你离开了行商。";
  completeEvent(summary);
}
function openPromotionModal() {
  const baseId = getBaseClassId(state.run.classId);
  const options = promotionOptions(baseId);
  state.modal = {
    title: "⚔️ 转职！选择你的进阶之路",
    className: "promotion-modal",
    body: '\n      <p class="promotion-subtitle">击败Boss后觉醒了新的力量</p>\n      <div class="selection-grid promotion-grid">'.concat(options.map((opt, idx) => promotionCard(opt, idx)).join(""), '</div>\n      <p class="promotion-formula">主属性 = 转职基础 + 成长 × 等级</p>\n    '),
    actions: []
  };
  render();
}
function promotionOptions(baseId) {
  const promo = PROMOTION_DETAILS;
  const map = {
    warrior: [
      { ...promo.berserker },
      { ...promo.paladin }
    ],
    mage: [
      { ...promo.archmage_adv },
      { ...promo.chronomancer }
    ],
    ranger: [
      { ...promo.shadowblade_adv },
      { ...promo.beastmaster }
    ],
    priest: [
      { ...promo.archbishop },
      { ...promo.inquisitor }
    ],
    assassin: [
      { ...promo.phantomblade },
      { ...promo.venomancer }
    ],
    vampire: [
      { ...promo.bloodlord_adv },
      { ...promo.nightstalker }
    ],
    druid: [
      { ...promo.nature_guardian },
      { ...promo.primal_beast }
    ],
    puppeteer: [
      { ...promo.iron_machinist },
      { ...promo.soul_weaver }
    ]
  };
  return map[baseId] || [];
}
const PROMOTION_DETAILS = {
  berserker: { id: "berserker", name: "狂战士", icon: "🔥", desc: "暴怒的战斗机器，以血换力。", stat: { hp: 230, atk: 35, matk: 5, def: 10, spd: 10, crit: 10, critDmg: 70 }, passive: { id: "promo_berserker", name: "🔥 血怒", rarity: "mythic", desc: "HP低于50%时伤害{+25%|red}", passive: "berserker_rage" }, newSkills: [{ name: "嗜血斩", desc: "猛烈一击，吸取25%伤害为HP" }, { name: "狂暴", desc: "攻击+30%暴击+15%，受伤+10%，3回合" }] },
  paladin: { id: "paladin", name: "圣骑士", icon: "⚜️", desc: "神圣的守护者，以信仰为盾。", stat: { hp: 270, atk: 20, matk: 20, def: 20, spd: 10, crit: 5, critDmg: 55 }, passive: { id: "promo_paladin", name: "⚜️ 圣盾", rarity: "mythic", desc: "溢出治疗转为{40%|green}护盾", passive: "holy_shield" }, newSkills: [{ name: "神圣打击", desc: "神圣伤害+为全队恢复少量HP" }, { name: "圣光庇护", desc: "全队护盾+伤害减免20%，持续2回合" }] },
  archmage_adv: { id: "archmage_adv", name: "大法师", icon: "💫", desc: "极致的元素毁灭者。", stat: { hp: 145, atk: 5, matk: 40, def: 5, spd: 10, crit: 10, critDmg: 65 }, passive: { id: "promo_archmage", name: "💫 奥术增幅", rarity: "mythic", desc: "法术伤害永久{+12%|red}", passive: "arcane_surge" }, newSkills: [{ name: "奥术弹幕", desc: "4段奥术能量轰击单体" }, { name: "炼狱烈焰", desc: "群体烈焰+灼烧3回合" }] },
  chronomancer: { id: "chronomancer", name: "时空法师", icon: "⏳", desc: "操纵时间的奥秘掌控者。", stat: { hp: 155, atk: 5, matk: 30, def: 10, spd: 15, crit: 10, critDmg: 55 }, passive: { id: "promo_chronomancer", name: "⏳ 时间扭曲", rarity: "mythic", desc: "击杀敌人时所有冷却{-1|gold}回合", passive: "temporal_distortion" }, newSkills: [{ name: "时间锁定", desc: "冻结单体2回合+减速全体" }, { name: "时光回溯", desc: "回复自身30%最大HP+重置1个CD" }] },
  shadowblade_adv: { id: "shadowblade_adv", name: "神射手", icon: "🎯", desc: "锁定弱点，以穿云箭术持续击穿强敌。", stat: { hp: 185, atk: 34, matk: 5, def: 12, spd: 20, crit: 15, critDmg: 65 }, passive: { id: "promo_shadowblade", name: "🎯 百步穿杨", rarity: "mythic", desc: "单体伤害技能额外无视{25%防御|blue}；攻击猎杀标记目标时伤害{+15%|red}", passive: "lethality" }, newSkills: [{ name: "贯星箭", desc: "造成{1.8倍攻击|red}伤害并无视{35%防御|blue}；目标被标记时伤害{+20%|red}" }, { name: "稳固瞄准", desc: "接下来两次单体伤害技能伤害{+25%|red}" }] },
  beastmaster: { id: "beastmaster", name: "风行者", icon: "💨", desc: "驾驭疾风，以连射、弹射和箭雨覆盖战场。", stat: { hp: 210, atk: 28, matk: 8, def: 13, spd: 15, crit: 10, critDmg: 60 }, passive: { id: "promo_beastmaster", name: "💨 疾风箭阵", rarity: "mythic", desc: "每累计命中{8次|purple}，自动对全体敌人追加{0.6倍攻击|red}伤害；箭阵不参与累计", passive: "wild_bond" }, newSkills: [{ name: "弹射箭", desc: "射出{4支箭|purple}，每支造成{0.45倍攻击|red}伤害；多目标时优先分散命中" }, { name: "乘风连射", desc: "接下来两次多段技能额外增加{1段攻击|purple}" }] },
  archbishop: { id: "archbishop", name: "大主教", icon: "🏛️", desc: "至高的治愈者，圣光之源。", stat: { hp: 200, atk: 5, matk: 30, def: 10, spd: 10, crit: 5, critDmg: 50 }, passive: { id: "promo_archbishop", name: "🏛️ 圣光恩泽", rarity: "mythic", desc: "所有治疗效果{+20%|green}", passive: "divine_grace" }, newSkills: [{ name: "强效治疗", desc: "大量治疗单体+护盾" }, { name: "圣域", desc: "全队伤害减免+20%+再生，持续3回合" }] },
  inquisitor: { id: "inquisitor", name: "审判官", icon: "⚖️", desc: "以圣光为剑的裁决者。", stat: { hp: 165, atk: 15, matk: 30, def: 10, spd: 15, crit: 10, critDmg: 60 }, passive: { id: "promo_inquisitor", name: "⚖️ 审判之光", rarity: "mythic", desc: "造成伤害的{15%|green}治疗最低HP队友", passive: "judgment_heal" }, newSkills: [{ name: "审判", desc: "神圣伤害+对亡灵额外50%" }, { name: "神圣之火", desc: "全体神圣伤害+灼烧2回合" }] },
  phantomblade: { id: "phantomblade", name: "幻影刺客", icon: "👻", desc: "残影幻灭，刃舞无双。", stat: { hp: 145, atk: 35, matk: 5, def: 5, spd: 20, crit: 25, critDmg: 90 }, passive: { id: "promo_phantomblade", name: "👻 幻影连斩", rarity: "mythic", desc: "击杀敌人时立即获得{额外行动|gold}", passive: "phantom_chain" }, newSkills: [{ name: "幻影突袭", desc: "瞬移至目标背后，造成{2.2倍攻击|red}伤害，无视{30%防御|blue}" }, { name: "刃风暴", desc: "对全体连击{3次|purple}，每次{0.6倍攻击|red}，每击{20%|blue}概率闪避下次攻击" }] },
  venomancer: { id: "venomancer", name: "毒影师", icon: "☠️", desc: "万毒之源，无声蚀骨。", stat: { hp: 170, atk: 30, matk: 10, def: 10, spd: 20, crit: 20, critDmg: 70 }, passive: { id: "promo_venomancer", name: "☠️ 万毒归宗", rarity: "mythic", desc: "中毒目标每层额外受到{8%|red}伤害", passive: "venom_mastery" }, newSkills: [{ name: "瘟疫扩散", desc: "对全体施加{剧毒|green}{3回合|yellow}（每回合{0.4倍攻击|red}），已中毒目标额外{+1层|purple}" }, { name: "毒爆", desc: "引爆目标身上所有毒素，每层中毒造成{0.8倍攻击|red}伤害并{消耗|yellow}毒层" }] },
  bloodlord_adv: { id: "bloodlord_adv", name: "血族领主", icon: "🩸", desc: "永生血族的统治者，以鲜血为铠。", stat: { hp: 220, atk: 30, matk: 15, def: 15, spd: 15, crit: 10, critDmg: 65 }, passive: { id: "promo_blood_lord", name: "🩸 血族支配", rarity: "mythic", desc: "所有吸血效果{+15%|green}，击杀回复{15%生命|green}", passive: "blood_dominion" }, newSkills: [{ name: "猩红盛宴", desc: "对单体造成{1.4倍攻击|red}伤害，吸血{35%|green}，溢出治疗转{护盾|blue}" }, { name: "血池", desc: "全队回复{0.5倍攻击|green}生命，自身额外回复{0.3倍|green}" }] },
  nightstalker: { id: "nightstalker", name: "夜行者", icon: "🌑", desc: "暗夜中无声掠食的猎手。", stat: { hp: 155, atk: 30, matk: 10, def: 10, spd: 20, crit: 20, critDmg: 80 }, passive: { id: "promo_nightstalker", name: "🌑 暗夜猎手", rarity: "mythic", desc: "暴击时{+15能量|blue}，速度{+15%|green}", passive: "night_hunter" }, newSkills: [{ name: "暗影獠牙", desc: "无视{25%防御|blue}造成{1.8倍攻击|red}伤害，潜行中{必定暴击|red}" }, { name: "暗夜帷幕", desc: "进入{潜行|blue}{2回合|yellow}，全队{闪避+20%|blue}{2回合|yellow}" }] },
  nature_guardian: { id: "nature_guardian", name: "自然守护者", icon: "🛡️", desc: "大地的铁壁，以生命之力守护万物。", stat: { hp: 310, atk: 20, matk: 10, def: 20, spd: 10, crit: 5, critDmg: 50 }, passive: { id: "promo_nature_guardian", name: "🛡️ 大地壁垒", rarity: "mythic", desc: "战斗开始最大HP{+20%|green}，受击{15%概率|blue}获得{5%最大HP护盾|green}", passive: "earth_bulwark" }, newSkills: [{ name: "铁木护甲", desc: "自身获得{15%最大生命|blue}护盾+{嘲讽|purple}全体敌人{2回合|yellow}" }, { name: "纠缠根须", desc: "对全体敌人造成{8%最大生命|red}伤害，{30%概率|purple}眩晕{1回合|yellow}+{减速|blue}{2回合|yellow}" }] },
  primal_beast: { id: "primal_beast", name: "原始野兽", icon: "🐻", desc: "化身远古巨兽，以蛮力碾碎一切。", stat: { hp: 270, atk: 30, matk: 10, def: 15, spd: 10, crit: 10, critDmg: 60 }, passive: { id: "promo_primal_beast", name: "🐻 原始狂怒", rarity: "mythic", desc: "击杀敌人回复{15%最大HP|green}，荆棘反弹{+50%|red}", passive: "primal_rage" }, newSkills: [{ name: "野蛮打击", desc: "以蛮力重击目标，造成{1.4倍攻击|red}伤害+{破甲|purple}{2回合|yellow}" }, { name: "野兽咆哮", desc: "狂暴咆哮，{攻击+30%|red}、{防御+20%|blue}持续{3回合|yellow}，全队{攻击+10%|red}{2回合|yellow}" }] },
  iron_machinist: { id: "iron_machinist", name: "铁卫机师", icon: "⚙️", desc: "将傀儡锻成移动城墙，以替身与反制守住阵线。", stat: { hp: 215, atk: 6, matk: 40, def: 17, crit: 8, critDmg: 55 }, passive: { id: "promo_iron_machinist", name: "⚙️ 钢躯机关", rarity: "mythic", desc: "傀儡最大生命{+25%|green}、防御{+30%|blue}，开局获得{20%生命护盾|blue}", passive: "steel_puppet" }, newSkills: [{ name: "震荡令", desc: "傀儡重击目标并有35%概率眩晕" }, { name: "堡垒协议", desc: "修复傀儡、获得护盾并强化主人" }] },
  soul_weaver: { id: "soul_weaver", name: "魂线演师", icon: "🎭", desc: "以灵魂丝线编排连击，让每条指令彼此呼应。", stat: { hp: 185, atk: 5, matk: 48, def: 12, crit: 12, critDmg: 60 }, passive: { id: "promo_soul_weaver", name: "🎭 魂线共鸣", rarity: "mythic", desc: "攻击指令伤害{+18%|red}，每次攻击指令后修复傀儡{4%生命|green}", passive: "soul_thread" }, newSkills: [{ name: "魂线弹幕", desc: "傀儡对单体连续攻击3次" }, { name: "献演终幕", desc: "傀儡消耗生命对全体造成高额伤害" }] }
};
for (const promotion of Object.values(PROMOTION_DETAILS)) {
  delete promotion.stat.spd;
}
const PROMOTION_STAT_BUDGET = Object.freeze({
  paladin: { hp: 210, atk: 18, matk: 16, def: 16 },
  archmage_adv: { hp: 150, atk: 4, matk: 42, def: 7 },
  chronomancer: { hp: 175, atk: 5, matk: 30, def: 10 },
  shadowblade_adv: { hp: 185, atk: 34, matk: 5, def: 12 },
  beastmaster: { hp: 210, atk: 28, matk: 8, def: 13 },
  archbishop: { hp: 200, atk: 4, matk: 34, def: 11 },
  inquisitor: { hp: 180, atk: 16, matk: 30, def: 9 },
  phantomblade: { hp: 155, atk: 38, matk: 3, def: 9 },
  bloodlord_adv: { hp: 210, atk: 28, matk: 18, def: 10 },
  nightstalker: { hp: 180, atk: 32, matk: 6, def: 13 },
  nature_guardian: { hp: 260, atk: 20, matk: 8, def: 16 },
  primal_beast: { hp: 240, atk: 32, matk: 6, def: 12 },
  iron_machinist: { hp: 215, atk: 6, matk: 40, def: 17 },
  soul_weaver: { hp: 185, atk: 5, matk: 48, def: 12 }
});
for (const [id, statBudget] of Object.entries(PROMOTION_STAT_BUDGET)) {
  Object.assign(PROMOTION_DETAILS[id].stat, statBudget);
}
PROMOTION_DETAILS.chronomancer.newSkills[0].desc = "冻结单体2回合";
PROMOTION_DETAILS.nature_guardian.newSkills[1].desc = "对全体造成8%最大生命伤害，30%概率眩晕1回合";
PROMOTION_DETAILS.nightstalker.passive.desc = "暴击时{+15能量|blue}";
const PROMOTION_SKILLS = {
  bk_bloodstrike: { id: "bk_bloodstrike", name: "嗜血斩", desc: "猛烈一击，吸取25%实际伤害为HP", cost: 20, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 1.5, statKey: "atk", lifestealPct: 0.25 }] },
  bk_frenzy: { id: "bk_frenzy", name: "狂暴", desc: "攻击+30%暴击+15%，受伤+10%，3回合", cost: 25, cooldown: 4, targets: "self", effects: [{ type: "buff", buffId: "bk_frenzy_buff", turns: 3 }] },
  pd_holy_strike: { id: "pd_holy_strike", name: "神圣打击", desc: "神圣伤害+为全队恢复少量HP", cost: 22, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 1.1, statKey: "atk" }, { type: "heal", coeff: 0.3, statKey: "matk", targets: "party" }] },
  pd_divine_aegis: { id: "pd_divine_aegis", name: "圣光庇护", desc: "全队护盾+伤害减免20%，持续2回合", cost: 30, cooldown: 4, targets: "party", effects: [{ type: "shield", coeff: 0.5, statKey: "def" }, { type: "buff", buffId: "fortify", turns: 2 }] },
  am_arcane_barrage: { id: "am_arcane_barrage", name: "奥术弹幕", desc: "4段奥术能量轰击单体", cost: 28, cooldown: 3, targets: "single", effects: [{ type: "damage", coeff: 0.55, statKey: "matk", hits: 4 }] },
  am_inferno: { id: "am_inferno", name: "炼狱烈焰", desc: "群体烈焰+灼烧3回合", cost: 30, cooldown: 3, targets: "all", effects: [{ type: "damage", coeff: 1.2, statKey: "matk" }, { type: "dot", buffId: "burn", turns: 3, dmgCoeff: 0.35 }] },
  ch_time_lock: { id: "ch_time_lock", name: "时间锁定", desc: "冻结单体2回合", cost: 28, cooldown: 4, targets: "single", effects: [{ type: "stun", chance: 1, turns: 2 }] },
  ch_rewind: { id: "ch_rewind", name: "时光回溯", desc: "回复自身30%最大HP+重置1个CD", cost: 25, cooldown: 5, targets: "self", effects: [{ type: "heal", coeff: 0.3, statKey: "hp", useMaxHp: true }, { type: "buff", buffId: "ch_rewind_buff", turns: 1 }] },
  sb_backstab: { id: "sb_backstab", name: "贯星箭", desc: "造成{1.8倍攻击|red}伤害并无视{35%防御|blue}；目标被标记时伤害{+20%|red}", cost: 28, cooldown: 3, targets: "single", effects: [{ type: "damage", coeff: 1.8, statKey: "atk", armorPen: 0.35, bonusIfTargetBuff: "ranger_mark", bonusMul: 1.2 }] },
  sb_vanish: { id: "sb_vanish", name: "稳固瞄准", desc: "接下来两次单体伤害技能伤害{+25%|red}", cost: 18, cooldown: 4, targets: "self", effects: [{ type: "buff", buffId: "sharpshooter_aim", turns: 3, stacks: 2 }] },
  bm_feral_strike: { id: "bm_feral_strike", name: "弹射箭", desc: "射出{4支箭|purple}，每支造成{0.45倍攻击|red}伤害；多目标时优先分散命中", cost: 24, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 0.45, statKey: "atk", hits: 4, distributedHits: true }] },
  bm_natures_blessing: { id: "bm_natures_blessing", name: "乘风连射", desc: "接下来两次多段技能额外增加{1段攻击|purple}", cost: 20, cooldown: 4, targets: "self", effects: [{ type: "buff", buffId: "wind_volley", turns: 3, stacks: 2 }] },
  ab_greater_heal: { id: "ab_greater_heal", name: "强效治疗", desc: "大量治疗单体+护盾", cost: 28, cooldown: 2, targets: "party_single", effects: [{ type: "heal", coeff: 1.8, statKey: "matk" }, { type: "shield", coeff: 0.4, statKey: "matk" }] },
  ab_sanctuary: { id: "ab_sanctuary", name: "圣域", desc: "全队伤害减免+20%+再生，持续3回合", cost: 30, cooldown: 5, targets: "party", effects: [{ type: "buff", buffId: "fortify", turns: 3 }, { type: "buff", buffId: "regen", turns: 3 }] },
  iq_judgment: { id: "iq_judgment", name: "审判", desc: "神圣伤害+对亡灵额外50%", cost: 22, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 1.5, statKey: "matk", bonusTag: "undead", bonusMul: 1.5 }] },
  iq_holy_fire: { id: "iq_holy_fire", name: "神圣之火", desc: "全体神圣伤害+灼烧2回合", cost: 28, cooldown: 3, targets: "all", effects: [{ type: "damage", coeff: 0.9, statKey: "matk" }, { type: "dot", buffId: "burn", turns: 2, dmgCoeff: 0.3 }] },
  pb_phantom_strike: { id: "pb_phantom_strike", name: "幻影突袭", desc: "瞬移至目标背后，造成{2.2倍攻击|red}伤害，无视{30%防御|blue}", cost: 28, cooldown: 3, targets: "single", effects: [{ type: "damage", coeff: 2.2, statKey: "atk", armorPen: 0.3 }] },
  pb_blade_storm: { id: "pb_blade_storm", name: "刃风暴", desc: "对全体连击{3次|purple}，每次{0.6倍攻击|red}，每击{20%|blue}概率闪避下次攻击", cost: 30, cooldown: 4, targets: "all", effects: [{ type: "damage", coeff: 0.6, statKey: "atk", hits: 3, onHitDodgeChance: 0.2 }] },
  vm_plague: { id: "vm_plague", name: "瘟疫扩散", desc: "对全体施加{剧毒|green}{3回合|yellow}，已中毒目标额外{+1层|purple}", cost: 28, cooldown: 3, targets: "all", effects: [{ type: "dot", buffId: "poison", turns: 3, dmgCoeff: 0.4 }] },
  vm_toxin_burst: { id: "vm_toxin_burst", name: "毒爆", desc: "引爆目标身上所有毒素，每层中毒造成{0.8倍攻击|red}伤害并{消耗|yellow}毒层", cost: 25, cooldown: 3, targets: "single", effects: [{ type: "damage", coeff: 0.8, statKey: "atk", consumeDot: "poison" }] },
  bl_crimson_feast: { id: "bl_crimson_feast", name: "猩红盛宴", desc: "对单体造成{1.4倍攻击|red}伤害，吸血{35%|green}，溢出治疗转{护盾|blue}", cost: 24, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 1.4, statKey: "atk", lifestealPct: 0.35, overflowShield: true }] },
  bl_blood_pool: { id: "bl_blood_pool", name: "血池", desc: "全队回复{0.5倍攻击|green}生命，自身额外回复{0.3倍|green}", cost: 28, cooldown: 4, targets: "party", effects: [{ type: "heal", coeff: 0.5, statKey: "atk" }, { type: "heal", coeff: 0.3, statKey: "atk", selfOnly: true }] },
  ns_shadow_fang: { id: "ns_shadow_fang", name: "暗影獠牙", desc: "无视{25%防御|blue}造成{1.8倍攻击|red}伤害，潜行中{必定暴击|red}", cost: 26, cooldown: 3, targets: "single", effects: [{ type: "damage", coeff: 1.8, statKey: "atk", armorPen: 0.25, autocritIf: "sb_stealth" }] },
  ns_night_veil: { id: "ns_night_veil", name: "暗夜帷幕", desc: "进入{潜行|blue}{2回合|yellow}，全队{闪避+20%|blue}{2回合|yellow}", cost: 22, cooldown: 4, targets: "self", effects: [{ type: "buff", buffId: "sb_stealth", turns: 2 }, { type: "buff", buffId: "ns_night_veil_buff", turns: 2, targets: "party" }] },
  ng_ironbark: { id: "ng_ironbark", name: "铁木护甲", desc: "自身获得{15%最大生命|blue}护盾+{嘲讽|purple}全体敌人{2回合|yellow}", cost: 25, cooldown: 3, targets: "self", effects: [{ type: "shield", coeff: 0.15, statKey: "maxHp" }, { type: "buff", buffId: "taunt", turns: 2 }] },
  ng_entangle: { id: "ng_entangle", name: "纠缠根须", desc: "对全体敌人造成{8%最大生命|red}伤害，{30%概率|purple}眩晕{1回合|yellow}", cost: 26, cooldown: 3, targets: "all", effects: [{ type: "damage", coeff: 0.08, statKey: "maxHp" }, { type: "stun", chance: 0.3, turns: 1 }] },
  pb_savage_strike: { id: "pb_savage_strike", name: "野蛮打击", desc: "以蛮力重击目标，造成{1.4倍攻击|red}伤害+{破甲|purple}{2回合|yellow}", cost: 22, cooldown: 2, targets: "single", effects: [{ type: "damage", coeff: 1.4, statKey: "atk" }, { type: "debuff", buffId: "armor_break", turns: 2 }] },
  pb_feral_roar: { id: "pb_feral_roar", name: "野兽咆哮", desc: "攻击+30%、防御+20%持续3回合，全队攻击+10%持续2回合", cost: 25, cooldown: 4, targets: "self", effects: [{ type: "buff", buffId: "pb_feral_roar_buff", turns: 3 }, { type: "buff", buffId: "pb_roar_party_buff", turns: 2, targets: "party" }] },
  im_shock_order: { id: "im_shock_order", name: "震荡令", desc: "傀儡造成{1.45倍法强|red}伤害，35%概率眩晕1回合", cost: 22, cooldown: 2, targets: "single", effects: [], puppetCommand: { type: "strike", coeff: 1.45, stunChance: 0.35, stunTurns: 1 } },
  im_bulwark_protocol: { id: "im_bulwark_protocol", name: "堡垒协议", desc: "修复傀儡20%生命、获得35%生命护盾并嘲讽；主人获得坚韧2回合", cost: 26, cooldown: 4, targets: "self", effects: [], puppetCommand: { type: "bulwark", healPct: 0.2, shieldPct: 0.35, turns: 2, ownerFortifyTurns: 2 } },
  sw_soul_barrage: { id: "sw_soul_barrage", name: "魂线弹幕", desc: "傀儡连续3次造成{0.72倍法强|red}伤害", cost: 24, cooldown: 2, targets: "single", effects: [], puppetCommand: { type: "strike", coeff: 0.72, hits: 3 } },
  sw_sacrifice: { id: "sw_sacrifice", name: "献演终幕", desc: "傀儡消耗12%最大生命，对全体造成{1.25倍法强|red}伤害（不会自毁）", cost: 28, cooldown: 3, targets: "all", effects: [], puppetCommand: { type: "sacrifice", coeff: 1.25, aoe: true, healthCostPct: 0.12 } }
};
const PROMOTION_SKILL_LAYOUT = {
  berserker: ["w_slash", "w_shield_bash", "bk_bloodstrike", "bk_frenzy", "w_armor_break", "w_warcry", "w_ult"],
  paladin: ["w_slash", "w_shield_bash", "w_taunt", "pd_holy_strike", "pd_divine_aegis", "w_warcry", "w_ult"],
  archmage_adv: ["m_bolt", "m_fireball", "m_frost", "m_lightning", "am_arcane_barrage", "am_inferno", "m_ult"],
  chronomancer: ["m_bolt", "ch_time_lock", "m_frost", "ch_rewind", "m_shield", "m_resonance", "m_ult"],
  shadowblade_adv: ["r_shot", "r_rapid", "sb_backstab", "r_pierce", "sb_vanish", "r_mark", "r_ult"],
  beastmaster: ["r_shot", "r_rapid", "bm_feral_strike", "r_pierce", "r_dodge", "bm_natures_blessing", "r_ult"],
  archbishop: ["p_smite", "p_heal", "p_prayer", "p_dispel", "ab_greater_heal", "ab_sanctuary", "p_ult"],
  inquisitor: ["p_smite", "iq_judgment", "iq_holy_fire", "p_dispel", "p_holy", "p_bless", "p_ult"],
  phantomblade: ["a_stab", "a_backstab", "pb_phantom_strike", "a_shadow", "a_expose", "pb_blade_storm", "a_ult"],
  venomancer: ["a_stab", "a_venom", "vm_plague", "a_expose", "vm_toxin_burst", "a_shadow", "a_ult"],
  bloodlord_adv: ["v_claw", "v_thirst", "bl_crimson_feast", "v_siphon", "bl_blood_pool", "v_pact", "v_ult"],
  nightstalker: ["v_claw", "v_mist", "ns_shadow_fang", "v_eruption", "ns_night_veil", "v_thirst", "v_ult"],
  nature_guardian: ["d_strike", "d_thorns", "d_bear", "ng_ironbark", "ng_entangle", "d_nature_slam", "d_ult"],
  primal_beast: ["d_strike", "pb_savage_strike", "d_bear", "d_hawk", "pb_feral_roar", "d_swarm", "d_ult"],
  iron_machinist: ["u_thread", "im_shock_order", "u_guard_order", "u_shift", "u_rebuild", "im_bulwark_protocol", "u_ult"],
  soul_weaver: ["u_thread", "sw_soul_barrage", "u_break_order", "u_rebuild", "u_overdrive", "sw_sacrifice", "u_ult"]
};
const PROMOTION_BASE_CLASS = {
  berserker: "warrior",
  paladin: "warrior",
  archmage_adv: "mage",
  chronomancer: "mage",
  shadowblade_adv: "ranger",
  beastmaster: "ranger",
  archbishop: "priest",
  inquisitor: "priest",
  phantomblade: "assassin",
  venomancer: "assassin",
  bloodlord_adv: "vampire",
  nightstalker: "vampire",
  nature_guardian: "druid",
  primal_beast: "druid",
  iron_machinist: "puppeteer",
  soul_weaver: "puppeteer"
};
const PROMOTION_GROWTH_ATTRIBUTES = Object.freeze({
  berserker: { str: 2, agi: 0.7, int: 0, con: 1.3 },
  paladin: { str: 1.2, agi: 1.2, int: 0.3, con: 1.3 },
  archmage_adv: { str: 0, agi: 0, int: 2.6, con: 1.1 },
  chronomancer: { str: 0.1, agi: 0.5, int: 2.2, con: 0.9 },
  shadowblade_adv: { str: 2, agi: 1.1, int: 0, con: 0.7 },
  beastmaster: { str: 1.5, agi: 1.1, int: 0.1, con: 1.1 },
  archbishop: { str: 0.1, agi: 0.8, int: 2.1, con: 0.8 },
  inquisitor: { str: 0.7, agi: 1, int: 1.7, con: 0.4 },
  phantomblade: { str: 2.1, agi: 0.7, int: 0, con: 0.8 },
  venomancer: { str: 1.4, agi: 0.7, int: 0.7, con: 0.8 },
  bloodlord_adv: { str: 1.5, agi: 0.5, int: 0.7, con: 1.2 },
  nightstalker: { str: 1.9, agi: 0.8, int: 0.4, con: 0.8 },
  nature_guardian: { str: 1, agi: 1.1, int: 0.1, con: 1.8 },
  primal_beast: { str: 1.8, agi: 0.6, int: 0.1, con: 1.5 },
  iron_machinist: { str: 0.1, agi: 1.2, int: 2, con: 1.4 },
  soul_weaver: { str: 0, agi: 0.7, int: 2.7, con: 0.9 }
});
const TIER2_GROWTH_ATTRIBUTES = Object.freeze({
  doombringer: { str: 2.2, agi: 0.6, int: 0, con: 1.7 },
  templar_guardian: { str: 1.1, agi: 1.6, int: 0.5, con: 1.3 },
  elemental_overlord: { str: 0, agi: 0.1, int: 3, con: 1.1 },
  time_lord: { str: 0.2, agi: 0.8, int: 2.3, con: 0.9 },
  shadow_hunter_king: { str: 2.3, agi: 1.3, int: 0, con: 0.7 },
  beast_king: { str: 1.7, agi: 1.2, int: 0.1, con: 1.3 },
  formless_blade_saint: { str: 2.5, agi: 0.9, int: 0, con: 0.7 },
  calamity_poison_king: { str: 1.5, agi: 0.8, int: 1.1, con: 0.7 },
  holy_pope: { str: 0.1, agi: 0.9, int: 2.4, con: 0.9 },
  divine_judge: { str: 0.9, agi: 1.1, int: 1.9, con: 0.4 },
  blood_progenitor: { str: 1.7, agi: 0.5, int: 0.8, con: 1.4 },
  eternal_night_king: { str: 2.3, agi: 0.9, int: 0.4, con: 0.8 },
  world_tree_guardian: { str: 0.9, agi: 1.3, int: 0.1, con: 2.2 },
  ancient_beast_god: { str: 2.2, agi: 0.7, int: 0.1, con: 1.5 },
  clockwork_bastion: { str: 0.1, agi: 1.6, int: 2.1, con: 1.6 },
  puppet_emperor: { str: 0, agi: 0.8, int: 3, con: 0.9 }
});
const TIER2_PROMOTION_FLOOR = 30;
const TIER2_DETAILS = {
  doombringer: {
    id: "doombringer",
    parent: "berserker",
    name: "末日狂战",
    icon: "🔥",
    desc: "将血怒锻成终焉之火，越战越勇的毁灭者。",
    statScale: { hp: 0.1, atk: 0.2, crit: 0.1, critDmg: 0.15 },
    passive: { id: "tier2_doombringer", name: "🔥 终焉血怒", rarity: "mythic", desc: "攻击力{+15%|red}，暴击伤害{+15%|red}", mechanicDesc: "每战首次低于35%生命立即行动；接下来3次技能不耗能量，改耗当前生命8%且伤害+35%（不会自杀）", passive: "tier2_doombringer_mechanic", fixedStatMod: { atkPct: 0.15, critDmgPct: 0.15 } }
  },
  templar_guardian: {
    id: "templar_guardian",
    parent: "paladin",
    name: "圣堂守护者",
    icon: "🛡️",
    desc: "以不灭圣盾庇护同伴，正面战场的绝对壁垒。",
    statScale: { hp: 0.15, matk: 0.1, def: 0.15 },
    passive: { id: "tier2_templar_guardian", name: "🛡️ 永恒圣域", rarity: "mythic", desc: "生命值{+15%|green}，防御{+15%|blue}", mechanicDesc: "每战首次有队友受到致命伤时，使其保留1生命并获得30%最大生命+1.5倍守护者防御的护盾", passive: "tier2_templar_guardian_mechanic", fixedStatMod: { hpPct: 0.15, defPct: 0.15 } }
  },
  elemental_overlord: {
    id: "elemental_overlord",
    parent: "archmage_adv",
    name: "元素主宰",
    icon: "🧬",
    desc: "统御元素浪流，以无尽魔力碾压一切。",
    statScale: { hp: 0.1, matk: 0.2, energyRegen: 0.2 },
    passive: { id: "tier2_elemental_overlord", name: "🧬 元素权柄", rarity: "mythic", desc: "法术强度{+20%|blue}，能量上限{+25|blue}，能量回复{+5|blue}", mechanicDesc: "集齐火、冰、雷三种技能后触发元素坍缩：全体真实伤害（5%目标生命、上限1.8倍法强）并使自身全部冷却-1", passive: "tier2_elemental_overlord_mechanic", fixedStatMod: { matkPct: 0.2, energy: 25, energyRegen: 5 } }
  },
  time_lord: {
    id: "time_lord",
    parent: "chronomancer",
    name: "时空领主",
    icon: "⏳",
    desc: "驾驭时间与空间，让战局依照意志运转。",
    statScale: { hp: 0.1, matk: 0.15 },
    passive: { id: "tier2_time_lord", name: "⏳ 时间主宰", rarity: "mythic", desc: "能量上限{+30|blue}，防御{+10%|blue}", mechanicDesc: "行动开始记录时之锚；每战首次死亡时恢复该时刻生命、能量和冷却，并立即行动", passive: "tier2_time_lord_mechanic", fixedStatMod: { energy: 30, defPct: 0.1 } }
  },
  shadow_hunter_king: {
    id: "shadow_hunter_king",
    parent: "shadowblade_adv",
    name: "逐日神弓",
    icon: "☀️",
    desc: "追逐日轮轨迹，以贯日箭贯穿最坚固的防线。",
    statScale: { hp: 0.1, atk: 0.2, crit: 0.05, critDmg: 0.1 },
    passive: { id: "tier2_shadow_hunter_king", name: "☀️ 贯日准星", rarity: "mythic", desc: "攻击力{+15%|red}，暴击率{+5%|red}，暴击伤害{+10%|red}", mechanicDesc: "连续对同一敌人使用4次单体伤害技能后，免费追加1.5倍攻击且无视50%防御的贯日箭；切换目标清空计数", passive: "tier2_shadow_hunter_king_mechanic", fixedStatMod: { atkPct: 0.15, critPct: 0.05, critDmgPct: 0.1 } }
  },
  beast_king: {
    id: "beast_king",
    parent: "beastmaster",
    name: "风暴箭圣",
    icon: "🌪️",
    desc: "让每一轮连射卷成风暴，以万箭覆盖整片战场。",
    statScale: { hp: 0.1, atk: 0.15, def: 0.1 },
    passive: { id: "tier2_beast_king", name: "🌪️ 万箭回响", rarity: "mythic", desc: "生命值{+10%|green}，攻击力{+15%|red}，能量回复{+5|blue}", mechanicDesc: "每回合第一次施放多段伤害技能时，以45%效果免费重复该技能；回响不会再次触发回响或累计疾风箭阵", passive: "tier2_beast_king_mechanic", fixedStatMod: { hpPct: 0.1, atkPct: 0.15, energyRegen: 5 } }
  },
  formless_blade_saint: {
    id: "formless_blade_saint",
    parent: "phantomblade",
    name: "无相剑圣",
    icon: "⚔️",
    desc: "身与剑皆无定形，出手之前胜负已分。",
    statScale: { hp: 0.1, atk: 0.2, critDmg: 0.15 },
    passive: { id: "tier2_formless_blade_saint", name: "⚔️ 无相剑意", rarity: "mythic", desc: "攻击力{+20%|red}", mechanicDesc: "连续使用3个不同的耗能主动技能后，第三式以45%效果免费复现；复现不触发自身", passive: "tier2_formless_blade_saint_mechanic", fixedStatMod: { atkPct: 0.2 } }
  },
  calamity_poison_king: {
    id: "calamity_poison_king",
    parent: "venomancer",
    name: "灾厄毒王",
    icon: "☠️",
    desc: "将万毒炼成灾厄，侵蚀一切生命。",
    statScale: { hp: 0.15, atk: 0.15, matk: 0.2, def: 0.1 },
    passive: { id: "tier2_calamity_poison_king", name: "☠️ 灾厄毒躯", rarity: "mythic", desc: "生命值{+10%|green}，攻击力与法强{+15%|red}", mechanicDesc: "中毒敌人死亡时，将其60%毒层迁徙至最多2个存活敌人（至少1层）", passive: "tier2_calamity_poison_king_mechanic", fixedStatMod: { hpPct: 0.1, atkPct: 0.15, matkPct: 0.15 } }
  },
  holy_pope: {
    id: "holy_pope",
    parent: "archbishop",
    name: "圣光教皇",
    icon: "✨",
    desc: "承载圣光意志，为队伍带来不竭生机。",
    statScale: { hp: 0.1, matk: 0.15, def: 0.1, energyRegen: 0.15 },
    passive: { id: "tier2_holy_pope", name: "✨ 圣光化身", rarity: "mythic", desc: "法术强度{+15%|blue}，生命值{+15%|green}，能量回复{+5|blue}", mechanicDesc: "每施放3次治疗，使下一次治疗扩展至全队；若有阵亡队友则优先复活1人（每战1次，复活30%生命）", passive: "tier2_holy_pope_mechanic", fixedStatMod: { matkPct: 0.15, hpPct: 0.15, energyRegen: 5 } }
  },
  divine_judge: {
    id: "divine_judge",
    parent: "inquisitor",
    name: "神罚审判者",
    icon: "⚖️",
    desc: "代行神罚，以裁决之力净化强敌。",
    statScale: { hp: 0.1, atk: 0.2, matk: 0.2, crit: 0.1 },
    passive: { id: "tier2_divine_judge", name: "⚖️ 神罚代行", rarity: "mythic", desc: "攻击力与法强{+15%|red}，暴击率{+5%|red}", mechanicDesc: "伤害技能叠加罪业；4层清算造成最大生命6%且上限1.5倍较高攻/法强的真实伤害，并治疗最低生命友方60%较高攻/法强", passive: "tier2_divine_judge_mechanic", fixedStatMod: { atkPct: 0.15, matkPct: 0.15, critPct: 0.05 } }
  },
  blood_progenitor: {
    id: "blood_progenitor",
    parent: "bloodlord_adv",
    name: "血祖",
    icon: "🩸",
    desc: "唤醒始祖血脉，以不灭生命支配战场。",
    statScale: { hp: 0.2, atk: 0.15, def: 0.2 },
    passive: { id: "tier2_blood_progenitor", name: "🩸 始祖血脉", rarity: "mythic", desc: "生命值{+20%|green}，攻击力{+15%|red}，防御{+10%|blue}", mechanicDesc: "溢出吸血储入血池（上限100%最大生命）；每战首次致死时，血池至少15%生命则消耗血池复活，复活最多35%生命，余量转为护盾（最多50%生命）", passive: "tier2_blood_progenitor_mechanic", fixedStatMod: { hpPct: 0.2, atkPct: 0.15, defPct: 0.1 } }
  },
  eternal_night_king: {
    id: "eternal_night_king",
    parent: "nightstalker",
    name: "永夜君王",
    icon: "🌑",
    desc: "让永夜笼罩高塔，在黑暗中极速猎杀。",
    statScale: { hp: 0.1, atk: 0.25, crit: 0.15 },
    passive: { id: "tier2_eternal_night_king", name: "🌑 永夜狩猎", rarity: "mythic", desc: "攻击力{+15%|red}，暴击率{+10%|red}", mechanicDesc: "每回合首次暴击，免费追击当前生命比例最低的敌人，造成60%攻击真实伤害；追击不会连锁", passive: "tier2_eternal_night_king_mechanic", fixedStatMod: { atkPct: 0.15, critPct: 0.1 } }
  },
  world_tree_guardian: {
    id: "world_tree_guardian",
    parent: "nature_guardian",
    name: "世界树守护者",
    icon: "🌳",
    desc: "扎根世界之树，成为无法撼动的生命壁垒。",
    statScale: { hp: 0.2, def: 0.15, matk: 0.1 },
    passive: { id: "tier2_world_tree_guardian", name: "🌳 世界树之躯", rarity: "mythic", desc: "生命值{+20%|green}，防御{+15%|blue}", mechanicDesc: "为队友分担25%生命伤害，分担伤害再降低40%；每回合最多分担自身30%最大生命", passive: "tier2_world_tree_guardian_mechanic", fixedStatMod: { hpPct: 0.2, defPct: 0.15 } }
  },
  ancient_beast_god: {
    id: "ancient_beast_god",
    parent: "primal_beast",
    name: "远古兽神",
    icon: "🐾",
    desc: "重现远古神性，以最纯粹的力量粉碎敌人。",
    statScale: { hp: 0.15, atk: 0.2, def: 0.1, critDmg: 0.15 },
    passive: { id: "tier2_ancient_beast_god", name: "🐾 远古神性", rarity: "mythic", desc: "生命值{+15%|green}，攻击力{+20%|red}，暴击伤害{+15%|red}", mechanicDesc: "集齐熊、鹰、虫群三相后进入3次行动的兽神姿态：受伤-25%，攻击后追加70%较高攻/法强的远古冲击", passive: "tier2_ancient_beast_god_mechanic", fixedStatMod: { hpPct: 0.15, atkPct: 0.2, critDmgPct: 0.15 } }
  },
  clockwork_bastion: {
    id: "clockwork_bastion",
    parent: "iron_machinist",
    name: "不落机城",
    icon: "🏰",
    desc: "让机关傀儡化作永不失守的移动堡垒。",
    statScale: { hp: 0.15, matk: 0.1, def: 0.2 },
    passive: { id: "tier2_clockwork_bastion", name: "🏰 不落机城", rarity: "mythic", desc: "生命值{+15%|green}，防御{+20%|blue}", mechanicDesc: "傀儡护盾每回合首次被击破时，立即重获10%最大生命护盾，并以70%傀儡法强反制攻击者", passive: "tier2_clockwork_bastion_mechanic", fixedStatMod: { hpPct: 0.15, defPct: 0.2 } }
  },
  puppet_emperor: {
    id: "puppet_emperor",
    parent: "soul_weaver",
    name: "万偶帝君",
    icon: "🎭",
    desc: "万千魂线归于一念，以连环指令席卷全场。",
    statScale: { hp: 0.1, matk: 0.2, crit: 0.1 },
    passive: { id: "tier2_puppet_emperor", name: "🎭 万偶齐鸣", rarity: "mythic", desc: "法强{+20%|blue}，暴击率{+10%|red}", mechanicDesc: "每第3次攻击指令额外对全体敌人造成50%傀儡法强伤害", passive: "tier2_puppet_emperor_mechanic", fixedStatMod: { matkPct: 0.2, critPct: 0.1 } }
  }
};
const RANGER_REWORK_TALENT_IDS = /* @__PURE__ */ new Set([
  "t_venom_blast",
  "t_hunter_eye",
  "promo_shadowblade",
  "promo_beastmaster",
  "tier2_shadow_hunter_king",
  "tier2_beast_king"
]);
function normalizeRangerReworkRun(run) {
  if (!run || !Array.isArray(run.talents)) return run;
  const currentDefs = [
    ...DATA.talents,
    PROMOTION_DETAILS.shadowblade_adv.passive,
    PROMOTION_DETAILS.beastmaster.passive,
    TIER2_DETAILS.shadow_hunter_king.passive,
    TIER2_DETAILS.beast_king.passive
  ];
  const byId = new Map(currentDefs.filter((entry) => RANGER_REWORK_TALENT_IDS.has(entry.id)).map((entry) => [entry.id, entry]));
  run.talents = run.talents.map((talent) => {
    const current = byId.get(talent == null ? void 0 : talent.id);
    if (!current) return talent;
    return {
      ...talent,
      ...current,
      ...current.fixedStatMod ? { fixedStatMod: { ...current.fixedStatMod } } : {}
    };
  });
  return run;
}
const TIER2_BY_PARENT = Object.fromEntries(Object.values(TIER2_DETAILS).map((tier2) => [tier2.parent, tier2.id]));
function cloneSkill(skill) {
  return JSON.parse(JSON.stringify(skill));
}
function promotionSkillsFor(optId, baseSkills) {
  const byId = Object.fromEntries((baseSkills || []).map((skill) => [skill.id, skill]));
  const layout = PROMOTION_SKILL_LAYOUT[optId] || (baseSkills || []).map((skill) => skill.id);
  return layout.map((id) => byId[id] || PROMOTION_SKILLS[id]).filter(Boolean).map(cloneSkill);
}
function migratePromotionSkillInvestments(oldSkills, newSkills, run = state.run) {
  var _a, _b;
  if (!run) return;
  initializeSkillState(run);
  const newIds = new Set((newSkills || []).map((skill) => skill.id));
  for (let idx = 0; idx < (oldSkills || []).length; idx += 1) {
    const oldId = (_a = oldSkills[idx]) == null ? void 0 : _a.id;
    const replacementId = (_b = newSkills[idx]) == null ? void 0 : _b.id;
    if (!oldId || !replacementId || oldId === replacementId || newIds.has(oldId)) continue;
    if (run.learnedSkills[oldId]) {
      run.learnedSkills[replacementId] = true;
      run.skillLevels[replacementId] = Math.max(run.skillLevels[replacementId] || 1, run.skillLevels[oldId] || 1);
    }
    run.equippedSkills = (run.equippedSkills || []).map((id) => id === oldId ? replacementId : id);
    const usedBySecondHero = run.dualHeroMode && classHasSkill(run.secondClassId, oldId);
    if (!usedBySecondHero) {
      delete run.learnedSkills[oldId];
      delete run.skillLevels[oldId];
    }
  }
  run.equippedSkills = [...new Set(run.equippedSkills || [])];
}
function ensurePromotionClass(classId) {
  if (!classId || DATA.classes[classId]) return;
  const tier2 = TIER2_DETAILS[classId];
  if (tier2) {
    ensurePromotionClass(tier2.parent);
    const parent = DATA.classes[tier2.parent];
    if (!parent) return;
    const baseStats2 = Object.fromEntries(Object.entries(classBaseStats(parent)).map(([stat, value]) => {
      var _a;
      const scale = ((_a = tier2.statScale) == null ? void 0 : _a[stat]) || 0;
      return [stat, Math.floor(value * (1 + scale) + 0.5000001)];
    }));
    DATA.classes[classId] = {
      id: tier2.id,
      name: tier2.name,
      icon: tier2.icon,
      desc: tier2.desc,
      baseOf: getBaseClassId(tier2.parent),
      baseStats: baseStats2,
      baseAttributes: primaryAttributesFromStats(baseStats2),
      growthAttributes: { ...TIER2_GROWTH_ATTRIBUTES[classId] || parent.growthAttributes || {} },
      skills: (parent.skills || []).map(cloneSkill)
    };
    return;
  }
  const opt = Object.values(PROMOTION_DETAILS).find((entry) => entry.id === classId);
  const baseId = PROMOTION_BASE_CLASS[classId];
  const baseClass = DATA.classes[baseId];
  if (!opt || !baseClass) return;
  const parentBaseStats = classBaseStats(baseClass);
  const baseStats = { ...parentBaseStats, ...opt.stat, energy: parentBaseStats.energy || 100, energyRegen: parentBaseStats.energyRegen || 0 };
  DATA.classes[classId] = {
    id: opt.id,
    name: opt.name,
    icon: opt.icon,
    desc: opt.desc,
    baseOf: baseId,
    baseStats,
    baseAttributes: primaryAttributesFromStats(baseStats),
    growthAttributes: { ...PROMOTION_GROWTH_ATTRIBUTES[classId] || baseClass.growthAttributes || {} },
    skills: promotionSkillsFor(opt.id, baseClass.skills)
  };
}
function promotionCard(opt, idx) {
  const baseStats = classBaseStats(getClass(getBaseClassId(state.run.classId)));
  const statLine = ["hp", "atk", "matk", "def", "crit", "critDmg"].map((s) => {
    const diff = (opt.stat[s] || 0) - (baseStats[s] || 0);
    if (!diff) return "";
    const sign = diff > 0 ? "+" : "";
    return '<span class="stat-chip '.concat(diff > 0 ? "plus" : "minus", '">').concat(STAT_LABEL[s] || s).concat(sign).concat(diff).concat(["crit", "critDmg"].includes(s) ? "%" : "", "</span>");
  }).join("");
  const growthLine = growthAttributeLine(PROMOTION_GROWTH_ATTRIBUTES[opt.id]);
  const skillInfo = (opt.newSkills || []).map((s) => '\n    <div class="promotion-skill">\n      <b>⭐ '.concat(esc(s.name), "</b>\n      <p>").concat(colorText(s.desc || ""), "</p>\n    </div>\n  ")).join("");
  return '\n    <div class="card selectable promotion-card" onclick="choosePromotion('.concat(idx, ')">\n      <div class="big-icon">').concat(opt.icon, "</div>\n      <h3>").concat(opt.name, '</h3>\n      <p class="subtle">').concat(opt.desc, '</p>\n      <div class="promotion-section-title">— 基础属性变化 —</div>\n      <div class="stat-line">').concat(statLine, '</div>\n    <div class="promotion-section-title">— 职业成长 —</div>\n    <div class="stat-line">').concat(growthLine, '</div>\n    <div class="promotion-section-title">— 新技能 —</div>\n      <div class="promotion-skills">').concat(skillInfo || '<p class="subtle">沿用基础职业技能</p>', '</div>\n      <div class="promotion-section-title">— 被动 —</div>\n      <p class="gold promotion-passive">').concat(opt.passive.name, "</p>\n      <p>").concat(colorText(opt.passive.desc), '</p>\n      <button type="button" onclick="event.stopPropagation(); choosePromotion(').concat(idx, ')">选择此路线</button>\n    </div>\n  ');
}
function choosePromotion(idx) {
  const opts = promotionOptions(getBaseClassId(state.run.classId));
  const opt = opts[idx];
  if (!opt) return;
  const old = getClass(state.run.classId);
  const promotedSkills = promotionSkillsFor(opt.id, old.skills);
  const oldBaseStats = classBaseStats(old);
  const baseStats = { ...oldBaseStats, ...opt.stat, energy: 100, energyRegen: oldBaseStats.energyRegen || 0 };
  DATA.classes[opt.id] = {
    id: opt.id,
    name: opt.name,
    icon: opt.icon,
    desc: opt.desc,
    baseOf: getBaseClassId(state.run.classId),
    baseStats,
    baseAttributes: primaryAttributesFromStats(baseStats),
    growthAttributes: { ...PROMOTION_GROWTH_ATTRIBUTES[opt.id] || old.growthAttributes || {} },
    skills: promotedSkills
  };
  migratePromotionSkillInvestments(old.skills, promotedSkills, state.run);
  state.run.classId = opt.id;
  state.run.party[0].classId = opt.id;
  initializeSkillState(state.run);
  state.run.promoted = true;
  state.run.talents.push(opt.passive);
  state.modal = null;
  addRunLog("晋升为 ".concat(opt.icon).concat(opt.name, "。"));
  refreshPartyHpCaps();
  maybeFloorTalentThenAdvance();
}
function canTier2Promote() {
  const run = state.run;
  return !!(run && !run.dualHeroMode && run.promoted && !run.tier2Promoted && run.floor >= TIER2_PROMOTION_FLOOR && TIER2_BY_PARENT[run.classId]);
}
function tier2ScaleLine(scale = {}) {
  return Object.entries(scale).map(([stat, value]) => {
    const label = STAT_LABEL[stat] || stat;
    return '<span class="stat-chip plus">'.concat(label, "+").concat(Math.round(value * 100), "%</span>");
  }).join("");
}
function growthAttributeLine(growthAttributes = {}) {
  return PRIMARY_ATTRIBUTE_DEFS.filter((def) => (Number(growthAttributes[def.key]) || 0) > 0).map((def) => '<span class="stat-chip plus">'.concat(def.label, "+").concat(formatPrimaryAttribute(growthAttributes[def.key]), "/级</span>")).join("");
}
function tier2GrowthLine(classId) {
  return growthAttributeLine(TIER2_GROWTH_ATTRIBUTES[classId]);
}
function openTier2PromotionModal() {
  var _a;
  const option = TIER2_DETAILS[TIER2_BY_PARENT[(_a = state.run) == null ? void 0 : _a.classId]];
  if (!option) return maybeFloorTalentThenAdvance();
  const parent = getClass(option.parent);
  state.modal = {
    title: "🌟 二转觉醒",
    body: '\n      <p class="promotion-subtitle">击败第'.concat(TIER2_PROMOTION_FLOOR, '层Boss，职业力量突破极限</p>\n      <div class="selection-grid promotion-grid">\n        <div class="card selectable promotion-card" onclick="chooseTier2Promotion()">\n          <div class="big-icon">').concat(option.icon, '</div>\n          <p class="subtle">').concat(parent.icon).concat(esc(parent.name), " →</p>\n          <h3>").concat(esc(option.name), '</h3>\n          <p class="subtle">').concat(esc(option.desc), '</p>\n          <div class="promotion-section-title">— 二转基础数值倍率 —</div>\n          <div class="stat-line">').concat(tier2ScaleLine(option.statScale), '</div>\n          <div class="promotion-section-title">— 二转职业成长 —</div>\n          <div class="stat-line">').concat(tier2GrowthLine(option.id), '</div>\n          <p class="subtle">按二转路线调整成长；当前主属性 = 转职基础 + 成长×等级</p>\n          <div class="promotion-section-title">— 专属被动 —</div>\n          <p class="gold promotion-passive">').concat(esc(option.passive.name), "</p>\n          <p>").concat(colorText(option.passive.desc), '</p>\n          <p class="subtle">').concat(esc(option.passive.mechanicDesc), '</p>\n          <button type="button" onclick="event.stopPropagation(); chooseTier2Promotion()">确认二转</button>\n        </div>\n      </div>\n    '),
    actions: []
  };
  render();
}
function chooseTier2Promotion() {
  if (!canTier2Promote()) return;
  const option = TIER2_DETAILS[TIER2_BY_PARENT[state.run.classId]];
  if (!option) return;
  ensurePromotionClass(option.id);
  state.run.classId = option.id;
  state.run.party[0].classId = option.id;
  state.run.tier2Promoted = true;
  if (!state.run.talents.some((talent) => talent.id === option.passive.id)) {
    state.run.talents.push({ ...option.passive, icon: option.icon, fixedStatMod: { ...option.passive.fixedStatMod || {} } });
  }
  state.modal = null;
  refreshPartyHpCaps();
  addRunLog("二转觉醒为 ".concat(option.icon).concat(option.name, "。"));
  maybeFloorTalentThenAdvance();
}
function rollFloorTalentCandidates(selectedTalents, guaranteeEpic = false) {
  var _a;
  const candidates = rollTalentCandidates(2, selectedTalents, guaranteeEpic ? 2 : 1);
  const minimumRewardRank = TALENT_RARITY_RANK.epic;
  if (!guaranteeEpic || candidates.some((talent) => (TALENT_RARITY_RANK[talent.rarity] || 0) >= minimumRewardRank)) return candidates;
  const selectedIds = new Set(selectedTalents.map((talent) => talent.id));
  const baseClass = getBaseClassId(((_a = state.run) == null ? void 0 : _a.classId) || state.setup.classId);
  const epicPool = DATA.talents.filter((talent) => {
    var _a2;
    return (TALENT_RARITY_RANK[talent.rarity] || 0) >= minimumRewardRank && !selectedIds.has(talent.id) && (!talent.classReq || talent.classReq === baseClass || talent.classReq === ((_a2 = state.run) == null ? void 0 : _a2.classId));
  });
  const replacement = shuffle(epicPool).find((talent) => !candidates.some((candidate) => candidate.id === talent.id));
  if (replacement) candidates[candidates.length - 1] = replacement;
  return candidates;
}
function openSingleTalentModal(onClose, adRerolled = false) {
  var _a, _b, _c2, _d2;
  const floor = ((_a = state.run) == null ? void 0 : _a.floor) || 0;
  const candidates = rollFloorTalentCandidates(((_b = state.run) == null ? void 0 : _b.talents) || [], adRerolled);
  if (!candidates.length) {
    state.modal = null;
    addRunLog("第".concat(floor, "层觉醒：当前职业的可用天赋已全部掌握，自动前往下一层。"));
    onClose == null ? void 0 : onClose();
    return;
  }
  const rerollUsed = !!((_d2 = (_c2 = state.run) == null ? void 0 : _c2.adTalentRerollFloors) == null ? void 0 : _d2[floor]);
  state.modal = {
    title: "楼层觉醒",
    body: '<div class="selection-grid">'.concat(candidates.map((t) => talentCard(t, "chooseSingleTalent('".concat(t.id, "')"))).join(""), "</div>"),
    actions: rerollUsed || !privacyAllowsNetworkServices() ? [] : [{
      label: "强力刷新（高品质概率↑·必出1史诗）",
      className: "wide",
      onClick: () => claimFloorTalentReroll()
    }],
    data: { candidates, onClose, floor }
  };
  render();
}
function claimFloorTalentReroll() {
  showRewardedAd("floor_talent_reroll", grantFloorTalentReroll);
}
function grantFloorTalentReroll() {
  var _a, _b, _c2;
  const modal = state.modal;
  const floor = (_a = modal == null ? void 0 : modal.data) == null ? void 0 : _a.floor;
  if (!state.run || !floor || ((_b = state.run.adTalentRerollFloors) == null ? void 0 : _b[floor])) return;
  (_c2 = state.run).adTalentRerollFloors || (_c2.adTalentRerollFloors = {});
  state.run.adTalentRerollFloors[floor] = true;
  saveGame();
  openSingleTalentModal(modal.data.onClose, true);
}
function chooseSingleTalent(talentId) {
  var _a, _b;
  const candidates = ((_b = (_a = state.modal) == null ? void 0 : _a.data) == null ? void 0 : _b.candidates) || [];
  const talent = candidates.find((t) => t.id === talentId);
  if (!talent) return;
  state.run.talents.push(talent);
  applyTalentOnPick(talent);
  const cb = state.modal.data.onClose;
  state.modal = null;
  addRunLog("觉醒天赋：".concat(talent.name, "。"));
  cb == null ? void 0 : cb();
}
function upgradeGrowth(id) {
  const def = DATA.growthTree.find((g) => g.id === id);
  if (!def) return;
  const lv = growthLevel(id);
  if (lv >= def.maxLv) return toast("已达上限。");
  const cost = growthCost(def, lv);
  if (state.perm.talentPoints < cost) return toast("天赋点不足，需要 ".concat(cost, "。"));
  state.perm.talentPoints -= cost;
  state.perm.growthLevels[id] = lv + 1;
  saveGame();
  render();
}
function resetGrowth() {
  let refund = 0;
  for (const def of DATA.growthTree) {
    const lv = growthLevel(def.id);
    for (let n = 0; n < lv; n += 1) refund += growthCost(def, n);
  }
  state.perm.growthLevels = {};
  state.perm.talentPoints += refund;
  saveGame();
  toast("已重置成长，返还 ".concat(refund, " 天赋点。"));
  render();
}
function upgradeTalentEnhance(id) {
  var _a;
  const talent = [...DATA.hiddenTalents, ...DATA.talents].find((t) => t.id === id);
  if (!talent) return;
  (_a = state.perm).talentEnhanceLevels || (_a.talentEnhanceLevels = {});
  const lv = talentEnhanceLevel(id);
  if (lv >= TALENT_ENHANCE_MAX_LEVEL) return toast("天赋强化已达上限。");
  const cost = talentEnhanceCost(talent, lv);
  if ((state.perm.talentPoints || 0) < cost) return toast("天赋点不足，需要 ".concat(cost, "。"));
  state.perm.talentPoints -= cost;
  state.perm.talentEnhanceLevels[id] = lv + 1;
  saveGame();
  render();
}
function resetTalentEnhance() {
  let refund = 0;
  for (const [id, lv] of Object.entries(state.perm.talentEnhanceLevels || {})) {
    const talent = [...DATA.hiddenTalents, ...DATA.talents].find((t) => t.id === id);
    if (!talent) continue;
    const cappedLv = Math.min(TALENT_ENHANCE_MAX_LEVEL, Math.max(0, Math.floor(Number(lv) || 0)));
    for (let n = 0; n < cappedLv; n += 1) refund += talentEnhanceCost(talent, n);
  }
  state.perm.talentEnhanceLevels = {};
  state.perm.talentPoints = (state.perm.talentPoints || 0) + refund;
  saveGame();
  toast("天赋强化已重置，返还 ".concat(refund, " 天赋点。"));
  render();
}
function render() {
  const app = document.getElementById("app");
  app.innerHTML = '\n    <div class="app-shell">\n      '.concat(renderTopbar(), "\n      ").concat(renderStatus(), '\n      <main class="content">\n        ').concat(state.toast ? '<div class="toast">'.concat(esc(state.toast), "</div>") : "", "\n        ").concat(renderScreen(), "\n      </main>\n      ").concat(renderModal(), "\n    </div>\n  ");
  const log = document.querySelector(".log-box:not(.static-log)");
  if (log) log.scrollTop = log.scrollHeight;
  syncAudioVolume();
  syncMusicForCurrentScreen();
  syncCombatFloatElements();
}
function renderTopbar() {
  return '\n    <header class="topbar">\n      <div class="brand">\n        <div class="brand-mark">✦</div>\n        <div><h1>永恒之塔</h1><small>守护人间的神性之塔</small></div>\n      </div>\n      <nav class="nav">\n        <button onclick="state.screen=\'menu\'; render()">主城</button>\n        <button onclick="state.screen=\'growth\'; render()">成长</button>\n        '.concat(state.run ? "<button onclick=\"state.screen='tower'; render()\">爬塔</button>" : "", '\n        <button onclick="toggleAudio()">').concat(state.audioEnabled ? "静音" : "音乐", "</button>\n      </nav>\n    </header>\n  ");
}
function renderStatus() {
  const p = state.perm;
  const run = state.run;
  return '\n    <div class="status-strip">\n      <span class="pill">🏆 普通最高 '.concat(p.bestFloor || 0, '</span>\n      <span class="pill">💀 硬核最高 ').concat(p.hardcoreBestFloor || 0, '</span>\n      <span class="pill">👥 双英雄最高 ').concat(p.dualHeroBestFloor || 0, '</span>\n      <span class="pill">✨ 天赋点 ').concat(p.talentPoints || 0, "</span>\n      ").concat(run ? '<span class="pill">📍 第 '.concat(run.floor, ' 层</span><span class="pill">💰 ').concat(run.gold, '金币</span><span class="pill">Lv.').concat(run.level, "</span>") : "", "\n    </div>\n  ");
}
function renderScreen() {
  if (state.run) initializeSkillState(state.run);
  if (state.run) initializeAbilityState(state.run);
  if (state.run) initializeAbilityState(state.run);
  if (state.screen === "setup") return renderSetup();
  if (state.screen === "draft") return renderDraft();
  if (state.screen === "tower") return state.run ? renderTower() : renderMenu();
  if (state.screen === "combat") return state.combat ? renderCombat() : renderTower();
  if (state.screen === "growth") return renderGrowth();
  if (state.screen === "growthList") return renderGrowthList();
  if (state.screen === "talentEnhance") return renderTalentEnhance();
  if (state.screen === "mercs") return state.run ? renderMercManagement() : renderMenu();
  if (state.screen === "skills") return state.run ? renderSkillTree() : renderMenu();
  if (state.screen === "ability") return state.run ? renderAbilityScreen() : renderMenu();
  if (state.screen === "attrs") return state.run ? renderAttributeScreen() : renderMenu();
  if (state.screen === "equip") return state.run ? renderEquipmentScreen() : renderMenu();
  return renderMenu();
}
function renderMenu() {
  const hasRun = !!state.run || hasSavedRun();
  return '\n    <section class="panel hero-board">\n      <h2 class="title-large">永恒之塔</h2>\n      <p class="hero-copy">选择职业、觉醒超神级天赋，在战斗和事件之间攀登高塔。死亡会带来天赋点，天赋点会带来下一次更深的轮回。</p>\n      <div class="actions">\n        <button onclick="startSetup()">开始新轮回</button>\n        <button class="ghost" '.concat(hasRun ? "" : "disabled", ' onclick="continueRun()">继续轮回</button>\n        <button class="ghost" onclick="state.screen=\'growth\'; render()">永久成长</button>\n      </div>\n    </section>\n  ');
}
function hasSavedRun(mode = null) {
  return !!getSavedRun(mode);
}
function getSavedRunForSlot(mode) {
  var _a;
  return ((_a = getSavedRunSnapshot(mode)) == null ? void 0 : _a.run) || null;
}
function getSavedRun(mode = null) {
  var _a;
  const run = ((_a = getSavedRunSnapshot(mode)) == null ? void 0 : _a.run) || null;
  if (mode != null && run && modeOfRun(run) !== normalizeRunSaveMode(mode)) return null;
  return run;
}
function currentOrSavedRunForSlot(mode) {
  const slot = runSaveSlotKey(mode);
  if (state.run && runSaveSlotKey(state.run.mode) === slot) return state.run;
  return getSavedRunForSlot(mode);
}
function isHardcoreRun(run) {
  return !!(run && (run.hardcoreMode || run.mode === "hardcore"));
}
function continueRun(mode = null) {
  const normalized = mode ? normalizeRunSaveMode(mode) : null;
  if (state.run && (!normalized || modeOfRun(state.run) === normalized)) state.screen = "tower";
  else loadRunSave();
  playMusic("tower");
  render();
}
function renderSetup() {
  const modes = [
    { id: "normal", name: "普通模式", desc: "完整成长体系，适合长期推进。" },
    { id: "hardcore", name: "硬核模式", desc: "禁用局外成长，更依赖局内构筑。" },
    { id: "dual", name: "双英雄模式", desc: "两名英雄同时作战；敌人生命、攻击翻倍，普通战升级为精英编队。" }
  ];
  const classes = classList();
  return '\n    <div class="grid-main">\n      <aside class="panel pad">\n        <h2 class="panel-title">选择模式</h2>\n        <div class="mini-list">'.concat(modes.map((m) => '\n          <div class="card selectable '.concat(state.setup.mode === m.id ? "selected" : "", '" onclick="state.setup.mode=\'').concat(m.id, "'; render()\">\n            <h3>").concat(m.name, '</h3><p class="subtle">').concat(m.desc, "</p>\n          </div>\n        ")).join(""), '</div>\n      </aside>\n      <section class="panel pad">\n        <h2 class="panel-title">选择职业</h2>\n        <div class="selection-grid">').concat(classes.map((c) => classCard(c, state.setup.classId === c.id, "state.setup.classId='".concat(c.id, "'; if (state.setup.secondClassId==='").concat(c.id, "') state.setup.secondClassId='mage'; render()"))).join(""), '</div>\n      </section>\n      <aside class="panel pad">\n        <h2 class="panel-title">搭档</h2>\n        ').concat(state.setup.mode === "dual" ? '<div class="selection-grid">'.concat(classes.filter((c) => c.id !== state.setup.classId).map((c) => classCard(c, state.setup.secondClassId === c.id, "state.setup.secondClassId='".concat(c.id, "'; render()"))).join(""), "</div>") : '<p class="subtle">双英雄模式会在这里选择第二职业。</p>', '\n        <div class="actions" style="margin-top:12px"><button class="wide" onclick="beginDraft()">觉醒天赋</button></div>\n      </aside>\n    </div>\n  ');
}
function classCard(c, selected, action) {
  const stats = classBaseStats(c);
  return '\n    <div class="card selectable '.concat(selected ? "selected" : "", '" onclick="').concat(action, '">\n      <div class="class-icon">').concat(c.icon, "</div>\n      <h3>").concat(c.name, '</h3>\n      <p class="subtle">').concat(c.desc, '</p>\n      <div class="stat-line">\n        <span class="stat-chip">生命 ').concat(stats.hp, '</span><span class="stat-chip">攻击 ').concat(stats.atk, '</span><span class="stat-chip">法强 ').concat(stats.matk, '</span>\n        <span class="stat-chip">防 ').concat(stats.def, '</span><span class="stat-chip">暴 ').concat(stats.crit, "%</span>\n      </div>\n    </div>\n  ");
}
function renderDraft() {
  var _a;
  const pickIndex = (((_a = state.draft) == null ? void 0 : _a.pickIndex) || 0) + 1;
  return '\n    <section class="panel pad">\n      <h2 class="panel-title">选择天赋 ('.concat(pickIndex, "/").concat(state.draft.maxPicks, ')</h2>\n      <div class="selection-grid">').concat(state.draft.candidates.map((t) => talentCard(t, "selectDraftTalent('".concat(t.id, "')"))).join(""), "</div>\n    </section>\n  ");
}
function talentCard(t, action) {
  return '\n    <div class="card talent-card selectable rarity-'.concat(t.rarity, '" onclick="').concat(action, '">\n      <div><b>').concat(talentTitleHtml(t, { rarityLabel: true }), "</b></div>\n      <p>").concat(talentDescriptionHtml(t), "</p>\n      ").concat(t.classReq ? '<span class="pill">'.concat(getClass(t.classReq).icon, " ").concat(getClass(t.classReq).name, "专属</span>") : "", "\n      <button>选择此天赋</button>\n    </div>\n  ");
}
function renderGrowth() {
  const growthSummary = DATA.growthTree.some((g) => growthLevel(g.id) > 0) ? DATA.growthTree.filter((g) => growthLevel(g.id) > 0).map((g) => "".concat(g.name, " Lv.").concat(growthLevel(g.id))).join(" / ") : "暂无加成，在强化中投入天赋点提升";
  const enhanceLv = growthLevel("g_enhance");
  return '\n    <section class="city-screen">\n      '.concat(renderCityHeader("🏰 主城"), '\n      <div class="city-content">\n        <div class="city-card profile-card">\n          <h3>⚔️ 冒险者档案</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>最高层数</span><b>第 ').concat(state.perm.bestFloor || 0, ' 层</b></div>\n          <div class="stat-row"><span>轮回次数</span><b>').concat(state.perm.totalRuns || 0, ' 次</b></div>\n          <div class="stat-row"><span>天赋点</span><b class="gold">').concat(state.perm.talentPoints || 0, " 点</b></div>\n        </div>\n        ").concat(renderAttributeGuideButton(), '\n        <div class="city-card">\n          <h3 class="green">📈 永久成长</h3>\n          <div class="divider"></div>\n          <p>').concat(esc(growthSummary), '</p>\n        </div>\n        <div class="city-card">\n          <h3 class="purple">🔨 强化等级</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>技能天赋</span><b>Lv.').concat(growthLevel("g_init_sp"), '/10</b></div>\n          <div class="stat-row"><span>装备强化上限</span><b>+').concat(enhanceLv, "</b></div>\n        </div>\n      </div>\n      ").concat(renderCityNav("city"), "\n    </section>\n  ");
}
function renderCityHeader(title) {
  const back = state.run ? "state.screen='tower'; render()" : "state.screen='menu'; render()";
  return '\n    <header class="mobile-top">\n      <button onclick="'.concat(back, '">◀ 返回</button>\n      <h2>').concat(title, "</h2>\n    </header>\n  ");
}
function renderGrowthList() {
  return '\n    <section class="city-screen growth-page">\n      '.concat(renderCityHeader("🔨 强化 — 永久成长"), '\n      <div class="upgrade-toolbar">\n        <button class="small-action" onclick="resetGrowth()">↻ 全部重置</button>\n        <b>天赋点: ').concat(state.perm.talentPoints || 0, '</b>\n      </div>\n      <div class="upgrade-list">\n        ').concat(DATA.growthTree.map(renderGrowthUpgradeRow).join(""), "\n      </div>\n      ").concat(renderCityNav("growth"), "\n    </section>\n  ");
}
function renderGrowthUpgradeRow(g) {
  const lv = growthLevel(g.id);
  const cost = growthCost(g, lv);
  const disabled = lv >= g.maxLv || (state.perm.talentPoints || 0) < cost;
  return '\n    <article class="upgrade-row">\n      <div>\n        <h3>'.concat(esc(g.name), " <span>(Lv.").concat(lv, "/").concat(g.maxLv, ")</span></h3>\n        <p>").concat(esc(g.desc), "</p>\n      </div>\n      <button ").concat(disabled ? "disabled" : "", " onclick=\"upgradeGrowth('").concat(g.id, "')\">").concat(lv >= g.maxLv ? "已满" : "升级(".concat(cost, "点)"), "</button>\n    </article>\n  ");
}
function renderTalentEnhance() {
  const filterIds = ["common", "rare", "epic", "legendary", "mythic", "hidden"];
  const active = filterIds.includes(state.talentEnhanceFilter) ? state.talentEnhanceFilter : "common";
  const filters = [
    ["all", "全部", ""],
    ["common", talentRarityFilterLabel("common"), "common"],
    ["rare", talentRarityFilterLabel("rare"), "rare"],
    ["epic", talentRarityFilterLabel("epic"), "epic"],
    ["legendary", talentRarityFilterLabel("legendary"), "legendary"],
    ["mythic", talentRarityFilterLabel("mythic"), "mythic"],
    ["hidden", talentRarityFilterLabel("hidden"), "hidden"]
  ];
  const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, hidden: 6 };
  const talents = [...DATA.talents, ...DATA.hiddenTalents].filter((t) => t.rarity === active).sort((a, b) => (rarityOrder[a.rarity] || 9) - (rarityOrder[b.rarity] || 9) || a.name.localeCompare(b.name, "zh-CN"));
  return '\n    <section class="city-screen talent-enhance-page">\n      '.concat(renderCityHeader("✨ 天赋强化"), '\n      <div class="talent-enhance-top">\n        <span>天赋点: <b>').concat(state.perm.talentPoints || 0, '</b></span>\n        <button class="small-action" onclick="resetTalentEnhance()">↻ 全部重置</button>\n      </div>\n      <div class="talent-filter-row">\n        ').concat(filters.filter(([id]) => id !== "all").map(([id, label, rarity]) => '<button class="'.concat(active === id ? "selected" : "", " ").concat(rarity, '" onclick="state.talentEnhanceFilter=\'').concat(id, "'; render()\">").concat(label, "</button>")).join(""), '\n      </div>\n      <div class="talent-enhance-list" data-preserve-scroll="talent-enhance-list">\n        ').concat(talents.map(renderTalentEnhanceCard).join(""), "\n      </div>\n      ").concat(renderCityNav("talent"), "\n    </section>\n  ");
}
function renderTalentEnhanceCard(talent) {
  const lv = talentEnhanceLevel(talent.id);
  const cost = talentEnhanceCost(talent, lv);
  const cur = talentEnhanceMultiplier(talent);
  const next = lv >= TALENT_ENHANCE_MAX_LEVEL ? cur : 1 + (lv + 1) * 0.5;
  const maxed = lv >= TALENT_ENHANCE_MAX_LEVEL;
  const stars = "".concat("★".repeat(lv + 1)).concat("☆".repeat(TALENT_ENHANCE_MAX_LEVEL - lv));
  const disabled = maxed || (state.perm.talentPoints || 0) < cost;
  const divineHand = hiddenTalentStarValues("divine_hand", lv);
  const nextDivineHand = hiddenTalentStarValues("divine_hand", lv + 1);
  const arcaneEcho = hiddenTalentStarValues("arcane_echo", lv);
  const nextArcaneEcho = hiddenTalentStarValues("arcane_echo", lv + 1);
  const starEffect = talentStarEffectText(talent.passive, lv);
  const nextStarEffect = talentStarEffectText(talent.passive, lv + 1);
  let effectText;
  if (talent.passive === "gale_breath") {
    effectText = maxed ? "闪避 ".concat(Math.round(cur * 10), "%　已满") : "闪避 ".concat(Math.round(cur * 10), "% → ").concat(Math.round(next * 10), "%");
  } else if (TALENT_STAR_EFFECTS[talent.passive]) {
    effectText = maxed ? "".concat(starEffect, "　已满") : "".concat(starEffect, " → ").concat(nextStarEffect);
  } else if (talent.passive === "divine_hand") {
    effectText = maxed ? "生命 +".concat(divineHand.hp, " · 伤害 ").concat(Number((divineHand.damagePct * 100).toFixed(1)), "%　已满") : "生命 +".concat(divineHand.hp, " → +").concat(nextDivineHand.hp, " · 伤害 ").concat(Number((divineHand.damagePct * 100).toFixed(1)), "% → ").concat(Number((nextDivineHand.damagePct * 100).toFixed(1)), "%");
  } else if (talent.passive === "arcane_echo") {
    effectText = maxed ? "法强 +".concat(arcaneEcho.matk, " · 刷新 ").concat(Math.round(arcaneEcho.refreshChance * 100), "%　已满") : "法强 +".concat(arcaneEcho.matk, " · 刷新 ").concat(Math.round(arcaneEcho.refreshChance * 100), "% → 法强 +").concat(nextArcaneEcho.matk, " · 刷新 ").concat(Math.round(nextArcaneEcho.refreshChance * 100), "%");
  } else if (talent.passive === "iron_heart") {
    effectText = maxed ? "防御、护盾 x".concat(cur.toFixed(1), "　已满") : "防御、护盾 x".concat(cur.toFixed(1), " → x").concat(next.toFixed(1));
  } else if (talent.passive === "soul_harvest") {
    effectText = maxed ? "攻击、伤害 x".concat(cur.toFixed(1), "　已满") : "攻击、伤害 x".concat(cur.toFixed(1), " → x").concat(next.toFixed(1));
  } else {
    effectText = maxed ? "效果 x".concat(cur.toFixed(1), "　已满") : "效果 x".concat(cur.toFixed(1), " → x").concat(next.toFixed(1));
  }
  return '\n    <article class="talent-enhance-card rarity-'.concat(esc(talent.rarity || "common"), '">\n      <div class="talent-enhance-head">\n        <h3>').concat(talentTitleHtml(talent), ' <span class="talent-level">').concat(stars, "</span></h3>\n        <b>").concat(effectText, "</b>\n      </div>\n      <p>").concat(talentDescriptionHtml(talent, lv, { showLevel: false }), "</p>\n      <button ").concat(disabled ? "disabled" : "", " onclick=\"upgradeTalentEnhance('").concat(talent.id, "')\">").concat(maxed ? "已满" : "强化 (".concat(cost, "点)"), "</button>\n    </article>\n  ");
}
function renderCityNav(active = "city") {
  const launchAction = state.run || getSavedRun() ? "continueRun()" : "startSetup()";
  return '\n    <footer class="city-nav">\n      <button class="'.concat(active === "tower" ? "selected" : "", '" onclick="').concat(launchAction, '">⚔️ 出发</button>\n      <button class="').concat(active === "growth" ? "selected" : "", '" onclick="state.screen=\'growthList\'; render()">🔨 强化</button>\n      <button class="').concat(active === "talent" ? "selected" : "", '" onclick="state.screen=\'talentEnhance\'; render()">✨ 天赋</button>\n      <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n    </footer>\n  ');
}
function renderTower() {
  return '\n    <div class="grid-main">\n      <aside class="side-stack">'.concat(renderPathPanel()).concat(renderEquipmentPanel(), '</aside>\n      <section class="panel pad">').concat(renderEventStage(), '</section>\n      <aside class="side-stack">').concat(renderPartyPanel()).concat(renderTalentPanel()).concat(renderLogPanel(), "</aside>\n    </div>\n  ");
}
function renderPathPanel() {
  return '\n    <div class="panel pad">\n      <h2 class="panel-title">第 '.concat(state.run.floor, ' 层路径</h2>\n      <div class="path-list">').concat(state.floorEvents.map((wrap, i) => '\n        <div class="event-row '.concat(i === state.eventIdx ? "current" : "", " ").concat(wrap.done ? "done" : "", '">\n          <div class="event-icon">').concat(renderEventIcon(wrap.event), "</div>\n          <div><b>").concat(wrap.event.name, " ").concat(renderEventRarity(wrap.event, "event-rarity-label event-rarity-compact"), '</b><br><span class="subtle">').concat(wrap.event.type, "</span></div>\n          <div>").concat(wrap.done ? "✓" : i === state.eventIdx ? "▶" : "", "</div>\n        </div>\n      ")).join(""), "</div>\n    </div>\n  ");
}
function renderEventStage() {
  const wrap = currentEventWrap();
  if (!wrap) return '<div class="empty">本层已完成。</div>';
  return '\n    <div class="event-stage">\n      <div class="big-icon">'.concat(renderEventIcon(wrap.event, "event-stage-icon"), '</div>\n      <h2 class="panel-title">').concat(wrap.event.name, "</h2>\n      <p>").concat(esc(wrap.event.text), '</p>\n      <div class="event-choices">').concat(wrap.event.choices.map((choice, idx) => {
    const cost = eventChoiceCost(choice);
    return '\n        <button onclick="resolveEventChoice('.concat(idx, ')">\n          ').concat(esc(choice.text), "\n          ").concat(cost ? "<small>".concat(cost, "g</small>") : "", "\n          ").concat(choice.desc ? "<small>".concat(esc(choice.desc), "</small>") : "", "\n        </button>\n      ");
  }).join(""), "</div>\n    </div>\n  ");
}
function quickChoiceIndex(wrap) {
  var _a;
  const event = wrap == null ? void 0 : wrap.event;
  const choices = (event == null ? void 0 : event.choices) || [];
  if (!choices.length) return 0;
  const settings = quickSettings();
  if (event.id === "evt_item_shop") {
    if (settings.itemShop === "skip") return choiceIndexByResult(choices, "nothing", choices.length - 1);
    return choiceIndexByResult(choices, "buy_item", 0);
  }
  if (event.id === "evt_tavern") {
    if (settings.tavern === "skip") return choiceIndexByResult(choices, "nothing", choices.length - 1);
    if (settings.tavern === "auto") return choiceIndexByResult(choices, "tavern_recruit", 0);
    return 0;
  }
  const configured = (_a = settings.events) == null ? void 0 : _a[event.id];
  if (configured) {
    const idx = choiceIndexByResult(choices, configured, -1);
    if (idx >= 0 && !eventChoiceDisabledReason(choices[idx])) return idx;
    const configuredFallbackIdx = choiceIndexByResult(choices, event.quickFallbackResult, -1);
    if (configuredFallbackIdx >= 0 && !eventChoiceDisabledReason(choices[configuredFallbackIdx])) return configuredFallbackIdx;
    const skipIdx = choices.findIndex((choice) => choice.result === "nothing" && !eventChoiceDisabledReason(choice));
    if (skipIdx >= 0) return skipIdx;
  }
  return firstAffordableChoiceIndex(choices);
}
function choiceIndexByResult(choices, result, fallback = 0) {
  const idx = choices.findIndex((choice) => choice.result === result);
  return idx >= 0 ? idx : fallback;
}
function firstAffordableChoiceIndex(choices) {
  const idx = choices.findIndex((choice) => {
    return !eventChoiceDisabledReason(choice);
  });
  return idx >= 0 ? idx : 0;
}
function combatUnitCols(count) {
  return Math.min(4, Math.max(1, count || 1));
}
function combatUnitGridClass(count, baseClass) {
  return "".concat(baseClass, " ").concat(count >= 4 ? "many-units" : "");
}
function combatLogDisplayLines(log) {
  return (log || []).filter(Boolean).slice(-48);
}
function renderCombat() {
  var _a;
  if ((_a = state.pendingEquip) == null ? void 0 : _a.item) {
    return '\n      <section class="play-screen">\n        '.concat(renderHeroStatus(), '\n        <div class="play-main">').concat(renderPendingEquipStage(), "</div>\n        ").concat(renderBottomBars("pendingEquip"), "\n      </section>\n    ");
  }
  const c = state.combat;
  return '\n    <div class="grid-main">\n      <aside class="side-stack">'.concat(renderCombatInfo()).concat(renderLogPanel(true), '</aside>\n      <section class="panel pad">\n        <h2 class="panel-title">').concat(kindLabel(c.kind), ' <span class="subtle">第 ').concat(c.turn, "/").concat(BATTLE_MAX_TURNS, " 回合").concat(battleTurnDamageBonus(c) > 0 ? " · 伤害 +".concat(Math.round(battleTurnDamageBonus(c) * 100), "%") : "", '</span></h2>\n        <h3 class="subtle">敌方</h3>\n        <div class="unit-lane">').concat(c.enemies.map((e, idx) => renderUnitCard(e, idx, !!state.pendingSkill)).join(""), '</div>\n        <h3 class="subtle">我方</h3>\n        <div class="unit-lane">').concat(c.allies.map((a) => renderUnitCard(a)).join(""), "</div>\n        ").concat(renderBattleActions(), '\n      </section>\n      <aside class="side-stack">').concat(renderPartyPanel()).concat(renderTalentPanel(), "</aside>\n    </div>\n  ");
}
function renderCombatInfo() {
  const active = getActivePlayer();
  return '<div class="panel pad"><h2 class="panel-title">行动</h2>'.concat(active ? "<p>".concat(active.icon, " ").concat(active.name, " 正在行动。</p>").concat(state.pendingSkill ? '<p class="gold">请选择一个敌方目标。</p>' : "") : '<p class="subtle">自动行动中。</p>').concat(state.combat.phase === "defeat" ? '<button class="danger wide" onclick="reincarnate()">转生结算</button>' : "", "</div>");
}
function renderEnemyPassiveAffixRow(unit) {
  var _a;
  if (unit.side !== "enemy" || !((_a = unit.passiveAffixes) == null ? void 0 : _a.length)) return "";
  return '<div class="buff-row">'.concat(unit.passiveAffixes.map((affix) => {
    const quality = DATA.enemyPassiveAffixQualities[affix.quality] || DATA.enemyPassiveAffixQualities.common;
    return '<span class="buff enemy-affix-'.concat(quality.id, '" title="').concat(esc("".concat(quality.name, "·").concat(affix.name, "：").concat(affix.desc || "")), '">').concat(esc(enemyPassiveAffixLabel(affix)), "</span>");
  }).join(""), "</div>");
}
function renderUnitCard(unit, idx = null, targetable = false) {
  var _a, _b, _c2;
  const active = ((_a = state.combat) == null ? void 0 : _a.activeUnitId) === unit.unitId;
  const targetSerial = ((_b = state.combat) == null ? void 0 : _b.targetSelectSerial) || ((_c2 = state.combat) == null ? void 0 : _c2.inputSerial) || 0;
  const click = targetable && unit.side === "enemy" && unit.alive ? 'onclick="clickTarget('.concat(idx, ", ").concat(targetSerial, ')"') : "";
  return '\n    <div class="unit-card '.concat(active ? "active" : "", " ").concat(click ? "targetable" : "", '" ').concat(click, ">\n      ").concat(renderCombatFloaters(unit), '\n      <div class="unit-head"><span class="unit-name">').concat(unit.icon || "", " ").concat(unit.name, "</span><span>").concat(unit.alive ? "" : "☠️", '</span></div>\n      <div class="bars">\n        ').concat(barRow("生命", unit.hp, unit.maxHp, "hpbar"), "\n        ").concat(unit.side === "ally" ? barRow("能量", unit.energy, unit.stats.energy, "mpbar") : "", "\n        ").concat(unit.shield > 0 ? barRow("护盾", unit.shield, Math.max(unit.shield, unit.maxHp), "shieldbar") : "", '\n      </div>\n      <div class="stat-line"><span class="stat-chip">攻 ').concat(unit.stats.atk || 0, '</span><span class="stat-chip">法 ').concat(unit.stats.matk || 0, '</span><span class="stat-chip">防 ').concat(unit.stats.def || 0, "</span></div>\n      ").concat(renderEnemyPassiveAffixRow(unit), '\n      <div class="buff-row">').concat(Object.entries(unit.buffs || {}).map(([id, b]) => '<span class="buff">'.concat(buffName(id), " ").concat(b.stacks > 1 ? "x".concat(b.stacks) : "", " ").concat(b.turns || "", "</span>")).join(""), "</div>\n    </div>\n  ");
}
function barRow(label, value, max, cls) {
  return '<div class="bar-row '.concat(cls, '-row"><span>').concat(label, '</span><div class="bar ').concat(cls, '"><span style="--w:').concat(pct(value, max), '%"></span></div><span>').concat(Math.max(0, Math.floor(value)), "/").concat(Math.floor(max), "</span></div>");
}
function renderBattleActions() {
  const active = getActivePlayer();
  if (state.combat.phase === "victory") return '<div class="battle-actions"><button class="wide" onclick="afterBattleContinue()">继续</button></div>';
  if (state.combat.phase === "defeat") return '<div class="battle-actions"><button class="danger wide" onclick="reincarnate()">转生</button></div>';
  if (state.combat.phase !== "player_choose" || !active) return '<div class="battle-actions"><button class="wide" onclick="advanceCombat()">继续</button></div>';
  const inputSerial = state.combat.inputSerial || 0;
  const skills = classSkillsFor(active);
  const items = Object.entries(state.run.items || {});
  const skillCols = Math.min(Math.max(skills.length, 1), 6);
  const itemCols = Math.min(Math.max(items.length, 1), 6);
  return '\n    <div class="battle-actions">\n      <div class="skill-grid" style="--count:'.concat(skillCols, '">').concat(skills.map((s) => {
    const cost = actualSkillCost(active, s);
    const cd = active.cooldowns[s.id] || 0;
    return '<button class="skill-btn" '.concat(canUseSkill(active, s) ? "" : "disabled", " onclick=\"clickSkill('").concat(s.id, "', ").concat(inputSerial, ')">').concat(s.name, "<small>能量:").concat(cost, " 冷却:").concat(Math.max(0, cd), "</small></button>");
  }).join(""), '</div>\n      <div class="item-grid" style="margin-top:8px">').concat(Object.entries(state.run.items || {}).map(([id, count]) => {
    var _a, _b;
    return '<button class="item-btn ghost" onclick="useCombatItem(\''.concat(id, "', ").concat(inputSerial, ')">').concat(((_a = DATA.items[id]) == null ? void 0 : _a.icon) || "🎒", " ").concat(((_b = DATA.items[id]) == null ? void 0 : _b.name) || id, "<small>x").concat(count, "</small></button>");
  }).join(""), '</div>\n      <button class="wide" style="margin-top:8px" onclick="quickBattle()">⚡ 快速战斗</button>\n    </div>\n  ');
}
function combatPlayerStateSnapshot(unit) {
  var _a;
  if (!unit) return null;
  return {
    unitId: unit.unitId,
    name: unit.name,
    isPlayer: !!unit.isPlayer,
    hp: Math.max(0, Math.floor(unit.hp)),
    maxHp: Math.max(1, Math.floor(unit.maxHp)),
    shield: Math.max(0, Math.floor(unit.shield || 0)),
    energy: Math.max(0, Math.floor(unit.energy || 0)),
    maxEnergy: Math.max(1, Math.floor(((_a = unit.stats) == null ? void 0 : _a.energy) || 100))
  };
}
function activeQuickBattleStats() {
  const combat = state.combat;
  return (combat == null ? void 0 : combat.quickBattleMode) ? combat.quickBattleStats || null : null;
}
function createQuickBattleStats(combat = state.combat) {
  return {
    startTurn: (combat == null ? void 0 : combat.turn) || 1,
    startActionSerial: (combat == null ? void 0 : combat.actionSerial) || 0,
    startEnemyIds: ((combat == null ? void 0 : combat.enemies) || []).filter((unit) => unit.alive).map((unit) => unit.unitId),
    startAllyStates: ((combat == null ? void 0 : combat.allies) || []).filter((unit) => unit.alive && !unit.isCommandPuppet).map(combatPlayerStateSnapshot),
    allyActions: 0,
    damageDealt: 0,
    damageTaken: 0,
    shieldAbsorbed: 0,
    healingDone: 0,
    overhealing: 0,
    shieldGained: 0,
    energySpent: 0,
    skillUses: {}
  };
}
function recordQuickBattleSkillUse(attacker, skill, cost = 0, free = false) {
  const stats = activeQuickBattleStats();
  if (!stats || (attacker == null ? void 0 : attacker.side) !== "ally" || !skill) return;
  const key = "".concat(attacker.unitId || "ally", ":").concat(skill.id || skill.name || "skill");
  const entry = stats.skillUses[key] || {
    unitName: attacker.name || "我方",
    skillName: skill.name || "技能",
    count: 0,
    energySpent: 0
  };
  entry.count += 1;
  if (!free) entry.energySpent += Math.max(0, Math.floor(cost || 0));
  stats.skillUses[key] = entry;
  stats.allyActions += 1;
  if (!free) stats.energySpent += Math.max(0, Math.floor(cost || 0));
}
function recordQuickBattleDamage(target, attacker, healthDamage = 0, shieldAbsorbed = 0) {
  const stats = activeQuickBattleStats();
  if (!stats || !target) return;
  const total = Math.max(0, Math.floor(healthDamage || 0)) + Math.max(0, Math.floor(shieldAbsorbed || 0));
  if (target.side === "enemy" && (attacker == null ? void 0 : attacker.side) === "ally") stats.damageDealt += total;
  if (target.side === "ally") {
    stats.damageTaken += total;
    stats.shieldAbsorbed += Math.max(0, Math.floor(shieldAbsorbed || 0));
  }
}
function recordQuickBattleHealing(target, real = 0, overflow = 0) {
  const stats = activeQuickBattleStats();
  if (!stats || (target == null ? void 0 : target.side) !== "ally") return;
  stats.healingDone += Math.max(0, Math.floor(real || 0));
  stats.overhealing += Math.max(0, Math.floor(overflow || 0));
}
function recordQuickBattleShieldGain(target, gain = 0) {
  const stats = activeQuickBattleStats();
  if (!stats || (target == null ? void 0 : target.side) !== "ally") return;
  stats.shieldGained += Math.max(0, Math.floor(gain || 0));
}
function quickBattleStateText(states = []) {
  if (!states.length) return "无可用队员状态";
  return states.map((unit) => "".concat(unit.name, " 生命 ").concat(unit.hp, "/").concat(unit.maxHp, "、能量 ").concat(unit.energy, "/").concat(unit.maxEnergy).concat(unit.shield > 0 ? "、护盾 ".concat(unit.shield) : "")).join("；");
}
function quickBattleSkillUseText(stats) {
  const entries = Object.values((stats == null ? void 0 : stats.skillUses) || {}).sort((a, b) => b.count - a.count || a.skillName.localeCompare(b.skillName, "zh-CN"));
  if (!entries.length) return "我方没有成功释放技能";
  return entries.map((entry) => "".concat(entry.unitName, "·").concat(entry.skillName, "×").concat(entry.count)).join("、");
}
function quickBattleDefeatSummary(combat, quickStartPlayerStates = [], startTurn = 1) {
  var _a, _b, _c2, _d2;
  const fatal = (combat == null ? void 0 : combat.lastPlayerFatalHit) || null;
  const targetId = (fatal == null ? void 0 : fatal.unitId) || ((_a = quickStartPlayerStates[0]) == null ? void 0 : _a.unitId) || ((_c2 = (_b = combat == null ? void 0 : combat.entryPlayerStates) == null ? void 0 : _b[0]) == null ? void 0 : _c2.unitId) || "";
  const entry = ((combat == null ? void 0 : combat.entryPlayerStates) || []).find((state2) => state2.unitId === targetId) || ((_d2 = combat == null ? void 0 : combat.entryPlayerStates) == null ? void 0 : _d2[0]) || null;
  const quickStart = quickStartPlayerStates.find((state2) => state2.unitId === targetId) || quickStartPlayerStates[0] || null;
  const parts = [];
  if (entry) parts.push("入场生命 ".concat(entry.hp, "/").concat(entry.maxHp).concat(entry.shield > 0 ? "、护盾 ".concat(entry.shield) : ""));
  if (quickStart && (!entry || quickStart.hp !== entry.hp || quickStart.shield !== entry.shield)) {
    parts.push("快速战斗前生命 ".concat(quickStart.hp, "/").concat(quickStart.maxHp).concat(quickStart.shield > 0 ? "、护盾 ".concat(quickStart.shield) : ""));
  }
  if (fatal) {
    const source = fatal.attackerName !== "未知来源" ? "".concat(fatal.attackerName).concat(fatal.sourceName ? "的「".concat(fatal.sourceName, "」") : "") : fatal.sourceName ? "「".concat(fatal.sourceName, "」") : "未知来源";
    parts.push("死于：".concat(source, "，最后一击造成 ").concat(fatal.damage, " 伤害").concat(fatal.shieldAbsorbed > 0 ? "（护盾吸收 ".concat(fatal.shieldAbsorbed, "）") : ""));
  } else {
    parts.push("死于：未知原因（未记录到最后一击来源）");
  }
  parts.push("坚持了 ".concat(Math.max(1, ((combat == null ? void 0 : combat.turn) || startTurn) - startTurn + 1), " 回合"));
  return "⚡ 快速战斗战败：".concat(parts.join("；"), "。");
}
function quickBattleSummaryLines(combat, stats, guard = 0) {
  if (!combat || !stats) return [];
  const turns = Math.max(1, (combat.turn || stats.startTurn) - stats.startTurn + 1);
  const aliveEnemyIds = new Set((combat.enemies || []).filter((unit) => unit.alive).map((unit) => unit.unitId));
  const defeated = (stats.startEnemyIds || []).filter((unitId) => !aliveEnemyIds.has(unitId)).length;
  const outcome = combat.phase === "victory" ? combat.turnLimitReached ? "回合上限胜利（奖励减半）" : "胜利" : combat.phase === "defeat" ? "战败" : "自动推进已暂停";
  const finalStates = (combat.allies || []).filter((unit) => !unit.isCommandPuppet && (unit.isPlayer || stats.startAllyStates.some((start) => start.unitId === unit.unitId))).map(combatPlayerStateSnapshot);
  const lines = [
    "⚡ 自动战斗总结：".concat(outcome, " · ").concat(turns, " 回合 · 自动推进 ").concat(guard, " 步 · 我方行动 ").concat(stats.allyActions, " 次 · 击败 ").concat(defeated, "/").concat(stats.startEnemyIds.length, " 名初始敌人。"),
    "🚪 开场状态：".concat(quickBattleStateText(stats.startAllyStates), "。"),
    "📊 战斗统计：造成 ".concat(stats.damageDealt, " 伤害 · 承受 ").concat(stats.damageTaken, " 伤害（护盾吸收 ").concat(stats.shieldAbsorbed, "）· 有效治疗 ").concat(stats.healingDone).concat(stats.overhealing > 0 ? "（溢出 ".concat(stats.overhealing, "）") : "", " · 获得护盾 ").concat(stats.shieldGained, " · 消耗能量 ").concat(stats.energySpent, "。"),
    "✨ 技能使用：".concat(quickBattleSkillUseText(stats), "。"),
    "❤️ 最终状态：".concat(quickBattleStateText(finalStates), "。")
  ];
  if (combat.phase === "defeat") {
    lines.push(quickBattleDefeatSummary(combat, stats.startAllyStates.filter((unit) => unit.isPlayer), stats.startTurn));
  } else if (!["victory", "defeat"].includes(combat.phase)) {
    lines.push("⚠️ 快速战斗达到步数上限，已停止自动推进，当前战斗结果保持不变。");
  }
  return lines;
}
function quickBattle() {
  const c = state.combat;
  if (!c) return;
  const maxIterations = BATTLE_MAX_TURNS * 12;
  const stats = createQuickBattleStats(c);
  c.quickBattleStats = stats;
  c.lastPlayerFatalHit = null;
  let guard = 0;
  c.quickBattleMode = true;
  try {
    while (state.combat && !["victory", "defeat"].includes(state.combat.phase) && guard < maxIterations) {
      guard += 1;
      const active = getActivePlayer();
      if (state.combat.phase === "player_choose" && active) {
        const decision = choosePlayerAutoSkill(active);
        const skill = (decision == null ? void 0 : decision.skill) || null;
        if (skill) playerUseSkill(skill.id, skill.targets === "single" ? firstAliveEnemyIdx() : null, state.combat.inputSerial || 0);
        else advanceCombat();
        continue;
      }
      advanceCombat();
    }
  } finally {
    if (state.combat === c) c.quickBattleMode = false;
  }
  if (state.combat === c) {
    const summaryLines = quickBattleSummaryLines(c, stats, guard);
    for (const line of summaryLines) combatLog(line);
  }
  saveGame();
  render();
}
function renderPartyPanel() {
  if (!state.run) return "";
  return '\n    <div class="panel pad">\n      <h2 class="panel-title">队伍</h2>\n      <div class="mini-list">'.concat(state.run.party.map((m) => {
    var _a;
    const stats = calcUnitStats(m);
    const hp = (_a = state.run.currentHp[m.unitId]) != null ? _a : stats.hp;
    return '<div class="mini-row"><div>'.concat(getClass(m.classId).icon, " <b>").concat(m.name, '</b><br><span class="subtle">').concat(getClass(m.classId).name).concat(m.mercData ? " · ".concat(DATA.mercQuality[m.mercData.quality].name) : "", "</span></div><div>").concat(Math.floor(hp), "/").concat(stats.hp, "</div></div>");
  }).join(""), "</div>\n    </div>\n  ");
}
function renderEquipmentPanel() {
  return '\n    <div class="panel pad">\n      <h2 class="panel-title">装备</h2>\n      <div class="equipment-grid">'.concat(DATA.equipSlots.map((slot) => {
    const item = state.run.equipment[slot];
    const lv = state.run.enhanceLevels[slot] || 0;
    return '<div class="equip-slot">'.concat(renderEquipArt(slot, "equip-art equip-slot-art", (item == null ? void 0 : item.rarity) || "empty"), "<div><b>").concat(DATA.equipSlotNames[slot], '</b><br><span class="subtle">').concat(item ? "".concat(item.name, " +").concat(lv) : "空", "</span></div><button onclick=\"toast('").concat(esc(equipText(item)).replace(/\n/g, " "), "')\">看</button></div>");
  }).join(""), "</div>\n    </div>\n  ");
}
function renderTalentPanel() {
  if (!state.run) return "";
  return '\n    <div class="panel pad">\n      <h2 class="panel-title">天赋</h2>\n      <div class="mini-list">'.concat(state.run.talents.map((t) => '<div class="mini-row"><span>'.concat(talentTitleHtml(t)).concat(t.mechanicDesc ? "<br><small>专属机制：".concat(esc(t.mechanicDesc), "</small>") : "", "</span><span>").concat(RARITY_LABEL[t.rarity] || "", "</span></div>")).join(""), "</div>\n    </div>\n  ");
}
function renderLogPanel(combat = false) {
  var _a, _b;
  const log = combat ? ((_a = state.combat) == null ? void 0 : _a.log) || [] : ((_b = state.run) == null ? void 0 : _b.log) || [];
  return '<div class="panel pad"><h2 class="panel-title">日志</h2><div class="log-box">'.concat(log.map((line) => '<div class="log-line">'.concat(colorCombatLog(line), "</div>")).join(""), "</div></div>");
}
function renderGrowth() {
  return '\n    <section class="panel pad">\n      <h2 class="panel-title">永久成长 <span class="subtle">天赋点 '.concat(state.perm.talentPoints, '</span></h2>\n      <div class="selection-grid">').concat(DATA.growthTree.map((g) => {
    const lv = growthLevel(g.id);
    const cost = growthCost(g, lv);
    return '<div class="card"><h3>'.concat(g.name, ' <span class="subtle">Lv.').concat(lv, "/").concat(g.maxLv, "</span></h3><p>").concat(g.desc, '</p><p class="subtle">').concat(g.category, "</p><button ").concat(lv >= g.maxLv ? "disabled" : "", " onclick=\"upgradeGrowth('").concat(g.id, "')\">升级 ").concat(cost, " 点</button></div>");
  }).join(""), '</div>\n      <div class="actions" style="margin-top:12px"><button class="danger" onclick="resetGrowth()">重置成长</button></div>\n    </section>\n  ');
}
function renderModal() {
  if (!state.modal) return "";
  return '\n    <div class="modal-backdrop '.concat(state.modal.backdropClassName || "", '">\n      <div class="modal">\n        <h2 class="panel-title">').concat(state.modal.title, "</h2>\n        <div>").concat(state.modal.body, '</div>\n        <div class="actions" style="margin-top:14px">').concat((state.modal.actions || []).map((a, idx) => '<button class="'.concat(a.className || "", '" onclick="modalAction(').concat(idx, ')">').concat(a.label, "</button>")).join(""), "</div>\n      </div>\n    </div>\n  ");
}
function modalAction(idx) {
  var _a, _b, _c2;
  const action = (_b = (_a = state.modal) == null ? void 0 : _a.actions) == null ? void 0 : _b[idx];
  (_c2 = action == null ? void 0 : action.onClick) == null ? void 0 : _c2.call(action);
}
const BGM_TRACK_IDS = Object.freeze({
  city: "bgm-city",
  tower: "bgm-tower",
  battle: "bgm-battle"
});
const TOWER_MUSIC_SCREENS = /* @__PURE__ */ new Set(["tower", "mercs", "skills", "ability", "attrs", "equip"]);
const MUSIC_FADE_DURATION_MS = 500;
const musicState = {
  currentTrack: null,
  requestedTrack: null,
  startingTrack: null,
  transitionId: 0,
  fadeHandle: null,
  unlockHandler: null,
  levels: { city: 0, tower: 0, battle: 0 }
};
function musicMasterVolume() {
  var _a;
  return clamp(Number((_a = state.perm.musicVolume) != null ? _a : 50), 0, 100) / 100;
}
function musicTrackForScreen(screen = state.screen) {
  if (screen === "combat") return state.combat ? "battle" : state.run ? "tower" : "city";
  if (TOWER_MUSIC_SCREENS.has(screen) && state.run) return "tower";
  return "city";
}
function musicPlaybackAllowed() {
  if (!state.audioEnabled || privacyNeedsDecision()) return false;
  return !(privacyAllowsNetworkServices() && tapTapGate.required && !tapTapGate.allowed);
}
function musicAudio(track) {
  return document.getElementById(BGM_TRACK_IDS[track]);
}
function ensureMusicAudioSource(track) {
  var _a, _b, _c2;
  const audio = musicAudio(track);
  const source = ((_a = audio == null ? void 0 : audio.dataset) == null ? void 0 : _a.src) || "";
  if (audio && source && !((_b = audio.getAttribute) == null ? void 0 : _b.call(audio, "src"))) {
    audio.setAttribute("src", source);
    (_c2 = audio.load) == null ? void 0 : _c2.call(audio);
  }
  return audio;
}
function releaseMusicAudio(track) {
  var _a, _b;
  const audio = musicAudio(track);
  if (!audio) return;
  if (typeof audio.pause === "function") audio.pause();
  if ((_a = audio.getAttribute) == null ? void 0 : _a.call(audio, "src")) {
    audio.removeAttribute("src");
    (_b = audio.load) == null ? void 0 : _b.call(audio);
  }
}
function setMusicLevel(track, level) {
  const normalized = clamp(Number(level) || 0, 0, 1);
  musicState.levels[track] = normalized;
  const audio = musicAudio(track);
  if (audio) audio.volume = musicMasterVolume() * normalized;
}
function cancelMusicFade() {
  if (musicState.fadeHandle === null) return;
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(musicState.fadeHandle);
  else clearTimeout(musicState.fadeHandle);
  musicState.fadeHandle = null;
}
function scheduleMusicFrame(callback) {
  if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16);
}
function clearMusicUnlockHandler() {
  if (!musicState.unlockHandler || typeof (document == null ? void 0 : document.removeEventListener) !== "function") return;
  document.removeEventListener("pointerdown", musicState.unlockHandler, true);
  document.removeEventListener("keydown", musicState.unlockHandler, true);
  musicState.unlockHandler = null;
}
function waitForMusicUnlock() {
  if (musicState.unlockHandler || typeof (document == null ? void 0 : document.addEventListener) !== "function") return;
  const retry = () => {
    clearMusicUnlockHandler();
    syncMusicForCurrentScreen();
  };
  musicState.unlockHandler = retry;
  document.addEventListener("pointerdown", retry, { capture: true, once: true });
  document.addEventListener("keydown", retry, { capture: true, once: true });
}
function finishMusicTransition(track) {
  for (const otherTrack of Object.keys(BGM_TRACK_IDS)) {
    const audio = musicAudio(otherTrack);
    if (otherTrack === track) {
      setMusicLevel(otherTrack, 1);
      continue;
    }
    setMusicLevel(otherTrack, 0);
    releaseMusicAudio(otherTrack);
  }
  musicState.currentTrack = track;
  musicState.fadeHandle = null;
}
function startMusicFade(track, transitionId) {
  const startedAt = typeof (performance == null ? void 0 : performance.now) === "function" ? performance.now() : Date.now();
  const startLevels = { ...musicState.levels };
  const step = (timestamp) => {
    if (transitionId !== musicState.transitionId || musicState.requestedTrack !== track) return;
    const now = Number.isFinite(timestamp) ? timestamp : Date.now();
    const progress = clamp((now - startedAt) / MUSIC_FADE_DURATION_MS, 0, 1);
    for (const otherTrack of Object.keys(BGM_TRACK_IDS)) {
      const targetLevel = otherTrack === track ? 1 : 0;
      setMusicLevel(otherTrack, startLevels[otherTrack] + (targetLevel - startLevels[otherTrack]) * progress);
    }
    if (progress >= 1) finishMusicTransition(track);
    else musicState.fadeHandle = scheduleMusicFrame(step);
  };
  musicState.fadeHandle = scheduleMusicFrame(step);
}
function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  state.perm.musicEnabled = state.audioEnabled;
  saveGame({ persistDurableChangesDuringCombat: true });
  if (state.audioEnabled) syncMusicForCurrentScreen();
  else stopMusic();
  render();
}
function playMusic(which) {
  if (!Object.prototype.hasOwnProperty.call(BGM_TRACK_IDS, which)) return;
  musicState.requestedTrack = which;
  if (!musicPlaybackAllowed()) return;
  const target = ensureMusicAudioSource(which);
  if (!target || typeof target.play !== "function") return;
  if (musicState.startingTrack === which) return;
  if (musicState.currentTrack === which && musicState.fadeHandle !== null) return;
  if (musicState.currentTrack === which && target.paused === false) {
    setMusicLevel(which, 1);
    return;
  }
  cancelMusicFade();
  const transitionId = ++musicState.transitionId;
  musicState.startingTrack = which;
  if (musicState.currentTrack !== which) target.currentTime = 0;
  setMusicLevel(which, musicState.currentTrack === which ? 1 : 0);
  let playResult;
  try {
    playResult = target.play();
  } catch (e) {
    musicState.startingTrack = null;
    waitForMusicUnlock();
    return;
  }
  Promise.resolve(playResult).then(() => {
    if (musicState.startingTrack === which) musicState.startingTrack = null;
    if (transitionId !== musicState.transitionId || musicState.requestedTrack !== which || !musicPlaybackAllowed()) {
      target.pause();
      return;
    }
    clearMusicUnlockHandler();
    musicState.currentTrack = which;
    startMusicFade(which, transitionId);
  }).catch(() => {
    if (musicState.startingTrack === which) musicState.startingTrack = null;
    if (musicState.requestedTrack === which && musicPlaybackAllowed()) waitForMusicUnlock();
  });
}
function stopMusic({ resetPosition = false } = {}) {
  cancelMusicFade();
  clearMusicUnlockHandler();
  musicState.transitionId += 1;
  musicState.currentTrack = null;
  musicState.requestedTrack = null;
  musicState.startingTrack = null;
  for (const track of Object.keys(BGM_TRACK_IDS)) {
    const audio = musicAudio(track);
    setMusicLevel(track, 0);
    if (resetPosition && audio) audio.currentTime = 0;
    releaseMusicAudio(track);
  }
}
function syncAudioVolume() {
  for (const track of Object.keys(BGM_TRACK_IDS)) setMusicLevel(track, musicState.levels[track]);
}
function syncMusicForCurrentScreen() {
  if (!musicPlaybackAllowed()) {
    stopMusic();
    return;
  }
  playMusic(musicTrackForScreen());
}
function capturePreservedScrollPositions(root = document) {
  const positions = /* @__PURE__ */ new Map();
  for (const element of root.querySelectorAll("[data-preserve-scroll]")) {
    const key = element.getAttribute("data-preserve-scroll");
    if (!key || positions.has(key)) continue;
    positions.set(key, { top: element.scrollTop, left: element.scrollLeft });
  }
  return positions;
}
function restorePreservedScrollPositions(positions, root = document) {
  if (!(positions == null ? void 0 : positions.size)) return;
  for (const element of root.querySelectorAll("[data-preserve-scroll]")) {
    const key = element.getAttribute("data-preserve-scroll");
    const position = positions.get(key);
    if (!position) continue;
    element.scrollTop = position.top;
    element.scrollLeft = position.left;
  }
}
function render() {
  const preservedScrollPositions = capturePreservedScrollPositions();
  if (saveSystemNotice) {
    const notice = saveSystemNotice;
    saveSystemNotice = "";
    toast(notice);
  }
  const app = document.getElementById("app");
  if (privacyNeedsDecision()) {
    stopMusic();
    app.innerHTML = renderPrivacyConsentGate();
    return;
  }
  if (privacyAllowsNetworkServices() && tapTapGate.required && !tapTapGate.allowed) {
    stopMusic();
    app.innerHTML = renderTapTapGate();
    return;
  }
  app.innerHTML = '\n    <div class="app-shell screen-'.concat(esc(state.screen), '">\n      ').concat(state.toast ? '<div class="toast floating-toast">'.concat(esc(state.toast), "</div>") : "", '\n      <main class="content">\n        ').concat(renderScreen(), "\n      </main>\n      ").concat(renderModal(), "\n    </div>\n  ");
  restorePreservedScrollPositions(preservedScrollPositions);
  const combatLogEl = document.querySelector(".combat-log-box");
  if (combatLogEl) combatLogEl.scrollTop = combatLogEl.scrollHeight;
  const log = document.querySelector(".log-box:not(.static-log)");
  if (log) log.scrollTop = log.scrollHeight;
  syncAudioVolume();
  syncMusicForCurrentScreen();
  syncCombatFloatElements();
}
function renderScreen() {
  if (state.run) initializeSkillState(state.run);
  if (state.run) initializeAbilityState(state.run);
  if (state.screen === "reincarnation") return renderReincarnationResult();
  if (state.screen === "setup") return renderSetup();
  if (state.screen === "draft") return renderDraft();
  if (state.screen === "tower") return state.run ? renderTower() : renderMenu();
  if (state.screen === "combat") return state.combat ? renderCombat() : renderTower();
  if (state.screen === "growth") return renderGrowth();
  if (state.screen === "growthList") return renderGrowthList();
  if (state.screen === "talentEnhance") return renderTalentEnhance();
  if (state.screen === "mercs") return state.run ? renderMercManagement() : renderMenu();
  if (state.screen === "skills") return state.run ? renderSkillTree() : renderMenu();
  if (state.screen === "ability") return state.run ? renderAbilityScreen() : renderMenu();
  if (state.screen === "attrs") return state.run ? renderAttributeScreen() : renderMenu();
  if (state.screen === "equip") return state.run ? renderEquipmentScreen() : renderMenu();
  return renderMenu();
}
function hasSavedRun(mode = null) {
  return !!getSavedRun(mode);
}
function continueRun(mode = null) {
  const normalized = mode ? normalizeRunSaveMode(mode) : null;
  if (state.run && (!normalized || modeOfRun(state.run) === normalized)) {
    if (state.combat) state.screen = "combat";
    else if (!resumePendingBattle()) state.screen = "tower";
  } else {
    if (state.run && !saveGame()) return false;
    if (!loadRunSave(normalized)) return false;
  }
  playMusic(state.combat ? "battle" : "tower");
  render();
  return true;
}
function returnToStartMenu() {
  restoreCombatCheckpoint();
  state.modal = null;
  state.pendingSkill = null;
  state.reincarnationResult = null;
  state.screen = "menu";
  playMusic("city");
  saveGame();
  render();
}
function openCity() {
  state.modal = null;
  state.pendingSkill = null;
  state.reincarnationResult = null;
  state.screen = "growth";
  playMusic("city");
  saveGame();
  render();
}
function renderReincarnationResult() {
  const result = state.reincarnationResult || {
    floor: 0,
    talentPointsGained: 0,
    baseTalentPoints: 0,
    talentPointDifficultyMultiplier: 1,
    difficultyTalentPointBonus: 0,
    doubled: true,
    bestFloor: state.perm.bestFloor || 0,
    totalRuns: state.perm.totalRuns || 0,
    currentTalentPoints: state.perm.talentPoints || 0
  };
  const modeLabel = "".concat(result.modeName || modeDisplayName(result.mode), "最高");
  const title = result.cleared ? "".concat(result.modeName || modeDisplayName(result.mode), "关卡通关") : "轮回终结";
  const difficultyLabel = "".concat(gameMode(result.mode).icon, " ").concat(result.modeName || modeDisplayName(result.mode), "难度");
  return '\n    <section class="reincarnation-screen">\n      <div class="reincarnation-center">\n        <h1>'.concat(title, '</h1>\n        <div class="reincarnation-card">\n          <p class="gold result-difficulty">').concat(difficultyLabel, "</p>\n          ").concat(result.climbNewUnlock != null ? '<div class="climb-unlock-result">🔓 已解锁攀登 Lv.'.concat(result.climbNewUnlock, " · ").concat(esc(climbDifficulty(result.climbNewUnlock).name), "</div>") : "", "\n          ").concat(result.climbHighestCompleted ? '<div class="climb-unlock-result max">🏆 已征服最高攀登难度 Lv.'.concat(CLIMB_MAX_LEVEL, "</div>") : "", '\n          <div class="result-main">本轮最高层数: <b>').concat(Math.floor(result.floor || 0), '</b></div>\n          <div class="result-gain">获得天赋点: <b>+').concat(Math.floor(result.talentPointsGained || 0), "</b></div>\n          ").concat(result.difficultyTalentPointBonus ? '<div class="result-row"><span>难度天赋点加成:</span><b class="gold">+'.concat(Math.floor(result.difficultyTalentPointBonus), " 点</b></div>") : "", "\n          ").concat(privacyAllowsNetworkServices() ? '<button class="result-ad" '.concat(result.doubled ? "disabled" : "", ' onclick="claimReincarnationDouble()">\n            ').concat(result.doubled ? "✅ 已领取双倍天赋点" : "📺 看广告双倍天赋点（再+".concat(Math.floor(result.talentPointsGained || 0), "）"), "\n          </button>") : "", '\n          <div class="result-rule"></div>\n          <div class="result-row"><span>').concat(modeLabel, ":</span><b>").concat(Math.floor(result.bestFloor || 0), ' 层</b></div>\n          <div class="result-row"><span>总轮回次数:</span><b>').concat(Math.floor(result.totalRuns || 0), '</b></div>\n          <div class="result-row current"><span>当前天赋点:</span><b>').concat(Math.floor(result.currentTalentPoints || 0), '</b></div>\n        </div>\n        <button class="result-return" onclick="openCity()">返回主城</button>\n      </div>\n    </section>\n  ');
}
function renderMenu() {
  const savedRun = getSavedRun();
  const hasRun = !!state.run || !!savedRun;
  const currentOrSavedRun = state.run || savedRun;
  const hasHardcoreRun = isHardcoreRun(currentOrSavedRun);
  const normalButtons = hasRun ? '\n          <button class="menu-btn primary" onclick="continueRun()">📜 继续 游戏</button>\n          <button class="menu-btn" onclick="startSetup()">🗡️ 重新 开始</button>\n    ' : '\n          <button class="menu-btn primary" onclick="startSetup()">🗡️ 开始 游戏</button>\n    ';
  const hardcoreButtons = hasHardcoreRun ? '\n          <button class="menu-btn danger" onclick="continueRun()">☠️ 继续硬核冒险</button>\n          <button class="menu-btn danger" onclick="startPresetMode(\'hardcore\')">☠️ 放弃硬核·重新开始</button>\n    ' : '\n          <button class="menu-btn danger" onclick="startPresetMode(\'hardcore\')">☠️ 硬核模式</button>\n    ';
  return '\n    <section class="menu-screen">\n      <div class="menu-center">\n        <div class="menu-rule"></div>\n        <h1 class="menu-title">⚔️ 开局觉醒超神级天赋2 ⚔️</h1>\n        <div class="menu-rule"></div>\n        <div class="menu-stack">\n          '.concat(normalButtons, '\n          <button class="menu-btn muted-btn" onclick="openCity()">🏰 主城</button>\n          ').concat(hardcoreButtons, '\n          <div class="menu-note">无局外永久强化 · 无天赋强化 · 独立难度纪录</div>\n          <button class="menu-btn dual" onclick="startPresetMode(\'dual\')">👥 双英雄模式</button>\n          <div class="menu-note">（测试中）怪物更强，建议毕业后挑战</div>\n          <button class="menu-btn muted-btn" onclick="showPatchNotes()">📋 更新日志 v').concat(APP_VERSION, "</button>\n        </div>\n      </div>\n    </section>\n  ");
}
function startPresetMode(mode) {
  const normalized = normalizeRunSaveMode(mode);
  state.activeMode = normalized;
  if (state.run && modeOfRun(state.run) === normalized) {
    continueRun(normalized);
    return;
  }
  if (getSavedRun()) {
    continueRun(normalized);
    return;
  }
  startSetup();
  state.activeMode = normalized;
  state.setup.mode = normalized;
  if (normalized === "dual" && state.setup.classId === state.setup.secondClassId) state.setup.secondClassId = "mage";
  render();
}
function showPatchNotes() {
  state.modal = {
    title: "更新日志 v".concat(APP_VERSION),
    body: '<div class="log-box static-log">\n      <div class="log-line patch-version-title"><b>v1.1.6</b></div>\n      <div class="log-line">• 新增装备分配“手动”模式，新玩家默认手动；手动时不再显示装备页下方的自动操作。</div>\n      <div class="log-line">• 装备页下方的“开启自动装备”改为仅处理当前装备的“自动”，快选设置仍可选择长期自动装备。</div>\n      <div class="log-line">• 新增“自动选择佣兵装备”开关和手动分配佣兵入口，换下的装备会继续交由玩家处理。</div>\n      <div class="log-line patch-version-title"><b>v1.1.5</b></div>\n      <div class="log-line">• 修复天赋强化后，天赋选择与详情界面仍显示一星属性的问题。</div>\n      <div class="log-line">• 天赋强化页、开局选择、配置确认和局内详情现在会统一显示当前星级与对应属性。</div>\n      <div class="log-line patch-version-title"><b>v1.1.4</b></div>\n      <div class="log-line">• 修复部分 Android 机型上转职页面横向偏移、路线内容显示不全的问题。</div>\n      <div class="log-line">• 优化转职弹窗在不同屏幕宽度下的居中显示，两条进阶路线可完整对照。</div>\n      <div class="log-line patch-version-title"><b>v1.1.3</b></div>\n      <div class="log-line">• 修复部分旧款 Android 机型启动后黑屏、无法进入游戏的问题。</div>\n      <div class="log-line">• 新增启动异常提示；系统组件过旧或资源加载失败时会给出更新与重试指引。</div>\n      <div class="log-line patch-version-title"><b>v1.1.2</b></div>\n      <div class="log-line">• 陨星连发调整：每次施放后，后续陨星魔法消耗增加10点，最高100点；天赋说明同步标明消耗规则。</div>\n      <div class="log-line">• 佣兵管理优化：解雇佣兵前新增二次确认，并明确提示等级、技能、专长进度与装备将一并失去。</div>\n      <div class="log-line patch-version-title"><b>v1.1.1</b></div>\n      <div class="log-line">• 优化启动资源加载，背景音乐改为按当前场景载入，减少进入游戏时的资源占用。</div>\n      <div class="log-line">• 提升长时间游玩的稳定性，修复战斗界面反复刷新后可能造成的内存持续增长。</div>\n      <div class="log-line">• 优化战斗中的自动存档频率，减少设备存储压力与卡顿。</div>\n      <div class="log-line patch-version-title"><b>v1.1.0</b></div>\n      <div class="log-line">• 天罚之手升星同步强化永久生命成长：每次普攻依次增加 1 / 1 / 2 最大生命。</div>\n      <div class="log-line">• 新增攀登模式：每轮固定100层，包含 Lv.1–Lv.50 共50档难度；初始解锁 Lv.1，通关后逐级解锁下一档。</div>\n      <div class="log-line">• 攀登使用独立存档，进入或继续攀登不会覆盖普通冒险进度。</div>\n      <div class="log-line">• 攀登界面直接显示当前敌军基础属性与结算天赋点倍率，Lv.1 均为 ×2.1。</div>\n      <div class="log-line">• 高难度逐步加入护盾、抗性、再生、残血狂怒、低血处决、开场减伤、额外词缀与双Boss终局等公开机制。</div>\n      <div class="log-line patch-version-title"><b>v1.0.6</b></div>\n      <div class="log-line">• 隐私合规说明优化：完善第三方广告 SDK 与 Google 广告标识符（GAID）的处理目的、方式和范围说明。</div>\n      <div class="log-line patch-version-title"><b>v1.0.5</b></div>\n      <div class="log-line">• 技能槽修复：普攻固定占用第 1 个技能槽，最多再装备 5 个技能；旧存档会自动整理为“固定普攻 1 + 可装备技能 5”，已学习技能不会丢失。</div>\n      <div class="log-line">• 自动战斗优化：不再在全队满血时优先施放治疗术，会根据队友生命比例与防御需求选择治疗、辅助或攻击技能，减少错误耗能导致的意外战败。</div>\n      <div class="log-line">• 能量状态修复：进战与队伍属性刷新时会正确保留 0 能量，不再把 0 能量误判为满能量。</div>\n      <div class="log-line">• 快速战斗总结升级：快速战斗结束后会在战斗日志中写入起止生命、护盾与能量、伤害与承伤、治疗与溢出治疗、护盾吸收、技能耗能与使用次数、战斗回合及最终败因等详细统计。</div>\n      <div class="log-line">• 滚动位置修复：快捷选择设置和天赋强化在点击后会保持当前浏览位置，不再每次自动跳回顶部。</div>\n      <div class="log-line">• 能力加点优化：每项能力改为 +1、+10、MAX 三档投入，点数不足时自动禁用对应按钮，并保留全部重置功能。</div>\n      <div class="log-line">• 佣兵试炼场修复：候选佣兵列表现在可在手机上正常向下滑动并查看最后一项。</div>\n      <div class="log-line patch-version-title"><b>v1.0.4</b></div>\n      <div class="log-line">• 永恒守望：新增屏幕底部快速选择，连续点击时不再被剧情选择卡住；神火、神核与遗物奖励调整为三种成长方向。</div>\n      <div class="log-line">• 怪物反击：降低硬壳、守势与荆棘造成的伤害，高层战斗不再容易被反伤瞬间击倒。</div>\n      <div class="log-line">• 新增稀有天赋“反击守护”，可降低受到的怪物反击与荆棘伤害。</div>\n      <div class="log-line patch-version-title"><b>v1.0.3</b></div>\n      <div class="log-line">• 被动天赋树重做：8 个基础职业各有 5 个专属被动；双英雄分别解锁、分别生效，旧版共享被动投入会自动返还为技能点。</div>\n      <div class="log-line">• 战斗提示：英雄以不高于 35% 生命进入战斗时会显示醒目警告，避免在快速战斗中因低血量被集火而误以为开局异常死亡。</div>\n      <div class="log-line">• 快速战斗：失败后会记录入场生命、护盾、致命攻击来源与实际伤害，方便判断真实败因。</div>\n      <div class="log-line">• 猎杀标记修复：敌方施加的效果改为“被猎杀”并明确全体伤害 +20%；游侠专属标记保持原名，重复施加只刷新持续时间、不再显示虚假叠层。</div>\n      <div class="log-line patch-version-title"><b>v1.0.2</b></div>\n      <div class="log-line">• 佣兵酒馆：每名候选现在有20%概率出现高一阶的精良佣兵，招募价格为普通佣兵的2倍；招募页面新增佣兵合成升阶提醒。</div>\n      <div class="log-line">• 移动端适配：低分辨率手机将使用更紧凑的战斗卡片、技能图标和道具按钮，快速战斗按钮始终保留在操作区。</div>\n      <div class="log-line patch-version-title"><b>v1.0.1</b></div>\n      <div class="log-line">• 修复反弹伤害会互相触发，导致双方连续反弹的问题。</div>\n      <div class="log-line patch-version-title"><b>v1.0.0</b></div>\n      <div class="log-line"><b>游戏介绍</b>：《开局觉醒超神级天赋2》是一款回合制 Roguelite 爬塔 RPG。选择职业、觉醒超神级天赋，在战斗与随机事件中组建队伍、收集装备、构筑流派，挑战不断变强的永恒之塔。</div>\n      <div class="log-line"><b>相比一代，本作新增：</b></div>\n      <div class="log-line">• 职业体系扩展：新增“傀儡师”与两条专属晋升路线；全部 8 个基础职业均拥有两条一转路线，并可在第 30 层继续二转。</div>\n      <div class="log-line">• 五档征程：新增普通、冒险、勇士、王者与无尽难度，分别提供 50 至 200 层的阶段目标及无尽挑战。</div>\n      <div class="log-line">• 塔层与 Boss 重构：加入前后排阵型、阶段敌群、章节 Boss 招牌机制，以及每 10 层推进的守塔剧情。</div>\n      <div class="log-line">• 佣兵系统扩展：新增职业专长、专长升星、独立技能、待命编队与同品质合成，并支持智能分配装备。</div>\n      <div class="log-line">• 装备与事件扩展：新增红色装备、橙装升红、词缀追加，以及更多剧情、挑战和资源取舍事件。</div>\n      <div class="log-line">• 客户端体验升级：重制移动端竖屏界面，接入 TapTap 登录、实名认证、防沉迷与可选激励广告。</div>\n    </div>',
    actions: [{ label: "知道了", onClick: () => {
      state.modal = null;
      render();
    } }]
  };
  render();
}
function renderSetup() {
  var _a, _b;
  const modes = [
    { id: "normal", name: "普通", icon: "🏰" },
    { id: "hardcore", name: "硬核", icon: "☠️" },
    { id: "dual", name: "双英雄", icon: "👥" }
  ];
  const classes = classList();
  const selectedTalents = ((_b = (_a = state.run) == null ? void 0 : _a.talents) == null ? void 0 : _b.length) ? state.run.talents : [];
  return '\n    <section class="select-screen">\n      <div class="top-spacer"></div>\n      <div class="selected-summary">\n        <h2>✨ 开局配置</h2>\n        <div class="mode-tabs">'.concat(modes.map((m) => '\n          <button class="'.concat(state.setup.mode === m.id ? "selected" : "", '" onclick="state.setup.mode=\'').concat(m.id, "'; render()\">").concat(m.icon, " ").concat(m.name, "</button>\n        ")).join(""), "</div>\n        ").concat(selectedTalents.length ? selectedTalents.map((t) => "<p><b>".concat(talentTitleHtml(t, { rarityLabel: true }), "</b><br><span>").concat(talentDescriptionHtml(t), "</span></p>")).join("") : '<p class="subtle">先选择职业，再觉醒三次开局天赋。</p>', '\n      </div>\n      <div class="class-grid">').concat(classes.map((c) => classCard(c, state.setup.classId === c.id, "chooseSetupClass('".concat(c.id, "')"))).join(""), "</div>\n      ").concat(state.setup.mode === "dual" ? '\n        <h3 class="section-caption">选择第二英雄</h3>\n        <div class="class-grid">'.concat(classes.filter((c) => c.id !== state.setup.classId).map((c) => classCard(c, state.setup.secondClassId === c.id, "state.setup.secondClassId='".concat(c.id, "'; render()"))).join(""), "</div>\n      ") : "", '\n      <div class="sticky-start"><button class="wide" onclick="beginDraft()">✨ 觉醒天赋</button></div>\n    </section>\n  ');
}
function chooseSetupClass(classId) {
  var _a;
  state.setup.classId = classId;
  if (state.setup.secondClassId === classId) {
    state.setup.secondClassId = ((_a = classList().find((c) => c.id !== classId)) == null ? void 0 : _a.id) || "mage";
  }
  render();
}
function classCard(c, selected, action) {
  return '\n    <div class="class-card '.concat(selected ? "selected" : "", " portrait-card portrait-").concat(classArtId(c.id), '">\n      ').concat(renderClassPortrait(c.id, "class-portrait class-card-portrait", { showBadge: false }), '\n      <div class="class-card-copy">\n        <h3>').concat(c.name, '<span class="class-card-badge" aria-hidden="true">').concat(esc(c.icon || ""), "</span></h3>\n        <p>").concat(esc(c.desc), '</p>\n        <button onclick="').concat(action, '">选择</button>\n      </div>\n    </div>\n  ');
}
function renderDraft() {
  var _a;
  const pickIndex = (((_a = state.draft) == null ? void 0 : _a.pickIndex) || 0) + 1;
  return '\n    <section class="draft-screen">\n      <div class="top-spacer"></div>\n      <div class="draft-caption">选择天赋 ('.concat(pickIndex, "/").concat(state.draft.maxPicks, ')</div>\n      <div class="talent-list">').concat(state.draft.candidates.map((t) => talentCard(t, "selectDraftTalent('".concat(t.id, "')"))).join(""), "</div>\n    </section>\n  ");
}
function talentCard(t, action) {
  return '\n    <div class="talent-card-mobile rarity-'.concat(t.rarity, '">\n      <div class="talent-card-sigil">').concat(talentIconHtml(t, "talent-sigil-icon"), '</div>\n      <div class="talent-card-copy">\n        <h3>').concat(talentTitleHtml(t, { rarityLabel: true, showIcon: false }), "</h3>\n        <p>").concat(talentDescriptionHtml(t), "</p>\n        ").concat(t.classReq ? '<div class="tag-line">'.concat(getClass(t.classReq).icon, " ").concat(getClass(t.classReq).name, "专属</div>") : "", '\n      </div>\n      <button onclick="').concat(action, '">选择此天赋</button>\n    </div>\n  ');
}
function renderGrowth() {
  const growthSummary = DATA.growthTree.some((g) => growthLevel(g.id) > 0) ? DATA.growthTree.filter((g) => growthLevel(g.id) > 0).map((g) => "".concat(g.name, " Lv.").concat(growthLevel(g.id))).join("、") : "暂无加成，在强化中投入天赋点提升";
  const enhanceLv = growthLevel("g_enhance");
  return '\n    <section class="city-screen">\n      <header class="mobile-top">\n        <button onclick="'.concat(state.run ? "state.screen='tower'; render()" : "state.screen='menu'; render()", '">◀ 返回</button>\n        <h2>🏰 主城</h2>\n      </header>\n      <div class="city-content">\n        <div class="city-card profile-card">\n          <h3>⚔️ 冒险者档案</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>最高层数</span><b>第 ').concat(state.perm.bestFloor || 0, ' 层</b></div>\n          <div class="stat-row"><span>轮回次数</span><b>').concat(state.perm.totalRuns || 0, ' 次</b></div>\n          <div class="stat-row"><span>天赋点</span><b class="gold">').concat(state.perm.talentPoints || 0, " 点</b></div>\n        </div>\n        ").concat(renderAttributeGuideButton(), '\n        <div class="city-card">\n          <h3 class="green">📈 永久成长</h3>\n          <div class="divider"></div>\n          <p>').concat(esc(growthSummary), '</p>\n        </div>\n        <div class="city-card">\n          <h3 class="purple">🔨 强化等级</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>技能天赋</span><b>Lv.').concat(growthLevel("g_init_sp"), '/10</b></div>\n          <div class="stat-row"><span>装备强化上限</span><b>+').concat(enhanceLv, "</b></div>\n        </div>\n      </div>\n      ").concat(renderCityNav(), "\n    </section>\n  ");
}
function renderCityNav() {
  return '\n    <footer class="city-nav">\n      <button onclick="'.concat(state.run ? "state.screen='tower'; render()" : "startSetup()", '">⚔️ 出发</button>\n      <button onclick="openMobilePanel(\'growth\')">🔨 强化</button>\n      <button onclick="openMobilePanel(\'growth\')">✨ 天赋</button>\n      <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n    </footer>\n  ');
}
function renderTower() {
  var _a;
  const hasPendingEquip = !!((_a = state.pendingEquip) == null ? void 0 : _a.item);
  return '\n    <section class="play-screen">\n      '.concat(renderHeroStatus(), '\n      <div class="play-main">').concat(hasPendingEquip ? renderPendingEquipStage() : renderEventStage(), "</div>\n      ").concat(renderBottomBars(hasPendingEquip ? "pendingEquip" : "tower"), "\n    </section>\n  ");
}
function renderPendingEquipStage() {
  var _a;
  const item = (_a = state.pendingEquip) == null ? void 0 : _a.item;
  if (!state.run || !item) return renderEventStage();
  const old = state.run.equipment[item.slot] || null;
  const manualMode = quickSettings().equip === "manual";
  const mercTargets = manualMercEquipmentTargets(item);
  return '\n    <section class="loot-equip-stage">\n      <div class="loot-equip-card rarity-'.concat(esc(item.rarity || "white"), '">\n        <h2>🎁 获得新装备！</h2>\n        <div class="loot-compare-grid">\n          ').concat(renderEquipCompareCard(item, "新装备"), "\n          ").concat(renderEquipCompareCard(old, "当前装备"), "\n        </div>\n        ").concat(renderEquipDelta(item, old), '\n        <p class="loot-auto-hint">').concat(manualMode ? "🖐️ 手动模式：指定主角或佣兵穿戴，也可以直接分解。" : "🤖 ".concat(esc(equipmentAssignmentHint(item))), '</p>\n        <div class="loot-actions">\n          <button class="loot-action-equip" onclick="resolvePendingEquip(\'equip\')">装备主角</button>\n          <button class="loot-action-merc" ').concat(mercTargets.length ? "" : "disabled", ' onclick="openMercEquipmentAssignModal()">').concat(mercTargets.length ? "分配佣兵" : "无可用佣兵", '</button>\n          <button class="loot-action-disassemble" onclick="resolvePendingEquip(\'discard\')">分解</button>\n        </div>\n      </div>\n    </section>\n  ');
}
function renderHeroStatus() {
  var _a, _b;
  if (!state.run) return "";
  const member = state.run.party[0];
  const cls = getClass(state.run.classId);
  const stats = calcUnitStats(member);
  const hp = (_a = state.run.currentHp[member.unitId]) != null ? _a : stats.hp;
  const energy = (_b = state.run.currentEnergy[member.unitId]) != null ? _b : stats.energy;
  const expNeed = expForLevel(state.run.level);
  const modeBadge = "".concat(modeName(state.run.mode), " x").concat(runDifficultyMultiplier(state.run));
  return '\n    <header class="hero-status">\n      <div class="hero-row">\n        <div class="hero-identity">\n          '.concat(renderClassPortrait(state.run.classId, "hero-mini-portrait", { showBadge: false }), '\n          <div class="hero-profile">\n            <div class="hero-name"><span>Lv.').concat(state.run.level, '</span></div>\n            <div class="hero-badges">\n              <span>').concat(modeBadge, "</span>\n              <span>🏰 第 ").concat(state.run.floor, " 层</span>\n              <span>").concat(cls.icon, " ").concat(cls.name, '</span>\n            </div>\n          </div>\n        </div>\n      </div>\n      <div class="dual-bars">\n        ').concat(meterLine("生命", hp, stats.hp, "hpbar"), "\n        ").concat(meterLine("魔法", energy, stats.energy, "mpbar"), "\n      </div>\n      ").concat(meterLine("经验", state.run.exp, expNeed, "xpbar"), '\n      <div class="hero-stat-row">\n        <span>⚔️').concat(stats.atk, "</span><span>🔮").concat(stats.matk, "</span><span>🛡️").concat(stats.def, "</span><span>💰").concat(state.run.gold, "</span>\n      </div>\n    </header>\n  ");
}
function meterLine(label, value, max, cls) {
  return '\n    <div class="meter-line">\n      <span>'.concat(label, '</span>\n      <div class="bar ').concat(cls, '"><span style="--w:').concat(pct(value, max), '%"></span><em>').concat(Math.max(0, Math.floor(value)), "/").concat(Math.floor(max || 0), "</em></div>\n    </div>\n  ");
}
function modeName(mode) {
  return modeDisplayName(mode, state.run);
}
const EVENT_BATTLE_CHOICE_RESULTS = /* @__PURE__ */ new Set([
  "fight_normal",
  "fight_elite",
  "fight_boss",
  "bounty_elite",
  "time_rift_challenge",
  "immortal_throne_challenge"
]);
function eventHasBattleChoice(event) {
  var _a;
  return !!((_a = event == null ? void 0 : event.choices) == null ? void 0 : _a.some((choice) => EVENT_BATTLE_CHOICE_RESULTS.has(choice.result)));
}
function eventBattleKind(wrap) {
  var _a, _b, _c2;
  if ((_a = wrap == null ? void 0 : wrap.encounter) == null ? void 0 : _a.kind) return wrap.encounter.kind;
  const results = ((_c2 = (_b = wrap == null ? void 0 : wrap.event) == null ? void 0 : _b.choices) == null ? void 0 : _c2.map((choice) => choice.result)) || [];
  if (results.includes("fight_boss")) return "boss";
  if (results.some((result) => ["fight_elite", "bounty_elite", "time_rift_challenge", "immortal_throne_challenge"].includes(result))) return "elite";
  return "normal";
}
function eventBattleRewardId(wrap) {
  var _a, _b, _c2;
  if (((_a = wrap == null ? void 0 : wrap.event) == null ? void 0 : _a.id) === "evt_bounty_board") return "bounty_elite";
  if (((_b = wrap == null ? void 0 : wrap.event) == null ? void 0 : _b.id) === "evt_time_rift") return "time_rift";
  if (((_c2 = wrap == null ? void 0 : wrap.event) == null ? void 0 : _c2.id) === "evt_immortal_throne") return "immortal_throne";
  return "";
}
function eventBattleKindLabel(kind) {
  if (kind === "boss") return "Boss战";
  if (kind === "elite") return "精英战";
  return "普通战";
}
function battlePreviewEnemyStats(template, floor = ((_j) => (_j = state.run) == null ? void 0 : _j.floor)() || 1) {
  var _a, _b;
  const formationHpScale = (_a = template == null ? void 0 : template.formationHpScale) != null ? _a : 1;
  const formationStatScale = (_b = template == null ? void 0 : template.formationStatScale) != null ? _b : 1;
  const scale = floorScale(floor) * runDifficultyMultiplier(state.run);
  const effects = enemyPassiveAffixEffects((template == null ? void 0 : template.passiveAffixes) || []);
  const modifiers = climbEnemyModifierValues(template, (template == null ? void 0 : template.isBoss) ? "boss" : (template == null ? void 0 : template.isElite) ? "elite" : "normal");
  return {
    hp: Math.max(1, Math.floor(((template == null ? void 0 : template.hp) || 1) * scale * formationHpScale * (1 + (effects.hpPct || 0)) * modifiers.hpMultiplier)),
    atk: Math.max(0, Math.floor(((template == null ? void 0 : template.atk) || 0) * scale * formationStatScale * (1 + (effects.atkPct || 0)) * modifiers.atkMultiplier)),
    matk: Math.max(0, Math.floor(((template == null ? void 0 : template.matk) || 0) * scale * formationStatScale * (1 + (effects.atkPct || 0)) * modifiers.atkMultiplier)),
    def: Math.max(0, Math.floor(((template == null ? void 0 : template.def) || 3) * scale * formationStatScale * (1 + (effects.defPct || 0)) * modifiers.defMultiplier))
  };
}
function enemySkillIntel(skillId) {
  const skill = DATA.enemySkills[skillId];
  if (!skill) return skillId;
  const details = [];
  if ((skill.coeff || 0) > 0) {
    const stat = skill.statKey === "matk" ? "法强" : "攻击";
    details.push("".concat(skill.coeff, "倍").concat(stat).concat(skill.aoe ? "全体" : "", "伤害").concat(skill.hits > 1 ? "×".concat(skill.hits) : ""));
  }
  if (skill.aoeHpPct) details.push("全体".concat(Math.round(skill.aoeHpPct * 100), "%生命伤害"));
  if (skill.stun) details.push("".concat(Math.round(skill.stun * 100), "%眩晕"));
  if (skill.dot) details.push("".concat(skill.dot === "burn" ? "灼烧" : "中毒").concat(skill.dotTurns || 0, "回合"));
  if (skill.debuff) details.push("".concat(buffName(skill.debuff)).concat(skill.debuffTurns || 0, "回合"));
  if (skill.healPct) details.push("回复".concat(Math.round(skill.healPct * 100), "%最大生命"));
  if (skill.shieldPct) details.push("获得".concat(Math.round(skill.shieldPct * 100), "%最大生命护盾"));
  if (skill.buff || skill.buffAllies) details.push(skill.buffAllies ? "强化全体敌军" : "强化自身");
  if (skill.lifestealPct) details.push("吸血".concat(Math.round(skill.lifestealPct * 100), "%"));
  if (skill.chargeUp) details.push("蓄力".concat(skill.chargeTurns || 1, "回合"));
  return "".concat(skill.name).concat(details.length ? "（".concat(details.join("、"), "）") : "");
}
function battleRewardPreview(kind, rewardId = "") {
  var _a, _b, _c2;
  const isElite = kind === "elite";
  const isBoss = kind === "boss";
  let goldBase = isBoss ? 60 : isElite ? 30 : 10;
  if ((_a = state.run) == null ? void 0 : _a.messengerGoldBonus) goldBase *= 1.5;
  const goldTalentPassive = hasTalent("gold_10pct") ? "gold_10pct" : hasTalent("gold_15pct") ? "gold_15pct" : "";
  if (goldTalentPassive) goldBase *= 1 + 0.1 * talentPassiveMultiplier(goldTalentPassive);
  if (hasTalent("gold_30pct")) goldBase *= 1 + 0.3 * talentPassiveMultiplier("gold_30pct");
  let fixedGold = isBoss ? 30 : 0;
  const extras = [];
  if ((((_b = state.run) == null ? void 0 : _b.bountyReward) || rewardId === "bounty_elite") && isElite) {
    fixedGold += 80;
    extras.push("悬赏：必得蓝色装备");
  }
  if (rewardId === "time_rift") {
    fixedGold += 80;
    extras.push("裂隙：必得紫色装备");
  }
  if (rewardId === "immortal_throne") extras.push("王座：必得至少2条词缀的橙色装备");
  const climbGoldMultiplier = 1 - clamp(climbEffects(state.run).battleGoldPenaltyPct || 0, 0, 0.95);
  let exp = battleExpForFloor(((_c2 = state.run) == null ? void 0 : _c2.floor) || 1, kind);
  if (hasTalent("xp_boost")) exp = Math.floor(exp * (1 + 0.2 * talentPassiveMultiplier("xp_boost")));
  const equipChance = isBoss ? 1 : isElite ? 0.6 : 0.3;
  const itemChance = Math.min(1, hasTalent("item_magnet") ? 1 : (isBoss ? 0.7 : isElite ? 0.45 : 0.25) + (hasTalent("scavenger") ? 0.1 * talentPassiveMultiplier("scavenger") : 0));
  return {
    goldMin: Math.floor((Math.floor(goldBase * 0.8) + fixedGold) * climbGoldMultiplier),
    goldMax: Math.floor((Math.floor(goldBase * 1.2) + fixedGold) * climbGoldMultiplier),
    exp: Math.floor(exp),
    equipChance,
    itemChance,
    extras
  };
}
function renderBattleEnemyIntel(template, floor) {
  const stats = battlePreviewEnemyStats(template, floor);
  const skillIds = activeEnemySkills(template, floor);
  const skillNames = skillIds.map((id) => {
    var _a;
    return ((_a = DATA.enemySkills[id]) == null ? void 0 : _a.name) || id;
  });
  const affixes = template.passiveAffixes || [];
  const feature = template.mechanicHint || template.desc || "";
  const role = template.isBoss ? template.isChapterBoss ? "章节Boss" : "Boss" : template.role || DATA.enemyTemplateRoles[template.id] || "怪物";
  return '\n    <article class="battle-intel-enemy">\n      <div class="battle-intel-enemy-head">\n        <span class="battle-intel-enemy-icon">'.concat(esc(template.icon || "👹"), "</span>\n        <div><b>").concat(esc(template.name || "未知敌人"), "</b><small>").concat(esc(role), '</small></div>\n      </div>\n      <div class="battle-intel-stat-grid" aria-label="敌人属性">\n        <span><small>生命</small>').concat(stats.hp, "</span>\n        <span><small>攻击</small>").concat(stats.atk, "</span>\n        <span><small>法强</small>").concat(stats.matk, "</span>\n        <span><small>防御</small>").concat(stats.def, "</span>\n      </div>\n      ").concat(feature ? '<p class="battle-intel-feature"><b>作战特点</b>'.concat(esc(feature), "</p>") : "", '\n      <p class="battle-intel-skill-line"><b>技能</b>').concat(esc(skillNames.join("、") || "普通攻击"), '</p>\n      <details class="battle-intel-details">\n        <summary>查看技能机制</summary>\n        <ul>').concat(skillIds.map((id) => "<li>".concat(esc(enemySkillIntel(id)), "</li>")).join(""), "</ul>\n      </details>\n      ").concat(affixes.length ? '\n        <details class="battle-intel-details battle-intel-affixes">\n          <summary>敌军词条 '.concat(affixes.length, "条：").concat(esc(affixes.map(enemyPassiveAffixLabel).join("、")), "</summary>\n          <ul>").concat(affixes.map((affix) => {
    const quality = DATA.enemyPassiveAffixQualities[affix.quality] || DATA.enemyPassiveAffixQualities.common;
    return '<li class="enemy-affix-'.concat(esc(quality.id), '"><b>').concat(esc(quality.name), "·").concat(esc(affix.name), "</b>").concat(esc(affix.desc || ""), "</li>");
  }).join(""), "</ul>\n        </details>\n      ") : "", "\n    </article>\n  ");
}
function renderEventBattleIntel(wrap, options = {}) {
  var _a, _b;
  if (!eventHasBattleChoice(wrap == null ? void 0 : wrap.event)) return "";
  const floor = ((_a = state.run) == null ? void 0 : _a.floor) || 1;
  const kind = eventBattleKind(wrap);
  const encounter = (wrap == null ? void 0 : wrap.encounter) || null;
  const templates = (encounter == null ? void 0 : encounter.templates) || [];
  const rewardId = eventBattleRewardId(wrap);
  const reward = battleRewardPreview(kind, rewardId);
  const formationName = ((_b = encounter == null ? void 0 : encounter.formation) == null ? void 0 : _b.name) || (kind === "boss" ? "Boss守卫" : kind === "elite" ? "随机精英编队" : "随机敌军编队");
  const stage = (encounter == null ? void 0 : encounter.stage) || getEnemyStage(floor);
  const rules = [];
  if (encounter == null ? void 0 : encounter.isDoubleBoss) rules.push("本场为双Boss战，两名首领同时登场");
  if (rewardId === "bounty_elite") rules.push("悬赏目标按当前层精英强度生成");
  if (rewardId === "time_rift") rules.push("敌军按当前层精英强度生成");
  if (rewardId === "immortal_throne") rules.push("不朽守卫生命×1.25，攻击、法强、防御×1.15");
  return '\n    <section class="event-battle-intel" aria-label="本场战斗情报">\n      <div class="battle-intel-title">\n        <div><span>⚔️</span><div><small>开战前侦察</small><h3>本场战斗情报</h3></div></div>\n        <div class="battle-intel-title-actions">\n          <b class="battle-intel-kind">'.concat(eventBattleKindLabel(kind), "</b>\n          ").concat(options.modal ? '<button type="button" class="battle-intel-modal-close" onclick="closeEventBattleIntel()" aria-label="关闭战斗情报">×</button>' : "", '\n        </div>\n      </div>\n      <div class="battle-intel-overview">\n        <span><small>当前层数</small>第').concat(floor, "层</span>\n        <span><small>敌军阶段</small>").concat(esc((stage == null ? void 0 : stage.name) || "未知阶段"), "</span>\n        <span><small>敌军编队</small>").concat(esc(formationName), "</span>\n        <span><small>敌人数量</small>").concat(templates.length || "待生成", "名</span>\n      </div>\n      ").concat(rules.length ? '<div class="battle-intel-rules"><b>特殊规则</b>'.concat(rules.map((rule) => "<span>".concat(esc(rule), "</span>")).join(""), "</div>") : "", "\n      ").concat(templates.length ? '<div class="battle-intel-enemy-grid">'.concat(templates.map((template) => renderBattleEnemyIntel(template, floor)).join(""), "</div>") : '<p class="battle-intel-pending">进入战斗时将从当前层精英池生成敌军，实际阵容会在开战后锁定。</p>', '\n      <div class="battle-intel-reward">\n        <div><small>胜利结算</small><b>').concat(reward.goldMin === reward.goldMax ? reward.goldMin : "".concat(reward.goldMin, "~").concat(reward.goldMax), "金币 · ").concat(reward.exp, "经验</b></div>\n        <div><small>额外掉落</small><b>装备").concat(Math.round(reward.equipChance * 100), "% · 道具").concat(Math.round(reward.itemChance * 100), "%</b></div>\n        ").concat(reward.extras.map((extra) => "<p>🎁 ".concat(esc(extra), "</p>")).join(""), '\n      </div>\n      <p class="battle-intel-defeat">失败后按正常战败流程处理。</p>\n    </section>\n  ');
}
function renderEventBattleIntelTrigger(wrap) {
  var _a, _b;
  if (!eventHasBattleChoice(wrap == null ? void 0 : wrap.event)) return "";
  const kind = eventBattleKind(wrap);
  const enemyCount = ((_b = (_a = wrap == null ? void 0 : wrap.encounter) == null ? void 0 : _a.templates) == null ? void 0 : _b.length) || 0;
  return '\n    <button type="button" class="event-battle-intel-trigger" onclick="openEventBattleIntel()">\n      <span class="battle-intel-trigger-icon">⚔️</span>\n      <span class="battle-intel-trigger-copy">\n        <b>查看本场战斗情报</b>\n        <small>'.concat(eventBattleKindLabel(kind)).concat(enemyCount ? " · ".concat(enemyCount, "名敌人") : "", " · 阵容、技能、词条与奖励</small>\n      </span>\n      <em>查看 ›</em>\n    </button>\n  ");
}
function openEventBattleIntel() {
  const wrap = currentEventWrap();
  if (!eventHasBattleChoice(wrap == null ? void 0 : wrap.event)) return;
  state.modal = {
    title: "",
    className: "battle-intel-modal",
    body: renderEventBattleIntel(wrap, { modal: true }),
    actions: []
  };
  render();
}
function closeEventBattleIntel() {
  var _a;
  if (((_a = state.modal) == null ? void 0 : _a.className) !== "battle-intel-modal") return;
  state.modal = null;
  render();
}
function renderEventStage() {
  var _a;
  const wrap = currentEventWrap();
  const total = state.floorEvents.length || 6;
  if (state.eventResult && state.eventResult.eventIdx === state.eventIdx) return renderEventResultStage(state.eventResult, total);
  if (state.shopOpen && ((_a = wrap == null ? void 0 : wrap.event) == null ? void 0 : _a.id) === "evt_item_shop") return renderItemShopStage(wrap);
  if (!wrap) {
    return '\n      <div class="event-head"><span>事件 '.concat(total, "/").concat(total, '</span></div>\n      <div class="event-card big-event event-scene scene-tower">').concat(renderEventBadge("🏁"), '<div class="event-copy"><h2>本层清理完毕</h2><p>继续前往下一层。</p></div></div>\n      <div class="choice-list"><button onclick="advanceFloor()">进入下一层</button></div>\n    ');
  }
  const isBoss = wrap.event.type === "boss";
  const isItemShop = wrap.event.id === "evt_item_shop";
  const eventText = isItemShop ? "一位神秘的行商拦住了你，打开了装满药剂和卷轴的背包。" : wrap.event.text;
  const choices = isItemShop ? [{ text: "🎒 浏览道具", result: "buy_item", desc: "购买消耗品道具" }, { text: "离开", result: "nothing" }] : wrap.event.choices;
  return '\n    <div class="event-head">\n      <span>事件 '.concat(Math.min(state.eventIdx + 1, total), "/").concat(total, "</span>\n      ").concat(isBoss ? "" : '<button class="boss-btn" onclick="directChallengeBoss()">⚡ 直接挑战Boss</button>', '\n    </div>\n    <div class="event-card big-event event-scene ').concat(eventSceneClass(wrap.event), '">\n      ').concat(renderEventBadge(wrap.event), '\n      <div class="event-copy">\n        <h2>').concat(esc(wrap.event.name), " ").concat(renderEventRarity(wrap.event), "</h2>\n        <p>").concat(esc(eventText), "</p>\n      </div>\n    </div>\n    ").concat(renderEventBattleIntelTrigger(wrap), "\n    ").concat(isItemShop ? '<div class="choice-caption">购买消耗品道具</div>' : "", '\n    <div class="choice-list">').concat(choices.map((choice, idx) => {
    var _a2, _b;
    const cost = eventChoiceCost(choice);
    const disabledReason = eventChoiceDisabledReason(choice);
    const disabled = !!disabledReason;
    return '\n      <button class="'.concat(((_a2 = choice.result) == null ? void 0 : _a2.includes("fight")) ? "combat-choice" : "", " ").concat(disabled ? "unavailable" : "", '" ').concat(disabled ? "disabled" : "", ' onclick="resolveEventChoice(').concat(idx, ')">\n        ').concat(((_b = choice.result) == null ? void 0 : _b.includes("fight")) ? "⚡ " : "").concat(esc(choice.text), "\n        ").concat(cost ? "<small>".concat(cost, " 金币</small>") : "", "\n        ").concat(choice.desc && !isItemShop ? "<small>".concat(esc(choice.desc), "</small>") : "", "\n        ").concat(disabledReason ? '<small class="choice-disabled-reason">无法选择：'.concat(esc(disabledReason), "</small>") : "", "\n      </button>\n    ");
  }).join(""), "</div>\n  ");
}
function renderItemShopStage(wrap) {
  var _a;
  wrap.shopItems || (wrap.shopItems = defaultShopItems());
  wrap.shopSoldOut || (wrap.shopSoldOut = {});
  const rows = wrap.shopItems.map((id) => {
    var _a2, _b;
    const item = DATA.items[id];
    if (!item) return "";
    const soldOut = !!wrap.shopSoldOut[id];
    const price = itemShopPrice(item);
    const affordable = (((_a2 = state.run) == null ? void 0 : _a2.gold) || 0) >= price;
    const unavailableReason = soldOut ? "已售罄" : !affordable ? "金币不足（持有 ".concat(((_b = state.run) == null ? void 0 : _b.gold) || 0, " / 需要 ").concat(price, "）") : "";
    return '\n      <div class="shop-item '.concat(unavailableReason ? "sold-out" : "", '">\n        <div class="shop-item-main">\n          <h3>').concat(item.icon, " ").concat(esc(item.name), "</h3>\n          <p>").concat(esc(item.desc), "</p>\n          ").concat(unavailableReason ? '<small class="shop-disabled-reason">'.concat(esc(unavailableReason), "</small>") : "", '\n        </div>\n        <button class="shop-price" ').concat(unavailableReason ? "disabled" : "", " onclick=\"buyShopItem('").concat(id, "')\">").concat(soldOut ? "已售罄" : !affordable ? "金币不足" : "💰".concat(price), "</button>\n      </div>\n    ");
  }).join("");
  return '\n    <section class="shop-stage">\n      <h2>🎒 行商的道具</h2>\n      <div class="shop-list">'.concat(rows, '</div>\n      <div class="shop-footer">\n        <span class="shop-gold">💰 ').concat(((_a = state.run) == null ? void 0 : _a.gold) || 0, '</span>\n        <button class="shop-leave" onclick="leaveItemShop()">离开商店</button>\n      </div>\n    </section>\n  ');
}
function renderEventResultStage(result, total) {
  const lines = String(result.message || "你继续前行。").split(/\n+/).filter(Boolean);
  const sceneEvent = { id: result.eventId || "", type: result.eventType || "" };
  return '\n    <div class="event-head"><span>事件 '.concat(Math.min(state.eventIdx + 1, total), "/").concat(total, '</span></div>\n    <div class="event-card big-event event-result-card event-scene ').concat(eventSceneClass(sceneEvent), '">\n      ').concat(renderEventBadge({ id: result.eventId, name: result.eventName, icon: result.eventIcon || "📜" }), '\n      <div class="event-copy">\n      <h2>事件结算</h2>\n      <div class="event-result-meta">\n        <span>').concat(esc(result.eventName || "事件"), "</span>\n        ").concat(result.choiceText ? "<b>".concat(esc(result.choiceText), "</b>") : "", '\n      </div>\n      <div class="event-result-lines">\n        ').concat(lines.map((line) => "<p>".concat(esc(line), "</p>")).join(""), '\n      </div>\n      </div>\n    </div>\n    <div class="choice-list"><button onclick="continueEventResult()">继续</button></div>\n  ');
}
function directChallengeBoss() {
  state.eventResult = null;
  state.shopOpen = false;
  state.eventIdx = Math.max(0, state.floorEvents.length - 1);
  saveGame();
  render();
}
function renderBottomBars(context) {
  var _a;
  if (context === "pendingEquip") {
    if (quickSettings().equip === "manual") return "";
    return '\n      <footer class="bottom-bars loot-auto-footer">\n        <button class="loot-auto-continue" onclick="resolvePendingEquip(\'auto\')">自动<small>仅智能分配当前装备，无法提升时分解</small></button>\n      </footer>\n    ';
  }
  const quickLabel = context === "combat" ? "快速战斗" : quickChoiceLabel();
  return '\n      <footer class="bottom-bars">\n      <div class="function-grid">\n        <button onclick="openMobilePanel(\'bag\')">🎒 背包 ('.concat(itemCount(), ")</button>\n        <button onclick=\"openMobilePanel('equip')\">⚔️ 装备</button>\n        <button onclick=\"openMobilePanel('skills')\">📖 技能 (").concat(((_a = state.run) == null ? void 0 : _a.skillPoints) || 0, ')</button>\n        <button onclick="openMobilePanel(\'talents\')">📜 天赋</button>\n        <button onclick="openMobilePanel(\'attrs\')">📊 属性</button>\n        <button onclick="openMercManagement()">🗡️ 佣兵</button>\n        <button onclick="reincarnate()">🔁 转生</button>\n        <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n      </div>\n      <div class="quick-row">\n        <button class="quick-settings" onclick="openQuickSelectSettings()">⚙️ 快速设置</button>\n        <button class="quick-select" onclick="').concat(context === "combat" ? "quickBattle()" : "quickSelectCurrent()", '">⚡ 快速选择（').concat(esc(quickLabel), "）</button>\n      </div>\n    </footer>\n  ");
}
function itemCount() {
  var _a;
  return Object.values(((_a = state.run) == null ? void 0 : _a.items) || {}).reduce((sum, n) => sum + n, 0);
}
function quickChoiceLabel() {
  var _a, _b, _c2, _d2, _e2, _f2, _g;
  if (state.eventResult && state.eventResult.eventIdx === state.eventIdx) return "继续";
  const wrap = currentEventWrap();
  if (((_a = wrap == null ? void 0 : wrap.event) == null ? void 0 : _a.id) === "evt_item_shop") {
    const setting = quickSettings().itemShop || "normal";
    if (setting === "auto") return "🎒 自动购买";
    if (setting === "skip") return "离开商店";
    return "🎒 浏览道具";
  }
  const idx = quickChoiceIndex(wrap);
  return ((_d2 = (_c2 = (_b = wrap == null ? void 0 : wrap.event) == null ? void 0 : _b.choices) == null ? void 0 : _c2[idx]) == null ? void 0 : _d2.text) || ((_g = (_f2 = (_e2 = wrap == null ? void 0 : wrap.event) == null ? void 0 : _e2.choices) == null ? void 0 : _f2[0]) == null ? void 0 : _g.text) || "继续";
}
function quickSelectCurrent() {
  if (state.eventResult && state.eventResult.eventIdx === state.eventIdx) return continueEventResult();
  const wrap = currentEventWrap();
  if (!wrap) return advanceFloor();
  resolveEventChoice(quickChoiceIndex(wrap), { quick: true });
}
function renderCombat() {
  var _a;
  if ((_a = state.pendingEquip) == null ? void 0 : _a.item) {
    return '\n      <section class="play-screen">\n        '.concat(renderHeroStatus(), '\n        <div class="play-main">').concat(renderPendingEquipStage(), "</div>\n        ").concat(renderBottomBars("pendingEquip"), "\n      </section>\n    ");
  }
  const c = state.combat;
  const enemyCols = combatUnitCols(c.enemies.length);
  const allyCols = combatUnitCols(c.allies.length);
  return '\n    <section class="combat-screen '.concat(combatSceneClass(c), " ").concat(c.phase === "victory" ? "combat-victory" : "", '">\n      ').concat(renderCombatFloatLayer(), '\n      <div class="combat-board">\n        <div class="unit-grid ').concat(combatUnitGridClass(c.enemies.length, "enemy-grid"), '" style="--unit-cols:').concat(enemyCols, '">').concat(c.enemies.map((e, idx) => renderUnitCard(e, idx, !!state.pendingSkill)).join(""), '</div>\n        <div class="unit-grid ').concat(combatUnitGridClass(c.allies.length, "ally-grid"), '" style="--unit-cols:').concat(allyCols, '">').concat(c.allies.map((a) => renderUnitCard(a)).join(""), '</div>\n        <div class="combat-log-box">\n          ').concat(combatLogDisplayLines(c.log).map((line) => '<div class="log-line">'.concat(colorCombatLog(line), "</div>")).join(""), "\n        </div>\n      </div>\n      ").concat(renderBattleActions(), "\n    </section>\n  ");
}
function renderUnitCard(unit, idx = null, targetable = false) {
  var _a, _b, _c2;
  const active = ((_a = state.combat) == null ? void 0 : _a.activeUnitId) === unit.unitId;
  const targetSerial = ((_b = state.combat) == null ? void 0 : _b.targetSelectSerial) || ((_c2 = state.combat) == null ? void 0 : _c2.inputSerial) || 0;
  const click = targetable && unit.side === "enemy" && unit.alive ? 'onclick="clickTarget('.concat(idx, ", ").concat(targetSerial, ')"') : "";
  const stats = unit.stats || {};
  const impact = consumeCombatImpactFloat(unit);
  const impactClass = combatImpactClass(impact);
  const impactStyle = combatImpactStyle(impact);
  return '\n    <div class="unit-card '.concat(unit.side, " ").concat(unit.isCommandPuppet ? "command-puppet" : "", " ").concat(active ? "active" : "", " ").concat(impactClass, " ").concat(click ? "targetable" : "", '" data-unit-id="').concat(esc(unit.unitId), '"').concat(impactStyle, " ").concat(click, ">\n      ").concat(renderUnitPortrait(unit), '\n      <div class="unit-title ').concat(unit.side === "enemy" ? "red" : "blue", '">').concat(esc(unit.name), "</div>\n      ").concat(renderPuppetCoreStrip(unit), "\n      ").concat(unit.side === "enemy" && unit.intentText ? '<div class="unit-intent">'.concat(esc(unit.intentIcon || ""), " ").concat(esc(unit.intentText), "</div>") : "", '\n      <div class="unit-stats">⚔️').concat(stats.atk || 0, " 🔮").concat(stats.matk || 0, " 🛡️").concat(stats.def || 0, '</div>\n      <div class="unit-bars">\n        ').concat(barRow("生命", unit.hp, unit.maxHp, "hpbar"), "\n        ").concat(unit.side === "ally" && !unit.isCommandPuppet ? barRow("魔法", unit.energy, unit.stats.energy, "mpbar") : "", "\n        ").concat(unit.shield > 0 ? barRow("护盾", unit.shield, Math.max(unit.shield, unit.maxHp), "shieldbar") : "", '\n      </div>\n      <div class="buff-row">').concat(Object.entries(unit.buffs || {}).map(([id, b]) => '<span class="buff">'.concat(buffName(id)).concat(b.stacks > 1 ? "x".concat(b.stacks) : "", "</span>")).join(""), "</div>\n    </div>\n  ");
}
function renderPuppetCoreStrip(unit) {
  var _a, _b, _c2;
  if (!(unit == null ? void 0 : unit.isCommandPuppet)) return "";
  const owner = commandPuppetOwner(unit, true);
  if (!owner) return "";
  const chips = [];
  const link = unit.redirectState;
  if ((link == null ? void 0 : link.charges) > 0 && (((_a = state.combat) == null ? void 0 : _a.turn) || 0) <= (link.expiresTurn || 0)) {
    chips.push('<span class="puppet-core-chip">替身×'.concat(link.charges, "</span>"));
  }
  if (((_b = unit.commandEcho) == null ? void 0 : _b.charges) > 0) {
    chips.push('<span class="puppet-core-chip active">回响×'.concat(unit.commandEcho.charges, "</span>"));
  }
  if (isTalentOwner(owner) && hasTalent("command_circuit")) {
    chips.push('<span class="puppet-core-chip">回路'.concat(Math.min(3, ((_c2 = owner.commandCircuitIds) == null ? void 0 : _c2.length) || 0), "/3</span>"));
  }
  if (isTalentOwner(owner) && hasTalent("immortal_core")) {
    chips.push('<span class="puppet-core-chip '.concat(unit.immortalCoreUsed ? "spent" : "ready", '">重构').concat(unit.immortalCoreUsed ? "已用" : "可用", "</span>"));
  }
  if (owner.classId === "puppet_emperor") {
    chips.push('<span class="puppet-core-chip active">齐鸣'.concat(owner.puppetEmperorCommands || 0, "/3</span>"));
  }
  return chips.length ? '<div class="puppet-core-strip" aria-label="傀儡特殊状态">'.concat(chips.join(""), "</div>") : "";
}
function barRow(label, value, max, cls) {
  return '<div class="bar-row '.concat(cls, '-row"><span>').concat(label, '</span><div class="bar ').concat(cls, '"><span style="--w:').concat(pct(value, max), '%"></span><em>').concat(Math.max(0, Math.floor(value)), "/").concat(Math.floor(max || 0), "</em></div></div>");
}
function renderBattleActions() {
  const active = getActivePlayer();
  const lowHpWarning = renderBattleEntryLowHealthWarning();
  if (state.combat.phase === "victory") return renderBattleResult();
  if (state.combat.phase === "defeat") return '<footer class="battle-actions battle-defeat-actions"><button class="danger wide defeat-reincarnate" onclick="reincarnate()">转生</button>'.concat(!canUseAdRevive() || !privacyAllowsNetworkServices() ? "" : '<button class="wide defeat-revive" onclick="reviveFromAd()">📺 看广告复活（全队满血满能）</button>', "</footer>");
  if (state.combat.phase !== "player_choose" || !active) return '<footer class="battle-actions">'.concat(lowHpWarning, '<button class="wide" onclick="advanceCombat()">继续</button><button class="wide quick-combat" onclick="quickBattle()">⚡ 快速战斗</button></footer>');
  const inputSerial = state.combat.inputSerial || 0;
  const skills = classSkillsFor(active);
  const items = Object.entries(state.run.items || {});
  const skillCols = Math.min(Math.max(skills.length, 1), 6);
  const itemCols = Math.min(Math.max(items.length, 1), 6);
  return '\n    <footer class="battle-actions battle-player-actions">\n      '.concat(lowHpWarning, '\n      <div class="battle-action-scroll">\n        ').concat(state.pendingSkill ? '<div class="target-hint">选择一个敌方目标</div>' : "", '\n        <div class="skill-grid" style="--count:').concat(skillCols, '">').concat(skills.map((s) => {
    const cost = actualSkillCost(active, s);
    const cd = active.cooldowns[s.id] || 0;
    const blockReason = skillUseBlockReason(active, s);
    const feedback = blockReason ? skillUseBlockFeedback(active, s, blockReason) : null;
    const blockedClass = blockReason ? " skill-blocked skill-blocked-".concat(safeToken(blockReason, "unavailable")).concat(blockReason === "silence" ? " silence-blocked" : "") : "";
    const blockedAttrs = feedback ? ' aria-disabled="true" title="'.concat(esc(feedback.message), '"') : "";
    return '<button type="button" class="skill-btn skill-btn-'.concat(safeToken(s.id, "skill")).concat(blockedClass, '"').concat(blockedAttrs, " onclick=\"clickSkill('").concat(s.id, "', ").concat(inputSerial, ')"><span class="skill-btn-content">').concat(renderSkillIcon(s), '<span class="skill-btn-name">').concat(esc(s.name), "</span></span><small>").concat(feedback ? esc(feedback.hint) : "魔法:".concat(cost).concat(cd ? " 冷却:".concat(cd) : ""), "</small></button>");
  }).join(""), '</div>\n        <div class="item-grid">').concat(Object.entries(state.run.items || {}).map(([id, count]) => {
    var _a, _b;
    return '<button class="item-btn" onclick="useCombatItem(\''.concat(id, "', ").concat(inputSerial, ')">').concat(((_a = DATA.items[id]) == null ? void 0 : _a.icon) || "🎒", " ").concat(((_b = DATA.items[id]) == null ? void 0 : _b.name) || id, "<small>x").concat(count, "</small></button>");
  }).join(""), '</div>\n      </div>\n      <button class="wide quick-combat" onclick="quickBattle()">⚡ 快速战斗</button>\n    </footer>\n  ');
}
function renderBattleResult() {
  var _a, _b;
  const result = ((_a = state.combat) == null ? void 0 : _a.result) || {};
  const rewardParts = [];
  if (result.gold) rewardParts.push("".concat(result.gold, " 金币"));
  if (result.exp) rewardParts.push("".concat(result.exp, " 经验"));
  if (result.levelUps) rewardParts.push("升级到 Lv.".concat(((_b = state.run) == null ? void 0 : _b.level) || 1));
  for (const extra of result.extras || []) rewardParts.push(esc(extra));
  for (const drop of result.drops || []) rewardParts.push(esc(drop));
  return '\n    <footer class="battle-actions battle-result">\n      <h2>'.concat(esc(result.title || "🎉 胜利！"), "</h2>\n      <p>奖励: ").concat(rewardParts.length ? rewardParts.join("，") : "无", '</p>\n      <button class="wide" onclick="afterBattleContinue()">继续</button>\n    </footer>\n  ');
}
function openMobilePanel(type) {
  if (type === "settings") {
    openSettingsModal();
    return;
  }
  if (type === "ability") {
    openAbilityScreen();
    return;
  }
  if (type === "equip") {
    openEquipmentScreen();
    return;
  }
  if (type === "skills") {
    openSkillTree(state.skillTab || "active");
    return;
  }
  if (type === "attrs") {
    openAttributeScreen();
    return;
  }
  if (type === "talents") {
    state.modal = {
      title: "",
      body: renderMobileTalentPanel(),
      className: "talent-modal",
      actions: []
    };
    render();
    return;
  }
  if (type === "merc") {
    openMercManagement();
    return;
  }
  const panels = {
    bag: ["背包", renderBagPanel()],
    skills: ["技能", renderSkillsPanel()],
    ability: ["能力", renderAbilityPanel()],
    attrs: ["属性", renderAttributePanel()],
    growth: ["永久成长", renderGrowthPanel()]
  };
  const [title, body] = panels[type] || ["信息", "<p>暂无内容。</p>"];
  state.modal = {
    title,
    body,
    actions: [{ label: "关闭", className: "ghost", onClick: () => {
      state.modal = null;
      render();
    } }]
  };
  render();
}
function openMercManagement() {
  if (!state.run) return;
  state.modal = null;
  state.screen = "mercs";
  render();
}
function closeMercManagement() {
  state.screen = state.run ? "tower" : "menu";
  render();
}
function openSkillTree(tab = "active") {
  if (!state.run) return;
  initializeSkillState(state.run);
  state.modal = null;
  state.skillTab = tab;
  state.screen = "skills";
  render();
}
function closeSkillTree() {
  state.screen = state.run ? "tower" : "menu";
  render();
}
function openAbilityScreen() {
  openSkillTree("ability");
}
function closeAbilityScreen() {
  state.screen = state.run ? "tower" : "menu";
  render();
}
function openAttributeScreen() {
  if (!state.run) return;
  state.modal = null;
  state.screen = "attrs";
  render();
}
function closeAttributeScreen() {
  state.screen = state.run ? "tower" : "menu";
  render();
}
function openEquipmentScreen() {
  var _a;
  if (!state.run) return;
  state.modal = null;
  (_a = state.run).equipmentLocks || (_a.equipmentLocks = {});
  state.screen = "equip";
  render();
}
function closeEquipmentScreen() {
  state.screen = state.run ? "tower" : "menu";
  render();
}
function toggleEquipLock(slot) {
  var _a;
  if (!state.run || !DATA.equipSlots.includes(slot)) return;
  (_a = state.run).equipmentLocks || (_a.equipmentLocks = {});
  state.run.equipmentLocks[slot] = !state.run.equipmentLocks[slot];
  saveGame();
  render();
}
function toggleAutoDiscardLowQualityEquip() {
  state.perm.autoDiscardLowQualityEquip = !state.perm.autoDiscardLowQualityEquip;
  saveGame();
  render();
}
function renderEquipmentScreen() {
  var _a;
  (_a = state.run).equipmentLocks || (_a.equipmentLocks = {});
  return '\n    <section class="equipment-screen">\n      <header class="mobile-top equip-top">\n        <button onclick="closeEquipmentScreen()">◀ 返回</button>\n        <h2>⚔️ 装备</h2>\n      </header>\n      <div class="equipment-content">\n        <label class="equip-toggle-row">\n          <button class="switch '.concat(state.perm.autoDiscardLowQualityEquip ? "on" : "", '" onclick="toggleAutoDiscardLowQualityEquip()"></button>\n          <span>自动丢弃低品质装备</span>\n        </label>\n        <div class="equipment-list">\n          ').concat(DATA.equipSlots.map(renderEquipmentSlotCard).join(""), "\n        </div>\n        ").concat(renderActiveSetBonuses(), "\n      </div>\n    </section>\n  ");
}
function renderEquipmentSlotCard(slot) {
  var _a, _b, _c2, _d2, _e2, _f2;
  const item = (_b = (_a = state.run) == null ? void 0 : _a.equipment) == null ? void 0 : _b[slot];
  const lv = ((_d2 = (_c2 = state.run) == null ? void 0 : _c2.enhanceLevels) == null ? void 0 : _d2[slot]) || 0;
  const locked = !!((_f2 = (_e2 = state.run) == null ? void 0 : _e2.equipmentLocks) == null ? void 0 : _f2[slot]);
  if (!item) {
    return '\n      <article class="equipment-slot-card empty">\n        <div class="equipment-card-head">\n          '.concat(renderEquipArt(slot, "equip-art equipment-card-art", "empty"), "\n          <h3>").concat(DATA.equipSlotNames[slot], ": 空</h3>\n        </div>\n      </article>\n    ");
  }
  return '\n    <article class="equipment-slot-card rarity-'.concat(esc(item.rarity || "white"), '">\n      <button class="equip-lock" onclick="toggleEquipLock(\'').concat(slot, "')\">").concat(locked ? "🔒" : "🔓", '</button>\n      <div class="equipment-card-head">\n        ').concat(renderEquipArt(slot, "equip-art equipment-card-art", item.rarity || "white"), "\n        <h3>").concat(DATA.equipSlotNames[slot], ": ").concat(esc(item.name), " Lv.").concat(item.level || 1).concat(lv ? " +".concat(lv) : "", '</h3>\n      </div>\n      <div class="equip-stat-lines">').concat(equipmentStatLines(item).map((line) => "<div>".concat(line, "</div>")).join(""), '</div>\n      <div class="equip-score">评分 ').concat(equipmentScoreForMember(item, state.run.party.find((member) => member.isPlayer && member.unitId === "player")), "</div>\n    </article>\n  ");
}
function equipmentStatLines(item) {
  var _a;
  if (!item) return [];
  const lines = [];
  const set = getSetDef(item.setId);
  if (set) lines.push("【套装】".concat(set.name, "：").concat(((_a = set.bonus2) == null ? void 0 : _a.desc) || ""));
  for (const stat of item.baseStats || []) lines.push("".concat(STAT_LABEL[stat.stat] || stat.name || stat.stat, " +").concat(Math.floor(stat.value || 0)));
  for (const affix of item.affixes || []) {
    if (affix.stat) lines.push("".concat(STAT_LABEL[affix.stat] || affix.name || affix.stat, " +").concat(Math.floor(affix.value || 0)));
    else if (affix.name) lines.push("★ ".concat(esc(affix.name)).concat(affix.desc ? "：".concat(esc(affix.desc)) : ""));
  }
  return lines;
}
function renderActiveSetBonuses() {
  const bonuses = activeSetBonuses();
  if (!bonuses.length) return "";
  return '\n    <section class="active-set-panel">\n      <h3>✨ 已激活套装 ('.concat(bonuses.length, ")</h3>\n      ").concat(bonuses.map(({ set, bonus }) => '\n        <div class="active-set-row">\n          <b>'.concat(esc(set.name), "</b>\n          <span>").concat(esc(bonus.desc || ""), "</span>\n        </div>\n      ")).join(""), "\n    </section>\n  ");
}
function totalAbilityPoints(run = state.run) {
  initializeAbilityState(run);
  return ABILITY_STATS.reduce((sum, def) => {
    var _a;
    return sum + (((_a = run == null ? void 0 : run.abilityPoints) == null ? void 0 : _a[def.key]) || 0);
  }, 0);
}
function allocAbilityPoint(stat, amount = 1) {
  if (!state.run) return;
  initializeAbilityState(state.run);
  const def = ABILITY_STATS.find((s) => s.key === stat);
  if (!def) return;
  const available = Math.max(0, Math.floor(Number(state.run.skillPoints) || 0));
  const requested = amount === "max" ? available : Math.max(1, Math.floor(Number(amount) || 1));
  const count = Math.min(requested, available);
  if (count <= 0) return toast("技能点不足");
  state.run.skillPoints -= count;
  state.run.abilityPoints[stat] = (state.run.abilityPoints[stat] || 0) + count;
  refreshPartyHpCaps();
  saveGame();
  render();
}
function resetAbilityPoint(stat) {
  if (!state.run) return;
  initializeAbilityState(state.run);
  const pts = state.run.abilityPoints[stat] || 0;
  if (pts <= 0) return;
  state.run.abilityPoints[stat] = 0;
  state.run.skillPoints = (state.run.skillPoints || 0) + pts;
  refreshPartyHpCaps();
  saveGame();
  render();
}
function resetAllAbilityPoints() {
  if (!state.run) return;
  initializeAbilityState(state.run);
  const total = totalAbilityPoints(state.run);
  if (total <= 0) return;
  for (const def of ABILITY_STATS) state.run.abilityPoints[def.key] = 0;
  state.run.skillPoints = (state.run.skillPoints || 0) + total;
  refreshPartyHpCaps();
  saveGame();
  render();
}
function renderAbilityScreen() {
  var _a, _b;
  state.skillTab = "ability";
  return renderSkillTree();
  initializeAbilityState(state.run);
  const member = (_a = state.run.party) == null ? void 0 : _a[0];
  const cls = member ? getClass(member.classId) : null;
  const level = ((_b = member == null ? void 0 : member.mercData) == null ? void 0 : _b.level) || state.run.level || 1;
  const mercQuality = (member == null ? void 0 : member.mercData) ? DATA.mercQuality[member.mercData.quality || "white"] || DATA.mercQuality.white : null;
  const primaryAttributes = cls ? applyAbilityPrimaryAttributes(primaryAttributesAtLevel(cls, level, (mercQuality == null ? void 0 : mercQuality.growthMul) || 1), member) : {};
  const assigned = totalAbilityPoints(state.run);
  return '\n    <section class="ability-screen">\n      <header class="ability-top">\n        <button onclick="closeAbilityScreen()">◀ 返回</button>\n        <h2>💎 能力点</h2>\n      </header>\n      <div class="ability-content">\n        <div class="ability-summary">\n          <div>\n            <h3>🔷 可用技能点: '.concat(state.run.skillPoints || 0, "</h3>\n            <p>每点+1主属性，并使对应战斗属性+1%：力量×2攻击 · 敏捷×1防御 · 智力×2法强 · 体质×10生命</p>\n          </div>\n          <span>已分配: ").concat(assigned, ' 点</span>\n        </div>\n        <div class="ability-list">\n          ').concat(ABILITY_STATS.map((def) => renderAbilityRow(def, primaryAttributes)).join(""), "\n        </div>\n        ").concat(assigned > 0 ? '<button class="ability-reset-all" onclick="resetAllAbilityPoints()">🔄 全部重置（返还 '.concat(assigned, " 技能点）</button>") : "", "\n      </div>\n    </section>\n  ");
}
function renderAbilityRow(def, primaryAttributes) {
  var _a;
  const pts = ((_a = state.run.abilityPoints) == null ? void 0 : _a[def.key]) || 0;
  const sp = state.run.skillPoints || 0;
  const pointLabel = "能力+".concat(formatPrimaryAttribute(pts), " · ").concat(STAT_LABEL[def.statKey], "+").concat(formatPrimaryAttribute(pts), "%");
  return '\n    <article class="ability-row">\n      <div>\n        <h3>'.concat(def.icon, " ").concat(def.label, "</h3>\n        <p>当前: ").concat(formatPrimaryAttribute((primaryAttributes == null ? void 0 : primaryAttributes[def.key]) || 0)).concat(pts > 0 ? " <span>(".concat(pointLabel, ")</span>") : "", " · ").concat(def.label, "×").concat(def.factor).concat(STAT_LABEL[def.statKey], '</p>\n      </div>\n      <div class="ability-actions">\n        <button ').concat(sp < 1 ? "disabled" : "", " onclick=\"allocAbilityPoint('").concat(def.key, "', 1)\">+1</button>\n        <button ").concat(sp < 10 ? "disabled" : "", " onclick=\"allocAbilityPoint('").concat(def.key, '\', 10)">+10</button>\n        <button class="max" ').concat(sp < 1 ? "disabled" : "", " onclick=\"allocAbilityPoint('").concat(def.key, "', 'max')\">MAX</button>\n      </div>\n    </article>\n  ");
}
function renderAttributeScreen() {
  var _a, _b, _c2, _d2, _e2;
  const member = (_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b[0];
  if (!member) return '<div class="empty-small">暂无属性。</div>';
  const cls = getClass(member.classId);
  const stats = calcUnitStats(member);
  const hp = Math.floor((_d2 = (_c2 = state.run.currentHp) == null ? void 0 : _c2[member.unitId]) != null ? _d2 : stats.hp);
  const activeTalents = state.run.talents || [];
  const level = ((_e2 = member.mercData) == null ? void 0 : _e2.level) || state.run.level || 1;
  const mercQuality = member.mercData ? DATA.mercQuality[member.mercData.quality || "white"] || DATA.mercQuality.white : null;
  const levelPrimaryAttributes = primaryAttributesAtLevel(cls, level, (mercQuality == null ? void 0 : mercQuality.growthMul) || 1);
  const primaryAttributes = applyAbilityPrimaryAttributes(levelPrimaryAttributes, member);
  const primaryStatBonuses = primaryStatsFromAttributes(primaryAttributes);
  return '\n    <section class="attribute-screen">\n      <header class="attribute-top">\n        <button onclick="closeAttributeScreen()">◀ 返回</button>\n        <h2>📊 属性面板</h2>\n      </header>\n      <div class="attribute-content">\n        <section class="attribute-hero-card">\n          <h3>'.concat(cls.icon, " ").concat(esc(cls.name), '</h3>\n          <div class="attribute-hero-meta">\n            <span>🏰 第 ').concat(state.run.floor || 1, " 层</span>\n            <span>⭐ Lv.").concat(state.run.level || 1, "</span>\n            <span>💰 ").concat(state.run.gold || 0, "</span>\n          </div>\n          <p>❤ 生命: <b>").concat(hp, " / ").concat(stats.hp, '</b></p>\n        </section>\n        <section class="attribute-card">\n          <h3>🧬 主属性</h3>\n          <div class="core-attr-list">\n            ').concat(PRIMARY_ATTRIBUTE_DEFS.map((def) => renderCoreAttrRow(
    def.icon,
    "".concat(def.label, " ").concat(formatPrimaryAttribute(primaryAttributes[def.key])),
    "".concat(STAT_LABEL[def.statKey], " +").concat(formatPrimaryAttribute(primaryStatBonuses[def.statKey])),
    "gold"
  )).join(""), '\n          </div>\n        </section>\n        <section class="attribute-card">\n          <h3>📊 战斗属性</h3>\n          <div class="core-attr-list">\n            ').concat(renderCoreAttrRow("⚔️", "攻击力", stats.atk, "plain"), "\n            ").concat(renderCoreAttrRow("🔮", "法术强度", stats.matk, "plain"), "\n            ").concat(renderCoreAttrRow("🛡️", "防御力", stats.def, "plain"), "\n            ").concat(renderCoreAttrRow("🧿", "状态抗性", "".concat(stats.statusRes, "（").concat(statusResistText(stats.statusRes), "）"), "blue"), "\n            ").concat(renderCoreAttrRow("💥", "暴击率", "".concat(stats.crit, "%"), "gold"), "\n            ").concat(renderCoreAttrRow("♨️", "暴击伤害", "".concat(stats.critDmg, "%"), "gold"), "\n            ").concat(renderCoreAttrRow("🔋", "能量上限", stats.energy, "blue"), "\n            ").concat(renderCoreAttrRow("🔄", "能量回复", "".concat(stats.energyRegen, "/回合"), "blue"), "\n            ").concat(stats.hpRegen > 0 ? renderCoreAttrRow("💚", "生命恢复", "".concat(stats.hpRegen, "/回合"), "green") : "", '\n          </div>\n        </section>\n        <section class="attribute-card">\n          <h3>📈 属性来源</h3>\n          <div class="attr-source-table">\n            <div class="attr-source-head"><span>属性</span><span>基础</span><span>装备</span><span>天赋</span><span>其他</span></div>\n            ').concat(renderAttributeSourceRows(member), '\n          </div>\n        </section>\n        <section class="attribute-card attribute-talent-card">\n          <div class="attribute-card-head">\n            <h3>✨ 已激活天赋 (').concat(activeTalents.length, ')</h3>\n            <button onclick="openMobilePanel(\'talents\')">查看详情</button>\n          </div>\n          <div class="attribute-talent-tags">\n            ').concat(activeTalents.length ? activeTalents.map((t) => '<span class="'.concat(esc(t.rarity || "common"), '">').concat(talentTitleHtml(t), "</span>")).join("") : "<em>暂无天赋</em>", "\n          </div>\n        </section>\n      </div>\n    </section>\n  ");
}
function renderCoreAttrRow(icon, label, value, tone = "plain") {
  return '<div class="core-attr-row '.concat(tone, '"><span>').concat(icon, " ").concat(label, "</span><b>").concat(value, "</b></div>");
}
function renderAttributeSourceRows(member) {
  const finalStats = calcUnitStats(member);
  return ["hp", "atk", "matk", "def", "statusRes", "hpRegen"].map((key) => {
    const source = attributeSource(member, key, finalStats);
    return '\n      <div class="attr-source-row attr-'.concat(key, '">\n        <span>').concat(STAT_LABEL[key], "</span>\n        <span>").concat(formatAttrSourceValue(source.base + source.level), "</span>\n        <span>").concat(formatAttrSourceValue(source.equip), "</span>\n        <span>").concat(formatAttrSourceValue(source.talentAbility), "</span>\n        <span>").concat(formatAttrSourceValue(source.growth), "</span>\n      </div>\n    ");
  }).join("");
}
function attributeSource(member, key, finalStats = calcUnitStats(member)) {
  var _a, _b, _c2, _d2, _e2, _f2;
  const run = state.run;
  const cls = getClass(member.classId);
  const level = ((_a = member.mercData) == null ? void 0 : _a.level) || (run == null ? void 0 : run.level) || 1;
  const mercQuality = member.mercData ? DATA.mercQuality[member.mercData.quality || "white"] || DATA.mercQuality.white : null;
  const isPrimaryDerived = PRIMARY_ATTRIBUTE_DEFS.some((def) => def.statKey === key);
  const basePrimary = primaryStatsFromAttributes(primaryAttributesAtLevel(cls, 0));
  const currentPrimary = primaryStatsFromAttributes(primaryAttributesAtLevel(cls, level, (mercQuality == null ? void 0 : mercQuality.growthMul) || 1));
  const baseAtLevel = isPrimaryDerived ? currentPrimary[key] : Number((_b = cls.baseStats) == null ? void 0 : _b[key]) || 0;
  const base = Math.floor(isPrimaryDerived ? basePrimary[key] : baseAtLevel);
  const levelGain = isPrimaryDerived ? Math.floor(baseAtLevel) - base : 0;
  let growth = 0;
  if (member.isPlayer && run && !run.hardcoreMode) growth += growthStatBonus(key);
  if ((_c2 = run == null ? void 0 : run.eventBonuses) == null ? void 0 : _c2[key]) growth += run.eventBonuses[key];
  if (member.isPlayer && ((_d2 = run == null ? void 0 : run.hiddenStacks) == null ? void 0 : _d2[key])) growth += run.hiddenStacks[key];
  let equip = 0;
  const equipment = member.isPlayer && member.unitId === "player" ? run == null ? void 0 : run.equipment : (_e2 = member.mercData) == null ? void 0 : _e2.equipment;
  if (equipment) {
    for (const slot of DATA.equipSlots) {
      const item = equipment[slot];
      if (!item) continue;
      const enhance = member.isPlayer && member.unitId === "player" ? 1 + (((_f2 = run.enhanceLevels) == null ? void 0 : _f2[slot]) || 0) * 0.1 : 1;
      for (const bs of item.baseStats || []) {
        if (bs.stat === key) equip += Math.floor(bs.value * enhance);
      }
      for (const af of item.affixes || []) {
        if (af.stat === key) equip += Math.floor(af.value * enhance);
      }
    }
  }
  const afterLevel = Math.floor(baseAtLevel);
  const afterGrowth = Math.floor(baseAtLevel + growth);
  const afterEquip = Math.floor(baseAtLevel + growth + equip);
  const talentAbility = (Number(finalStats == null ? void 0 : finalStats[key]) || 0) - afterEquip;
  return {
    base,
    level: levelGain,
    growth: afterGrowth - afterLevel,
    equip: afterEquip - afterGrowth,
    talentAbility
  };
}
function formatAttrSourceValue(value) {
  const n = roundPrimaryAttribute(value);
  return n ? formatPrimaryAttribute(n) : "-";
}
function setSkillTab(tab) {
  state.skillTab = tab;
  render();
}
function setSkillHeroTab(tab) {
  state.skillHeroTab = tab === "second" ? "second" : "first";
  render();
}
function skillLearnState(skillId) {
  var _a, _b, _c2, _d2;
  const found = findSkillDef(skillId);
  if (!found) return { canLearn: false, reason: "not_found", text: "技能不存在" };
  const ownerClassId = heroClassIdForSkill(skillId) || found.classId;
  const skills = allClassSkills(ownerClassId);
  const idx = skills.findIndex((s) => s.id === skillId);
  const req = skillUnlockLevel(idx);
  const cost = skillLearnCost(idx);
  if ((_a = state.run.learnedSkills) == null ? void 0 : _a[skillId]) return { canLearn: false, reason: "learned", req, cost, idx };
  if ((state.run.level || 1) < req) return { canLearn: false, reason: "level", req, cost, idx, text: "需要等级 ".concat(req, "（当前 ").concat(state.run.level || 1, "）") };
  if (idx > 0 && !((_c2 = state.run.learnedSkills) == null ? void 0 : _c2[(_b = skills[idx - 1]) == null ? void 0 : _b.id])) {
    return { canLearn: false, reason: "prereq", req, cost, idx, text: "需先学习「".concat(((_d2 = skills[idx - 1]) == null ? void 0 : _d2.name) || "前置技能", "」") };
  }
  if ((state.run.skillPoints || 0) < cost) return { canLearn: false, reason: "sp", req, cost, idx, text: "技能点不足（需要 ".concat(cost, " 技能点）") };
  return { canLearn: true, reason: "ok", req, cost, idx, text: "" };
}
function learnSkill(skillId) {
  if (!state.run) return;
  initializeSkillState(state.run);
  const found = findSkillDef(skillId);
  const ownerClassId = heroClassIdForSkill(skillId);
  if (!found || !ownerClassId) return toast("当前职业无法学习该技能");
  if (state.run.learnedSkills[skillId]) return;
  const learnState = skillLearnState(skillId);
  if (!learnState.canLearn) return toast(learnState.text || "暂时无法学习");
  const cost = learnState.cost;
  state.run.skillPoints -= cost;
  state.run.learnedSkills[skillId] = true;
  state.run.skillLevels[skillId] = 1;
  if (ownerClassId === state.run.classId && state.run.equippedSkills.length < 6) state.run.equippedSkills.push(skillId);
  saveGame();
  render();
}
function upgradeSkill(skillId) {
  if (!state.run) return;
  initializeSkillState(state.run);
  if (!state.run.learnedSkills[skillId]) return;
  const cur = state.run.skillLevels[skillId] || 1;
  if (skillEnhanceLevel(skillId) >= SKILL_MAX_LEVEL) return toast("已达到当前上限");
  const cost = skillUpgradeCost(skillId);
  if ((state.run.skillPoints || 0) < cost) return toast("技能点不足");
  state.run.skillPoints -= cost;
  state.run.skillLevels[skillId] = cur + 1;
  saveGame();
  render();
}
function equipSkill(skillId) {
  if (!state.run) return;
  initializeSkillState(state.run);
  if (!state.run.learnedSkills[skillId] || state.run.equippedSkills.includes(skillId)) return;
  if (state.run.equippedSkills.length >= 6) return toast("装备槽已满");
  state.run.equippedSkills.push(skillId);
  saveGame();
  render();
}
function unequipSkill(skillId) {
  if (!state.run || isFixedSkill(skillId)) return;
  initializeSkillState(state.run);
  state.run.equippedSkills = state.run.equippedSkills.filter((id) => id !== skillId);
  saveGame();
  render();
}
function unlockSkillPassive(passiveId) {
  if (!state.run) return;
  initializeSkillState(state.run);
  const passive = (DATA.passiveSkillTree || []).find((p) => p.id === passiveId);
  const heroKey = state.run.dualHeroMode && state.skillHeroTab === "second" ? "second" : "first";
  if (!passive || passive.classId !== skillPassiveClassId(heroKey, state.run) || isSkillPassiveUnlocked(passiveId, heroKey, state.run)) return;
  const reqLevel = passive.tier === 1 ? 1 : passive.tier === 2 ? 3 : 7;
  if ((state.run.level || 1) < reqLevel) return toast("需要等级 ".concat(reqLevel));
  if ((state.run.skillPoints || 0) < passive.cost) return toast("技能点不足");
  state.run.skillPoints -= passive.cost;
  state.run.unlockedSkillPassives[heroKey][passiveId] = true;
  saveGame();
  render();
}
function renderSkillTree() {
  initializeSkillState(state.run);
  const tab = state.skillTab || "active";
  const heroTab = state.run.dualHeroMode && state.skillHeroTab === "second" ? "second" : "first";
  const classId = heroTab === "second" ? state.run.secondClassId : state.run.classId;
  const cls = getClass(classId);
  const heroLabel = heroTab === "second" ? "第二英雄" : "主英雄";
  return '\n    <section class="skill-screen">\n      <header class="skill-top">\n        <button onclick="closeSkillTree()">◀ 返回</button>\n        <h2>📖 技能树</h2>\n      </header>\n      <div class="skill-summary">\n        <span>技能点: '.concat(state.run.skillPoints || 0, "</span>\n        <b>").concat(cls.icon, " ").concat(cls.name, " · ").concat(heroLabel, "</b>\n      </div>\n      ").concat(state.run.dualHeroMode ? '\n        <div class="skill-hero-tabs">\n          <button class="'.concat(heroTab === "first" ? "selected" : "", '" onclick="setSkillHeroTab(\'first\')">🛡️ 主英雄</button>\n          <button class="').concat(heroTab === "second" ? "selected" : "", '" onclick="setSkillHeroTab(\'second\')">👥 第二英雄</button>\n        </div>\n      ') : "", '\n      <div class="skill-tabs">\n        <button class="').concat(tab === "active" ? "selected" : "", '" onclick="setSkillTab(\'active\')">⚔️ 主动技能</button>\n        <button class="').concat(tab === "passive" ? "selected" : "", '" onclick="setSkillTab(\'passive\')">🔮 被动天赋</button>\n        <button class="').concat(tab === "ability" ? "selected" : "", '" onclick="setSkillTab(\'ability\')">💎 能力点</button>\n      </div>\n      ').concat(tab === "ability" ? renderAbilitySkillTree() : tab === "passive" ? renderPassiveSkillTree(classId, heroTab) : renderActiveSkillTree(cls, { secondHero: heroTab === "second" }), "\n    </section>\n  ");
}
function renderAbilitySkillTree() {
  var _a, _b;
  initializeAbilityState(state.run);
  const member = (_a = state.run.party) == null ? void 0 : _a[0];
  const cls = member ? getClass(member.classId) : null;
  const level = ((_b = member == null ? void 0 : member.mercData) == null ? void 0 : _b.level) || state.run.level || 1;
  const mercQuality = (member == null ? void 0 : member.mercData) ? DATA.mercQuality[member.mercData.quality || "white"] || DATA.mercQuality.white : null;
  const primaryAttributes = cls ? applyAbilityPrimaryAttributes(primaryAttributesAtLevel(cls, level, (mercQuality == null ? void 0 : mercQuality.growthMul) || 1), member) : {};
  const assigned = totalAbilityPoints(state.run);
  return '\n    <div class="skill-tree-content ability-tree">\n      <div class="ability-summary">\n        <div>\n          <h3>💎 能力点</h3>\n          <p>每点+1主属性，并使对应战斗属性+1%：力量×2攻击 · 敏捷×1防御 · 智力×2法强 · 体质×10生命</p>\n        </div>\n        <span>已分配 '.concat(assigned, ' 点</span>\n      </div>\n      <div class="ability-list">\n        ').concat(ABILITY_STATS.map((def) => renderAbilityRow(def, primaryAttributes)).join(""), "\n      </div>\n      ").concat(assigned > 0 ? '<button class="ability-reset-all" onclick="resetAllAbilityPoints()">🔄 全部重置（返还 '.concat(assigned, " 技能点）</button>") : "", "\n    </div>\n  ");
}
function renderActiveSkillTree(cls, options = {}) {
  return '\n    <div class="skill-tree-content">\n      '.concat(options.secondHero ? '\n        <div class="skill-slot-title">第二英雄技能栏</div>\n      ' : '\n        <div class="skill-slot-title">技能槽（固定普攻 1 + 可装备技能 5）</div>\n        <div class="skill-slots">'.concat(Array.from({ length: 6 }, (_, idx) => renderSkillSlot(idx)).join(""), "</div>\n      "), '\n      <div class="skill-card-list">').concat(allClassSkills(cls.id).map((skill, idx) => options.secondHero ? renderSecondHeroSkillCard(skill, idx) : renderActiveSkillCard(skill, idx)).join(""), "</div>\n    </div>\n  ");
}
function renderSecondHeroSkillCard(skill, idx) {
  var _a, _b;
  const learned = !!((_a = state.run.learnedSkills) == null ? void 0 : _a[skill.id]);
  const req = skillUnlockLevel(idx);
  const lv = learned ? ((_b = state.run.skillLevels) == null ? void 0 : _b[skill.id]) || 1 : 0;
  if (!learned) {
    const learnState = skillLearnState(skill.id);
    const needText = learnState.canLearn ? "可学习：消耗 ".concat(learnState.cost, " 技能点") : learnState.text || "需要等级 ".concat(req, "（当前 ").concat(state.run.level || 1, "）");
    return '\n      <article class="skill-card locked">\n        <div class="skill-card-head">\n          <h3>🔒 '.concat(esc(skill.name), "</h3>\n          <span>Lv.").concat(req, "</span>\n        </div>\n        <p>").concat(colorText(skill.desc || ""), '</p>\n        <div class="skill-need">').concat(needText, "</div>\n        <button ").concat(learnState.canLearn ? "" : "disabled", " onclick=\"learnSkill('").concat(skill.id, "')\">学习（").concat(skillLearnCost(idx), "技能点）</button>\n      </article>\n    ");
  }
  const upgradeCost = skillUpgradeCost(skill.id);
  const enhanceLevel = skillEnhanceLevel(skill.id);
  const previewSkill = scaledSkill(skill);
  return '\n    <article class="skill-card learned auto">\n      <div class="skill-card-head">\n        <h3>✅ '.concat(esc(skill.name), "</h3>\n        <span>").concat("★".repeat(enhanceLevel)).concat("☆".repeat(SKILL_MAX_LEVEL - enhanceLevel), "</span>\n      </div>\n      <p>").concat(colorText(skill.desc || ""), '</p>\n      <div class="skill-meta">消耗:').concat(previewSkill.cost || 0, "⚡ / 冷却:").concat(skill.cooldown || 0, '回合</div>\n      <div class="skill-level-line">Lv').concat(lv, ": 伤害/治疗/DOT系数 +").concat(enhanceLevel * 15, "%，基础能耗 -").concat(enhanceLevel * 5, '%（向上取整）</div>\n      <div class="skill-actions">\n        <span>已掌握</span>\n        <button ').concat(enhanceLevel >= SKILL_MAX_LEVEL || (state.run.skillPoints || 0) < upgradeCost ? "disabled" : "", " onclick=\"upgradeSkill('").concat(skill.id, "')\">强化（").concat(upgradeCost, "技能点）</button>\n      </div>\n    </article>\n  ");
}
function renderSkillSlot(idx) {
  const skillId = state.run.equippedSkills[idx];
  const found = skillId ? findSkillDef(skillId) : null;
  if (!found) return '<div class="skill-slot empty">空</div>';
  const fixed = isFixedSkill(skillId);
  return '\n    <div class="skill-slot '.concat(fixed ? "fixed" : "", '">\n      <span>').concat(esc(found.skill.name)).concat(fixed ? "<small>固定</small>" : "", "</span>\n      ").concat(fixed ? "" : '<button class="slot-remove" onclick="unequipSkill(\''.concat(skillId, "')\">×</button>"), "\n    </div>\n  ");
}
function renderActiveSkillCard(skill, idx) {
  var _a, _b;
  const learned = !!((_a = state.run.learnedSkills) == null ? void 0 : _a[skill.id]);
  const equipped = state.run.equippedSkills.includes(skill.id);
  const req = skillUnlockLevel(idx);
  const lv = ((_b = state.run.skillLevels) == null ? void 0 : _b[skill.id]) || 1;
  if (!learned) {
    const learnState = skillLearnState(skill.id);
    const needText = learnState.canLearn ? "可学习：消耗 ".concat(learnState.cost, " 技能点") : learnState.text || "需要等级 ".concat(req, "（当前 ").concat(state.run.level || 1, "）");
    return '\n      <article class="skill-card locked">\n        <div class="skill-card-head">\n          <h3>🔒 '.concat(esc(skill.name), "</h3>\n          <span>Lv.").concat(req, "</span>\n        </div>\n        <p>").concat(colorText(skill.desc || ""), '</p>\n        <div class="skill-need">').concat(needText, "</div>\n        <button ").concat(learnState.canLearn ? "" : "disabled", " onclick=\"learnSkill('").concat(skill.id, "')\">学习（").concat(skillLearnCost(idx), "技能点）</button>\n      </article>\n    ");
  }
  const fixed = isFixedSkill(skill.id);
  const upgradeCost = skillUpgradeCost(skill.id);
  const enhanceLevel = skillEnhanceLevel(skill.id);
  const previewSkill = scaledSkill(skill);
  return '\n    <article class="skill-card learned">\n      <div class="skill-card-head">\n        <h3>✅ '.concat(esc(skill.name), '</h3>\n        <span class="skill-stars">').concat("★".repeat(enhanceLevel)).concat("☆".repeat(SKILL_MAX_LEVEL - enhanceLevel), "</span>\n      </div>\n      <p>").concat(colorText(skill.desc || ""), '</p>\n      <div class="skill-meta">消耗:').concat(previewSkill.cost || 0, "⚡ / 冷却:").concat(skill.cooldown || 0, '回合</div>\n      <div class="skill-level-line">Lv').concat(lv, ": 伤害/治疗/DOT系数 +").concat(enhanceLevel * 15, "%，基础能耗 -").concat(enhanceLevel * 5, '%（向上取整）</div>\n      <div class="skill-actions">\n        <button ').concat(enhanceLevel >= SKILL_MAX_LEVEL || (state.run.skillPoints || 0) < upgradeCost ? "disabled" : "", " onclick=\"upgradeSkill('").concat(skill.id, "')\">强化（").concat(upgradeCost, "技能点）</button>\n        ").concat(fixed ? "<span>固定</span>" : equipped ? "<button onclick=\"unequipSkill('".concat(skill.id, "')\">卸下</button>") : "<button ".concat(state.run.equippedSkills.length >= 6 ? "disabled" : "", " onclick=\"equipSkill('").concat(skill.id, "')\">装备</button>"), "\n      </div>\n    </article>\n  ");
}
function renderPassiveSkillTree(classId = ((_k) => (_k = state.run) == null ? void 0 : _k.classId)(), heroKey = "first") {
  const baseClassId = getBaseClassId(classId);
  const passives = (DATA.passiveSkillTree || []).filter((passive) => passive.classId === baseClassId);
  const tiers = [...new Set(passives.map((p) => p.tier))].sort((a, b) => a - b);
  return '\n    <div class="skill-tree-content passive-tree">\n      <div class="skill-slot-title">'.concat(esc(getClass(baseClassId).name), "专属被动 · 两名英雄分别解锁、分别生效</div>\n      ").concat(tiers.map((tier) => '\n        <div class="tier-title">Tier '.concat(tier, " · ").concat(tier === 1 ? "基础" : tier === 2 ? "进阶" : "大师", "</div>\n        ").concat(passives.filter((p) => p.tier === tier).map((passive) => renderPassiveSkillCard(passive, heroKey)).join(""), "\n      ")).join(""), "\n    </div>\n  ");
}
function renderPassiveSkillCard(passive, heroKey = "first") {
  const unlocked = isSkillPassiveUnlocked(passive.id, heroKey, state.run);
  const reqLevel = passive.tier === 1 ? 1 : passive.tier === 2 ? 3 : 7;
  const canUnlock = !unlocked && (state.run.level || 1) >= reqLevel && (state.run.skillPoints || 0) >= passive.cost;
  return '\n    <article class="passive-card '.concat(unlocked ? "unlocked" : "", '">\n      <div class="skill-card-head">\n        <h3>').concat(passive.icon || "✦", " ").concat(esc(passive.name), "</h3>\n        <span>").concat(passive.cost, " 技能点</span>\n      </div>\n      <p>").concat(colorText(passive.desc || ""), "</p>\n      <button ").concat(canUnlock ? "" : "disabled", " onclick=\"unlockSkillPassive('").concat(passive.id, "')\">").concat(unlocked ? "已解锁" : "解锁（".concat(passive.cost, " 技能点）"), "</button>\n    </article>\n  ");
}
function mercRoster() {
  var _a;
  return (((_a = state.run) == null ? void 0 : _a.party) || []).filter((m) => m.mercData);
}
function mercBonusText(qdef) {
  const order = ["atk", "matk", "def", "hp", "crit", "critDmg", "energy", "energyRegen", "hpRegen", "statusRes"];
  const shortLabel = { hp: "生命", atk: "攻击", matk: "法术强度", def: "防御", crit: "暴击", critDmg: "暴击伤害", energy: "能量", energyRegen: "能量回复", hpRegen: "生命恢复", statusRes: "状态抗性" };
  const entries = Object.entries((qdef == null ? void 0 : qdef.statBonus) || {}).sort(([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)));
  if (!entries.length) return "无额外加成";
  return entries.map(([stat, value]) => "+".concat(value).concat(shortLabel[stat] || STAT_LABEL[stat] || stat)).join(" ");
}
function renderMercManagement() {
  const mercs = mercRoster();
  const alive = mercs.filter((m) => {
    var _a;
    return ((_a = m.mercData) == null ? void 0 : _a.alive) !== false;
  }).length;
  const deployed = deployedMercRoster().length;
  return '\n    <section class="merc-screen">\n      <header class="merc-top">\n        <button onclick="closeMercManagement()">◀</button>\n        <div>\n          <h2>佣兵管理</h2>\n          <span>调整队伍顺序与培养进度</span>\n        </div>\n      </header>\n      <div class="merc-summary">\n        <div class="merc-summary-group">\n          <span>招募 <b>'.concat(mercs.length, "/").concat(MAX_MERC_ROSTER, "</b></span>\n          <span>上阵 <b>").concat(deployed, "/").concat(MAX_DEPLOYED_MERCS, "</b></span>\n          <span>存活 <b>").concat(alive, '</b></span>\n        </div>\n        <b class="merc-gold"><i aria-hidden="true"></i>').concat(state.run.gold, '</b>\n      </div>\n      <div class="merc-list">\n        ').concat(mercs.length ? mercs.map((m, idx) => renderMercCard(m, idx, mercs.length)).join("") : '<div class="empty-merc">暂无佣兵</div>', "\n      </div>\n    </section>\n  ");
}
function renderMercCard(member, idx, total) {
  var _a, _b, _c2, _d2, _e2, _f2, _g, _h, _i, _j, _k;
  const cls = getClass(member.classId);
  const stats = calcUnitStats(member);
  const hp = (_a = state.run.currentHp[member.unitId]) != null ? _a : stats.hp;
  const energy = (_b = state.run.currentEnergy[member.unitId]) != null ? _b : stats.energy;
  const qdef = DATA.mercQuality[((_c2 = member.mercData) == null ? void 0 : _c2.quality) || "white"] || DATA.mercQuality.white;
  const trait = mercTraitFor(member);
  const traitLevel = mercTraitLevel(member);
  const traitEffect = mercTraitEffect(trait, traitLevel);
  const gear = ((_d2 = member.mercData) == null ? void 0 : _d2.equipment) || {};
  const activeMercSets = activeSetBonusesForEquipment(gear);
  const gearSummary = DATA.equipSlots.filter((slot) => gear[slot]).map((slot) => "".concat(DATA.equipSlotIcons[slot]).concat(equipmentScoreForMember(gear[slot], member))).join(" ") || "未装备";
  const level = ((_e2 = member.mercData) == null ? void 0 : _e2.level) || 1;
  const skillProgress = mercSkillProgress(member);
  const exp = ((_f2 = member.mercData) == null ? void 0 : _f2.exp) || 0;
  const expNeed = mercExpForLevel(level);
  const material = synthesisMaterialFor(member);
  const qualityRank = DATA.mercQualityOrder.indexOf(((_g = member.mercData) == null ? void 0 : _g.quality) || "white");
  const nextQuality = DATA.mercQualityOrder[qualityRank + 1] || "";
  const deployedIndex = deployedMercRoster().findIndex((unit) => unit.unitId === member.unitId);
  const deploymentLabel = deployedIndex >= 0 ? "上阵位".concat(deployedIndex + 1) : "待命";
  const strategyKey = mercBattleStrategyKey(member);
  const strategy = MERC_BATTLE_STRATEGIES[strategyKey];
  const aliveClass = ((_h = member.mercData) == null ? void 0 : _h.alive) === false ? " fallen" : "";
  const visibleSkills = skillProgress.unlocked;
  const hiddenSkillCount = 0;
  return '\n    <article class="merc-card rarity-'.concat(esc(((_i = member.mercData) == null ? void 0 : _i.quality) || "white")).concat(aliveClass, '">\n      <div class="merc-card-identity">\n        ').concat(renderClassPortrait(member.classId, "class-portrait merc-profile-art portrait-frame frame-merc", { showBadge: false }), '\n        <div class="merc-card-copy">\n          <div class="merc-card-title-row">\n            <h3>').concat(esc(member.name), '</h3>\n            <span class="merc-quality-badge">').concat(esc(qdef.name), '</span>\n          </div>\n          <div class="merc-card-meta-row">\n            <span>').concat(esc(cls.name), " · Lv.").concat(level, '</span>\n            <b class="merc-deployment ').concat(deployedIndex >= 0 ? "deployed" : "", '">').concat(deploymentLabel, '</b>\n          </div>\n          <div class="merc-stat-chips" aria-label="核心属性">\n            <span><small>攻</small>').concat(stats.atk, "</span>\n            <span><small>法</small>").concat(stats.matk, "</span>\n            <span><small>防</small>").concat(stats.def, "</span>\n          </div>\n        </div>\n      </div>\n      ").concat(trait ? '<div class="merc-trait-brief"><span>专长 ★'.concat(traitLevel, "/").concat(MAX_MERC_TRAIT_LEVEL, "</span><b>").concat(esc(trait.name), "</b></div>") : "", '\n      <div class="merc-skill-row">\n        <div class="merc-skill-strip" aria-label="已解锁主动技能">\n          ').concat(visibleSkills.map((skill) => renderMercSkillChip(skill, member.unitId)).join(""), "\n          ").concat(hiddenSkillCount ? '<span class="merc-skill-more">+'.concat(hiddenSkillCount, "</span>") : "", '\n        </div>\n      </div>\n      <div class="merc-vital-grid">\n        <div class="merc-vital merc-hp-vital">\n          <div><span>生命</span><b>').concat(Math.max(0, Math.floor(hp)), "/").concat(stats.hp, '</b></div>\n          <div class="bar hpbar"><span style="--w:').concat(pct(hp, stats.hp), '%"></span></div>\n        </div>\n        <div class="merc-vital merc-exp-vital">\n          <div><span>经验</span><b>').concat(Math.floor(exp), "/").concat(expNeed, '</b></div>\n          <div class="bar merc-expbar"><span style="--w:').concat(pct(exp, expNeed), '%"></span></div>\n        </div>\n      </div>\n      <details class="merc-card-details">\n        <summary>查看详情</summary>\n        <div class="merc-detail-copy">\n          <p><b>品质成长</b>输出').concat(Math.round((qdef.outputMul || 1) * 100), "% · 成长").concat(Math.round((qdef.growthMul || 1) * 100), "% · ").concat(esc(mercBonusText(qdef)), "</p>\n          ").concat(trait ? "<p><b>专长效果 · ".concat(esc(trait.name), "</b>").concat(esc(traitEffect.text), "</p>") : "", "\n          <p><b>装备评分</b>").concat(mercEquipmentScore(member), " · ").concat(gearSummary, "</p>\n          ").concat(activeMercSets.length ? "<p><b>已激活套装</b>".concat(activeMercSets.map(({ set, bonus }) => "".concat(esc(set.name), "（").concat(esc(bonus.desc || ""), "）")).join("、"), "</p>") : "", '\n          <div class="merc-strategy-control">\n            <div class="merc-strategy-head">\n              <label for="merc-strategy-').concat(esc(member.unitId), '">战斗策略</label>\n              <select id="merc-strategy-').concat(esc(member.unitId), '" onchange="setMercBattleStrategy(\'').concat(member.unitId, '\', this.value, this)" aria-label="').concat(esc(member.name), '的战斗策略">\n                ').concat(Object.entries(MERC_BATTLE_STRATEGIES).map(([key, def]) => '<option value="'.concat(key, '" ').concat(key === strategyKey ? "selected" : "", ">").concat(esc(def.name), "</option>")).join(""), '\n              </select>\n            </div>\n            <small class="merc-strategy-description" aria-live="polite">').concat(esc(strategy.desc), "</small>\n          </div>\n        </div>\n      </details>\n      ").concat(((_j = member.mercData) == null ? void 0 : _j.alive) === false ? '<div class="merc-revive-hint">已阵亡，可在佣兵酒馆“整备复苏”。</div>' : "", '\n      <div class="merc-actions">\n        <button ').concat(idx <= 0 ? "disabled" : "", " onclick=\"moveMerc('").concat(member.unitId, "', -1)\">▲</button>\n        <button ").concat(idx >= total - 1 ? "disabled" : "", " onclick=\"moveMerc('").concat(member.unitId, '\', 1)">▼</button>\n        <button class="merc-synthesize" ').concat(material ? "" : "disabled", " onclick=\"openMercSynthesisModal('").concat(member.unitId, "')\">").concat(nextQuality ? "合成→".concat(((_k = DATA.mercQuality[nextQuality]) == null ? void 0 : _k.name) || nextQuality) : "已至传说", '</button>\n        <button class="danger" onclick="dismissMerc(\'').concat(member.unitId, "')\">解雇</button>\n      </div>\n    </article>\n  ");
}
function moveMerc(unitId, dir) {
  if (!state.run || !dir) return;
  const mercIndexes = state.run.party.map((m, index) => ({ m, index })).filter((entry) => entry.m.mercData);
  const pos = mercIndexes.findIndex((entry) => entry.m.unitId === unitId);
  const target = pos + dir;
  if (pos < 0 || target < 0 || target >= mercIndexes.length) return;
  const a = mercIndexes[pos].index;
  const b = mercIndexes[target].index;
  [state.run.party[a], state.run.party[b]] = [state.run.party[b], state.run.party[a]];
  saveGame();
  render();
}
function dismissMerc(unitId) {
  var _a;
  if (!state.run) return;
  const member = state.run.party.find((m) => m.unitId === unitId && m.mercData);
  if (!member) return;
  const quality = ((_a = DATA.mercQuality[member.mercData.quality || "white"]) == null ? void 0 : _a.name) || "普通";
  const cls = getClass(member.classId);
  const level = Math.max(1, Math.floor(member.mercData.level || 1));
  state.modal = {
    title: "⚠️ 确认解雇佣兵",
    className: "merc-dismiss-modal",
    body: "\n      <p>确定要解雇「<b>".concat(esc(member.name), '</b>」吗？</p>\n      <p class="subtle">').concat(esc(quality), " · ").concat(esc(cls.name), " · Lv.").concat(level, "</p>\n      <p><b>该佣兵的等级、技能、专长进度和已分配装备将一并失去，且无法恢复。</b></p>\n    "),
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } },
      { label: "确认解雇", className: "danger", onClick: () => confirmDismissMerc(unitId) }
    ]
  };
  render();
}
function confirmDismissMerc(unitId) {
  if (!state.run) return;
  const member = state.run.party.find((m) => m.unitId === unitId && m.mercData);
  if (!member) {
    state.modal = null;
    render();
    return;
  }
  state.run.party = state.run.party.filter((m) => m.unitId !== unitId);
  delete state.run.currentHp[unitId];
  delete state.run.currentEnergy[unitId];
  state.modal = null;
  addRunLog("🗡️ ".concat(member.name, " 离开了队伍。"));
  saveGame();
  render();
}
function synthesisMaterialsFor(target) {
  if (!(target == null ? void 0 : target.mercData)) return [];
  const rank = DATA.mercQualityOrder.indexOf(target.mercData.quality || "white");
  if (rank < 0 || rank >= DATA.mercQualityOrder.length - 1) return [];
  return mercRoster().filter((member) => {
    var _a;
    return member.unitId !== target.unitId && ((_a = member.mercData) == null ? void 0 : _a.quality) === target.mercData.quality;
  }).sort((a, b) => {
    var _a, _b;
    return mercEquipmentScore(a) - mercEquipmentScore(b) || (((_a = a.mercData) == null ? void 0 : _a.level) || 1) - (((_b = b.mercData) == null ? void 0 : _b.level) || 1);
  });
}
function synthesisMaterialFor(target) {
  return synthesisMaterialsFor(target)[0] || null;
}
function canSynthesizeMercenary(member) {
  return !!synthesisMaterialFor(member);
}
function closeMercSynthesisModal() {
  state.mercSynthesis = null;
  state.modal = null;
  render();
}
function renderMercSynthesisPanel(target, materials, selectedId = "") {
  var _a, _b;
  const nextQuality = DATA.mercQualityOrder[DATA.mercQualityOrder.indexOf(((_a = target.mercData) == null ? void 0 : _a.quality) || "white") + 1] || "";
  const renderSummary = (member, role) => {
    var _a2, _b2;
    const memberClass = getClass(member.classId);
    const memberQdef = DATA.mercQuality[((_a2 = member.mercData) == null ? void 0 : _a2.quality) || "white"] || DATA.mercQuality.white;
    const level = ((_b2 = member.mercData) == null ? void 0 : _b2.level) || 1;
    return '\n      <div class="merc-synthesis-member '.concat(role, '">\n        ').concat(renderClassPortrait(member.classId, "class-portrait merc-synthesis-art portrait-frame frame-merc", { showBadge: false }), "\n        <div>\n          <span>").concat(esc(role === "target" ? "保留目标" : "合成材料"), "</span>\n          <b>").concat(esc(member.name), "</b>\n          <small>").concat(esc(memberClass.name), " · Lv.").concat(level, " · ").concat(esc(memberQdef.name), "</small>\n        </div>\n      </div>\n    ");
  };
  return '\n    <section class="merc-synthesis-panel">\n      <p class="merc-synthesis-intro">'.concat(esc(target.name), " 将升为").concat(esc(((_b = DATA.mercQuality[nextQuality]) == null ? void 0 : _b.name) || nextQuality), '佣兵。请选择要消耗的同品质佣兵。</p>\n      <div class="merc-synthesis-target-wrap">\n        ').concat(renderSummary(target, "target"), '\n        <div class="merc-synthesis-target-meta"><span>装备评分</span><b>').concat(mercEquipmentScore(target), "</b><span>技能</span><b>").concat(mercenarySkillsFor(target).length, "/").concat(MERC_SKILL_SLOT_COUNT, '</b></div>\n      </div>\n      <div class="merc-synthesis-list-head">\n        <b>可选材料</b><span>').concat(materials.length, ' 名 · 材料装备会自动重新分配</span>\n      </div>\n      <div class="merc-synthesis-list">\n        ').concat(materials.map((member) => {
    var _a2, _b2;
    const selected = member.unitId === selectedId;
    const memberClass = getClass(member.classId);
    const level = ((_a2 = member.mercData) == null ? void 0 : _a2.level) || 1;
    const skills = mercenarySkillsFor(member);
    return '\n            <button class="merc-synthesis-option rarity-'.concat(esc(((_b2 = member.mercData) == null ? void 0 : _b2.quality) || "white"), " ").concat(selected ? "selected" : "", '" onclick="selectMercSynthesisMaterial(\'').concat(target.unitId, "', '").concat(member.unitId, "')\">\n              ").concat(renderClassPortrait(member.classId, "class-portrait merc-synthesis-art portrait-frame frame-merc", { showBadge: false }), '\n              <span class="merc-synthesis-option-copy">\n                <span class="merc-synthesis-option-title"><b>').concat(esc(member.name), "</b><em>").concat(esc(memberClass.name), " · Lv.").concat(level, '</em></span>\n                <span class="merc-synthesis-option-meta"><span>装备 ').concat(mercEquipmentScore(member), "</span><span>专长 ★").concat(mercTraitLevel(member), '</span></span>\n                <span class="merc-synthesis-option-skills">').concat(skills.map((skill) => renderMercSkillChip(skill)).join(""), '</span>\n              </span>\n              <span class="merc-synthesis-pick">').concat(selected ? "已选择" : "选择", "</span>\n            </button>\n          ");
  }).join(""), "\n      </div>\n    </section>\n  ");
}
function openMercSynthesisModal(unitId) {
  var _a;
  if (!state.run) return;
  const target = state.run.party.find((member) => member.unitId === unitId && member.mercData);
  const materials = synthesisMaterialsFor(target);
  if (!target || !materials.length) return toast("需要另一名同品质佣兵作为合成材料。");
  const previous = ((_a = state.mercSynthesis) == null ? void 0 : _a.targetId) === unitId ? state.mercSynthesis.materialId : "";
  const selectedId = materials.some((member) => member.unitId === previous) ? previous : "";
  state.mercSynthesis = { targetId: unitId, materialId: selectedId };
  const selected = materials.find((member) => member.unitId === selectedId) || null;
  state.modal = {
    title: "✦ 选择合成材料",
    className: "merc-synthesis-modal",
    body: renderMercSynthesisPanel(target, materials, selectedId),
    actions: [
      { label: "取消", className: "ghost", onClick: () => closeMercSynthesisModal() },
      ...selected ? [{ label: "确认消耗 ".concat(selected.name), className: "merc-synthesis-confirm", onClick: () => confirmMercSynthesis() }] : []
    ]
  };
  render();
}
function selectMercSynthesisMaterial(targetId, materialId) {
  var _a, _b;
  const target = (_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b.find((member) => member.unitId === targetId && member.mercData);
  const material = synthesisMaterialsFor(target).find((member) => member.unitId === materialId);
  if (!target || !material) return openMercSynthesisModal(targetId);
  state.mercSynthesis = { targetId, materialId };
  openMercSynthesisModal(targetId);
}
function confirmMercSynthesis() {
  const selection = state.mercSynthesis;
  if (!(selection == null ? void 0 : selection.targetId) || !selection.materialId) return;
  synthesizeMercenary(selection.targetId, selection.materialId);
}
function synthesizeMercenary(unitId, materialId = "") {
  if (!state.run) return;
  const target = state.run.party.find((member) => member.unitId === unitId && member.mercData);
  if (!materialId) return openMercSynthesisModal(unitId);
  const material = synthesisMaterialsFor(target).find((member) => member.unitId === materialId);
  if (!target || !material) {
    toast("需要另一名同品质佣兵作为合成材料。");
    return openMercSynthesisModal(unitId);
  }
  const currentRank = DATA.mercQualityOrder.indexOf(target.mercData.quality || "white");
  const nextQuality = DATA.mercQualityOrder[currentRank + 1];
  if (!nextQuality) return;
  const materialGear = Object.values(material.mercData.equipment || {}).filter(Boolean);
  state.mercSynthesis = null;
  state.modal = null;
  target.mercData.quality = nextQuality;
  target.mercData.level = Math.max(target.mercData.level || 1, material.mercData.level || 1) + 1;
  target.mercData.exp = Math.max(target.mercData.exp || 0, material.mercData.exp || 0);
  tryUpgradeMercenarySkill(target);
  state.run.party = state.run.party.filter((member) => member.unitId !== material.unitId);
  delete state.run.currentHp[material.unitId];
  delete state.run.currentEnergy[material.unitId];
  for (const item of materialGear) {
    const handoff = autoAssignMercEquipment(item);
    if (!handoff.assigned) sellUnassignedEquipment(item);
    else if (handoff.replaced) sellUnassignedEquipment(handoff.replaced);
  }
  refreshPartyHpCaps();
  addRunLog("⚗️ ".concat(target.name, " 融合 ").concat(material.name, "，晋升为").concat(DATA.mercQuality[nextQuality].name, "佣兵。"));
  saveGame();
  render();
}
function openQuickSelectSettings() {
  quickSettings();
  state.modal = {
    title: "⚙️ 快速选择设置",
    body: renderQuickSelectSettingsPanel(),
    className: "quick-select-modal",
    actions: []
  };
  render();
}
function renderQuickSelectSettingsPanel() {
  const settings = quickSettings();
  return '\n    <div class="quick-select-settings" data-preserve-scroll="quick-select-settings">\n      <button class="quick-modal-close" onclick="closeSettingsModal()">×</button>\n      '.concat(quickSettingSection("📦", "获得装备时", "手动模式不显示装备页下方的“自动”；询问模式可对当前装备执行一次智能分配", [
    ["manual", "手动"],
    ["ask", "询问"],
    ["equip", "自动装备"],
    ["discard", "自动丢弃"]
  ], settings.equip, "equip"), "\n      ").concat(quickSettingSection("🛒", "商店快速选择", "自动购买会按商店顺序，每种当前买得起的道具购买1件", [
    ["normal", "正常购买"],
    ["auto", "自动购买"],
    ["skip", "直接跳过"]
  ], settings.itemShop, "itemShop"), "\n      ").concat(quickSettingSection("🍺", "佣兵酒馆", "自动招募：先复活所有阵亡佣兵，再低价招募普通佣兵；高品质只能由合成获得", [
    ["manual", "手动选择"],
    ["auto", "自动招募"],
    ["skip", "直接跳过"]
  ], settings.tavern, "tavern"), "\n      ").concat(quickSettingSection("🕯️", "守卫遗志", "智能选择：有阵亡佣兵、生命低于65%或能量低于40%时点亮神火，否则净化神核", [
    ["smart", "智能选择"],
    ["kindle", "点亮神火"],
    ["purify", "净化神核"],
    ["relic", "收下遗物"]
  ], settings.bossStory, "bossStory"), '\n      <div class="quick-event-head"><span>📋 各事件默认选项</span><em>（⚡快速选择时自动执行）</em></div>\n      <div class="quick-event-list">\n        ').concat(quickEventOptions().map((event) => '\n          <div class="quick-event-row">\n            <h3>'.concat(renderEventIcon(event, "quick-event-icon"), " ").concat(esc(event.name), '</h3>\n            <div class="quick-chip-row">\n              ').concat(event.options.map((option) => {
    var _a;
    return quickEventButton(event.id, option, ((_a = settings.events) == null ? void 0 : _a[event.id]) || event.options[0].result);
  }).join(""), "\n            </div>\n          </div>\n        ")).join(""), "\n      </div>\n    </div>\n  ");
}
function quickSettingSection(icon, title, hint, options, active, key) {
  return '\n    <section class="quick-setting-section">\n      <h3>'.concat(icon, " ").concat(title, "</h3>\n      <p>").concat(esc(hint), '</p>\n      <div class="quick-segment-row ').concat(options.length === 4 ? "four-options" : "", '">\n        ').concat(options.map(([value, label]) => '\n          <button class="'.concat(active === value ? "selected" : "", '" onclick="setQuickSelectSetting(\'').concat(key, "', '").concat(value, "')\">").concat(esc(label), "</button>\n        ")).join(""), "\n      </div>\n    </section>\n  ");
}
function quickEventButton(eventId, option, activeResult) {
  return '<button class="'.concat(activeResult === option.result ? "selected" : "", '" onclick="setQuickEventChoice(\'').concat(eventId, "', '").concat(option.result, "')\">").concat(esc(option.label), "</button>");
}
function setQuickSelectSetting(key, value) {
  const settings = quickSettings();
  if (!["equip", "itemShop", "tavern", "bossStory"].includes(key)) return;
  settings[key] = value;
  saveGame({ persistDurableChangesDuringCombat: true });
  openQuickSelectSettings();
}
function setQuickEventChoice(eventId, result) {
  const settings = quickSettings();
  const event = quickEventOptions().find((entry) => entry.id === eventId);
  if (!(event == null ? void 0 : event.options.some((option) => option.result === result))) return;
  settings.events[eventId] = result;
  saveGame({ persistDurableChangesDuringCombat: true });
  openQuickSelectSettings();
}
function openSettingsModal() {
  state.modal = {
    title: "⚙️ 设置",
    body: renderSettingsPanel(),
    className: "settings-modal",
    actions: []
  };
  render();
}
function renderBagPanel() {
  var _a;
  const entries = Object.entries(((_a = state.run) == null ? void 0 : _a.items) || {});
  if (!entries.length) return '<div class="empty-small">背包是空的。</div>';
  return '<div class="mini-list">'.concat(entries.map(([id, count]) => {
    const item = DATA.items[id] || { name: id, icon: "🎒", desc: "" };
    return '<div class="mini-row"><span>'.concat(item.icon, " <b>").concat(item.name, "</b><br><small>").concat(esc(item.desc || ""), "</small></span><b>x").concat(count, "</b></div>");
  }).join(""), "</div>");
}
function renderMobileEquipmentPanel() {
  return '<div class="mini-list">'.concat(DATA.equipSlots.map((slot) => {
    var _a, _b, _c2, _d2;
    const item = (_b = (_a = state.run) == null ? void 0 : _a.equipment) == null ? void 0 : _b[slot];
    const lv = ((_d2 = (_c2 = state.run) == null ? void 0 : _c2.enhanceLevels) == null ? void 0 : _d2[slot]) || 0;
    return '<div class="mini-row equip-row">'.concat(renderEquipArt(slot, "equip-art equip-row-art", (item == null ? void 0 : item.rarity) || "empty"), "<span><b>").concat(DATA.equipSlotNames[slot], "</b><br><small>").concat(esc(equipText(item)).replace(/\n/g, " / "), " ").concat(item ? "+".concat(lv) : "", "</small></span><button onclick=\"toast(enhanceEquip('").concat(slot, "')); openMobilePanel('equip')\">强化</button></div>");
  }).join(""), "</div>");
}
function renderSkillsPanel() {
  var _a, _b;
  const member = (_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b[0];
  if (!member) return '<div class="empty-small">暂无技能。</div>';
  return '<div class="mini-list">'.concat(classSkillsFor({ classId: member.classId, cooldowns: {}, energy: 999, stats: { energy: 999 } }).map((s) => '<div class="mini-row"><span><b>'.concat(esc(s.name), "</b><br><small>").concat(colorText(s.desc || ""), "</small></span><b>").concat(s.cost || 0, "</b></div>")).join(""), "</div>");
}
function renderMobileTalentPanel() {
  var _a;
  const talents = ((_a = state.run) == null ? void 0 : _a.talents) || [];
  return '\n    <div class="talent-panel">\n      <button class="talent-modal-close" onclick="closeSettingsModal()">×</button>\n      <h2>✨ 已觉醒天赋 ('.concat(talents.length, ')</h2>\n      <div class="talent-panel-rule"></div>\n      <div class="talent-detail-list">\n        ').concat(talents.length ? talents.map(renderTalentDetailCard).join("") : '<div class="empty-small">还没有天赋。</div>', "\n      </div>\n    </div>\n  ");
}
function renderTalentDetailCard(t) {
  return '\n    <article class="talent-detail-card rarity-'.concat(esc(t.rarity || "common"), '">\n      <h3>').concat(talentTitleHtml(t, { rarityLabel: true }), "</h3>\n      <p>").concat(talentDescriptionHtml(t), "</p>\n      ").concat(t.mechanicDesc ? '<p class="subtle">专属机制：'.concat(esc(t.mechanicDesc), "</p>") : "", "\n    </article>\n  ");
}
function renderAbilityPanel() {
  var _a, _b;
  const member = (_b = (_a = state.run) == null ? void 0 : _a.party) == null ? void 0 : _b[0];
  if (!member) return '<div class="empty-small">暂无属性。</div>';
  const stats = calcUnitStats(member);
  return '<div class="attr-grid">'.concat(["hp", "atk", "matk", "def", "statusRes", "crit", "critDmg", "energy"].map((key) => "<div><span>".concat(STAT_LABEL[key], "</span><b>").concat(stats[key] || 0).concat(["crit", "critDmg"].includes(key) ? "%" : "", "</b></div>")).join(""), "</div>");
}
function renderAttributePanel() {
  return renderAbilityPanel();
}
function renderMercPanel() {
  var _a;
  const rows = (((_a = state.run) == null ? void 0 : _a.party) || []).filter((m) => m.mercData).map((m) => {
    var _a2;
    const stats = calcUnitStats(m);
    const hp = (_a2 = state.run.currentHp[m.unitId]) != null ? _a2 : stats.hp;
    return '<div class="mini-row"><span>'.concat(getClass(m.classId).icon, " <b>").concat(esc(m.name), "</b><br><small>").concat(getClass(m.classId).name).concat(m.mercData ? " · ".concat(DATA.mercQuality[m.mercData.quality].name) : "", "</small></span><b>").concat(Math.floor(hp), "/").concat(stats.hp, "</b></div>");
  }).join("");
  return rows ? '<div class="mini-list">'.concat(rows, "</div>") : '<div class="empty-small">暂无佣兵</div>';
}
function renderSettingsPanel() {
  var _a;
  const volume = clamp(Number((_a = state.perm.musicVolume) != null ? _a : 50), 0, 100);
  const autoTarget = state.perm.autoSelectTarget !== false;
  const autoMercEquipment = autoSelectMercEquipmentEnabled();
  const privacyAccepted = privacyAllowsNetworkServices();
  return '\n    <div class="settings-body">\n      <div class="settings-rule"></div>\n      <div class="settings-row">\n        <span>🎵 音乐音量</span>\n        <strong>'.concat(volume, '%</strong>\n      </div>\n      <input class="settings-range" type="range" min="0" max="100" step="5" value="').concat(volume, '" oninput="setMusicVolume(this.value)">\n      <div class="settings-rule"></div>\n      <div class="settings-row">\n        <span>🎯 自动选择目标</span>\n        <button class="toggle-btn ').concat(autoTarget ? "on" : "", '" onclick="toggleAutoSelectTarget()">').concat(autoTarget ? "开启" : "关闭", '</button>\n      </div>\n      <p class="settings-hint">开启后，单体技能会优先锁定敌方队列中第一个存活目标。</p>\n      <div class="settings-rule"></div>\n      <div class="settings-row">\n        <span>🗡️ 自动选择佣兵装备</span>\n        <button class="toggle-btn ').concat(autoMercEquipment ? "on" : "", '" onclick="toggleAutoSelectMercEquipment()">').concat(autoMercEquipment ? "开启" : "关闭", '</button>\n      </div>\n      <p class="settings-hint">开启后，智能分配与主角换下的装备会自动选择合适佣兵；关闭后仅通过“分配佣兵”手动设置。</p>\n      <div class="settings-rule"></div>\n      <div class="settings-row settings-privacy-row">\n        <span>🛡️ 隐私授权</span>\n        <span class="privacy-status-badge ').concat(privacyAccepted ? "accepted" : "required", '">').concat(privacyAccepted ? "已同意" : "待授权", '</span>\n      </div>\n      <p class="settings-hint">当前使用 ').concat(PRIVACY_POLICY_VERSION, ' 版协议；可随时查看协议或撤回授权。</p>\n      <div class="settings-privacy-actions">\n        <button type="button" class="settings-policy" onclick="openPrivacyPolicy()">查看隐私协议</button>\n        <button type="button" class="settings-withdraw" onclick="requestPrivacyWithdrawal()">撤回授权</button>\n      </div>\n      <div class="settings-rule"></div>\n      <button class="settings-save wide" onclick="saveProgressFromSettings()">💾 保存进度</button>\n      <div class="settings-rule"></div>\n      <button class="settings-save wide" onclick="returnToStartMenu()">🏠 返回开始页</button>\n      <div class="settings-rule"></div>\n      <button class="settings-close" onclick="closeSettingsModal()">关闭</button>\n    </div>\n  ');
}
function setMusicVolume(value) {
  var _a;
  state.perm.musicVolume = clamp(Number(value) || 0, 0, 100);
  saveGame({ persistDurableChangesDuringCombat: true });
  syncAudioVolume();
  if (((_a = state.modal) == null ? void 0 : _a.className) === "settings-modal") {
    state.modal.body = renderSettingsPanel();
    render();
  }
}
function toggleAutoSelectTarget() {
  var _a;
  state.perm.autoSelectTarget = state.perm.autoSelectTarget === false;
  saveGame({ persistDurableChangesDuringCombat: true });
  if (((_a = state.modal) == null ? void 0 : _a.className) === "settings-modal") {
    state.modal.body = renderSettingsPanel();
    render();
  }
}
function toggleAutoSelectMercEquipment() {
  var _a;
  state.perm.autoSelectMercEquipment = !autoSelectMercEquipmentEnabled();
  saveGame({ persistDurableChangesDuringCombat: true });
  if (((_a = state.modal) == null ? void 0 : _a.className) === "settings-modal") {
    state.modal.body = renderSettingsPanel();
    render();
  }
}
function saveProgressFromSettings() {
  if (saveGame({ persistDurableChangesDuringCombat: true })) toast("进度已保存。");
}
function closeSettingsModal() {
  state.modal = null;
  render();
}
function renderGrowthPanel() {
  return '<div class="growth-list">'.concat(DATA.growthTree.map((g) => {
    const lv = growthLevel(g.id);
    const cost = growthCost(g, lv);
    return '<div class="growth-item"><h3>'.concat(g.name, " <span>Lv.").concat(lv, "/").concat(g.maxLv, "</span></h3><p>").concat(esc(g.desc), "</p><button ").concat(lv >= g.maxLv ? "disabled" : "", " onclick=\"upgradeGrowth('").concat(g.id, "'); openMobilePanel('growth')\">升级 ").concat(cost, " 点</button></div>");
  }).join(""), '</div><button class="danger wide" onclick="resetGrowth(); openMobilePanel(\'growth\')">重置成长</button>');
}
function renderModal() {
  if (!state.modal) return "";
  return '\n    <div class="modal-backdrop '.concat(state.modal.backdropClassName || "", '">\n      <div class="modal ').concat(state.modal.className || "", '">\n        ').concat(state.modal.title ? '<h2 class="panel-title">'.concat(state.modal.title, "</h2>") : "", "\n        <div>").concat(state.modal.body, "</div>\n        ").concat((state.modal.actions || []).length ? '<div class="actions modal-actions">'.concat((state.modal.actions || []).map((a, idx) => '<button class="'.concat(a.className || "", '" onclick="modalAction(').concat(idx, ')">').concat(a.label, "</button>")).join(""), "</div>") : "", "\n      </div>\n    </div>\n  ");
}
function renderGrowth() {
  const growthSummary = DATA.growthTree.some((g) => growthLevel(g.id) > 0) ? DATA.growthTree.filter((g) => growthLevel(g.id) > 0).map((g) => "".concat(g.name, " Lv.").concat(growthLevel(g.id))).join(" / ") : "暂无加成，在强化中投入天赋点提升";
  const enhanceLv = growthLevel("g_enhance");
  return '\n    <section class="city-screen">\n      '.concat(renderCityHeader("🏰 主城"), '\n      <div class="city-content">\n        <div class="city-card profile-card">\n          <h3>⚔️ 冒险者档案</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>最高层数</span><b>第 ').concat(state.perm.bestFloor || 0, ' 层</b></div>\n          <div class="stat-row"><span>轮回次数</span><b>').concat(state.perm.totalRuns || 0, ' 次</b></div>\n          <div class="stat-row"><span>天赋点</span><b class="gold">').concat(state.perm.talentPoints || 0, ' 点</b></div>\n        </div>\n        <div class="city-card">\n          <h3 class="green">📈 永久成长</h3>\n          <div class="divider"></div>\n          <p>').concat(esc(growthSummary), '</p>\n        </div>\n        <div class="city-card">\n          <h3 class="purple">🔨 强化等级</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>技能天赋</span><b>Lv.').concat(growthLevel("g_init_sp"), '/10</b></div>\n          <div class="stat-row"><span>装备强化上限</span><b>+').concat(enhanceLv, "</b></div>\n        </div>\n      </div>\n      ").concat(renderCityNav("city"), "\n    </section>\n  ");
}
function renderCityNav(active = "city") {
  const launchAction = state.run || getSavedRun() ? "continueRun()" : "startSetup()";
  return '\n    <footer class="city-nav">\n      <button class="'.concat(active === "tower" ? "selected" : "", '" onclick="').concat(launchAction, '">⚔️ 出发</button>\n      <button class="').concat(active === "growth" ? "selected" : "", '" onclick="state.screen=\'growthList\'; render()">🔨 强化</button>\n      <button class="').concat(active === "talent" ? "selected" : "", '" onclick="state.screen=\'talentEnhance\'; render()">✨ 天赋</button>\n      <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n    </footer>\n  ');
}
function renderCityAdventureCard() {
  const savedRun = getSavedRun();
  const currentOrSavedRun = state.run || savedRun;
  const hasRun = !!currentOrSavedRun;
  const modeLabel = (currentOrSavedRun == null ? void 0 : currentOrSavedRun.dualHeroMode) || (currentOrSavedRun == null ? void 0 : currentOrSavedRun.mode) === "dual" ? "双英雄" : (currentOrSavedRun == null ? void 0 : currentOrSavedRun.hardcoreMode) || (currentOrSavedRun == null ? void 0 : currentOrSavedRun.mode) === "hardcore" ? "硬核" : "普通";
  return '\n    <div class="city-card city-adventure-card">\n      <div class="city-card-headline">\n        <h3>🗡️ 开始冒险</h3>\n        '.concat(hasRun ? "<span>第 ".concat(currentOrSavedRun.floor || 1, " 层</span>") : "<span>待出发</span>", '\n      </div>\n      <div class="divider"></div>\n      <div class="city-mode-grid">\n        ').concat(renderModeEntryButton("normal", "🏰 普通模式", "完整成长体系"), "\n        ").concat(renderModeEntryButton("hardcore", "☠️ 硬核模式", "禁用局外强化"), "\n        ").concat(renderModeEntryButton("dual", "👥 双英雄模式", "双职业挑战"), "\n      </div>\n    </div>\n  ");
}
function renderClassBestFloorRows() {
  return classList().map((cls) => '\n    <div class="class-record-row">\n      <span>'.concat(esc(cls.icon), " ").concat(esc(cls.name), "</span>\n      <b>第 ").concat(classBestFloor(cls.id), " 层</b>\n    </div>\n  ")).join("");
}
function renderLocalClassRecordsCard() {
  return '\n    <div class="city-card class-record-card">\n      <div class="city-card-headline">\n        <h3>🏆 职业最高纪录</h3>\n      </div>\n      <div class="divider"></div>\n      <div class="class-record-grid">'.concat(renderClassBestFloorRows(), "</div>\n    </div>\n  ");
}
function renderModeEntryButton(mode, title, desc) {
  return '\n    <button class="city-mode-btn mode-'.concat(mode, '" onclick="startPresetMode(\'').concat(mode, "')\">\n      <b>").concat(title, "</b>\n      <small>").concat(desc, "</small>\n    </button>\n  ");
}
function renderGrowth() {
  const growthSummary = DATA.growthTree.some((g) => growthLevel(g.id) > 0) ? DATA.growthTree.filter((g) => growthLevel(g.id) > 0).map((g) => "".concat(g.name, " Lv.").concat(growthLevel(g.id))).join(" / ") : "暂无加成，在强化中投入天赋点提升";
  const enhanceLv = growthLevel("g_enhance");
  const headlineRun = state.run || getSavedRun();
  const runModeName = headlineRun ? runModeDisplayName(headlineRun) : "普通";
  const runFloor = headlineRun ? Math.max(1, Math.floor(Number(headlineRun.floor) || 1)) : 1;
  const runStatus = headlineRun ? "".concat(runModeName, " · 第 ").concat(runFloor, " 层") : "选择模式，开启新轮回";
  return '\n    <section class="city-screen">\n      '.concat(renderCityHeader("🏰 主城"), '\n      <div class="city-content">\n        <div class="city-hero-card">\n          <div>\n            <span>轮回整备</span>\n            <h1>向高塔进发</h1>\n            <p>').concat(runStatus, '</p>\n          </div>\n          <div class="city-hero-stats">\n            <span><b>').concat(state.perm.talentPoints || 0, "</b> 天赋点</span>\n            <span><b>").concat(state.perm.totalRuns || 0, "</b> 次轮回</span>\n          </div>\n        </div>\n        ").concat(renderCityAdventureCard(), "\n        ").concat(renderLocalClassRecordsCard(), '\n        <div class="city-card profile-card">\n          <h3>⚔️ 冒险者档案</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>最高层数</span><b>第 ').concat(state.perm.bestFloor || 0, ' 层</b></div>\n          <div class="stat-row"><span>轮回次数</span><b>').concat(state.perm.totalRuns || 0, ' 次</b></div>\n          <div class="stat-row"><span>天赋点</span><b class="gold">').concat(state.perm.talentPoints || 0, " 点</b></div>\n        </div>\n        ").concat(renderAttributeGuideButton(), '\n        <div class="city-card">\n          <h3 class="green">📈 永久成长</h3>\n          <div class="divider"></div>\n          <p>').concat(esc(growthSummary), '</p>\n        </div>\n        <div class="city-card">\n          <h3 class="purple">🔨 强化等级</h3>\n          <div class="divider"></div>\n          <div class="stat-row"><span>技能天赋</span><b>Lv.').concat(growthLevel("g_init_sp"), '/10</b></div>\n          <div class="stat-row"><span>装备强化上限</span><b>+').concat(enhanceLv, "</b></div>\n        </div>\n      </div>\n      ").concat(renderCityNav("city"), "\n    </section>\n  ");
}
function attributeGuideRows() {
  return [
    ["❤️", "生命", "最大生命，归零后战败"],
    ["⚔️", "攻击", "影响物理伤害和攻击类技能"],
    ["🔮", "法术强度", "影响法术伤害、治疗和护盾技能"],
    ["🛡️", "防御", "降低受到的普通伤害"],
    ["🧿", "状态抗性", statusResolutionDesc()],
    ["💥", "暴击率", "造成伤害时触发暴击的概率"],
    ["♨️", "暴击伤害", "暴击时额外提高伤害"],
    ["🔋", "能量上限", "决定可储存的最高能量"],
    ["🔄", "能量回复", "友方回合开始时恢复能量"],
    ["💚", "生命恢复", "友方回合开始时恢复生命"],
    ["✨", "闪避", "由技能、天赋或装备触发，成功时免受本次攻击"]
  ];
}
function renderAttributeGuideRows() {
  return attributeGuideRows().map(([icon, name, desc]) => '\n    <div class="attribute-guide-row">\n      <b>'.concat(icon, " ").concat(name, "</b>\n      <span>").concat(desc, "</span>\n    </div>\n  ")).join("");
}
function renderAttributeGuideButton() {
  return '\n    <button class="attribute-guide-open" onclick="openAttributeGuideModal()">\n      <span>📘 属性说明</span>\n      <small>查看各属性作用</small>\n    </button>\n  ';
}
function openAttributeGuideModal() {
  state.modal = {
    title: "📘 属性说明",
    className: "attribute-guide-modal",
    body: '<div class="attribute-guide-grid">'.concat(renderAttributeGuideRows(), "</div>"),
    actions: [{ label: "关闭", className: "ghost", onClick: () => {
      state.modal = null;
      render();
    } }]
  };
  render();
}
function renderCityNav(active = "city") {
  const launchAction = state.run || getSavedRun() ? "continueRun()" : "startPresetMode('normal')";
  return '\n    <footer class="city-nav">\n      <button class="'.concat(active === "tower" ? "selected" : "", '" onclick="').concat(launchAction, '">⚔️ 出发</button>\n      <button class="').concat(active === "growth" ? "selected" : "", '" onclick="state.screen=\'growthList\'; render()">🔨 强化</button>\n      <button class="').concat(active === "talent" ? "selected" : "", '" onclick="state.screen=\'talentEnhance\'; render()">✨ 天赋</button>\n      <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n    </footer>\n  ');
}
function renderMenu() {
  const savedRun = state.run || getSavedRun();
  const runMode = savedRun ? runModeDisplayName(savedRun) : "普通";
  const runFloor = savedRun ? Math.max(1, Math.floor(Number(savedRun.floor) || 1)) : 1;
  const runStatus = savedRun ? "".concat(runMode, " · 第 ").concat(runFloor, " 层") : "进入主城整备";
  return '\n    <section class="menu-screen">\n      <div class="menu-center">\n        <div class="menu-crest" aria-hidden="true">\n          <span>✦</span>\n        </div>\n        <div class="menu-kicker">永恒之塔 · 守望重燃</div>\n        <h1 class="menu-title">\n          <span>开局觉醒</span>\n          <span class="menu-title-accent">超神级天赋</span>\n        </h1>\n        <p class="menu-subtitle">在破晓前踏入高塔，让下一次轮回更接近神明。</p>\n        <div class="menu-stack" aria-label="开始菜单">\n          <button class="menu-btn primary" onclick="openCity()">\n            <span class="menu-btn-icon">🏰</span>\n            <span class="menu-btn-copy">\n              <b>开始游戏</b>\n              <small>'.concat(runStatus, '</small>\n            </span>\n          </button>\n          <div class="menu-secondary-row">\n            <button class="menu-btn secondary" onclick="showPatchNotes()">📋 <span>更新日志</span></button>\n            <button class="menu-btn secondary" onclick="openMobilePanel(\'settings\')">⚙️ <span>设置</span></button>\n          </div>\n        </div>\n        <div class="menu-tags" aria-label="玩法标签">\n          <span>天赋觉醒</span>\n          <span>永恒之塔</span>\n          <span>主城成长</span>\n        </div>\n        <div class="menu-version">v').concat(APP_VERSION, "</div>\n      </div>\n    </section>\n  ");
}
function modeDisplayName(mode, run = null) {
  const def = gameMode(mode);
  return def.id === "climb" && run ? "".concat(def.name, " Lv.").concat(climbLevelOfRun(run)) : def.name;
}
function runModeDisplayName(run) {
  return run ? modeDisplayName(modeOfRun(run), run) : gameMode("normal").name;
}
function climbDifficultyButtons(selectedLevel) {
  const unlocked = climbUnlockedLevel();
  return CLIMB_DIFFICULTIES.map((difficulty) => {
    const locked = difficulty.level > unlocked;
    const selected = difficulty.level === selectedLevel;
    const cleared = climbLevelCleared(difficulty.level);
    return '<button class="climb-level-btn '.concat(selected ? "selected" : "", " ").concat(cleared ? "cleared" : "", '" type="button" ').concat(locked ? "disabled" : "", ' onclick="selectClimbLevel(').concat(difficulty.level, ')">\n      <b>Lv.').concat(difficulty.level, "</b><span>").concat(locked ? "🔒" : cleared ? "✓" : difficulty.name, "</span>\n    </button>");
  }).join("");
}
function renderClimbRules(level) {
  const active = CLIMB_DIFFICULTIES.filter((difficulty) => difficulty.level <= level);
  return '<div class="climb-rule-list">'.concat(active.map((difficulty) => '\n    <div class="climb-rule-row '.concat(difficulty.level === level ? "current" : "", '">\n      <b>Lv.').concat(difficulty.level, "</b><span>").concat(esc(difficulty.desc), "</span>\n    </div>\n  ")).join(""), "</div>");
}
function openClimbModeModal(level = null) {
  const unlocked = climbUnlockedLevel();
  const savedRun = currentOrSavedRunForSlot("climb");
  const preferred = level == null ? isClimbRun(savedRun) ? climbLevelOfRun(savedRun) : unlocked : level;
  const selectedLevel = normalizeClimbLevel(preferred, unlocked);
  const selected = climbDifficulty(selectedLevel);
  const sameRun = isClimbRun(savedRun) && climbLevelOfRun(savedRun) === selectedLevel;
  state.climbSelection = selectedLevel;
  state.modal = {
    title: "⛰️ 攀登模式",
    className: "climb-mode-modal",
    body: '\n      <div class="climb-mode-summary">\n        <div><span>本轮目标</span><b>固定100层</b></div>\n        <div><span>已解锁</span><b>Lv.'.concat(unlocked, "</b></div>\n        <div><span>当前选择</span><b>Lv.").concat(selectedLevel, " · ").concat(esc(selected.name), '</b></div>\n      </div>\n      <p class="climb-scalar-rule">当前倍率：敌军基础属性 ×').concat(climbEnemyBaseMultiplier(selectedLevel), " · 结算天赋点 ×").concat(climbTalentPointMultiplier(selectedLevel), '</p>\n      <div class="climb-level-grid" aria-label="攀登难度选择">').concat(climbDifficultyButtons(selectedLevel), '</div>\n      <div class="climb-current-rule"><b>Lv.').concat(selectedLevel, " 本级机制</b><span>").concat(esc(selected.desc), '</span></div>\n      <h3 class="climb-rules-title">已生效机制</h3>\n      ').concat(renderClimbRules(selectedLevel), "\n    "),
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } },
      { label: sameRun ? "继续 Lv.".concat(selectedLevel) : "开始 Lv.".concat(selectedLevel), onClick: () => startClimbLevel(selectedLevel) }
    ]
  };
  render();
}
function selectClimbLevel(level) {
  const selected = normalizeClimbLevel(level);
  if (selected > climbUnlockedLevel()) return;
  openClimbModeModal(selected);
}
function startClimbLevel(level) {
  const selected = normalizeClimbLevel(level);
  if (selected > climbUnlockedLevel()) return;
  const climbRun = currentOrSavedRunForSlot("climb");
  state.modal = null;
  state.climbSelection = selected;
  if (isClimbRun(climbRun) && climbLevelOfRun(climbRun) === selected) {
    continueRun("climb");
    return;
  }
  if (climbRun) {
    openSharedSaveReplaceModal("climb", climbRun, { climbLevel: selected });
    return;
  }
  startSetup("climb", { climbLevel: selected });
}
function currentOrSavedRunForMode(mode) {
  const normalized = normalizeRunSaveMode(mode);
  if (state.run && modeOfRun(state.run) === normalized) return state.run;
  return getSavedRun(normalized);
}
function selectedCityMode(modes = visibleGameModes()) {
  var _a;
  const selected = modes.find((mode) => mode.id === state.cityModeId);
  if (selected) return selected;
  state.cityModeId = ((_a = modes[0]) == null ? void 0 : _a.id) || "normal";
  return modes[0] || gameMode("normal");
}
function setCityMode(mode) {
  const rawMode = String(mode || "");
  if (!visibleGameModes().some((entry) => entry.id === rawMode)) return;
  const normalized = normalizeRunSaveMode(rawMode);
  state.cityModeId = normalized;
  render();
}
function switchCityMode(step) {
  const modes = visibleGameModes();
  if (!modes.length) return;
  const currentIndex = Math.max(0, modes.findIndex((mode) => mode.id === state.cityModeId));
  const nextIndex = (currentIndex + step % modes.length + modes.length) % modes.length;
  setCityMode(modes[nextIndex].id);
}
function renderCityAdventureCard() {
  const modes = visibleGameModes();
  const selected = selectedCityMode(modes);
  const adventureRun = currentOrSavedRunForSlot("normal");
  const climbRun = currentOrSavedRunForSlot("climb");
  const saveRows = [
    adventureRun ? '<div class="city-shared-save has-save"><span>冒险存档</span><b>'.concat(runModeDisplayName(adventureRun), " · 第 ").concat(Math.max(1, Math.floor(Number(adventureRun.floor) || 1)), " 层</b></div>") : "",
    climbRun ? '<div class="city-shared-save has-save"><span>攀登存档</span><b>'.concat(runModeDisplayName(climbRun), " · 第 ").concat(Math.max(1, Math.floor(Number(climbRun.floor) || 1)), " 层</b></div>") : ""
  ].filter(Boolean);
  return '\n    <div class="city-card city-adventure-card">\n      <div class="city-card-headline">\n        <h3>🗡️ 难度选择</h3>\n        <span>'.concat(saveRows.length ? "".concat(saveRows.length, "份独立存档") : "待出发", "</span>\n      </div>\n      ").concat(saveRows.length ? '<div class="city-save-stack">'.concat(saveRows.join(""), "</div>") : "", '\n      <p class="city-mode-hint">选择难度，点击中间按钮开始游戏</p>\n      <div class="city-mode-carousel" aria-label="难度选择">\n        <button class="city-mode-arrow" type="button" onclick="switchCityMode(-1)" aria-label="上一个难度">‹</button>\n        ').concat(renderModeEntryButton(selected.id), '\n        <button class="city-mode-arrow" type="button" onclick="switchCityMode(1)" aria-label="下一个难度">›</button>\n      </div>\n      <div class="city-mode-pages" aria-label="当前难度位置">\n        ').concat(modes.map((mode) => '<button class="'.concat(mode.id === selected.id ? "selected" : "", '" type="button" onclick="setCityMode(\'').concat(mode.id, '\')" aria-label="选择').concat(mode.name, '"></button>')).join(""), "\n      </div>\n    </div>\n  ");
}
function renderModeEntryButton(mode) {
  const normalized = normalizeRunSaveMode(mode);
  const def = gameMode(normalized);
  const run = currentOrSavedRunForMode(normalized);
  const slotRun = currentOrSavedRunForSlot(normalized);
  const active = state.run && modeOfRun(state.run) === normalized;
  if (normalized === "climb") {
    const unlocked = climbUnlockedLevel();
    const shownLevel = run ? climbLevelOfRun(run) : unlocked;
    const status2 = run ? "继续 Lv.".concat(shownLevel, " · 第 ").concat(Math.max(1, Math.floor(Number(run.floor) || 1)), " 层") : "已解锁 Lv.".concat(unlocked, " · 固定100层");
    const launchLabel2 = run ? "选择难度或继续" : "选择攀登难度";
    return '\n      <button class="city-mode-btn city-mode-featured mode-climb '.concat(run ? "has-save" : "", " ").concat(active ? "selected" : "", '" type="button" onclick="openClimbModeModal()" aria-label="攀登模式，').concat(launchLabel2, '">\n        <span class="city-mode-top"><b>').concat(def.icon, " ").concat(def.name, "</b><em>Lv.").concat(shownLevel, '</em></span>\n        <span class="city-mode-featured-rule">100层通关 · 逐级解锁 Lv.1–Lv.').concat(CLIMB_MAX_LEVEL, "</span>\n        <small>").concat(status2, '</small>\n        <span class="city-mode-launch">').concat(launchLabel2, " ›</span>\n      </button>\n    ");
  }
  const status = run ? "继续第 ".concat(Math.max(1, Math.floor(Number(run.floor) || 1)), " 层") : slotRun ? "新开将覆盖".concat(runModeDisplayName(slotRun), "进度") : def.endFloor ? "通关第 ".concat(def.endFloor, " 层") : "无尽推进";
  const launchLabel = run ? "点击继续游戏" : "点击开始游戏";
  return '\n    <button class="city-mode-btn city-mode-featured mode-'.concat(normalized, " ").concat(run ? "has-save" : "", " ").concat(active ? "selected" : "", '" type="button" onclick="startPresetMode(\'').concat(normalized, '\')" aria-label="').concat(def.name, "难度，").concat(launchLabel, '">\n      <span class="city-mode-top"><b>').concat(def.icon, " ").concat(def.name, "</b><em>×").concat(def.difficulty, '</em></span>\n      <span class="city-mode-featured-rule">敌军强度 ×').concat(def.difficulty, "</span>\n      <small>").concat(status, '</small>\n      <span class="city-mode-launch">').concat(launchLabel, " ›</span>\n    </button>\n  ");
}
function renderCityNav(active = "city") {
  return '\n    <footer class="city-nav">\n      <button class="'.concat(active === "growth" ? "selected" : "", '" onclick="state.screen=\'growthList\'; render()">🔨 强化</button>\n      <button class="').concat(active === "talent" ? "selected" : "", '" onclick="state.screen=\'talentEnhance\'; render()">✨ 天赋</button>\n      <button onclick="openMobilePanel(\'settings\')">⚙️ 设置</button>\n    </footer>\n  ');
}
function setupModeDetail(mode) {
  var _a;
  const def = gameMode(mode);
  if (def.id === "climb") {
    const level = normalizeClimbLevel(((_a = state.setup) == null ? void 0 : _a.climbLevel) || CLIMB_MIN_LEVEL);
    return {
      icon: def.icon,
      title: "".concat(def.name, " Lv.").concat(level, " · 100层"),
      desc: "敌军基础属性 x".concat(climbEnemyBaseMultiplier(level), " · 天赋点 x").concat(climbTalentPointMultiplier(level), " · ").concat(climbDifficulty(level).desc)
    };
  }
  return {
    icon: def.icon,
    title: "".concat(def.name).concat(def.endFloor ? "关卡" : "模式"),
    desc: def.endFloor ? "敌军生命、攻击、防御 x".concat(def.difficulty, " · 击败第").concat(def.endFloor, "层Boss即可通关") : "敌军生命、攻击、防御 x".concat(def.difficulty, " · 使用王者难度，无通关层数")
  };
}
function renderSetupModeDetail() {
  var _a;
  const mode = normalizeRunSaveMode(((_a = state.setup) == null ? void 0 : _a.mode) || state.activeMode);
  const detail = setupModeDetail(mode);
  return '\n    <div class="setup-mode-detail mode-'.concat(mode, '">\n      <h2>').concat(detail.icon, " ").concat(detail.title, "</h2>\n      <p>").concat(esc(detail.desc), "</p>\n    </div>\n  ");
}
function renderSetupTalentSummary() {
  var _a;
  const talents = ((_a = state.draft) == null ? void 0 : _a.selectedTalents) || [];
  return '\n    <div class="setup-talent-summary">\n      <h2>✨ 已觉醒天赋</h2>\n      '.concat(talents.length ? talents.map((t) => '\n        <div class="setup-talent-row rarity-'.concat(t.rarity, '">\n          <h3>').concat(talentTitleHtml(t, { rarityLabel: true }), "</h3>\n          <p>").concat(talentDescriptionHtml(t), "</p>\n        </div>\n      ")).join("") : '<p class="subtle">尚未选择天赋，请返回重新选择。</p>', "\n    </div>\n  ");
}
function setupSecondClassFallback(firstClassId) {
  var _a;
  return ((_a = classList().find((c) => c.id !== firstClassId)) == null ? void 0 : _a.id) || firstClassId;
}
function ensureSetupClassPair() {
  var _a;
  state.setup || (state.setup = { mode: "normal", classId: "warrior", secondClassId: "mage" });
  (_a = state.setup).classId || (_a.classId = "warrior");
  if (!state.setup.secondClassId || state.setup.secondClassId === state.setup.classId) {
    state.setup.secondClassId = setupSecondClassFallback(state.setup.classId);
  }
}
function chooseSetupClass(classId, slot = "first") {
  state.setup || (state.setup = { mode: "normal", classId: "warrior", secondClassId: "mage" });
  if (slot === "second") {
    if (classId === state.setup.classId) return;
    state.setup.secondClassId = classId;
    if (state.setup.mode === "dual") {
      beginDraft();
      return;
    }
  } else {
    state.setup.classId = classId;
    if (state.setup.secondClassId === classId) state.setup.secondClassId = setupSecondClassFallback(classId);
    if (state.setup.mode !== "dual") {
      beginDraft();
      return;
    }
  }
  render();
}
function renderDualClassCard(c) {
  const first = state.setup.classId === c.id;
  const second = state.setup.secondClassId === c.id;
  return '\n    <div class="class-card dual-class-card portrait-card portrait-'.concat(classArtId(c.id), " ").concat(first ? "selected hero-one-selected" : "", " ").concat(second ? "hero-two-selected" : "", '">\n      ').concat(renderClassPortrait(c.id, "class-portrait class-card-portrait", { showBadge: false }), '\n      <div class="class-card-copy">\n        <div class="class-card-title">\n          <h3>').concat(c.name, '<span class="class-card-badge" aria-hidden="true">').concat(esc(c.icon || ""), '</span></h3>\n          <div class="hero-pick-tags">\n            ').concat(first ? '<span class="hero-one-tag">英雄1</span>' : "", "\n            ").concat(second ? '<span class="hero-two-tag">英雄2</span>' : "", "\n          </div>\n        </div>\n        <p>").concat(esc(c.desc), '</p>\n        <div class="dual-class-actions">\n          <button class="').concat(first ? "selected" : "", '" onclick="chooseSetupClass(\'').concat(c.id, "', 'first')\">").concat(first ? "已选英雄1" : "英雄1", '</button>\n          <button class="').concat(second ? "selected" : "", '" ').concat(first ? "disabled" : "", " onclick=\"chooseSetupClass('").concat(c.id, "', 'second')\">").concat(second ? "已选英雄2" : "英雄2", "</button>\n        </div>\n      </div>\n    </div>\n  ");
}
function renderSetupClassSelection(classes) {
  if (state.setup.mode !== "dual") {
    return '\n      <h3 class="section-caption">选择职业</h3>\n      <div class="class-grid">'.concat(classes.map((c) => classCard(c, state.setup.classId === c.id, "chooseSetupClass('".concat(c.id, "')"))).join(""), "</div>\n    ");
  }
  ensureSetupClassPair();
  const first = getClass(state.setup.classId);
  const second = getClass(state.setup.secondClassId);
  return '\n    <h3 class="section-caption">选择双英雄</h3>\n    <div class="dual-class-summary">\n      <span>英雄1：'.concat(first.icon, " ").concat(first.name, "</span>\n      <span>英雄2：").concat(second.icon, " ").concat(second.name, '</span>\n    </div>\n    <div class="class-grid dual-class-grid">').concat(classes.map((c) => renderDualClassCard(c)).join(""), "</div>\n  ");
}
function renderSetup() {
  const classes = classList();
  return '\n    <section class="select-screen setup-screen">\n      '.concat(renderSetupModeDetail(), "\n      ").concat(renderSetupTalentSummary(), "\n      ").concat(renderSetupClassSelection(classes), "\n    </section>\n  ");
}
function rollTalentCandidates(pickIndex, selectedTalents, rareWeightMultiplier = 1) {
  var _a, _b;
  if (pickIndex === 1) return shuffle(DATA.hiddenTalents).slice(0, 3);
  const selectedIds = new Set(selectedTalents.map((t) => t.id));
  const classContext = state.run ? getBaseClassId(state.run.classId || state.setup.classId) : null;
  const pool = DATA.talents.filter((t) => {
    var _a2;
    if (selectedIds.has(t.id)) return false;
    if (!t.classReq || !classContext) return true;
    return t.classReq === classContext || t.classReq === ((_a2 = state.run) == null ? void 0 : _a2.classId);
  });
  const rarityWeight = { common: 38, rare: 25, epic: 14, legendary: 7, mythic: 3 };
  const rewardedRarityMultiplier = Math.max(1, Number(rareWeightMultiplier) || 1);
  const rareBonus = ((_a = state.run) == null ? void 0 : _a.hardcoreMode) ? 0 : growthLevel("g_mythic_w");
  const pityReduction = ((_b = state.run) == null ? void 0 : _b.hardcoreMode) ? 0 : growthLevel("g_pity");
  const pity = state.perm.pityCounter >= Math.max(6, 15 - pityReduction);
  const count = selectedTalents.some((t) => t.passive === "reincarnation_admin") ? 4 : 3;
  const chosen = [];
  const used = /* @__PURE__ */ new Set();
  while (chosen.length < count && used.size < pool.length) {
    let total = 0;
    const weights = pool.map((t, idx) => {
      if (used.has(idx)) return 0;
      let w = rarityWeight[t.rarity] || 10;
      const isRareOrBetter = ["rare", "epic", "legendary", "mythic"].includes(t.rarity);
      if (isRareOrBetter) w += rareBonus * ({ rare: 0.5, epic: 1, legendary: 2, mythic: 3 }[t.rarity] || 0);
      if (pity && t.rarity === "mythic") w += 60;
      if (isRareOrBetter) w *= rewardedRarityMultiplier;
      total += w;
      return w;
    });
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0 && !used.has(i)) {
        used.add(i);
        chosen.push(pool[i]);
        break;
      }
    }
  }
  return chosen.length ? chosen : shuffle(pool).slice(0, count);
}
function startSetup(mode = "normal", options = {}) {
  var _a, _b, _c2, _d2, _e2, _f2;
  const normalized = normalizeRunSaveMode(mode);
  const classId = ((_a = state.setup) == null ? void 0 : _a.classId) || "warrior";
  const secondClassId = ((_b = state.setup) == null ? void 0 : _b.secondClassId) && state.setup.secondClassId !== classId ? state.setup.secondClassId : "mage";
  const requestedClimbLevel = (_f2 = (_e2 = (_d2 = options.climbLevel) != null ? _d2 : (_c2 = state.setup) == null ? void 0 : _c2.climbLevel) != null ? _e2 : state.climbSelection) != null ? _f2 : CLIMB_MIN_LEVEL;
  const climbLevel = normalized === "climb" ? normalizeClimbLevel(requestedClimbLevel, climbUnlockedLevel()) : 0;
  state.setup = { mode: normalized, classId, secondClassId, climbLevel };
  if (state.run && !saveGame()) return;
  state.activeMode = normalized;
  state.run = null;
  state.combat = null;
  state.combatCheckpoint = null;
  state.pendingSkill = null;
  state.eventResult = null;
  state.shopOpen = false;
  state.reincarnationResult = null;
  state.draft = { pickIndex: 0, maxPicks: 3, selectedTalents: [], candidates: rollTalentCandidates(1, []), extraPickUsed: false };
  state.screen = "draft";
  render();
}
function startPresetMode(mode) {
  const normalized = normalizeRunSaveMode(mode);
  state.activeMode = normalized;
  state.cityModeId = normalized;
  if (normalized === "climb") {
    openClimbModeModal();
    return;
  }
  const run = currentOrSavedRunForMode(normalized);
  if (run) {
    continueRun(normalized);
    return;
  }
  const slotRun = currentOrSavedRunForSlot(normalized);
  if (slotRun) {
    openSharedSaveReplaceModal(normalized, slotRun);
    return;
  }
  startSetup(normalized);
}
function openSharedSaveReplaceModal(mode, sharedRun, options = {}) {
  const target = gameMode(mode);
  const currentMode = gameMode(modeOfRun(sharedRun));
  const currentFloor = Math.max(1, Math.floor(Number(sharedRun.floor) || 1));
  const targetClimbLevel = mode === "climb" ? normalizeClimbLevel(options.climbLevel || CLIMB_MIN_LEVEL, climbUnlockedLevel()) : null;
  const targetName = mode === "climb" ? "".concat(target.name, " Lv.").concat(targetClimbLevel) : target.name;
  const slotName = mode === "climb" ? "攀登存档" : "冒险存档";
  state.modal = {
    title: "⚠️ 覆盖".concat(slotName, "？"),
    className: "shared-save-modal",
    body: '\n      <div class="shared-save-modal-copy">\n        <p>当前'.concat(slotName, "：<b>").concat(currentMode.icon, " ").concat(runModeDisplayName(sharedRun), " · 第 ").concat(currentFloor, " 层</b></p>\n        <p>开始<b>").concat(target.icon, " ").concat(targetName, "</b>会覆盖这份进度。</p>\n        <small>").concat(mode === "climb" ? "普通冒险存档" : "攀登存档", "不会受影响。</small>\n      </div>\n    "),
    actions: [
      { label: "取消", className: "ghost", onClick: () => {
        state.modal = null;
        render();
      } },
      { label: "开始".concat(targetName), className: "danger", onClick: () => discardSharedRunForMode(mode, options) }
    ]
  };
  render();
}
function discardSharedRunForMode(mode, options = {}) {
  const targetSlot = runSaveSlotKey(mode);
  if (state.run && runSaveSlotKey(state.run.mode) !== targetSlot && !saveGame()) return;
  state.run = null;
  state.combat = null;
  state.combatCheckpoint = null;
  state.floorEvents = [];
  state.eventIdx = 0;
  state.eventResult = null;
  state.shopOpen = false;
  state.pendingSkill = null;
  state.modal = null;
  state.activeMode = normalizeRunSaveMode(mode);
  clearRunSave(mode);
  startSetup(mode, options);
}
function selectDraftTalent(talentId) {
  var _a, _b, _c2;
  const talent = (_b = (_a = state.draft) == null ? void 0 : _a.candidates) == null ? void 0 : _b.find((t) => t.id === talentId);
  if (!talent) return;
  (_c2 = state.draft).selectedTalents || (_c2.selectedTalents = []);
  state.draft.selectedTalents.push(talent);
  state.perm.unlockedTalents[talent.id] = true;
  if (talent.rarity === "mythic" || talent.rarity === "hidden") state.perm.pityCounter = 0;
  else state.perm.pityCounter += 1;
  if (talent.passive === "reincarnation_admin") state.draft.maxPicks = 4;
  state.draft.pickIndex += 1;
  if (state.draft.pickIndex >= state.draft.maxPicks) {
    state.screen = "setup";
    saveGame();
    render();
    return;
  }
  state.draft.candidates = rollTalentCandidates(state.draft.pickIndex + 1, state.draft.selectedTalents);
  saveGame();
  render();
}
function beginDraft() {
  var _a, _b, _c2, _d2;
  if (!((_b = (_a = state.draft) == null ? void 0 : _a.selectedTalents) == null ? void 0 : _b.length)) {
    startSetup(((_c2 = state.setup) == null ? void 0 : _c2.mode) || state.activeMode || "normal");
    return;
  }
  if (((_d2 = state.setup) == null ? void 0 : _d2.mode) === "dual") ensureSetupClassPair();
  state.activeMode = normalizeRunSaveMode(state.setup.mode);
  state.run = createRunSkeleton();
  state.run.talents = [...state.draft.selectedTalents];
  for (const talent of state.run.talents) {
    state.perm.unlockedTalents[talent.id] = true;
    if (talent.rarity === "mythic" || talent.rarity === "hidden") state.perm.pityCounter = 0;
    else state.perm.pityCounter += 1;
    applyTalentOnPick(talent);
  }
  finishDraft();
}
function renderDraft() {
  var _a;
  const draft = state.draft || { pickIndex: 0, maxPicks: 3, selectedTalents: [], candidates: [] };
  if ((((_a = draft.selectedTalents) == null ? void 0 : _a.length) || 0) >= (draft.maxPicks || 3)) return renderDraftReview();
  const pickIndex = (draft.pickIndex || 0) + 1;
  return '\n    <section class="draft-screen draft-pick-screen">\n      <div class="draft-caption">天赋觉醒 ('.concat(pickIndex, "/").concat(draft.maxPicks, ')</div>\n      <div class="talent-list">').concat((draft.candidates || []).map((t) => talentCard(t, "selectDraftTalent('".concat(t.id, "')"))).join(""), "</div>\n    </section>\n  ");
}
function renderDraftReview() {
  var _a, _b;
  const talents = ((_a = state.draft) == null ? void 0 : _a.selectedTalents) || [];
  return '\n    <section class="draft-screen draft-review-screen">\n      <div class="draft-review">\n        <p class="draft-done">天赋选择完毕！</p>\n        <h2>已选择 '.concat(talents.length, ' 个天赋</h2>\n        <div class="draft-selected-list">\n          ').concat(talents.map((t) => '<div class="draft-selected-item rarity-'.concat(t.rarity, '">').concat(talentTitleHtml(t), "</div>")).join(""), "\n        </div>\n        ").concat(((_b = state.draft) == null ? void 0 : _b.extraPickUsed) || !privacyAllowsNetworkServices() ? "" : '<button class="wide" onclick="addDraftTalentPick()">📺 看广告额外+1次天赋选择</button>', '\n        <button class="wide" onclick="restartTalentDraft()">🔄 重新选择天赋</button>\n        <button class="wide" onclick="confirmDraftTalents()">跳过，继续职业选择</button>\n      </div>\n    </section>\n  ');
}
function selectDraftTalent(talentId) {
  var _a, _b, _c2;
  const talent = (_b = (_a = state.draft) == null ? void 0 : _a.candidates) == null ? void 0 : _b.find((t) => t.id === talentId);
  if (!talent) return;
  (_c2 = state.draft).selectedTalents || (_c2.selectedTalents = []);
  state.draft.selectedTalents.push(talent);
  if (talent.passive === "reincarnation_admin") state.draft.maxPicks = Math.max(state.draft.maxPicks || 3, 4);
  state.draft.pickIndex = state.draft.selectedTalents.length;
  if (state.draft.pickIndex >= state.draft.maxPicks) {
    state.draft.candidates = [];
    render();
    return;
  }
  state.draft.candidates = rollTalentCandidates(state.draft.pickIndex + 1, state.draft.selectedTalents);
  render();
}
function restartTalentDraft() {
  var _a;
  const mode = ((_a = state.setup) == null ? void 0 : _a.mode) || state.activeMode || "normal";
  state.draft = { pickIndex: 0, maxPicks: 3, selectedTalents: [], candidates: rollTalentCandidates(1, []), extraPickUsed: false };
  state.screen = "draft";
  state.activeMode = normalizeRunSaveMode(mode);
  render();
}
function addDraftTalentPick() {
  showRewardedAd("opening_extra_talent", grantDraftTalentPick);
}
function grantDraftTalentPick() {
  var _a;
  if (!state.draft || state.draft.extraPickUsed) return;
  state.draft.extraPickUsed = true;
  state.draft.maxPicks = (state.draft.maxPicks || 3) + 1;
  state.draft.pickIndex = ((_a = state.draft.selectedTalents) == null ? void 0 : _a.length) || 0;
  state.draft.candidates = rollTalentCandidates(state.draft.pickIndex + 1, state.draft.selectedTalents || []);
  state.screen = "draft";
  render();
}
function confirmDraftTalents() {
  var _a, _b;
  if (!((_b = (_a = state.draft) == null ? void 0 : _a.selectedTalents) == null ? void 0 : _b.length)) return restartTalentDraft();
  state.screen = "setup";
  render();
}
window.state = state;
window.startSetup = startSetup;
window.continueRun = continueRun;
window.returnToStartMenu = returnToStartMenu;
window.openCity = openCity;
window.beginDraft = beginDraft;
window.selectDraftTalent = selectDraftTalent;
window.restartTalentDraft = restartTalentDraft;
window.addDraftTalentPick = addDraftTalentPick;
window.confirmDraftTalents = confirmDraftTalents;
window.startPresetMode = startPresetMode;
window.setCityMode = setCityMode;
window.switchCityMode = switchCityMode;
window.openClimbModeModal = openClimbModeModal;
window.selectClimbLevel = selectClimbLevel;
window.startClimbLevel = startClimbLevel;
window.chooseSetupClass = chooseSetupClass;
window.showPatchNotes = showPatchNotes;
window.openMobilePanel = openMobilePanel;
window.openMercManagement = openMercManagement;
window.closeMercManagement = closeMercManagement;
window.openSkillTree = openSkillTree;
window.closeSkillTree = closeSkillTree;
window.setSkillTab = setSkillTab;
window.setSkillHeroTab = setSkillHeroTab;
window.openAbilityScreen = openAbilityScreen;
window.closeAbilityScreen = closeAbilityScreen;
window.openEquipmentScreen = openEquipmentScreen;
window.closeEquipmentScreen = closeEquipmentScreen;
window.toggleEquipLock = toggleEquipLock;
window.toggleAutoDiscardLowQualityEquip = toggleAutoDiscardLowQualityEquip;
window.allocAbilityPoint = allocAbilityPoint;
window.resetAbilityPoint = resetAbilityPoint;
window.resetAllAbilityPoints = resetAllAbilityPoints;
window.learnSkill = learnSkill;
window.upgradeSkill = upgradeSkill;
window.equipSkill = equipSkill;
window.unequipSkill = unequipSkill;
window.unlockSkillPassive = unlockSkillPassive;
window.moveMerc = moveMerc;
window.dismissMerc = dismissMerc;
window.synthesizeMercenary = synthesizeMercenary;
window.openMercSynthesisModal = openMercSynthesisModal;
window.selectMercSynthesisMaterial = selectMercSynthesisMaterial;
window.closeMercSynthesisModal = closeMercSynthesisModal;
window.openSettingsModal = openSettingsModal;
window.openQuickSelectSettings = openQuickSelectSettings;
window.setQuickSelectSetting = setQuickSelectSetting;
window.setQuickEventChoice = setQuickEventChoice;
window.setMusicVolume = setMusicVolume;
window.toggleAutoSelectTarget = toggleAutoSelectTarget;
window.toggleAutoSelectMercEquipment = toggleAutoSelectMercEquipment;
window.saveProgressFromSettings = saveProgressFromSettings;
window.closeSettingsModal = closeSettingsModal;
window.directChallengeBoss = directChallengeBoss;
window.quickSelectCurrent = quickSelectCurrent;
window.resolveEventChoice = resolveEventChoice;
window.continueEventResult = continueEventResult;
window.resolvePendingEquip = resolvePendingEquip;
window.openMercEquipmentAssignModal = openMercEquipmentAssignModal;
window.assignPendingEquipmentToMerc = assignPendingEquipmentToMerc;
window.clickSkill = clickSkill;
window.clickTarget = clickTarget;
window.useCombatItem = useCombatItem;
window.quickBattle = quickBattle;
window.afterBattleContinue = afterBattleContinue;
window.closeTavernRecruitModal = closeTavernRecruitModal;
window.recruitMercCandidate = recruitMercCandidate;
window.openMercSkillModal = openMercSkillModal;
window.closeMercSkillModal = closeMercSkillModal;
window.setMercBattleStrategy = setMercBattleStrategy;
window.trainMercTrait = trainMercTrait;
window.reincarnate = reincarnate;
window.claimReincarnationDouble = claimReincarnationDouble;
window.reviveFromAd = reviveFromAd;
window.buyShopItem = buyShopItem;
window.leaveItemShop = leaveItemShop;
window.choosePromotion = choosePromotion;
window.chooseTier2Promotion = chooseTier2Promotion;
window.chooseSingleTalent = chooseSingleTalent;
window.upgradeGrowth = upgradeGrowth;
window.resetGrowth = resetGrowth;
window.upgradeTalentEnhance = upgradeTalentEnhance;
window.resetTalentEnhance = resetTalentEnhance;
window.openAttributeGuideModal = openAttributeGuideModal;
window.openEventBattleIntel = openEventBattleIntel;
window.closeEventBattleIntel = closeEventBattleIntel;
window.modalAction = modalAction;
window.toggleAudio = toggleAudio;
window.toast = toast;
window.acceptTapTapPrivacy = acceptTapTapPrivacy;
window.declineTapTapPrivacy = declineTapTapPrivacy;
window.startTapTapLogin = startTapTapLogin;
window.logoutTapTapAccount = logoutTapTapAccount;
window.openPrivacyPolicy = openPrivacyPolicy;
window.acceptPrivacyConsent = acceptPrivacyConsent;
window.declinePrivacyConsentAndExit = declinePrivacyConsentAndExit;
window.requestPrivacyWithdrawal = requestPrivacyWithdrawal;
window.confirmPrivacyWithdrawal = confirmPrivacyWithdrawal;
if (privacyAllowsNetworkServices()) initializeApprovedNativeServices();
render();
if (typeof window.markDivineTalentReady === "function") window.markDivineTalentReady();
