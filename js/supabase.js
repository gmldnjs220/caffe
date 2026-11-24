// Supabase 연결 (로그인 페이지와 모든 페이지의 위쪽 메뉴가 같이 씀)
// - 연결 정보는 js/supabase-config.js (메뉴 페이지와 같은 파일)
// - 메뉴 페이지처럼 js/supabase-client.js 가 이미 연결해 둔 경우(window.sb)에는 그걸 그대로 씀
// - supabase-js 버전을 올릴 때는 아래 주소와 menu.html 의 주소를 같이 바꿔 주세요

import './supabase-config.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

// "로그인 상태 유지"를 끄고 로그인했을 때: 브라우저(탭)를 닫으면 로그아웃
export const KEEP_KEY = 'onebottle-keep-signed-in';
const ALIVE_KEY = 'onebottle-session-alive';

function readKeep() {
  try { return localStorage.getItem(KEEP_KEY) !== '0'; } catch (err) { return true; }
}

// 로그인한 직후 부름: 이번 탭이 살아 있다는 표시
export function markSessionAlive() {
  try { sessionStorage.setItem(ALIVE_KEY, '1'); } catch (err) { /* 저장이 막혀도 동작 */ }
}

function isSessionAlive() {
  try { return sessionStorage.getItem(ALIVE_KEY) === '1'; } catch (err) { return true; }
}

let clientPromise = null;

// Supabase 클라이언트를 돌려줌. 연결 정보가 없으면 null
// 여러 파일에서 불러도 한 번만 연결됨
export function getSupabaseOrNull() {
  if (!clientPromise) {
    clientPromise = (async () => {
      let sb = window.sb;
      if (!sb) {
        const config = window.SUPABASE_CONFIG || {};
        if (!config.url || !config.key) return null;
        const { createClient } = await import(SDK_URL);
        sb = createClient(config.url, config.key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        window.sb = sb;
      }

      // 유지 안 함으로 로그인했는데 브라우저를 닫았다 다시 열었으면 로그아웃
      if (!readKeep() && !isSessionAlive()) {
        const { data } = await sb.auth.getSession();
        if (data.session) await sb.auth.signOut({ scope: 'local' });
      } else {
        markSessionAlive();
      }
      return sb;
    })();
  }
  return clientPromise;
}
