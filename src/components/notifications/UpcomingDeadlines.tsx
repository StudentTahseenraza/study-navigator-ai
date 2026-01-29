import { Clock, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { format, differenceInDays } from 'date-fns';
import { AddReminderDialog } from './AddReminderDialog';

export const UpcomingDeadlines = () => {
  const { reminders, loadingReminders, deleteReminder } = useNotifications();

  const getDaysUntil = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(deadline, today);
  };

  const getUrgencyStyle = (daysUntil: number) => {
    if (daysUntil <= 1) return 'border-l-red-500 bg-red-500/5';
    if (daysUntil <= 3) return 'border-l-orange-500 bg-orange-500/5';
    if (daysUntil <= 7) return 'border-l-yellow-500 bg-yellow-500/5';
    return 'border-l-green-500 bg-green-500/5';
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil === 0) return { label: 'Today!', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (daysUntil === 1) return { label: 'Tomorrow', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (daysUntil <= 3) return { label: `${daysUntil} days`, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (daysUntil <= 7) return { label: `${daysUntil} days`, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (daysUntil <= 14) return { label: `${daysUntil} days`, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    return { label: `${daysUntil} days`, className: 'bg-green-500/20 text-green-400 border-green-500/30' };
  };

  if (loadingReminders) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Upcoming Deadlines</h3>
        </div>
        <AddReminderDialog />
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add reminders for application and document deadlines
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.slice(0, 5).map((reminder) => {
            const daysUntil = getDaysUntil(reminder.deadline_date);
            const urgency = getUrgencyBadge(daysUntil);
            const urgencyStyle = getUrgencyStyle(daysUntil);

            return (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border-l-4 group hover:bg-secondary/30 transition-colors ${urgencyStyle}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {daysUntil <= 3 && (
                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{reminder.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(reminder.deadline_date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    {reminder.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {reminder.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={urgency.className}>
                      {urgency.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                      onClick={() => deleteReminder.mutateAsync(reminder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {reminders.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              + {reminders.length - 5} more deadlines
            </p>
          )}
        </div>
      )}
    </div>
  );
};
