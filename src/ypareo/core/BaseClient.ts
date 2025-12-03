import { HttpClient } from '../../http';
import { CookieJar } from '../../cookies';
import { SessionManager } from './SessionManager';
import type { YpareoClientConfig, YpareoUrls } from '../types';
import { DEFAULTS_URLS } from '../constants/urls';

export class BaseClient {
	protected config: YpareoClientConfig;
	protected http: HttpClient;
	protected sessions: SessionManager;
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
		this.sessions = new SessionManager(jar);
		this.urls = {
			...DEFAULTS_URLS,
		}
	}
}