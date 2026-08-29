const SAVE_KEY = "yat-sim-save-v2";
const CHAPTERS = [
  {
    id: 1, numeral: "一", title: "後巷", subtitle: "拳頭", weapon: "fist",
    enemyCount: 1, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 900, hitMs: 1750, perfectStartMs: 980, perfectEndMs: 1460, buttonPx: 118,
    intro: ["你仲年輕，氣盛。", "後巷有個惡徒，調戲緊個學生妹。", "你衝過去，打走個惡棍。", "點知！？時間好似突然慢咗落嚟！？"],
    resolve: "惡徒一拳打嚟。你作出適當反應，人攤嗮地。學生妹仲企嗮後巷尾。",
    resolveIf: "惡徒倒下。後巷只淨低你同 Yeesa。雨未停。",
  },
  {
    id: 2, numeral: "二", title: "入行", subtitle: "刀", weapon: "knife",
    enemyCount: 3, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 800, hitMs: 1500, perfectStartMs: 860, perfectEndMs: 1240, buttonPx: 104,
    intro: ["上次件事，有個殺手組織嘅人見到。", "佢哋話：「你注定做呢行。」", "第一單。毒品倉庫。兩隻持刀看門狗，同一個女人。"],
    resolve: ["打暈咗三隻看門狗。入到去無毒品。", "有個白西裝 All back 男人坐咗嚟度。", "佢同你講：「你！跟我搵食！」"],
    resolveIf: ["打暈咗三隻看門狗。入到去無毒品。", "有個白西裝 All back 男人坐咗嚟度。", "佢同你講：「你！跟我搵食！」", "你忽然想起後巷個 Yeesa。"],
    resolveC: ["入到去，無毒品。", "有個白色西裝 All back 男人坐咗嚟度。", "佢同你講：「你！跟我搵食！」"],
    resolveCIf: ["入到去，無毒品。", "有個白色西裝 All back 男人坐咗嚟度。", "佢同你講：「你！跟我搵食！」", "你忽然想起後巷個 Yeesa。"],
    resolveFlash: ["三隻狗倒低。入到去無毒品。", "白西裝 All back 男人坐住。", "「跟我。」"],
    resolveFlashIf: ["三隻狗倒低。入到去無毒品。", "白西裝 All back 男人坐住。", "「跟我。」", "你忽然想起後巷個 Yeesa。"],
  },
  {
    id: 3, numeral: "三", title: "任務", subtitle: "槍 · 殺手", weapon: "gun",
    enemyCount: 1, blocksToKill: 1, onlyPerfect: true, blockLabel: "閃",
    windupMs: 700, hitMs: 1080, perfectStartMs: 600, perfectEndMs: 880, buttonPx: 86,
    intro: ["組織落命令。目標係另一個殺手。", "第一次用槍。子彈比拳頭更快。", "作出適當反應。只有最準喻一下，先至殺到佢。"],
    resolve: "槍響。只有最準喻一下先殺到。任務完成。",
    resolveIf: "槍響之後你先驚：如果後巷喻晚你慢咗半拍，倒低嘅就唔係惡徒。",
  },
  {
    id: 4, numeral: "四", title: "敵營", subtitle: "槍 · 五人", weapon: "gun",
    enemyCount: 5, blocksToKill: 1, onlyPerfect: true, blockLabel: "閃",
    windupMs: 640, hitMs: 980, perfectStartMs: 540, perfectEndMs: 800, buttonPx: 78,
    intro: ["衝入去。敵人大本營。", "五個人。作出適當反應，放低一個。", "唔可以失手。"],
    resolve: "五個人。一閃一次，放低一個。敵營倒下，手仲穩。",
    resolveIf: "你數住五個人倒下。忽然覺得 Yeesa 唔應該知你今晚做過啲咩。",
  },
  {
    id: 5, numeral: "五", title: "中年", subtitle: "槍", weapon: "gun",
    enemyCount: 1, blocksToKill: 1, onlyPerfect: true, blockLabel: "閃",
    windupMs: 580, hitMs: 800, perfectStartMs: 440, perfectEndMs: 660, buttonPx: 66,
    intro: ["中年。手已經冊咁穩。", "時間越來越短。製越來越小。", "作出適當反應。"],
    resolve: "你過到。但你知，下一次會更短。",
    resolveIf: "中年。有時你會嗮街口以為見到 Yeesa 個影。行近又唔係。",
  },
  {
    id: 6, numeral: "六", title: "刀再一次", subtitle: "刀 · 三人", weapon: "knife",
    enemyCount: 3, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 520, hitMs: 700, perfectStartMs: 380, perfectEndMs: 560, buttonPx: 56,
    intro: ["老年。返返用刀。", "對手仲係三個人。", "窗口已經細過當年嘅槍口。作出適當反應。"],
    resolve: "刀還在。時間卻越來越短。",
    resolveIf: "刀柄好似當年後巷個拳頭咁近。你已經好耐冊人問過你叫咩名。",
  },
  {
    id: 7, numeral: "七", title: "最後一拳", subtitle: "拳頭", weapon: "fist",
    enemyCount: 1, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 480, hitMs: 600, perfectStartMs: 320, perfectEndMs: 480, buttonPx: 50,
    intro: ["好老了。返返最初喻一拳。", "世界幾乎停唔到。", "你仲有冊喻一下。作出適當反應。"],
    resolve: "你擋到。或者，你一閃。時間從來冊停過。",
    resolveIf: "最後一拳揮完，有人嗮後巷口望住你。你唔肯定係唔係 Yeesa。你只記得自己叫浩然。",
  },
];

const HIDDEN_LIST = [
  { id: 1, title: "後巷尾", screen: "hidden" },
  { id: 2, title: "三隻狗", screen: "hidden2" },
  { id: 21, title: "殺手 C", screen: "hidden2b" },
];

const defaultSave = () => ({
  unlocked: 1,
  completed: [],
  hiddenUnlocked: [],
  metGirl: false,
  ifGirl: false,
  ifCrew: false,
  ifC: false,
  seenHowto: false,
  muted: false,
});

function load() {
  try { return { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") }; }
  catch { return defaultSave(); }
}
function write(s) { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
