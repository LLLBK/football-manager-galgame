const app = {
  data: null,
  state: null,
  stageIndex: 0,
  prologueIndex: 0,
  currentEvent: null,
  managerName: "",
  teamName: ""
};

const els = {};

const TERM_NOTES = {
  "主席": "这里指俱乐部董事会推到台前的最高管理者。他不一定是老板本人，但要同时对投资人、球迷和成绩负责。",
  "董事会": "俱乐部的决策层，负责预算、目标和重大人事。董事会的耐心会影响你能否承受短期成绩波动。",
  "球迷": "支持球队的人。他们不是普通消费者，很多人把球队当成城市身份和个人记忆的一部分。",
  "主教练": "负责训练、战术和比赛临场指挥的人。经理人不能直接替他执教，但可以决定是否支持、替换或补强教练组。",
  "青训": "可以理解成俱乐部自己的足球学校。它不一定马上产出明星，但会影响长期成本、球队身份和年轻球员上升通道。",
  "球探": "负责寻找适合球队的球员。好的球探网络能减少盲目高价买人。",
  "更衣室": "不只是换衣服的地方，也代表球员之间的权力、信任和情绪秩序。",
  "核心": "球队最重要、最有影响力的球员。核心既能决定比赛，也可能影响工资结构和更衣室话语权。",
  "续约": "和球员重新谈合同。续约不只是工资问题，也涉及地位、奖金、年限和球队未来方向。",
  "工资结构": "队内不同球员工资之间的相对关系。一份高薪合同会成为下一次谈判的参照。",
  "赞助": "企业给俱乐部钱，换取曝光、命名权或商业活动。赞助收入越高，商业条件可能越重。",
  "主场": "球队自己的比赛场地。主场优势来自球迷、熟悉环境和心理压力。",
  "客场": "去对手城市比赛。客场会带来旅途、休息、陌生环境和球迷压力。",
  "转会": "球员从一支球队去另一支球队。转会费、工资、经纪人和球队需求都会影响决策。",
  "战术": "球队在场上如何组织进攻、防守和压迫。战术改变通常需要训练时间和合适球员。",
  "阵容厚度": "替补和轮换球员的质量。厚度越好，越能承受伤病和密集赛程。"
};

const EVENT_NARRATIVES = {
  opening_board: {
    title: "主席办公室：岚城联到底要成为什么球队？",
    terms: ["主席", "董事会", "主场"],
    body: [
      "你第一次走进主席办公室时，窗外正能看到岚城体育场的旧看台。墙上挂着十年前冲上顶级联赛时的照片，照片里的球迷挤满了看台，而现在的上座率已经连续三年下滑。",
      "主席把三份剪报推到你面前：一份写着“岚城联又一年中游”，一份写着“年轻球迷正在流失”，还有一份质疑董事会只会喊口号。球迷代表坐在沙发另一端，没有寒暄，只问了一句：“你们这次到底想把球队带到哪里？”",
      "主席随后拿出三份可以当场签字的会议纪要：不追加预算、换取三年重建期；追加 800 万、但必须承诺联赛前四；或者先从现有现金拨 150 万恢复球迷组织。现在你选择的不是一句口号，而是一组立刻生效的权利和义务。",
      "这场对话参考了会员制俱乐部和资本型俱乐部之间的张力：球队究竟是社区身份，还是成绩机器，决定了之后每一笔钱的意义。"
    ],
    prompt: "三份会议纪要摆在桌上。你签哪一份？"
  },
  budget_ambition: {
    title: "财务会议室：追加预算不是免费午餐",
    terms: ["董事会", "转会", "工资结构"],
    body: [
      "董事会秘书把追加预算写进会议纪要，但最后一行字被加粗：球队必须尽快看到成绩。财务主管没有抬头，只把现金流表推到你面前。",
      "主席说：“钱可以先给，但球迷、媒体和投资人都在看。我们不能花完以后还说需要时间。”你想起一些豪门重建失败的故事：钱花出去容易，路线混乱时，钱也会变成压力。",
      "这类场景参考了高投入俱乐部在短期成绩和长期纪律之间的矛盾。"
    ],
    prompt: "你确认 1400 万的两笔即战力交易，还是只执行 900 万的轮换球员与体能设备方案？"
  },
  budget_community: {
    title: "球迷协会会议室：城市也在等你的答案",
    terms: ["青训", "主场", "赞助"],
    body: [
      "社区活动刚结束，几个穿校队球衣的孩子还在训练场外等签名。球迷代表把一张旧照片放到桌上：二十年前，岚城联第一次升入顶级联赛，全城公交车都贴着球队海报。",
      "财务主管提醒你，情感不能替代预算；球迷代表反问，成绩如果和这座城市没有关系，赢球还剩下什么？你夹在两种语言中间：一边是现金表，一边是看台记忆。",
      "这个母题来自巴萨、毕尔巴鄂、德国 50+1 以及许多地方俱乐部的身份政治。"
    ],
    prompt: "你签青训基地与学校共建方案，还是把预算用于签回本地球员周航？"
  },
  budget_default: {
    title: "预算白板：三支笔，只能先圈一块",
    terms: ["青训", "球探", "转会"],
    body: [
      "财务主管在白板上写下三个词：一线队、训练基地、平衡投入。每写一个词，她都会在旁边标出现金流压力。",
      "球探主管说市场上有合适球员，但不会一直等你；青训主管说训练基地的草皮已经影响孩子们的训练；主教练则只问一句：“如果不补强，我拿什么踢第一场？”",
      "这不是选择一个部门，而是选择球队先承认哪一个短板。"
    ],
    prompt: "三份执行预算已经列出项目和报价。你批准哪一份？"
  },
  recruit_youth_path: {
    title: "青训基地：那个孩子一直在等机会",
    terms: ["青训", "阵容厚度", "转会"],
    body: [
      "青训主管带你走过一块边线已经磨白的训练场。一个年轻前锋在小场对抗里连续两次抢到前点，射门不漂亮，但每次都出现在正确位置。",
      "“他还没准备好成为救世主，”青训主管说，“但如果永远不给机会，青训就只是宣传册上的词。”主教练站在远处，没有反对，也没有点头。",
      "这个场景参考了拉玛西亚、阿贾克斯和南安普顿式的青训路线：年轻球员便宜，但代价是波动和耐心。"
    ],
    prompt: "你给陈野一线队合同和替补名额，还是花 650 万签下已有成年队经验的罗钧？"
  },
  recruit_default: {
    title: "球探会议室：三份录像，三种未来",
    terms: ["球探", "转会", "工资结构"],
    body: [
      "投影幕上依次播放三段录像：成名老将的一脚凌空、年轻球员在低级别联赛的冲刺、租借球员在体系里的无球跑动。",
      "球探主管说老将能立刻卖球衣，年轻人可能升值，租借最便宜但留不住。财务主管补了一句：“每一种便宜，都有它的隐藏价格。”",
      "这个母题来自皇马巨星战略、布莱顿球探模型和中小球队租借补强的现实选择。"
    ],
    prompt: "韩拓、罗钧和顾南的合同条件都在桌上。你签谁？"
  },
  star_new_veteran: {
    title: "停车场边：新援的工资传到了队长耳朵里",
    terms: ["核心", "续约", "工资结构"],
    body: [
      "成名老将亮相发布会刚结束，队长林骁的经纪人就等在停车场边。他没有寒暄，只把一张纸递给你：上面列着新援工资、出场奖金和肖像权条款。",
      "“林骁在这里踢了九年，”经纪人说，“如果刚来的人都能拿这个数，你们准备怎么解释核心的价值？”远处，林骁坐在车里，没有下车。",
      "这个场景参考了巴黎式巨星权力结构和拜仁式工资纪律之间的冲突。"
    ],
    prompt: "你让林骁追平新援顶薪，还是维持他的原合同并取消首发特权扩张？"
  },
  star_support_rebuild: {
    title: "训练场夜灯下：核心没有先谈钱",
    terms: ["核心", "青训", "战术"],
    body: [
      "训练结束后，林骁没有立刻离开。他指着远处还在加练的年轻球员说：“如果你们真要重建，我可以留下来。但不要今年说青训，明年又买一堆老将。”",
      "他说话很慢，像是在给你机会，也像是在给自己找理由相信这支球队。你意识到，核心球员要的不只是工资，还有他是否愿意把最后几年交给你的路线。",
      "这个母题参考了皇马与 C 罗的时代切换，也参考了许多球队围绕老核心转型时的艰难谈判。"
    ],
    prompt: "你把林骁写进重建计划并设置目标奖金，还是接受 1600 万报价让他离队争冠？"
  },
  star_default: {
    title: "经纪人办公室：传奇不是免费的",
    terms: ["核心", "续约", "工资结构"],
    body: [
      "经纪人办公室里开着空调，桌面上却放着一杯已经凉掉的咖啡。林骁的代表提出涨薪、签字费和战术核心地位，语气并不激烈，但每一句都很硬。",
      "你知道球迷喜欢他，也知道球队过去几年太依赖他。留下他会稳定很多东西，也会让未来继续围绕他转；放走他会拿回空间，也会像切断一段球队记忆。",
      "这个场景参考了梅西离开巴萨、C 罗离开皇马以及豪门处理队史核心时的不同路径。"
    ],
    prompt: "经纪人等你对四份方案表态：续约、履行旧约、短期补充协议，还是立即出售？"
  },
  coach_youth: {
    title: "战术分析室：青年队教练拿着同一套训练图",
    terms: ["青训", "战术", "更衣室"],
    body: [
      "青年队教练把 U19 和一线队的跑位图叠在一起。两张图并不完全吻合，但你能看出他一直试图让梯队和一线队说同一种足球语言。",
      "主教练组有人担心经验，青训主管则说：“如果我们总说年轻人要有通道，那教练也一样。”这不是单纯换一个人，而是决定俱乐部上下是否真的统一路线。",
      "这个母题来自阿贾克斯、巴萨和许多强调统一打法的俱乐部。"
    ],
    prompt: "你立即任命赵恺为主教练，还是保留现任主帅并让赵恺先担任助教？"
  },
  coach_default: {
    title: "战术会议：稳定和上限站在白板两边",
    terms: ["战术", "更衣室", "主席"],
    body: [
      "现任主教练坐在白板左侧，名帅候选人的资料夹放在右侧。一个熟悉球队但上限有限，一个能带来新打法但需要时间和预算。",
      "主席问得很直接：“如果换帅，你能保证更好吗？”你不能。主教练也知道你不能。他只是看着白板，没有说话。",
      "这个场景参考了曼联后弗格森时代的反复换帅，也参考了曼城围绕瓜迪奥拉重构整个足球部门的路线。"
    ],
    prompt: "你支付换帅成本请顾维、补强现任教练组，还是内部提拔赵恺？"
  },
  sponsor_cash_tight: {
    title: "主场包厢：缺钱时，赞助商说话更大声",
    terms: ["赞助", "主场", "董事会"],
    body: [
      "商务总监把你带进主场包厢，大型赞助商的代表已经坐在窗边。他看着空荡荡的看台说：“钱可以今天到账，但我们要更多看台权益，也要更多球员出席商业活动。”",
      "你明白对方为什么敢这样开价。现金紧张时，谈判桌会变长，而你坐的位置会变低。",
      "这个母题来自商业资本进入足球后，赞助、命名权和球迷身份之间的冲突。"
    ],
    prompt: "你交出看台命名和两场球员活动换取 1500 万，还是拒签并冻结非必要开支？"
  },
  sponsor_default: {
    title: "三份赞助合同：钱、城市和未来曝光",
    terms: ["赞助", "主场", "青训"],
    body: [
      "桌上有三份合同。最大的一份给钱最多，但要改看台命名；本地企业的钱少，却愿意支持青训和社区；第三份则是先等等，赌成绩出来后谈更高价格。",
      "商务总监只看现金，球迷代表只看主场名字，青训主管盯着本地企业那一栏。你忽然发现，赞助买走的不只是广告位，还有俱乐部怎样讲述自己的权利。",
      "这个母题参考了曼联球迷抗议、巴萨身份叙事和欧洲超级联赛风波。"
    ],
    prompt: "三份方案的现金和权益边界都已列明。你签大型赞助、本地联合赞助，还是暂缓两个月？"
  },
  locker_star_power: {
    title: "更衣室门外：一句采访变成了头条",
    terms: ["更衣室", "核心", "战术"],
    body: [
      "替补球员那句“有些人不训练也能首发”被剪成短视频，十分钟后就上了本地体育号头条。主教练要求你公开支持纪律，队长希望你别让事情闹大。",
      "你站在更衣室门外，听见里面突然安静下来。足球队不是公司群聊，球员每天要一起训练、一起输赢，裂痕不会因为公告消失。",
      "这个母题来自豪门更衣室权力、替补上升通道和球星特权之间的长期矛盾。"
    ],
    prompt: "你发布纪律声明、让队长组重订规则，还是保留球星特权并把抱怨者挂牌？"
  },
  locker_default: {
    title: "热身赛名单：替补第一次把不满说出口",
    terms: ["更衣室", "战术", "阵容厚度"],
    body: [
      "热身赛名单贴出来后，一名替补没有像平时一样离开。他问助理教练：“如果我训练再好也没机会，那我还要怎么证明自己？”",
      "主教练希望你站出来维护权威，队长则建议私下谈。你知道这件事不大，但更衣室里很多大问题，最开始都只是这样一句话。",
      "这个母题来自教练权威、球员信任和替补角色管理。"
    ],
    prompt: "你公开确认教练的名单权，还是让队长组先与替补确认未来三场轮换计划？"
  },
  injury_depth_test: {
    title: "队医办公室：有厚度时，轮换才是真选择",
    terms: ["阵容厚度", "战术", "客场"],
    body: [
      "队医把主力后腰的疲劳数据投到屏幕上，黄色警报闪了两次。助理教练说替补训练状态不错，主教练却担心临场默契下降。",
      "你第一次真正感到阵容厚度的意义：它不是名单上多几个人，而是在风险出现时，球队有没有资格不硬扛。",
      "这个母题来自密集赛程里强队轮换和中小球队硬拼主力的差异。"
    ],
    prompt: "你让后腰休战并购买专项恢复服务，还是让他首发 60 分钟继续磨合？"
  },
  injury_default: {
    title: "恢复室：疲劳不会自己消失",
    terms: ["阵容厚度", "战术", "核心"],
    body: [
      "恢复室里，主力后腰把冰袋压在大腿上，核心林骁也比平时更早结束训练。队医建议减负，教练组却担心最后一场热身赛踢不出状态。",
      "你知道伤病像天气一样有随机性，但它也常常从这些小选择里长出来：多踢十分钟，少休一天，少花一笔恢复预算。",
      "这个母题参考了利物浦 2020-21 伤病潮和现代高强度赛程下的轮换管理。"
    ],
    prompt: "你组建赛季医疗小组、让两名主力休战恢复，还是维持全主力训练和比赛？"
  },
  home_commercial_cold: {
    title: "主场入口：广告牌亮了，看台却沉了一点",
    terms: ["主场", "赞助", "球迷"],
    body: [
      "联赛首轮前，主场入口换上了新的商业看台名。广告屏比过去更亮，但老球迷协会的横幅少了一条。",
      "运营主管说赞助商活动必须保证，球迷代表则问你：“第一场主场，普通球迷到底还在不在画面里？”球员热身时，也能感觉到看台的气氛有些迟疑。",
      "这个母题来自商业化主场和传统球迷身份之间的冲突。"
    ],
    prompt: "你拿出 260 万恢复公益票和看台展示，还是执行赞助商首战套餐收取 260 万？"
  },
  home_default: {
    title: "联赛首轮：岚城体育场重新开灯",
    terms: ["主场", "赞助", "战术"],
    body: [
      "傍晚六点，岚城体育场的灯一排排亮起来。北原竞技已经开始热身，他们的防线强硬，门将练习扑救时故意把每一次倒地都做得很夸张。",
      "运营主管问你要不要做球迷动员日，商务总监提醒包厢还有赞助商。你站在球员通道口，忽然意识到主场不是背景板，它会影响球员第一脚触球时的心跳。",
      "这个母题来自安菲尔德、威斯特法伦和许多强主场球队对心理优势的塑造。"
    ],
    prompt: "你举办球迷日、出售企业活动套餐，还是完全按常规方案办赛？"
  },
  away_fatigue: {
    title: "客场酒店：三天后的腿不会说谎",
    terms: ["客场", "阵容厚度", "战术"],
    body: [
      "江湾城酒店的会议室很小，体能教练把恢复数据贴在投影上。几名主力的指标低于安全线，窗外却已经能看到对手球迷在街边唱歌。",
      "主教练想延续首发保持连贯性，队医建议大轮换。你知道客场比赛从来不只是 90 分钟，它从旅途、睡眠和疲劳里就已经开始了。",
      "这个母题来自欧战客场、密集赛程和短恢复周期下的轮换选择。"
    ],
    prompt: "恢复数据已经低于安全线。你更换 5 名首发，还是沿用主场阵容？"
  },
  away_default: {
    title: "第一次客场：陌生球场没有人等你适应",
    terms: ["客场", "战术", "阵容厚度"],
    body: [
      "江湾城的球场更窄，草皮也比岚城体育场硬。对手年轻、跑动多，赛前热身时就不断向你们半场冲刺，像是在提前告诉你这场比赛的节奏。",
      "领队问是否提高后勤规格，体能教练建议谨慎轮换，主教练则还在考虑能不能延续主场首发。你发现，客场的每个小安排都会被比赛放大。",
      "这个母题来自长途旅行、客场心理压力和赛程管理。"
    ],
    prompt: "基础差旅已经支付。你升级后勤、维持普通出行，还是通过轮换或延续首发调整比赛投入？"
  }
};

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
    "seasonProgress",
    "clubDossier",
    "eventSpeaker",
    "eventMeta",
    "eventTitle",
    "eventScene",
    "eventPrompt",
    "eventContext",
    "choiceList",
    "historyList",
    "feedbackScene",
    "matchReport",
    "restartBtn",
    "exportBtn",
    "resultTitle",
    "resultSummary",
    "epilogueScene",
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
  app.prologueIndex = 0;

  els.startScreen.classList.add("hidden");
  els.resultScreen.classList.add("hidden");
  els.gameScreen.classList.remove("hidden");
  els.clubTitle.textContent = `${app.teamName}｜${app.managerName}`;

  renderPrologue();
}

function renderPrologue() {
  const scenes = app.data.prologue || [];
  if (app.prologueIndex >= scenes.length) {
    renderStage();
    return;
  }

  els.matchReport.classList.add("hidden");
  els.matchReport.innerHTML = "";
  els.feedbackScene.classList.add("hidden");
  els.feedbackScene.innerHTML = "";
  renderFinance();
  renderDossier();
  renderStats();
  renderTags();
  renderHistory();
  renderSeasonProgress(0, true);

  const scene = scenes[app.prologueIndex];
  els.stageCounter.textContent = `序章 ${app.prologueIndex + 1} / ${scenes.length}`;
  els.stageTitle.textContent = "上任第一天";
  els.eventSpeaker.textContent = scene.speaker || "旁白";
  els.eventMeta.textContent = `${scene.date || "7月1日"}｜${scene.location || "岚城"}`;
  els.eventTitle.textContent = scene.title;
  renderSceneBody(scene.body || [scene.text || ""]);
  els.eventPrompt.textContent = scene.prompt || "";
  renderGlossary(scene.terms || inferTerms(`${scene.title} ${(scene.body || []).join(" ")}`), []);

  els.choiceList.innerHTML = "";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice-card continue-card";
  button.innerHTML = `<strong>${app.prologueIndex >= scenes.length - 1 ? "进入第一阶段" : "继续"}</strong><span class="cost">剧情推进</span>`;
  button.addEventListener("click", () => {
    app.prologueIndex += 1;
    renderPrologue();
  });
  els.choiceList.appendChild(button);
}

function renderStage() {
  if (app.stageIndex >= app.data.stages.length) {
    showResult();
    return;
  }

  els.matchReport.classList.add("hidden");
  els.matchReport.innerHTML = "";
  els.feedbackScene.classList.add("hidden");
  els.feedbackScene.innerHTML = "";

  const stage = app.data.stages[app.stageIndex];
  processDuePayables(stage.id);
  app.currentEvent = selectEvent(stage.eventPool);
  const stageMeta = getStageMeta(stage.id);
  const narrative = getEventNarrative(app.currentEvent, stage);

  els.stageCounter.textContent = `${stageMeta.date}｜阶段 ${stage.id} / ${app.data.stages.length}`;
  els.stageTitle.textContent = stage.title;
  els.eventSpeaker.textContent = app.currentEvent.speaker || "俱乐部";
  els.eventMeta.textContent = `${stageMeta.location}｜${stageMeta.phase}`;
  els.eventTitle.textContent = narrative.title;
  renderSceneBody(narrative.body);
  els.eventPrompt.textContent = narrative.prompt;
  renderEventContext(app.currentEvent, narrative);

  renderFinance();
  renderDossier();
  renderStats();
  renderTags();
  renderHistory();
  renderSeasonProgress(stage.id, false);
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
  els.clubDossier.classList.add("hidden");
}

function renderEventContext(event, narrative) {
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

  renderGlossary(narrative.terms || inferTerms(`${narrative.title} ${narrative.body.join(" ")}`), lines);
}

function renderSceneBody(paragraphs) {
  els.eventScene.innerHTML = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderGlossary(terms, contextLines) {
  const termNotes = (terms || [])
    .map((term) => TERM_NOTES[term] ? { term, text: TERM_NOTES[term] } : null)
    .filter(Boolean);
  const contextHtml = contextLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const termsHtml = termNotes.length
    ? `<div class="term-box"><strong>背景提示</strong>${termNotes.map((item) => `<p><b>${escapeHtml(item.term)}</b>：${escapeHtml(item.text)}</p>`).join("")}</div>`
    : "";
  els.eventContext.innerHTML = `${contextHtml}${termsHtml}`;
}

function renderSeasonProgress(activeStageId, isPrologue) {
  const stages = getSeasonTimeline();
  els.seasonProgress.innerHTML = stages.map((stage) => {
    const active = !isPrologue && stage.id === activeStageId ? "active" : "";
    const done = !isPrologue && stage.id < activeStageId ? "done" : "";
    return `
      <span class="${active} ${done}">
        <b>${stage.id}</b>
        <i>${escapeHtml(stage.short)}</i>
      </span>
    `;
  }).join("");
}

function getSeasonTimeline() {
  return [
    { id: 1, short: "上任", date: "7月1日", phase: "上任第一天", location: "主席办公室" },
    { id: 2, short: "预算", date: "7月5日", phase: "季前预算会", location: "财务会议室" },
    { id: 3, short: "球员", date: "7月12日", phase: "转会窗口", location: "球探会议室" },
    { id: 4, short: "核心", date: "7月18日", phase: "续约谈判", location: "训练基地二楼" },
    { id: 5, short: "教练", date: "7月25日", phase: "战术路线会", location: "战术分析室" },
    { id: 6, short: "赞助", date: "8月1日", phase: "商务谈判", location: "主场包厢" },
    { id: 7, short: "更衣室", date: "8月8日", phase: "热身赛前", location: "更衣室走廊" },
    { id: 8, short: "伤病", date: "8月15日", phase: "医疗报告", location: "队医办公室" },
    { id: 9, short: "主场", date: "8月26日", phase: "联赛首轮", location: "岚城体育场" },
    { id: 10, short: "客场", date: "9月2日", phase: "第一次客场", location: "江湾城酒店" }
  ];
}

function getStageMeta(stageId) {
  return getSeasonTimeline().find((stage) => stage.id === stageId) || getSeasonTimeline()[0];
}

function getEventNarrative(event, stage) {
  const stageMeta = getStageMeta(stage.id);
  const override = EVENT_NARRATIVES[event.id];
  if (override) {
    return {
      title: override.title || event.title,
      body: override.body,
      prompt: override.prompt || event.prompt,
      terms: override.terms || inferTerms(`${override.title || event.title} ${override.body.join(" ")}`),
      caseRef: override.caseRef
    };
  }
  return {
    title: event.title,
    body: [
      `${stageMeta.location}里，${event.speaker || "俱乐部工作人员"}把这件事摆到你面前。`,
      event.scene,
      "你能感觉到，这不是一道选择题，而是一个会被球员、球迷、董事会和媒体同时记住的决定。"
    ],
    prompt: event.prompt,
    terms: inferTerms(`${event.title} ${event.scene} ${event.prompt}`)
  };
}

function inferTerms(text) {
  return Object.keys(TERM_NOTES).filter((term) => text.includes(term)).slice(0, 3);
}

function renderChoiceFeedback(choice, stage, onContinue) {
  const feedback = buildChoiceAfterScene(choice, stage);
  els.feedbackScene.classList.remove("hidden");
  els.feedbackScene.innerHTML = `
    <p class="eyebrow">${escapeHtml(feedback.date)}｜选择后的回声</p>
    <h3>${escapeHtml(feedback.title)}</h3>
    ${feedback.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
  `;
  els.choiceList.innerHTML = "";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice-card continue-card";
  button.innerHTML = `<strong>${choice.matchPlan ? "前往比赛日" : "进入下一阶段"}</strong><span class="cost">剧情继续</span>`;
  button.addEventListener("click", onContinue);
  els.choiceList.appendChild(button);
  renderFinance();
  renderStats();
  renderTags();
  renderHistory();
}

function buildChoiceAfterScene(choice, stage) {
  const stageMeta = getStageMeta(stage.id);
  const effects = choice.effects || {};
  const parts = [];
  const finance = effects.finance || {};
  const ops = effects.operations || {};
  const pitch = effects.pitch || {};

  if (choice.afterScene) {
    parts.push(choice.afterScene);
  } else if (choice.action) {
    parts.push(`你在会议纪要上确认了决定：${choice.action} 从签字这一刻起，这不再是一句态度，而是俱乐部必须执行的安排。`);
  }

  if (finance.cash < 0) {
    parts.push(`财务主管在付款单上盖章时停顿了一下：“这笔 ${Math.abs(finance.cash)} 万会马上出去，后面的空间会变窄。”你听见打印机吐出新的现金表，纸张边缘还带着热。`);
  } else if (finance.cash > 0) {
    parts.push(`财务主管确认，${finance.cash} 万将按刚刚签下的协议进入账户。办公室里的气氛松了一点，但合同里换出去的权益、球员或成绩承诺也从这一刻开始生效。`);
  } else {
    parts.push("账面现金没有变化，但会议室里的气氛变了。有人觉得你守住了原则，也有人觉得你只是把问题推迟到了下一次谈判。");
  }

  if (ops["球迷信任"] > 0 || ops["社区连接"] > 0) {
    parts.push("傍晚的球迷论坛里，有人开始转发你的决定。有人认可路线终于说清楚了，也有人提醒其他人：真正的评价要等承诺兑现以后再做。");
  }
  if (ops["球迷信任"] < 0 || ops["社区连接"] < 0) {
    parts.push("看台老球迷的群聊很快热闹起来。有人问：岚城联是不是又一次把球迷的感受放在了最后？");
  }
  if (ops["队内权力平衡"] < 0 || pitch["更衣室凝聚力"] < 0) {
    parts.push("训练结束后，更衣室门关得比平时更快。几个替补没有立刻离开，他们低声谈着新秩序，也谈着自己在这支球队里的位置。");
  }
  if (ops["俱乐部文化"] > 0 || pitch["心理稳定性"] > 0) {
    parts.push("主教练在白板前多停了几秒。他没有夸你，但他把新的训练计划留在桌上，那像是一种谨慎的认可。");
  }
  if (pitch["体能健康"] < 0 || effects.flags?.injuryRisk) {
    parts.push("队医把恢复数据放到你面前，红色标记比昨天更多。你忽然明白，足球里的冒险经常不是在比赛日才开始。");
  }
  if (effects.flags?.signedVeteran || effects.tags?.includes("巨星依赖型")) {
    parts.push("球迷商店开始准备新球衣，商务总监第一次笑得很轻松。可停车场另一头，队长林骁的经纪人已经在等电话。");
  }
  if (effects.flags?.coreStarInTeam === false) {
    parts.push("林骁离开训练基地时没有接受采访。门口有孩子举着他的旧海报，你一时不知道该看向他们，还是看向账户上刚回来的钱。");
  }

  if (parts.length < 3) {
    parts.push("你把选择记录进经理日志。它看起来只是一行字，但从这一刻开始，下一间会议室、下一次训练、下一场比赛都会带着它的影子。");
  }

  return {
    date: stageMeta.date,
    title: `${choice.label}之后`,
    body: parts.slice(0, 4)
  };
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
      ${choice.action ? `<p class="choice-explanation"><b>你会做什么：</b>${escapeHtml(choice.action)}</p>` : ""}
      ${choice.priceBasis ? `<p class="choice-explanation"><b>金额怎么来：</b>${escapeHtml(choice.priceBasis)}</p>` : ""}
      <p class="choice-explanation"><b>代价与收益：</b>${escapeHtml(choice.hint || "低波动处理，但仍会影响后续关系。")}</p>
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

  renderChoiceFeedback(choice, stage, () => {
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
  });
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

  const matchStats = Object.keys(rule.weights);
  const strong = topStat(app.state.pitch, true, matchStats);
  const weak = topStat(app.state.pitch, false, matchStats);
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
  els.resultSummary.textContent = `${app.managerName}经营出的球队已经完成赛季前 10 个阶段。下面先是尾声剧情，最后的数据码用于交给老师进入联赛模拟。`;
  renderEpilogue(exportData);
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

function renderEpilogue(exportData) {
  const paragraphs = buildEpilogueParagraphs(exportData);
  els.epilogueScene.innerHTML = `
    <p class="eyebrow">Epilogue</p>
    <h2>办公室里的三样东西</h2>
    ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
  `;
}

function buildEpilogueParagraphs(exportData) {
  const tags = new Set(exportData.tags || []);
  const flags = exportData.flags || {};
  const reports = exportData.matchReports || [];
  const home = flags.homeResult || "未定";
  const away = flags.awayResult || "未定";
  const paragraphs = [
    "第一次客场结束后的晚上，你回到岚城联办公室。桌上放着三样东西：主场首战的剪报、董事会秘书发来的会议提醒、还有一张被折过的训练基地通行证。",
    `窗外的体育场已经关灯，但手机屏幕还亮着。球迷论坛在讨论 ${home} 和 ${away} 这两个结果，也在讨论这支球队到底是不是变了。你知道，真正的赛季才刚刚开始。`
  ];

  if (flags.coreStarInTeam === false) {
    paragraphs.push("林骁的旧海报还贴在球迷商店门口。有人说你够果断，有人说你切断了球队最后一点记忆。你没有立刻回应，因为下一次训练名单会比任何声明都更有说服力。");
  } else if (tags.has("核心续约型") || tags.has("高薪双核型")) {
    paragraphs.push("林骁还在队里，球迷因此松了一口气。但工资结构像一根被重新拉紧的弦，下一位主力谈合同时一定会看着这份合同说话。");
  } else {
    paragraphs.push("林骁没有把话说死。你能感觉到，他还在观察这条路线是否值得相信。核心球员的沉默，有时候比公开表态更重。");
  }

  if (tags.has("青训重建型") || tags.has("青训提拔型") || tags.has("青训教练型")) {
    paragraphs.push("青训基地那边，几个孩子开始模仿一线队的训练动作。青训主管给你发来一段视频，没有配字，但你看得懂：这条路不会立刻赢球，却会慢慢改变球队的底色。");
  }
  if (tags.has("商业冲刺型")) {
    paragraphs.push("新的赞助广告已经挂上主场外墙。商务总监说曝光数据很好，球迷代表却只发来一句话：别让岚城联变成一块漂亮的广告牌。");
  }
  if (tags.has("名帅改造型")) {
    paragraphs.push("新教练的训练强度比过去高得多。年轻球员兴奋，老队员皱眉，战术板上多了很多箭头。你知道，这种改造要么成为新秩序，要么成为新的混乱。");
  }
  if (tags.has("赛季承压型")) {
    paragraphs.push("输球带来的声音已经进入董事会。没有人现在就要你下课，但每个人都开始计算，耐心还剩多少。");
  } else if (tags.has("主场强势型") || tags.has("客场抢分型")) {
    paragraphs.push("至少有一个夜晚，球队让球迷相信这条路能踢出结果。胜利不会解决所有问题，但它能让你多得到一点时间。");
  }

  const strong = topStat(exportData.pitch, true);
  const weak = topStat(exportData.pitch, false);
  paragraphs.push(`你最后翻开球队状态表。最亮的地方是“${strong[0]}”，最刺眼的地方是“${weak[0]}”。这不是结局，而是你亲手带出的球队画像。下一次课上，它会和另外十四支球队一起进入真正的联赛。`);

  if (reports.length) {
    paragraphs.push(`赛后报道里写着：${reports.map((report) => `${report.opponent}${report.resultText}`).join("，")}。纸面结果只有几个字，但你知道每个字后面都藏着预算会、训练场、谈判桌和更衣室里的选择。`);
  }

  return paragraphs;
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

function topStat(stats, high, keys = Object.keys(stats)) {
  return Object.entries(stats)
    .filter(([key]) => keys.includes(key))
    .sort((a, b) => (high ? b[1] - a[1] : a[1] - b[1]))[0];
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
