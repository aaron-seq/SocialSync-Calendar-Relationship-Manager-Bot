import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiRationaleCard } from './ai-rationale-card';

describe('AiRationaleCard', () => {
  it('renders rationale correctly', () => {
    render(<AiRationaleCard rationale="Test rationale" />);
    expect(screen.getByText('"Test rationale"')).toBeInTheDocument();
  });

  it('shows the model that generated the draft', () => {
    render(<AiRationaleCard rationale="Test" modelUsed="llama-3.3-70b-versatile" />);
    expect(screen.getByText('Model: llama-3.3-70b-versatile')).toBeInTheDocument();
  });

  it('flags template fallbacks so they are not mistaken for model output', () => {
    render(<AiRationaleCard rationale="Test" modelUsed="fallback-template" />);
    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  it('does not claim a model when none was recorded', () => {
    render(<AiRationaleCard rationale="Test" />);
    expect(screen.getByText('Model: unknown')).toBeInTheDocument();
    expect(screen.queryByText('Template')).not.toBeInTheDocument();
  });
});
