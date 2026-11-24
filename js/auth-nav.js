// 위쪽 메뉴(와 홈 사이드바)의 로그인 링크: 로그인하면 "내 계정"으로 바뀜
//
// 사용법: <a href="login.html" data-auth-link data-label-in="내 계정">로그인</a>
// - data-label-in: 로그인했을 때 글자 (로그아웃 상태 글자는 원래 적힌 글자)
// - Supabase를 불러오기 전에 지난번 상태(localStorage)로 먼저 바꿔서, "로그인" → "내 계정"으로 깜빡이는 걸 줄임

const HINT_KEY = 'onebottle-signed-in';
const links = [...document.querySelectorAll('[data-auth-link]')];
links.forEach((a) => { a.dataset.labelOut = a.textContent.trim(); });

function show(signedIn) {
  links.forEach((a) => {
    a.textContent = signedIn ? a.dataset.labelIn : a.dataset.labelOut;
    a.classList.toggle('is-signed-in', signedIn);
  });
}

function readHint() {
  try { return localStorage.getItem(HINT_KEY) === '1'; } catch (err) { return false; }
}

function writeHint(signedIn) {
  try {
    if (signedIn) localStorage.setItem(HINT_KEY, '1');
    else localStorage.removeItem(HINT_KEY);
  } catch (err) { /* 저장이 막힌 브라우저에서도 화면은 그대로 동작 */ }
}

if (links.length) {
  show(readHint());

  // Supabase는 필요한 뒤에 불러옴 (불러오지 못해도 링크는 "로그인"으로 그대로 동작)
  (async () => {
    try {
      const { getSupabaseOrNull } = await import('./supabase-auth.js');
      const sb = await getSupabaseOrNull();
      if (!sb) {
        show(false);
        return;
      }
      // 처음 한 번(INITIAL_SESSION)과 로그인·로그아웃할 때마다 불림
      sb.auth.onAuthStateChange((event, session) => {
        writeHint(Boolean(session));
        show(Boolean(session));
      });
    } catch (err) {
      console.error(err);
      show(false);
    }
  })();
}
