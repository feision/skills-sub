// types.ts — 数据模型定义

export interface SkillMeta {
  id: string;
  name: string;
  description: string;
  author: string;
  authorType: "agent" | "human";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  latestVersion: number;
}

export interface SkillVersion {
  version: number;
  message: string;
  createdAt: string;
  r2Key: string;
  size: number;
}

export interface SkillListItem {
  id: string;
  name: string;
  description: string;
  author: string;
  authorType: string;
  tags: string[];
  latestVersion: number;
  updatedAt: string;
}

export interface DiffLine {
  type: "add" | "remove" | "same";
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface Env {
  SKILLS_KV: KVNamespace;
  SKILLS_R2: R2Bucket;
  API_KEY: string;
}
