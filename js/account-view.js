// 내 계정 화면에 보여 줄 가입 정보 (Firebase 사용자 정보 → 화면용 글자)
// Firebase를 직접 부르지 않는 순수 함수만 모아 둬서, 따로 시험해 보기 쉬움

const PROVIDERS = {
  password: '이메일 · 비밀번호',
  'google.com': '구글 계정',
};

const dateFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long' });
const dateTimeFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' });

function formatDate(value, fmt) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? fmt.format(d) : '-';
}

// 이메일·비밀번호로 가입(또는 비밀번호를 추가)한 계정인지
export function hasPassword(user) {
  return (user.providerData || []).some((p) => p.providerId === 'password');
}

export function displayName(user) {
  return user.displayName || (user.email ? user.email.split('@')[0] : '손님');
}

// [{ label, value, note? }]
export function accountRows(user) {
  const providers = (user.providerData || [])
    .map((p) => PROVIDERS[p.providerId] || p.providerId)
    .join(', ');

  return [
    { label: '이름', value: user.displayName || '등록하지 않음' },
    {
      label: '이메일',
      value: user.email || '-',
      note: user.email ? (user.emailVerified ? '인증됨' : '인증 전') : null,
    },
    { label: '가입 방법', value: providers || '-' },
    { label: '가입일', value: formatDate(user.metadata && user.metadata.creationTime, dateFmt) },
    { label: '마지막 로그인', value: formatDate(user.metadata && user.metadata.lastSignInTime, dateTimeFmt) },
  ];
}
