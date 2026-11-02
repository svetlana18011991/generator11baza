/* Интерфейс генератора ЕГЭ. Данные задания № 1 загружаются из ege_task1.js. */
(function () {
  'use strict';
  function init() {
    const bank = window.EGE_TASK_1;
    const engine = window.EGE_GENERATOR_ENGINE;
    const $ = id => document.getElementById(id);
    if (!bank || !engine) {
      $('error').textContent = 'Не удалось загрузить файлы ege_task1.js и engine.js. Проверьте содержимое архива.';
      return;
    }
    try { engine.validate(bank); } catch (err) { $('error').textContent = err.message; return; }
    const selected = new Set(bank.map(group => group.id));
    const categoryNames = [...new Set(bank.map(group => group.category))];
    let mode = 'variants';
    let generated = [];
    let showAnswers = false;

    const create = (tag, className, txt) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (txt !== undefined && txt !== null) node.textContent = String(txt);
      return node;
    };
    const plural = (n, forms) => {
      const m = n % 100, d = n % 10;
      return forms[m > 10 && m < 20 ? 2 : d === 1 ? 0 : d > 1 && d < 5 ? 1 : 2];
    };

    function renderNav() {
      for (let i = 1; i <= 21; i++) {
        const item = create('div', 'exam-nav-item ' + (i === 1 ? 'available' : 'locked'));
        const num = create('span', 'exam-nav-number', String(i).padStart(2, '0'));
        const label = create('span', 'exam-nav-label', i === 1 ? 'Простые текстовые задачи' : 'Задание № ' + i);
        const status = create('span', 'exam-status', i === 1 ? '✓' : '·');
        item.append(num, label, status);
        if (i === 1) item.setAttribute('aria-current', 'page');
        else item.title = 'Будет добавлено позже';
        $('exam-nav').append(item);
      }
    }
    function counts() {
      $('selected-count').textContent = `${selected.size} из ${bank.length}`;
      $('stat-protos').textContent = bank.length;
      $('stat-analogs').textContent = bank.reduce((sum, g) => sum + g.analogues.length, 0);
      $('stat-total').textContent = bank.reduce((sum, g) => sum + 1 + g.analogues.length, 0);
    }
    function catalogueCard(group) {
      const card = create('div', 'proto-card');
      const firstLine = create('div', 'proto-card-top');
      const label = create('label', 'proto-choice');
      const box = create('input'); box.type = 'checkbox'; box.checked = selected.has(group.id);
      box.setAttribute('aria-label', 'Выбрать прототип ' + group.id);
      box.addEventListener('change', () => {
        if (box.checked) selected.add(group.id); else selected.delete(group.id);
        card.classList.toggle('deselected', !box.checked); counts();
      });
      label.append(box, create('span', 'proto-id', group.id), create('span', 'proto-title', group.title));
      const tag = create('span', 'proto-count', `${group.analogues.length} ${plural(group.analogues.length, ['аналог', 'аналога', 'аналогов'])}`);
      firstLine.append(label, tag); card.append(firstLine);
      card.classList.toggle('deselected', !selected.has(group.id));
      card.append(create('p', 'proto-excerpt', group.prototype.text));
      const details = create('details', 'task-details');
      const summary = create('summary', '', 'Посмотреть формулировки и номера');
      details.append(summary);
      const list = create('div', 'task-detail-list');
      const all = [group.prototype, ...group.analogues];
      for (const task of all) {
        const item = create('div', 'task-detail-item');
        const top = create('div', 'task-detail-top');
        top.append(create('strong', '', task.id), create('span', '', task.sourceType === 'prototype' ? 'Прототип' : 'Аналог'));
        if (task.flags && task.flags.length) top.append(create('span', 'tiny-marker', task.flags.join(', ')));
        item.append(top, create('p', '', task.text));
        list.append(item);
      }
      details.append(list); card.append(details);
      return card;
    }
    function renderCatalog() {
      const q = $('search-proto').value.trim().toLocaleLowerCase('ru');
      const root = $('prototype-groups'); root.replaceChildren();
      let found = 0;
      for (const [index, category] of categoryNames.entries()) {
        const members = bank.filter(group => group.category === category && (!q || `${group.id} ${group.title} ${group.category} ${group.prototype.text}`.toLocaleLowerCase('ru').includes(q)));
        if (!members.length) continue;
        found += members.length;
        const groupDetails = create('details', 'category-details');
        groupDetails.open = Boolean(q) || index === 0;
        const header = create('summary', 'category-header');
        const title = create('span', 'category-header-name', category);
        const count = create('span', 'category-header-count', members.length + ' прот.');
        header.append(title, count); groupDetails.append(header);
        const content = create('div', 'category-content');
        const action = create('button', 'category-select', 'Выбрать весь раздел'); action.type = 'button';
        action.addEventListener('click', () => {
          for (const entry of members) selected.add(entry.id);
          renderCatalog(); counts();
        });
        content.append(action);
        for (const group of members) content.append(catalogueCard(group));
        groupDetails.append(content); root.append(groupDetails);
      }
      if (!found) root.append(create('p', 'no-find', 'Ничего не найдено. Измени поисковый запрос.'));
    }
    function switchMode(next) {
      mode = next;
      document.querySelectorAll('.mode-btn').forEach(btn => {
        const active = btn.dataset.mode === mode;
        btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active));
      });
      $('variant-options').classList.toggle('hidden', mode !== 'variants');
      $('training-options').classList.toggle('hidden', mode !== 'training');
      $('error').textContent = '';
    }
    function card(record) {
      const article = create('article', 'result-card');
      const hd = create('div', 'result-card-header');
      const left = create('strong', '', record.kind === 'variant' ? 'Вариант ' + record.number : 'Задача ' + record.number);
      hd.append(left);
      if ($('show-source').checked) hd.append(create('span', 'result-source', '№ ' + record.id));
      article.append(hd);
      article.append(create('div', 'result-statement', record.text));
      article.append(create('div', 'result-answer-line', 'Ответ: ____________________'));
      return article;
    }
    function renderResults() {
      const root = $('output'); root.replaceChildren();
      root.classList.remove('output-empty');
      $('output-actions').classList.toggle('hidden', generated.length === 0);
      $('answer-section').replaceChildren();
      if (mode === 'variants') {
        const list = create('div', 'result-grid');
        for (const item of generated) list.append(card(item));
        root.append(list);
        $('output-subtitle').textContent = `${generated.length} ${plural(generated.length, ['вариант', 'варианта', 'вариантов'])} · в каждом только задание № 1`;
      } else {
        let current = '';
        let block = null;
        for (const item of generated) {
          if (item.groupId !== current) {
            current = item.groupId;
            const section = create('section', 'training-section');
            const head = create('h3', 'training-heading', `Прототип ${item.groupId} · ${item.groupTitle}`);
            const collection = create('div', 'training-cards');
            section.append(head, collection); root.append(section); block = collection;
          }
          block.append(card(item));
        }
        $('output-subtitle').textContent = `${generated.length} ${plural(generated.length, ['задача', 'задачи', 'задач'])} из ${new Set(generated.map(r => r.groupId)).size} прототипов`;
      }
      const answerBlock = $('answer-section');
      answerBlock.append(create('h3', '', 'Ответы'));
      const answerGrid = create('div', 'answer-grid');
      generated.forEach(item => {
        const row = create('div', 'answer-entry');
        const label = item.kind === 'variant' ? `Вариант ${item.number}` : `Задача ${item.number}`;
        row.append(create('span', '', label), create('strong', '', item.answer));
        answerGrid.append(row);
      });
      answerBlock.append(answerGrid);
      answerBlock.classList.toggle('hidden', !showAnswers);
      $('toggle-answers').textContent = showAnswers ? 'Скрыть ответы' : 'Показать ответы';
      $('toggle-answers').setAttribute('aria-pressed', String(showAnswers));
    }
    function generate() {
      try {
        const ids = Array.from(selected);
        if (!ids.length) throw new Error('Выбери хотя бы один прототип.');
        const include = $('include-proto').checked;
        if (mode === 'variants') {
          const raw = Number($('variant-count').value);
          generated = engine.variants(bank, ids, raw, include);
        } else {
          const raw = $('training-count').value;
          generated = engine.training(bank, ids, raw === 'all' ? 'all' : Number(raw), include);
        }
        showAnswers = false;
        $('error').textContent = '';
        renderResults();
        $('output-panel').scrollIntoView({behavior: 'smooth', block: 'start'});
      } catch (err) { $('error').textContent = err.message; }
    }
    renderNav(); counts(); renderCatalog();
    $('select-all').addEventListener('click', () => { bank.forEach(g => selected.add(g.id)); counts(); renderCatalog(); });
    $('clear-all').addEventListener('click', () => { selected.clear(); counts(); renderCatalog(); });
    $('search-proto').addEventListener('input', renderCatalog);
    document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));
    document.querySelectorAll('.quantity-btn').forEach(btn => btn.addEventListener('click', () => {
      const field = $(btn.dataset.target); const delta = Number(btn.dataset.adjust);
      field.value = Math.max(1, Math.min(100, (Number(field.value) || 0) + delta));
    }));
    $('generate').addEventListener('click', generate);
    $('toggle-answers').addEventListener('click', () => { showAnswers = !showAnswers; renderResults(); });
    $('print').addEventListener('click', () => window.print());
    $('show-source').addEventListener('change', () => { if (generated.length) renderResults(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
