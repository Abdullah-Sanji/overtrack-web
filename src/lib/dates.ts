import { addMonths, endOfMonth, format, parseISO, subMonths } from 'date-fns';
export const todayIso = () => format(new Date(), 'yyyy-MM-dd');
export const currentPeriod = () => format(new Date(), 'yyyy-MM');
export const previousPeriod = (p: string) => format(subMonths(parseISO(`${p}-01`), 1), 'yyyy-MM');
export const nextPeriod = (p: string) => format(addMonths(parseISO(`${p}-01`), 1), 'yyyy-MM');
export const periodBounds = (p: string) => ({ min: `${p}-01`, max: format(endOfMonth(parseISO(`${p}-01`)), 'yyyy-MM-dd') });
