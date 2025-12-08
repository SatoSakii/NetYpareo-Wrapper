import { CookieJar } from '../../cookies';
import { HttpClient } from '../../http';
import { DEFAULTS_URLS } from '../constants/urls';
import type { YpareoClientConfig, YpareoUrls } from '../types';
import { SessionManager } from './SessionManager';

export class BaseClient {
    protected config: YpareoClientConfig;
    protected http: HttpClient;
    protected sessions: SessionManager;
    protected urls: YpareoUrls;

    /**
     * Create a new BaseClient instance.
     * @param config The Ypareo client configuration.
     */
    constructor(config: YpareoClientConfig) {
        this.config = config;

        const jar = new CookieJar();

        this.http = new HttpClient({
            jar,
            baseUrl: config.baseUrl,
            followRedirects: true,
        });
        this.sessions = new SessionManager(jar);
        this.urls = {
            ...DEFAULTS_URLS,
        };
    }
}
