import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/glass-card';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <GlassCard className="max-w-md p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-neon-violet/20 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7 text-neon-violet" />
        </div>
        <h1 className="text-2xl font-display font-bold text-starlight mb-2">Page not found</h1>
        <p className="text-moon-dust mb-5">
          That route doesn&rsquo;t exist. It may have moved.
        </p>
        <Link to="/" className="btn-neon inline-block">
          Back to Orbit
        </Link>
      </GlassCard>
    </div>
  );
}
