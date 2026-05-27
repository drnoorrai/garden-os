export type TaskTier = "big" | "medium" | "small";
export type TaskStatus = "active" | "completed" | "deferred";
export type WorkItemKind = "task" | "idea" | "thought" | "obligation";
export type TriageAction = "untriaged" | "do-now" | "defer" | "delegate" | "delete";
export type BetStatus = "considering" | "active" | "complete" | "parked";
export type KanbanColumn = "backlog" | "sprint" | "today" | "blocked" | "done";
export type NoteCategory = "Research" | "Essays" | "Mental Models" | "Saved Insights";
export type MoscowPriority = "must" | "should" | "could" | "wont";

export interface UserProfile {
  id: string;
  name: string;
  focusTheme: string;
  proteinTarget: number;
}

export interface DailyTask {
  id: string;
  title: string;
  tier: TaskTier;
  order: number;
  status: TaskStatus;
  scheduledDate: string;
  estimateMinutes?: number;
}

export interface DailyPlan {
  date: string;
  tasks: DailyTask[];
  focusHours: number;
  energy: number;
  hydrationComplete: boolean;
  activeClarityGoal: string;
  reflectionPrompt: string;
  mealSuggestion: string;
}

export interface ReviewEntry {
  id: string;
  date: string;
  wentWell: string;
  difficult: string;
  energy: number;
  mood: number;
  completedBigThing: boolean;
  tomorrowNote: string;
}

export interface ClaritySession {
  id: string;
  createdAt: string;
  title: string;
  answers: Record<string, string>;
}

export interface FieldNote {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  tags: string[];
  category: NoteCategory;
  sourceUrl?: string;
}

export interface WorkItem {
  id: string;
  createdAt: string;
  title: string;
  kind: WorkItemKind;
  triage: TriageAction;
}

export interface Bet {
  id: string;
  title: string;
  notes: string;
  impact: number;
  effort: number;
  status: BetStatus;
}

export interface KanbanCard {
  id: string;
  title: string;
  projectId?: string;
  column: KanbanColumn;
}

export interface TrainingEntry {
  id: string;
  date: string;
  workout: string;
  movementType: string;
  durationMinutes: number;
  intensity: "Low" | "Moderate" | "High";
  recoveryNote: string;
  completed: boolean;
}

export interface MealEntry {
  id: string;
  date: string;
  name: string;
  proteinGrams: number;
}

export interface MoscowScope {
  id: string;
  label: string;
  priority: MoscowPriority;
}

export interface Project {
  id: string;
  name: string;
  outcome: string;
  scope: MoscowScope[];
}

export interface GardenData {
  profile: UserProfile;
  plans: DailyPlan[];
  reviews: ReviewEntry[];
  claritySessions: ClaritySession[];
  fieldNotes: FieldNote[];
  workItems: WorkItem[];
  bets: Bet[];
  kanbanCards: KanbanCard[];
  training: TrainingEntry[];
  meals: MealEntry[];
  projects: Project[];
}

export interface DailyBriefing {
  summary: string;
  recommendations: string[];
  warnings: string[];
  suggestedNextAction: string;
}
