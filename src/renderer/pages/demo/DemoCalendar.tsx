import { addDays, format, getDay, parse, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, ToolbarProps, View } from 'react-big-calendar';
// Import Hooks
import { usePagePerformance } from '@renderer/common/hooks';

import 'react-big-calendar/lib/css/react-big-calendar.css';

/** 1. 로컬라이저 설정 (한국어) - 사우디 : arSA*/
// const locales = { ko };
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales,
});

export default function DemoCalendar(): JSX.Element {
  const LOG_TITLE  = 'DemoCalendar';
  // 성능측정
  usePagePerformance(LOG_TITLE);

  const { defaultDate } = useMemo(() => ({ defaultDate: new Date() }), []);

  /** 2. 테스트용 이벤트 데이터 (allDay 대소문자 주의) */
  const events = [
    {
      id: 0,
      title: '오전 12시 이순신 외 3명',
      allDay: true,
      start: new Date(),
      end: new Date(),
    },
    {
      id: 1,
      title: '주간 업무 보고',
      allDay: false,
      start: new Date(),
      end: addDays(new Date(), 2),
    },
  ];

  const allViews: View[] = ['month', 'week', 'day', 'agenda'];

  /** 3. 캘린더 내부 포맷 정의 */
  const formats = {
    monthHeaderFormat: 'yyyy년 MM월',
    dayHeaderFormat: 'MM월 dd일(EEE)',
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'MM월 dd일', { locale: ko })} ~ ${format(end, 'MM월 dd일', { locale: ko })}`,
    timeGutterFormat: 'HH:mm',
  };

  /** 4. 커스텀 컴포넌트: 요일 헤더 (월화수목금토일) */
  const MyHeader = ({ label }: { label: string }) => {
    let color = '#333';
    if (label === '일') color = '#ff4d4f';
    if (label === '토') color = '#1890ff';
    return <span style={{ color, fontWeight: 'bold' }}>{label}</span>;
  };

  /** 5. 커스텀 컴포넌트: 날짜 숫자 (1, 2, 3...) */
  const MyDateHeader = ({ label, date }: { label: string; date: Date }) => {
    const day = getDay(date); // 0: 일요일, 6: 토요일
    let color = '#333';
    if (day === 0) color = '#ff4d4f';
    else if (day === 6) color = '#1890ff';

    return (
      <button className="rbc-button-link" style={{ color }}>
        {label}
      </button>
    );
  };

  return (
    <div className="contents" style={{ padding: '20px', backgroundColor: '#fff' }}>
      <div className="reservation-list" style={{ height: '90vh' }}>
        <Calendar
          culture="ko"
          localizer={localizer}
          defaultDate={defaultDate}
          events={events}
          views={allViews}
          defaultView="month"
          formats={formats}
          selectable={true}
          step={30}
          timeslots={2}
          style={{ height: '100%' }}
          /** 이벤트 스타일링 */
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.allDay ? '#fadb14' : '#1890ff',
              color: event.allDay ? '#000' : '#fff',
              borderRadius: '4px',
              border: 'none',
              fontSize: '13px',
            },
          })}
          /** 컴포넌트 교체 */
          components={{
            toolbar: CustomToolbar,
            month: {
              header: MyHeader,
              dateHeader: MyDateHeader,
            },
          }}
          onSelectEvent={(e) => console.log('선택된 이벤트:', e)}
          onSelectSlot={(slot) => console.log('선택된 슬롯:', slot)}
        />
      </div>
    </div>
  );
}

/** 6. 커스텀 툴바 컴포넌트 */
function CustomToolbar(props: ToolbarProps) {
  const { date, view, onNavigate, onView } = props;

  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => onNavigate(action);
  const changeView = (v: View) => onView(v);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  return (
    <div className="rbc-toolbar" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
      <span className="rbc-btn-group">
        <button type="button" onClick={() => navigate('PREV')}>이전</button>
        <button type="button" onClick={() => navigate('TODAY')}>오늘</button>
        <button type="button" onClick={() => navigate('NEXT')}>다음</button>
      </span>

      <span className="rbc-toolbar-label" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
        {view === 'month' && `${year}년 ${month}월`}
        {view === 'week' && `${year}년 ${month}월`}
        {view === 'day' && `${month}월 ${day}일 (${weekDay}요일)`}
        {view === 'agenda' && '예약 목록'}
      </span>

      <span className="rbc-btn-group">
        <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => changeView('month')}>월</button>
        <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => changeView('week')}>주</button>
        <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => changeView('day')}>일</button>
        <button type="button" className={view === 'agenda' ? 'rbc-active' : ''} onClick={() => changeView('agenda')}>목록</button>
      </span>
    </div>
  );
}