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

// 01012345678 → 010-1234-5678
export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return digits;
}

function providersOf(user) {
  const list = (user.app_metadata && user.app_metadata.providers)
    || (user.identities || []).map((i) => i.provider);
  return list.length ? list : [(user.app_metadata && user.app_metadata.provider) || 'email'];
}

// 이메일·비밀번호로 가입한 계정인지
export function hasPassword(user) {
  return providersOf(user).includes('email');
}

function meta(user) {
  return user.user_metadata || {};
}

export function displayName(user) {
  const m = meta(user);
  return m.nickname || m.full_name || m.name || (user.email ? user.email.split('@')[0] : '손님');
}

// [{ label, value, note? }]
export function accountRows(user) {
  const m = meta(user);
  const providers = providersOf(user).map((p) => PROVIDERS[p] || p).join(', ');

  return [
    { label: '이름', value: m.nickname || m.full_name || m.name || '등록하지 않음' },
    {
      label: '이메일',
      value: user.email || '-',
      note: user.email ? (user.email_confirmed_at ? '인증됨' : '인증 전') : null,
    },
    { label: '전화번호', value: m.phone ? formatPhone(m.phone) : '등록하지 않음' },
    { label: '가입 방법', value: providers || '-' },
    { label: '가입일', value: formatDate(user.created_at, dateFmt) },
    { label: '마지막 로그인', value: formatDate(user.last_sign_in_at, dateTimeFmt) },
  ];
}
