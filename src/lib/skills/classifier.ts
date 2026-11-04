export const CATEGORIES_EN = {
  LANGUAGES: 'Languages & Frameworks',
  CLOUD: 'Cloud & DevOps',
  DATABASES: 'Databases & Storage',
  TOOLS: 'Developer Tools & Systems',
  ARCHITECTURE: 'Architecture & Concepts',
  LEADERSHIP: 'Professional & Leadership',
} as const

export const CATEGORIES_AR = {
  LANGUAGES: 'لغات البرمجة وأطر العمل',
  CLOUD: 'الحوسبة السحابية والديف أوبس',
  DATABASES: 'قواعد البيانات والتخزين',
  TOOLS: 'أدوات التطوير والأنظمة',
  ARCHITECTURE: 'المعمارية والمفاهيم الهندسية',
  LEADERSHIP: 'المهارات المهنية والقيادية',
} as const

/**
 * Intelligent deterministic fallback classifier for standard technical skills.
 * Pure synchronous utility safe for both client and server usage.
 */
export function classifySkillFallback(skill: string, isAr: boolean): string {
  const s = skill.trim().toLowerCase()
  const c = isAr ? CATEGORIES_AR : CATEGORIES_EN

  // 1. Databases & Storage
  if (
    /^(sql|mysql|postgresql|postgres|sqlite|mongodb|mongo|redis|cassandra|dynamodb|elasticsearch|oracle|prisma|typeorm|supabase|firebase|neo4j|mariadb|couchdb|memcached)/i.test(
      s,
    ) ||
    /database|storage|caching/i.test(s)
  ) {
    return c.DATABASES
  }

  // 2. Cloud & DevOps
  if (
    /^(aws|amazon web services|azure|gcp|google cloud|docker|kubernetes|k8s|terraform|ansible|jenkins|github actions|gitlab ci|circleci|linux|unix|bash|shell|nginx|apache|prometheus|grafana|helm|serverless|cloudflare|vercel|netlify|puppet|datadog)/i.test(
      s,
    ) ||
    /devops|cloud|container|orchestration|ci\/cd|pipeline/i.test(s)
  ) {
    return c.CLOUD
  }

  // 3. Developer Tools & Testing
  if (
    /^(git|github|gitlab|bitbucket|jira|postman|vscode|vs code|webpack|vite|vitest|jest|cypress|playwright|npm|yarn|pnpm|figma|eslint|prettier|sentry|insomnia|mocha|selenium)/i.test(
      s,
    ) ||
    /tool|ide|testing|linter|bundler/i.test(s)
  ) {
    return c.TOOLS
  }

  // 4. Architecture & Concepts
  if (
    /^(system design|microservices|micro-frontends|event-driven|oop|functional programming|data structures|algorithms|tdd|design patterns|clean architecture|restful|rest api|graphql|grpc|websockets)/i.test(
      s,
    ) ||
    /architecture|patterns|concurrency/i.test(s)
  ) {
    return c.ARCHITECTURE
  }

  // 5. Professional & Leadership
  if (
    /^(leadership|team leadership|communication|problem solving|mentoring|agile|scrum|kanban|cross-functional|code review|public speaking|management|time management)/i.test(
      s,
    ) ||
    /leadership|management|agile|scrum/i.test(s)
  ) {
    return c.LEADERSHIP
  }

  // 6. Default to Languages & Frameworks for software technologies
  return c.LANGUAGES
}
