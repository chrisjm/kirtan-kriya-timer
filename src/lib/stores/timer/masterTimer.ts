interface TimerHandlers {
  onTick: (timeRemaining: number) => void;
  onComplete: () => void;
}

interface TimerState {
  timerId: number | null;
  endTime: number;
}

export function createMasterTimer(handlers: TimerHandlers) {
  const state: TimerState = {
    timerId: null,
    endTime: 0
  };

  function cleanup(): void {
    if (state.timerId !== null) {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
  }

  function scheduleNextTick(): void {
    const now = Date.now();
    const remaining = Math.max(0, state.endTime - now);

    // Update time remaining
    handlers.onTick(remaining);

    if (remaining > 0) {
      // Schedule next tick
      state.timerId = window.setTimeout(scheduleNextTick, 1000);
    } else {
      cleanup();
      handlers.onComplete();
    }
  }

  function start(timeRemaining: number): void {
    cleanup();
    state.endTime = Date.now() + timeRemaining;
    scheduleNextTick();
  }

  function pause(): void {
    cleanup();
  }

  return {
    start,
    pause
  };
}
