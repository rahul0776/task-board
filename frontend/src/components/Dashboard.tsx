import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { boardAPI, taskAPI } from '../services/api.ts';
import { useAuth } from '../services/AuthContext.tsx';
import Button from './ui/Button.tsx';
import Card from './ui/Card.tsx';

interface Board {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface Task {
  status: 'todo' | 'in_progress' | 'done';
}

const Dashboard: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const { displayName, anonymousUserId, loading: authLoading } = useAuth();

  const fetchBoards = useCallback(async () => {
    try {
      if (authLoading || !anonymousUserId) return;
      const response = await boardAPI.getBoards();
      setBoards(response.data.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, anonymousUserId]);

  const fetchTaskStats = useCallback(async () => {
    try {
      if (authLoading || !anonymousUserId) return;
      const response = await boardAPI.getBoards();
      const allBoards = response.data.boards || [];

      let total = 0;
      let completed = 0;
      let active = 0;

      // Fetch tasks for each board
      for (const board of allBoards) {
        try {
          const tasksResponse = await taskAPI.getTasks(board.id);
          const tasks = tasksResponse.data.tasks || [];
          total += tasks.length;
          completed += tasks.filter((t: Task) => t.status === 'done').length;
          active += tasks.filter((t: Task) => t.status === 'in_progress').length;
        } catch (err) {
          console.error(`Failed to fetch tasks for board ${board.id}:`, err);
        }
      }

      setTotalTasks(total);
      setCompletedTasks(completed);
      setActiveTasks(active);
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  }, [authLoading, anonymousUserId]);

  useEffect(() => {
    if (!authLoading && anonymousUserId) {
      fetchBoards();
      fetchTaskStats();
    }
  }, [authLoading, anonymousUserId, fetchBoards, fetchTaskStats]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authLoading || !anonymousUserId) return;
      await boardAPI.createBoard(newBoard);
      setNewBoard({ title: '', description: '' });
      setShowModal(false);
      fetchBoards();
      fetchTaskStats();
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleDeleteBoard = async (id: number) => {
    if (authLoading || !anonymousUserId) return;
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await boardAPI.deleteBoard(id);
      fetchBoards();
      fetchTaskStats();
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const getProductivity = () => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-lg text-ink-soft">Loading your workspace...</div>
      </div>
    );
  }

  const stats = [
    { num: '01', label: 'Total boards', value: boards.length },
    { num: '02', label: 'Active tasks', value: activeTasks },
    { num: '03', label: 'Completed', value: completedTasks },
    {
      num: '04',
      label: 'Productivity',
      value: `${getProductivity()}%`,
      sub: `${completedTasks}/${totalTasks} tasks`,
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.12em] text-accent-deep mb-3">
          Your workspace
        </p>
        <h1 className="font-display font-bold text-[34px] leading-[1.12] tracking-[-0.02em] text-ink m-0">
          Welcome back, {displayName}.
        </h1>
        <p className="text-ink-soft mt-2 mb-0">Here are your boards and projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {stats.map((s) => (
          <Card key={s.num} hover className="p-6">
            <div className="w-[42px] h-[42px] rounded-xl bg-[linear-gradient(135deg,rgba(251,169,77,0.18),rgba(244,115,12,0.14))] border border-[#f5dcbd] grid place-items-center mb-4 font-mono text-[15px] font-medium text-accent-deep">
              {s.num}
            </div>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted m-0">
              {s.label}
            </p>
            <p className="font-display font-bold text-[30px] text-ink mt-1 mb-0">{s.value}</p>
            {s.sub && <p className="text-[13px] text-muted mt-1 mb-0">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Boards */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink m-0">
          Your boards
        </h2>
        <Button onClick={() => setShowModal(true)}>+ New board</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : boards.length === 0 ? (
        <Card className="text-center py-20 px-6">
          <h3 className="font-display font-semibold text-[21px] text-ink mb-2 mt-0">
            No boards yet
          </h3>
          <p className="text-ink-soft mb-6 mt-0">Create your first board to get started!</p>
          <Button onClick={() => setShowModal(true)}>Create your first board</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <Card key={board.id} hover className="overflow-hidden flex flex-col">
              <div className="h-2 bg-accent-grad" />
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display font-semibold text-[19px] text-ink m-0 mb-2">
                  {board.title}
                </h3>
                <p className="text-[15.5px] text-ink-soft m-0 mb-4 flex-1">
                  {board.description || 'No description'}
                </p>
                <p className="font-mono text-[11.5px] text-muted m-0 mb-5">
                  created {new Date(board.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2.5">
                  <Link
                    to={`/board/${board.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 font-sans font-semibold text-[14px] leading-none px-4 py-[9px] rounded-[10px] no-underline bg-accent-grad text-white shadow-btn-accent transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-btn-accent-lg motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    Open board
                  </Link>
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() => handleDeleteBoard(board.id)}
                    aria-label={`Delete board ${board.title}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink m-0">
                Create new board
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-ink text-2xl leading-none bg-transparent border-none cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted mb-2">
                  Board title
                </label>
                <input
                  type="text"
                  required
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-line rounded-xl text-ink text-[15.5px] transition-colors duration-[180ms] focus:border-accent-soft"
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <label className="block font-mono text-[11.5px] uppercase tracking-[0.05em] text-muted mb-2">
                  Description
                </label>
                <textarea
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-line rounded-xl text-ink text-[15.5px] transition-colors duration-[180ms] focus:border-accent-soft resize-none"
                  rows={3}
                  placeholder="What's this board about?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create board
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
