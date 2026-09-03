const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface BackupWindowParts {
  weekdayIndex: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function formatTimeParts(reference: Date, timeZone: string): BackupWindowParts | null {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(reference);
  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  const weekday = lookup.get('weekday');
  const year = Number(lookup.get('year'));
  const month = Number(lookup.get('month'));
  const day = Number(lookup.get('day'));
  const hour = Number(lookup.get('hour'));
  const minute = Number(lookup.get('minute'));

  if (
    !weekday ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  const weekdayIndex = WEEKDAY_INDEX[weekday];
  if (weekdayIndex === undefined) {
    return null;
  }

  return { weekdayIndex, year, month, day, hour, minute };
}

export function isWithinBackupWindow(
  reference: Date,
  timeZone = 'Asia/Bangkok',
): boolean {
  const parts = formatTimeParts(reference, timeZone);
  if (!parts) return false;

  const isWeekday = parts.weekdayIndex >= 1 && parts.weekdayIndex <= 6;
  const isWithinHours = parts.hour >= 7 && parts.hour < 19;

  return isWeekday && isWithinHours;
}

export function getBackupRunKey(
  reference: Date,
  timeZone = 'Asia/Bangkok',
): string {
  const parts = formatTimeParts(reference, timeZone);
  if (!parts) {
    return reference.toISOString().replace(/[:.]/g, '-');
  }

  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    parts.year,
    pad(parts.month),
    pad(parts.day),
    pad(parts.hour),
    pad(parts.minute),
  ].join('-');
}
