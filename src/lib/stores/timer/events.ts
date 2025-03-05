import type { TimerEvent, TimerEventType, EventCallback } from './types';

type EventStore = Map<TimerEventType, EventCallback[]>;

const debug = (message: string, data?: Record<string, unknown>): void => {
  console.log(`[TimerStore] ${message}`, data || '');
};

const createEventStore = (): EventStore => new Map();

const addEventListener = (store: EventStore, type: TimerEventType, callback: EventCallback): (() => void) => {
  debug(`Adding event listener for: ${type}`);
  const callbacks = store.get(type) || [];
  store.set(type, [...callbacks, callback]);

  return () => {
    debug(`Removing event listener for: ${type}`);
    const updatedCallbacks = (store.get(type) || []).filter(cb => cb !== callback);
    store.set(type, updatedCallbacks);
  };
};

const removeAllEventListeners = (store: EventStore): void => {
  debug('Removing all event listeners');
  store.clear();
};

const emitEvent = (store: EventStore, event: TimerEvent): void => {
  debug(`Emitting event: ${event.type}`, {
    phaseIndex: event.phaseIndex,
    timerId: event.timerId
  });

  const callbacks = store.get(event.type) || [];
  callbacks.forEach(callback => callback(event));
};

export {
  type EventStore,
  createEventStore,
  addEventListener,
  removeAllEventListeners,
  emitEvent
};
