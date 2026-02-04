import { Sparkles, Brain, ThumbsUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';

interface AiRationaleCardProps {
  rationale: string;
  confidenceScore?: number; // 0-100
  modelUsed?: string;
  className?: string;
}

export function AiRationaleCard({ 
  rationale, 
  confidenceScore = 85, // Default for now until backend supports it fully
  modelUsed = 'SocialSync-v1',
  className 
}: AiRationaleCardProps) {
  
  // Determine color based on confidence
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-cyber-emerald';
    if (score >= 70) return 'text-solar-amber';
    return 'text-toxic-rose';
  };

  const confidenceColor = getConfidenceColor(confidenceScore);

  return (
    <GlassCard 
      className={cn("p-4 space-y-3 border-l-4 border-l-neon-violet/50", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-neon-violet">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
        </div>
        
        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-void-slate/50 border border-white/5">
          <Brain className="w-3 h-3 text-moon-dust" />
          <span className="text-xs text-moon-dust">Confidence:</span>
          <span className={cn("text-xs font-bold", confidenceColor)}>
            {confidenceScore}%
          </span>
        </div>
      </div>

      <p className="text-sm text-starlight/90 leading-relaxed italic">
        "{rationale}"
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[10px] text-moon-dust/50 font-mono">
          Model: {modelUsed}
        </span>
        
        <div className="flex gap-2">
          <button 
            className="p-1.5 rounded-lg hover:bg-white/5 text-moon-dust/50 hover:text-cyber-emerald transition-colors"
            title="Reasoning was helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <div className="group relative">
             <button 
              className="p-1.5 rounded-lg hover:bg-white/5 text-moon-dust/50 hover:text-neon-violet transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-void-black border border-white/10 text-xs text-moon-dust opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              This explanation helps you understand why the AI generated this specific draft.
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
