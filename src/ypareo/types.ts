import type { Registration } from './models'
import { User } from './models'

export interface YpareoClientConfig {
    baseUrl: string
    username: string
    password: string
}

export interface YpareoUrls {
    login: string
    auth: string
    home: string
    planning: {
        default: string
        pdf: string
    }
    attendance: string
    grades: {
        default: string
        api: string
    }
}

export type SessionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UserData {
    username: string
    fullName?: string
    avatarUrl?: string
    registrations?: Registration[]
}

export interface SerializedSession {
    user: UserData
    cookies: string
    timestamp: number
}

export interface YpareoClientEvents {
    ready: []
    logout: []
    sessionRestored: [user: User]
    login: [user: User]
    error: [error: Error]
}
