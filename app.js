const BUILD_VERSION = "two-year-16";
const SAVE_SCHEMA_VERSION = 3;
const SAVE_CONTEXT = (new URLSearchParams(window.location.search).get("save") || "default")
  .replace(/[^a-zA-Z0-9_-]/g, "-")
  .slice(0, 48) || "default";
const SAVE_KEY = `lancheng-season-v3-${SAVE_CONTEXT}`;
const LEGACY_SAVE_KEY = "lancheng-season-v2";
const FOCUS_MODE_KEY = "lancheng-story-focus";
const PROACTIVE_INQUIRY_LIMIT = 4;
const STRENGTH_DIMENSIONS = [
  { key: "attack", label: "进攻威胁", short: "进攻", description: "创造射门、向前推进和落后时追分的能力" },
  { key: "defense", label: "防守稳固", short: "防守", description: "限制机会、保护禁区和处理反击的能力" },
  { key: "fitness", label: "体能储备", short: "体能", description: "维持强度并应对密集赛程的能力" },
  { key: "cohesion", label: "战术默契", short: "默契", description: "球员彼此预判、补位和共同执行的能力" },
  { key: "morale", label: "比赛信念", short: "士气", description: "失误或落后后仍敢执行决定的程度" },
  { key: "squadDepth", label: "阵容深度", short: "深度", description: "轮换、伤病替代和后半场换人的余地" }
];
const SUPPORT_DIMENSIONS = [
  { key: "coachAuthority", label: "教练权威", description: "影响比赛计划能否被稳定执行" },
  { key: "dressingRoom", label: "更衣室", description: "影响协作、报伤与共同承担失误" },
  { key: "medicalIntegrity", label: "医疗保障", description: "影响伤病预防与可用阵容" },
  { key: "academyPathway", label: "青训通道", description: "影响长期补员与年轻球员成长" },
  { key: "fanTrust", label: "球迷信任", description: "影响主场压力与球队身份认同" },
  { key: "boardBacking", label: "董事会支持", description: "影响资源稳定和外界目标压力" }
];
const FINANCE_DIMENSIONS = {
  cash: "可动用现金",
  wageCommitment: "年度工资承诺",
  transferInstallments: "转会分期",
  restrictedCash: "受限资金"
};

const BOARD_DISMISSAL_THRESHOLD = 20;
const BOARD_TRUST_DECISION_DELTAS = {
  board_mandate: 6, club_charter: -2, sporting_control: -5,
  liquidity_first: 2, first_team_push: 3, build_capacity: -1,
  back_he: 1, pressing_identity: 2, shared_principles: 0,
  sell_captain: 4, renew_captain: 1, last_dance: -2,
  full_naming: 5, hybrid_naming: 1, supporter_bond: -3,
  back_coach: -3, hire_gu: 5, three_game_review: 0,
  medical_veto: -2, informed_choice: 0, play_and_shoot: 2,
  sell_chen: 3, shareholder_loan: 4, hold_course: -1,
  bonus_push: 4, quiet_process: 0, identity_runin: -2,
  institutionalize: 2, personal_project: 5, leave_record: -3
};

const FREE_AGENT_POOL = [
  { id: "fa_cb", name: "马蒂亚斯·科斯塔", age: 28, position: "中卫", profile: "正面防守、制空和保护禁区", warning: "转身速度一般，需要身边有人保护大空间", fee: 760, wage: 260, pitch: { defense: 5, squadDepth: 3 }, operations: { dressingRoom: -1 } },
  { id: "fa_dm", name: "阿列克谢·米罗夫", age: 30, position: "后腰", profile: "抢断后的第一脚向前传球", warning: "要求立即成为主力，可能压缩年轻球员时间", fee: 920, wage: 340, pitch: { defense: 2, cohesion: 4 }, operations: { academyPathway: -2 } },
  { id: "fa_st", name: "迭戈·巴雷拉", age: 27, position: "前锋", profile: "禁区跑位和把半次机会变成射门", warning: "过去两年换过三支球队，更衣室适应存在风险", fee: 1280, wage: 480, pitch: { attack: 7, squadDepth: 2 }, operations: { dressingRoom: -4 } },
  { id: "fa_wb", name: "林启昊", age: 25, position: "边后卫", profile: "连续上下冲刺，可覆盖两个边路位置", warning: "防守站位需要教练额外校正", fee: 540, wage: 210, pitch: { fitness: 4, squadDepth: 5, defense: -1 }, operations: {} },
  { id: "fa_gk", name: "安德烈·佩雷斯", age: 32, position: "门将", profile: "近距离反应和指挥年轻防线", warning: "脚下出球会限制高位推进", fee: 680, wage: 290, pitch: { defense: 4, cohesion: 2, attack: -1 }, operations: { coachAuthority: 1 } },
  { id: "fa_am", name: "赵闻笙", age: 24, position: "前腰", profile: "在密集防守前接球转身、制造最后一传", warning: "无球防守投入不稳定", fee: 1500, wage: 520, pitch: { attack: 7, cohesion: 2, fitness: -2 }, operations: {} }
];

const SECOND_SEASON_LEGACIES = {
  first_team_push: { round: 0, title: "高薪新援的第二张工资单", text: "上赛季迅速补强的主力仍然好用，但更衣室已经把他的奖金当成所有续约谈判的新起点。", pitch: { attack: 2, defense: 2, morale: -4 }, operations: { dressingRoom: -6 }, boardTrust: -2 },
  build_capacity: { round: 0, title: "去年没有发生的伤病变成了今年的可用阵容", text: "康复和数据团队完整工作了一个夏天，季前名单第一次没有因为旧伤临时删人。", pitch: { fitness: 5, squadDepth: 3 }, operations: { medicalIntegrity: 4 }, boardTrust: 2 },
  liquidity_first: { round: 1, title: "没有花掉的现金终于获得第二次选择", text: "上赛季保留下来的现金缓冲让俱乐部不必在十一月接受第一份报价。", finance: { cash: 450 }, operations: { boardBacking: 2 }, boardTrust: 3 },
  hire_gu: { round: 0, title: "新教练的成功仍站在旧教练的影子里", text: "高竞的训练强度提高了，但老教练离开的方式仍让一部分球员和球迷拒绝把进步全部算在你名下。", pitch: { attack: 3, morale: -3 }, operations: { fanTrust: -5, dressingRoom: -4 }, boardTrust: 1 },
  full_naming: { round: 1, title: "看台商业合同进入续约年", text: "赞助款按时到账，低价季票续订却明显下降；同一块看台同时带来现金和沉默。", finance: { cash: 500 }, operations: { fanTrust: -7, commercialCapacity: 4 }, boardTrust: -3 },
  hybrid_naming: { round: 1, title: "麻烦的联合名称开始产生耐心", text: "赞助商和球迷仍然争吵，但合同迫使双方继续坐在同一张桌前。", finance: { cash: 260 }, operations: { fanTrust: 4, commercialCapacity: 2 }, boardTrust: 1 },
  play_and_shoot: { round: 0, title: "那条被批准冒险的腿又疼了", text: "上赛季签过知情书的球员在季前再次停训；其他球员记得最后签字的人是谁。", pitch: { attack: -5, fitness: -5, squadDepth: -3 }, operations: { medicalIntegrity: -5, dressingRoom: -3 }, boardTrust: -5 },
  shareholder_loan: { round: 2, title: "股东借款在第二年变成否决权", text: "旧借款进入偿付窗口，周绍庭要求先看冬窗名单，再决定是否展期。", finance: { cash: -800 }, operations: { boardBacking: 5, coachAuthority: -3 }, boardTrust: -6 },
  sell_chen: { round: 2, title: "青训孩子学会了先问离队路线", text: "程野在外面获得比赛，留下的年轻人却把租借和出售看成得到机会的唯一办法。", pitch: { squadDepth: -2, morale: -2 }, operations: { academyPathway: -6 }, boardTrust: -1 },
  institutionalize: { round: 3, title: "制度第一次在连败时保护了坏消息", text: "足球委员会没有替你赢球，却阻止董事会在一周内发出三套互相矛盾的命令。", pitch: { cohesion: 4, morale: 2 }, operations: { boardBacking: 3, coachAuthority: 3 }, boardTrust: 5 },
  personal_project: { round: 3, title: "所有成功和错误都只剩一个名字", text: "更大的授权让调整更快；当球队连续失分时，董事会也不再接受任何程序性解释。", pitch: { attack: 3 }, operations: { fanTrust: -4 }, boardTrust: -4 }
};

const SECOND_SEASON_ROUNDS = [
  {
    id: "s2r1", date: "第二年 · 8月", title: "新赛季第一天，旧合同先到了", location: "一线队训练场", background: "training_ground_afternoon", character: "$coach", expression: "$coach_focus",
    speaker: "主教练", body: "第一年留下的球员、工资和伤病都在这份名单里。新赛季不是重新开档。",
    match: { label: "第二赛季开局三轮", opponent: "开局对手群", difficulty: 59, stakes: "第一年的建队选择能否经受第二次季前准备", count: 3 },
    choices: [
      { id: "s2_integrate", label: "先修复角色和工资秩序", line: "新援是否主力由训练决定；所有奖金结构重新对全队解释。", effects: { pitch: { cohesion: 5, morale: 3 }, operations: { dressingRoom: 5 }, finance: { cash: -220 } }, boardTrust: -1 },
      { id: "s2_accelerate", label: "继续围绕最强球员加速", line: "不为照顾旧秩序减速。最好的球员先拿到最清楚的资源。", effects: { pitch: { attack: 5, defense: 2, morale: -3 }, operations: { dressingRoom: -4 } }, boardTrust: 3 },
      { id: "s2_youth_mix", label: "强制加入两名青训轮换", line: "每份比赛名单留两个位置给年轻人，代价由我向董事会解释。", effects: { pitch: { squadDepth: 5, cohesion: -2 }, operations: { academyPathway: 6 }, finance: { cash: -120 } }, boardTrust: -2 }
    ]
  },
  {
    id: "s2r2", date: "第二年 · 11月", title: "董事会问的不是排名，是还能等多久", location: "董事会议室", background: "boardroom_morning", character: "shen", expression: "stern",
    speaker: "周绍庭", body: "第一年的故事已经讲完了。现在给我一个期限，以及期限到了以后谁负责。",
    match: { label: "冬前关键三轮", opponent: "北方赛区对手群", difficulty: 62, stakes: "董事会耐心和球队稳定同时进入倒计时", count: 3 },
    choices: [
      { id: "s2_public_target", label: "公开六轮积分目标", line: "六轮拿十一分。做不到，先由我接受董事会问责。", effects: { pitch: { morale: 3 }, operations: { boardBacking: 5, coachAuthority: -2 } }, boardTrust: 6 },
      { id: "s2_private_review", label: "只做内部复核，不公开倒计时", line: "每场复盘，但不把球员每天训练变成公开生存测试。", effects: { pitch: { cohesion: 4, morale: 2 }, operations: { boardBacking: -2, dressingRoom: 3 } }, boardTrust: -2 },
      { id: "s2_sell_window", label: "承诺冬窗出售一名主力", line: "我用一笔确定出售换来本季现金安全，名单由足球部门决定。", effects: { finance: { cash: 900 }, pitch: { squadDepth: -5, morale: -3 }, operations: { boardBacking: 6 } }, boardTrust: 5 }
    ]
  },
  {
    id: "s2r3", date: "第二年 · 2月", title: "身体和现金在同一周变窄", location: "医疗与财务联席会", background: "medical_room", character: "jiang", expression: "concerned",
    speaker: "孟书宁", body: "三个人能带伤上场，账户也能付奖金。‘能’不是我今天问的问题。",
    match: { label: "冬季密集三轮", opponent: "保级与争冠混合赛程", difficulty: 64, stakes: "阵容身体、现金和排名无法同时被最大化", count: 3 },
    choices: [
      { id: "s2_protect_bodies", label: "轮休主力，接受短期失分", line: "医学红线优先。董事会要解释，我来。", effects: { pitch: { fitness: 6, squadDepth: 3, attack: -2 }, operations: { medicalIntegrity: 6 }, finance: { cash: -180 } }, boardTrust: -4 },
      { id: "s2_push_bodies", label: "核心球员连续首发", line: "这是决定赛季的位置。风险写清，但最强阵容继续上。", effects: { pitch: { attack: 5, fitness: -7, squadDepth: -4 }, operations: { medicalIntegrity: -4 } }, boardTrust: 4 },
      { id: "s2_emergency_depth", label: "支付溢价补一名轮换球员", line: "不是明星，只买能让三个位置喘气的人。", effects: { finance: { cash: -650, wageCommitment: 220 }, pitch: { squadDepth: 7, fitness: 3 } }, boardTrust: 1 }
    ]
  },
  {
    id: "s2r4", date: "第二年 · 5月", title: "两年任期只剩最后三场", location: "主场更衣室", background: "locker_room", character: "$captain", expression: "resolute",
    speaker: "队长", body: "我们记得第一年你先听了谁。现在大家只想知道，最后三场你还会不会突然变成另一个人。",
    match: { label: "两年任期最后三轮", opponent: "赛季终局对手群", difficulty: 66, stakes: "最终排名、董事会决定与两年留下的球队同时结算", count: 3 },
    choices: [
      { id: "s2_hold_identity", label: "坚持两年来的比赛原则", line: "不为最后三场发明新球队。用我们已经练会的方式结束。", effects: { pitch: { cohesion: 6, morale: 4 }, operations: { coachAuthority: 3, dressingRoom: 3 } }, boardTrust: 1 },
      { id: "s2_all_in", label: "奖金和进攻全部加码", line: "最后三场只计算结果。奖金立即翻倍，阵型向前。", effects: { finance: { cash: -500 }, pitch: { attack: 7, defense: -4, morale: 4 } }, boardTrust: 5 },
      { id: "s2_share_burden", label: "让教练、队长共同决定名单", line: "最后的责任仍是我的，但最后的办法不必只来自我。", effects: { pitch: { cohesion: 5, defense: 3 }, operations: { dressingRoom: 5, boardBacking: -2 } }, boardTrust: -1 }
    ]
  }
];

const DEFERRED_CONSEQUENCES = {
  board_mandate: { dueEpisode: 4, title: "前六目标有了市场价格", speaker: "方雯", body: ["“三家经纪人用了同一句话：既然你必须进前六，他们的球员就不是原来的价格。”", "“目标没有变，但每一次失分都开始被换算成你的剩余时间。”"], pitch: { morale: -4 }, operations: { boardBacking: -2 }, foreshadow: "发布会散场时，两名经纪人没有离开。他们站在走廊尽头，低头把同一条新闻转发给各自的球员。" },
  club_charter: { dueEpisode: 5, title: "公开的边界被人拿回来引用", speaker: "许青禾", body: ["“七月那份治理章程我打印了八千份。今天不是来求情，是来请你按自己的原话办事。”", "周绍庭没有反驳，只把原本放在桌中央的合同收回了半寸。"], operations: { fanTrust: 5, boardBacking: -3 }, foreshadow: "许青禾把治理章程折进旧季票里。她说，以后重要的不是谁记性好，而是谁留着原话。" },
  sporting_control: { dueEpisode: 6, title: "权力终于遇到一段连败", speaker: "韩立锋", body: ["“七月你说足球决定由你负责。现在董事都在门外，我只问：这句话还算不算？”", "训练场上的球员没有散开，他们在等这间办公室先确定谁说了算。"], operations: { coachAuthority: 3, boardBacking: -4 }, pitch: { cohesion: 2 }, foreshadow: "周绍庭在授权书边上画了一条很短的竖线。没人解释那是签字记号，还是以后收回权力的位置。" },
  liquidity_first: { dueEpisode: 8, title: "宿舍没有进球，却留住了三个人", speaker: "罗志衡", body: ["“冬训名单里这三个人原本都准备离开。现在他们每天能睡够七小时，不用赶末班车。”", "“一线队仍缺那个夏天没买的中卫；但青训第一次没有因为家里住得远而减员。”"], pitch: { squadDepth: 3, morale: 2 }, operations: { academyPathway: 6 }, foreshadow: "罗志衡把宿舍钥匙分成三串，却把一线队中卫名单压在最下面。两张纸都没有消失。" },
  first_team_push: { dueEpisode: 6, title: "新中卫的工资单进了更衣室", speaker: "梁一川", body: ["“没人否认他踢得好。问题是，昨晚所有人都知道了他的奖金是老合同的三倍。”", "“被清走的两个柜子还空着。需要换人时，我们才会重新看见他们。”"], pitch: { morale: -4, squadDepth: -3 }, operations: { dressingRoom: -6 }, foreshadow: "新中卫第一天把名牌放进中央柜位。有人帮他鼓掌，也有人盯着旁边两个刚被清空的柜子。" },
  build_capacity: { dueEpisode: 7, title: "一次没有发生的伤病", speaker: "孟书宁", body: ["“数据组提前四天看见了负荷异常。我们把训练减掉，那条腿今天没有出现在病历里。”", "“没有进球、没有新闻，也没有人会为一次没发生的受伤鼓掌。”"], pitch: { fitness: 5, squadDepth: 2 }, operations: { medicalIntegrity: 4 }, foreshadow: "孟书宁在新系统里建了第一份空病历。文件名只有日期，没有球员名字——她说最好永远不必填上。" },
  back_he: { dueEpisode: 6, title: "稳定的三条线也有边界", speaker: "韩立锋", body: ["“六场里我们很少被打穿，也有四场没能把比赛提速。”", "他没有请求改变方案，只把落后后的进攻回合单独剪成了一段录像。"], pitch: { defense: 3, attack: -3, cohesion: 2 }, foreshadow: "韩立锋擦掉所有高位磁块，却把一枚前锋磁块留在白板角落，没有放回盒子。" },
  pressing_identity: { dueEpisode: 6, title: "高压开始向体能讨债", speaker: "孟书宁", body: ["“前四十分钟的夺回次数上升了，七十分钟后的冲刺距离连续三周下降。”", "“这不是叫你放弃，只是身体已经开始替方案记账。”"], pitch: { attack: 3, fitness: -6 }, operations: { academyPathway: 3 }, foreshadow: "训练结束后，年轻人还在兴奋地比谁抢回的球多。两名老球员却坐在草边，多系了一次鞋带才站起来。" },
  shared_principles: { dueEpisode: 6, title: "三条原则变成了共同语言", speaker: "梁一川", body: ["“教练和年轻人仍然会争，但现在争的是哪一条原则优先，不是猜谁才有最终答案。”", "“有些反击因此慢了一拍，至少我们不再各跑各的。”"], pitch: { cohesion: 5, attack: 1 }, operations: { dressingRoom: 3 }, foreshadow: "梁一川把那三条原则抄在袖标内侧。韩立锋看见了，没有说好，也没有让他擦掉。" },
  sell_captain: { dueEpisode: 6, title: "空出来的不只是一个柜子", speaker: "装备管理员", body: ["“袖标这六周戴过三个人。每个人拿到它，第一件事都是问梁一川以前怎么做。”", "“转会款到账了，但没人能从账户里取出一次补位提醒。”"], pitch: { cohesion: -5, morale: -3 }, operations: { dressingRoom: -4 }, foreshadow: "清空梁一川柜子时，装备管理员把袖标放在长凳正中。三个人经过，没有人先伸手。" },
  renew_captain: { dueEpisode: 8, title: "角色交接没有变成驱逐", speaker: "程野", body: ["“我第一次首发失误后，是川哥让我第二次还敢要球。”", "梁一川开始坐替补席，却比以前更早到训练场。"], pitch: { cohesion: 4, morale: 4 }, operations: { dressingRoom: 4, academyPathway: 2 }, foreshadow: "梁一川签完字，把‘不保证首发’那一页单独拍了照。晚上十一点，他把照片发进了只有球员的群。" },
  last_dance: { dueEpisode: 8, title: "一月第一周真的到了", speaker: "梁一川", body: ["“我没有忘记你说亲自来找我。现在比赛少了，答案不能再藏在赛程里。”", "袖标仍在他手边，但他没有戴上。"], pitch: { morale: -3 }, operations: { coachAuthority: -2 }, foreshadow: "梁一川把一月第一周圈在手机日历里，随后把屏幕扣在桌上。" },
  full_naming: { dueEpisode: 7, title: "商业履约进入了比赛身体", speaker: "孟书宁", body: ["“合同要求主力完成拍摄，赛程要求他们完成恢复。今天这两个要求用了同一条腿。”", "东看台的标识已经完工，第十二分钟却第一次没有歌声。"], pitch: { fitness: -3, morale: -2 }, operations: { fanTrust: -7, commercialCapacity: 3 }, foreshadow: "赞助商量完最后一块灯箱，许青禾仍举着手机。录音红点在所有人离开后又亮了十二秒。" },
  hybrid_naming: { dueEpisode: 9, title: "一份麻烦的合同迫使双方继续见面", speaker: "许青禾", body: ["“我们仍会为每块广告吵，但企业票和低价票第一次出现在同一张公开表里。”", "“信任不是和解，是下次争执时还知道去哪里坐下。”"], operations: { fanTrust: 4, commercialCapacity: 2 }, pitch: { morale: 2 }, foreshadow: "合同附件有十七页。赞助代表和许青禾各自用不同颜色的笔圈出了同一个词：每季。" },
  supporter_bond: { dueEpisode: 8, title: "会员债券没有达到宣传目标", speaker: "方雯", body: ["“到账327万，不是计划里的500万。它不能替代一名大赞助商。”", "“但327万来自六千多个名字；他们现在都会问这笔钱去了哪里。”"], finance: { cash: 327 }, operations: { fanTrust: 5, commercialCapacity: -2 }, foreshadow: "第一张会员债券只有五百元。认购人要求收据上不要印自己的名字，只印东看台的座位号。" },
  hire_gu: { dueEpisode: 8, title: "新教练的速度撞上旧更衣室", speaker: "梁一川", body: ["“训练强度和向前速度都上来了。可韩教练那批老队员每天都在判断，自己是能力不够，还是已经不属于这里。”", "高竞的四人团队占用了原教练组的办公室，门牌只换了一半。"], pitch: { attack: 3, morale: -4 }, operations: { dressingRoom: -7, fanTrust: -3 }, foreshadow: "高竞进门时掌声很响。走廊另一端，韩立锋抱着纸箱经过荣誉墙，没有一个镜头转过去。" },
  back_coach: { dueEpisode: 8, title: "公开担责换来了第二次直说", speaker: "韩立锋", body: ["“我不会因为你替我挡过记者就说阵容够用。冬窗我仍要一个能向前传的中场。”", "“但这一次，我会在名单交给经纪人以前先交给你。”"], pitch: { cohesion: 3, morale: 2 }, operations: { coachAuthority: 4, dressingRoom: 3 }, foreshadow: "发布会后韩立锋没有道谢，只把一份划满红线的冬窗名单放回你桌上。名单没有经过主席办公室。" },
  three_game_review: { dueEpisode: 9, title: "倒计时结束了，生存感没有", speaker: "梁一川", body: ["“三场期限早就结束，可每次丢球后大家还是先看场边。”", "“人会记住被评估的方式，比记住评估表更久。”"], pitch: { morale: -4, cohesion: -2 }, operations: { coachAuthority: -3, dressingRoom: -3 }, foreshadow: "助教擦掉白板上的‘3’，却没擦干净。下一堂训练，仍有人抬头看那个浅灰色轮廓。" },
  medical_veto: { dueEpisode: 9, title: "一次缺席换回了完整合练", speaker: "孟书宁", body: ["“他错过了那场德比，今天完成了九十分钟合练。”", "“现在球员会在疼痛还只有三级时进来，而不是等到七级。”"], pitch: { fitness: 5, squadDepth: 3 }, operations: { medicalIntegrity: 4, dressingRoom: 2 }, foreshadow: "比赛日名单空着一个最显眼的位置。诊疗室门外却第一次有人在疼痛还不严重时排队。" },
  informed_choice: { dueEpisode: 9, title: "说不的权利开始被验证", speaker: "受伤球员", body: ["“第二次不舒服时，我在热身前就说了。奖金没有少，第二天的训练位置也还在。”", "“我现在才相信，上次那张纸不只在需要我签字时有效。”"], pitch: { morale: 3, fitness: 2 }, operations: { dressingRoom: 4, medicalIntegrity: 3 }, foreshadow: "球员签完知情书，没有马上拿走。他用拇指反复按着‘不影响奖金与位置’那一行。" },
  play_and_shoot: { dueEpisode: 8, title: "那条腿在冬天停了下来", speaker: "孟书宁", body: ["“不是三周。影像显示至少八周，恢复进度不能再拿商业日期倒推。”", "“他当时签了字；诊疗室里其他人也看见是谁最后批准。”"], pitch: { attack: -6, fitness: -10, squadDepth: -4, morale: -3 }, operations: { medicalIntegrity: -5, dressingRoom: -4 }, foreshadow: "拍摄结束时，他扶了一下栏杆，看到有人过来又立刻松手。孟书宁没有说话，只记下了时间。" },
  sell_chen: { dueEpisode: 9, title: "青训队开始计算离开的路径", speaker: "罗志衡", body: ["“程野在那里连续首发，这是好事。这里的孩子看到的却是：要获得比赛，可能必须先离开岚城。”", "“回购条款写着未来，今天的训练场只剩一件空背心。”"], pitch: { morale: -2, squadDepth: -2 }, operations: { academyPathway: -6 }, foreshadow: "程野拿走的行李很少。青年队三个孩子送他到门口，回来后都问了同一个问题：租借名单什么时候定？" },
  shareholder_loan: { dueEpisode: 10, title: "借款在董事会里有了声音", speaker: "周绍庭", body: ["“1800万还没到账，但它已经到期。下一季预算先由我看，这不是干预，是债权人的责任。”", "新中场仍在训练场送出穿透球，会议室里的否决权也同时变得更具体。"], operations: { boardBacking: 5, coachAuthority: -3 }, pitch: { morale: -2 }, foreshadow: "合影时周绍庭站在新中场旁边。方雯没有入镜，她把写着1800万的付款页翻到了五月。" },
  hold_course: { dueEpisode: 9, title: "有限轮换终于变成了可理解的路径", speaker: "程野", body: ["“我不是每场都上，但每次下场都知道下次要改什么。”", "“以前‘未来’像一句客气话。现在它至少有下一堂训练的时间。”"], pitch: { cohesion: 4, attack: 2, morale: 2 }, operations: { academyPathway: 3, dressingRoom: 2 }, foreshadow: "程野把八周计划贴在柜门内侧。第一周的首发栏仍是空的，他却先在下面写了明天训练的时间。" },
  bonus_push: { dueEpisode: 10, title: "名次把每一分钟都标上了价格", speaker: "队长", body: ["“奖金分得公平，但所有人都在算还剩几分、值多少钱。”", "“一次回传失误后，替补席安静得像已经丢掉了700万。”"], pitch: { morale: -3, cohesion: -2 }, operations: { dressingRoom: -2 }, foreshadow: "装备管理员在奖金名单上找到自己的名字后笑了。十分钟后，他也打开积分榜算了一遍还差几分。" },
  quiet_process: { dueEpisode: 10, title: "同一张复盘表熬过了输赢", speaker: "韩立锋", body: ["“五场我们没有每周换一次目标。球员终于敢在失误后继续做训练里要求的动作。”", "记者觉得这套回答无聊，更衣室却开始相信它不会突然改变。"], pitch: { cohesion: 3, morale: 2 }, operations: { coachAuthority: 3, dressingRoom: 2 }, foreshadow: "第三场复盘结束，助教正要换一张新标题。韩立锋按住纸，只让他把日期改掉。" },
  identity_runin: { dueEpisode: 10, title: "旧歌声接住了第一次失误", speaker: "梁一川", body: ["“开场那脚回传直接出了边线。看台没有叹气，歌还在继续。”", "“它没有替我们多进一球，却让第二次传球不必先害怕第一次。”"], pitch: { morale: 3, cohesion: 2 }, operations: { fanTrust: 3 }, foreshadow: "十二名老球员走得很慢。年轻球员原本在通道里催时间，听见东看台第一句旧歌后都停了下来。" }
};
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
let lastSceneFocusKey = null;
let lastOverlayTrigger = null;
let lastDrawerTrigger = null;
let pendingDecisionConfirmation = null;
let lastDecisionTrigger = null;
let saveReadIssue = "";
const TAB_WRITER_ID = crypto.randomUUID?.() || `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const visualAssetCache = new Map();

const $ = (id) => document.getElementById(id);

const ui = {
  startScreen: $("startScreen"),
  startForm: $("startForm"),
  startBtn: $("startBtn"),
  startStatus: $("startStatus"),
  saveSummary: $("saveSummary"),
  newSeasonIdentityHint: $("newSeasonIdentityHint"),
  managerName: $("managerName"),
  teamName: $("teamName"),
  resumeBtn: $("resumeBtn"),
  persistenceStatus: $("persistenceStatus"),
  persistenceTechnical: $("persistenceTechnical"),
  gameScreen: $("gameScreen"),
  resultScreen: $("resultScreen"),
  restartBtn: $("restartBtn"),
  exportBtn: $("exportBtn"),
  focusModeBtn: $("focusModeBtn"),
  clubPanelBtn: $("clubPanelBtn"),
  historyPanelBtn: $("historyPanelBtn"),
  hudFinanceBtn: $("hudFinanceBtn"),
  hudStrengthBtn: $("hudStrengthBtn"),
  hudCashValue: $("hudCashValue"),
  hudStrengthRadar: $("hudStrengthRadar"),
  hudOverallStrength: $("hudOverallStrength"),
  hudBoardTrustBtn: $("hudBoardTrustBtn"),
  hudBoardTrust: $("hudBoardTrust"),
  hudBoardTrustBar: $("hudBoardTrustBar"),
  boardTrustValue: $("boardTrustValue"),
  boardTrustBar: $("boardTrustBar"),
  boardTrustStatus: $("boardTrustStatus"),
  boardTrustReasons: $("boardTrustReasons"),
  freeAgentAlert: $("freeAgentAlert"),
  freeAgentModal: $("freeAgentModal"),
  freeAgentClose: $("freeAgentClose"),
  freeAgentContent: $("freeAgentContent"),
  strengthModal: $("strengthModal"),
  strengthModalClose: $("strengthModalClose"),
  expandedStrengthRadar: $("expandedStrengthRadar"),
  expandedMatchForecast: $("expandedMatchForecast"),
  expandedStrengthTable: $("expandedStrengthTable"),
  clubDrawer: $("clubDrawer"),
  historyDrawer: $("historyDrawer"),
  drawerBackdrop: $("drawerBackdrop"),
  glossaryBtn: $("glossaryBtn"),
  glossaryPanel: $("glossaryPanel"),
  glossaryCloseBtn: $("glossaryCloseBtn"),
  glossaryTitle: $("glossaryTitle"),
  glossaryContent: $("glossaryContent"),
  resultExportBtn: $("resultExportBtn"),
  resultRestartBtn: $("resultRestartBtn"),
  seasonLabel: $("seasonLabel"),
  clubTitle: $("clubTitle"),
  overallStrength: $("overallStrength"),
  strengthRadar: $("strengthRadar"),
  strengthTable: $("strengthTable"),
  matchForecast: $("matchForecast"),
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
  journeyMap: $("journeyMap"),
  echoArea: $("echoArea"),
  eventCard: $("eventCard"),
  eventNarrative: $("eventNarrative"),
  visualStage: $("visualStage"),
  visualBackground: $("visualBackground"),
  visualBackgroundPrevious: $("visualBackgroundPrevious"),
  visualCharacter: $("visualCharacter"),
  visualCharacterGhost: $("visualCharacterGhost"),
  visualCharacterSecondary: $("visualCharacterSecondary"),
  visualProps: $("visualProps"),
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
  pendingEffectList: $("pendingEffectList"),
  decisionConfirmModal: $("decisionConfirmModal"),
  decisionConfirmLabel: $("decisionConfirmLabel"),
  decisionConfirmLine: $("decisionConfirmLine"),
  decisionConfirmEvidence: $("decisionConfirmEvidence"),
  decisionConfirmFacts: $("decisionConfirmFacts"),
  decisionConfirmSubmit: $("decisionConfirmSubmit"),
  decisionConfirmCancel: $("decisionConfirmCancel"),
  resultTitle: $("resultTitle"),
  resultSubtitle: $("resultSubtitle"),
  verdictTitle: $("verdictTitle"),
  verdictBody: $("verdictBody"),
  finalStats: $("finalStats"),
  finalStrengthRadar: $("finalStrengthRadar"),
  careerTimeline: $("careerTimeline"),
  continueSeasonBtn: $("continueSeasonBtn"),
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

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).filter((key) => !["persistence", "persistenceConflict"].includes(key)).sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stateHash(value) {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function checkpointSummary(value = state) {
  if (!value) return "尚未开始";
  if (value.seasonNumber === 2) {
    return `第二赛季 · 节点${(value.seasonTwoRound || 0) + 1} · ${value.phase || "现场"}`;
  }
  const episode = gameData?.episodes?.[value.currentEpisode];
  const phaseLabels = {
    scenes: "现场", inquiry: "现场核实", proactive: "主动了解", decision: "正式决定",
    aftermath: "决定后的现场", decisionImpact: "决定结果", competitiveReceipt: "竞技复核待确认", bridge: "章节交接", match: "比赛结果"
  };
  const match = (value.matchReports || []).find((item) => item.episodeId === episode?.id);
  const score = value.phase === "match" && match?.games?.[0]?.score ? ` · ${match.games[0].score}` : "";
  return `第${(value.currentEpisode || 0) + 1}集 · ${phaseLabels[value.phase] || value.phase || "现场"}${score}`;
}

function formatSavedTime(value) {
  if (!value) return "时间未知";
  try {
    return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function createInitialState(managerName, clubName) {
  const initial = clone(gameData.initial);
  return {
    version: 2,
    contentRevision: 13,
    managerName,
    clubName,
    seasonNumber: 1,
    seasonTwoRound: 0,
    seasonTwoStep: null,
    seasonTwoDecisions: {},
    seasonTwoLegaciesApplied: [],
    seasonOneComplete: false,
    currentEpisode: 0,
    phase: "scenes",
    sceneIndex: 0,
    visualBeatKey: null,
    visualBeatIndex: 0,
    activeReply: null,
    questions: {},
    verifiedProviders: {},
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
    deferredConsequences: [],
    resolvedConsequences: [],
    consequenceNotices: {},
    pendingCompetitiveEffects: [],
    competitiveEffectNotices: {},
    lastDecisionImpact: null,
    seenTerms: [],
    pendingCrisis: null,
    crisisReturnPhase: null,
    financeCrises: [],
    tags: [],
    history: [],
    matchReports: [],
    boardTrust: 62,
    boardTrustHistory: [{ value: 62, delta: 0, reason: "董事会批准两年任期" }],
    fired: false,
    firedReason: null,
    freeAgentOffers: {},
    freeAgentSignings: [],
    activeFreeAgentKey: null,
    record: { wins: 0, draws: 0, losses: 0, points: 0, games: 0 },
    minCash: initial.finance.cash,
    completed: false,
    startedAt: new Date().toISOString(),
    persistence: {
      schemaVersion: SAVE_SCHEMA_VERSION,
      buildVersion: BUILD_VERSION,
      revision: 0,
      savedAt: null,
      writerId: TAB_WRITER_ID,
      context: SAVE_CONTEXT,
      storageKey: SAVE_KEY,
      checkpoint: "新任期尚未写入",
      stateHash: null
    }
  };
}

function saveGame() {
  if (!state || state.persistenceConflict) return false;
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch (error) {
    stored = null;
  }
  const localRevision = state.persistence?.revision || 0;
  const storedRevision = stored?.persistence?.revision || 0;
  if (storedRevision > localRevision && stored?.persistence?.writerId !== TAB_WRITER_ID) {
    state.persistenceConflict = {
      storedRevision,
      localRevision,
      detectedAt: new Date().toISOString(),
      checkpoint: stored.persistence?.checkpoint || "另一标签页的较新节点"
    };
    renderPersistenceStatus();
    return false;
  }
  const savedAt = new Date().toISOString();
  state.persistence = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    buildVersion: BUILD_VERSION,
    revision: Math.max(localRevision, storedRevision) + 1,
    savedAt,
    writerId: TAB_WRITER_ID,
    context: SAVE_CONTEXT,
    storageKey: SAVE_KEY,
    checkpoint: checkpointSummary(state),
    managerName: state.managerName,
    clubName: state.clubName,
    stateHash: null
  };
  state.persistence.stateHash = stateHash(state);
  const serialized = JSON.stringify(state);
  localStorage.setItem(SAVE_KEY, serialized);
  const verified = JSON.parse(localStorage.getItem(SAVE_KEY));
  const ok = verified?.persistence?.revision === state.persistence.revision &&
    verified?.persistence?.stateHash === state.persistence.stateHash &&
    stateHash(verified) === state.persistence.stateHash;
  if (!ok) {
    state.persistenceConflict = { writeVerificationFailed: true, detectedAt: savedAt };
    renderPersistenceStatus();
    return false;
  }
  renderPersistenceStatus();
  return true;
}

function readSave() {
  try {
    saveReadIssue = "";
    const currentRaw = localStorage.getItem(SAVE_KEY);
    const legacyRaw = SAVE_CONTEXT === "default" ? localStorage.getItem(LEGACY_SAVE_KEY) : null;
    const saved = JSON.parse(currentRaw || legacyRaw);
    if (saved?.version !== 2) return null;
    if (saved.persistence?.schemaVersion === SAVE_SCHEMA_VERSION && saved.persistence.stateHash && stateHash(saved) !== saved.persistence.stateHash) {
      saveReadIssue = "存档校验未通过，已拒绝静默载入。请保留此页并导出诊断信息。";
      return null;
    }
    saved.proactiveQuestions ||= {};
    saved.verifiedProviders ||= {};
    saved.proactiveRemaining ??= PROACTIVE_INQUIRY_LIMIT;
    saved.phaseBeforeProactive ??= null;
    saved.characterStates ||= Object.fromEntries(
      gameData.characters.map((person) => [person.id, { behavior: "open", memories: [] }])
    );
    saved.interactionFinalized ||= {};
    saved.causalLedger ||= [];
    saved.deferredConsequences ||= [];
    saved.resolvedConsequences ||= [];
    saved.consequenceNotices ||= {};
    saved.pendingCompetitiveEffects ||= [];
    saved.competitiveEffectNotices ||= {};
    saved.lastDecisionImpact ??= null;
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
    if ((saved.contentRevision || 0) < 6) {
      saved.visualBeatKey = null;
      saved.visualBeatIndex = 0;
      saved.contentRevision = 6;
    }
    if ((saved.contentRevision || 0) < 7) {
      saved.visualBeatKey = null;
      saved.visualBeatIndex = 0;
      if (saved.currentEpisode === 0 && !saved.decisions?.e1) {
        saved.phase = "scenes";
        saved.sceneIndex = 0;
      }
      saved.contentRevision = 7;
    }
    if ((saved.contentRevision || 0) < 8) {
      saved.visualBeatKey = null;
      saved.visualBeatIndex = 0;
      if (saved.currentEpisode === 0 && !saved.decisions?.e1) {
        saved.phase = "scenes";
        saved.sceneIndex = 0;
      }
      saved.contentRevision = 8;
    }
    if ((saved.contentRevision || 0) < 9) {
      saved.deferredConsequences ||= [];
      saved.resolvedConsequences ||= [];
      saved.consequenceNotices ||= {};
      saved.lastDecisionImpact = null;
      Object.values(saved.decisions || {}).forEach((decisionId) => {
        const consequence = DEFERRED_CONSEQUENCES[decisionId];
        if (!consequence || consequence.dueEpisode <= (saved.currentEpisode + 1)) return;
        if (!saved.deferredConsequences.some((item) => item.id === decisionId)) {
          saved.deferredConsequences.push({ id: decisionId, dueEpisode: consequence.dueEpisode });
        }
      });
      saved.contentRevision = 9;
    }
    if ((saved.contentRevision || 0) < 10) {
      saved.seasonNumber ||= 1;
      saved.seasonTwoRound ||= 0;
      saved.seasonTwoStep ||= null;
      saved.seasonTwoDecisions ||= {};
      saved.seasonTwoLegaciesApplied ||= [];
      saved.seasonOneComplete ||= Boolean(saved.completed);
      saved.boardTrust ??= clamp(58 + Math.round(((saved.operations?.boardBacking ?? 52) - 52) * 0.35), 24, 82);
      saved.boardTrustHistory ||= [{ value: saved.boardTrust, delta: 0, reason: "旧存档迁移后的董事会信任" }];
      saved.fired ||= false;
      saved.firedReason ||= null;
      saved.freeAgentOffers ||= {};
      saved.freeAgentSignings ||= [];
      saved.activeFreeAgentKey ||= null;
      if (saved.completed && !saved.fired) saved.completed = false;
      saved.contentRevision = 10;
    }
    if ((saved.contentRevision || 0) < 11) {
      saved.pendingCompetitiveEffects ||= [];
      saved.competitiveEffectNotices ||= {};
      saved.contentRevision = 11;
    }
    if ((saved.contentRevision || 0) < 12) {
      saved.contentRevision = 12;
    }
    if ((saved.contentRevision || 0) < 13) {
      const episodeIds = new Set([
        ...Object.keys(saved.questions || {}),
        ...Object.keys(saved.proactiveQuestions || {})
      ]);
      for (const episodeId of episodeIds) {
        const episode = gameData.episodes.find((item) => item.id === episodeId);
        const questionIds = [
          ...(saved.questions?.[episodeId] || []),
          ...(saved.proactiveQuestions?.[episodeId] || [])
        ];
        saved.verifiedProviders[episodeId] = uniqueProviders(questionIds
          .flatMap((id) => inquiryProviders(episode?.inquiry?.options?.find((option) => option.id === id))));
      }
      for (const record of saved.history || []) {
        if (record.type !== "decision" || record.providers?.length) continue;
        const episode = gameData.episodes.find((item) => item.number === record.episode);
        record.providers = uniqueProviders(saved.verifiedProviders[episode?.id] || []);
      }
      saved.contentRevision = 13;
    }
    saved.persistence ||= {
      schemaVersion: SAVE_SCHEMA_VERSION,
      buildVersion: "legacy-v2",
      revision: 0,
      savedAt: saved.startedAt || null,
      writerId: "legacy",
      context: SAVE_CONTEXT,
      storageKey: SAVE_KEY,
      checkpoint: checkpointSummary(saved),
      managerName: saved.managerName,
      clubName: saved.clubName,
      stateHash: null
    };
    saved.persistence.schemaVersion = SAVE_SCHEMA_VERSION;
    saved.persistence.context = SAVE_CONTEXT;
    saved.persistence.storageKey = SAVE_KEY;
    saved.persistenceConflict = null;
    repairSavedMatchScores(saved);
    return saved;
  } catch (error) {
    if (localStorage.getItem(SAVE_KEY)) saveReadIssue = "存档无法解析，已拒绝静默回到旧节点。";
    return null;
  }
}

function renderPersistenceStatus() {
  if (!ui.persistenceStatus) return;
  if (!state) {
    ui.persistenceStatus.textContent = "尚未保存";
    if (ui.persistenceTechnical) ui.persistenceTechnical.textContent = `构建 ${BUILD_VERSION} · 存档 ${SAVE_CONTEXT}`;
    ui.persistenceStatus.dataset.level = "idle";
    return;
  }
  if (state.persistenceConflict) {
    const conflict = state.persistenceConflict;
    ui.persistenceStatus.textContent = conflict.writeVerificationFailed
      ? "保存校验失败 · 已停止写入"
      : "另一标签页已有较新进度 · 请刷新";
    if (ui.persistenceTechnical) ui.persistenceTechnical.textContent = conflict.writeVerificationFailed
      ? `构建 ${BUILD_VERSION} · 存档 ${SAVE_CONTEXT}`
      : `另一标签页 rev.${conflict.storedRevision} · 本页拒绝覆盖 · 存档 ${SAVE_CONTEXT}`;
    ui.persistenceStatus.dataset.level = "error";
    return;
  }
  const metadata = state.persistence || {};
  ui.persistenceStatus.textContent = `已保存：${metadata.checkpoint || checkpointSummary()} · ${formatSavedTime(metadata.savedAt)}`;
  if (ui.persistenceTechnical) ui.persistenceTechnical.textContent = `保存序号 rev.${metadata.revision || 0} · 构建 ${BUILD_VERSION} · 存档 ${SAVE_CONTEXT}`;
  ui.persistenceStatus.dataset.level = "saved";
}

function renderSaveSummary(saved = readSave()) {
  if (!ui.saveSummary) return;
  if (!saved) {
    ui.saveSummary.classList.toggle("hidden", !saveReadIssue);
    ui.saveSummary.innerHTML = saveReadIssue ? `<strong>存档需要处理</strong><p>${escapeHtml(saveReadIssue)}</p>` : "";
    ui.newSeasonIdentityHint?.classList.add("hidden");
    return;
  }
  const metadata = saved.persistence || {};
  ui.managerName.value = saved.managerName;
  ui.teamName.value = saved.clubName;
  ui.saveSummary.classList.remove("hidden");
  ui.saveSummary.innerHTML = `<strong>${escapeHtml(saved.managerName)} · ${escapeHtml(saved.clubName)}</strong>
    <p>${escapeHtml(metadata.checkpoint || checkpointSummary(saved))}</p>
    <small>${escapeHtml(formatSavedTime(metadata.savedAt))} · rev.${metadata.revision || 0} · ${escapeHtml(metadata.buildVersion || "旧版迁移")} · 存档 ${escapeHtml(SAVE_CONTEXT)}</small>`;
  if (ui.newSeasonIdentityHint) {
    ui.newSeasonIdentityHint.textContent = `输入框已载入当前存档身份；直接开始将新建“${saved.managerName} · ${saved.clubName}”任期并覆盖现有进度。`;
    ui.newSeasonIdentityHint.classList.remove("hidden");
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
  closeGameDrawers({ returnFocus: false });
  closeGlossary(false);
  ui.startScreen.classList.toggle("hidden", name !== "start");
  ui.gameScreen.classList.toggle("hidden", name !== "game");
  ui.resultScreen.classList.toggle("hidden", name !== "result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentEpisode() {
  return gameData.episodes[state.currentEpisode];
}

function uniqueProviders(providers = []) {
  return [...new Set(providers.filter((provider) => provider && provider !== "现场" && provider !== "你"))];
}

function inquiryProviders(option) {
  return uniqueProviders(option?.speakers?.length ? option.speakers : [option?.speaker]);
}

function verifiedProviderList(episode) {
  const stored = state.verifiedProviders?.[episode.id];
  if (stored?.length) return uniqueProviders(stored);
  const selectedIds = [
    ...(state.questions[episode.id] || []),
    ...(state.proactiveQuestions[episode.id] || [])
  ];
  return uniqueProviders(selectedIds.flatMap((id) => inquiryProviders(
    episode.inquiry.options.find((option) => option.id === id)
  )));
}

function rememberVerifiedProviders(episode, option) {
  state.verifiedProviders ||= {};
  state.verifiedProviders[episode.id] = uniqueProviders([
    ...(state.verifiedProviders[episode.id] || []),
    ...inquiryProviders(option)
  ]);
}

function evidenceStatus(episode) {
  const providers = verifiedProviderList(episode);
  return providers.length
    ? `已核实：${providers.join("、")}；未核实：其余现场主张`
    : "已核实：无；未核实：三条现场主张";
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

function optionById(optionId) {
  for (const episode of gameData.episodes) {
    const option = episode.decision.options.find((candidate) => candidate.id === optionId);
    if (option) return { episode, option };
  }
  return null;
}

function scheduleDeferredConsequence(optionId) {
  const consequence = DEFERRED_CONSEQUENCES[optionId];
  if (!consequence || consequence.dueEpisode <= currentEpisode().number) return;
  if (state.deferredConsequences.some((item) => item.id === optionId)) return;
  state.deferredConsequences.push({ id: optionId, dueEpisode: consequence.dueEpisode });
}

function processDeferredConsequences(episodeNumber) {
  const due = state.deferredConsequences.filter(
    (item) => item.dueEpisode === episodeNumber && !state.resolvedConsequences.includes(item.id)
  );
  if (!due.length) return;
  state.consequenceNotices[episodeNumber] ||= [];

  due.forEach((scheduled) => {
    const consequence = DEFERRED_CONSEQUENCES[scheduled.id];
    if (!consequence) return;
    const before = captureClubSnapshot();
    applyNumericEffects(state.finance, consequence.finance);
    applyNumericEffects(state.operations, consequence.operations);
    applyNumericEffects(state.pitch, consequence.pitch);
    const delayedTrustDelta = Math.round((consequence.operations?.boardBacking || 0) * 0.5) + (state.finance.cash < 0 ? -5 : 0);
    adjustBoardTrust(delayedTrustDelta, `旧决定兑现：${consequence.title}`);
    Object.keys(state.operations).forEach((key) => {
      state.operations[key] = clamp(state.operations[key]);
    });
    Object.keys(state.pitch).forEach((key) => {
      state.pitch[key] = clamp(state.pitch[key]);
    });
    const after = captureClubSnapshot();
    const source = optionById(scheduled.id);
    state.resolvedConsequences.push(scheduled.id);
    state.consequenceNotices[episodeNumber].push({
      speaker: consequence.speaker,
      title: consequence.title,
      body: clone(consequence.body),
      kind: "迟来的回声",
      routeStep: 1,
      sourceDecision: scheduled.id,
      sourceLabel: source?.option.label || scheduled.id,
      sourceEpisode: source?.episode.number || 0,
      impact: { before, after }
    });
    state.history.push({
      type: "consequence",
      episode: episodeNumber,
      title: consequence.title,
      detail: `第${source?.episode.number || "？"}集“${source?.option.label || scheduled.id}”在今天产生了迟来的影响。`,
      impact: { before, after }
    });
  });
  state.minCash = Math.min(state.minCash, state.finance.cash);
}

function schedulePendingCompetitiveEffect(option, episode) {
  const isOpeningTacticDecision = episode.id === "e3" && option.effects?.pitch;
  const pendingPitch = option.effects?.pendingPitch || (isOpeningTacticDecision ? option.effects.pitch : null);
  if (!pendingPitch || !Object.keys(pendingPitch).length) return;
  if (state.pendingCompetitiveEffects.some((item) => item.sourceDecision === option.id)) return;
  state.pendingCompetitiveEffects.push({
    sourceDecision: option.id,
    sourceEpisode: episode.number,
    sourceLabel: option.label,
    dueEpisode: option.effects.pendingDueEpisode || episode.number,
    trigger: option.effects.pendingTrigger || (isOpeningTacticDecision ? "match" : "episodeStart"),
    pitch: clone(pendingPitch),
    receipt: option.effects.pendingReceipt || (isOpeningTacticDecision
      ? "已完成首个训练周期；相关攻守、体能与默契变化从季前赛开赛前进入比赛模型。"
      : "训练计划已进入执行，竞技变化将在后续节点复核。")
  });
}

function applyPendingCompetitiveEffects(trigger, episodeNumber) {
  const due = duePendingCompetitiveEffects(trigger, episodeNumber);
  if (!due.length) return [];
  const applied = [];
  due.forEach((item) => {
    const before = captureClubSnapshot();
    applyNumericEffects(state.pitch, item.pitch);
    Object.keys(state.pitch).forEach((key) => {
      state.pitch[key] = clamp(state.pitch[key]);
    });
    item.resolved = true;
    item.resolvedAt = {
      episode: episodeNumber,
      trigger,
      date: gameData.episodes.find((candidate) => candidate.number === episodeNumber)?.date || "比赛日"
    };
    const after = captureClubSnapshot();
    applied.push({ ...clone(item), before, after });
    state.history.push({
      type: "training",
      episode: episodeNumber,
      title: `训练兑现：${item.sourceLabel}`,
      detail: item.receipt,
      impact: { before, after }
    });
  });
  const key = `${episodeNumber}:${trigger}`;
  state.competitiveEffectNotices[key] = applied;
  return applied;
}

function duePendingCompetitiveEffects(trigger, episodeNumber) {
  return state.pendingCompetitiveEffects.filter(
    (item) => !item.resolved && item.trigger === trigger && item.dueEpisode === episodeNumber
  );
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
  const consequences = (state.consequenceNotices[episode.number] || []).map((item, index) => ({
    ...item,
    visualKey: `${episode.id}.consequence.${index}`
  }));
  const arrivals = (episode.arrival || []).map((item, index) => ({
    ...resolveSceneVariant(item),
    kind: index === 0 ? "承接上回" : "走进俱乐部",
    visualKey: `${episode.id}.arrival.${index}`
  }));
  const openings = episode.opening.map((item, index) => ({
    ...resolveSceneVariant(item),
    kind: "现场",
    routeStep: Number.isInteger(item.routeStep)
      ? item.routeStep
      : index === 0
        ? 1
        : Math.max(1, (episode.route?.length || 3) - 2),
    visualKey: `${episode.id}.opening.${index}`
  }));
  return [...arrivals, openings[0], ...notices, ...consequences, ...echoes, ...openings.slice(1)].filter(Boolean);
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
    if (duePendingCompetitiveEffects("episodeStart", episode.number).length) state.phase = "competitiveReceipt";
    processDeferredConsequences(episode.number);
    processDuePayments(episode.number);
  }
  if (showDismissalIfNeeded()) return;
  prepareFreeAgentOffer(episode.id, Boolean(episode.match));
  saveGame();
  scheduleEpisodeVisualPreload(episode.id);
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

function strengthScore(pitch = state.pitch, operations = state.operations) {
  const direct =
    pitch.attack * 0.2 +
    pitch.defense * 0.2 +
    pitch.fitness * 0.15 +
    pitch.cohesion * 0.15 +
    pitch.morale * 0.1 +
    (pitch.squadDepth ?? 50) * 0.1;
  const support =
    operations.coachAuthority * 0.03 +
    operations.dressingRoom * 0.03 +
    operations.medicalIntegrity * 0.015 +
    operations.academyPathway * 0.005 +
    operations.fanTrust * 0.01 +
    operations.boardBacking * 0.01;
  return Math.round(direct + support);
}

function captureClubSnapshot() {
  return {
    pitch: clone(state.pitch),
    operations: clone(state.operations),
    finance: clone(state.finance),
    boardTrust: state.boardTrust,
    overall: strengthScore()
  };
}

function boardTrustLevel(value = state.boardTrust) {
  if (value <= BOARD_DISMISSAL_THRESHOLD) return { label: "解雇线", level: "dismissed" };
  if (value < 35) return { label: "最后警告", level: "danger" };
  if (value < 50) return { label: "接受审查", level: "fragile" };
  if (value < 70) return { label: "仍获授权", level: "stable" };
  return { label: "高度信任", level: "strong" };
}

function adjustBoardTrust(delta, reason) {
  if (!delta) return false;
  const previous = state.boardTrust;
  state.boardTrust = clamp(previous + delta);
  state.boardTrustHistory.push({
    value: state.boardTrust,
    delta: state.boardTrust - previous,
    reason,
    season: state.seasonNumber,
    episode: state.seasonNumber === 1 ? currentEpisode()?.number : state.seasonTwoRound + 1
  });
  if (state.boardTrust <= BOARD_DISMISSAL_THRESHOLD && !state.fired) {
    state.fired = true;
    state.completed = true;
    state.firedReason = reason;
    state.finishedAt = new Date().toISOString();
    return true;
  }
  return false;
}

function showDismissalIfNeeded() {
  if (!state.fired) return false;
  saveGame();
  renderResult();
  showScreen("result");
  return true;
}

function matchModel(difficulty, pitch = state.pitch, operations = state.operations) {
  const shape = {
    attack: (pitch.attack - difficulty) * 0.27,
    defense: (pitch.defense - difficulty) * 0.29,
    lateGame: (pitch.fitness - 50) * 0.14 + ((pitch.squadDepth ?? 50) - 50) * 0.12,
    collective: (pitch.cohesion - 50) * 0.13 + (pitch.morale - 50) * 0.08,
    execution: (operations.coachAuthority - 50) * 0.06 + (operations.dressingRoom - 50) * 0.05,
    support: (operations.medicalIntegrity - 50) * 0.025 +
      (operations.fanTrust - 50) * 0.015 +
      (operations.boardBacking - 50) * 0.01
  };
  const edge = Object.values(shape).reduce((sum, value) => sum + value, 0);
  const draw = clamp(0.29 - Math.abs(edge) * 0.006, 0.17, 0.29);
  const decisive = 1 - draw;
  const win = decisive / (1 + Math.exp(-edge / 7));
  const loss = decisive - win;
  const percentages = {
    win: Math.round(win * 100),
    draw: Math.round(draw * 100),
    loss: Math.round(loss * 100)
  };
  percentages.loss += 100 - percentages.win - percentages.draw - percentages.loss;
  return { shape, edge, probabilities: percentages };
}

function radarSvg(pitch, previousPitch = null, compact = false) {
  const size = compact ? 250 : 300;
  const center = size / 2;
  const radius = compact ? 84 : 105;
  const point = (value, index, scale = 1) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / STRENGTH_DIMENSIONS.length;
    const distance = radius * (value / 100) * scale;
    return `${(center + Math.cos(angle) * distance).toFixed(1)},${(center + Math.sin(angle) * distance).toFixed(1)}`;
  };
  const polygon = (source, scale = 1) => STRENGTH_DIMENSIONS
    .map((dimension, index) => point(source[dimension.key] ?? 0, index, scale))
    .join(" ");
  const grids = [20, 40, 60, 80, 100]
    .map((level) => `<polygon points="${STRENGTH_DIMENSIONS.map((dimension, index) => point(level, index)).join(" ")}" />`)
    .join("");
  const axes = STRENGTH_DIMENSIONS.map((dimension, index) => {
    const end = point(100, index);
    const [x, y] = point(118, index).split(",").map(Number);
    const anchor = x < center - 8 ? "end" : x > center + 8 ? "start" : "middle";
    return `<line x1="${center}" y1="${center}" x2="${end.split(",")[0]}" y2="${end.split(",")[1]}" /><text x="${x}" y="${y}" text-anchor="${anchor}">${dimension.short}</text>`;
  }).join("");
  const previous = previousPitch
    ? `<polygon class="radar-previous" points="${polygon(previousPitch)}" />`
    : "";
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="进攻、防守、体能、默契、士气和阵容深度雷达图">
    <g class="radar-grid">${grids}${axes}</g>
    ${previous}
    <polygon class="radar-current" points="${polygon(pitch)}" />
    ${STRENGTH_DIMENSIONS.map((dimension, index) => {
      const [x, y] = point(pitch[dimension.key] ?? 0, index).split(",");
      return `<circle class="radar-point" cx="${x}" cy="${y}" r="3" />`;
    }).join("")}
  </svg>`;
}

const PROFILE_RADAR_DIMENSIONS = [
  ...STRENGTH_DIMENSIONS.map((item) => ({ ...item, source: "pitch" })),
  ...SUPPORT_DIMENSIONS.map((item) => ({ ...item, short: item.label.replace("支持", "").slice(0, 4), source: "operations" }))
];

function profileRadarSvg(after, before) {
  const size = 500;
  const center = size / 2;
  const radius = 174;
  const valueOf = (snapshot, dimension) => snapshot?.[dimension.source]?.[dimension.key] ?? 0;
  const point = (value, index, scale = 1) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / PROFILE_RADAR_DIMENSIONS.length;
    const distance = radius * (value / 100) * scale;
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const polygon = (snapshot) => PROFILE_RADAR_DIMENSIONS
    .map((dimension, index) => point(valueOf(snapshot, dimension), index).map((value) => value.toFixed(1)).join(","))
    .join(" ");
  const grids = [20, 40, 60, 80, 100].map((level) =>
    `<polygon points="${PROFILE_RADAR_DIMENSIONS.map((dimension, index) => point(level, index).map((value) => value.toFixed(1)).join(",")).join(" ")}" />`
  ).join("");
  const axes = PROFILE_RADAR_DIMENSIONS.map((dimension, index) => {
    const [x, y] = point(100, index);
    const [labelX, labelY] = point(118, index);
    const anchor = labelX < center - 10 ? "end" : labelX > center + 10 ? "start" : "middle";
    const delta = valueOf(after, dimension) - valueOf(before, dimension);
    return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchor}">${escapeHtml(dimension.short)}</text>
      ${delta ? `<text class="radar-delta ${delta > 0 ? "up" : "down"}" x="${labelX.toFixed(1)}" y="${(labelY + 13).toFixed(1)}" text-anchor="${anchor}">${signedNumber(delta)}</text>` : ""}`;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="六项直接战力与六项竞技支撑的决定前后对比">
    <g class="radar-grid profile-grid">${grids}${axes}</g>
    <polygon class="radar-previous" points="${polygon(before)}" />
    <polygon class="radar-current" points="${polygon(after)}" />
  </svg>`;
}

function levelLabel(value) {
  if (value >= 75) return "强项";
  if (value >= 62) return "良好";
  if (value >= 48) return "一般";
  if (value >= 36) return "薄弱";
  return "危险";
}

function renderStrengthDashboard() {
  const score = strengthScore();
  ui.overallStrength.textContent = score;
  ui.overallStrength.dataset.level = levelLabel(score);
  ui.strengthRadar.innerHTML = radarSvg(state.pitch, null, true);
  ui.hudOverallStrength.textContent = score;
  ui.hudOverallStrength.dataset.level = levelLabel(score);
  ui.hudStrengthRadar.innerHTML = radarSvg(state.pitch, null, true);

  const activeMatch = state.seasonNumber === 2
    ? SECOND_SEASON_ROUNDS[state.seasonTwoRound]?.match
    : currentEpisode()?.match;
  const difficulty = activeMatch?.difficulty ?? 55;
  const forecast = matchModel(difficulty).probabilities;
  const opponentLabel = activeMatch?.opponent || "同级对手";
  ui.matchForecast.innerHTML = `
    <div><span>若现在对阵 ${escapeHtml(opponentLabel)}</span><strong>胜 ${forecast.win}%</strong></div>
    <div class="forecast-bar" aria-label="胜${forecast.win}%、平${forecast.draw}%、负${forecast.loss}%"><i style="width:${forecast.win}%"></i><b style="width:${forecast.draw}%"></b><em style="width:${forecast.loss}%"></em></div>
    <small>平 ${forecast.draw}% · 负 ${forecast.loss}% · 已计入组织执行</small>`;

  ui.strengthTable.innerHTML = `
    <details open><summary>直接战力 · 上场即生效</summary>${STRENGTH_DIMENSIONS.map((dimension) => {
      const value = state.pitch[dimension.key] ?? 0;
      return `<div class="strength-row" title="${escapeHtml(dimension.description)}"><span>${dimension.label}</span><i><b style="width:${value}%"></b></i><strong>${Math.round(value)}</strong></div>`;
    }).join("")}</details>
    <details><summary>竞技支撑 · 间接生效</summary>${SUPPORT_DIMENSIONS.map((dimension) => {
      const value = state.operations[dimension.key] ?? 0;
      return `<div class="strength-row support" title="${escapeHtml(dimension.description)}"><span>${dimension.label}</span><i><b style="width:${value}%"></b></i><strong>${Math.round(value)}</strong></div>`;
    }).join("")}</details>`;
  ui.expandedStrengthRadar.innerHTML = radarSvg(state.pitch, null, false);
  ui.expandedMatchForecast.innerHTML = ui.matchForecast.innerHTML;
  ui.expandedStrengthTable.innerHTML = ui.strengthTable.innerHTML;
}

function renderBoardTrust() {
  const trust = Math.round(state.boardTrust);
  const status = boardTrustLevel(trust);
  ui.hudBoardTrust.textContent = trust;
  ui.hudBoardTrust.dataset.level = status.level;
  ui.hudBoardTrustBar.style.width = `${trust}%`;
  ui.boardTrustValue.textContent = trust;
  ui.boardTrustValue.dataset.level = status.level;
  ui.boardTrustBar.style.width = `${trust}%`;
  ui.boardTrustBar.dataset.level = status.level;
  ui.boardTrustStatus.textContent = `${status.label}。信任降至${BOARD_DISMISSAL_THRESHOLD}或以下，董事会会立即终止两年任期。`;
  ui.boardTrustReasons.innerHTML = state.boardTrustHistory.slice(-4).reverse().map((item) => `
    <div class="board-trust-reason ${item.delta >= 0 ? "up" : "down"}">
      <span>${escapeHtml(item.reason)}</span><strong>${signedNumber(item.delta)}</strong>
    </div>`).join("");
}

function prepareFreeAgentOffer(scopeId, hasMatch) {
  if (!hasMatch || !scopeId || state.freeAgentOffers[scopeId]) return;
  const shouldAppear = Math.random() < 0.64;
  if (!shouldAppear) {
    state.freeAgentOffers[scopeId] = { status: "none" };
    return;
  }
  const player = clone(FREE_AGENT_POOL[Math.floor(Math.random() * FREE_AGENT_POOL.length)]);
  state.freeAgentOffers[scopeId] = {
    status: "active",
    player,
    appearedAt: new Date().toISOString()
  };
  state.activeFreeAgentKey = scopeId;
}

function activeFreeAgentOffer() {
  const key = state.activeFreeAgentKey;
  const offer = key ? state.freeAgentOffers[key] : null;
  return offer?.status === "active" ? { key, offer } : null;
}

function renderFreeAgentAlert() {
  const active = activeFreeAgentOffer();
  const beforeResult = !["match", "decisionImpact"].includes(state.phase);
  ui.freeAgentAlert.classList.toggle("hidden", !active || !beforeResult);
  if (active) {
    const deadline = currentEpisode()?.match?.label ? `${currentEpisode().match.label}开赛前截止` : "本场决定前截止";
    $("freeAgentDeadline").textContent = deadline;
    ui.freeAgentAlert.setAttribute("aria-label", `球员报价待答复：${active.offer.player.name}；${deadline}；不消耗当前现场选择`);
  }
}

function openFreeAgentModal() {
  const active = activeFreeAgentOffer();
  if (!active) return;
  const player = active.offer.player;
  const affordable = state.finance.cash >= player.fee;
  const pitchGains = Object.entries(player.pitch || {}).map(([key, delta]) => {
    const dimension = STRENGTH_DIMENSIONS.find((item) => item.key === key);
    return `<span class="${delta >= 0 ? "up" : "down"}">${escapeHtml(dimension?.label || key)} ${signedNumber(delta)}</span>`;
  }).join("");
  ui.freeAgentContent.innerHTML = `
    <article class="free-agent-card">
      <div class="free-agent-identity"><span>${escapeHtml(player.position)} · ${player.age}岁</span><h3>${escapeHtml(player.name)}</h3><p>${escapeHtml(player.profile)}</p></div>
      <dl><div><dt>经纪人报价</dt><dd>${formatMoney(player.fee)}</dd></div><div><dt>年度工资</dt><dd>${formatMoney(player.wage)}</dd></div><div><dt>目前现金</dt><dd>${formatMoney(state.finance.cash)}</dd></div></dl>
      <div class="free-agent-gains"><strong>签下后立即改变</strong>${pitchGains}</div>
      <aside><span>球探在门口补了一句</span><p>${escapeHtml(player.warning)}</p></aside>
      ${affordable ? "" : `<p class="free-agent-insufficient">现金还差${formatMoney(player.fee - state.finance.cash)}，本次无法买入。</p>`}
      <div class="free-agent-actions"><button id="buyFreeAgent" class="primary-btn" type="button" ${affordable ? "" : "disabled"}>买入</button><button id="declineFreeAgent" class="ghost-btn" type="button">不买入</button></div>
    </article>`;
  ui.freeAgentModal.classList.remove("hidden");
  document.getElementById("buyFreeAgent").addEventListener("click", () => resolveFreeAgentOffer("bought"));
  document.getElementById("declineFreeAgent").addEventListener("click", () => resolveFreeAgentOffer("declined"));
}

function closeFreeAgentModal() {
  ui.freeAgentModal.classList.add("hidden");
}

function resolveFreeAgentOffer(status) {
  const active = activeFreeAgentOffer();
  if (!active) return;
  const player = active.offer.player;
  if (status === "bought" && state.finance.cash < player.fee) return;
  if (status === "bought") {
    const before = captureClubSnapshot();
    state.finance.cash -= player.fee;
    state.finance.wageCommitment += player.wage;
    applyNumericEffects(state.pitch, player.pitch);
    applyNumericEffects(state.operations, player.operations);
    Object.keys(state.pitch).forEach((key) => { state.pitch[key] = clamp(state.pitch[key]); });
    Object.keys(state.operations).forEach((key) => { state.operations[key] = clamp(state.operations[key]); });
    adjustBoardTrust(state.finance.cash < 500 ? -4 : 1, `自由市场签下${player.name}`);
    state.minCash = Math.min(state.minCash, state.finance.cash);
    const after = captureClubSnapshot();
    state.freeAgentSignings.push({ ...clone(player), season: state.seasonNumber, scopeId: active.key });
    state.history.push({
      type: "transfer", season: state.seasonNumber,
      episode: state.seasonNumber === 1 ? currentEpisode().number : state.seasonTwoRound + 1,
      title: `自由签约：${player.name}`, detail: `${player.position} · 报价${formatMoney(player.fee)} · 年薪${formatMoney(player.wage)}`,
      impact: { before, after }
    });
  } else {
    state.history.push({
      type: "transfer_pass", season: state.seasonNumber,
      episode: state.seasonNumber === 1 ? currentEpisode().number : state.seasonTwoRound + 1,
      title: `放弃自由球员：${player.name}`, detail: `${player.position} · 报价${formatMoney(player.fee)}`
    });
  }
  active.offer.status = status;
  state.activeFreeAgentKey = null;
  closeFreeAgentModal();
  saveGame();
  if (showDismissalIfNeeded()) return;
  render();
}

function expireFreeAgentOffer(scopeId) {
  const offer = state.freeAgentOffers[scopeId];
  if (offer?.status === "active") {
    offer.status = "expired";
    state.history.push({
      type: "transfer_pass", season: state.seasonNumber,
      episode: state.seasonNumber === 1 ? currentEpisode().number : state.seasonTwoRound + 1,
      title: `自由球员报价过期：${offer.player.name}`,
      detail: "比赛名单提交后，经纪人撤回了当轮报价。"
    });
  }
  if (state.activeFreeAgentKey === scopeId) state.activeFreeAgentKey = null;
  closeFreeAgentModal();
}

function renderChrome() {
  ui.clubTitle.textContent = state.clubName;
  ui.seasonLabel.textContent = state.seasonNumber === 2 ? "第二赛季 · 两年任期终年" : "第一赛季 · 两年任期首年";
  ui.cashValue.textContent = formatMoney(state.finance.cash);
  ui.cashValue.classList.toggle("negative", state.finance.cash < 0);
  ui.hudCashValue.textContent = formatMoney(state.finance.cash);
  ui.hudCashValue.classList.toggle("negative", state.finance.cash < 0);
  ui.wageValue.textContent = formatMoney(state.finance.wageCommitment);
  ui.installmentValue.textContent = formatMoney(state.finance.transferInstallments);
  ui.restrictedValue.textContent = formatMoney(state.finance.restrictedCash);
  ui.recordValue.textContent = state.record.games
    ? `${state.record.wins}胜 ${state.record.draws}平 ${state.record.losses}负`
    : "尚未开赛";
  renderStrengthDashboard();
  renderBoardTrust();
  renderFreeAgentAlert();

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
  if (state.seasonNumber === 2) {
    const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
    ui.stageCounter.textContent = `第二赛季 · 第${state.seasonTwoRound + 1}节点 / 共${SECOND_SEASON_ROUNDS.length}节点`;
    ui.stageTitle.textContent = round.title;
    ui.stageMeta.textContent = `${round.date} · ${round.location}`;
    ui.seasonProgress.style.width = `${((state.seasonTwoRound + 1) / SECOND_SEASON_ROUNDS.length) * 100}%`;
    ui.episodeStrip.innerHTML = SECOND_SEASON_ROUNDS.map((item, index) => {
      const status = index < state.seasonTwoRound ? "done" : index === state.seasonTwoRound ? "current" : "future";
      return `<span class="episode-dot ${status}" title="${escapeHtml(item.date)}：${escapeHtml(item.title)}"><b>${index + 1}</b><small>${escapeHtml(item.date.replace("第二年 · ", ""))}</small></span>`;
    }).join("");
    ui.journeyMap.classList.add("hidden");
    ui.journeyMap.innerHTML = "";
    return;
  }
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
  renderJourneyMap(episode);
}

function renderJourneyMap(episode) {
  const route = episode.route || [];
  if (!route.length) {
    ui.journeyMap.classList.add("hidden");
    ui.journeyMap.innerHTML = "";
    return;
  }
  ui.journeyMap.classList.remove("hidden");
  let activeStep = route.length - 1;
  if (state.phase === "scenes") {
    const queue = getSceneQueue(episode);
    const scene = queue[state.sceneIndex];
    activeStep = Number.isInteger(scene?.routeStep)
      ? scene.routeStep
      : Math.min(Math.floor((state.sceneIndex / Math.max(queue.length, 1)) * route.length), route.length - 2);
  } else if (["inquiry", "proactive"].includes(state.phase)) {
    activeStep = Math.max(0, route.length - 2);
  }
  ui.journeyMap.innerHTML = `
    <div class="journey-heading"><span>本集行程</span><strong>下一扇门通向哪里</strong></div>
    <ol>${route.map((step, index) => {
      const status = index < activeStep ? "done" : index === activeStep ? "current" : "future";
      return `<li class="${status}"><i>${index + 1}</i><span><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.location)}</small></span></li>`;
    }).join("")}</ol>`;
}

function renderDossier() {
  if (state.seasonNumber === 2) {
    const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
    const legacyCount = state.seasonTwoLegaciesApplied.filter((item) => item.round === state.seasonTwoRound).length;
    ui.clubDossier.innerHTML = `<dl><div><dt>你的职位</dt><dd>足球运营总经理 · 第二年</dd></div><div><dt>当前节点</dt><dd>${escapeHtml(round.date)}</dd></div><div><dt>旧决定到期</dt><dd>${legacyCount}项</dd></div><div><dt>董事会信任</dt><dd>${Math.round(state.boardTrust)} / 100</dd></div></dl><div class="known-facts"><strong>两年任期正在倒数</strong><p>第二赛季只保留四个关键节点；每个节点都包含一次决定和一组具体比赛。</p></div>`;
    ui.proactiveInquiryCount.textContent = "第二赛季";
    ui.proactiveInquiryBtn.disabled = true;
    ui.proactiveInquiryBtn.textContent = "随现场推进";
    ui.proactiveInquiryNote.textContent = "第二赛季采用压缩叙事，旧决定会直接进入新的现场。";
    return;
  }
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
  if (speaker === "你") return "足球运营总经理 · 内心";
  const person = gameData.characters.find((candidate) => candidate.name === speaker);
  return person ? displayRoleForCharacter(person) : "";
}

const characterIntroductionEpisode = {
  shen: 1,
  qiao: 1,
  he: 1,
  lin: 1,
  tang: 1,
  zhao: 2,
  chen: 2,
  jiang: 2,
  gu: 3
};

function renderCharacters() {
  const episode = state.seasonNumber === 2 ? secondSeasonEpisode() : currentEpisode();
  const activeIds = new Set();
  const text = JSON.stringify(episode);
  gameData.characters.forEach((person) => {
    if (text.includes(person.name)) activeIds.add(person.id);
  });
  const people = gameData.characters
    .filter((person) => (characterIntroductionEpisode[person.id] || 1) <= episode.number)
    .slice()
    .sort((a, b) => Number(activeIds.has(b.id)) - Number(activeIds.has(a.id)))
    .slice(0, 7);

  ui.characterList.innerHTML = people
    .map((person) => {
      const role = displayRoleForCharacter(person);
      return `
        <div class="character-item ${activeIds.has(person.id) ? "active" : ""}">
          <span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(role)}</small></span>
          ${activeIds.has(person.id) ? '<em>本集在场</em>' : ""}
        </div>`;
    })
    .join("");
}

function renderHistory() {
  const decisions = state.history.filter((item) => ["decision", "transfer", "legacy"].includes(item.type)).slice(-7).reverse();
  ui.historyList.innerHTML = decisions.length
    ? decisions
        .map(
          (item) => `
            <div class="history-item">
              <span>${item.season === 2 ? `第二赛季 · 节点${item.episode}` : `第${item.episode}集`} · ${escapeHtml(item.episodeTitle || (item.type === "legacy" ? "旧决定兑现" : "自由市场"))}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.detail)}</p>
              ${item.providers?.length ? `<small>本轮已核实信息提供者：${escapeHtml(item.providers.join("、"))}</small>` : ""}
            </div>`
        )
        .join("")
    : '<p class="empty-state">你的第一个决定尚未作出。</p>';
  renderPendingEffectLedger();
}

function renderPendingEffectLedger() {
  const entries = state.pendingCompetitiveEffects || [];
  ui.pendingEffectList.innerHTML = entries.length ? entries.slice().reverse().map((item) => {
    const dueEpisode = gameData.episodes.find((episode) => episode.number === item.dueEpisode);
    const due = item.trigger === "match"
      ? `${dueEpisode?.date || `第${item.dueEpisode}集`} · 开赛前训练复核`
      : `${dueEpisode?.date || `第${item.dueEpisode}集`} · 联合负荷复核`;
    const status = item.resolved
      ? `已于${item.resolvedAt?.date || dueEpisode?.date || `第${item.dueEpisode}集`}兑现`
      : `待兑现 · 预计${due}`;
    const metrics = Object.keys(item.pitch || {}).map((key) => STRENGTH_DIMENSIONS.find((dimension) => dimension.key === key)?.short || key).join(" / ");
    return `<article class="pending-effect-item ${item.resolved ? "resolved" : "pending"}">
      <span>${item.resolved ? "已兑现" : "待兑现"}</span>
      <strong>${escapeHtml(item.sourceLabel)}</strong>
      <p>来源：第${item.sourceEpisode}集正式决定 · ${escapeHtml(metrics)}</p>
      <small>${escapeHtml(status)}</small>
    </article>`;
  }).join("") : '<p class="empty-state">当前没有等待训练或比赛复核的竞技变化。</p>';
}

function resetStoryPanels() {
  activeVisualPage = null;
  ui.eventNarrative.querySelectorAll(".situation-brief").forEach((element) => element.remove());
  ui.eventCard.classList.remove("hidden");
  ui.eventCard.hidden = false;
  ui.eventCard.inert = false;
  ui.eventCard.classList.remove("impact-backdrop");
  ui.eventNarrative.classList.remove("hidden");
  ui.feedbackScene.classList.add("hidden");
  ui.feedbackScene.hidden = true;
  ui.feedbackScene.inert = true;
  ui.feedbackScene.classList.remove("impact-stage");
  ui.matchReport.classList.add("hidden");
  ui.matchReport.hidden = true;
  ui.matchReport.inert = true;
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

function revealInteractiveLayer(element) {
  element.hidden = false;
  element.inert = false;
  element.classList.remove("hidden");
}

function renderPhase() {
  resetStoryPanels();
  switch (state.phase) {
    case "competitiveReceipt":
      renderCompetitiveReceipt();
      break;
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
    case "decisionImpact":
      renderDecisionImpact();
      break;
    case "match":
      renderMatch();
      break;
    case "financeCrisis":
      renderFinanceCrisis();
      break;
    case "bridge":
      renderEpisodeBridge();
      break;
    case "seasonTwoScene":
      renderSeasonTwoScene();
      break;
    case "seasonTwoDecision":
      renderSeasonTwoDecision();
      break;
    case "seasonTwoImpact":
      renderSeasonTwoImpact();
      break;
    default:
      state.seasonNumber === 2 ? renderSeasonTwoScene() : renderScene();
  }
}

function renderCompetitiveReceipt() {
  const episode = currentEpisode();
  const due = duePendingCompetitiveEffects("episodeStart", episode.number);
  if (!due.length) {
    state.phase = "scenes";
    renderPhase();
    return;
  }
  const metricRows = due.flatMap((item) => Object.entries(item.pitch || {}).map(([key, delta]) => {
    const label = STRENGTH_DIMENSIONS.find((dimension) => dimension.key === key)?.label || key;
    return `<li><strong>${escapeHtml(label)}</strong><span>${signedNumber(delta)} · 确认复核后更新</span></li>`;
  })).join("");
  setSceneContent({
    speaker: "孟书宁",
    title: "先看复核回执，再更新球队数值",
    body: due.map((item) => item.receipt),
    kind: "联合负荷复核"
  }, `${episode.date} · 数值尚未入账`, `${episode.id}.competitive-receipt`);
  ui.feedbackScene.innerHTML = `<section class="competitive-receipt-preview">
    <strong>当前 HUD 仍是复核前数值</strong>
    <p>以下变化来自已经排期的训练复核；只有确认这张回执后才会一次性入账。</p>
    <ul>${metricRows}</ul>
  </section>`;
  revealInteractiveLayer(ui.feedbackScene);
  showContinue("确认复核，更新球队数值", () => {
    applyPendingCompetitiveEffects("episodeStart", episode.number);
    state.phase = "scenes";
    state.sceneIndex = 0;
    saveGame();
    render();
    scrollToStory();
  });
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
        `“今天必须支付${itemText}。账户只有${formatMoney(state.finance.cash)}，还差${formatMoney(crisis.shortage)}。”`,
        "“我不会替你把余额写成负数。三份文件都在桌上——借、卖，或延期。你先说，谁为这个缺口付钱。”"
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
    adjustBoardTrust(2, "用股东过桥借款按时完成付款");
  } else if (choice === "emergency_sale") {
    state.finance.cash += crisis.shortage + 300;
    state.pitch.squadDepth = clamp(state.pitch.squadDepth - 8);
    state.operations.dressingRoom = clamp(state.operations.dressingRoom - 6);
    addCausalEntries([
      { sourceDecision: "finance_crisis_sale", domain: "squadDepth", direction: "risk", text: "现金危机迫使俱乐部低价出售轮换球员，替补深度下降。", canAffect: ["late_match_fatigue", "injury_cover"] }
    ]);
    settleDuePayments(crisis.items, crisis.episodeNumber);
    adjustBoardTrust(-5, "现金危机迫使俱乐部低价出售球员");
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
    adjustBoardTrust(-14, "已知付款到期后仍选择延期");
  }

  state.financeCrises.push(record);
  state.pendingCrisis = null;
  state.phase = state.crisisReturnPhase || "scenes";
  state.crisisReturnPhase = null;
  state.minCash = Math.min(state.minCash, state.finance.cash);
  saveGame();
  if (showDismissalIfNeeded()) return;
  render();
  scrollToStory();
}

function splitStoryParagraph(paragraph) {
  const text = String(paragraph || "").trim();
  if (!text) return [];
  if (text.length <= 28) return [text];

  const isChineseQuote = text.startsWith("“") && text.endsWith("”");
  const source = isChineseQuote ? text.slice(1, -1) : text;
  const pieces = source.match(/[^。！？!?；;]+[。！？!?；;]+|[^。！？!?；;]+$/g)
    ?.map((item) => item.trim())
    .filter(Boolean) || [source];

  if (pieces.length <= 1) return [text];
  return pieces.map((item) => isChineseQuote ? `“${item}”` : item);
}

function buildStoryBeats(body, speaker, speakers = []) {
  const paragraphs = body.map((text, paragraphIndex) => ({
    text,
    speaker: speakers[paragraphIndex] || speaker,
    sentenceCount: Math.max(1, splitStoryParagraph(text).length),
    visualBeatIndex: paragraphIndex
  }));
  const beats = [];
  for (const paragraph of paragraphs) {
    const previous = beats.at(-1);
    const isStageDirection = ["现场", "现场动作"].includes(paragraph.speaker);
    const sameVoice = previous && (previous.speaker === paragraph.speaker || isStageDirection);
    const fitsParagraphBeat = previous && previous.sentenceCount + paragraph.sentenceCount <= 4;
    if (sameVoice && fitsParagraphBeat) {
      previous.texts.push(paragraph.text);
      previous.sentenceCount += paragraph.sentenceCount;
      previous.visualBeatIndex = paragraph.visualBeatIndex;
      continue;
    }
    if (isStageDirection && previous) {
      previous.texts.push(paragraph.text);
      previous.sentenceCount += paragraph.sentenceCount;
      previous.visualBeatIndex = paragraph.visualBeatIndex;
      continue;
    }
    beats.push({
      texts: [paragraph.text],
      speaker: paragraph.speaker,
      sentenceCount: paragraph.sentenceCount,
      visualBeatIndex: paragraph.visualBeatIndex
    });
  }
  return beats;
}

const defaultVisualExpressions = {
  shen: "neutral",
  tang: "guarded",
  he: "focused",
  qiao: "neutral",
  lin: "steady",
  zhao: "patient",
  chen: "nervous",
  jiang: "clinical",
  gu: "composed",
  analyst: "neutral",
  sponsor: "courteous",
  player: "composed"
};

function resolveSpeakerCharacterId(speaker) {
  if (!speaker || ["你", "现场", "现场动作", "球场广播"].includes(speaker)) return null;
  if (speaker === "主教练") return "$coach";
  if (speaker === "队长") return "$captain";
  const match = Object.entries(visualData?.characters || {})
    .find(([, character]) => character.name === speaker);
  return match?.[0] || null;
}

function setSceneContent({ speaker, speakers = [], title, body, kind = "现场" }, meta, visualKey = null) {
  ui.eventMeta.textContent = meta;
  ui.sceneType.textContent = kind;
  ui.eventTitle.textContent = title;
  const visual = getVisualScene(visualKey);
  const storyBeats = buildStoryBeats(body, speaker, speakers);
  let visibleBody = body;
  let activeSpeaker = speaker;

  if (visual && storyBeats.length) {
    if (state.visualBeatKey !== visualKey) {
      state.visualBeatKey = visualKey;
      state.visualBeatIndex = 0;
    }
    const beatIndex = Math.min(state.visualBeatIndex || 0, storyBeats.length - 1);
    const storyBeat = storyBeats[beatIndex];
    activeSpeaker = storyBeat.speaker;
    const visualBeat = visual.beats?.[storyBeat.visualBeatIndex] || {};
    const beat = {
      ...visual,
      ...visualBeat,
      visualKey,
      beatIndex
    };
    // 一旦进入分镜节拍，同场人物必须由该节拍明确声明；不能把上一层的双人构图带进单人特写。
    if (visual.beats?.length && !Object.hasOwn(visualBeat, "supportingCharacter")) {
      beat.supportingCharacter = null;
      beat.supportingExpression = null;
    }
    const speakerCharacter = resolveSpeakerCharacterId(activeSpeaker);
    if (!beat.character && speakerCharacter) {
      beat.character = speakerCharacter;
      beat.expression = defaultVisualExpressions[resolveVisualCharacterId(speakerCharacter)] || beat.expression;
      beat.motion = beat.motion || "focus";
    }
    if (renderVisualStage(beat, meta)) {
      visibleBody = storyBeat.texts;
      activeVisualPage = {
        key: visualKey,
        hasNext: beatIndex < storyBeats.length - 1,
        current: beatIndex + 1,
        total: storyBeats.length
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

  ui.eventSpeaker.textContent = activeSpeaker === "现场" ? "现场动作" : activeSpeaker;
  const speakerRole = roleForSpeaker(activeSpeaker);
  ui.eventRole.textContent = speakerRole;
  ui.eventRole.classList.toggle("hidden", !speakerRole);

  ui.eventScene.innerHTML = visibleBody
    .map((paragraph) => `<p>${renderRichText(paragraph)}</p>`)
    .join("");
  restartAnimation(ui.eventNarrative, "narrative-enter");
  const focusKey = `${state.seasonNumber}:${state.currentEpisode}:${state.phase}:${visualKey || title}`;
  if (lastSceneFocusKey !== focusKey) {
    lastSceneFocusKey = focusKey;
    requestAnimationFrame(() => ui.eventTitle.focus({ preventScroll: true }));
  }
}

function showContinue(label, handler) {
  if (activeVisualPage?.hasNext) {
    ui.continueBtn.textContent = `继续  ${activeVisualPage.current} / ${activeVisualPage.total}`;
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
  ui.visualProps.innerHTML = "";
}

const scenePropPlans = {
  "e1.arrival.0": [["water-bucket"], ["water-bucket"], ["water-bucket"]],
  "e1.arrival.1": [["water-bucket"], ["water-bucket"], ["water-bucket"], ["water-bucket"]],
  "e1.arrival.2": [["water-bucket"], ["season-ticket"], ["resolutions"], ["resolutions", "season-ticket"]],
  "e1.arrival.3": [["score-card"], ["score-card"], ["contract"], ["score-card"]],
  "e1.arrival.4": [["cash-sheets"], ["folder-stack"], ["cash-sheets"], ["folder-stack"], ["cash-sheets", "pen"]],
  "e1.opening.0": [["contract", "pen"], ["investment-folder", "pen"]],
  "e1.opening.1": [[], [], [], [], []],
  "e1.opening.2": [["tactics-board"], ["water-bottle"], ["tactics-board"], ["water-bottle"], ["tactics-board", "water-bottle"]],
  "e3.arrival.0": [["water-bottle"], ["training-shirt"], ["tactics-board"]],
  "e4.arrival.0": [["phone"], ["offer-sheet"], ["tactics-board", "armband"]],
  "e5.arrival.0": [["sponsor-board"], ["resolutions"], ["water-bucket"], ["water-bucket"]],
  "e6.arrival.0": [["score-card"], ["training-shirt"], ["training-sheet", "phone"], ["training-sheet", "phone"]],
  "e7.arrival.0": [["phone"], ["phone"], ["medical-chart"], ["medical-chart"]],
  "e8.arrival.0": [["cash-sheets"], ["cash-sheets"], ["offer-sheet"], ["offer-sheet", "cash-sheets"]],
  "e9.arrival.0": [["training-shirt"], ["offer-sheet", "cash-sheets"], ["standings-sheet"], ["standings-sheet"]],
  "e10.arrival.0": [["water-bucket"], ["water-bucket"], ["wall-notes", "armband"], ["contract"]],
  "e2.opening.0": [["cash-sheets", "pen"], ["cash-sheets", "folder-stack"]],
  "e2.opening.1": [["tactics-board"], ["tactics-board", "bench-cards"]],
  "e2.opening.2": [["registration-sheet"], ["folder-stack"]],
  "e3.opening.0": [["remote", "tactics-board"], ["remote", "tactics-board"]],
  "e3.opening.1": [["tactics-board"], ["training-shirt"]],
  "e3.opening.2": [["contract"], ["armband"]],
  "e4.opening.0": [["offer-sheet"], ["folder-stack"]],
  "e4.opening.1": [["contract", "armband"], ["contract"]],
  "e5.opening.0": [["water-bucket", "safety-folder"], ["sponsor-board", "contract"]],
  "e5.opening.1": [["water-bucket", "resolutions"], ["resolutions", "season-ticket"]],
  "e6.opening.0": [["score-card"], ["phone", "score-card"]],
  "e6.opening.1": [["training-sheet"], ["folded-list"]],
  "e7.opening.0": [["medical-scan", "medical-chart"], ["medical-chart"]],
  "e7.opening.1": [["ice-pack"], ["team-sheet", "ice-pack"]],
  "e8.opening.0": [["cash-sheets"], ["offer-sheet", "cash-sheets"]],
  "e8.opening.1": [["training-sheet"], ["loan-contract", "pen"]],
  "e9.opening.0": [["standings-sheet"], ["folder-stack", "bonus-list"]],
  "e9.opening.1": [["standings-sheet"], ["folded-list"]],
  "e10.opening.0": [["audit-files"], ["contract", "pen"]],
  "e10.opening.1": [["wall-notes"], ["armband"]]
};

const characterDefaultProps = {
  shen: ["pen"],
  tang: ["resolutions", "season-ticket"],
  he: ["tactics-board"],
  qiao: ["cash-sheets"],
  lin: ["armband"],
  zhao: ["training-sheet"],
  chen: ["training-shirt"],
  jiang: ["medical-chart"],
  gu: ["contract"],
  analyst: ["analysis-tablet"],
  sponsor: ["contract"],
  player: ["ice-pack"]
};

function propsForScene(scene) {
  if (Array.isArray(scene.props)) return scene.props;
  const planned = scenePropPlans[scene.visualKey];
  if (planned) return planned[scene.beatIndex] || planned.at(-1) || [];
  const characterId = resolveVisualCharacterId(scene.character);
  return characterDefaultProps[characterId] || [];
}

function renderVisualProps(scene) {
  const props = propsForScene(scene);
  ui.visualProps.innerHTML = props
    .map((prop, index) => {
      const descriptor = typeof prop === "string" ? { type: prop } : prop;
      const type = descriptor.type || "paper";
      const position = descriptor.position || (index % 2 ? "right" : "left");
      return `<span class="visual-prop prop-${escapeHtml(type)} prop-${escapeHtml(position)}" data-prop="${escapeHtml(type)}"><i></i></span>`;
    })
    .join("");
  ui.visualStage.dataset.camera = scene.camera || (scene.visualKey === "e1.opening.1" ? "hands" : "medium");
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
  ui.visualEpisodeMark.textContent = state.seasonNumber === 2
    ? `SEASON 2 · ${state.seasonTwoRound + 1}`
    : `EPISODE ${currentEpisode().number}`;
  renderVisualProps(scene);

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
  const hasReliableBackground = Boolean(currentSource && element.complete && element.naturalWidth > 0);
  element.dataset.pendingSrc = nextSource;
  element.classList.add("asset-loading");
  element.classList.toggle("asset-pending", !hasReliableBackground && !canCrossfadeImmediately);
  ui.visualStage.classList.toggle("visual-loading", !hasReliableBackground && !canCrossfadeImmediately);
  // 新背景尚未解码时保留当前背景，避免慢网下整块舞台突然变空。
  if (!canCrossfadeImmediately && !currentSource) ui.visualBackgroundPrevious.classList.add("hidden");

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
    element.classList.remove("asset-pending", "asset-loading");
    ui.visualStage.classList.remove("visual-loading", "visual-fallback");
    restartAnimation(element, "background-enter");
  }).catch(() => {
    if (renderEpoch !== visualRenderEpoch || element.dataset.pendingSrc !== nextSource) return;
    element.classList.remove("asset-loading");
    ui.visualStage.classList.remove("visual-loading");
    // 单张新图失败时继续显示上一张可靠背景；只有开场也没有可用图时才退回纯文字舞台。
    if (element.getAttribute("src")) {
      element.classList.remove("asset-pending");
    } else {
      element.classList.add("asset-pending");
      ui.visualStage.classList.add("visual-fallback");
    }
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
  const fallbackPortrait = currentPortrait && element.complete && element.naturalWidth > 0 && !element.classList.contains("hidden")
    ? {
        src: currentPortrait,
        className: element.className,
        character: element.dataset.character,
        position: element.dataset.position,
        framing: element.dataset.framing,
        alt: element.alt
      }
    : null;
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
  if (!canSwapImmediately && fallbackPortrait) {
    element.className = `${className} portrait-pending`;
  } else {
    element.className = `${className} asset-pending`;
    if (!canSwapImmediately) element.removeAttribute("src");
  }

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
    if (fallbackPortrait) {
      element.src = fallbackPortrait.src;
      element.className = fallbackPortrait.className;
      element.dataset.character = fallbackPortrait.character || "";
      element.dataset.position = fallbackPortrait.position || "center";
      element.dataset.framing = fallbackPortrait.framing || "medium";
      element.alt = fallbackPortrait.alt || "剧情人物";
    } else {
      element.removeAttribute("src");
      element.classList.add("hidden");
    }
  });
}

function visualLayerSources(scene) {
  const sources = [];
  const layers = [scene, ...(scene.beats || []).map((beat) => ({ ...scene, ...beat }))];
  layers.forEach((layer) => {
    const background = visualData?.backgrounds?.[layer.background]?.src;
    if (background) sources.push(background);
    const characterId = resolveVisualCharacterId(layer.character);
    const expression = resolveVisualExpression(layer.expression, characterId);
    const portrait = characterId ? visualData?.characters?.[characterId]?.expressions?.[expression] : null;
    if (portrait) sources.push(portrait);
    const supportingId = resolveVisualCharacterId(layer.supportingCharacter);
    const supportingExpression = resolveVisualExpression(layer.supportingExpression, supportingId);
    const supportingPortrait = supportingId ? visualData?.characters?.[supportingId]?.expressions?.[supportingExpression] : null;
    if (supportingPortrait) sources.push(supportingPortrait);
  });
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
  const episode = gameData?.episodes?.find((item) => item.id === episodeId);
  const speakerNames = new Set();
  const collectSpeakers = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "speaker" && typeof item === "string") speakerNames.add(item);
      else if (key === "speakers" && Array.isArray(item)) item.forEach((name) => speakerNames.add(name));
      else collectSpeakers(item);
    }
  };
  collectSpeakers(episode);
  for (const speaker of speakerNames) {
    const inferred = resolveSpeakerCharacterId(speaker);
    const characterId = inferred === "$coach" ? "he" : inferred === "$captain" ? "lin" : inferred;
    const expression = defaultVisualExpressions[characterId];
    const portrait = visualData?.characters?.[characterId]?.expressions?.[expression];
    if (portrait) sources.push(portrait);
  }
  return [...new Set(sources)];
}

function scheduleEpisodeVisualPreload(episodeId) {
  if (!visualData || !episodeId) return;
  const preloadEpoch = ++episodePreloadEpoch;
  const sources = collectEpisodeVisualSources(episodeId);
  Promise.resolve().then(() => {
    if (preloadEpoch !== episodePreloadEpoch) return;
    Promise.allSettled(sources.map((src) => loadVisualAsset(src, "low"))).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") console.warn("视觉素材预取失败。", sources[index]);
      });
    });
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
  const expressions = visualData?.characters?.[characterId]?.expressions || {};
  if (expression && expressions[expression]) return expression;
  const preferred = defaultVisualExpressions[characterId];
  if (preferred && expressions[preferred]) return preferred;
  return Object.keys(expressions)[0] || expression;
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
  const sceneDate = scene.date || episode.date;
  const sceneLocation = scene.location || episode.location;
  setSceneContent(scene, `${sceneDate} · ${sceneLocation}`, scene.visualKey);
  if (scene.impact) {
    ui.feedbackScene.innerHTML = renderImpactReport({
      title: scene.title,
      sourceLabel: scene.sourceLabel,
      sourceEpisode: scene.sourceEpisode,
      before: scene.impact.before,
      after: scene.impact.after,
      delayed: true
    });
    revealInteractiveLayer(ui.feedbackScene);
  }
  const last = state.sceneIndex >= scenes.length - 1;
  const nextScene = scenes[state.sceneIndex + 1];
  const interactionLabels = {
    destination: "发布会前，你最后去哪里",
    stress_test: "拆开一份方案的隐藏条件",
    replay: "重放一次可能失败的时刻"
  };
  let continueLabel = interactionLabels[episode.inquiry.mode] || "进入决策前核实";
  if (!last) {
    const nextLocation = nextScene?.location || episode.location;
    continueLabel = scene.transitionLabel || nextScene?.entryLabel ||
      (nextLocation !== sceneLocation ? `前往${nextLocation}` : `继续听${sceneSpeakerLabel(nextScene)}`);
  }
  showContinue(continueLabel, () => {
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

function sceneSpeakerLabel(scene) {
  const speakers = uniqueProviders(scene?.speakers?.length ? scene.speakers : [scene?.speaker]);
  if (!speakers.length) return "下去";
  return speakers.slice(0, 2).join("与");
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
      { speaker: active.speaker, speakers: active.speakers, title: active.title, body: active.body, kind: activeKind },
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
      speaker: "你",
      title: interactionCopy.title,
      body: [inquiry.prompt],
      kind: interactionCopy.kind
    },
    `${episode.date} · 决策前`,
    `${episode.id}.inquiry.menu`
  );
  ui.inquiryStatus.textContent = inquiry.statusText
    ? `${inquiry.statusText.replace("{selected}", selected.length).replace("{max}", inquiry.max)} · 本环节独立计次，不消耗赛季4次主动了解 · 当前可选 ${Math.max(0, inquiry.max - selected.length)} 次，选择后为 ${Math.max(0, inquiry.max - selected.length - 1)} 次`
    : `可以现场核实 ${inquiry.max} 人 · 已核实 ${selected.length} 人${proactiveSelected.length ? ` · 此前主动了解 ${proactiveSelected.length} 人` : ""}`;
  ui.inquiryStatus.classList.remove("hidden");

  inquiry.options
    .filter((item) => !allSelected.includes(item.id))
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inquiry-choice";
      button.innerHTML = `<span>${escapeHtml(inquiry.actionLabel || "开口问")} · 将获得哪类信息</span><strong>${renderRichText(option.label, false)}</strong><small>${renderRichText(option.stake || option.knowledge, false)}</small>`;
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
  rememberVerifiedProviders(episode, option);
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
      { speaker: active.speaker, speakers: active.speakers, title: active.title, body: active.body, kind: "主动了解" },
      `${episode.date} · 由你发起`,
      `${episode.id}.inquiry.${active.id}`
    );
    renderInquiryReceipt(active, "带回案头的硬信息");
    showContinue("结束谈话，回到现场", closeProactiveInquiry);
    return;
  }

  setSceneContent(
    {
      speaker: "你",
      title: "不等问题被送到桌上",
      body: ["我可以现在主动去找一个人。这次谈话不占之后的现场机会，但这一集我只能去一次。"],
      kind: "总经理主动权"
    },
    `${episode.date} · 主动走访`,
    `${episode.id}.inquiry.menu`
  );
  ui.inquiryStatus.textContent = `本赛季还可主动了解 ${state.proactiveRemaining} 次 · 本次会消耗1次 · 选择后余 ${Math.max(0, state.proactiveRemaining - 1)} 次`;
  ui.inquiryStatus.classList.remove("hidden");

  inquiry.options
    .filter((item) => !proactiveSelected.includes(item.id) && !selected.includes(item.id))
    .forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inquiry-choice proactive-choice";
      button.innerHTML = `<span>主动约谈 · 将获得哪类信息</span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.stake || option.knowledge)}</small>`;
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
  rememberVerifiedProviders(episode, option);
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

function currentSituationBrief(episode) {
  const selected = state.questions[episode.id] || [];
  const brief = episode.decision.brief || {};
  return {
    goal: brief.goal || `完成“${episode.title}”的正式决定，并留下可执行的责任边界。`,
    constraint: brief.constraint || episode.decision.prompt,
    knownRisk: brief.knownRisk || "每条路线都会把至少一种已知代价留给后续章节。",
    unverified: brief.unverified || (selected.length
      ? `其余 ${Math.max(0, episode.inquiry.options.length - selected.length)} 条现场信息没有核实，不能当作已确认事实。`
      : "现场信息尚未核实；未听到的主张不能当作已确认事实。")
  };
}

function renderFinanceRegistrationMap(episode) {
  if (episode.id !== "e2") return "";
  const committed = 1200 + 900 + 400;
  const selectable = state.finance.cash - committed;
  return `<section class="finance-registration-map" aria-label="现金与注册是两条独立通道">
    <header><strong>先分清两条通道</strong><span>金额均为本赛季已知口径</span></header>
    <div class="finance-lane"><b>银行现金 ${formatMoney(state.finance.cash)}</b><i>→</i><b>扣除已承诺付款 ${formatMoney(committed)}</b><i>→</i><strong>真正可选现金 ${formatMoney(selectable)}</strong></div>
    <p>已承诺付款包含：秋季工资及签字费1200万、一月旧转会分期900万、赛季奖金准备金400万；这里不重复扣除，也不计未确认收入。</p>
    <div class="registration-lane"><b>联赛注册成本空间 300万</b><i>→</i><b>新中卫成本 480万</b><i>→</i><strong>缺口 180万 × 4 = 需清理720万旧成本</strong></div>
    <p><strong>1:4 整改规则仅在本次联赛整改期有效。</strong>银行里有现金不能直接填补注册空间；必须先从联赛成本台账清掉旧成本。</p>
  </section>`;
}

function renderDecisionBrief(episode) {
  const brief = currentSituationBrief(episode);
  return `<section class="situation-brief" aria-labelledby="situationBriefTitle">
    <header><span>DECISION BRIEF</span><h3 id="situationBriefTitle">当前局面</h3></header>
    <dl>
      <div><dt>本集目标</dt><dd>${renderRichText(brief.goal)}</dd></div>
      <div><dt>硬约束</dt><dd>${renderRichText(brief.constraint)}</dd></div>
      <div><dt>已知风险</dt><dd>${renderRichText(brief.knownRisk)}</dd></div>
      <div class="unverified"><dt>未核实信息</dt><dd>${renderRichText(brief.unverified)}</dd></div>
    </dl>
    ${renderFinanceRegistrationMap(episode)}
  </section>`;
}

function optionRiskTags(option) {
  const tacticTags = {
    board_mandate: ["排名问责", "现金复核", "教练压力"],
    club_charter: ["协商成本", "执行速度", "董事会支持"],
    sporting_control: ["权力集中", "信息上报", "单点责任"],
    back_he: ["进攻上限", "年轻球员机会", "训练后兑现"],
    pressing_identity: ["体能消耗", "中卫身后空间", "训练后兑现"],
    shared_principles: ["权力边界", "沟通成本", "训练后兑现"]
  };
  const tags = option.riskTags?.length ? option.riskTags : tacticTags[option.id] || [
    option.effects?.finance?.cash < 0 ? "现金风险" : "执行风险",
    Object.keys(option.effects?.pendingPitch || {}).length ? "训练后兑现" : null
  ].filter(Boolean);
  return `<span class="decision-risk-tags" aria-label="主要风险类别">${tags.map((tag) => `<b>${escapeHtml(tag)}</b>`).join("")}</span>`;
}

function optionRiskShape(option) {
  const fallback = {
    board_mandate: "目标最清楚、问责最快；12月排名与现金会同时成为硬考核。",
    club_charter: "让利益相关者正式进入重大决定；代价是协商会拖慢执行。",
    sporting_control: "足球决定更集中、动作更快；坏消息也可能只剩一条上报路径。",
    back_he: "偏防守、偏短期稳定；中低位更整齐，但落后时提速困难。",
    pressing_identity: "偏进攻、偏成长；高位压迫制造夺回，但体能和中卫身后空间最危险。",
    shared_principles: "攻守较平衡；适应性更高，但边界模糊时最容易互相卸责。"
  };
  return option.riskShape || fallback[option.id] || "";
}

function renderDecision() {
  const episode = currentEpisode();
  const evidenceLabel = evidenceStatus(episode);
  finalizeInteractionConsequences(episode);
  setSceneContent(
    {
      speaker: "你",
      title: "现在，没有更多信息会替你作决定",
      body: [episode.decision.prompt],
      kind: "不可逆决定"
    },
    `${episode.date} · ${episode.phase}`,
    `${episode.id}.decision`
  );
  ui.eventPrompt.innerHTML = "<strong>我现在要怎么说</strong><span>按下选项，这句话就会当着在场的人说出口。</span>";
  ui.eventPrompt.classList.remove("hidden");
  ui.freeAgentAlert.insertAdjacentHTML("afterend", renderDecisionBrief(episode));

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
    const riskShape = optionRiskShape(option);
    button.innerHTML = `
      <span class="decision-label">${renderRichText(option.label, false)}</span>
      ${optionRiskTags(option)}
      ${riskShape ? `<span class="decision-risk-shape">${renderRichText(riskShape, false)}</span>` : ""}
      <span class="decision-evidence-status">${escapeHtml(evidenceLabel)} · 信息提供者以本轮核实记录为准</span>
      ${spokenLine ? `<span class="decision-line">“${renderRichText(spokenLine, false)}”</span>` : ""}
      ${cashChange || addedPayables.length ? `<span class="finance-preview ${projection.level}"><b>签字后的已知现金前景</b>今日现金 ${formatMoney(state.finance.cash + cashChange)} · 已知付款全部兑现后 ${formatMoney(projection.projected)} · ${escapeHtml(projection.label)}</span>` : ""}
      ${!affordable ? `<span class="unavailable-reason">我今天的现金不足，除非先找到确定融资。</span>` : ""}`;
    button.addEventListener("click", () => openDecisionConfirmation(option, button));
    ui.choiceList.appendChild(button);
  });
}

function applyNumericEffects(target, changes = {}) {
  Object.entries(changes).forEach(([key, delta]) => {
    target[key] = (target[key] || 0) + delta;
  });
}

function signedNumber(value) {
  if (!value) return "0";
  return `${value > 0 ? "+" : "−"}${Math.abs(Math.round(value))}`;
}

function metricChanges(before, after, definitions, group, formatter = signedNumber) {
  return definitions.map((dimension) => {
    const previous = before?.[dimension.key] ?? 0;
    const current = after?.[dimension.key] ?? 0;
    const delta = current - previous;
    return { ...dimension, group, previous, current, delta, formatted: formatter(delta) };
  }).filter((item) => item.delta !== 0);
}

function impactChanges(before, after) {
  const direct = metricChanges(before.pitch, after.pitch, STRENGTH_DIMENSIONS, "direct");
  const support = metricChanges(before.operations, after.operations, SUPPORT_DIMENSIONS, "support");
  const financeDefinitions = Object.entries(FINANCE_DIMENSIONS).map(([key, label]) => ({ key, label }));
  const finance = metricChanges(before.finance, after.finance, financeDefinitions, "finance", formatMoney);
  const governance = metricChanges(
    { boardTrust: before.boardTrust },
    { boardTrust: after.boardTrust },
    [{ key: "boardTrust", label: "董事会对你的信任" }],
    "governance"
  );
  return { direct, support, finance, governance, all: [...direct, ...support, ...finance, ...governance] };
}

function impactSentence(title, before, after) {
  const changes = impactChanges(before, after);
  const gains = [...changes.direct, ...changes.support, ...changes.governance].filter((item) => item.delta > 0);
  const losses = [...changes.direct, ...changes.support, ...changes.governance].filter((item) => item.delta < 0);
  const money = changes.finance.map((item) => `${item.label}${item.delta > 0 ? "增加" : "减少"}${formatMoney(Math.abs(item.delta))}`);
  const clauses = [`由于你选择“${title}”`];
  if (gains.length) clauses.push(`${gains.slice(0, 3).map((item) => `${item.label}提升${Math.abs(item.delta)}点`).join("、")}`);
  if (losses.length) clauses.push(`但${losses.slice(0, 3).map((item) => `${item.label}下降${Math.abs(item.delta)}点`).join("、")}`);
  if (money.length) clauses.push(`财务上，${money.join("、")}`);
  if (!gains.length && !losses.length) clauses.push("竞技战力没有立刻改变，但权力、现金或未来义务已经移动");
  return `${clauses.join("；")}。`;
}

function renderChangeRows(items) {
  if (!items.length) return '<p class="impact-empty">本组指标没有立即变化</p>';
  return items.map((item) => {
    const riskPositive = item.group === "finance" && ["wageCommitment", "transferInstallments"].includes(item.key);
    const favorable = riskPositive ? item.delta < 0 : item.delta > 0;
    const formatted = item.group === "finance" ? `${item.delta > 0 ? "+" : "−"}${formatMoney(Math.abs(item.delta))}` : item.formatted;
    return `<div class="impact-row ${favorable ? "up" : "down"}"><span>${escapeHtml(item.label)}</span><small>${item.group === "finance" ? formatMoney(item.previous) : Math.round(item.previous)} → ${item.group === "finance" ? formatMoney(item.current) : Math.round(item.current)}</small><strong>${formatted}</strong></div>`;
  }).join("");
}

function renderImpactScenes(scenes = [], before, after) {
  if (!scenes.length) return "";
  const changes = impactChanges(before, after).all;
  const cards = scenes.map((scene) => {
    const change = changes.find((item) => item.key === scene.metric);
    if (!change) return "";
    const riskPositive = change.group === "finance" && ["wageCommitment", "transferInstallments"].includes(change.key);
    const favorable = riskPositive ? change.delta < 0 : change.delta > 0;
    const formatted = change.group === "finance"
      ? `${change.delta > 0 ? "+" : "−"}${formatMoney(Math.abs(change.delta))}`
      : signedNumber(change.delta);
    return `<article class="impact-scene-card ${favorable ? "up" : "down"}">
      <header><span>${escapeHtml(scene.place || "决定后的现场")}</span><strong>${escapeHtml(change.label)} ${formatted}</strong></header>
      <blockquote>${escapeHtml(scene.quote || "")}</blockquote>
      <p>${escapeHtml(scene.body || "")}</p>
      ${scene.speaker ? `<footer>—— ${escapeHtml(scene.speaker)}</footer>` : ""}
    </article>`;
  }).filter(Boolean).join("");
  if (!cards) return "";
  return `<section class="impact-scene-section">
    <div class="impact-scene-heading"><span>人群中的回响</span><strong>数字是这些反应留下的结果</strong></div>
    <div class="impact-scene-grid">${cards}</div>
  </section>`;
}

function genericForeshadow(before, after) {
  const changes = impactChanges(before, after);
  const lowest = [...changes.support, ...changes.direct].sort((a, b) => a.delta - b.delta)[0];
  const lines = {
    dressingRoom: "散会后，更衣室里有两只柜门很久没有关上。走廊里的人把声音压得比平时更低。",
    coachAuthority: "主教练把名单沿原来的折痕又折了一次，没有等你一起离开。",
    medicalIntegrity: "孟书宁在病历末页留出一格签名栏，然后合上了文件。",
    academyPathway: "罗志衡把青年队赛程留在空椅上，最下面一个名字被红笔圈了两次。",
    fanTrust: "东看台的手机录音红点在你离开以后仍亮着。",
    boardBacking: "周绍庭把钢笔帽又拧紧了一格，合同却没有马上收走。",
    fitness: "训练结束的哨声响了，有人仍坐在草边重新系鞋带。",
    cohesion: "第二天的分组对抗里，同一个空当有两个人互相等着对方先补。",
    morale: "公告发出后，球员群里很快出现了许多已读，却很久没有下一句话。",
    squadDepth: "装备管理员把空柜子的号码牌放进抽屉，没有丢掉。",
    attack: "战术板角落还留着一枚前锋磁块，没人决定它下一次该放在哪里。",
    defense: "助教擦掉最后一条防线时，特意留下了上一场的失球时间。"
  };
  return lines[lowest?.key] || "人们陆续离开后，桌上仍有一份文件没有被任何人带走。";
}

function renderImpactReport({ title, sourceLabel, sourceEpisode, before, after, delayed = false, foreshadow = "", scenes = [] }) {
  const changes = impactChanges(before, after);
  const overallDelta = after.overall - before.overall;
  const origin = delayed
    ? `<p class="impact-origin">第${sourceEpisode}集的选择“${escapeHtml(sourceLabel)}”，今天终于进入了球队的身体和秩序。</p>`
    : `<p class="impact-origin">${escapeHtml(impactSentence(title, before, after))}</p>`;
  return `
    <div class="impact-report ${delayed ? "delayed" : "immediate"}">
      <header class="impact-head">
        <div><p class="eyebrow">${delayed ? "PAST DECISION · NOW" : "DECISION IMPACT"}</p><h3>${delayed ? "旧决定在今天兑现" : "本次决定如何改写球队"}</h3></div>
        <div class="overall-shift"><span>综合战力</span><strong>${before.overall} → ${after.overall}</strong><b class="${overallDelta >= 0 ? "up" : "down"}">${signedNumber(overallDelta)}</b></div>
      </header>
      ${origin}
      ${!delayed ? renderImpactScenes(scenes, before, after) : ""}
      <div class="impact-visual">
        <div class="impact-radar profile-impact-radar">${profileRadarSvg(after, before)}<p><i></i>决定前 <b></b>决定后</p><strong>六项场上战力 + 六项竞技支撑</strong></div>
        <div class="impact-groups">
          <section><h4>直接竞技战力</h4>${renderChangeRows(changes.direct)}</section>
          <section><h4>间接竞技支撑</h4>${renderChangeRows(changes.support)}</section>
          <section><h4>任期安全</h4>${renderChangeRows(changes.governance)}</section>
          <section><h4>财务变化</h4>${renderChangeRows(changes.finance)}</section>
        </div>
      </div>
      ${!delayed ? `<aside class="foreshadow"><span>散场时，你还看见</span><p>${escapeHtml(foreshadow || genericForeshadow(before, after))}</p></aside>` : ""}
    </div>`;
}

function summarizeImpact(option, before, after, deferred) {
  const changes = impactChanges(before, after).all.map((item) => {
    const costMetric = item.group === "finance" && ["wageCommitment", "transferInstallments"].includes(item.key);
    const favorable = costMetric ? item.delta < 0 : item.delta > 0;
    const amount = item.group === "finance"
      ? formatMoney(Math.abs(item.delta))
      : `${Math.abs(Math.round(item.delta))}点`;
    return { ...item, favorable, summary: `${item.label}${item.delta > 0 ? "增加" : "减少"}${amount}` };
  });
  const gain = changes.filter((item) => item.favorable).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const cost = changes.filter((item) => !item.favorable).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const promise = option.effects?.promisesAdd?.[0]?.text || option.line || option.action;
  const reminders = {
    board_mandate: "把12月排名与现金复核写进日程；不要用临时引援掩盖现金底线。",
    club_charter: "重大支出前记录咨询对象与缺席者；程序不能只在顺风时有效。",
    sporting_control: "要求足球部门定期上报坏消息；单点授权不能变成信息封闭。",
    liquidity_first: "现金安全不等于阵容安全；中卫缺口与青训补位要分开跟踪。",
    first_team_push: "先核验注册清退是否完成，并预留已知付款后的现金缺口补救。",
    build_capacity: "体能与默契尚未增加；等第3集联合负荷复核后再评价投入。",
    back_he: "领先时稳定，落后时提速困难；下一次复核要专看追分方案。",
    pressing_identity: "六周内重点监测体能消耗和中卫身后空间，不因一场失球临时撤权。",
    shared_principles: "明确三条原则冲突时由谁拍板，避免共同语言变成共同卸责。"
  };
  const pending = state.pendingCompetitiveEffects?.find((item) => item.sourceDecision === option.id && !item.resolved);
  return {
    promise,
    gain: gain?.summary || "组织已收到你的决定，竞技收益尚未立即兑现",
    cost: cost?.summary || "主要代价被推迟到后续复核，而不是当场消失",
    nextRisk: option.managementReminder || reminders[option.id] || "下一章需复核承诺是否按原边界执行。",
    scene: deferred?.foreshadow || genericForeshadow(before, after),
    pending: pending ? `${pending.sourceLabel}｜待第${pending.dueEpisode}集${pending.trigger === "match" ? "开赛前训练复核" : "联合负荷复核"}｜${Object.keys(pending.pitch).map((key) => STRENGTH_DIMENSIONS.find((item) => item.key === key)?.short || key).join(" / ")}` : ""
  };
}

function renderImpactSummary(option, before, after, deferred) {
  const summary = summarizeImpact(option, before, after, deferred);
  return `<section class="impact-summary" aria-labelledby="impactSummaryTitle">
    <header><span>DECISION RECEIPT</span><h3 id="impactSummaryTitle">先看这次决定留下什么</h3></header>
    <dl>
      <div><dt>你承诺了什么</dt><dd>${escapeHtml(summary.promise)}</dd></div>
      <div class="gain"><dt>最大收益</dt><dd>${escapeHtml(summary.gain)}</dd></div>
      <div class="cost"><dt>最大代价</dt><dd>${escapeHtml(summary.cost)}</dd></div>
      ${summary.pending ? `<div class="pending"><dt>尚待兑现</dt><dd>${escapeHtml(summary.pending)}</dd></div>` : ""}
      <div class="next-risk"><dt>管理提醒</dt><dd>${escapeHtml(summary.nextRisk)}</dd></div>
      <div class="leaving-scene"><dt>散场画面</dt><dd>${escapeHtml(summary.scene)}</dd></div>
    </dl>
  </section>`;
}

function pendingCompetitiveFact(option, episode) {
  const pendingPitch = option.effects?.pendingPitch || (episode.id === "e3" ? option.effects?.pitch : null);
  if (!pendingPitch || !Object.keys(pendingPitch).length) return "";
  const metrics = Object.keys(pendingPitch)
    .map((key) => STRENGTH_DIMENSIONS.find((dimension) => dimension.key === key)?.label || key)
    .join("、");
  const due = (option.effects?.pendingTrigger || (episode.id === "e3" ? "match" : "episodeStart")) === "match"
    ? "本集开赛前训练复核"
    : `第${option.effects?.pendingDueEpisode || episode.number}集联合负荷复核`;
  return `待兑现：${metrics}不会在签字时变化，须到${due}后才进入球队数值。`;
}

function decisionConfirmationFacts(option, episode) {
  const facts = [];
  const cashChange = option.effects?.finance?.cash || 0;
  const addedPayables = option.effects?.payablesAdd || [];
  if (cashChange || addedPayables.length) {
    const projection = financeProjection(cashChange, addedPayables);
    facts.push(`现金前景：签字后为${formatMoney(state.finance.cash + cashChange)}；已知付款全部兑现后为${formatMoney(projection.projected)}（${projection.label}）。`);
  }
  if (option.id === "first_team_push") {
    facts.push(`执行与清退：${option.action}`);
  }
  const pending = pendingCompetitiveFact(option, episode);
  if (episode.id === "e3") {
    facts.push(`核心竞技风险：${optionRiskShape(option)}`);
  }
  if (pending) facts.push(pending);
  const risk = episode.id === "e3" ? option.burden : option.burden || optionRiskShape(option);
  if (risk) facts.push(`主要代价：${risk}`);
  return facts.slice(0, 3);
}

function openDecisionConfirmation(option, trigger) {
  pendingDecisionConfirmation = option;
  lastDecisionTrigger = trigger;
  const line = option.line || decisionLine(option.id) || option.action || option.label;
  ui.decisionConfirmLabel.textContent = option.label;
  ui.decisionConfirmLine.textContent = `“${line}”`;
  ui.decisionConfirmEvidence.textContent = `${evidenceStatus(currentEpisode())}；信息提供者以本轮核实记录为准。`;
  ui.decisionConfirmFacts.innerHTML = decisionConfirmationFacts(option, currentEpisode())
    .map((fact) => `<li>${escapeHtml(fact)}</li>`)
    .join("");
  ui.decisionConfirmModal.hidden = false;
  ui.decisionConfirmModal.inert = false;
  ui.decisionConfirmModal.setAttribute("aria-hidden", "false");
  ui.decisionConfirmModal.classList.remove("hidden");
  ui.decisionConfirmSubmit.focus();
}

function closeDecisionConfirmation({ returnFocus = true } = {}) {
  ui.decisionConfirmModal.classList.add("hidden");
  ui.decisionConfirmModal.setAttribute("aria-hidden", "true");
  ui.decisionConfirmModal.hidden = true;
  ui.decisionConfirmModal.inert = true;
  pendingDecisionConfirmation = null;
  if (returnFocus && lastDecisionTrigger?.isConnected) lastDecisionTrigger.focus({ preventScroll: true });
  lastDecisionTrigger = null;
}

function confirmDecision() {
  const option = pendingDecisionConfirmation;
  if (!option) return;
  closeDecisionConfirmation({ returnFocus: false });
  chooseDecision(option);
}

function chooseDecision(option) {
  const episode = currentEpisode();
  if (state.decisions[episode.id]) return;
  const effects = option.effects || {};
  const before = captureClubSnapshot();

  applyNumericEffects(state.finance, effects.finance);
  applyNumericEffects(state.operations, effects.operations);
  if (episode.id !== "e3") applyNumericEffects(state.pitch, effects.pitch);
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
  scheduleDeferredConsequence(option.id);
  schedulePendingCompetitiveEffect(option, episode);

  let boardTrustDelta = BOARD_TRUST_DECISION_DELTAS[option.id] || 0;
  if (state.finance.cash < 0) boardTrustDelta -= 8;
  else if (state.finance.cash < 500) boardTrustDelta -= 3;
  adjustBoardTrust(boardTrustDelta, `第${episode.number}集：${option.label}`);

  const after = captureClubSnapshot();
  state.lastDecisionImpact = { episodeId: episode.id, optionId: option.id, before, after };

  state.decisions[episode.id] = option.id;
  state.history.push({
    type: "decision",
    season: 1,
    episode: episode.number,
    episodeTitle: episode.title,
    optionId: option.id,
    title: option.label,
    detail: option.action,
    providers: verifiedProviderList(episode),
    impact: { before, after }
  });
  state.minCash = Math.min(state.minCash, state.finance.cash);
  state.phase = "aftermath";
  saveGame();
  if (showDismissalIfNeeded()) return;
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
  showContinue("查看这项决定如何改变球队", () => {
    state.phase = "decisionImpact";
    state.visualBeatKey = null;
    state.visualBeatIndex = 0;
    saveGame();
    render();
    scrollToImpact();
  });
}

function renderDecisionImpact() {
  const episode = currentEpisode();
  const option = selectedOption(episode);
  if (!option) {
    state.phase = "decision";
    renderDecision();
    return;
  }

  const addedPromises = option.effects?.promisesAdd || [];
  const spokenLine = option.line || decisionLine(option.id);
  const impact = state.lastDecisionImpact?.episodeId === episode.id
    ? state.lastDecisionImpact
    : { before: captureClubSnapshot(), after: captureClubSnapshot() };
  const deferred = DEFERRED_CONSEQUENCES[option.id];
  const visualKey = `${episode.id}.aftermath.${option.id}`;
  const aftermathVisual = getVisualScene(visualKey);
  if (aftermathVisual) {
    const finalVisualBeat = aftermathVisual.beats?.at(-1) || {};
    const impactBackdrop = {
      ...aftermathVisual,
      ...finalVisualBeat,
      visualKey,
      beatIndex: Math.max(0, (aftermathVisual.beats?.length || 1) - 1)
    };
    const finalSpeaker = option.aftermath.speakers?.at(-1) || option.aftermath.speaker;
    const speakerCharacter = resolveSpeakerCharacterId(finalSpeaker);
    if (!impactBackdrop.character && speakerCharacter) {
      impactBackdrop.character = speakerCharacter;
      impactBackdrop.expression = defaultVisualExpressions[resolveVisualCharacterId(speakerCharacter)];
    }
    renderVisualStage(impactBackdrop, `${episode.date} · 决定的余波仍在现场`);
  }
  ui.eventCard.classList.add("impact-backdrop");
  ui.eventNarrative.classList.add("hidden");
  ui.feedbackScene.classList.add("impact-stage");
  const continueLabel = episode.match ? `带着这些变化去看${escapeHtml(episode.match.label)}` : episode.number === 10 ? "带着这份结算结束赛季" : "带着这些变化进入下一章";
  ui.feedbackScene.innerHTML = `
    ${renderImpactSummary(option, impact.before, impact.after, deferred)}
    <button id="impactContinue" class="primary-btn impact-continue impact-continue-priority" type="button">${continueLabel}</button>
    <details class="impact-evidence">
      <summary>展开人物反应、雷达图与完整指标证据</summary>
      <div class="decision-record">
        <p class="eyebrow">记录在案</p>
        <h3>${escapeHtml(option.label)}</h3>
        ${spokenLine ? `<blockquote>“${escapeHtml(spokenLine)}”</blockquote>` : ""}
        ${addedPromises.length
          ? `<div class="receipt-promises"><strong>你因此说过</strong>${addedPromises
              .map((item) => `<span>“${escapeHtml(item.text)}”</span>`)
              .join("")}</div>`
          : ""}
      </div>
      ${renderImpactReport({
        title: option.label,
        before: impact.before,
        after: impact.after,
        foreshadow: deferred?.foreshadow || "",
        scenes: option.impactScenes || []
      })}
    </details>`;
  revealInteractiveLayer(ui.feedbackScene);
  document.getElementById("impactContinue").addEventListener("click", continueAfterDecisionImpact);
}

function continueAfterDecisionImpact() {
  const episode = currentEpisode();
  if (episode.match) {
    applyPendingCompetitiveEffects("match", episode.number);
    state.phase = "match";
    ensureMatchReport(episode);
    if (showDismissalIfNeeded()) return;
    saveGame();
    render();
    scrollToStory();
  } else if (episode.number < gameData.episodes.length) {
    beginEpisodeBridge();
  } else {
    advanceEpisode();
  }
}

function scrollToImpact() {
  requestAnimationFrame(() => {
    ui.feedbackScene.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function beginEpisodeBridge() {
  const episode = currentEpisode();
  if (!episode.bridge) {
    advanceEpisode();
    return;
  }
  state.phase = "bridge";
  state.visualBeatKey = null;
  state.visualBeatIndex = 0;
  const nextEpisode = gameData.episodes[state.currentEpisode + 1];
  if (nextEpisode) scheduleEpisodeVisualPreload(nextEpisode.id);
  saveGame();
  render();
  scrollToStory();
}

function renderEpisodeBridge() {
  const episode = currentEpisode();
  const nextEpisode = gameData.episodes[state.currentEpisode + 1];
  if (!episode.bridge || !nextEpisode) {
    advanceEpisode();
    return;
  }
  const bridge = resolveSceneVariant(episode.bridge);
  setSceneContent(
    { ...bridge, kind: "章节之间" },
    `${bridge.date || episode.date} · ${bridge.location || "离场前"}`,
    `${episode.id}.bridge`
  );
  const option = selectedOption(episode);
  ui.eventPrompt.innerHTML = `
    <strong>刚刚留下：${escapeHtml(option?.label || "这一章的决定")}</strong>
    <span>下一站：${escapeHtml(nextEpisode.date)} · ${escapeHtml(nextEpisode.location)} · ${escapeHtml(nextEpisode.title)}</span>`;
  ui.eventPrompt.classList.remove("hidden");
  showContinue(bridge.nextLabel || `${nextEpisode.date} · 前往${nextEpisode.location}`, advanceEpisode);
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
    leave_record: "我履行第二年合同。记录从没兑现的承诺开始公开。"
  };
  return lines[optionId] || "";
}

function ensureMatchReport(episode) {
  if (state.matchReports.some((item) => item.episodeId === episode.id)) return;
  const config = episode.match;
  expireFreeAgentOffer(episode.id);
  const count = config.count || (episode.id === "e6" ? 6 : episode.id === "e9" ? 5 : 1);
  const competitive = episode.id !== "e3";
  const games = [];

  for (let index = 0; index < count; index += 1) {
    const model = matchModel(config.difficulty);
    const roll = Math.random() * 100;
    let outcome = "L";
    if (roll < model.probabilities.win) outcome = "W";
    else if (roll < model.probabilities.win + model.probabilities.draw) outcome = "D";
    const score = makeScore(outcome);
    games.push({
      outcome,
      score,
      probabilities: clone(model.probabilities),
      shape: clone(model.shape)
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

  const wins = games.filter((game) => game.outcome === "W").length;
  const losses = games.filter((game) => game.outcome === "L").length;
  const draws = games.length - wins - losses;
  let boardTrustChange = wins * 2 - losses * 4 + (draws >= wins && draws > losses ? 1 : 0);
  if (games.length >= 3 && losses >= Math.ceil(games.length * 0.67)) boardTrustChange -= 5;
  if (games.length >= 3 && wins >= Math.ceil(games.length * 0.67)) boardTrustChange += 3;
  adjustBoardTrust(boardTrustChange, `${config.label}：${wins}胜${draws}平${losses}负`);

  state.matchReports.push({
    episodeId: episode.id,
    episode: episode.number,
    label: config.label,
    opponent: config.opponent,
    stakes: config.stakes,
    competitive,
    games,
    strengthAtKickoff: strengthScore(),
    boardTrustChange,
    narrativeVersion: 2,
    stories: buildMatchStories(episode, games),
    postMatchScene: buildPostMatchScene(episode, games)
  });
}

const MATCH_OPPONENTS = {
  e3: ["海港城"],
  e6: ["青川FC", "江东联", "城南竞技", "海港城", "岭北", "北岸竞技"],
  e8: ["北岸竞技"],
  e9: ["河谷联", "海港城", "江东联", "岭北", "城南竞技"],
  s2r1: ["澄海", "江东联", "北岸竞技"],
  s2r2: ["山城", "海港城", "岭北"],
  s2r3: ["河谷联", "城南竞技", "青川FC"],
  s2r4: ["江东联", "北岸竞技", "海港城"]
};

const MATCH_DECISION_MOMENTS = {
  liquidity_first: ["保住现金，没有买中卫", "队长不得不回撤补禁区；好处是替补席仍有完整换人位置。"],
  first_team_push: ["把钱换成即战力", "新中卫赢下第一点，但为注册他清走的轮换球员在最后二十分钟留下空位。"],
  build_capacity: ["投资康复与数据团队", "体能预警让换人提前发生；它阻止了抽筋，却不能替现有中卫完成转身。"],
  back_he: ["支持韩立锋的控制型足球", "两条线没有被打散；需要追分时，禁区里也始终少一个提前到位的人。"],
  pressing_identity: ["建立高位压迫身份", "前场抢断制造了射门；第七十分钟以后，同一片身后空间开始反过来追赶岚城。"],
  shared_principles: ["用共同原则取代固定答案", "球员在落后后一起前移，但第一次判断是否加速时仍慢了半秒。"],
  sell_captain: ["出售梁一川", "新队长完成了自己的工作，却有两次补位没人再提前喊出名字。"],
  renew_captain: ["续约并重新定义队长角色", "梁一川从替补席指出对手第二点位置，年轻中场下一回合真的站到了那里。"],
  last_dance: ["让队长踢完最后一季", "袖标稳定了最慌的一段时间；一月承诺仍让每次换下他都带着额外沉默。"],
  full_naming: ["用完整冠名换取现金", "主场设施更完整，第十二分钟的看台却没有用歌声接住第一次失误。"],
  hybrid_naming: ["让商业和旧名称共存", "看台仍会争吵，但主场落后时没有把对球队的支持一起撤走。"],
  supporter_bond: ["用会员债券修看台", "钱没有一次到齐，主场却在丢球后继续唱完了同一段旧歌。"],
  back_coach: ["公开支持韩立锋", "教练在落后时仍敢按训练方案换人，因为他知道赛后不会先收到甩锅声明。"],
  hire_gu: ["立即聘请高竞", "向前速度明显提高；旧教练留下的球员在第一次失误后仍先看向新教练席。"],
  three_game_review: ["给教练三场审查期", "白板上的倒计时已经擦掉，球员丢球后却仍用一秒钟确认谁会先被替换。"],
  medical_veto: ["赋予医疗团队否决权", "主力缺席让首发变弱，但最后十分钟仍有三名能正常冲刺的换人。"],
  informed_choice: ["保护球员的知情选择", "球员更早报告疼痛，教练及时调整了任务；阵容没有在热身时临时少一人。"],
  play_and_shoot: ["批准带风险出场", "核心球员制造了最危险的射门，也在下一次回追时明显不敢完全伸腿。"],
  sell_chen: ["出售程野", "现金到账了，替补席需要速度时却只剩一件没有主人的训练背心。"],
  shareholder_loan: ["用股东借款完成补强", "新援送出向前传球；主席在看台上也把每次失误记进了自己的预算判断。"],
  hold_course: ["给程野明确成长计划", "年轻人的第一次触球仍紧张，第二次却因为知道不会立刻被放弃而主动要球。"],
  bonus_push: ["用奖金推动冲刺", "每个人都知道进球值多少钱；一次可以回传的球因此被强行送进了人群。"],
  quiet_process: ["坚持同一套复盘过程", "丢球没有换来临时口号，球队用训练过的下一步重新把球送到边路。"],
  identity_runin: ["用俱乐部记忆组织冲刺", "年轻球员第一次失误时，看台的旧歌没有停，他下一次仍敢把球传向中路。"],
  s2_integrate: ["重建角色和工资秩序", "替补知道自己为什么上场，领先后的最后一次换人没有引发抱怨。"],
  s2_accelerate: ["继续围绕最强球员加速", "核心球员连续制造机会，弱侧队友却越来越习惯站着等他解决。"],
  s2_youth_mix: ["强制加入青训轮换", "年轻腿让最后二十分钟仍有速度，第一次防守选位也直接送出一次机会。"],
  s2_public_target: ["公开六轮积分目标", "每个进球都带来清晰动力，每次丢球也立刻让替补席开始计算剩余分数。"],
  s2_private_review: ["拒绝公开倒计时", "球员没有因一次落后改变动作，董事席却在终场前提前离场。"],
  s2_sell_window: ["承诺冬窗出售主力", "被放进市场的球员仍完成了跑动，但每次对抗后都先看自己是否会被换下。"],
  s2_protect_bodies: ["医学红线优先", "首发纸面实力下降，比赛末段却没有人因为疼痛停止回追。"],
  s2_push_bodies: ["让核心球员连续首发", "最强阵容在前六十分钟兑现优势，最后阶段的冲刺距离随后明显坍塌。"],
  s2_emergency_depth: ["溢价补充轮换深度", "新球员没有成为明星，却让三个位置都能在正确时间换人。"],
  s2_hold_identity: ["坚持两年来的比赛原则", "落后没有让阵型失去共同距离，球队直到最后一脚仍像自己。"],
  s2_all_in: ["奖金与进攻全部加码", "禁区人数达到整季最高，身后也只剩两名防守球员。"],
  s2_share_burden: ["让教练与队长共同决定", "换人发生前所有人已经知道理由，最后阶段没有人拒绝补到陌生位置。"]
};

function matchRelevantDecisionIds(episode) {
  if (episode.id.startsWith("s2")) {
    const chosen = state.seasonTwoDecisions[episode.id];
    const legacy = state.seasonTwoLegaciesApplied.find((item) => item.round === state.seasonTwoRound)?.sourceDecision;
    return [chosen, legacy].filter(Boolean);
  }
  const episodeKeys = {
    e3: ["e2", "e3"],
    e6: ["e4", "e5", "e6"],
    e8: ["e6", "e7", "e8"],
    e9: ["e5", "e8", "e9"]
  }[episode.id] || [];
  return episodeKeys.map((key) => getDecision(key)).filter(Boolean);
}

function matchDecisionMoment(decisionId) {
  if (MATCH_DECISION_MOMENTS[decisionId]) return MATCH_DECISION_MOMENTS[decisionId];
  const source = optionById(decisionId)?.option;
  return [source?.label || "此前的管理决定", source?.action || "这项决定改变了球队在场上的选择空间。"];
}

function placeDecisionInsideMatch(decisionText, index) {
  const matchPhases = [
    "首发名单公布时，这个决定先改变了谁知道自己为什么在场。",
    "比分僵持以后，它开始影响替补席是否相信下一次换人。",
    "进入最后二十分钟，它决定了球队还能不能用同一种答案处理压力。",
    "对手第一次改阵以后，管理层留下的边界变成了教练可以调用的空间。",
    "体能和情绪同时下降时，这项选择才显出最昂贵的那一面。",
    "终场前的最后一次攻防，把这项决定从会议室重新带回了草皮。"
  ];
  return `${matchPhases[index % matchPhases.length]} ${decisionText}`;
}

function parseScore(score) {
  const [home, away] = String(score).split("-").map(Number);
  return { home, away };
}

function matchNarrativeForResult(game, index = 0) {
  const { home, away } = parseScore(game.score);
  if (home === 0 && away === 0) {
    return {
      minute: 84,
      headline: "门将把全场最危险的一次射门托出横梁",
      play: "双方都把禁区守到最后；岚城保住一分，也看清了最后一传仍欠半步。"
    };
  }
  if (home === away) {
    return {
      minute: 76,
      headline: `岚城第76分钟追成${home}-${away}，随后守住共同距离`,
      play: `对手第32分钟先入一球；岚城第76分钟完成扳平。先落后、后追平的顺序写在同一条时间线上。`
    };
  }
  if (home > away && away === 0) {
    return {
      minute: 67,
      headline: `替补制造关键机会，岚城以${home}-${away}完成零封`,
      play: "领先以后球队没有只等终场，防线也没有给对手留下有效射正后的第二点。"
    };
  }
  if (home > away) {
    return {
      minute: 68,
      headline: `第68分钟的反超让岚城把优势保持到终场`,
      play: `对手先取得进球，岚城随后追平并在第68分钟反超；最终比分${home}-${away}。`
    };
  }
  if (home === 0) {
    return {
      minute: 79,
      headline: `岚城久攻未果，对手把领先保持到终场`,
      play: `岚城没有取得进球；对手的${away}次得分决定了${home}-${away}的失利。`
    };
  }
  return {
    minute: 79,
    headline: `岚城追分时留下身后空间，最终以${home}-${away}失利`,
    play: "球队一度缩小差距，但对手随后利用反击守住领先；结果与时间线没有分开计算。"
  };
}

function assertMatchNarrativeConsistency(game, narrative) {
  const { home, away } = parseScore(game.score);
  const text = `${narrative.headline} ${narrative.play}`;
  const expected = home > away ? "W" : home < away ? "L" : "D";
  if (game.outcome !== expected) throw new Error(`比分${game.score}与赛果${game.outcome}不一致`);
  if (home === 0 && away === 0 && /(落后|扳平|反超|进球)/.test(text)) throw new Error("0-0叙事包含未发生的进球事件");
  if (/零封/.test(text) && away !== 0) throw new Error("零封叙事要求对手0球");
  if (/扳平/.test(text) && !(home === away && home > 0 && /先入一球/.test(text))) throw new Error("扳平叙事缺少先落后事件");
  return true;
}

function buildMatchStories(episode, games) {
  const opponents = MATCH_OPPONENTS[episode.id] || Array.from({ length: games.length }, (_, index) => `${episode.match.opponent}${index + 1}`);
  const decisionIds = matchRelevantDecisionIds(episode);
  return games.map((game, index) => {
    const opponent = opponents[index] || `${episode.match.opponent}${index + 1}`;
    const narrative = matchNarrativeForResult(game, index);
    assertMatchNarrativeConsistency(game, narrative);
    const decisionId = decisionIds[index % Math.max(1, decisionIds.length)];
    const [decisionTitle, decisionText] = matchDecisionMoment(decisionId);
    return {
      ...game,
      opponent,
      ...narrative,
      decisionId,
      decisionTitle,
      decisionText: placeDecisionInsideMatch(decisionText, index)
    };
  });
}

function buildPostMatchScene(episode, games) {
  const wins = games.filter((game) => game.outcome === "W").length;
  const losses = games.filter((game) => game.outcome === "L").length;
  const mood = wins > losses ? "win" : losses > wins ? "loss" : "draw";
  const scenes = {
    e3: {
      speaker: "韩立锋", location: "录像室的灯还没有关",
      win: "“他们第一次在比赛里认出了训练过的动作。别把一次成功写成已经完成。”",
      draw: "“有些动作出来了，有些人还在等答案。现在我们终于知道下一堂训练练什么。”",
      loss: "“输的不是口号。哪一步没有人接住，明天一帧一帧看。”"
    },
    e6: {
      speaker: state.decisions.e6 === "hire_gu" ? "高竞" : "韩立锋", location: "六轮之后的教练办公室",
      win: "“成绩给了我们时间，但名单和身体没有因此变厚。下一轮别拿这六场当护身符。”",
      draw: "“这六场没有替谁证明永远正确。至少球员知道，明天进门时教练还是同一个人。”",
      loss: "“董事在门外。你可以让他们进来，但先决定进去以后是谁把失败说完整。”"
    },
    e8: {
      speaker: "孟书宁", location: "冬夜的医疗室",
      win: "“赢球的人也要做检查。疼痛不会因为积分榜好看就晚一天出现。”",
      draw: "“这场少拿两分，至少没有少一个人。你可以不同意，但要把两本账一起看。”",
      loss: "“比分已经发生，影像也已经发生。别要求其中一个替另一个消失。”"
    },
    e9: {
      speaker: "梁一川", location: "最后一轮后的更衣室",
      win: "“我们知道为什么赢，也知道不是所有代价都值得再来一次。现在去看完整赛季。”",
      draw: "“没人能把这五场概括成一个词。至少最后一次失误后，大家还在要球。”",
      loss: "“名次会写在门口。更衣室记住的，是落后时谁还愿意做自己答应过的事。”"
    }
  };
  const fallback = {
    speaker: episode.speaker || "队长", location: "终场后的更衣室",
    win: "“结果到了。现在别只记得比分，也记得我们是用什么换来的。”",
    draw: "“这一分没有回答所有问题，但它把问题留到了下一轮。”",
    loss: "“先别关灯。输球以后还愿不愿意把原因说完整，决定下一场从哪里开始。”"
  };
  const scene = scenes[episode.id] || fallback;
  return { speaker: scene.speaker, location: scene.location, quote: scene[mood], mood };
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

function secondSeasonEpisode(roundIndex = state.seasonTwoRound) {
  const round = SECOND_SEASON_ROUNDS[roundIndex];
  return {
    ...round,
    number: 11 + roundIndex,
    short: round.title.slice(0, 6),
    phase: "第二赛季",
    speaker: round.speaker
  };
}

function setSecondSeasonScene({ speaker, title, body, kind = "第二赛季" }, round = SECOND_SEASON_ROUNDS[state.seasonTwoRound]) {
  const meta = `${round.date} · ${round.location}`;
  renderVisualStage({
    background: round.background,
    character: round.character,
    expression: round.expression,
    motion: "focus",
    visualKey: `${round.id}.${state.phase}`
  }, meta);
  ui.eventMeta.textContent = meta;
  ui.sceneType.textContent = kind;
  ui.eventTitle.textContent = title;
  ui.eventSpeaker.textContent = speaker;
  const role = roleForSpeaker(speaker);
  ui.eventRole.textContent = role;
  ui.eventRole.classList.toggle("hidden", !role);
  ui.eventScene.innerHTML = body.map((paragraph) => `<p>${renderRichText(paragraph)}</p>`).join("");
  restartAnimation(ui.eventNarrative, "narrative-enter");
}

function applySecondSeasonLegacies(roundIndex) {
  Object.entries(SECOND_SEASON_LEGACIES).forEach(([sourceDecision, legacy]) => {
    if (legacy.round !== roundIndex || !Object.values(state.decisions).includes(sourceDecision)) return;
    if (state.seasonTwoLegaciesApplied.some((item) => item.sourceDecision === sourceDecision)) return;
    const before = captureClubSnapshot();
    applyNumericEffects(state.finance, legacy.finance);
    applyNumericEffects(state.operations, legacy.operations);
    applyNumericEffects(state.pitch, legacy.pitch);
    Object.keys(state.operations).forEach((key) => { state.operations[key] = clamp(state.operations[key]); });
    Object.keys(state.pitch).forEach((key) => { state.pitch[key] = clamp(state.pitch[key]); });
    adjustBoardTrust(legacy.boardTrust || 0, `第二赛季旧账：${legacy.title}`);
    state.minCash = Math.min(state.minCash, state.finance.cash);
    const after = captureClubSnapshot();
    const applied = { ...clone(legacy), sourceDecision, round: roundIndex, before, after };
    state.seasonTwoLegaciesApplied.push(applied);
    state.history.push({
      type: "legacy", season: 2, episode: roundIndex + 1,
      title: legacy.title, detail: legacy.text, sourceDecision,
      impact: { before, after }
    });
  });
}

function startSecondSeason() {
  state.seasonNumber = 2;
  state.seasonTwoRound = 0;
  state.seasonTwoStep = "scene";
  state.phase = "seasonTwoScene";
  state.completed = false;
  state.activeFreeAgentKey = null;
  applySecondSeasonLegacies(0);
  prepareFreeAgentOffer(SECOND_SEASON_ROUNDS[0].id, true);
  saveGame();
  if (showDismissalIfNeeded()) return;
  showScreen("game");
  render();
}

function renderSeasonTwoScene() {
  const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
  const legacies = state.seasonTwoLegaciesApplied.filter((item) => item.round === state.seasonTwoRound);
  setSecondSeasonScene({ speaker: round.speaker, title: round.title, body: [round.body] }, round);
  if (legacies.length) {
    ui.knowledgeCard.innerHTML = `<strong>第一赛季留下的东西今天找上门</strong>${legacies.map((item) => `<article class="season-legacy"><span>${escapeHtml(item.title)}</span><p>${escapeHtml(item.text)}</p></article>`).join("")}`;
    ui.knowledgeCard.classList.remove("hidden");
  }
  ui.eventPrompt.innerHTML = `<strong>第二年不是重新开始</strong><span>${legacies.length ? "去年的选择已经进入身体、工资或权力；你只能决定今天怎样接住。" : "这一轮没有旧账突然到期，但第一年的球队仍是今天的起点。"}</span>`;
  ui.eventPrompt.classList.remove("hidden");
  showContinue("听完现场，作出这一轮决定", () => {
    state.phase = "seasonTwoDecision";
    state.seasonTwoStep = "decision";
    saveGame();
    render();
  });
}

function renderSeasonTwoDecision() {
  const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
  setSecondSeasonScene({
    speaker: "你",
    title: "第二年的决定没有第一年的借口",
    body: [round.match.stakes],
    kind: "不可逆决定"
  }, round);
  ui.eventPrompt.innerHTML = "<strong>我现在要怎么说</strong><span>这一决定会立刻改变球队，也会进入最后的两年任期记录。</span>";
  ui.eventPrompt.classList.remove("hidden");
  round.choices.forEach((option) => {
    const cashChange = option.effects?.finance?.cash || 0;
    const affordable = state.finance.cash + cashChange >= 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "decision-choice";
    button.disabled = !affordable;
    button.innerHTML = `<span class="decision-label">${escapeHtml(option.label)}</span><span class="decision-line">“${escapeHtml(option.line)}”</span>${cashChange ? `<span class="finance-preview"><b>签字后的现金</b>${formatMoney(state.finance.cash + cashChange)}</span>` : ""}${affordable ? "" : '<span class="unavailable-reason">现有资金无法执行这项决定。</span>'}`;
    button.addEventListener("click", () => chooseSecondSeasonDecision(option));
    ui.choiceList.appendChild(button);
  });
}

function chooseSecondSeasonDecision(option) {
  const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
  if (state.seasonTwoDecisions[round.id]) return;
  const before = captureClubSnapshot();
  applyNumericEffects(state.finance, option.effects?.finance);
  applyNumericEffects(state.operations, option.effects?.operations);
  applyNumericEffects(state.pitch, option.effects?.pitch);
  Object.keys(state.operations).forEach((key) => { state.operations[key] = clamp(state.operations[key]); });
  Object.keys(state.pitch).forEach((key) => { state.pitch[key] = clamp(state.pitch[key]); });
  let trustDelta = option.boardTrust || 0;
  if (state.finance.cash < 0) trustDelta -= 8;
  else if (state.finance.cash < 500) trustDelta -= 3;
  adjustBoardTrust(trustDelta, `${round.date}：${option.label}`);
  state.minCash = Math.min(state.minCash, state.finance.cash);
  const after = captureClubSnapshot();
  state.seasonTwoDecisions[round.id] = option.id;
  state.lastDecisionImpact = { episodeId: round.id, optionId: option.id, before, after };
  state.history.push({ type: "decision", season: 2, episode: state.seasonTwoRound + 1, episodeTitle: round.title, optionId: option.id, title: option.label, detail: option.line, impact: { before, after } });
  state.phase = "seasonTwoImpact";
  state.seasonTwoStep = "impact";
  saveGame();
  if (showDismissalIfNeeded()) return;
  render();
}

function renderSeasonTwoImpact() {
  const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
  const option = round.choices.find((item) => item.id === state.seasonTwoDecisions[round.id]);
  const impact = state.lastDecisionImpact;
  setSecondSeasonScene({ speaker: round.speaker, title: round.title, body: [round.body] }, round);
  ui.eventCard.classList.add("impact-backdrop");
  ui.eventNarrative.classList.add("hidden");
  ui.feedbackScene.classList.add("impact-stage");
  ui.feedbackScene.innerHTML = `
    <div class="decision-record"><p class="eyebrow">第二赛季 · 记录在案</p><h3>${escapeHtml(option.label)}</h3><blockquote>“${escapeHtml(option.line)}”</blockquote></div>
    ${renderImpactReport({ title: option.label, before: impact.before, after: impact.after, foreshadow: genericForeshadow(impact.before, impact.after) })}
    <button id="impactContinue" class="primary-btn impact-continue" type="button">带着这些变化去看${escapeHtml(round.match.label)}</button>`;
  revealInteractiveLayer(ui.feedbackScene);
  document.getElementById("impactContinue").addEventListener("click", () => {
    state.phase = "match";
    state.seasonTwoStep = "match";
    ensureMatchReport(secondSeasonEpisode());
    if (showDismissalIfNeeded()) return;
    saveGame();
    render();
  });
}

function finishSecondSeasonRound() {
  if (state.seasonTwoRound >= SECOND_SEASON_ROUNDS.length - 1) {
    finishSeason();
    return;
  }
  state.seasonTwoRound += 1;
  state.seasonTwoStep = "scene";
  state.phase = "seasonTwoScene";
  applySecondSeasonLegacies(state.seasonTwoRound);
  const round = SECOND_SEASON_ROUNDS[state.seasonTwoRound];
  prepareFreeAgentOffer(round.id, true);
  saveGame();
  if (showDismissalIfNeeded()) return;
  render();
  scrollToStory();
}

function renderMatch() {
  const episode = state.seasonNumber === 2 ? secondSeasonEpisode() : currentEpisode();
  if (state.seasonNumber === 1) applyPendingCompetitiveEffects("match", episode.number);
  const report = state.matchReports.find((item) => item.episodeId === episode.id);
  if (!report) {
    ensureMatchReport(episode);
    return renderMatch();
  }
  if (!report.stories?.length || report.narrativeVersion !== 2) {
    report.stories = buildMatchStories(episode, report.games);
    report.narrativeVersion = 2;
    saveGame();
  }
  if (!report.postMatchScene) report.postMatchScene = buildPostMatchScene(episode, report.games);
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
  const trainingReceipts = state.competitiveEffectNotices[`${episode.number}:match`] || [];

  ui.eventCard.classList.add("hidden");
  ui.eventCard.hidden = true;
  ui.eventCard.inert = true;
  ui.feedbackScene.classList.add("hidden");
  ui.feedbackScene.hidden = true;
  ui.feedbackScene.inert = true;
  ui.matchReport.innerHTML = `
    <p class="eyebrow">MATCH DAYS</p>
    <div class="match-headline">
      <div><span>${escapeHtml(report.label)}</span><h2>${summary}</h2></div>
      <strong>${escapeHtml(report.opponent)}</strong>
    </div>
    <p class="match-stakes">${escapeHtml(report.stakes)}</p>
    ${trainingReceipts.length ? `<section class="training-receipts"><strong>训练兑现回执</strong>${trainingReceipts.map((item) => `<p><b>${escapeHtml(item.sourceLabel)}</b>${escapeHtml(item.receipt)}</p>`).join("")}</section>` : ""}
    ${report.games[0]?.probabilities ? `<div class="kickoff-odds"><span>开赛前模型 · 综合战力 ${report.strengthAtKickoff}</span><strong>胜 ${report.games[0].probabilities.win}%</strong><b>平 ${report.games[0].probabilities.draw}%</b><em>负 ${report.games[0].probabilities.loss}%</em></div>` : ""}
    <section class="match-stories">
      <header><span>不再用模板概括整轮</span><h3>${report.games.length > 1 ? `${report.games.length}场球，${report.games.length}个不同的转折` : "这一场球，具体怎样被你的决定改变"}</h3></header>
      ${report.stories.map((story, index) => `
        <article class="match-story ${story.outcome.toLowerCase()}">
          <div class="match-story-score"><span>第${index + 1}场 · ${escapeHtml(story.opponent)}</span><strong>${story.score}</strong><b>${story.outcome === "W" ? "胜" : story.outcome === "D" ? "平" : "负"}</b></div>
          <div class="match-story-play"><time>${story.minute}'</time><div><h4>${escapeHtml(story.headline)}</h4><p>${escapeHtml(story.play)}</p></div></div>
          <aside><span>你的决定进入了这个回合</span><strong>${escapeHtml(story.decisionTitle)}</strong><p>${escapeHtml(story.decisionText)}</p></aside>
        </article>`).join("")}
    </section>
    <section class="post-match-scene ${report.postMatchScene.mood}">
      <div><span>${escapeHtml(report.postMatchScene.location)}</span><strong>${escapeHtml(report.postMatchScene.speaker)}</strong></div>
      <blockquote>${escapeHtml(report.postMatchScene.quote)}</blockquote>
    </section>
    <div class="match-board-trust ${report.boardTrustChange >= 0 ? "up" : "down"}"><span>赛果进入董事会记录</span><strong>信任 ${signedNumber(report.boardTrustChange || 0)}</strong><small>当前 ${Math.round(state.boardTrust)} / 100 · ${escapeHtml(boardTrustLevel().label)}</small></div>
    <p class="match-note">每场比赛只把一个真实回合钉在你的管理决定上；比分仍保留对手发挥、折射和临场偶然。</p>
    <button id="matchContinue" class="primary-btn" type="button">${state.seasonNumber === 2 ? (state.seasonTwoRound === SECOND_SEASON_ROUNDS.length - 1 ? "查看两年任期最终结局" : "走进第二赛季的下一个节点") : "赛后，看看下一件事如何找上门"}</button>`;
  revealInteractiveLayer(ui.matchReport);
  $("matchContinue").addEventListener("click", state.seasonNumber === 2 ? finishSecondSeasonRound : beginEpisodeBridge);
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
  if (state.seasonNumber === 1 && !state.fired) {
    state.seasonOneComplete = true;
    state.completed = false;
  } else {
    state.completed = true;
  }
  state.finishedAt = new Date().toISOString();
  saveGame();
  renderResult();
  showScreen("result");
}

const decisionTendencies = {
  board_mandate: "ascent", club_charter: "institution", sporting_control: "authority",
  liquidity_first: "institution", first_team_push: "ascent", build_capacity: "institution",
  back_he: "authority", pressing_identity: "ascent", shared_principles: "institution",
  sell_captain: "ascent", renew_captain: "relationship", last_dance: "relationship",
  full_naming: "ascent", hybrid_naming: "institution", supporter_bond: "relationship",
  back_coach: "relationship", hire_gu: "ascent", three_game_review: "institution",
  medical_veto: "institution", informed_choice: "relationship", play_and_shoot: "ascent",
  sell_chen: "ascent", shareholder_loan: "authority", hold_course: "institution",
  bonus_push: "ascent", quiet_process: "institution", identity_runin: "relationship",
  institutionalize: "institution", personal_project: "authority", leave_record: "relationship",
  s2_integrate: "institution", s2_accelerate: "ascent", s2_youth_mix: "relationship",
  s2_public_target: "authority", s2_private_review: "institution", s2_sell_window: "ascent",
  s2_protect_bodies: "institution", s2_push_bodies: "ascent", s2_emergency_depth: "ascent",
  s2_hold_identity: "relationship", s2_all_in: "ascent", s2_share_burden: "institution"
};

function deriveSeasonEnding(position) {
  const tendencyCounts = { ascent: 0, institution: 0, authority: 0, relationship: 0 };
  Object.values(state.decisions).forEach((decisionId) => {
    const tendency = decisionTendencies[decisionId];
    if (tendency) tendencyCounts[tendency] += 1;
  });
  Object.values(state.seasonTwoDecisions || {}).forEach((decisionId) => {
    const tendency = decisionTendencies[decisionId];
    if (tendency) tendencyCounts[tendency] += 1;
  });
  const strongest = Object.entries(tendencyCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "institution";
  const promiseResults = state.promises.map((promise) => evaluatePromise(promise.id, position));
  const brokenPromises = promiseResults.filter((item) => item.status === "broken").length;
  const openDoors = Object.values(state.characterStates || {})
    .filter((item) => item.behavior === "open").length;
  const trustValues = Object.values(state.characterTrust || {});
  const averageTrust = trustValues.length
    ? trustValues.reduce((sum, value) => sum + value, 0) / trustValues.length
    : 0;

  const patternCopy = {
    ascent: "这一季，你最常把资源押在能够立刻被看见的上升上。",
    institution: "这一季，你最常要求把边界、异议和到期日写进程序。",
    authority: "这一季，你最常用清晰的个人责任换取行动速度。",
    relationship: "这一季，你最常先保住一个具体的人、一段关系或一份共同记忆。"
  }[strongest];

  let title = "终场哨没有替你回答这一季";
  if (position <= 6 && strongest === "ascent" && state.finance.cash < 1000) {
    title = "上升故事兑现了，下一张账单也已经到门口";
  } else if (strongest === "institution" && openDoors >= 5) {
    title = "俱乐部终于学会在坏消息发生前反对你";
  } else if (strongest === "authority" && averageTrust < 48) {
    title = "决定变快了，每个错误也只剩你的名字";
  } else if (strongest === "relationship" && brokenPromises > 0) {
    title = "你守住了一些人，却没能守住所有说过的话";
  } else if (position <= 6) {
    title = "球队向上走了，但没有一种代价因此消失";
  } else if (openDoors >= 5) {
    title = "名次没有成为故事，仍有人愿意把坏消息先告诉你";
  }

  const accessSentence = openDoors >= 6
    ? `${openDoors}个人仍愿意在坏消息公开前先来敲你的门。`
    : openDoors >= 3
      ? `${openDoors}个人还会直接来找你，其他人已经改走正式邮件、经纪人或董事会。`
      : "赛季结束时，大多数人已经不再把私下谈话当成可靠承诺。";
  const promiseSentence = brokenPromises
    ? `${brokenPromises}项明确承诺已经失信；它们不会被最终排名自动抹掉。`
    : "到期的明确承诺没有被最后一轮比分改写。";

  return { title, patternCopy, accessSentence, promiseSentence };
}

function renderResult() {
  const position = projectedPosition();
  const finalChoice = getDecision("e10");
  const seasonEnding = deriveSeasonEnding(position);
  const interim = state.seasonNumber === 1 && state.seasonOneComplete && !state.fired && !state.completed;
  ui.resultTitle.textContent = state.fired
    ? "董事会终止了你的任期"
    : interim
      ? `${state.clubName}的第一赛季结束了`
      : `${state.clubName}的两年任期结束了`;
  ui.resultSubtitle.textContent = state.fired
    ? `${state.managerName} · 任期在第${state.seasonNumber}赛季提前结束`
    : interim
      ? `${state.managerName}的中期记录 · 两年合同还剩一个赛季`
      : `${state.managerName}的完整两年任期记录`;
  ui.verdictTitle.textContent = state.fired
    ? `信任降至${Math.round(state.boardTrust)}，董事会不再让你进入下一场比赛`
    : interim
      ? "第一年不是结局：你做过的选择将进入第二年"
      : seasonEnding.title;

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
  ui.verdictBody.innerHTML = state.fired
    ? `<p>直接原因：${escapeHtml(state.firedReason || "赛果与经营风险连续越过董事会底线")}。</p><p>${financeSentence}</p><p>这不是普通的失败结算：两年合同允许董事会在信任跌至${BOARD_DISMISSAL_THRESHOLD}或以下时提前终止任期。</p>`
    : `<p>${seasonEnding.patternCopy}</p><p>${financeSentence}</p><p>${culture} ${seasonEnding.accessSentence}</p><p>${seasonEnding.promiseSentence}</p>${interim ? "<p>下一页不是重新开档。高薪、伤病、旧借款、看台积怨和制度投资，会在第二赛季按各自的时间到期。</p>" : ""}`;

  ui.finalStats.innerHTML = `
    <div><span>${interim ? "第一赛季推定" : "任期最终推定"}</span><strong>第${position}名</strong></div>
    <div><span>关键赛程记录</span><strong>${state.record.wins}胜 ${state.record.draws}平 ${state.record.losses}负</strong></div>
    <div><span>期末综合战力</span><strong>${strengthScore()}</strong></div>
    <div><span>董事会信任</span><strong>${Math.round(state.boardTrust)} / 100</strong></div>
    <div><span>期末现金</span><strong>${formatMoney(state.finance.cash)}</strong></div>
    <div><span>未来工资承诺</span><strong>${formatMoney(state.finance.wageCommitment)}</strong></div>`;

  ui.finalStrengthRadar.innerHTML = `${radarSvg(state.pitch, null, false)}<div class="final-radar-values">${STRENGTH_DIMENSIONS.map((dimension) => `<span>${dimension.short}<strong>${Math.round(state.pitch[dimension.key])}</strong></span>`).join("")}</div>`;
  const timelineItems = state.history.filter((item) => ["decision", "transfer", "transfer_pass", "legacy"].includes(item.type));
  ui.careerTimeline.innerHTML = timelineItems.length ? timelineItems.map((item) => {
    const season = item.season || 1;
    const nodeLabel = season === 2 ? `第二赛季 · 节点${item.episode}` : `第一赛季 · 第${item.episode}集`;
    const typeLabel = item.type === "decision" ? "你的选择" : item.type === "legacy" ? "长期影响兑现" : item.type === "transfer" ? "自由球员买入" : "自由球员未签";
    return `<article class="career-event ${item.type}"><div><span>${nodeLabel}</span><b>${typeLabel}</b></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail || "")}</p></article>`;
  }).join("") : '<p class="empty-state">任期尚未留下可回顾的决定。</p>';

  ui.continueSeasonBtn.classList.toggle("hidden", !interim);
  ui.continueSeasonBtn.textContent = "进入第二赛季：让第一年的后果到来";

  const epilogues = state.fired ? [
    { who: "董事会", text: `信任降至${Math.round(state.boardTrust)}。董事会收回比赛与转会授权，你的两年合同在这里提前终止。` },
    { who: "更衣室", text: "下一堂训练仍会开始，但名单、伤病和你留下的承诺将由临时管理组接手。被解雇不会让已经发生的选择消失。" }
  ] : buildEpilogues(finalChoice);
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
    result.push({ who: "俱乐部", text: "第一赛季以一份不讨好的公开记录结束。你仍要履行第二年合同，也因此无法假装那些伤病、付款与承诺从未发生。" });
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
    seasonNumber: state.seasonNumber,
    seasonOneComplete: state.seasonOneComplete,
    fired: state.fired,
    firedReason: state.firedReason,
    boardTrust: state.boardTrust,
    boardTrustHistory: state.boardTrustHistory,
    projectedPosition: state.completed ? projectedPosition() : null,
    finance: state.finance,
    multidimensionalStrength: {
      overall: strengthScore(),
      direct: state.pitch,
      support: state.operations
    },
    record: state.record,
    decisions: state.history,
    secondSeasonDecisions: state.seasonTwoDecisions,
    secondSeasonLegacies: state.seasonTwoLegaciesApplied,
    freeAgentOffers: state.freeAgentOffers,
    freeAgentSignings: state.freeAgentSignings,
    questionsAsked: state.questions,
    proactiveInquiries: state.proactiveQuestions,
    proactiveInquiriesRemaining: state.proactiveRemaining,
    knowledgeConfirmed: state.knowledge,
    promises: state.promises,
    openThreads: state.openThreads,
    matchReports: state.matchReports,
    deferredConsequences: state.deferredConsequences,
    resolvedConsequences: state.resolvedConsequences,
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
  if (SAVE_CONTEXT === "default") localStorage.removeItem(LEGACY_SAVE_KEY);
  state = null;
  ui.resumeBtn.classList.add("hidden");
  renderSaveSummary(null);
  showScreen("start");
}

function scrollToStory() {
  // 沉浸式舞台固定占满视口，不再依赖页面滚动定位剧情。
}

function closeGameDrawers({ returnFocus = true } = {}) {
  for (const drawer of [ui.clubDrawer, ui.historyDrawer]) {
    if (!drawer) continue;
    drawer.classList.remove("drawer-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.hidden = true;
    drawer.inert = true;
  }
  ui.clubPanelBtn?.setAttribute("aria-expanded", "false");
  ui.historyPanelBtn?.setAttribute("aria-expanded", "false");
  ui.drawerBackdrop?.classList.add("hidden");
  if (ui.drawerBackdrop) ui.drawerBackdrop.hidden = true;
  if (returnFocus && lastDrawerTrigger?.isConnected) lastDrawerTrigger.focus({ preventScroll: true });
  lastDrawerTrigger = null;
}

function openGameDrawer(drawer, trigger, target = null) {
  closeGameDrawers({ returnFocus: false });
  lastDrawerTrigger = trigger || document.activeElement;
  drawer.hidden = false;
  drawer.inert = false;
  drawer.classList.add("drawer-open");
  drawer.setAttribute("aria-hidden", "false");
  trigger?.setAttribute("aria-expanded", "true");
  ui.drawerBackdrop.hidden = false;
  ui.drawerBackdrop.classList.remove("hidden");
  if (target) {
    requestAnimationFrame(() => {
      drawer.scrollTo({ top: Math.max(0, target.offsetTop - 82), behavior: "smooth" });
    });
  }
  drawer.querySelector(".drawer-close")?.focus();
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

function openGlossary(term = null, trigger = document.activeElement) {
  lastOverlayTrigger = trigger;
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
  ui.glossaryPanel.hidden = false;
  ui.glossaryPanel.inert = false;
  ui.glossaryPanel.setAttribute("aria-hidden", "false");
  ui.glossaryBtn.setAttribute("aria-expanded", "true");
  ui.glossaryPanel.classList.remove("hidden");
  ui.glossaryCloseBtn.focus();
}

function closeGlossary(returnFocus = true) {
  ui.glossaryPanel.classList.add("hidden");
  ui.glossaryPanel.setAttribute("aria-hidden", "true");
  ui.glossaryPanel.hidden = true;
  ui.glossaryPanel.inert = true;
  ui.glossaryBtn.setAttribute("aria-expanded", "false");
  if (returnFocus && lastOverlayTrigger?.isConnected) lastOverlayTrigger.focus({ preventScroll: true });
  lastOverlayTrigger = null;
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
    const existing = readSave();
    if (existing && !window.confirm(`这会覆盖 ${existing.managerName} 在 ${existing.clubName} 的本地进度（${existing.persistence?.checkpoint || checkpointSummary(existing)}）。确定开始新任期吗？`)) return;
    localStorage.removeItem(SAVE_KEY);
    if (SAVE_CONTEXT === "default") localStorage.removeItem(LEGACY_SAVE_KEY);
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
    if (state.completed || state.fired || (state.seasonNumber === 1 && state.seasonOneComplete)) {
      renderResult();
      showScreen("result");
    } else if (state.seasonNumber === 2) {
      showScreen("game");
      render();
    } else {
      showScreen("game");
      beginEpisode(state.currentEpisode, { fresh: false });
    }
  });

  ui.restartBtn.addEventListener("click", restartGame);
  ui.resultRestartBtn.addEventListener("click", restartGame);
  ui.continueSeasonBtn.addEventListener("click", startSecondSeason);
  ui.exportBtn.addEventListener("click", exportGame);
  ui.resultExportBtn.addEventListener("click", exportGame);
  ui.proactiveInquiryBtn.addEventListener("click", () => {
    closeGameDrawers({ returnFocus: false });
    openProactiveInquiry();
  });
  ui.clubPanelBtn.addEventListener("click", () => openGameDrawer(ui.clubDrawer, ui.clubPanelBtn));
  ui.historyPanelBtn.addEventListener("click", () => openGameDrawer(ui.historyDrawer, ui.historyPanelBtn));
  ui.hudFinanceBtn.addEventListener("click", () => openGameDrawer(ui.clubDrawer, ui.clubPanelBtn, $("financePanel")));
  ui.hudStrengthBtn.addEventListener("click", () => ui.strengthModal.classList.remove("hidden"));
  ui.hudBoardTrustBtn.addEventListener("click", () => openGameDrawer(ui.clubDrawer, ui.clubPanelBtn, $("boardTrustPanel")));
  ui.strengthModalClose.addEventListener("click", () => ui.strengthModal.classList.add("hidden"));
  ui.strengthModal.addEventListener("click", (event) => {
    if (event.target === ui.strengthModal) ui.strengthModal.classList.add("hidden");
  });
  ui.freeAgentAlert.addEventListener("click", openFreeAgentModal);
  ui.decisionConfirmSubmit.addEventListener("click", confirmDecision);
  ui.decisionConfirmCancel.addEventListener("click", () => closeDecisionConfirmation());
  ui.decisionConfirmModal.addEventListener("click", (event) => {
    if (event.target === ui.decisionConfirmModal) closeDecisionConfirmation();
  });
  ui.freeAgentClose.addEventListener("click", closeFreeAgentModal);
  ui.freeAgentModal.addEventListener("click", (event) => {
    if (event.target === ui.freeAgentModal) closeFreeAgentModal();
  });
  ui.drawerBackdrop.addEventListener("click", closeGameDrawers);
  document.querySelectorAll("[data-close-drawer]").forEach((button) => {
    button.addEventListener("click", closeGameDrawers);
  });
  ui.glossaryBtn.addEventListener("click", () => openGlossary(null, ui.glossaryBtn));
  ui.glossaryCloseBtn.addEventListener("click", closeGlossary);
  ui.glossaryPanel.addEventListener("click", (event) => {
    if (event.target === ui.glossaryPanel) closeGlossary();
  });
  document.addEventListener("click", (event) => {
    const term = event.target.closest?.(".glossary-term");
    if (!term) return;
    event.preventDefault();
    event.stopPropagation();
    openGlossary(term.dataset.term, term);
  }, true);
  document.addEventListener("keydown", (event) => {
    const term = event.target.closest?.(".glossary-term");
    if (term && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openGlossary(term.dataset.term, term);
    }
    if (event.key === "Escape" && !ui.decisionConfirmModal.classList.contains("hidden")) closeDecisionConfirmation();
    else if (event.key === "Escape" && !ui.freeAgentModal.classList.contains("hidden")) closeFreeAgentModal();
    else if (event.key === "Escape" && !ui.strengthModal.classList.contains("hidden")) ui.strengthModal.classList.add("hidden");
    else if (event.key === "Escape" && !ui.glossaryPanel.classList.contains("hidden")) closeGlossary();
    else if (event.key === "Escape") closeGameDrawers();
  });
  ui.focusModeBtn.addEventListener("click", () => {
    setStoryFocus(ui.focusModeBtn.getAttribute("aria-pressed") !== "true");
  });
}

function setStartReady(ready, message) {
  ui.startBtn.disabled = !ready;
  ui.startBtn.setAttribute("aria-busy", String(!ready));
  ui.startBtn.textContent = ready ? "从雨里走进去" : "正在载入球队…";
  ui.startStatus.textContent = message;
}

async function loadVisualData() {
  try {
    const visualResponse = await fetch("visual-data.json", { cache: "no-store" });
    if (!visualResponse.ok) return false;
    visualData = await visualResponse.json();
    scheduleEpisodeVisualPreload(visualData.scope?.[0]);
    if (state) render();
    return true;
  } catch (visualError) {
    console.warn("视觉素材未载入，继续使用文字模式。", visualError);
    return false;
  }
}

async function boot() {
  try {
    try {
      const buildResponse = await fetch(`build.json?check=${Date.now()}`, { cache: "no-store" });
      const published = buildResponse.ok ? await buildResponse.json() : null;
      if (published?.build && published.build !== BUILD_VERSION) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("build", published.build);
        window.location.replace(nextUrl.toString());
        return;
      }
    } catch (buildError) {
      console.warn("构建版本验证暂时不可用。", buildError);
    }
    const response = await fetch("story-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    gameData = await response.json();
    const visualsReady = await loadVisualData();
    bindEvents();
    setStoryFocus(localStorage.getItem(FOCUS_MODE_KEY) === "1");
    const saved = readSave();
    if (saved) ui.resumeBtn.classList.remove("hidden");
    renderSaveSummary(saved);
    renderPersistenceStatus();
    setStartReady(true, visualsReady
      ? "剧情与画面已经载入。现在可以从雨里走进去。"
      : "剧情已经载入；部分画面暂时不可用，但可以继续游戏。"
    );
  } catch (error) {
    ui.startForm.innerHTML = `
      <h2>剧情数据没有载入</h2>
      <p>请通过本地网页服务打开项目，而不是直接双击 index.html。</p>
      <code>python3 -m http.server 8173</code>`;
    console.error(error);
  }
}

boot();
