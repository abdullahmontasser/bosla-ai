import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptSecret, decryptSecret, generateEncryptionKey } from './crypto'

describe('Crypto helper (AES 256 GCM)', () => {
  const originalEnvKey = process.env.ENCRYPTION_KEY
  const testKey = generateEncryptionKey()

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey
  })

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnvKey
  })

  it('encrypts and decrypts text back to original value', () => {
    const rawApiKey = 'sk-proj-test1234567890abcdef'
    const payload = encryptSecret(rawApiKey)

    expect(payload.encryptedKey).toBeDefined()
    expect(payload.iv).toHaveLength(24) // 12 bytes = 24 hex chars
    expect(payload.authTag).toHaveLength(32) // 16 bytes = 32 hex chars

    const decrypted = decryptSecret(payload.encryptedKey, payload.iv, payload.authTag)
    expect(decrypted).toBe(rawApiKey)
  })

  it('generates different initialization vectors for the same plaintext', () => {
    const rawApiKey = 'sk-ant-api03-test-key'
    const payload1 = encryptSecret(rawApiKey)
    const payload2 = encryptSecret(rawApiKey)

    expect(payload1.iv).not.toBe(payload2.iv)
    expect(payload1.encryptedKey).not.toBe(payload2.encryptedKey)

    expect(decryptSecret(payload1.encryptedKey, payload1.iv, payload1.authTag)).toBe(rawApiKey)
    expect(decryptSecret(payload2.encryptedKey, payload2.iv, payload2.authTag)).toBe(rawApiKey)
  })

  it('fails decryption when ciphertext is tampered', () => {
    const rawApiKey = 'super-secret-gemini-key'
    const payload = encryptSecret(rawApiKey)

    // Flip a character in base64 ciphertext
    const tamperedKey = payload.encryptedKey.startsWith('A')
      ? 'B' + payload.encryptedKey.slice(1)
      : 'A' + payload.encryptedKey.slice(1)

    expect(() => decryptSecret(tamperedKey, payload.iv, payload.authTag)).toThrow()
  })

  it('fails decryption when auth tag is tampered', () => {
    const rawApiKey = 'super-secret-groq-key'
    const payload = encryptSecret(rawApiKey)

    const tamperedTag = '00' + payload.authTag.slice(2)

    expect(() => decryptSecret(payload.encryptedKey, payload.iv, tamperedTag)).toThrow()
  })

  it('fails decryption when a different key is used', () => {
    const rawApiKey = 'secret-ollama-token'
    const payload = encryptSecret(rawApiKey)

    const differentKey = generateEncryptionKey()

    expect(() =>
      decryptSecret(payload.encryptedKey, payload.iv, payload.authTag, differentKey),
    ).toThrow()
  })

  it('throws when ENCRYPTION_KEY is unset and no explicit key is provided', () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encryptSecret('some-key')).toThrow(
      /ENCRYPTION_KEY environment variable is not set/,
    )
  })
})
