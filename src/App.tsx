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
    const saved = localStorage.getItem('work_data_v3');
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
    localStorage.setItem('work_data_v3', JSON.stringify(workData));
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

    // 역산 로직 (4일치 입력 시 작동)
    if (otherFilledCount === 4 && currentDay.leaveType === 'none') {
      const otherTotal = newData.reduce(
        (acc, d, i) => (i === idx ? acc : acc + getDailyMinutes(d)),
        0
      );
      const targetMins = Math.max(0, WEEKLY_GOAL_MINS - otherTotal);

      // 시간 입력 모드일 때
      if (currentDay.mode === 'range') {
        if (updates.start) {
          const startMins = timeToMinutes(updates.start);
          newData[idx].end = minutesToTime(calculateReverseTime(startMins, targetMins, 'end'));
        } else if (updates.end) {
          const endMins = timeToMinutes(updates.end);
          newData[idx].start = minutesToTime(calculateReverseTime(endMins, targetMins, 'start'));
        }
      }
      // 직접 입력 모드일 때: 남은 시간을 자동으로 채워줌
      else if (currentDay.mode === 'manual' && !updates.manualHours && !updates.manualMinutes) {
        newData[idx].manualHours = Math.floor(targetMins / 60).toString();
        newData[idx].manualMinutes = (targetMins % 60).toString();
      }
    }

    setWorkData(newData);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <h1>주간 업무 계산기</h1>
          <button
            onClick={() => {
              if (confirm('초기화하시겠습니까?')) {
                localStorage.clear();
                location.reload();
              }
            }}
            className={styles.resetBtn}
          >
            초기화
          </button>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.stat}>
            <span>이번 주 합계</span>
            <strong>{formatMinutesToKorean(totalMinutes)}</strong>
          </div>
          <div className={styles.stat}>
            <span>남은 시간</span>
            <strong className={remainingMinutes === 0 ? styles.done : ''}>
              {remainingMinutes === 0 ? '목표 달성!' : formatMinutesToKorean(remainingMinutes)}
            </strong>
          </div>
        </div>
      </header>

      <main className={styles.list}>
        {workData.map((data, idx) => (
          <div key={data.day} className={styles.dayCard}>
            <div className={styles.cardHeader}>
              <span className={styles.dayName}>{data.day}요일</span>
              <div className={styles.toggleGroup}>
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
                  onClick={() =>
                    handleUpdate(idx, { mode: data.mode === 'range' ? 'manual' : 'range' })
                  }
                >
                  {data.mode === 'range' ? '직접입력' : '시간입력'}
                </button>
              </div>
            </div>

            {data.leaveType === 'none' && (
              <div className={styles.inputBody}>
                {data.mode === 'range' ? (
                  <div className={styles.timeGroup}>
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
                ) : (
                  <div className={styles.manualGroup}>
                    <div className={styles.inputWithLabel}>
                      <input
                        type='number'
                        placeholder='0'
                        value={data.manualHours}
                        onChange={(e) => handleUpdate(idx, { manualHours: e.target.value })}
                      />
                      <span>시간</span>
                    </div>
                    <div className={styles.inputWithLabel}>
                      <input
                        type='number'
                        placeholder='0'
                        value={data.manualMinutes}
                        onChange={(e) => handleUpdate(idx, { manualMinutes: e.target.value })}
                      />
                      <span>분</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className={styles.dayTotal}>
              인정 시간: {formatMinutesToKorean(getDailyMinutes(data))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default WorkCalculator;
