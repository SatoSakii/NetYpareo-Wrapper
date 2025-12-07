import { CookieOptions, SerializedCookie } from './types'

export class Cookie {
    public key: string
    public value: string
    public domain?: string
    public path: string = '/'
    public expires?: Date
    public maxAge?: number
    public secure: boolean = false
    public httpOnly: boolean = false
    public sameSite?: 'Strict' | 'Lax' | 'None'

    public creation: Date
    public lastAccessed: Date

    /**
     * Creates a new Cookie instance.
     * @param key The cookie name.
     * @param value The cookie value.
     * @param options Additional cookie options.
     */
    constructor(key: string, value: string, options: CookieOptions = {}) {
        this.key = key
        this.value = value
        this.domain = options.domain
        this.path = options.path || '/'
        this.expires = options.expires
        this.maxAge = options.maxAge
        this.secure = options.secure || false
        this.httpOnly = options.httpOnly || false
        this.sameSite = options.sameSite
        this.creation = new Date()
        this.lastAccessed = new Date()
    }

    /**
     * Parses a Set-Cookie header string into a Cookie instance.
     * @param setCookieHeader The Set-Cookie header string.
     * @param requestUrl The URL of the request that received the cookie.
     * @returns A Cookie instance or null if parsing fails.
     */
    static parse(setCookieHeader: string, requestUrl: string): Cookie | null {
        const parts = setCookieHeader.split(';').map((part) => part.trim())
        const [keyValue, ...attributes] = parts

        if (!keyValue || !keyValue.includes('=')) return null

        const equalIndex = keyValue.indexOf('=')
        const key = keyValue.slice(0, equalIndex).trim()
        const value = keyValue.slice(equalIndex + 1).trim()

        const options: CookieOptions = {}
        const url = new URL(requestUrl)

        for (const attr of attributes) {
            const eqIndex = attr.indexOf('=')

            let attrKey: string
            let attrValue: string | undefined

            if (eqIndex === -1) attrKey = attr.toLowerCase()
            else {
                attrKey = attr.slice(0, eqIndex).trim().toLowerCase()
                attrValue = attr.slice(eqIndex + 1).trim()
            }

            switch (attrKey) {
                case 'domain':
                    if (
                        typeof attrValue === 'string' &&
                        attrValue.startsWith('.')
                    )
                        options.domain = attrValue
                    else options.domain = `.${attrValue || url.hostname}`
                    break
                case 'path':
                    options.path = attrValue || '/'
                    break
                case 'expires':
                    options.expires = attrValue
                        ? new Date(attrValue)
                        : undefined
                    break
                case 'max-age':
                    options.maxAge = attrValue
                        ? parseInt(attrValue, 10)
                        : undefined
                    break
                case 'secure':
                    options.secure = true
                    break
                case 'httponly':
                    options.httpOnly = true
                    break
                case 'samesite':
                    if (
                        attrValue &&
                        ['Strict', 'Lax', 'None'].includes(attrValue)
                    )
                        options.sameSite = attrValue as
                            | 'Strict'
                            | 'Lax'
                            | 'None'
                    break
            }
        }
        if (!options.domain) options.domain = `.${url.hostname}`

        return new Cookie(key, value, options)
    }

    /**
     * Checks if the cookie matches a given URL based on domain, path, and secure attributes.
     * @param urlString The URL to check against.
     * @returns True if the cookie matches the URL, false otherwise.
     */
    matches(urlString: string): boolean {
        try {
            const url = new URL(urlString)

            if (this.domain) {
                const cookieDomain = this.domain.startsWith('.')
                    ? this.domain.slice(1)
                    : this.domain
                const matchesDomain =
                    url.hostname === cookieDomain ||
                    url.hostname.endsWith(`.${cookieDomain}`)

                if (!matchesDomain) return false
            }
            if (this.path && !url.pathname.startsWith(this.path)) return false
            if (this.secure && url.protocol !== 'https:') return false
            return true
        } catch {
            return false
        }
    }

    /**
     * Checks if the cookie is expired based on its Max-Age or Expires attributes.
     * @returns True if the cookie is expired, false otherwise.
     */
    isExpired(): boolean {
        if (this.value === 'deleted' || this.maxAge === 0) return true

        if (this.maxAge !== undefined) {
            const ageInSeconds = (Date.now() - this.creation.getTime()) / 1000
            return ageInSeconds > this.maxAge
        }

        if (this.expires) return Date.now() > this.expires.getTime()
        return false
    }

    /**
     * Converts the cookie to a string suitable for HTTP headers.
     * @returns The cookie as a string.
     */
    toString(): string {
        return `${this.key}=${this.value}`
    }

    /**
     * Serializes the cookie to a plain object for storage or transmission.
     * @returns The serialized cookie object.
     */
    serialize(): SerializedCookie {
        return {
            key: this.key,
            value: this.value,
            domain: this.domain,
            path: this.path,
            expires: this.expires?.toISOString(),
            maxAge: this.maxAge,
            secure: this.secure,
            httpOnly: this.httpOnly,
            sameSite: this.sameSite,
            creation: this.creation.toISOString(),
            lastAccessed: this.lastAccessed.toISOString(),
        }
    }

    /**
     * Deserializes a plain object into a Cookie instance.
     * @param data The serialized cookie object.
     * @returns A Cookie instance.
     */
    static deserialize(data: SerializedCookie): Cookie {
        const cookie = new Cookie(data.key, data.value, {
            domain: data.domain,
            path: data.path,
            expires: data.expires ? new Date(data.expires) : undefined,
            maxAge: data.maxAge,
            secure: data.secure,
            httpOnly: data.httpOnly,
            sameSite: data.sameSite,
        })

        cookie.creation = new Date(data.creation)
        cookie.lastAccessed = new Date(data.lastAccessed)

        return cookie
    }
}
