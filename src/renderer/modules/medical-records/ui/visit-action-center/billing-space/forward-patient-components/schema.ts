import * as z from 'zod';

import { CareDeliveryWorkflow } from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

const noteField = z.string().max(500, 'Note cannot exceed 500 characters').optional();

const forwardStaffSchema = z.object({
  forwarding_mode: z.literal('staff'),
  assigned_staff_id: z.number().min(1, 'Please select a staff member'),
  note: noteField,
});

const forwardWorkflowSchema = z.object({
  forwarding_mode: z.literal('workflow'),
  care_delivery_workflow: z.nativeEnum(CareDeliveryWorkflow, {
    message: 'Please select where to send this patient',
  }),
  note: noteField,
});

export const forwardPatientSchema = z.discriminatedUnion('forwarding_mode', [
  forwardStaffSchema,
  forwardWorkflowSchema,
]);

export type ForwardPatientFormData = z.infer<typeof forwardPatientSchema>;

export type StaffFilterStatus = 'all' | 'busy' | 'on_duty' | 'available';

export interface ForwardPatientProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
  currentStaffId?: number;
  queueRedirectTo?: string;
}
