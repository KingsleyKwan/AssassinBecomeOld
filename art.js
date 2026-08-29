const ART_KEYS = ["alley","warehouse","night","hq","thug","knifeman","gunman","fist","knife","bullet","yeesa","c"];
const ART_SRC = Object.fromEntries(ART_KEYS.map((k) => [k, "art/" + k + ".svg"]));
const ART = {};

function loadArt(done) {
  let left = ART_KEYS.length;
  ART_KEYS.forEach((k) => {
    const img = new Image();
    img.onload = img.onerror = () => { ART[k] = img; if (--left === 0) done(); };
    img.src = ART_SRC[k];
  });
}
function drawCover(ctx, img, w, h) {
  if (!img || !img.width) return;
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function drawContain(ctx, img, x, y, w, h) {
  if (!img || !img.width) return;
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function sceneKey(id) {
  if (id === 1 || id === 7) return "alley";
  if (id === 2 || id === 6 || id === 21) return "warehouse";
  if (id === 4) return "hq";
  return "night";
}
function bgFor(id) { return ART[sceneKey(id)]; }
function enemyFor(weapon, idx, spec) {
  if (spec && spec.female) return ART.c || ART.yeesa;
  if ((spec && spec.id === 2 || (!spec && chapterId === 2)) && idx === 2) return ART.c || ART.yeesa;
  if (weapon === "knife") return ART.knifeman;
  if (weapon === "gun") return ART.gunman;
  return ART.thug;
}
function threatFor(weapon) {
  if (weapon === "knife") return ART.knife;
  if (weapon === "gun") return ART.bullet;
  return ART.fist;
}
function screenBg(key) {
  return "background:#0a0908 url('" + (ART_SRC[key] || ART_SRC.alley) + "') center/cover no-repeat";
}
function ch2Route() {
  const k = lastRun && lastRun.kills;
  if (k && k[0] === "perfect" && k[1] === "perfect" && k[2] === "block") return "c";
  if (lastRun && !lastRun.usedPerfect) return "crew";
  if (lastRun && lastRun.usedPerfect) return "flash";
  return "crew";
}
