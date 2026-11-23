// 내 계정 화면에 보여 줄 가입 정보 (Supabase 사용자 정보 → 화면용 글자)
// Supabase를 직접 부르지 않는 순수 함수만 모아 둬서, 따로 시험해 보기 쉬움

const PROVIDERS = {
  email: '이메일 · 비밀번호',
  google: '구글 계정',
};

const dateFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long' });
const dateTimeFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' });

function formatDate(value, fmt) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? fmt.format(d) : '-';
}

function providers(user) {
  const list = (user.app_metadata && user.app_metadata.providers)
    || (user.identities || []).map((i) => i.provider);
  return list && list.length ? list : [(user.app_metadata && user.app_metadata.provider) || 'email'];
}

// 이메일·비밀번호로 가입한 계정인지
export function hasPassword(user) {
  return providers(user).includes('email');
}

// 가입할 때 적은 이름(nickname). 구글 가입이면 구글 이름
function savedName(user) {
  const meta = user.user_metadata || {};
  return meta.nickname || meta.full_name || meta.name || '';
}

export function displayName(user) {
  return savedName(user) || (user.email ? user.email.split('@')[0] : '손님');
}

// [{ label, value, note? }]
export function accountRows(user) {
  const meta = user.user_metadata || {};
  const rows = [
    { label: '이름', value: savedName(user) || '등록하지 않음' },
    {
      label: '이메일',
      value: user.email || '-',
      note: user.email ? (user.email_confirmed_at ? '인증됨' : '인증 전') : null,
    },
  ];
  if (meta.phone) rows.push({ label: '전화번호', value: meta.phone });
  rows.push(
    { label: '가입 방법', value: providers(user).map((p) => PROVIDERS[p] || p).join(', ') },
    { label: '가입일', value: formatDate(user.created_at, dateFmt) },
    { label: '마지막 로그인', value: formatDate(user.last_sign_in_at, dateTimeFmt) },
  );
  return rows;
}
