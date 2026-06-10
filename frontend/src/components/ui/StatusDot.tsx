import React from 'react';

export type Status = 'todo' | 'in_progress' | 'done';

// Status dots: To Do #94a3b8 · In Progress #fba94d · Done #4ade80
const colors: Record<Status, string> = {
  todo: 'bg-status-todo',
  in_progress: 'bg-status-doing',
  done: 'bg-status-done',
};

const StatusDot: React.FC<{ status: Status; className?: string }> = ({
  status,
  className = '',
}) => (
  <span
    className={`inline-block w-2 h-2 rounded-full flex-none ${colors[status]} ${className}`}
  />
);

export default StatusDot;
