import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_BYTES = 12 // 96 bits standard for GCM

export interface EncryptedPayload {
  encryptedKey: string
  iv: string
  authTag: string
}

function resolveKey(optionalKey?: string): Buffer {
  const rawKey = optionalKey ?? process.env.ENCRYPTION_KEY
  if (!rawKey) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. A 32 byte hex or string key is required.',
    )
  }

  // If 64 hex characters, parse as hex buffer
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex')
  }

  // If already exactly 32 bytes
  const buf = Buffer.from(rawKey, 'utf8')
  if (buf.length === 32) {
    return buf
  }

  // Derive a deterministic 32 byte key via SHA-256 for string secrets
  return crypto.createHash('sha256').update(rawKey).digest()
}

/**
 * Encrypts a plaintext string using AES 256 GCM.
 * Returns base64 ciphertext, hex iv, and hex auth tag.
 */
export function encryptSecret(plainText: string, key?: string): EncryptedPayload {
  const secretKey = resolveKey(key)
  const iv = crypto.randomBytes(IV_LENGTH_BYTES)

  const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedKey: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypts AES 256 GCM ciphertext.
 * Throws an error if the auth tag does not match or key is incorrect.
 */
export function decryptSecret(
  encryptedKey: string,
  ivHex: string,
  authTagHex: string,
  key?: string,
): string {
  const secretKey = resolveKey(key)
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encryptedBuffer = Buffer.from(encryptedKey, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Generates a cryptographically secure 32 byte hex key for ENCRYPTION_KEY.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}
