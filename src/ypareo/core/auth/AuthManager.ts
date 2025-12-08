import { PasswordManager } from './PasswordManager'
import { HttpStatusCode, type HttpClient } from '../../../http'
import type { EventManager } from '../EventManager'
import { SessionManager } from '../SessionManager'
import { User } from '../../models'
import { extractCsrfToken, parseUser } from '../../parsers'
import type { YpareoUrls } from '../../types'
import { parseLoginError } from './LoginErrors'

export class AuthManager {
    private http: HttpClient
    private session: SessionManager
    private events: EventManager
    private urls: YpareoUrls
    private username: string
	private passwordManager: PasswordManager

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
        this.http = http
        this.session = session
        this.events = events
        this.urls = urls
        this.username = username

		this.passwordManager = new PasswordManager(username, password);
    }

    /**
     * Clears the stored password from memory.
     */
    clearPassword(): void {
        this.passwordManager.clear()
    }

    /**
     * Logs in the user with the provided credentials.
     * @returns A promise that resolves to the logged-in User object.
     */
    async login(): Promise<User> {
        if (this.session.isConnected()) {
            const user = this.session.getUser()!
            this.events.emit('ready')
            return user
        }

        const password = this.passwordManager.decrypt()
        if (!password)
            throw new Error('Password has been cleared. Cannot login.')

        this.session.setState('connecting')

        try {
            const loginRes = await this.http.get(this.urls.login, {
                headers: {
                    Origin: this.http.getBaseUrl(),
                    'Content-Type': 'text/html; charset=UTF-8',
                },
            })

            if (loginRes.status !== HttpStatusCode.OK)
                throw new Error(
                    `Failed to load login page. Status: ${loginRes.status}`
                )

            const csrfToken = extractCsrfToken(loginRes.data)

            const formData = new URLSearchParams()
            formData.append('login', this.username)
            formData.append('password', password)
            formData.append('btnSeConnecter', 'Se connecter')
            formData.append('screenWidth', '1920')
            formData.append('screenHeight', '1080')

            if (csrfToken) formData.append('token_csrf', csrfToken)

            const authRes = await this.http.post(this.urls.auth, formData, {
                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded; charset=UTF-8',
                    Referer: this.http.getBaseUrl() + this.urls.login,
                    Origin: this.http.getBaseUrl(),
                },
            })

            if (authRes.status !== HttpStatusCode.OK)
                throw new Error(
                    `Authentication failed. Status: ${authRes.status}`
                )

            const { loginError, errorMessage } = parseLoginError(authRes)
            if (loginError)
                throw new Error('Authentication failed: ' + errorMessage)

            const userData = parseUser(authRes.data, this.username)
            const user = new User(userData)

            this.session.setUser(user)
            this.session.setState('connected')

            this.clearPassword()

            this.events.emit('login', user)
            this.events.emit('ready')

            return user
        } catch (error: any) {
            this.session.setState('error')

            const errorObj =
                error instanceof Error ? error : new Error(String(error))
            this.events.emit('error', errorObj)

            throw new Error(`Login failed: ${error.message}`)
        }
    }

    /**
     * Restores a session from serialized session data.
     * @param sessionData - The serialized session data.
     * @param autoRelogin - Whether to automatically re-login if the session is invalid.
     * @returns A promise that resolves to the restored User object.
     */
    async restoreSession(
        sessionData: string,
        autoRelogin: boolean = true
    ): Promise<User> {
        try {
            if (!SessionManager.isSessionValid(sessionData)) {
                if (autoRelogin) return await this.login()

                throw new Error('Session expired')
            }

            const restoredSession = SessionManager.deserialize(
                sessionData,
                this.http.getJar()
            )

            const user = restoredSession.getUser()
            if (user) this.session.setUser(user)

            const homeRes = await this.http.get(this.urls.home, {
                headers: {
                    Origin: this.http.getBaseUrl(),
                    Referer: this.http.getBaseUrl() + this.urls.home,
                    'Content-Type': 'text/html; charset=UTF-8',
                },
            })

            const { loginError, errorMessage } = parseLoginError(homeRes)
            if (homeRes.status !== HttpStatusCode.OK || loginError) {
                if (autoRelogin) {
                    this.session.reset()
                    return await this.login()
                }

                throw new Error('Session invalid on server: ' + errorMessage)
            }

            const restoredUser = this.session.getUser()!

            this.events.emit('sessionRestored', restoredUser)
            // this.events.emit('ready');

            return restoredUser
        } catch (error: any) {
            if (error.message.includes('Login failed')) {
                this.session.reset()
                throw error
            }

            if (autoRelogin && this.passwordManager.hasPassword()) {
                try {
                    this.session.reset()
                    return await this.login()
                } catch (loginError: any) {
                    const errorObj =
                        loginError instanceof Error
                            ? loginError
                            : new Error(String(loginError))
                    this.events.emit('error', errorObj)
                    throw new Error(
                        `Session restore and auto re-login failed: ${loginError.message}`
                    )
                }
            }

            this.session.reset()

            const errorObj =
                error instanceof Error ? error : new Error(String(error))
            this.events.emit('error', errorObj)

            throw new Error(`Session restore failed: ${error.message}`)
        }
    }

    /**
     * Logs out the current user and resets the session.
     * @returns A promise that resolves when the logout process is complete.
     */
    async logout(): Promise<void> {
        if (!this.session.isConnected()) return

        this.session.reset()
    }

    /**
     * Checks if there is an active session.
     * @returns True if connected, false otherwise.
     */
    isConnected(): boolean {
        return this.session.isConnected()
    }

    /**
     * Gets the currently logged-in user.
     * @returns The User object if logged in, null otherwise.
     */
    getUser(): User | null {
        return this.session.getUser()
    }
}
