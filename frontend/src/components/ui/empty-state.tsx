/**
 * Empty State Component
 * 
 * Displays a friendly message when a list or view has no data.
 * Includes an optional call-to-action button.
 * 
 * Why this exists:
 * - Users need guidance when starting with an empty application
 * - Prevents confusion about whether data failed to load
 * - Provides a clear path to adding first items
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon to display (from lucide-react) */
  icon: LucideIcon;
  
  /** Main heading text */
  title: string;
  
  /** Descriptive text below the title */
  description: string;
  
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /** Optional custom content below the description */
  children?: ReactNode;
  
  /** Optional additional className */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <GlassCard className={cn('p-12 text-center', className)}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-void-slate/50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-moon-dust/50" />
      </div>
      
      <h3 className="text-lg font-display font-medium text-starlight mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-moon-dust/70 max-w-sm mx-auto">
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 btn-neon-solid"
        >
          {action.label}
        </button>
      )}
      
      {children}
    </GlassCard>
  );
}
