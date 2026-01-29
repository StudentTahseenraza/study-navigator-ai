import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNotifications, ReminderType } from '@/hooks/useNotifications';
import { useUniversities } from '@/hooks/useUniversities';

const reminderTypeLabels: Record<ReminderType, string> = {
  application_deadline: 'Application Deadline',
  document_deadline: 'Document Deadline',
  task_due: 'Task Due Date',
  custom: 'Custom Reminder',
};

const reminderDayOptions = [
  { value: 30, label: '30 days before' },
  { value: 14, label: '2 weeks before' },
  { value: 7, label: '1 week before' },
  { value: 3, label: '3 days before' },
  { value: 1, label: '1 day before' },
  { value: 0, label: 'On the day' },
];

interface AddReminderDialogProps {
  universityId?: number;
  trigger?: React.ReactNode;
}

export const AddReminderDialog = ({ universityId, trigger }: AddReminderDialogProps) => {
  const { createReminder } = useNotifications();
  const { lockedUniversities } = useUniversities();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('application_deadline');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>(
    universityId?.toString() || ''
  );
  const [deadlineDate, setDeadlineDate] = useState<Date>();
  const [selectedDays, setSelectedDays] = useState<number[]>([7, 3, 1]);

  const handleSubmit = async () => {
    if (!title || !deadlineDate) return;

    await createReminder.mutateAsync({
      title,
      description: description || null,
      reminder_type: reminderType,
      university_id: selectedUniversityId ? parseInt(selectedUniversityId) : null,
      deadline_date: format(deadlineDate, 'yyyy-MM-dd'),
      remind_days_before: selectedDays,
      is_active: true,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setReminderType('application_deadline');
    setSelectedUniversityId(universityId?.toString() || '');
    setDeadlineDate(undefined);
    setSelectedDays([7, 3, 1]);
    setOpen(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-bg text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create Deadline Reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Stanford Application Due"
              className="bg-secondary border-border"
            />
          </div>

          {/* Reminder Type */}
          <div className="space-y-2">
            <Label>Reminder Type</Label>
            <Select value={reminderType} onValueChange={(v) => setReminderType(v as ReminderType)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reminderTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* University (optional) */}
          {lockedUniversities.length > 0 && (
            <div className="space-y-2">
              <Label>Related University (Optional)</Label>
              <Select value={selectedUniversityId} onValueChange={setSelectedUniversityId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {lockedUniversities.map((locked) => (
                    <SelectItem key={locked.university_id} value={locked.university_id.toString()}>
                      {(locked as any).universities?.name || `University ${locked.university_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Deadline Date */}
          <div className="space-y-2">
            <Label>Deadline Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-secondary border-border',
                    !deadlineDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadlineDate ? format(deadlineDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadlineDate}
                  onSelect={setDeadlineDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Remind Days Before */}
          <div className="space-y-2">
            <Label>Remind Me</Label>
            <div className="grid grid-cols-2 gap-2">
              {reminderDayOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${option.value}`}
                    checked={selectedDays.includes(option.value)}
                    onCheckedChange={() => toggleDay(option.value)}
                  />
                  <label
                    htmlFor={`day-${option.value}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes..."
              className="bg-secondary border-border resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!title || !deadlineDate || selectedDays.length === 0 || createReminder.isPending}
            className="w-full gradient-bg text-white"
          >
            {createReminder.isPending ? 'Creating...' : 'Create Reminder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
