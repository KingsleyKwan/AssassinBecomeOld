function resolveScreen() {
  const c = ch();
  const longMs = 10000;
  const showHidden = c.id === 1 && !save.hiddenUnlocked.includes(1);
  let t0 = performance.now();
  let hiddenOn = false, hiddenGone = false;
  const hiddenAt = 1800, hiddenLen = 900;
  app.innerHTML = `
    <div class="screen" style="background:#0a0908">
      <p class="kicker">過關</p>
      <h2 style="margin:.6rem 0 1rem">${c.title}</h2>
      <p class="muted">${save.ifGirl ? c.resolveIf : c.resolve}</p>
      <div class="grow"></div>
      <div id="zone" style="position:relative;height:46vh"></div>
    </div>`;
  const zone = app.querySelector("#zone");
  function tick(now) {
    if (screen !== "resolve") return;
    const elapsed = now - t0;
    const nextLeft = Math.max(0, 1 - elapsed/longMs);
    if (showHidden && !hiddenOn && !hiddenGone && elapsed >= hiddenAt && elapsed < hiddenAt+hiddenLen) {
      hiddenOn = true;
      const p = pos();
      const b = document.createElement("button");
      b.className = "qte perfect";
      b.textContent = "睇吓條女有冊事";
      b.style.cssText = `left:${p.x}%;top:${p.y}%;width:min(72vw,240px);height:52px;border-radius:14px;font-size:.85rem`;
      b.onclick = (e) => { e.stopPropagation(); screen = "hidden"; render(); };
      zone.appendChild(b);
    }
    if (showHidden && hiddenOn && elapsed >= hiddenAt+hiddenLen) {
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

function hiddenStage() {
  const lines = [
    { who: "嘉敏", text: "……好多謝你。" },
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
    const truthMs = 2800, truthLen = 1100;
    app.innerHTML = `
      <div class="screen" id="hs" style="background:#120e0c">
        <p class="kicker">隱藏關 · 後巷尾</p>
        <p class="muted" style="margin-top:1rem">佢等你講句嘢。</p>
        <div class="grow"></div>
        <div id="zone" style="position:relative;height:55vh"></div>
      </div>`;
    const zone = app.querySelector("#zone");
    function addBtn(label, kind, life) {
      if (answered) return;
      const p = pos();
      const b = document.createElement("button");
      b.className = "qte" + (kind==="truth"?" perfect":"");
      b.textContent = label;
      const w = kind==="truth" ? 200 : Math.min(240, 28+label.length*18);
      b.style.cssText = `left:${p.x}%;top:${p.y}%;width:${w}px;height:48px;border-radius:14px;font-size:.82rem`;
      b.onclick = (e) => { e.stopPropagation(); pick(kind); };
      zone.appendChild(b);
      setTimeout(() => b.remove(), life);
    }
    function cycle() {
      if (answered) return;
      addBtn(wrongA[Math.floor(Math.random()*wrongA.length)], "slap", 2200);
      setTimeout(() => { if (!answered) addBtn(wrongB[Math.floor(Math.random()*wrongB.length)], "lame", 2400); }, 700);
    }
    cycle();
    const iv = setInterval(() => { if (!answered) cycle(); else clearInterval(iv); }, 2600);
    function tick(now) {
      if (answered) return;
      const el = now - t0;
      if (el >= truthMs && el < truthMs+truthLen && !zone.querySelector(".perfect")) addBtn(truth, "truth", truthLen);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    function pick(kind) {
      answered = true;
      clearInterval(iv);
      if (kind === "slap") {
        app.innerHTML = `<div class="screen slapped" style="background:#2a1010">
          <p class="kicker">拍</p><h2 style="margin:1rem 0">一巴掌</h2>
          <p class="muted">學生妹一拍車落塊面度。</p>
          <div class="grow"></div>
          <button class="btn solid" id="again">再試</button>
        </div>`;
        audio.beep(140,.2,"square",.16);
        app.querySelector("#again").onclick = () => hiddenStage();
        return;
      }
      if (kind === "lame") {
        app.innerHTML = `<div class="screen" style="background:#161310">
          <p class="kicker">……</p><h2 style="margin:1rem 0">無奈</h2>
          <p class="muted">嘉敏嘴拉實，眼神避開。好無奈。</p>
          <div class="grow"></div>
          <button class="btn solid" id="again">再試</button>
        </div>`;
        app.querySelector("#again").onclick = () => hiddenStage();
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
        <h2 style="margin:1rem 0">嘉敏</h2>
        <p class="muted">「……我叫嘉敏。」</p>
        <p class="muted" style="margin-top:1rem">佢記住你個名。隱藏關已解鎖。If「識到學生女」已開。</p>
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
