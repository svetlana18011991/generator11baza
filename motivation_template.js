window.MOTIVATION_TEMPLATE = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Мотивационное послание</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>window.MathJax = { tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], processEscapes: true }, startup: { typeset: false } };<\/script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
    <style>
        :root{
            --accent:#ff8c00;
            --blue:#42a5f5;
            --good:#38d982;
            --bad:#ff5470;
            --dark:#111827;
            --paper:#ffffff;
            --shadow:0 18px 50px rgba(0,0,0,.28);
        }
        *{box-sizing:border-box}
        html,body{margin:0;min-height:100%;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#101522;color:#fff}
        body{
            overflow-x:hidden;
            background:
                radial-gradient(circle at 15% 18%, rgba(255,140,0,.20), transparent 28%),
                radial-gradient(circle at 82% 18%, rgba(66,165,245,.18), transparent 30%),
                radial-gradient(circle at 50% 90%, rgba(95,255,180,.10), transparent 34%),
                linear-gradient(135deg,#0b1020,#151a2c 48%,#101018);
        }
        .app{width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:20px 0 28px}
        .top{
            display:flex;align-items:center;justify-content:space-between;gap:14px;
            background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);
            border-radius:22px;padding:14px 18px;margin-bottom:16px;box-shadow:var(--shadow);backdrop-filter:blur(10px)
        }
        h1{margin:0;font-size:clamp(24px,3vw,42px);line-height:1.05;color:#fff;text-shadow:0 0 20px rgba(255,140,0,.45)}
        .subtitle{color:rgba(255,255,255,.76);font-size:14px;margin-top:4px}
        .progressPill{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:10px 14px;font-weight:900;white-space:nowrap}
        .main{
            display:grid;
            grid-template-columns:minmax(340px, 1fr) minmax(290px, 360px);
            gap:16px;
            align-items:start;
        }
        .puzzleBoard{
            position:relative;
            background:rgba(255,255,255,.08);
            border:1px solid rgba(160,210,255,.24);
            border-radius:24px;
            padding:14px;
            box-shadow:var(--shadow), 0 0 24px rgba(72,170,255,.12), inset 0 0 20px rgba(255,255,255,.03);
            overflow:hidden;
        }
        .puzzleBoard::before{
            content:"";position:absolute;inset:0;
            background:linear-gradient(135deg, rgba(255,255,255,.08), transparent 38%, rgba(255,255,255,.03));
            pointer-events:none;
        }
        .puzzleBoard::after{
            content:""; position:absolute; inset:0; border-radius:24px; pointer-events:none;
            box-shadow: 0 0 0 1px rgba(139,208,255,.28), 0 0 22px rgba(56,149,255,.22), 0 0 45px rgba(68,168,255,.10);
            animation: puzzleGlow 3.6s ease-in-out infinite alternate;
        }
        @keyframes puzzleGlow{
            0%{ box-shadow: 0 0 0 1px rgba(139,208,255,.20), 0 0 14px rgba(56,149,255,.18), 0 0 30px rgba(68,168,255,.08);}
            100%{ box-shadow: 0 0 0 1px rgba(170,225,255,.34), 0 0 26px rgba(56,149,255,.30), 0 0 50px rgba(68,168,255,.16);}
        }
        #puzzle{
            position:relative;
            width:100%;
            aspect-ratio: 16 / 10;
            border-radius:18px;
            overflow:hidden;
            background:linear-gradient(135deg, rgba(12,20,46,.96), rgba(8,14,33,.96));
            border:1px solid rgba(160,210,255,.20);
        }
        .piece{
            position:absolute;
            border:0;
            padding:0;
            margin:0;
            cursor:pointer;
            overflow:hidden;
            background:linear-gradient(135deg, rgba(8,18,44,.98), rgba(18,38,76,.96));
            transition:transform .14s ease, box-shadow .25s ease, opacity .25s ease, filter .25s ease;
            box-shadow:inset 0 0 0 1px rgba(182,222,255,.20), inset 0 0 20px rgba(255,255,255,.035);
        }
        .piece .piece-image{
            position:absolute;
            inset:0;
            opacity:0;
            transition:opacity .28s ease;
            background-image:var(--img);
            background-size:var(--bgw) var(--bgh);
            background-position:var(--bgx) var(--bgy);
            background-repeat:no-repeat;
        }
        .piece::before{
            content:"?";
            position:absolute;
            inset:0;
            z-index:2;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:clamp(22px,3.5vw,46px);
            color:rgba(255,255,255,.95);
            text-shadow:0 0 14px rgba(0,0,0,.72);
            background:
                radial-gradient(circle at 50% 50%, rgba(255,255,255,.08), transparent 34%),
                linear-gradient(135deg, rgba(20,41,83,.90), rgba(7,15,36,.98));
            font-weight:1000;
        }
        .piece .puzzle-lines{
            position:absolute;
            inset:0;
            z-index:3;
            pointer-events:none;
            background:
                radial-gradient(circle at 100% 50%, transparent 0 8%, rgba(178,222,255,.24) 8.5%, transparent 9.5%),
                radial-gradient(circle at 0 50%, transparent 0 8%, rgba(178,222,255,.18) 8.5%, transparent 9.5%),
                radial-gradient(circle at 50% 0, transparent 0 8%, rgba(178,222,255,.16) 8.5%, transparent 9.5%),
                radial-gradient(circle at 50% 100%, transparent 0 8%, rgba(178,222,255,.18) 8.5%, transparent 9.5%);
            box-shadow:inset 0 0 0 1px rgba(198,232,255,.28);
            opacity:.9;
        }
        .piece:hover{
            transform:translateY(-2px) scale(1.006);
            box-shadow:inset 0 0 0 1px rgba(194,232,255,.32), 0 0 16px rgba(75,165,255,.18);
            z-index:4;
        }
        .piece.open{
            cursor:default;
            background:transparent;
            box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 0 18px rgba(87,255,154,.16);
        }
        .piece.open .piece-image{opacity:1}
        .piece.open::before{display:none}
        .piece.open .puzzle-lines{opacity:.55}
        .piece.solvedPulse{animation:piecePulse .75s ease-out 1}
        @keyframes piecePulse{0%{transform:scale(1)}45%{transform:scale(1.025);box-shadow:0 0 28px rgba(87,255,154,.42)}100%{transform:scale(1)}}
        .side{
            background:rgba(255,255,255,.92);
            color:#1b2435;
            border-radius:24px;
            padding:16px;
            box-shadow:var(--shadow);
            border:2px solid rgba(255,140,0,.75);
        }
        .side h2{margin:0 0 8px;color:#e65100}
        .side p{margin:0 0 10px;line-height:1.45}
        .mini{font-size:13px;color:#5c6474}
        .messageBox{
            margin-top:14px;
            padding:14px;
            border-radius:18px;
            background:linear-gradient(135deg,#fff7e7,#eef8ff);
            border:1px solid rgba(255,140,0,.28);
            text-align:center;
            font-weight:900;
            color:#26334f;
        }
        .finishBox{
            display:none;
            margin-top:14px;
        }
        .finishBox.show{display:block}
        .finishCard{
            width:100%;
            background:linear-gradient(135deg,#fff7e7,#eef8ff);
            color:#172033;
            border-radius:18px;
            border:1px solid rgba(255,140,0,.35);
            box-shadow:0 8px 20px rgba(0,0,0,.12);
            padding:16px;
            text-align:center;
        }
        .finishCard h2{margin:0 0 8px;font-size:24px;color:#e65100}
        .finishCard p{font-size:16px;line-height:1.4;margin:0 0 12px}
        .finishCard button,.modal button,.draftTools button,.draftTools select{
            font-family:inherit;
        }
        .restartBtn,.closeBtn,.checkBtn,.nextTryBtn{
            border:0;border-radius:14px;padding:12px 18px;font-weight:1000;cursor:pointer;
            background:linear-gradient(90deg,#ff8c00,#ff5470);color:#fff;
            box-shadow:0 10px 22px rgba(0,0,0,.20);
        }
        .modal{
            display:none;position:fixed;inset:0;z-index:40;
            background:rgba(0,0,0,.62);backdrop-filter:blur(8px);
            align-items:center;justify-content:center;padding:14px;
        }
        .modal.open{display:flex}
        .taskCard{
            position:relative;
            width:min(760px,calc(100vw - 24px));
            max-height:calc(100vh - 28px);
            overflow:auto;
            background:rgba(255,255,255,.96);
            color:#202733;
            border-radius:24px;
            border:2px solid var(--accent);
            box-shadow:var(--shadow);
            padding:18px;
        }
        .taskHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
        .badge{background:#fff3e0;border:1px solid #ffcc80;color:#e65100;border-radius:999px;padding:8px 12px;font-weight:900;white-space:nowrap}
        #taskText{font-size:18px;line-height:1.35;text-align:left}
        #taskText svg,#taskText img{display:block;max-width:100%!important;height:auto!important;max-height:38vh!important;object-fit:contain!important;margin:0 auto 12px!important}
        .answerRow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}
        #answerInput{flex:1;min-width:180px;border:2px solid #d5dde8;border-radius:14px;padding:12px 14px;font-size:18px;outline:none}
        #answerInput:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,140,0,.14)}
        #feedback{font-weight:900;min-height:26px;margin-top:10px}
        .draftBtn{
            border:1px solid #ffcc80;border-radius:14px;background:#fff3e0;color:#e65100;
            padding:10px 12px;font-size:20px;cursor:pointer;
        }
        .draftBtn.active{background:var(--accent);color:#fff}
        .draftPanel{display:none;margin-top:14px;border:2px solid #bbdefb;border-radius:14px;overflow:hidden;background:#fff}
        .draftPanel.open{display:block}
        .draftTools{
            display:flex;gap:8px;align-items:center;flex-wrap:wrap;
            padding:8px 10px;background:#e3f2fd;border-bottom:1px solid #bbdefb;
        }
        .draftTools button{
            background:#fff;border:1px solid #bdd7ef;border-radius:8px;cursor:pointer;font-size:18px;padding:5px 8px;
        }
        .draftTools button.active{background:#fff3e0;border-color:#ffcc80}
        .draftTools select{background:#fff;border:1px solid #90caf9;border-radius:8px;padding:6px 8px;color:#003399;font-weight:700}
        .draftTools input[type=color]{width:38px;height:30px;border:0;background:transparent}
        .draftTools input[type=range]{width:90px}
        .canvasWrap{
            position:relative;height:320px;background-color:#fff;
            background-size:20px 20px;
            background-image:linear-gradient(to right,#d2e3f2 1px,transparent 1px),linear-gradient(to bottom,#d2e3f2 1px,transparent 1px);
        }
        .draftDiagram{
            position:absolute;left:12px;top:12px;z-index:1;background:#fff;border:1px solid #d7d7d7;border-radius:8px;
            box-shadow:0 2px 8px rgba(0,0,0,.08);padding:10px;max-width:42%;max-height:72%;overflow:hidden;pointer-events:none;
        }
        .draftDiagram svg,.draftDiagram img{display:block;max-width:100%!important;max-height:220px!important;width:auto!important;height:auto!important}
        .draftDiagram.tropinki-draft{width:min(42%,350px);max-width:350px;max-height:72%;}
        .draftDiagram.tropinki-draft svg,.draftDiagram.tropinki-draft img{max-height:220px!important;}
        #draftCanvas{position:absolute;inset:0;z-index:2;width:100%;height:100%;touch-action:none;cursor:crosshair;background:transparent}
        @media(max-width:850px){.main{grid-template-columns:1fr}.side{order:-1}.top{flex-direction:column;align-items:flex-start}.canvasWrap{height:280px}}
    </style>
</head>
<body>
<div class="app">
    <div class="top">
        <div>
            <h1 id="gameTitle">Мотивационное послание</h1>
            <div class="subtitle">Открывай детали пазла, решая задания. Собери картинку до конца!</div>
        </div>
        <div class="progressPill">Открыто: <span id="openedCount">0</span> / <span id="totalCount">0</span></div>
    </div>
    <div class="main">
        <div class="puzzleBoard"><div id="puzzle"></div></div>
        <aside class="side">
            <h2>Как играть?</h2>
            <p>Нажми на закрытую деталь пазла, реши задание и введи ответ.</p>
            <p>Верно — деталь откроется. Неверно — деталь останется закрытой, но её можно открыть снова и попробовать ещё раз.</p>
            <div class="messageBox" id="sideMessage">У тебя получится. Шаг за шагом картинка соберётся!</div>
            <div class="finishBox" id="finishBox">
                <div class="finishCard">
                    <h2>Картинка собрана!</h2>
                    <p id="finishText">Ты справился. Продолжай верить в себя!</p>
                    <button class="restartBtn" type="button" onclick="location.reload()">Сыграть ещё раз</button>
                </div>
            </div>
        </aside>
    </div>
</div>

<div class="modal" id="taskModal" onclick="if(event.target===this) closeTaskModal()">
    <div class="taskCard">
        <div class="taskHead">
            <div class="badge" id="taskBadge">Деталь 1</div>
            <button class="closeBtn" type="button" onclick="closeTaskModal()">×</button>
        </div>
        <div id="taskText"></div>
        <div class="answerRow">
            <input id="answerInput" type="text" placeholder="Ответ..." autocomplete="off">
            <button class="checkBtn" type="button" onclick="checkAnswer()">Проверить</button>
            <button class="draftBtn" id="draftToggle" type="button" onclick="toggleDraft()" title="Открыть черновик">✏️</button>
        </div>
        <div id="feedback"></div>
        <div class="draftPanel" id="draftPanel">
            <div class="draftTools" id="draftTools">
                <button type="button" data-tool="pointer" onclick="setTool('pointer')" title="Указатель">👆</button>
                <button type="button" data-tool="zoom" onclick="setTool('zoom')" title="Лупа: нажмите на чертёж, чтобы открыть его крупно">🔍</button>
                <button type="button" data-tool="pen" onclick="setTool('pen')" title="Карандаш">🖊️</button>
                <button type="button" onclick="undoDraft()" title="Отменить">↶</button>
                <button type="button" onclick="redoDraft()" title="Повторить">↷</button>
                <select id="toolSelect" onchange="setTool(this.value)">
                    <option value="" disabled selected hidden>🔺 Фигуры</option>
                    <option value="line">📏 Прямая</option>
                    <option value="vector">↗️ Вектор</option>
                    <option value="circle">⭕ Окружность</option>
                    <option value="triangle">🔺 Треугольник</option>
                    <option value="cylinder">🛢️ Цилиндр</option>
                    <option value="cone">🍦 Конус</option>
                    <option value="sphere">🔮 Сфера</option>
                </select>
                <input type="color" id="drawColor" value="#003399" title="Цвет">
                <input type="range" id="drawSize" min="1" max="15" value="3" title="Толщина">
                <button type="button" data-tool="eraser" onclick="setTool('eraser')" title="Ластик">🧽</button>
                <span style="flex:1"></span>
                <button type="button" onclick="clearDraft()" title="Очистить">🗑️</button>
            </div>
            <div class="canvasWrap" id="canvasWrap">
                <div class="draftDiagram" id="draftDiagram"></div>
                <canvas id="draftCanvas"></canvas>
            </div>
        </div>
    </div>
</div>


<script>
/*__CONFIG_DATA__*/
(function(){
    const cfg = window.__MOTIVATION_CFG__ || {};
    const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
    const image = cfg.image || '';
    const title = cfg.title || 'Мотивационное послание';
    const message = cfg.message || 'Ты можешь больше, чем кажется. Главное — не останавливаться!';
    const finishMessage = cfg.finishMessage || message;
    const puzzle = document.getElementById('puzzle');
    const openedCountEl = document.getElementById('openedCount');
    const totalCountEl = document.getElementById('totalCount');
    let currentIndex = -1;
    const opened = new Set();

    document.getElementById('gameTitle').textContent = title;
    document.getElementById('sideMessage').textContent = message;
    document.getElementById('finishText').textContent = finishMessage;
    totalCountEl.textContent = questions.length;

    function norm(v){ return String(v == null ? '' : v).trim().replace(',', '.').toLowerCase(); }
    function typeset(el){ if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(()=>{}); }
    function firstVisualFromHtml(html){
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        const visual = tmp.querySelector('svg,img,picture,canvas');
        return visual ? visual.outerHTML : '';
    }

    function seededRandom(seed){
        let t = seed >>> 0;
        return function(){
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    function buildPieceLayout(count){
        count = Math.max(1, Number(count) || 1);
        const rand = seededRandom(1000 + count * 97);
        let rects = [{ x: 0, y: 0, w: 100, h: 100 }];

        while (rects.length < count) {
            rects.sort((a,b) => (b.w * b.h) - (a.w * a.h));
            const rect = rects.shift();
            if (!rect) break;

            let vertical = rect.w >= rect.h;
            if (rect.w > 55 && rect.h > 35) vertical = rand() > 0.45 ? vertical : !vertical;

            if (vertical) {
                const cut = 38 + rand() * 24;
                const w1 = rect.w * cut / 100;
                const w2 = rect.w - w1;
                rects.push({ x: rect.x, y: rect.y, w: w1, h: rect.h });
                rects.push({ x: rect.x + w1, y: rect.y, w: w2, h: rect.h });
            } else {
                const cut = 38 + rand() * 24;
                const h1 = rect.h * cut / 100;
                const h2 = rect.h - h1;
                rects.push({ x: rect.x, y: rect.y, w: rect.w, h: h1 });
                rects.push({ x: rect.x, y: rect.y + h1, w: rect.w, h: h2 });
            }
        }

        // Эти области полностью покрывают картинку без дыр и без потери частей.
        return rects.slice(0, count);
    }

    function stylePieceFromRect(piece, rect, index){
        piece.style.left = rect.x + '%';
        piece.style.top = rect.y + '%';
        piece.style.width = rect.w + '%';
        piece.style.height = rect.h + '%';

        // Каждый кусок показывает ровно свою часть общей картинки.
        piece.style.setProperty('--bgw', (100 / rect.w * 100) + '%');
        piece.style.setProperty('--bgh', (100 / rect.h * 100) + '%');

        const bgx = rect.w >= 99.9 ? '50%' : (rect.x / (100 - rect.w) * 100) + '%';
        const bgy = rect.h >= 99.9 ? '50%' : (rect.y / (100 - rect.h) * 100) + '%';
        piece.style.setProperty('--bgx', bgx);
        piece.style.setProperty('--bgy', bgy);

        // Визуально делаем куски похожими на пазл, но не обрезаем саму картинку.
        const rand = seededRandom(6000 + index * 137 + Math.round(rect.x * 11) + Math.round(rect.y * 13));
        piece.style.borderRadius = (10 + rand() * 6) + 'px';
    }

    function syncPuzzleAspectRatio(){
        if(!image) return;
        const img = new Image();
        img.onload = function(){
            if(img.naturalWidth && img.naturalHeight){
                puzzle.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
            }
        };
        img.src = image;
    }

    function buildPuzzle(){
        puzzle.innerHTML = '';
        if(!questions.length){
            puzzle.innerHTML = '<div style="padding:30px;color:#fff;font-weight:900">Нет заданий для игры. Сначала сгенерируйте вариант.</div>';
            return;
        }

        syncPuzzleAspectRatio();
        const layout = buildPieceLayout(questions.length);

        for(let i = 0; i < questions.length; i++){
            const rect = layout[i];
            const piece = document.createElement('button');
            piece.type = 'button';
            piece.className = 'piece';
            piece.dataset.index = i;
            piece.style.setProperty('--img', 'url("' + image + '")');
            stylePieceFromRect(piece, rect, i);

            const inner = document.createElement('div');
            inner.className = 'piece-image';
            piece.appendChild(inner);

            const lines = document.createElement('div');
            lines.className = 'puzzle-lines';
            piece.appendChild(lines);

            piece.addEventListener('click', () => {
                if(opened.has(i)) return;
                openTask(i);
            });
            puzzle.appendChild(piece);
        }
        updateProgress();
    }

    function updateProgress(){
        openedCountEl.textContent = opened.size;
        totalCountEl.textContent = questions.length;
    }

    function openTask(index){
        currentIndex = index;
        const q = questions[index] || {};
        document.getElementById('taskBadge').textContent = 'Деталь ' + (index + 1) + ' из ' + questions.length;
        const prompt = String(q.prompt || q.text || '');
        document.getElementById('taskText').innerHTML = prompt.replace(/\s+([.,!?;:])/g, '$1');
        document.getElementById('answerInput').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').style.color = '#333';
        document.getElementById('taskModal').classList.add('open');
        closeDraft(false);
        setTimeout(() => document.getElementById('answerInput').focus(), 50);
        syncDraftDiagram();
        typeset(document.getElementById('taskText'));
    }

    window.closeTaskModal = function(){
        document.getElementById('taskModal').classList.remove('open');
        closeDraft(false);
        currentIndex = -1;
    };

    window.checkAnswer = function(){
        if(currentIndex < 0) return;
        const q = questions[currentIndex] || {};
        const answer = document.getElementById('answerInput').value;
        const accepts = Array.isArray(q.accepts) && q.accepts.length ? q.accepts : [q.answer, q.correctAnswer].filter(v => v != null);
        const ok = accepts.map(norm).includes(norm(answer));
        const feedback = document.getElementById('feedback');

        if(ok){
            feedback.textContent = '✅ Верно! Деталь открыта.';
            feedback.style.color = '#138a43';
            revealPiece(currentIndex);
            setTimeout(() => closeTaskModal(), 650);
        }else{
            feedback.textContent = '❌ Пока неверно. Деталь не открылась, но можно попробовать ещё раз.';
            feedback.style.color = '#c62828';
            document.getElementById('answerInput').select();
        }
    };

    function revealPiece(index){
        if(opened.has(index)) return;
        opened.add(index);
        const piece = puzzle.querySelector('.piece[data-index="' + index + '"]');
        if(piece){
            piece.classList.add('open','solvedPulse');
            setTimeout(()=>piece.classList.remove('solvedPulse'),800);
        }
        updateProgress();
        if(opened.size === questions.length){
            setTimeout(()=>document.getElementById('finishBox').classList.add('show'),750);
        }
    }

    document.getElementById('answerInput').addEventListener('keydown', e => {
        if(e.key === 'Enter') checkAnswer();
    });

    // --- Черновик: объектная логика по образцу башни ---
    const draft = {
        canvas:null, ctx:null, objects:[], currentObj:null, draggingObj:null,
        action:null, dragStartX:0, dragStartY:0, dragStartDist:1, initialScale:1,
        dragStartAngle:0, initialAngle:0, isDrawing:false, history:[], historyIndex:-1
    };

    function cloneObjects(){ return JSON.parse(JSON.stringify(draft.objects)); }
    function restoreObjects(snapshot){ draft.objects.length = 0; snapshot.forEach(o => draft.objects.push(JSON.parse(JSON.stringify(o)))); draft.currentObj = null; draft.draggingObj = null; draft.action = null; renderDraft(); }
    function saveHistory(){ draft.history = draft.history.slice(0, draft.historyIndex + 1); draft.history.push(cloneObjects()); if(draft.history.length > 80) draft.history.shift(); draft.historyIndex = draft.history.length - 1; }

    function resizeDraft(){
        const canvas = document.getElementById('draftCanvas');
        const wrap = document.getElementById('canvasWrap');
        if(!canvas || !wrap) return;
        const rect = wrap.getBoundingClientRect();
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        draft.canvas = canvas;
        draft.ctx = ctx;
        renderDraft();
    }

    function getTool(){ return window.currentDraftTool || 'pen'; }
    window.setTool = function(tool){
        window.currentDraftTool = tool || 'pen';
        document.querySelectorAll('#draftTools [data-tool]').forEach(btn => btn.classList.toggle('active', btn.dataset.tool === window.currentDraftTool));
        const sel = document.getElementById('toolSelect');
        if(sel && ['line','vector','circle','triangle','cylinder','cone','sphere'].includes(window.currentDraftTool)) sel.value = window.currentDraftTool;
        const c = document.getElementById('draftCanvas');
        if(c) c.style.cursor = window.currentDraftTool === 'pointer' ? 'move' : (window.currentDraftTool === 'zoom' ? 'zoom-in' : 'crosshair');
    };


    function openMotivationDraftZoomModal(sourceEl){
        if(!sourceEl || !sourceEl.innerHTML.trim()) return;
        const old = document.getElementById('motivation-draft-zoom-modal');
        if(old){ old.remove(); return; }

        const previousOverflow = document.body.style.overflow || '';
        const overlay = document.createElement('div');
        overlay.id = 'motivation-draft-zoom-modal';
        overlay.dataset.previousOverflow = previousOverflow;
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(7,18,31,.88);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;';

        const modal = document.createElement('div');
        modal.style.cssText = 'position:relative;width:min(96vw,1700px);height:94vh;background:#fff;border:3px solid #19b8b0;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column;';

        const head = document.createElement('div');
        head.style.cssText = 'flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#e9fbf9;border-bottom:1px solid #9adfd9;color:#073b4c;font:700 17px Arial,sans-serif;';
        head.innerHTML = '<span style="font-size:23px;">🔍</span><span>Увеличенный чертёж</span><span style="margin-left:auto;font-size:13px;font-weight:500;color:#526273;">Нажмите на чертёж ещё раз, чтобы закрыть</span>';

        const close = document.createElement('button');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.title = 'Закрыть';
        close.style.cssText = 'margin-left:6px;width:38px;height:38px;border:1px solid #ef7f1a;border-radius:10px;background:#fff;color:#d95f02;font:700 28px/30px Arial;cursor:pointer;';
        head.appendChild(close);

        const viewport = document.createElement('div');
        viewport.style.cssText = 'flex:1 1 auto;min-height:0;overflow:hidden;background:#f4f8fb;padding:18px;box-sizing:border-box;cursor:zoom-out;';
        const diagram = document.createElement('div');
        diagram.innerHTML = sourceEl.innerHTML;
        diagram.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box;';
        diagram.querySelectorAll('img,svg,picture,canvas').forEach(function(media){
            media.style.setProperty('display','block','important');
            media.style.setProperty('width','auto','important');
            media.style.setProperty('height','auto','important');
            media.style.setProperty('min-width','0','important');
            media.style.setProperty('min-height','0','important');
            media.style.setProperty('max-width','100%','important');
            media.style.setProperty('max-height','100%','important');
            media.style.setProperty('margin','auto','important');
            media.style.setProperty('object-fit','contain','important');
            media.style.setProperty('cursor','zoom-out','important');
            media.style.setProperty('box-sizing','border-box','important');
            media.style.setProperty('pointer-events','auto','important');
        });

        viewport.appendChild(diagram);
        modal.appendChild(head);
        modal.appendChild(viewport);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        function closeZoom(){
            const current = document.getElementById('motivation-draft-zoom-modal');
            if(current){
                document.body.style.overflow = current.dataset.previousOverflow || '';
                current.remove();
            }
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e){ if(e.key === 'Escape') closeZoom(); }
        close.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeZoom(); });
        overlay.addEventListener('click', function(e){ if(e.target === overlay) closeZoom(); });
        diagram.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeZoom(); });
        document.addEventListener('keydown', onKey);
    }

    function pointerPos(e){
        const r = draft.canvas.getBoundingClientRect();
        return {x:e.clientX-r.left, y:e.clientY-r.top};
    }
    function getBounds(obj){
        if(obj.tool === 'pen' || obj.tool === 'eraser'){
            const xs = obj.points.map(p=>p.x), ys = obj.points.map(p=>p.y);
            return {minX:Math.min(...xs), minY:Math.min(...ys), maxX:Math.max(...xs), maxY:Math.max(...ys)};
        }
        return {minX:Math.min(obj.sx,obj.ex), minY:Math.min(obj.sy,obj.ey), maxX:Math.max(obj.sx,obj.ex), maxY:Math.max(obj.sy,obj.ey)};
    }
    function hitObject(obj, p){
        const b = getBounds(obj);
        const pad = 12 + (obj.size || 3);
        return p.x >= b.minX-pad && p.x <= b.maxX+pad && p.y >= b.minY-pad && p.y <= b.maxY+pad;
    }
    function topObjectAt(p){
        for(let i=draft.objects.length-1;i>=0;i--){
            if(hitObject(draft.objects[i], p)) return draft.objects[i];
        }
        return null;
    }

    function drawOne(ctx, obj){
        ctx.save();
        ctx.translate(obj.cx || 0, obj.cy || 0);
        ctx.rotate(obj.angle || 0);
        ctx.scale(obj.scale || 1, obj.scale || 1);
        ctx.translate(-(obj.cx || 0), -(obj.cy || 0));
        // Ластик должен стирать только рисунок на прозрачном canvas,
        // а не закрашивать его белым. Тогда клетчатый фон .canvasWrap
        // остаётся видимым и после стирания.
        const isEraser = obj.tool === 'eraser';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.lineWidth = isEraser ? (obj.size || 3) * 3 : (obj.size || 3);
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : (obj.color || '#003399');
        ctx.fillStyle = isEraser ? 'rgba(0,0,0,1)' : (obj.color || '#003399');
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        if(obj.tool === 'pen' || obj.tool === 'eraser'){
            const pts = obj.points || [];
            if(pts.length === 1){
                ctx.beginPath();
                ctx.arc(pts[0].x, pts[0].y, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fill();
            } else if(pts.length > 1){
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for(let i = 1; i < pts.length - 1; i++){
                    const midX = (pts[i].x + pts[i + 1].x) / 2;
                    const midY = (pts[i].y + pts[i + 1].y) / 2;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
                }
                const last = pts[pts.length - 1];
                ctx.lineTo(last.x, last.y);
                ctx.stroke();
            }
        } else if(obj.tool === 'line' || obj.tool === 'vector'){
            ctx.beginPath(); ctx.moveTo(obj.sx,obj.sy); ctx.lineTo(obj.ex,obj.ey); ctx.stroke();
            if(obj.tool === 'vector'){
                const ang = Math.atan2(obj.ey-obj.sy,obj.ex-obj.sx);
                const len = 12 + (obj.size || 3);
                ctx.beginPath();
                ctx.moveTo(obj.ex,obj.ey);
                ctx.lineTo(obj.ex-len*Math.cos(ang-Math.PI/6), obj.ey-len*Math.sin(ang-Math.PI/6));
                ctx.moveTo(obj.ex,obj.ey);
                ctx.lineTo(obj.ex-len*Math.cos(ang+Math.PI/6), obj.ey-len*Math.sin(ang+Math.PI/6));
                ctx.stroke();
            }
        } else if(obj.tool === 'circle'){
            const rad = Math.hypot(obj.ex-obj.sx,obj.ey-obj.sy);
            ctx.beginPath(); ctx.arc(obj.sx,obj.sy,rad,0,Math.PI*2); ctx.stroke();
        } else if(obj.tool === 'triangle'){
            ctx.beginPath();
            ctx.moveTo(obj.sx,obj.ey); ctx.lineTo((obj.sx+obj.ex)/2,obj.sy); ctx.lineTo(obj.ex,obj.ey); ctx.closePath(); ctx.stroke();
        } else if(obj.tool === 'cylinder'){
            const x=Math.min(obj.sx,obj.ex), y=Math.min(obj.sy,obj.ey), w=Math.abs(obj.ex-obj.sx), h=Math.abs(obj.ey-obj.sy), eh=Math.min(28,h/4);
            ctx.beginPath(); ctx.ellipse(x+w/2,y+eh/2,w/2,eh/2,0,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x,y+eh/2); ctx.lineTo(x,y+h-eh/2); ctx.moveTo(x+w,y+eh/2); ctx.lineTo(x+w,y+h-eh/2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(x+w/2,y+h-eh/2,w/2,eh/2,0,0,Math.PI*2); ctx.stroke();
        } else if(obj.tool === 'cone'){
            const x=Math.min(obj.sx,obj.ex), y=Math.min(obj.sy,obj.ey), w=Math.abs(obj.ex-obj.sx), h=Math.abs(obj.ey-obj.sy), eh=Math.min(28,h/5);
            ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x,y+h-eh/2); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h-eh/2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(x+w/2,y+h-eh/2,w/2,eh/2,0,0,Math.PI*2); ctx.stroke();
        } else if(obj.tool === 'sphere'){
            const x=Math.min(obj.sx,obj.ex), y=Math.min(obj.sy,obj.ey), w=Math.abs(obj.ex-obj.sx), h=Math.abs(obj.ey-obj.sy), r=Math.min(w,h)/2;
            ctx.beginPath(); ctx.arc(x+w/2,y+h/2,r,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,r,Math.max(4,r*.32),0,0,Math.PI*2); ctx.stroke();
        }
        ctx.restore();
    }

    function renderDraft(){
        const ctx = draft.ctx, canvas = draft.canvas;
        if(!ctx || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0,0,rect.width,rect.height);
        draft.objects.forEach(obj => drawOne(ctx, obj));
        if(draft.currentObj) drawOne(ctx, draft.currentObj);
    }

    function startDraw(e){
        if(!draft.canvas) return;
        const p = pointerPos(e);
        const tool = getTool();
        e.preventDefault();
        if(tool === 'zoom'){
            const figure = document.getElementById('draftDiagram');
            if(figure && figure.style.display !== 'none' && figure.innerHTML.trim()){
                const r = figure.getBoundingClientRect();
                if(e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom){
                    openMotivationDraftZoomModal(figure);
                }
            }
            return;
        }
        if(tool === 'pointer'){
            const hit = topObjectAt(p);
            if(hit){
                draft.draggingObj = hit;
                draft.dragStartX = p.x; draft.dragStartY = p.y;
                draft.action = 'move';
            }
            return;
        }
        const color = document.getElementById('drawColor').value || '#003399';
        const size = Number(document.getElementById('drawSize').value || 3);
        draft.isDrawing = true;
        if(tool === 'pen' || tool === 'eraser'){
            draft.currentObj = {tool,color,size,points:[p],cx:p.x,cy:p.y,scale:1,angle:0};
        }else{
            draft.currentObj = {tool,color,size,sx:p.x,sy:p.y,ex:p.x,ey:p.y,cx:p.x,cy:p.y,scale:1,angle:0};
        }
    }
    function moveDraw(e){
        if(!draft.canvas) return;
        const p = pointerPos(e);
        e.preventDefault();
        if(draft.draggingObj && draft.action === 'move'){
            const dx = p.x - draft.dragStartX, dy = p.y - draft.dragStartY;
            const obj = draft.draggingObj;
            if(obj.points) obj.points.forEach(pt => {pt.x += dx; pt.y += dy;});
            if('sx' in obj){obj.sx += dx; obj.ex += dx; obj.sy += dy; obj.ey += dy;}
            obj.cx = (obj.cx || 0) + dx; obj.cy = (obj.cy || 0) + dy;
            draft.dragStartX = p.x; draft.dragStartY = p.y;
            renderDraft(); return;
        }
        if(!draft.isDrawing || !draft.currentObj) return;
        if(draft.currentObj.tool === 'pen' || draft.currentObj.tool === 'eraser'){
            const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
            for(const evt of events){
                const next = pointerPos(evt);
                const pts = draft.currentObj.points;
                const prev = pts[pts.length - 1];
                if(!prev || Math.hypot(next.x - prev.x, next.y - prev.y) >= 0.7){
                    pts.push(next);
                }
            }
        }else{
            draft.currentObj.ex = p.x;
            draft.currentObj.ey = p.y;
            const b=getBounds(draft.currentObj);
            draft.currentObj.cx=(b.minX+b.maxX)/2;
            draft.currentObj.cy=(b.minY+b.maxY)/2;
        }
        renderDraft();
    }
    function endDraw(){
        if(draft.draggingObj){ draft.draggingObj=null; draft.action=null; saveHistory(); return; }
        if(!draft.isDrawing) return;
        draft.isDrawing = false;
        if(draft.currentObj){
            if(draft.currentObj.points && draft.currentObj.points.length < 2){ draft.currentObj=null; return; }
            const b = getBounds(draft.currentObj);
            draft.currentObj.cx = (b.minX+b.maxX)/2; draft.currentObj.cy = (b.minY+b.maxY)/2;
            draft.objects.push(JSON.parse(JSON.stringify(draft.currentObj)));
            draft.currentObj = null;
            saveHistory();
            renderDraft();
        }
    }

    window.undoDraft = function(){ if(draft.historyIndex > 0){ draft.historyIndex--; restoreObjects(draft.history[draft.historyIndex]); } };
    window.redoDraft = function(){ if(draft.historyIndex < draft.history.length - 1){ draft.historyIndex++; restoreObjects(draft.history[draft.historyIndex]); } };
    window.clearDraft = function(){ draft.objects.length=0; draft.currentObj=null; saveHistory(); renderDraft(); };

    function initDraft(){
        const canvas = document.getElementById('draftCanvas');
        if(!canvas || canvas.dataset.bound) return;
        canvas.dataset.bound = '1';
        resizeDraft();
        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', moveDraw);
        canvas.addEventListener('pointerup', endDraw);
        canvas.addEventListener('pointercancel', endDraw);
        canvas.addEventListener('pointerleave', endDraw);
        window.addEventListener('resize', () => { if(document.getElementById('draftPanel').classList.contains('open')) resizeDraft(); });
        setTool('pen');
        saveHistory();
    }

    window.toggleDraft = function(){
        const panel = document.getElementById('draftPanel');
        const btn = document.getElementById('draftToggle');
        const open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        btn.classList.toggle('active', open);
        if(open) setTimeout(()=>{ initDraft(); resizeDraft(); }, 40);
    };
    function closeDraft(reset){
        const panel = document.getElementById('draftPanel');
        const btn = document.getElementById('draftToggle');
        panel.classList.remove('open'); btn.classList.remove('active');
        if(reset){
            draft.objects.length=0; draft.currentObj=null; draft.history=[]; draft.historyIndex=-1;
            saveHistory(); renderDraft();
        }
    }
    function syncDraftDiagram(){
        const d = document.getElementById('draftDiagram');
        if(!d || currentIndex < 0) return;
        const q = questions[currentIndex] || {};
        const visual = q.svg || firstVisualFromHtml(q.prompt || q.text || '');
        d.innerHTML = visual || '';
        const isTropinki = /(?:Тропинк|Tropinka|План сюжета[^<]{0,80}Тропинки)/i.test(String(visual || '') + ' ' + String(q.prompt || q.text || ''));
        d.classList.toggle('tropinki-draft', !!isTropinki);
        d.style.display = visual ? 'block' : 'none';
    }

    buildPuzzle();
})();
<\/script>
</body>
</html>`;


var MOTIVATION_TEMPLATE = window.MOTIVATION_TEMPLATE;
