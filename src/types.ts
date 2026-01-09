export type LeaveType = 'none' | 'annual' | 'half' | 'half-half';
export type InputMode = 'range' | 'manual';

export interface DayWorkData {
  day: string;
  mode: InputMode;
  start: string;
  end: string;
  manualHours: string;
  leaveType: LeaveType;
}

export const DAYS = ['월', '화', '수', '목', '금'];
export const WEEKLY_GOAL_MINS = 40 * 60; // 2400분
export const MAX_DAILY_MINS = 9 * 60;    // 540분