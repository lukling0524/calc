import { type DayWorkData, MAX_DAILY_MINS, LUNCH_START, LUNCH_END } from './types';

export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hrs, mins] = time.split(':').map(Number);
  return hrs * 60 + mins;
};

export const minutesToTime = (mins: number): string => {
  const normalizedMins = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(normalizedMins / 60)
    .toString()
    .padStart(2, '0');
  const m = Math.round(normalizedMins % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
};

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

  // 직접 입력 모드: 시간과 분을 합산 후 9시간 절삭
  if (data.mode === 'manual') {
    const h = parseInt(data.manualHours || '0');
    const m = parseInt(data.manualMinutes || '0');
    return Math.min(MAX_DAILY_MINS, h * 60 + m);
  }

  const start = timeToMinutes(data.start);
  const end = timeToMinutes(data.end);
  if (end <= start) return 0;

  let duration = end - start;
  if (start < LUNCH_END && end > LUNCH_START) {
    duration -= 60;
  }
  return Math.min(MAX_DAILY_MINS, Math.max(0, duration));
};

export const calculateReverseTime = (
  baseTimeMins: number,
  targetMins: number,
  type: 'start' | 'end'
): number => {
  if (type === 'end') {
    let endTime = baseTimeMins + targetMins;
    if (baseTimeMins < LUNCH_START && endTime > LUNCH_START) endTime += 60;
    return endTime;
  } else {
    let startTime = baseTimeMins - targetMins;
    if (baseTimeMins > LUNCH_END && startTime < LUNCH_END) startTime -= 60;
    return startTime;
  }
};
