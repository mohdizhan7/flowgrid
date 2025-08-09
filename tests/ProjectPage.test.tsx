import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectPage } from '../src/app/page';

const project = { id: 'p1', name: 'Proj', status: 'Active', tags: [] };
const task = {
  id: 't1',
  projectId: 'p1',
  title: 'Task 1',
  status: 'Backlog',
  priority: 'Medium',
  assignees: [],
  tags: [],
  checklist: []
};

describe('ProjectPage', () => {
  it('updates task via list view', () => {
    const handleUpdate = vi.fn();
    render(
      <ProjectPage
        project={project}
        tasks={[task]}
        onBack={() => {}}
        onSaveProject={() => {}}
        onAddTask={() => {}}
        onOpenTask={() => {}}
        onUpdateTask={handleUpdate}
      />
    );
    fireEvent.change(screen.getByDisplayValue('Board'), { target: { value: 'List' } });
    const statusSelect = screen.getByDisplayValue('Backlog');
    fireEvent.change(statusSelect, { target: { value: 'Done' } });
    expect(handleUpdate).toHaveBeenCalledWith({ ...task, status: 'Done' });
  });
});
