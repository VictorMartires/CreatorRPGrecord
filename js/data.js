'use strict';

const ATTRIBUTES = [
  { id: 'for', name: 'Força', short: 'FOR', desc: 'Força física, combate corpo a corpo, atletismo.' },
  { id: 'agi', name: 'Agilidade', short: 'AGI', desc: 'Reflexos, furtividade, armas de fogo e defesa.' },
  { id: 'int', name: 'Intelecto', short: 'INT', desc: 'Conhecimento, investigação, ocultismo e tecnologia.' },
  { id: 'pre', name: 'Presença', short: 'PRE', desc: 'Carisma, liderança, enganação e percepção social.' },
  { id: 'vig', name: 'Vigor', short: 'VIG', desc: 'Resistência física e quantidade de PV.' },
  { id: 'von', name: 'Vontade', short: 'VON', desc: 'Força mental, resistência e Sanidade.' }
];

const SKILLS = [
  { id: 'atletismo', name: 'Atletismo', attr: 'for' },
  { id: 'luta', name: 'Luta', attr: 'for' },
  { id: 'pontaria', name: 'Pontaria', attr: 'agi' },
  { id: 'reflexos', name: 'Reflexos', attr: 'agi' },
  { id: 'crime', name: 'Crime', attr: 'agi' },
  { id: 'furtividade', name: 'Furtividade', attr: 'agi' },
  { id: 'intimidar', name: 'Intimidar', attr: 'pre' },
  { id: 'diplomacia', name: 'Diplomacia', attr: 'pre' },
  { id: 'enganação', name: 'Enganação', attr: 'pre' },
  { id: 'investigação', name: 'Investigação', attr: 'int' },
  { id: 'ocultismo', name: 'Ocultismo', attr: 'int' },
  { id: 'ofício', name: 'Ofício', attr: 'int' },
  { id: 'tecnologia', name: 'Tecnologia', attr: 'int' },
  { id: 'medicina', name: 'Medicina', attr: 'int' },
  { id: 'percepção', name: 'Percepção', attr: 'int' },
  { id: 'sobrevivência', name: 'Sobrevivência', attr: 'vig' },
  { id: 'vontade', name: 'Vontade', attr: 'von' }
];

const ORIGINS = [
  { id: 'academico', name: 'Acadêmico', attr: 'int', skill: 'investigação', desc: '+1 Intelecto; Perícia Investigação treinada.' },
  { id: 'atleta', name: 'Atleta', attr: 'agi', skill: 'atletismo', desc: '+1 Agilidade; Perícia Atletismo treinada.' },
  { id: 'criminoso', name: 'Criminoso', attr: 'agi', skill: 'crime', desc: '+1 Agilidade; Perícia Crime treinada.' },
  { id: 'culto', name: 'Membro de Culto', attr: 'von', skill: 'ocultismo', desc: '+1 Vontade; Perícia Ocultismo treinada.' },
  { id: 'medico', name: 'Médico', attr: 'int', skill: 'medicina', desc: '+1 Intelecto; Perícia Medicina treinada.' },
  { id: 'militar', name: 'Militar', attr: 'for', skill: 'luta', desc: '+1 Força; Perícia Luta treinada.' },
  { id: 'operario', name: 'Operário', attr: 'vig', skill: 'atletismo', desc: '+1 Vigor; Perícia Atletismo treinada.' },
  { id: 'policial', name: 'Policial', attr: 'von', skill: 'investigação', desc: '+1 Vontade; Perícia Investigação treinada.' },
  { id: 'tecnico', name: 'Técnico', attr: 'int', skill: 'tecnologia', desc: '+1 Intelecto; Perícia Tecnologia treinada.' },
  { id: 'jornalista', name: 'Jornalista', attr: 'pre', skill: 'enganação', desc: '+1 Presença; Perícia Enganação treinada.' }
];

const CLASSES = {
  combatente: {
    id: 'combatente',
    name: 'Combatente',
    pvBase: 25,
    sanBase: 15,
    peBase: 3,
    trainings: 3,
    freeSkill: 'luta',
    desc: 'Mestre das armas e do combate. Forte em Força, Agilidade e Vigor.',
    abilities: [
      { id: 'ataque-extra', name: 'Ataque Extra', peCost: 2, desc: 'Faça um ataque extra com d20 + Força.' },
      { id: 'furia', name: 'Fúria', peCost: 2, desc: 'Obtém +2 em testes de Luta e Força por 2 rodadas.' },
      { id: 'golpe-certeiro', name: 'Golpe Certeiro', peCost: 3, desc: 'Seu próximo ataque causa +1d6 de dano.' },
      { id: 'postura-defensiva', name: 'Postura Defensiva', peCost: 2, desc: 'Ganha +2 na Defesa até o seu próximo turno.' }
    ]
  },
  especialista: {
    id: 'especialista',
    name: 'Especialista',
    pvBase: 20,
    sanBase: 15,
    peBase: 4,
    trainings: 4,
    freeSkill: 'reflexos',
    desc: 'Agente tático e versátil. Forte em Agilidade, Intelecto e Presença.',
    abilities: [
      { id: 'instinto-tatico', name: 'Instinto Tático', peCost: 1, desc: 'Ganha +2 na Defesa por 1 rodada.' },
      { id: 'alvo-analisado', name: 'Alvo Analisado', peCost: 1, desc: 'Seu próximo ataque recebe +5 no teste.' },
      { id: 'mente-agil', name: 'Mente Ágil', peCost: 2, desc: 'Realiza uma ação menor adicional neste turno.' },
      { id: 'ponto-fraco', name: 'Ponto Fraco', peCost: 3, desc: 'Seu próximo ataque ignora a Prevenção do alvo.' }
    ]
  },
  ocultista: {
    id: 'ocultista',
    name: 'Ocultista',
    pvBase: 15,
    sanBase: 20,
    peBase: 3,
    trainings: 2,
    freeSkill: 'ocultismo',
    desc: 'Manipulador do Paranormal. Forte em Intelecto e Vontade.',
    abilities: [
      { id: 'consumir-medo', name: 'Ritual: Consumir o Medo', peCost: 2, desc: 'Recupera 2d4 de Sanidade.' },
      { id: 'coincidencia', name: 'Ritual: Coincidência Forçada', peCost: 2, desc: 'Refaça uma rolagem de teste ou ataque.' },
      { id: 'escudo-medo', name: 'Ritual: Escudo do Medo', peCost: 2, desc: 'Obtém +5 em testes de Vontade nesta cena.' },
      { id: 'projetar', name: 'Ritual: Projetar Medo', peCost: 3, desc: 'Atordoa o alvo por 1 rodada.' }
    ]
  }
};

const WEAPONS = [
  { id: 'desarmado', name: 'Desarmado', dice: '1d3', crit: 20, attr: 'for', type: 'Corpo a corpo', props: 'Impacto' },
  { id: 'adaga', name: 'Adaga', dice: '1d4', crit: [19, 20], attr: 'for', type: 'Corpo a corpo', props: 'Leve, furtiva' },
  { id: 'faca', name: 'Faca de Combate', dice: '1d4', crit: [19, 20], attr: 'for', type: 'Corpo a corpo', props: 'Leve' },
  { id: 'porrete', name: 'Porrete', dice: '1d6', crit: 20, attr: 'for', type: 'Corpo a corpo', props: 'Impacto' },
  { id: 'espada', name: 'Espada', dice: '1d8', crit: [19, 20], attr: 'for', type: 'Corpo a corpo', props: 'Versátil' },
  { id: 'machado', name: 'Machado', dice: '1d10', crit: [19, 20], attr: 'for', type: 'Corpo a corpo', props: 'Pesado' },
  { id: 'revolver', name: 'Revólver', dice: '1d6', crit: 20, attr: 'agi', type: 'À distância', props: 'Mun. baixa', mun: 6 },
  { id: 'pistola', name: 'Pistola 9mm', dice: '1d8', crit: 20, attr: 'agi', type: 'À distância', props: 'Padrão', mun: 12 },
  { id: 'espingarda', name: 'Espingarda', dice: '1d10', crit: [19, 20], attr: 'agi', type: 'À distância', props: 'Pesada', mun: 2 },
  { id: 'rifle', name: 'Rifle de Ataque', dice: '1d10', crit: [19, 20], attr: 'agi', type: 'À distância', props: 'Longo alcance', mun: 30 },
  { id: 'submetralhadora', name: 'Submetralhadora', dice: '1d6', crit: [19, 20], attr: 'agi', type: 'À distância', props: 'Rápida', mun: 32 }
];

const ARMORS = [
  { id: 'nenhuma', name: 'Sem proteção', prev: 0 },
  { id: 'leve', name: 'Proteção Leve', prev: 1 },
  { id: 'kevlar', name: 'Colete de Kevlar', prev: 2 },
  { id: 'reforcado', name: 'Colete Reforçado', prev: 3 },
  { id: 'militar', name: 'Blindagem Militar', prev: 4 },
  { id: 'torna', name: 'Proteção Paranormal (Embrião)', prev: 5 }
];

const TRILHAS = {
  combatente: [
    { id: 'aniquilador', name: 'Aniquilador', desc: 'Domina armas pesadas e causa destruição brutal.', ability: { name: 'Ataque Brutal', peCost: 2, desc: 'Seu próximo ataque causa +1d6 de dano.' } },
    { id: 'guerreiro', name: 'Guerreiro', desc: 'Lutador versátil que ataca sem parar.', ability: { name: 'Investida', peCost: 2, desc: 'Faça um ataque extra com arma corpo a corpo.' } },
    { id: 'tropa-de-choque', name: 'Tropa de Choque', desc: 'Especialista em proteção e resistência.', ability: { name: 'Postura de Choque', peCost: 2, desc: 'Ganha +2 na Defesa até o seu próximo turno.' } }
  ],
  especialista: [
    { id: 'infiltrador', name: 'Infiltrador', desc: 'Mestre do subterfúgio e das sombras.', ability: { name: 'Oculto', peCost: 1, desc: 'Obtém +5 em Furtividade ou Crime por 1 cena.' } },
    { id: 'tatico', name: 'Tático', desc: 'Lê o campo de batalha antes de agir.', ability: { name: 'Instinto de Batalha', peCost: 2, desc: 'Ganha +2 na Iniciativa e +1 ação menor neste turno.' } },
    { id: 'negociador', name: 'Negociador', desc: 'Resolve conflitos com palavras.', ability: { name: 'Palavra Afiada', peCost: 1, desc: 'Obtém +5 em Diplomacia ou Intimidar por 1 cena.' } },
    { id: 'medico-de-campo', name: 'Médico de Campo', desc: 'Mantém a equipe viva no calor do combate.', ability: { name: 'Primeiros Socorros', peCost: 1, desc: 'Cura 2d6 de PV de um aliado.' } }
  ],
  ocultista: [
    { id: 'graduado', name: 'Graduado', desc: 'Estudioso dos rituais, conhece círculos mais altos.', ability: { name: 'Estudo Avançado', peCost: 2, desc: 'Recupera 1 PE ao aprender um novo ritual.' } },
    { id: 'conduit', name: 'Conduíte', desc: 'Seu corpo canaliza mais esforço paranormal.', ability: { name: 'Canalizar', peCost: 0, desc: 'Ganha +1 PE máximo por círculo alcançado.' } },
    { id: 'lamina-paranormal', name: 'Lâmina Paranormal', desc: 'Funde combate e ocultismo.', ability: { name: 'Lâmina Paranormal', peCost: 2, desc: 'Seu próximo ataque usa Intelecto e causa +1d6 de dano paranormal.' } },
    { id: 'possuido', name: 'Possuído', desc: 'Aliado e vítima da própria exposição.', ability: { name: 'Pacto do Medo', peCost: 2, desc: 'Obtém +5 em testes de Vontade por 1 cena.' } }
  ]
};

const ELEMENTOS = [
  { id: 'sangue', name: 'Sangue', color: '#d21f3c' },
  { id: 'morte', name: 'Morte', color: '#7a7a8c' },
  { id: 'conhecimento', name: 'Conhecimento', color: '#4a9df0' },
  { id: 'energia', name: 'Energia', color: '#f0c75e' },
  { id: 'medo', name: 'Medo', color: '#a05ff0' }
];

const RITUAIS = [
  { id: 'decifrar', nome: 'Decifrar', elemento: 'conhecimento', circulo: 1, pe: 1, desc: 'Lê mensagens, códigos e enigmas paranormais.' },
  { id: 'percepcao-paranormal', nome: 'Percepção Paranormal', elemento: 'conhecimento', circulo: 1, pe: 1, desc: 'Enxerga vestígios e sinais do Paranormal no ambiente.' },
  { id: 'armadura-conhecimento', nome: 'Armadura de Conhecimento', elemento: 'conhecimento', circulo: 1, pe: 2, desc: 'Ganha +2 na Defesa por 1 cena.' },
  { id: 'terceiro-olho', nome: 'Terceiro Olho', elemento: 'conhecimento', circulo: 2, pe: 3, desc: 'Obtém +5 em Percepção por 1 cena.' },
  { id: 'cintilante', nome: 'Cintilante', elemento: 'energia', circulo: 1, pe: 1, desc: 'Cria luz forte e calor em uma área pequena.' },
  { id: 'choque', nome: 'Choque', elemento: 'energia', circulo: 1, pe: 2, desc: 'Projeta eletricidade: 1d6 de dano.' },
  { id: 'eletrocussao', nome: 'Eletrocussão', elemento: 'energia', circulo: 2, pe: 3, desc: 'Dano de 3d6 em área.' },
  { id: 'salto', nome: 'Salto', elemento: 'energia', circulo: 1, pe: 1, desc: 'Impulso de energia que permite um salto maior.' },
  { id: 'conjurar-mortos', nome: 'Conjurar Mortos', elemento: 'morte', circulo: 1, pe: 2, desc: 'Cria um esqueleto que luta ao seu lado.' },
  { id: 'infusao-morte', nome: 'Infusão da Morte', elemento: 'morte', circulo: 1, pe: 2, desc: 'Seu próximo ataque causa +1d6 de dano de Morte.' },
  { id: 'analise-morte', nome: 'Análise da Morte', elemento: 'morte', circulo: 1, pe: 1, desc: 'Detecta cadáveres, rastros e vestígios de Morte.' },
  { id: 'vampirismo-morte', nome: 'Vampirismo da Morte', elemento: 'morte', circulo: 2, pe: 3, desc: 'Rouba 2d6 de PV do alvo e recupera metade.' },
  { id: 'decadencia', nome: 'Decadência', elemento: 'sangue', circulo: 1, pe: 2, desc: 'Enfraquece o alvo: -1d6 em testes de combate.' },
  { id: 'controle-sangue', nome: 'Controle do Sangue', elemento: 'sangue', circulo: 1, pe: 2, desc: 'Manipula o sangue do alvo, causando 1d6 de dano.' },
  { id: 'transfusao', nome: 'Transfusão de Sangue', elemento: 'sangue', circulo: 1, pe: 2, desc: 'Cura 2d6 de PV.' },
  { id: 'vampirismo-sangue', nome: 'Vampirismo de Sangue', elemento: 'sangue', circulo: 2, pe: 3, desc: 'Rouba 2d6 de PV do alvo e recupera metade.' },
  { id: 'projetar-medo', nome: 'Projetar Medo', elemento: 'medo', circulo: 1, pe: 2, desc: 'Atordoa o alvo por 1 rodada.' },
  { id: 'fortalecimento', nome: 'Fortalecimento', elemento: 'medo', circulo: 1, pe: 2, desc: 'Obtém +5 no seu próximo teste.' },
  { id: 'escuridao', nome: 'Escuridão', elemento: 'medo', circulo: 1, pe: 1, desc: 'Cobre uma área de escuridão sobrenatural.' },
  { id: 'tempestade-mental', nome: 'Tempestade Mental', elemento: 'medo', circulo: 2, pe: 3, desc: 'Causa 2d6 de dano mental (SAN).' }
];

function getElemento(id) {
  return ELEMENTOS.find(function (e) { return e.id === id; });
}

function getRitual(id) {
  return RITUAIS.find(function (r) { return r.id === id; });
}

function getTrilha(classId, trilhaId) {
  var list = TRILHAS[classId] || [];
  return list.find(function (t) { return t.id === trilhaId; }) || null;
}

const DEFAULT_ENEMIES = [
  { id: 'civil', name: 'Civil / Vítima de Medo', level: 0, pv: 10, defesa: 5, prevencao: 0, atk: 0, damage: '1d3', xp: 10, notes: 'Alvo humano comum.' },
  { id: 'bandido', name: 'Bandido', level: 1, pv: 15, defesa: 10, prevencao: 1, atk: 2, damage: '1d6', xp: 50, notes: 'Armado com faca.' },
  { id: 'cachorro', name: 'Cachorro Raivoso', level: 1, pv: 12, defesa: 10, prevencao: 0, atk: 3, damage: '1d4+1', xp: 40, notes: 'Criatura infiltrada.' },
  { id: 'agente-culto', name: 'Agente do Culto', level: 2, pv: 22, defesa: 12, prevencao: 1, atk: 4, damage: '1d6+1', xp: 90, notes: '' },
  { id: 'zumbi-sangue', name: 'Zumbi de Sangue', level: 4, pv: 40, defesa: 12, prevencao: 2, atk: 5, damage: '1d6+2', xp: 400, notes: 'Criatura de Sangue.' },
  { id: 'anarquista', name: 'Anarquista', level: 5, pv: 35, defesa: 14, prevencao: 3, atk: 6, damage: '1d8+2', xp: 500, notes: 'Combate com machado.' },
  { id: 'espectro', name: 'Espectro', level: 6, pv: 45, defesa: 16, prevencao: 0, atk: 5, damage: '1d8', xp: 650, sanDmg: '1d6', notes: 'Dano mental. Ignora prevenção.' },
  { id: 'sanguessuga', name: 'Sanguessuga de Medo', level: 8, pv: 60, defesa: 14, prevencao: 1, atk: 7, damage: '1d10+2', xp: 900, sanDmg: '1d6', notes: 'Criatura de Medo.' },
  { id: 'enraizado', name: 'Enraizado', level: 9, pv: 80, defesa: 13, prevencao: 4, atk: 7, damage: '2d6+3', xp: 1100, notes: 'Criatura de Sangue pesada.' },
  { id: 'besta-sangue', name: 'Besta de Sangue', level: 10, pv: 90, defesa: 15, prevencao: 3, atk: 8, damage: '2d6+4', xp: 1400, notes: 'Criatura voraz.' },
  { id: 'succubus', name: 'Succubus', level: 12, pv: 70, defesa: 18, prevencao: 2, atk: 9, damage: '2d6+2', xp: 1800, sanDmg: '2d6', notes: 'Manipuladora.' },
  { id: 'agarrador', name: 'Agarrador', level: 14, pv: 110, defesa: 16, prevencao: 4, atk: 10, damage: '3d6+3', xp: 2400, notes: 'Criatura de Conhecimento.' },
  { id: 'lobisomem', name: 'Lobisomem', level: 16, pv: 130, defesa: 18, prevencao: 4, atk: 11, damage: '3d6+5', xp: 3200, notes: 'Regenera 2 PV por rodada.' },
  { id: 'estrangerio', name: 'Estrangeiro (Mi-go)', level: 18, pv: 150, defesa: 19, prevencao: 3, atk: 12, damage: '3d8+4', xp: 4200, sanDmg: '3d6', notes: 'Criatura de Conhecimento.' }
];

const XPS_PER_LEVEL = 50;

function xpToReachLevel(level) {
  return XPS_PER_LEVEL * (level - 1) * level / 2;
}

function levelForXp(xp) {
  let level = 1;
  while (level < 20 && xp >= xpToReachLevel(level + 1)) level++;
  return level;
}