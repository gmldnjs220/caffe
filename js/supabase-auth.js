// Supabase 로그인 연결 (로그인 페이지와 모든 페이지의 위쪽 메뉴가 같이 씀)
// - 연결 정보는 js/supabase-config.js (메뉴 페이지와 같은 파일)
// - supabase-js는 menu.html과 같은 한 파일짜리(UMD) 주소를 써서, 한 번 받으면 브라우저 캐시를 같이 씀
//   (예전 +esm 주소는 작은 파일을 여러 개 이어 받아서 느렸음). 버전을 바꾸면 menu.html도 같이 바꿔 주세요
// - 메뉴 페이지처럼 js/supabase-client.js가 먼저 window.sb를 만들어 둔 페이지에서는 그걸 그대로 씀
//   (같은 페이지에 로그인 연결이 두 개 생기면 서로 로그인 정보를 덮어쓸 수 있어서)

import './supabase-config.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

/* ---------- 로그인 상태 유지 ---------- */
// 체크: 브라우저를 닫았다 열어도 로그인 유지(localStorage)
// 해제: 브라우저(탭)를 닫으면 로그아웃(sessionStorage)
// js/supabase-client.js에도 같은 규칙이 있어요. 한쪽을 바꾸면 다른 쪽도 같이 바꿔 주세요.

export const KEEP_KEY = 'onebottle-keep-signed-in';

function safe(fn, fallback = null) {
  try { return fn(); } catch (err) { return fallback; }
}

export function readKeep() {
  return safe(() => localStorage.getItem(KEEP_KEY) !== '0', true);
}

export function writeKeep(on) {
  safe(() => localStorage.setItem(KEEP_KEY, on ? '1' : '0'));
}

export const authStorage = {
  getItem: (key) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key)),
  setItem: (key, value) => safe(() => {
    const [keep, drop] = readKeep() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
    keep.setItem(key, value);
    drop.removeItem(key);
  }),
  removeItem: (key) => safe(() => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }),
};

/* ---------- 라이브러리 불러오기 ---------- */

let sdkPromise;

// supabase-js를 필요할 때 한 번만 불러옴 (이미 있으면 그대로 씀)
function loadSdk() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    return Promise.resolve(window.supabase);
  }
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve(window.supabase);
      script.onerror = () => {
        sdkPromise = null; // 다음에 다시 시도할 수 있게
        reject(new Error('supabase-js를 불러오지 못했어요.'));
      };
      document.head.append(script);
    });
  }
  return sdkPromise;
}

/* ---------- 연결 ---------- */

let clientPromise;

// Supabase 연결을 돌려줌(Promise). 연결 정보(url/key)가 없으면 null
// 여러 파일에서 불러도 연결은 한 번만 만들어짐
export function getSupabaseOrNull() {
  if (!clientPromise) {
    clientPromise = (async () => {
      if (window.sb) return window.sb;
      const config = window.SUPABASE_CONFIG || {};
      if (!config.url || !config.key) return null;
      const { createClient } = await loadSdk();
      return createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: authStorage },
      });
    })();
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

// 이 브라우저에 저장된 로그인 정보가 있는지 (Supabase가 sb-...-auth-token 이름으로 저장함)
export function hasStoredSession() {
  return safe(() => [localStorage, sessionStorage].some((store) => (
    Object.keys(store).some((key) => /^sb-.+-auth-token$/.test(key))
  )), false);
}
