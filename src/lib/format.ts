import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
export const formatHours = (n: number) => n.toFixed(2);
export const formatPeriod = (p: string) => format(parseISO(`${p}-01`), 'LLLL yyyy');
export const formatDate = (d: string) => format(parseISO(d), 'd MMM yyyy');
export const formatDateTime = (iso: string, tz = Intl.DateTimeFormat().resolvedOptions().timeZone) =>
  formatInTimeZone(parseISO(iso), tz, 'd MMM yyyy, HH:mm');
export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;
export const initials = (p: { firstName: string; lastName: string }) =>
  `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
