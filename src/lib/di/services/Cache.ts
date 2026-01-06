/**
 * Cache Service Implementation
 * In-memory cache with TTL support
 */

import { ICache, IDisposable } from '../types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class Cache<T = any> implements ICache<T>, IDisposable {
  private store: Map<string, CacheEntry<T>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private defaultTTL: number;

  constructor(options: { defaultTTL?: number; cleanupIntervalMs?: number } = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default

    // Start cleanup interval
    const cleanupInterval = options.cleanupIntervalMs || 60 * 1000; // 1 minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupInterval);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.store.set(key, {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Check if key exists (and not expired)
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(key: string, factory: () => T | Promise<T>, ttlMs?: number): Promise<T> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    this.cleanup();
    return Array.from(this.store.keys());
  }

  /**
   * Get cache size
   */
  get size(): number {
    this.cleanup();
    return this.store.size;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  async dispose(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * LRU Cache implementation for bounded memory usage
 */
export class LRUCache<T = any> implements ICache<T>, IDisposable {
  private store: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Remove if exists to update position
    this.store.delete(key);

    // Evict oldest if at capacity
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  get size(): number {
    return this.store.size;
  }

  async dispose(): Promise<void> {
    this.store.clear();
  }
}

// Default cache instance
export const cache = new Cache();
