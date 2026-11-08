/* Полные варианты ЕГЭ база 1–21: пачка, очереди прототипов, переключение, компактная печать.
   Остальная логика генератора и ручные подборки остаются в index.html. */
(function () {
    'use strict';

    window.egeVariantBatch = [];
    window.egeActiveVariantIndex = 0;
    window.egeGenerationMode = 'manual';
    let batchInProgress = false;
    let generationTimer = null;
    let cancelGeneration = null;

    window.egeResetVariants = function () {
        if (cancelGeneration) cancelGeneration();
        window.egeVariantBatch = [];
        window.egeActiveVariantIndex = 0;
        window.egeGenerationMode = 'manual';
        showBatchSwitcher();
    };

    function shuffledIndexes(length) {
        const result = Array.from({length}, (_, i) => i);
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    window.egeNormalizeVariantCount = function () {
        const input = document.getElementById('ege-variant-count');
        const raw = input ? Number(input.value) : 1;
        const count = Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.min(40, Math.round(raw))) : 1;
        if (input) input.value = String(count);
        return count;
    };

    function createPrototypeDecks() {
        return {prototypes: new Map(), tasks: new Map(), lastPrototype: new Map(), lastTask: new Map()};
    }

    function nextDeckEntry(key, available, queues, previous) {
        let deck = queues.get(key);
        if (!deck || !deck.length) {
            deck = shuffledIndexes(available.length).map(i => available[i]);
            // Новый цикл не должен сразу повторять последний элемент предыдущего.
            if (deck.length > 1 && deck[deck.length - 1] === previous) {
                const swap = deck.findIndex(v => v !== previous);
                if (swap >= 0) [deck[swap], deck[deck.length - 1]] = [deck[deck.length - 1], deck[swap]];
            }
            queues.set(key, deck);
        }
        return deck.pop();
    }

    function nextFullPick(tid, decks) {
        const data = window.database && window.database[tid];
        if (!data || !Array.isArray(data.prototypes)) return null;
        const eligible = data.prototypes
            .map((p, index) => ({p, index}))
            .filter(x => x.p && Array.isArray(x.p.tasks) && x.p.tasks.length > 0);
        if (!eligible.length) return null;
        const available = eligible.map(x => x.index);
        const protoIndex = nextDeckEntry(tid, available, decks.prototypes, decks.lastPrototype.get(tid));
        decks.lastPrototype.set(tid, protoIndex);
        const proto = data.prototypes[protoIndex];
        const taskDeckKey = tid + ':' + protoIndex;
        const indices = proto.tasks.map((_, i) => i);
        const taskIndex = nextDeckEntry(taskDeckKey, indices, decks.tasks, decks.lastTask.get(taskDeckKey));
        decks.lastTask.set(taskDeckKey, taskIndex);
        const task = proto.tasks[taskIndex];
        return {protoIndex, taskIndex, taskKey: String(task && (task.id ?? task.text ?? taskIndex))};
    }

    function copyPicks(picks) {
        return Object.fromEntries(Object.entries(picks || {}).map(([key, pick]) => [key, {...pick}]));
    }

    function captureEntry() {
        return {
            picks: copyPicks(window.randomVariantPicks),
            number: Number(window.randomVariantNumber) || 1,
            printHTML: currentPrintHTML,
            answersHTML: currentAnswersHTML,
            tasks: (window.currentGeneratedTasks || []).map(task => ({
                taskTid: task.taskTid, text: task.text, svg: task.svg,
                answer: String(task.answer ?? ''), part: task.part
            }))
        };
    }

    function showBatchSwitcher() {
        const el = document.getElementById('ege-variant-switch');
        if (!el) return;
        const batch = window.egeVariantBatch || [];
        if (batch.length <= 1) { el.style.display = 'none'; el.innerHTML = ''; return; }
        const active = window.egeActiveVariantIndex || 0;
        el.style.display = 'block';
        el.innerHTML = '<label for="ege-active-variant">Просмотр варианта</label>' +
            '<select id="ege-active-variant" onchange="egeSelectVariant(Number(this.value))">' +
            batch.map((_, i) => `<option value="${i}" ${i === active ? 'selected' : ''}>Вариант №${i + 1}</option>`).join('') +
            '</select><div class="ege-switch-note">Файл для печати (PDF) включает все ' + batch.length +
            ' вариантов подряд. Интерактивный файл, игра и презентация создаются для выбранного варианта.</div>';
    }

    function syncActiveEntry() {
        if (batchInProgress) return;
        const batch = window.egeVariantBatch;
        if (!Array.isArray(batch) || !batch.length || !window.randomVariantMode) return;
        const i = window.egeActiveVariantIndex || 0;
        if (!batch[i]) return;
        batch[i] = captureEntry();
        showBatchSwitcher();
    }

    window.egeSelectVariant = function (index) {
        const batch = window.egeVariantBatch || [];
        if (!Number.isInteger(index) || index < 0 || !batch[index] || batchInProgress) return;
        syncActiveEntry();
        window.egeActiveVariantIndex = index;
        window.randomVariantMode = true;
        window.randomVariantPicks = copyPicks(batch[index].picks);
        window.randomVariantNumber = index + 1;
        generateVariant({useRandomPicks:true});
        showBatchSwitcher();
    };

    function showGenerationError(err) {
        console.error(err);
        const board = document.getElementById('info-board');
        if (board) {
            board.style.display = 'block';
            board.textContent = 'Ошибка генерации: ' + (err && err.message ? err.message : String(err));
        }
    }

    window.safeGenerateVariant = function (event, requestedMode = 'manual') {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        if (batchInProgress) return;
        const full = requestedMode === 'full';
        if (!full && !Array.from(document.querySelectorAll('input[id^="count-"]'))
            .some(el => Number(el.value) > 0)) {
            alert('Сначала отметьте нужные задания. Для полного варианта 1–21 воспользуйтесь верхней панелью.');
            return;
        }
        const count = full ? window.egeNormalizeVariantCount() : 1;
        const button = event && event.currentTarget ? event.currentTarget :
            document.querySelector(full ? '.ege-fast-btn' : '#generation-controls .btn-generate');
        const originalLabel = button ? button.textContent : '';
        if (button) {button.disabled = true; button.textContent = `Генерирую 1 из ${count}…`;}
        window.egeVariantBatch = [];
        window.egeActiveVariantIndex = 0;
        window.egeGenerationMode = full ? 'full' : 'manual';
        showBatchSwitcher();
        batchInProgress = true;
        const decks = createPrototypeDecks();
        let current = 0;

        function finish() {
            clearTimeout(generationTimer);
            generationTimer = null;
            cancelGeneration = null;
            batchInProgress = false;
            if (button) { button.disabled = false; button.textContent = originalLabel; }
        }
        cancelGeneration = finish;

        function makeNext() {
            generationTimer = null;
            try {
                if (!full) {
                    generateVariant({useRandomPicks:false});
                    if (!window.currentGeneratedTasks || !window.currentGeneratedTasks.length)
                        throw Error('Не удалось собрать выбранные задания.');
                    finish();
                    document.getElementById('btn-group')?.scrollIntoView({behavior:'smooth', block:'start'});
                    return;
                }
                const picks = {};
                const missing = [];
                for (let n = 1; n <= 21; n++) {
                    const tid = 'task' + n;
                    const pick = nextFullPick(tid, decks);
                    if (pick) picks[tid] = pick;
                    else missing.push(n);
                }
                if (missing.length) {
                    throw Error('Не загружена база заданий № ' + missing.join(', ') +
                        '. Проверьте файлы task1.js–task21.js.');
                }
                window.randomVariantPicks = picks;
                window.randomVariantMode = true;
                window.randomVariantNumber = current + 1;
                generateVariant({useRandomPicks:true, silent:true});
                if ((window.currentGeneratedTasks || []).length !== 21)
                    throw Error('Вместо 21 задания сформировано ' + (window.currentGeneratedTasks || []).length);
                window.egeVariantBatch.push(captureEntry());
                current++;
                if (current < count) {
                    if (button) button.textContent = `Генерирую ${current + 1} из ${count}…`;
                    generationTimer = setTimeout(makeNext, 0);
                } else {
                    // Показываем первый вариант, как в панели ОГЭ. Соседние варианты
                    // сохраняются и печатаются в том же порядке.
                    window.egeActiveVariantIndex = 0;
                    window.randomVariantPicks = copyPicks(window.egeVariantBatch[0].picks);
                    window.randomVariantNumber = 1;
                    generateVariant({useRandomPicks:true});
                    window.egeVariantBatch[0] = captureEntry();
                    finish();
                    showBatchSwitcher();
                    document.getElementById('btn-group')?.scrollIntoView({behavior:'smooth', block:'start'});
                }
            } catch (err) {finish(); showGenerationError(err); showBatchSwitcher();}
        }
        generationTimer = setTimeout(makeNext, 0);
    };

    window.generateRandomVariant = function (event) {
        window.safeGenerateVariant(event, 'full');
    };

    const originalReplaceRandom = window.replaceRandomVariantTask;
    window.replaceRandomVariantTask = function (tid) {
        if (typeof originalReplaceRandom !== 'function') return;
        originalReplaceRandom(tid);
        syncActiveEntry();
    };

    window.egeSyncActiveEntry = syncActiveEntry;

    // Печать: берём сохранённый HTML каждого конкретного варианта,
    // а не генерируем задания заново при нажатии на кнопку.
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    }

    function getPrintEntries() {
        if (window.egeGenerationMode === 'full' && window.egeVariantBatch.length) {
            syncActiveEntry();
            return window.egeVariantBatch;
        }
        return currentPrintHTML ? [captureEntry()] : [];
    }

    function buildPrintVariant(entry, index, withFields) {
        const source = document.createElement('div');
        source.innerHTML = entry.printHTML || '';
        const taskNodes = [...source.querySelectorAll('.task-print-block')];
        if (!taskNodes.length) throw Error('Не найдены задания для печати в варианте №' + (index + 1));

        const teacherInput = document.getElementById('teacher-name');
        const teacherName = teacherInput ? teacherInput.value.trim() : '';
        const signature = document.getElementById('toggle-signature')?.checked && teacherName
            ? `<span class="ege-exam-teacher">Подготовил(а): ${escapeHtml(teacherName)}</span>` : '';
        const heading = window.egeGenerationMode === 'full' ? `Вариант №${index + 1}` : 'Тренировочный набор';
        const brand = '<span class="ege-exam-brand">Шкатулка математических интерактивов · <a href="https://shkatulka.sistema-math.ru/" target="_blank" rel="noopener noreferrer">https://shkatulka.sistema-math.ru/</a></span>';
        const headerHtml = `<header class="ege-exam-header"><strong>ЕГЭ · базовая математика</strong><span>Тренировочная работа</span></header>`;
        const variantIntro = `<div class="ege-exam-variant-banner">${heading}</div>`;

        // Статическая векторная сетка: полностью готова ДО пагинации и печати.
        // SVG без viewBox сохраняет настоящие квадратные клетки 5x5 мм при любой высоте поля.
        function makeGrid(taskNumber, solution) {
            const id = `ege-squares-${index + 1}-${taskNumber}`;
            const cell = '18.897638'; // 5 мм при 96 CSS px / inch
            return `<div class="ege-exam-grid ${solution ? 'ege-exam-grid-solution' : 'ege-exam-grid-answer'}" aria-label="Клетчатое поле для решения">
                <svg class="ege-grid-art" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
                    <defs><pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
                        <path d="M ${cell} 0 H 0 V ${cell}" fill="none" stroke="#a9cee8" stroke-width="0.75"/>
                    </pattern></defs>
                    <rect x="0.5" y="0.5" width="99.9%" height="99.9%" fill="white" stroke="none" rx="1.5"/>
                    <rect x="1" y="1" width="99.65%" height="99.65%" fill="url(#${id})"/>
                </svg>
            </div>`;
        }
        const footerHtml = `${brand}${signature}<span class="ege-page-no">Лист 1</span>`;
        const articleFooter = `<footer class="ege-exam-footer">${footerHtml}</footer>`;

        const tasks = taskNodes.map((task, i) => {
            const taskNumber = Number(entry.tasks && entry.tasks[i] &&
                String(entry.tasks[i].taskTid || '').replace(/\D/g, '')) || i + 1;
            const second = false;
            const fields = withFields ? makeGrid(taskNumber, false) : '';
            return {
                taskNumber,
                second,
                html: `<div class="ege-exam-unit${second ? ' ege-exam-unit-second' : ''}"><section class="ege-exam-task" data-exam-task="${taskNumber}">${task.innerHTML}${fields}</section></div>`
            };
        });

        // Базовый ЕГЭ: печатаем все 21 задания единым двухколоночным потоком.
        // Отдельных разворотов с задачами с развёрнутым ответом нет.
        const items = variantIntro + tasks.map(task => task.html).join('');
        return `<article class="ege-exam-page ege-flow-page" data-variant="${index + 1}">
            ${headerHtml}
            <div class="ege-exam-columns">
                <div class="ege-exam-column"><div class="ege-exam-column-content">${items}</div></div>
                <div class="ege-exam-column"><div class="ege-exam-column-content"></div></div>
            </div>
            ${articleFooter}
        </article>`;
    }

    function paginatePrintPages() {
        function relocate(page, original) {
            const clone = original.cloneNode(true);
            clone.querySelectorAll('.ege-exam-column-content').forEach(x => { x.innerHTML=''; });
            page.after(clone);
            return clone;
        }
        function rebalanceDrafts(page) {
            const columns = [...page.querySelectorAll('.ege-exam-column')];
            if (columns.length === 2) {
                const leftContent = columns[0].querySelector('.ege-exam-column-content');
                const rightContent = columns[1].querySelector('.ege-exam-column-content');
                if (leftContent && rightContent) {
                    const leftUnits = [...leftContent.children].filter(node => !node.classList.contains('ege-exam-variant-banner'));
                    if (!rightContent.children.length && leftUnits.length > 1) {
                        while (leftContent.scrollHeight > columns[0].clientHeight * 0.62 && leftUnits.length > 1) {
                            const move = leftContent.lastElementChild;
                            if (!move || move.classList.contains('ege-exam-variant-banner')) break;
                            rightContent.prepend(move);
                            leftUnits.pop();
                            if (rightContent.scrollHeight > columns[1].clientHeight) {
                                leftContent.appendChild(move);
                                break;
                            }
                            if (leftContent.scrollHeight <= rightContent.scrollHeight + 35) break;
                        }
                    }
                }
            }
            page.querySelectorAll('.ege-exam-column').forEach(column => {
                const content = column.querySelector('.ege-exam-column-content');
                if (!content) return;
                const grids = [...content.querySelectorAll('.ege-exam-grid-answer')];
                if (!grids.length) return;
                grids.forEach(grid => { grid.style.height = ''; });
                let free = column.clientHeight - content.scrollHeight;
                if (free > 6) {
                    const share = Math.floor(free / grids.length);
                    grids.forEach((grid, idx) => {
                        const base = grid.getBoundingClientRect().height;
                        const extra = share + (idx === grids.length - 1 ? free - share * grids.length : 0);
                        grid.style.height = Math.max(base + extra, base) + 'px';
                    });
                }
                const overflow = content.scrollHeight - column.clientHeight;
                if (overflow > 0) {
                    const last = grids[grids.length - 1];
                    const h = last.getBoundingClientRect().height;
                    last.style.height = Math.max(42, h - overflow - 2) + 'px';
                }
            });
        }

        const allRoots = [...document.querySelectorAll('.ege-flow-page')];
        allRoots.forEach(root => {
            const first = root.querySelector('.ege-exam-column-content');
            if (!first) return;
            const units = [...first.children];
            first.replaceChildren();
            const template = root.cloneNode(true);
            const pages = [root];
            let page = root, columnIndex = 0;
            const getColumns = () => [...page.querySelectorAll('.ege-exam-column')];
            const getContent = () => getColumns()[columnIndex].querySelector('.ege-exam-column-content');
            function fits() {
                return getContent().scrollHeight <= getColumns()[columnIndex].clientHeight - 2;
            }
            function advance() {
                if (columnIndex === 0) columnIndex = 1;
                else { page = relocate(page, template); pages.push(page); columnIndex = 0; }
            }
            units.forEach(unit => {
                getContent().appendChild(unit);
                if (fits()) return;
                unit.remove();
                advance();
                getContent().appendChild(unit);
                if (fits()) return;
                const inner = unit.querySelector('.ege-exam-task');
                for (const scale of [0.95, 0.9, 0.85, 0.8, 0.75]) {
                    if (fits()) break;
                    inner.style.setProperty('--ege-task-font', (10.6 * scale) + 'pt');
                    inner.style.setProperty('--ege-img-height', (36 * scale) + 'mm');
                }
                if (!fits()) console.warn('Печатное задание выше колонки: ', unit.dataset.examTask);
            });
            pages.forEach(p => {
                p.classList.remove('ege-flow-page');
                rebalanceDrafts(p);
            });
        });


        const variantIds = [...new Set([...document.querySelectorAll('.ege-exam-page[data-variant]')].map(page => page.dataset.variant))];
        variantIds.forEach(variantId => {
            const pages = [...document.querySelectorAll(`.ege-exam-page[data-variant="${variantId}"]`)];
            pages.forEach((page, i) => {
                const label = page.querySelector('.ege-page-no');
                if (label) label.textContent = 'Лист ' + (i + 1);
            });
        });
        document.body.classList.add('ege-print-ready');
    }

    function buildPrintKeys(entries) {
        if (window.egeGenerationMode !== 'full' || !entries.length ||
            !entries.every(e => e.tasks && e.tasks.length === 21)) return '';
        const sheets = [];
        for (let start = 0; start < entries.length; start += 4) {
            const group = entries.slice(start, start + 4);
            const columnHeads = group.map((_, i) => `<th>Вариант №${start + i + 1}</th>`).join('');
            const rows = Array.from({length:21}, (_, i) => {
                const cells = group.map(e => {
                    const task = e.tasks.find(t => Number(String(t.taskTid || '').replace(/\D/g,'')) === i + 1);
                    return `<td>${escapeHtml(task ? task.answer : '—')}</td>`;
                }).join('');
                return `<tr><th scope="row">${i + 1}</th>${cells}</tr>`;
            }).join('');
            sheets.push(`<article class="ege-exam-page ege-keys-page" aria-label="Ключи ответов">
                <header class="ege-exam-header"><strong>ЕГЭ · базовая математика</strong><strong>Ключи ответов</strong></header>
                <section class="ege-keys-content"><h1>Ответы к полным вариантам ЕГЭ</h1>
                <p>Варианты №${start + 1}–${start + group.length} · задания 1–21</p>
                <table><thead><tr><th>№ задания</th>${columnHeads}</tr></thead>
                <tbody>${rows}</tbody></table>
                <div class="ege-keys-note">Все 21 задания базового ЕГЭ проверяются по краткому ответу.</div></section>
                <footer class="ege-exam-footer"><span class="ege-exam-brand">Шкатулка математических интерактивов · <a href="https://shkatulka.sistema-math.ru/" target="_blank" rel="noopener noreferrer">https://shkatulka.sistema-math.ru/</a></span><span>Ключи ответов</span></footer>
            </article>`);
        }
        return sheets.join('');
    }

    function buildPrintDocument(entries, withFields) {
        const pages = entries.map((entry, i) => buildPrintVariant(entry, i, withFields)).join('\n') + buildPrintKeys(entries);
        const generatorAssetsBase = new URL('./', window.location.href).href
            .replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const printCSS = `
            @page{size:A4 landscape;margin:9mm 10mm 15mm;}
            *{box-sizing:border-box;}
            html,body{margin:0;padding:0;background:white;color:#111;font-family:"Times New Roman",Times,serif;}
            .ege-exam-page{width:277mm;height:181mm;max-height:181mm;margin:0;padding:0 0 11mm;overflow:hidden;position:relative;display:flex;flex-direction:column;break-after:page;page-break-after:always;}
            .ege-exam-page:last-child{break-after:auto;page-break-after:auto;}
            .ege-exam-header{height:9mm;flex:0 0 9mm;display:flex;justify-content:space-between;align-items:center;border-bottom:.45pt solid #8e9ba6;margin:0 0 3mm;font-size:10.1pt;letter-spacing:.08pt;color:#263640;}
            .ege-exam-header span{font-size:8.3pt;letter-spacing:.7pt;text-transform:uppercase;color:#707e8a;}
            .ege-exam-variant-banner{display:block;break-after:avoid;page-break-after:avoid;text-align:left;font-size:15.4pt;font-weight:700;letter-spacing:.1pt;color:#152d3d;line-height:1.25;margin:0 0 5mm;padding:0 0 2.1mm;border-bottom:.5pt solid #d4dce2;}
            .ege-exam-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:9mm;flex:1 1 auto;min-height:0;align-items:stretch;}
            .ege-exam-column{height:100%;min-height:0;min-width:0;overflow:hidden;}
            .ege-exam-column-content{display:flow-root;min-width:0;}
            .ege-exam-footer{position:absolute;left:0;right:0;bottom:2mm;height:7mm;min-height:7mm;border-top:.4pt solid #d8dee4;display:flex;align-items:center;justify-content:space-between;font-size:8.7pt;color:#334657;gap:3mm;background:white;}
            .ege-exam-brand{white-space:nowrap;}
            .ege-exam-footer a{color:#1f4b66;text-decoration:underline;text-decoration-color:#9aafbd;text-underline-offset:1pt;pointer-events:auto;}
            .ege-exam-teacher{flex:1 1 auto;text-align:center;overflow-wrap:anywhere;}
            .ege-exam-unit{break-inside:avoid;page-break-inside:avoid;display:flow-root;margin-bottom:2.7mm;}
            .ege-exam-task{font:var(--ege-task-font,10.6pt)/1.24 "Times New Roman",Times,serif;max-width:100%;overflow-wrap:break-word;}
            .ege-exam-task .task-print-flex{display:flex;align-items:flex-start;gap:2mm;min-width:0;}
            .ege-exam-task .task-print-num{font-size:11pt;font-weight:700;flex:0 0 7mm;width:7mm;white-space:nowrap;}
            .ege-exam-task .task-print-num::after{content:".";}
            .ege-exam-task .task-print-text{min-width:0;flex:1 1 auto;font-size:inherit;line-height:inherit;overflow-wrap:break-word;}
            .ege-exam-task .task-print-text p{margin:0 0 .85mm;line-height:inherit;}
            .ege-exam-task .task-print-text div{max-width:100%;}
            .ege-exam-task .task-print-answer{font-size:8.6pt;margin:.8mm 0 0!important;color:#444!important;}
            .ege-exam-task .task-print-img{flex:0 0 28%;width:28%;max-width:40mm;min-width:0;display:block;overflow:visible;}
            .ege-exam-task .task-print-img img,.ege-exam-task .task-print-img svg{display:block;width:100%;height:auto;max-width:100%;max-height:var(--ege-img-height,32mm);object-fit:contain;overflow:visible;}
            .ege-exam-task .task-print-text img,.ege-exam-task .task-print-text svg{display:block;max-width:100%!important;max-height:var(--ege-img-height,32mm)!important;width:auto!important;height:auto!important;object-fit:contain;margin:.8mm auto;overflow:visible;}
            .ege-exam-task img,.ege-exam-task svg{max-width:100%;}
            .ege-exam-task .sticker-print{position:static!important;transform:none!important;flex:0 0 18mm!important;width:18mm!important;max-width:18mm!important;min-width:0!important;margin:0!important;}
            .ege-exam-task .sticker-print img{width:100%;max-height:17mm;object-fit:contain;}
            .ege-exam-task .sticker-print div{font-size:6.5pt!important;line-height:1.04!important;}
            .ege-exam-task table{font-size:8.5pt;border-collapse:collapse;max-width:100%;}
            .ege-exam-task td,.ege-exam-task th{padding:.6mm;border:1px solid #777;}
            .ege-exam-task mjx-container{max-width:100%;font-size:97%!important;}
            /* Надёжная векторная клетка 5 × 5 мм — SVG находится в исходной HTML-разметке. */
            .ege-exam-grid{position:relative;display:block;box-sizing:border-box;min-width:0;overflow:hidden;border:1px solid #9bc2df;border-radius:2px;margin:2.2mm 0 0 7mm;background:white;}
            .ege-exam-grid > svg.ege-grid-art{position:absolute;inset:0;display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;overflow:hidden!important;}
            
            .ege-exam-grid-answer{height:17.8mm;}
            .ege-keys-content{flex:1 1 auto;min-height:0;padding:3mm 10mm 0;overflow:hidden;}
            .ege-keys-content h1{text-align:center;font-size:14pt;margin:0 0 2mm;}
            .ege-keys-content p{text-align:center;font-size:10pt;margin:0 0 3mm;}
            .ege-keys-content table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5pt;line-height:1.12;}
            .ege-keys-content th,.ege-keys-content td{border:.5pt solid #888;padding:1mm 1.5mm;vertical-align:middle;text-align:center;overflow-wrap:anywhere;}
            .ege-keys-content thead th{font-weight:700;background:#f5f5f5;}
            .ege-keys-content tbody th{font-weight:700;background:#fafafa;}
            .ege-keys-content tr{break-inside:avoid;page-break-inside:avoid;}
            .ege-keys-note{font-size:8pt;margin-top:3mm;color:#555;}
            .ege-print-ready .ege-exam-page{visibility:visible;}
            @media screen{body{background:#eef2f5;padding:15px;}.ege-exam-page{background:#fff;margin:0 auto 14px;box-shadow:0 5px 24px #0002;}}
            @media print{body{background:#fff;padding:0;print-color-adjust:exact;-webkit-print-color-adjust:exact;}.ege-exam-page{box-shadow:none!important;margin:0!important;}}
        `;
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>ЕГЭ · варианты для печати</title>
            <base href="${generatorAssetsBase}">
            <script>window.MathJax={tex:{inlineMath:[['$','$'],['\\\\(','\\\\)']],processEscapes:true,macros:{tg:'\\\\operatorname{tg}',ctg:'\\\\operatorname{ctg}',arctg:'\\\\operatorname{arctg}',arcctg:'\\\\operatorname{arcctg}'}},chtml:{adaptiveCSS:false}};<\/script>
            <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
            <style>${printCSS}</style></head><body class="${withFields ? 'ege-with-fields' : 'ege-compact'}">
            ${pages}<script>(async function(){try{if(window.MathJax&&MathJax.startup)await MathJax.startup.promise;
                await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;setTimeout(resolve,3500);})));}
                catch(e){console.error(e);} (${paginatePrintPages.toString()})();
                setTimeout(function(){window.print();},400);
            })();<\/script></body></html>`;
    }

    function printDownload(html, filename) {
        const file = new Blob([html], {type:'text/html;charset=utf-8'});
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    const originalSelectiveDownloadPrintPDF = window.downloadPrintPDF;

    function choosePrintMode() {
        document.getElementById('ege-print-dialog')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'ege-print-dialog';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147482000;background:#07111bc0;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
        const selective = window.egeGenerationMode !== 'full' || !window.egeVariantBatch.length;
        overlay.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="ege-print-title" style="background:white;color:#192b3c;width:min(510px,96vw);padding:25px;border:2px solid #ffb347;border-radius:14px;box-shadow:0 15px 55px #0006;font:15px/1.4 Arial,sans-serif;">
            <h2 id="ege-print-title" style="font-size:22px;margin:0 0 9px;color:#263849;">Как подготовить варианты к печати?</h2>
            <p style="margin:0 0 18px;color:#526474">${selective
                ? 'Выборочная сборка: прежний вертикальный A4 и исходное расположение заданий. С полями и без полей — одинаковый макет.'
                : 'Быстрые полные варианты: горизонтальный формат A4, две колонки, печать всей пачки.'}</p>
            <button data-ege-print="compact" style="display:block;width:100%;text-align:left;cursor:pointer;border:1px solid #ffcc80;border-radius:9px;background:#fff7e9;padding:13px 15px;margin-bottom:10px;font:inherit"><b>${selective ? 'Исходный вариант — без полей' : 'Компактный PDF — без полей для решения'}</b><small style="display:block;color:#666;margin-top:5px">${selective ? 'Прежняя выборочная печать без изменения ориентации и оформления.' : 'Компактная печать полных вариантов ЕГЭ.'}</small></button>
            <button data-ege-print="fields" style="display:block;width:100%;text-align:left;cursor:pointer;border:1px solid #b6cde0;border-radius:9px;background:#f4f9fe;padding:13px 15px;font:inherit"><b>С полями для решения</b><small style="display:block;color:#666;margin-top:5px">${selective ? 'Тот же вертикальный макет выборочной сборки: под выбранными заданиями добавляются квадратные клетчатые поля.' : 'Для всех 21 заданий поля распределяются автоматически по двухколоночному макету.'}</small></button>
            <div style="text-align:right;margin-top:14px"><button data-ege-cancel style="border:0;background:transparent;color:#526474;cursor:pointer;padding:7px;">Отмена</button></div></div>`;
        const close = () => {document.removeEventListener('keydown', onKey); overlay.remove();};
        const onKey = ev => {if (ev.key === 'Escape') close();};
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('click', ev => {if (ev.target === overlay || ev.target.closest('[data-ege-cancel]')) close();});
        overlay.querySelectorAll('[data-ege-print]').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.egePrint;
                close();
                requestAnimationFrame(() => window.downloadPrintPDF(mode));
            });
        });
        document.body.appendChild(overlay);
        overlay.querySelector('[data-ege-print="compact"]').focus();
    }

    window.downloadPrintPDF = function (mode) {
        if (!currentPrintHTML && !window.egeVariantBatch.length) {
            alert('Сначала сгенерируйте вариант!'); return;
        }
        if (mode !== 'compact' && mode !== 'fields') {choosePrintMode(); return;}
        // Ручная/выборочная сборка: неизменный исходный портретный шаблон.
        // Вторая кнопка лишь добавляет поля, но не переключает на макет пачки.
        if (window.egeGenerationMode !== 'full' || !window.egeVariantBatch.length) {
            return originalSelectiveDownloadPrintPDF(mode === 'fields');
        }
        try {
            const entries = getPrintEntries();
            const html = buildPrintDocument(entries, mode === 'fields');
            printDownload(html, 'ЕГЭ_Варианты_' + (mode === 'compact' ? 'Компактно' : 'С_полями') + '.html');
        } catch(err) {showGenerationError(err);}
    };

    // Для полной пачки единые ключи ко всем вариантам. Ручной набор продолжает
    // пользоваться исходной функцией скачивания ответов.
    const originalDownloadAnswers = window.downloadAnswers;
    window.downloadAnswers = function () {
        if (window.egeGenerationMode !== 'full' || !window.egeVariantBatch.length) {
            return originalDownloadAnswers();
        }
        syncActiveEntry();
        const batch = window.egeVariantBatch;
        const htmlRows = [];
        for (let start = 0; start < batch.length; start += 4) {
            const slice = batch.slice(start, start + 4);
            const columns = slice.map((_, i) => `<th>Вариант №${start + i + 1}</th>`).join('');
            const rows = Array.from({length:21}, (_, taskIndex) => `<tr><th>${taskIndex + 1}</th>${slice.map(v => {
                const task = v.tasks.find(t => Number(String(t.taskTid || '').replace(/\D/g, '')) === taskIndex + 1);
                return `<td>${escapeHtml(task ? task.answer : '—')}</td>`;
            }).join('')}</tr>`).join('');
            htmlRows.push(`<section><h2>Ответы к вариантам №${start + 1}–${start + slice.length}</h2><table><thead><tr><th>№</th>${columns}</tr></thead><tbody>${rows}</tbody></table></section>`);
        }
        const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>ЕГЭ · ключи</title>
            <style>@page{size:A4 landscape;margin:12mm}body{font:12pt/1.25 'Times New Roman',serif;color:#111;margin:15px}section{break-after:page;page-break-after:always}section:last-child{break-after:auto}h2{text-align:center;font-size:16pt}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:.6pt solid #888;padding:2mm;overflow-wrap:anywhere;text-align:center}thead th{background:#eee}td{font-size:10pt}</style></head><body>${htmlRows.join('')}<script>window.MathJax={tex:{inlineMath:[['$','$'],['\\\\(','\\\\)']]}};<\/script><script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script></body></html>`;
        printDownload(html, 'ЕГЭ_Ключи_к_' + batch.length + '_вариантам.html');
    };
})();
