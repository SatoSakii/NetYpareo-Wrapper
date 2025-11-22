import { BaseClient } from './core/BaseClient';
import { EventManager } from './core/EventManager';
import { AuthManager } from './core/AuthManager';
import type { YpareoClientConfig, YpareoClientEvents } from './types';
import type { User } from './models';

export class YpareoClient extends BaseClient {
	private events: EventManager;
	private auth: AuthManager;

	/**
	 * Creates a new YpareoClient instance.
	 * @param config - The configuration object for the client.
	 * @returns A new instance of YpareoClient.
	 */
	constructor(config: YpareoClientConfig) {
		super(config);

		this.events = new EventManager(config.debug);
		this.auth = new AuthManager(
			this.http,
			this.session,
			this.events,
			this.urls,
			config.username,
			config.password
		);
	}

	/**
	 * Registers an event listener for the specified event.
	 * @param event - The name of the event to listen for.
	 * @param listener - The callback function to invoke when the event is emitted.
	 * @returns The current YpareoClient instance for chaining.
	 */
	on<K extends keyof YpareoClientEvents>(
		event: K,
		listener: (...args: YpareoClientEvents[K]) => void
	): this {
		this.events.on(event, listener);
		return this;
	}

	/**
	 * Registers a one-time event listener for the specified event.
	 * @param event - The name of the event to listen for.
	 * @param listener - The callback function to invoke when the event is emitted.
	 * @returns The current YpareoClient instance for chaining.
	 */
	once<K extends keyof YpareoClientEvents>(
		event: K,
		listener: (...args: YpareoClientEvents[K]) => void
	): this {
		this.events.once(event, listener);
		return this;
	}

	/**
	 * Removes an event listener for the specified event.
	 * @param event - The name of the event.
	 * @param listener - The callback function to remove.
	 * @returns The current YpareoClient instance for chaining.
	 */
	off<K extends keyof YpareoClientEvents>(
		event: K,
		listener: (...args: YpareoClientEvents[K]) => void
	): this {
		this.events.off(event, listener);
		return this;
	}

	/**
	 * Logs in the user with the provided credentials.
	 * @returns The current YpareoClient instance for chaining.
	 */
	login(): this {
		this.auth.login().catch(() => { });
		return this;
	}

	/**
	 * Logs in the user with the provided credentials asynchronously.
	 * @returns A promise that resolves to the logged-in User object.
	 */
	async loginAsync(): Promise<User> {
		return this.auth.login();
	}

	/**
	 * Restores a previous session using the provided session data.
	 * @param sessionData - The serialized session data.
	 * @param autoRelogin - Whether to automatically relogin if the session is invalid.
	 * @returns A promise that resolves to the restored User object.
	 */
	async restoreSession(sessionData: string, autoRelogin: boolean = true): Promise<User> {
		return this.auth.restoreSession(sessionData, autoRelogin);
	}

	/**
	 * Saves the current session and returns the serialized session data.
	 * @returns The serialized session data as a string.
	 */
	saveSession(): string {
		if (!this.session.isConnected())
			throw new Error('No active session to save');
		return this.session.serialize();
	}

	/**
	 * Logs out the current user and resets the session.
	 * @returns The current YpareoClient instance for chaining.
	 */
	logout(): this {
		this.auth.logout().catch(() => { });
		this.session.reset();
		return this;
	}

	/**
	 * Logs out the current user and resets the session asynchronously.
	 * @returns A promise that resolves when the logout process is complete.
	 */
	async logoutAsync(): Promise<void> {
		this.session.reset();
		return this.auth.logout();
	}

	/**
	 * Clears the stored password from the AuthManager.
	 * @returns void
	 */
	clearPassword(): void {
		this.auth.clearPassword();
	}
}