/**
 * React Error Boundary
 * 
 * Catches JavaScript errors in child component tree and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Why Error Boundaries:
 * - Prevents entire app crash from isolated component errors
 * - Provides user-friendly error messages
 * - Enables error reporting to monitoring services
 * - Improves overall application resilience
 */

import { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { GlassCard } from '@/components/ui/glass-card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component that wraps child components
 * and catches errors during rendering, in lifecycle methods,
 * and in constructors of the whole tree below them.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error with full context
    logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });

    // In production, send to error monitoring service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <GlassCard className="max-w-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-toxic-rose/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-toxic-rose" />
            </div>
            
            <h2 className="text-xl font-display font-bold text-starlight mb-2">
              Something went wrong
            </h2>
            
            <p className="text-moon-dust mb-4">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-void-slate/50 text-left">
                <p className="text-xs font-mono text-toxic-rose break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleRetry}
              className="btn-neon flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary.
 * 
 * Usage:
 * ```tsx
 * const SafeComponent = withErrorBoundary(RiskyComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
