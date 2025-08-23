// Type definitions for requestIdleCallback
interface RequestIdleCallbackOptions {
  timeout?: number;
}

interface RequestIdleCallbackDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

type RequestIdleCallbackHandle = number;
type RequestIdleCallbackCallback = (deadline: RequestIdleCallbackDeadline) => void;

// Polyfill for requestIdleCallback and cancelIdleCallback
if (typeof window !== 'undefined') {
  if (!('requestIdleCallback' in window)) {
    (window as any).requestIdleCallback = function(
      callback: RequestIdleCallbackCallback,
      options?: RequestIdleCallbackOptions
    ): RequestIdleCallbackHandle {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
      }, options?.timeout || 1) as unknown as RequestIdleCallbackHandle;
    };
  }

  if (!('cancelIdleCallback' in window)) {
    (window as any).cancelIdleCallback = function(id: RequestIdleCallbackHandle): void {
      clearTimeout(id);
    };
  }
}

export {}; 