const SAVE_KEY = "lancheng-season-v2";
const FOCUS_MODE_KEY = "lancheng-story-focus";
const PROACTIVE_INQUIRY_LIMIT = 4;
const LEGACY_CHARACTER_NAMES = {
  沈岳: "周绍庭",
  乔岚: "方雯",
  贺峥: "韩立锋",
  林骁: "梁一川",
  赵恺: "罗志衡",
  陈野: "程野",
  唐敏: "许青禾",
  江黎: "孟书宁",
  顾维: "高竞"
};

let gameData = null;
let visualData = null;
let state = null;
let activeVisualPage = null;
let visualRenderEpoch = 0;
let episodePreloadEpoch = 0;
const visualAssetCache = new Map();

const $ = (id) => document.getElementById(id);

const ui = {
  startScreen: $("startScreen"),
  startForm: $("startForm"),
  managerName: $("managerName"),
  teamName: $("teamName"),
  resumeBtn: $("resumeBtn"),
  gameScreen: $("gameScreen"),
  resultScreen: $("resultScreen"),
  restartBtn: $("restartBtn"),
  exportBtn: $("exportBtn"),
  focusModeBtn: $("focusModeBtn"),
  glossaryBtn: $("glossaryBtn"),
  glossaryPanel: $("glossaryPanel"),
  glossaryCloseBtn: $("glossaryCloseBtn"),
  glossaryTitle: $("glossaryTitle"),
  glossaryContent: $("glossaryContent"),
  resultExportBtn: $("resultExportBtn"),
  resultRestartBtn: $("resultRestartBtn"),
  seasonLabel: $("seasonLabel"),
  clubTitle: $("clubTitle"),
  cashValue: $("cashValue"),
  wageValue: $("wageValue"),
  installmentValue: $("installmentValue"),
  restrictedValue: $("restrictedValue"),
  recordValue: $("recordValue"),
  payablesList: $("payablesList"),
  forecastValue: $("forecastValue"),
  runwayStatus: $("runwayStatus"),
  forecastDetail: $("forecastDetail"),
  promiseCount: $("promiseCount"),
  promiseList: $("promiseList"),
  threadCount: $("threadCount"),
  threadList: $("threadList"),
  seasonProgress: $("seasonProgress"),
  stageCounter: $("stageCounter"),
  stageTitle: $("stageTitle"),
  stageMeta: $("stageMeta"),
  episodeStrip: $("episodeStrip"),
  echoArea: $("echoArea"),
  eventCard: $("eventCard"),
  eventNarrative: $("eventNarrative"),
  visualStage: $("visualStage"),
  visualBackground: $("visualBackground"),
  visualBackgroundPrevious: $("visualBackgroundPrevious"),
  visualCharacter: $("visualCharacter"),
  visualCharacterGhost: $("visualCharacterGhost"),
  visualCharacterSecondary: $("visualCharacterSecondary"),
  visualLocation: $("visualLocation"),
  visualEpisodeMark: $("visualEpisodeMark"),
  eventSpeaker: $("eventSpeaker"),
  eventRole: $("eventRole"),
  eventMeta: $("eventMeta"),
  sceneType: $("sceneType"),
  eventTitle: $("eventTitle"),
  eventScene: $("eventScene"),
  knowledgeCard: $("knowledgeCard"),
  eventPrompt: $("eventPrompt"),
  inquiryStatus: $("inquiryStatus"),
  choiceList: $("choiceList"),
  continueBtn: $("continueBtn"),
  feedbackScene: $("feedbackScene"),
  matchReport: $("matchReport"),
  clubDossier: $("clubDossier"),
  proactiveInquiryCount: $("proactiveInquiryCount"),
  proactiveInquiryNote: $("proactiveInquiryNote"),
  proactiveInquiryBtn: $("proactiveInquiryBtn"),
  characterList: $("characterList"),
  historyList: $("historyList"),
  resultTitle: $("resultTitle"),
  resultSubtitle: $("resultSubtitle"),
  verdictTitle: $("verdictTitle"),
  verdictBody: $("verdictBody"),
  finalStats: $("finalStats"),
  epilogueList: $("epilogueList"),
  promiseReview: $("promiseReview"),
  debriefList: $("debriefList")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function migrateSavedCharacterNames(value, key = "") {
  if (typeof value === "string") {
    if (key === "managerName" || key === "clubName") return value;
    return Object.entries(LEGACY_CHARACTER_NAMES).reduce(
      (text, [previousName, currentName]) => text.replaceAll(previousName, currentName),
      value
    );
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = migrateSavedCharacterNames(item);
    });
    return value;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([property, item]) => {
      value[property] = migrateSavedCharacterNames(item, property);
    });
  }
  return value;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value) {
  const sign = value < 0 ? "−" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("zh-CN")}万`;
}

function createInitialState(managerName, clubName) {
  const initial = clone(gameData.initial);
  return {
    version: 2,
    contentRevision: 5,
    managerName,
    clubName,
    currentEpisode: 0,
    phase: "scenes",
    sceneIndex: 0,
    visualBeatKey: null,
    visualBeatIndex: 0,
    activeReply: null,
    questions: {},
    proactiveQuestions: {},
    proactiveRemaining: PROACTIVE_INQUIRY_LIMIT,
    phaseBeforeProactive: null,
    decisions: {},
    finance: initial.finance,
    operations: initial.operations,
    pitch: initial.pitch,
    characterTrust: initial.characterTrust,
    characterStates: Object.fromEntries(
      gameData.characters.map((person) => [person.id, { behavior: "open", memories: [] }])
    ),
    promises: initial.promises,
    openThreads: initial.openThreads,
    payables: initial.payables,
    paidPayables: [],
    paymentNotices: {},
    knowledge: [],
    interactionFinalized: {},
    causalLedger: [],
    seenTerms: [],
    pendingCrisis: null,
    crisisReturnPhase: null,
    financeCrises: [],
    tags: [],
    history: [],
    matchReports: [],
    record: { wins: 0, draws: 0, losses: 0, points: 0, games: 0 },
    minCash: initial.finance.cash,
    completed: false,
    startedAt: new Date().toISOString()
  };
}

function saveGame() {
  if (!state) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function readSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved?.version !== 2) return null;
    saved.proactiveQuestions ||= {};
    saved.proactiveRemaining ??= PROACTIVE_INQUIRY_LIMIT;
    saved.phaseBeforeProactive ??= null;
    saved.characterStates ||= Object.fromEntries(
      gameData.characters.map((person) => [person.id, { behavior: "open", memories: [] }])
    );
    saved.interactionFinalized ||= {};
    saved.causalLedger ||= [];
    saved.seenTerms ||= [];
    saved.pendingCrisis ??= null;
    saved.crisisReturnPhase ??= null;
    saved.financeCrises ||= [];
    saved.pitch.squadDepth ??= 54;
    if ((saved.contentRevision || 0) < 3) {
      const previousMinCash = saved.minCash ?? saved.finance.cash;
      saved.finance.cash -= 600;
      saved.minCash = previousMinCash - 600;
      saved.contentRevision = 3;
    }
    if ((saved.contentRevision || 0) < 4) {
      migrateSavedCharacterNames(saved);
      saved.contentRevision = 4;
    }
    if ((saved.contentRevision || 0) < 5) {
      saved.contentRevision = 5;
    }
    repairSavedMatchScores(saved);
    return saved;
  } catch (error) {
    return null;
  }
}

function repairSavedMatchScores(saved) {
  for (const report of saved.matchReports || []) {
    for (const game of report.games || []) {
      const [home, away] = String(game.score)
        .split("-")
        .map(Number);
      if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
        game.score = makeScore(game.outcome);
      } else if (game.outcome === "W" && home <= away) {
        game.score = `${away + 1}-${away}`;
      } else if (game.outcome === "L" && home >= away) {
        game.score = `${home}-${home + 1}`;
      } else if (game.outcome === "D" && home !== away) {
        const level = Math.min(home, away);
        game.score = `${level}-${level}`;
      }
    }
  }
}

function showScreen(name) {
  ui.startScreen.classList.toggle("hidden", name !== "start");
  ui.gameScreen.classList.toggle("hidden", name !== "game");
  ui.resultScreen.classList.toggle("hidden", name !== "result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentEpisode() {
  return gameData.episodes[state.currentEpisode];
}

function getDecision(episodeId) {
  return state.decisions[episodeId];
}

function matchesCondition(when = {}) {
  if (when.decision) {
    const [episodeId, optionId] = Object.entries(when.decision)[0];
    if (getDecision(episodeId) !== optionId) return false;
  }
  if (when.notDecision) {
    const [episodeId, optionId] = Object.entries(when.notDecision)[0];
    if (getDecision(episodeId) === optionId) return false;
  }
  if (when.tag && !state.tags.includes(when.tag)) return false;
  if (when.promise && !state.promises.some((item) => item.id === when.promise)) return false;
  return true;
}

function processDuePayments(episodeNumber) {
  const due = state.payables.filter(
    (item) => item.dueEpisode === episodeNumber && !state.paidPayables.includes(item.id)
  );
  if (!due.length) return true;

  const total = due.reduce((sum, item) => sum + item.amount, 0);
  if (state.finance.cash < total) {
    state.pendingCrisis = {
      episodeNumber,
      items: clone(due),
      total,
      shortage: total - state.finance.cash
    };
    state.crisisReturnPhase = "scenes";
    state.phase = "financeCrisis";
    return false;
  }

  settleDuePayments(due, episodeNumber);
  return true;
}

function settleDuePayments(due, episodeNumber) {
  due.forEach((item) => {
    state.finance.cash -= item.amount;
    state.paidPayables.push(item.id);
    state.history.push({
      type: "payment",
      episode: episodeNumber,
      title: `支付：${item.text}`,
      detail: formatMoney(item.amount)
    });
  });
  state.minCash = Math.min(state.minCash, state.finance.cash);
  state.paymentNotices[episodeNumber] = due.map((item) => ({
    speaker: "方雯",
    title: `${item.text}今天到期`,
    body: [
      `${formatMoney(item.amount)}已从账户划走。这不是新的选择，而是过去的选择在今天兑现。付款后的可动用现金为${formatMoney(state.finance.cash)}。`
    ],
    kind: "到期付款",
    visualKey: `${currentEpisode().id}.payment`
  }));
}

function financeProjection(extraCash = 0, extraPayables = []) {
  const futurePayables = state.payables
    .filter((item) => !state.paidPayables.includes(item.id))
    .concat(extraPayables || []);
  const committed = futurePayables.reduce((sum, item) => sum + item.amount, 0);
  const projected = state.finance.cash + extraCash - committed;
  let level = "choice";
  let label = "仍有选择空间";
  if (projected < 0) {
    level = "insolvent";
    label = "已知付款将出现缺口";
  } else if (projected < 400) {
    level = "critical";
    label = "临界：新支出必须有补救";
  } else if (projected < 1000) {
    level = "fragile";
    label = "脆弱：一次意外就会出事";
  }
  return { projected, committed, level, label, futurePayables };
}

function dueLabel(item) {
  const episode = gameData.episodes.find((candidate) => candidate.number === item.dueEpisode);
  return episode ? `${episode.date} · ${item.text}` : `赛季后 · ${item.text}`;
}

function getSceneQueue(episode) {
  const echoes = (episode.echoes || [])
    .map((item, index) => ({
      ...item,
      sourceIndex: index,
      kind: "旧决定的回声",
      visualKey: `${episode.id}.echo.${index}`
    }))
    .filter((item) => matchesCondition(item.when))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.sourceIndex - b.sourceIndex)
    .slice(0, episode.echoLimit || 3);
  const notices = state.paymentNotices[episode.number] || [];
  const openings = episode.opening.map((item, index) => ({
    ...resolveSceneVariant(item),
    kind: "现场",
    visualKey: `${episode.id}.opening.${index}`
  }));
  return [openings[0], ...notices, ...echoes, ...openings.slice(1)].filter(Boolean);
}

function resolveSceneVariant(scene) {
  const variant = (scene.variants || []).find((item) => matchesCondition(item.when));
  return variant ? { ...scene, ...variant, variants: undefined, when: undefined } : scene;
}

function beginEpisode(index, { fresh = true } = {}) {
  state.currentEpisode = index;
  const episode = currentEpisode();
  if (fresh) {
    state.phase = "scenes";
    state.sceneIndex = 0;
    state.activeReply = null;
    processDuePayments(episode.number);
  }
  saveGame();
  render();
  scheduleEpisodeVisualPreload(episode.id);
}

function render() {
  if (!state) return;
  renderChrome();
  renderEpisodeHeader();
  renderDossier();
  renderCharacters();
  renderHistory();
  renderPhase();
}

function renderChrome() {
  ui.clubTitle.textContent = state.clubName;
  ui.seasonLabel.textContent = gameData.meta.season;
  ui.cashValue.textContent = formatMoney(state.finance.cash);
  ui.cashValue.classList.toggle("negative", state.finance.cash < 0);
  ui.wageValue.textContent = formatMoney(state.finance.wageCommitment);
  ui.installmentValue.textContent = formatMoney(state.finance.transferInstallments);
  ui.restrictedValue.textContent = formatMoney(state.finance.restrictedCash);
  ui.recordValue.textContent = state.record.games
    ? `${state.record.wins}胜 ${state.record.draws}平 ${state.record.losses}负`
    : "尚未开赛";

  const futurePayables = state.payables
    .filter((item) => !state.paidPayables.includes(item.id))
    .sort((a, b) => a.dueEpisode - b.dueEpisode);
  ui.payablesList.innerHTML = futurePayables.length
    ? futurePayables
        .slice(0, 4)
        .map(
          (item) =>
            `<li><span>${escapeHtml(item.text)}</span><strong>${formatMoney(item.amount)}</strong></li>`
        )
        .join("")
    : '<li class="empty-item">本季已知付款均已处理</li>';

  const projection = financeProjection();
  ui.forecastValue.textContent = formatMoney(projection.projected);
  ui.runwayStatus.textContent = projection.label;
  ui.runwayStatus.dataset.level = projection.level;
  const nextPayable = futurePayables[0];
  ui.forecastDetail.textContent = nextPayable
    ? `下一笔：${dueLabel(nextPayable)}。不把尚未确定的赞助或卖人收入算进来。`
    : "本季已知付款已经处理；未来新合同仍会增加义务。";

  ui.promiseCount.textContent = state.promises.length;
  ui.promiseList.innerHTML = state.promises.length
    ? state.promises
        .slice()
        .reverse()
        .map(
          (promise) => `
            <div class="promise-item">
              <strong>${escapeHtml(promise.text)}</strong>
              <span>对 ${escapeHtml(promise.to)} · ${escapeHtml(promise.due)}</span>
            </div>`
        )
        .join("")
    : '<p class="empty-state">你还没有作出公开承诺。</p>';

  ui.threadCount.textContent = state.openThreads.length;
  ui.threadList.innerHTML = state.openThreads.length
    ? state.openThreads
        .map(
          (thread) => `
            <div class="thread-item">
              <span>${escapeHtml(thread.text)}</span>
              <small>${escapeHtml(thread.due)}</small>
            </div>`
        )
        .join("")
    : '<p class="empty-state">目前没有公开的未决事项。</p>';
}

function renderEpisodeHeader() {
  const episode = currentEpisode();
  const total = gameData.episodes.length;
  ui.stageCounter.textContent = `第${toChineseNumber(episode.number)}集 / 共${toChineseNumber(total)}集`;
  ui.stageTitle.textContent = episode.title;
  ui.stageMeta.textContent = `${episode.date} · ${episode.location}`;
  ui.seasonProgress.style.width = `${((state.currentEpisode + 1) / total) * 100}%`;
  ui.episodeStrip.innerHTML = gameData.episodes
    .map((item, index) => {
      const status = index < state.currentEpisode ? "done" : index === state.currentEpisode ? "current" : "future";
      return `<span class="episode-dot ${status}" title="第${item.number}集：${escapeHtml(item.title)}"><b>${item.number}</b><small>${escapeHtml(item.short)}</small></span>`;
    })
    .join("");
}

function renderDossier() {
  const episode = currentEpisode();
  const selected = state.questions[episode.id] || [];
  const proactiveSelected = state.proactiveQuestions[episode.id] || [];
  const recentKnowledge = state.knowledge.slice(-3);
  const interactionLabels = {
    destination: "最后去见",
    stress_test: "方案压力测试",
    replay: "失败重放"
  };
  const interactionLabel = interactionLabels[episode.inquiry.mode] || "决策前核实";
  const proactiveAllowed = episode.inquiry.allowProactive !== false;
  ui.clubDossier.innerHTML = `
    <dl>
      <div><dt>你的职位</dt><dd>足球运营总经理</dd></div>
      <div><dt>本集时点</dt><dd>${escapeHtml(episode.phase)}</dd></div>
      <div><dt>${interactionLabel}</dt><dd>${selected.length ? "已完成" : "尚未发生"}</dd></div>
      <div><dt>主动了解</dt><dd>${proactiveAllowed ? (proactiveSelected.length ? "本集已使用" : `赛季余 ${state.proactiveRemaining} 次`) : "随现场发生"}</dd></div>
    </dl>
    <div class="known-facts">
      <strong>最近确认的事实</strong>
      ${
        recentKnowledge.length
          ? recentKnowledge.map((item) => `<p>${escapeHtml(item.text)}</p>`).join("")
          : "<p>你还没有把任何人的说法核实为案头信息。</p>"
      }
    </div>`;

  const scenes = getSceneQueue(episode);
  const canUseNow = state.phase === "scenes" && state.sceneIndex >= scenes.length - 1;
  const usedThisEpisode = proactiveSelected.length > 0;
  ui.proactiveInquiryCount.textContent = `${state.proactiveRemaining} / ${PROACTIVE_INQUIRY_LIMIT}`;
  ui.proactiveInquiryBtn.disabled = !proactiveAllowed || !canUseNow || usedThisEpisode || state.proactiveRemaining <= 0;
  ui.proactiveInquiryBtn.textContent = state.phase === "proactive" ? "正在主动了解" : "主动找人了解";
  if (!proactiveAllowed) {
    ui.proactiveInquiryNote.textContent = episode.inquiry.proactiveNote || "这一集的互动发生在现场，不另设主动约谈。";
  } else if (state.phase === "proactive") {
    ui.proactiveInquiryNote.textContent = "这次谈话由你发起；结束后会回到刚才的现场进度。";
  } else if (state.proactiveRemaining <= 0) {
    ui.proactiveInquiryNote.textContent = "本赛季的主动了解机会已经用完。";
  } else if (usedThisEpisode) {
    ui.proactiveInquiryNote.textContent = "本集已经主动找过一人；剩余机会留给之后的赛季节点。";
  } else if (!canUseNow) {
    ui.proactiveInquiryNote.textContent = "先看完当前现场。等事实浮出来后，你才能主动找人谈。";
  } else {
    ui.proactiveInquiryNote.textContent = "现在可主动找一人谈；不占随后两次决策前核实名额。";
  }
}

function relationText(value) {
  if (value >= 72) return "会主动把坏消息先告诉你";
  if (value >= 58) return "愿意直接谈分歧";
  if (value >= 43) return "仍在观察你的下一次决定";
  if (value >= 30) return "开始通过别人向你传话";
  return "不再相信私下承诺";
}

function characterBehaviorText(id) {
  const behavior = state.characterStates?.[id]?.behavior || "open";
  const labels = {
    open: "愿意在坏消息公开前先来找你",
    guarded: "只回答你问到的，不再主动补充",
    oppositional: "仍会说真话，但会组织别人共同施压",
    withdrawn: "不再相信私下谈话，改走正式程序"
  };
  return labels[behavior] || labels.open;
}

function applyCharacterStateEffects(changes = {}) {
  Object.entries(changes).forEach(([id, change]) => {
    state.characterStates[id] ||= { behavior: "open", memories: [] };
    if (change.behavior) state.characterStates[id].behavior = change.behavior;
    const additions = change.memories || (change.memory ? [change.memory] : []);
    additions.forEach((memory) => {
      if (!state.characterStates[id].memories.includes(memory)) {
        state.characterStates[id].memories.push(memory);
      }
    });
  });
}

function addCausalEntries(entries = []) {
  entries.forEach((entry) => {
    const normalized = { ...clone(entry), createdEpisode: currentEpisode()?.number || 0 };
    const duplicate = state.causalLedger.some(
      (item) => item.sourceDecision === normalized.sourceDecision && item.text === normalized.text
    );
    if (!duplicate) state.causalLedger.push(normalized);
  });
}

function displayRoleForCharacter(person) {
  const changedCoach = getDecision("e6") === "hire_gu";
  if (person.id === "he" && changedCoach) return "前一线队主教练";
  if (person.id === "gu" && changedCoach) return "一线队主教练";
  return person.role;
}

function roleForSpeaker(speaker) {
  if (speaker === state.managerName) return "足球运营总经理";
  const person = gameData.characters.find((candidate) => candidate.name === speaker);
  return person ? displayRoleForCharacter(person) : "";
}

function renderCharacters() {
  const episode = currentEpisode();
  const activeIds = new Set();
  const text = JSON.stringify(episode);
  gameData.characters.forEach((person) => {
    if (text.includes(person.name)) activeIds.add(person.id);
  });
  const people = gameData.characters
    .slice()
    .sort((a, b) => Number(activeIds.has(b.id)) - Number(activeIds.has(a.id)))
    .slice(0, 7);

  ui.characterList.innerHTML = people
    .map((person) => {
      const changedCoach = getDecision("e6") === "hire_gu";
      const role = displayRoleForCharacter(person);
      let status = state.characterStates?.[person.id]
        ? characterBehaviorText(person.id)
        : relationText(state.characterTrust[person.id] ?? 50);
      if (person.id === "he" && changedCoach) {
        status = "已经离任，影响仍留在队内";
      }
      if (person.id === "gu" && !changedCoach) status = "仍在俱乐部之外等待机会";
      return `
        <details class="character-item" ${activeIds.has(person.id) ? "open" : ""}>
          <summary><span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(role)}</small></span></summary>
          <p>${escapeHtml(person.bio)}</p>
          ${person.want ? `<p class="character-drive"><strong>他想要：</strong>${escapeHtml(person.want)}</p>` : ""}
          ${person.fear ? `<p class="character-drive"><strong>他害怕：</strong>${escapeHtml(person.fear)}</p>` : ""}
          ${person.habit ? `<p class="character-habit">${escapeHtml(person.habit)}</p>` : ""}
          <em>${escapeHtml(status)}</em>
        </details>`;
    })
    .join("");
}

function renderHistory() {
  const decisions = state.history.filter((item) => item.type === "decision").slice(-6).reverse();
  ui.historyList.innerHTML = decisions.length
    ? decisions
        .map(
          (item) => `
            <div class="history-item">
              <span>第${item.episode}集 · ${escapeHtml(item.episodeTitle)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.detail)}</p>
            </div>`
        )
        .join("")
    : '<p class="empty-state">你的第一个决定尚未作出。</p>';
}

function resetStoryPanels() {
  activeVisualPage = null;
  ui.eventCard.classList.remove("hidden");
  ui.feedbackScene.classList.add("hidden");
  ui.matchReport.classList.add("hidden");
  ui.echoArea.classList.add("hidden");
  ui.knowledgeCard.classList.add("hidden");
  ui.knowledgeCard.innerHTML = "";
  ui.eventPrompt.classList.add("hidden");
  ui.eventPrompt.innerHTML = "";
  ui.inquiryStatus.classList.add("hidden");
  ui.choiceList.innerHTML = "";
  ui.continueBtn.classList.add("hidden");
  ui.continueBtn.onclick = null;
}

function renderPhase() {
  resetStoryPanels();
  switch (state.phase) {
    case "scenes":
      renderScene();
      break;
    case "inquiry":
      renderInquiry();
      break;
    case "proactive":
      renderProactiveInquiry();
      break;
    case "decision":
      renderDecision();
      break;
    case "aftermath":
      renderAftermath();
      break;
    case "match":
      renderMatch();
      break;
    case "financeCrisis":
      renderFinanceCrisis();
      break;
    default:
      renderScene();
  }
}

function renderFinanceCrisis() {
  const crisis = state.pendingCrisis;
  if (!crisis) {
    state.phase = state.crisisReturnPhase || "scenes";
    renderPhase();
    return;
  }
  const itemText = crisis.items.map((item) => `${item.text}${formatMoney(item.amount)}`).join("、");
  setSceneContent(
    {
      speaker: "方雯",
      title: "付款日到了，账户不够",
      body: [
        `今天必须支付${itemText}。账户只有${formatMoney(state.finance.cash)}，还差${formatMoney(crisis.shortage)}。`,
        "方雯没有替你把余额写成负数。她把三份代价不同的处理文件摆在桌上：先决定谁为这个缺口付钱。"
      ],
      kind: "现金危机"
    },
    `${currentEpisode().date} · 到期付款`
  );
  ui.eventPrompt.innerHTML = "<strong>这不是延期显示的数字</strong><span>你的选择会改变所有权、阵容或付款信誉。</span>";
  ui.eventPrompt.classList.remove("hidden");
  const options = [
    {
      id: "bridge_loan",
      label: "接受周绍庭的过桥借款",
      action: `股东补足缺口并多留500万周转；两个月后按20%代价偿还，主席增加对足球预算的否决权。`
    },
    {
      id: "emergency_sale",
      label: "接受被压价的紧急出售",
      action: "立即出售一名轮换球员补足付款；阵容深度下降，买方知道你没有等待更好报价的时间。"
    },
    {
      id: "defer_payment",
      label: "延迟这笔付款",
      action: "把付款推迟到下一集并增加15%；供应商与员工先知道俱乐部失约，方雯会正式记录。"
    }
  ];
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "decision-choice crisis-choice";
    button.innerHTML = `<span class="decision-label">${escapeHtml(option.label)}</span><span class="decision-action">${escapeHtml(option.action)}</span>`;
    button.addEventListener("click", () => resolveFinanceCrisis(option.id));
    ui.choiceList.appendChild(button);
  });
}

function resolveFinanceCrisis(choice) {
  const crisis = state.pendingCrisis;
  if (!crisis) return;
  const record = {
    episode: crisis.episodeNumber,
    choice,
    shortage: crisis.shortage,
    items: crisis.items.map((item) => item.text)
  };

  if (choice === "bridge_loan") {
    const advance = crisis.shortage + 500;
    state.finance.cash += advance;
    state.payables.push({
      id: `bridge_loan_${crisis.episodeNumber}_${state.financeCrises.length}`,
      text: "股东过桥借款及代价",
      amount: Math.round(advance * 1.2),
      dueEpisode: crisis.episodeNumber + 2
    });
    state.operations.boardBacking = clamp(state.operations.boardBacking + 8);
    addCausalEntries([
      { sourceDecision: "finance_crisis_bridge", domain: "ownership", direction: "risk", text: "用股东过桥借款解决付款缺口，主席获得更多预算影响力。", canAffect: ["board_pressure", "future_cash"] }
    ]);
    settleDuePayments(crisis.items, crisis.episodeNumber);
  } else if (choice === "emergency_sale") {
    state.finance.cash += crisis.shortage + 300;
    state.pitch.squadDepth = clamp(state.pitch.squadDepth - 8);
    state.operations.dressingRoom = clamp(state.operations.dressingRoom - 6);
    addCausalEntries([
      { sourceDecision: "finance_crisis_sale", domain: "squadDepth", direction: "risk", text: "现金危机迫使俱乐部低价出售轮换球员，替补深度下降。", canAffect: ["late_match_fatigue", "injury_cover"] }
    ]);
    settleDuePayments(crisis.items, crisis.episodeNumber);
  } else {
    for (const dueItem of crisis.items) {
      const payable = state.payables.find((item) => item.id === dueItem.id);
      if (!payable) continue;
      payable.dueEpisode += 1;
      payable.amount = Math.round(payable.amount * 1.15);
    }
    state.operations.boardBacking = clamp(state.operations.boardBacking - 8);
    state.operations.dressingRoom = clamp(state.operations.dressingRoom - 5);
    applyCharacterStateEffects({
      qiao: { behavior: "oppositional", memories: ["玩家在付款日延迟了已知义务"] }
    });
    addCausalEntries([
      { sourceDecision: "finance_crisis_defer", domain: "paymentTrust", direction: "risk", text: "俱乐部延迟到期付款并承担15%追加成本，付款信誉受损。", canAffect: ["staff_trust", "future_cash"] }
    ]);
  }

  state.financeCrises.push(record);
  state.pendingCrisis = null;
  state.phase = state.crisisReturnPhase || "scenes";
  state.crisisReturnPhase = null;
  state.minCash = Math.min(state.minCash, state.finance.cash);
  saveGame();
  render();
  scrollToStory();
}

function setSceneContent({ speaker, title, body, kind = "现场" }, meta, visualKey = null) {
  ui.eventSpeaker.textContent = speaker;
  const speakerRole = roleForSpeaker(speaker);
  ui.eventRole.textContent = speakerRole;
  ui.eventRole.classList.toggle("hidden", !speakerRole);
  ui.eventMeta.textContent = meta;
  ui.sceneType.textContent = kind;
  ui.eventTitle.textContent = title;
  const visual = getVisualScene(visualKey);
  let visibleBody = body;

  if (visual && body.length) {
    if (state.visualBeatKey !== visualKey) {
      state.visualBeatKey = visualKey;
      state.visualBeatIndex = 0;
    }
    const beatIndex = Math.min(state.visualBeatIndex || 0, body.length - 1);
    const beat = { ...visual, ...(visual.beats?.[beatIndex] || {}) };
    if (renderVisualStage(beat, meta)) {
      visibleBody = [body[beatIndex]];
      activeVisualPage = {
        key: visualKey,
        hasNext: beatIndex < body.length - 1
      };
    } else {
      state.visualBeatKey = null;
      state.visualBeatIndex = 0;
    }
  } else {
    state.visualBeatKey = null;
    state.visualBeatIndex = 0;
    hideVisualStage();
  }

  ui.eventScene.innerHTML = visibleBody
    .map((paragraph) => `<p>${renderRichText(paragraph)}</p>`)
    .join("");
  restartAnimation(ui.eventNarrative, "narrative-enter");
}

function showContinue(label, handler) {
  if (activeVisualPage?.hasNext) {
    ui.continueBtn.textContent = "继续";
    ui.continueBtn.onclick = () => {
      state.visualBeatIndex = (state.visualBeatIndex || 0) + 1;
      saveGame();
      render();
      scrollToStory();
    };
  } else {
    ui.continueBtn.textContent = label;
    ui.continueBtn.onclick = handler;
  }
  ui.continueBtn.classList.remove("hidden");
}

function getVisualScene(key) {
  const episodeId = currentEpisode()?.id;
  if (!key || !visualData?.scope?.includes(episodeId)) return null;
  return visualData?.scenes?.[key] || null;
}

function hideVisualStage() {
  visualRenderEpoch += 1;
  ui.visualStage.classList.add("hidden");
  ui.visualStage.classList.remove("visual-loading", "visual-fallback");
  ui.eventCard.classList.remove("visual-event");
  ui.visualCharacter.classList.add("hidden");
  ui.visualCharacterGhost.classList.add("hidden");
  ui.visualCharacterSecondary.classList.add("hidden");
}

function renderVisualStage(scene, meta) {
  const background = visualData.backgrounds?.[scene.background];
  if (!background) {
    hideVisualStage();
    return false;
  }

  ui.eventCard.classList.add("visual-event");
  ui.visualStage.classList.remove("hidden");
  ui.visualStage.dataset.tone = scene.tone || "story";
  ui.visualStage.dataset.light = resolveVisualLight(scene.background, scene.light);
  ui.visualStage.dataset.atmosphere = resolveVisualAtmosphere(scene.background, scene.atmosphere);
  const renderEpoch = ++visualRenderEpoch;
  updateVisualBackground(background, renderEpoch);
  ui.visualLocation.textContent = meta;
  ui.visualEpisodeMark.textContent = `EPISODE ${currentEpisode().number}`;

  const characterId = resolveVisualCharacterId(scene.character);
  const character = characterId ? visualData.characters?.[characterId] : null;
  const expression = resolveVisualExpression(scene.expression, characterId);
  const portrait = character?.expressions?.[expression];
  const supportingCharacterId = resolveVisualCharacterId(scene.supportingCharacter);
  const supportingCharacter = supportingCharacterId
    ? visualData.characters?.[supportingCharacterId]
    : null;
  const supportingExpression = resolveVisualExpression(
    scene.supportingExpression,
    supportingCharacterId
  );
  const supportingPortrait = supportingCharacter?.expressions?.[supportingExpression];

  if (!portrait) {
    ui.visualCharacterGhost.classList.add("hidden");
    ui.visualCharacter.classList.add("hidden");
    ui.visualCharacter.removeAttribute("src");
  } else {
    const position = resolveVisualPosition(scene.position, characterId, Boolean(supportingPortrait));
    const framing = resolveVisualFraming(scene.framing, scene.motion);
    updatePortrait(ui.visualCharacter, {
      characterId,
      name: character.name,
      expression,
      portrait,
      position,
      framing,
      motion: scene.motion || "focus",
      role: "active",
      renderEpoch
    });
  }

  if (!supportingPortrait) {
    ui.visualCharacterSecondary.classList.add("hidden");
    ui.visualCharacterSecondary.removeAttribute("src");
  } else {
    const supportingPosition = resolveVisualPosition(
      scene.supportingPosition || oppositePosition(scene.position),
      supportingCharacterId,
      true,
      true
    );
    updatePortrait(ui.visualCharacterSecondary, {
      characterId: supportingCharacterId,
      name: supportingCharacter.name,
      expression: supportingExpression,
      portrait: supportingPortrait,
      position: supportingPosition,
      framing: resolveVisualFraming(scene.supportingFraming || "wide"),
      motion: scene.supportingMotion || "enter",
      role: "listening",
      renderEpoch
    });
  }
  return true;
}

function loadVisualAsset(src, priority = "auto") {
  if (!src) return Promise.reject(new Error("视觉素材路径为空"));
  const cached = visualAssetCache.get(src);
  if (cached) {
    if (priority === "high" && cached.image && "fetchPriority" in cached.image) {
      cached.image.fetchPriority = "high";
    }
    return cached.promise;
  }

  const image = new Image();
  image.decoding = "async";
  if ("fetchPriority" in image) image.fetchPriority = priority;
  const record = { image, status: "loading", promise: null };
  record.promise = new Promise((resolve, reject) => {
    image.addEventListener("load", async () => {
      try {
        await image.decode();
      } catch (error) {
        // onload 已确认图片可用；部分浏览器会拒绝重复 decode。
      }
      record.status = "ready";
      resolve(src);
    }, { once: true });
    image.addEventListener("error", () => {
      record.status = "error";
      visualAssetCache.delete(src);
      reject(new Error(`视觉素材载入失败：${src}`));
    }, { once: true });
  });
  visualAssetCache.set(src, record);
  image.src = src;
  return record.promise;
}

function isVisualAssetReady(src) {
  return visualAssetCache.get(src)?.status === "ready";
}

function updateVisualBackground(background, renderEpoch) {
  const element = ui.visualBackground;
  const nextSource = background.src;
  const currentSource = element.getAttribute("src");
  if (currentSource === nextSource && element.complete && element.naturalWidth > 0) {
    element.classList.remove("asset-pending");
    ui.visualStage.classList.remove("visual-loading", "visual-fallback");
    return;
  }

  const canCrossfadeImmediately = isVisualAssetReady(nextSource);
  element.dataset.pendingSrc = nextSource;
  element.classList.add("asset-pending");
  ui.visualStage.classList.add("visual-loading");
  if (!canCrossfadeImmediately && currentSource !== nextSource) {
    element.removeAttribute("src");
    ui.visualBackgroundPrevious.classList.add("hidden");
  }

  loadVisualAsset(nextSource, "high").then(() => {
    if (renderEpoch !== visualRenderEpoch || element.dataset.pendingSrc !== nextSource) return;
    const outgoing = element.getAttribute("src");
    if (outgoing && outgoing !== nextSource) {
      ui.visualBackgroundPrevious.src = outgoing;
      ui.visualBackgroundPrevious.classList.remove("hidden");
      restartAnimation(ui.visualBackgroundPrevious, "background-exit");
    }
    element.alt = background.alt || "剧情背景";
    element.hidden = false;
    element.src = nextSource;
    element.classList.remove("asset-pending");
    ui.visualStage.classList.remove("visual-loading", "visual-fallback");
    restartAnimation(element, "background-enter");
  }).catch(() => {
    if (renderEpoch !== visualRenderEpoch || element.dataset.pendingSrc !== nextSource) return;
    element.removeAttribute("src");
    element.classList.add("asset-pending");
    ui.visualStage.classList.remove("visual-loading");
    ui.visualStage.classList.add("visual-fallback");
  });
}

const defaultCharacterPositions = {
  shen: "left",
  tang: "right",
  he: "left",
  qiao: "right",
  lin: "left",
  zhao: "right",
  chen: "left",
  jiang: "right",
  gu: "left",
  analyst: "right",
  sponsor: "right",
  player: "left"
};

function resolveVisualPosition(position, characterId, hasPartner = false, isSupporting = false) {
  if (position && position !== "auto") return position;
  if (hasPartner) return isSupporting ? "right" : "left";
  return defaultCharacterPositions[characterId] || "center";
}

function oppositePosition(position) {
  if (position === "right") return "left";
  return "right";
}

function resolveVisualFraming(framing, motion = "focus") {
  if (framing) return framing;
  return motion === "tense" ? "close" : "medium";
}

function createPortraitExit(element) {
  const currentPortrait = element.getAttribute("src");
  if (!currentPortrait || element.classList.contains("hidden")) return;
  ui.visualCharacterGhost.src = currentPortrait;
  ui.visualCharacterGhost.className = `visual-character visual-character-ghost position-${element.dataset.position || "center"} framing-${element.dataset.framing || "medium"}`;
  restartAnimation(ui.visualCharacterGhost, "portrait-exit");
}

function updatePortrait(element, descriptor) {
  const currentPortrait = element.getAttribute("src");
  const changed = currentPortrait !== descriptor.portrait;
  const sameCharacter = element.dataset.character === descriptor.characterId;
  const className = `visual-character position-${descriptor.position} framing-${descriptor.framing} is-${descriptor.role}`;
  element.alt = `${descriptor.name}，${descriptor.expression || "当前"}神态`;
  element.dataset.character = descriptor.characterId;
  element.dataset.position = descriptor.position;
  element.dataset.framing = descriptor.framing;

  if (!changed && element.complete && element.naturalWidth > 0) {
    element.className = className;
    restartAnimation(element, "motion-focus");
    return;
  }

  const canSwapImmediately = isVisualAssetReady(descriptor.portrait);
  if (element === ui.visualCharacter && changed && sameCharacter && canSwapImmediately) {
    createPortraitExit(element);
  }
  element.dataset.pendingSrc = descriptor.portrait;
  element.className = `${className} asset-pending`;
  if (!canSwapImmediately) element.removeAttribute("src");

  loadVisualAsset(descriptor.portrait, "high").then(() => {
    if (
      descriptor.renderEpoch !== visualRenderEpoch ||
      element.dataset.pendingSrc !== descriptor.portrait
    ) return;
    element.src = descriptor.portrait;
    element.className = className;
    restartAnimation(element, `motion-${changed ? descriptor.motion : "focus"}`);
  }).catch(() => {
    if (
      descriptor.renderEpoch !== visualRenderEpoch ||
      element.dataset.pendingSrc !== descriptor.portrait
    ) return;
    element.removeAttribute("src");
    element.classList.add("hidden");
  });
}

function visualLayerSources(scene) {
  const sources = [];
  const background = visualData?.backgrounds?.[scene.background]?.src;
  if (background) sources.push(background);
  const characterId = scene.character?.startsWith("$") ? null : scene.character;
  const portrait = characterId
    ? visualData?.characters?.[characterId]?.expressions?.[scene.expression]
    : null;
  if (portrait) sources.push(portrait);
  const supportingId = scene.supportingCharacter?.startsWith("$")
    ? null
    : scene.supportingCharacter;
  const supportingPortrait = supportingId
    ? visualData?.characters?.[supportingId]?.expressions?.[scene.supportingExpression]
    : null;
  if (supportingPortrait) sources.push(supportingPortrait);
  return sources;
}

function collectEpisodeVisualSources(episodeId) {
  const sources = [];
  for (const [key, scene] of Object.entries(visualData?.scenes || {})) {
    if (!key.startsWith(`${episodeId}.`)) continue;
    sources.push(...visualLayerSources(scene));
    for (const beat of scene.beats || []) {
      sources.push(...visualLayerSources({ ...scene, ...beat }));
    }
  }
  return [...new Set(sources)];
}

function scheduleEpisodeVisualPreload(episodeId) {
  if (!visualData || !episodeId) return;
  const preloadEpoch = ++episodePreloadEpoch;
  const sources = collectEpisodeVisualSources(episodeId);
  Promise.resolve().then(async () => {
    for (const src of sources) {
      if (preloadEpoch !== episodePreloadEpoch) return;
      try {
        await loadVisualAsset(src, "low");
      } catch (error) {
        console.warn("视觉素材预取失败。", src);
      }
    }
  });
}

function resolveVisualLight(backgroundId, explicitLight) {
  if (explicitLight) return explicitLight;
  if (/winter|snow|medical/.test(backgroundId)) return "cold";
  if (/night|evening|video_room|sponsor_studio/.test(backgroundId)) return "night";
  if (/morning|finance_office|boardroom/.test(backgroundId)) return "warm";
  return "day";
}

function resolveVisualAtmosphere(backgroundId, explicitAtmosphere) {
  if (explicitAtmosphere) return explicitAtmosphere;
  if (/rain/.test(backgroundId)) return "rain";
  if (/winter|snow/.test(backgroundId)) return "snow";
  if (/sponsor_studio/.test(backgroundId)) return "studio";
  if (/dusk/.test(backgroundId)) return "dusk";
  return "still";
}

function resolveVisualCharacterId(characterId) {
  if (characterId === "$coach") {
    return state.decisions.e6 === "hire_gu" ? "gu" : "he";
  }
  if (characterId === "$captain") {
    return state.decisions.e4 === "sell_captain" ? null : "lin";
  }
  return characterId;
}

function resolveVisualExpression(expression, characterId) {
  if (expression === "$coach_focus") return characterId === "gu" ? "intense" : "focused";
  return expression;
}

function restartAnimation(element, className) {
  element.classList.remove(
    "visual-fade",
    "background-enter",
    "background-exit",
    "portrait-exit",
    "motion-enter",
    "motion-focus",
    "motion-tense",
    "narrative-enter",
    className
  );
  void element.offsetWidth;
  element.classList.add(className);
}

function renderScene() {
  const episode = currentEpisode();
  const scenes = getSceneQueue(episode);
  const scene = scenes[state.sceneIndex] || scenes[0];
  setSceneContent(scene, `${episode.date} · ${episode.location}`, scene.visualKey);
  const last = state.sceneIndex >= scenes.length - 1;
  const interactionLabels = {
    destination: "发布会前，你最后去哪里",
    stress_test: "拆开一份方案的隐藏条件",
    replay: "重放一次可能失败的时刻"
  };
  showContinue(last ? (interactionLabels[episode.inquiry.mode] || "进入决策前核实") : "继续", () => {
    if (last) {
      state.phase = "inquiry";
      state.activeReply = null;
    } else {
      state.sceneIndex += 1;
    }
    saveGame();
    render();
    scrollToStory();
  });
}

function renderInquiry() {
  const episode = currentEpisode();
  const inquiry = episode.inquiry;
  const selected = state.questions[episode.id] || [];
  const proactiveSelected = state.proactiveQuestions[episode.id] || [];
  const allSelected = [...proactiveSelected, ...selected];
  const active = inquiry.options.find((item) => item.id === state.activeReply);

  if (active) {
    const activeKind = inquiry.mode === "destination"
      ? "最后五分钟"
      : inquiry.mode === "stress_test"
        ? "方案压力测试"
        : inquiry.mode === "replay"
          ? "录像重放"
          : "谈话记录";
    setSceneContent(
      { speaker: active.speaker, title: active.title, body: active.body, kind: activeKind },
      `${episode.date} · 只对你说`,
      `${episode.id}.inquiry.${active.id}`
    );
    renderInquiryReceipt(active, "记录在案");
    const reachedMax = selected.length >= inquiry.max;
    showContinue(reachedMax ? "带着这些信息作决定" : "返回，再问一个人", () => {
      state.activeReply = null;
      if (reachedMax) {
        finalizeInteractionConsequences(episode);
        state.phase = "decision";
      }
      saveGame();
      render();
      scrollToStory();
    });
    return;
  }

  const interactionCopy = {
    destination: {
      title: "发布会前只剩五分钟",
      kind: "你最后去哪里"
    },
    stress_test: {
      title: "四个人都已经把最好的一面说完了",
      kind: "拆开隐藏条件"
    },
    replay: {
      title: "把最可能失败的那一刻重放一次",
      kind: "决定允许哪种错误"
    }
  }[inquiry.mode] || {
    title: selected.length || proactiveSelected.length ? "还有谁的话值得在决定前核实？" : "你不可能听到所有人的版本",
    kind: "决策前核实"
  };

  setSceneContent(
    {
      speaker: state.managerName,
      title: interactionCopy.title,
      body: [inquiry.prompt],
      kind: interactionCopy.kind
    },
    `${episode.date} · 决策前`,
    `${episode.id}.inquiry.menu`
  );
  ui.inquiryStatus.textContent = inquiry.statusText
    ? inquiry.statusText.replace("{selected}", selected.length).replace("{max}", inquiry.max)
    : `可以现场核实 ${inquiry.max} 人 · 已核实 ${selected.length} 人${proactiveSelected.length ? ` · 此前主动了解 ${proactiveSelected.length} 人` : ""}`;
  ui.inquiryStatus.classList.remove("hidden");

  inquiry.options
    .filter((item) => !allSelected.includes(item.id))
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inquiry-choice";
      button.innerHTML = `<span>${escapeHtml(inquiry.actionLabel || "核实")}</span><strong>${renderRichText(option.label, false)}</strong>${option.stake ? `<small>${renderRichText(option.stake, false)}</small>` : ""}`;
      button.addEventListener("click", () => selectInquiry(option));
      ui.choiceList.appendChild(button);
    });

  if (selected.length > 0) {
    showContinue(selected.length >= inquiry.max ? "现在作决定" : "不再追问，直接决定", () => {
      finalizeInteractionConsequences(episode);
      state.phase = "decision";
      state.activeReply = null;
      saveGame();
      render();
      scrollToStory();
    });
  }
}

function selectInquiry(option) {
  const episode = currentEpisode();
  const inquiry = episode.inquiry;
  const selected = state.questions[episode.id] || [];
  const proactiveSelected = state.proactiveQuestions[episode.id] || [];
  if (selected.includes(option.id) || proactiveSelected.includes(option.id) || selected.length >= inquiry.max) return;
  state.questions[episode.id] = [...selected, option.id];
  state.activeReply = option.id;
  state.knowledge.push({ episode: episode.number, text: option.knowledge });
  applyCharacterStateEffects(option.characterEffects);
  saveGame();
  render();
  scrollToStory();
}

function finalizeInteractionConsequences(episode) {
  if (state.interactionFinalized[episode.id]) return;
  const selected = new Set([
    ...(state.questions[episode.id] || []),
    ...(state.proactiveQuestions[episode.id] || [])
  ]);
  Object.entries(episode.inquiry.unselectedEffects || {}).forEach(([optionId, effects]) => {
    if (!selected.has(optionId)) applyCharacterStateEffects(effects);
  });
  state.interactionFinalized[episode.id] = true;
}

function openProactiveInquiry() {
  const episode = currentEpisode();
  const alreadyUsed = (state.proactiveQuestions[episode.id] || []).length > 0;
  if (state.phase !== "scenes" || state.proactiveRemaining <= 0 || alreadyUsed) return;
  state.phaseBeforeProactive = state.phase;
  state.phase = "proactive";
  state.activeReply = null;
  saveGame();
  render();
  scrollToStory();
}

function renderProactiveInquiry() {
  const episode = currentEpisode();
  const inquiry = episode.inquiry;
  const proactiveSelected = state.proactiveQuestions[episode.id] || [];
  const selected = state.questions[episode.id] || [];
  const active = inquiry.options.find((item) => item.id === state.activeReply);

  if (active) {
    setSceneContent(
      { speaker: active.speaker, title: active.title, body: active.body, kind: "主动了解" },
      `${episode.date} · 由你发起`,
      `${episode.id}.inquiry.${active.id}`
    );
    renderInquiryReceipt(active, "带回案头的硬信息");
    showContinue("结束谈话，回到现场", closeProactiveInquiry);
    return;
  }

  setSceneContent(
    {
      speaker: state.managerName,
      title: "不等问题被送到桌上",
      body: ["你可以在事件仍在发展时主动找一个人谈。这次了解不占之后的两次现场核实，但本集只能使用一次。"],
      kind: "总经理主动权"
    },
    `${episode.date} · 主动走访`,
    `${episode.id}.inquiry.menu`
  );
  ui.inquiryStatus.textContent = `本赛季还可主动了解 ${state.proactiveRemaining} 次`;
  ui.inquiryStatus.classList.remove("hidden");

  inquiry.options
    .filter((item) => !proactiveSelected.includes(item.id) && !selected.includes(item.id))
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inquiry-choice proactive-choice";
      button.innerHTML = `<span>主动约谈</span><strong>${escapeHtml(option.label)}</strong>`;
      button.addEventListener("click", () => selectProactiveInquiry(option));
      ui.choiceList.appendChild(button);
    });

  showContinue("暂时不找人，回到现场", closeProactiveInquiry);
}

function renderInquiryReceipt(item, label) {
  if (!item.receipt) return;
  ui.knowledgeCard.innerHTML = `<strong>${escapeHtml(label)}</strong><p>${renderRichText(item.receipt)}</p>`;
  ui.knowledgeCard.classList.remove("hidden");
}

function selectProactiveInquiry(option) {
  const episode = currentEpisode();
  const proactiveSelected = state.proactiveQuestions[episode.id] || [];
  const selected = state.questions[episode.id] || [];
  if (state.proactiveRemaining <= 0 || proactiveSelected.length > 0) return;
  if (proactiveSelected.includes(option.id) || selected.includes(option.id)) return;
  state.proactiveQuestions[episode.id] = [option.id];
  state.proactiveRemaining -= 1;
  state.activeReply = option.id;
  state.knowledge.push({ episode: episode.number, text: option.knowledge, source: "proactive" });
  saveGame();
  render();
  scrollToStory();
}

function closeProactiveInquiry() {
  state.phase = state.phaseBeforeProactive || "scenes";
  state.phaseBeforeProactive = null;
  state.activeReply = null;
  saveGame();
  render();
  scrollToStory();
}

function renderDecision() {
  const episode = currentEpisode();
  finalizeInteractionConsequences(episode);
  setSceneContent(
    {
      speaker: state.managerName,
      title: "现在，没有更多信息会替你作决定",
      body: [episode.decision.prompt],
      kind: "不可逆决定"
    },
    `${episode.date} · ${episode.phase}`,
    `${episode.id}.decision`
  );
  ui.eventPrompt.innerHTML = "<strong>你会公开做什么</strong><span>选择后，决定会立即进入任期记录。</span>";
  ui.eventPrompt.classList.remove("hidden");

  episode.decision.options.forEach((option) => {
    const spokenLine = option.line || decisionLine(option.id);
    const cashChange = option.effects?.finance?.cash || 0;
    const addedPayables = option.effects?.payablesAdd || [];
    const projection = financeProjection(cashChange, addedPayables);
    const affordable = state.finance.cash + cashChange >= 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "decision-choice";
    button.disabled = !affordable;
    if (!affordable) button.classList.add("unavailable");
    button.innerHTML = `
      <span class="decision-label">${renderRichText(option.label, false)}</span>
      ${spokenLine ? `<span class="decision-line">“${renderRichText(spokenLine, false)}”</span>` : ""}
      <span class="decision-action">${renderRichText(option.action, false)}</span>
      ${option.advocate ? `<span class="decision-stake"><b>谁在要求</b>${renderRichText(option.advocate, false)}</span>` : ""}
      ${option.bet ? `<span class="decision-stake"><b>你在押注</b>${renderRichText(option.bet, false)}</span>` : ""}
      ${option.burden ? `<span class="decision-stake"><b>最坏情况由谁承担</b>${renderRichText(option.burden, false)}</span>` : ""}
      ${cashChange || addedPayables.length ? `<span class="finance-preview ${projection.level}"><b>签字后的已知现金前景</b>今日现金 ${formatMoney(state.finance.cash + cashChange)} · 已知付款全部兑现后 ${formatMoney(projection.projected)} · ${escapeHtml(projection.label)}</span>` : ""}
      ${!affordable ? `<span class="unavailable-reason">今天的现金不足，除非先找到确定融资。</span>` : ""}
      <span class="known-title">签字前案头信息</span>
      <ul>${option.known.map((item) => `<li>${renderRichText(item, false)}</li>`).join("")}</ul>`;
    button.addEventListener("click", () => chooseDecision(option));
    ui.choiceList.appendChild(button);
  });
}

function applyNumericEffects(target, changes = {}) {
  Object.entries(changes).forEach(([key, delta]) => {
    target[key] = (target[key] || 0) + delta;
  });
}

function chooseDecision(option) {
  const episode = currentEpisode();
  if (state.decisions[episode.id]) return;
  const effects = option.effects || {};

  applyNumericEffects(state.finance, effects.finance);
  applyNumericEffects(state.operations, effects.operations);
  applyNumericEffects(state.pitch, effects.pitch);
  Object.keys(state.operations).forEach((key) => {
    state.operations[key] = clamp(state.operations[key]);
  });
  Object.keys(state.pitch).forEach((key) => {
    state.pitch[key] = clamp(state.pitch[key]);
  });
  Object.entries(effects.characters || {}).forEach(([id, delta]) => {
    state.characterTrust[id] = clamp((state.characterTrust[id] || 50) + delta);
  });
  applyCharacterStateEffects(effects.characterStates);
  addCausalEntries(effects.causalAdd);

  (effects.promisesAdd || []).forEach((item) => {
    if (!state.promises.some((promise) => promise.id === item.id)) state.promises.push(clone(item));
  });
  (effects.promisesResolve || []).forEach((id) => {
    state.promises = state.promises.filter((item) => item.id !== id);
  });
  (effects.threadsResolve || []).forEach((id) => {
    state.openThreads = state.openThreads.filter((item) => item.id !== id);
  });
  (effects.threadsAdd || []).forEach((item) => {
    if (!state.openThreads.some((thread) => thread.id === item.id)) state.openThreads.push(clone(item));
  });
  (effects.payablesAdd || []).forEach((item) => {
    if (!state.payables.some((payable) => payable.id === item.id)) state.payables.push(clone(item));
  });
  (effects.tagsAdd || []).forEach((tag) => {
    if (!state.tags.includes(tag)) state.tags.push(tag);
  });

  state.decisions[episode.id] = option.id;
  state.history.push({
    type: "decision",
    episode: episode.number,
    episodeTitle: episode.title,
    optionId: option.id,
    title: option.label,
    detail: option.action
  });
  state.minCash = Math.min(state.minCash, state.finance.cash);
  state.phase = "aftermath";
  saveGame();
  render();
  scrollToStory();
}

function selectedOption(episode) {
  const optionId = state.decisions[episode.id];
  return episode.decision.options.find((item) => item.id === optionId);
}

function renderAftermath() {
  const episode = currentEpisode();
  const option = selectedOption(episode);
  if (!option) {
    state.phase = "decision";
    renderDecision();
    return;
  }

  setSceneContent(
    { ...option.aftermath, kind: "决定后的现场" },
    `${episode.date} · 决定已无法撤回`,
    `${episode.id}.aftermath.${option.id}`
  );
  const addedPromises = option.effects?.promisesAdd || [];
  const spokenLine = option.line || decisionLine(option.id);
  ui.feedbackScene.innerHTML = `
    <p class="eyebrow">记录在案</p>
    <h3>${escapeHtml(option.label)}</h3>
    ${spokenLine ? `<blockquote>“${escapeHtml(spokenLine)}”</blockquote>` : ""}
    <p>${escapeHtml(option.action)}</p>
    ${
      addedPromises.length
        ? `<div class="receipt-promises"><strong>你因此说过</strong>${addedPromises
            .map((item) => `<span>“${escapeHtml(item.text)}”</span>`)
            .join("")}</div>`
        : ""
    }
    ${renderConsequenceReceipt(option)}`;
  ui.feedbackScene.classList.remove("hidden");
  showContinue(episode.match ? "看看比赛如何回应" : episode.number === 10 ? "结束这个赛季" : "进入下一集", () => {
    if (episode.match) {
      state.phase = "match";
      ensureMatchReport(episode);
      saveGame();
      render();
      scrollToStory();
    } else {
      advanceEpisode();
    }
  });
}

function renderConsequenceReceipt(option) {
  const receipt = option.receipt;
  if (!receipt) return "";
  const sections = [
    ["已经发生", receipt.happened],
    ["已经答应", receipt.promised],
    ["已经埋下", receipt.seeded],
    ["谁改变了做法", receipt.people]
  ].filter(([, items]) => items?.length);
  if (!sections.length) return "";
  return `<div class="consequence-receipt">${sections.map(([label, items]) => `
    <section><strong>${label}</strong>${items.map((item) => `<p>${renderRichText(item)}</p>`).join("")}</section>
  `).join("")}</div>`;
}

function decisionLine(optionId) {
  const lines = {
    sell_captain: "把报价交给梁一川。新闻稿不许写‘双方共同决定’。",
    renew_captain: "两年，不保首发。角色要变，先由我们当面告诉他。",
    last_dance: "踢完这季。一月第一周，我亲自来找你。",
    medical_veto: "孟书宁签不了可出场，他就不上。比分由我来解释。",
    informed_choice: "先把奖金和位置从这个问题里拿走，再问他一次。",
    play_and_shoot: "把风险逐条写清。他若仍然要踢，我批准。",
    institutionalize: "我留下。但今年站在门外的人，明年要有椅子。",
    personal_project: "给我三年和最终决定权。结果只找我。",
    leave_record: "我不续约。交接文件从没兑现的承诺开始写。"
  };
  return lines[optionId] || "";
}

function ensureMatchReport(episode) {
  if (state.matchReports.some((item) => item.episodeId === episode.id)) return;
  const config = episode.match;
  const count = episode.id === "e6" ? 6 : episode.id === "e9" ? 5 : 1;
  const competitive = episode.id !== "e3";
  const games = [];

  for (let index = 0; index < count; index += 1) {
    const attackEdge = (state.pitch.attack - config.difficulty) * 0.27;
    const defenseEdge = (state.pitch.defense - config.difficulty) * 0.29;
    const lateGame =
      (state.pitch.fitness - 50) * 0.14 +
      ((state.pitch.squadDepth ?? 50) - 50) * 0.12;
    const collective =
      (state.pitch.cohesion - 50) * 0.13 +
      (state.pitch.morale - 50) * 0.08;
    const execution =
      (state.operations.coachAuthority - 50) * 0.06 +
      (state.operations.dressingRoom - 50) * 0.05;
    const performance = attackEdge + defenseEdge + lateGame + collective + execution + randomBetween(-8, 8);
    let outcome = "D";
    if (performance > 5) outcome = "W";
    if (performance < -5) outcome = "L";
    const score = makeScore(outcome);
    games.push({
      outcome,
      score,
      shape: {
        attack: attackEdge,
        defense: defenseEdge,
        lateGame,
        collective,
        execution
      }
    });

    if (competitive) {
      state.record.games += 1;
      if (outcome === "W") {
        state.record.wins += 1;
        state.record.points += 3;
        state.pitch.morale = clamp(state.pitch.morale + 2);
      } else if (outcome === "D") {
        state.record.draws += 1;
        state.record.points += 1;
      } else {
        state.record.losses += 1;
        state.pitch.morale = clamp(state.pitch.morale - 2);
      }
    }
  }

  state.matchReports.push({
    episodeId: episode.id,
    episode: episode.number,
    label: config.label,
    opponent: config.opponent,
    stakes: config.stakes,
    competitive,
    games,
    events: buildMatchEvents(episode),
    voices: buildMatchVoices(episode),
    causalSummary: buildCausalSummary()
  });
}

function buildMatchEvents(episode) {
  const events = [];
  const budget = getDecision("e2");
  const tactic = getDecision("e3");

  if (budget === "first_team_push") {
    events.push({ minute: 18, tone: "help", text: "新中卫抢在海港城前锋之前顶走传中。", source: "第二集：把钱换成即战力", note: "首发防守的确因此更稳定。" });
    events.push({ minute: 71, tone: "risk", text: "右后卫抽筋，替补席没有同位置球员，梁一川临时回撤。", source: "第二集：清理两名多位置球员", note: "为注册新援付出的阵容深度代价在后半场出现。" });
  } else if (budget === "liquidity_first") {
    events.push({ minute: 34, tone: "risk", text: "中卫被对手带到边路，梁一川退回禁区补位，程野独自留在前场。", source: "第二集：没有补进主力中卫", note: "现金被保住了，夏训计划却必须在场上补洞。" });
    events.push({ minute: 66, tone: "help", text: "替补席仍有完整位置选择，教练连续换上两名体能充足的球员。", source: "第二集：没有清理边缘合同", note: "没有新援，也意味着轮换深度没有被进一步削薄。" });
  } else if (budget === "build_capacity") {
    events.push({ minute: 63, tone: "help", text: "康复团队赛前标出的边后卫体能预警生效，教练在抽筋前完成换人。", source: "第二集：投资康复与数据团队", note: "专业能力没有直接进球，却阻止一次可预见的失控。" });
    events.push({ minute: 28, tone: "risk", text: "现有中卫在大空间里转身较慢，对手获得一次直接射门。", source: "第二集：短期阵容没有补强", note: "更好的信息不能替代缺少的球员。" });
  }

  if (tactic === "back_he") {
    events.push({ minute: 42, tone: "help", text: "两条防线保持距离，对手连续横传后只能远射。", source: "第三集：完整支持控制型足球", note: "中低位的稳定距离限制了直接机会。" });
    events.push({ minute: 79, tone: "risk", text: "岚城联需要进球，连续三次横传却没有人提前进入禁区。", source: "第三集：控制型足球的进攻上限", note: "球队把比赛留到最后，也缺少主动抬速的办法。" });
  } else if (tactic === "pressing_identity") {
    events.push({ minute: 23, tone: "help", text: "程野在前场逼出回传，队友抢断后完成近距离射门。", source: "第三集：主动压迫", note: "前场夺回球权直接变成一次机会。" });
    events.push({ minute: 76, tone: "risk", text: "压迫慢了半步，对手一脚传到防线身后。", source: "第三集：高位压迫的身后风险", note: (state.pitch.squadDepth ?? 50) < 50 ? "替补变薄让强度更早下降。" : "这是主动站位必须承认的空间代价。" });
  } else if (tactic === "shared_principles") {
    events.push({ minute: 70, tone: "help", text: "球队落后后整条中场同时前移十米，第一次形成连续围抢。", source: "第三集：三条共同原则", note: "球员知道何时可以一起改变风险。" });
    events.push({ minute: 52, tone: "risk", text: "边后卫向前前先看了一眼教练席，反击窗口随犹豫消失。", source: "第三集：共同原则的边界", note: "适应性需要持续沟通，不能靠一张纸自动完成。" });
  }

  const randomEvents = [
    { minute: 84, tone: "random", text: "突然加大的雨让门将第一次扑救脱手。", source: "不可控：天气", note: "经营可以改变球队如何应对，不能取消偶然。" },
    { minute: 58, tone: "random", text: "海港城门将完成一次超出正常范围的近距离扑救。", source: "不可控：对手发挥", note: "正确制造机会也不保证每一次都进球。" },
    { minute: 37, tone: "random", text: "一次折射让原本偏出的射门突然改变方向。", source: "不可控：折射", note: "比分包含无法预先经营掉的部分。" }
  ];
  events.push(clone(randomEvents[Math.floor(Math.random() * randomEvents.length)]));
  return events.sort((a, b) => a.minute - b.minute);
}

function buildMatchVoices() {
  const tactic = getDecision("e3");
  const budget = getDecision("e2");
  const coach = tactic === "back_he"
    ? "韩立锋：‘距离没有散。若你要问为什么机会少，这也是我方案的账。’"
    : tactic === "pressing_identity"
      ? "韩立锋：‘前场确实抢到了球。后半场跑不动，也请把六周和替补人数一起写。’"
      : "梁一川：‘大家知道七十分钟后能一起往前。下一次输球，别临时加第四条。’";
  const finance = budget === "first_team_push"
    ? "方雯：‘新中卫今天帮了球队；一月后只剩100万也没有因此消失。’"
    : budget === "liquidity_first"
      ? "方雯：‘现金安全垫还在。没买的人在场上留下的空位，也要由我们承认。’"
      : "孟书宁：‘提前换人不会出现在比分里，但那条腿明天还能正常训练。’";
  return [coach, finance];
}

function buildCausalSummary() {
  const relevant = state.causalLedger.filter((item) =>
    ["tactic", "defense", "squadDepth", "fitness", "pressure", "authority", "sharedProcess"].includes(item.domain)
  );
  const helpful = relevant.filter((item) => item.direction === "help" || item.direction === "mixed").slice(-2);
  const risks = relevant.filter((item) => item.direction === "risk").slice(-1);
  return { helpful, risks };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function makeScore(outcome) {
  if (outcome === "W") {
    const away = Math.floor(Math.random() * 3);
    return `${away + 1 + Math.floor(Math.random() * 3)}-${away}`;
  }
  if (outcome === "L") {
    const home = Math.floor(Math.random() * 3);
    return `${home}-${home + 1 + Math.floor(Math.random() * 3)}`;
  }
  const value = Math.floor(Math.random() * 3);
  return `${value}-${value}`;
}

function renderMatch() {
  const episode = currentEpisode();
  const report = state.matchReports.find((item) => item.episodeId === episode.id);
  const wins = report.games.filter((game) => game.outcome === "W").length;
  const draws = report.games.filter((game) => game.outcome === "D").length;
  const losses = report.games.filter((game) => game.outcome === "L").length;
  const summary = report.competitive
    ? `${wins}胜 ${draws}平 ${losses}负`
    : report.games[0].outcome === "W"
      ? "取胜"
      : report.games[0].outcome === "D"
        ? "战平"
        : "失利";

  ui.eventCard.classList.add("hidden");
  ui.feedbackScene.classList.add("hidden");
  ui.matchReport.innerHTML = `
    <p class="eyebrow">MATCH DAYS</p>
    <div class="match-headline">
      <div><span>${escapeHtml(report.label)}</span><h2>${summary}</h2></div>
      <strong>${escapeHtml(report.opponent)}</strong>
    </div>
    <p class="match-stakes">${escapeHtml(report.stakes)}</p>
    <div class="score-strip">
      ${report.games
        .map(
          (game, index) => `<div class="score ${game.outcome.toLowerCase()}"><span>${report.games.length > 1 ? `第${index + 1}场` : "比分"}</span><strong>${game.score}</strong></div>`
        )
        .join("")}
    </div>
    ${report.events?.length ? `<section class="match-timeline"><h3>比赛怎样走到这个比分</h3>${report.events.map((event) => `
      <article class="match-event ${event.tone}">
        <time>${event.minute}'</time>
        <div><strong>${renderRichText(event.text)}</strong><span>${renderRichText(event.source)}</span><p>${renderRichText(event.note)}</p></div>
      </article>`).join("")}</section>` : ""}
    ${report.causalSummary ? `<section class="match-causes"><h3>你的旧决定仍在起作用</h3>
      ${report.causalSummary.helpful.map((item) => `<p class="help">${renderRichText(item.text)}</p>`).join("")}
      ${report.causalSummary.risks.map((item) => `<p class="risk">${renderRichText(item.text)}</p>`).join("")}
    </section>` : ""}
    ${report.voices?.length ? `<section class="match-voices"><h3>同一场比赛，两种真实解释</h3>${report.voices.map((voice) => `<blockquote>${renderRichText(voice)}</blockquote>`).join("")}</section>` : ""}
    <p class="match-note">你的经营改变了球队以什么方式创造机会、暴露风险和应对意外；天气、折射和对手发挥仍会改变比分。</p>
    <button id="matchContinue" class="primary-btn" type="button">${episode.number === 10 ? "查看赛季结局" : "进入下一集"}</button>`;
  ui.matchReport.classList.remove("hidden");
  $("matchContinue").addEventListener("click", advanceEpisode);
}

function advanceEpisode() {
  const next = state.currentEpisode + 1;
  if (next >= gameData.episodes.length) {
    finishSeason();
    return;
  }
  beginEpisode(next, { fresh: true });
  scrollToStory();
}

function projectedPosition() {
  const ppg = state.record.games ? state.record.points / state.record.games : 1.35;
  const pitchValues = Object.values(state.pitch);
  const teamBase = pitchValues.reduce((sum, value) => sum + value, 0) / pitchValues.length;
  const organization =
    (state.operations.dressingRoom + state.operations.coachAuthority + state.operations.medicalIntegrity) / 3;
  const score = ppg * 32 + (teamBase - 50) * 0.55 + (organization - 50) * 0.18;
  if (score >= 68) return 4;
  if (score >= 61) return 6;
  if (score >= 55) return 8;
  if (score >= 49) return 10;
  if (score >= 43) return 13;
  if (score >= 37) return 15;
  return 17;
}

function finishSeason() {
  state.completed = true;
  state.finishedAt = new Date().toISOString();
  saveGame();
  renderResult();
  showScreen("result");
}

function renderResult() {
  const position = projectedPosition();
  const finalChoice = getDecision("e10");
  ui.resultTitle.textContent = `${state.clubName}的一季结束了`;
  ui.resultSubtitle.textContent = `${state.managerName}的任期记录 · ${gameData.meta.season}`;

  if (position <= 6) {
    ui.verdictTitle.textContent = `第${position}名：目标实现，代价没有因此消失`;
  } else if (position <= 10) {
    ui.verdictTitle.textContent = `第${position}名：没有奇迹，也不是一句失败能够概括`;
  } else {
    ui.verdictTitle.textContent = `第${position}名：球队活了下来，信任却需要更长时间修复`;
  }

  const financeSentence = state.finance.cash >= 1000
    ? `俱乐部以${formatMoney(state.finance.cash)}现金结束赛季，仍有选择空间。`
    : state.finance.cash >= 0
      ? `俱乐部没有欠付现金，但只剩${formatMoney(state.finance.cash)}，任何意外都会成为夏窗问题。`
      : `俱乐部现金为${formatMoney(state.finance.cash)}，下一季开始前必须融资或出售资产。`;
  const culture = state.operations.dressingRoom >= 60
    ? "更衣室仍愿意共同承担错误。"
    : state.operations.dressingRoom >= 45
      ? "更衣室没有瓦解，但人们会先确认风险由谁承担。"
      : "更衣室已经学会先保护自己，再听管理层解释。";
  ui.verdictBody.innerHTML = `<p>${financeSentence}</p><p>${culture} 排名记录了结果，却没有替这些关系作最终判决。</p>`;

  ui.finalStats.innerHTML = `
    <div><span>联赛最终推定</span><strong>第${position}名</strong></div>
    <div><span>关键赛程记录</span><strong>${state.record.wins}胜 ${state.record.draws}平 ${state.record.losses}负</strong></div>
    <div><span>期末现金</span><strong>${formatMoney(state.finance.cash)}</strong></div>
    <div><span>未来工资承诺</span><strong>${formatMoney(state.finance.wageCommitment)}</strong></div>`;

  const epilogues = buildEpilogues(finalChoice);
  ui.epilogueList.innerHTML = epilogues
    .map((item) => `<article><span>${escapeHtml(item.who)}</span><p>${escapeHtml(item.text)}</p></article>`)
    .join("");

  const promiseResults = state.promises.map((promise) => ({
    ...promise,
    result: evaluatePromise(promise.id, position)
  }));
  ui.promiseReview.innerHTML = promiseResults.length
    ? promiseResults
        .map(
          (item) => `
            <div class="promise-result ${item.result.status}">
              <span>${item.result.label}</span>
              <strong>${escapeHtml(item.text)}</strong>
              <p>${escapeHtml(item.result.note)}</p>
            </div>`
        )
        .join("")
    : '<p class="empty-state">没有可结算的明确承诺。</p>';

  ui.debriefList.innerHTML = gameData.episodes
    .map(
      (episode) => `
        <details>
          <summary><span>第${episode.number}集</span><strong>${escapeHtml(episode.title)}</strong></summary>
          ${episode.debrief.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </details>`
    )
    .join("");
}

function buildEpilogues(finalChoice) {
  const result = [];

  const summerBudget = getDecision("e2");
  if (summerBudget === "liquidity_first") {
    result.push({ who: "夏天的三只文件夹", text: "青训宿舍住进了第一批孩子。一线队整季都缺那名中卫，但一月的付款日没有变成紧急董事会。" });
  } else if (summerBudget === "first_team_push") {
    result.push({ who: "夏天的三只文件夹", text: "新中卫完成了一个主力赛季，他的下一笔分期也已写进夏窗首日。那两个被清走的柜子没有在账面上回来。" });
  } else {
    result.push({ who: "夏天的三只文件夹", text: "医疗与数据团队不能直接进球，却让两次坏消息提前到了桌上。下赛季要不要继续为这种‘没出事’付钱，仍在预算会里。" });
  }

  const footballModel = getDecision("e3");
  if (footballModel === "back_he") {
    result.push({ who: "训练场", text: "中低位的三条横线还留在战术板上。球队知道哪种错误可以犯，也知道落后时仍然缺少自己抬高速度的办法。" });
  } else if (footballModel === "pressing_identity") {
    result.push({ who: "训练场", text: "U19和一线队继续使用同一套压迫词汇。六周保护期过去后，俱乐部仍要回答：下一次连输时，还允不允许这种错误。" });
  } else {
    result.push({ who: "训练场", text: "那三条共同原则被重新打印了一次。它们没有消除教练与管理层的分歧，却让下一次分歧不必从零开始。" });
  }
  const captain = getDecision("e4");
  if (captain === "sell_captain") {
    result.push({ who: "梁一川", text: "他在江东完成了一个稳定赛季。岚城更衣室最终选出新队长，但那只袖标花了几个月才停止像借来的。" });
  } else if (captain === "renew_captain") {
    result.push({ who: "梁一川", text: "他接受轮换，也在最困难的几周替年轻人说话。续约没有冻结时间，却让交接可以不以羞辱开始。" });
  } else {
    result.push({ who: "梁一川", text: "最后一轮后，他独自在东看台坐到清场。是否续约仍未完全决定，但俱乐部不能再假装冬天的谈话没有到期。" });
  }

  const stand = getDecision("e5");
  if (stand === "full_naming") {
    result.push({ who: "东看台", text: "工程完成，漏雨停止，黑金标识覆盖了大部分旧墙。球迷仍进场，但87%反对改名的公投结果与第十二分钟的沉默一起，成了每个主场固定的提醒。" });
  } else if (stand === "hybrid_naming") {
    result.push({ who: "东看台", text: "联合名称仍常被念错，合同也仍需争执执行。可壁画、低价票和商业标识第一次被迫在同一画面里相处，每季的企业票数量也必须向会员报告。" });
  } else {
    result.push({ who: "东看台", text: "会员债券没有轻松解决钱，却让六个季票区联合选出了看台事务董事。出钱多的人没有多一票，看台也不再只是一项待处置资产。" });
  }

  const coach = getDecision("e6");
  if (coach === "hire_gu") {
    result.push({ who: "主教练", text: "高竞带来了可见改变，也带来新的预算要求。韩立锋的离开没有证明换帅错误，只证明一段关系已经无法回到七月。" });
  } else if (coach === "back_coach") {
    result.push({ who: "主教练", text: "韩立锋执教到最后一天。无论排名是否漂亮，球员知道管理层曾在最容易甩锅时用第一人称承担了决定。" });
  } else {
    result.push({ who: "主教练", text: "三场期限结束后，所有人仍习惯数下一次倒计时。制度完成了评估，却没能完全收回它制造的生存感。" });
  }

  const youth = getDecision("e8");
  if (youth === "sell_chen") {
    result.push({ who: "程野", text: "他在租借队得到连续首发。岚城拥有回购条款，但是否还拥有一条真正的青训路径，要等下一名孩子来验证。" });
  } else {
    result.push({ who: "程野", text: "他不再只是海报上的未来。失误、替补和有限出场终于组成一条可理解的成长路径。" });
  }

  const medical = getDecision("e7");
  if (medical === "medical_veto") {
    result.push({ who: "诊疗室", text: "门内侧的否决规则没有被撕掉。球员报告小伤的时间提前了，主教练仍然不喜欢在比赛日收到它。" });
  } else if (medical === "informed_choice") {
    result.push({ who: "诊疗室", text: "奖金与位置保护被写进新模板。那名球员仍说不准自己在0比1落后时能不能真正说不。" });
  } else {
    result.push({ who: "诊疗室", text: "那份知情书仍夹在病历里。人们不再争论它是否合法，但球员在诊疗室里的回答比以前更短。" });
  }

  const runIn = getDecision("e9");
  if (runIn === "bonus_push") {
    result.push({ who: "最后五场", text: "奖金名单上有装备管理员的名字。无论最终名次如何，那五场都被每个人清楚地换算过价格。" });
  } else if (runIn === "quiet_process") {
    result.push({ who: "最后五场", text: "记者后来不再期待你给出新标题。球队输赢都用同一张复盘表，它很无聊，也因此终于有用。" });
  } else {
    result.push({ who: "最后五场", text: "1987年的十二名队员重新出现在年度会员报告里，不再只是商业活动的背景。下赛季的赞助版位仍会继续争执。" });
  }

  if (finalChoice === "institutionalize") {
    result.push({ who: "俱乐部", text: "新赛季的第一场会议多了几把椅子。你的权力变小了一点，坏消息抵达桌面的路却短了一点。" });
  } else if (finalChoice === "personal_project") {
    result.push({ who: "俱乐部", text: "预算与期待一起增加。岚城联更像你的球队，也更容易在你判断错误时没有第二种语言。" });
  } else {
    result.push({ who: "俱乐部", text: "继任者收到一份不讨好的交接记录。离开没有保证承诺被履行，却让遗忘变得更困难。" });
  }
  return result;
}

function evaluatePromise(id, position) {
  const kept = (note) => ({ status: "kept", label: "已兑现", note });
  const broken = (note) => ({ status: "broken", label: "已失信", note });
  const open = (note) => ({ status: "open", label: "仍未到期", note });
  const checks = {
    top_six: () => position <= 6 ? kept("最终排名进入前六。") : broken(`最终为第${position}名，公开目标没有实现。`),
    cash_floor: () => state.minCash >= 1000 ? kept("任期内现金没有跌破1000万底线。") : broken(`最低现金降至${formatMoney(state.minCash)}。`),
    independent_review: () => getDecision("e7") === "play_and_shoot" ? broken("带伤履约让独立风险报告未能真正约束决定。") : kept("医疗风险进入决定，并改变了球员使用。"),
    protect_coach_model: () => getDecision("e6") === "hire_gu" ? broken("开局压力下更换了主教练与比赛模型。") : kept("球队困难时没有由管理层临时改写模型。"),
    six_week_protection: () => kept("球队完成了约定适应期后才进入帅位决定。"),
    chen_pathway: () => getDecision("e8") === "hold_course" ? kept("程野获得明确轮换。") : getDecision("e8") === "sell_chen" ? broken("程野离队获得比赛，但岚城的一线队承诺未兑现。") : open("是否形成真实轮换仍取决于下赛季。"),
    winter_captain_talk: () => kept("一月的谈话按期发生，尽管答案未必令人满意。"),
    east_stand_floor: () => kept("本季合同保留了名称、壁画与低价票底线。"),
    supporter_board_seat: () => kept("会员完成看台事务董事选举，并在本季获得正式表决权。"),
    coach_to_end: () => kept("主教练执教至赛季结束。"),
    three_game_review: () => kept("评估完成，但期限留下的心理影响没有自动消失。"),
    injury_pay_protection: () => kept("本季后续伤情报告按保护规则处理。"),
    protected_consent: () => kept("球员在奖金与位置保护下作出选择。"),
    five_game_stability: () => kept("最后五场没有因单场结果更改评价标准。"),
    winter_review_services: () => getDecision("e7") === "medical_veto" ? kept("医疗权在冬季获得实质支持。") : open("医疗与青训投入仍需下一次预算确认。"),
    consult_charter: () => getDecision("e5") === "full_naming" ? broken("东看台完整冠名没有获得球迷信托认同。") : kept("重大看台决定经过了多方谈判。"),
    own_decisions: () => kept("你的关键决定没有匿名推给董事会或舆论。"),
    three_principles: () => getDecision("e6") === "hire_gu" ? open("换帅后原则是否延续并不清楚。") : kept("原则在困难期仍被用作复盘依据。"),
    honest_rotation: () => kept("角色变化没有先由媒体宣布。"),
    history_not_inventory: () => open("这项承诺只能由未来多个赛季证明。")
  };
  return checks[id]?.() || open("它的真正到期日在下一个赛季或更久以后。");
}

function exportGame() {
  if (!state) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    game: gameData.meta.title,
    season: gameData.meta.season,
    manager: state.managerName,
    club: state.clubName,
    completed: state.completed,
    projectedPosition: state.completed ? projectedPosition() : null,
    finance: state.finance,
    record: state.record,
    decisions: state.history,
    questionsAsked: state.questions,
    proactiveInquiries: state.proactiveQuestions,
    proactiveInquiriesRemaining: state.proactiveRemaining,
    knowledgeConfirmed: state.knowledge,
    promises: state.promises,
    openThreads: state.openThreads,
    matchReports: state.matchReports,
    tags: state.tags
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.clubName}_${state.managerName}_任期记录.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function restartGame() {
  const okay = window.confirm("这会清除当前赛季的本地进度。确定重新开始吗？");
  if (!okay) return;
  localStorage.removeItem(SAVE_KEY);
  state = null;
  ui.resumeBtn.classList.add("hidden");
  showScreen("start");
}

function scrollToStory() {
  if (window.innerWidth < 1100) {
    ui.eventCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setStoryFocus(active) {
  ui.gameScreen.classList.toggle("story-focus", active);
  ui.focusModeBtn.setAttribute("aria-pressed", String(active));
  ui.focusModeBtn.textContent = active ? "显示经营侧栏" : "剧情聚焦";
  localStorage.setItem(FOCUS_MODE_KEY, active ? "1" : "0");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRichText(value, interactiveTerms = true) {
  let rendered = escapeHtml(value);
  const terms = Object.keys(gameData?.glossary || {}).sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const escapedTerm = escapeHtml(term);
    const interactionAttributes = interactiveTerms
      ? `role="button" tabindex="0" aria-label="解释：${escapedTerm}"`
      : "";
    rendered = rendered.replaceAll(
      escapedTerm,
      `<span class="glossary-term" ${interactionAttributes} data-term="${escapedTerm}">${escapedTerm}</span>`
    );
  }
  return rendered;
}

function openGlossary(term = null) {
  const entries = Object.entries(gameData.glossary || {});
  const selected = term ? entries.filter(([name]) => name === term) : entries;
  ui.glossaryTitle.textContent = term || "足球词语";
  ui.glossaryContent.innerHTML = selected.map(([name, item]) => `
    <article class="glossary-entry">
      <h3>${escapeHtml(name)}</h3>
      <p>${escapeHtml(item.definition)}</p>
      <strong>为什么此刻重要</strong>
      <p>${escapeHtml(item.why)}</p>
    </article>
  `).join("");
  if (term && state) {
    if (!state.seenTerms.includes(term)) state.seenTerms.push(term);
    saveGame();
  }
  ui.glossaryPanel.classList.remove("hidden");
  ui.glossaryCloseBtn.focus();
}

function closeGlossary() {
  ui.glossaryPanel.classList.add("hidden");
}

function toChineseNumber(number) {
  const values = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return values[number] || String(number);
}

function bindEvents() {
  ui.visualBackgroundPrevious.addEventListener("animationend", () => {
    ui.visualBackgroundPrevious.classList.add("hidden");
  });
  ui.visualCharacterGhost.addEventListener("animationend", () => {
    ui.visualCharacterGhost.classList.add("hidden");
  });
  ui.visualBackground.addEventListener("error", () => {
    ui.visualBackground.hidden = true;
    ui.visualStage.classList.add("visual-fallback");
  });
  ui.visualBackground.addEventListener("load", () => {
    ui.visualStage.classList.remove("visual-fallback");
  });
  ui.visualCharacter.addEventListener("error", () => {
    ui.visualCharacter.classList.add("hidden");
  });
  ui.visualCharacterSecondary.addEventListener("error", () => {
    ui.visualCharacterSecondary.classList.add("hidden");
  });
  ui.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const managerName = ui.managerName.value.trim() || "无名经理";
    const clubName = ui.teamName.value.trim() || gameData.initial.clubName;
    state = createInitialState(managerName, clubName);
    showScreen("game");
    beginEpisode(0, { fresh: true });
  });

  ui.resumeBtn.addEventListener("click", () => {
    const saved = readSave();
    if (!saved) return;
    state = saved;
    if (state.completed) {
      renderResult();
      showScreen("result");
    } else {
      showScreen("game");
      beginEpisode(state.currentEpisode, { fresh: false });
    }
  });

  ui.restartBtn.addEventListener("click", restartGame);
  ui.resultRestartBtn.addEventListener("click", restartGame);
  ui.exportBtn.addEventListener("click", exportGame);
  ui.resultExportBtn.addEventListener("click", exportGame);
  ui.proactiveInquiryBtn.addEventListener("click", openProactiveInquiry);
  ui.glossaryBtn.addEventListener("click", () => openGlossary());
  ui.glossaryCloseBtn.addEventListener("click", closeGlossary);
  ui.glossaryPanel.addEventListener("click", (event) => {
    if (event.target === ui.glossaryPanel) closeGlossary();
  });
  document.addEventListener("click", (event) => {
    const term = event.target.closest?.(".glossary-term");
    if (!term) return;
    event.preventDefault();
    event.stopPropagation();
    openGlossary(term.dataset.term);
  }, true);
  document.addEventListener("keydown", (event) => {
    const term = event.target.closest?.(".glossary-term");
    if (term && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openGlossary(term.dataset.term);
    }
    if (event.key === "Escape" && !ui.glossaryPanel.classList.contains("hidden")) closeGlossary();
  });
  ui.focusModeBtn.addEventListener("click", () => {
    setStoryFocus(ui.focusModeBtn.getAttribute("aria-pressed") !== "true");
  });
}

async function boot() {
  try {
    const response = await fetch("story-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    gameData = await response.json();
    try {
      const visualResponse = await fetch("visual-data.json", { cache: "no-store" });
      if (visualResponse.ok) {
        visualData = await visualResponse.json();
        scheduleEpisodeVisualPreload(visualData.scope?.[0]);
      }
    } catch (visualError) {
      console.warn("视觉素材未载入，继续使用文字模式。", visualError);
    }
    bindEvents();
    setStoryFocus(localStorage.getItem(FOCUS_MODE_KEY) === "1");
    if (readSave()) ui.resumeBtn.classList.remove("hidden");
  } catch (error) {
    ui.startForm.innerHTML = `
      <h2>剧情数据没有载入</h2>
      <p>请通过本地网页服务打开项目，而不是直接双击 index.html。</p>
      <code>python3 -m http.server 8173</code>`;
    console.error(error);
  }
}

boot();
