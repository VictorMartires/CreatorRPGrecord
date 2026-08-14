'use strict';

const LS_CHARS = 'rpgcp.characters';
const LS_ENEMIES = 'rpgcp.enemies';
const LS_ACTIVE = 'rpgcp.active';
const LS_USER = 'rpgcp.user';

function loadJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    var backup = localStorage.getItem(key + '.backup');
    if (backup != null) {
      try {
        return JSON.parse(backup);
      } catch (e2) { /* backup corrupto tambem */ }
    }
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    var prev = localStorage.getItem(key);
    if (prev != null) localStorage.setItem(key + '.backup', prev);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Falha ao salvar "' + key + '":', e);
    toastIfReady('Atenção: falha ao salvar no navegador.');
  }
}

function toastIfReady(msg) {
  try { toast(msg); } catch (e) { /* ainda nao carregado */ }
}

function loadCharacters() {
  var list = loadJSON(LS_CHARS, []);
  if (!Array.isArray(list)) return [];
  return list.map(function (c) {
    if (!c.owner) c.owner = { id: 'legado', name: 'Não definido' };
    return c;
  });
}

function saveCharacters(list) {
  saveJSON(LS_CHARS, list);
}

function loadEnemies() {
  var list = loadJSON(LS_ENEMIES, null);
  if (!list) {
    saveJSON(LS_ENEMIES, DEFAULT_ENEMIES);
    return DEFAULT_ENEMIES.slice();
  }
  return list;
}

function saveEnemies(list) {
  saveJSON(LS_ENEMIES, list);
}

function loadActiveId() {
  return localStorage.getItem(LS_ACTIVE) || null;
}

function saveActiveId(id) {
  if (id) localStorage.setItem(LS_ACTIVE, id);
  else localStorage.removeItem(LS_ACTIVE);
}

function loadUser() {
  return loadJSON(LS_USER, null);
}

function saveUser(user) {
  if (user) saveJSON(LS_USER, user);
  else localStorage.removeItem(LS_USER);
}

function saveState() {
  saveCharacters(state.characters);
  saveEnemies(state.enemies);
  saveActiveId(state.active ? state.active.id : null);
  saveUser(state.user);
}