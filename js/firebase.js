// Firebase 연결 (로그인 페이지와 모든 페이지의 위쪽 메뉴가 같이 씀)
// - Firebase SDK는 인터넷(CDN)에서 불러옴. 버전을 올릴 때는 아래 주소들과 js/login.js의 숫자를 같이 바꿔 주세요
// - 설정값은 js/firebase-config.js. 비어 있으면 Firebase Hosting이 주는 자동 설정(/__/firebase/init.json)을 씀

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

async function loadConfig() {
  if (firebaseConfig.apiKey) return firebaseConfig;
  try {
    const res = await fetch('/__/firebase/init.json');
    if (res.ok) return await res.json();
  } catch (err) { /* 로컬 개발 서버에는 이 주소가 없음 */ }
  return null;
}

let authPromise = null;

// 로그인 기능(auth)을 돌려줌. 설정이 없으면 null
// 여러 파일에서 불러도 Firebase는 한 번만 연결됨
export function getAuthOrNull() {
  if (!authPromise) {
    authPromise = loadConfig().then((config) => {
      if (!config || !config.apiKey) return null;
      const auth = getAuth(initializeApp(config));
      auth.languageCode = 'ko'; // 비밀번호 재설정 메일 등을 한국어로
      return auth;
    });
  }
  return authPromise;
}
