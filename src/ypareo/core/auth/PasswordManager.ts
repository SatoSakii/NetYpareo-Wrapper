import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from 'crypto';

export class PasswordManager {
    private encryptedPassword: string | null = null;
    private encryptionKey: Buffer;

    /**
     * Creates a new PasswordManager instance.
     * @param username - The username used to derive the encryption key.
     * @param password - The plaintext password to encrypt.
     */
    constructor(username: string, password: string) {
        this.encryptionKey = scryptSync(
            username,
            username.split('').reverse().join(''),
            32
        );
        this.encryptedPassword = this.encrypt(password);
    }

    /**
     * Encrypts a password using AES-256-CBC.
     * @param password - The plaintext password to encrypt.
     * @returns The encrypted password as a hex string.
     */
    private encrypt(password: string): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);

        let encrypted = cipher.update(password, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypts the stored encrypted password.
     * @returns The decrypted plaintext password, or null if unavailable.
     */
    decrypt(): string | null {
        if (!this.encryptedPassword) return null;

        try {
            const [ivHex, encrypted] = this.encryptedPassword.split(':');
            const iv = Buffer.from(ivHex, 'hex');

            const decipher = createDecipheriv(
                'aes-256-cbc',
                this.encryptionKey,
                iv
            );

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch {
            return null;
        }
    }

    /**
     * Clears the stored password from memory.
     */
    clear(): void {
        this.encryptedPassword = null;
    }

    /**
     * Checks if a password is stored.
     * @returns True if a password is stored.
     */
    hasPassword(): boolean {
        return this.encryptedPassword !== null;
    }
}