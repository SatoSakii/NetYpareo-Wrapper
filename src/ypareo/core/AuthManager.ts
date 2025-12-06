import type { HttpClient } from '../../http';
import { SessionManager } from '../core/SessionManager';
import type { EventManager } from '../core/EventManager';
import type { YpareoUrls } from '../types';
import { DEFAULTS_HEADERS } from '../constants';

import { User } from '../models';
import { parseUser, extractCsrfToken } from '../parsers';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class AuthManager {
	private http: HttpClient;
	private session: SessionManager;
	private events: EventManager;
	private urls: YpareoUrls;
	private username: string;
	private encryptedPassword: string | null;
	private encryptionKey: Buffer;

	/**
	 * Creates a new AuthManager instance.
	 * @param http - The HttpClient instance for making requests.
	 * @param session - The SessionManager instance for managing session state.
	 * @param events - The EventManager instance for emitting events.
	 * @param urls - The YpareoUrls instance containing endpoint URLs.
	 * @param username - The username for authentication.
	 * @param password - The password for authentication.
	 */
	constructor(
		http: HttpClient,
		session: SessionManager,
		events: EventManager,
		urls: YpareoUrls,
		username: string,
		password: string
	) {
		this.http = http;
		this.session = session;
		this.events = events;
		this.urls = urls;
		this.username = username;

		this.encryptionKey = scryptSync(username, username.split('').reverse().join(''), 32);
		this.encryptedPassword = this.encryptPassword(password);
	}

	/**
	 * Encrypts the provided password using AES-256-CBC.
	 * @param password - The plaintext password to encrypt.
	 * @returns The encrypted password as a hex string.
	 */
	private encryptPassword(password: string): string {
		const iv = randomBytes(16);
		const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);

		let encrypted = cipher.update(password, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		return iv.toString('hex') + ':' + encrypted;
	}

	/**
	 * Decrypts the stored encrypted password.
	 * @returns The decrypted plaintext password.
	 */
	private decryptPassword(): string | null {
		if (!this.encryptedPassword)
			return null;

		try {
			const parts = this.encryptedPassword.split(':');
			const iv = Buffer.from(parts[0], 'hex');
			const encrypted = parts[1];

			const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

			let decrypted = decipher.update(encrypted, 'hex', 'utf8');
			decrypted += decipher.final('utf8');

			return decrypted;
		} catch {
			return null;
		}
	}

	/**
	 * Clears the stored password from memory.
	 * @returns void
	 */
	clearPassword(): void {
		if (this.encryptedPassword) {
			this.encryptedPassword = null;
			this.events.emitDebug('Password cleared from memory');
		}
	}

	/**
	 * Logs in the user with the provided credentials.
	 * @returns A promise that resolves to the logged-in User object.
	 */
	async login(): Promise<User> {
		if (this.session.isConnected()) {
			const user = this.session.getUser()!;
			this.events.emit('ready');
			return user;
		}

		const password = this.decryptPassword();
		if (!password)
			throw new Error('Password has been cleared. Cannot login.');

		this.session.setState('connecting');

		try {
			this.events.emitDebug('Starting login process...');

			const loginRes = await this.http.get(this.urls.login, {
				headers: {
					'Origin': this.http.getBaseUrl(),
					'Content-Type': 'text/html; charset=UTF-8',
					...DEFAULTS_HEADERS
				},
			});

			if (loginRes.status !== 200)
				throw new Error(`Failed to load login page. Status: ${loginRes.status}`);

			const csrfToken = extractCsrfToken(loginRes.data);

			if (csrfToken)
				this.events.emitDebug(`CSRF token extracted: ${csrfToken.slice(0, 8)}...`);

			const formData = new URLSearchParams();
			formData.append('login', this.username);
			formData.append('password', password);
			formData.append('btnSeConnecter', 'Se connecter');
			formData.append('screenWidth', '1920');
			formData.append('screenHeight', '1080');

			if (csrfToken)
				formData.append('token_csrf', csrfToken);

			this.events.emitDebug('Submitting authentication...');

			const authRes = await this.http.post(this.urls.auth, formData, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Referer': this.http.getBaseUrl() + this.urls.login,
					'Origin': this.http.getBaseUrl(),
					...DEFAULTS_HEADERS
				},
			});

			if (authRes.status !== 200)
				throw new Error(`Authentication failed. Status: ${authRes.status}`);

			const { loginError, errorMessage } = this.isLoginError(authRes);
			if (loginError)
				throw new Error('Authentication failed: ' + errorMessage);

			const userData = parseUser(authRes.data, this.username);
			const user = new User(userData);

			this.session.setUser(user);
			this.session.setState('connected');

			this.events.emitDebug(`Successfully logged in as: ${user.toString()}`);

			this.clearPassword();

			this.events.emit('login', user);
			this.events.emit('ready');

			return user;

		} catch (error: any) {
			this.session.setState('error');

			const errorObj = error instanceof Error ? error : new Error(String(error));
			this.events.emit('error', errorObj);

			throw new Error(`Login failed: ${error.message}`);
		}
	}

	/**
	 * Restores a session from serialized session data.
	 * @param sessionData - The serialized session data.
	 * @param autoRelogin - Whether to automatically re-login if the session is invalid.
	 * @returns A promise that resolves to the restored User object.
	 */
	async restoreSession(sessionData: string, autoRelogin: boolean = true): Promise<User> {
		try {
			if (!SessionManager.isSessionValid(sessionData)) {
				this.events.emitDebug('Session expired (too old)');

				if (autoRelogin) {
					this.events.emitDebug('Auto re-login enabled, attempting login...');
					return await this.login();
				}

				throw new Error('Session expired');
			}

			this.events.emitDebug('Restoring session...');

			const restoredSession = SessionManager.deserialize(sessionData, this.http.getJar());

			const user = restoredSession.getUser();
			if (user)
				this.session.setUser(user);

			this.events.emitDebug('Verifying session with server...');
			const homeRes = await this.http.get(this.urls.home, {
				headers: {
					'Origin': this.http.getBaseUrl(),
					'Referer': this.http.getBaseUrl() + this.urls.home,
					'Content-Type': 'text/html; charset=UTF-8',
					...DEFAULTS_HEADERS
				},
			});

			const { loginError, errorMessage } = this.isLoginError(homeRes);
			if (homeRes.status !== 200 || loginError) {
				this.events.emitDebug('Session invalid on server (cookie expired)');

				if (autoRelogin) {
					this.events.emitDebug('Auto re-login enabled, attempting login...');
					this.session.reset();
					return await this.login();
				}

				throw new Error('Session invalid on server: ' + errorMessage);
			}

			const restoredUser = this.session.getUser()!;

			this.events.emitDebug(`Session restored for: ${restoredUser.toString()}`);

			this.events.emit('sessionRestored', restoredUser);
			// this.events.emit('ready');

			return restoredUser;

		} catch (error: any) {
			if (error.message.includes('Login failed')) {
				this.session.reset();
				throw error;
			}

			if (autoRelogin && this.encryptedPassword) {
				this.events.emitDebug('Session restore failed, attempting auto re-login...');
				try {
					this.session.reset();
					return await this.login();
				} catch (loginError: any) {
					const errorObj = loginError instanceof Error ? loginError : new Error(String(loginError));
					this.events.emit('error', errorObj);
					throw new Error(`Session restore and auto re-login failed: ${loginError.message}`);
				}
			}

			this.session.reset();

			const errorObj = error instanceof Error ? error : new Error(String(error));
			this.events.emit('error', errorObj);

			throw new Error(`Session restore failed: ${error.message}`);
		}
	}

	/**
	 * Logs out the current user and resets the session.
	 * @returns A promise that resolves when the logout process is complete.
	 */
	async logout(): Promise<void> {
		if (!this.session.isConnected())
			return;

		this.events.emitDebug('Logging out...');
		this.session.reset();
	}

	/**
	 * Determines if the provided HTML indicates a login error.
	 * @param response - The HTTP response data to check.
	 * @returns True if a login error is detected, false otherwise.
	 */
	private isLoginError(response: any): { loginError: boolean; errorMessage: string | null } {
		let errorMessage = 'Unknown error.';
		const error = response?.config?.url?.toString().slice(-2).replace(/\//g, '') || '';

		if (!response?.config?.url?.toString().includes("login"))
			return { loginError: false, errorMessage: null };
		if (error === '2')
			errorMessage = 'Invalid credentials.';
		else if (error === '4')
			errorMessage = 'Account disabled.';
		return { loginError: true, errorMessage: errorMessage };
	}

	/**
	 * Checks if there is an active session.
	 * @returns True if connected, false otherwise.
	 */
	isConnected(): boolean {
		return this.session.isConnected();
	}

	/**
	 * Gets the currently logged-in user.
	 * @returns The User object if logged in, null otherwise.
	 */
	getUser(): User | null {
		return this.session.getUser();
	}

	/**
	 * Checks if a password is stored.
	 * @returns True if a password is stored, false otherwise.
	 */
	hasPassword(): boolean {
		return this.encryptedPassword !== null;
	}
}