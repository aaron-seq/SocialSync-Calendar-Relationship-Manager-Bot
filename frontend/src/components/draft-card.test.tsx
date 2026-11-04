import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DraftCard } from './draft-card';

describe('DraftCard', () => {
  const defaultProps = {
    id: '1',
    contactName: 'John Doe',
    eventType: 'BIRTHDAY',
    generatedContent: 'Happy Birthday!',
    status: 'WAITING_FOR_REVIEW' as const,
  };

  it('renders content correctly', () => {
    render(<DraftCard {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Happy Birthday!')).toBeInTheDocument();
  });

  it('shows AI rationale when provided', () => {
    render(<DraftCard {...defaultProps} aiRationale="AI Logic" />);
    // Since RationaleCard renders it in quotes
    expect(screen.getByText(/"AI Logic"/)).toBeInTheDocument();
  });

  it('calls action handlers', () => {
    const onApprove = vi.fn();
    const onEdit = vi.fn();
    const onReject = vi.fn();

    render(
      <DraftCard 
        {...defaultProps} 
        onApprove={onApprove}
        onEdit={onEdit}
        onReject={onReject}
      />
    );

    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('lets an approved draft be edited or cancelled', () => {
    const onEdit = vi.fn();
    const onReject = vi.fn();
    render(<DraftCard {...defaultProps} status="APPROVED_WAITING" onEdit={onEdit} onReject={onReject} />);
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel draft' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it('disables actions while a change is pending', () => {
    const onApprove = vi.fn();
    render(<DraftCard {...defaultProps} isBusy onApprove={onApprove} />);
    const approve = screen.getByRole('button', { name: 'Approve' });
    expect(approve).toBeDisabled();
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
  });
});
