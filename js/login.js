// 로그인 페이지: Firebase Authentication (이메일/비밀번호, 구글 계정)
// - Firebase SDK는 인터넷(CDN)에서 불러옴. 버전을 올릴 때는 아래 두 주소의 숫자를 같이 바꿔 주세요
// - 설정값은 js/firebase-config.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const $ = (sel) => document.querySelector(sel);

const root = $('.auth');
const title = $('.js-title');
const setupAlert = $('.js-setup');
const signedOut = $('.js-signed-out');
const signedIn = $('.js-signed-in');
const msg = $('.js-msg');
const loginForm = $('.js-login-form');
const signupForm = $('.js-signup-form');
const tabs = [...document.querySelectorAll('.js-tab')];

/* ---------- 안내 문구 ---------- */

// Firebase 오류 코드 → 한국어 안내
const ERRORS = {
  'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
  'auth/missing-email': '이메일을 입력해 주세요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/invalid-login-credentials': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/user-not-found': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/user-disabled': '사용할 수 없는 계정이에요. 매장에 문의해 주세요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
  'auth/popup-blocked': '팝업이 차단됐어요. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요.',
  'auth/account-exists-with-different-credential': '이 이메일은 다른 방법으로 가입돼 있어요. 이메일과 비밀번호로 로그인해 주세요.',
  // 아래는 사이트 설정 문제 (Firebase 콘솔에서 고쳐야 함)
  'auth/operation-not-allowed': '이 로그인 방법이 아직 켜져 있지 않아요. (관리자: Firebase 콘솔 → Authentication → 로그인 방법)',
  'auth/unauthorized-domain': '이 주소에서는 로그인할 수 없어요. (관리자: Firebase 콘솔 → Authentication → 설정 → 승인된 도메인)',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': '로그인 설정값(apiKey)이 올바르지 않아요. (관리자: js/firebase-config.js 확인)',
  'auth/configuration-not-found': 'Firebase에서 로그인(Authentication)이 아직 시작되지 않았어요. (관리자: Firebase 콘솔 → Authentication → 시작하기)',
};
// 사용자가 직접 닫은 경우 등 안내가 필요 없는 오류
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

function show(text, type = 'error') {
  msg.textContent = text;
  msg.dataset.type = type;
  msg.hidden = !text;
}

function showError(err) {
  if (SILENT.has(err.code)) return;
  console.error(err);
  show(ERRORS[err.code] || `로그인 중 문제가 생겼어요. 잠시 후 다시 해 주세요. (${err.code || err.message})`);
}

/* ---------- 탭: 로그인 / 회원가입 ---------- */

function selectTab(name, keepMessage = false) {
  tabs.forEach((tab) => {
    const on = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  });
  loginForm.hidden = name !== 'login';
  signupForm.hidden = name !== 'signup';
  title.textContent = name === 'login' ? '로그인' : '회원가입';
  if (!keepMessage) show('');
}

tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));

// 키보드 좌우 화살표로 탭 이동
$('.auth-tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const next = tabs[(tabs.indexOf(document.activeElement) + 1) % tabs.length];
  next.focus();
  selectTab(next.dataset.tab);
});

/* ---------- 버튼 잠금 (요청 중 두 번 누르지 않게) ---------- */

async function busy(task) {
  const buttons = root.querySelectorAll('button');
  buttons.forEach((b) => { b.disabled = true; });
  root.setAttribute('aria-busy', 'true');
  try {
    await task();
  } catch (err) {
    showError(err);
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
    root.setAttribute('aria-busy', 'false');
  }
}

/* ---------- 로그인 상태 화면 ---------- */

function render(user) {
  signedOut.hidden = Boolean(user);
  signedIn.hidden = !user;
  root.setAttribute('aria-busy', 'false');

  if (!user) {
    selectTab(loginForm.hidden ? 'signup' : 'login', true); // "로그아웃했어요" 같은 안내는 남김
    return;
  }
  const name = user.displayName || user.email.split('@')[0];
  title.textContent = '내 계정';
  $('.js-me-avatar').textContent = name.trim().charAt(0).toUpperCase();
  $('.js-me-name').textContent = `${name}님, 반가워요`;
  $('.js-me-email').textContent = user.email || '';
  show('');
}

/* ---------- Firebase 연결 ---------- */

// 1) js/firebase-config.js 값 → 2) Firebase Hosting이 주는 자동 설정 순서로 찾음
async function loadConfig() {
  if (firebaseConfig.apiKey) return firebaseConfig;
  try {
    const res = await fetch('/__/firebase/init.json');
    if (res.ok) return await res.json();
  } catch (err) { /* 로컬 개발 서버에는 이 주소가 없음 */ }
  return null;
}

async function start() {
  const config = await loadConfig();
  if (!config || !config.apiKey) {
    setupAlert.hidden = false;
    root.setAttribute('aria-busy', 'false');
    return;
  }

  const auth = getAuth(initializeApp(config));
  auth.languageCode = 'ko'; // 비밀번호 재설정 메일 등을 한국어로

  onAuthStateChanged(auth, render);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = loginForm.elements;
    if (!email.value.trim() || !password.value) {
      show('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    busy(() => signInWithEmailAndPassword(auth, email.value.trim(), password.value));
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email, password, password2 } = signupForm.elements;
    if (!name.value.trim() || !email.value.trim() || !password.value) {
      show('이름, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password.value.length < 6) {
      show('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    if (password.value !== password2.value) {
      show('비밀번호 확인이 일치하지 않아요.');
      password2.focus();
      return;
    }
    busy(async () => {
      const { user } = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      await updateProfile(user, { displayName: name.value.trim() });
      render(auth.currentUser); // 이름이 반영된 상태로 다시 그림
    });
  });

  $('.js-reset').addEventListener('click', () => {
    const email = loginForm.elements.email.value.trim();
    if (!email) {
      show('비밀번호를 재설정할 이메일을 위 칸에 입력해 주세요.');
      loginForm.elements.email.focus();
      return;
    }
    busy(async () => {
      await sendPasswordResetEmail(auth, email);
      // 가입 여부를 알려 주지 않도록 항상 같은 문구
      show(`${email}(으)로 비밀번호 재설정 메일을 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.`, 'info');
    });
  });

  $('.js-google').addEventListener('click', () => {
    busy(() => signInWithPopup(auth, new GoogleAuthProvider()));
  });

  $('.js-logout').addEventListener('click', () => {
    busy(async () => {
      await signOut(auth);
      show('로그아웃했어요.', 'info');
    });
  });
}

start();
