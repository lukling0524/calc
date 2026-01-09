import React, { useState, useEffect, useMemo } from 'react';
import { type DayWorkData, type LeaveType, DAYS, WEEKLY_GOAL_MINS } from './types';
import { getDailyMinutes, formatMinutesToKorean, timeToMinutes, minutesToTime } from './timeUtils';
import styles from './App.module.scss';

const WorkCalculator: React.FC = () => {
  const [workData, setWorkData] = useState<DayWorkData[]>(() => {
    const saved = localStorage.getItem('work_data_v2');
    return saved
      ? JSON.parse(saved)
      : DAYS.map((day) => ({
          day,
          mode: 'range',
          start: '',
          end: '',
          manualHours: '',
          leaveType: 'none',
        }));
  });

  useEffect(() => {
    localStorage.setItem('work_data_v2', JSON.stringify(workData));
  }, [workData]);

  const totalMinutes = useMemo(
    () => workData.reduce((acc, d) => acc + getDailyMinutes(d), 0),
    [workData]
  );

  const remainingMinutes = WEEKLY_GOAL_MINS - totalMinutes;
  // 값이 입력된 날짜 수 (연차 포함)
  const filledCount = workData.filter((d) => getDailyMinutes(d) > 0).length;

const handleUpdate = (idx: number, updates: Partial<DayWorkData>) => {
  const newData = [...workData];
  const targetDay = { ...newData[idx], ...updates };
  newData[idx] = targetDay;

  // 1. 현재 수정 중인 날을 제외한 나머지 4일의 총합 구하기 (분 단위)
  const otherDaysMinutes = newData.reduce((acc, d, i) => 
    i === idx ? acc : acc + getDailyMinutes(d), 0
  );

  // 2. 40시간(2400분)을 채우기 위해 오늘 필요한 '목표 인정 시간'
  // 최대 9시간(540분)까지만 인정되므로 그 이상은 540분으로 제한
  const goalForToday = Math.min(540, Math.max(0, 2400 - otherDaysMinutes));

  // 3. 역산 조건: 4일치가 입력되었고, 현재 '시간 입력(range)' 모드이며, 연차가 아닐 때
  const filledDays = newData.filter((d, i) => i !== idx && getDailyMinutes(d) > 0).length;
  
  if (filledDays === 4 && targetDay.mode === 'range' && targetDay.leaveType === 'none') {
    
    // CASE A: 출근 시간만 입력했을 때 -> 퇴근 시간 계산
    if (updates.start && !targetDay.end) {
      const startMins = timeToMinutes(updates.start);
      let calculatedEnd = startMins + goalForToday;

      // 점심시간 보정: 출근이 12:30 이전이고, 계산된 퇴근이 12:30 이후라면 60분 추가
      if (startMins < 750 && (startMins + goalForToday) > 750) {
        calculatedEnd += 60;
      }
      newData[idx].end = minutesToTime(calculatedEnd);
    }

    // CASE B: 퇴근 시간만 입력했을 때 -> 출근 시간 계산
    else if (updates.end && !targetDay.start) {
      const endMins = timeToMinutes(updates.end);
      let calculatedStart = endMins - goalForToday;

      // 점심시간 보정: 퇴근이 13:30 이후이고, 계산된 출근이 13:30 이전이라면 60분 차감
      if (endMins > 810 && (endMins - goalForToday) < 810) {
        calculatedStart -= 60;
      }
      newData[idx].start = minutesToTime(calculatedStart);
    }
  }

  setWorkData(newData);
};

  const handleReset = () => {
    if (window.confirm('모든 데이터를 초기화할까요?')) {
      setWorkData(
        DAYS.map((day) => ({
          day,
          mode: 'range',
          start: '',
          end: '',
          manualHours: '',
          leaveType: 'none',
        }))
      );
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2>히히</h2>
          <button className={styles.resetIcon} onClick={handleReset}>
            초기화
          </button>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.stat}>
            <span>이번 주 합계</span>
            <strong>{formatMinutesToKorean(totalMinutes)}</strong>
          </div>
          <div className={`${styles.stat} ${remainingMinutes <= 0 ? styles.success : ''}`}>
            <span>남은 시간 (목표 40h)</span>
            <strong>
              {remainingMinutes <= 0 ? '목표 달성!' : formatMinutesToKorean(remainingMinutes)}
            </strong>
          </div>
        </div>
      </header>

      <main className={styles.list}>
        {workData.map((data, idx) => (
          <div key={data.day} className={styles.dayCard}>
            <div className={styles.cardHeader}>
              <span className={styles.dayBadge}>{data.day}</span>
              <div className={styles.actionGroup}>
                <select
                  value={data.leaveType}
                  onChange={(e) => handleUpdate(idx, { leaveType: e.target.value as LeaveType })}
                >
                  <option value='none'>출근</option>
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
                  {data.mode === 'range' ? '직접 입력' : '시간 입력'}
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
                    <span className={styles.divider}>~</span>
                    <input
                      type='time'
                      value={data.end}
                      onChange={(e) => handleUpdate(idx, { end: e.target.value })}
                    />
                  </div>
                ) : (
                  <input
                    type='number'
                    className={styles.manualInput}
                    placeholder='단위: 시간 (예: 8.5)'
                    value={data.manualHours}
                    onChange={(e) => handleUpdate(idx, { manualHours: e.target.value })}
                  />
                )}
              </div>
            )}

            <div className={styles.cardFooter}>
              인정 시간: <strong>{formatMinutesToKorean(getDailyMinutes(data))}</strong>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default WorkCalculator;
