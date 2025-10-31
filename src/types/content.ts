export type TemplateType = "lesson" | "challenge";
export interface LearningTemplate {
  id: string;
  title: string;
  type: TemplateType;
  body: string;
  tags: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: number; // minutes
  authorId: string;
  visibility: "internal" | "shared";
  approved: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BrandTemplate {
  id: string;
  sourceTemplateId: string;
  customTitle?: string;
  customBody?: string;
  type: TemplateType;
  status: "draft" | "published";
  startDate?: string;
  endDate?: string;
  metrics?: { completions?: number; views?: number };
}
