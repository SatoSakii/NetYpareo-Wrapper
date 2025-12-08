import { EventEmitter } from 'events';

import type { YpareoClientEvents } from '../types';

export class EventManager {
    private emitter: EventEmitter;

    /**
     * Creates an instance of EventManager.
     */
    constructor() {
        this.emitter = new EventEmitter();
    }

    /**
     * Registers an event listener for the specified event.
     * @param event - The event name.
     * @param listener - The callback function to invoke when the event is emitted.
     */
    on<K extends keyof YpareoClientEvents>(
        event: K,
        listener: (...args: YpareoClientEvents[K]) => void
    ): void {
        this.emitter.on(event, listener);
    }

    /**
     * Registers a one-time event listener for the specified event.
     * @param event - The event name.
     * @param listener - The callback function to invoke when the event is emitted.
     */
    once<K extends keyof YpareoClientEvents>(
        event: K,
        listener: (...args: YpareoClientEvents[K]) => void
    ): void {
        this.emitter.once(event, listener);
    }

    /**
     * Removes an event listener for the specified event.
     * @param event - The event name.
     * @param listener - The callback function to remove.
     */
    off<K extends keyof YpareoClientEvents>(
        event: K,
        listener: (...args: YpareoClientEvents[K]) => void
    ): void {
        this.emitter.off(event, listener);
    }

    /**
     * Emits the specified event with the given arguments.
     * @param event - The event name.
     * @param args - The arguments to pass to the event listeners.
     * @returns True if the event had listeners, false otherwise.
     */
    emit<K extends keyof YpareoClientEvents>(
        event: K,
        ...args: YpareoClientEvents[K]
    ): boolean {
        return this.emitter.emit(event, ...args);
    }
}
