# 发版检查清单

发版前按三道检查走一遍：**自动脚本 → AI 样例 → 亲手点**。

## 检查一：自动脚本（无需 API Key）

```bash
npm run test:deterministic
npm run build
```

通过标准：全部用例通过，构建成功。

## 检查二：AI 样例（需 `.env.local` API Key）

```bash
npm run test:interview-prep
npm run test:prompt
```

通过标准：

- Rubric 总分 ≥ 3.5，且证据忠实（evidence）≥ 3
- **`evidenceAudit.hasFabricationRisk` 必须为 false**（Rubric 硬门禁）
- 改写不得命中 fixture `mustNot` 词条

固定样例见 `lib/fixtures.ts`：

| 分组 | Fixture ID | 说明 |
|------|------------|------|
| CORE | `GOLDEN_PM` | 智谱 PM（爱奇艺/搜狐真实简历） |
| CORE | `GOLDEN_PM_GROWTH` | 增长 PM 合成样例 |
| CORE | `GOLDEN_OPS` | 产品运营合成样例 |
| 运营强匹配 | `OPT_OPS_A_BAIDU` | 内容简历 × 百度（mustKeep/mustNot） |
| 运营强匹配 | `OPT_OPS_B_QIJI` | 活动简历 × 奇绩（mustKeep/mustNot） |
| 运营弱匹配 | `OPT_OPS_A_QIJI` | 内容 × 奇绩（mustNot：潜空间/MLSys 等） |
| 运营弱匹配 | `OPT_OPS_B_BAIDU` | 活动 × 百度 AIGC（mustNot：直播/文生视频等） |
| PM 3×3 | `OPT_PM_A_JDONG` … `OPT_PM_C_XIAOMI` | 9 条全交叉；强配如 C×小米、C×飞书、B×京东 |

每条 PM fixture 含 `mustKeep` / `mustNot` / `matchTier`（strong/medium/weak），供盲评与 Rubric 校准。

### 弱匹配捏造冒烟（发版前必跑）

```bash
npm run measure:fabrication:weak
# 或
npm run test:prompt baseline OPT_OPS_A_QIJI
npm run test:prompt baseline OPT_PM_A_JDONG
npm run test:prompt baseline OPT_OPS_B_BAIDU
```

弱匹配冒烟集（`WEAK_FIXTURE_SMOKE_IDS`）：

- `OPT_OPS_A_QIJI` — 内容简历 × 奇绩活动运营
- `OPT_PM_A_JDONG` — PM A × 京东（弱配）
- `OPT_OPS_B_BAIDU` — 活动简历 × 百度 AIGC

### 捏造率基线（改 prompt 前后对比）

```bash
npm run measure:fabrication                    # 16 条 baseline
npm run measure:fabrication -- --limit 5       # 快速冒烟
npm run measure:fabrication -- --weak-smoke    # 弱匹配 3 条
npm run measure:fabrication -- --variants baseline,concise,data-driven
```

输出：`public/eval-samples/fabrication-*.json`

**捏造发版门槛（建议）**：

- 全量 `hasFabricationRisk` 比例较上一版基线下降，或弱匹配冒烟 **3/3 通过**
- `sanitized` 比例过高说明模型仍在编，需优先改 prompt/拆分流水线，而非依赖清洗

```bash
# 默认跑 CORE 三样例
npm run test:interview-prep

# 跑 9 条 PM 配对
npm run test:interview-prep all-pm

# 跑全部运营样例（合成 + 四条真实配对，共 5 条）
npm run test:interview-prep all-ops

# 跑全部 16 条
npm run test:interview-prep all-full

# 单条简历优化
npm run test:prompt baseline OPT_PM_C_XIAOMI
npm run test:prompt baseline OPT_OPS_A_BAIDU
```

## 检查三：发版前亲手勾选

- [ ] 简历或 JD 太短时，按钮是灰的、点不了
- [ ] 走通「只优化简历」：JD 解读 → 匹配分 → 改写对比 → 能复制/下载
- [ ] 优化 loading 显示真实三步：解读匹配 → 改写 → 可信度检查
- [ ] 走通「面试准备」：填公司名 → 生成 → 各章节有内容 → 能导出 Markdown
- [ ] 没填公司名时，有明确提示
- [ ] 手机或微信里打开，首屏能看清、不用横滑
- [ ] 岗位方向选「产品运营」后，下方出现用户/活动/内容等提示
- [ ] 结果页能看到本次是「产品经理」还是「产品运营」赛道
- [ ] Gap / 匹配表出现「可以写 / 谨慎写 / 不能写」标签（truth-boundary）
- [ ] 可信度检查无红色捏造告警（或已标注自动清洗）
- [ ] 至少部分高频题展示「及格答法 / 加分答法」

## 检查二-B：人工盲评校准 Rubric（推荐发版前）

自动 Rubric（`scripts/lib/rubric.ts`）是启发式规则，建议用人工盲评对齐后再信任检查二门槛。

```bash
# 1. 生成 14 条样本包（需 API Key，约 10–20 分钟）
npm run eval:generate

# 2. LLM 评委自动打分（推荐，需配置 JUDGE_LLM_*）
npm run eval:judge

# 3. 启动本地页查看比对
npm run dev
# 比对 → http://localhost:3000/eval/compare
# 选手工盲评 → http://localhost:3000/eval
```

| 步骤 | 说明 |
|------|------|
| 生成 | 写入 `public/eval-samples/manifest-blind.json`（盲评用）与 `manifest-full.json`（比对用） |
| 盲评（可选） | `/eval` 手打六维分；费时可用 LLM 评委代替 |
| LLM 评委（推荐） | `npm run eval:judge`，用 `JUDGE_LLM_*` 另一模型自动打分 |
| 比对 | `/eval/compare` 自动读 `llm-judge-scores.json`，或上传人工 JSON |
| 达标 | 整体 MAE ≤0.8，Pass 一致率 ≥80%，各维 ±1 一致率 ≥75% |
| 未达标 | 按 outlier 调整 `rubric.ts` → 重新 `eval:generate` → 再盲评 |

## Prompt 迭代口诀（捏造优先）

1. `measure:fabrication` 记基线 → 只改一个变量（变体/拆分/温度）
2. 再跑 `measure:fabrication:weak` + `test:prompt` 弱匹配三条
3. `test:deterministic` 全绿 → 考虑发版

**发版口诀**：脚本全绿 → 弱匹配冒烟全过 → 捏造率不回升 → Rubric 已与人工校准 → 自己点过没翻车 → 再部署。
