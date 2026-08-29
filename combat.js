function startCombat(spec) {
  const c = spec || ch();
  app.innerHTML = `<canvas id="cv"></canvas><div class="hud" id="hud"></div><div class="grain"></div>`;
  const canvas = app.querySelector("#cv");
  const ctx = canvas.getContext("2d");
  const hud = app.querySelector("#hud");
  const st = {
    phase: "approach", t: 0, clock: 0, enemyIndex: 0, blocks: 0,
    threat: 0.2, flash: 0, flashRed: 0, wound: 0, outcome: null,
    qte: null, last: performance.now(), usedPerfect: false, kills: []
  };
  combat = st;

  function fit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = app.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    canvas.style.width = r.width+"px"; canvas.style.height = r.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fit();
  const ro = new ResizeObserver(fit); ro.observe(app);

  function beginApproach() {
    st.phase = "approach"; st.t = 0; st.qte = null; st.threat = 0.15; st.outcome = null; paintHud();
  }
  function beginQte() {
    st.phase = "qte"; st.t = 0;
    const block = pos();
    const perfect = pos({ x: block.x, y: block.y, r: 28 });
    st.qte = { block: { ...block, on: true }, perfect: { ...perfect, on: false } };
    if (c.weapon === "gun") audio.beep(90, .18, "triangle", .16);
    paintHud();
  }
  function resolve(kind) {
    st.phase = "resolveHit"; st.t = 0; st.qte = null; st.lastKind = kind;
    if (kind === "perfect") { st.usedPerfect = true; st.flash = 1; audio.beep(784, .3); }
    else if (kind === "miss") { st.flashRed = 1; st.wound = 1; audio.beep(70, .35, "sawtooth", .18); }
    else audio.beep(220, .12, "square", .1);
    if (kind === "perfect") {
      st.kills.push("perfect");
      st.enemyIndex++; st.blocks = 0;
      if (st.enemyIndex >= c.enemyCount) st.outcome = "win";
    } else if (kind === "block") {
      st.blocks++;
      if (st.blocks >= c.blocksToKill) {
        st.kills.push("block");
        st.enemyIndex++; st.blocks = 0;
        if (st.enemyIndex >= c.enemyCount) st.outcome = "win";
      }
    } else if (kind === "miss") st.outcome = "lose";
    paintHud();
  }
  function tap(kind) {
    if (st.phase !== "qte" || !st.qte) return;
    const ms = st.t * 1000;
    if (kind === "perfect") {
      if (st.qte.perfect.on && ms >= c.perfectStartMs && ms <= c.perfectEndMs + 40) return resolve("perfect");
      return resolve("miss");
    }
    if (kind === "block") {
      if (st.qte.block.on && ms <= c.hitMs) return resolve(c.onlyPerfect ? "dodge" : "block");
      return resolve("miss");
    }
    if (ms < 180) return;
    resolve("miss");
  }

  function paintHud() {
    const size = Math.max(44, Math.min(c.buttonPx, c.buttonPx * (Math.min(app.clientWidth, app.clientHeight)/390)));
    let q = "";
    if (st.qte?.block.on) q += `<button class="qte" style="left:${st.qte.block.x}%;top:${st.qte.block.y}%;width:${size}px;height:${size}px;font-size:${Math.max(15,size*.26)}px" data-k="block">${c.blockLabel}</button>`;
    if (st.qte?.perfect.on) q += `<button class="qte perfect" style="left:${st.qte.perfect.x}%;top:${st.qte.perfect.y}%;width:${size*.92}px;height:${size*.92}px;font-size:${Math.max(14,size*.22)}px" data-k="perfect">一閃</button>`;
    const pips = Array.from({length:c.enemyCount}, (_,i) => `<i style="display:inline-block;width:6px;height:6px;border-radius:50%;margin-left:4px;background:${i<st.enemyIndex?"#8a2424":i===st.enemyIndex?"#f3ece0":"#3a3530"}"></i>`).join("");
    hud.innerHTML = `
      <div style="position:absolute;left:1rem;top:max(1rem,env(safe-area-inset-top))">
        <p class="kicker">${spec?"隱藏關":"第"+c.numeral+"關"}</p><p>${c.title}</p>
      </div>
      <div style="position:absolute;right:1rem;top:max(1rem,env(safe-area-inset-top));text-align:right">${pips}<br>
        <button class="btn" style="width:auto;padding:0 .6rem;margin-top:.4rem;height:36px" id="quit">離開</button>
      </div>
      <p class="muted" style="position:absolute;left:1rem;bottom:max(1rem,env(safe-area-inset-bottom))">${c.onlyPerfect?"作出適當反應":`擋 ${st.blocks}/${c.blocksToKill}`}</p>
      <div id="miss" style="position:absolute;inset:0">${q}</div>
      ${st.outcome==="lose"?`<div class="overlay" id="losebox">
        <p class="kicker">Miss</p><h2 style="margin:.6rem 0">失手</h2>
        <p class="muted">${c.weapon==="gun"?"中槍。":c.weapon==="knife"?"捱咗一刀。":"捱咗一拳。"}</p>
        <div class="stack" style="width:min(100%,18rem);margin-top:1.4rem">
          <button class="btn solid" id="retry">再來</button>
          <button class="btn" id="leave">離開</button>
        </div>
      </div>`:""}`;
    hud.querySelector("#quit").onclick = (e) => { e.stopPropagation(); screen="title"; render(); };
    hud.querySelector("#miss").onpointerdown = (e) => {
      if (e.target.dataset.k) { e.stopPropagation(); tap(e.target.dataset.k); }
      else tap("miss");
    };
    const retry = hud.querySelector("#retry");
    if (retry) retry.onclick = () => { screen = spec ? "hidden2bcombat" : "combat"; render(); };
    const leave = hud.querySelector("#leave");
    if (leave) leave.onclick = () => { screen="title"; render(); };
  }

  function drawWound(w, h, a) {
    ctx.save(); ctx.globalAlpha = a;
    if (c.weapon === "gun") {
      ctx.strokeStyle = "rgba(220,210,200,.85)"; ctx.lineWidth = 1.4;
      const cx = w*.52, cy = h*.42;
      for (let i=0;i<14;i++) {
        const ang = (i/14)*Math.PI*2 + .2;
        ctx.beginPath(); ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(ang)*w*.55, cy+Math.sin(ang)*h*.6); ctx.stroke();
      }
      ctx.fillStyle = "#0b0a09"; ctx.beginPath(); ctx.arc(cx,cy,16,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#4a2a2a"; ctx.lineWidth = 3; ctx.stroke();
    } else if (c.weapon === "knife") {
      ctx.strokeStyle = "rgba(120,20,20,.9)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(w*.12,h*.22); ctx.lineTo(w*.88,h*.78); ctx.stroke();
      ctx.strokeStyle = "rgba(20,8,8,.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w*.14,h*.2); ctx.lineTo(w*.9,h*.76); ctx.stroke();
    } else {
      const g = ctx.createRadialGradient(w*.5,h*.4,10,w*.5,h*.4,w*.42);
      g.addColorStop(0,"rgba(40,10,20,.85)"); g.addColorStop(.45,"rgba(70,30,50,.5)"); g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    }
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(.1, (now-st.last)/1000); st.last = now; st.clock += dt; st.t += dt;
    const w = app.clientWidth, h = app.clientHeight;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#0c0b0a"; ctx.fillRect(0,0,w,h);
    if (typeof drawCover === "function") drawCover(ctx, bgFor(c.id), w, h);

    const ea = st.phase==="approach" ? Math.min(1, st.t/(c.windupMs/1000)) : (st.outcome==="win"?Math.max(0,1-st.t):1);
    ctx.save(); ctx.globalAlpha = ea;
    if (typeof drawContain === "function") drawContain(ctx, enemyFor(c.weapon, st.enemyIndex, spec || c), w*0.08, h*0.22, w*0.38, h*0.62);
    ctx.restore();

    if (st.phase === "approach") {
      const p = Math.min(1, st.t/(c.windupMs/1000));
      if (c.weapon !== "gun") st.threat = .35 + .2*p;
      if (p >= 1) beginQte();
    } else if (st.phase === "qte") {
      const p = Math.min(1, st.t/(c.hitMs/1000));
      st.threat = c.weapon==="gun" ? .12 + 1.5*(p*p) : .55 + .7*(p*p);
      if (st.qte && !st.qte.perfect.on && st.t*1000 >= c.perfectStartMs) { st.qte.perfect.on = true; paintHud(); }
      if (st.t*1000 >= c.hitMs) resolve("miss");
    } else if (st.phase === "resolveHit") {
      st.flash = Math.max(0, st.flash-dt*2.4);
      st.flashRed = Math.max(0, st.flashRed-dt*1.6);
      if (st.t > .55) {
        if (st.outcome === "win") {
          if (spec && spec.onWin) { ro.disconnect(); spec.onWin(st); return; }
          lastRun = { chapterId: c.id, usedPerfect: st.usedPerfect, kills: st.kills.slice() };
          storyMode = "outro"; screen = "story"; ro.disconnect(); render(); return;
        }
        if (st.outcome !== "lose") beginApproach();
      }
    }

    if (st.phase === "qte" || (st.phase==="approach" && c.weapon!=="gun") || st.phase==="resolveHit") {
      const s = st.threat;
      const tw = (c.weapon === "gun" ? 90 : c.weapon === "knife" ? 70 : 160) * s;
      const th = (c.weapon === "gun" ? 90 : c.weapon === "knife" ? 220 : 160) * s;
      if (typeof drawContain === "function") drawContain(ctx, threatFor(c.weapon), w*0.5 - tw/2, h*0.38 - th/2, tw, th);
    }

    if (st.flash>0) { ctx.fillStyle = `rgba(243,236,224,${st.flash*.5})`; ctx.fillRect(0,0,w,h); }
    if (st.flashRed>0) { ctx.fillStyle = `rgba(138,36,36,${st.flashRed*.45})`; ctx.fillRect(0,0,w,h); }
    if (st.wound>0) drawWound(w,h, Math.min(1,st.wound));
    const vg = ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.72);
    vg.addColorStop(0,"rgba(10,9,8,0)"); vg.addColorStop(1,"rgba(10,9,8,.7)");
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
    raf = requestAnimationFrame(loop);
  }
  paintHud();
  raf = requestAnimationFrame(loop);
}

function startHidden2BCombat() {
  startCombat({
    id: 21, numeral: "隱", title: "C", weapon: "knife",
    enemyCount: 1, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 720, hitMs: 1280, perfectStartMs: 720, perfectEndMs: 1080, buttonPx: 100,
    female: true,
    onWin(st) { finishHidden2B(!!st.usedPerfect); }
  });
}

function startHidden2Combat() {
  const dogs = [
    { hitMs: 1480, p0: 760, p1: 1120, bx: 16, by: 62, px: 16, py: 34 },
    { hitMs: 1720, p0: 980, p1: 1380, bx: 50, by: 72, px: 50, py: 40 },
    { hitMs: 1320, p0: 640, p1: 980, bx: 84, by: 62, px: 84, py: 34 },
  ];
  app.innerHTML = `<canvas id="cv"></canvas><div class="hud" id="hud"></div><div class="grain"></div>`;
  const canvas = app.querySelector("#cv");
  const ctx = canvas.getContext("2d");
  const hud = app.querySelector("#hud");
  const st = {
    phase: "approach", t: 0, hits: 0, flash: 0, flashRed: 0, wound: 0,
    outcome: null, last: performance.now(), results: [null, null, null]
  };
  combat = st;

  function fit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = app.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    canvas.style.width = r.width+"px"; canvas.style.height = r.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fit();
  const ro = new ResizeObserver(fit); ro.observe(app);

  function beginApproach() {
    st.phase = "approach"; st.t = 0; st.outcome = null;
    st.results = [null, null, null];
    paintHud();
  }
  function beginQte() {
    st.phase = "qte"; st.t = 0; paintHud();
  }
  function setResult(i, kind) {
    if (st.results[i]) return;
    st.results[i] = kind;
    if (kind === "perfect") { st.flash = 1; audio.beep(784, .18); }
    else if (kind === "block") audio.beep(220, .1, "square", .08);
    else { st.flashRed = 1; st.wound = 1; audio.beep(70, .22, "sawtooth", .16); }
    if (st.results.every(Boolean)) endRound();
    else paintHud();
  }
  function endRound() {
    const misses = st.results.filter(r => r === "miss").length;
    const perfects = st.results.filter(r => r === "perfect").length;
    st.hits += misses;
    st.phase = "resolveHit"; st.t = 0;
    if (st.hits >= 3) st.outcome = "lose";
    else if (perfects === 3) st.outcome = "win";
    paintHud();
  }
  function tap(i, kind) {
    if (st.phase !== "qte") return;
    if (i == null) return;
    const ms = st.t * 1000;
    const d = dogs[i];
    if (st.results[i]) return;
    if (kind === "perfect") {
      if (ms >= d.p0 && ms <= d.p1 + 40) return setResult(i, "perfect");
      return setResult(i, "miss");
    }
    if (kind === "block") {
      if (ms <= d.hitMs) return setResult(i, "block");
      return setResult(i, "miss");
    }
  }

  function paintHud() {
    const size = 54;
    let q = "";
    if (st.phase === "qte") {
      dogs.forEach((d, i) => {
        if (st.results[i]) return;
        const ms = st.t * 1000;
        q += `<button class="qte" style="left:${d.bx}%;top:${d.by}%;width:${size}px;height:${size}px;font-size:.78rem" data-i="${i}" data-k="block">擋</button>`;
        if (ms >= d.p0 && ms <= d.p1 + 40) {
          q += `<button class="qte perfect" style="left:${d.px}%;top:${d.py}%;width:${size}px;height:${size}px;font-size:.72rem" data-i="${i}" data-k="perfect">一閃</button>`;
        }
      });
    }
    const hearts = Array.from({length:3}, (_,i) => `<i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:4px;background:${i<st.hits?"#3a3530":"#8a2424"}"></i>`).join("");
    hud.innerHTML = `
      <div style="position:absolute;left:1rem;top:max(1rem,env(safe-area-inset-top))">
        <p class="kicker">隱藏關二</p><p>三隻狗</p>
      </div>
      <div style="position:absolute;right:1rem;top:max(1rem,env(safe-area-inset-top));text-align:right">
        <span class="muted">命</span>${hearts}<br>
        <button class="btn" style="width:auto;padding:0 .6rem;margin-top:.4rem;height:36px" id="quit">離開</button>
      </div>
      <p class="muted" style="position:absolute;left:1rem;bottom:max(1rem,env(safe-area-inset-bottom))">一輪內一閃晒三個</p>
      <div id="miss" style="position:absolute;inset:0">${q}</div>
      ${st.outcome==="lose"?`<div class="overlay" id="losebox">
        <p class="kicker">GAME OVER</p>
        <h2 style="margin:.6rem 0">白色西裝友</h2>
        <p class="muted">「原來你都唔係咁勁⋯」</p>
        <p class="muted" style="margin-top:.8rem">去唔到第三關。</p>
        <div class="stack" style="width:min(100%,18rem);margin-top:1.4rem">
          <button class="btn solid" id="retry">再試</button>
          <button class="btn" id="leave">標題</button>
        </div>
      </div>`:""}`;
    hud.querySelector("#quit").onclick = (e) => { e.stopPropagation(); screen="title"; render(); };
    hud.querySelector("#miss").onpointerdown = (e) => {
      if (e.target.dataset.k) { e.stopPropagation(); tap(+e.target.dataset.i, e.target.dataset.k); }
    };
    const retry = hud.querySelector("#retry");
    if (retry) retry.onclick = () => { screen="hidden2combat"; render(); };
    const leave = hud.querySelector("#leave");
    if (leave) leave.onclick = () => {
      const completed = save.completed.includes(2) ? save.completed : [...save.completed, 2];
      save = { ...save, completed }; write(save);
      screen="title"; render();
    };
  }

  function winHidden2() {
    const completed = save.completed.includes(2) ? save.completed : [...save.completed, 2];
    const hiddenUnlocked = save.hiddenUnlocked.includes(2) ? save.hiddenUnlocked : [...save.hiddenUnlocked, 2];
    save = { ...save, completed, hiddenUnlocked, unlocked: Math.max(save.unlocked, 3), ifCrew: true, ifC: false };
    write(save);
    app.innerHTML = `<div class="screen" style="background:#120e0c">
      <p class="kicker">隱藏關二</p>
      <h2 style="margin:1rem 0">白色西裝友</h2>
      <p class="muted">「呢三個 俾你管！」</p>
      <p class="muted" style="margin-top:1rem">隱藏關二已解鎖。If「收服手下」已開。</p>
      <div class="grow"></div>
      <div class="stack">
        <button class="btn solid" id="next">下一關</button>
        <button class="btn" id="list">關卡</button>
      </div>
    </div>`;
    app.querySelector("#next").onclick = () => play(3);
    app.querySelector("#list").onclick = () => { screen="chapters"; render(); };
  }

  function loop(now) {
    const dt = Math.min(.1, (now-st.last)/1000); st.last = now; st.t += dt;
    const w = app.clientWidth, h = app.clientHeight;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#0c0b0a"; ctx.fillRect(0,0,w,h);
    if (typeof drawCover === "function") drawCover(ctx, bgFor(2), w, h);
    [0.04, 0.34, 0.64].forEach((x, i) => {
      const done = st.results[i];
      ctx.save();
      ctx.globalAlpha = done === "perfect" ? .25 : done === "miss" ? .4 : 1;
      const art = i === 2 ? (ART.c || ART.yeesa) : enemyFor("knife");
      if (typeof drawContain === "function") drawContain(ctx, art, w*x, h*0.22, w*0.30, h*0.46);
      ctx.restore();
    });
    if (st.phase === "approach") {
      if (st.t >= 0.7) beginQte();
    } else if (st.phase === "qte") {
      const ms = st.t * 1000;
      let dirty = false;
      dogs.forEach((d, i) => {
        if (!st.results[i] && ms >= d.hitMs) { st.results[i] = "miss"; st.flashRed = 1; st.wound = 1; dirty = true; }
      });
      if (dirty) {
        if (st.results.every(Boolean)) endRound();
        else paintHud();
      } else if (dogs.some((d, i) => !st.results[i] && ms >= d.p0 && ms <= d.p1 + 40)) {
        paintHud();
      }
    } else if (st.phase === "resolveHit") {
      st.flash = Math.max(0, st.flash-dt*2.4);
      st.flashRed = Math.max(0, st.flashRed-dt*1.6);
      if (st.t > .7) {
        if (st.outcome === "win") { ro.disconnect(); winHidden2(); return; }
        if (st.outcome === "lose") { paintHud(); return; }
        beginApproach();
      }
    }
    if (st.flash>0) { ctx.fillStyle = `rgba(243,236,224,${st.flash*.45})`; ctx.fillRect(0,0,w,h); }
    if (st.flashRed>0) { ctx.fillStyle = `rgba(138,36,36,${st.flashRed*.4})`; ctx.fillRect(0,0,w,h); }
    raf = requestAnimationFrame(loop);
  }
  paintHud();
  raf = requestAnimationFrame(loop);
}
