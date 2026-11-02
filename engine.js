/* Механизм выбора готовых задач: никаких автоматически сочинённых формулировок. */
(function (root) {
  'use strict';
  function shuffle(items, rng = Math.random) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function validate(bank) {
    if (!Array.isArray(bank) || bank.length !== 39) throw new Error('В банке первого задания должно быть 39 прототипов');
    const seen = new Set();
    for (const group of bank) {
      if (!group.prototype || !Array.isArray(group.analogues) || group.analogues.length > 7) throw new Error('Неверная структура прототипа ' + group.id);
      if (seen.has(group.id)) throw new Error('Дубликат ' + group.id);
      seen.add(group.id);
      if (group.prototype.id !== group.id) throw new Error('Несовпадение ID прототипа ' + group.id);
      const records = [group.prototype, ...group.analogues];
      for (const task of records) {
        if (typeof task.text !== 'string' || !task.text.trim() || typeof task.answer !== 'string' || !task.answer.trim()) throw new Error('Нет текста или ответа у ' + task.id);
      }
    }
    return true;
  }
  function pool(group, includePrototype) {
    return includePrototype ? [group.prototype, ...group.analogues] : group.analogues.slice();
  }
  function selectGroups(bank, selectedIds, includePrototype) {
    const ids = new Set(selectedIds);
    return bank.filter(group => ids.has(group.id) && pool(group, includePrototype).length > 0);
  }
  function variants(bank, selectedIds, count, includePrototype = true, rng = Math.random) {
    const groups = selectGroups(bank, selectedIds, includePrototype);
    if (!groups.length) throw new Error('Выберите прототипы, в которых есть доступные задачи.');
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Количество вариантов должно быть от 1 до 100.');
    const decks = new Map();
    let groupDeck = [];
    const result = [];
    for (let i = 0; i < count; i++) {
      if (!groupDeck.length) groupDeck = shuffle(groups, rng);
      const group = groupDeck.pop();
      let choices = decks.get(group.id) || [];
      if (!choices.length) choices = shuffle(pool(group, includePrototype), rng);
      const chosen = choices.pop();
      decks.set(group.id, choices);
      result.push({ kind: 'variant', number: i + 1, groupId: group.id, groupTitle: group.title, category: group.category, ...chosen });
    }
    return result;
  }
  function training(bank, selectedIds, perPrototype, includePrototype = true, rng = Math.random) {
    const groups = selectGroups(bank, selectedIds, includePrototype);
    if (!groups.length) throw new Error('Выберите прототипы, в которых есть доступные задачи.');
    if (perPrototype !== 'all' && (!Number.isInteger(perPrototype) || perPrototype < 1 || perPrototype > 8)) throw new Error('Количество задач на прототип должно быть от 1 до 8.');
    const result = [];
    for (const group of groups) {
      const all = shuffle(pool(group, includePrototype), rng);
      const quantity = perPrototype === 'all' ? all.length : Math.min(perPrototype, all.length);
      for (const item of all.slice(0, quantity)) {
        result.push({ kind: 'training', number: result.length + 1, groupId: group.id, groupTitle: group.title, category: group.category, ...item });
      }
    }
    return result;
  }
  const api = { shuffle, pool, selectGroups, validate, variants, training };
  root.EGE_GENERATOR_ENGINE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
