const app = document.getElementById("app");
let save = load();
let screen = "title";
let chapterId = 1;
let storyMode = "intro";
let combat = null;
let raf = 0;
let lastRun = null;

function ch() { return CHAPTERS.find(c => c.id === chapterId); }
function persist(next) { save = next; write(save); render(); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pos(avoid) {
  for (let i = 0; i < 24; i++) {
    const x = rand(16, 84), y = rand(24, 76);
    if (avoid && (x-avoid.x)**2 + (y-avoid.y)**2 < avoid.r**2) continue;
    return { x, y };
  }
  return { x: 70, y: 36 };
}
function linesOf(raw) { return Array.isArray(raw) ? raw : [raw]; }
function resolveLines() {
  const c = ch();
  if (c.id === 2) {
    const route = typeof ch2Route === "function" ? ch2Route() : "crew";
    if (route === "c") return linesOf(save.ifGirl ? (c.resolveCIf || c.resolveC) : c.resolveC);
    if (route === "flash") return linesOf(save.ifGirl ? (c.resolveFlashIf || c.resolveIf) : (c.resolveFlash || c.resolve));
  }
  return linesOf(save.ifGirl ? c.resolveIf : c.resolve);
}

const audio = {
  ctx: null,
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  beep(freq, dur, type="sine", vol=.08) {
    if (save.muted || !this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur + .02);
  }
};
function armed(fn) { audio.unlock(); audio.beep(660, .08); fn(); }

function render() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  combat = null;
  if (screen === "title") return title();
  if (screen === "howto") return howto();
  if (screen === "chapters") return chapters();
  if (screen === "story") return story();
  if (screen === "combat") return startCombat();
  if (screen === "resolve") return resolveScreen();
  if (screen === "hidden") return hiddenStage();
  if (screen === "hidden2") return hiddenStage2();
  if (screen === "hidden2combat") return startHidden2Combat();
  if (screen === "hidden2b") return hiddenStage2B();
  if (screen === "hidden2bcombat") return startHidden2BCombat();
  if (screen === "ending") return ending();
}

function title() {
  app.innerHTML = `
    <div class="screen" style="background:radial-gradient(ellipse at 30% 20%,#3a2018,transparent 50%),#0a0908">
      <div class="row"><button class="btn" style="width:auto;padding:0 .8rem" id="mute">${save.muted?"靜音":"音效"}</button></div>
      <div class="grow" style="display:flex;flex-direction:column;justify-content:center">
        <p class="kicker">THE LAST FLASH</p>
        <h1>一閃</h1>
        <p class="muted" style="margin-top:1rem">殺手都會老。</p>
      </div>
      <div class="stack">
        <button class="btn solid" id="start">開始</button>
        <button class="btn" id="chs">關卡</button>
        <button class="btn" id="how">說明</button>
      </div>
    </div><div class="grain"></div>`;
  app.querySelector("#mute").onclick = () => persist({ ...save, muted: !save.muted });
  app.querySelector("#start").onclick = () => armed(() => {
    if (!save.seenHowto) { screen = "howto"; render(); return; }
    const next = CHAPTERS.find(c => c.id <= save.unlocked && !save.completed.includes(c.id));
    if (!next) { if (save.completed.includes(7)) { screen = "ending"; render(); } else play(1); return; }
    play(next.id);
  });
  app.querySelector("#chs").onclick = () => armed(() => { screen = "chapters"; render(); });
  app.querySelector("#how").onclick = () => armed(() => { screen = "howto"; render(); });
}

function howto() {
  app.innerHTML = `
    <div class="screen">
      <p class="kicker">說明</p>
      <h2 style="margin:1rem 0">作出適當反應</h2>
      <p class="muted">拳頭、刀接近喻陣，時間會慢。槍關係子彈飛近。</p>
      <p class="muted" style="margin-top:1rem">畫面上會出現搔。作出適當反應。再等一吓，會有更短嘅窗口。</p>
      <p class="muted" style="margin-top:1rem">製出現嘅位置每次都唔同。失手一次，即死。</p>
      <p class="muted" style="margin-top:1rem">過關之後會有「下一關」。窗口好長，但唔撲就唔會解鎖。</p>
      <div class="grow"></div>
      <button class="btn solid" id="ok">明白</button>
    </div>`;
  app.querySelector("#ok").onclick = () => {
    const first = !save.seenHowto;
    save = { ...save, seenHowto: true }; write(save);
    if (first) play(1); else { screen = "title"; render(); }
  };
}

const IF_OPTIONS = [
  { flag: "ifGirl", hiddenId: 1, label: "識到學生女", hint: "開著之後，後續關卡故事會變。" },
  { flag: "ifCrew", hiddenId: 2, label: "收服手下", hint: "同「收服殺手C」不可同時開。" },
  { flag: "ifC", hiddenId: 21, label: "收服殺手C", hint: "同「收服手下」不可同時開。" },
];

function chapters() {
  const endingOpen = save.unlocked >= 8 || save.completed.includes(7);
  const cards = CHAPTERS.map(c => {
    const locked = c.id > save.unlocked;
    const done = save.completed.includes(c.id);
    return `<button class="card" ${locked?"disabled":""} data-id="${c.id}">
      <p class="kicker">第${c.numeral}關 · ${c.subtitle}</p>
      <div class="row" style="margin-top:.35rem"><strong>${locked?"———":c.title}</strong><span class="muted">${locked?"未開":done?"過關":"進入"}</span></div>
    </button>`;
  }).join("");
  const hidden = (typeof HIDDEN_LIST === "undefined" ? [] : HIDDEN_LIST)
    .filter(h => save.hiddenUnlocked.includes(h.id))
    .map(h => `<button class="card" data-hidden="${h.id}" data-hs="${h.screen}">
      <p class="kicker">隱藏關</p>
      <div class="row" style="margin-top:.35rem"><strong>${h.title}</strong><span class="muted">進入</span></div>
    </button>`).join("");
  const openedIf = IF_OPTIONS.filter(o => save.hiddenUnlocked.includes(o.hiddenId));
  const ifCard = openedIf.length ? `
        <div class="card">
          <p class="kicker">If</p>
          ${openedIf.map(o => `
          <div class="toggle" style="margin-top:.5rem" data-if="${o.flag}">
            <span>${o.label}</span>
            <button class="switch ${save[o.flag]?"on":""}" data-if-sw="${o.flag}"></button>
          </div>
          <p class="muted" style="margin-top:.45rem;font-size:.8rem">${o.hint}</p>`).join("")}
        </div>` : "";
  app.innerHTML = `
    <div class="screen">
      <div class="row"><button class="btn" style="width:auto;padding:0 .6rem" id="back">返回</button><h2>關卡</h2><button class="btn" style="width:auto;padding:0 .6rem" id="reset">重置</button></div>
      <div class="list grow" style="margin-top:1rem">
        ${cards}${hidden}
        <button class="card" ${endingOpen?"":"disabled"} id="end"><p class="kicker">終章</p><strong>${endingOpen?"時間還在走":"———"}</strong></button>
        ${ifCard}
      </div>
    </div>`;
  app.querySelector("#back").onclick = () => { screen = "title"; render(); };
  app.querySelector("#reset").onclick = () => persist({ ...defaultSave(), muted: save.muted, seenHowto: true });
  app.querySelector("#end").onclick = () => { if (endingOpen) { screen = "ending"; render(); } };
  app.querySelectorAll("[data-if-sw]").forEach(sw => {
    sw.onclick = () => {
      const flag = sw.dataset.ifSw;
      const on = !save[flag];
      const next = { ...save, [flag]: on };
      if (on && flag === "ifCrew") next.ifC = false;
      if (on && flag === "ifC") next.ifCrew = false;
      persist(next);
    };
  });
  app.querySelectorAll("[data-id]").forEach(b => b.onclick = () => play(+b.dataset.id));
  app.querySelectorAll("[data-hidden]").forEach(b => {
    b.onclick = () => { screen = b.dataset.hs; render(); };
  });
}

function play(id) {
  chapterId = id; storyMode = "intro"; lastRun = null; screen = "story"; render();
}

function story() {
  const c = ch();
  const intro = storyMode === "intro";
  const lines = intro ? linesOf(c.intro) : resolveLines();
  let i = 0;
  const paint = () => {
    app.innerHTML = `
      <div class="screen" style="background:linear-gradient(#0a0908cc,#0a0908f0),#1a1410">
        <p class="kicker">${intro?`第${c.numeral}關`:"過關"}</p>
        <h2 style="margin:.7rem 0 1.2rem">${c.title}</h2>
        <p class="muted" style="font-size:1.05rem">${lines[i]}</p>
        <div class="grow"></div>
        <p class="muted">${i < lines.length-1 ? "輕觸繼續" : (intro?"開始":"")}</p>
      </div>`;
    app.querySelector(".screen").onclick = () => {
      if (i < lines.length-1) { i++; paint(); return; }
      if (intro) { screen = "combat"; render(); return; }
      screen = "resolve"; render();
    };
  };
  paint();
}
