/**
 * ============================================================================
 * The Literary Room — Storage & Cache Persistence Architecture
 * File: assets/js/core/storage.js
 * Parameterized IndexedDB Chapter Cache and LocalStorage Progress Tracking
 * ============================================================================
 */

(function (window) {
  'use strict';

  /**
   * IndexedDB Cache Manager for Offline/Instant Chapter Retrieval
   */
  class ChapterCache {
    constructor(dbName = 'LiteraryRoomDB', dbVersion = 1, storeName = 'chapter_cache') {
      this.dbName = dbName;
      this.dbVersion = dbVersion;
      this.storeName = storeName;
      this._dbPromise = null;
    }

    _openDB() {
      if (this._dbPromise) return this._dbPromise;

      this._dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          resolve(null);
          return;
        }

        const request = window.indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'file' });
          }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => {
          console.warn('[ChapterCache] IndexedDB open error:', e.target.error);
          resolve(null);
        };
      });

      return this._dbPromise;
    }

    async get(filename) {
      try {
        const db = await this._openDB();
        if (!db) return null;

        return new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(filename);
          req.onsuccess = () => resolve(req.result ? req.result.content : null);
          req.onerror = () => resolve(null);
        });
      } catch (err) {
        console.warn('[ChapterCache] Failed to read chapter:', err);
        return null;
      }
    }

    async set(filename, content) {
      try {
        const db = await this._openDB();
        if (!db) return;

        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put({ file: filename, content: content, timestamp: Date.now() });
      } catch (err) {
        console.warn('[ChapterCache] Failed to cache chapter:', err);
      }
    }

    async clear() {
      try {
        const db = await this._openDB();
        if (!db) return;

        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).clear();
      } catch (err) {
        console.warn('[ChapterCache] Failed to clear store:', err);
      }
    }
  }

  /**
   * Safe LocalStorage Helper for Reading State & Scroll Position
   */
  const ProgressStorage = {
    get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn('[ProgressStorage] Read failed:', e);
        return null;
      }
    },

    set(key, data) {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn('[ProgressStorage] Save failed:', e);
      }
    },

    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn('[ProgressStorage] Remove failed:', e);
      }
    }
  };

  // Expose global namespace
  window.LiteraryStorage = {
    ChapterCache,
    ProgressStorage
  };

})(window);
