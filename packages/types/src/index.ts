export type TaskTier = "big" | "medium" | "small";
export type TaskStatus = "active" | "completed" | "deferred";
export type WorkItemKind = "task" | "idea" | "thought" | "obligation" | "content" | "person" | "company";
export type TriageAction = "untriaged" | "do-now" | "defer" | "delegate" | "delete";
export type ContentStage = "seed" | "angle" | "outline" | "draft" | "published";
export type ContentFormat = "post" | "essay" | "thread" | "video" | "newsletter";
export type RelationshipKind = "person" | "company";
export type RelationshipStage = "new" | "active" | "follow-up" | "warm" | "archived";
export type RelationshipNoteKind = "note" | "idea" | "link";
export type BetStatus = "considering" | "active" | "complete" | "parked";
export type BetStage = "triage" | "exploring" | "committed" | "in-flight" | "shipped" | "archive";
export type BetConviction = "high" | "medium" | "speculative";
export type KanbanColumn = "backlog" | "sprint" | "today" | "blocked" | "done";
export type NoteCategory = "Research" | "Essays" | "Mental Models" | "Saved Insights";
export type MoscowPriority = "must" | "should" | "could" | "wont";
export type TrainingPhase = "bulk" | "maintain" | "cut" | "deload";
export type ModuleId = "train" | "think" | "work" | "eat";
export type UniversalObjectKind = "person" | "company" | "content" | "note" | "source";
export type ObjectNoteKind = "note" | "idea" | "link";
export type ObjectRelationLabel = "mentions" | "source-for" | "about" | "works-at" | "inspired-by";
export type SourceType = "youtube" | "podcast" | "article" | "news" | "link";
export type WorkspaceKind = "private" | "shared";
export type WorkspaceRole = "owner" | "partner";
export type ObjectVisibility = "private" | "shared";
export type TaskGardenZone = "do-now" | "develop" | "ask-delegate";
export type PartnerSharingSurface = "task-garden" | "train" | "eat" | "content" | "relationships" | "clarity";
export type PartnerSharingLevel = "private" | "summary" | "shared";
export type NutritionUnit = "g" | "ml" | "scoop" | "unit" | "serving";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "peri-workout";

export interface ObjectWorkspaceFields {
  workspaceId?: string;
  visibility?: ObjectVisibility;
  createdBy?: string;
  updatedBy?: string;
}

export interface Workspace {
  id: string;
  name: string;
  kind: WorkspaceKind;
  memberIds: string[];
}

export interface GardenMember {
  id: string;
  name: string;
  email?: string;
  avatarInitials: string;
}

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
  /** Minutes from midnight for a planned start time, when the task is placed on the day timeline. */
  startMinute?: number;
  /** How many times this task has been pushed to a later day. Drives gentle neglect cues. */
  deferCount?: number;
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

export interface FieldNote extends ObjectWorkspaceFields {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  tags: string[];
  category: NoteCategory;
  sourceUrl?: string;
}

export interface WorkItem extends ObjectWorkspaceFields {
  id: string;
  createdAt: string;
  title: string;
  kind: WorkItemKind;
  triage: TriageAction;
  contentStage?: ContentStage;
  contentFormat?: ContentFormat;
  audience?: string;
  hook?: string;
}

export interface RelationshipNote {
  id: string;
  createdAt: string;
  kind: RelationshipNoteKind;
  body: string;
}

export interface RelationshipRecord extends ObjectWorkspaceFields {
  id: string;
  createdAt: string;
  kind: RelationshipKind;
  name: string;
  stage: RelationshipStage;
  role?: string;
  companyId?: string;
  notes: RelationshipNote[];
}

export interface ObjectRef {
  kind: UniversalObjectKind;
  id: string;
}

export interface ObjectNote extends ObjectWorkspaceFields {
  id: string;
  object: ObjectRef;
  createdAt: string;
  body: string;
  kind: ObjectNoteKind;
  timestampSeconds?: number;
}

export interface ObjectLink extends ObjectWorkspaceFields {
  id: string;
  object: ObjectRef;
  createdAt: string;
  url: string;
  label?: string;
}

export interface ObjectRelation {
  id: string;
  from: ObjectRef;
  to: ObjectRef;
  label?: ObjectRelationLabel;
  workspaceId?: string;
}

export interface ObjectActivity extends ObjectWorkspaceFields {
  id: string;
  object: ObjectRef;
  createdAt: string;
  action: string;
  detail?: string;
}

export interface ObjectNextAction extends ObjectWorkspaceFields {
  id: string;
  object: ObjectRef;
  title: string;
  status: "open" | "done";
  dueDate?: string;
}

export interface SourceRecord extends ObjectWorkspaceFields {
  id: string;
  createdAt: string;
  title: string;
  url: string;
  sourceType: SourceType;
  publisher?: string;
  summary?: string;
}

export interface TaskGardenItem {
  id: string;
  objectRef?: ObjectRef;
  workspaceId: string;
  visibility?: ObjectVisibility;
  zone: TaskGardenZone;
  title: string;
  notes?: string;
  ownerId?: string;
  assigneeIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerSharingSetting {
  id: PartnerSharingSurface;
  label: string;
  description: string;
  level: PartnerSharingLevel;
}

export interface ObjectComment {
  id: string;
  object: ObjectRef;
  workspaceId: string;
  authorId: string;
  body: string;
  createdAt: string;
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

export interface MacroBreakdown {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sodiumMg: number;
}

export interface NutritionSettings {
  bmrCalories: number;
  calorieTarget: number;
  proteinTargetGrams: number;
  carbsTargetGrams: number;
  fatTargetGrams: number;
  fiberTargetGrams: number;
  sodiumLimitMg: number;
  activityCalories: number;
  wearableAdjustmentCalories?: number;
}

export interface FoodPreset {
  id: string;
  name: string;
  category: "protein" | "carb" | "fat" | "supplement" | "sauce" | "other";
  unit: NutritionUnit;
  baseQuantity: number;
  servingLabel: string;
  macros: MacroBreakdown;
  custom?: boolean;
}

export interface RecipeIngredient {
  id: string;
  foodId: string;
  quantity: number;
  note?: string;
}

export interface RecipePreset {
  id: string;
  name: string;
  mealSlot: MealSlot;
  ingredients: RecipeIngredient[];
  notes?: string;
  custom?: boolean;
}

export interface MealLogItem {
  id: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: NutritionUnit;
  servingLabel: string;
  macros: MacroBreakdown;
}

export interface NutritionState {
  settings: NutritionSettings;
  foods: FoodPreset[];
  recipes: RecipePreset[];
  deletedFoodIds?: string[];
  deletedRecipeIds?: string[];
}

export interface MealEntry {
  id: string;
  date: string;
  name: string;
  proteinGrams: number;
  mealSlot?: MealSlot;
  calories?: number;
  macros?: MacroBreakdown;
  items?: MealLogItem[];
  source?: "manual" | "recipe" | "composer";
  recipeId?: string;
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
  calorieTarget: number;
  caloriesLogged: number;
  carbsLogged: number;
  fatLogged: number;
  fiberLogged: number;
  sodiumLogged: number;
  estimatedMaintenance: number;
  estimatedDeficit: number;
  hydrationComplete: boolean;
  energySupport: string;
}

export type ModuleTodaySummary = TrainTodaySummary | WorkTodaySummary | ThinkTodaySummary | EatTodaySummary;

export interface GardenData {
  profile: UserProfile;
  members: GardenMember[];
  workspaces: Workspace[];
  plans: DailyPlan[];
  reviews: ReviewEntry[];
  claritySessions: ClaritySession[];
  fieldNotes: FieldNote[];
  workItems: WorkItem[];
  relationships: RelationshipRecord[];
  sources: SourceRecord[];
  objectNotes: ObjectNote[];
  objectLinks: ObjectLink[];
  objectRelations: ObjectRelation[];
  objectActivity: ObjectActivity[];
  objectNextActions: ObjectNextAction[];
  taskGardenItems: TaskGardenItem[];
  objectComments: ObjectComment[];
  partnerSharingSettings: PartnerSharingSetting[];
  bets: Bet[];
  kanbanCards: KanbanCard[];
  training: TrainingEntry[];
  train: TrainingState;
  nutrition: NutritionState;
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
