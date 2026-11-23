// 로그인 페이지: Supabase Auth (이메일/비밀번호, 구글 계정)
// - 로그인하면 같은 페이지가 "내 계정"으로 바뀜: 가입 정보, 비밀번호 변경, 로그아웃, 회원 탈퇴
// - Supabase 연결은 js/supabase-auth.js, 연결 정보는 js/supabase-config.js
// - 회원가입하면 DB의 public.users 프로필이 자동으로 만들어짐 (db/schema.sql의 handle_new_user)

import { getSupabaseOrNull, readKeep, writeKeep } from './supabase-auth.js';
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
const pwBox = $('.js-pw-box');
const pwToggle = $('.js-pw-toggle');
const pwPanel = $('#pw-panel');
const pwCurrentField = $('.js-pw-current-field');
const pwMsg = $('.js-pw-msg');
const deleteBox = $('.js-delete-box');
const deleteForm = $('.js-delete-form');
const deleteMsg = $('.js-delete-msg');
const keepBoxes = [...document.querySelectorAll('.js-keep')];

// 메일 속 링크(가입 확인, 비밀번호 재설정)와 구글 로그인이 끝나면 돌아올 주소 = 이 페이지
// (Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs에 들어 있어야 함)
const pageUrl = () => `${location.origin}${location.pathname}`;

// 비밀번호 재설정 메일의 링크로 들어온 상태 (현재 비밀번호 없이 새 비밀번호를 정함)
let recovering = false;

/* ---------- 로그인 상태 유지 ---------- */
// 체크: 브라우저를 닫았다 열어도 로그인 유지 / 해제: 브라우저(탭)를 닫으면 로그아웃
// 로그인 탭과 회원가입 탭의 체크박스는 서로 같은 값으로 맞춰지고, 마지막 선택을 기억함
// 실제로 어디에 저장할지는 js/supabase-auth.js의 authStorage가 이 값을 보고 정함

function setKeep(on) {
  keepBoxes.forEach((box) => { box.checked = on; });
  writeKeep(on);
}

setKeep(readKeep());
keepBoxes.forEach((box) => box.addEventListener('change', () => setKeep(box.checked)));

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

// Supabase 오류 코드 → 한국어 안내
const ERRORS = {
  invalid_credentials: '이메일 또는 비밀번호가 맞지 않아요.',
  email_not_confirmed: '가입 확인 메일의 링크를 먼저 눌러 주세요. 메일이 안 보이면 스팸함도 확인해 주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  email_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  email_address_invalid: '이메일 형식이 올바르지 않아요.',
  validation_failed: '입력한 내용을 다시 확인해 주세요.',
  weak_password: '비밀번호는 6자 이상이어야 해요.',
  same_password: '지금 쓰는 비밀번호와 다른 비밀번호로 정해 주세요.',
  user_banned: '사용할 수 없는 계정이에요. 매장에 문의해 주세요.',
  over_request_rate_limit: '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  over_email_send_rate_limit: '메일을 너무 자주 보냈어요. 잠시 후 다시 해 주세요.',
  session_not_found: '로그인이 끝났어요. 다시 로그인해 주세요.',
  // 아래는 사이트 설정 문제 (Supabase 대시보드에서 고쳐야 함)
  signup_disabled: '지금은 회원가입을 받지 않아요. (관리자: Supabase → Authentication → Sign In / Providers → Allow new users to sign up)',
  email_provider_disabled: '이메일 로그인이 아직 켜져 있지 않아요. (관리자: Supabase → Authentication → Sign In / Providers → Email)',
  provider_disabled: '이 로그인 방법이 아직 켜져 있지 않아요. (관리자: Supabase → Authentication → Sign In / Providers)',
  delete_not_ready: '회원 탈퇴 기능이 아직 준비되지 않았어요. (관리자: db/schema.sql의 delete_my_account 함수를 SQL Editor에서 실행)',
};
// 예전 버전 Supabase는 code 없이 message만 줌
const MESSAGES = {
  'Invalid login credentials': 'invalid_credentials',
  'Email not confirmed': 'email_not_confirmed',
  'User already registered': 'user_already_exists',
  'Signups not allowed for this instance': 'signup_disabled',
  'Unsupported provider: provider is not enabled': 'provider_disabled',
};

function errorCode(err) {
  return (err && (err.code || MESSAGES[err.message])) || '';
}

function show(text, type = 'error', target = msg) {
  target.textContent = text;
  target.dataset.type = type;
  target.hidden = !text;
}

function errorText(err) {
  if (err && err.name === 'AuthRetryableFetchError') return '인터넷 연결을 확인해 주세요.';
  return ERRORS[errorCode(err)] || `문제가 생겼어요. 잠시 후 다시 해 주세요. (${errorCode(err) || (err && err.message)})`;
}

// Supabase는 오류를 throw하지 않고 { error }로 돌려줘서, 오류가 있으면 throw로 바꿈
function check({ data, error }) {
  if (error) throw error;
  return data;
}

/* ---------- 로그인 / 회원가입 화면 고르기 ---------- */
// 탭 버튼 없이, 메인 사이드바의 LOGIN / SIGN IN 이나 주소(login.html#signup)로 고름

function selectTab(name, keepMessage = false) {
  loginForm.hidden = name !== 'login';
  signupForm.hidden = name !== 'signup';
  title.textContent = name === 'login' ? '로그인' : '회원가입';
  if (!keepMessage) show('');
}

const tabFromHash = () => (location.hash === '#signup' ? 'signup' : 'login');
if (location.hash === '#signup') selectTab('signup');
window.addEventListener('hashchange', () => {
  if (location.hash === '#signup' || location.hash === '#login') selectTab(tabFromHash());
});

// 메인 화면(js/app.js)이 사이드바 버튼을 누를 때 부름
window.selectAuthTab = (name) => selectTab(name === 'signup' ? 'signup' : 'login');

/* ---------- 비밀번호 변경 칸 접기 / 펼치기 ---------- */

function setPwOpen(open) {
  pwBox.classList.toggle('is-open', open);
  pwToggle.setAttribute('aria-expanded', String(open));
  pwPanel.inert = !open; // 접혀 있을 때는 Tab 키로도 들어가지 않게
}

pwToggle.addEventListener('click', () => {
  setPwOpen(!pwBox.classList.contains('is-open'));
});

/* ---------- 버튼 잠금 (요청 중 두 번 누르지 않게) ---------- */

async function busy(task, msgTarget = msg) {
  const buttons = root.querySelectorAll('button');
  buttons.forEach((b) => { b.disabled = true; });
  root.setAttribute('aria-busy', 'true');
  try {
    await task();
  } catch (err) {
    console.error(err);
    show(errorText(err), 'error', msgTarget);
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

  // 비밀번호 변경: 이메일·비밀번호 계정만 (재설정 메일로 들어온 경우는 현재 비밀번호 없이)
  const canChange = hasPassword(user) || recovering;
  passwordForm.hidden = !canChange;
  passwordNote.hidden = canChange;
  pwCurrentField.hidden = recovering;
  passwordForm.elements.username.value = user.email || '';

  // 회원 탈퇴 본인 확인: 비밀번호가 있으면 비밀번호, 구글로만 가입했으면 체크만
  $('.js-delete-password-field').hidden = !hasPassword(user);
  $('.js-delete-google-note').hidden = hasPassword(user);
}

function render(user) {
  signedOut.hidden = Boolean(user);
  signedIn.hidden = !user;
  root.setAttribute('aria-busy', 'false');

  if (!user) {
    recovering = false;
    selectTab(loginForm.hidden ? 'signup' : 'login', true); // "로그아웃했어요" 같은 안내는 남김
    passwordForm.reset();
    show('', 'error', pwMsg);
    setPwOpen(false);
    deleteForm.reset();
    deleteBox.open = false;
    show('', 'error', deleteMsg);
    return;
  }
  renderAccount(user);
  show('');
  if (recovering) {
    setPwOpen(true);
    show('새 비밀번호를 정해 주세요.', 'info', pwMsg);
    passwordForm.elements.next.focus();
  }
}

// 메일 링크나 구글 로그인에서 오류와 함께 돌아온 경우 (#error=...&error_description=...)
function readReturnError() {
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  const code = params.get('error_code') || params.get('error');
  if (!code) return null;
  history.replaceState(null, '', pageUrl());
  if (code === 'otp_expired') return '메일 속 링크가 만료됐어요. 다시 요청해 주세요.';
  return `로그인하지 못했어요. (${params.get('error_description') || code})`;
}

/* ---------- Supabase 연결 ---------- */

function start() {
  const sb = getSupabaseOrNull();
  if (!sb) {
    setupAlert.hidden = false;
    root.setAttribute('aria-busy', 'false');
    return;
  }

  const returnError = readReturnError();

  // 처음 한 번(INITIAL_SESSION)과 로그인·로그아웃·정보 변경 때마다 불림
  // (이 안에서 Supabase를 다시 부르면 멈출 수 있어서, 화면만 다시 그림)
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') recovering = true;
    const user = session ? session.user : null;
    setTimeout(() => {
      render(user);
      if (event === 'INITIAL_SESSION' && returnError) show(returnError);
    }, 0);
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = loginForm.elements;
    if (!email.value.trim() || !password.value) {
      show('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    busy(async () => {
      check(await sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value }));
    });
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, phone, email, password, password2 } = signupForm.elements;
    const digits = phone.value.replace(/[^0-9]/g, '');
    if (!name.value.trim() || !digits || !email.value.trim() || !password.value) {
      show('이름, 전화번호, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (!/^0\d{8,10}$/.test(digits)) {
      show('전화번호를 다시 확인해 주세요. (예: 010-1234-5678)');
      phone.focus();
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
      const address = email.value.trim();
      const data = check(await sb.auth.signUp({
        email: address,
        password: password.value,
        // nickname, phone은 DB 트리거가 public.users 프로필에 넣음
        options: { data: { nickname: name.value.trim(), phone: digits }, emailRedirectTo: pageUrl() },
      }));
      // 이메일 확인이 켜져 있으면 바로 로그인되지 않고 확인 메일이 감
      if (!data.session) {
        // 이미 가입된 이메일이면 Supabase가 빈 계정 정보를 돌려줌
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          show(ERRORS.user_already_exists);
          return;
        }
        signupForm.reset();
        setKeep(readKeep());
        selectTab('login', true);
        loginForm.elements.email.value = address;
        show(`${address}(으)로 가입 확인 메일을 보냈어요. 메일 속 링크를 누르면 가입이 끝나요. 메일이 안 보이면 스팸함도 확인해 주세요.`, 'info');
      }
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
      check(await sb.auth.resetPasswordForEmail(email, { redirectTo: pageUrl() }));
      // 가입 여부를 알려 주지 않도록 항상 같은 문구
      show(`${email}(으)로 비밀번호 재설정 메일을 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.`, 'info');
    });
  });

  $('.js-google').addEventListener('click', () => {
    busy(async () => {
      const data = check(await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: pageUrl(), skipBrowserRedirect: true },
      }));
      // 구글 로그인 화면은 다른 페이지 안(iframe)에서는 열리지 않아서, 메인 화면 안이면 창 전체를 옮김
      try {
        window.top.location.assign(data.url);
      } catch (err) {
        location.assign(data.url);
      }
    });
  });

  // 현재 비밀번호가 맞는지 확인 (같은 계정으로 다시 로그인해 봄)
  async function confirmPassword(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (!error) return true;
    if (errorCode(error) === 'invalid_credentials') return false;
    throw error;
  }

  // 비밀번호 변경: 현재 비밀번호로 한 번 더 확인한 뒤 바꿈
  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { current, next, next2 } = passwordForm.elements;
    const say = (text, type = 'error') => show(text, type, pwMsg);

    if ((!recovering && !current.value) || !next.value) {
      say(recovering ? '새 비밀번호를 입력해 주세요.' : '현재 비밀번호와 새 비밀번호를 입력해 주세요.');
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
    if (!recovering && next.value === current.value) {
      say('지금 쓰는 비밀번호와 다른 비밀번호로 정해 주세요.');
      next.focus();
      return;
    }

    busy(async () => {
      const { user } = check(await sb.auth.getUser());
      if (!recovering && !(await confirmPassword(user.email, current.value))) {
        say('현재 비밀번호가 맞지 않아요.');
        current.focus();
        return;
      }
      check(await sb.auth.updateUser({ password: next.value }));
      recovering = false;
      pwCurrentField.hidden = false;
      passwordForm.reset();
      passwordForm.elements.username.value = user.email || '';
      setPwOpen(false);
      say('비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', 'info');
    }, pwMsg);
  });

  // 회원 탈퇴: 본인 확인 → DB 함수(delete_my_account)로 계정 정리 → 로그아웃
  // 주문·후기 기록은 남기고 이름·전화번호·이메일 같은 개인정보만 지움 (docs/DB-설계.md)
  deleteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { password, agree } = deleteForm.elements;
    const say = (text, type = 'error') => show(text, type, deleteMsg);

    busy(async () => {
      const { user } = check(await sb.auth.getUser());
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
      if (usePassword && !(await confirmPassword(user.email, password.value))) {
        say('비밀번호가 맞지 않아요.');
        password.focus();
        return;
      }

      const { error } = await sb.rpc('delete_my_account');
      if (error) {
        // 함수가 아직 DB에 없을 때
        if (error.code === 'PGRST202' || error.code === '42883') throw { code: 'delete_not_ready' };
        throw error;
      }
      // 계정이 지워졌으니 이 브라우저의 로그인 정보만 지움
      await sb.auth.signOut({ scope: 'local' });
      // 로그인 화면으로 바뀌고, 이 안내가 그 화면에 남음
      show('회원 탈퇴가 끝났어요. 그동안 이용해 주셔서 감사해요.', 'info');
    }, deleteMsg);
  });

  document.querySelectorAll('.js-logout').forEach((btn) => btn.addEventListener('click', () => {
    busy(async () => {
      check(await sb.auth.signOut());
      show('로그아웃했어요.', 'info');
    });
  }));
}

start();
