import {
  DEFAULT_MEMBER_ID,
  DEFAULT_PRIVATE_WORKSPACE_ID,
  DEFAULT_SHARED_WORKSPACE_ID,
  SONUM_MEMBER_ID,
  createFreshData,
  createId,
  createSeedData,
  createSourceFromUrl,
  defaultNutritionState,
  getPlan,
  nextDayKey,
  todayKey,
} from "@garden/domain";
import { localStorageAdapter, type StorageAdapter } from "@garden/storage";
import type {
  DailyPlan,
  GardenData,
  ObjectRef,
  ObjectVisibility,
  TaskGardenZone,
  UserContext,
  WorkItemKind,
  Workspace,
} from "@garden/types";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_STORAGE_KEY = "garden-os:v1:fresh";
const LEGACY_MEMBER_IDS = new Set([DEFAULT_MEMBER_ID, "new-user", SONUM_MEMBER_ID]);
const LEGACY_TRAIN_TEMPLATE_IDS = new Set(["full-body", "pull-focus"]);

export interface GardenContextValue {
  data: GardenData;
  userContext: UserContext;
  update: (recipe: (current: GardenData) => GardenData) => void;
  reset: () => Promise<void>;
  ready: boolean;
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  setActiveWorkspaceId: (workspaceId: string) => void;
  currentMemberId: string;
  syncStatus: "local" | "syncing" | "synced" | "error";
  syncError: string | null;
}

const GardenContext = createContext<GardenContextValue | null>(null);

export type GardenSeedMode = "fresh" | "demo";

const createInitialData = (mode: GardenSeedMode, date = todayKey()) =>
  mode === "demo" ? createSeedData(date) : createFreshData(date);

const initialsForName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Y";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

const ensurePersonalWorkspaceDefaults = (data: GardenData): GardenData => {
  const primaryMemberId = data.profile.id || "new-user";
  const existingMembers = data.members.length ? data.members : [];
  const primaryMember = existingMembers.find((member) => member.id === primaryMemberId) ?? {
    id: primaryMemberId,
    name: data.profile.name || "You",
    avatarInitials: initialsForName(data.profile.name || "You"),
  };
  const legacyMemberIdsToDrop = new Set<string>();
  for (const memberId of LEGACY_MEMBER_IDS) {
    if (memberId !== primaryMember.id) legacyMemberIdsToDrop.add(memberId);
  }
  const normalizeMemberId = (memberId?: string) => {
    if (!memberId) return memberId;
    if (legacyMemberIdsToDrop.has(memberId)) return primaryMemberId;
    return memberId;
  };
  const privateWorkspace = data.workspaces.find((workspace) => workspace.id === DEFAULT_PRIVATE_WORKSPACE_ID) ?? {
    id: DEFAULT_PRIVATE_WORKSPACE_ID,
    name: "My Garden",
    kind: "private" as const,
    memberIds: [primaryMemberId],
  };
  const workspaces = [{ ...privateWorkspace, id: DEFAULT_PRIVATE_WORKSPACE_ID, kind: "private" as const, memberIds: [primaryMemberId] }];
  const withObjectMeta = <T extends { workspaceId?: string; visibility?: ObjectVisibility; createdBy?: string }>(items: T[]) =>
    items.map((item) => ({
      ...item,
      workspaceId: DEFAULT_PRIVATE_WORKSPACE_ID,
      visibility: "private" as const,
      createdBy: normalizeMemberId(item.createdBy) ?? primaryMemberId,
    }));
  return {
    ...data,
    members: [{ ...primaryMember, id: primaryMemberId }],
    workspaces,
    fieldNotes: withObjectMeta(data.fieldNotes),
    workItems: withObjectMeta(data.workItems),
    relationships: withObjectMeta(data.relationships),
    sources: withObjectMeta(data.sources),
    objectNotes: withObjectMeta(data.objectNotes),
    objectLinks: withObjectMeta(data.objectLinks),
    objectActivity: withObjectMeta(data.objectActivity),
    objectNextActions: withObjectMeta(data.objectNextActions),
    objectRelations: data.objectRelations.map((relation) => ({
      ...relation,
      workspaceId: DEFAULT_PRIVATE_WORKSPACE_ID,
    })),
    taskGardenItems: data.taskGardenItems
      .filter((item) =>
        (item.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) !== DEFAULT_SHARED_WORKSPACE_ID &&
        item.visibility !== "shared"
      )
      .map((item) => ({
        ...item,
        workspaceId: DEFAULT_PRIVATE_WORKSPACE_ID,
        visibility: "private" as const,
        ownerId: undefined,
        assigneeIds: [],
        createdBy: normalizeMemberId(item.createdBy) ?? primaryMemberId,
      })),
    objectComments: data.objectComments.map((comment) => ({
      ...comment,
      workspaceId: DEFAULT_PRIVATE_WORKSPACE_ID,
      visibility: "private" as const,
      authorId: normalizeMemberId(comment.authorId) ?? primaryMemberId,
    })),
    partnerSharingSettings: [],
  };
};

const mergeDefaultsFirst = <T extends { id: string }>(defaults: T[], existing: T[]) => {
  const merged = new Map(defaults.map((item) => [item.id, item]));
  existing.forEach((item) => {
    if (!merged.has(item.id)) merged.set(item.id, item);
  });
  return [...merged.values()];
};

const mergeWithExistingOverrides = <T extends { id: string }>(defaults: T[], existing: T[]) => {
  const merged = new Map(defaults.map((item) => [item.id, item]));
  existing.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
};

const migrateTrainDefaults = (storedTrain: GardenData["train"] | undefined, seedTrain: GardenData["train"]): GardenData["train"] => {
  if (!storedTrain) return seedTrain;
  const sessions = storedTrain.sessions ?? [];
  const activeSession = sessions.find((session) => session.id === storedTrain.activeSessionId && !session.completedAt);
  const storedTemplates = (storedTrain.templates ?? []).filter((template) =>
    !LEGACY_TRAIN_TEMPLATE_IDS.has(template.id) || template.id === activeSession?.templateId
  );
  return {
    ...seedTrain,
    ...storedTrain,
    targets: mergeDefaultsFirst(seedTrain.targets, storedTrain.targets ?? []),
    exercises: mergeDefaultsFirst(seedTrain.exercises, storedTrain.exercises ?? []),
    customExercises: storedTrain.customExercises ?? [],
    sets: storedTrain.sets ?? [],
    templates: mergeDefaultsFirst(seedTrain.templates, storedTemplates),
    sessions,
  };
};

const migrateNutritionDefaults = (
  storedNutrition: GardenData["nutrition"] | undefined,
  seedNutrition: GardenData["nutrition"],
  storedProfile: Partial<GardenData["profile"]> | undefined,
): GardenData["nutrition"] => {
  if (!storedNutrition) {
    return {
      ...seedNutrition,
      settings: {
        ...seedNutrition.settings,
        proteinTargetGrams: storedProfile?.proteinTarget ?? seedNutrition.settings.proteinTargetGrams,
      },
    };
  }
  const deletedFoodIds = new Set(storedNutrition.deletedFoodIds ?? []);
  const deletedRecipeIds = new Set(storedNutrition.deletedRecipeIds ?? []);
  const foods = mergeWithExistingOverrides(seedNutrition.foods, storedNutrition.foods ?? [])
    .filter((food) => !deletedFoodIds.has(food.id));
  const recipes = mergeWithExistingOverrides(seedNutrition.recipes, storedNutrition.recipes ?? [])
    .filter((recipe) => !deletedRecipeIds.has(recipe.id))
    .map((recipe) => ({
      ...recipe,
      ingredients: recipe.ingredients.filter((ingredient) => !deletedFoodIds.has(ingredient.foodId)),
    }));
  return {
    ...defaultNutritionState,
    ...seedNutrition,
    ...storedNutrition,
    settings: {
      ...defaultNutritionState.settings,
      ...seedNutrition.settings,
      ...storedNutrition.settings,
      proteinTargetGrams: storedNutrition.settings?.proteinTargetGrams ?? storedProfile?.proteinTarget ?? seedNutrition.settings.proteinTargetGrams,
    },
    foods,
    recipes,
    deletedFoodIds: [...deletedFoodIds],
    deletedRecipeIds: [...deletedRecipeIds],
  };
};

export const migrateGardenData = (stored: Partial<GardenData> | null, date = todayKey()): GardenData => {
  const seed = createFreshData(date);
  if (!stored) return seed;
  return ensurePersonalWorkspaceDefaults({
    ...seed,
    ...stored,
    profile: { ...seed.profile, ...stored.profile },
    members: stored.members ?? seed.members,
    workspaces: stored.workspaces ?? seed.workspaces,
    train: migrateTrainDefaults(stored.train, seed.train),
    nutrition: migrateNutritionDefaults(stored.nutrition, seed.nutrition, stored.profile),
    relationships: stored.relationships ?? seed.relationships,
    sources: stored.sources ?? seed.sources,
    objectNotes: stored.objectNotes ?? seed.objectNotes,
    objectLinks: stored.objectLinks ?? seed.objectLinks,
    objectRelations: stored.objectRelations ?? seed.objectRelations,
    objectActivity: stored.objectActivity ?? seed.objectActivity,
    objectNextActions: stored.objectNextActions ?? seed.objectNextActions,
    taskGardenItems: (stored.taskGardenItems ?? seed.taskGardenItems).map((item) => ({
      ...item,
      visibility: item.visibility ?? "private",
      assigneeIds: item.assigneeIds ?? (item.ownerId ? [item.ownerId] : []),
    })),
    objectComments: stored.objectComments ?? seed.objectComments,
    partnerSharingSettings: [],
    meals: stored.meals ?? seed.meals,
    mealPlans: stored.mealPlans ?? seed.mealPlans,
    groceries: stored.groceries ?? seed.groceries,
    journal: stored.journal ?? seed.journal,
    decisions: stored.decisions ?? seed.decisions,
    mentalModels: stored.mentalModels ?? seed.mentalModels,
    sprints: stored.sprints ?? seed.sprints,
  });
};

export const deriveUserContext = (data: GardenData, date = todayKey()): UserContext => {
  const plan = getPlan(data, date);
  const latestReview = data.reviews[0];
  const activeWork = data.kanbanCards.filter((card) => card.column === "today" || card.column === "blocked").length;
  const hardSets = data.train.sets.filter((set) => set.rir <= 4).length;
  const protein = data.meals.filter((meal) => meal.date === date).reduce((sum, meal) => sum + meal.proteinGrams, 0);
  const proteinTarget = data.nutrition?.settings.proteinTargetGrams ?? data.profile.proteinTarget;
  return {
    goals: [data.profile.focusTheme, data.projects[0]?.outcome ?? "Protect meaningful attention."],
    energy: latestReview?.energy ?? plan.energy,
    mood: latestReview?.mood ?? 3,
    trainingLoad: hardSets >= 14 ? "high" : hardSets >= 6 ? "moderate" : "low",
    workload: activeWork >= 4 ? "overloaded" : activeWork >= 2 ? "balanced" : "clear",
    projects: data.projects.map((project) => project.name),
    proteinProgress: Math.min(protein / proteinTarget, 1),
    hydrationComplete: plan.hydrationComplete,
    focusPreference: plan.activeClarityGoal,
  };
};

export const changePlan = (data: GardenData, date: string, change: (plan: DailyPlan) => DailyPlan): GardenData => {
  const existing = data.plans.some((plan) => plan.date === date);
  const plan = change(getPlan(data, date));
  return { ...data, plans: existing ? data.plans.map((item) => item.date === date ? plan : item) : [...data.plans, plan] };
};

export interface CaptureResult {
  data: GardenData;
  ref?: ObjectRef;
}

export interface CaptureOptions {
  workspaceId?: string;
  visibility?: ObjectVisibility;
  createdBy?: string;
  addToTaskGarden?: boolean;
  taskGardenZone?: TaskGardenZone;
  ownerId?: string;
}

const isUrlCapture = (value: string) => /^https?:\/\//i.test(value.trim());

const workspaceIdForData = (data: GardenData, workspaceId?: string) =>
  workspaceId ?? data.workspaces[0]?.id ?? DEFAULT_PRIVATE_WORKSPACE_ID;

const visibilityForWorkspace = (data: GardenData, workspaceId: string, visibility?: ObjectVisibility): ObjectVisibility =>
  visibility ?? (data.workspaces.find((workspace) => workspace.id === workspaceId)?.kind === "shared" ? "shared" : "private");

const createdByForData = (data: GardenData, createdBy?: string) => createdBy ?? data.profile.id;

const withTaskGardenItem = (
  data: GardenData,
  title: string,
  ref: ObjectRef | undefined,
  options: CaptureOptions,
): GardenData => {
  if (!options.addToTaskGarden) return data;
  const workspaceId = workspaceIdForData(data, options.workspaceId);
  const visibility = visibilityForWorkspace(data, workspaceId, options.visibility);
  return {
    ...data,
    taskGardenItems: [
      {
        id: createId(),
        objectRef: ref,
        workspaceId,
        visibility,
        zone: options.taskGardenZone ?? "develop",
        title,
        ownerId: options.ownerId,
        assigneeIds: options.ownerId ? [options.ownerId] : [],
        createdBy: createdByForData(data, options.createdBy),
        createdAt: new Date().toISOString(),
      },
      ...data.taskGardenItems,
    ],
  };
};

export const captureUniversalItem = (
  data: GardenData,
  title: string,
  kind: WorkItemKind = "thought",
  options: CaptureOptions = {},
): CaptureResult => {
  const trimmed = title.trim();
  if (!trimmed) return { data };
  const workspaceId = workspaceIdForData(data, options.workspaceId);
  const visibility = visibilityForWorkspace(data, workspaceId, options.visibility);
  const createdBy = createdByForData(data, options.createdBy);
  if (isUrlCapture(trimmed)) {
    const existing = data.sources.find((source) =>
      source.url.toLowerCase() === trimmed.toLowerCase() &&
      (source.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === workspaceId
    );
    if (existing) {
      const ref: ObjectRef = { kind: "source", id: existing.id };
      const nextData = {
        ...data,
        objectActivity: [
          {
            id: createId(),
            object: ref,
            createdAt: new Date().toISOString(),
            action: "Captured again",
            detail: "Source was pasted into Quick Capture.",
            workspaceId,
            visibility,
            createdBy,
          },
          ...data.objectActivity,
        ],
      };
      return {
        ref,
        data: withTaskGardenItem(nextData, existing.title, ref, options),
      };
    }
    const source = { ...createSourceFromUrl(trimmed), workspaceId, visibility, createdBy };
    const ref: ObjectRef = { kind: "source", id: source.id };
    const nextData = {
      ...data,
      sources: [source, ...data.sources],
      objectLinks: [
        {
          id: createId(),
          object: ref,
          createdAt: source.createdAt,
          url: source.url,
          label: "Captured source",
          workspaceId,
          visibility,
          createdBy,
        },
        ...data.objectLinks,
      ],
      objectActivity: [
        {
          id: createId(),
          object: ref,
          createdAt: source.createdAt,
          action: "Captured source",
          detail: source.url,
          workspaceId,
          visibility,
          createdBy,
        },
        ...data.objectActivity,
      ],
    };
    return {
      ref,
      data: withTaskGardenItem(nextData, source.title, ref, options),
    };
  }
  if (kind === "person" || kind === "company") {
    const existing = data.relationships.find((record) =>
      record.kind === kind &&
      record.name.toLowerCase() === trimmed.toLowerCase() &&
      (record.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === workspaceId
    );
    const existingRef: ObjectRef | undefined = existing ? { kind, id: existing.id } : undefined;
    if (existing) {
      const nextData = {
        ...data,
        relationships: data.relationships.map((record) =>
          record.id === existing.id
            ? {
              ...record,
              stage: record.stage === "archived" ? "new" : record.stage,
              updatedBy: createdBy,
              notes: [
                {
                  id: createId(),
                  createdAt: new Date().toISOString(),
                  kind: "note" as const,
                  body: "Mentioned again in Quick Capture.",
                },
                ...record.notes,
              ],
            }
            : record,
        ),
      };
      return {
        ref: existingRef,
        data: withTaskGardenItem(nextData, trimmed, existingRef, options),
      };
    }
    const id = createId();
    const newRef = { kind, id } satisfies ObjectRef;
    const nextData = {
      ...data,
      relationships: [
        {
          id,
          createdAt: new Date().toISOString(),
          kind,
          name: trimmed,
          stage: "new" as const,
          notes: [],
          workspaceId,
          visibility,
          createdBy,
        },
        ...data.relationships,
      ],
    };
    return {
      ref: newRef,
      data: withTaskGardenItem(nextData, trimmed, newRef, options),
    };
  }
  const id = createId();
  const ref: ObjectRef | undefined = kind === "content" ? { kind: "content", id } : undefined;
  const createdAt = new Date().toISOString();
  const nextData = {
    ...data,
    workItems: [
      {
        id,
        createdAt,
        title: trimmed,
        kind,
        triage: "untriaged" as const,
        workspaceId,
        visibility,
        createdBy,
        ...(kind === "content" ? { contentStage: "seed" as const, contentFormat: "post" as const } : {}),
      },
      ...data.workItems,
    ],
  };
  return { data: withTaskGardenItem(nextData, trimmed, ref, options), ref };
};

export const captureItem = (data: GardenData, title: string, kind: WorkItemKind = "thought"): GardenData => {
  const { data: nextData } = captureUniversalItem(data, title, kind);
  return nextData;
};

export const createContentIdeaFromSourceNote = (
  data: GardenData,
  sourceRef: ObjectRef,
  noteId: string,
  options: CaptureOptions = {},
): { data: GardenData; ref?: ObjectRef } => {
  const note = data.objectNotes.find((item) => item.id === noteId);
  if (!note) return { data };
  const source = data.sources.find((item) => item.id === sourceRef.id);
  const id = createId();
  const ref: ObjectRef = { kind: "content", id };
  const workspaceId = workspaceIdForData(data, options.workspaceId ?? note.workspaceId ?? source?.workspaceId);
  const visibility = visibilityForWorkspace(data, workspaceId, options.visibility ?? note.visibility ?? source?.visibility);
  const createdBy = createdByForData(data, options.createdBy ?? note.createdBy);
  const createdAt = new Date().toISOString();
  return {
    ref,
    data: {
      ...data,
      workItems: [
        {
          id,
          createdAt,
          title: note.body.slice(0, 90),
          kind: "content",
          triage: "untriaged",
          contentStage: "seed",
          contentFormat: "post",
          audience: "Creators and operators",
          hook: note.body,
          workspaceId,
          visibility,
          createdBy,
        },
        ...data.workItems,
      ],
      objectRelations: [
        {
          id: createId(),
          from: sourceRef,
          to: ref,
          label: "source-for",
          workspaceId,
        },
        ...data.objectRelations,
      ],
      objectActivity: [
        {
          id: createId(),
          object: ref,
          createdAt,
          action: "Created from source note",
          detail: source?.title ?? "Source note",
          workspaceId,
          visibility,
          createdBy,
        },
        ...data.objectActivity,
      ],
    },
  };
};

export const scheduleTask = (
  data: GardenData,
  date: string,
  taskId: string,
  startMinute: number | null,
): GardenData =>
  changePlan(data, date, (plan) => ({
    ...plan,
    tasks: plan.tasks.map((task) =>
      task.id === taskId ? { ...task, startMinute: startMinute ?? undefined } : task,
    ),
  }));

export const deferTask = (data: GardenData, date: string, taskId: string): GardenData => {
  const item = getPlan(data, date).tasks.find((task) => task.id === taskId);
  if (!item) return data;
  const tomorrow = nextDayKey(date);
  return changePlan(
    changePlan(data, date, (plan) => ({ ...plan, tasks: plan.tasks.filter((task) => task.id !== taskId) })),
    tomorrow,
    (plan) => ({
      ...plan,
      tasks: [
        ...plan.tasks,
        {
          ...item,
          status: "active",
          scheduledDate: tomorrow,
          order: plan.tasks.filter((task) => task.tier === item.tier).length,
          deferCount: (item.deferCount ?? 0) + 1,
        },
      ],
    }),
  );
};

export const GardenProvider = ({
  children,
  seedMode = "fresh",
  storageKey = DEFAULT_STORAGE_KEY,
  remoteAdapter,
  fallbackStorageKeys = [],
}: PropsWithChildren<{
  seedMode?: GardenSeedMode;
  storageKey?: string;
  remoteAdapter?: StorageAdapter<Partial<GardenData>> | null;
  fallbackStorageKeys?: string[];
}>) => {
  const adapter = useMemo(() => localStorageAdapter<Partial<GardenData>>(storageKey), [storageKey]);
  const fallbackKeySignature = fallbackStorageKeys.join("|");
  const fallbackAdapters = useMemo(
    () => fallbackStorageKeys.map((key) => localStorageAdapter<Partial<GardenData>>(key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fallbackKeySignature],
  );
  const [data, setData] = useState<GardenData>(() => createInitialData(seedMode));
  const [ready, setReady] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(DEFAULT_PRIVATE_WORKSPACE_ID);
  const [syncStatus, setSyncStatus] = useState<GardenContextValue["syncStatus"]>(remoteAdapter ? "syncing" : "local");
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    setSyncStatus(remoteAdapter ? "syncing" : "local");
    setSyncError(null);
    setData(createInitialData(seedMode));
    void (async () => {
      const [primaryLocal, ...fallbackLocal] = await Promise.all([
        adapter.load(),
        ...fallbackAdapters.map((fallback) => fallback.load()),
      ]);
      const localSaved = primaryLocal ?? fallbackLocal.find(Boolean) ?? null;
      if (remoteAdapter) {
        try {
          const remoteSaved = await remoteAdapter.load();
          if (!mounted) return;
          if (remoteSaved) {
            setData(migrateGardenData(remoteSaved));
            setSyncStatus("synced");
          } else if (localSaved) {
            const migrated = migrateGardenData(localSaved);
            setData(migrated);
            await remoteAdapter.save(migrated);
            setSyncStatus("synced");
          } else {
            setData(createInitialData(seedMode));
            setSyncStatus("synced");
          }
          setReady(true);
          return;
        } catch (error) {
          if (!mounted) return;
          setSyncStatus("error");
          setSyncError(error instanceof Error ? error.message : "Could not sync with Supabase.");
        }
      }
      if (!mounted) return;
      setData(localSaved ? migrateGardenData(localSaved) : createInitialData(seedMode));
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [adapter, fallbackAdapters, remoteAdapter, seedMode]);

  useEffect(() => {
    if (!ready) return;
    void adapter.save(data);
    if (!remoteAdapter) return;
    let mounted = true;
    setSyncStatus("syncing");
    void remoteAdapter.save(data)
      .then(() => {
        if (!mounted) return;
        setSyncStatus("synced");
        setSyncError(null);
      })
      .catch((error) => {
        if (!mounted) return;
        setSyncStatus("error");
        setSyncError(error instanceof Error ? error.message : "Could not sync with Supabase.");
      });
    return () => {
      mounted = false;
    };
  }, [adapter, data, ready, remoteAdapter]);

  useEffect(() => {
    if (data.workspaces.some((workspace) => workspace.id === activeWorkspaceId)) return;
    setActiveWorkspaceId(data.workspaces[0]?.id ?? DEFAULT_PRIVATE_WORKSPACE_ID);
  }, [activeWorkspaceId, data.workspaces]);

  const userContext = useMemo(() => deriveUserContext(data), [data]);
  const activeWorkspace = useMemo(
    () => data.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? data.workspaces[0],
    [activeWorkspaceId, data.workspaces],
  );
  const currentMemberId = data.profile.id;
  const value = useMemo<GardenContextValue>(() => ({
    data,
    userContext,
    ready,
    activeWorkspaceId: activeWorkspace?.id ?? DEFAULT_PRIVATE_WORKSPACE_ID,
    activeWorkspace: activeWorkspace ?? {
      id: DEFAULT_PRIVATE_WORKSPACE_ID,
      name: "My Garden",
      kind: "private",
      memberIds: [currentMemberId],
    },
    setActiveWorkspaceId,
    currentMemberId,
    syncStatus,
    syncError,
    update: (recipe) => setData((current) => recipe(current)),
    reset: async () => {
      await adapter.clear();
      if (remoteAdapter) await remoteAdapter.clear();
      setData(createInitialData(seedMode));
      setActiveWorkspaceId(DEFAULT_PRIVATE_WORKSPACE_ID);
    },
  }), [activeWorkspace, activeWorkspaceId, adapter, currentMemberId, data, ready, remoteAdapter, seedMode, syncError, syncStatus, userContext]);
  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) throw new Error("useGarden must be used within GardenProvider");
  return context;
};
