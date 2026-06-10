import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskAPI } from '../services/api.ts';
import { resolveWebSocketUrl, useWebSocket } from '../hooks/useWebSocket.ts';
import Button from './ui/Button.tsx';
import Card from './ui/Card.tsx';
import PriorityBadge, { Priority } from './ui/PriorityBadge.tsx';
import StatusDot, { Status } from './ui/StatusDot.tsx';

interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee_id?: number;
  due_date?: string;
  created_at: string;
}

const Board: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
  });

  const websocketUrl =
    process.env.REACT_APP_WS_URL ?? resolveWebSocketUrl('');

  const { isConnected, lastMessage } = useWebSocket(websocketUrl);

  const fetchTasks = useCallback(async () => {
    if (!id) return;
    try {
      const response = await taskAPI.getTasks(parseInt(id));
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'task_created':
        case 'task_updated':
        case 'task_deleted':
          fetchTasks();
          break;
      }
    }
  }, [lastMessage, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await taskAPI.createTask(parseInt(id), newTask);
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowCreateModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    if (!id) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await taskAPI.updateTask(parseInt(id), taskId, {
        ...task,
        status: newStatus,
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const moveButton = (label: string, onClick: () => void, title: string) => (
    <button
      onClick={onClick}
      title={title}
      className="font-mono text-[11px] text-ink-soft bg-white border border-line rounded-md px-2 py-0.5 cursor-pointer transition-colors duration-[180ms] hover:border-accent-soft hover:text-accent-deep"
    >
      {label}
    </button>
  );

  const TaskCard = ({ task }: { task: Task }) => (
    <Card hover className="!rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-sans font-semibold text-[14.5px] leading-[1.35] text-ink m-0 flex-1">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && (
        <p className="text-[13.5px] text-ink-soft mt-0 mb-3">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted">
          {new Date(task.created_at).toLocaleDateString()}
        </span>
        <div className="flex gap-1.5">
          {task.status !== 'todo' &&
            moveButton('←', () => handleUpdateTaskStatus(task.id, 'todo'), 'Move to To Do')}
          {task.status === 'todo' &&
            moveButton('start →', () => handleUpdateTaskStatus(task.id, 'in_progress'), 'Start Task')}
          {task.status === 'in_progress' &&
            moveButton('done ✓', () => handleUpdateTaskStatus(task.id, 'done'), 'Complete Task')}
        </div>
      </div>
    </Card>
  );

  const Column = ({
    title,
    status,
    tasks,
  }: {
    title: string;
    status: Status;
    tasks: Task[];
  }) => (
    <div className="bg-[#f4ede2]/60 border border-line rounded-2xl p-4 min-w-[300px] flex-1">
      <div className="flex items-center gap-2 mb-4 px-1">
        <StatusDot status={status} />
        <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.05em] text-ink-soft">
          {title}
        </span>
        <span className="ml-auto font-mono text-[11px] text-ink-soft bg-white border border-line rounded-md px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p className="text-sm m-0">No tasks here</p>
          </div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-8 animate-fadeIn">
      {/* Header */}
      <Card className="mb-8 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-ink-soft hover:text-ink text-xl no-underline p-2 rounded-lg hover:bg-[#f4ede2] transition-colors duration-[180ms]"
              aria-label="Back to dashboard"
            >
              ←
            </Link>
            <div>
              <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] text-ink m-0 flex items-center gap-3">
                <span>Board #{id}</span>
                <span className="inline-flex items-center gap-2 font-mono text-[12.5px] font-normal text-muted border border-line rounded-full px-3 py-1">
                  <span
                    className={`w-[7px] h-[7px] rounded-full ${
                      isConnected
                        ? 'bg-status-done motion-safe:animate-pulse'
                        : 'bg-[#f87171]'
                    }`}
                  />
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </h1>
              <p className="text-ink-soft m-0 mt-1">Manage your tasks efficiently</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ New task</Button>
        </div>
      </Card>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          <Column title="To Do" status="todo" tasks={getTasksByStatus('todo')} />
          <Column title="In Progress" status="in_progress" tasks={getTasksByStatus('in_progress')} />
          <Column title="Done" status="done" tasks={getTasksByStatus('done')} />
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink m-0">
                Create new task
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-ink text-2xl leading-none bg-transparent border-none cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted mb-2">
                  Task title
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-line rounded-xl text-ink text-[15.5px] transition-colors duration-[180ms] focus:border-accent-soft"
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-line rounded-xl text-ink text-[15.5px] transition-colors duration-[180ms] focus:border-accent-soft resize-none"
                  rows={3}
                  placeholder="Add more details..."
                />
              </div>
              <div>
                <label className="block font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority })}
                      className={`py-2.5 px-4 rounded-xl font-mono text-[12.5px] uppercase tracking-[0.04em] cursor-pointer border transition-[background,border-color,color] duration-[180ms] ${
                        newTask.priority === priority
                          ? 'bg-accent-grad text-white border-transparent shadow-btn-accent'
                          : 'bg-white text-ink-soft border-line hover:border-accent-soft'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Board;
