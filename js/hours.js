// 영업시간 (홈 사이드바의 오늘 영업시간, 공지사항, 오시는 길이 모두 여기 값을 씀)
//
// 영업시간이 바뀌면 이 파일만 고치면 돼요.
// - BUSINESS_HOURS: 요일별 [여는 시각, 닫는 시각]. 쉬는 요일은 null
// - SPECIAL_DAYS: 임시 휴무나 단축 영업 날짜. 지난 날짜는 지워도 돼요
//     { date: '2026-12-25', hours: null, note: '크리스마스' }            → 그날 휴무
//     { date: '2026-12-31', hours: ['11:30', '17:00'], note: '연말' }   → 그날만 시간 변경
// - 시간은 방문자가 어느 나라에 있든 한국 시간으로 계산해요

const BUSINESS_HOURS = {
  mon: ['11:30', '21:00'],
  tue: ['11:30', '18:00'],
  wed: ['11:30', '21:00'],
  thu: ['11:30', '21:00'],
  fri: ['11:30', '18:00'],
  sat: ['11:00', '19:30'],
  sun: ['11:00', '19:30'],
};

const SPECIAL_DAYS = [];

(function () {
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const DAY_KO = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
  const WEEK_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const range = (hours) => `${hours[0]}–${hours[1]}`;

  // 지금 한국 시간 { date: 'YYYY-MM-DD', y, m, d, dayKey, minutes }
  function seoulNow() {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).forEach((p) => { parts[p.type] = p.value; });
    const y = Number(parts.year);
    const m = Number(parts.month);
    const d = Number(parts.day);
    return { ...dayInfo(y, m, d, 0), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  // 오늘로부터 offset일 뒤의 날짜 정보
  function dayInfo(y, m, d, offset) {
    const dt = new Date(Date.UTC(y, m - 1, d + offset));
    const date = dt.toISOString().slice(0, 10);
    return { date, y, m, d, dayKey: DAY_KEYS[dt.getUTCDay()], month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  }

  // 그날의 영업시간 (임시 휴무·단축 영업 반영). 쉬면 null
  function hoursOn(info) {
    const special = SPECIAL_DAYS.find((s) => s.date === info.date);
    if (special) return { hours: special.hours, note: special.note || '' };
    return { hours: BUSINESS_HOURS[info.dayKey], note: '' };
  }

  // 같은 시간끼리 요일을 묶음 → [{ days: '월 · 수 · 목', keys: [...], hours }]
  function groupedHours() {
    const groups = [];
    WEEK_ORDER.forEach((key) => {
      const hours = BUSINESS_HOURS[key];
      const id = hours ? range(hours) : 'closed';
      let g = groups.find((x) => x.id === id);
      if (!g) {
        g = { id, keys: [], hours };
        groups.push(g);
      }
      g.keys.push(key);
    });
    return groups.map((g) => ({ ...g, days: g.keys.map((k) => DAY_KO[k]).join(' · ') }));
  }

  // 앞으로 30일 안의 임시 휴무·단축 영업
  function upcomingSpecialDays() {
    const now = seoulNow();
    const last = dayInfo(now.y, now.m, now.d, 30).date;
    return SPECIAL_DAYS
      .filter((s) => s.date >= now.date && s.date <= last)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /* ---------- 화면에 그리기 ---------- */

  // <b data-today-hours></b> → "영업시간 / 11:30 - 21:00" (오늘 요일 기준, 쉬는 날은 "영업시간 / 오늘 휴무")
  function renderToday() {
    const { hours, note } = hoursOn(seoulNow());
    const text = hours
      ? `영업시간 / ${hours[0]} - ${hours[1]}`
      : `영업시간 / 오늘 휴무${note ? ` (${note})` : ''}`;
    document.querySelectorAll('[data-today-hours]').forEach((node) => { node.textContent = text; });
  }

  // <ul data-hours-list="plain"></ul>  → <li>월 · 수 · 목 11:30–21:00</li> (공지사항)
  // <ul data-hours-list="table"></ul>  → <li><span>월 · 수 · 목</span> <time>…</time></li> (오시는 길, 오늘 요일 강조)
  function renderLists() {
    const todayKey = seoulNow().dayKey;
    const groups = groupedHours();
    const specials = upcomingSpecialDays();

    document.querySelectorAll('[data-hours-list]').forEach((list) => {
      const table = list.dataset.hoursList === 'table';
      const items = groups.map((g) => {
        const li = document.createElement('li');
        const time = g.hours ? range(g.hours) : '정기 휴무';
        if (table) {
          const span = document.createElement('span');
          span.textContent = g.days;
          const t = document.createElement('time');
          t.textContent = time;
          li.append(span, ' ', t);
          if (g.keys.includes(todayKey)) {
            li.classList.add('is-today');
            li.setAttribute('aria-label', `${g.days} ${time} (오늘)`);
          }
        } else {
          li.textContent = `${g.days} ${time}`;
        }
        return li;
      });

      specials.forEach((s) => {
        const [, mm, dd] = s.date.split('-');
        const li = document.createElement('li');
        li.className = 'is-special';
        li.textContent = `${Number(mm)}월 ${Number(dd)}일 ${s.hours ? range(s.hours) : '휴무'}${s.note ? ` (${s.note})` : ''}`;
        items.push(li);
      });

      list.replaceChildren(...items);
    });
  }

  renderLists();
  renderToday();
  // 1분마다 다시 계산 (페이지를 열어 둔 채로 자정이 지나 요일이 바뀌어도 맞게)
  setInterval(renderToday, 60 * 1000);
  // 탭을 다시 볼 때도 바로 갱신
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      renderToday();
      renderLists();
    }
  });
})();
