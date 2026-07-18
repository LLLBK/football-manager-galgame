import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("story-data.json", root), "utf8"));
const appSource = await readFile(new URL("app.js", root), "utf8");
const html = await readFile(new URL("index.html", root), "utf8");

assert.equal(data.episodes.length, 10, "游戏必须包含十集");
assert.equal(new Set(data.episodes.map((episode) => episode.id)).size, 10, "章节 ID 必须唯一");

const decisionIds = new Set();
const promiseIds = new Set();

for (const [index, episode] of data.episodes.entries()) {
  assert.equal(episode.number, index + 1, `第 ${index + 1} 集编号不连续`);
  assert.ok(episode.opening.length >= 2, `${episode.id} 缺少冲突现场`);
  assert.equal(episode.inquiry.max, 2, `${episode.id} 应只允许两次追问`);
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

assert.equal(decisionIds.size, 30, "应有 30 个独立决定");
assert.equal(
  data.episodes.flatMap((episode) => episode.inquiry.options).length,
  30,
  "应有 30 条可追问信息"
);

const episodeText = (id) => JSON.stringify(data.episodes.find((episode) => episode.id === id));
assert.match(episodeText("e2"), /1:4/, "第二集应呈现财务整改期的1:4注册约束");
assert.match(episodeText("e3"), /中低位站位/, "第三集应说明贺峥的控制型打法");
assert.match(episodeText("e3"), /顾维.*防线前压/, "第三集应说明顾维的主动高压打法");
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
assert.match(appSource, /前一线队主教练/, "换帅后人物栏应更新贺峥身份");

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
    choices: []
  };

  for (const episode of data.episodes) {
    for (const payable of state.payables) {
      if (payable.dueEpisode === episode.number && !state.paid.has(payable.id)) {
        state.finance.cash -= payable.amount;
        state.paid.add(payable.id);
      }
    }

    const option = episode.decision.options[optionIndex];
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
        promises: route.promises.length,
        openThreads: route.threads.length
      })),
      status: "ok"
    },
    null,
    2
  )
);
