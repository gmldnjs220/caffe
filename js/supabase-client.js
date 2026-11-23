// Supabase 클라이언트 준비 (supabase-js CDN과 supabase-config.js 다음에 실행)
// 다른 스크립트에서는 window.sb 로 사용해요. 연결 정보가 없으면 window.sb 는 null 이에요.

(function () {
  const config = window.SUPABASE_CONFIG || {};
  const hasConfig = Boolean(config.url && config.key);

  if (!hasConfig) {
    console.info('[supabase] supabase-config.js 에 url/key 가 없어서 연결하지 않았어요.');
    window.sb = null;
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[supabase] supabase-js 라이브러리를 불러오지 못했어요.');
    window.sb = null;
    return;
  }

  // 로그인 상태 유지: 체크하면 localStorage, 해제하면 sessionStorage에 로그인 정보를 둠
  // (js/supabase-auth.js의 authStorage와 같은 규칙. 한쪽을 바꾸면 다른 쪽도 같이 바꿔 주세요)
  const KEEP_KEY = 'onebottle-keep-signed-in';
  const safe = (fn) => { try { return fn(); } catch (err) { return null; } };
  const keep = () => safe(() => localStorage.getItem(KEEP_KEY)) !== '0';
  const storage = {
    getItem: (key) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key)),
    setItem: (key, value) => safe(() => {
      const [use, drop] = keep() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      use.setItem(key, value);
      drop.removeItem(key);
    }),
    removeItem: (key) => safe(() => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }),
  };

  window.sb = window.supabase.createClient(config.url, config.key, {
    auth: { persistSession: true, autoRefreshToken: true, storage },
  });
}());
