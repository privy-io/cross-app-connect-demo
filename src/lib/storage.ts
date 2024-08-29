export interface Storage {
  get<T = unknown>(key: string): T | null;
  put<T>(key: string, value: T): void;
  del(key: string): void;
  getKeys(): string[];
}

export class InMemoryCache implements Storage {
  _cache: {[key: string]: any} = {};

  get(key: string) {
    return this._cache[key];
  }

  put(key: string, val: any) {
    if (val !== undefined) {
      this._cache[key] = val;
    } else {
      this.del(key);
    }
  }

  del(key: string) {
    delete this._cache[key];
  }

  getKeys() {
    return Object.keys(this._cache);
  }
}

export class LocalStorage implements Storage {
  get(key: string) {
    const val = localStorage.getItem(key);
    return val === null ? undefined : JSON.parse(val);
  }

  put(key: string, val: any) {
    if (val !== undefined) {
      localStorage.setItem(key, JSON.stringify(val));
    } else {
      this.del(key);
    }
  }

  del(key: string) {
    localStorage.removeItem(key);
  }

  getKeys() {
    return Object.entries(localStorage).map(([key]) => key);
  }
}

// TODO: implement for all browser storage & add to Storage interface
function isLocalStorageAccessible() {
  try {
    // If local storage is not accessible, put will throw and we will return false
    const key = 'privy:__session_storage__test';
    const value = 'blobby';
    const storage = new LocalStorage();
    storage.put(key, value);
    storage.del(key);
    return true;
  } catch (e) {
    return false;
  }
}

function defaultStorageProvider(): Storage {
  /**
   * Default to using localStorage.
   *
   * While this package is intended for browser-only usage, there are
   * still cases where localStorage may not be available. For example:
   *
   *     1. localStorage is not available in web/session workers
   *     2. Some of this code may be executed in a node process, e.g.,
   *        Next.js initial server render.
   */
  return typeof window !== 'undefined' && window.localStorage
    ? new LocalStorage()
    : new InMemoryCache();
}

export default defaultStorageProvider();
export {isLocalStorageAccessible};
