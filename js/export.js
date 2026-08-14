'use strict';

function exportCharacter(c) {
  var blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ficha_' + (c.name || 'sem-nome').replace(/[^\w\-]+/g, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 300);
}

function importJSON(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !data.name) {
        toast('Arquivo inválido: ficha JSON não reconhecida.');
        return;
      }
      if (!data.id) data.id = uid();
      if (!data.owner) data.owner = state.user ? { id: state.user.id, name: state.user.name } : { id: 'local', name: 'Local' };
      if (!data.trainedSkills) data.trainedSkills = [];
      if (!data.items) data.items = [];
      if (!data.abilities) data.abilities = [];
      if (!data.log) data.log = [];
      if (!data.equipment) data.equipment = { weaponMain: 'desarmado', weaponOff: null, armor: 'nenhuma', accessory: null };
      if (!data.classId || !CLASSES[data.classId]) data.classId = 'combatente';
      data.diaCriacao = data.diaCriacao || new Date().toLocaleDateString('pt-BR');
      if (state.characters.some(function (c) { return c.id === data.id; })) data.id = uid();
      state.characters.push(data);
      saveState();
      render();
      toast('Ficha "' + data.name + '" importada!');
    } catch (e) {
      toast('Erro ao importar: ' + e.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function printSheet() {
  if (!state.active) {
    toast('Abra uma ficha primeiro para imprimir.');
    return;
  }
  window.print();
}