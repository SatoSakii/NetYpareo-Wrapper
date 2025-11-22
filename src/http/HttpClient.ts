import { CookieJar } from '../cookies';
import {
	HttpClientOptions,
	HttpResponse,
	RequestOptions,
	HttpMethod,
	RequestBody,
	RequestConfig,
	HttpError,
	RetryOptions,
} from './types';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

export class HttpClient {
	private jar: CookieJar;
	private baseUrl: string;
	private userAgent: string;
	private followRedirects: boolean;
	private maxRedirects: number;
	private timeout: number;
	private defaultHeaders: Record<string, string>;
	private retry: RetryOptions;
	private validateStatus: (status: number) => boolean;
	private throwOnHttpError: boolean;
	private debug: boolean;

	/**
	 * Build retry options by merging user options with defaults.
	 * @param options User-provided retry options.
	 * @returns Merged retry options.
	 */
	constructor(options: HttpClientOptions = {}) {
		this.jar = options.jar || new CookieJar();
		this.baseUrl = options.baseUrl?.replace(/\/+$/, '') || '';
		this.userAgent = options.userAgent || DEFAULT_USER_AGENT;
		this.followRedirects = options.followRedirects !== false;
		this.maxRedirects = options.maxRedirects || 10;
		this.timeout = options.timeout || 30000;
		this.defaultHeaders = options.headers || {};
		this.retry = this.buildRetryOptions(options.retry);
		this.validateStatus = options.validateStatus || ((status) => status >= 200 && status < 300);
		this.throwOnHttpError = options.throwOnHttpError !== false;
		this.debug = options.debug || false;
	}

	/**
	 * Make a GET request.
	 * @param path Request path.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async get<T = string>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('GET', path, null, options);
	}

	/**
	 * Make a POST request.
	 * @param path Request path.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async post<T = string>(path: string, body?: RequestBody, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('POST', path, body, options);
	}

	/**
	 * Make a PUT request.
	 * @param path Request path.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async put<T = string>(path: string, body?: RequestBody, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('PUT', path, body, options);
	}

	/**
	 * Make a DELETE request.
	 * @param path Request path.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async delete<T = string>(path: string, body?: RequestBody, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('DELETE', path, body, options);
	}

	/**
	 * Make a PATCH request.
	 * @param path Request path.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async patch<T = string>(path: string, body?: RequestBody, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('PATCH', path, body, options);
	}

	/**
	 * Make a HEAD request.
	 * @param path Request path.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async head<T = string>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('HEAD', path, null, options);
	}

	/**
	 * Make an OPTIONS request.
	 * @param path Request path.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async options<T = string>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
		return this.request<T>('OPTIONS', path, null, options);
	}

	/**
	 * Make a request with retry logic.
	 * @param method HTTP method.
	 * @param path Request path.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns HTTP response.
	 */
	async request<T = string>(
		method: HttpMethod,
		path: string,
		body?: RequestBody,
		options: RequestOptions = {},
	): Promise<HttpResponse<T>> {
		const url = this.buildUrl(path);
		const retryOptions: RetryOptions = this.mergeRetryOptions(options.retry);

		const executeWithRetry = async(attempt: number = 0): Promise<HttpResponse<T>> => {
			try{
				return await this.executeRequest<T>(method, url, body, options);
			} catch (error: any) {
				const canRetry = retryOptions.enabled && attempt < retryOptions.maxRetries;
				const shouldRetry = retryOptions.shouldRetry ? retryOptions.shouldRetry(error, attempt) : this.shouldRetryError(error, retryOptions);

				if (canRetry && shouldRetry) {
					const delay = retryOptions.retryDelay(attempt);

					if (this.debug)
						console.log(`[HttpClient] Retry attempt ${attempt + 1} after ${delay}ms due to error:`, error);

					await this.sleep(delay);
					return executeWithRetry(attempt + 1);
				}
				throw error;
			}
		};

		return executeWithRetry();
	}

	/**
	 * Execute the HTTP request.
	 * @param method HTTP method.
	 * @param url Request URL.
	 * @param body Request body.
	 * @param options Request options.
	 * @param redirectCount Current redirect count.
	 * @returns HTTP response.
	 */
	private async executeRequest<T>(
		method: HttpMethod,
		url: string,
		body: RequestBody | undefined,
		options: RequestOptions,
		redirectCount: number = 0,
	): Promise<HttpResponse<T>> {
		const shouldFollow = options.followRedirects ?? this.followRedirects;

		if (shouldFollow && redirectCount > this.maxRedirects)
			throw new Error(`Max redirects exceeded: ${this.maxRedirects}`);

		const config = this.buildRequestConfig(method, url, body, options);
		const headers = this.buildHeaders(url, method, body, options.headers);
		const { fetchBody, finalHeaders } = this.prepareBody(body, headers);

		if (this.debug) {
			console.log(`[HttpClient] ${method} ${url}`);
			console.log('[HttpClient] Request Headers:', finalHeaders);
			if (fetchBody && typeof fetchBody === 'string')
				console.log('[HttpClient] Request Body:', fetchBody.slice(0, 500));
		}

		const coontroller = new AbortController();
		const timeoutId = setTimeout(() => coontroller.abort(), config.timeout);

		try {
			const response = await fetch(url, {
				method,
				headers: finalHeaders,
				body: fetchBody as any,
				redirect: 'manual',
				signal: coontroller.signal,
			});

			clearTimeout(timeoutId);
			this.extractCookies(response, url);

			if (this.debug) {
				console.log(`[HttpClient] ${response.status} ${response.statusText}`);
				const setCookie = response.headers.get('set-cookie');
				if (setCookie)
					console.log('[HttpClient] Set-Cookie Headers:', setCookie);
			}
			if (shouldFollow && this.isRedirect(response.status)) {
				const location = response.headers.get('location');

				if (!location)
					throw new HttpError('Redirect location header missing', response.status, response.statusText);

				const redirectUrl = this.resolveUrl(url, location);

				if (this.debug)
					console.log(`[HttpClient] Redirect ${response.status} -> ${redirectUrl}`);

				let redirectMethod: HttpMethod = method;
				let redirectBody: RequestBody | undefined = body;

				if ([301, 302, 303].includes(response.status)) {
					redirectMethod = 'GET';
					redirectBody = null;
				}

				return this.executeRequest<T>(redirectMethod, redirectUrl, redirectBody, options, redirectCount + 1);
			}

			const responseType = options.responseType || 'text';
			const responseData = await this.parseResponse<T>(response, responseType);

			const httpResponse: HttpResponse<T> = {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
				data: responseData,
				url: response.url || url,
				redirected: redirectCount > 0,
				config
			};

			const validateFn = options.validateStatus || this.validateStatus;

			if (!validateFn(response.status) && config.throwOnHttpError) {
				throw new HttpError(
					'Request failed with status code ' + response.status,
					response.status,
					response.statusText,
					httpResponse,
					config
				);
			}

			return httpResponse;
		} catch (error: any) {
			clearTimeout(timeoutId);

			if (error.name === 'AbortError')
				throw new HttpError(`Request timed out after ${config.timeout}ms`, undefined, undefined, undefined, config);
			if (error instanceof HttpError)
				throw error;
			throw new HttpError(`Network error: ${error.message}`, undefined, undefined, undefined, config);
		}
	}

	/**
	 * Build the full URL for a request.
	 * @param path Request path.
	 * @returns Full URL.
	 */
	private buildUrl(path: string): string {
		if (/^https?:\/\//i.test(path))
			return path;
		if (!this.baseUrl)
			return path;
		return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
	}

	/**
	 * Build the request configuration.
	 * @param method HTTP method.
	 * @param url Request URL.
	 * @param body Request body.
	 * @param options Request options.
	 * @returns Request configuration.
	 */
	private buildRequestConfig(
		method: HttpMethod,
		url: string,
		body: RequestBody | undefined,
		options: RequestOptions,
	): RequestConfig {
		return {
			method,
			url,
			headers: {},
			body: body || undefined,
			timeout: options.timeout || this.timeout,
			followRedirects: options.followRedirects ?? this.followRedirects,
			retry: this.mergeRetryOptions(options.retry),
			validateStatus: options.validateStatus || this.validateStatus,
			responseType: options.responseType || 'text',
			throwOnHttpError: this.throwOnHttpError,
			debug: this.debug,
		};
	}

	/**
	 * Build the request headers.
	 * @param url Request URL.
	 * @param method HTTP method.
	 * @param body Request body.
	 * @param customHeaders Custom headers.
	 * @returns Request headers.
	 */
	private buildHeaders(
		url: string,
		method: HttpMethod,
		body: RequestBody | undefined,
		customHeaders?: Record<string, string>,
	): Record<string, string> {
		const headers: Record<string, string> = {
			'User-Agent': this.userAgent,
			'Accept': '*/*',
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept-Encoding': 'gzip, deflate, br',
			'Cache-Control': 'no-cache',
			'Pragma': 'no-cache',
			'Connection': 'keep-alive',
			...this.defaultHeaders,
			...customHeaders,
		};

		const cookieHeader = this.jar.getCookieString(url);
		if (cookieHeader)
			headers['Cookie'] = cookieHeader;

		if (this.baseUrl && !headers['Referer'])
			headers['Referer'] = this.baseUrl;

		return headers;
	}

	/**
	 * Prepare the request body and headers.
	 * @param body Request body.
	 * @param headers Request headers.
	 * @returns Prepared body and headers.
	 */
	private prepareBody(
		body: RequestBody | undefined,
		headers: Record<string, string>,
	): { fetchBody: string | FormData | Blob | ArrayBuffer | ReadableStream | undefined; finalHeaders: Record<string, string> } {
		if (!body || body === null)
			return { fetchBody: undefined, finalHeaders: headers };

		const finalHeaders = { ...headers };

		if (body instanceof FormData) {
			delete finalHeaders['Content-Type'];
			return { fetchBody: body, finalHeaders };
		}
		if (body instanceof Blob) {
			if (!finalHeaders['Content-Type'])
				finalHeaders['Content-Type'] = body.type || 'application/octet-stream';
			return { fetchBody: body, finalHeaders };
		}
		if (body instanceof ArrayBuffer || body instanceof ReadableStream) {
			if (!finalHeaders['Content-Type'])
				finalHeaders['Content-Type'] = 'application/octet-stream';
			return { fetchBody: body, finalHeaders };
		}
		if (body instanceof URLSearchParams) {
			if (!finalHeaders['Content-Type'])
				finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
			return { fetchBody: body.toString(), finalHeaders };
		}
		if (typeof body === 'string') {
			if (!finalHeaders['Content-Type'])
				finalHeaders['Content-Type'] = 'text/plain;charset=UTF-8';
			return { fetchBody: body, finalHeaders };
		}
		if (typeof body === 'object') {
			if (!finalHeaders['Content-Type'])
				finalHeaders['Content-Type'] = 'application/json;charset=UTF-8';
			return { fetchBody: JSON.stringify(body), finalHeaders };
		}
		return { fetchBody: undefined, finalHeaders };
	}

	/**
	 * Parse the response based on the expected type.
	 * @param response HTTP response.
	 * @param type Expected response type.
	 * @returns Parsed response.
	 */
	private async parseResponse<T>(response: Response, type: string): Promise<T> {
		if (response.status === 204 || response.headers.get('Content-Length') === '0')
			return null as T;

		switch (type) {
			case 'json':
				try {
					return await response.json() as T;
				} catch {
					return null as T;
				}
			case 'blob':
				return await response.blob() as T;
			case 'arrayBuffer':
				return await response.arrayBuffer() as T;
			case 'stream':
				return response.body as T;
			case 'text':
			default:
				return await response.text() as T;
		}
	}

	/**
	 * Extract cookies from the response and store them in the cookie jar.
	 * @param response HTTP response.
	 * @param requestUrl Request URL.
	 */
	private extractCookies(response: Response, requestUrl: string): void {
		const setCookieHeaders = response.headers.get('set-cookie');

		if (!setCookieHeaders)
			return;
		const cookies = setCookieHeaders.split(/,(?=\s*\w+=)/);

		const validCookies: string[] = cookies.filter(cookieStr => {
			const trimmed = cookieStr.trim().toLowerCase();
			return !trimmed.includes('=deleted;') && !trimmed.includes('=deleted ');
		});

		for (const cookieString of validCookies) {
			const trimmed = cookieString.trim();
			if (trimmed)
				this.jar.setCookie(trimmed, requestUrl);
		}
	}

	/**
	 * Determine if a status code is a redirect.
	 * @param status HTTP status code.
	 * @returns Whether the status code is a redirect.
	 */
	private isRedirect(status: number): boolean {
		return [301, 302, 303, 307, 308].includes(status);
	}

	/**
	 * Resolve a relative URL against a base URL.
	 * @param base Base URL.
	 * @param relative Relative URL.
	 * @returns Resolved URL.
	 */
	private resolveUrl(base: string, relative: string): string {
		try {
			return new URL(relative, base).toString();
		} catch {
			return relative;
		}
	}

	/**
	 * Build retry options by merging user options with defaults.
	 * @param options User-provided retry options.
	 * @returns Merged retry options.
	 */
	private buildRetryOptions(options?: Partial<RetryOptions>): RetryOptions {
		return {
			enabled: options?.enabled || false,
			maxRetries: options?.maxRetries ?? 3,
			retryDelay: options?.retryDelay || ((attempt) => Math.pow(2, attempt) * 1000),
			retryOn: options?.retryOn || [408, 429, 500, 502, 503, 504],
			shouldRetry: options?.shouldRetry,
		};
	}

	/**
	 * Merge user-provided retry options with default retry options.
	 * @param options User-provided retry options.
	 * @returns Merged retry options.
	 */
	private mergeRetryOptions(options?: Partial<RetryOptions>): RetryOptions {
		if (!options)
			return this.retry;
		return {
			enabled: options.enabled ?? this.retry.enabled,
			maxRetries: options.maxRetries ?? this.retry.maxRetries,
			retryDelay: options.retryDelay ?? this.retry.retryDelay,
			retryOn: options.retryOn ?? this.retry.retryOn,
			shouldRetry: options.shouldRetry ?? this.retry.shouldRetry,
		};
	}

	/**
	 * Determine if an error should trigger a retry based on status codes.
	 * @param error The error thrown during the request.
	 * @param retryOptions The retry options to consider.
	 * @returns Whether to retry the request.
	 */
	private shouldRetryError(error: any, retryOptions: RetryOptions): boolean {
		if (error instanceof HttpError && error.status)
			return retryOptions.retryOn.includes(error.status);
		return error.message?.includes('timeout') || error.message?.includes('network') || error.message?.includes('fetch');
	}

	/**
	 * Sleep for a specified duration.
	 * @param ms Duration in milliseconds.
	 * @returns Promise that resolves after the duration.
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Get the cookie jar.
	 * @returns The cookie jar.
	 */
	getJar(): CookieJar {
		return this.jar;
	}

	/**
	 * Set the cookie jar.
	 * @param jar The cookie jar to set.
	 */
	setJar(jar: CookieJar): void {
		this.jar = jar;
	}

	/**
	 * Get the base URL.
	 * @returns The base URL.
	 */
	getBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * Set the base URL.
	 * @param baseUrl The base URL to set.
	 */
	setBaseUrl(baseUrl: string): void {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	/**
	 * Set a default header.
	 * @param key Header name.
	 * @param value Header value.
	 */
	setDefaultHeader(key: string, value: string): void {
		this.defaultHeaders[key] = value;
	}

	/**
	 * Remove a default header.
	 * @param key Header name.
	 */
	removeDefaultHeader(key: string): void {
		delete this.defaultHeaders[key];
	}

	/**
	 * Get all default headers.
	 * @returns Default headers.
	 */
	getDefaultHeaders(): Record<string, string> {
		return { ...this.defaultHeaders };
	}

	/**
	 * Set the request timeout.
	 * @param timeout Timeout in milliseconds.
	 */
	setTimeout(timeout: number): void {
		this.timeout = timeout;
	}

	/**
	 * Get the request timeout.
	 * @returns Timeout in milliseconds.
	 */
	getTimeout(): number {
		return this.timeout;
	}

	/**
	 * Enable or disable debug mode.
	 * @param debug Whether to enable debug mode.
	 */
	setDebug(debug: boolean): void {
		this.debug = debug;
	}
}