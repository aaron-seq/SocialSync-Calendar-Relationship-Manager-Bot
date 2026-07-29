import { Sparkles, HelpCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';

interface AiRationaleCardProps {
  rationale: string;
  /** Value stored in message_queue.ai_model_used. */
  modelUsed?: string;
  className?: string;
}

/** llm.service returns this when the API is unreachable or unconfigured. */
const FALLBACK_MODEL = 'fallback-template';

export function AiRationaleCard({ rationale, modelUsed, className }: AiRationaleCardProps) {
  const isFallback = modelUsed === FALLBACK_MODEL;

  return (
    <GlassCard className={cn('p-4 space-y-3 border-l-4 border-l-neon-violet/50', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-neon-violet">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
        </div>

        {/* A template draft is not model output — say so rather than dressing
            it up, since llm.service reports success either way. */}
        {isFallback && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-solar-amber/10 border border-solar-amber/30">
            <FileText className="w-3 h-3 text-solar-amber" />
            <span className="text-xs font-medium text-solar-amber">Template</span>
          </div>
        )}
      </div>

      <p className="text-sm text-starlight/90 leading-relaxed italic">"{rationale}"</p>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[10px] text-moon-dust/50 font-mono">
          {modelUsed ? `Model: ${modelUsed}` : 'Model: unknown'}
        </span>

        <div className="group relative">
          <button
            className="p-1.5 rounded-lg hover:bg-white/5 text-moon-dust/50 hover:text-neon-violet transition-colors"
            aria-label="What is this?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-full right-0 mb-2 w-52 p-2 rounded-lg bg-void-black border border-white/10 text-xs text-moon-dust opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            {isFallback
              ? 'The AI service was unavailable, so this draft came from a built-in template.'
              : 'The model explains why it chose this tone and content for this contact.'}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
