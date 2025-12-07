import { CookieJar } from '../cookies'

export type HttpMethod =
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'HEAD'
    | 'OPTIONS'

export type RequestBody =
    | string
    | URLSearchParams
    | FormData
    | Blob
    | ArrayBuffer
    | ReadableStream<Uint8Array>
    | Record<string, any>
    | null

export interface HttpClientOptions {
    jar?: CookieJar
    baseUrl?: string
    userAgent?: string
    followRedirects?: boolean
    maxRedirects?: number
    timeout?: number
    headers?: Record<string, string>
    retry?: Partial<RetryOptions>
    validateStatus?: (status: number) => boolean
    throwOnHttpError?: boolean
}

export interface RetryOptions {
    enabled: boolean
    maxRetries: number
    retryDelay: (attempt: number) => number
    retryOn: number[]
    shouldRetry?: (error: unknown, attempt: number) => boolean
}

export interface RequestOptions {
    headers?: Record<string, string>
    timeout?: number
    followRedirects?: boolean
    retry?: Partial<RetryOptions>
    validateStatus?: (status: number) => boolean
    responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
}

export interface HttpResponse<T = any> {
    status: number
    statusText: string
    headers: Headers
    data: T
    url: string
    redirected: boolean
    config: RequestConfig
}

export interface RequestConfig {
    method: HttpMethod
    url: string
    headers: Record<string, string>
    body?: RequestBody
    timeout: number
    followRedirects: boolean
    retry: RetryOptions
    validateStatus: (status: number) => boolean
    responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
    throwOnHttpError: boolean
}

export class HttpError extends Error {
    public readonly name = 'HttpError'
    public readonly isHttpError = true

    /**
     * Creates an instance of HttpError.
     * @param message The error message.
     * @param status The HTTP status code.
     * @param statusText The HTTP status text.
     * @param response The HttpResponse object.
     * @param config The RequestConfig object.
     */
    constructor(
        message: string,
        public readonly status?: number,
        public readonly statusText?: string,
        public readonly response?: HttpResponse,
        public readonly config?: RequestConfig
    ) {
        super(message)
        Object.setPrototypeOf(this, HttpError.prototype)
    }

    /**
     * Checks if the error is a client error (4xx).
     * @returns True if the error is a client error, false otherwise.
     */
    isClientError(): boolean {
        return (
            this.status !== undefined && this.status >= 400 && this.status < 500
        )
    }

    /**
     * Checks if the error is a server error (5xx).
     * @returns True if the error is a server error, false otherwise.
     */
    isServerError(): boolean {
        return this.status !== undefined && this.status >= 500
    }

    /**
     * Returns a string representation of the HttpError.
     * @returns A string describing the HttpError.
     */
    toString(): string {
        if (this.status)
            return `HttpError: ${this.message} (${this.status} ${this.statusText || ''})`
        return `HttpError: ${this.message}`
    }
}

/**
 * Type guard to check if an error is an instance of HttpError.
 * @param error The error to check.
 * @returns True if the error is an HttpError, false otherwise.
 */
export function isHttpError(error: HttpError): error is HttpError {
    return error && error.isHttpError === true
}
