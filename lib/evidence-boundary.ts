import { z } from "zod";

export const evidenceBoundarySchema = z.enum(["可以写", "谨慎写", "不能写"]);

export type EvidenceBoundary = z.infer<typeof evidenceBoundarySchema>;

export const EVIDENCE_BOUNDARY_LABELS: Record<EvidenceBoundary, string> = {
  可以写: "可以写",
  谨慎写: "谨慎写",
  不能写: "不能写",
};

export const ANTI_FABRICATION_RULES = `反捏造规则（最高优先级，违反会摧毁用户信任）：
1. **禁止编造任何数字**：改写里的百分比、金额、用户数、时长、倍数、排名等，必须能在原文同一段经历中找到相同数值或可逐字追溯的来源；找不到则写 [待补充：具体指标]，**绝不可猜测、估算或编造**
2. **禁止新增实体**：不得添加原文没有的公司、产品、项目名称、工具栈、职务头衔
3. **禁止用 JD 反向伪造经历**：JD 要求的能力若简历无证据，只能在 gapDetails 标「不能写」并在改写中**回避**，不可写「熟练使用 XX」假装具备
4. **禁止夸大职级**：「参与/协助」不得写成「主导/全权负责」，除非原文有对应表述
5. **gapDetails 标为「不能写」的条目，不得出现在 sections.rewritten 的正向声称中**`;

export const REWRITE_WORKFLOW = `改写执行顺序（违反顺序极易捏造，必须逐步执行）：
1. **先分析、后改写**：必须先完成 matchReport.gapDetails，为每条主要 JD 要求/缺口标注 evidenceBoundary，再写 sections.rewritten
2. **改写白名单**：sections.rewritten 只允许写入 evidenceBoundary 为「可以写」或「谨慎写」、且在 original 同模块有明确句段依据的内容；「不能写」只出现在 gapDetails / suggestions，不得以肯定句潜入 rewritten
3. **数字决策树**：
   - 原文有该数字 → 可原样引用或换表述，**数值不得改变**
   - 原文无该数字 → 禁止写任何具体数；用 [待补充：具体指标] 占位，或删掉数字只保留行动描述
4. **动词决策树**：
   - 原文含「主导/负责/牵头」→ 可用同级或略强动词
   - 原文仅「参与/协助/支持」→ 只能用「参与/协助/支持」，**禁止**升为「主导/全权负责/从0到1」
5. **JD 关键词**：仅当简历有对应经历证据时，才可把 JD 关键词嵌入该段 rewritten；无证据的关键词只写在 gapDetails，不写进 rewritten`;

export const FABRICATION_EXAMPLES = `错误 vs 正确（照此判断，不要模仿错误写法）：
❌ 原文「参与需求评审」→ 改写「主导产品需求全流程，DAU 提升 30%」（捏造职级 + 数字）
✅ 原文「参与需求评审」→ 改写「参与 XX 产品需求评审与方案讨论」（忠于原文）
❌ 原文无留存数据 → 改写「留存提升 15%」（凭空捏造）
✅ 原文无留存数据 → 改写「推动留存相关策略落地，[待补充：留存提升比例]」（占位，不编数）
❌ JD 要求 SQL，简历无 → 改写「熟练使用 SQL 取数分析」（JD 反向伪造）
✅ JD 要求 SQL，简历无 → gapDetails 标「不能写：简历无 SQL 实践证据」，rewritten 回避 SQL 正向声称`;

export const REWRITE_SELF_CHECK = `输出 JSON 前必做自检（任一项不通过则修改 rewritten 后再输出）：
□ rewritten 中每个数字是否都能在「我的简历」或对应 original 中找到相同数值？
□ gapDetails 标「不能写」的缺口，是否未以肯定句出现在 rewritten？
□ 是否新增了原文没有的公司、产品、项目、工具名？
□ 是否把「参与/协助」改成了「主导/负责」而原文无此表述？
□ 无数据成果句是否已删数字或改为 [待补充：具体指标]？`;

export const TRUTH_BOUNDARY_PROMPT_RULE = `证据边界（truth-boundary）：
- **可以写**：简历有直接或间接证据，改写可明确引用原文句段
- **谨慎写**：有相关经历但表述需收敛，避免夸大（如「参与」勿写成「主导」）
- **不能写**：简历无证据，不得虚构；缺口与建议写在 gapDetails，改写中回避
matchLevel 与 evidenceBoundary 对应建议：strong→可以写，medium→谨慎写，weak/unknown→不能写（无证据时）

${ANTI_FABRICATION_RULES}

${REWRITE_WORKFLOW}

${FABRICATION_EXAMPLES}

${REWRITE_SELF_CHECK}`;
