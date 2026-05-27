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
  url: string;
  anonKey: string;
}

export const supabaseAdapter = <T>(_config: SupabaseAdapterConfig): StorageAdapter<T> => ({
  async load() {
    throw new Error("Supabase synchronization is reserved for a later release.");
  },
  async save(_value) {
    throw new Error("Supabase synchronization is reserved for a later release.");
  },
  async clear() {
    throw new Error("Supabase synchronization is reserved for a later release.");
  },
});
