// Supabase 로그인 연결 (로그인 페이지와 모든 페이지의 위쪽 메뉴가 같이 씀)
// - 연결 정보는 js/supabase-config.js (메뉴 페이지와 같은 파일)
// - supabase-js 버전은 menu.html의 CDN 주소와 같은 숫자로 맞춰 주세요
// - 메뉴 페이지처럼 js/supabase-client.js가 먼저 window.sb를 만들어 둔 페이지에서는 그걸 그대로 씀
//   (같은 페이지에 로그인 연결이 두 개 생기면 서로 로그인 정보를 덮어쓸 수 있어서)

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import './supabase-config.js';

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

let client;

// Supabase 연결을 돌려줌. 연결 정보(url/key)가 없으면 null
// 여러 파일에서 불러도 연결은 한 번만 만들어짐
export function getSupabaseOrNull() {
  if (client !== undefined) return client;
  if (window.sb) {
    client = window.sb;
    return client;
  }
  const config = window.SUPABASE_CONFIG || {};
  client = config.url && config.key
    ? createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: authStorage },
    })
    : null;
  return client;
}
