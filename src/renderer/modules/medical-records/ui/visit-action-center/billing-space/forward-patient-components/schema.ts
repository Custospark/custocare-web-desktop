import * as z from 'zod';

export const forwardPatientSchema = z.object({
  assigned_staff_id: z.number().min(1, 'Please select a staff member'),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});

export type ForwardPatientFormData = z.infer<typeof forwardPatientSchema>;

export type StaffFilterStatus = 'all' | 'busy' | 'on_duty' | 'available';

export interface ForwardPatientProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
  currentStaffId?: number;
  queueRedirectTo?: string;
}
