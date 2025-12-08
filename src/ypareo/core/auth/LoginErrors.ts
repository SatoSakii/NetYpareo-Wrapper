import type { HttpResponse } from '../../../http';

export const LoginErrorCode = {
    INVALID_CREDENTIALS: '2',
    ACCOUNT_LOCKED: '4',
} as const;

export type LoginErrorCode =
    (typeof LoginErrorCode)[keyof typeof LoginErrorCode];

export const LoginErrorMessages: Record<LoginErrorCode, string> = {
    [LoginErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials.',
    [LoginErrorCode.ACCOUNT_LOCKED]: 'Account disabled.',
};

export interface LoginErrorResult {
    loginError: boolean;
    errorMessage: string | null;
}

/**
 * Determines if the provided response indicates a login error.
 * @param response - The HTTP response to check.
 * @returns Login error result.
 */
export function parseLoginError(response: HttpResponse): LoginErrorResult {
    const url = response.config.url.toString();

    if (!url.includes('login')) {
        return { loginError: false, errorMessage: null };
    }

    const errorCode = url.slice(-2).replace(/\//g, '') as LoginErrorCode;
    const errorMessage = LoginErrorMessages[errorCode] ?? 'Unknown error.';

    return { loginError: true, errorMessage };
}
