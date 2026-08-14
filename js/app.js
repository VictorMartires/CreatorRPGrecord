'use strict';

var state = {
  screen: 'home',
  characters: [],
  enemies: [],
  active: null,
  user: null,
  ui: { tab: 'atributos', filter: 'all' },
  draft: null,
  combat: { target: null, lastAttack: null, lastDamage: null, enemyEditId: null }
};

function boot() {
  state.user = loadUser();
  state.characters = loadCharacters();
  state.enemies = loadEnemies();
  state.screen = state.user ? 'home' : 'login';
  var actId = loadActiveId();
  if (state.user && actId) {
    var found = state.characters.find(function (c) { return c.id === actId; });
    if (found) {
      state.active = found;
      state.screen = 'sheet';
    }
  }
  render();
}

function login(name) {
  name = String(name || '').trim();
  if (!name) { toast('Digite seu nome.'); return; }
  state.user = { id: uid(), name: name };
  state.screen = 'home';
  state.active = null;
  state.combat.target = null;
  saveState();
  toast('Bem-vindo, ' + name + '!');
  render();
}

function doLogin() {
  var el = document.getElementById('login-name');
  login(el ? el.value : '');
}

function logout() {
  if (!confirm('Sair e trocar de jogador?')) return;
  state.user = null;
  state.active = null;
  state.combat.target = null;
  state.screen = 'login';
  saveState();
  render();
}

function readPhoto(input, target) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast('Envie um arquivo de imagem (JPG/PNG).'); return; }
  if (file.size > 8 * 1024 * 1024) { toast('Imagem muito grande (máx 8MB).'); return; }
  var url = URL.createObjectURL(file);
  var img = new Image();
  img.onload = function () {
    try {
      var MAX = 360;
      var scale = Math.min(1, MAX / Math.max(img.width, img.height));
      var w = Math.round(img.width * scale);
      var h = Math.round(img.height * scale);
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      var data = canvas.toDataURL('image/jpeg', 0.82);
      if (target === 'draft' && state.draft) {
        var nameInput = document.getElementById('draft-name');
        if (nameInput && nameInput.value) state.draft.name = nameInput.value;
        state.draft.photo = data;
        renderCreate();
      } else if (target === 'active' && state.active) {
        state.active.photo = data;
        saveState();
        renderSheet();
        toast('Foto atualizada!');
      }
    } catch (e) {
      console.error(e);
      toast('Erro ao processar a imagem.');
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  img.onerror = function () { toast('Não foi possível ler a imagem.'); URL.revokeObjectURL(url); };
  img.src = url;
  input.value = '';
}

function clearDraftPhoto() {
  if (state.draft) { state.draft.photo = ''; renderCreate(); }
}

function clearActivePhoto() {
  if (state.active) {
    state.active.photo = '';
    saveState();
    renderSheet();
  }
}

function ownerLabel(c) {
  return c.owner && c.owner.name ? c.owner.name : 'Não definido';
}

function ownerList() {
  var seen = {};
  var list = [];
  state.characters.forEach(function (c) {
    var n = ownerLabel(c);
    if (!seen[n]) { seen[n] = true; list.push(n); }
  });
  return list.sort(function (a, b) { return a.localeCompare(b); });
}

function setFilter(value) {
  state.ui.filter = value || 'all';
  saveState();
  render();
}

window.addEventListener('error', function (e) {
  console.error('Erro não tratado:', e.message, e.error);
  try { toast('Erro capturado. O sistema continua funcionando.'); } catch (_) { }
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('Promessa rejeitada:', e.reason);
  try { toast('Operação interrompida, mas o sistema segue ativo.'); } catch (_) { }
});

setInterval(function () {
  try { saveState(); } catch (e) { console.error(e); }
}, 15000);

window.addEventListener('beforeunload', function () {
  try { saveState(); } catch (e) { }
});

window.addEventListener('visibilitychange', function () {
  if (document.hidden) { try { saveState(); } catch (e) { } }
});

setInterval(function () {
  try {
    var s = state.screen;
    if (s === 'home' || s === 'sheet' || s === 'create' || s === 'biblioteca') {
      var el = document.getElementById('screen-' + s);
      if (el && el.childNodes.length === 0) render();
    }
  } catch (e) { }
}, 15000);

function recoverApp() {
  try {
    state.characters = loadCharacters();
    state.enemies = loadEnemies();
    state.active = null;
    state.screen = 'home';
    state.combat.target = null;
    saveState();
    render();
    toast('Sistema recuperado.');
  } catch (e) {
    console.error('Falha na recuperação:', e);
  }
}

/* ------------------------- Navegação ------------------------- */

function goHome() {
  state.active = null;
  state.screen = 'home';
  state.ui.tab = 'atributos';
  saveState();
  render();
}

function openBiblioteca() {
  state.active = null;
  state.screen = 'biblioteca';
  state.ui.tab = 'atributos';
  state.combat.target = null;
  saveState();
  render();
}

function newCharacter() {
  state.draft = {
    step: 1,
    name: '',
    originId: ORIGINS[0].id,
    classId: 'combatente',
    trilha: null,
    rituaisInit: [],
    elemento: null,
    attributes: { for: 1, agi: 1, int: 1, pre: 1, vig: 1, von: 1 },
    pool: 12,
    trained: [],
    weapon: 'pistola',
    armor: 'nenhuma'
  };
  renderCreate();
}

function cancelCreate() {
  state.draft = null;
  state.active = null;
  state.screen = 'home';
  saveState();
  render();
}

function openCharacter(id) {
  var c = state.characters.find(function (x) { return x.id === id; });
  if (!c) return;
  state.active = c;
  state.ui.tab = 'atributos';
  state.combat.target = null;
  saveState();
  renderSheet();
}

function deleteCharacter(id) {
  var c = state.characters.find(function (x) { return x.id === id; });
  if (!confirm('Excluir a ficha "' + (c ? c.name : '') + '"?')) return;
  state.characters = state.characters.filter(function (x) { return x.id !== id; });
  if (state.active && state.active.id === id) { state.active = null; state.screen = 'home'; }
  saveState();
  render();
}

function exportCharacterById(id) {
  var c = state.characters.find(function (x) { return x.id === id; });
  if (c) exportCharacter(c);
}

function exportActive() {
  if (!state.active) { toast('Abra uma ficha primeiro.'); return; }
  exportCharacter(state.active);
  toast('Ficha exportada em JSON!');
}

/* ------------------------- Criação ------------------------- */

function nextStep() {
  var d = state.draft;
  if (d.step === 1) {
    var el = document.getElementById('draft-name');
    var name = el ? el.value.trim() : d.name;
    if (!name) { toast('Dê um nome ao personagem!'); return; }
    d.name = name;
  }
  if (d.step === 3) {
    if (!d.trilha) { toast('Escolha uma trilha para a classe.'); return; }
    if (d.classId === 'ocultista' && d.rituaisInit.length !== 2) { toast('Escolha exatamente 2 rituais iniciais.'); return; }
  }
  d.step++;
  renderCreate();
}

function prevStep() {
  state.draft.step--;
  renderCreate();
}

function pickOrigin(id) {
  state.draft.originId = id;
  renderCreate();
}

function pickElemento(id) {
  state.draft.elemento = id || null;
  renderCreate();
}

function pickClass(id) {
  state.draft.classId = id;
  state.draft.trilha = null;
  state.draft.rituaisInit = [];
  state.draft.trained = [];
  renderCreate();
}

function pickTrilha(id) {
  state.draft.trilha = id;
  renderCreate();
}

function toggleInitRitual(id) {
  var d = state.draft;
  var i = d.rituaisInit.indexOf(id);
  if (i >= 0) d.rituaisInit.splice(i, 1);
  else {
    if (d.rituaisInit.length >= 2) { toast('Só 2 rituais iniciais.'); return; }
    d.rituaisInit.push(id);
  }
  renderCreate();
}

function adjustAttr(attrId, delta) {
  var d = state.draft;
  var v = d.attributes[attrId];
  var nv = v + delta;
  if (nv < 1 || nv > 5) return;
  if (delta > 0 && d.pool <= 0) { toast('Sem pontos restantes!'); return; }
  d.attributes[attrId] = nv;
  d.pool -= delta;
  renderCreate();
}

function toggleTrain(skillId) {
  var d = state.draft;
  var cls = getClass(d.classId);
  if (d.trained.indexOf(skillId) >= 0) {
    d.trained = d.trained.filter(function (s) { return s !== skillId; });
  } else {
    if (d.trained.length >= cls.trainings) { toast('Limite de treinos da classe atingido (' + cls.trainings + ').'); return; }
    d.trained.push(skillId);
  }
  renderCreate();
}

function finalizeCharacter() {
  var d = state.draft;
  var weaponSel = document.getElementById('draft-weapon');
  var armorSel = document.getElementById('draft-armor');
  var c = createEmptyCharacter();
  c.name = d.name;
  c.originId = d.originId;
  c.classId = d.classId;
  c.photo = d.photo || '';
  c.equipment.weaponMain = weaponSel ? weaponSel.value : d.weapon;
  c.equipment.armor = armorSel ? armorSel.value : d.armor;

  var origin = getOrigin(c.originId);
  var cls = getClass(c.classId);
  c.attributes = Object.assign({}, c.attributes, d.attributes);
  c.attributes[origin.attr] = Math.min(5, c.attributes[origin.attr] + 1);

  c.trainedSkills = [origin.skill, cls.freeSkill].concat(d.trained);
  c.trainedSkills = c.trainedSkills.filter(function (v, i, a) { return a.indexOf(v) === i; });
  c.abilities = cls.abilities.map(function (a) { return Object.assign({}, a, { custom: false }); });
  var trilha = getTrilha(c.classId, d.trilha);
  if (trilha) {
    c.trilha = trilha.id;
    c.abilities.push(Object.assign({}, trilha.ability, { custom: false }));
  }
  c.rituais = d.rituaisInit.map(function (id) {
    return Object.assign({}, getRitual(id));
  });
  c.elemento = d.elemento;
  var init = derive(c);
  c.pv = init.pvMax;
  c.san = init.sanMax;
  c.pe = init.peMax;
  var elInfo = c.elemento ? ' — Elemento ' + getElemento(c.elemento).name : '';
  addLog(c, 'Ficha criada como ' + cls.name + ' (' + origin.name + ')' + (trilha ? ' — Trilha ' + trilha.name : '') + elInfo + '.');
  state.characters.push(c);
  state.draft = null;
  state.active = c;
  saveState();
  renderSheet();
  toast('Ficha "' + c.name + '" criada!');
}

/* ------------------------- Ficha ------------------------- */

function setTab(name) {
  state.ui.tab = name;
  saveState();
  renderSheet();
}

function setElemento(id) {
  state.active.elemento = id || null;
  saveState();
  renderSheet();
}

function renameChar(name) {
  state.active.name = name || 'Sem nome';
  saveState();
}

function clamp(val, lo, hi) {
  return Math.max(lo, Math.min(hi, val));
}

function editResource(lbl) {
  var c = state.active;
  var d = derive(c);
  var key = lbl === 'PV' ? 'pv' : lbl === 'SAN' ? 'san' : 'pe';
  var max = lbl === 'PV' ? d.pvMax : lbl === 'SAN' ? d.sanMax : d.peMax;
  var val = prompt(lbl + ' atual? (máx ' + max + ')', String(c[key]));
  if (val === null) return;
  var n = Math.round(+val);
  if (isNaN(n)) return;
  c[key] = clamp(n, 0, max);
  saveState();
  renderSheet();
}

function shiftResource(lbl, delta) {
  var c = state.active;
  var d = derive(c);
  if (lbl === 'PV') c.pv = clamp(c.pv + delta, 0, d.pvMax);
  else if (lbl === 'SAN') c.san = clamp(c.san + delta, 0, d.sanMax);
  else c.pe = clamp(c.pe + delta, 0, d.peMax);
  saveState();
  renderSheet();
}

function changeAttr(attrId, delta) {
  var c = state.active;
  var nv = clamp(c.attributes[attrId] + delta, 1, 5);
  c.attributes[attrId] = nv;
  var d = derive(c);
  if (delta > 0) c.pv = Math.min(d.pvMax, c.pv + 10);
  saveState();
  renderSheet();
}

function toggleSkill(skillId) {
  var c = state.active;
  var i = c.trainedSkills.indexOf(skillId);
  if (i >= 0) c.trainedSkills.splice(i, 1);
  else c.trainedSkills.push(skillId);
  saveState();
  renderSheet();
}

function rollSkill(skillId) {
  var c = state.active;
  var skill = getSkill(skillId);
  var bonus = skillBonus(c, skillId);
  var d20 = rollD20();
  var total = d20 + bonus;
  var trained = c.trainedSkills.indexOf(skillId) >= 0;
  toast('Perícia ' + skill.name + ' — d20 [' + d20 + '] ' + fmtMod(bonus) + ' = ' + total +
    (trained ? ' (treinada)' : ''));
  addLog(c, 'Teste de ' + skill.name + ': d20 [' + d20 + '] ' + fmtMod(bonus) + ' = ' + total + (trained ? ' (treinada)' : ''));
  saveState();
}

function saveNotes(val) {
  state.active.notes = val;
  saveState();
}

/* ------------------------- Inventário ------------------------- */

function setWeapon(id) {
  state.active.equipment.weaponMain = id;
  saveState();
  renderSheet();
}

function setArmor(id) {
  state.active.equipment.armor = id;
  saveState();
  renderSheet();
}

function setAccessory(val) {
  state.active.equipment.accessory = val;
  saveState();
}

function addItem() {
  var c = state.active;
  var name = document.getElementById('item-name').value.trim();
  if (!name) { toast('Digite o nome do item.'); return; }
  c.items.push({
    id: uid(),
    name: name,
    category: document.getElementById('item-cat').value,
    qty: parseInt(document.getElementById('item-qty').value, 10) || 1,
    weight: parseFloat(document.getElementById('item-weight').value) || 0,
    notes: ''
  });
  saveState();
  renderSheet();
}

function item(id, delta) {
  var it = state.active.items.find(function (x) { return x.id === id; });
  if (!it) return;
  it.qty = Math.max(1, it.qty + delta);
  if (it.qty <= 0) state.active.items = state.active.items.filter(function (x) { return x.id !== id; });
  saveState();
  renderSheet();
}

function dropItem(id) {
  state.active.items = state.active.items.filter(function (x) { return x.id !== id; });
  saveState();
  renderSheet();
}

// Editar item (nome/anotação) via prompt simples
function editItem(id) {
  var it = state.active.items.find(function (x) { return x.id === id; });
  if (!it) return;
  var notes = prompt('Anotação do item "' + it.name + '":', it.notes || '');
  if (notes === null) return;
  it.notes = notes;
  saveState();
  renderSheet();
}

/* ------------------------- Habilidades ------------------------- */

function addAbility() {
  var c = state.active;
  var name = document.getElementById('abil-name').value.trim();
  if (!name) { toast('Dê um nome à habilidade.'); return; }
  c.abilities.push({
    id: uid(),
    name: name,
    peCost: parseInt(document.getElementById('abil-pe').value, 10) || 0,
    desc: document.getElementById('abil-desc').value.trim(),
    custom: true
  });
  saveState();
  renderSheet();
}

function removeAbility(id) {
  state.active.abilities = state.active.abilities.filter(function (a) { return a.id !== id; });
  saveState();
  renderSheet();
}

function useAbility(id) {
  var c = state.active;
  var a = c.abilities.find(function (x) { return x.id === id; });
  if (!a) return;
  if (a.peCost > 0 && c.pe < a.peCost) { toast('PE insuficiente! (' + c.pe + '/' + a.peCost + ')'); return; }
  c.pe -= a.peCost;
  addLog(c, 'Usou a habilidade "' + a.name + '" (custo ' + a.peCost + ' PE).');
  toast('Habilidade "' + a.name + '" usada (-' + a.peCost + ' PE).');
  saveState();
  renderSheet();
}

/* ------------------------- Combate ------------------------- */

function currentTarget() {
  return state.combat.target;
}

function restoreResources() {
  var c = state.active;
  var d = derive(c);
  c.pv = d.pvMax;
  c.san = d.sanMax;
  c.pe = d.peMax;
  addLog(c, 'Descanso: recursos totalmente restaurados.');
  saveState();
  renderSheet();
  toast('Recursos restaurados!');
}

function rollInitiative() {
  var c = state.active;
  var d20 = rollD20();
  var total = d20 + c.attributes.agi;
  addLog(c, 'Iniciativa: d20 [' + d20 + '] + ' + c.attributes.agi + ' = ' + total + '.');
  toast('Iniciativa: d20 [' + d20 + '] = ' + total);
  saveState();
  renderSheet();
}

function chosenWeapon() {
  var sel = document.getElementById('atk-weapon');
  if (sel && sel.value) return getWeapon(sel.value);
  return equippedWeapon(state.active);
}

function attackAction() {
  var c = state.active;
  var w = chosenWeapon();
  var res = rollAttack(c, w);
  state.combat.lastAttack = res;
  var info = res.info;
  var target = currentTarget();

  var html = '<span>⚔ Teste de ataque — ' + esc(w.name) + ':</span><br>' +
    'd20 [' + res.d20 + '] ' + fmtMod(res.mod) + ' → <strong>' + res.total + '</strong>' +
    (info.trained ? ' <span style="color:var(--blue)">(treino)</span>' : '');

  if (res.crit) html += ' <span class="crit">CRÍTICO!</span><br><span style="color:var(--green)">O dano em dados será dobrado.</span>';
  if (target) {
    html += '<br><span>Defesa do alvo: ' + target.defesa + ' → ' +
      (res.total >= target.defesa ? '<span class="crit">ACERTOU</span>' : '<span style="color:var(--red2)">ERROU</span>') + '</span>';
  }
  html += '<br><button class="btn small" onclick="damageAction()">Rolar dano agora</button>';
  addLog(c, 'Ataque com ' + w.name + ': d20 [' + res.d20 + '] ' + fmtMod(res.mod) + ' = ' + res.total + (res.crit ? ' (CRÍTICO!)' : ''));
  saveState();
  renderSheet();
  setBox('attack-result', html);
}

function damageAction() {
  var c = state.active;
  var w = chosenWeapon();
  var crit = state.combat.lastAttack && state.combat.lastAttack.crit;
  var res = rollDamage(c, w, crit);
  state.combat.lastDamage = res;
  var html = '<span>⚔ Dano — ' + esc(w.name) + ':</span><br>' +
    (crit ? '<span class="crit">Crítico! Dados dobrados!</span><br>' : '') +
    'dados ' + esc(res.weapon.dice) + ' + ' + fmtMod(res.mod) + ' = <strong>' + res.total + '</strong> de dano';
  if (currentTarget()) {
    html += '<br><button class="btn small" onclick="applyLastDamage()">Aplicar no alvo</button>';
  }
  saveState();
  renderSheet();
  setBox('attack-result', html);
}

function setBox(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function addTarget() {
  var sel = document.getElementById('enemy-select');
  var e = state.enemies.find(function (x) { return x.id === sel.value; });
  if (!e) return;
  state.combat.target = Object.assign({}, e, { hp: e.pv, instanceId: uid() });
  state.combat.lastAttack = null;
  state.combat.lastDamage = null;
  saveState();
  renderSheet();
}

function removeTarget() {
  state.combat.target = null;
  state.combat.lastAttack = null;
  state.combat.lastDamage = null;
  saveState();
  renderSheet();
}

function applyLastDamage() {
  var c = state.active;
  var t = currentTarget();
  if (!t || !state.combat.lastDamage) { toast('Role um dano primeiro.'); return; }
  var raw = state.combat.lastDamage.total;
  var after = Math.max(0, raw - t.prevencao);
  t.hp = Math.max(0, t.hp - after);
  addLog(c, 'Você causou ' + after + ' de dano (' + raw + ' - ' + t.prevencao + ' Prevenção) em "' + t.name + '". PV: ' + t.hp + '/' + t.pv + '.');
  if (t.hp <= 0) {
    toast('"' + t.name + '" entrou em 0 PV!');
  }
  saveState();
  renderSheet();
}

function enemyAttacks() {
  var c = state.active;
  var t = currentTarget();
  if (!t) return;
  var res = rollDiceExpression(t.damage);
  var d20 = rollD20();
  var hit = d20 + (t.atk || 0) >= derive(c).defesa;
  var html = '<span>⚔ ' + esc(t.name) + ' ataca:</span><br>' +
    'd20 [' + d20 + '] + ' + (t.atk || 0) + ' vs Defesa ' + derive(c).defesa + ' → ' +
    (hit ? '<span class="crit">ACERTOU</span>' : '<span style="color:var(--red2)">ERROU</span>');
  if (hit) {
    c.pv = Math.max(0, c.pv - res.total);
    html += '<br>Dano <strong>' + esc(t.damage) + '</strong> = ' + res.total + ' → PV ' + c.pv + '/' + derive(c).pvMax;
    addLog(c, '"' + t.name + '" causou ' + res.total + ' de dano em você. PV: ' + c.pv + '/' + derive(c).pvMax + '.');
    if (c.pv <= 0) { html += '<br><span class="crit">VOCÊ CAIU!</span>'; addLog(c, 'Você atingiu 0 PV!'); }
  } else {
    addLog(c, 'Ataque de "' + t.name + '" errou (d20 [' + d20 + ']).');
  }
  saveState();
  renderSheet();
  setBox('enemy-result', html);
}

function dealDamage(x) {
  var t = currentTarget();
  if (!t) return;
  t.hp = Math.max(0, t.hp + x);
  if (Math.abs(x) > 0) addLog(state.active, 'Ajuste manual de PV no alvo: ' + x + '. PV: ' + t.hp + '/' + t.pv + '.');
  saveState();
  renderSheet();
}

function defeatTarget() {
  var c = state.active;
  var t = currentTarget();
  if (!t) return;
  var before = c.level;
  var gained = grantXp(c, t.xp);
  var levels = c.level - before;
  addLog(c, 'Derrotou "' + t.name + '" (+' + t.xp + ' XP)' + (levels > 0 ? ' — SUBIU ' + levels + ' NÍVEL!' : '') + '.');
  if (levels > 0) {
    toast('Nível subiu! Agora é nível ' + c.level + ' (NEX ' + derive(c).nex + '%).');
  } else {
    toast('+' + t.xp + ' XP por "' + t.name + '".');
  }
  state.combat.target = null;
  state.combat.lastAttack = null;
  state.combat.lastDamage = null;
  saveState();
  renderSheet();
}

function awardXp() {
  var c = state.active;
  var el = document.getElementById('xp-input');
  var xp = parseInt(el.value, 10);
  if (isNaN(xp) || xp <= 0) { toast('Digite o valor de XP.'); return; }
  var before = c.level;
  grantXp(c, xp);
  var levels = c.level - before;
  addLog(c, 'Recebeu ' + xp + ' XP' + (levels > 0 ? ' — SUBIU ' + levels + ' NÍVEL!' : '') + '.');
  el.value = '';
  saveState();
  renderSheet();
  toast(levels > 0 ? 'Nível ' + c.level + '! (NEX ' + derive(c).nex + '%)' : '+' + xp + ' XP adicionado.');
}

/* ------------------------- Inimigos ------------------------- */

function openEnemyModal(editId) {
  state.combat.enemyEditId = editId || null;
  var e = editId ? state.enemies.find(function (x) { return x.id === editId; }) : null;
  var html = '<h3>' + (e ? 'Editar Inimigo' : 'Nova Criatura') + '</h3>' +
    '<div class="form-grid">' +
    '<div class="field"><label>Nome</label><input id="en-name" value="' + esc(e ? e.name : '') + '"></div>' +
    '<div class="field"><label>Ameaça (NEX)</label><input id="en-level" type="number" value="' + (e ? e.level : 4) + '" min="0" style="width:90px"></div>' +
    '<div class="field"><label>PV</label><input id="en-pv" type="number" value="' + (e ? e.pv : 40) + '" min="1" style="width:90px"></div>' +
    '<div class="field"><label>Defesa</label><input id="en-defesa" type="number" value="' + (e ? e.defesa : 12) + '" min="0" style="width:90px"></div>' +
    '<div class="field"><label>Prevenção</label><input id="en-prevencao" type="number" value="' + (e ? e.prevencao : 2) + '" min="0" style="width:90px"></div>' +
    '<div class="field"><label>Ataque (bônus)</label><input id="en-atk" type="number" value="' + (e ? e.atk : 5) + '" min="0" style="width:90px"></div>' +
    '<div class="field"><label>Dano</label><input id="en-damage" value="' + esc(e ? e.damage : '1d6+2') + '" style="width:110px"></div>' +
    '<div class="field"><label>XP</label><input id="en-xp" type="number" value="' + (e ? e.xp : 100) + '" min="0" style="width:90px"></div></div>' +
    '<div class="field"><label>Observações</label><textarea id="en-notes" placeholder="Ataques especiais, fraquezas...">' + esc(e ? e.notes : '') + '</textarea></div>' +
    '<div class="rowline"><button class="btn accent" onclick="saveEnemy()">' + (e ? 'Salvar Alterações' : 'Adicionar') + '</button>' +
    (e ? '<button class="btn" onclick="openEnemyModal()">Nova criatura</button>' : '') +
    '<button class="btn" onclick="closeModal()">Cancelar</button></div>' +
    '<h3 style="margin-top:18px">Biblioteca (' + state.enemies.length + ')</h3>' +
    '<table><thead><tr><th>Nome</th><th>NEX</th><th>PV</th><th>XP</th><th></th></tr></thead><tbody>' +
    state.enemies.map(function (x) {
      return '<tr><td>' + esc(x.name) + '</td><td>' + x.level + '</td><td>' + x.pv + '</td><td>' + x.xp + '</td>' +
        '<td><button class="btn small" onclick="openEnemyModal(\'' + x.id + '\')">Editar</button> ' +
        '<button class="btn small danger" onclick="deleteEnemy(\'' + x.id + '\')">Excluir</button></td></tr>';
    }).join('') +
    '</tbody></table>';
  openModal(html);
}

function saveEnemy() {
  var isEdit = state.combat.enemyEditId;
  var data = {
    name: document.getElementById('en-name').value.trim(),
    level: parseInt(document.getElementById('en-level').value, 10) || 0,
    pv: parseInt(document.getElementById('en-pv').value, 10) || 1,
    defesa: parseInt(document.getElementById('en-defesa').value, 10) || 0,
    prevencao: parseInt(document.getElementById('en-prevencao').value, 10) || 0,
    atk: parseInt(document.getElementById('en-atk').value, 10) || 0,
    damage: document.getElementById('en-damage').value.trim() || '1d4',
    xp: parseInt(document.getElementById('en-xp').value, 10) || 0,
    notes: document.getElementById('en-notes').value.trim()
  };
  if (!data.name) { toast('Dê um nome à criatura.'); return; }
  if (isEdit) {
    var e = state.enemies.find(function (x) { return x.id === isEdit; });
    if (e) Object.assign(e, data);
    toast('Inimigo atualizado!');
  } else {
    data.id = uid();
    state.enemies.push(data);
    toast('Inimigo adicionado!');
  }
  state.combat.enemyEditId = null;
  saveState();
  closeModal();
  openEnemyModal();
  render();
}

function deleteEnemy(id) {
  if (!confirm('Excluir esse inimigo?')) return;
  state.enemies = state.enemies.filter(function (x) { return x.id !== id; });
  if (state.combat.target && state.combat.target.id === id) state.combat.target = null;
  saveState();
  closeModal();
  openEnemyModal();
  render();
}

boot();