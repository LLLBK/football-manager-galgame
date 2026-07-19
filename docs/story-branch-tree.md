# 岚城联：剧情分支树

版本：0.5
依据文件：`story-data.json`

这份文档只描述学生端可见剧情分支。当前游戏在第一个正式选择前增加了 6 段序章剧情；序章用于建立球队处境，不改变数值。正式经营部分不是传统“从 A 跳到 B、从 B 跳到 C”的纯树状结构，而是：

```text
共同赛季阶段 + 条件触发事件 + 选项改变球队状态 + 下一阶段重新判断
```

也就是说，所有玩家都会依次经过 10 个阶段，但每个阶段遇到的具体事件会根据此前选择、现金、经营状态和竞技状态不同而变化。

## 分支总览

```mermaid
flowchart TD
  Start["开始：填写经理人姓名与球队名"] --> Prologue["序章：上任第一天 6 个场景"]
  Prologue --> S1["S1 上任定位"]

  S1 -->|签三年重建章程| S2Default["S2 默认预算"]
  S1 -->|接受 800 万并承诺前四| S2Ambition["S2 加压预算"]
  S1 -->|拨 150 万恢复球迷组织| S2Community["S2 社区预算"]

  S2Default --> S3Check{"S3 青训体系 >= 58?"}
  S2Ambition --> S3Check
  S2Community --> S3Check

  S3Check -->|是| S3Youth["S3 青训主管事件"]
  S3Check -->|否| S3Default["S3 默认引援事件"]

  S3Youth --> S4Check{"S4 核心问题判断"}
  S3Default --> S4Check
  S4Check -->|已签成名老将| S4Veteran["S4 新援高薪刺激核心不满"]
  S4Check -->|否则，俱乐部文化 >= 58| S4Culture["S4 核心支持重建"]
  S4Check -->|否则| S4Default["S4 核心续约危机"]

  S4Veteran --> S5Check{"S5 青训体系 >= 58?"}
  S4Culture --> S5Check
  S4Default --> S5Check
  S5Check -->|是| S5Youth["S5 青年队教练事件"]
  S5Check -->|否| S5Default["S5 默认教练路线"]

  S5Youth --> S6Check{"S6 现金 < 1200?"}
  S5Default --> S6Check
  S6Check -->|是| S6Tight["S6 现金紧张赞助事件"]
  S6Check -->|否| S6Default["S6 默认赞助事件"]

  S6Tight --> S7Check{"S7 队内权力平衡 <= 42?"}
  S6Default --> S7Check
  S7Check -->|是| S7Star["S7 球星权力过大"]
  S7Check -->|否| S7Default["S7 默认更衣室裂痕"]

  S7Star --> S8Check{"S8 阵容厚度 >= 56?"}
  S7Default --> S8Check
  S8Check -->|是| S8Depth["S8 轮换阵容考验"]
  S8Check -->|否| S8Default["S8 默认伤病事件"]

  S8Depth --> S9Check{"S9 sponsorPath == big?"}
  S8Default --> S9Check
  S9Check -->|是| S9Commercial["S9 商业化冷场"]
  S9Check -->|否| S9Default["S9 默认主场比赛"]

  S9Commercial --> HomeResult["主场比赛：胜 / 平 / 负"]
  S9Default --> HomeResult
  HomeResult --> S10Check{"S10 体能健康 <= 46?"}
  S10Check -->|是| S10Fatigue["S10 体能透支客场"]
  S10Check -->|否| S10Default["S10 默认客场比赛"]

  S10Fatigue --> AwayResult["客场比赛：胜 / 平 / 负"]
  S10Default --> AwayResult
  AwayResult --> End["生成球队报告与数据码"]
```

## 完整阶段树

### S1 上任定位

```text
S1 上任定位
└─ opening_board｜董事会会议：岚城联到底要成为什么球队？（默认）
   ├─ opening_stable｜维持现有预算，签署三年重建章程
   │  └─ 设置 openingPath = stable；进入 S2 时通常走默认预算
   ├─ opening_ambition｜接受董事会追加 800 万，承诺冲击联赛前四
   │  └─ 董事会注资 +800；设置 openingPath = ambition；进入 S2 加压预算
   └─ opening_community｜拨出 150 万社区专项款，恢复球迷代表会议
      └─ 当前现金 -150；设置 openingPath = community；进入 S2 社区预算
```

### S2 赛季预算

```text
S2 赛季预算
├─ budget_ambition｜加压预算会：董事会要看到成绩
│  触发：openingPath == ambition
│  ├─ budget_first_team_push｜花 1400 万签下一名首发边锋和一名轮换后卫
│  │  └─ 门槛：现金 >= 1400；当前现金 -1400
│  └─ budget_balance_under_pressure｜只批 900 万：补轮换球员并升级体能设备
│     └─ 门槛：现金 >= 900；当前现金 -900
├─ budget_community｜社区预算会：球迷代表也坐进了房间
│  触发：openingPath == community
│  ├─ budget_youth_community｜翻修青训训练场，并与本地学校共建梯队
│  │  └─ 门槛：现金 >= 850；当前现金 -850；第 8 阶段前设施尾款 250
│  └─ budget_respect_fans_buy_player｜花 1000 万签回本地出身的边后卫周航
│     └─ 门槛：现金 >= 1000；当前现金 -1000；工资承诺 +220
└─ budget_default｜赛季预算分配（默认）
   ├─ budget_first_team｜花 1200 万签下一名主力边锋和一名替补后卫
   │  └─ 门槛：现金 >= 1200；当前现金 -1200
   ├─ budget_youth｜启动训练基地一期工程，增聘两名青训教练
   │  └─ 门槛：现金 >= 900；当前现金 -900；第 8 阶段前设施尾款 300
   └─ budget_balanced｜把 1000 万拆给球探、青训和体能三个部门
      └─ 门槛：现金 >= 1000；当前现金 -1000
```

### S3 球员来源

```text
S3 球员来源
├─ recruit_youth_path｜青训主管敲门：梯队里有个孩子可以试试
│  触发：青训体系 >= 58
│  ├─ recruit_promote_youth｜给 18 岁前锋程野一线队合同和替补名额
│  │  └─ 门槛：现金 >= 80；当前现金 -80；设置 promotedYouth = true
│  └─ recruit_young_player｜花 650 万签下 20 岁前锋罗钧
│     └─ 门槛：现金 >= 650；当前现金 -650；工资承诺 +180
└─ recruit_default｜青训新人与即战力引援（默认）
   ├─ recruit_veteran｜花 1100 万签下 32 岁名将韩拓担任主力前锋
   │  └─ 门槛：现金 >= 1100；当前现金 -1100；工资承诺 +500；设置 signedVeteran = true
   ├─ recruit_young_default｜花 650 万签下 20 岁前锋罗钧作为轮换
   │  └─ 门槛：现金 >= 650；当前现金 -650；工资承诺 +180
   └─ recruit_loan｜支付 350 万租借费，引进能立即执行战术的前锋
      └─ 门槛：现金 >= 350；当前现金 -350
```

### S4 核心问题

```text
S4 核心问题
├─ star_new_veteran｜新援高薪刺激核心不满
│  触发：signedVeteran == true
│  优先级：最高；只要签过成名老将，优先进入这个分支
│  ├─ star_match_wage｜给梁一川同级顶薪，并保证战术核心位置
│  │  └─ 门槛：现金 >= 500；当前现金 -500；工资承诺 +800；奖金承诺 +300
│  └─ star_refuse_after_veteran｜维持梁一川原合同，取消新援的特殊待遇扩张
│     └─ 无立即支出
├─ star_support_rebuild｜核心愿意支持重建，但要看到长期计划
│  触发：俱乐部文化 >= 58
│  ├─ star_rebuild_captain｜续任队长，并把青训出场目标写入奖金协议
│  │  └─ 门槛：现金 >= 150；当前现金 -150；奖金承诺 +350
│  └─ star_sell_for_future｜接受争冠队 1600 万报价，让梁一川转会
│     └─ 当前现金 +1600；工资承诺 -450；设置 coreStarInTeam = false
└─ star_default｜核心球星续约危机（默认）
   ├─ star_full_contract｜按经纪人报价与梁一川续约三年
   │  └─ 门槛：现金 >= 500；当前现金 -500；工资承诺 +700；奖金承诺 +300
   ├─ star_wage_discipline｜拒绝新约，让梁一川履行最后一年合同
   │  └─ 无立即支出
   ├─ star_delay_talks｜先付 150 万忠诚奖金，把续约推迟到两轮联赛后
   │  └─ 门槛：现金 >= 150；当前现金 -150；设置 delayedStarTalks = true
   └─ star_sell｜接受 1600 万报价，立即出售梁一川
      └─ 当前现金 +1600；工资承诺 -450；设置 coreStarInTeam = false
```

### S5 教练路线

```text
S5 教练路线
├─ coach_youth｜青年队教练得到更衣室支持
│  触发：青训体系 >= 58
│  ├─ coach_promote_youth｜解约现任教练，任命青年队教练罗志衡
│  │  └─ 门槛：现金 >= 150；当前现金 -150；设置 headCoach = youth
│  └─ coach_current_with_youth_staff｜保留现任主帅，任命罗志衡为一线队助教
│     └─ 门槛：现金 >= 300；当前现金 -300；设置 headCoach = current
└─ coach_default｜主教练与战术路线（默认）
   ├─ coach_star｜支付 900 万换帅成本，聘请名帅高竞
   │  └─ 门槛：现金 >= 900；当前现金 -900；工资承诺 +300；设置 headCoach = star
   ├─ coach_support_current｜续留现任主帅，增聘定位球与体能教练
   │  └─ 门槛：现金 >= 450；当前现金 -450；设置 headCoach = current
   └─ coach_promote_default｜解约现任教练，内部提拔罗志衡
      └─ 门槛：现金 >= 150；当前现金 -150；设置 headCoach = youth
```

### S6 赞助与社区

```text
S6 赞助与社区
├─ sponsor_cash_tight｜现金紧张：赞助商知道你需要钱
│  触发：现金 < 1200
│  ├─ sponsor_forced_big｜签约曜石集团：收取 1500 万，交出看台命名权
│  │  └─ 当前现金 +1500；设置 sponsorPath = big
│  └─ sponsor_hold_tight｜拒签合同，冻结非必要采购和冬窗考察
│     └─ 无立即收入
└─ sponsor_default｜赞助商与社区关系（默认）
   ├─ sponsor_big｜签约曜石集团：收取 1400 万并更名东看台
   │  └─ 当前现金 +1400；设置 sponsorPath = big
   ├─ sponsor_local｜与六家本地企业联签：650 万现金加 200 万青训专款
   │  └─ 当前现金 +650；青训专项资金 +200；设置 sponsorPath = local
   └─ sponsor_wait｜拒绝三份报价，只签两个月临时广告
      └─ 无立即收入；设置 sponsorPath = wait
```

### S7 更衣室

```text
S7 更衣室
├─ locker_star_power｜球星权力过大：替补开始抱怨
│  触发：队内权力平衡 <= 42
│  ├─ locker_back_coach｜发布纪律声明，并把抱怨的替补移出热身赛名单
│  │  └─ 无立即支出
│  ├─ locker_captains_meeting｜暂停公开回应，由队长组重订出场与训练规则
│  │  └─ 内部会议，无现金变化
│  └─ locker_protect_stars｜保留球星首发特权，把抱怨者挂牌出租
│     └─ 无立即支出
└─ locker_default｜更衣室裂痕（默认）
   ├─ locker_back_coach_default｜公布训练评分，并对公开抱怨者警告一次
   │  └─ 无立即支出
   └─ locker_internal_default｜让队长组与替补闭门确认轮换计划
      └─ 内部会议，无现金变化
```

### S8 伤病与医疗

```text
S8 伤病与医疗
├─ injury_depth_test｜轮换阵容经受考验
│  触发：阵容厚度 >= 56
│  ├─ injury_rotate_confident｜让后腰休战，并安排三天个人恢复计划
│  │  └─ 门槛：现金 >= 120；当前现金 -120
│  └─ injury_keep_main_depth｜主力后腰照常首发 60 分钟
│     └─ 无立即支出
└─ injury_default｜伤病与医疗投入（默认）
   ├─ injury_medical｜花 550 万组建赛季医疗与恢复小组
   │  └─ 门槛：现金 >= 550；当前现金 -550
   ├─ injury_rotate｜两名不适主力休战，并追加一周恢复营
   │  └─ 门槛：现金 >= 180；当前现金 -180
   └─ injury_push｜维持全主力首发，不调整训练负荷
      └─ 无立即支出；设置 injuryRisk = true
```

### S9 第一场主场

```text
S9 第一场主场
├─ home_commercial_cold｜商业化冷场：主场不再像从前
│  触发：sponsorPath == big
│  ├─ home_fan_repair｜拿出 260 万恢复公益票，并资助球迷看台展示
│  │  └─ 门槛：现金 >= 260；当前现金 -260；进入主场比赛模拟
│  └─ home_commercial_continue｜执行赞助商首战套餐，收取 260 万活动款
│     └─ 当前现金 +260；进入主场比赛模拟
└─ home_default｜第一场主场比赛（默认）
   ├─ home_fan_day｜花 220 万举办首战球迷日
   │  └─ 门槛：现金 >= 220；当前现金 -220；进入主场比赛模拟
   ├─ home_business｜出售首战包厢套餐和场边品牌活动
   │  └─ 当前现金 +260；进入主场比赛模拟
   └─ home_normal｜按常规方案办赛，不加活动也不增加售票补贴
      └─ 无额外收支；进入主场比赛模拟

主场比赛模拟结果：
├─ 胜：设置 homeResult = 胜；球迷信任、管理层耐心、媒体关系、心理稳定性、更衣室凝聚力上升
├─ 平：设置 homeResult = 平；管理层耐心小降，心理稳定性小升
└─ 负：设置 homeResult = 负；球迷信任、管理层耐心、媒体关系、心理稳定性、更衣室凝聚力下降
```

### S10 第一场客场

```text
S10 第一场客场
├─ away_fatigue｜体能透支：客场前夜的艰难选择
│  触发：体能健康 <= 46
│  ├─ away_rotate_tired｜更换 5 名首发，让疲劳主力留在替补席
│  │  └─ 无立即支出；进入客场比赛模拟
│  └─ away_push_tired｜沿用主场首发，只调整训练量
│     └─ 无立即支出；设置 injuryRisk = true；进入客场比赛模拟
└─ away_default｜第一场客场比赛（默认）
   ├─ away_premium｜在基础差旅上追加 260 万，提前一天包机出发
   │  └─ 门槛：现金 >= 260；当前现金 -260；进入客场比赛模拟
   ├─ away_save｜使用已经预订的高铁、普通酒店和公共训练场
   │  └─ 基础差旅已支付；无追加支出；进入客场比赛模拟
   ├─ away_rotate｜更换 5 名首发，使用轮换阵容
   │  └─ 无立即支出；进入客场比赛模拟
   └─ away_push｜完全沿用主场首发，继续主动进攻
      └─ 无立即支出；设置 injuryRisk = true；进入客场比赛模拟

客场比赛模拟结果：
├─ 胜：设置 awayResult = 胜；球迷信任、管理层耐心、媒体关系、心理稳定性、更衣室凝聚力上升
├─ 平：设置 awayResult = 平；管理层耐心小降，心理稳定性小升
└─ 负：设置 awayResult = 负；球迷信任、管理层耐心、媒体关系、心理稳定性、更衣室凝聚力下降
```

## 关键交叉分支说明

### 1. S2 由 S1 直接决定

```text
S1 接受 800 万并承诺前四 → S2 加压预算
S1 拨款恢复球迷组织 → S2 社区预算
S1 签署三年重建章程 → S2 默认预算
```

### 2. S4 的优先级会覆盖文化路线

```text
如果 S3 签下成名老将：
  S4 必定优先进入“新援高薪刺激核心不满”
否则，如果俱乐部文化 >= 58：
  S4 进入“核心愿意支持重建”
否则：
  S4 进入默认“核心球星续约危机”
```

### 3. S6 的现金紧张分支会覆盖普通赞助

```text
进入 S6 时如果现金 < 1200：
  进入“现金紧张：赞助商知道你需要钱”
否则：
  进入普通赞助选择
```

### 4. S9 由赞助路线决定

```text
如果 S6 选择大型商业赞助：
  S9 进入“商业化冷场”
否则：
  S9 进入默认主场比赛
```

### 5. S10 受前面体能管理和主场后果影响

```text
进入 S10 时如果体能健康 <= 46：
  进入“体能透支”
否则：
  进入默认客场比赛
```

## 路线数量

按当前代码枚举：

```text
只计算玩家选择形成的完整路线：18,156 条
如果把主场和客场胜 / 平 / 负也算入结局：163,404 条
```

这些数量来自条件事件、现金门槛、状态变化和两场比赛随机结果共同组合，不是把每个阶段的选项数简单相乘。
