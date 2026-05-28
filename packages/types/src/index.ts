export type TaskTier = "big" | "medium" | "small";
export type TaskStatus = "active" | "completed" | "deferred";
export type WorkItemKind = "task" | "idea" | "thought" | "obligation";
export type TriageAction = "untriaged" | "do-now" | "defer" | "delegate" | "delete";
export type BetStatus = "considering" | "active" | "complete" | "parked";
export type BetStage = "triage" | "exploring" | "committed" | "in-flight" | "shipped" | "archive";
export type BetConviction = "high" | "medium" | "speculative";
export type KanbanColumn = "backlog" | "sprint" | "today" | "blocked" | "done";
export type NoteCategory = "Research" | "Essays" | "Mental Models" | "Saved Insights";
export type MoscowPriority = "must" | "should" | "could" | "wont";
export type TrainingPhase = "bulk" | "maintain" | "cut" | "deload";
export type ModuleId = "train" | "think" | "work" | "eat";

export interface UserProfile {
  id: string;
  name: string;
  focusTheme: string;
  proteinTarget: number;
  onboardingComplete?: boolean;
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
  stage?: BetStage;
  conviction?: BetConviction;
  why?: string;
  deadline?: string;
  learning?: string;
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

export interface MuscleTarget {
  id: string;
  group: "push" | "pull" | "legs" | "core";
  name: string;
  mev: number;
  mav: [number, number];
  mrv: number;
  recovery: "fast" | "moderate" | "slow";
  optional?: boolean;
}

export interface MovementExercise {
  id: string;
  name: string;
  contributions: Record<string, number>;
  custom?: boolean;
}

export interface LoggedSet {
  id: string;
  date: string;
  exerciseId: string;
  reps: number;
  weightKg: number;
  rir: number;
  sessionId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Array<{ exerciseId: string; targetSets: number }>;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  templateId: string;
  completedAt?: string;
}

export interface TrainingState {
  phase: TrainingPhase;
  targets: MuscleTarget[];
  exercises: MovementExercise[];
  customExercises: MovementExercise[];
  sets: LoggedSet[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSessionId?: string;
}

export interface MealEntry {
  id: string;
  date: string;
  name: string;
  proteinGrams: number;
}

export interface MealPlan {
  id: string;
  date: string;
  meal: string;
  proteinGrams: number;
  energySupport: "steady" | "light" | "recovery";
}

export interface GroceryItem {
  id: string;
  label: string;
  complete: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood?: number;
}

export interface DecisionLog {
  id: string;
  date: string;
  decision: string;
  rationale: string;
  revisitOn?: string;
  status: "open" | "decided" | "revisit";
}

export interface MentalModel {
  id: string;
  title: string;
  principle: string;
  application: string;
}

export interface WorkSprint {
  id: string;
  weekOf: string;
  focus: string;
  capacity: number;
  commitments: string[];
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

export interface UserContext {
  goals: string[];
  energy: number;
  mood: number;
  trainingLoad: "low" | "moderate" | "high";
  workload: "clear" | "balanced" | "overloaded";
  projects: string[];
  proteinProgress: number;
  hydrationComplete: boolean;
  focusPreference: string;
}

export interface TrainTodaySummary {
  module: "train";
  workout: string;
  intensity: "Low" | "Moderate" | "High";
  recovery: string;
  weeklyHardSets: number;
  load: "low" | "moderate" | "high";
}

export interface WorkTodaySummary {
  module: "work";
  priority: string;
  blockers: number;
  sprintLoad: "clear" | "balanced" | "overloaded";
  activeBets: number;
}

export interface ThinkTodaySummary {
  module: "think";
  prompt: string;
  insight: string;
  unresolvedDecisions: number;
  latestMood?: number;
}

export interface EatTodaySummary {
  module: "eat";
  proteinTarget: number;
  proteinLogged: number;
  hydrationComplete: boolean;
  energySupport: string;
}

export type ModuleTodaySummary = TrainTodaySummary | WorkTodaySummary | ThinkTodaySummary | EatTodaySummary;

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
  train: TrainingState;
  meals: MealEntry[];
  mealPlans: MealPlan[];
  groceries: GroceryItem[];
  projects: Project[];
  journal: JournalEntry[];
  decisions: DecisionLog[];
  mentalModels: MentalModel[];
  sprints: WorkSprint[];
}

export interface DailyBriefing {
  summary: string;
  recommendations: string[];
  warnings: string[];
  suggestedNextAction: string;
}

export interface TodayIntelligence extends DailyBriefing {
  suggestedFocus: string;
  suggestedRecovery: string;
  tomorrowPlanning: string;
  context: UserContext;
}
