import type { SupabaseClient } from "@supabase/supabase-js";
import type { GardenData } from "@garden/types";

export interface StorageAdapter<T> {
  load(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}

export const localStorageAdapter = <T>(key: string): StorageAdapter<T> => ({
  async load() {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },
  async save(value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  async clear() {
    window.localStorage.removeItem(key);
  },
});

export interface SupabaseAdapterConfig {
  client: SupabaseClient;
  userId: string;
  table?: string;
}

export const supabaseAdapter = <T>({ client, userId, table = "garden_data" }: SupabaseAdapterConfig): StorageAdapter<T> => ({
  async load() {
    const { data, error } = await client
      .from(table)
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.data ? (data.data as T) : null;
  },
  async save(value) {
    const { error } = await client
      .from(table)
      .upsert({ user_id: userId, data: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  },
  async clear() {
    const { error } = await client.from(table).delete().eq("user_id", userId);
    if (error) throw error;
  },
});

interface SharedGardenMembershipRow {
  workspace_id: string;
  role: "owner" | "partner";
}

interface SharedGardenDataRow {
  workspace_id: string;
  data: Partial<GardenData> | null;
}

const workspaceScopedKeys = [
  "fieldNotes",
  "workItems",
  "relationships",
  "sources",
  "objectNotes",
  "objectLinks",
  "objectActivity",
  "objectNextActions",
  "taskGardenItems",
  "objectComments",
] as const;

const relationScopedKeys = ["objectRelations"] as const;

type IdRecord = { id?: string };
type WorkspaceRecord = { workspaceId?: string };
type WorkspaceItem = GardenData["workspaces"][number];

const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const mergeById = <T extends IdRecord>(base: T[] = [], incoming: T[] = []) => {
  const incomingIds = new Set(incoming.map((item) => item.id).filter(Boolean));
  return [...base.filter((item) => !item.id || !incomingIds.has(item.id)), ...incoming];
};

const mergeWorkspacesById = (base: WorkspaceItem[] = [], incoming: WorkspaceItem[] = []) => {
  const byId = new Map<string, WorkspaceItem>();
  for (const workspace of base) byId.set(workspace.id, workspace);
  for (const workspace of incoming) {
    const existing = byId.get(workspace.id);
    byId.set(workspace.id, existing
      ? {
        ...existing,
        ...workspace,
        memberIds: workspace.memberIds?.length ? workspace.memberIds : existing.memberIds,
      }
      : workspace);
  }
  return [...byId.values()];
};

const forWorkspace = <T extends WorkspaceRecord>(items: T[] = [], workspaceId: string) =>
  items.filter((item) => item.workspaceId === workspaceId);

const withoutWorkspace = <T extends WorkspaceRecord>(items: T[] = [], workspaceId: string) =>
  items.filter((item) => item.workspaceId !== workspaceId);

const mergeSharedGardenData = (
  base: Partial<GardenData>,
  shared: Partial<GardenData>,
  workspaceId: string,
): Partial<GardenData> => {
  const next: Partial<GardenData> = { ...base };
  next.members = mergeById(asArray(base.members), asArray(shared.members));
  next.workspaces = mergeWorkspacesById(asArray(base.workspaces), asArray(shared.workspaces));
  for (const key of workspaceScopedKeys) {
    const baseItems = asArray<WorkspaceRecord>(base[key]);
    const sharedItems = forWorkspace(asArray<WorkspaceRecord>(shared[key]), workspaceId);
    (next as Record<string, unknown>)[key] = [...withoutWorkspace(baseItems, workspaceId), ...sharedItems];
  }
  for (const key of relationScopedKeys) {
    const baseItems = asArray<WorkspaceRecord>(base[key]);
    const sharedItems = forWorkspace(asArray<WorkspaceRecord>(shared[key]), workspaceId);
    (next as Record<string, unknown>)[key] = [...withoutWorkspace(baseItems, workspaceId), ...sharedItems];
  }
  return next;
};

const mergeSharedGardenPayload = (
  existing: Partial<GardenData>,
  incoming: Partial<GardenData>,
  workspaceId: string,
): Partial<GardenData> => {
  const next: Partial<GardenData> = {};
  next.members = mergeById(asArray(existing.members), asArray(incoming.members));
  next.workspaces = mergeWorkspacesById(asArray(existing.workspaces), asArray(incoming.workspaces));
  for (const key of workspaceScopedKeys) {
    (next as Record<string, unknown>)[key] = mergeById(
      forWorkspace(asArray<WorkspaceRecord & IdRecord>(existing[key]), workspaceId),
      forWorkspace(asArray<WorkspaceRecord & IdRecord>(incoming[key]), workspaceId),
    );
  }
  for (const key of relationScopedKeys) {
    (next as Record<string, unknown>)[key] = mergeById(
      forWorkspace(asArray<WorkspaceRecord & IdRecord>(existing[key]), workspaceId),
      forWorkspace(asArray<WorkspaceRecord & IdRecord>(incoming[key]), workspaceId),
    );
  }
  return next;
};

const extractSharedGardenData = (data: Partial<GardenData>, workspaceId: string): Partial<GardenData> => {
  const workspace = asArray<GardenData["workspaces"][number]>(data.workspaces).find((item) => item.id === workspaceId);
  const memberIds = new Set(workspace?.memberIds ?? []);
  const shared: Partial<GardenData> = {
    members: asArray<GardenData["members"][number]>(data.members).filter((member) => memberIds.size === 0 || memberIds.has(member.id)),
    workspaces: workspace ? [workspace] : [],
  };
  for (const key of workspaceScopedKeys) {
    (shared as Record<string, unknown>)[key] = forWorkspace(asArray<WorkspaceRecord>(data[key]), workspaceId);
  }
  for (const key of relationScopedKeys) {
    (shared as Record<string, unknown>)[key] = forWorkspace(asArray<WorkspaceRecord>(data[key]), workspaceId);
  }
  return shared;
};

const loadSharedMemberships = async (client: SupabaseClient, userId: string) => {
  const { data, error } = await client
    .from("shared_garden_members")
    .select("workspace_id, role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as SharedGardenMembershipRow[];
};

export const supabaseSharedGardenAdapter = ({
  client,
  userId,
  table = "garden_data",
}: SupabaseAdapterConfig): StorageAdapter<Partial<GardenData>> => {
  const personalAdapter = supabaseAdapter<Partial<GardenData>>({ client, userId, table });
  return {
    async load() {
      const personalData = await personalAdapter.load();
      const memberships = await loadSharedMemberships(client, userId);
      if (!memberships.length) return personalData;
      const workspaceIds = memberships.map((membership) => membership.workspace_id);
      const { data, error } = await client
        .from("shared_garden_data")
        .select("workspace_id, data")
        .in("workspace_id", workspaceIds);
      if (error) throw error;
      const merged = ((data ?? []) as SharedGardenDataRow[]).reduce(
        (merged, row) => mergeSharedGardenData(merged, row.data ?? {}, row.workspace_id),
        personalData ?? {},
      );
      return {
        ...merged,
        profile: merged.profile ? { ...merged.profile, id: userId } : merged.profile,
      };
    },
    async save(value) {
      await personalAdapter.save(value);
      const memberships = await loadSharedMemberships(client, userId);
      await Promise.all(memberships.map(async (membership) => {
        const outgoing = extractSharedGardenData(value, membership.workspace_id);
        const { data: existingRow, error: loadError } = await client
          .from("shared_garden_data")
          .select("workspace_id, data")
          .eq("workspace_id", membership.workspace_id)
          .maybeSingle();
        if (loadError) throw loadError;
        const data = mergeSharedGardenPayload(
          ((existingRow as SharedGardenDataRow | null)?.data ?? {}) as Partial<GardenData>,
          outgoing,
          membership.workspace_id,
        );
        const workspace = asArray<WorkspaceItem>(data.workspaces).find((item) => item.id === membership.workspace_id);
        if (existingRow) {
          const { error } = await client
            .from("shared_garden_data")
            .update({
              data,
              name: workspace?.name ?? "Shared Garden",
              updated_at: new Date().toISOString(),
            })
            .eq("workspace_id", membership.workspace_id);
          if (error) throw error;
          return;
        }
        const { error } = await client
          .from("shared_garden_data")
          .insert({
            workspace_id: membership.workspace_id,
            name: workspace?.name ?? "Shared Garden",
            data,
            created_by: userId,
          });
        if (error) throw error;
      }));
    },
    async clear() {
      await personalAdapter.clear();
    },
  };
};
