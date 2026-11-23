// 로그인 페이지: Firebase Authentication (이메일/비밀번호, 구글 계정)
// - 로그인하면 같은 페이지가 "내 계정"으로 바뀜: 가입 정보, 비밀번호 변경, 로그아웃
// - Firebase 연결은 js/firebase.js, 설정값은 js/firebase-config.js

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reauthenticateWithPopup,
  deleteUser,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getAuthOrNull } from './firebase.js';
import { accountRows, displayName, hasPassword } from './account-view.js';

const $ = (sel) => document.querySelector(sel);

const root = $('.auth');
const title = $('.js-title');
const setupAlert = $('.js-setup');
const signedOut = $('.js-signed-out');
const signedIn = $('.js-signed-in');
const msg = $('.js-msg');
const loginForm = $('.js-login-form');
const signupForm = $('.js-signup-form');
const passwordForm = $('.js-password-form');
const passwordNote = $('.js-password-note');
const pwMsg = $('.js-pw-msg');
const deleteBox = $('.js-delete-box');
const deleteForm = $('.js-delete-form');
const deleteMsg = $('.js-delete-msg');
const tabs = [...document.querySelectorAll('.js-tab')];
const keepBoxes = [...document.querySelectorAll('.js-keep')];

/* ---------- 로그인 상태 유지 ---------- */
// 체크: 브라우저를 닫았다 열어도 로그인 유지 / 해제: 브라우저(탭)를 닫으면 로그아웃
// 로그인 탭과 회원가입 탭의 체크박스는 서로 같은 값으로 맞춰지고, 마지막 선택을 기억함

const KEEP_KEY = 'onebottle-keep-signed-in';

function readKeep() {
  try { return localStorage.getItem(KEEP_KEY) !== '0'; } catch (err) { return true; }
}

function setKeep(on) {
  keepBoxes.forEach((box) => { box.checked = on; });
  try { localStorage.setItem(KEEP_KEY, on ? '1' : '0'); } catch (err) { /* 저장이 막혀도 체크 상태로 동작 */ }
}

setKeep(readKeep());
keepBoxes.forEach((box) => box.addEventListener('change', () => setKeep(box.checked)));

const persistence = () => (keepBoxes[0] && !keepBoxes[0].checked ? browserSessionPersistence : browserLocalPersistence);

/* ---------- 비밀번호 보기 버튼 ---------- */
// 모든 비밀번호 칸 오른쪽에 "보기" 버튼을 붙임. 누르면 입력한 글자가 그대로 보임

function setVisible(input, btn, visible) {
  input.type = visible ? 'text' : 'password';
  btn.textContent = visible ? '숨기기' : '보기';
  btn.setAttribute('aria-pressed', String(visible));
  btn.setAttribute('aria-label', visible ? '비밀번호 숨기기' : '비밀번호 보기');
}

document.querySelectorAll('.auth input[type="password"]').forEach((input) => {
  const wrap = document.createElement('div');
  wrap.className = 'field__control';
  input.replaceWith(wrap);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'field__reveal';
  btn.setAttribute('aria-controls', input.id);
  wrap.append(input, btn);
  setVisible(input, btn, false);

  btn.addEventListener('click', () => {
    setVisible(input, btn, input.type === 'password');
    input.focus();
  });
  // 폼을 비우거나 보내면 다시 가림 (비밀번호가 화면에 남지 않게)
  input.form.addEventListener('reset', () => setVisible(input, btn, false));
  input.form.addEventListener('submit', () => setVisible(input, btn, false));
});

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
  'auth/requires-recent-login': '보안을 위해 다시 로그인한 뒤 바꿔 주세요.',
  // 아래는 사이트 설정 문제 (Firebase 콘솔에서 고쳐야 함)
  'auth/operation-not-allowed': '이 로그인 방법이 아직 켜져 있지 않아요. (관리자: Firebase 콘솔 → Authentication → 로그인 방법)',
  'auth/unauthorized-domain': '이 주소에서는 로그인할 수 없어요. (관리자: Firebase 콘솔 → Authentication → 설정 → 승인된 도메인)',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': '로그인 설정값(apiKey)이 올바르지 않아요. (관리자: js/firebase-config.js 확인)',
  'auth/configuration-not-found': 'Firebase에서 로그인(Authentication)이 아직 시작되지 않았어요. (관리자: Firebase 콘솔 → Authentication → 시작하기)',
};
// 사용자가 직접 닫은 경우 등 안내가 필요 없는 오류
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

function show(text, type = 'error', target = msg) {
  target.textContent = text;
  target.dataset.type = type;
  target.hidden = !text;
}

function errorText(err) {
  return ERRORS[err.code] || `문제가 생겼어요. 잠시 후 다시 해 주세요. (${err.code || err.message})`;
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

async function busy(task, msgTarget = msg) {
  const buttons = root.querySelectorAll('button');
  buttons.forEach((b) => { b.disabled = true; });
  root.setAttribute('aria-busy', 'true');
  try {
    await task();
  } catch (err) {
    if (!SILENT.has(err.code)) {
      console.error(err);
      show(errorText(err), 'error', msgTarget);
    }
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
    root.setAttribute('aria-busy', 'false');
  }
}

/* ---------- 로그인 상태 화면 ---------- */

function renderAccount(user) {
  const name = displayName(user);
  title.textContent = '내 계정';
  $('.js-me-avatar').textContent = name.trim().charAt(0).toUpperCase();
  $('.js-me-name').textContent = `${name}님, 반가워요`;
  $('.js-me-email').textContent = user.email || '';

  // 가입 정보 목록
  $('.js-account-info').replaceChildren(...accountRows(user).map((row) => {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = row.label;
    const dd = document.createElement('dd');
    dd.textContent = row.value;
    if (row.note) {
      const badge = document.createElement('span');
      badge.className = 'account-badge';
      badge.textContent = row.note;
      dd.append(' ', badge);
    }
    wrap.append(dt, dd);
    return wrap;
  }));

  // 비밀번호 변경: 이메일·비밀번호 계정만
  const canChange = hasPassword(user);
  passwordForm.hidden = !canChange;
  passwordNote.hidden = canChange;
  passwordForm.elements.username.value = user.email || '';

  // 회원 탈퇴 본인 확인: 비밀번호가 있으면 비밀번호, 구글로만 가입했으면 구글 확인 창
  $('.js-delete-password-field').hidden = !canChange;
  $('.js-delete-google-note').hidden = canChange;
}

function render(user) {
  signedOut.hidden = Boolean(user);
  signedIn.hidden = !user;
  root.setAttribute('aria-busy', 'false');

  if (!user) {
    selectTab(loginForm.hidden ? 'signup' : 'login', true); // "로그아웃했어요" 같은 안내는 남김
    passwordForm.reset();
    show('', 'error', pwMsg);
    deleteForm.reset();
    deleteBox.open = false;
    show('', 'error', deleteMsg);
    return;
  }
  renderAccount(user);
  show('');
}

/* ---------- Firebase 연결 ---------- */

async function start() {
  const auth = await getAuthOrNull();
  if (!auth) {
    setupAlert.hidden = false;
    root.setAttribute('aria-busy', 'false');
    return;
  }

  onAuthStateChanged(auth, render);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = loginForm.elements;
    if (!email.value.trim() || !password.value) {
      show('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    busy(async () => {
      await setPersistence(auth, persistence());
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    });
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
      await setPersistence(auth, persistence());
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
    // 팝업은 버튼을 누른 직후에 열어야 차단되지 않아서, 유지 방식 설정과 팝업 열기를 함께 시작함
    busy(() => Promise.all([
      setPersistence(auth, persistence()),
      signInWithPopup(auth, new GoogleAuthProvider()),
    ]));
  });

  // 비밀번호 변경: 현재 비밀번호로 한 번 더 확인(재인증)한 뒤 바꿈
  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { current, next, next2 } = passwordForm.elements;
    const say = (text, type = 'error') => show(text, type, pwMsg);

    if (!current.value || !next.value) {
      say('현재 비밀번호와 새 비밀번호를 입력해 주세요.');
      return;
    }
    if (next.value.length < 6) {
      say('새 비밀번호는 6자 이상이어야 해요.');
      next.focus();
      return;
    }
    if (next.value !== next2.value) {
      say('새 비밀번호 확인이 일치하지 않아요.');
      next2.focus();
      return;
    }
    if (next.value === current.value) {
      say('지금 쓰는 비밀번호와 다른 비밀번호로 정해 주세요.');
      next.focus();
      return;
    }

    busy(async () => {
      const user = auth.currentUser;
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current.value));
      } catch (err) {
        // 재인증 단계에서 비밀번호가 틀리면 "이메일 또는…" 대신 현재 비밀번호 문제라고 알려 줌
        if (['auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(err.code)) {
          say('현재 비밀번호가 맞지 않아요.');
          current.focus();
          return;
        }
        throw err;
      }
      await updatePassword(user, next.value);
      passwordForm.reset();
      passwordForm.elements.username.value = user.email || '';
      say('비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', 'info');
    }, pwMsg);
  });

  // 회원 탈퇴: 본인 확인(재인증) → 계정 삭제. 삭제되면 자동으로 로그아웃 화면으로 바뀜
  deleteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { password, agree } = deleteForm.elements;
    const say = (text, type = 'error') => show(text, type, deleteMsg);
    const user = auth.currentUser;
    if (!user) return;
    const usePassword = hasPassword(user);

    if (usePassword && !password.value) {
      say('본인 확인을 위해 비밀번호를 입력해 주세요.');
      password.focus();
      return;
    }
    if (!agree.checked) {
      say('탈퇴 안내를 확인했다는 칸에 체크해 주세요.');
      agree.focus();
      return;
    }

    busy(async () => {
      try {
        if (usePassword) {
          await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password.value));
        } else {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
        }
      } catch (err) {
        if (['auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(err.code)) {
          say('비밀번호가 맞지 않아요.');
          password.focus();
          return;
        }
        if (err.code === 'auth/user-mismatch') {
          say('지금 로그인한 계정과 다른 구글 계정을 고르셨어요. 같은 계정으로 확인해 주세요.');
          return;
        }
        throw err;
      }
      await deleteUser(user);
      // 계정이 지워지면 로그인 화면으로 바뀌고, 이 안내가 그 화면에 남음
      show('회원 탈퇴가 끝났어요. 그동안 이용해 주셔서 감사해요.', 'info');
    }, deleteMsg);
  });

  document.querySelectorAll('.js-logout').forEach((btn) => btn.addEventListener('click', () => {
    busy(async () => {
      await signOut(auth);
      show('로그아웃했어요.', 'info');
    });
  }));
}

start();
