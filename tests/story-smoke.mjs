import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("story-data.json", root), "utf8"));
const appSource = await readFile(new URL("app.js", root), "utf8");
const html = await readFile(new URL("index.html", root), "utf8");
const styles = await readFile(new URL("styles.css", root), "utf8");
const visuals = JSON.parse(await readFile(new URL("visual-data.json", root), "utf8"));

assert.equal(data.episodes.length, 10, "游戏必须包含十集");
assert.equal(new Set(data.episodes.map((episode) => episode.id)).size, 10, "章节 ID 必须唯一");
const episodeIds = data.episodes.map((episode) => episode.id);
assert.deepEqual(visuals.scope, episodeIds, "视觉化范围必须覆盖完整十集且顺序一致");
assert.equal(visuals.version, 2, "视觉素材版本必须整体升级，避免浏览器继续使用旧人像或旧背景缓存");

const expectedVisualKeys = new Set();
const payableEpisodeNumbers = new Set(data.initial.payables.map((item) => item.dueEpisode));
for (const episode of data.episodes) {
  for (const option of episode.decision.options) {
    for (const payable of option.effects?.payablesAdd || []) {
      payableEpisodeNumbers.add(payable.dueEpisode);
    }
  }
}
for (const episode of data.episodes) {
  (episode.arrival || []).forEach((_, index) => expectedVisualKeys.add(`${episode.id}.arrival.${index}`));
  episode.opening.forEach((_, index) => expectedVisualKeys.add(`${episode.id}.opening.${index}`));
  (episode.echoes || []).forEach((_, index) => expectedVisualKeys.add(`${episode.id}.echo.${index}`));
  if (payableEpisodeNumbers.has(episode.number)) expectedVisualKeys.add(`${episode.id}.payment`);
  expectedVisualKeys.add(`${episode.id}.inquiry.menu`);
  for (const inquiry of episode.inquiry.options) {
    expectedVisualKeys.add(`${episode.id}.inquiry.${inquiry.id}`);
  }
  expectedVisualKeys.add(`${episode.id}.decision`);
  for (const option of episode.decision.options) {
    expectedVisualKeys.add(`${episode.id}.aftermath.${option.id}`);
  }
  if (episode.bridge) expectedVisualKeys.add(`${episode.id}.bridge`);
}
assert.deepEqual(
  new Set(Object.keys(visuals.scenes)),
  expectedVisualKeys,
  "每个现场、旧决定回声、付款、核实谈话、决定与专属余波都必须有且只有一个视觉映射"
);

const dynamicCharacters = new Set(["$coach", "$captain"]);
const dynamicExpressions = new Set(["$coach_focus"]);
const forbiddenNarrativeKeys = new Set(["body", "title", "speaker", "text", "dialogue", "choice"]);

function validateVisualLayer(scene, key, label = "主画面") {
  assert.ok(visuals.backgrounds[scene.background], `${key}/${label} 引用了不存在的背景`);
  validateCharacterReference(scene.character, scene.expression, key, label);
  validateCharacterReference(
    scene.supportingCharacter,
    scene.supportingExpression,
    key,
    `${label}的同场人物`
  );
  for (const property of Object.keys(scene)) {
    assert.equal(
      forbiddenNarrativeKeys.has(property),
      false,
      `${key}/${label} 不得复制或改写剧情字段 ${property}`
    );
  }
}

function validateCharacterReference(characterId, expression, key, label) {
  if (characterId && !dynamicCharacters.has(characterId)) {
    assert.ok(visuals.characters[characterId], `${key}/${label} 引用了不存在的角色`);
    if (expression && !dynamicExpressions.has(expression)) {
      assert.ok(
        visuals.characters[characterId].expressions[expression],
        `${key}/${label} 引用了不存在的神态`
      );
    }
  }
}

for (const [key, scene] of Object.entries(visuals.scenes)) {
  validateVisualLayer(scene, key);
  for (const [index, beat] of (scene.beats || []).entries()) {
    validateVisualLayer({ ...scene, ...beat }, key, `节拍${index + 1}`);
  }
}
const directedTwoCharacterLayers = Object.values(visuals.scenes).flatMap((scene) => [
  scene,
  ...(scene.beats || []).map((beat) => ({ ...scene, ...beat }))
]).filter((scene) => scene.supportingCharacter);
assert.ok(directedTwoCharacterLayers.length >= 16, "关键冲突场景应使用双人物同场调度");

const visualAssetPaths = [
  ...Object.values(visuals.backgrounds).map((background) => background.src),
  ...Object.values(visuals.characters).flatMap((character) =>
    Object.values(character.expressions)
  )
];
assert.equal(
  new Set(visualAssetPaths).size,
  visualAssetPaths.length,
  "不同背景或人物神态不得复用同一个素材路径"
);
for (const background of Object.values(visuals.backgrounds)) {
  assert.match(background.src, /-v2\.webp$/, `背景必须使用新版缓存路径：${background.src}`);
}
for (const [characterId, character] of Object.entries(visuals.characters)) {
  for (const portrait of Object.values(character.expressions)) {
    assert.match(portrait, /-v2\.webp$/, `人物必须使用新版缓存路径：${portrait}`);
    assert.ok(
      portrait.includes(`/characters/${characterId}/`),
      `${character.name} 的立绘错误引用了其他角色目录：${portrait}`
    );
  }
}
const visualAssetHashes = new Map();
for (const assetPath of visualAssetPaths) {
  await access(new URL(assetPath, root));
  const hash = createHash("sha256")
    .update(await readFile(new URL(assetPath, root)))
    .digest("hex");
  assert.equal(
    visualAssetHashes.has(hash),
    false,
    `${assetPath} 与 ${visualAssetHashes.get(hash)} 的图片内容完全相同`
  );
  visualAssetHashes.set(hash, assetPath);
}

const characterIdByName = new Map(
  Object.entries(visuals.characters).map(([id, character]) => [character.name, id])
);
const expectedCharacterNames = {
  shen: "周绍庭",
  qiao: "方雯",
  he: "韩立锋",
  lin: "梁一川",
  zhao: "罗志衡",
  chen: "程野",
  tang: "许青禾",
  jiang: "孟书宁",
  gu: "高竞"
};
for (const person of data.characters) {
  assert.equal(person.name, expectedCharacterNames[person.id], `${person.id} 的对外姓名未统一`);
  assert.ok(person.role.length >= 2, `${person.name} 缺少可识别的职务`);
  assert.equal("want" in person, false, `${person.name} 的内在欲望不应作为游戏文案明写`);
  assert.equal("fear" in person, false, `${person.name} 的内在恐惧不应作为游戏文案明写`);
  assert.ok(person.habit?.length >= 8, `${person.name} 缺少可观察的习惯动作`);
  assert.ok(person.voice?.length >= 8, `${person.name} 缺少可辨识的说话方式`);
}

function validateSpeakerPortraits(key, scene, label) {
  const visual = visuals.scenes[key];
  if (!visual) return;
  const layers = visual.beats?.length
    ? visual.beats.map((beat) => ({ ...visual, ...beat }))
    : [visual];
  layers.forEach((layer, index) => {
    const speaker = scene.speakers?.[index] || scene.speaker;
    const expectedCharacter = characterIdByName.get(speaker);
    if (!expectedCharacter) return;
    assert.equal(
      layer.character,
      expectedCharacter,
      `${label}第${index + 1}个画面的说话人与主立绘不一致：${speaker}`
    );
  });
}

for (const episode of data.episodes) {
  (episode.arrival || []).forEach((scene, index) => {
    validateSpeakerPortraits(
      `${episode.id}.arrival.${index}`,
      scene,
      `${episode.id}承接场景${index + 1}`
    );
  });
  episode.opening.forEach((scene, index) => {
    validateSpeakerPortraits(
      `${episode.id}.opening.${index}`,
      scene,
      `${episode.id} 开场${index + 1}`
    );
  });
  for (const inquiry of episode.inquiry.options) {
    validateSpeakerPortraits(
      `${episode.id}.inquiry.${inquiry.id}`,
      inquiry,
      `${episode.id}/${inquiry.id}`
    );
  }
  for (const option of episode.decision.options) {
    validateSpeakerPortraits(
      `${episode.id}.aftermath.${option.id}`,
      option.aftermath,
      `${episode.id}/${option.id}余波`
    );
  }
  for (const [index, echo] of (episode.echoes || []).entries()) {
    validateSpeakerPortraits(
      `${episode.id}.echo.${index}`,
      echo,
      `${episode.id}回声${index + 1}`
    );
  }
  if (episode.bridge) {
    validateSpeakerPortraits(`${episode.id}.bridge`, episode.bridge, `${episode.id}章节衔接`);
  }

  const scriptedScenes = [
    ...(episode.arrival || []),
    ...episode.opening,
    ...episode.inquiry.options,
    ...episode.decision.options.map((option) => option.aftermath),
    ...(episode.echoes || []),
    ...(episode.bridge ? [episode.bridge] : [])
  ];
  for (const scene of scriptedScenes) {
    scene.body.forEach((line, index) => {
      const speaker = scene.speakers?.[index] || scene.speaker;
      if (speaker !== "你" && speaker !== "现场") {
        assert.match(line, /^[“‘'"]/, `${episode.id}/${speaker}的台词混入了第三人称旁白`);
      }
      assert.ok(line.length <= 75, `${episode.id}/${speaker}单次对话过长，应拆成多个镜头`);
    });
  }
}

const decisionIds = new Set();
const promiseIds = new Set();

for (const [index, episode] of data.episodes.entries()) {
  assert.equal(episode.number, index + 1, `第 ${index + 1} 集编号不连续`);
  assert.ok(episode.opening.length >= 2, `${episode.id} 缺少冲突现场`);
  assert.ok(episode.arrival?.length >= 1, `${episode.id} 缺少承接上一章的入场场景`);
  assert.ok(episode.route?.length >= 4, `${episode.id} 缺少可预期的本集行程`);
  if (episode.number < 10) assert.ok(episode.bridge?.body?.length >= 2, `${episode.id} 缺少通往下一章的因果桥`);
  assert.equal(episode.inquiry.max, index < 3 ? 1 : 2, `${episode.id} 的互动次数不符合章节设计`);
  assert.equal(episode.inquiry.options.length, 3, `${episode.id} 应提供三条追问线索`);
  assert.equal(episode.decision.options.length, 3, `${episode.id} 应提供三种决定`);
  assert.ok(episode.debrief.length >= 2, `${episode.id} 缺少赛后复盘`);

  for (const question of episode.inquiry.options) {
    assert.ok(question.body.length >= 1, `${episode.id}/${question.id} 没有谈话回复`);
    assert.ok(question.knowledge.length >= 12, `${episode.id}/${question.id} 没有有效事实`);
  }

  for (const option of episode.decision.options) {
    assert.ok(!decisionIds.has(option.id), `决定 ID 重复：${option.id}`);
    decisionIds.add(option.id);
    assert.equal(option.known.length, 2, `${episode.id}/${option.id} 应显示两项已知条件`);
    assert.ok(option.aftermath.body.length >= 2, `${episode.id}/${option.id} 缺少专属余波`);
    assert.equal("hint" in option, false, `${episode.id}/${option.id} 仍含答案式 hint`);
    assert.equal("visibleFinance" in option, false, `${episode.id}/${option.id} 仍提前显示财务答案`);
    assert.equal("priceBasis" in option, false, `${episode.id}/${option.id} 仍含问卷式价格依据`);
    if (index < 3) {
      assert.ok(option.line?.length >= 8, `${episode.id}/${option.id} 缺少玩家真正说出口的话`);
      assert.ok(option.advocate?.length >= 8, `${episode.id}/${option.id} 缺少提出主张的人`);
      assert.ok(option.bet?.length >= 8, `${episode.id}/${option.id} 缺少明确下注`);
      assert.ok(option.burden?.length >= 8, `${episode.id}/${option.id} 缺少代价承担者`);
      assert.ok(option.effects?.causalAdd?.length >= 1, `${episode.id}/${option.id} 没有写入因果账本`);
      assert.ok(option.receipt?.seeded?.length >= 1, `${episode.id}/${option.id} 缺少决定回执`);
    }

    for (const promise of option.effects?.promisesAdd || []) {
      assert.ok(!promiseIds.has(promise.id), `承诺 ID 重复：${promise.id}`);
      promiseIds.add(promise.id);
    }

    for (const group of ["finance", "operations", "pitch", "characters"]) {
      for (const value of Object.values(option.effects?.[group] || {})) {
        assert.ok(Number.isFinite(value), `${episode.id}/${option.id}/${group} 存在无效数值`);
      }
    }
  }
}

assert.deepEqual(
  data.episodes.slice(0, 3).map((episode) => episode.inquiry.mode),
  ["destination", "stress_test", "replay"],
  "前三集必须使用三种不同的戏剧互动，而不是重复问卷"
);
assert.ok(data.episodes.slice(0, 3).every((episode) => episode.inquiry.allowProactive === false), "前三集互动应嵌入现场");
for (const term of ["更衣室", "中卫", "中低位", "高位压迫", "注册", "转会分期"]) {
  assert.ok(data.glossary[term]?.definition, `术语表缺少 ${term}`);
  assert.ok(data.glossary[term]?.why, `术语表没有说明 ${term} 为什么重要`);
}

assert.equal(decisionIds.size, 30, "应有 30 个独立决定");
assert.equal(
  data.episodes.flatMap((episode) => episode.inquiry.options).length,
  30,
  "应有 30 条可追问信息"
);

const episodeText = (id) => JSON.stringify(data.episodes.find((episode) => episode.id === id));
assert.match(episodeText("e2"), /1:4/, "第二集应呈现财务整改期的1:4注册约束");
assert.match(episodeText("e3"), /中低位/, "第三集应说明韩立锋的控制型打法");
assert.match(episodeText("e3"), /高竞.*高位/, "第三集应说明高竞的主动高压打法");
assert.match(episodeText("e5"), /一人一票/, "球迷线应包含会员一人一票的治理机制");
assert.match(episodeText("e5"), /会员大会/, "球迷线应包含联合表决组织");
assert.equal(episodeText("e7").includes("教练刚换过"), false, "未换帅路线不得显示教练已更换");
for (const coachDecision of ["hire_gu", "back_coach", "three_game_review"]) {
  assert.ok(
    data.episodes.find((episode) => episode.id === "e7").echoes.some(
      (echo) => echo.when?.decision?.e6 === coachDecision
    ),
    `第七集缺少 ${coachDecision} 换帅状态回声`
  );
}
assert.match(appSource, /前一线队主教练/, "换帅后人物栏应更新韩立锋身份");
assert.equal(
  appSource.includes("ui.eventSpeaker.textContent = character.name"),
  false,
  "镜头焦点人物不得覆盖剧情原本的说话人"
);
assert.match(appSource, /PROACTIVE_INQUIRY_LIMIT = 4/, "每赛季应提供四次主动了解机会");
assert.match(appSource, /contentRevision: 9/, "旧存档应迁移到多维战力与延迟后果新版");
assert.match(appSource, /migrateSavedCharacterNames\(saved\)/, "旧存档文本应同步替换人物姓名");
assert.match(html, /id="proactiveInquiryBtn"/, "总经理案头应提供主动了解入口");
assert.match(html, /id="focusModeBtn"/, "桌面端应提供剧情聚焦模式");
assert.match(html, /id="visualCharacterSecondary"/, "视觉舞台应支持双人物同场");
assert.match(html, /id="visualBackgroundPrevious"/, "换景应保留上一背景完成交叉溶解");
assert.match(html, /id="eventRole"/, "剧情卡片应在姓名下直接显示人物职务");
assert.match(html, /id="journeyMap"/, "每集应显示地点与叙事行程，避免换场无预告");
assert.match(html, /id="glossaryPanel"/, "页面应提供不离开剧情的足球词语解释");
assert.match(html, /id="forecastValue"/, "财务侧栏应显示已知付款后的现金前景");
assert.match(appSource, /function roleForSpeaker/, "剧情播放器应按说话人解析当前职务");
assert.match(appSource, /function renderRichText/, "正文术语应能直接打开白话解释");
assert.match(appSource, /function renderFinanceCrisis/, "到期现金不足时必须进入可感知的危机现场");
assert.match(appSource, /function buildMatchEvents/, "比赛结果必须展示决定如何进入具体回合");
assert.match(html, /id="strengthRadar"/, "经营侧栏应显示多维战力雷达图");
assert.match(html, /id="strengthTable"/, "经营侧栏应显示直接战力与间接支撑表");
assert.match(html, /id="matchForecast"/, "经营侧栏应公开真实比赛概率");
assert.match(appSource, /const STRENGTH_DIMENSIONS = \[/, "应定义统一的直接战力维度");
assert.match(appSource, /const SUPPORT_DIMENSIONS = \[/, "应定义间接竞技支撑维度");
assert.match(appSource, /function matchModel/, "比赛结果和公开概率应共用同一模型");
assert.match(appSource, /function renderImpactReport/, "每次选择后应显示专属数值反馈画面");
assert.match(appSource, /function processDeferredConsequences/, "旧选择应能跨章节兑现数值影响");
assert.match(appSource, /const DEFERRED_CONSEQUENCES = \{/, "剧情应配置跨章节后果与伏笔");
const deferredSource = appSource.match(/const DEFERRED_CONSEQUENCES = (\{[\s\S]*?\n\});\nconst LEGACY_CHARACTER_NAMES/)?.[1];
assert.ok(deferredSource, "无法读取跨章节后果配置");
const deferredConsequences = Function(`"use strict"; return (${deferredSource});`)();
for (const episode of data.episodes.slice(0, 9)) {
  for (const option of episode.decision.options) {
    const consequence = deferredConsequences[option.id];
    assert.ok(consequence, `${episode.id}/${option.id} 缺少跨章节数值后果`);
    assert.ok(consequence.dueEpisode > episode.number, `${episode.id}/${option.id} 的后果没有延迟到后续章节`);
    assert.ok(consequence.body?.length >= 2, `${episode.id}/${option.id} 缺少后果降临时的剧情场面`);
    assert.ok(consequence.foreshadow?.length >= 20, `${episode.id}/${option.id} 缺少当下伏笔`);
  }
}
assert.match(html, /styles\.css\?v=strength-10/, "多维战力样式必须使用独立缓存版本");
assert.match(html, /app\.js\?v=strength-10/, "多维战力脚本必须使用独立缓存版本");
assert.match(html, /id="startBtn"[^>]*disabled/, "剧情载入前开始按钮必须保持禁用，避免点击后无响应");
assert.match(html, /id="startStatus"/, "开始页必须说明剧情是否已经载入");
assert.match(appSource, /setStartReady\(true,/, "剧情载入完成后必须明确解锁开始按钮");
assert.match(appSource, /function buildStoryBeats/, "剧情播放器应把长段落拆成逐次点击的心理节拍");
assert.match(appSource, /function deriveSeasonEnding/, "赛季结局应由累积选择而非最后一次点击单独决定");
assert.match(html, /rel="preload" as="image"/, "第一幕关键画面应由浏览器优先预载");
assert.match(appSource, /visualAssetCache = new Map/, "视觉播放器应复用已解码素材");
assert.match(appSource, /scheduleEpisodeVisualPreload/, "视觉播放器应按集顺序预取素材");
assert.equal(appSource.includes("function preloadVisuals"), false, "不得在启动时并发预载整季图片");
assert.match(styles, /asset-pending/, "未解码的新人物不得继续显示上一人物像素");
assert.match(styles, /@keyframes background-exit/, "视觉播放器应包含背景退场动画");
assert.match(styles, /@keyframes portrait-exit/, "视觉播放器应包含人物退场动画");
assert.match(styles, /data-atmosphere="rain"/, "视觉播放器应包含雨景环境层");
assert.match(appSource, /state\.phase !== "scenes"/, "主动了解只能在事件推进中发起");

const createProactiveHarness = Function(
  "state",
  "currentEpisode",
  "saveGame",
  "render",
  "scrollToStory",
  `${readFunctionSource("openProactiveInquiry")}
   ${readFunctionSource("selectProactiveInquiry")}
   ${readFunctionSource("closeProactiveInquiry")}
   return { openProactiveInquiry, selectProactiveInquiry, closeProactiveInquiry };`
);
const proactiveState = {
  phase: "scenes",
  phaseBeforeProactive: null,
  activeReply: null,
  proactiveQuestions: {},
  proactiveRemaining: 4,
  questions: {},
  knowledge: []
};
const proactiveHarness = createProactiveHarness(
  proactiveState,
  () => ({ id: "e1", number: 1 }),
  () => {},
  () => {},
  () => {}
);
proactiveHarness.openProactiveInquiry();
assert.equal(proactiveState.phase, "proactive", "应能从事件现场主动发起了解");
proactiveHarness.selectProactiveInquiry({ id: "ask_shen", knowledge: "董事会考核现金与排名。" });
assert.equal(proactiveState.proactiveRemaining, 3, "主动了解应消耗一次赛季机会");
assert.deepEqual(proactiveState.proactiveQuestions.e1, ["ask_shen"], "主动了解应按集记录对象");
proactiveHarness.selectProactiveInquiry({ id: "ask_tang", knowledge: "球迷有共同底线。" });
assert.equal(proactiveState.proactiveRemaining, 3, "同一集不得再次消耗主动了解机会");
proactiveHarness.closeProactiveInquiry();
assert.equal(proactiveState.phase, "scenes", "主动谈话后应回到原来的现场进度");

function readFunctionSource(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `app.js 缺少 ${name} 函数`);
  const bodyStart = appSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`${name} 函数没有结束`);
}

const makeScore = Function(`${readFunctionSource("makeScore")}; return makeScore;`)();
for (const outcome of ["W", "D", "L"]) {
  for (let index = 0; index < 1000; index += 1) {
    const [home, away] = makeScore(outcome).split("-").map(Number);
    if (outcome === "W") assert.ok(home > away, "胜局比分必须主队进球更多");
    if (outcome === "D") assert.equal(home, away, "平局比分必须相等");
    if (outcome === "L") assert.ok(home < away, "负局比分必须主队进球更少");
  }
}

const repairSavedMatchScores = Function(
  `${readFunctionSource("makeScore")}; ${readFunctionSource("repairSavedMatchScores")}; return repairSavedMatchScores;`
)();
const savedWithOldScores = {
  matchReports: [{ games: [
    { outcome: "W", score: "1-1" },
    { outcome: "D", score: "2-1" },
    { outcome: "L", score: "0-0" }
  ] }]
};
repairSavedMatchScores(savedWithOldScores);
assert.deepEqual(
  savedWithOldScores.matchReports[0].games.map((game) => game.score),
  ["2-1", "1-1", "0-1"],
  "旧存档中的矛盾比分应按赛果自动修复"
);

const staticIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
const referencedIds = new Set([...appSource.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]));
for (const id of referencedIds) {
  if (id === "matchContinue") continue;
  assert.ok(staticIds.has(id), `app.js 引用了不存在的元素 #${id}`);
}

for (const forbidden of ["代价与收益", "operationsStats", "pitchStats", "routeTags"]) {
  assert.equal(html.includes(forbidden), false, `页面仍暴露旧问卷元素：${forbidden}`);
}

function add(target, changes = {}) {
  for (const [key, delta] of Object.entries(changes)) {
    target[key] = (target[key] || 0) + delta;
  }
}

function simulateRoute(optionIndex) {
  const state = {
    finance: structuredClone(data.initial.finance),
    operations: structuredClone(data.initial.operations),
    pitch: structuredClone(data.initial.pitch),
    characters: structuredClone(data.initial.characterTrust),
    payables: structuredClone(data.initial.payables),
    paid: new Set(),
    promises: [],
    threads: structuredClone(data.initial.openThreads),
    choices: [],
    financeCrises: 0
  };

  for (const episode of data.episodes) {
    const due = state.payables.filter(
      (payable) => payable.dueEpisode === episode.number && !state.paid.has(payable.id)
    );
    const dueTotal = due.reduce((sum, payable) => sum + payable.amount, 0);
    if (dueTotal > state.finance.cash) {
      state.finance.cash += dueTotal - state.finance.cash + 300;
      state.pitch.squadDepth = Math.max(0, state.pitch.squadDepth - 8);
      state.financeCrises += 1;
    }
    for (const payable of due) {
      state.finance.cash -= payable.amount;
      state.paid.add(payable.id);
    }

    const preferred = episode.decision.options[optionIndex];
    const option = state.finance.cash + (preferred.effects?.finance?.cash || 0) >= 0
      ? preferred
      : episode.decision.options.find(
          (candidate) => state.finance.cash + (candidate.effects?.finance?.cash || 0) >= 0
        );
    assert.ok(option, `${episode.id} 在当前现金下没有任何可执行决定`);
    const effects = option.effects || {};
    add(state.finance, effects.finance);
    add(state.operations, effects.operations);
    add(state.pitch, effects.pitch);
    add(state.characters, effects.characters);
    state.promises.push(...(effects.promisesAdd || []));
    state.payables.push(...(effects.payablesAdd || []));
    state.threads = state.threads.filter(
      (thread) => !(effects.threadsResolve || []).includes(thread.id)
    );
    state.threads.push(...(effects.threadsAdd || []));
    state.choices.push(option.id);
  }

  for (const value of [
    ...Object.values(state.finance),
    ...Object.values(state.operations),
    ...Object.values(state.pitch),
    ...Object.values(state.characters)
  ]) {
    assert.ok(Number.isFinite(value), `路线 ${optionIndex + 1} 结算后存在无效值`);
  }
  assert.equal(state.choices.length, 10, `路线 ${optionIndex + 1} 没有走完十集`);
  assert.ok(state.finance.cash >= 0, `路线 ${optionIndex + 1} 不得静默进入负现金`);
  assert.ok(state.paid.has("autumn_wages"), "秋季付款没有结算");
  assert.ok(state.paid.has("january_installment"), "一月分期没有结算");
  assert.ok(state.paid.has("season_bonus"), "赛季奖金准备金没有结算");
  if (optionIndex === 1) assert.ok(state.paid.has("shareholder_due"), "股东借款没有在第十集结算");
  return state;
}

const routes = [simulateRoute(0), simulateRoute(1), simulateRoute(2)];

console.log(
  JSON.stringify(
    {
      episodes: data.episodes.length,
      inquiries: 30,
      decisions: decisionIds.size,
      routes: routes.map((route, index) => ({
        route: index + 1,
        finalCash: route.finance.cash,
        financeCrises: route.financeCrises,
        promises: route.promises.length,
        openThreads: route.threads.length
      })),
      status: "ok"
    },
    null,
    2
  )
);
