/**
 * Typed event bus (ARCHITECTURE.md §4) — framework-free on purpose: ~30 lines
 * buys us compile-checked payloads per event, headless testability, and zero
 * coupling to Phaser's emitter. Systems communicate ONLY through this.
 */
export type Handler<P> = (payload: P) => void;

export class EventBus<M extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof M, Set<Handler<never>>>();

  /** Subscribe. Returns an unsubscribe function (store it; call on teardown). */
  on<K extends keyof M>(event: K, fn: Handler<M[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => set.delete(fn as Handler<never>);
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    // Copy before iterating: a handler may unsubscribe (itself) mid-emit.
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) (fn as Handler<M[K]>)(payload);
  }

  /** Drop every subscription — called on scene shutdown to prevent the
   *  classic restart bug: stale handlers from a dead run firing twice. */
  clear(): void {
    this.handlers.clear();
  }
}
