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

// 일일 인정 시간 계산 (휴가 + 실근무, 최대 9시간 절삭)
export const getDailyMinutes = (data: DayWorkData): number => {
  let leaveCredit = 0;
  if (data.leaveType === 'annual') return 8 * 60;
  if (data.leaveType === 'half') leaveCredit = 4 * 60;
  if (data.leaveType === 'half-half') leaveCredit = 2 * 60;

  let workMinutes = 0;
  if (data.mode === 'manual') {
    workMinutes = parseInt(data.manualHours || '0') * 60 + parseInt(data.manualMinutes || '0');
  } else {
    const start = timeToMinutes(data.start);
    const end = timeToMinutes(data.end);
    if (end > start) {
      workMinutes = end - start;
      if (start < LUNCH_END && end > LUNCH_START) workMinutes -= 60;
    }
  }

  // 휴가 인정분 + 실제 근무분 합산 후 9시간(540분)으로 절삭
  return Math.min(MAX_DAILY_MINS, leaveCredit + Math.max(0, workMinutes));
};

// 역산 시각 계산 (점심시간 보정 포함)
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
