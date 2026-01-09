import React, { useState, useEffect, useMemo } from 'react';
import { type DayWorkData, type LeaveType, DAYS, WEEKLY_GOAL_MINS } from './types';
import {
  getDailyMinutes,
  formatMinutesToKorean,
  timeToMinutes,
  minutesToTime,
  calculateReverseTime,
} from './timeUtils';
import styles from './App.module.scss';

const WorkCalculator: React.FC = () => {
  const [workData, setWorkData] = useState<DayWorkData[]>(() => {
    const saved = localStorage.getItem('work_calc_vfinal');
    return saved
      ? JSON.parse(saved)
      : DAYS.map((day) => ({
          day,
          mode: 'range',
          start: '',
          end: '',
          manualHours: '',
          manualMinutes: '',
          leaveType: 'none',
        }));
  });

  useEffect(() => {
    localStorage.setItem('work_calc_vfinal', JSON.stringify(workData));
  }, [workData]);

  const totalMinutes = useMemo(() => {
    const sum = workData.reduce((acc, d) => acc + getDailyMinutes(d), 0);
    return Math.min(WEEKLY_GOAL_MINS, sum);
  }, [workData]);

  const remainingMinutes = Math.max(0, WEEKLY_GOAL_MINS - totalMinutes);

  const handleUpdate = (idx: number, updates: Partial<DayWorkData>) => {
    const newData = [...workData];
    const currentDay = { ...newData[idx], ...updates };
    newData[idx] = currentDay;

    const otherFilledCount = newData.filter((d, i) => i !== idx && getDailyMinutes(d) > 0).length;

    // 4일 입력 후 나머지 1일 자동 역산 (주 40시간 맞추기)
    if (
      otherFilledCount === 4 &&
      currentDay.leaveType !== 'annual' &&
      currentDay.mode === 'range'
    ) {
      const otherTotal = newData.reduce(
        (acc, d, i) => (i === idx ? acc : acc + getDailyMinutes(d)),
        0
      );
      let targetForTodayWork = Math.max(0, WEEKLY_GOAL_MINS - otherTotal);

      if (currentDay.leaveType === 'half') targetForTodayWork -= 240;
      if (currentDay.leaveType === 'half-half') targetForTodayWork -= 120;
      targetForTodayWork = Math.max(0, targetForTodayWork);

      if (updates.start) {
        newData[idx].end = minutesToTime(
          calculateReverseTime(timeToMinutes(updates.start), targetForTodayWork, 'end')
        );
      } else if (updates.end) {
        newData[idx].start = minutesToTime(
          calculateReverseTime(timeToMinutes(updates.end), targetForTodayWork, 'start')
        );
      }
    }
    setWorkData(newData);
  };

  // [8시간 계산] 버튼 로직: 오늘 총합(인정+실무)을 8시간(480분)으로 맞춤
  const fitTo8Hours = (idx: number) => {
    const data = workData[idx];
    if (data.mode !== 'range' || data.leaveType === 'annual') return;

    let leaveCredit = 0;
    if (data.leaveType === 'half') leaveCredit = 240;
    if (data.leaveType === 'half-half') leaveCredit = 120;

    const neededWorkMins = Math.max(0, 480 - leaveCredit);
    const newData = [...workData];

    if (data.start) {
      newData[idx].end = minutesToTime(
        calculateReverseTime(timeToMinutes(data.start), neededWorkMins, 'end')
      );
    } else if (data.end) {
      newData[idx].start = minutesToTime(
        calculateReverseTime(timeToMinutes(data.end), neededWorkMins, 'start')
      );
    }
    setWorkData(newData);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <h1>💬</h1>
          <button
            onClick={() => {
              if (confirm('초기화?')) {
                localStorage.clear();
                location.reload();
              }
            }}
            className={styles.resetBtn}
          >
            초기화
          </button>
        </div>
        <div className={styles.summary}>
          <div className={styles.stat}>
            <span>합계</span>
            <strong>{formatMinutesToKorean(totalMinutes)}</strong>
          </div>
          <div className={styles.stat}>
            <span>남은 시간</span>
            <strong className={remainingMinutes === 0 ? styles.done : ''}>
              {remainingMinutes === 0 ? '달성!' : formatMinutesToKorean(remainingMinutes)}
            </strong>
          </div>
        </div>
      </header>

      <main className={styles.list}>
        {workData.map((data, idx) => (
          <div key={data.day} className={styles.dayCard}>
            <div className={styles.cardHeader}>
              <span className={styles.dayLabel}>{data.day}요일</span>
              <div className={styles.actions}>
                <select
                  value={data.leaveType}
                  onChange={(e) => handleUpdate(idx, { leaveType: e.target.value as LeaveType })}
                >
                  <option value='none'>정상</option>
                  <option value='annual'>연차</option>
                  <option value='half'>반차</option>
                  <option value='half-half'>반반차</option>
                </select>
                <button
                  className={styles.modeBtn}
                  onClick={() =>
                    handleUpdate(idx, { mode: data.mode === 'range' ? 'manual' : 'range' })
                  }
                >
                  {data.mode === 'range' ? '직접' : '시각'}
                </button>
              </div>
            </div>

            {data.leaveType !== 'annual' && (
              <div className={styles.inputBody}>
                {data.mode === 'range' ? (
                  <div className={styles.rangeRow}>
                    <div className={styles.timeInputs}>
                      <input
                        type='time'
                        value={data.start}
                        onChange={(e) => handleUpdate(idx, { start: e.target.value })}
                      />
                      <span>~</span>
                      <input
                        type='time'
                        value={data.end}
                        onChange={(e) => handleUpdate(idx, { end: e.target.value })}
                      />
                    </div>
                    {(data.leaveType === 'half' || data.leaveType === 'half-half') && (
                      <button className={styles.fitBtn} onClick={() => fitTo8Hours(idx)}>
                        8시간 맞추기
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.manualInputs}>
                    <input
                      type='number'
                      placeholder='시간'
                      value={data.manualHours}
                      onChange={(e) => handleUpdate(idx, { manualHours: e.target.value })}
                    />
                    <input
                      type='number'
                      placeholder='분'
                      value={data.manualMinutes}
                      onChange={(e) => handleUpdate(idx, { manualMinutes: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
            <div className={styles.subtotal}>
              일 인정 시간: {formatMinutesToKorean(getDailyMinutes(data))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default WorkCalculator;
