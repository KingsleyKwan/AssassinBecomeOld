const SAVE_KEY = "yat-sim-save-v2";
const CHAPTERS = [
  {
    id: 1, numeral: "一", title: "後巷", subtitle: "拳頭", weapon: "fist",
    enemyCount: 1, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 900, hitMs: 1750, perfectStartMs: 980, perfectEndMs: 1460, buttonPx: 118,
    intro: ["想當年 年少無知⋯", "見到後巷有個惡棍，調戲緊個學生妹。學生妹好驚", "你衝過去談住打走個惡棍。", "惡棍：「阻人扑⋯」"],
    resolve: "惡徒一拳打嚼。你作出適當反應，人攤單地。學生妹仲企單後巷尾。",
    resolveIf: "惡徒倒下。後巷只淨低你同 Yeesa。雨未停。",
  },
  {
    id: 2, numeral: "二", title: "入行", subtitle: "刀", weapon: "knife",
    enemyCount: 3, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 800, hitMs: 1500, perfectStartMs: 860, perfectEndMs: 1240, buttonPx: 104,
    intro: ["上次件事，有個殺手組織嘅人見到。", "佢哋話：「你注定做呢行。」", "第一單。毒品倉庫。兩隻持刀看門狗，同一個女人。"],
    resolve: ["打暈咗三隻看門狗。入到去無毒品。", "有個白西裝 All back 男人坐咗嚼度。", "佢同你講：「你！跟我揪食！」"],
    resolveIf: ["打暈咗三隻看門狗。入到去無毒品。", "有個白西裝 All back 男人坐咗嚼度。", "佢同你講：「你！跟我揪食！」", "你忽然想起後巷個 Yeesa。"],
    resolveC: ["入到去，無毒品。", "有個白色西裝 All back 男人坐咗嚼度。", "佢同你講：「你！跟我揪食！」"],
    resolveCIf: ["入到去，無毒品。", "有個白色西裝 All back 男人坐咗嚼度。", "佢同你講：「你！跟我揪食！」", "你忽然想起後巷個 Yeesa。"],
    resolveFlash: ["三隻狗倒低。入到去無毒品。", "白西裝 All back 男人坐住。", "「跟我。」"],
    resolveFlashIf: ["三隻狗倒低。入到去無毒品。", "白西裝 All back 男人坐住。", "「跟我。」", "你忽然想起後巷個 Yeesa。"],
  },
  {
    id: 3, numeral: "三", title: "任務", subtitle: "槍 · 殺手", weapon: "gun",
    enemyCount: 6, blocksToKill: 1, onlyPerfect: true, blockLabel: "閃",
    windupMs: 700, hitMs: 1080, perfectStartMs: 600, perfectEndMs: 880, buttonPx: 86,
    intro: ["一段日子之後。突然收到組織order：殺個二五仔殺手", "對付槍，要反應更快。", "個殺手支槍得6飛子彈⋯"],
    introIf: ["一段日子之後。同Yeesa行緊街嘅時候，收到組織order：殺個二五仔殺手", "對付槍，要反應更快。", "個殺手支槍得6飛子彈⋯"],
    lose: ["子彈穿過身體⋯⋯"],
    resolve: "槍響。只有最準嘅一下先殺到。任務完成。",
    resolveIf: "槍響之後你先驚：如果後巷喻晚你慢咗半拍，倒低嘅就唔係惡徒。",
  },
  {
    id: 4, numeral: "四", title: "敵營", subtitle: "拳／刀／槍", weapon: "fist",
    enemyCount: 5, blocksToKill: 3, onlyPerfect: false, blockLabel: "擋",
    windupMs: 820, hitMs: 1500, perfectStartMs: 880, perfectEndMs: 1280, buttonPx: 110,
    waves: [
      { weapon: "fist",  blocksToKill: 3, onlyPerfect: false, blockLabel: "擋", windupMs: 820, hitMs: 1500, perfectStartMs: 880, perfectEndMs: 1280, buttonPx: 110 },
      { weapon: "fist",  blocksToKill: 3, onlyPerfect: false, blockLabel: "擋", windupMs: 820, hitMs: 1500, perfectStartMs: 880, perfectEndMs: 1280, buttonPx: 110 },
      { weapon: "knife", blocksToKill: 3, onlyPerfect: false, blockLabel: "擋", windupMs: 720, hitMs: 1180, perfectStartMs: 760, perfectEndMs: 1040, buttonPx: 92 },
      { weapon: "knife", blocksToKill: 3, onlyPerfect: false, blockLabel: "擋", windupMs: 720, hitMs: 1180, perfectStartMs: 760, perfectEndMs: 1040, buttonPx: 92 },
      { weapon: "gun",   blocksToKill: 1, onlyPerfect: true,  blockLabel: "閃", windupMs: 700, hitMs: 1080, perfectStartMs: 600, perfectEndMs: 880, buttonPx: 86 }
    ],
    intro: ["又過咗一段時間。組織話，呢個組織 唔留得。叫我殺人敵人大本營。"],
    introCrew: "我帶住手下衝入去。為咗快啲完成任務。",
    introC: "我帶住C衝入去。",
    introCBad: "我帶住疑惑衝入去。C：「唔好談咁多先！」",
    resolve: "五個人倒下。敵營靜咗。",
    resolveIf: "敵人倒下。意外發現入面有文件📄有Yeesa幅相！？",
    resolveOrg: "敵人倒下。談住調查一下。點知發現入面有文件📄有「⋯加油」字句。",
    resolveGirlCBad: "敵人倒下。見到有文件📄有Yeesa幅相。C：「如果再查落去⋯你會有事⋯」",
    lose: ["你 瞄低咗"],
  },
  {
    id: 5, numeral: "五", title: "中年", subtitle: "槍", weapon: "gun",
    enemyCount: 1, blocksToKill: 1, onlyPerfect: true, blockLabel: "閃",
    windupMs: 580, hitMs: 800, perfectStartMs: 440, perfectEndMs: 660, buttonPx: 66,
    intro: ["中年。手已經冊咁穩。", "組織話要解決無需要出現嘅人。", "我看緊組織名單上面嘅人樣同名⋯"],
    introIf: ["中年。手已經冊咁穩。", "組織話要解決無需要出現嘅人。", "組織名單上面，有 Yeesa⋯⋯！？"],
    resolve: "你過到。但你知，下一次會更短。",
    resolveIf: "中年。有時你會單街口以為見到 Yeesa 個影。行近又唔係。",
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
    resolveIf: "最後一拳揮完，有人單後巷口望住你。你唔肯定係唔係 Yeesa。你只記得自己叫浩然。",
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
  ifOrgBad: false,
  seenHowto: false,
  muted: false,
});

function load() {
  try { return { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") }; }
  catch { return defaultSave(); }
}
function write(s) { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
