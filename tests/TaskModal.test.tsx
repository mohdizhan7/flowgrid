import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskModal from '../src/components/TaskModal';

const project = { id: 'p1', name: 'Proj', status: 'Active', tags: [] };
const task = { id: 't1', projectId: 'p1', title: 'Task', status: 'Backlog', priority: 'Medium', assignees: [], tags: [], checklist: [] };

describe('TaskModal', () => {
  it('saves edits and handles deletion', () => {
    const handleSave = vi.fn();
    const handleDelete = vi.fn();
    render(
      <TaskModal
        task={task}
        projects={[project]}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => {}}
      />
    );
    const title = screen.getByDisplayValue('Task');
    fireEvent.change(title, { target: { value: 'Updated task' } });
    fireEvent.click(screen.getByText('Save'));
    expect(handleSave).toHaveBeenCalled();
    expect(handleSave.mock.calls[0][0].title).toBe('Updated task');
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledWith('t1');
  });
});
