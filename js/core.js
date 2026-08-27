'use strict';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attrBonus(c, attrId) {
  return c.attributes[attrId] || 0;
}

function getSkill(skillId) {
  return SKILLS.find(function (s) { return s.id === skillId; });
}

function getOrigin(originId) {
  return ORIGINS.find(function (o) { return o.id === originId; });
}

function getClass(classId) {
  return CLASSES[classId];
}

function getWeapon(weaponId) {
  return WEAPONS.find(function (w) { return w.id === weaponId; });
}

function getArmor(armorId) {
  return ARMORS.find(function (a) { return a.id === armorId; });
}

function nexOf(level) {
  return Math.min(99, level * 5);
}

function derive(c) {
  var cls = getClass(c.classId);
  var nex = nexOf(c.level);
  var pvMax = cls.pvBase + c.attributes.vig * 10 + nex * 5;
  var sanMax = cls.sanBase + c.attributes.von * 5 + nex * 5;
  var peMax = cls.peBase + Math.floor(nex / 10);
  var defesa = 10 + c.attributes.agi;
  var armadura = c.equipment && c.equipment.armor ? getArmor(c.equipment.armor) : getArmor('nenhuma');
  return {
    nex: nex,
    pvMax: pvMax,
    sanMax: sanMax,
    peMax: peMax,
    defesa: defesa,
    prevencao: armadura ? armadura.prev : 0,
    iniciativa: c.attributes.agi
  };
}

function skillBonus(c, skillId) {
  var skill = getSkill(skillId);
  var level = (c.skills && c.skills[skillId]) || 0;
  return attrBonus(c, skill.attr) + level;
}

function parseDice(expression) {
  var re = /(\d+)d(\d+)/gi;
  var parts = [];
  var m;
  var rest = expression;
  while ((m = re.exec(expression)) !== null) {
    parts.push({ n: parseInt(m[1], 10), s: parseInt(m[2], 10) });
    rest = rest.replace(m[0], '');
  }
  var flat = 0;
  var flatMatch = rest.match(/[+-]\d+|\d+/g);
  if (flatMatch) {
    flat = flatMatch.reduce(function (a, b) { return a + parseInt(b, 10); }, 0);
  }
  return { dice: parts, flat: flat };
}

function rollDiceExpression(expression) {
  var parsed = parseDice(expression);
  var rolls = [];
  var total = 0;
  parsed.dice.forEach(function (d) {
    var r = 0;
    var drs = [];
    for (var i = 0; i < d.n; i++) {
      var v = 1 + Math.floor(Math.random() * d.s);
      r += v;
      drs.push(v);
    }
    rolls.push({ n: d.n, s: d.s, values: drs, total: r });
    total += r;
  });
  total += parsed.flat;
  return { expression: expression, dice: rolls, flat: parsed.flat, total: total };
}

function rollD20() {
  return 1 + Math.floor(Math.random() * 20);
}

function weaponCrit(weapon) {
  if (!weapon) return 20;
  if (Array.isArray(weapon.crit)) return Math.min.apply(null, weapon.crit);
  return weapon.crit;
}

function weaponAttr(weapon) {
  return weapon ? (weapon.attr || 'for') : 'for';
}

function equippedWeapon(c) {
  if (c.equipment && c.equipment.weaponMain) return getWeapon(c.equipment.weaponMain);
  return getWeapon('desarmado');
}

function attackMod(c, weapon) {
  var w = weapon || equippedWeapon(c);
  var attr = weaponAttr(w);
  var mod = attrBonus(c, attr);
  var skillId = attr === 'agi' ? 'pontaria' : 'luta';
  var level = (c.skills && c.skills[skillId]) || 0;
  mod += level;
  return { mod: mod, attr: attr, skillId: skillId, trained: level > 0, base: level };
}

function rollAttack(c, weapon) {
  var w = weapon || equippedWeapon(c);
  var info = attackMod(c, w);
  var d20 = rollD20();
  var total = d20 + info.mod;
  var critNeeded = weaponCrit(w);
  var crit = d20 >= critNeeded;
  return { d20: d20, mod: info.mod, total: total, crit: crit, weapon: w, info: info };
}

function rollDamage(c, weapon, critBonus) {
  var w = weapon || equippedWeapon(c);
  var attr = weaponAttr(w);
  var mod = attrBonus(c, attr);
  var res = rollDiceExpression(w.dice);
  var dieTotal = res.total;
  if (critBonus) dieTotal = dieTotal * 2;
  return { dieTotal: dieTotal, mod: mod, total: dieTotal + mod, critBonus: !!critBonus, weapon: w };
}

function grantXp(c, xp) {
  var before = c.level;
  c.xp += xp;
  var after = levelForXp(c.xp);
  c.level = after;
  return after - before;
}

function createEmptyCharacter() {
  var def = {
    id: uid(),
    name: '',
    classId: 'combatente',
    originId: 'militar',
    level: 1,
    xp: 0,
    attributes: { for: 0, agi: 0, int: 0, pre: 0, vig: 0, von: 0 },
    skills: {},
    pv: 0,
    san: 0,
    pe: 0,
    equipment: { weaponMain: 'desarmado', weaponOff: null, armor: 'nenhuma', accessory: null },
    items: [],
    abilities: [],
    notes: '',
    log: [],
    trilha: null,
    elemento: null,
    rituais: [],
    municao: {},
    diaCriacao: new Date().toLocaleDateString('pt-BR'),
    photo: '',
    appearance: '',
    owner: (state && state.user) ? { id: state.user.id, name: state.user.name } : { id: 'local', name: 'Local' }
  };
  var a = derive(def);
  def.pv = a.pvMax;
  def.san = a.sanMax;
  def.pe = a.peMax;
  return def;
}

function fmtMod(v) {
  return v >= 0 ? '+' + v : String(v);
}

function fmtDateNow() {
  return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function addLog(c, text, chan) {
  c.log.push({ t: fmtDateNow(), text: text, chan: chan || 'geral', id: uid() });
  if (c.log.length > 200) c.log = c.log.slice(-200);
}

function findEnemy(id) {
  return state.enemies.find(function (e) { return e.id === id; });
}

function ammoFor(c, weaponId) {
  if (!c.municao) c.municao = {};
  var w = getWeapon(weaponId);
  if (!w || !w.mun) return null;
  if (c.municao[weaponId] == null) c.municao[weaponId] = w.mun;
  return c.municao[weaponId];
}

function setAmmo(c, weaponId, value) {
  if (!c.municao) c.municao = {};
  c.municao[weaponId] = Math.max(0, Math.min(getWeapon(weaponId) ? getWeapon(weaponId).mun : 999, value));
}

function equippedAmmo(c) {
  var w = equippedWeapon(c);
  return w && w.mun ? ammoFor(c, w.id) : null;
}