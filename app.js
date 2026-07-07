const app = {
  data: null,
  state: null,
  stageIndex: 0,
  currentEvent: null,
  managerName: "",
  teamName: ""
};

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
  app.data = await loadStoryData();
});

function bindElements() {
  [
    "startScreen",
    "gameScreen",
    "resultScreen",
    "startForm",
    "managerName",
    "teamName",
    "clubTitle",
    "cashValue",
    "wageValue",
    "bonusValue",
    "installmentValue",
    "restrictedValue",
    "payablesList",
    "operationsStats",
    "pitchStats",
    "stageCounter",
    "stageTitle",
    "routeTags",
    "eventSpeaker",
    "eventTitle",
    "eventScene",
    "eventPrompt",
    "choiceList",
    "historyList",
    "matchReport",
    "restartBtn",
    "exportBtn",
    "resultTitle",
    "resultSummary",
    "finalTags",
    "exportText",
    "copyBtn"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startGame();
  });

  els.restartBtn.addEventListener("click", () => {
    if (confirm("确定要重新开始吗？当前进度会清空。")) {
      location.reload();
    }
  });

  els.exportBtn.addEventListener("click", showResult);

  els.copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.exportText.value);
    els.copyBtn.textContent = "已复制";
    setTimeout(() => {
      els.copyBtn.textContent = "复制数据";
    }, 1400);
  });
}

async function loadStoryData() {
  try {
    const response = await fetch("story-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    els.startScreen.innerHTML = `
      <div class="start-copy">
        <p class="eyebrow">Load Error</p>
        <h1>剧情数据没有加载成功</h1>
        <p>请通过本地服务打开这个网页，而不是直接双击 HTML 文件。错误信息：${escapeHtml(error.message)}</p>
      </div>
    `;
    throw error;
  }
}

function startGame() {
  app.managerName = els.managerName.value.trim();
  app.teamName = els.teamName.value.trim() || app.data.initial.clubName;
  app.state = clone(app.data.initial);
  app.state.clubName = app.teamName;
  app.state.managerName = app.managerName;
  app.state.history = [];
  app.state.matchReports = [];
  app.state.tags = [...new Set(app.state.tags || [])];
  app.stageIndex = 0;

  els.startScreen.classList.add("hidden");
  els.resultScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  els.clubTitle.textContent = `${app.teamName}｜${app.managerName}`;

  renderStage();
}

function renderStage() {
  if (app.stageIndex >= app.data.stages.length) {
    showResult();
    return;
  }

  els.matchReport.classList.add("hidden");
  els.matchReport.innerHTML = "";

  const stage = app.data.stages[app.stageIndex];
  processDuePayables(stage.id);
  app.currentEvent = selectEvent(stage.eventPool);

  els.stageCounter.textContent = `阶段 ${stage.id} / ${app.data.stages.length}`;
  els.stageTitle.textContent = stage.title;
  els.eventSpeaker.textContent = app.currentEvent.speaker || "俱乐部";
  els.eventTitle.textContent = app.currentEvent.title;
  els.eventScene.textContent = app.currentEvent.scene;
  els.eventPrompt.textContent = app.currentEvent.prompt;

  renderFinance();
  renderStats();
  renderTags();
  renderHistory();
  renderChoices(app.currentEvent.choices || []);
}

function processDuePayables(stageId) {
  const finance = app.state.finance;
  const due = finance.futurePayables.filter((item) => item.dueStage === stageId);
  if (!due.length) return;

  due.forEach((item) => {
    if (finance.cash >= item.amount) {
      finance.cash -= item.amount;
      app.state.history.push({
        stage: stageId,
        title: "固定付款",
        detail: `支付${item.label} ${item.amount} 万。`
      });
      return;
    }

    const shortfall = item.amount - finance.cash;
    finance.cash = 0;
    applyDelta(app.state.operations, {
      "管理层耐心": -3,
      "球迷信任": -2
    });
    applyDelta(app.state.pitch, {
      "阵容厚度": -2,
      "心理稳定性": -2
    });
    addTag("财政紧缩型");
    app.state.history.push({
      stage: stageId,
      title: "被迫压缩开支",
      detail: `${item.label}缺口 ${shortfall} 万，俱乐部临时削减低优先级项目。`
    });
  });

  finance.futurePayables = finance.futurePayables.filter((item) => item.dueStage !== stageId);
}

function selectEvent(eventPool) {
  const sorted = [...eventPool].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const matched = sorted.find((event) => event.trigger && testAll(event.trigger));
  return matched || eventPool.find((event) => event.default) || eventPool[0];
}

function renderFinance() {
  const finance = app.state.finance;
  els.cashValue.textContent = `${finance.cash} 万`;
  els.wageValue.textContent = `${finance.wageCommitment} 万`;
  els.bonusValue.textContent = `${finance.bonusCommitment} 万`;
  els.installmentValue.textContent = `${finance.transferInstallments} 万`;
  els.restrictedValue.textContent = `${finance.restrictedYouthFund} 万`;

  els.payablesList.innerHTML = "";
  if (!finance.futurePayables.length) {
    const li = document.createElement("li");
    li.innerHTML = "<span>暂无未来应付款</span><strong>0 万</strong>";
    els.payablesList.appendChild(li);
    return;
  }

  finance.futurePayables
    .slice()
    .sort((a, b) => a.dueStage - b.dueStage)
    .forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>阶段 ${item.dueStage}｜${escapeHtml(item.label)}</span><strong>${item.amount} 万</strong>`;
      els.payablesList.appendChild(li);
    });
}

function renderStats() {
  renderStatGroup(els.operationsStats, app.state.operations);
  renderStatGroup(els.pitchStats, app.state.pitch);
}

function renderStatGroup(container, stats) {
  container.innerHTML = "";
  Object.entries(stats).forEach(([name, value]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    const barClass = value < 42 ? "danger" : value < 50 ? "warn" : "";
    row.innerHTML = `
      <div class="stat-meta">
        <span>${escapeHtml(name)}</span>
        <strong>${value}</strong>
      </div>
      <div class="bar ${barClass}"><i style="width:${value}%"></i></div>
    `;
    container.appendChild(row);
  });
}

function renderTags() {
  els.routeTags.innerHTML = "";
  (app.state.tags || []).slice(-5).forEach((tag) => {
    const b = document.createElement("b");
    b.textContent = tag;
    els.routeTags.appendChild(b);
  });
}

function renderHistory() {
  els.historyList.innerHTML = "";
  app.state.history.slice(-9).forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>阶段 ${item.stage}｜${escapeHtml(item.title)}</span>${escapeHtml(item.detail)}`;
    els.historyList.appendChild(li);
  });
}

function renderChoices(choices) {
  els.choiceList.innerHTML = "";
  choices.forEach((choice) => {
    const availability = getAvailability(choice);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.disabled = !availability.ok;
    button.innerHTML = `
      <strong>${escapeHtml(choice.label)}</strong>
      <span class="cost">${escapeHtml(choice.visibleFinance || "无直接财务变化")}</span>
      <p>${escapeHtml(choice.hint || "")}</p>
      ${availability.ok ? "" : `<p class="disabled-reason">${escapeHtml(availability.reason)}</p>`}
    `;
    button.addEventListener("click", () => choose(choice));
    els.choiceList.appendChild(button);
  });
}

function getAvailability(choice) {
  if (!choice.requires || !choice.requires.length) return { ok: true };
  const failed = choice.requires.find((condition) => !testCondition(condition));
  if (!failed) return { ok: true };
  if (failed.path === "finance.cash" && failed.op === ">=") {
    return { ok: false, reason: `现金不足，需要 ${failed.value} 万。` };
  }
  return { ok: false, reason: "当前球队状态不满足这个选项。" };
}

function choose(choice) {
  const stage = app.data.stages[app.stageIndex];
  applyEffects(choice.effects || {});
  app.state.history.push({
    stage: stage.id,
    title: app.currentEvent.title,
    detail: choice.label
  });

  if (choice.matchPlan) {
    const report = simulateMatch(choice.matchPlan);
    els.choiceList.innerHTML = "";
    renderMatchReport(report, () => {
      app.stageIndex += 1;
      renderStage();
    });
    renderFinance();
    renderStats();
    renderTags();
    renderHistory();
    return;
  }

  app.stageIndex += 1;
  renderStage();
}

function applyEffects(effects) {
  if (effects.finance) {
    const finance = app.state.finance;
    Object.entries(effects.finance).forEach(([key, value]) => {
      if (key === "futurePayables") {
        finance.futurePayables.push(...value);
      } else {
        finance[key] = Math.max(0, (finance[key] || 0) + value);
      }
    });
  }

  if (effects.operations) applyDelta(app.state.operations, effects.operations);
  if (effects.pitch) applyDelta(app.state.pitch, effects.pitch);

  if (effects.flags) {
    Object.assign(app.state.flags, effects.flags);
  }

  if (effects.tags) {
    effects.tags.forEach(addTag);
  }
}

function applyDelta(target, delta) {
  Object.entries(delta).forEach(([key, value]) => {
    target[key] = clamp((target[key] || 0) + value);
  });
}

function addTag(tag) {
  app.state.tags = app.state.tags || [];
  if (!app.state.tags.includes(tag)) {
    app.state.tags.push(tag);
  }
}

function simulateMatch(type) {
  const rule = app.data.matchRules[type];
  const teamScore = weightedScore(app.state.pitch, rule.weights) + randomInt(-rule.randomRange, rule.randomRange);
  const opponentScore = rule.opponentBase + randomInt(-rule.randomRange, rule.randomRange);
  const diff = Math.round(teamScore - opponentScore);
  const result = getResult(diff);
  const score = getScoreline(result.outcome, Math.abs(diff));
  const isHome = type === "home";
  const resultText = result.outcome === "win" ? "胜" : result.outcome === "draw" ? "平" : "负";

  if (type === "home") {
    app.state.flags.homeResult = resultText;
  } else {
    app.state.flags.awayResult = resultText;
  }

  applyMatchConsequences(result.outcome, isHome);

  const strong = topStat(app.state.pitch, true);
  const weak = topStat(app.state.pitch, false);
  const title = isHome
    ? `${app.teamName} ${score.team}-${score.opponent} ${rule.opponent}`
    : `${rule.opponent} ${score.opponent}-${score.team} ${app.teamName}`;
  const body = buildReportBody(result.outcome, strong, weak, isHome);

  const report = {
    type,
    opponent: rule.opponent,
    title,
    body,
    outcome: result.outcome,
    resultText,
    diff
  };

  app.state.matchReports.push(report);
  app.state.history.push({
    stage: app.data.stages[app.stageIndex].id,
    title: isHome ? "第一场主场比赛" : "第一场客场比赛",
    detail: `${title}，结果：${resultText}。`
  });
  return report;
}

function weightedScore(stats, weights) {
  return Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (stats[key] || 0) * weight;
  }, 0);
}

function getResult(diff) {
  if (diff >= 4) return { outcome: "win" };
  if (diff <= -4) return { outcome: "loss" };
  return { outcome: "draw" };
}

function getScoreline(outcome, margin) {
  if (outcome === "draw") {
    return Math.random() > 0.5 ? { team: 1, opponent: 1 } : { team: 0, opponent: 0 };
  }
  if (outcome === "win") {
    return margin >= 9 ? { team: 3, opponent: 1 } : margin >= 6 ? { team: 2, opponent: 0 } : { team: 2, opponent: 1 };
  }
  return margin >= 9 ? { team: 0, opponent: 3 } : margin >= 6 ? { team: 0, opponent: 2 } : { team: 1, opponent: 2 };
}

function applyMatchConsequences(outcome, isHome) {
  if (outcome === "win") {
    applyDelta(app.state.operations, { "球迷信任": isHome ? 5 : 4, "管理层耐心": 3, "媒体关系": 2 });
    applyDelta(app.state.pitch, { "心理稳定性": 3, "更衣室凝聚力": 2 });
    addTag(isHome ? "主场强势型" : "客场抢分型");
    return;
  }
  if (outcome === "draw") {
    applyDelta(app.state.operations, { "管理层耐心": -1 });
    applyDelta(app.state.pitch, { "心理稳定性": 1 });
    return;
  }
  applyDelta(app.state.operations, { "球迷信任": isHome ? -5 : -3, "管理层耐心": -3, "媒体关系": -3 });
  applyDelta(app.state.pitch, { "心理稳定性": -3, "更衣室凝聚力": -2 });
  addTag("赛季承压型");
}

function buildReportBody(outcome, strong, weak, isHome) {
  const place = isHome ? "主场" : "客场";
  if (outcome === "win") {
    return `这场${place}比赛体现了球队在“${strong[0]}”上的优势。此前的经营选择让球队在关键阶段更稳定，虽然“${weak[0]}”仍是隐患，但这一次没有被对手彻底放大。`;
  }
  if (outcome === "draw") {
    return `这场${place}比赛非常接近。球队在“${strong[0]}”上有亮点，但“${weak[0]}”限制了上限。结果不是单纯运气，而是此前选择叠加比赛随机性的产物。`;
  }
  return `这场${place}失利暴露了“${weak[0]}”的短板。球队并非没有亮点，“${strong[0]}”仍然支撑了一段时间，但比赛后段被此前积累的问题拖住。`;
}

function renderMatchReport(report, onContinue) {
  els.matchReport.classList.remove("hidden");
  els.matchReport.innerHTML = `
    <h3>${escapeHtml(report.title)}</h3>
    <p>${escapeHtml(report.body)}</p>
  `;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "choice-card";
  btn.innerHTML = `<strong>${app.stageIndex >= app.data.stages.length - 1 ? "查看球队报告" : "进入下一阶段"}</strong><span class="cost">赛后报道已记录</span>`;
  btn.addEventListener("click", onContinue);
  els.choiceList.appendChild(btn);
}

function showResult() {
  if (!app.state) return;
  els.gameScreen.classList.add("hidden");
  els.startScreen.classList.add("hidden");
  els.resultScreen.classList.remove("hidden");

  const exportData = buildExportData();
  els.resultTitle.textContent = `${app.teamName}｜球队报告`;
  els.resultSummary.textContent = `${app.managerName}经营出的球队已经完成赛季前 10 个阶段，并踢完第一场主场与第一场客场。`;
  els.exportText.value = JSON.stringify(exportData, null, 2);
  els.finalTags.innerHTML = "";
  exportData.tags.forEach((tag) => {
    const b = document.createElement("b");
    b.textContent = tag;
    els.finalTags.appendChild(b);
  });
}

function buildExportData() {
  return {
    game: app.data.meta.title,
    version: app.data.meta.version,
    exportedAt: new Date().toISOString(),
    managerName: app.managerName,
    teamName: app.teamName,
    finance: app.state.finance,
    operations: app.state.operations,
    pitch: app.state.pitch,
    flags: app.state.flags,
    tags: app.state.tags,
    matchReports: app.state.matchReports,
    history: app.state.history
  };
}

function testAll(conditions) {
  return conditions.every(testCondition);
}

function testCondition(condition) {
  const actual = getPath(app.state, condition.path);
  switch (condition.op) {
    case "==":
      return actual === condition.value;
    case "!=":
      return actual !== condition.value;
    case ">":
      return actual > condition.value;
    case ">=":
      return actual >= condition.value;
    case "<":
      return actual < condition.value;
    case "<=":
      return actual <= condition.value;
    case "includes":
      return Array.isArray(actual) && actual.includes(condition.value);
    default:
      return false;
  }
}

function getPath(source, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), source);
}

function topStat(stats, high) {
  return Object.entries(stats).sort((a, b) => (high ? b[1] - a[1] : a[1] - b[1]))[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
