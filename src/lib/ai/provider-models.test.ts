import { describe, it, expect } from 'vitest'
import {
  validateEndpointUrl,
  filterOpenAiModels,
  filterAnthropicModels,
  filterGeminiModels,
  filterGroqModels,
  filterOllamaModels,
  PROVIDER_FALLBACK_MODELS,
} from './provider-models'

describe('provider-models utilities', () => {
  describe('validateEndpointUrl (SSRF defense, covers: AC-3)', () => {
    it('accepts valid localhost and remote http/https urls', () => {
      expect(validateEndpointUrl('http://localhost:11434').valid).toBe(true)
      expect(validateEndpointUrl('http://127.0.0.1:11434').valid).toBe(true)
      expect(validateEndpointUrl('https://ollama.my-domain.com').valid).toBe(true)
    })

    it('blocks cloud metadata IP 169.254.169.254', () => {
      const res = validateEndpointUrl('http://169.254.169.254/latest/meta-data')
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/metadata/i)
    })

    it('blocks other 169.254.* addresses', () => {
      const res = validateEndpointUrl('http://169.254.1.1:8080')
      expect(res.valid).toBe(false)
      expect(res.error).toMatch(/metadata/i)
    })

    it('blocks internal database ports like 5432 and 3306', () => {
      const pgRes = validateEndpointUrl('http://localhost:5432')
      expect(pgRes.valid).toBe(false)
      expect(pgRes.error).toMatch(/5432/i)

      const mysqlRes = validateEndpointUrl('http://127.0.0.1:3306')
      expect(mysqlRes.valid).toBe(false)
      expect(mysqlRes.error).toMatch(/3306/i)

      const redisRes = validateEndpointUrl('http://127.0.0.1:6379')
      expect(redisRes.valid).toBe(false)
      expect(redisRes.error).toMatch(/6379/i)
    })

    it('blocks non http/https protocols', () => {
      expect(validateEndpointUrl('ftp://localhost:11434').valid).toBe(false)
      expect(validateEndpointUrl('javascript:alert(1)').valid).toBe(false)
    })

    it('rejects malformed URLs', () => {
      expect(validateEndpointUrl('not-a-valid-url').valid).toBe(false)
    })
  })

  describe('model filtering (covers: AC-2)', () => {
    it('filters OpenAI models to chat/generation models only', () => {
      const raw = [
        { id: 'gpt-4o' },
        { id: 'text-embedding-3-small' },
        { id: 'gpt-4o-mini' },
        { id: 'dall-e-3' },
        { id: 'whisper-1' },
        { id: 'o1-preview' },
      ]
      const filtered = filterOpenAiModels(raw)
      expect(filtered).toContain('gpt-4o')
      expect(filtered).toContain('gpt-4o-mini')
      expect(filtered).toContain('o1-preview')
      expect(filtered).not.toContain('text-embedding-3-small')
      expect(filtered).not.toContain('dall-e-3')
      expect(filtered).not.toContain('whisper-1')
    })

    it('falls back to known good OpenAI models if no match', () => {
      const filtered = filterOpenAiModels([{ id: 'unrelated-model' }])
      expect(filtered).toEqual(PROVIDER_FALLBACK_MODELS.OPENAI)
    })

    it('filters Anthropic models to claude models', () => {
      const raw = [{ id: 'claude-3-5-sonnet-20241022' }, { id: 'other-model' }]
      const filtered = filterAnthropicModels(raw)
      expect(filtered).toEqual(['claude-3-5-sonnet-20241022'])
    })

    it('filters Gemini models to generateContent models and strips prefix', () => {
      const raw = [
        { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      ]
      const filtered = filterGeminiModels(raw)
      expect(filtered).toEqual(['gemini-1.5-pro'])
    })

    it('filters Groq models and removes whisper and guard models', () => {
      const raw = [
        { id: 'llama-3.3-70b-versatile', active: true },
        { id: 'whisper-large-v3', active: true },
        { id: 'llama-guard-3-8b', active: true },
        { id: 'inactive-model', active: false },
      ]
      const filtered = filterGroqModels(raw)
      expect(filtered).toEqual(['llama-3.3-70b-versatile'])
    })

    it('filters Ollama models from /api/tags', () => {
      const raw = [{ name: 'llama3.2:latest' }, { name: 'qwen2.5:latest' }]
      const filtered = filterOllamaModels(raw)
      expect(filtered).toEqual(['llama3.2:latest', 'qwen2.5:latest'])
    })
  })
})
