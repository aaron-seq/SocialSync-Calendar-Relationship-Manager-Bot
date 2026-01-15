import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate relationship health color based on score
 */
export function getHealthColor(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Calculate orbit distance based on health score and intimacy
 * Higher health = closer to center
 * Capped at 260px to fit within the 600px container
 */
export function calculateOrbitDistance(
  healthScore: number,
  intimacyLevel: number,
  baseDistance: number = 80
): number {
  // Intimacy affects base distance (closer = more intimate)
  const intimacyFactor = 1 - (intimacyLevel - 1) / 9 // 0 to 1, where 10 intimacy = 0
  
  // Health affects variance (lower health = drifts further)
  const healthVariance = (100 - healthScore) * 1.5
  
  const distance = baseDistance + (intimacyFactor * 80) + healthVariance
  
  // Cap at 260px to stay within container
  return Math.min(distance, 260)
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Get status badge styling based on automation policy
 */
export function getAutomationPolicyStyle(policy: string): {
  bg: string
  text: string
  label: string
} {
  switch (policy) {
    case 'ALWAYS_AUTO_SEND':
      return { bg: 'bg-cyber-emerald/20', text: 'text-cyber-emerald', label: 'Auto' }
    case 'AUTO_SEND_LOW_RISK':
      return { bg: 'bg-solar-amber/20', text: 'text-solar-amber', label: 'Smart' }
    case 'ALWAYS_REVIEW':
    default:
      return { bg: 'bg-neon-violet/20', text: 'text-neon-violet', label: 'Review' }
  }
}
