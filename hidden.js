function resolveScreen() {
  const c = ch();
  const longMs = 10000;
  const route = typeof ch2Route === "function" ? ch2Route() : "";
  const extra =
    (c.id === 1 && !save.hiddenUnlocked.includes(1))
      ? { at: 1800, len: 900, label: "睇吓條女有冊事", go: "hidden" }
      : (c.id === 2 && route === "c" && !save.hiddenUnlocked.includes(21))
        ? { at: 1600, len: 1200, label: "出面條女我嘅！", go: "hidden2b" }
      : (c.id === 2 && route === "crew" && !save.hiddenUnlocked.includes(2))
        ? { at: 1600, len: 1200, label: "我Train你啲𡃁啦～", go: "hidden2" }
        : null;
  const lines = resolveLines();
  const blurb = lines[lines.length - 1];
  let t0 = performance.now();
  let hiddenOn = false, hiddenGone = false;
  app.innerHTML = `
    <div class="screen" style="background:#0a0908">
      <p class="kicker">過關</p>
      <h2 style="margin:.6rem 0 1rem">${c.title}</h2>
      <p class="muted">${blurb}</p>
      <div class="grow"></div>
      <div id="zone" style="position:relative;height:46vh"></div>
    </div>`;
  const zone = app.querySelector("#zone");
  function tick(now) {
    if (screen !== "resolve") return;
    const elapsed = now - t0;
    const nextLeft = Math.max(0, 1 - elapsed/longMs);
    if (extra && !hiddenOn && !hiddenGone && elapsed >= extra.at && elapsed < extra.at+extra.len) {
      hiddenOn = true;
      const p = pos();
      const b = document.createElement("button");
      b.className = "qte perfect";
      b.textContent = extra.label;
      b.style.cssText = `left:${p.x}%;top:${p.y}%;width:min(78vw,260px);height:52px;border-radius:14px;font-size:.82rem`;
      b.onclick = (e) => { e.stopPropagation(); screen = extra.go; render(); };
      zone.appendChild(b);
    }
    if (extra && hiddenOn && elapsed >= extra.at+extra.len) {
      hiddenOn = false; hiddenGone = true;
      zone.querySelector(".perfect")?.remove();
    }
    let next = zone.querySelector("[data-next]");
    if (!next && elapsed < longMs) {
      const p = pos();
      next = document.createElement("button");
      next.className = "qte";
      next.dataset.next = "1";
      next.textContent = "下一關";
      next.style.cssText = `left:${p.x}%;top:${Math.max(28,Math.min(72,p.y))}%;width:min(64vw,200px);height:56px;border-radius:14px`;
      next.onclick = (e) => { e.stopPropagation(); advance(); };
      zone.appendChild(next);
    }
    if (next) {
      if (!next.querySelector("i")) {
        const bar = document.createElement("div");
        bar.className = "timer"; bar.innerHTML = "<i></i>";
        bar.style.cssText = "position:absolute;left:10%;right:10%;bottom:-10px;width:80%";
        next.appendChild(bar);
      }
      next.querySelector("i").style.transform = `scaleX(${nextLeft})`;
    }
    if (elapsed >= longMs) {
      zone.innerHTML = `<p class="muted" style="text-align:center;padding-top:2rem">窗口過咗。<br>下一關未解鎖。</p>
        <button class="btn" id="home" style="margin:1.2rem auto;width:min(100%,16rem)">返回</button>`;
      zone.querySelector("#home").onclick = () => { screen="title"; render(); };
      markCompletedOnly();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function markCompletedOnly() {
  if (!save.completed.includes(chapterId)) {
    save = { ...save, completed: [...save.completed, chapterId] };
    write(save);
  }
}

function advance() {
  const completed = save.completed.includes(chapterId) ? save.completed : [...save.completed, chapterId];
  const unlocked = Math.max(save.unlocked, chapterId + 1);
  save = { ...save, completed, unlocked }; write(save);
  if (chapterId >= 7) { screen = "ending"; render(); return; }
  play(chapterId + 1);
}

function leaveHiddenWithoutMeet() {
  chapterId = 1;
  const completed = save.completed.includes(1) ? save.completed : [...save.completed, 1];
  save = { ...save, completed, unlocked: Math.max(save.unlocked, 2) };
  write(save);
  play(2);
}

function hiddenStage() {
  const lines = [
    { who: "Yeesa", text: "……好多謝你。" },
    { who: "", text: "後巷好靜。佢望住你。" },
  ];
  let i = 0;
  const wrongA = ["（咸濕佬心心眼）", "（嘴埋去）"];
  const wrongB = ["因為我勁", "我係好人", "我係Gay"];
  const truth = "我叫浩然！";
  function paintLine() {
    app.innerHTML = `
      <div class="screen" id="hs" style="background:#120e0c">
        <p class="kicker">隱藏關 · 後巷尾</p>
        <h2 style="margin:.6rem 0 1.2rem">${lines[i].who || " "}</h2>
        <p class="muted" style="font-size:1.1rem">${lines[i].text}</p>
        <div class="grow"></div>
        <p class="muted">輕觸繼續</p>
      </div>`;
    app.querySelector("#hs").onclick = () => {
      if (i < lines.length-1) { i++; paintLine(); return; }
      paintChoices();
    };
  }
  function paintChoices() {
    let answered = false;
    let t0 = performance.now();
    const limitMs = 7500;
    const truthDur = 1600;
    const truthAt = 1600 + Math.random() * 2800;
    let truthShown = false;
    app.innerHTML = `
      <div class="screen" id="hs" style="background:#120e0c">
        <p class="kicker">隱藏關 · 後巷尾</p>
        <p class="muted" style="margin-top:.7rem">Yeesa「……好多謝你。」</p>
        <p class="muted" style="margin-top:.45rem">限時內作出適當反應。</p>
        <div class="timer" style="margin:1rem 0 0;width:100%"><i id="tbar"></i></div>
        <div id="said" style="margin-top:.8rem;min-height:2.4em"></div>
        <div class="grow"></div>
        <div id="zone" style="position:relative;height:44vh"></div>
      </div>`;
    const zone = app.querySelector("#zone");
    const said = app.querySelector("#said");
    const tbar = app.querySelector("#tbar");
    function addBtn(label, kind, life) {
      if (answered) return;
      const p = pos();
      const b = document.createElement("button");
      b.className = "qte" + (kind==="truth"?" perfect":"");
      b.dataset.kind = kind;
      b.textContent = label;
      const w = kind==="truth" ? 200 : Math.min(240, 28+label.length*18);
      b.style.cssText = `left:${p.x}%;top:${p.y}%;width:${w}px;height:48px;border-radius:14px;font-size:.82rem`;
      b.onclick = (e) => { e.stopPropagation(); pick(kind, label); };
      zone.appendChild(b);
      setTimeout(() => { if (!answered && b.parentNode) b.remove(); }, life);
    }
    function cycle() {
      if (answered) return;
      addBtn(wrongA[Math.floor(Math.random()*wrongA.length)], "slap", 1800);
      setTimeout(() => { if (!answered) addBtn(wrongB[Math.floor(Math.random()*wrongB.length)], "lame", 1800); }, 500);
    }
    cycle();
    const iv = setInterval(() => { if (!answered) cycle(); else clearInterval(iv); }, 2200);
    function tick(now) {
      if (answered) return;
      const el = now - t0;
      tbar.style.transform = "scaleX(" + Math.max(0, 1 - el/limitMs) + ")";
      if (!truthShown && el >= truthAt) {
        truthShown = true;
        addBtn(truth, "truth", Math.min(truthDur, limitMs - el - 80));
      }
      if (el >= limitMs) {
        answered = true;
        clearInterval(iv);
        showResult("timeout", "");
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    function pick(kind, label) {
      answered = true;
      clearInterval(iv);
      said.innerHTML = `<p style="color:#f3ece0;letter-spacing:.12em;font-size:1.05rem">你「${label}」</p>`;
      zone.querySelectorAll("button").forEach((b) => { if (b.textContent !== label) b.remove(); });
      setTimeout(() => showResult(kind, label), 650);
    }
    function showResult(kind, label) {
      if (kind === "timeout" || kind === "slap" || kind === "lame") {
        const slap = kind === "slap";
        app.innerHTML = `<div class="screen ${slap?"slapped":""}" style="background:${slap?"#2a1010":"#161310"}">
          <p class="kicker">${kind==="timeout"?"過時":slap?"拍":"……"}</p>
          <h2 style="margin:.8rem 0 .4rem">${label ? "你「"+label+"」" : "唔講得切"}</h2>
          <p class="muted">隱藏關未解鎖。</p>
          <div class="grow"></div>
          <button class="btn solid" id="next">下一關</button>
        </div>`;
        app.querySelector("#next").onclick = () => leaveHiddenWithoutMeet();
        return;
      }
      save = {
        ...save,
        hiddenUnlocked: save.hiddenUnlocked.includes(1) ? save.hiddenUnlocked : [...save.hiddenUnlocked, 1],
        metGirl: true, ifGirl: true,
        completed: save.completed.includes(1) ? save.completed : [...save.completed, 1],
        unlocked: Math.max(save.unlocked, 2),
      };
      write(save);
      app.innerHTML = `<div class="screen" style="background:#120e0c">
        <p class="kicker">後巷尾</p>
        <h2 style="margin:.8rem 0 .4rem">你「${label}」</h2>
        <p class="muted">Yeesa「……我叫 Yeesa。」</p>
        <div class="grow"></div>
        <div class="stack">
          <button class="btn solid" id="next">下一關</button>
          <button class="btn" id="list">關卡</button>
        </div>
      </div>`;
      app.querySelector("#next").onclick = () => play(2);
      app.querySelector("#list").onclick = () => { screen="chapters"; render(); };
    }
  }
  paintLine();
}

function hiddenStage2() {
  const lines = [
    { who: "你", text: "「我Train你啲𡃁啦～」" },
    { who: "", text: "出面三隻看門狗聽到就發癲。" },
    { who: "看門狗", text: "「你憑咩呀！」" },
  ];
  let i = 0;
  const paint = () => {
    app.innerHTML = `
      <div class="screen" id="hs" style="background:#120e0c">
        <p class="kicker">隱藏關 · 三隻狗</p>
        <h2 style="margin:.6rem 0 1.2rem">${lines[i].who || " "}</h2>
        <p class="muted" style="font-size:1.1rem">${lines[i].text}</p>
        <div class="grow"></div>
        <p class="muted">${i < lines.length-1 ? "輕觸繼續" : "開始"}</p>
      </div>`;
    app.querySelector("#hs").onclick = () => {
      if (i < lines.length-1) { i++; paint(); return; }
      screen = "hidden2combat"; render();
    };
  };
  paint();
}

function hiddenStage2B() {
  const lines = [
    { who: "白色西裝友", text: "「佢叫C。你隨便攞啦！」" },
    { who: "", text: "你行到出去。" },
    { who: "C", text: "「大佬以後點叫你？」" },
    { who: "你", text: "「我叫⋯」" },
    { who: "C", text: "「食尾啦」" },
    { who: "", text: "C 攞住把刀快速刺向你⋯" },
  ];
  let i = 0;
  const paint = () => {
    app.innerHTML = `
      <div class="screen" id="hs" style="background:#120e0c">
        <p class="kicker">隱藏關 · 殺手 C</p>
        <h2 style="margin:.6rem 0 1.2rem">${lines[i].who || " "}</h2>
        <p class="muted" style="font-size:1.1rem">${lines[i].text}</p>
        <div class="grow"></div>
        <p class="muted">${i < lines.length-1 ? "輕觸繼續" : "開始"}</p>
      </div>`;
    app.querySelector("#hs").onclick = () => {
      if (i < lines.length-1) { i++; paint(); return; }
      screen = "hidden2bcombat"; render();
    };
  };
  paint();
}

function finishHidden2B(killed) {
  const completed = save.completed.includes(2) ? save.completed : [...save.completed, 2];
  if (killed) {
    save = { ...save, completed, unlocked: Math.max(save.unlocked, 3) };
    write(save);
    app.innerHTML = `<div class="screen" style="background:#120e0c">
      <p class="kicker">隱藏關二B</p>
      <h2 style="margin:1rem 0">白色西裝友</h2>
      <p class="muted">「條女俾你殺咗喇嗚」</p>
      <div class="grow"></div>
      <div class="stack">
        <button class="btn solid" id="next">下一關</button>
        <button class="btn" id="list">關卡</button>
      </div>
    </div>`;
  } else {
    const hiddenUnlocked = save.hiddenUnlocked.includes(21) ? save.hiddenUnlocked : [...save.hiddenUnlocked, 21];
    save = { ...save, completed, hiddenUnlocked, unlocked: Math.max(save.unlocked, 3), ifC: true, ifCrew: false };
    write(save);
    app.innerHTML = `<div class="screen" style="background:#120e0c">
      <p class="kicker">隱藏關二B</p>
      <h2 style="margin:1rem 0">C</h2>
      <p class="muted">「哼！」</p>
      <p class="muted" style="margin-top:1rem">隱藏關二B已解鎖。If「收服殺手C」已開。</p>
      <div class="grow"></div>
      <div class="stack">
        <button class="btn solid" id="next">下一關</button>
        <button class="btn" id="list">關卡</button>
      </div>
    </div>`;
  }
  app.querySelector("#next").onclick = () => play(3);
  app.querySelector("#list").onclick = () => { screen="chapters"; render(); };
}

function ending() {
  const line = save.ifGirl
    ? "你贏咗。時間從來冊停過。後巷喻晚你講過自己叫浩然。"
    : "你贏咗。時間從來冊停過。殺手都會老。有人曾經問過你叫咩名。";
  app.innerHTML = `
    <div class="screen" style="background:#0a0908">
      <p class="kicker">終章</p>
      <h1 style="font-size:2.2rem;margin:1rem 0">一閃</h1>
      <p class="muted">${line}</p>
      <div class="grow"></div>
      <div class="stack">
        <button class="btn solid" id="again">再來一次</button>
        <button class="btn" id="home">標題</button>
      </div>
    </div>`;
  app.querySelector("#again").onclick = () => { persist({ ...defaultSave(), muted: save.muted, seenHowto: true }); play(1); };
  app.querySelector("#home").onclick = () => { screen="title"; render(); };
}

render();
