import { HttpClient } from '../../http';
import { CookieJar } from '../../cookies';
import { SessionManager } from './SessionManager';
import type { YpareoClientConfig, YpareoUrls } from '../types';
import { DEFAULTS_URLS } from '../constants/urls';
import { User } from '../models';

export class BaseClient {
	protected config: YpareoClientConfig;
	protected http: HttpClient;
	protected session: SessionManager;
	protected urls: YpareoUrls;

	/**
	 * Create a new BaseClient instance.
	 * @param config The Ypareo client configuration.
	 */
	constructor (config: YpareoClientConfig) {
		this.config = config;

		const jar = new CookieJar();

		this.http = new HttpClient({
			jar,
			baseUrl: config.baseUrl,
			debug: config.debug || false,
			followRedirects: true,
		});
		this.session = new SessionManager(jar);
		this.urls = {
			login: DEFAULTS_URLS.login,
			auth: DEFAULTS_URLS.auth,
			home: DEFAULTS_URLS.home,
		};
	}

	/**
	 * Check if the client is currently connected.
	 * @return True if connected, false otherwise.
	 */
	isConnected(): boolean {
		return this.session.isConnected();
	}

	/**
	 * Get the current user.
	 * @return The current user, or null if not connected.
	 */
	getUser(): User | null {
		return this.session.getUser();
	}

	/**
	 * Get the current session manager.
	 * @return The session manager.
	 */
	getSession(): SessionManager {
		return this.session;
	}

	/**
	 * Get the current HTTP client.
	 * @return The HTTP client.
	 */
	getHttpClient(): HttpClient {
		return this.http;
	}
}