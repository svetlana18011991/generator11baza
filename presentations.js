// ===== Offline asset helper =====
if (!window.getEmbeddedAssetUrl) {
    window.getEmbeddedAssetUrl = function(name) {
        if (name && /^data:|^blob:|^https?:/i.test(String(name))) return name;
        return (window.EMBEDDED_ASSETS && window.EMBEDDED_ASSETS[name]) ? window.EMBEDDED_ASSETS[name] : ((window.ASSETS_URL || '') + name);
    };
}

// ==========================================
// ОБЩАЯ НАСТРОЙКА: показывать верный ответ при ошибке
// ==========================================
function getShowCorrectOnErrorSetting() {
    const toggle = document.getElementById('toggle-show-correct');
    if (toggle) return toggle.checked;

    if (window.presentationSettings && typeof window.presentationSettings.showCorrectOnError !== 'undefined') {
        return !!window.presentationSettings.showCorrectOnError;
    }

    if (window.generatorSettings && typeof window.generatorSettings.showCorrectOnError !== 'undefined') {
        return !!window.generatorSettings.showCorrectOnError;
    }

    return false;
}

// ==========================================
// СТАРТОВЫЙ ЭКРАН ПРЕЗЕНТАЦИИ
// Полный вариант ЕГЭ — короткая титульная заставка.
// Произвольная подборка — компактная сводка по типам заданий.
// ==========================================
function escapePresHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPresentationTaskNumber(task) {
    const match = String(task && task.taskTid || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

function isFullEgePresentation(tasks) {
    tasks = Array.isArray(tasks) ? tasks : [];
    if (!tasks.length) return false;

    // Кнопка «Сгенерировать случайный вариант» однозначно означает полный вариант.
    if (window.randomVariantMode || tasks.every(t => t && t.randomVariant)) return true;

    // Полный вариант может состоять из 19 или 20 основных заданий
    // (в проекте встречаются обе структуры). Главное: по одному заданию
    // каждого номера подряд, без дополнительных блоков и повторов.
    if (tasks.length !== 19 && tasks.length !== 20) return false;
    if (!tasks.every(t => !t.taskKind || t.taskKind === 'main')) return false;

    const nums = tasks.map(getPresentationTaskNumber).filter(Number.isFinite).sort((a, b) => a - b);
    if (nums.length !== tasks.length) return false;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== i + 1) return false;
    }
    return true;
}

function shortPresentationTopic(rawTitle, taskNumber, kind) {
    let title = String(rawTitle || '').trim();
    title = title.replace(/^Задание\s*\d+\s*[.\-–—:]?\s*/i, '');
    title = title.replace(/\s*\([^)]*(?:Решу\s*ЕГЭ|сайт)[^)]*\)\s*/gi, ' ');
    title = title.replace(/\s{2,}/g, ' ').trim();
    if (!title || /^Дополнительно$/i.test(title)) {
        return kind === 'extra' ? 'Дополнительные задания' : `Задание ${taskNumber || ''}`.trim();
    }
    return title;
}

function getPresentationStartInfo() {
    const tasks = Array.isArray(window.currentGeneratedTasks) ? window.currentGeneratedTasks : [];
    const fullVariant = isFullEgePresentation(tasks);
    if (fullVariant) {
        return { fullVariant: true, total: tasks.length, groups: [] };
    }

    const selectedTitles = Array.isArray(window.selectedBlockTitles) ? window.selectedBlockTitles : [];
    const groups = [];
    const byKey = new Map();
    let titleCursor = 0;
    let previousKey = null;

    tasks.forEach(task => {
        const num = getPresentationTaskNumber(task);
        const kind = (task && task.taskKind) || 'main';
        const key = `${task && task.taskTid || 'task'}|${kind}`;

        if (key !== previousKey) {
            previousKey = key;
            titleCursor++;
        }

        let group = byKey.get(key);
        if (!group) {
            const titleFromSelection = selectedTitles[Math.max(0, titleCursor - 1)] || '';
            const titleFromDatabase = task && task.taskTid && window.database && window.database[task.taskTid]
                ? window.database[task.taskTid].title
                : '';
            const rawTitle = kind === 'extra' ? titleFromSelection : (titleFromDatabase || titleFromSelection);
            group = {
                key,
                number: num,
                kind,
                title: shortPresentationTopic(rawTitle, num, kind),
                count: 0
            };
            byKey.set(key, group);
            groups.push(group);
        }
        group.count++;
    });

    // Фолбэк для старых сохранённых данных, где у задач ещё не было taskTid.
    if (!groups.length && selectedTitles.length) {
        selectedTitles.forEach((title, index) => {
            const m = String(title).match(/Задание\s*(\d+)/i);
            const num = m ? parseInt(m[1], 10) : null;
            groups.push({ number: num, kind: 'main', title: shortPresentationTopic(title, num, 'main'), count: 1 });
        });
    }

    return { fullVariant: false, total: tasks.length, groups };
}

function buildPresentationStartCardHtml(authorLine, accentColor) {
    const info = getPresentationStartInfo();
    const safeAccent = escapePresHtml(accentColor || '#ff8c00');
    const authorHtml = authorLine
        ? `<div class="pres-start-author">${authorLine}</div>`
        : '';
    const brandHtml = `<div class="pres-start-brand"><img src="${window.getEmbeddedAssetUrl('logo.png')}" class="logo-small" onerror="this.style.display='none'">Шкатулка математических интерактивов</div>`;

    if (info.fullVariant) {
        return `<div class="title-box pres-start-card pres-start-card-full" onclick="event.stopPropagation();">
            <div class="pres-start-kicker">Профильная математика</div>
            <h1 class="pres-start-main-title">Вариант ЕГЭ</h1>
            <div class="pres-start-rule" style="background:${safeAccent};"></div>
            ${authorHtml}
            ${brandHtml}
        </div>`;
    }

    const groups = info.groups || [];
    const gridClass = groups.length >= 13 ? 'pres-topic-grid pres-topic-grid-dense'
        : (groups.length >= 7 ? 'pres-topic-grid pres-topic-grid-mid' : 'pres-topic-grid');
    const chips = groups.map(group => {
        const number = Number.isFinite(group.number) ? `<b>№${group.number}</b> ` : '';
        const suffix = group.count > 1 ? `<span class="pres-topic-count">×${group.count}</span>` : '';
        const fullLabel = `${Number.isFinite(group.number) ? `№${group.number} ` : ''}${group.title}${group.count > 1 ? ` ×${group.count}` : ''}`;
        return `<div class="pres-topic-chip" title="${escapePresHtml(fullLabel)}"><span>${number}${escapePresHtml(group.title)}</span>${suffix}</div>`;
    }).join('');

    const totalText = `${info.total} ${info.total % 10 === 1 && info.total % 100 !== 11 ? 'задание' : ([2,3,4].includes(info.total % 10) && ![12,13,14].includes(info.total % 100) ? 'задания' : 'заданий')}`;
    return `<div class="title-box pres-start-card pres-start-card-selection" onclick="event.stopPropagation();">
        <div class="pres-start-kicker">Профильная математика</div>
        <h1 class="pres-start-selection-title">Подборка заданий</h1>
        <div class="pres-start-meta" style="border-color:${safeAccent};color:${safeAccent};">${totalText}</div>
        <div class="${gridClass}">${chips}</div>
        ${authorHtml}
        ${brandHtml}
    </div>`;
}



// ==========================================
// ЧЕРНОВИК В ПРЕЗЕНТАЦИЯХ: чертёж на белой подложке
// ==========================================

function isSecondPartPresentationTask(task) {
    return !!(task && (task.isSecondPart || Number(task.part || 1) >= 2));
}

function escapePresJsSingle(value) {
    return String(value == null ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r?\n/g, ' ');
}

function buildPresentationControls(task, index, options) {
    options = options || {};
    const accent = options.accent || '#ff8c00';
    const instantCheck = !!options.instantCheck;
    const showCorrectOnError = !!options.showCorrectOnError;
    const showSolutions = options.showSolutions !== false;
    const drawButton = `<button class="btn-settings" style="background:#fff;color:${accent};border:1px solid ${accent};font-size:20px;padding:8px 12px;border-radius:10px;cursor:pointer;" onclick="event.stopPropagation(); window.toggleCanvas('pres-${index}')" title="Открыть черновик">✏️</button>`;

    if (isSecondPartPresentationTask(task)) {
        return `<div class="pres-check-zone pres-second-part-zone" style="display:flex;gap:12px;justify-content:center;align-items:center;width:100%;flex-wrap:wrap;flex-shrink:0;">
            ${instantCheck ? `<button type="button" id="pres-second-answer-btn-${index}" onclick="event.stopPropagation(); showSecondPartPresAnswer(${index})" style="background:#e8f5e9;color:#1b5e20;border:1px solid #4CAF50;border-radius:10px;font-size:16px;font-weight:bold;padding:9px 13px;cursor:pointer;">Показать ответ</button>` : ''}
            <button type="button" onclick="event.stopPropagation(); window.openTheoryModalLocal('theory-pres-${index}')" style="background:#e3f2fd;color:#003399;border:1px solid #90caf9;border-radius:10px;font-size:16px;font-weight:bold;padding:9px 13px;cursor:pointer;">🔁 Аналоги</button>
            <button type="button" class="pres-next-btn" onclick="event.stopPropagation(); nextSlide()" style="background:${accent};color:#fff;border:none;border-radius:10px;font-size:18px;font-weight:bold;padding:10px 24px;cursor:pointer;">Далее →</button>
            ${drawButton}
            <div id="pres-second-answer-${index}" style="display:none;width:100%;margin-top:4px;padding:10px 12px;background:#eef6ff;border-left:4px solid #003399;border-radius:7px;color:#222;text-align:left;"><b>Ответ:</b> ${task.answer || ''}</div>
        </div><div id="pres-status-${index}" class="pres-status" style="margin-top:10px;min-height:28px;font-size:18px;font-weight:bold;text-align:center;"></div>`;
    }

    const answerJs = escapePresJsSingle(task && task.answer);
    return `<div class="pres-check-zone" style="display:flex;gap:12px;justify-content:center;align-items:center;width:100%;flex-wrap:wrap;flex-shrink:0;">
        <input type="text" class="pres-input" placeholder="Ответ..." id="ans-${index}" style="font-size:1.1em;padding:12px 20px;width:180px;border-radius:10px;border:2px solid ${accent};text-align:center;outline:none;">
        <div id="pres-feedback-${index}" class="pres-feedback" style="width:100%;text-align:center;font-weight:bold;min-height:24px;display:none;"></div>
        ${instantCheck ? `<button class="pres-btn-instant" onclick="checkPresSingle(${index}, '${answerJs}', this, ${showCorrectOnError})" style="background:#e8f5e9;border:1px solid #4CAF50;border-radius:10px;font-size:18px;cursor:pointer;padding:8px 12px;outline:none;box-shadow:0 4px 10px rgba(76,175,80,.2);" title="Проверить">✅</button>` : ''}
        ${showSolutions && task && task.theory && String(task.theory).trim() !== '' ? `<button id="pres-help-${index}" class="btn-settings" style="display:none;background:#e3f2fd;color:#003399;border:1px solid #90caf9;font-size:16px;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:bold;" onclick="event.stopPropagation(); window.openTheoryModalLocal('theory-pres-${index}')" title="Открыть разбор">💡 Разбор</button>` : ''}
        <button class="pres-btn" onclick="submitTask(${index}, '${answerJs}')" data-correct="${escapePresAttr(task && task.answer)}" style="font-size:1.1em;padding:12px 30px;border-radius:10px;border:none;background:${accent};color:white;cursor:pointer;font-weight:bold;">ОК</button>
        ${drawButton}
    </div><div id="pres-status-${index}" class="pres-status" style="margin-top:10px;min-height:28px;font-size:18px;font-weight:bold;text-align:center;"></div>`;
}

function buildPresentationHiddenData(tasks) {
    const showAnswers = getShowCorrectOnErrorSetting();
    return (tasks || []).map((task, index) => {
        let content = task.theory || '';
        if (isSecondPartPresentationTask(task)) {
            const code = task.prototypeCode ? ` — прототип ${task.prototypeCode}` : '';
            const title = task.prototypeTitle || 'Похожие задания';
            const analogs = Array.isArray(task.analogs) ? task.analogs : [];
            content = `<h3 style="margin-top:0;color:#003399;">Аналоги${code}</h3><div style="color:#555;margin-bottom:14px;">${title}</div>`;
            if (!analogs.length) {
                content += `<div style="padding:14px;background:#f5f5f5;border-radius:8px;">Все задания этого прототипа уже вошли в текущий вариант.</div>`;
            } else {
                content += '<ol style="padding-left:24px;">';
                analogs.forEach(a => {
                    content += `<li style="margin-bottom:20px;"><div>${a.text || ''}</div>`;
                    if (showAnswers) content += `<div style="margin-top:8px;padding:9px 12px;background:#eef6ff;border-left:3px solid #003399;border-radius:5px;"><b>Ответ:</b> ${a.answer || ''}</div>`;
                    content += '</li>';
                });
                content += '</ol>';
            }
        }
        return `<div id="theory-pres-${index}" style="display:none;">${encodeURIComponent(content)}</div>`;
    }).join('');
}

function getPresentationDraftDiagramHtml(task) {
    function firstVisualFromHtml(html) {
        if (!html || !String(html).trim()) return '';
        try {
            const box = document.createElement('div');
            box.innerHTML = String(html);
            const visual = box.querySelector('svg, img, picture, canvas');
            return visual ? visual.outerHTML : '';
        } catch (e) {
            return '';
        }
    }

    let visualHtml = '';
    if (task && task.svg && String(task.svg).trim() !== '') {
        visualHtml = firstVisualFromHtml(task.svg) || String(task.svg);
    }
    if (!visualHtml && task && task.text) {
        visualHtml = firstVisualFromHtml(task.text);
    }
    if (!visualHtml) return '';

    return `<div class="pres-draft-diagram" aria-hidden="true"><div class="pres-draft-diagram-inner">${visualHtml}</div></div>`;
}

// ==========================================
// АВТОРСКИЙ СТИЛЬ 1 (Оранжевый неон)
// ==========================================
function generatePresentation1() {
    let teacherName = document.getElementById('teacher-name').value.trim();
    let authorLine = "";
    if (document.getElementById('toggle-signature').checked && teacherName) {
        let verb = (document.getElementById('teacher-gender').value === 'male') ? 'подготовил' : 'подготовила';
        authorLine = `Вариант ${verb}: ${teacherName}`;
    }

    let showSolutions = document.getElementById('toggle-explanations') ? document.getElementById('toggle-explanations').checked : true;
    let instantCheck = document.getElementById('toggle-instant-check') ? document.getElementById('toggle-instant-check').checked : false;
    let showCorrectOnError = getShowCorrectOnErrorSetting();

    let topicsList = window.selectedBlockTitles.map(t => `<li style="margin-bottom: 10px;">${t}</li>`).join('');

    // Размеры карточки первого шаблона. Раньше эти переменные не были объявлены,
    // из-за чего generatePresentation1() падала с ReferenceError при клике.
    const panelTop = '15%';
    const panelBottom = '15%';
    
    let taskSlides = window.currentGeneratedTasks.map((t, i) => `
        <div class="slide task-slide" style="background-image: url('${window.getEmbeddedAssetUrl('p2.jpg')}')">
            <div class="header-plate" style="position: absolute; top: calc(15% - 107px); left: 70%; transform: translateX(-50%); width: calc(351px * 0.64); height: calc(220px * 0.64); background: url('${window.getEmbeddedAssetUrl('p3.jpg')}') center/100% 100% no-repeat; display: flex; justify-content: center; align-items: center; z-index: 30;">
                <h3 style="font-family: 'Caveat', cursive; font-size: calc(39px * 0.64); color: #333; margin: 0; padding-bottom: 5px;">Задание ${i+1}</h3>
            </div>
            
            <div class="task-right-side ${t.svg && String(t.svg).trim() !== "" ? 'task-card-visual' : 'task-card-text-only'}" style="position: absolute; right: 5%; top: ${panelTop}; bottom: ${panelBottom}; width: 50%; background: rgba(255,255,255,0.95); padding: 20px 30px; border-radius: 15px; box-shadow: 0 0 25px #ff8c00, inset 0 0 15px #ff8c00; border: 2px solid #ff8c00; overflow: hidden; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    ${t.svg ? `<div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center; width: 100%; flex-shrink: 1; min-height: 0;" class="svg-wrapper">${t.svg}</div>` : ""}
                    <div class="task-text" style="margin-bottom: 20px; text-align: center; color: #333; width: 100%; flex-shrink: 1; overflow-y: auto;">${t.text}</div>
                    ${buildPresentationControls(t, i, {accent:'#ff8c00', instantCheck, showCorrectOnError, showSolutions})}

                </div>
            </div>

            <div id="draw-wrapper-pres-${i}" style="display:none; position: absolute; left: 5%; top: ${panelTop}; width: 40%; height: calc(100% - ${panelTop} - ${panelBottom}); background: rgba(255,255,255,0.95); border: 2px solid #ff8c00; border-radius: 15px; padding: 20px; box-shadow: 0 0 25px rgba(0,0,0,0.2); box-sizing: border-box; z-index: 20;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; margin-bottom: 8px; background: #e3f2fd; padding: 6px 10px; border-radius: 8px; border: 1px solid #bbdefb; min-height:34px; box-sizing:border-box; overflow:hidden; color: #333;">
                    <button onclick="window.setTool('pres-${i}', 'pointer')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Указатель (Перетаскивание)">👆</button>
                    <button onclick="window.setTool('pres-${i}', 'pen')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Карандаш">🖊️</button>
                    <button onclick="window.setTool('pres-${i}', 'highlighter')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Выделитель — полупрозрачный маркер">🖍️</button>
                    <button onclick="if(window.undoCanvas) window.undoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Отменить действие">↶</button>
                    <button onclick="if(window.redoCanvas) window.redoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Повторить действие">↷</button>
                    <select id="tool-select-pres-${i}" onchange="window.setTool('pres-${i}', this.value)" style="background: #fff; border: 1px solid #90caf9; border-radius: 4px; padding: 4px 8px; font-size: 13px; cursor: pointer; outline: none; max-width:150px; flex:0 1 150px; color: #003399; font-weight: 500;">
                        <option value="" disabled selected hidden>🔺 Фигуры</option>
                        <option value="line">📏 Прямая</option>
                        <option value="vector">↗️ Вектор</option>
                        <option value="circle">⭕ Окружность</option>
                        <option value="triangle">🔺 Треугольник</option>
                        <option value="cylinder">🛢️ Цилиндр</option>
                        <option value="cone">🍦 Конус</option>
                        <option value="sphere">🔮 Сфера</option>
                    </select>
                    <input type="color" id="color-pres-${i}" value="#003399" style="cursor:pointer; height: 28px; width: 32px; flex:0 0 auto; border: none; background: transparent; padding: 0;">
                    <input type="range" id="size-pres-${i}" min="1" max="15" step="0.1" value="2" style="cursor:pointer; width: 58px; flex:0 0 58px;">
                    <button onclick="window.setTool('pres-${i}', 'eraser')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Ластик">🧽</button>
                    <button onclick="window.clearCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Очистить всё">🗑️</button>
                    <div style="flex-grow:1; min-width:0;"></div>
                    <input type="hidden" id="tool-pres-${i}" value="pen">
                </div>
                <div class="pres-canvas-box" style="position:relative; background-color: #fff; background-size: 20px 20px; background-image: linear-gradient(to right, #d2e3f2 1px, transparent 1px), linear-gradient(to bottom, #d2e3f2 1px, transparent 1px); border: 2px solid #bbdefb; border-radius: 8px; overflow: hidden; height: calc(100% - 52px); min-height: 250px;">${getPresentationDraftDiagramHtml(t)}<canvas id="canvas-pres-${i}" style="position:absolute; inset:0; z-index:2; display:block; width:100%; height:100%; touch-action: none; cursor: crosshair; background: transparent;"></canvas></div>
            </div>
            <div class="pres-footer" style="position: absolute; bottom: 30px; left: 70px; font-family: 'Caveat'; font-size: 26px; color: #555;">Шкатулка математических интерактивов</div>
        </div>
    `).join('');

    let hiddenTheories = buildPresentationHiddenData(window.currentGeneratedTasks);
    generateAndDownloadPresentationHTML(taskSlides, hiddenTheories, authorLine, topicsList, "Презентация_Урока_Стиль1.html", 'p1.jpg', 'p2.jpg', '#ff8c00');
}

// ==========================================
// АВТОРСКИЙ СТИЛЬ 2 (Розовый неон)
// ==========================================
function generatePresentation2() {
    let teacherName = document.getElementById('teacher-name').value.trim();
    let authorLine = "";
    if (document.getElementById('toggle-signature').checked && teacherName) {
        let verb = (document.getElementById('teacher-gender').value === 'male') ? 'подготовил' : 'подготовила';
        authorLine = `Вариант ${verb}: ${teacherName}`;
    }

    let showSolutions = document.getElementById('toggle-explanations') ? document.getElementById('toggle-explanations').checked : true;
    let instantCheck = document.getElementById('toggle-instant-check') ? document.getElementById('toggle-instant-check').checked : false;
    let showCorrectOnError = getShowCorrectOnErrorSetting();

    let topicsList = window.selectedBlockTitles.map(t => `<li style="margin-bottom: 10px;">${t}</li>`).join('');
    
    let taskSlides = window.currentGeneratedTasks.map((t, i) => `
        <div class="slide task-slide" style="background-image: url('${window.getEmbeddedAssetUrl('f2.png')}')">
            <div class="header-plate" style="position: absolute; top: calc(15% - 107px); left: 70%; transform: translateX(-50%); width: calc(351px * 0.64); height: calc(220px * 0.64); background: url('${window.ASSETS_URL}f4.png') center/100% 100% no-repeat; display: flex; justify-content: center; align-items: center; z-index: 30;">
                <h3 style="font-family: 'Caveat', cursive; font-size: calc(39px * 0.64); color: #333; margin: 0; padding-bottom: 5px;">Задание ${i+1}</h3>
            </div>
            
            <div class="task-right-side ${t.svg && String(t.svg).trim() !== "" ? 'task-card-visual' : 'task-card-text-only'}" style="position: absolute; right: 5%; top: 15%; bottom: 15%; width: 50%; background: rgba(255,255,255,0.95); padding: 20px 30px; border-radius: 20px; box-shadow: 0 0 25px #ff4081, inset 0 0 15px #ff4081; border: 2px solid #ff4081; overflow: hidden; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    ${t.svg ? `<div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center; width: 100%; flex-shrink: 1; min-height: 0;" class="svg-wrapper">${t.svg}</div>` : ""}
                    <div class="task-text" style="margin-bottom: 20px; text-align: center; color: #333; width: 100%; flex-shrink: 1; overflow-y: auto;">${t.text}</div>
                    ${buildPresentationControls(t, i, {accent:'#ff4081', instantCheck, showCorrectOnError, showSolutions})}

                </div>
            </div>

            <div id="draw-wrapper-pres-${i}" style="display:none; position: absolute; left: 5%; top: 15%; width: 40%; height: 70%; background: rgba(255,255,255,0.95); border: 2px solid #ff4081; border-radius: 20px; padding: 20px; box-shadow: 0 15px 40px rgba(255,64,129,0.15); box-sizing: border-box; z-index: 20;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; margin-bottom: 8px; background: #fce4ec; padding: 6px 10px; border-radius: 12px; border: 1px solid #f8bbd0; min-height:34px; box-sizing:border-box; overflow:hidden; color: #333;">
                    <button onclick="window.setTool('pres-${i}', 'pointer')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Указатель (Перетаскивание)">👆</button>
                    <button onclick="window.setTool('pres-${i}', 'pen')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Карандаш">🖊️</button>
                    <button onclick="window.setTool('pres-${i}', 'highlighter')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Выделитель — полупрозрачный маркер">🖍️</button>
                    <button onclick="if(window.undoCanvas) window.undoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Отменить действие">↶</button>
                    <button onclick="if(window.redoCanvas) window.redoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Повторить действие">↷</button>
                    <select id="tool-select-pres-${i}" onchange="window.setTool('pres-${i}', this.value)" style="background: #fff; border: 1px solid #f48fb1; border-radius: 8px; padding: 4px 8px; font-size: 13px; cursor: pointer; outline: none; max-width:150px; flex:0 1 150px; color: #d81b60; font-weight: 500;">
                        <option value="" disabled selected hidden>🔺 Фигуры</option>
                        <option value="line">📏 Прямая</option>
                        <option value="vector">↗️ Вектор</option>
                        <option value="circle">⭕ Окружность</option>
                        <option value="triangle">🔺 Треугольник</option>
                        <option value="cylinder">🛢️ Цилиндр</option>
                        <option value="cone">🍦 Конус</option>
                        <option value="sphere">🔮 Сфера</option>
                    </select>
                    <input type="color" id="color-pres-${i}" value="#d81b60" style="cursor:pointer; height: 28px; width: 32px; flex:0 0 auto; border: none; background: transparent; padding: 0;">
                    <input type="range" id="size-pres-${i}" min="1" max="15" step="0.1" value="2" style="cursor:pointer; width: 58px; flex:0 0 58px;">
                    <button onclick="window.setTool('pres-${i}', 'eraser')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Ластик">🧽</button>
                    <button onclick="window.clearCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Очистить всё">🗑️</button>
                    <div style="flex-grow:1; min-width:0;"></div>
                    <input type="hidden" id="tool-pres-${i}" value="pen">
                </div>
                <div class="pres-canvas-box" style="position:relative; background-color: #fff; background-size: 20px 20px; background-image: linear-gradient(to right, #fce4ec 1px, transparent 1px), linear-gradient(to bottom, #fce4ec 1px, transparent 1px); border: 2px solid #f8bbd0; border-radius: 12px; overflow: hidden; height: calc(100% - 52px); min-height: 250px;">${getPresentationDraftDiagramHtml(t)}<canvas id="canvas-pres-${i}" style="position:absolute; inset:0; z-index:2; display:block; width:100%; height:100%; touch-action: none; cursor: crosshair; background: transparent;"></canvas></div>
            </div>
            <div class="pres-footer" style="position: absolute; bottom: 30px; left: 70px; font-family: 'Caveat'; font-size: 26px; color: #555;">Шкатулка математических интерактивов</div>
        </div>
    `).join('');

    let hiddenTheories = buildPresentationHiddenData(window.currentGeneratedTasks);
    generateAndDownloadPresentationHTML(taskSlides, hiddenTheories, authorLine, topicsList, "Презентация_Урока_Стиль2.html", 'f1.png', 'f2.png', '#ff4081');
}

// ==========================================
// АВТОРСКИЙ СТИЛЬ 3 (Фиолетовый неон, без плашки)
// ==========================================
function generatePresentation3() {
    let teacherName = document.getElementById('teacher-name').value.trim();
    let authorLine = "";
    if (document.getElementById('toggle-signature').checked && teacherName) {
        let verb = (document.getElementById('teacher-gender').value === 'male') ? 'подготовил' : 'подготовила';
        authorLine = `Вариант ${verb}: ${teacherName}`;
    }

    let showSolutions = document.getElementById('toggle-explanations') ? document.getElementById('toggle-explanations').checked : true;
    let instantCheck = document.getElementById('toggle-instant-check') ? document.getElementById('toggle-instant-check').checked : false;
    let showCorrectOnError = getShowCorrectOnErrorSetting();

    let topicsList = window.selectedBlockTitles.map(t => `<li style="margin-bottom: 10px;">${t}</li>`).join('');
    
    let taskSlides = window.currentGeneratedTasks.map((t, i) => `
        <div class="slide task-slide" style="background-image: url('${window.getEmbeddedAssetUrl('s1.png')}')">
            <div style="position: absolute; top: calc(15% - 55px); left: 70%; transform: translateX(-50%); z-index: 30;">
                <h3 style="font-family: 'Caveat', cursive; font-size: 38px; color: #fff; text-shadow: 0 0 10px #9c27b0, 0 0 20px #9c27b0; margin: 0;">Задание ${i+1}</h3>
            </div>
            
            <div class="task-right-side ${t.svg && String(t.svg).trim() !== "" ? 'task-card-visual' : 'task-card-text-only'}" style="position: absolute; right: 5%; top: 15%; bottom: 15%; width: 50%; background: rgba(255,255,255,0.95); padding: 20px 30px; border-radius: 20px; box-shadow: 0 0 25px #9c27b0, inset 0 0 15px #9c27b0; border: 2px solid #9c27b0; overflow: hidden; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    ${t.svg ? `<div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center; width: 100%; flex-shrink: 1; min-height: 0;" class="svg-wrapper">${t.svg}</div>` : ""}
                    <div class="task-text" style="margin-bottom: 20px; text-align: center; color: #333; width: 100%; flex-shrink: 1; overflow-y: auto;">${t.text}</div>
                    ${buildPresentationControls(t, i, {accent:'#9c27b0', instantCheck, showCorrectOnError, showSolutions})}

                </div>
            </div>

            <div id="draw-wrapper-pres-${i}" style="display:none; position: absolute; left: 5%; top: 15%; width: 40%; height: 70%; background: rgba(255,255,255,0.95); border: 2px solid #9c27b0; border-radius: 20px; padding: 20px; box-shadow: 0 15px 40px rgba(156,39,176,0.15); box-sizing: border-box; z-index: 20;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; margin-bottom: 8px; background: #f3e5f5; padding: 6px 10px; border-radius: 12px; border: 1px solid #e1bee7; min-height:34px; box-sizing:border-box; overflow:hidden; color: #333;">
                    <button onclick="window.setTool('pres-${i}', 'pointer')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Указатель (Перетаскивание)">👆</button>
                    <button onclick="window.setTool('pres-${i}', 'pen')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Карандаш">🖊️</button>
                    <button onclick="window.setTool('pres-${i}', 'highlighter')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Выделитель — полупрозрачный маркер">🖍️</button>
                    <button onclick="if(window.undoCanvas) window.undoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Отменить действие">↶</button>
                    <button onclick="if(window.redoCanvas) window.redoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Повторить действие">↷</button>
                    <select id="tool-select-pres-${i}" onchange="window.setTool('pres-${i}', this.value)" style="background: #fff; border: 1px solid #ce93d8; border-radius: 8px; padding: 4px 8px; font-size: 13px; cursor: pointer; outline: none; max-width:150px; flex:0 1 150px; color: #7b1fa2; font-weight: 500;">
                        <option value="" disabled selected hidden>🔺 Фигуры</option>
                        <option value="line">📏 Прямая</option>
                        <option value="vector">↗️ Вектор</option>
                        <option value="circle">⭕ Окружность</option>
                        <option value="triangle">🔺 Треугольник</option>
                        <option value="cylinder">🛢️ Цилиндр</option>
                        <option value="cone">🍦 Конус</option>
                        <option value="sphere">🔮 Сфера</option>
                    </select>
                    <input type="color" id="color-pres-${i}" value="#7b1fa2" style="cursor:pointer; height: 28px; width: 32px; flex:0 0 auto; border: none; background: transparent; padding: 0;">
                    <input type="range" id="size-pres-${i}" min="1" max="15" step="0.1" value="2" style="cursor:pointer; width: 58px; flex:0 0 58px;">
                    <button onclick="window.setTool('pres-${i}', 'eraser')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Ластик">🧽</button>
                    <button onclick="window.clearCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Очистить всё">🗑️</button>
                    <div style="flex-grow:1; min-width:0;"></div>
                    <input type="hidden" id="tool-pres-${i}" value="pen">
                </div>
                <div class="pres-canvas-box" style="position:relative; background-color: #fff; background-size: 20px 20px; background-image: linear-gradient(to right, #f3e5f5 1px, transparent 1px), linear-gradient(to bottom, #f3e5f5 1px, transparent 1px); border: 2px solid #e1bee7; border-radius: 12px; overflow: hidden; height: calc(100% - 52px); min-height: 250px;">${getPresentationDraftDiagramHtml(t)}<canvas id="canvas-pres-${i}" style="position:absolute; inset:0; z-index:2; display:block; width:100%; height:100%; touch-action: none; cursor: crosshair; background: transparent;"></canvas></div>
            </div>
            <div class="pres-footer" style="position: absolute; bottom: 30px; left: 70px; font-family: 'Caveat'; font-size: 26px; color: #555;">Шкатулка математических интерактивов</div>
        </div>
    `).join('');

    let hiddenTheories = buildPresentationHiddenData(window.currentGeneratedTasks);
    generateAndDownloadPresentationHTML(taskSlides, hiddenTheories, authorLine, topicsList, "Презентация_Урока_Стиль3.html", 's2.png', 's1.png', '#9c27b0');
}



// ==========================================
// 4-Й РЕЖИМ: РЕДАКТОР СВОЕГО СТИЛЯ ПРЕЗЕНТАЦИИ
// ==========================================
window.customPresentationEditorState = window.customPresentationEditorState || {
    startBg: '',
    slideBgs: [],
    plateImg: '',
    previewMode: 'start'
};

function escapePresAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function customPresReadFiles(input, multiple, callback) {
    const files = Array.from(input.files || []);
    if (!files.length) { callback(multiple ? [] : ''); return; }
    let results = [];
    let left = files.length;
    files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = e => {
            results[idx] = e.target.result;
            left--;
            if (left === 0) callback(multiple ? results.filter(Boolean) : (results[0] || ''));
        };
        reader.onerror = () => {
            left--;
            if (left === 0) callback(multiple ? results.filter(Boolean) : (results[0] || ''));
        };
        reader.readAsDataURL(file);
    });
}

function customPresAppendSlideBackgrounds(input) {
    customPresReadFiles(input, true, function(v) {
        if (!Array.isArray(window.customPresentationEditorState.slideBgs)) {
            window.customPresentationEditorState.slideBgs = [];
        }
        window.customPresentationEditorState.slideBgs = window.customPresentationEditorState.slideBgs.concat(v || []);
        input.value = '';
        renderCustomPresBgList();
        updateCustomPresentationPreview();
    });
}

function renderCustomPresBgList() {
    const list = document.getElementById('custom-pres-bg-list');
    const count = document.getElementById('custom-pres-bg-count');
    const items = window.customPresentationEditorState.slideBgs || [];
    if (count) count.textContent = 'Загружено: ' + items.length;
    if (!list) return;
    if (!items.length) {
        list.innerHTML = '<div style="font-size:12px;color:#aaa;">Пока фоновых картинок нет. Нажмите “+ Добавить фон”.</div>';
        return;
    }
    list.innerHTML = items.map((src, idx) => `
        <div style="display:flex;align-items:center;gap:8px;background:#1b1b1b;border:1px solid #3a3a3a;border-radius:8px;padding:6px;">
            <div style="width:48px;height:30px;border-radius:5px;background:url('${src}') center/cover no-repeat;border:1px solid #555;flex:0 0 auto;"></div>
            <div style="font-size:12px;color:#ddd;flex:1;">Фон ${idx + 1}</div>
            <button type="button" onclick="window.customPresentationEditorState.slideBgs.splice(${idx},1); renderCustomPresBgList(); updateCustomPresentationPreview();" style="background:#333;color:#ff8c00;border:1px solid #555;border-radius:6px;cursor:pointer;padding:3px 7px;">×</button>
        </div>`).join('');
}

function bindCustomPresentationEditorLiveEvents() {
    const ids = ['custom-pres-accent', 'custom-pres-task-side', 'custom-pres-show-plate', 'custom-pres-radius'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.customPreviewBound) return;
        el.dataset.customPreviewBound = '1';
        el.addEventListener('input', updateCustomPresentationPreview);
        el.addEventListener('change', updateCustomPresentationPreview);
    });
}


function getCustomPresAuthorLine() {
    let teacherName = document.getElementById('teacher-name') ? document.getElementById('teacher-name').value.trim() : '';
    let authorLine = '';
    const signatureToggle = document.getElementById('toggle-signature');
    if (signatureToggle && signatureToggle.checked && teacherName) {
        let gender = document.getElementById('teacher-gender') ? document.getElementById('teacher-gender').value : 'female';
        let verb = (gender === 'male') ? 'подготовил' : 'подготовила';
        authorLine = `Вариант ${verb}: ${teacherName}`;
    }
    return authorLine;
}

function getCustomPresSetting(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    if (el.type === 'checkbox') return el.checked;
    return el.value;
}

function getCustomPresAccent() {
    return getCustomPresSetting('custom-pres-accent', '#ff8c00') || '#ff8c00';
}

function makeCustomPresPlateHtml(taskNum, accentColor) {
    const showPlate = !!getCustomPresSetting('custom-pres-show-plate', true);
    const plateImg = window.customPresentationEditorState.plateImg || '';
    if (!showPlate) {
        return `<div style="position:absolute; top:8%; left:50%; transform:translateX(-50%); z-index:35; font-family:'Caveat', cursive; font-size:42px; color:#fff; text-shadow:0 0 10px ${accentColor}, 0 0 18px ${accentColor};">Задание ${taskNum}</div>`;
    }
    if (plateImg) {
        return `<div style="position:absolute; top:5%; left:50%; transform:translateX(-50%); z-index:35; width:220px; height:120px; background:url('${plateImg}') center/contain no-repeat; display:flex; align-items:center; justify-content:center; box-sizing:border-box;"><div style="font-family:'Caveat', cursive; font-size:34px; color:#222; text-shadow:0 1px 1px rgba(255,255,255,.7);">Задание ${taskNum}</div></div>`;
    }
    return `<div style="position:absolute; top:7%; left:50%; transform:translateX(-50%); z-index:35; min-width:190px; padding:15px 28px; border-radius:20px; background:rgba(255,255,255,.92); border:2px solid ${accentColor}; box-shadow:0 8px 22px rgba(0,0,0,.18); text-align:center;"><div style="font-family:'Caveat', cursive; font-size:34px; color:#222;">Задание ${taskNum}</div></div>`;
}

function makeCustomPresentationTaskSlide(t, i, settings) {
    const taskSide = settings.taskSide === 'left' ? 'left' : 'right';
    const draftSide = taskSide === 'left' ? 'right' : 'left';
    const taskPos = taskSide === 'left' ? 'left: 5%; right: auto;' : 'right: 5%; left: auto;';
    const draftPos = draftSide === 'left' ? 'left: 5%; right: auto;' : 'right: 5%; left: auto;';
    const bg = settings.slideBgs.length ? settings.slideBgs[i % settings.slideBgs.length] : window.getEmbeddedAssetUrl('p2.jpg');
    const accent = settings.accentColor;
    const taskHasVisual = !!(t.svg && String(t.svg).trim() !== '');
    const draftDiagram = getPresentationDraftDiagramHtml(t);
    const radius = settings.roundness || 18;
    const plate = makeCustomPresPlateHtml(i + 1, accent);
    const showTaskPlate = !!getCustomPresSetting('custom-pres-show-plate', true);
    const panelTop = showTaskPlate ? '25%' : '15%';
    const panelBottom = showTaskPlate ? '8%' : '15%';
    const inputAccent = escapePresAttr(accent);
    const showSolutions = settings.showSolutions;
    const instantCheck = settings.instantCheck;
    const showCorrectOnError = settings.showCorrectOnError;

    return `
        <div class="slide task-slide" style="background-image: url('${bg}')">
            ${plate}
            <div class="task-right-side ${taskHasVisual ? 'task-card-visual' : 'task-card-text-only'}" style="position: absolute; ${taskPos} top: ${panelTop}; bottom: ${panelBottom}; width: 50%; background: rgba(255,255,255,0.95); padding: 20px 30px; border-radius: ${radius}px; box-shadow: 0 0 25px ${accent}, inset 0 0 15px ${accent}; border: 2px solid ${accent}; overflow: hidden; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    ${t.svg ? `<div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center; width: 100%; flex-shrink: 1; min-height: 0;" class="svg-wrapper">${t.svg}</div>` : ""}
                    <div class="task-text" style="margin-bottom: 20px; text-align: center; color: #333; width: 100%; flex-shrink: 1; overflow-y: auto;">${t.text}</div>
                    ${buildPresentationControls(t, i, {accent:accent, instantCheck, showCorrectOnError, showSolutions})}
                </div>
            </div>

            <div id="draw-wrapper-pres-${i}" style="display:none; position: absolute; ${draftPos} top: ${panelTop}; width: 40%; height: calc(100% - ${panelTop} - ${panelBottom}); background: rgba(255,255,255,0.95); border: 2px solid ${accent}; border-radius: ${radius}px; padding: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.16); box-sizing: border-box; z-index: 20;" onclick="event.stopPropagation();">
                <div style="display: flex; flex-wrap: nowrap; gap: 10px; align-items: center; margin-bottom: 10px; background: rgba(255,255,255,.72); padding: 8px 15px; border-radius: 12px; border: 1px solid ${accent}; color: #333; overflow:hidden;">
                    <button onclick="window.setTool('pres-${i}', 'pointer')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Указатель (Перетаскивание)">👆</button>
                    <button onclick="window.setTool('pres-${i}', 'pen')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Карандаш">🖊️</button>
                    <button onclick="window.setTool('pres-${i}', 'highlighter')" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 2px; flex:0 0 auto;" title="Выделитель — полупрозрачный маркер">🖍️</button>
                    <button onclick="window.undoCanvas && window.undoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Отменить">↶</button>
                    <button onclick="window.redoCanvas && window.redoCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Повторить">↷</button>
                    <select id="tool-select-pres-${i}" onchange="window.setTool('pres-${i}', this.value)" style="background: #fff; border: 1px solid ${accent}; border-radius: 8px; padding: 4px 8px; font-size: 14px; cursor: pointer; outline: none; color: ${accent}; font-weight: 500; min-width:120px;">
                        <option value="" disabled selected hidden>🔺 Фигуры</option><option value="line">📏 Прямая</option><option value="vector">↗️ Вектор</option><option value="circle">⭕ Окружность</option><option value="triangle">🔺 Треугольник</option><option value="cylinder">🛢️ Цилиндр</option><option value="cone">🍦 Конус</option><option value="sphere">🔮 Сфера</option>
                    </select>
                    <input type="color" id="color-pres-${i}" value="${inputAccent}" style="cursor:pointer; height: 30px; width: 35px; border: none; background: transparent; padding: 0; flex:0 0 auto;">
                    <input type="range" id="size-pres-${i}" min="1" max="15" step="0.1" value="2" style="cursor:pointer; width: 80px; flex:0 0 auto;">
                    <button onclick="window.setTool('pres-${i}', 'eraser')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Ластик">🧽</button>
                    <div style="flex-grow:1; min-width:8px;"></div>
                    <button onclick="window.clearCanvas('pres-${i}')" style="background:none; border:none; cursor:pointer; font-size:20px;" title="Очистить всё">🗑️</button>
                    <input type="hidden" id="tool-pres-${i}" value="pen">
                </div>
                <div class="pres-canvas-box" style="position: relative; background-color: #fff; background-size: 20px 20px; background-image: linear-gradient(to right, rgba(0,0,0,.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.10) 1px, transparent 1px); border: 2px solid ${accent}; border-radius: 12px; overflow: hidden; height: calc(100% - 60px); min-height: 250px;">
                    ${draftDiagram}
                    <canvas id="canvas-pres-${i}" style="position:relative; z-index:2; display:block; width:100%; height:100%; touch-action: none; cursor: crosshair;"></canvas>
                </div>
            </div>
            <div class="pres-footer" style="position: absolute; bottom: 30px; left: 70px; font-family: 'Caveat'; font-size: 26px; color: #555;">Шкатулка математических интерактивов</div>
        </div>
    `;
}

function generateCustomPresentationFromEditor() {
    const tasks = window.currentGeneratedTasks || [];
    if (!tasks.length) { alert('Сначала сгенерируйте вариант.'); return; }
    const accentColor = getCustomPresAccent();
    const settings = {
        accentColor,
        taskSide: getCustomPresSetting('custom-pres-task-side', 'right'),
        slideBgs: window.customPresentationEditorState.slideBgs || [],
        showSolutions: document.getElementById('toggle-explanations') ? document.getElementById('toggle-explanations').checked : true,
        instantCheck: document.getElementById('toggle-instant-check') ? document.getElementById('toggle-instant-check').checked : false,
        showCorrectOnError: getShowCorrectOnErrorSetting(),
        roundness: parseInt(getCustomPresSetting('custom-pres-radius', '18'), 10) || 18
    };
    const fallbackStart = window.getEmbeddedAssetUrl('p1.jpg');
    const fallbackMain = settings.slideBgs.length ? settings.slideBgs[0] : window.getEmbeddedAssetUrl('p2.jpg');
    const startBg = window.customPresentationEditorState.startBg || fallbackStart;
    const topicsList = (window.selectedBlockTitles || []).map(t => `<li style="margin-bottom: 10px;">${t}</li>`).join('');
    const authorLine = getCustomPresAuthorLine();
    const taskSlides = tasks.map((t, i) => makeCustomPresentationTaskSlide(t, i, settings)).join('');
    const hiddenTheories = buildPresentationHiddenData(tasks);
    generateAndDownloadPresentationHTML(taskSlides, hiddenTheories, authorLine, topicsList, 'Презентация_Урока_Свой_стиль.html', startBg, fallbackMain, accentColor);
    const modal = document.getElementById('custom-pres-editor-modal');
    if (modal) modal.style.display = 'none';
}

function setCustomPresPreviewMode(mode) {
    window.customPresentationEditorState.previewMode = (mode === 'task') ? 'task' : 'start';
    updateCustomPresentationPreview();
}

function updateCustomPresentationPreview() {
    const preview = document.getElementById('custom-pres-preview');
    if (!preview) return;
    const accent = getCustomPresAccent();
    const taskSide = getCustomPresSetting('custom-pres-task-side', 'right');
    const startBg = window.customPresentationEditorState.startBg || window.getEmbeddedAssetUrl('p1.jpg');
    const taskBg = (window.customPresentationEditorState.slideBgs && window.customPresentationEditorState.slideBgs[0]) || window.getEmbeddedAssetUrl('p2.jpg');
    const taskLeft = taskSide === 'left';
    const showPlate = !!getCustomPresSetting('custom-pres-show-plate', true);
    const plateImg = window.customPresentationEditorState.plateImg;
    const radius = parseInt(getCustomPresSetting('custom-pres-radius', '18'), 10) || 18;
    const previewMode = window.customPresentationEditorState.previewMode || 'start';

    document.querySelectorAll('#custom-pres-editor-modal h2, #custom-pres-editor-modal h3').forEach(el => el.style.color = accent);
    const downloadBtn = document.getElementById('custom-pres-download-btn');
    if (downloadBtn) downloadBtn.style.background = accent;

    const startBtn = document.getElementById('custom-pres-preview-start-btn');
    const taskBtn = document.getElementById('custom-pres-preview-task-btn');
    if (startBtn && taskBtn) {
        startBtn.style.background = previewMode === 'start' ? accent : '#111';
        startBtn.style.color = previewMode === 'start' ? '#121212' : accent;
        startBtn.style.borderColor = accent;
        taskBtn.style.background = previewMode === 'task' ? accent : '#111';
        taskBtn.style.color = previewMode === 'task' ? '#121212' : accent;
        taskBtn.style.borderColor = accent;
    }

    if (previewMode === 'start') {
        const info = getPresentationStartInfo();
        const author = getCustomPresAuthorLine();
        preview.style.backgroundImage = `url('${startBg}')`;

        if (info.fullVariant) {
            preview.innerHTML = `
                <div style="position:absolute;inset:0;background:rgba(255,255,255,.05);"></div>
                <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:62%;background:rgba(255,255,255,.94);border:2px solid ${accent};border-radius:${radius}px;box-shadow:0 10px 28px rgba(0,0,0,.20);padding:26px 28px 22px;box-sizing:border-box;text-align:center;color:#333;">
                    <div style="font-size:12px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#555;">Профильная математика</div>
                    <div style="font-weight:900;font-size:38px;line-height:1.05;color:#003399;margin-top:8px;">Вариант ЕГЭ</div>
                    <div style="width:68px;height:3px;border-radius:999px;background:${accent};margin:14px auto;"></div>
                    ${author ? `<div style="font-family:Caveat,cursive;font-size:20px;color:#003399;">${author}</div>` : ''}
                    <div style="font-family:Caveat,cursive;font-size:15px;color:#555;margin-top:12px;">Шкатулка математических интерактивов</div>
                </div>`;
        } else {
            const groups = info.groups || [];
            const previewGroups = groups.slice(0, 12);
            const cols = previewGroups.length >= 7 ? 3 : 2;
            const chips = previewGroups.map(group => {
                const n = Number.isFinite(group.number) ? `№${group.number} ` : '';
                const c = group.count > 1 ? ` ×${group.count}` : '';
                return `<div style="min-width:0;padding:5px 7px;border:1px solid rgba(0,0,0,.10);border-radius:8px;background:rgba(255,255,255,.82);font-size:10px;line-height:1.1;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><b style="color:#003399;">${n}</b>${escapePresHtml(group.title)}<b style="color:${accent};">${c}</b></div>`;
            }).join('');
            const more = groups.length > previewGroups.length ? `<div style="font-size:10px;color:#777;margin-top:6px;">+ ещё ${groups.length - previewGroups.length}</div>` : '';
            preview.innerHTML = `
                <div style="position:absolute;inset:0;background:rgba(255,255,255,.05);"></div>
                <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:78%;max-height:80%;background:rgba(255,255,255,.94);border:2px solid ${accent};border-radius:${radius}px;box-shadow:0 10px 28px rgba(0,0,0,.20);padding:15px 18px;box-sizing:border-box;text-align:center;color:#333;overflow:hidden;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#555;">Профильная математика</div>
                    <div style="font-weight:900;font-size:24px;line-height:1.05;color:#003399;margin:4px 0 6px;">Подборка заданий</div>
                    <div style="display:inline-block;border:1px solid ${accent};color:${accent};border-radius:999px;padding:3px 9px;font-size:10px;font-weight:800;margin-bottom:8px;">${info.total} заданий</div>
                    <div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:5px;">${chips}</div>
                    ${more}
                    ${author ? `<div style="font-family:Caveat,cursive;font-size:16px;color:#003399;margin-top:8px;">${author}</div>` : ''}
                    <div style="font-family:Caveat,cursive;font-size:13px;color:#555;margin-top:7px;">Шкатулка математических интерактивов</div>
                </div>`;
        }
    } else {
        preview.style.backgroundImage = `url('${taskBg}')`;
        preview.innerHTML = `
            ${showPlate ? `<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);min-width:120px;height:54px;border-radius:${Math.max(10, radius - 2)}px;border:2px solid ${accent};background:${plateImg ? `url('${plateImg}') center/contain no-repeat` : 'rgba(255,255,255,.9)'};display:flex;align-items:center;justify-content:center;font-family:Caveat,cursive;font-size:22px;color:#222;box-shadow:0 4px 14px rgba(0,0,0,.15);">Задание 1</div>` : `<div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-family:Caveat,cursive;font-size:28px;color:white;text-shadow:0 0 10px ${accent},0 0 18px ${accent};">Задание 1</div>`}
            <div style="position:absolute;${taskLeft ? 'left:5%;' : 'right:5%;'}top:${showPlate ? '24%' : '20%'};width:47%;height:${showPlate ? '54%' : '58%'};border:2px solid ${accent};border-radius:${radius}px;background:rgba(255,255,255,.94);box-shadow:0 0 18px ${accent};display:flex;align-items:center;justify-content:center;text-align:center;color:#333;font-weight:700;padding:12px;box-sizing:border-box;">Карточка задания</div>
            <div style="position:absolute;${taskLeft ? 'right:5%;' : 'left:5%;'}top:${showPlate ? '24%' : '20%'};width:38%;height:${showPlate ? '54%' : '58%'};border:2px solid ${accent};border-radius:${radius}px;background:rgba(255,255,255,.94);box-shadow:0 0 18px rgba(0,0,0,.15);padding:10px;box-sizing:border-box;">
                <div style="height:34px;border:1px solid ${accent};border-radius:10px;background:rgba(255,255,255,.65);display:flex;align-items:center;gap:8px;padding:0 8px;color:#222;box-sizing:border-box;">👆 🖊️ ↶ ↷ 🔺 🧽 🗑️</div>
                <div style="margin-top:8px;height:calc(100% - 44px);border:1px solid ${accent};border-radius:10px;background-size:16px 16px;background-image:linear-gradient(to right,rgba(0,0,0,.12) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.12) 1px,transparent 1px);"></div>
            </div>`;
    }
    renderCustomPresBgList();
}

function buildCustomPresentationEditorModal() {
    if (document.getElementById('custom-pres-editor-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'custom-pres-editor-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:1200; background:rgba(0,0,0,.82); align-items:center; justify-content:center; backdrop-filter:blur(5px);';
    modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
    modal.innerHTML = `
        <div style="width:min(1180px, calc(100vw - 32px)); max-height:92vh; overflow:hidden; background:#1e1e1e; color:#eee; border:2px solid #ff8c00; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.45); display:flex; flex-direction:column;" onclick="event.stopPropagation();">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #333;">
                <h2 style="margin:0;color:#ff8c00;">Свой стиль презентации</h2>
                <button style="background:none;border:none;color:#aaa;font-size:32px;cursor:pointer;line-height:1;" onclick="document.getElementById('custom-pres-editor-modal').style.display='none'">×</button>
            </div>
            <div style="display:grid; grid-template-columns: 360px 1fr; gap:18px; padding:18px; min-height:0; overflow:auto;">
                <div style="background:#252525;border:1px solid #3a3a3a;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:14px;">
                    <label style="display:flex;flex-direction:column;gap:6px;font-weight:bold;color:#ffb15c;">Цвет акцента
                        <input id="custom-pres-accent" type="color" value="#ff8c00" style="height:38px;width:70px;" oninput="updateCustomPresentationPreview()" onchange="updateCustomPresentationPreview()">
                    </label>
                    <label style="display:flex;flex-direction:column;gap:6px;font-weight:bold;color:#ffb15c;">Фон стартового экрана
                        <input id="custom-pres-start-bg" type="file" accept="image/*" onchange="customPresReadFiles(this,false,function(v){window.customPresentationEditorState.startBg=v; window.customPresentationEditorState.previewMode='start'; updateCustomPresentationPreview();})">
                    </label>
                    <div style="display:flex;flex-direction:column;gap:8px;font-weight:bold;color:#ffb15c;">Фоны слайдов с заданиями
                        <input id="custom-pres-slide-bgs" type="file" accept="image/*" multiple style="display:none;" onchange="customPresAppendSlideBackgrounds(this)">
                        <button type="button" onclick="document.getElementById('custom-pres-slide-bgs').click()" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#111;color:#ff8c00;border:1px dashed #ff8c00;border-radius:10px;padding:10px 12px;font-weight:bold;cursor:pointer;">＋ Добавить фон</button>
                        <span id="custom-pres-bg-count" style="font-size:12px;color:#aaa;font-weight:normal;">Загружено: 0</span>
                        <div id="custom-pres-bg-list" style="display:flex;flex-direction:column;gap:6px;max-height:125px;overflow:auto;"></div>
                        <span style="font-size:12px;color:#aaa;font-weight:normal;">Каждое нажатие на плюс добавляет ещё картинки. Если загрузить 4 картинки на 15 заданий, они будут идти циклом.</span>
                    </div>
                    <label style="display:flex;flex-direction:column;gap:6px;font-weight:bold;color:#ffb15c;">Где расположить задание
                        <select id="custom-pres-task-side" onchange="updateCustomPresentationPreview()" style="padding:9px;border-radius:8px;background:#111;color:#ff8c00;border:1px solid #555;">
                            <option value="right">Справа, черновик слева</option>
                            <option value="left">Слева, черновик справа</option>
                        </select>
                    </label>
                    <label style="display:flex;align-items:center;gap:10px;font-weight:bold;color:#ffb15c;">
                        <input id="custom-pres-show-plate" type="checkbox" checked onchange="updateCustomPresentationPreview()"> Подложка под номер задания
                    </label>
                    <label style="display:flex;flex-direction:column;gap:6px;font-weight:bold;color:#ffb15c;">Картинка подложки номера, необязательно
                        <input id="custom-pres-plate-img" type="file" accept="image/*" onchange="customPresReadFiles(this,false,function(v){window.customPresentationEditorState.plateImg=v; updateCustomPresentationPreview();})">
                    </label>
                    <label style="display:flex;flex-direction:column;gap:6px;font-weight:bold;color:#ffb15c;">Скругление карточек
                        <input id="custom-pres-radius" type="range" min="6" max="30" value="18" oninput="updateCustomPresentationPreview()" onchange="updateCustomPresentationPreview()">
                    </label>
                    <button id="custom-pres-download-btn" onclick="generateCustomPresentationFromEditor()" style="margin-top:6px;background:#ff8c00;color:#121212;border:none;border-radius:12px;padding:14px 16px;font-size:17px;font-weight:bold;cursor:pointer;">Скачать презентацию</button>
                </div>
                <div style="background:#252525;border:1px solid #3a3a3a;border-radius:14px;padding:16px;min-height:520px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px;flex-wrap:wrap;">
                        <h3 style="margin:0;color:#ff8c00;">Предпросмотр</h3>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <button id="custom-pres-preview-start-btn" type="button" onclick="setCustomPresPreviewMode('start')" style="background:#ff8c00;color:#121212;border:1px solid #ff8c00;border-radius:999px;padding:7px 11px;font-weight:bold;cursor:pointer;">Старт</button>
                            <button id="custom-pres-preview-task-btn" type="button" onclick="setCustomPresPreviewMode('task')" style="background:#111;color:#ff8c00;border:1px solid #ff8c00;border-radius:999px;padding:7px 11px;font-weight:bold;cursor:pointer;">Задание</button>
                        </div>
                    </div>
                    <div id="custom-pres-preview" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#f4f7f6 center/cover no-repeat;box-shadow:0 10px 30px rgba(0,0,0,.28);"></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function openCustomPresentationEditor() {
    const presModal = document.getElementById('pres-modal');
    if (presModal) presModal.style.display = 'none';
    buildCustomPresentationEditorModal();
    const modal = document.getElementById('custom-pres-editor-modal');
    if (modal) modal.style.display = 'flex';
    bindCustomPresentationEditorLiveEvents();
    renderCustomPresBgList();
    updateCustomPresentationPreview();
    setTimeout(updateCustomPresentationPreview, 60);
}

function injectCustomPresentationCard() {
    const presModal = document.getElementById('pres-modal');
    if (!presModal || document.getElementById('custom-pres-style-card')) return;
    const box = presModal.querySelector('.modal-box');
    if (!box) return;
    const cancelBtn = Array.from(box.querySelectorAll('button')).find(b => (b.textContent || '').trim() === 'Отмена');
    const card = document.createElement('div');
    card.id = 'custom-pres-style-card';
    card.className = 'pres-preview-card';
    card.style.borderColor = '#00bcd4';
    card.style.cursor = 'pointer';
    card.onclick = function(e) { e.preventDefault(); e.stopPropagation(); openCustomPresentationEditor(); };
    card.innerHTML = `
        <div class="pres-thumb" style="border-color:#00bcd4;background:linear-gradient(135deg,#fff,#e0f7fa,#fff3e0);display:flex;align-items:center;justify-content:center;color:#00acc1;font-size:34px;font-weight:bold;">⚙️</div>
        <div><div style="font-weight:bold;color:#00bcd4;font-size:1.2em;">Свой стиль</div><div style="font-size:0.85em;color:#bbb;">Редактор фонов, сторон и подложки</div></div>`;
    if (cancelBtn) box.insertBefore(card, cancelBtn); else box.appendChild(card);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCustomPresentationCard);
} else {
    injectCustomPresentationCard();
}


window.openCustomPresentationEditor = openCustomPresentationEditor;
window.updateCustomPresentationPreview = updateCustomPresentationPreview;
window.setCustomPresPreviewMode = setCustomPresPreviewMode;
window.customPresReadFiles = customPresReadFiles;
window.customPresAppendSlideBackgrounds = customPresAppendSlideBackgrounds;
window.renderCustomPresBgList = renderCustomPresBgList;
window.generateCustomPresentationFromEditor = generateCustomPresentationFromEditor;

// ==========================================
// ОБЩИЙ СБОРЩИК ПРЕЗЕНТАЦИЙ (ДЛЯ ЛЮБОГО СТИЛЯ)
// ==========================================
function generateAndDownloadPresentationHTML(taskSlides, hiddenTheories, authorLine, topicsList, fileName, bgTitle, bgMain, accentColor) {

    let showSolutions = true;
    let solToggle = document.getElementById('toggle-explanations'); 
    if (solToggle) {
        showSolutions = solToggle.checked;
    }

    let instantCheck = false;
    let instantToggle = document.getElementById('toggle-instant-check');
    if (instantToggle) {
        instantCheck = instantToggle.checked;
    }

    let showCorrectOnError = false;
    let showCorrectToggle = document.getElementById('toggle-show-correct');
    if (showCorrectToggle) {
        showCorrectOnError = showCorrectToggle.checked;
    }

    let timerMinutes = 0;
    let timerInput = document.getElementById('timer-input');
    if (timerInput) {
        timerMinutes = parseInt(timerInput.value, 10) || 0;
    }

    function resolvePresentationBgUrl(src) {
        src = String(src || '');
        if (/^(data:|blob:|https?:|file:)/i.test(src)) return src;
        return window.getEmbeddedAssetUrl(src);
    }
    const resolvedBgTitle = resolvePresentationBgUrl(bgTitle);
    const resolvedBgMain = resolvePresentationBgUrl(bgMain);
    const startCardHtml = buildPresentationStartCardHtml(authorLine, accentColor);

    let fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Презентация урока</title>
    <base href="https://svetlana18011991.github.io/generator11prof/">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap" rel="stylesheet">
    <script>window.MathJax = { tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], macros: { tg: '\\\\operatorname{tg}', ctg: '\\\\operatorname{ctg}' } } };${window.SCRIPT_END}
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">${window.SCRIPT_END}
    <style>
        body, html { margin: 0; padding: 0; overflow: hidden; font-family: 'Segoe UI', sans-serif; }
        .slide { width: 100vw; height: 100vh; background-size: cover; background-position: center; display: none; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 50px; box-sizing: border-box; }
        .slide.active { display: flex; }
        .title-box { background: rgba(255,255,255,0.95); padding: 40px 60px; border-radius: 20px; border: 3px solid ${accentColor}; text-align: center; max-width: 900px; box-shadow: 0 15px 40px rgba(0,0,0,0.15); }
        .topics-list { text-align: left; margin: 20px 0; font-size: 1.3em; color: #333; line-height: 1.4; list-style-type: disc; padding-left: 20px;}
        .pres-start-card { width: min(760px, calc(100vw - 160px)); box-sizing: border-box; }
        .pres-start-card-full { padding: 48px 70px 38px; }
        .pres-start-card-selection { padding: 28px 34px 24px; max-width: 980px; width: min(980px, calc(100vw - 150px)); max-height: calc(100vh - 150px); overflow: hidden; }
        .pres-start-kicker { font-size: clamp(15px, 1.4vw, 20px); font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #555; }
        .pres-start-main-title { margin: 12px 0 0; color: #003399; font-size: clamp(48px, 6vw, 78px); line-height: 1; }
        .pres-start-selection-title { margin: 6px 0 8px; color: #003399; font-size: clamp(30px, 3.3vw, 48px); line-height: 1.05; }
        .pres-start-rule { width: 110px; height: 4px; border-radius: 999px; margin: 24px auto 20px; }
        .pres-start-meta { display: inline-block; margin: 0 auto 18px; padding: 6px 14px; border: 1.5px solid currentColor; border-radius: 999px; font-weight: 800; font-size: 16px; background: rgba(255,255,255,.72); }
        .pres-topic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; width: 100%; margin: 0 auto 14px; }
        .pres-topic-grid-mid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px; }
        .pres-topic-grid-dense { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px 8px; }
        .pres-topic-chip { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 11px; border-radius: 12px; background: rgba(255,255,255,.82); border: 1px solid rgba(0,0,0,.10); color: #333; font-size: 15px; line-height: 1.15; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
        .pres-topic-grid-dense .pres-topic-chip { padding: 7px 9px; font-size: 13px; }
        .pres-topic-chip > span:first-child { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pres-topic-chip b { color: #003399; }
        .pres-topic-count { flex: 0 0 auto; font-weight: 900; color: ${accentColor}; background: rgba(255,255,255,.88); border-radius: 999px; padding: 2px 7px; }
        .pres-start-author { font-family: 'Caveat', cursive; font-size: clamp(22px, 2.5vw, 34px); color: #003399; margin-top: 16px; }
        .pres-start-brand { margin-top: 18px; font-size: 17px; color: #555; font-style: italic; display: flex; align-items: center; justify-content: center; }
        @media (max-height: 700px) {
            .pres-start-card-selection { padding: 18px 24px 16px; max-height: calc(100vh - 110px); }
            .pres-start-selection-title { font-size: 31px; }
            .pres-start-meta { margin-bottom: 10px; padding: 4px 11px; font-size: 14px; }
            .pres-topic-grid { gap: 6px 8px; margin-bottom: 8px; }
            .pres-topic-chip { padding: 6px 8px; font-size: 12px; }
            .pres-start-author { margin-top: 8px; font-size: 23px; }
            .pres-start-brand { margin-top: 8px; font-size: 14px; }
        }
        .nav-btns { position: fixed; bottom: 40px; right: 70px; display: flex; gap: 20px; z-index: 100; }
        .nav-btn { background: #333; color: white; border: none; padding: 15px 35px; border-radius: 50px; cursor: pointer; font-size: 1.3em; opacity: 0.85; transition: 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .nav-btn:hover { opacity: 1; background: ${accentColor}; transform: translateY(-2px); }
        .pres-btn:hover { filter: brightness(1.1); }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 1.05em; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .results-table th, .results-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: center; }
        .results-table th { background: #f5f5f5; color: #333; }
        .row-correct { background-color: #e8f5e9; color: #2e7d32; }
        .row-incorrect { background-color: #ffebee; color: #c62828; }
        .row-self-check { background-color: #eef3ff; color: #334c87; }
        .pres-footer { position: absolute; bottom: 30px; left: 70px; font-family: 'Caveat'; font-size: 26px; color: #555; }
        .logo-small { height: 50px; vertical-align: middle; margin-right: 15px; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-box { background: #fff; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; border-radius: 12px; border: 2px solid ${accentColor}; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding: 30px; position: relative; text-align: left; font-size: 18px;}
        .close-btn { position: absolute; top: 15px; right: 20px; font-size: 32px; line-height: 1; cursor: pointer; color: #888; transition: 0.2s; }
        .close-btn:hover { color: ${accentColor}; }
        .help-btn { background: #e3f2fd; color: #003399; border: 1px solid #003399; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s; }
        .help-btn:hover { background: #003399; color: #fff; }
        .pres-timer-box { position: fixed; top: 25px; right: 35px; z-index: 200; background: rgba(255,255,255,0.95); border: 2px solid ${accentColor}; color: ${accentColor}; padding: 12px 18px; border-radius: 12px; font-weight: bold; font-size: 22px; box-shadow: 0 5px 18px rgba(0,0,0,0.18); }
        .pres-status.ok { color: #2e7d32; }
        .pres-status.bad { color: #c62828; }

        /* ФИКС СЛАЙДОВ С КАРТИНКАМИ */
        .task-right-side { overflow: hidden !important; }
        .task-right-side > div { min-height: 0 !important; height: 100% !important; justify-content: flex-start !important; overflow: hidden !important; }
        .svg-wrapper { flex: 1 1 auto !important; min-height: 0 !important; max-height: 54% !important; width: 100% !important; overflow: hidden !important; margin-bottom: 10px !important; }
        .svg-wrapper img, .svg-wrapper svg { max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; }
        /* Условие прокручивается вместо обрезки; кнопки проверки всегда снаружи области прокрутки. */
        .task-text { font-size: clamp(16px, 1.5vw, 23px) !important; line-height: 1.22 !important; max-height: 28% !important; min-height: 0 !important; flex: 0 1 auto !important; overflow-y: auto !important; overflow-x: hidden !important; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #9c9c9c #f1f1f1; padding: 0 8px !important; margin-bottom: 10px !important; box-sizing: border-box !important; text-align: center !important; overflow-wrap: anywhere; }
        .task-text::-webkit-scrollbar { width: 9px; }
        .task-text::-webkit-scrollbar-thumb { background: #aaa; border-radius: 12px; border: 2px solid #f6f6f6; }
        .task-text::-webkit-scrollbar-track { background: #f6f6f6; border-radius: 12px; }
        .pres-expand-task-btn { display: inline-block; flex: 0 0 auto; align-self: center; padding: 3px 11px; margin: -2px 0 7px; font-size: 14px; font-weight: 650; line-height: 1.3; color: #003399; background: rgba(232, 241, 255, .95); border: 1px solid #9bb9eb; border-radius: 8px; cursor: pointer; }
        .pres-expand-task-btn[hidden] { display: none !important; }
        .pres-expand-task-btn:hover { background: #dbe9ff; }
        .pres-expanded-task-modal { width: min(1050px, 94vw) !important; max-width: min(1050px, 94vw) !important; max-height: 90vh !important; box-sizing: border-box; }
        .pres-expanded-task-text { font-size: clamp(19px, 2vw, 27px); line-height: 1.4; text-align: left; overflow-wrap: anywhere; padding: 8px 8px 20px; }
        .pres-expanded-task-visual { max-height: 40vh; display: flex; align-items: center; justify-content: center; margin: 10px auto 16px; }
        .pres-expanded-task-visual svg, .pres-expanded-task-visual img { display: block; width: auto; height: auto; max-width: 100%; max-height: 38vh; }
        .task-card-visual .task-text mjx-container { font-size: 108% !important; }
        .pres-check-zone { flex: 0 0 auto !important; margin-top: auto !important; gap: 10px !important; }
        .pres-input { max-width: 180px !important; box-sizing: border-box !important; }

        .pres-canvas-box { isolation: isolate; }
        .pres-draft-diagram { position: absolute; left: 12px; top: 12px; z-index: 1; display: inline-flex; align-items: flex-start; justify-content: flex-start; width: fit-content; max-width: calc(100% - 24px); max-height: 62%; padding: 10px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.10); box-sizing: border-box; overflow: visible; }
        .pres-draft-diagram-inner { display: inline-flex; align-items: flex-start; justify-content: flex-start; width: fit-content; max-width: 100%; max-height: none; }
        .pres-draft-diagram img, .pres-draft-diagram svg, .pres-draft-diagram picture, .pres-draft-diagram canvas { max-width: min(320px, 100%) !important; max-height: 260px !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; margin: 0 !important; }

        @media (max-height: 760px), (max-width: 1200px) {
            .task-right-side { padding: 14px 18px !important; }
            .svg-wrapper { max-height: 50% !important; }
            .task-text { font-size: 15px !important; line-height: 1.16 !important; max-height: 30% !important; }
            .pres-input { padding: 9px 14px !important; width: 150px !important; }
            .pres-btn { padding: 9px 22px !important; }
        }

        /* РЕЖИМ ДЛЯ ЗАДАНИЙ БЕЗ ЧЕРТЕЖА */
        .task-card-text-only { width: min(58vw, 780px) !important; min-height: 230px !important; height: auto !important; max-height: 68vh !important; top: 50% !important; bottom: auto !important; right: 7% !important; transform: translateY(-50%) !important; padding: 24px 34px !important; justify-content: center !important; }
        .task-card-text-only > div { justify-content: center !important; min-height: 0 !important; height: auto !important; overflow: hidden !important; }
        .task-card-text-only .task-text { font-size: clamp(19px, 1.72vw, 27px) !important; line-height: 1.28 !important; max-height: 44vh !important; overflow-y: auto !important; overflow-x: hidden !important; text-align: center !important; margin: 0 0 22px 0 !important; padding: 0 6px !important; color: #222 !important; }
        .task-card-text-only .task-text mjx-container { font-size: 104% !important; }
        .task-card-text-only .pres-check-zone { margin-top: 0 !important; gap: 14px !important; }
        .task-card-text-only .pres-input { width: 190px !important; font-size: 1.15em !important; }
        .task-card-text-only .pres-btn { font-size: 1.15em !important; }

        @media (max-height: 760px), (max-width: 1200px) {
            .task-card-text-only { width: min(64vw, 760px) !important; min-height: 210px !important; max-height: 70vh !important; padding: 18px 24px !important; }
            .task-card-text-only .task-text { font-size: clamp(16px, 1.65vw, 24px) !important; max-height: 46vh !important; line-height: 1.22 !important; margin-bottom: 18px !important; }
        }
        /* Длинные задания: используем максимальную высоту ПОД табличкой с номером. */
        .task-card-text-only.pres-long-task { top: 24% !important; bottom: 7% !important; height: 69vh !important; max-height: none !important; transform: none !important; }
        .task-card-text-only.pres-long-task > div { min-height: 0 !important; height: 100% !important; max-height: 100% !important; justify-content: flex-start !important; overflow: hidden !important; }
        .task-card-text-only.pres-long-task .task-text { min-height: 0 !important; max-height: none !important; flex: 1 1 auto !important; margin-bottom: 8px !important; }
        .task-card-text-only.pres-long-task .pres-check-zone { flex: 0 0 auto !important; margin-top: auto !important; }
        .task-card-visual.pres-long-task .svg-wrapper { max-height: 40% !important; }
        .task-card-visual.pres-long-task .task-text { min-height: 0 !important; max-height: none !important; flex: 1 1 auto !important; }
        @media (max-height: 700px) {
            .task-card-text-only.pres-long-task { top: 20% !important; bottom: 5% !important; height: 75vh !important; }
            .pres-expand-task-btn { font-size: 12px; margin-bottom: 3px; }
        }
    </style>
</head>
<body>
    <div id="pres-timer-box" class="pres-timer-box">⏱ 00:00</div>

    <div class="slide active" style="background-image: url('${resolvedBgTitle}')">
        ${startCardHtml}
        <div class="nav-btns" id="start-nav"><button class="nav-btn" onclick="event.stopPropagation(); nextSlide()">Начать →</button></div>
    </div>

    ${taskSlides}

    <div class="slide" id="results-slide" style="background-image: url('${resolvedBgMain}')">
        <div class="title-box" style="padding: 40px; max-width: 1200px; width: 95%; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation();">
            <h2 style="font-size:3.2em; color:#4CAF50; margin:0;">Спасибо за работу!</h2>
            <div id="results-summary" style="font-size: 1.35em; color:#333; margin-top: 12px; font-weight: bold;"></div>
            <div id="results-total-time" style="font-size: 1.25em; color:${accentColor}; margin-top: 8px; font-weight: bold;"></div>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Задание</th>
                        <th>Ваш ответ</th>
                        <th>Результат</th>
                        ${showCorrectOnError ? '<th>Верный ответ</th>' : ''}
                        <th>Время</th>
                        ${showSolutions ? '<th>Разбор</th>' : ''}
                    </tr>
                </thead>
                <tbody id="results-tbody"></tbody>
            </table>
            <button class="nav-btn" style="margin-top:30px; font-size: 1.3em; padding: 15px 40px; position: static;" onclick="event.stopPropagation(); location.reload()">Начать сначала</button>
        </div>
        <div class="pres-footer">Шкатулка математических интерактивов</div>
    </div>

    <div id="hidden-theories-container">${hiddenTheories}</div>

    <div id="modal-overlay" class="modal-overlay" onclick="if(event.target===this) document.getElementById('modal-overlay').style.display='none'">
        <div class="modal-box">
            <div class="close-btn" onclick="document.getElementById('modal-overlay').style.display='none'">&times;</div>
            <div id="modal-content-box"></div>
        </div>
    </div>

    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalTasks = Math.max(0, slides.length - 2);
        let userResults = [];
        let answeredMap = {};
        let slideStartTime = Date.now();
        let presentationStartTime = Date.now();
        let workStartTime = null;
        let workEndTime = null;
        let totalTimerSeconds = ${timerMinutes} > 0 ? ${timerMinutes} * 60 : 0;
        let timerInterval = null;
        let resultsRendered = false;
        const showSolutions = ${showSolutions};
        const showCorrectOnError = ${showCorrectOnError};
        const instantCheck = ${instantCheck};
        // Задания второй части не подлежат автоматической проверке.
        const secondPartFlags = ${JSON.stringify((window.currentGeneratedTasks || []).map(isSecondPartPresentationTask))};

        function normalizeAnswer(value) {
            return String(value == null ? '' : value).trim().replace(',', '.');
        }

        function formatTime(totalSeconds) {
            totalSeconds = Math.max(0, Math.floor(totalSeconds || 0));
            let m = Math.floor(totalSeconds / 60);
            let s = totalSeconds % 60;
            return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        function updateTimerDisplay() {
            let box = document.getElementById('pres-timer-box');
            if (!box) return;

            if (totalTimerSeconds > 0) {
                let elapsed = Math.floor((Date.now() - presentationStartTime) / 1000);
                let left = totalTimerSeconds - elapsed;
                box.textContent = '⏳ ' + formatTime(left);
                if (left <= 0) {
                    box.textContent = '⏳ 00:00';
                    finishPresentationByTimer();
                }
            } else {
                let elapsed = Math.floor((Date.now() - presentationStartTime) / 1000);
                box.textContent = '⏱ ' + formatTime(elapsed);
            }
        }

        function startPresentationTimer() {
            updateTimerDisplay();
            timerInterval = setInterval(updateTimerDisplay, 1000);
        }

        function finishPresentationByTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            collectMissingResults();
            showSlide(slides.length - 1);
        }

        function collectMissingResults() {
            for (let i = 0; i < totalTasks; i++) {
                if (!answeredMap[i]) {
                    let input = document.getElementById('ans-' + i);
                    let userAns = input ? normalizeAnswer(input.value) : '';
                    let btn = input ? input.closest('.task-right-side')?.querySelector('.pres-btn') : null;
                    let correctAns = btn ? btn.getAttribute('data-correct') : '';
                    let timeSpent = Math.round((Date.now() - slideStartTime) / 1000);
                    userResults.push({ taskNum: i + 1, userAns: userAns, correctAns: correctAns, time: timeSpent });
                    answeredMap[i] = true;
                }
            }
        }

        function isPresTextClipped(el) {
            return !!el && (el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3);
        }

        function fitTextToBox(textEl, maxPx, minPx) {
            if (!textEl) return;
            // CSS шаблона использует !important: меняем размер с тем же приоритетом.
            // Не уменьшаем шрифт до нечитаемых 13px: дальше будет прокрутка.
            textEl.style.removeProperty('line-height');
            textEl.style.setProperty('font-size', maxPx + 'px', 'important');
            let size = maxPx;
            while (size > minPx && isPresTextClipped(textEl)) {
                size -= 1;
                textEl.style.setProperty('font-size', size + 'px', 'important');
            }
            if (size === minPx && isPresTextClipped(textEl)) {
                textEl.style.setProperty('line-height', '1.18', 'important');
            }
        }

        function chooseTextOnlyMax(textEl) {
            const plain = (textEl.textContent || '').replace(/\s+/g, ' ').trim();
            const len = plain.length;
            if (len > 520) return 20;
            if (len > 420) return 22;
            if (len > 300) return 24;
            if (len > 200) return 25;
            return 27;
        }

        function openFullPresentationTask(button) {
            const card = button.closest('.task-right-side');
            const textEl = card && card.querySelector('.task-text');
            const content = document.getElementById('modal-content-box');
            const overlay = document.getElementById('modal-overlay');
            if (!textEl || !content || !overlay) return;
            const titleEl = card.closest('.task-slide')?.querySelector('.header-plate h3');
            const visual = card.querySelector('.svg-wrapper');
            const heading = titleEl ? titleEl.textContent.trim() : 'Задание ' + currentSlide;
            content.innerHTML = '<h2 style="margin:0 38px 14px 0;color:#003399;">' + heading + '</h2>' +
                (visual ? '<div class="pres-expanded-task-visual">' + visual.innerHTML + '</div>' : '') +
                '<div class="pres-expanded-task-text">' + textEl.innerHTML + '</div>';
            const modal = overlay.querySelector('.modal-box');
            if (modal) modal.classList.add('pres-expanded-task-modal');
            overlay.style.display = 'flex';
            if (modal) modal.scrollTop = 0;
            if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([content]).catch(() => {});
        }

        function fitCurrentSlideText() {
            const slide = slides[currentSlide];
            if (!slide) return;
            slide.querySelectorAll('.task-right-side').forEach(card => {
                const textEl = card.querySelector('.task-text');
                if (!textEl) return;
                const textOnly = card.classList.contains('task-card-text-only');
                const max = textOnly ? chooseTextOnlyMax(textEl) : 23;
                const min = textOnly ? 17 : 16;
                card.classList.remove('pres-long-task');
                fitTextToBox(textEl, max, min);
                if (isPresTextClipped(textEl)) {
                    card.classList.add('pres-long-task');
                    fitTextToBox(textEl, max, min);
                }
                let expand = card.querySelector('.pres-expand-task-btn');
                if (!expand) {
                    expand = document.createElement('button');
                    expand.type = 'button';
                    expand.className = 'pres-expand-task-btn';
                    expand.textContent = '↗ Показать условие полностью';
                    expand.title = 'Открыть весь текст задания в большом окне';
                    expand.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openFullPresentationTask(expand);
                    });
                    textEl.insertAdjacentElement('afterend', expand);
                }
                expand.hidden = !isPresTextClipped(textEl);
            });
        }

        function fitPresentationDraftDiagrams() {
            document.querySelectorAll('.pres-draft-diagram').forEach(card => {
                const visual = card.querySelector('svg, img, picture, canvas');
                if (!visual) return;
                card.style.overflow = 'visible';
                card.style.width = 'fit-content';
                card.style.height = 'fit-content';
                card.style.maxWidth = 'calc(100% - 24px)';
                card.style.maxHeight = 'none';
                visual.style.setProperty('display', 'block', 'important');
                visual.style.setProperty('width', 'auto', 'important');
                visual.style.setProperty('height', 'auto', 'important');
                visual.style.setProperty('max-width', '320px', 'important');
                visual.style.setProperty('max-height', '260px', 'important');
                visual.style.setProperty('object-fit', 'contain', 'important');
                visual.style.setProperty('margin', '0', 'important');
                const inner = card.querySelector('.pres-draft-diagram-inner');
                if (inner) {
                    inner.style.width = 'fit-content';
                    inner.style.height = 'fit-content';
                    inner.style.maxHeight = 'none';
                    inner.style.overflow = 'visible';
                }
            });
        }

        function scheduleFitText() {
            fitPresentationDraftDiagrams();
            requestAnimationFrame(() => {
                fitPresentationDraftDiagrams();
                fitCurrentSlideText();
                setTimeout(fitCurrentSlideText, 120);
                setTimeout(fitCurrentSlideText, 500);
            });
        }

        function showSlide(idx) {
            if (idx < 0 || idx >= slides.length) return;
            slides.forEach(s => s.classList.remove('active'));
            slides[idx].classList.add('active');
            currentSlide = idx;
            slideStartTime = Date.now();
            if (idx === slides.length - 1) { 
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                renderResults(); 
            }
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([slides[idx]]).then(scheduleFitText).catch(scheduleFitText);
            } else {
                scheduleFitText();
            }
        }

        function nextSlide() { 
            if (currentSlide === 0 && workStartTime === null) {
                workStartTime = Date.now();
            }
            if (currentSlide < slides.length - 1) showSlide(currentSlide + 1); 
        }

        function showSecondPartPresAnswer(idx) {
            event.stopPropagation();
            const box = document.getElementById('pres-second-answer-' + idx);
            const btn = document.getElementById('pres-second-answer-btn-' + idx);
            if (!box) return;
            box.style.display = 'block';
            if (btn) btn.style.display = 'none';
            if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]).catch(()=>{});
        }

        // --- МГНОВЕННАЯ ПРОВЕРКА В ПРЕЗЕНТАЦИИ ---
        function checkPresSingle(idx, correctAns, btn, showCorrectFlag) {
            event.stopPropagation();
            let input = document.getElementById('ans-'+idx);
            let status = document.getElementById('pres-status-'+idx);
            if (!input) return;
            let u = normalizeAnswer(input.value);
            let c = normalizeAnswer(correctAns);
            if (u === '') return;

            if (u === c) {
                input.style.background = '#e8f5e9'; 
                input.style.borderColor = '#4CAF50'; 
                input.style.color = '#1b5e20';
                if (status) {
                    status.className = 'pres-status ok';
                    status.textContent = '✅ Верно';
                }
            } else {
                input.style.background = '#ffebee'; 
                input.style.borderColor = '#f44336'; 
                input.style.color = '#b71c1c';
                if (status) {
                    status.className = 'pres-status bad';
                    status.textContent = showCorrectFlag ? ('❌ Неверно. Верный ответ: ' + correctAns) : '❌ Неверно';
                }
            }

            input.readOnly = true;
            btn.style.display = 'none';

            let helpBtn = document.getElementById('pres-help-'+idx);
            if (helpBtn && showSolutions) helpBtn.style.display = 'inline-block';
        }

        function submitTask(idx, correctAns) {
            event.stopPropagation();
            let input = document.getElementById('ans-'+idx);
            let userAns = input ? normalizeAnswer(input.value) : '';
            let timeSpent = Math.round((Date.now() - slideStartTime) / 1000);

            if (!answeredMap[idx]) {
                userResults.push({ taskNum: idx + 1, userAns: userAns, correctAns: normalizeAnswer(correctAns), time: timeSpent });
                answeredMap[idx] = true;
            }
            nextSlide();
        }

        function renderResults() {
            if (resultsRendered) return;
            resultsRendered = true;

            collectMissingResults();

            let tbody = document.getElementById('results-tbody');
            let summary = document.getElementById('results-summary');
            let totalTimeBox = document.getElementById('results-total-time');
            let html = '';
            let correctCount = 0;
            let autoCheckedCount = 0;
            let selfCheckCount = 0;

            userResults
                .sort((a, b) => a.taskNum - b.taskNum)
                .forEach((res, idx) => {
                    const isSelfCheck = !!secondPartFlags[res.taskNum - 1];
                    const isCorrect = !isSelfCheck && (normalizeAnswer(res.userAns) === normalizeAnswer(res.correctAns));
                    if (isSelfCheck) selfCheckCount++;
                    else {
                        autoCheckedCount++;
                        if (isCorrect) correctCount++;
                    }
                    let rowClass = isSelfCheck ? 'row-self-check' : (isCorrect ? 'row-correct' : 'row-incorrect');
                    let displayAns = res.userAns === "" ? "—" : res.userAns;
                    let resultText = isSelfCheck ? '📝 Самопроверка' : (isCorrect ? '✅ Верно' : '❌ Неверно');
                    let correctCell = showCorrectOnError ? \`<td>\${isSelfCheck ? '—' : res.correctAns}</td>\` : '';
                    let solutionCell = showSolutions ? \`<td><button class="help-btn" onclick="event.stopPropagation(); window.openTheoryModalLocal('theory-pres-\${res.taskNum - 1}')">Смотреть</button></td>\` : '';

                    html += \`<tr class="\${rowClass}">
                        <td>\${res.taskNum}</td>
                        <td>\${displayAns}</td>
                        <td>\${resultText}</td>
                        \${correctCell}
                        <td>\${res.time} сек.</td>
                        \${solutionCell}
                    </tr>\`;
                });

            if (summary) {
                if (autoCheckedCount > 0) {
                    summary.textContent = 'Верно: ' + correctCount + ' из ' + autoCheckedCount +
                        (selfCheckCount > 0 ? ' · Самопроверка: ' + selfCheckCount : '');
                } else {
                    summary.textContent = 'Самопроверка: ' + selfCheckCount;
                }
            }

            if (workEndTime === null) workEndTime = Date.now();
            let totalWorkSeconds = Math.max(0, Math.round((workEndTime - (workStartTime || presentationStartTime)) / 1000));
            if (totalTimeBox) {
                totalTimeBox.textContent = '⏱ Общее время работы: ' + formatTime(totalWorkSeconds);
            }

            tbody.innerHTML = html;
        }

        function openTheoryModalLocal(dataId) {
            let el = document.getElementById(dataId);
            if(el) {
                const modal = document.querySelector('#modal-overlay .modal-box');
                if (modal) modal.classList.remove('pres-expanded-task-modal');
                document.getElementById('modal-content-box').innerHTML = decodeURIComponent(el.textContent);
                document.getElementById('modal-overlay').style.display = 'flex';
                if (window.MathJax) MathJax.typesetPromise([document.getElementById('modal-overlay')]);
            }
        }

        window.onclick = function(e) { return; };

        window.addEventListener('load', () => {
            startPresentationTimer();
            fitPresentationDraftDiagrams();
            document.querySelectorAll('.pres-btn').forEach(btn => {
                let match = btn.getAttribute('onclick') ? btn.getAttribute('onclick').match(/submitTask\\((\\d+),\\s*'([^']*)'\\)/) : null;
                if (match) btn.setAttribute('data-correct', match[2]);
            });

            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([document.body]).then(scheduleFitText).catch(scheduleFitText);
            } else {
                scheduleFitText();
            }
        });
        window.addEventListener('resize', scheduleFitText);
        ${window.CANVAS_LOGIC_SCRIPT}
    ${window.SCRIPT_END}
</body>
</html>`;

    let blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    let a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    document.getElementById('pres-modal').style.display = 'none';
}
