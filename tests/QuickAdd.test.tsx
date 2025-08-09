import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickAdd from '../src/components/QuickAdd';

const projects = [{ id: 'p1', name: 'Proj', status: 'Active', tags: [] }];

describe('QuickAdd', () => {
  it('creates task with selected project', () => {
    const handleAdd = vi.fn();
    render(<QuickAdd projects={projects} defaultProjectId="p1" onAdd={handleAdd} />);
    const input = screen.getByLabelText(/task title/i);
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.click(screen.getByText('Add'));
    expect(handleAdd).toHaveBeenCalledWith('New task', 'p1');
    expect(input).toHaveValue('');
  });
});
