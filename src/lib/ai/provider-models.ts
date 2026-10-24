import type { AiProvider } from '@prisma/client'

export const PROVIDER_FALLBACK_MODELS: Record<AiProvider, string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4-turbo'],
  ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  GEMINI: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  GROQ: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  OLLAMA: ['llama3.2', 'mistral', 'qwen2.5', 'phi3'],
}

export const DEFAULT_PROVIDER_MODELS: Record<AiProvider, string> = {
  OPENAI: 'gpt-4o',
  ANTHROPIC: 'claude-3-5-sonnet-20241022',
  GEMINI: 'gemini-2.0-flash',
  GROQ: 'llama-3.3-70b-versatile',
  OLLAMA: 'llama3.2',
}

const BLOCKED_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata',
  'instance-data',
])

const BLOCKED_PORTS = new Set([
  22, // SSH
  25, // SMTP
  465, // SMTPS
  587, // Submission
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  11211, // Memcached
  27017, // MongoDB
  9200, // Elasticsearch
  9300, // Elasticsearch
])

/**
 * Validates an Ollama endpoint URL to protect against SSRF.
 * Blocks cloud metadata IPs and sensitive internal database/service ports.
 */
export function validateEndpointUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Endpoint URL is required' }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL protocol must be http or https' }
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (BLOCKED_HOSTS.has(hostname) || hostname.startsWith('169.254.')) {
    return { valid: false, error: 'Forbidden endpoint host (metadata address blocked)' }
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80
  if (BLOCKED_PORTS.has(port)) {
    return { valid: false, error: `Forbidden endpoint port (${port} is a restricted service port)` }
  }

  return { valid: true }
}

/**
 * Filters OpenAI models down to chat and text generation models.
 */
export function filterOpenAiModels(models: Array<{ id: string }>): string[] {
  const excludedPatterns = [
    'embedding',
    'tts',
    'whisper',
    'dall-e',
    'babbage',
    'davinci',
    'moderation',
    'realtime',
    'audio',
    'curie',
    'ada',
  ]

  const filtered = models
    .map((m) => m.id)
    .filter((id) => {
      const lower = id.toLowerCase()
      const isExcluded = excludedPatterns.some((pattern) => lower.includes(pattern))
      if (isExcluded) return false
      return (
        lower.startsWith('gpt-') ||
        lower.startsWith('o1') ||
        lower.startsWith('o3') ||
        lower.startsWith('chatgpt')
      )
    })

  // Deduplicate and return
  const unique = Array.from(new Set(filtered))
  return unique.length > 0 ? unique : PROVIDER_FALLBACK_MODELS.OPENAI
}

/**
 * Filters Anthropic models to active Claude chat models.
 */
export function filterAnthropicModels(models: Array<{ id: string }>): string[] {
  const filtered = models.map((m) => m.id).filter((id) => id.toLowerCase().startsWith('claude-'))

  const unique = Array.from(new Set(filtered))
  return unique.length > 0 ? unique : PROVIDER_FALLBACK_MODELS.ANTHROPIC
}

/**
 * Filters Gemini models to those supporting generateContent.
 */
export function filterGeminiModels(
  models: Array<{ name: string; supportedGenerationMethods?: string[] }>,
): string[] {
  const filtered = models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => id.toLowerCase().includes('gemini'))

  const unique = Array.from(new Set(filtered))
  return unique.length > 0 ? unique : PROVIDER_FALLBACK_MODELS.GEMINI
}

/**
 * Filters Groq models to chat generation models.
 */
export function filterGroqModels(models: Array<{ id: string; active?: boolean }>): string[] {
  const excluded = ['whisper', 'guard', 'embedding']
  const filtered = models
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter((id) => {
      const lower = id.toLowerCase()
      return !excluded.some((p) => lower.includes(p))
    })

  const unique = Array.from(new Set(filtered))
  return unique.length > 0 ? unique : PROVIDER_FALLBACK_MODELS.GROQ
}

/**
 * Filters Ollama models from /api/tags response.
 */
export function filterOllamaModels(models: Array<{ name: string }>): string[] {
  const names = models.map((m) => m.name).filter(Boolean)
  const unique = Array.from(new Set(names))
  return unique.length > 0 ? unique : PROVIDER_FALLBACK_MODELS.OLLAMA
}
