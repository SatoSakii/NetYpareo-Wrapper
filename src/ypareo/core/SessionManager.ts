import { CookieJar } from '../../cookies';
import { User } from '../models';
import type { SerializedSession, SessionState } from '../types';

export class SessionManager {
    private state: SessionState = 'disconnected';
    private user: User | null = null;
    private jar: CookieJar;

    /**
     * Create a new SessionManager instance.
     * @param jar The CookieJar instance to manage session cookies.
     */
    constructor(jar: CookieJar) {
        this.jar = jar;
    }

    /**
     * Get the current session state.
     * @return The current session state.
     */
    getState(): SessionState {
        return this.state;
    }

    /**
     * Set the current session state.
     * @param state The new session state.
     */
    setState(state: SessionState): void {
        this.state = state;
    }

    /**
     * Get the current user.
     * @return The current user, or null if not connected.
     */
    getUser(): User | null {
        return this.user;
    }

    /**
     * Set the current user.
     * @param user The user to set.
     */
    setUser(user: User): void {
        this.user = user;
        this.state = 'connected';
    }

    /**
     * Get the current CookieJar instance.
     * @return The current CookieJar.
     */
    getJar(): CookieJar {
        return this.jar;
    }

    /**
     * Reset the session manager to its initial state.
     * This clears the user and cookies, and sets the state to 'disconnected'.
     */
    reset(): void {
        this.state = 'disconnected';
        this.user = null;
        this.jar.clear();
    }

    /**
     * Check if the session is currently connected.
     * @return True if connected, false otherwise.
     */
    isConnected(): boolean {
        return this.state === 'connected' && this.user !== null;
    }

    /**
     * Serialize the current session to a JSON string.
     * @return The serialized session string.
     */
    serialize(): string {
        if (!this.isConnected() || !this.user)
            throw new Error(
                'Cannot serialize session: not connected or user is null.'
            );

        const session: SerializedSession = {
            user: this.user.toJSON(),
            cookies: this.jar.serialize(),
            timestamp: Date.now(),
        };
        return JSON.stringify(session);
    }

    /**
     * Deserialize a session from a JSON string.
     * @param data The serialized session string.
     * @param jar The CookieJar instance to restore cookies into.
     * @return The restored SessionManager instance.
     */
    static deserialize(data: string, jar: CookieJar): SessionManager {
        const session: SerializedSession = JSON.parse(data);

        const restoredJar = CookieJar.deserialize(session.cookies);

        for (const cookie of restoredJar.getAllCookies())
            jar.setCookie(cookie, 'https://placeholder.com');

        const manager = new SessionManager(jar);
        manager.setUser(new User(session.user));

        return manager;
    }

    /**
     * Check if the serialized session data is still valid based on its age.
     * @param data The serialized session string.
     * @param maxAge The maximum age in milliseconds for the session to be considered valid. Default is 24 hours.
     * @return True if the session is valid, false otherwise.
     */
    static isSessionValid(
        data: string,
        maxAge: number = 24 * 60 * 60 * 1000
    ): boolean {
        try {
            const session: SerializedSession = JSON.parse(data);
            const age = Date.now() - session.timestamp;
            return age < maxAge;
        } catch {
            return false;
        }
    }
}
