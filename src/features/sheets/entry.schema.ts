import { z } from 'zod';
import { periodBounds } from '@/lib/dates';

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const deriveHours = (start: string, end: string) =>
  Math.round(((toMin(end) - toMin(start)) / 60) * 4) / 4;
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a time');

export function entrySchema(period: string, today: string) {
  const { min, max } = periodBounds(period);
  return z
    .object({
      date: z
        .string()
        .min(1, 'Pick a date')
        .refine((d) => d >= min && d <= max, `Date must be inside ${period}`)
        .refine((d) => d <= today, 'Date cannot be in the future'),
      startTime: time,
      endTime: time,
      hours: z
        .number()
        .min(0.25)
        .max(16)
        .refine((n) => Math.abs(n * 4 - Math.round(n * 4)) < 1e-9, 'Use 0.25 steps')
        .optional(),
      overtimeTypeId: z.string().uuid('Pick an overtime type'),
      workItem: z.string().trim().min(1, 'Enter a work item').max(120),
      workItemUrl: z
        .string()
        .trim()
        .url('Enter a valid URL')
        .refine((u) => /^https?:\/\//i.test(u), 'Must start with http:// or https://')
        .or(z.literal(''))
        .transform((v) => (v === '' ? null : v)),
      description: z.string().trim().min(10, 'Describe the work (at least 10 characters)').max(1000),
      requestedById: z.string().uuid().nullable().optional(),
    })
    .refine((v) => deriveHours(v.startTime, v.endTime) > 0, {
      path: ['endTime'],
      message: 'End time must be after start time',
    });
}
export type EntryFormValues = z.input<ReturnType<typeof entrySchema>>;
