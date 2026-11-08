const BATTLE_TEMPLATE = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Баттл ЕГЭ</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap" rel="stylesheet">
    <script>window.MathJax = { tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], processEscapes: true, macros: { tg: '\\\\operatorname{tg}', ctg: '\\\\operatorname{ctg}' } }, startup: { typeset: false } };<\/script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
    <style>
        :root{
            --accent:#ff8c00;
            --accent2:#4fc3ff;
            --text:#ffffff;
            --panel:rgba(255,255,255,.93);
            --shadow:0 18px 45px rgba(0,0,0,.35);
            --good:#57ff9a;
            --bad:#ff5470;
        }
        *{box-sizing:border-box}
        html,body{height:100%;margin:0;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#091018;color:var(--text)}
        body{background:#091018}
        #arena{position:relative;width:100vw;height:100vh;overflow:hidden;background:url('arena.png') center/cover no-repeat}
        #arena::before{content:"";position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,.28), rgba(0,0,0,.36));pointer-events:none}
        #titleWrap{display:none}
        #titleWrap .main{font-size:clamp(30px,4vw,54px);font-weight:1000;letter-spacing:1px;text-transform:uppercase;text-shadow:0 0 18px rgba(255,140,0,.85), 0 0 36px rgba(255,140,0,.45)}
        #titleWrap .sub{margin-top:3px;font-family:'Caveat',cursive;font-size:clamp(22px,2vw,34px);color:rgba(255,255,255,.9)}
        #hud{position:absolute;top:22px;left:20px;right:20px;z-index:7;display:flex;align-items:center;gap:12px;pointer-events:none}
        .pill{background:rgba(11,18,28,.72);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);padding:10px 14px;border-radius:999px;box-shadow:var(--shadow);font-weight:800;white-space:nowrap}
        #timerPill{margin-left:auto}
        #heartText{letter-spacing:4px;color:#ff6985;text-shadow:0 0 14px rgba(255,84,112,.55)}
        #scene{position:absolute;inset:0;z-index:2}
        .fighterZone{position:absolute;top:0;bottom:auto;display:flex;flex-direction:column;align-items:center;gap:10px;z-index:3}
        #heroZone{left:-0.91%;top:14.16%;width:33.14vw}
        #bossZone{left:58.5%;top:0.81%;width:43.3vw}
        .fighterName{padding:8px 16px;border-radius:999px;background:rgba(11,18,28,.72);border:2px solid var(--accent);font-size:15px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;box-shadow:0 0 12px var(--accent),0 0 24px rgba(255,140,0,.35),var(--shadow);text-align:center;text-shadow:0 0 8px rgba(255,255,255,.55)}
        #heroZone .fighterName{border-color:#8b5cff;box-shadow:0 0 12px #8b5cff,0 0 24px rgba(139,92,255,.35),var(--shadow)}
        #bossZone .fighterName{border-color:#ff8c00;box-shadow:0 0 12px #ff8c00,0 0 24px rgba(255,140,0,.35),var(--shadow)}
        .fighterCard{position:relative;width:100%;height:100%;min-width:0;min-height:0;padding:0;border-radius:24px;background:transparent;border:none;box-shadow:none;display:flex;align-items:flex-end;justify-content:center;overflow:visible}
        .fighterCard img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 22px rgba(0,0,0,.55));transition:transform .25s ease, filter .25s ease}
        .fighterCard.attack img{transform:scale(1.03) translateX(8px)}
        .fighterCard.hit img{transform:scale(.96);filter:drop-shadow(0 0 18px rgba(255,84,112,.9))}
        .hpWrap{width:min(24vw,300px);background:rgba(11,18,28,.72);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:7px 9px;box-shadow:var(--shadow);margin-top:-18px}
        .hpLabel{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:900;color:rgba(255,255,255,.88);margin-bottom:6px;text-transform:uppercase}
        .hpBar{position:relative;height:16px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;border:1px solid rgba(255,255,255,.15)}
        .hpBar::after{content:"";position:absolute;inset:0;background-repeat:repeat-x;background-size:var(--segment-size, 20px) 100%;background-image:linear-gradient(to right, transparent calc(100% - 1px), rgba(255,255,255,.18) calc(100% - 1px));pointer-events:none;opacity:.9}
        .hpFill{height:100%;width:100%;transition:width .45s ease;border-radius:999px}
        #heroHpFill{background:linear-gradient(90deg,#69f0ae,#d4ff62)}
        #bossHpFill{background:linear-gradient(90deg,#ff5470,#ff8c00)}
        
        #heroCard{width:33.14vw;height:73.08vh}
        #bossCard{width:43.3vw;height:90.92vh}
        #heroZone .hpWrap{width:min(24vw,300px);position:absolute;left:50%;top:calc(73.08vh + 8px);transform:translateX(-50%);z-index:8}
        #bossZone .hpWrap{width:min(24vw,300px);position:absolute;left:50%;top:calc(90.92vh + 8px);transform:translateX(-50%);z-index:8}

        #centerControls{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);z-index:8;display:flex;flex-direction:column;align-items:center;gap:14px}
        #startBattleBtn{border:none;border-radius:18px;background:linear-gradient(90deg,#ff8c00,#ff5470);color:#fff;padding:16px 28px;font-size:22px;font-weight:1000;cursor:pointer;box-shadow:0 18px 28px rgba(0,0,0,.28), 0 0 20px rgba(255,140,0,.38)}
        #startBattleBtn:hover{filter:brightness(1.06);transform:translateY(-1px)}
        #questionPanel{display:none;position:absolute;left:45.7%;top:52%;transform:translate(-50%,-50%);width:min(630px,calc(100vw - 26px));max-height:82vh;background:var(--panel);color:#222;border-radius:24px;border:2px solid var(--accent);box-shadow:0 0 30px rgba(255,140,0,.25), var(--shadow);padding:16px 16px 14px;z-index:9;overflow:hidden}
        #questionHead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px}
        #questionHead .badge{background:#fff3e0;border:1px solid #ffcc80;color:#e65100;border-radius:999px;padding:8px 14px;font-weight:900}
        #questionHead .prog{font-weight:900;color:#666}
        #q{font-size:clamp(14px,1.9vh,18px);line-height:1.26;max-height:none;overflow:visible;padding:6px 4px 6px;text-align:center;color:#222;text-wrap:pretty;}
        #q img,#q svg{display:block;max-width:100% !important;width:auto !important;height:auto !important;max-height:min(30vh,300px) !important;object-fit:contain !important;margin:0 auto 10px auto !important}
        #answerRow{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:12px}
        #ansInput{width:min(240px,100%);font-size:18px;padding:12px 16px;border-radius:14px;border:2px solid #ddd;outline:none;text-align:center}
        #attackBtn,#nextBtn{border:none;border-radius:14px;padding:12px 18px;font-size:17px;font-weight:1000;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.16)}
        #attackBtn{background:var(--accent);color:#fff}
        #nextBtn{display:none;background:#26334f;color:#fff}
        #msg{margin-top:10px;min-height:24px;text-align:center;font-weight:900}
        #projectile{display:none;position:fixed;z-index:14;width:84px;height:84px;pointer-events:none;transform:translate(-50%,-50%);object-fit:contain;filter:drop-shadow(0 0 12px rgba(255,255,255,.45)) drop-shadow(0 0 22px rgba(255,140,0,.45))}
        #explosion{display:none;position:fixed;z-index:15;width:26px;height:26px;border-radius:999px;pointer-events:none;transform:translate(-50%,-50%);background:radial-gradient(circle, rgba(255,255,255,.98) 0%, rgba(255,214,64,.95) 26%, rgba(255,140,0,.88) 46%, rgba(255,84,112,.34) 68%, rgba(255,84,112,0) 100%);box-shadow:0 0 20px rgba(255,255,255,.8),0 0 44px rgba(255,140,0,.7);animation:boom .45s ease-out forwards}
        @keyframes boom{0%{opacity:1;transform:translate(-50%,-50%) scale(.2)}55%{opacity:1;transform:translate(-50%,-50%) scale(3.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(5.4)}}
        #startOverlay{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.48);backdrop-filter:blur(7px);padding:16px}
        #startCard{width:min(980px,100%);background:rgba(11,18,28,.86);border:1px solid rgba(255,255,255,.14);border-radius:28px;box-shadow:var(--shadow);padding:22px}

        #nameStep{display:block}
        #charStep{display:none}
        #teamNameInput{display:block;width:min(420px,100%);margin:16px auto 8px;padding:14px 18px;border-radius:16px;border:2px solid rgba(255,140,0,.75);background:rgba(255,255,255,.96);color:#111;font-size:20px;text-align:center;outline:none;box-shadow:0 0 18px rgba(255,140,0,.18)}
        #teamNameInput:focus{box-shadow:0 0 22px rgba(255,140,0,.44);border-color:#ff8c00}
        #nameNextBtn{display:block;margin:14px auto 0;border:none;border-radius:16px;background:linear-gradient(90deg,#ff8c00,#ff5470);color:#fff;padding:14px 24px;font-size:18px;font-weight:1000;cursor:pointer;box-shadow:0 14px 26px rgba(255,84,112,.24)}
        .chosenNameInCard{font-size:18px;font-weight:1000;color:#fff;text-shadow:0 0 12px rgba(255,140,0,.65);margin-top:2px;min-height:24px}

        #startCard h1{margin:0 0 8px;text-align:center;font-size:clamp(32px,4.8vw,54px);text-transform:uppercase;text-shadow:0 0 18px rgba(255,140,0,.85)}
        #startCard p{margin:0 auto 18px;max-width:840px;text-align:center;color:rgba(255,255,255,.84);font-size:16px;line-height:1.45}
        #chars{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .charCard{background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.12);border-radius:22px;padding:14px;cursor:pointer;text-align:center;transition:.15s;display:flex;flex-direction:column;align-items:center;gap:10px}
        .charCard:hover,.charCard.selected{border-color:var(--accent);box-shadow:0 0 16px rgba(255,140,0,.28);transform:translateY(-2px)}
        .charThumb{width:min(16vw,140px);height:min(18vw,170px);min-width:90px;min-height:110px;display:flex;align-items:center;justify-content:center}
        .charThumb img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.42))}
        .charName{font-weight:1000;font-size:18px}
        #charStep .charName{display:none}
        .charDesc{font-size:13px;color:rgba(255,255,255,.68)}
        #enterArenaBtn,#restartBtn{display:block;margin:18px auto 0;border:none;border-radius:16px;background:linear-gradient(90deg,#ff8c00,#ff5470);color:#fff;padding:14px 24px;font-size:18px;font-weight:1000;cursor:pointer;box-shadow:0 14px 26px rgba(255,84,112,.24)}
        
        #questionPanel.draft-open{display:none!important;}
        #draftBtnBattle{border:1px solid var(--accent);border-radius:14px;padding:10px 13px;font-size:20px;background:#fff;color:var(--accent);cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.14)}
        #draftBtnBattle.active{background:var(--accent);color:#fff}
        #drawPanel{display:none;position:absolute;left:45.7%;top:52%;transform:translate(-50%,-50%);width:min(630px,calc(100vw - 26px));height:82vh;background:rgba(255,255,255,.96);border:2px solid var(--accent);border-radius:22px;padding:10px;box-shadow:0 0 25px rgba(0,0,0,.25);box-sizing:border-box;z-index:8;color:#222}
        #drawPanel.open{display:flex;flex-direction:column;gap:10px}
        #drawTools{display:flex;flex-wrap:nowrap;gap:7px;align-items:center;background:#e3f2fd;padding:6px 8px;border-radius:10px;border:1px solid #bbdefb;color:#333;overflow:hidden;min-height:40px;flex:0 0 auto}
        #drawTools button{background:none;border:none;cursor:pointer;font-size:18px;padding:1px 3px;border-radius:6px;line-height:1.2}
        #drawTools button:hover{background:rgba(255,255,255,.75)}
        #drawTools button.active{background:#fff3e0;box-shadow:0 0 0 1px #ffcc80 inset}
        #drawTools select{background:#fff;border:1px solid #90caf9;border-radius:6px;padding:3px 5px;font-size:12px;cursor:pointer;outline:none;color:#003399;font-weight:500;min-width:96px}
        #drawTools input[type="color"]{cursor:pointer;height:28px;width:32px;border:none;background:transparent;padding:0;flex:0 0 auto}
        #drawTools input[type="range"]{cursor:pointer;width:70px;flex:0 0 auto}
        #drawClose{margin-left:auto;background:#fff3e0 !important;color:#e65100;border:1px solid #ffcc80 !important;width:28px;height:28px;border-radius:8px;font-size:19px !important;line-height:1}
        
        #drawCanvasWrap{
            position:relative;
            flex:1 1 auto;
            min-height:0;
            background-color:#fff;
            background-size:20px 20px;
            background-image:linear-gradient(to right,#d2e3f2 1px,transparent 1px),linear-gradient(to bottom,#d2e3f2 1px,transparent 1px);
            border:2px solid #bbdefb;
            border-radius:10px;
            overflow:hidden;
            display: flex;
            flex-direction: column;
        }

        #draftTaskStatement{
            display:none;
            position:relative;
            flex:0 0 auto;
            max-height:45vh;
            overflow:hidden;
            padding:10px 12px;
            color:#222;
            background:#fff;
            border-bottom:2px solid #bbdefb;
            box-sizing:border-box;
            z-index:10;
        }
        #draftTaskStatement .draft-condition-text{
            position:relative;
            z-index:1;
            font-size:14px;
            line-height:1.22;
            text-align:center;
            color:#222;
            pointer-events:none;
        }
        #draftTaskStatement .draft-figure-wrap{
            position:relative;
            display:block;
            width:fit-content;
            max-width:100%;
            margin:0 auto 6px auto;
            padding:8px 12px;
            background:#fff;
            border:1px solid #edf3fb;
            border-radius:10px;
            overflow:visible;
            box-sizing:border-box;
            pointer-events:none;
        }
        #draftTaskStatement .draft-figure-wrap svg,
        #draftTaskStatement .draft-figure-wrap img,
        #draftTaskStatement .draft-figure-wrap picture,
        #draftTaskStatement .draft-figure-wrap canvas{
            display:block;
            max-width:100%;
            max-height:26vh;
            width:auto!important;
            height:auto!important;
            object-fit:contain!important;
            margin:0 auto!important;
            pointer-events:none;
        }

        #canvas-battle{
            position:absolute!important;
            left:0!important;
            top:0!important;
            right:0!important;
            bottom:0!important;
            width:100%!important;
            height:100%!important;
            z-index:30!important;
            pointer-events:auto!important;
            touch-action:none!important;
            cursor:crosshair!important;
            background:transparent!important;
        }
        
        @media(max-width:1120px){
            #questionPanel.draft-open{display:none!important}
            #drawPanel{left:50%;right:auto;top:54%;bottom:auto;transform:translate(-50%,-50%);width:min(92vw,660px);height:76vh;border:2px solid var(--accent);border-radius:18px}
            #drawTools{display:flex;flex-wrap:nowrap;gap:7px;align-items:center;background:#e3f2fd;padding:6px 8px;border-radius:10px;border:1px solid #bbdefb;color:#333;overflow:hidden;min-height:40px;flex:0 0 auto}
        }
        
        @keyframes idleHero{0%,100%{transform:translateY(0) rotate(-.5deg)}50%{transform:translateY(-7px) rotate(.8deg)}}
        @keyframes idleBoss{0%,100%{transform:translateY(0) rotate(.4deg)}50%{transform:translateY(-6px) rotate(-.8deg)}}
        @keyframes blueBurn{0%{filter:drop-shadow(0 18px 22px rgba(0,0,0,.55))}25%{filter:drop-shadow(0 0 16px #6ff) drop-shadow(0 0 34px #00b7ff) brightness(1.4)}50%{filter:drop-shadow(0 0 26px #00e5ff) drop-shadow(0 0 54px #1677ff) brightness(1.9) saturate(1.5)}100%{filter:drop-shadow(0 18px 22px rgba(0,0,0,.55))}}
        #heroCard img{animation:idleHero 3.2s ease-in-out infinite}
        #bossCard img{animation:idleBoss 3.6s ease-in-out infinite}
        #heroCard.attack img,#bossCard.attack img,#heroCard.hit img,#bossCard.hit img{animation:none}
        #heroCard.burn img{animation:blueBurn .75s ease-out 1}
        #battleCaption{display:none;position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);z-index:13;min-width:min(520px,calc(100vw - 48px));padding:18px 24px;border-radius:22px;background:rgba(10,14,22,.84);border:2px solid var(--accent);box-shadow:0 0 26px rgba(255,140,0,.42),var(--shadow);text-align:center;font-size:clamp(22px,3vw,40px);font-weight:1000;color:#fff;text-shadow:0 0 16px rgba(255,255,255,.65);pointer-events:none}
        #battleCaption.good{border-color:#57ff9a;box-shadow:0 0 26px rgba(87,255,154,.45),var(--shadow)}
        #battleCaption.bad{border-color:#4fc3ff;box-shadow:0 0 30px rgba(79,195,255,.58),var(--shadow)}

        #finishOverlay{position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.56);backdrop-filter:blur(8px);padding:16px}
        #finishCard{width:min(760px,100%);background:rgba(11,18,28,.92);border:1px solid rgba(255,255,255,.15);border-radius:28px;box-shadow:var(--shadow);padding:28px;text-align:center}
        #finishTitle{font-size:clamp(32px,4.8vw,54px);font-weight:1000;margin-bottom:8px;text-shadow:0 0 16px rgba(255,140,0,.55)}
        #finishText{font-size:17px;line-height:1.45;color:rgba(255,255,255,.86)}
        .stats{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:16px}
        .stat{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px 16px;min-width:150px}
        .stat b{font-size:24px}.stat div{font-size:12px;color:rgba(255,255,255,.68);margin-top:4px}
        @media (max-width:980px){
            .fighterZone{width:min(29vw,250px)}
            .fighterCard{min-width:170px;min-height:210px;height:min(32vh,300px)}
            .hpWrap{width:min(29vw,250px)}
        }
        @media (max-width:760px){
            #hud{top:14px;left:12px;right:12px;gap:8px;flex-wrap:wrap}
            .pill{font-size:13px;padding:8px 10px}
            #timerPill{margin-left:0}
            #questionPanel{top:58%;max-height:58vh;width:min(92vw,700px)}
            #q{max-height:30vh}
        }
    </style>
</head>
<body>
<div id="arena">
    <div id="titleWrap"><div class="main">Арена ЕГЭ</div><div class="sub">Баттл с воплощением экзамена</div></div>
    <div id="hud">
        <div class="pill">Жизни: <span id="heartText">♥♥♥♥♥</span></div>
        <div class="pill">Босс: <span id="bossRemainText">100%</span></div>
        <div class="pill" id="timerPill">⏱ <span id="timer">00:00</span></div>
    </div>

    <div id="scene">
        <div class="fighterZone" id="heroZone">
            <div class="fighterName" id="heroDisplayName">Игрок</div>
            <div class="fighterCard" id="heroCard"><img id="heroImg" src="pers1.png" alt="Игрок"></div>
            <div class="hpWrap">
                <div class="hpLabel"><span>Линия жизни</span><span id="heroHpText">100%</span></div>
                <div class="hpBar" id="heroHpBar"><div class="hpFill" id="heroHpFill"></div></div>
            </div>
        </div>

        <div class="fighterZone" id="bossZone">
            <div class="fighterName">Страж КИМов</div>
            <div class="fighterCard" id="bossCard"><img id="bossImg" src="pers4.png" alt="Страж КИМов"></div>
            <div class="hpWrap">
                <div class="hpLabel"><span>Линия жизни</span><span id="bossHpText">100%</span></div>
                <div class="hpBar" id="bossHpBar"><div class="hpFill" id="bossHpFill"></div></div>
            </div>
        </div>

        <div id="centerControls">
            <button id="startBattleBtn" type="button">▶ Начать</button>
        </div>

        <div id="questionPanel">
            <div id="questionHead">
                <div class="badge" id="questionBadge">Задание 1</div>
                <div class="prog" id="questionProgress">1 / 10</div>
            </div>
            <div id="q"></div>
            <div id="answerRow">
                <input id="ansInput" type="text" autocomplete="off" placeholder="Ответ...">
                <button id="attackBtn" type="button">Атаковать</button>
                <button id="nextBtn" type="button">Следующее задание →</button>
                <button id="draftBtnBattle" type="button" title="Открыть черновик">✏️</button>
            </div>
            <div id="msg"></div>
        </div>

        <div id="drawPanel" onclick="event.stopPropagation();">
            <div id="drawTools">
                <button type="button" data-tool-btn="pointer" title="Указатель">👆</button>
                <button type="button" data-tool-btn="zoom" title="Лупа: нажмите на чертёж, чтобы открыть его крупно">🔍</button>
                <button type="button" data-tool-btn="pen" title="Карандаш">🖊️</button>
                <button type="button" data-tool-btn="highlighter" title="Выделитель — полупрозрачный маркер">🖍️</button>
                <button type="button" id="undoBattle" title="Отменить">↶</button>
                <button type="button" id="redoBattle" title="Повторить">↷</button>
                <select id="tool-select-battle">
                    <option value="" disabled selected hidden>🔺 Фигуры</option>
                    <option value="line">📏 Прямая</option>
                    <option value="vector">↗️ Вектор</option>
                    <option value="circle">⭕ Окружность</option>
                    <option value="triangle">🔺 Треугольник</option>
                </select>
                <input type="color" id="color-battle" value="#003399" title="Цвет">
                <input type="range" id="size-battle" min="1" max="15" value="3" title="Толщина">
                <button type="button" data-tool-btn="eraser" title="Ластик">🧽</button>
                <div style="flex-grow:1;min-width:4px"></div>
                <button type="button" id="clearBattle" title="Очистить">🗑️</button>
                <button id="drawClose" type="button" title="Закрыть">×</button>
            </div>
            <div id="drawCanvasWrap">
                <div id="draftTaskStatement"></div>
                <canvas id="canvas-battle" title="Рисуйте прямо поверх условия и на клетчатом поле"></canvas>
            </div>
        </div>
    </div>

    <div id="battleCaption"></div>
    <img id="projectile" alt="Заряд">
    <div id="explosion"></div>

    <div id="startOverlay">
        <div id="startCard">
            <div id="nameStep">
                <h1>Баттл ЕГЭ</h1>
                <p id="instructionText">Сначала введите имя команды или игрока. Потом выберите персонажа и выходите на арену.</p>
                <input id="teamNameInput" type="text" maxlength="24" autocomplete="off" placeholder="Имя команды или игрока">
                <button id="nameNextBtn" type="button">Далее →</button>
            </div>

            <div id="charStep">
                <h1>Выберите персонажа</h1>
                <p>Это имя будет подписано у выбранного персонажа на арене.</p>
                <div id="chars">
                    <div class="charCard selected" data-name="Альтаир" data-src="pers1.png" data-desc="смелый и собранный">
                        <div class="charThumb"><img src="pers1.png" alt="Персонаж 1"></div>
                        <div class="chosenNameInCard">Игрок</div>
                    </div>
                    <div class="charCard" data-name="Вега" data-src="pers2.png" data-desc="быстрая и внимательная">
                        <div class="charThumb"><img src="pers2.png" alt="Персонаж 2"></div>
                        <div class="chosenNameInCard">Игрок</div>
                    </div>
                    <div class="charCard" data-name="Квант" data-src="pers3.png" data-desc="спокойный логик">
                        <div class="charThumb"><img src="pers3.png" alt="Персонаж 3"></div>
                        <div class="chosenNameInCard">Игрок</div>
                    </div>
                </div>
                <button id="enterArenaBtn" type="button">Выйти на арену</button>
            </div>
        </div>
    </div>

    <div id="finishOverlay">
        <div id="finishCard">
            <div id="finishTitle">Баттл завершён</div>
            <div id="finishText"></div>
            <div class="stats">
                <div class="stat"><b id="stCorrect">0</b><div>правильных ответов</div></div>
                <div class="stat"><b id="stWrong">0</b><div>неверных ответов</div></div>
                <div class="stat"><b id="stHero">0%</b><div>жизни героя</div></div>
                <div class="stat"><b id="stBoss">0%</b><div>жизни босса</div></div>
            </div>
            <button id="restartBtn" type="button">↻ Сыграть ещё раз</button>
        </div>
    </div>
</div>

<script>
/*__CONFIG_DATA__*/
(function(){
    const cfg = window.__BATTLE_CFG__ || {};
    const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
    const total = questions.length || 1;
    const maxLives = Number(cfg.lives || 5);
    const $ = id => document.getElementById(id);
    let playerName = 'Игрок';
    let selectedHero = { name:'Альтаир', src:'pers1.png' };
    let currentIndex = 0;
    let heroLives = maxLives;
    let bossHits = 0;
    let wrong = 0;
    let correct = 0;
    let timerInt = null;
    let startedAt = null;
    let locked = false;

    function norm(v){ return String(v == null ? '' : v).trim().replace(',', '.').toLowerCase(); }
    function fmt(sec){ sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0'); }
    function heroPct(){ return Math.max(0, (heroLives / maxLives) * 100); }
    function bossPct(){ return Math.max(0, ((total - bossHits) / total) * 100); }

    function updateHeroUi(){
        $('heartText').textContent = '♥'.repeat(Math.max(0, heroLives)) + '♡'.repeat(Math.max(0, maxLives - heroLives));
        $('heroHpFill').style.width = heroPct() + '%';
        $('heroHpText').textContent = Math.round(heroPct()) + '%';
        $('heroHpBar').style.setProperty('--segment-size', (100 / Math.max(1, maxLives)) + '%');
    }
    function updateBossUi(){
        $('bossHpFill').style.width = bossPct() + '%';
        $('bossHpText').textContent = Math.round(bossPct()) + '%';
        $('bossRemainText').textContent = Math.round(bossPct()) + '%';
        $('bossHpBar').style.setProperty('--segment-size', (100 / Math.max(1, total)) + '%');
    }
    function applySelectedHero(){
        $('heroImg').src = selectedHero.src;
        $('heroDisplayName').textContent = playerName || selectedHero.name;
    }
    function typeset(){ if(window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$('q')]).catch(()=>{}); }
    function setMessage(text, color){ $('msg').textContent = text || ''; $('msg').style.color = color || '#333'; }

    function fitQuestionPanel(){
        const panel = $('questionPanel');
        const qEl = $('q');
        if(!panel || !qEl || panel.style.display === 'none') return;
        qEl.style.fontSize = '';
        qEl.style.lineHeight = '';
        qEl.querySelectorAll('svg,img').forEach(el => {
            el.style.maxHeight = '';
        });
        requestAnimationFrame(()=>{
            let guard = 0;
            while(panel.scrollHeight > panel.clientHeight && guard < 5){
                const cur = parseFloat(getComputedStyle(qEl).fontSize) || 18;
                qEl.style.fontSize = Math.max(13, cur - 1) + 'px';
                qEl.style.lineHeight = '1.22';
                qEl.querySelectorAll('svg,img').forEach(el => {
                    el.style.maxHeight = '24vh';
                });
                guard++;
            }
        });
    }

    function showQuestion(){
        if(currentIndex >= questions.length || heroLives <= 0 || bossHits >= total){ finishBattle(); return; }
        locked = false;
        const q = questions[currentIndex] || {};
        $('questionPanel').style.display = 'block';
        $('questionBadge').textContent = 'Задание ' + (currentIndex + 1);
        $('questionProgress').textContent = (currentIndex + 1) + ' / ' + questions.length;
        $('q').innerHTML = String(q.prompt || '').replace(/\s+([.,!?;:])/g, '$1');
        
        // Очищаем черновик для нового задания
        draftState.undo = [];
        draftState.redo = [];
        if(draftState.ctx && draftState.canvas){
            draftState.ctx.save();
            draftState.ctx.setTransform(1,0,0,1,0,0);
            draftState.ctx.clearRect(0,0,draftState.canvas.width,draftState.canvas.height);
            draftState.ctx.restore();
        }

        syncDraftTaskStatement();
        $('ansInput').value = '';
        $('ansInput').readOnly = false;
        $('attackBtn').style.display = 'inline-block';
        $('nextBtn').style.display = 'none';
        setMessage('');
        typeset();
        setTimeout(()=>{ fitQuestionPanel(); $('ansInput').focus(); }, 50);
    }

    function centerOf(el){
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function animateShot(kind, done){
        const projectile = $('projectile');
        const explosion = $('explosion');
        const fromEl = kind === 'good' ? $('heroCard') : $('bossCard');
        const toEl = kind === 'good' ? $('bossCard') : $('heroCard');
        const from = centerOf(fromEl);
        const to = centerOf(toEl);
        projectile.src = kind === 'good' ? 'z2.png' : 'z1.png';
        projectile.style.transition = 'none';
        projectile.style.display = 'block';
        projectile.style.left = from.x + 'px';
        projectile.style.top = from.y + 'px';
        projectile.style.opacity = '1';
        projectile.style.width = '84px';
        projectile.style.height = '84px';
        projectile.style.transform = 'translate(-50%,-50%) scale(0.8)';
        explosion.style.display = 'none';
        void projectile.offsetWidth;
        requestAnimationFrame(()=>{
            projectile.style.transition = 'left .5s ease-in, top .5s ease-in, transform .5s ease-in, opacity .5s ease-in';
            projectile.style.left = to.x + 'px';
            projectile.style.top = to.y + 'px';
            projectile.style.transform = 'translate(-50%,-50%) scale(1.18)';
        });
        const targetCard = kind === 'good' ? $('bossCard') : $('heroCard');
        targetCard.classList.add('hit');
        if(kind !== 'good') targetCard.classList.add('burn');
        setTimeout(()=>{
            projectile.style.display = 'none';
            targetCard.classList.remove('hit');
            targetCard.classList.remove('burn');
            explosion.style.left = to.x + 'px';
            explosion.style.top = to.y + 'px';
            explosion.style.display = 'block';
            setTimeout(()=>{ explosion.style.display = 'none'; if(typeof done === 'function') done(); }, 420);
        }, 520);
    }

    function resolveAttack(){
        if(locked) return;
        const raw = $('ansInput').value;
        if(!String(raw).trim()) return;
        locked = true;
        $('attackBtn').disabled = true;
        $('ansInput').readOnly = true;
        const q = questions[currentIndex] || {};
        const answers = (q.accepts || []).map(norm);
        const isCorrect = answers.includes(norm(raw));
        if(isCorrect){
            correct++;
            bossHits++;
            setMessage('✅ Отличный удар! Босс получает урон.', '#17834a');
            hidePanelsForBattle();
            showBattleCaption('Точная атака!', 'good');
            playHitSound('good');
            $('heroCard').classList.add('attack');
            setTimeout(()=>$('heroCard').classList.remove('attack'), 260);
            updateBossUi();
            animateShot('good', afterResolution);
        } else {
            wrong++;
            heroLives = Math.max(0, heroLives - 1);
            let txt = '❌ Босс контратакует!';
            if(cfg.showCorrectOnError){ txt += ' Верный ответ: ' + ((q.accepts || [])[0] ?? ''); }
            setMessage(txt, '#c62828');
            hidePanelsForBattle();
            showBattleCaption('Контрудар Стража!', 'bad');
            playHitSound('bad');
            $('bossCard').classList.add('attack');
            setTimeout(()=>$('bossCard').classList.remove('attack'), 260);
            updateHeroUi();
            animateShot('bad', afterResolution);
        }
    }

    function afterResolution(){
        $('attackBtn').disabled = false;
        returnAfterBattle();
        $('attackBtn').style.display = 'none';
        $('nextBtn').style.display = 'inline-block';
        if(heroLives <= 0 || bossHits >= total || currentIndex >= questions.length - 1){
            $('nextBtn').textContent = 'Завершить баттл';
        } else {
            $('nextBtn').textContent = 'Следующее задание →';
        }
    }

    function nextStep(){
        currentIndex++;
        if(currentIndex >= questions.length || heroLives <= 0 || bossHits >= total){ finishBattle(); return; }
        showQuestion();
    }

    function finishBattle(){
        if(timerInt) clearInterval(timerInt);
        $('questionPanel').style.display = 'none';
        const heroRemain = heroPct();
        const bossRemain = bossPct();
        let title = 'Баттл завершён';
        let text = 'Сражение окончено.';
        if(heroLives <= 0 && bossHits >= total){
            title = 'Ничья!';
            text = 'Оба соперника потеряли все силы одновременно.';
        } else if(heroLives <= 0){
            title = 'Победил Страж КИМов';
            text = 'Жизни героя закончились раньше. Попробуйте ещё раз!';
        } else if(bossHits >= total){
            title = 'Победа!';
            text = 'Вы полностью обнулили линию жизни босса.';
        } else if(heroRemain > bossRemain){
            title = 'Победа!';
            text = 'У героя осталась более длинная линия жизни. Арена ЕГЭ пройдена!';
        } else if(heroRemain < bossRemain){
            title = 'Победил Страж КИМов';
            text = 'У босса осталась более длинная линия жизни. Есть шанс на реванш!';
        } else {
            title = 'Ничья!';
            text = 'Линии жизни оказались равны. Очень напряжённый баттл!';
        }
        $('finishTitle').textContent = title;
        $('finishText').textContent = text;
        $('stCorrect').textContent = String(correct);
        $('stWrong').textContent = String(wrong);
        $('stHero').textContent = Math.round(heroRemain) + '%';
        $('stBoss').textContent = Math.round(bossRemain) + '%';
        $('finishOverlay').style.display = 'flex';
    }

    function cleanPlayerName(value){
        return String(value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) || 'Игрок';
    }

    function updateChoiceNames(){
        document.querySelectorAll('.chosenNameInCard').forEach(el => {
            el.textContent = playerName;
        });
    }

    function goToCharacterChoice(){
        playerName = cleanPlayerName($('teamNameInput') ? $('teamNameInput').value : '');
        updateChoiceNames();
        $('nameStep').style.display = 'none';
        $('charStep').style.display = 'block';
        applySelectedHero();
    }

    function enterArena(){
        $('startOverlay').style.display = 'none';
        $('centerControls').style.display = 'flex';
        applySelectedHero();
        updateHeroUi();
        updateBossUi();
    }

    function startBattle(){
        $('startBattleBtn').style.display = 'none';
        startedAt = Date.now();
        $('timer').textContent = '00:00';
        if(timerInt) clearInterval(timerInt);
        timerInt = setInterval(()=>{ $('timer').textContent = fmt((Date.now() - startedAt)/1000); }, 1000);
        currentIndex = 0;
        heroLives = maxLives;
        bossHits = 0;
        wrong = 0;
        correct = 0;
        updateHeroUi();
        updateBossUi();
        showQuestion();
    }

    // --- Звуки и кат-сцена атаки ---
    let audioCtx = null;
    function getAudio(){
        try{
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if(audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        }catch(e){ return null; }
    }

    function playHitSound(kind){
        const ctx = getAudio();
        if(!ctx) return;
        const now = ctx.currentTime;

        if(kind === 'good'){
            const master = ctx.createGain();
            master.connect(ctx.destination);
            master.gain.setValueAtTime(0.0001, now);
            master.gain.exponentialRampToValueAtTime(0.20, now + 0.012);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

            const osc1 = ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(920, now);
            osc1.frequency.exponentialRampToValueAtTime(240, now + 0.28);
            osc1.connect(master);
            osc1.start(now);
            osc1.stop(now + 0.34);

            const osc2 = ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1450, now + 0.03);
            osc2.frequency.exponentialRampToValueAtTime(760, now + 0.18);
            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(0.0001, now + 0.03);
            gain2.gain.exponentialRampToValueAtTime(0.11, now + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.03);
            osc2.stop(now + 0.23);

            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (1 - i/data.length);
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1800;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.07, now);
            ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
            noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.13);
        } else {
            const master = ctx.createGain();
            master.connect(ctx.destination);
            master.gain.setValueAtTime(0.0001, now);
            master.gain.exponentialRampToValueAtTime(0.26, now + 0.018);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(95, now);
            osc.frequency.exponentialRampToValueAtTime(38, now + 0.38);
            osc.connect(master);
            osc.start(now);
            osc.stop(now + 0.62);

            const boom = ctx.createOscillator();
            boom.type = 'sine';
            boom.frequency.setValueAtTime(54, now + 0.04);
            boom.frequency.exponentialRampToValueAtTime(30, now + 0.48);
            const boomGain = ctx.createGain();
            boomGain.gain.setValueAtTime(0.0001, now + 0.04);
            boomGain.gain.exponentialRampToValueAtTime(0.28, now + 0.07);
            boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
            boom.connect(boomGain);
            boomGain.connect(ctx.destination);
            boom.start(now + 0.04);
            boom.stop(now + 0.6);

            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.26, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/data.length, 2);
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(260, now);
            filter.frequency.exponentialRampToValueAtTime(90, now + 0.24);
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.18, now);
            ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
            noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + 0.28);
        }
    }

    function hidePanelsForBattle(){
        const qPanel = $('questionPanel');
        const dPanel = $('drawPanel');
        const dBtn = $('draftBtnBattle');
        if(qPanel) qPanel.style.display = 'none';
        if(dPanel) dPanel.classList.remove('open');
        if(qPanel) qPanel.classList.remove('draft-open');
        if(dBtn) dBtn.classList.remove('active');
    }

    function showBattleCaption(text, kind){
        const cap = $('battleCaption');
        if(!cap) return;
        cap.textContent = text;
        cap.className = kind || '';
        cap.style.display = 'block';
    }

    function hideBattleCaption(){
        const cap = $('battleCaption');
        if(cap) cap.style.display = 'none';
    }

    function returnAfterBattle(){
        hideBattleCaption();
        $('questionPanel').style.display = 'block';
        fitQuestionPanel();
    }


        window.openDraftVisualZoom = window.openDraftVisualZoom || function(sourceEl) {
            if (!sourceEl) return;
            const visual = sourceEl.matches && sourceEl.matches('svg,img,picture,canvas') ? sourceEl : sourceEl.querySelector('svg,img,picture,canvas');
            if (!visual) return;

            let overlay = document.getElementById('draftVisualZoomOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'draftVisualZoomOverlay';
                overlay.style.cssText = 'position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.82);display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;';
                overlay.innerHTML = '<div data-z="dialog" style="position:relative;width:min(1180px,97vw);height:min(860px,94vh);background:#fff;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:9px;background:#eef6ff;border-bottom:1px solid #c9dff2;flex:0 0 auto;"><button type="button" data-z="out" title="Уменьшить" style="font-size:20px;border:1px solid #90caf9;background:#fff;border-radius:8px;min-width:38px;height:36px;cursor:pointer;">−</button><button type="button" data-z="reset" title="Показать целиком" style="font-size:16px;border:1px solid #90caf9;background:#fff;border-radius:8px;height:36px;cursor:pointer;">100%</button><button type="button" data-z="in" title="Увеличить" style="font-size:20px;border:1px solid #90caf9;background:#fff;border-radius:8px;min-width:38px;height:36px;cursor:pointer;">+</button><button type="button" data-z="close" title="Закрыть" style="margin-left:auto;font-size:24px;border:1px solid #ffcc80;background:#fff3e0;color:#e65100;border-radius:8px;width:38px;height:36px;cursor:pointer;">×</button></div><div data-z="viewport" style="flex:1;min-height:0;overflow:auto;padding:18px;box-sizing:border-box;background:#fff;"><div data-z="stage" style="min-width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;"><div data-z="content" style="flex:0 0 auto;line-height:0;"></div></div></div></div>';
                document.body.appendChild(overlay);

                const close = () => {
                    overlay.style.display = 'none';
                    document.body.style.overflow = overlay.dataset.oldOverflow || '';
                };
                overlay.addEventListener('click', e => {
                    if (e.target === overlay || e.target.closest('[data-z="close"]')) close();
                });
                document.addEventListener('keydown', e => {
                    if (e.key === 'Escape' && overlay.style.display !== 'none') close();
                });

                const changeScale = delta => {
                    if (!overlay._apply) return;
                    overlay._scale = Math.max(.5, Math.min(4, (overlay._scale || 1) + delta));
                    overlay._apply();
                };
                overlay.querySelector('[data-z="in"]').addEventListener('click', () => changeScale(.25));
                overlay.querySelector('[data-z="out"]').addEventListener('click', () => changeScale(-.25));
                overlay.querySelector('[data-z="reset"]').addEventListener('click', () => {
                    if (!overlay._apply) return;
                    overlay._scale = 1;
                    overlay._apply();
                });
                overlay.querySelector('[data-z="viewport"]').addEventListener('wheel', e => {
                    if (!e.ctrlKey) return;
                    e.preventDefault();
                    changeScale(e.deltaY < 0 ? .15 : -.15);
                }, {passive:false});
                window.addEventListener('resize', () => {
                    if (overlay.style.display !== 'none' && overlay._refit) overlay._refit();
                });
            }

            const content = overlay.querySelector('[data-z="content"]');
            const stage = overlay.querySelector('[data-z="stage"]');
            const viewport = overlay.querySelector('[data-z="viewport"]');
            content.innerHTML = '';

            let clone;
            if (visual.tagName && visual.tagName.toLowerCase() === 'canvas') {
                clone = document.createElement('img');
                try {
                    clone.src = visual.toDataURL('image/png');
                } catch(e) {
                    return;
                }
            } else {
                clone = visual.cloneNode(true);
            }

            clone.removeAttribute && clone.removeAttribute('id');
            clone.style.cssText = 'display:block!important;max-width:none!important;max-height:none!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;object-fit:contain!important;margin:0!important;';

            if (clone.tagName && clone.tagName.toLowerCase() === 'picture') {
                const pictureImg = clone.querySelector('img');
                if (pictureImg) {
                    pictureImg.style.cssText = 'display:block!important;max-width:none!important;max-height:none!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;object-fit:contain!important;margin:0!important;';
                }
            }

            content.appendChild(clone);

            const sourceRect = visual.getBoundingClientRect();
            let ratio = sourceRect.width > 0 && sourceRect.height > 0 ? sourceRect.width / sourceRect.height : 1;
            const tag = visual.tagName ? visual.tagName.toLowerCase() : '';

            if (tag === 'img' && visual.naturalWidth > 0 && visual.naturalHeight > 0) {
                ratio = visual.naturalWidth / visual.naturalHeight;
            } else if (tag === 'canvas' && visual.width > 0 && visual.height > 0) {
                ratio = visual.width / visual.height;
            } else if (tag === 'svg' && visual.viewBox && visual.viewBox.baseVal && visual.viewBox.baseVal.width > 0 && visual.viewBox.baseVal.height > 0) {
                ratio = visual.viewBox.baseVal.width / visual.viewBox.baseVal.height;
            } else if (tag === 'picture') {
                const sourceImg = visual.querySelector('img');
                if (sourceImg && sourceImg.naturalWidth > 0 && sourceImg.naturalHeight > 0) {
                    ratio = sourceImg.naturalWidth / sourceImg.naturalHeight;
                }
            }

            if (!isFinite(ratio) || ratio <= 0) ratio = 1;
            overlay._ratio = ratio;
            overlay._scale = 1;

            overlay._apply = () => {
                const scale = overlay._scale || 1;
                const width = Math.max(1, (overlay._baseWidth || 1) * scale);
                const height = Math.max(1, (overlay._baseHeight || 1) * scale);

                content.style.width = width + 'px';
                content.style.height = height + 'px';

                const viewportWidth = Math.max(0, viewport.clientWidth - 36);
                const viewportHeight = Math.max(0, viewport.clientHeight - 36);
                stage.style.justifyContent = width <= viewportWidth + 1 ? 'center' : 'flex-start';
                stage.style.alignItems = height <= viewportHeight + 1 ? 'center' : 'flex-start';

                overlay.querySelector('[data-z="reset"]').textContent = Math.round(scale * 100) + '%';
            };

            overlay._refit = () => {
                const styles = window.getComputedStyle(viewport);
                const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
                const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
                const availableWidth = Math.max(120, viewport.clientWidth - padX);
                const availableHeight = Math.max(120, viewport.clientHeight - padY);
                const ratioNow = overlay._ratio || 1;

                let baseWidth = availableWidth;
                let baseHeight = baseWidth / ratioNow;
                if (baseHeight > availableHeight) {
                    baseHeight = availableHeight;
                    baseWidth = baseHeight * ratioNow;
                }

                overlay._baseWidth = Math.max(1, Math.floor(baseWidth));
                overlay._baseHeight = Math.max(1, Math.floor(baseHeight));
                overlay._apply();
            };

            overlay.dataset.oldOverflow = document.body.style.overflow || '';
            document.body.style.overflow = 'hidden';
            overlay.style.display = 'flex';

            requestAnimationFrame(() => overlay._refit());
        };

    // --- Черновик для Баттла ЕГЭ (унифицированный холст) ---
    const draftState = { canvas:null, ctx:null, drawing:false, tool:'pen', startX:0, startY:0, snapshot:null, undo:[], redo:[], points:[] };

    function resizeDraftCanvas(){
        const canvas = $('canvas-battle');
        if(!canvas) return;
        const wrap = $('drawCanvasWrap');
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if(rect.width <= 0 || rect.height <= 0) return;
        const old = document.createElement('canvas');
        old.width = canvas.width; old.height = canvas.height;
        const oldCtx = old.getContext('2d');
        if(canvas.width && canvas.height) oldCtx.drawImage(canvas, 0, 0);
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        if(old.width && old.height) ctx.drawImage(old,0,0,old.width/dpr,old.height/dpr);
        draftState.canvas = canvas;
        draftState.ctx = ctx;
    }

    function saveDraftState(){
        const c = draftState.canvas;
        const undoStack = draftState.undo;
        const redoStack = draftState.redo;
        if(!c) return;
        try{
            undoStack.push(c.toDataURL());
            if(undoStack.length > 30) undoStack.shift();
            redoStack.length = 0;
        }catch(e){}
    }

    function restoreDraftState(data){
        const c = draftState.canvas, ctx = draftState.ctx;
        if(!c || !ctx || !data) return;
        const img = new Image();
        img.onload = function(){
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0,0,c.width,c.height);
            ctx.restore();
            ctx.drawImage(img,0,0,c.width/(window.devicePixelRatio||1),c.height/(window.devicePixelRatio||1));
        };
        img.src = data;
    }

    function undoDraft(){
        const c = draftState.canvas, undoStack = draftState.undo, redoStack = draftState.redo;
        if(!c || undoStack.length <= 1) return;
        const cur = undoStack.pop();
        redoStack.push(cur);
        restoreDraftState(undoStack[undoStack.length - 1]);
    }

    function redoDraft(){
        const undoStack = draftState.undo, redoStack = draftState.redo;
        if(!redoStack.length) return;
        const data = redoStack.pop();
        undoStack.push(data);
        restoreDraftState(data);
    }

    function clearDraft(){
        const ctx = draftState.ctx, c = draftState.canvas;
        if(!ctx || !c) return;
        saveDraftState();
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,c.width,c.height);
        ctx.restore();
    }

    function setDraftTool(tool){
        draftState.tool = tool || 'pen';
        document.querySelectorAll('#drawTools [data-tool-btn]').forEach(b => b.classList.toggle('active', b.dataset.toolBtn === draftState.tool));
        const canvas = $('canvas-battle');
        if (canvas) canvas.style.cursor = draftState.tool === 'pointer' ? 'move' : (draftState.tool === 'zoom' ? 'zoom-in' : 'crosshair');
    }

    function posOnCanvas(e){
        const canvas = draftState.canvas;
        const r = canvas.getBoundingClientRect();
        return {x:e.clientX-r.left, y:e.clientY-r.top};
    }

    function beginDraft(e){
        const ctx = draftState.ctx, canvas = draftState.canvas;
        if(!ctx || !canvas || draftState.tool === 'pointer') return;
        e.preventDefault();
        if (draftState.tool === 'zoom') {
            const box = $('draftTaskStatement');
            const visual = box && box.querySelector('svg,img,picture,canvas');
            if (visual) {
                const r = visual.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) window.openDraftVisualZoom(visual);
            }
            return;
        }
        const p = posOnCanvas(e);
        draftState.drawing = true;
        draftState.startX = p.x; draftState.startY = p.y;
        draftState.snapshot = ctx.getImageData(0,0,canvas.width,canvas.height);
        if(draftState.tool === 'pen' || draftState.tool === 'highlighter' || draftState.tool === 'eraser'){
            saveDraftState();
            draftState.lastX = p.x;
            draftState.lastY = p.y;
            draftState.points = draftState.tool === 'highlighter' ? [p] : [];
        }
    }

    function drawDraft(e){
        const ctx = draftState.ctx;
        if(!draftState.drawing || !ctx) return;
        e.preventDefault();
        const p = posOnCanvas(e);
        const color = $('color-battle') ? $('color-battle').value : '#003399';
        const size = $('size-battle') ? Number($('size-battle').value || 3) : 3;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.lineWidth = draftState.tool === 'eraser' ? size * 3 : size;
        ctx.strokeStyle = draftState.tool === 'eraser' ? 'rgba(255,255,255,1)' : color;
        ctx.fillStyle = color;

        // Выделитель перерисовываем как ОДИН непрерывный штрих поверх снимка холста.
        // Иначе отдельные полупрозрачные сегменты накладываются круглыми концами
        // и получается цепочка тёмных «бусинок».
        if(draftState.tool === 'highlighter'){
            const pts = draftState.points || (draftState.points = []);
            const prev = pts.length ? pts[pts.length - 1] : null;
            if(!prev || Math.hypot(p.x-prev.x, p.y-prev.y) >= 0.5) pts.push({x:p.x,y:p.y});

            if(draftState.snapshot) ctx.putImageData(draftState.snapshot,0,0);
            if(pts.length >= 2){
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.28;
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(12, size * 4);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                if(pts.length === 2){
                    ctx.lineTo(pts[1].x, pts[1].y);
                } else {
                    for(let i=1;i<pts.length-1;i++){
                        const midX = (pts[i].x + pts[i+1].x) / 2;
                        const midY = (pts[i].y + pts[i+1].y) / 2;
                        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
                    }
                    const last = pts[pts.length-1];
                    ctx.lineTo(last.x,last.y);
                }
                ctx.stroke();
                ctx.restore();
            }
            draftState.lastX = p.x;
            draftState.lastY = p.y;
            return;
        }

        if(draftState.tool === 'pen' || draftState.tool === 'eraser'){
            ctx.beginPath();
            ctx.moveTo(Number.isFinite(draftState.lastX) ? draftState.lastX : p.x, Number.isFinite(draftState.lastY) ? draftState.lastY : p.y);
            ctx.lineTo(p.x,p.y);
            ctx.stroke();
            draftState.lastX = p.x;
            draftState.lastY = p.y;
            return;
        }

        if(draftState.snapshot) ctx.putImageData(draftState.snapshot,0,0);
        ctx.beginPath();
        if(draftState.tool === 'line' || draftState.tool === 'vector'){
            ctx.moveTo(draftState.startX,draftState.startY);
            ctx.lineTo(p.x,p.y);
            ctx.stroke();
            if(draftState.tool === 'vector'){
                const ang = Math.atan2(p.y-draftState.startY,p.x-draftState.startX);
                const len = 12 + size;
                ctx.beginPath();
                ctx.moveTo(p.x,p.y);
                ctx.lineTo(p.x-len*Math.cos(ang-Math.PI/6), p.y-len*Math.sin(ang-Math.PI/6));
                ctx.moveTo(p.x,p.y);
                ctx.lineTo(p.x-len*Math.cos(ang+Math.PI/6), p.y-len*Math.sin(ang+Math.PI/6));
                ctx.stroke();
            }
        } else if(draftState.tool === 'circle'){
            const rad = Math.hypot(p.x-draftState.startX,p.y-draftState.startY);
            ctx.arc(draftState.startX,draftState.startY,rad,0,Math.PI*2);
            ctx.stroke();
        } else if(draftState.tool === 'triangle'){
            ctx.moveTo(draftState.startX,p.y);
            ctx.lineTo((draftState.startX+p.x)/2,draftState.startY);
            ctx.lineTo(p.x,p.y);
            ctx.closePath(); ctx.stroke();
        }
    }

    function endDraft(){
        if(!draftState.drawing) return;
        if(!(draftState.tool === 'pen' || draftState.tool === 'highlighter' || draftState.tool === 'eraser')) saveDraftState();
        draftState.drawing = false;
        draftState.snapshot = null;
        draftState.points = [];
    }

    function syncDraftTaskStatement(){
        const box = $('draftTaskStatement');
        const qEl = $('q');
        if(!box || !qEl){ return; }
        box.innerHTML = '';

        const clone = qEl.cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.classList.add('draft-condition-text');
        clone.innerHTML = clone.innerHTML.replace(/\\s+([.,!?;:])/g, '$1');

        const fig = clone.querySelector('svg,img,picture,canvas');
        if(fig){
            const wrap = document.createElement('div');
            wrap.className = 'draft-figure-wrap';

            fig.parentNode.insertBefore(wrap, fig);
            wrap.appendChild(fig);

            fig.style.maxWidth = '100%';
            fig.style.maxHeight = '26vh';
            fig.style.width = 'auto';
            fig.style.height = 'auto';
            fig.style.objectFit = 'contain';
            fig.style.margin = '0 auto';
            fig.style.pointerEvents = 'none';
        }

        box.appendChild(clone);
        box.style.display = 'block';

        const afterRender = ()=>{
            requestAnimationFrame(()=>{
                resizeDraftCanvas();
                if(draftState.undo.length === 0 && draftState.canvas){
                    saveDraftState();
                }
            });
        };

        if(window.MathJax && MathJax.typesetPromise){
            MathJax.typesetPromise([box]).then(afterRender).catch(afterRender);
        } else {
            afterRender();
        }
    }

    function toggleDraft(){
        const panel = $('drawPanel');
        const qPanel = $('questionPanel');
        const btn = $('draftBtnBattle');
        if(!panel || !qPanel) return;
        const open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        qPanel.classList.toggle('draft-open', open);
        if(btn) btn.classList.toggle('active', open);
        if(open){
            syncDraftTaskStatement();
            setTimeout(()=>{
                resizeDraftCanvas();
                fitQuestionPanel();
                if(draftState.undo.length === 0){
                    saveDraftState();
                }
            }, 60);
        }
    }

    function initDraft(){
        const canvas = $('canvas-battle');
        if(!canvas) return;
        resizeDraftCanvas();
        setDraftTool('pen');
        canvas.addEventListener('pointerdown', beginDraft);
        canvas.addEventListener('pointermove', drawDraft);
        canvas.addEventListener('pointerup', endDraft);
        canvas.addEventListener('pointercancel', endDraft);
        canvas.addEventListener('pointerleave', endDraft);
        $('draftBtnBattle')?.addEventListener('click', toggleDraft);
        $('drawClose')?.addEventListener('click', toggleDraft);
        $('clearBattle')?.addEventListener('click', clearDraft);
        $('undoBattle')?.addEventListener('click', undoDraft);
        $('redoBattle')?.addEventListener('click', redoDraft);
        $('tool-select-battle')?.addEventListener('change', e => setDraftTool(e.target.value));
        document.querySelectorAll('#drawTools [data-tool-btn]').forEach(b => b.addEventListener('click', () => setDraftTool(b.dataset.toolBtn)));
        window.addEventListener('resize', ()=>{ resizeDraftCanvas(); });
    }

    document.querySelectorAll('.charCard').forEach(card=>{
        card.addEventListener('click', ()=>{
            document.querySelectorAll('.charCard').forEach(c=>c.classList.remove('selected'));
            card.classList.add('selected');
            selectedHero = { name: card.dataset.name || 'Игрок', src: card.dataset.src || 'pers1.png' };
            applySelectedHero();
        });
    });

    $('nameNextBtn').addEventListener('click', goToCharacterChoice);
    $('teamNameInput').addEventListener('keydown', e=>{ if(e.key === 'Enter') goToCharacterChoice(); });
    $('enterArenaBtn').addEventListener('click', enterArena);
    $('startBattleBtn').addEventListener('click', function(){ getAudio(); startBattle(); });
    $('attackBtn').addEventListener('click', resolveAttack);
    $('nextBtn').addEventListener('click', nextStep);
    $('ansInput').addEventListener('keydown', e=>{ if(e.key === 'Enter' && $('questionPanel').style.display !== 'none' && $('attackBtn').style.display !== 'none'){ resolveAttack(); } });
    $('restartBtn').addEventListener('click', ()=> location.reload());

    initDraft();
    if(cfg.instruction){ $('instructionText').textContent = cfg.instruction; }
    updateChoiceNames();
    setTimeout(()=> $('teamNameInput')?.focus(), 60);
    applySelectedHero();
    updateHeroUi();
    updateBossUi();
})();
<\/script>
</body>
</html>`;