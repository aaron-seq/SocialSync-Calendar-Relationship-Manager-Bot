import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'hover' | 'selected'
  glow?: 'none' | 'violet' | 'emerald' | 'rose'
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = 'none', children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl'
    
    const variantClasses = {
      default: 'glass-card',
      hover: 'glass-card-hover',
      selected: 'glass-card border-neon-violet/50',
    }
    
    const glowClasses = {
      none: '',
      violet: 'shadow-neon-violet',
      emerald: 'shadow-neon-emerald',
      rose: 'shadow-neon-rose',
    }
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          glowClasses[glow],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// Convenience wrapper for clickable cards
interface ClickableGlassCardProps extends GlassCardProps {
  onClick?: () => void
}

export const ClickableGlassCard = forwardRef<HTMLDivElement, ClickableGlassCardProps>(
  ({ onClick, ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        variant="hover"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        {...props}
      />
    )
  }
)

ClickableGlassCard.displayName = 'ClickableGlassCard'
