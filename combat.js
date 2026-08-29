function startCombat() {
  const c = ch();
  app.innerHTML = `<canvas id="cv"></canvas><div class="hud" id="hud"></div><div class="grain"></div>`;
  const canvas = app.querySelector("#cv");
  const ctx = canvas.getContext("2d");
  const hud = app.querySelector("#hud");
  const st = {
    phase: "approach", t: 0, clock: 0, enemyIndex: 0, blocks: 0,
    threat: 0.2, flash: 0, flashRed: 0, wound: 0, outcome: null,
    qte: null, last: performance.now()
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
    if (kind === "perfect") { st.flash = 1; audio.beep(784, .3); }
    else if (kind === "miss") { st.flashRed = 1; st.wound = 1; audio.beep(70, .35, "sawtooth", .18); }
    else audio.beep(220, .12, "square", .1);
    if (kind === "perfect") {
      st.enemyIndex++; st.blocks = 0;
      if (st.enemyIndex >= c.enemyCount) st.outcome = "win";
    } else if (kind === "block") {
      st.blocks++;
      if (st.blocks >= c.blocksToKill) {
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
        <p class="kicker">第${c.numeral}關</p><p>${c.title}</p>
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
    if (retry) retry.onclick = () => { screen="combat"; render(); };
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
    ctx.fillStyle = "#1a1512"; ctx.fillRect(0,h*.62,w,h*.4);
    ctx.fillStyle = "#2a2220"; ctx.fillRect(w*.08, h*.28, w*.18, h*.36);
    ctx.fillStyle = `rgba(180,40,60,${.15+Math.sin(st.clock)*.04})`;
    ctx.fillRect(w*.7, h*.18, w*.22, h*.12);

    const ea = st.phase==="approach" ? Math.min(1, st.t/(c.windupMs/1000)) : (st.outcome==="win"?Math.max(0,1-st.t):1);
    ctx.globalAlpha = ea;
    ctx.fillStyle = "#1c1a18"; ctx.fillRect(w*.12, h*.38, w*.16, h*.36);
    ctx.fillStyle = "#2a2420"; ctx.beginPath(); ctx.arc(w*.2, h*.36, 18, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

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
        if (st.outcome === "win") { storyMode = "outro"; screen = "story"; ro.disconnect(); render(); return; }
        if (st.outcome !== "lose") beginApproach();
      }
    }

    if (st.phase === "qte" || (st.phase==="approach" && c.weapon!=="gun") || st.phase==="resolveHit") {
      ctx.save(); ctx.translate(w*.5, h*.48);
      const s = st.threat;
      if (c.weapon === "gun") {
        ctx.fillStyle = "#c4a46a"; ctx.beginPath(); ctx.ellipse(0,0, 18*s, 18*s, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#8a6a3a"; ctx.beginPath(); ctx.arc(0,0, 7*s, 0, Math.PI*2); ctx.fill();
      } else if (c.weapon === "knife") {
        ctx.rotate(-.4); ctx.fillStyle = "#d8d2c8";
        ctx.beginPath(); ctx.moveTo(-10*s,-70*s); ctx.lineTo(10*s,-70*s); ctx.lineTo(2*s,80*s); ctx.lineTo(-2*s,80*s); ctx.fill();
      } else {
        ctx.fillStyle = "#c49a72"; ctx.beginPath(); ctx.ellipse(0,10*s, 34*s, 28*s, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
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
