import { User } from './models';

export interface YpareoClientConfig {
	baseUrl: string;
	username: string;
	password: string;
	debug?: boolean;
};

export interface YpareoUrls {
	login: string;
	auth: string;
	home: string;
	planning: {
		planning: string;
		pdf: string;
		icalendar: string;
	};
};

export type SessionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UserData {
	username: string;
	fullName?: string;
	avatarUrl?: string;
};

export interface SerializedSession {
	user: UserData;
	cookies: string;
	timestamp: number;
};

export interface YpareoClientEvents {
	ready: [];
	logout: [];
	sessionRestored: [user: User];
	login: [user: User];
	debug: [message: string];
	error: [error: Error];
}