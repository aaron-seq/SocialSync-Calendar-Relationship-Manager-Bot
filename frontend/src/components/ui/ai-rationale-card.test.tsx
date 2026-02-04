import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiRationaleCard } from './ai-rationale-card';

describe('AiRationaleCard', () => {
  it('renders rationale correctly', () => {
    render(<AiRationaleCard rationale="Test rationale" />);
    expect(screen.getByText('"Test rationale"')).toBeInTheDocument();
  });

  it('displays confidence score', () => {
    render(<AiRationaleCard rationale="Test" confidenceScore={95} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toHaveClass('text-cyber-emerald');
  });

  it('displays correct color for low confidence', () => {
    render(<AiRationaleCard rationale="Test" confidenceScore={50} />);
    expect(screen.getByText('50%')).toHaveClass('text-toxic-rose');
  });
});
