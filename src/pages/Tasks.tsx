import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTasks } from '@/hooks/useTasks';
import { useUniversities } from '@/hooks/useUniversities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Tasks = () => {
  const { tasks, pendingTasks, inProgressTasks, completedTasks, isLoading, completeTask, deleteTask, updateTask } = useTasks();
  const { lockedUniversities } = useUniversities();

  const getPriorityStyles = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderTaskList = (taskList: typeof tasks, title: string, emptyMessage: string) => (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
        {title}
        <Badge variant="outline">{taskList.length}</Badge>
      </h2>
      
      {taskList.length > 0 ? (
        <div className="space-y-3">
          {taskList.map(task => (
            <div
              key={task.id}
              className={`glass-card p-4 flex items-start gap-4 transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => {
                  if (task.status !== 'completed') {
                    completeTask.mutate(task.id);
                  }
                }}
                className="mt-1 flex-shrink-0"
                disabled={task.status === 'completed'}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.priority && (
                      <Badge className={getPriorityStyles(task.priority)}>
                        {task.priority}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  {task.university_id && (task as any).universities && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{(task as any).universities.name}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {task.category && (
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm py-4">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">To-Do List</h1>
            <p className="text-muted-foreground">
              Track your application tasks and stay on schedule
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{completedTasks.length}</span> of{' '}
              <span className="font-semibold text-foreground">{tasks.length}</span> completed
            </div>
          </div>
        </div>

        {/* No Locked Universities Warning */}
        {lockedUniversities.length === 0 && tasks.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              Lock a university to get started
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Application tasks will be automatically generated when you lock your first university. 
              This ensures you have a focused, actionable to-do list.
            </p>
            <Link to="/shortlist">
              <Button className="gradient-bg text-white hover:opacity-90">
                Go to Shortlist
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* AI Task Suggestions */}
        {lockedUniversities.length > 0 && pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="glass-card p-6 gradient-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">
                  Tasks are being generated
                </h3>
                <p className="text-muted-foreground">
                  The AI Counsellor is creating personalized tasks for your locked universities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Lists */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Tasks */}
            {renderTaskList(
              pendingTasks, 
              '📋 Pending Tasks', 
              'No pending tasks. You\'re all caught up!'
            )}

            {/* In Progress */}
            {inProgressTasks.length > 0 && renderTaskList(
              inProgressTasks, 
              '🔄 In Progress', 
              'No tasks in progress'
            )}

            {/* Completed */}
            {completedTasks.length > 0 && renderTaskList(
              completedTasks, 
              '✅ Completed', 
              'No completed tasks yet'
            )}
          </div>
        )}

        {/* Progress Summary */}
        {tasks.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Progress Summary</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <div className="font-display text-3xl font-bold text-foreground">
                  {pendingTasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <div className="font-display text-3xl font-bold text-warning">
                  {inProgressTasks.length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <div className="font-display text-3xl font-bold text-success">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
