const SAVE_KEY = "lancheng-season-v2";

let gameData = null;
let visualData = null;
let state = null;
let activeVisualPage = null;

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
  visualCharacter: $("visualCharacter"),
  visualLocation: $("visualLocation"),
  eventSpeaker: $("eventSpeaker"),
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
    managerName,
    clubName,
    currentEpisode: 0,
    phase: "scenes",
    sceneIndex: 0,
    visualBeatKey: null,
    visualBeatIndex: 0,
    activeReply: null,
    questions: {},
    decisions: {},
    finance: initial.finance,
    operations: initial.operations,
    pitch: initial.pitch,
    characterTrust: initial.characterTrust,
    promises: initial.promises,
    openThreads: initial.openThreads,
    payables: initial.payables,
    paidPayables: [],
    paymentNotices: {},
    knowledge: [],
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
    return saved?.version === 2 ? saved : null;
  } catch (error) {
    return null;
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
  if (!due.length) return;

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
    speaker: "乔岚",
    title: `${item.text}今天到期`,
    body: [
      `${formatMoney(item.amount)}已从账户划走。这不是新的选择，而是过去的选择在今天兑现。付款后的可动用现金为${formatMoney(state.finance.cash)}。`
    ],
    kind: "到期付款"
  }));
}

function getSceneQueue(episode) {
  const echoes = (episode.echoes || [])
    .filter((item) => matchesCondition(item.when))
    .slice(0, 3)
    .map((item) => ({ ...item, kind: "旧决定的回声" }));
  const notices = state.paymentNotices[episode.number] || [];
  const openings = episode.opening.map((item, index) => ({
    ...item,
    kind: "现场",
    visualKey: `${episode.id}.opening.${index}`
  }));
  return [openings[0], ...notices, ...echoes, ...openings.slice(1)].filter(Boolean);
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
  const recentKnowledge = state.knowledge.slice(-3);
  ui.clubDossier.innerHTML = `
    <dl>
      <div><dt>你的职位</dt><dd>足球运营总经理</dd></div>
      <div><dt>本集时点</dt><dd>${escapeHtml(episode.phase)}</dd></div>
      <div><dt>已经追问</dt><dd>${selected.length} / ${episode.inquiry.max}</dd></div>
    </dl>
    <div class="known-facts">
      <strong>最近确认的事实</strong>
      ${
        recentKnowledge.length
          ? recentKnowledge.map((item) => `<p>${escapeHtml(item.text)}</p>`).join("")
          : "<p>你还没有把任何人的说法核实为案头信息。</p>"
      }
    </div>`;
}

function relationText(value) {
  if (value >= 72) return "会主动把坏消息先告诉你";
  if (value >= 58) return "愿意直接谈分歧";
  if (value >= 43) return "仍在观察你的下一次决定";
  if (value >= 30) return "开始通过别人向你传话";
  return "不再相信私下承诺";
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
      let role = person.role;
      let status = relationText(state.characterTrust[person.id] ?? 50);
      if (person.id === "he" && changedCoach) {
        role = "前一线队主教练";
        status = "已经离任，影响仍留在队内";
      }
      if (person.id === "gu" && changedCoach) role = "一线队主教练";
      if (person.id === "gu" && !changedCoach) status = "仍在俱乐部之外等待机会";
      return `
        <details class="character-item" ${activeIds.has(person.id) ? "open" : ""}>
          <summary><span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(role)}</small></span></summary>
          <p>${escapeHtml(person.bio)}</p>
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
    case "decision":
      renderDecision();
      break;
    case "aftermath":
      renderAftermath();
      break;
    case "match":
      renderMatch();
      break;
    default:
      renderScene();
  }
}

function setSceneContent({ speaker, title, body, kind = "现场" }, meta, visualKey = null) {
  ui.eventSpeaker.textContent = speaker;
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
    visibleBody = [body[beatIndex]];
    activeVisualPage = {
      key: visualKey,
      hasNext: beatIndex < body.length - 1
    };
    renderVisualStage(beat, meta);
  } else {
    state.visualBeatKey = null;
    state.visualBeatIndex = 0;
    hideVisualStage();
  }

  ui.eventScene.innerHTML = visibleBody
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
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
  if (!key || currentEpisode()?.id !== "e1") return null;
  return visualData?.scenes?.[key] || null;
}

function hideVisualStage() {
  ui.visualStage.classList.add("hidden");
  ui.eventCard.classList.remove("visual-event");
  ui.visualCharacter.classList.add("hidden");
}

function renderVisualStage(scene, meta) {
  const background = visualData.backgrounds?.[scene.background];
  if (!background) {
    hideVisualStage();
    return;
  }

  ui.eventCard.classList.add("visual-event");
  ui.visualStage.classList.remove("hidden");
  ui.visualStage.dataset.tone = scene.tone || "story";
  ui.visualBackground.hidden = false;
  ui.visualBackground.alt = background.alt || "剧情背景";
  if (!ui.visualBackground.src.endsWith(background.src)) {
    ui.visualBackground.src = background.src;
    restartAnimation(ui.visualBackground, "visual-fade");
  }
  ui.visualLocation.textContent = meta;

  const character = scene.character ? visualData.characters?.[scene.character] : null;
  const portrait = character?.expressions?.[scene.expression];
  if (!portrait) {
    ui.visualCharacter.classList.add("hidden");
    ui.visualCharacter.removeAttribute("src");
    return;
  }

  ui.eventSpeaker.textContent = character.name;
  ui.visualCharacter.alt = `${character.name}，${scene.expression || "当前"}神态`;
  ui.visualCharacter.className = `visual-character position-${scene.position || "center"}`;
  ui.visualCharacter.src = portrait;
  restartAnimation(ui.visualCharacter, `motion-${scene.motion || "focus"}`);
}

function restartAnimation(element, className) {
  element.classList.remove("visual-fade", "motion-enter", "motion-focus", "motion-tense", className);
  void element.offsetWidth;
  element.classList.add(className);
}

function renderScene() {
  const episode = currentEpisode();
  const scenes = getSceneQueue(episode);
  const scene = scenes[state.sceneIndex] || scenes[0];
  setSceneContent(scene, `${episode.date} · ${episode.location}`, scene.visualKey);
  const last = state.sceneIndex >= scenes.length - 1;
  showContinue(last ? "开始了解冲突" : "继续", () => {
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
  const active = inquiry.options.find((item) => item.id === state.activeReply);

  if (active) {
    setSceneContent(
      { speaker: active.speaker, title: active.title, body: active.body, kind: "谈话记录" },
      `${episode.date} · 只对你说`,
      `${episode.id}.inquiry.${active.id}`
    );
    ui.knowledgeCard.innerHTML = `<strong>你现在确认了一件事</strong><p>${escapeHtml(active.knowledge)}</p>`;
    ui.knowledgeCard.classList.remove("hidden");
    const reachedMax = selected.length >= inquiry.max;
    showContinue(reachedMax ? "带着这些信息作决定" : "返回，再问一个人", () => {
      state.activeReply = null;
      if (reachedMax) state.phase = "decision";
      saveGame();
      render();
      scrollToStory();
    });
    return;
  }

  setSceneContent(
    {
      speaker: state.managerName,
      title: selected.length ? "还有谁的话值得占用最后的时间？" : "你不可能听到所有人的版本",
      body: [inquiry.prompt],
      kind: "有限追问"
    },
    `${episode.date} · 决策前`,
    `${episode.id}.inquiry.menu`
  );
  ui.inquiryStatus.textContent = `可以追问 ${inquiry.max} 人 · 已问 ${selected.length} 人`;
  ui.inquiryStatus.classList.remove("hidden");

  inquiry.options
    .filter((item) => !selected.includes(item.id))
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inquiry-choice";
      button.innerHTML = `<span>追问</span><strong>${escapeHtml(option.label)}</strong>`;
      button.addEventListener("click", () => selectInquiry(option));
      ui.choiceList.appendChild(button);
    });

  if (selected.length > 0) {
    showContinue(selected.length >= inquiry.max ? "现在作决定" : "不再追问，直接决定", () => {
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
  if (selected.includes(option.id) || selected.length >= inquiry.max) return;
  state.questions[episode.id] = [...selected, option.id];
  state.activeReply = option.id;
  state.knowledge.push({ episode: episode.number, text: option.knowledge });
  saveGame();
  render();
  scrollToStory();
}

function renderDecision() {
  const episode = currentEpisode();
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "decision-choice";
    button.innerHTML = `
      <span class="decision-label">${escapeHtml(option.label)}</span>
      <span class="decision-action">${escapeHtml(option.action)}</span>
      <span class="known-title">你在签字前能确认</span>
      <ul>${option.known.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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
  ui.feedbackScene.innerHTML = `
    <p class="eyebrow">记录在案</p>
    <h3>${escapeHtml(option.label)}</h3>
    <p>${escapeHtml(option.action)}</p>
    ${
      addedPromises.length
        ? `<div class="receipt-promises"><strong>你因此说过</strong>${addedPromises
            .map((item) => `<span>“${escapeHtml(item.text)}”</span>`)
            .join("")}</div>`
        : ""
    }`;
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

function ensureMatchReport(episode) {
  if (state.matchReports.some((item) => item.episodeId === episode.id)) return;
  const config = episode.match;
  const count = episode.id === "e6" ? 6 : episode.id === "e9" ? 5 : 1;
  const competitive = episode.id !== "e3";
  const games = [];

  for (let index = 0; index < count; index += 1) {
    const teamBase = Object.values(state.pitch).reduce((sum, value) => sum + value, 0) / 5;
    const structure = (state.operations.coachAuthority + state.operations.dressingRoom) / 25;
    const fatiguePenalty = Math.max(0, 50 - state.pitch.fitness) / 5;
    const performance = teamBase + structure - fatiguePenalty - config.difficulty + randomBetween(-13, 13);
    let outcome = "D";
    if (performance > 6) outcome = "W";
    if (performance < -6) outcome = "L";
    const score = makeScore(outcome);
    games.push({ outcome, score });

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
    games
  });
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function makeScore(outcome) {
  const low = () => Math.floor(Math.random() * 2);
  if (outcome === "W") return `${1 + Math.floor(Math.random() * 3)}-${low()}`;
  if (outcome === "L") return `${low()}-${1 + Math.floor(Math.random() * 3)}`;
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
    <p class="match-note">比赛包含偶然性。它结算你此前建立的阵容、体能、信任与混乱，却不会证明某个决定天然正确。</p>
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
  const teamBase = Object.values(state.pitch).reduce((sum, value) => sum + value, 0) / 5;
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
  const captain = getDecision("e4");
  if (captain === "sell_captain") {
    result.push({ who: "林骁", text: "他在江东完成了一个稳定赛季。岚城更衣室最终选出新队长，但那只袖标花了几个月才停止像借来的。" });
  } else if (captain === "renew_captain") {
    result.push({ who: "林骁", text: "他接受轮换，也在最困难的几周替年轻人说话。续约没有冻结时间，却让交接可以不以羞辱开始。" });
  } else {
    result.push({ who: "林骁", text: "最后一轮后，他独自在东看台坐到清场。是否续约仍未完全决定，但俱乐部不能再假装冬天的谈话没有到期。" });
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
    result.push({ who: "主教练", text: "顾维带来了可见改变，也带来新的预算要求。贺峥的离开没有证明换帅错误，只证明一段关系已经无法回到七月。" });
  } else if (coach === "back_coach") {
    result.push({ who: "主教练", text: "贺峥执教到最后一天。无论排名是否漂亮，球员知道管理层曾在最容易甩锅时用第一人称承担了决定。" });
  } else {
    result.push({ who: "主教练", text: "三场期限结束后，所有人仍习惯数下一次倒计时。制度完成了评估，却没能完全收回它制造的生存感。" });
  }

  const youth = getDecision("e8");
  if (youth === "sell_chen") {
    result.push({ who: "陈野", text: "他在租借队得到连续首发。岚城拥有回购条款，但是否还拥有一条真正的青训路径，要等下一名孩子来验证。" });
  } else {
    result.push({ who: "陈野", text: "他不再只是海报上的未来。失误、替补和有限出场终于组成一条可理解的成长路径。" });
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
    chen_pathway: () => getDecision("e8") === "hold_course" ? kept("陈野获得明确轮换。") : getDecision("e8") === "sell_chen" ? broken("陈野离队获得比赛，但岚城的一线队承诺未兑现。") : open("是否形成真实轮换仍取决于下赛季。"),
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toChineseNumber(number) {
  const values = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return values[number] || String(number);
}

function bindEvents() {
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
        preloadPrologueVisuals();
      }
    } catch (visualError) {
      console.warn("序章视觉素材未载入，继续使用文字模式。", visualError);
    }
    bindEvents();
    if (readSave()) ui.resumeBtn.classList.remove("hidden");
  } catch (error) {
    ui.startForm.innerHTML = `
      <h2>剧情数据没有载入</h2>
      <p>请通过本地网页服务打开项目，而不是直接双击 index.html。</p>
      <code>python3 -m http.server 8173</code>`;
    console.error(error);
  }
}

function preloadPrologueVisuals() {
  const sources = [
    ...Object.values(visualData?.backgrounds || {}).map((item) => item.src),
    ...Object.values(visualData?.characters || {}).flatMap((character) =>
      Object.values(character.expressions || {})
    )
  ];
  sources.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}

boot();
