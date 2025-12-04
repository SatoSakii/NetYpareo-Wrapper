import type { UserData } from "../types";
import { Registration } from "./";

export class User {
	public username: string;
	public fullName?: string;
	public avatarUrl?: string;
	public registrations: Registration[];

	/**
	 * Create a new User instance.
	 * @param data The user data.
	 */
	constructor(data: UserData) {
		this.username = data.username;
		this.fullName = data.fullName;
		this.avatarUrl = data.avatarUrl;
		this.registrations = data.registrations || [];
	}

	/**
	 * Get the first name of the user.
	 * @return The first name, or undefined if fullName is not set.
	 */
	get firstName(): string | undefined {
		return this.fullName?.split(' ')[0];
	}

	/**
	 * Get the last name of the user.
	 * @return The last name, or undefined if fullName is not set or has no last name.
	 */
	get lastName(): string | undefined {
		const parts = this.fullName?.split(' ');
		return parts && parts.length > 1 ? parts.slice(1).join(' ') : undefined;
	}

	/**
	 * Get the default registration of the user.
	 * @return The first registration, or undefined if there are no registrations.
	 */
	get defaultRegistration(): Registration | undefined {
		return this.registrations[0];
	}

	/**
	 * Get a registration by its code.
	 * @param code The registration code.
	 * @return The registration with the given code, or undefined if not found.
	 */
	getRegistration(code: number): Registration | undefined {
		return this.registrations.find(r => r.code === code);
	}

	/**
	 * Convert the user to a string representation.
	 * @return The full name if available, otherwise the username.
	 */
	toString(): string {
		return this.fullName || this.username;
	}

	/**
	 * Serialize the user to a plain object.
	 * @return The serialized user data.
	 */
	toJSON(): UserData {
		return {
			username: this.username,
			fullName: this.fullName,
			avatarUrl: this.avatarUrl,
		};
	}
}