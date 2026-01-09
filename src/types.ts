export type LeaveType = 'none' | 'annual' | 'half' | 'half-half';
export type InputMode = 'range' | 'manual';

export interface DayWorkData {
  day: string;
  mode: InputMode;
  start: string;
  end: string;
  manualHours: string; // 직접 입력 - '시간'
  manualMinutes: string; // 직접 입력 - '분' (추가)
  leaveType: LeaveType;
}

export const DAYS = ['월', '화', '수', '목', '금'];
export const WEEKLY_GOAL_MINS = 40 * 60; // 2400분
export const MAX_DAILY_MINS = 9 * 60; // 540분
export const LUNCH_START = 12 * 60 + 30; // 12:30
export const LUNCH_END = 13 * 60 + 30; // 13:30
