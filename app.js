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
    "financeScale",
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
    "clubDossier",
    "eventSpeaker",
    "eventTitle",
    "eventScene",
    "eventPrompt",
    "eventContext",
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
  renderEventContext(app.currentEvent);

  renderFinance();
  renderDossier();
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
  els.financeScale.textContent = getFinanceScaleText(finance);
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

function renderDossier() {
  if (!els.clubDossier) return;
  if (app.stageIndex > 0) {
    els.clubDossier.classList.add("hidden");
    return;
  }
  els.clubDossier.classList.remove("hidden");
  const dossier = app.data.clubDossier || getDefaultDossier();
  els.clubDossier.innerHTML = `
    <div class="dossier-head">
      <div>
        <p class="eyebrow">Club Scan</p>
        <h2>接手前的球队全貌</h2>
      </div>
      <span>${escapeHtml(dossier.level || "中游职业俱乐部")}</span>
    </div>
    <div class="dossier-grid">
      ${dossier.items.map((item) => `
        <article>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `).join("")}
    </div>
    <p class="dossier-note">${escapeHtml(dossier.note || "这些不是额外规则，而是解释你为什么会遇到后续决策。")}</p>
  `;
}

function renderEventContext(event) {
  const lines = [];
  if (event.trigger && event.trigger.length) {
    lines.push(`触发原因：${event.trigger.map(describeCondition).join("；")}。`);
  } else {
    lines.push("这是本阶段的默认情境：球队没有进入更极端的风险分支。");
  }

  const pressure = getCurrentPressureNotes();
  if (pressure.length) {
    lines.push(`当前观察：${pressure.slice(0, 3).join("；")}。`);
  }

  els.eventContext.innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderStats() {
  renderStatGroup(els.operationsStats, app.state.operations);
  renderStatGroup(els.pitchStats, app.state.pitch);
}

function renderStatGroup(container, stats) {
  container.innerHTML = "";
  Object.entries(stats).forEach(([name, value]) => {
    const rating = getStatRating(value);
    const note = getStatNote(name, value);
    const row = document.createElement("div");
    row.className = "stat-row";
    const barClass = value < 42 ? "danger" : value < 50 ? "warn" : value >= 60 ? "strong" : "";
    row.innerHTML = `
      <div class="stat-meta">
        <span>${escapeHtml(name)}</span>
        <strong>${value}｜${escapeHtml(rating.label)}</strong>
      </div>
      <div class="bar ${barClass}"><i style="width:${value}%"></i></div>
      <p class="stat-note">${escapeHtml(note)}</p>
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
      ${renderChoiceContext(choice)}
      ${availability.ok ? "" : `<p class="disabled-reason">${escapeHtml(availability.reason)}</p>`}
    `;
    button.addEventListener("click", () => choose(choice));
    els.choiceList.appendChild(button);
  });
}

function renderChoiceContext(choice) {
  const financeReason = buildFinanceRationale(choice);
  const impacts = buildImpactList(choice.effects || {});
  const impactHtml = impacts.length
    ? `<div class="impact-list">${impacts.map((impact) => `<span class="${impact.kind}">${escapeHtml(impact.label)}</span>`).join("")}</div>`
    : `<div class="impact-list"><span>影响面：低波动处理</span></div>`;

  return `
    <div class="choice-context">
      <p>${escapeHtml(financeReason)}</p>
      ${impactHtml}
    </div>
  `;
}

function buildFinanceRationale(choice) {
  const finance = choice.effects?.finance || {};
  const cashDelta = finance.cash || 0;
  const wageDelta = finance.wageCommitment || 0;
  const bonusDelta = finance.bonusCommitment || 0;
  const payables = finance.futurePayables || [];
  const openingCash = app.data.initial.finance.cash;
  const firstWage = app.data.initial.finance.futurePayables.find((item) => item.id === "month_wage_1")?.amount || 600;

  if (!cashDelta && !wageDelta && !bonusDelta && !payables.length) {
    return "财务口径：不改变账面现金，但可能把压力转移到更衣室、球迷、教练权威或后续谈判。";
  }

  const notes = [];
  if (cashDelta < 0) {
    const ratio = Math.round(Math.abs(cashDelta) / openingCash * 100);
    notes.push(`立即支出约占开局现金 ${ratio}%`);
    if (Math.abs(cashDelta) >= 1000) notes.push("属于中游队的一线队级大额操作");
    else if (Math.abs(cashDelta) >= 500) notes.push("相当于一笔主力级补强或专项团队投入");
    else notes.push("属于运营、调解或短期项目成本");
  }
  if (cashDelta > 0) {
    notes.push(`立即回款可覆盖约 ${Math.max(1, Math.round(cashDelta / firstWage))} 个月首月工资量级`);
  }
  if (wageDelta > 0) notes.push(`工资承诺增加 ${wageDelta} 万，会成为后续续约和更衣室比较的参照`);
  if (wageDelta < 0) notes.push(`工资承诺减少 ${Math.abs(wageDelta)} 万，释放后续操作空间`);
  if (bonusDelta > 0) notes.push(`奖金承诺增加 ${bonusDelta} 万，把压力延后到成绩兑现时`);
  payables.forEach((item) => {
    notes.push(`未来第 ${item.dueStage} 阶段还要支付${item.label} ${item.amount} 万`);
  });

  return `财务口径：${notes.join("；")}。`;
}

function buildImpactList(effects) {
  const impacts = [];
  Object.entries(effects.finance || {}).forEach(([key, value]) => {
    if (key === "futurePayables") {
      value.forEach((item) => impacts.push({ kind: "finance", label: `未来付款 +${item.amount} 万` }));
      return;
    }
    if (value) impacts.push({ kind: "finance", label: `${financeLabel(key)} ${formatSigned(value)}` });
  });
  Object.entries(effects.operations || {}).forEach(([key, value]) => {
    impacts.push({ kind: value >= 0 ? "up" : "down", label: `${key} ${formatSigned(value)}` });
  });
  Object.entries(effects.pitch || {}).forEach(([key, value]) => {
    impacts.push({ kind: value >= 0 ? "up" : "down", label: `${key} ${formatSigned(value)}` });
  });
  if (effects.flags) {
    Object.keys(effects.flags).forEach((key) => impacts.push({ kind: "flag", label: `后续分支：${flagLabel(key)}` }));
  }
  if (effects.tags) {
    effects.tags.forEach((tag) => impacts.push({ kind: "tag", label: `标签：${tag}` }));
  }
  return impacts;
}

function getFinanceScaleText(finance) {
  const openingCash = app.data.initial.finance.cash;
  const firstWage = app.data.initial.finance.futurePayables.find((item) => item.id === "month_wage_1")?.amount || 600;
  const cashRatio = Math.round(finance.cash / openingCash * 100);
  return `预算参照：开局现金 ${openingCash} 万。当前现金约为开局 ${cashRatio}%，首月工资量级 ${firstWage} 万。`;
}

function getStatRating(value) {
  if (value <= 34) return { label: "危机", detail: "明显低于职业联赛竞争线" };
  if (value <= 44) return { label: "偏低", detail: "弱于联赛平均，容易触发风险" };
  if (value <= 55) return { label: "中游", detail: "接近联赛普通中游水平" };
  if (value <= 65) return { label: "良好", detail: "略高于平均，可以支撑方案" };
  if (value <= 75) return { label: "强项", detail: "接近联赛前列球队水准" };
  return { label: "顶级", detail: "已经是本联赛优势资源" };
}

function getStatNote(name, value) {
  const rating = getStatRating(value);
  const details = {
    "青训体系": "影响年轻球员选项、低成本补强和长期身份叙事。",
    "球探网络": "影响能否找到性价比球员，而不是只买贵的人。",
    "球迷信任": "影响主场气势、舆论容错和商业决策反弹。",
    "社区连接": "影响本地赞助、公益票、校园合作和球迷身份。",
    "管理层耐心": "影响成绩波动时董事会是否干预。",
    "媒体关系": "影响小矛盾会不会被放大成危机。",
    "俱乐部文化": "影响球员是否相信长期路线。",
    "队内权力平衡": "影响核心、替补、教练之间的权威边界。",
    "商业吸引力": "影响赞助收入，也可能提高商业化压力。",
    "球员水平": "直接影响场上硬实力和关键球处理。",
    "阵容厚度": "影响轮换、伤病承受力和替补信心。",
    "战术熟练度": "影响球队是否知道该怎么踢。",
    "体能健康": "影响伤病概率、密集赛程和客场表现。",
    "更衣室凝聚力": "影响落后时是否互相补位和支持。",
    "心理稳定性": "影响舆论、客场和比分落后时的表现。",
    "教练临场能力": "影响换人、调整和赛前布置。",
    "主场气势": "影响主场开局压迫、球迷助推和对手心理。"
  };
  return `${rating.detail}；${details[name] || "影响后续剧情判断。"}`;
}

function describeCondition(condition) {
  const actual = getPath(app.state, condition.path);
  const label = pathLabel(condition.path);
  if (typeof actual === "number") {
    return `${label} 当前 ${actual}（${getStatRating(actual).label}），满足 ${condition.op} ${condition.value}`;
  }
  return `${label} 当前为 ${formatConditionValue(actual)}，满足 ${condition.op} ${formatConditionValue(condition.value)}`;
}

function getCurrentPressureNotes() {
  const notes = [];
  [...Object.entries(app.state.operations), ...Object.entries(app.state.pitch)]
    .filter(([, value]) => value <= 44 || value >= 60)
    .sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50))
    .forEach(([name, value]) => {
      const direction = value >= 60 ? "优势" : "隐患";
      notes.push(`${name} ${value} 是${direction}区`);
    });

  if (app.state.finance.cash < 1200) notes.unshift(`现金 ${app.state.finance.cash} 万，已经进入紧张区`);
  return notes;
}

function getDefaultDossier() {
  return {
    level: "联赛中游｜资源有限",
    items: [
      { title: "主教练", text: "现任教练熟悉球队，偏稳健，能维持秩序，但临场变化和新战术开发一般。" },
      { title: "阵容结构", text: "主力框架还能踢，核心球员影响大；替补年轻，经验不足，阵容厚度只能算中游。" },
      { title: "工资结构", text: "核心与主力工资占比较高，任何高薪新援都会成为续约谈判的参照物。" },
      { title: "青训", text: "梯队规模中等，近年能提供轮换球员，但还没有稳定产出明星。" },
      { title: "战术", text: "球队习惯防守反击，传控基础一般，换帅或大改打法会有磨合成本。" },
      { title: "球迷与财政", text: "本地球迷忠诚但年轻观众流失；现金够做几件事，但不能所有方向同时拉满。" }
    ],
    note: "先读这份体检报告，再决定你要把有限资源押在哪条路线上。"
  };
}

function financeLabel(key) {
  return {
    cash: "现金",
    wageCommitment: "工资承诺",
    transferInstallments: "转会分期",
    bonusCommitment: "奖金承诺",
    restrictedYouthFund: "青训专项"
  }[key] || key;
}

function flagLabel(key) {
  return {
    coreStarInTeam: "核心去留",
    signedVeteran: "成名老将",
    promotedYouth: "青训提拔",
    headCoach: "教练路线",
    openingPath: "开局路线",
    sponsorPath: "赞助路线",
    injuryRisk: "伤病风险",
    delayedStarTalks: "核心续约后置"
  }[key] || key;
}

function pathLabel(path) {
  return path.split(".").slice(-1)[0];
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatConditionValue(value) {
  if (value === true) return "是";
  if (value === false) return "否";
  return String(value);
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
  const pressure = getCurrentPressureNotes().slice(0, 2);
  const context = pressure.length ? `赛前背景里，${pressure.join("，")}。` : "赛前没有特别极端的风险项，比赛更多取决于临场执行和随机波动。";
  if (outcome === "win") {
    return `${context}这场${place}比赛体现了球队在“${strong[0]}”上的优势：它不是单场突然出现的能力，而是此前预算、教练、阵容和更衣室选择共同积累的结果。虽然“${weak[0]}”仍是隐患，但这一次没有被对手彻底放大。`;
  }
  if (outcome === "draw") {
    return `${context}这场${place}比赛非常接近。球队在“${strong[0]}”上有亮点，但“${weak[0]}”限制了上限。结果不是单纯运气，而是此前资源分配、疲劳管理、战术熟练度和比赛随机性叠加后的产物。`;
  }
  return `${context}这场${place}失利暴露了“${weak[0]}”的短板。球队并非没有亮点，“${strong[0]}”仍然支撑了一段时间，但比赛后段被此前积累的问题拖住：可能是轮换不足、战术磨合、心理压力，也可能是足球本身的随机性放大了弱点。`;
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
