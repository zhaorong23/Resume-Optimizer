export const SAMPLE_RESUME = `张三 | AI产品经理
电话：138xxxx | 邮箱：zhangsan@email.com

个人总结：
3年互联网产品经验，熟悉 AI 产品从 0 到 1 流程，有 LLM 应用落地经验。

工作经历：
某科技公司 | AI产品经理 | 2022.06 - 至今
- 负责 AI 简历优化工具的产品设计与 PRD 撰写
- 规划简历分析、岗位匹配、AI 改写三大核心功能
- 协调研发完成 MVP 上线

项目经历：
AI 简历优化工具
- 背景：为求职者提供基于大模型的简历优化服务
- 技术栈：LLM / Prompt Engineering / RAG
- 产出：完成产品方案与功能规划`;

export const SAMPLE_JD = `AI产品经理

岗位职责：
1. 负责 AI 功能从 0 到 1 的产品规划与落地
2. 撰写 PRD，协调研发、设计、运营跨部门协作
3. 熟悉大模型、Prompt Engineering、RAG 等技术方案
4. 有 B 端或 C 端 AI 产品经验优先

任职要求：
- 3年以上产品经理经验
- 了解 LLM 原理与应用场景
- 具备数据分析能力，能用数据驱动产品决策
- 优秀的沟通与项目管理能力`;

export const SAMPLE_FOCUS = "突出 AI 产品经验与量化成果";

export type GoldenFixture = {
  id: string;
  roleType: "pm" | "ops";
  companyName: string;
  roleTitle: string;
  resume: string;
  jd: string;
  expectedKeywords: string[];
  /** 硬锚点：改写不得删除或篡改的项目名/数字 */
  mustKeep?: string[];
  /** 禁止虚构：不得出现在改写或 gap 中的表述 */
  mustNot?: string[];
  /** 仅用于评测文档与比对，不参与生成 */
  matchTier?: "strong" | "medium" | "weak";
};

export const GOLDEN_PM: GoldenFixture = {
  id: "GOLDEN_PM",
  roleType: "pm",
  companyName: "智谱清言",
  roleTitle: "AI产品经理实习生",
  resume: SAMPLE_RESUME,
  jd: SAMPLE_JD,
  expectedKeywords: ["产品", "需求", "PRD", "功能", "跨团队", "0-1"],
};

export const GOLDEN_PM_GROWTH: GoldenFixture = {
  id: "GOLDEN_PM_GROWTH",
  roleType: "pm",
  companyName: "某互联网公司",
  roleTitle: "增长产品经理",
  resume: SAMPLE_RESUME,
  jd: `增长产品经理

岗位职责：
1. 负责用户增长漏斗优化，提升拉新与留存
2. 设计 A/B 实验验证增长假设，控制 CAC
3. 搭建数据看板，监控 DAU、留存、激活率等核心指标
4. 与运营协作策划促活活动

任职要求：
- 2年以上增长或产品经理经验
- 熟悉 AARRR 增长模型
- 具备数据拆解与实验设计能力`,
  expectedKeywords: ["增长", "留存", "AARRR", "拉新", "实验"],
};

export const GOLDEN_OPS: GoldenFixture = {
  id: "GOLDEN_OPS",
  roleType: "ops",
  companyName: "美团",
  roleTitle: "产品运营",
  resume: `李四 | 产品运营
电话：139xxxx | 邮箱：lisi@email.com

个人总结：
2年产品运营经验，擅长活动策划与用户分层运营。

工作经历：
某本地生活平台 | 产品运营 | 2023.03 - 至今
- 策划双11大促活动，带动 DAU 提升 18%
- 搭建用户分层体系，提升核心功能渗透率 12%
- 复盘活动 ROI，优化后续投放策略

项目经历：
新人激活专项
- 设计 onboarding 流程与 Push 触达策略
- 7日留存从 22% 提升至 31%`,
  jd: `产品运营

岗位职责：
1. 负责用户分层与生命周期运营，提升留存与活跃
2. 策划并执行拉新促活活动，复盘 ROI
3. 提升核心功能渗透率，优化触达策略
4. 监控 DAU、留存、转化等运营指标

任职要求：
- 1年以上产品运营或用户运营经验
- 具备活动复盘与数据分析能力
- 熟悉 Push、弹窗等触达机制`,
  expectedKeywords: ["活动", "留存", "渗透", "ROI", "用户分层", "促活"],
};

/** 脱敏后的真实校招运营简历 A：内容/用户/调研向 */
export const OPT_OPS_A_RESUME = `王同学 | 产品运营（应届）
电话：138xxxx | 邮箱：wangxx@email.com

个人总结：
金融专业本科在读，擅长用户洞察、内容运营与数据复盘，有产品调研与小红书 0-1 运营经验。

教育背景：
某大学 | 金融学 | 2022.09 - 2026.06（应届）
- GPA 3.69/4.00；获国家励志奖学金、学业优秀奖学金等
- 核心课程：金融经济学 91、宏观经济学 95、国际金融 91；英语六级 515
- 交换学习（2025.02-2025.06）：GPA 4.15/4.3

实习经历：
某食品科技公司 | 产品调研实习生（AI+食品消费方向）| 2025.07 - 2025.09
- 搭建 Excel 数据库，分析 10+ 品牌 30+ SKU 豆奶饮品月销量
- 文本分析 1 万+ 用户评论，量化「低糖」「口感」「性价比」等关键词权重
- 针对减脂/养生/奶茶替代三类女性人群，结合竞品要素提出 3 条产品迭代建议（口味/场景/价格），被部门采纳

某投资机构 | 投资分析实习生 | 2025.01 - 2025.02
- 参与募资项目初步尽调，从行业规模、团队、核心产品评估项目价值
- 运用 TAM-SAM-SOM 模型估算市场规模，结合相对估值法交叉验证

校园经历：
小红书个人美食账号 | 内容运营 | 2024.05 - 2026.05
- 定位为「学生党平价探店」，调研 20+ 竞品后确定差异化定位
- 0-1 搭建账号，粉丝 1200+；5+ 篇笔记破万阅读，单篇涨粉 200+
- 通过数据复盘识别高互动内容规律，调整策略后单篇收藏提升 10-20 倍（最高 1500+）

学联宣传部部长 | 2024.09 - 2025.07
- 用小成本礼品引流 300+ 学生（同比 +30%），统筹大型活动参与 787 人次

社会调研队长 | 2026.01
- 将学术问卷转化为生活化话题，个人完成 40+ 深访（团队第一）

技能：
Excel（VLOOKUP、数据透视表）、Python、Stata；剪映、Canva、PPT`;

/** 脱敏后的真实校招运营简历 B：数据/活动/平台向 */
export const OPT_OPS_B_RESUME = `李同学 | 产品运营（实习/校招）
电话：139xxxx | 邮箱：lixx@email.com

个人总结：
管科硕士在读，具备数据驱动运营与活动策划经验，熟悉竞品分析、用户洞察与流程管理。

教育经历：
福州大学（211）| 管理科学与工程 | 2024.09 - 2027.07（应届）
江西财经大学 | 工商管理 | 2020.09 - 2024.07
- 核心课程：数据挖掘、运筹学、统计分析、运营管理、市场营销
- 荣誉：2023 互联网+ 国赛银奖；2022 跨境电商商业精英挑战赛国赛二等奖

工作经历：
创新项目咨询顾问 | 2023.12 - 至今
- 服务 100+ 创新项目，深度咨询 20+ 核心项目；分析行业痛点、定义业务落地路径
- 辅导项目获 40+ 国/省级奖项（含 1 项国金）；进高阶赛事转化率提升 40%

字节跳动（抖音集团）| 招聘运营实习生 | 2024.03 - 2024.05
- 拆解研发业务画像、搭建标签库；日筛 800+ 简历，日产 30+ 合格候选人
- 维护 6 家猎头渠道，月处理 100+ 推荐；跟踪漏斗转化率优化 sourcing 策略

项目经历：
跨境电商 AI-VOC 决策系统（负责人）
- 调研选品流程，定义以用户声音（VOC）驱动的自动化决策系统
- 规划实时监控、市场洞察、趋势雷达等 7 大模块；LLM 优化 Listing、AI 差评分类，VOC 分析周期缩短 80%

互联网+ 国赛银奖项目（核心成员）
- 深度调研 10+ 行业龙头，产出 1 万字方案，路演 PPT 迭代 70+ 版

亚马逊平台沙盘运营（核心成员）
- 分析市场数据选品、动态调整定价与库存；产出 6000 字 ROI 与转化率分析报告

技能：
SQL、Excel（数据透视表）、SPSS、Stata；PPT、PS、Canva；文案策划、活动策划`;

export const OPS_JD_BAIDU = `产品运营实习生（内容方向）

工作内容：
1. 负责 AI 虚拟人相关内容创意策划与制作，运用文生图、文生视频等 AIGC 能力产出符合平台调性的直播素材与衍生内容
2. 负责 AI 虚拟人直播全流程运营，包括主题策划、互动流程、内容节奏设计，持续优化直播效果
3. 针对 AI 虚拟人赛道做深度用户调研与竞品分析，洞察创作者与受众需求，产出高质量分析报告
4. 监控直播与内容模块核心数据，分析用户行为与互动情况，提出并推动产品与内容优化方案

岗位要求：
1. 本科及以上学历，设计、美术、动画、传播等相关专业优先
2. 具备 AI 内容创作实操能力，熟练使用主流文生图工具（如 GPT-image2、Gemini）及文生视频工具（如即梦），有个人作品集加分
3. 有直播内容运营或创作者工具产品实习经验优先，对 ACG 文化有浓厚兴趣者优先
4. 实习 3 个月以上，每周至少 4 天`;

export const OPS_JD_QIJI = `AI 创新产品活动运营【潜空间】

你将会做：
1. 支持奇绩创坛大模型系列活动，包括潜空间、AI Unconference 等
2. 制定并执行营销方案，开展市场调研、竞品分析、目标市场定位，协助 AI 领域专题调研
3. 支持 AI 创新活动设计，需要创新思维与流程管理能力

你需要具备：
1. 有活动策划与运营经验优先
2. 对 AI、LLM、MLSys 等前沿技术有好奇心与热情
3. 沟通能力强，喜欢与人打交道
4. 参与或组织过大型创业/大模型主题活动经验加分
5. 能线下实习 5 天/周、4 个月以上者优先`;

/** 运营简历 A/B 共用锚点（改写应保留） */
export const OPS_RESUME_MUST: Record<"A" | "B", string[]> = {
  A: [
    "小红书",
    "粉丝 1200+",
    "产品调研",
    "1 万+",
    "学联",
    "787",
    "Excel",
  ],
  B: [
    "字节跳动",
    "抖音",
    "VOC",
    "800+",
    "转化率提升 40%",
    "SQL",
  ],
};

/** 弱匹配：A 简历 × 奇绩活动 JD — 防贴 JD 编造大模型赛事/潜空间经历 */
const OPS_A_ON_QIJI_MUST_NOT = [
  "潜空间",
  "AI Unconference",
  "MLSys",
  "大模型系列活动",
  "创业营活动",
  "奇绩创坛",
];

/** 弱匹配：B 简历 × 百度 AIGC/直播 JD — 防编造虚拟人/直播/文生视频实操 */
const OPS_B_ON_BAIDU_MUST_NOT = [
  "AI 虚拟人",
  "文生视频",
  "直播全流程",
  "即梦",
  "GPT-image",
  "文生图",
];

/** 强匹配 A×百度：简历无 AIGC/直播实操，禁止正向声称 */
const OPS_A_ON_BAIDU_MUST_NOT = [
  "文生视频",
  "直播全流程",
  "AI 虚拟人",
  "即梦",
];

/** 强匹配 B×奇绩：简历无奇绩/潜空间主办经历，禁止正向声称 */
const OPS_B_ON_QIJI_MUST_NOT = [
  "潜空间",
  "AI Unconference",
  "奇绩创坛",
];

/** 强匹配：内容/调研简历 × 百度内容方向 JD */
export const OPT_OPS_A_BAIDU: GoldenFixture = {
  id: "OPT_OPS_A_BAIDU",
  roleType: "ops",
  companyName: "百度",
  roleTitle: "产品运营实习生（内容方向）",
  resume: OPT_OPS_A_RESUME,
  jd: OPS_JD_BAIDU,
  expectedKeywords: ["内容", "用户", "数据", "竞品", "调研", "运营"],
  mustKeep: OPS_RESUME_MUST.A,
  mustNot: OPS_A_ON_BAIDU_MUST_NOT,
  matchTier: "strong",
};

/** 强匹配：活动/数据简历 × 奇绩活动运营 JD */
export const OPT_OPS_B_QIJI: GoldenFixture = {
  id: "OPT_OPS_B_QIJI",
  roleType: "ops",
  companyName: "奇绩创坛",
  roleTitle: "AI 创新产品活动运营【潜空间】",
  resume: OPT_OPS_B_RESUME,
  jd: OPS_JD_QIJI,
  expectedKeywords: ["活动", "策划", "AI", "调研", "流程", "竞品"],
  mustKeep: OPS_RESUME_MUST.B,
  mustNot: OPS_B_ON_QIJI_MUST_NOT,
  matchTier: "strong",
};

/** 弱匹配对照：内容简历 × 活动 JD（测防虚构/过度包装） */
export const OPT_OPS_A_QIJI: GoldenFixture = {
  id: "OPT_OPS_A_QIJI",
  roleType: "ops",
  companyName: "奇绩创坛",
  roleTitle: "AI 创新产品活动运营【潜空间】",
  resume: OPT_OPS_A_RESUME,
  jd: OPS_JD_QIJI,
  expectedKeywords: ["活动", "策划", "调研", "沟通", "执行"],
  mustKeep: OPS_RESUME_MUST.A,
  mustNot: OPS_A_ON_QIJI_MUST_NOT,
  matchTier: "weak",
};

/** 弱匹配对照：活动简历 × 内容/AIGC JD（测勿虚构 AIGC/直播经历） */
export const OPT_OPS_B_BAIDU: GoldenFixture = {
  id: "OPT_OPS_B_BAIDU",
  roleType: "ops",
  companyName: "百度",
  roleTitle: "产品运营实习生（内容方向）",
  resume: OPT_OPS_B_RESUME,
  jd: OPS_JD_BAIDU,
  expectedKeywords: ["数据", "分析", "竞品", "运营", "优化"],
  mustKeep: OPS_RESUME_MUST.B,
  mustNot: OPS_B_ON_BAIDU_MUST_NOT,
  matchTier: "weak",
};

export const OPS_EVAL_FIXTURES = [
  OPT_OPS_A_BAIDU,
  OPT_OPS_B_QIJI,
  OPT_OPS_A_QIJI,
  OPT_OPS_B_BAIDU,
];

/** 脱敏 PM 简历 A：NLP / 快手商业化 / LangGraph Agent */
export const OPT_PM_A_RESUME = `李同学 | AI产品经理 / 增长产品（实习/校招）
电话：139xxxx | 邮箱：lixx@email.com

教育背景：
某大学 | 计算语言学 / NLP | 硕士 | 2022.09 - 2025.06

实习经历：
快手 | 海外商业化产品实习生 | 2024.06 - 2024.09
- 参与海外广告投放与商业化策略优化，关注 GMV、ROAS、CVR 等核心指标
- 通过数据分析与 A/B 实验迭代素材与出价策略，ROAS 提升 50%
- 协助整理增长漏斗与投放复盘，支持跨区域运营协同

某 AI 创业公司 | 产品经理实习生 | 2024.01 - 2024.05
- 基于 LangGraph 设计 Multi-agent 投研助手（阿摩/A-Mo），串联检索、推理与回测模块
- 搭建 Agent 工作流，回测胜率 83.56%；推进产品化落地与需求评审

项目经历：
上海大数据中心 | 数据产品相关项目 | 2023.09 - 2024.01
- 参与数据平台需求梳理与可视化分析模块设计
- 通过自动化报表将部分人工分析效率提升 45%

研究经历：
Multi-agent 投研 Agent 系统 — LangGraph 编排、策略回测与指标监控

技能：
SQL、Python、数据分析、AARRR、LLM/Agent、英语（海外业务）`;

/** 脱敏 PM 简历 B：CV / 中石油 YOLO / Coze Agent */
export const OPT_PM_B_RESUME = `王同学 | AI产品经理（实习/校招）
电话：137xxxx | 邮箱：wangxx@email.com

教育背景：
西华大学 | 软件工程 | 硕士 | 2023.09 - 2026.06

实习经历：
中石油某研究院 | AI产品实习生 | 2025.01 - 2025.06
- 负责工业视觉检测 AI 产品化，基于 YOLOv8 完成缺陷识别模型落地与迭代
- 撰写 PRD、Figma/Axure 原型，联动算法与业务方推进联调验收
- 质检流程单次耗时从 74min 降至 25min（效率提升约 66%），申请专利/软著

某科技公司 | AI产品经理实习生 | 2024.06 - 2024.12
- 基于 Coze 搭建智能客服 Agent，完成女装电商场景对话流程与知识库配置
- 负责碳排放监测 SaaS 需求分析，结合 GIS 地图做排放数据可视化产品设计

项目经历：
碳排放智能监测平台 — 需求分析、原型设计、算法协作与效果评测（准确率/耗时/采纳率）

技能：
PRD、原型（Figma/Axure）、YOLO/CV 应用、Coze Agent、跨部门协作`;

/** 脱敏 PM 简历 C：医疗问诊 Agent / 评测体系 */
export const OPT_PM_C_RESUME = `张同学 | AI产品经理（实习/校招）
电话：138xxxx | 邮箱：zhangxx@email.com

教育背景：
某211大学 | 计算机科学与技术 | 硕士 | 2023.09 - 2026.06

实习经历：
某互联网公司 | AI产品经理实习生 | 2025.03 - 2025.09
- 负责智能医疗问诊 Agent 0-1 MVP，基于 Qwen 大模型搭建多轮对话与意图识别链路
- 设计 Prompt + 规则混合策略，建设医疗红线与安全拒答机制，关键场景准确率 92%
- 撰写 PRD 与评测指标体系，意图识别准确率 95%、用户满意度 85%
- 将单次问诊流程耗时从 4.2 小时降至 18 分钟（人机协同梳理后上线验收）

项目经历：
智能医疗问诊 Agent
- 背景：解决就医咨询碎片化、医疗信息可信度问题
- 职责：需求分析、PRD、Prompt 设计、Agent 链路编排、红线策略与评测验收
- 技术：Qwen、意图识别、RAG、Agent
- 产出：完成 MVP 边界定义与安全评测闭环

技能：
PRD、原型、Prompt Engineering、Agent 评测、数据分析`;

export const PM_JD_JDONG = `技术产品经理

岗位职责：
负责 B 端、C 端产品策划工作，基于内部或外部客户业务需要，设计技术产品架构，明确产品功能需求；
跟进研发开发、测试，完成产品上线和功能迭代。

岗位要求：
统招本科及以上学历在校生，27 届优先；
计算机、信息与通信工程等相关专业优先；
对产品开发、设计、测试、运营等有一定了解；
具备大局观，逻辑思维能力强，主动性高，有高效的执行力；具备优秀的理解、沟通与协调能力，有一定的文字表达能力；
关注行业动态，定期产出有价值情报信息，定期产出提炼为可能的解决方案；
符合京东价值观：客户为先、创新、拼搏、担当、感恩、诚信。`;

export const PM_JD_FEISHU = `AI 产品实习生-飞书

ByteIntern：面向 2026 届毕业生（2025 年 9 月-2026 年 8 月期间毕业），为符合岗位要求的同学提供转正机会。

岗位职责：
1、参与视频会议 AI 功能产品迭代的相关工作，如产品信息收集与分析、用户反馈与调研、设计还原验收等；
2、针对业务问题同上下游相关团队讨论解决方案，并推动项目进行；
3、深入了解和掌握行业产品的动态，不断丰富和完善解决方案；
4、能适应创业团队节奏，随时胜任团队中其他岗位角色。

岗位要求：
1、2026 届硕士及以上学位在读，计算机、软件工程等相关专业优先；
2、善于逻辑思维推导，对数据高度敏感；
3、具备快速学习、良好的沟通和协作能力；
4、对创新类产品有高度热忱，对 AIGC、LLM 等前沿 AI 产品有了解的优先；
5、能实习至少 3 个月以上，且一周出勤 4 天以上同学优先。`;

export const PM_JD_XIAOMI = `AI 策略产品经理

岗位职责：
1、产品评测与体验优化：参与建设 Agent 评测标准，对不同意图 query 下的 Agent 实际表现进行多维度的评估；深入分析体验中存在的问题与不足，并给出具体可执行的优化建议，保障各端体验效果；
2、需求撰写与落地支持：协助梳理业务流程，撰写需求文档，与研发、测试团队密切协作，跟进开发进度与验收，确保产品高质量上线；
3、行业调研与分析：持续追踪大模型及 Agent 领域的行业动态，体验并分析国内外竞品，输出调研报告，辅助产品迭代决策。

岗位要求：
1、优秀的沟通能力、快速学习能力，拥有较强的同理心和理解力，有耐心及自驱力；
2、对生成式 AI 有热情、有见解、有深入体验，对 AI 在生活服务上的应用有兴趣、有理解；
3、有互联网产品实习经验优先；
4、27 届、28 届应届生，每周实习至少 4 天，实习期 4 个月以上。`;

const PM_RESUME_MUST: Record<"A" | "B" | "C", string[]> = {
  A: [
    "快手",
    "ROAS",
    "GMV",
    "LangGraph",
    "阿摩",
    "上海大数据中心",
    "45%",
    "50%",
    "83.56%",
  ],
  B: [
    "中石油",
    "YOLOv8",
    "Coze",
    "66%",
    "74min",
    "25min",
    "PRD",
    "碳排放",
    "GIS",
    "专利",
  ],
  C: [
    "智能医疗问诊",
    "Qwen",
    "意图识别",
    "红线",
    "PRD",
    "Agent",
    "92%",
    "95%",
    "85%",
    "18分钟",
  ],
};

const PM_RESUME_MUST_NOT: Record<"A" | "B" | "C", string[]> = {
  A: ["千万用户", "5年产品负责人"],
  B: ["2年全职产品经理", "日活百万"],
  C: ["智谱", "字节跳动"],
};

function pmEvalFixture(
  resume: "A" | "B" | "C",
  jd: "JDONG" | "FEISHU" | "XIAOMI",
  matchTier: GoldenFixture["matchTier"],
  expectedKeywords: string[],
): GoldenFixture {
  const resumeText =
    resume === "A"
      ? OPT_PM_A_RESUME
      : resume === "B"
        ? OPT_PM_B_RESUME
        : OPT_PM_C_RESUME;
  const jdMeta = {
    JDONG: { companyName: "京东", roleTitle: "技术产品经理", jd: PM_JD_JDONG },
    FEISHU: {
      companyName: "飞书",
      roleTitle: "AI 产品实习生",
      jd: PM_JD_FEISHU,
    },
    XIAOMI: {
      companyName: "小米",
      roleTitle: "AI 策略产品经理",
      jd: PM_JD_XIAOMI,
    },
  }[jd];

  return {
    id: `OPT_PM_${resume}_${jd}`,
    roleType: "pm",
    companyName: jdMeta.companyName,
    roleTitle: jdMeta.roleTitle,
    resume: resumeText,
    jd: jdMeta.jd,
    expectedKeywords,
    mustKeep: PM_RESUME_MUST[resume],
    mustNot: PM_RESUME_MUST_NOT[resume],
    matchTier,
  };
}

export const OPT_PM_A_JDONG = pmEvalFixture("A", "JDONG", "weak", [
  "架构",
  "需求",
  "研发",
  "测试",
  "协调",
]);
export const OPT_PM_A_FEISHU = pmEvalFixture("A", "FEISHU", "medium", [
  "AI",
  "调研",
  "LLM",
  "协作",
  "迭代",
]);
export const OPT_PM_A_XIAOMI = pmEvalFixture("A", "XIAOMI", "strong", [
  "Agent",
  "评测",
  "竞品",
  "优化",
  "数据",
]);
export const OPT_PM_B_JDONG = pmEvalFixture("B", "JDONG", "strong", [
  "架构",
  "需求",
  "PRD",
  "研发",
  "测试",
]);
export const OPT_PM_B_FEISHU = pmEvalFixture("B", "FEISHU", "medium", [
  "AI",
  "调研",
  "验收",
  "协作",
  "AIGC",
]);
export const OPT_PM_B_XIAOMI = pmEvalFixture("B", "XIAOMI", "medium", [
  "Agent",
  "评测",
  "体验",
  "需求",
  "竞品",
]);
export const OPT_PM_C_JDONG = pmEvalFixture("C", "JDONG", "medium", [
  "需求",
  "功能",
  "研发",
  "测试",
  "协调",
]);
export const OPT_PM_C_FEISHU = pmEvalFixture("C", "FEISHU", "strong", [
  "AI",
  "调研",
  "LLM",
  "Agent",
  "验收",
]);
export const OPT_PM_C_XIAOMI = pmEvalFixture("C", "XIAOMI", "strong", [
  "Agent",
  "评测",
  "意图",
  "体验",
  "竞品",
  "红线",
]);

export const PM_EVAL_FIXTURES = [
  OPT_PM_A_JDONG,
  OPT_PM_A_FEISHU,
  OPT_PM_A_XIAOMI,
  OPT_PM_B_JDONG,
  OPT_PM_B_FEISHU,
  OPT_PM_B_XIAOMI,
  OPT_PM_C_JDONG,
  OPT_PM_C_FEISHU,
  OPT_PM_C_XIAOMI,
];

export const CORE_FIXTURES = [GOLDEN_PM, GOLDEN_PM_GROWTH, GOLDEN_OPS];

/** 弱匹配捏造冒烟集（发版前必跑） */
export const WEAK_FIXTURE_SMOKE_IDS = [
  "OPT_OPS_A_QIJI",
  "OPT_PM_A_JDONG",
  "OPT_OPS_B_BAIDU",
] as const;

export const GOLDEN_FIXTURES = [
  ...CORE_FIXTURES,
  ...PM_EVAL_FIXTURES,
  ...OPS_EVAL_FIXTURES,
];

export function getWeakFixtureSmokeSet(): GoldenFixture[] {
  return WEAK_FIXTURE_SMOKE_IDS.map((id) => {
    const fixture = GOLDEN_FIXTURES.find((f) => f.id === id);
    if (!fixture) throw new Error(`弱匹配冒烟 fixture 缺失: ${id}`);
    return fixture;
  });
}
