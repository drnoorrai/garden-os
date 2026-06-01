import type { SupabaseClient } from "@supabase/supabase-js";

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
