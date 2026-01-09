import { type DayWorkData, MAX_DAILY_MINS } from './types';

const LUNCH_START = 12 * 60 + 30; // 12:30
const LUNCH_END = 13 * 60 + 30; // 13:30

// "09:00" -> 540
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hrs, mins] = time.split(':').map(Number);
  return hrs * 60 + mins;
};

// 540 -> "09:00"
export const minutesToTime = (mins: number): string => {
  const normalizedMins = Math.max(0, Math.min(1439, mins)); // 00:00 ~ 23:59 사이로 제한
  const h = Math.floor(normalizedMins / 60)
    .toString()
    .padStart(2, '0');
  const m = Math.round(normalizedMins % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
};

// 500 -> "8시간 20분"
export const formatMinutesToKorean = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  if (minutes > 0) return `${minutes}분`;
  return '0분';
};

export const getDailyMinutes = (data: DayWorkData): number => {
  if (data.leaveType === 'annual') return 8 * 60;
  if (data.leaveType === 'half') return 4 * 60;
  if (data.leaveType === 'half-half') return 2 * 60;
  if (data.mode === 'manual') return Math.round(parseFloat(data.manualHours || '0') * 60);

  const start = timeToMinutes(data.start);
  const end = timeToMinutes(data.end);
  if (end <= start) return 0;

  let duration = end - start;
  // 점심시간(12:30~13:30) 포함 여부 체크
  const overlap = Math.min(end, LUNCH_END) - Math.max(start, LUNCH_START);
  if (overlap > 0) duration -= 60;

  return Math.min(MAX_DAILY_MINS, duration);
};
