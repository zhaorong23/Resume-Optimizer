import type { RoleType } from "./schema";

export type RoleTypeOption = {
  id: RoleType;
  label: string;
  helperHint: string;
  subLabels: string[];
};

export const ROLE_TYPE_OPTIONS: RoleTypeOption[] = [
  {
    id: "pm",
    label: "产品经理",
    helperHint: "侧重功能设计、需求优先级与 0-1 落地",
    subLabels: ["功能设计", "竞品分析", "数据迭代"],
  },
  {
    id: "ops",
    label: "产品运营",
    helperHint: "侧重活动、渗透、留存与指标提升",
    subLabels: ["用户运营", "活动运营", "内容运营"],
  },
];

export function getRoleTypeOption(id: RoleType): RoleTypeOption {
  return ROLE_TYPE_OPTIONS.find((o) => o.id === id) ?? ROLE_TYPE_OPTIONS[0];
}
