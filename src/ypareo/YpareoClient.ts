import { BaseClient } from './core/BaseClient';
import { EventManager } from './core/EventManager';
import { AuthManager } from './core/AuthManager';
import type { YpareoClientConfig, YpareoClientEvents } from './types';
import type { User } from './models';
import { PlanningManager } from './managers/Planning';

export class YpareoClient extends BaseClient {
	private events: EventManager;
	private auth: AuthManager;
	public user: User | null = null;
	public readonly planning: PlanningManager;
	public readonly session: {
		/**
		 * Save the current session state to a string.
		 * @returns The serialized session data.
		 */
		save(): string;
		/**
		 * Restore a session from serialized data.
		 * @param sessionData The serialized session data.
		 * @param autoRelogin Whether to automatically relogin if the session is expired. Default is true.
		 * @returns A promise that resolves to the restored User.
		 */
		restore(sessionData: string, autoRelogin?: boolean): Promise<User>;
	}

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
			this.sessions,
			this.events,
			this.urls,
			config.username,
			config.password
		);

		this.planning = new PlanningManager(this.http);

		this.session = {
			save: (): string => {
				if (!this.auth.isConnected())
					throw new Error('No active session to save');
				return this.sessions.serialize();
			},
			restore: (sessionData: string, autoRelogin = true): Promise<User> => {
				return this.auth.restoreSession(sessionData, autoRelogin);
			}
		}

		this.on('login', (user) => {
			this.user = user;
		});

		this.on('sessionRestored', (user) => {
			this.user = user;
		});

		this.on('logout', () => {
			this.user = null;
		});
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
	 */
	login(): void {
		this.auth.login().catch(() => { });
	}

	/**
	 * Logs out the current user and resets the session.
	 */
	logout(): void {
		this.auth.logout().catch(() => { });
		this.sessions.reset();
		this.events.emit('logout');
	}

	/**
	 * Clears the stored password from the AuthManager.
	 * @returns void
	 */
	protected clearPassword(): void {
		this.auth.clearPassword();
	}

	public get httpClient() {
		return this.http;
	}
}