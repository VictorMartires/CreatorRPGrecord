'use strict';

function render() {
  try {
    if (state.screen === 'login') renderLogin();
    else if (state.screen === 'create') renderCreate();
    else if (state.screen === 'sheet') renderSheet();
    else if (state.screen === 'biblioteca') renderBiblioteca();
    else renderHome();
  } catch (e) {
    console.error('Falha ao renderizar:', e);
    try {
      state.active = null;
      state.combat.target = null;
      showScreen('home');
      document.getElementById('screen-home').innerHTML =
        '<div class="card"><h2>Algo deu errado</h2>' +
        '<p>Um erro inesperado aconteceu, mas o sistema se recuperou. Suas fichas continuam salvas.</p>' +
        '<p style="color:var(--muted);font-size:12px">' + esc(e.message) + '</p>' +
        '<button class="btn accent" onclick="render()">Continuar</button></div>';
    } catch (e2) {
      /* nada a fazer */
    }
  }
}

/* ------------------------- Home ------------------------- */

function renderHome() {
  showScreen('home');
  var el = document.getElementById('screen-home');
  var html = '<div class="home-head"><h2>Suas Fichas</h2>' +
    '<button class="btn accent" onclick="newCharacter()">+ Nova Ficha</button></div>';

  if (state.characters.length === 0) {
    html += '<div class="card"><p>Sua biblioteca está vazia. Crie sua primeira ficha de personagem.</p></div>';
  } else {
    state.characters.forEach(function (c) {
      var d = derive(c);
      var cls = getClass(c.classId).name;
      var org = getOrigin(c.originId).name;
      html += '<div class="char-card" onclick="openCharacter(\'' + c.id + '\')">' +
        (c.photo ? '<img class="mini-avatar" src="' + esc(c.photo) + '" alt="">' : '') +
        '<div>' +
        '<strong>' + esc(c.name) + '</strong>' +
        '<div class="meta">' + esc(ownerLabel(c)) + ' · ' + esc(cls) + ' · ' + esc(org) + (c.elemento ? ' · Elemento ' + esc(getElemento(c.elemento).name) : '') + ' · NEX ' + d.nex + '% · Nível ' + c.level + '</div>' +
        '<div class="meta">PV ' + cap(c.pv, d.pvMax) + '/' + d.pvMax + ' · SAN ' + cap(c.san, d.sanMax) + ' · XP ' + c.xp + '</div>' +
        '</div><div class="actions" onclick="event.stopPropagation()">' +
        '<button class="btn small" onclick="exportCharacterById(\'' + c.id + '\')">JSON</button>' +
        '<button class="btn small danger" onclick="deleteCharacter(\'' + c.id + '\')">Excluir</button>' +
        '</div></div>';
    });
  }

  html += '<div class="card"><h2>Como funciona</h2>' +
    '<p>Sistema de ficha para <strong>Ordem Paranormal</strong>:</p>' +
    '<ul><li><strong>Atributos (0 a 3)</strong>: Força, Agilidade, Intelecto, Presença, Vigor e Vontade. Cada ponto custa XP (0→1=1, 1→2=2, 2→3=3).</li>' +
    '<li><strong>NEX</strong>: sobe 5% por nível (até 99%). Ganha PV, SAN e PE conforme o NEX.</li>' +
    '<li><strong>PV</strong> = base da classe + 10×Vigor + 5×NEX · <strong>SAN</strong> = base + 5×Vontade + 5×NEX · <strong>PE</strong> = base + NEX/10.</li>' +
    '<li><strong>Testes</strong>: d20 + atributo + bônus da perícia (Treinada +5, Veterana +10, Especialista +15). Defesa = 10 + Agilidade.</li>' +
    '<li>Arma de fogo gasta munição; arma branca não. Crítico dobra os dados. Tudo salvo no navegador (e exportável em JSON/PDF).</li></ul>' +
    '<details class="topic"><summary>Armas de fogo</summary>' +
    '<ul><li>Usam <strong>Agilidade</strong> no teste e a perícia <strong>Pontaria</strong> quando treinada.</li>' +
    '<li>Têm munição limitada: Revólver 6 · Pistola 12 · Espingarda 2 · Rifle 30 · Submetralhadora 32.</li>' +
    '<li>Quando a munição acaba, é preciso recarregar antes de atacar de novo.</li></ul></details>' +
    '<details class="topic"><summary>Armas brancas</summary>' +
    '<ul><li>Usam <strong>Força</strong> no teste e a perícia <strong>Luta</strong> quando treinada.</li>' +
    '<li>Não gastam munição e funcionam sempre.</li>' +
    '<li>Espadas, machados, adagas e facas têm crítico 19–20; desarmado causa 1d3.</li></ul></details>' +
    '<details class="topic"><summary>Rituais e Elementos</summary>' +
    '<ul><li>Rituais pertencem a um <strong>Elemento</strong> (Sangue, Morte, Conhecimento, Energia ou Medo).</li>' +
    '<li>Cada ritual tem um círculo (1º ou 2º) e custo em PE; ocultistas começam com 2 rituais de 1º círculo.</li>' +
    '<li>Sua <strong>afinidade</strong> (elemento do personagem) deixa os rituais do mesmo elemento 1 PE mais baratos (mín. 1).</li></ul></details>' +
    '<details class="topic"><summary>Dano Mental</summary>' +
    '<ul><li>Inimigos com "Dano Mental" atacam sua SAN: d20 + ND do inimigo vs DT 10 + Vontade.</li>' +
    '<li>Se passar, você perde Pontos de Sanidade (SAN) em vez de PV.</li></ul></details>' +
    '</div>';

  el.innerHTML = html;
}

function cap(v, max) {
  v = Math.min(v, max);
  return Math.max(0, v);
}

/* ------------------------- Create ------------------------- */

function renderCreate() {
  showScreen('create');
  var el = document.getElementById('screen-create');
  var d = state.draft;

  var html = '<div class="home-head"><h2>Nova Ficha</h2>' +
    '<button class="btn" onclick="cancelCreate()">Cancelar</button></div>';

  html += '<div class="card">' +
    '<div class="step-dots">' + [1, 2, 3, 4, 5, 6].map(function (n) {
      return '<span class="step-dot' + (n === d.step ? ' on' : n < d.step ? ' on' : '') + '"></span>';
    }).join('') + '</div>' +
    '<p class="points-left">Etapa ' + d.step + ' de 6</p>';

  if (d.step === 1) {
    html += '<div class="field"><label>Nome do personagem</label>' +
      '<input id="draft-name" maxlength="40" value="' + esc(d.name) + '"></div>' +
      '<div class="field"><label>Foto do personagem</label>' +
      '<div class="photo-field">' +
      (d.photo ? '<img class="photo-preview" src="' + esc(d.photo) + '" alt="foto">' : '<div class="photo-empty">Sem foto</div>') +
      '<div><label class="btn small">' + (d.photo ? 'Trocar foto' : 'Enviar foto') +
      '<input type="file" accept="image/*" hidden onchange="readPhoto(this,\'draft\')"></label>' +
      (d.photo ? '<button class="btn small danger" style="margin-top:6px" onclick="clearDraftPhoto()">Remover</button>' : '') +
       '<p class="meta" style="color:var(--muted);margin:6px 0 0">A imagem é reduzida automaticamente para caber no salvamento.</p>' +
       '</div></div></div>' +
       '<div class="field" style="margin-top:10px"><label>Descrição física (opcional)</label>' +
       '<textarea id="draft-appearance" placeholder="Aparência, idade, marca, vestimenta..." onchange="state.draft.appearance=this.value">' + esc(d.appearance || '') + '</textarea>' +
       '<p class="meta" style="color:var(--muted)">Nem todo agente tem uma imagem; use isto para descrevê-lo.</p></div>' +
       '<button class="btn accent" onclick="nextStep()">Continuar</button>';
  } else if (d.step === 2) {
    html += '<h3>Origem</h3><div class="grid cols-2">';
    ORIGINS.forEach(function (o) {
      html += '<div class="option-card' + (d.originId === o.id ? ' selected' : '') + '" onclick="pickOrigin(\'' + o.id + '\')">' +
        '<div class="t">' + esc(o.name) + '</div><div class="d">' + esc(o.desc) + '</div></div>';
    });
    html += '</div>';

    html += '<h3>Elemento (afinidade)</h3>' +
      '<p class="meta" style="color:var(--muted)">Como em Ordem Paranormal, cada agente tem uma afinidade. Rituais do seu elemento custam 1 PE a menos (mín. 1).</p>' +
      '<div class="grid cols-2">' +
      '<div class="option-card' + (!d.elemento ? ' selected' : '') + '" onclick="pickElemento(\'\')">' +
      '<div class="t">Sem elemento</div><div class="d">Afinidade ainda não despertada.</div></div>';
    ELEMENTOS.forEach(function (e) {
      html += '<div class="option-card' + (d.elemento === e.id ? ' selected' : '') + '" onclick="pickElemento(\'' + e.id + '\')">' +
        '<div class="t"><span class="el-dot" style="background:' + e.color + '"></span>' + esc(e.name) + '</div>' +
        '<div class="d">Afinidade com o elemento ' + esc(e.name) + '.</div></div>';
    });
    html += '</div><div style="margin-top:10px"><button class="btn accent" onclick="nextStep()">Continuar</button></div>';
  } else if (d.step === 3) {
    html += '<h3>Classe</h3><div class="grid cols-2">';
    Object.keys(CLASSES).forEach(function (key) {
      var cls = CLASSES[key];
      html += '<div class="option-card' + (d.classId === key ? ' selected' : '') + '" onclick="pickClass(\'' + key + '\')">' +
        '<div class="t">' + esc(cls.name) + '</div>' +
        '<div class="d">' + esc(cls.desc) + '<br>PV base ' + cls.pvBase + ' · ' + cls.trainings + ' perícias</div></div>';
    });
    html += '</div>';

    if (d.classId === 'ocultista') {
      var r1 = RITUAIS.filter(function (r) { return r.circulo === 1; });
      html += '<h3>Rituais iniciais (escolha 2)</h3>' +
        '<p class="meta" style="color:var(--muted)">Selecionados: ' + d.rituaisInit.length + '/2</p><div class="grid cols-2">';
      r1.forEach(function (r) {
        var el = getElemento(r.elemento);
        var sel = d.rituaisInit.indexOf(r.id) >= 0;
        html += '<div class="option-card' + (sel ? ' selected' : '') + '" onclick="toggleInitRitual(\'' + r.id + '\')">' +
          '<div class="t">' + esc(r.nome) + '</div>' +
          '<div class="d"><span class="el-badge" style="border-color:' + el.color + ';color:' + el.color + '">' + esc(el.name) + '</span> · ' + r.circulo + 'º círculo · ' + r.pe + ' PE<br>' + esc(r.desc) + '</div></div>';
      });
      html += '</div>';
    } else {
      html += '<p class="meta" style="color:var(--muted)">A <strong>Trilha</strong> da classe é escolhida aos 10% de NEX (Nível 2), na própria ficha.</p>';
    }

    html += '<div style="margin-top:12px"><button class="btn accent" onclick="nextStep()">Continuar</button></div>';
  } else if (d.step === 4) {
    var pool = d.pool;
    html += '<h3>Atributos (0–3)</h3>' +
      '<p class="points-left" id="pool-left">Pontos restantes: ' + pool + '</p>' +
      '<div class="attr-alloc">';
    ATTRIBUTES.forEach(function (a) {
      html += '<div class="stat"><div class="name">' + a.name + ' (' + a.short + ')</div>' +
        '<div class="val">' + d.attributes[a.id] + '</div>' +
        '<div class="rowline" style="justify-content:center">' +
        '<button class="btn small" onclick="adjustAttr(\'' + a.id + '\',-1)">−</button>' +
        '<button class="btn small" onclick="adjustAttr(\'' + a.id + '\',1)">+</button></div></div>';
    });
    html += '</div><div style="margin-top:10px">' +
      '<button class="btn" onclick="prevStep()">Voltar</button>' +
      '<button class="btn accent" onclick="nextStep()">Continuar</button></div>';
  } else if (d.step === 5) {
    var cls = getClass(d.classId);
    var originFree = getOrigin(d.originId).skill;
    var maxTrain = cls.trainings;
    html += '<h3>Perícias treinadas (' + Object.keys(d.skills).length + '/' + maxTrain + ')</h3>' +
      '<p class="meta" style="color:var(--muted)">Origem e classe treinam automaticamente: <strong>' +
      esc(getSkill(originFree).name) + ' e ' + esc(getSkill(cls.freeSkill).name) + '</strong>.</p>';
    SKILLS.forEach(function (s) {
      var auto = s.id === originFree || s.id === cls.freeSkill;
      var sel = !!d.skills[s.id];
      html += '<div class="skill-row' + (auto ? ' auto' : '') + '">' +
        '<span class="' + (auto || sel ? 'trained' : '') + '">' + esc(s.name) + ' (' + s.attr.toUpperCase() + ')</span>' +
        (auto ? '<span class="dice">automática</span>' :
          '<button class="btn small" onclick="toggleTrain(\'' + s.id + '\')">' + (sel ? '✓ Treinada' : 'Treinar') + '</button>') +
        '</div>';
    });
    html += '<div style="margin-top:10px"><button class="btn" onclick="prevStep()">Voltar</button>' +
      '<button class="btn accent" onclick="nextStep()">Continuar</button></div>';
  } else if (d.step === 6) {
    html += '<h3>Equipamento inicial</h3><div class="form-grid">' +
      '<div class="field"><label>Arma</label><select id="draft-weapon">' +
      WEAPONS.map(function (w) {
        return '<option value="' + w.id + '"' + (d.weapon === w.id ? ' selected' : '') + '>' + esc(w.name) + ' (' + w.dice + ')</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>Proteção</label><select id="draft-armor">' +
      ARMORS.map(function (a) {
        return '<option value="' + a.id + '"' + (d.armor === a.id ? ' selected' : '') + '>' + esc(a.name) + ' (Prev. ' + a.prev + ')</option>';
      }).join('') + '</select></div></div>' +
      '<div style="margin-top:10px"><button class="btn" onclick="prevStep()">Voltar</button>' +
      '<button class="btn accent" onclick="finalizeCharacter()">Criar Ficha</button></div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

function updateNav() {
  try {
    var home = document.getElementById('btn-home');
    var bib = document.getElementById('btn-bib');
    if (home) home.classList.toggle('active', state.screen === 'home');
    if (bib) bib.classList.toggle('active', state.screen === 'biblioteca');
    var chip = document.getElementById('user-chip');
    var logoutBtn = document.getElementById('btn-logout');
    var hide = !state.user || state.screen === 'login';
    if (chip) {
      chip.textContent = state.user ? 'Jogador: ' + state.user.name : '';
      chip.classList.toggle('hidden', hide);
    }
    if (logoutBtn) logoutBtn.classList.toggle('hidden', hide);
  } catch (e) { }
}

function showScreen(name) {
  state.screen = name;
  ['login', 'home', 'create', 'sheet', 'biblioteca'].forEach(function (s) {
    document.getElementById('screen-' + s).classList.toggle('hidden', s !== name);
  });
  updateNav();
}

/* ------------------------- Login ------------------------- */

function renderLogin() {
  showScreen('login');
  var el = document.getElementById('screen-login');
  var quick = ownerList().filter(function (n) { return n !== 'Não definido'; });
  var html = '<div class="login-box card">' +
    '<h2>Ficha de RPG</h2>' +
    '<p>Entre com seu nome para marcar suas fichas.</p>' +
    '<div class="field"><input id="login-name" placeholder="Seu nome de jogador" maxlength="30" onkeydown="if(event.key===\'Enter\')doLogin()"></div>' +
    '<button class="btn accent" onclick="doLogin()">Entrar</button>';

  if (quick.length) {
    html += '<div class="login-quick"><p>Jogadores conhecidos:</p>' +
      quick.map(function (n) {
        return '<button class="btn small" onclick="login(\'' + esc(n) + '\')">' + esc(n) + '</button>';
      }).join(' ') + '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

/* ------------------------- Fichas dos Jogadores ------------------------- */

function renderBiblioteca() {
  showScreen('biblioteca');
  var el = document.getElementById('screen-biblioteca');
  var filtro = state.ui.filter || 'all';

  var html = '<div class="home-head"><h2>Fichas dos Jogadores</h2>' +
    '<div class="rowline">' +
    '<select id="bib-filter" onchange="setFilter(this.value)" style="width:auto;min-width:180px">' +
    '<option value="all"' + (filtro === 'all' ? ' selected' : '') + '>Todos os jogadores (' + state.characters.length + ' fichas)</option>' +
    ownerList().map(function (n) {
      return '<option value="' + esc(n) + '"' + (filtro === n ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join('') + '</select>' +
    '<button class="btn accent" onclick="newCharacter()">+ Nova Ficha para ' + esc(state.user ? state.user.name : '') + '</button>' +
    '</div></div>';

  if (state.characters.length === 0) {
    html += '<div class="card"><p>Nenhuma ficha criada ainda. Crie a primeira para começar.</p>' +
      '<button class="btn accent" onclick="newCharacter()">Criar personagem</button></div>';
    el.innerHTML = html;
    return;
  }

  var groups = {};
  state.characters.forEach(function (c) {
    var o = ownerLabel(c);
    (groups[o] = groups[o] || []).push(c);
  });

  var owners = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b); });
  if (filtro !== 'all') owners = owners.filter(function (o) { return o === filtro; });

  owners.forEach(function (o) {
    var chars = groups[o].sort(function (a, b) { return a.name.localeCompare(b.name); });
    html += '<div class="owner-section"><h3>Jogador: ' + esc(o) +
      ' <span class="tag">' + chars.length + (chars.length === 1 ? ' ficha' : ' fichas') + '</span></h3>' +
      '<div class="player-grid">';

    chars.forEach(function (c) {
      var d = derive(c);
      var cls = getClass(c.classId);
      var org = getOrigin(c.originId);
      var w = equippedWeapon(c);
      var arm = getArmor(c.equipment.armor);
      var hpPct = Math.max(0, Math.min(100, d.pvMax ? c.pv / d.pvMax * 100 : 0));
      var sanPct = Math.max(0, Math.min(100, d.sanMax ? c.san / d.sanMax * 100 : 0));
      var pePct = Math.max(0, Math.min(100, d.peMax ? c.pe / d.peMax * 100 : 0));

      html += '<div class="player-card" onclick="openCharacter(\'' + c.id + '\')">' +
        '<div class="pc-top">' +
        (c.photo ? '<img class="avatar-mini" src="' + esc(c.photo) + '" alt="">' : '') +
        '<div><strong class="pc-name">' + esc(c.name) + '</strong>' +
        '<div class="meta">' + esc(cls.name) + ' · ' + esc(org.name) + '</div>' +
        '<div class="meta">NEX ' + d.nex + '% · Nível ' + c.level + ' · XP ' + c.xp + '</div></div>' +
        '<span class="tag">' + esc(c.diaCriacao) + '</span></div>' +

        '<div class="pc-res">' + resMini('PV', c.pv, d.pvMax, hpPct, 'var(--red2)') +
        resMini('SAN', c.san, d.sanMax, sanPct, '#9ec5ff') +
        resMini('PE', c.pe, d.peMax, pePct, 'var(--gold)') + '</div>' +

        '<div class="pc-attr">' + ATTRIBUTES.map(function (a) {
          return '<span title="' + esc(a.name) + '"><b>' + a.short + '</b> ' + c.attributes[a.id] + '</span>';
        }).join('') + '</div>' +

        '<div class="meta pc-equip">' + esc(w.name) + ' (' + w.dice + ') · ' + esc(arm.name) + ' · Def ' + d.defesa +
        ' · Prev ' + d.prevencao + ' · ' + c.abilities.length + ' habilidades ' + elementTag(c) + '</div>' +

        '<div class="pc-actions" onclick="event.stopPropagation()">' +
        '<button class="btn small" onclick="openCharacter(\'' + c.id + '\')">Abrir Ficha</button>' +
        '<button class="btn small" onclick="exportCharacterById(\'' + c.id + '\')">JSON</button>' +
        '<button class="btn small danger" onclick="deleteCharacter(\'' + c.id + '\')">Excluir</button>' +
        '</div></div>';
    });
    html += '</div></div>';
  });

  el.innerHTML = html;
}

function resMini(lbl, cur, max, pct, color) {
  return '<div class="res-mini"><span class="k">' + lbl + '</span>' +
    '<div class="bar" style="height:6px"><div style="width:' + pct + '%;background:' + color + '"></div></div>' +
    '<span class="v">' + cap(cur, max) + '/' + max + '</span></div>';
}

/* ------------------------- Sheet ------------------------- */

function renderSheet() {
  showScreen('sheet');
  var c = state.active;
  var d = derive(c);
  var nexLabel = d.nex >= 99 ? '99' : d.nex;

  var header = document.createElement('section');
  var resHtml = [
    resourceBox('PV', c.pv, d.pvMax, 'red'),
    resourceBox('SAN', c.san, d.sanMax, 'san'),
    resourceBox('PE', c.pe, d.peMax, 'pe')
  ].join('');

  var trilhaTag = c.trilha ? '<span class="tag">' + esc(getTrilha(c.classId, c.trilha).name) + '</span>' : '';
  var avatarHtml = '<div class="avatar-col">' +
    (c.photo ? '<img class="avatar" src="' + esc(c.photo) + '" alt="foto de ' + esc(c.name) + '">' : '<div class="avatar avatar-empty">Sem foto</div>') +
    '<div class="rowline" style="justify-content:center;margin-top:6px">' +
    '<label class="btn small">Trocar<input type="file" accept="image/*" hidden onchange="readPhoto(this,\'active\')"></label>' +
    (c.photo ? '<button class="btn small danger" onclick="clearActivePhoto()">Remover</button>' : '') +
    '</div>' +
    '<textarea class="appearance-box" placeholder="Descrição física (aparência, idade, vestimenta)..." onchange="setAppearance(this.value)">' + esc(c.appearance || '') + '</textarea></div>';

  header.innerHTML = '<div class="sheet-head"><div>' +
    '<h2><input id="char-name" value="' + esc(c.name) + '" maxlength="40" ' +
    'onchange="renameChar(this.value)" style="font-size:22px;font-weight:700;width:auto;min-width:220px;background:transparent;border:none;border-bottom:2px solid var(--line);color:var(--ink);padding:2px 4px">' +
    '<span class="tags">' +
    '<span class="tag">' + esc(getClass(c.classId).name) + '</span>' +
    trilhaTag +
    '<span class="tag">' + esc(getOrigin(c.originId).name) + '</span>' +
    elementTag(c) +
    '<span class="tag gold">NEX ' + nexLabel + '%</span>' +
    '<span class="tag">Nível ' + c.level + '</span>' +
    '<span class="tag">Jogador: ' + esc(ownerLabel(c)) + '</span>' +
    '<span class="tag red">Criada em ' + esc(c.diaCriacao) + '</span></span></h2>' +
    '<div class="resources">' + resHtml + '</div>' +
    '<div class="xpbar"><div class="meta"><span>XP: ' + c.xp + '</span><span>' +
    (c.level >= 20 ? 'Nível máximo' : 'Próximo nível: ' + xpToReachLevel(c.level + 1)) + '</span></div>' +
    '<div class="bar"><div style="width:' + xpPct(c) + '%"></div></div></div>' +
    '</div>' + avatarHtml + '</div>';

  var tabsEl = document.createElement('div');
  var tabs = [
    ['atributos', 'Atributos & Perícias'],
    ['combate', 'Combate'],
    ['inventario', 'Inventário'],
    ['habilidades', 'Poderes & Rituais'],
    ['notas', 'Notas']
  ];
  tabsEl.className = 'tabs no-print';
  tabsEl.innerHTML = tabs.map(function (t) {
    return '<button class="tab-btn' + (state.ui.tab === t[0] ? ' active' : '') + '" onclick="setTab(\'' + t[0] + '\')">' + t[1] + '</button>';
  }).join('');

  var panels = document.createElement('div');
  panels.innerHTML = '<div class="tab-panel' + (state.ui.tab === 'atributos' ? ' active' : '') + '" id="panel-atributos">' + panelAtributos() + '</div>' +
    '<div class="tab-panel' + (state.ui.tab === 'combate' ? ' active' : '') + '" id="panel-combate">' + panelCombate() + '</div>' +
    '<div class="tab-panel' + (state.ui.tab === 'inventario' ? ' active' : '') + '" id="panel-inventario">' + panelInventario() + '</div>' +
    '<div class="tab-panel' + (state.ui.tab === 'habilidades' ? ' active' : '') + '" id="panel-habilidades">' + panelHabilidades() + '</div>' +
    '<div class="tab-panel' + (state.ui.tab === 'notas' ? ' active' : '') + '" id="panel-notas">' + panelNotas() + '</div>';

  var container = document.getElementById('screen-sheet');
  container.innerHTML = '';
  container.appendChild(header);

  if (c.level >= 2 && !c.trilha) {
    var banner = document.createElement('div');
    banner.className = 'card';
    banner.style.borderColor = 'var(--gold)';
    banner.innerHTML = '<strong>Trilha disponível!</strong> Em Ordem Paranormal a Trilha de classe é escolhida aos 10% de NEX (Nível 2). ' +
      '<button class="btn accent small" onclick="openTrilhaModal()">Escolher Trilha</button>';
    container.appendChild(banner);
  }

  container.appendChild(tabsEl);
  container.appendChild(panels);
}

function resourceBox(lbl, cur, max, cls) {
  var safe = max > 0 ? Math.round(cur / max * 100) : 0;
  return '<div class="resy ' + cls + '"><span class="lbl">' + lbl + '</span>' +
    '<span class="num" onclick="editResource(\'' + lbl + '\')"' +
    ' title="Clique para editar">' + cur + '<span style="font-size:12px;color:var(--muted)">/' + max + '</span></span>' +
    '<div class="bar" style="height:6px;margin-top:4px"><div style="width:' + safe + '%;background:' +
    (cls === 'san' ? '#9bb7e0' : cls === 'pe' ? 'var(--gold)' : 'var(--red2)') + '"></div></div>' +
    '<div class="rowline" style="justify-content:center;margin-top:4px">' +
    '<button class="btn small" onclick="shiftResource(\'' + lbl + '\',-1)">−</button>' +
    '<button class="btn small" onclick="shiftResource(\'' + lbl + '\',1)">+</button></div></div>';
}

function elementTag(c) {
  var el = c && c.elemento ? getElemento(c.elemento) : null;
  if (!el) return '';
  return '<span class="tag" style="color:' + el.color + ';border-color:' + el.color + '">Elemento: ' + esc(el.name) + '</span>';
}

function xpPct(c) {
  if (c.level >= 20) return 100;
  var lo = xpToReachLevel(c.level);
  var hi = xpToReachLevel(c.level + 1);
  return Math.min(100, Math.round((c.xp - lo) / (hi - lo) * 100));
}

function panelAtributos() {
  var c = state.active;
  var el = c.elemento ? getElemento(c.elemento) : null;
  var html = '<div class="card"><h2>Elemento (afinidade)</h2>' +
    '<div class="rowline" style="flex-wrap:wrap;gap:10px">' +
    '<select onchange="setElemento(this.value)" style="width:auto;min-width:180px">' +
    '<option value=""' + (!c.elemento ? ' selected' : '') + '>— Sem elemento —</option>' +
    ELEMENTOS.map(function (e) {
      return '<option value="' + e.id + '"' + (c.elemento === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>';
    }).join('') + '</select>' +
    (el ? '<span class="el-dot" style="background:' + el.color + '"></span>' : '') +
    '</div>' +
    '<p class="meta" style="color:var(--muted)">Rituais do seu elemento custam 1 PE a menos (mín. 1).</p></div>';

  html += '<div class="card"><h2>Atributos</h2>' +
    '<div class="rowline" style="margin-bottom:10px;gap:20px;flex-wrap:wrap">';
  ATTRIBUTES.forEach(function (a) {
    var v = c.attributes[a.id];
    html += '<div class="stat"><div class="name">' + a.name + ' (' + a.short + ')</div>' +
      '<div class="val">' + v + '</div>' +
      '<div class="bonus">bônus ' + fmtMod(v) + '</div>' +
      '<div class="rowline" style="justify-content:center">' +
      '<button class="btn small" onclick="changeAttr(\'' + a.id + '\',-1)">−</button>' +
      '<button class="btn small" onclick="changeAttr(\'' + a.id + '\',1)">+</button></div></div>';
  });
  html += '</div></div>';

  html += '<div class="card"><h2>Perícias</h2><div class="rowline" style="margin-bottom:8px;gap:20px">' +
    '<span class="tag">Treinada +5 · Veterana +10 · Especialista +15</span>' +
    '<span class="tag">DT: 5 fácil · 10 média · 15 difícil · 20 muito difícil</span></div>';
  SKILLS.forEach(function (s) {
    var level = c.skills[s.id] || 0;
    var bonus = skillBonus(c, s.id);
    var trained = level > 0;
    var nexts = { 0: 5, 5: 10, 10: 15 };
    var costMap = { 5: 2, 10: 4, 15: 6 };
    var canUp = (level in nexts);
    html += '<div class="skill-row">' +
      '<span class="' + (trained ? 'trained' : '') + '">' + esc(s.name) + ' <em style="color:var(--muted)">(' + trainName(level) + ')</em></span>' +
      '<span class="dice">d20 ' + fmtMod(bonus) + '</span>' +
      (canUp ? '<button class="btn small skill-check" onclick="trainSkill(\'' + s.id + '\')">Subir (' + costMap[nexts[level]] + ' XP)</button>' : (level >= 15 ? '<span class="dice">máximo</span>' : '')) +
      '<button class="btn small" onclick="rollSkill(\'' + s.id + '\')">Rolar</button></div>';
  });
  html += '</div>';
  return html;
}

function panelCombate() {
  var c = state.active;
  var d = derive(c);
  var w = equippedWeapon(c);
  var info = attackMod(c, w);
  var target = state.combat.target;

  var html = '<div class="card"><h2>Status de Combate</h2>' +
    '<div class="stat-sum">' +
    chunks(c) +
    '</div>' +
    '<div style="margin-top:10px" class="rowline">' +
    '<button class="btn" onclick="restoreResources()">Restaurar Recursos</button>' +
    '<button class="btn" onclick="rollInitiative()">Rolar Iniciativa</button></div>' +
    '<div id="combat-roll" class="roll-result"></div></div>';

  html += '<div class="card"><h2>Ataque</h2>' +
    '<div class="rowline">' +
    '<select id="atk-weapon" style="width:auto;min-width:200px">' +
    '<option value="">' + esc(c.equipment.weaponMain ? getWeapon(c.equipment.weaponMain).name : 'Desarmado') + ' (equipada)</option>' +
    WEAPONS.map(function (x) {
      return '<option value="' + x.id + '">' + esc(x.name) + ' — ' + x.dice + (x.props ? ' · ' + x.props : '') + '</option>';
    }).join('') + '</select>' +
    '<button class="btn accent" onclick="attackAction()">Rolar Ataque</button>' +
    '<button class="btn" onclick="damageAction()">Rolar Dano</button></div>' +
    '<p class="meta" style="margin:8px 0 0;color:var(--muted)">' +
    'Teste: d20 ' + fmtMod(info.mod) + ' (' + info.attr.toUpperCase() + (info.trained ? ' + treino' : '') + ') · ' +
    'Dano: ' + esc(w.name) + ' ' + w.dice + ' + ' + w.attr.toUpperCase() + ' · Crítico em ' + critLabel(w) + ' (dobra dados).</p>' +
    (w.mun ? '<p class="meta" style="color:var(--muted)">Munição: ' + ammoFor(c, w.id) + '/' + w.mun +
      ' <button class="btn small" onclick="reloadAmmo(\'' + w.id + '\')">Recarregar</button></p>' : '') +
    '<div id="attack-result" class="roll-result"></div></div>';

  html += '<div class="card"><h2>Alvo</h2>' +
    '<div class="rowline">' +
    '<select id="enemy-select" style="width:auto;min-width:220px">' + enemyOptions() + '</select>' +
    '<button class="btn" onclick="addTarget()">Adicionar Alvo</button>' +
    '<button class="btn" onclick="openEnemyModal()">Gerenciar Inimigos</button></div>';

  if (target) {
    var hpPct = Math.max(0, Math.min(100, target.hp / target.pv * 100));
    html += '<div class="target-card">' +
      '<div class="rowline" style="justify-content:space-between">' +
      '<strong>' + esc(target.name) + '</strong><span class="tag">NEX ' + target.level + ' · Def ' + target.defesa + '</span></div>' +
      '<div class="bar" style="margin:8px 0"><div style="width:' + hpPct + '%;background:' + (hpPct > 40 ? 'var(--red2)' : hpPct > 15 ? 'var(--gold)' : '#8a8a1a') + '"></div></div>' +
      '<div class="rowline" style="justify-content:space-between">' +
      '<span>PV <strong>' + Math.max(0, target.hp) + '</strong>/' + target.pv + '</span>' +
      '<span>PA ' + target.prevencao + ' · Dano ' + esc(target.damage) + '</span></div>' +
      '<div class="rowline" style="margin-top:8px">' +
      '<button class="btn small" onclick="applyLastDamage()">Aplicar dano rolado</button>' +
      '<button class="btn small" onclick="enemyAttacks()">Inimigo ataca</button>' +
       '<button class="btn small" onclick="dealDamage(-5)">−5 PV</button>' +
       '<button class="btn small" onclick="dealDamage(-1)">−1</button>' +
       (target.sanDmg ? '<button class="btn small" onclick="enemyMentalAttack()">Ameaça mental</button>' : '') +
       '<button class="btn small danger" onclick="removeTarget()">Remover</button>' +
       '<button class="btn accent small" onclick="defeatTarget()">Derrotar (+XP)</button></div>' +
      '<div id="enemy-result" class="roll-result"></div></div>';
  }
  html += '</div>';

  html += '<div class="card"><h2>XP</h2>' +
    '<div class="rowline">' +
    '<input id="xp-input" type="number" placeholder="Valor de XP" style="width:110px">' +
    '<button class="btn" onclick="awardXp()">Adicionar XP</button>' +
    '<span class="meta" style="color:var(--muted)">Derrotar o alvo concede ' + (target ? target.xp : 0) + ' XP automaticamente.</span></div>' +
    '</div>';

  html += '<div class="card"><h2>Registro</h2>' +
    '<div class="log-box">' + logHtml(c) + '</div></div>';

  return html;
}

function chunks(c) {
  var d = derive(c);
  return '<div class="stat-chunk"><span class="v">' + d.defesa + '</span><span class="k">Defesa</span></div>' +
    '<div class="stat-chunk"><span class="v">' + d.prevencao + '</span><span class="k">Prevenção</span></div>' +
    '<div class="stat-chunk"><span class="v">' + fmtMod(d.iniciativa) + '</span><span class="k">Iniciativa</span></div>' +
    '<div class="stat-chunk"><span class="v">' + (c.attributes.agi) + '</span><span class="k">Agilidade</span></div>';
}

function chunk(lbl, v) {
  return '<div class="stat-chunk"><span class="v">' + v + '</span><span class="k">' + lbl + '</span></div>';
}

function enemyOptions() {
  return state.enemies.map(function (e) {
    return '<option value="' + e.id + '">' + esc(e.name) + ' — NEX ' + e.level + '</option>';
  }).join('');
}

function critLabel(w) {
  if (!w) return 20;
  if (Array.isArray(w.crit)) {
    var lo = Math.min.apply(null, w.crit);
    return lo + '–20';
  }
  return String(w.crit);
}

function logHtml(c) {
  if (!c.log.length) return '<div class="line">Ainda não há registros.</div>';
  return c.log.map(function (l) {
    return '<div class="line"><span class="t">' + l.t + '</span> — ' + esc(l.text) + '</div>';
  }).join('');
}

function panelInventario() {
  var c = state.active;

  var html = '<div class="card"><h2>Equipamento</h2>' +
    '<div class="stat-sum">' +
    '<div class="stat-chunk"><span class="v" style="font-size:16px">' + esc(equipName(c.equipment.weaponMain, WEAPONS)) + '</span><span class="k">Arma</span></div>' +
    '<div class="stat-chunk"><span class="v" style="font-size:16px">' + esc(equipName(c.equipment.armor, ARMORS)) + '</span><span class="k">Proteção</span></div>' +
    '<div class="stat-chunk"><span class="v" style="font-size:16px">' + (c.equipment.accessory ? esc(c.equipment.accessory) : '—') + '</span><span class="k">Acessório</span></div></div>' +
    '<div class="form-grid" style="margin-top:12px">' +
    '<div class="field"><label>Arma equipada</label><select onchange="setWeapon(this.value)">' +
    WEAPONS.map(function (w) { return '<option value="' + w.id + '"' + (c.equipment.weaponMain === w.id ? ' selected' : '') + '>' + esc(w.name) + ' (' + w.dice + ')</option>'; }).join('') +
    '</select></div>' +
    '<div class="field"><label>Proteção equipada</label><select onchange="setArmor(this.value)">' +
    ARMORS.map(function (a) { return '<option value="' + a.id + '"' + (c.equipment.armor === a.id ? ' selected' : '') + '>' + esc(a.name) + ' (Prev. ' + a.prev + ')</option>'; }).join('') +
    '</select></div>' +
    '<div class="field"><label>Acessório (texto livre)</label><input value="' + esc(c.equipment.accessory || '') + '" onchange="setAccessory(this.value)" placeholder="Ex.: Crucifixo, algema..."></div></div>' +
    '</div>';

  html += '<div class="card"><h2>Inventário</h2>' +
    '<div class="form-grid" style="margin-bottom:10px">' +
    '<div class="field" style="margin-bottom:0"><label>Item</label><input id="item-name" placeholder="Nome do item" style="min-width:140px"></div>' +
    '<div class="field" style="margin-bottom:0"><label>Categoria</label><select id="item-cat"><option>Geral</option><option>Arma</option><option>Proteção</option><option>Consumível</option><option>Municação</option><option>Chave</option><option>Documento</option><option>Relíquia</option></select></div>' +
    '<div class="field" style="margin-bottom:0"><label>Qtd</label><input id="item-qty" type="number" value="1" min="1" style="width:60px"></div>' +
    '<div class="field" style="margin-bottom:0"><label>Peso</label><input id="item-weight" type="number" value="0" min="0" step="0.1" style="width:70px"></div>' +
    '<div class="field" style="margin-bottom:0"><label>&nbsp;</label><button class="btn accent" onclick="addItem()">Adicionar</button></div></div>';

  if (c.items.length === 0) {
    html += '<p class="meta" style="color:var(--muted)">Inventário vazio.</p>';
  } else {
    var totalPeso = 0;
    html += '<table><thead><tr><th>Item</th><th>Categoria</th><th>Qtd</th><th>Peso</th><th>Anotação</th><th></th></tr></thead><tbody>';
    c.items.forEach(function (it, i) {
      totalPeso += (it.weight || 0) * (it.qty || 1);
      html += '<tr><td><strong>' + esc(it.name) + '</strong></td><td>' + esc(it.category || '—') + '</td>' +
        '<td><button class="btn small" onclick="item(\'' + it.id + '\',-1)">−</button> ' + it.qty +
        ' <button class="btn small" onclick="item(\'' + it.id + '\',1)">+</button></td>' +
        '<td>' + ((it.weight || 0) * (it.qty || 1)).toFixed(1) + ' kg</td>' +
        '<td>' + esc(it.notes || '') + '</td>' +
        '<td><button class="btn small" onclick="editItem(\'' + it.id + '\')">Anotar</button> ' +
        '<button class="btn small danger" onclick="dropItem(\'' + it.id + '\')">Remover</button></td></tr>';
    });
    html += '</tbody></table><p class="meta" style="color:var(--muted)">Peso total: ' + totalPeso.toFixed(1) + ' kg</p>';
  }
  html += '</div>';
  return html;
}

function equipName(id, list) {
  var found = list.find(function (x) { return x.id === id; });
  return found ? found.name : '—';
}

function panelHabilidades() {
  var c = state.active;
  var html = '<div class="card"><h2>Poderes</h2>';
  if (c.abilities.length === 0) {
    html += '<p class="meta" style="color:var(--muted)">Nenhum poder. Use o formulário abaixo para adicionar.</p>';
  }
  c.abilities.forEach(function (a) {
    html += '<div class="ability"><div class="head">' +
      '<span class="name">' + esc(a.name) + '</span>' +
      '<span class="pe">' + a.peCost + ' PE</span></div>' +
      '<div class="desc">' + esc(a.desc || '') + '</div>' +
      '<div class="rowline" style="margin-top:6px">' +
      '<button class="btn small" onclick="useAbility(\'' + a.id + '\')">Usar (gasta ' + a.peCost + ' PE)</button>' +
      (a.custom ? '<button class="btn small danger" onclick="removeAbility(\'' + a.id + '\')">Remover</button>' : '') +
      '</div></div>';
  });

  html += '<div class="card"><h2>Rituais</h2>';
  if (!c.rituais || c.rituais.length === 0) {
    html += '<p class="meta" style="color:var(--muted)">Nenhum ritual aprendido ainda.</p>';
  }
  (c.rituais || []).forEach(function (r) {
    var el = getElemento(r.elemento);
    var cost = r.pe;
    var discount = c.elemento && r.elemento === c.elemento;
    if (discount) cost = Math.max(1, cost - 1);
    html += '<div class="ability"><div class="head">' +
      '<span class="name">' + esc(r.nome) + '</span>' +
      '<span class="pe">' + r.pe + ' PE</span></div>' +
      '<div class="desc">' + esc(r.desc || '') + '</div>' +
      '<div class="rowline" style="margin-top:6px;gap:8px;flex-wrap:wrap">' +
      '<span class="el-badge" style="border-color:' + el.color + ';color:' + el.color + '">' + esc(el.name) + '</span>' +
      '<span class="tag">' + r.circulo + 'º círculo</span>' +
      '<button class="btn small accent" onclick="castRitual(\'' + r.id + '\')">Conjurar (' + cost + ' PE)</button></div></div>';
  });
  html += '</div>';

  html += '<div class="card" style="background:var(--bg2)"><h3>Adicionar poder personalizado</h3>' +
    '<div class="form-grid">' +
    '<div class="field"><label>Nome</label><input id="abil-name" placeholder="Ex.: Lança de Medo"></div>' +
    '<div class="field"><label>Custo (PE)</label><input id="abil-pe" type="number" value="1" min="1" style="width:70px"></div></div>' +
    '<div class="field"><label>Descrição / efeito</label><textarea id="abil-desc" placeholder="Descreva o que o poder faz."></textarea></div>' +
    '<button class="btn accent" onclick="addAbility()">Adicionar</button>' +
    '<p class="meta" style="color:var(--muted)">Todo poder personalizado precisa custar PE (mín. 1) e há limite de 6 por ficha, para evitar desequilíbrio.</p></div>' +
    '</div>';
  return html;
}

function panelNotas() {
  var c = state.active;
  return '<div class="card"><h2>Notas e Histórico</h2>' +
    '<textarea id="char-notes" style="min-height:220px" placeholder="História, objetivos, itens de missão, contatos, qualquer coisa..." onchange="saveNotes(this.value)">' +
    esc(c.notes) + '</textarea>' +
    '<p class="meta" style="color:var(--muted)">Salvo automaticamente ao sair do campo.</p></div>';
}

/* ------------------------- Modals ------------------------- */

function openModal(html) {
  var root = document.getElementById('modal-root');
  root.innerHTML = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">' +
    '<div class="modal"><button class="btn small close" onclick="closeModal()">✕ Fechar</button>' + html + '</div></div>';
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

function modalInput(label, id, value, type) {
  return '<div class="field"><label>' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(value == null ? '' : value) + '"></div>';
}

function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.classList.add('hidden'); }, 2600);
}