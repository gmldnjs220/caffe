// 로그인 페이지: Supabase Auth (이메일/비밀번호, 구글 계정)
// - 로그인하면 같은 페이지가 "내 계정"으로 바뀜: 가입 정보, 비밀번호 변경, 로그아웃, 회원 탈퇴
// - Supabase 연결은 js/supabase.js, 연결 정보는 js/supabase-config.js
// - 가입하면 DB의 users 테이블에 이름(nickname)과 전화번호(phone)가 자동으로 저장됨 (db/schema.sql 의 handle_new_user)

import { getSupabaseOrNull, KEEP_KEY, markSessionAlive } from './supabase.js';
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

function readKeep() {
  try { return localStorage.getItem(KEEP_KEY) !== '0'; } catch (err) { return true; }
}

function setKeep(on) {
  keepBoxes.forEach((box) => { box.checked = on; });
  try { localStorage.setItem(KEEP_KEY, on ? '1' : '0'); } catch (err) { /* 저장이 막혀도 체크 상태로 동작 */ }
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
  email_not_confirmed: '이메일 인증이 아직 안 됐어요. 가입할 때 받은 메일의 링크를 눌러 주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  email_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  email_address_invalid: '이메일 형식이 올바르지 않아요.',
  validation_failed: '입력한 내용을 다시 확인해 주세요.',
  weak_password: '비밀번호는 6자 이상이어야 해요.',
  same_password: '지금 쓰는 비밀번호와 다른 비밀번호로 정해 주세요.',
  user_banned: '사용할 수 없는 계정이에요. 매장에 문의해 주세요.',
  over_request_rate_limit: '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
  over_email_send_rate_limit: '메일을 너무 자주 보냈어요. 잠시 후 다시 해 주세요.',
  // 아래는 사이트 설정 문제 (Supabase 대시보드에서 고쳐야 함)
  signup_disabled: '지금은 회원가입을 받지 않아요. (관리자: Supabase → Authentication → Sign In / Providers)',
  email_provider_disabled: '이메일 로그인이 아직 켜져 있지 않아요. (관리자: Supabase → Authentication → Sign In / Providers → Email)',
  provider_disabled: '이 로그인 방법이 아직 켜져 있지 않아요. (관리자: Supabase → Authentication → Sign In / Providers)',
};

// 오류 코드가 없는 오래된 응답을 위한 문구 기준
const MESSAGE_RULES = [
  [/invalid login credentials/i, 'invalid_credentials'],
  [/email not confirmed/i, 'email_not_confirmed'],
  [/already registered/i, 'user_already_exists'],
  [/password should be at least/i, 'weak_password'],
  [/unsupported provider|provider is not enabled/i, 'provider_disabled'],
  [/failed to fetch|network/i, 'network'],
];
ERRORS.network = '인터넷 연결을 확인해 주세요.';

function show(text, type = 'error', target = msg) {
  target.textContent = text;
  target.dataset.type = type;
  target.hidden = !text;
}

function errorText(err) {
  let code = err && err.code;
  if (!ERRORS[code]) {
    const rule = MESSAGE_RULES.find(([re]) => re.test((err && err.message) || ''));
    if (rule) [, code] = rule;
  }
  return ERRORS[code] || `문제가 생겼어요. 잠시 후 다시 해 주세요. (${(err && (err.code || err.message)) || '알 수 없음'})`;
}

// supabase-js는 오류를 던지지 않고 { error }로 돌려줘서, 던지도록 바꿔 줌
function check(result) {
  if (result && result.error) throw result.error;
  return result ? result.data : null;
}

// 메일 링크나 구글 로그인 뒤에 돌아올 주소 (메인 화면 안에서 열려 있어도 로그인 페이지 주소로)
function loginUrl() {
  return new URL('login.html', window.location.href).href.split('#')[0];
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
    console.error(err);
    show(errorText(err), 'error', msgTarget);
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
    root.setAttribute('aria-busy', 'false');
  }
}

/* ---------- 로그인 상태 화면 ---------- */

// 비밀번호 재설정 메일의 링크로 들어온 경우: 현재 비밀번호 없이 새 비밀번호만 정함
let recovering = false;

function renderAccount(user) {
  const name = displayName(user);
  title.textContent = recovering ? '새 비밀번호 정하기' : '내 계정';
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

  // 비밀번호 변경: 이메일·비밀번호 계정만 (재설정 메일로 들어왔으면 항상)
  const canChange = recovering || hasPassword(user);
  passwordForm.hidden = !canChange;
  passwordNote.hidden = canChange;
  passwordForm.elements.username.value = user.email || '';
  const currentField = passwordForm.elements.current.closest('.field');
  currentField.hidden = recovering;
  if (recovering) {
    show('새로 쓸 비밀번호를 아래에 입력해 주세요.', 'info', pwMsg);
    passwordForm.elements.next.focus();
  }

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
    deleteForm.reset();
    deleteBox.open = false;
    show('', 'error', deleteMsg);
    return;
  }
  renderAccount(user);
  if (!recovering) show('');
}

// 메일 링크나 구글 로그인에서 오류와 함께 돌아온 경우 (예: 링크 만료)
function readReturnError() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
  const description = params.get('error_description');
  if (!description) return null;
  history.replaceState(null, '', window.location.pathname);
  if (/expired|invalid/i.test(description)) return '링크가 만료됐거나 이미 사용됐어요. 다시 시도해 주세요.';
  return `로그인하지 못했어요. (${description})`;
}

/* ---------- Supabase 연결 ---------- */

async function start() {
  const returnError = readReturnError();
  const sb = await getSupabaseOrNull();
  if (!sb) {
    setupAlert.hidden = false;
    root.setAttribute('aria-busy', 'false');
    return;
  }

  // 처음 열 때(INITIAL_SESSION)와 로그인·로그아웃할 때마다 화면을 다시 그림
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') recovering = true;
    render(session ? session.user : null);
  });
  if (returnError) show(returnError);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = loginForm.elements;
    if (!email.value.trim() || !password.value) {
      show('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    busy(async () => {
      markSessionAlive();
      check(await sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value }));
    });
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email, phone, password, password2 } = signupForm.elements;
    const phoneDigits = phone.value.replace(/\D/g, '');
    if (!name.value.trim() || !email.value.trim() || !phoneDigits || !password.value) {
      show('이름, 이메일, 전화번호, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (!/^01\d{8,9}$/.test(phoneDigits)) {
      show('휴대폰 번호를 확인해 주세요. (예: 010-1234-5678)');
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
      markSessionAlive();
      const data = check(await sb.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          emailRedirectTo: loginUrl(),
          data: { nickname: name.value.trim(), phone: phoneDigits }, // → users 테이블에 저장
        },
      }));
      // 이메일 인증을 켜 둔 경우: 이미 가입된 이메일이면 identities가 비어 있음
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        show(ERRORS.user_already_exists);
        return;
      }
      if (!data.session) {
        const sentTo = email.value.trim();
        signupForm.reset();
        setKeep(readKeep());
        selectTab('login', true);
        show(`${sentTo}(으)로 가입 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요. 메일이 안 보이면 스팸함도 확인해 주세요.`, 'info');
      }
      // 이메일 인증을 꺼 둔 경우에는 바로 로그인되고, onAuthStateChange가 화면을 바꿈
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
      check(await sb.auth.resetPasswordForEmail(email, { redirectTo: loginUrl() }));
      // 가입 여부를 알려 주지 않도록 항상 같은 문구
      show(`${email}(으)로 비밀번호 재설정 메일을 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.`, 'info');
    });
  });

  $('.js-google').addEventListener('click', () => {
    busy(async () => {
      markSessionAlive();
      const data = check(await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: loginUrl(), skipBrowserRedirect: true },
      }));
      // 구글 로그인 화면은 메인 화면 안(iframe)에서 열 수 없어서, 창 전체를 이동함
      (window.top || window).location.href = data.url;
    });
  });

  // 비밀번호 변경: 현재 비밀번호로 한 번 더 확인한 뒤 바꿈 (재설정 메일로 들어왔으면 확인 없이)
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
      const { data: { user } } = await sb.auth.getUser();
      if (!recovering) {
        const { error } = await sb.auth.signInWithPassword({ email: user.email, password: current.value });
        if (error) {
          // 확인 단계에서 비밀번호가 틀리면 "이메일 또는…" 대신 현재 비밀번호 문제라고 알려 줌
          if (errorText(error) === ERRORS.invalid_credentials) {
            say('현재 비밀번호가 맞지 않아요.');
            current.focus();
            return;
          }
          throw error;
        }
      }
      check(await sb.auth.updateUser({ password: next.value }));
      const wasRecovering = recovering;
      recovering = false;
      passwordForm.reset();
      passwordForm.elements.username.value = user.email || '';
      passwordForm.elements.current.closest('.field').hidden = false;
      title.textContent = '내 계정';
      say(wasRecovering ? '새 비밀번호로 바꿨어요.' : '비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요.', 'info');
    }, pwMsg);
  });

  // 회원 탈퇴: 본인 확인 → DB 함수(delete_my_account)로 계정 정리 → 로그아웃
  // 주문·후기 기록이 있으면 기록은 남기고 개인정보만 지움 (db/auth-delete-account.sql)
  deleteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { password, agree } = deleteForm.elements;
    const say = (text, type = 'error') => show(text, type, deleteMsg);

    busy(async () => {
      const { data: { user } } = await sb.auth.getUser();
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

      if (usePassword) {
        const { error } = await sb.auth.signInWithPassword({ email: user.email, password: password.value });
        if (error) {
          if (errorText(error) === ERRORS.invalid_credentials) {
            say('비밀번호가 맞지 않아요.');
            password.focus();
            return;
          }
          throw error;
        }
      }

      const { error } = await sb.rpc('delete_my_account');
      if (error) {
        if (/delete_my_account/.test(error.message || '')) {
          say('탈퇴 기능이 아직 준비되지 않았어요. (관리자: db/auth-delete-account.sql 을 Supabase에서 실행)');
          return;
        }
        throw error;
      }
      await sb.auth.signOut({ scope: 'local' });
      // 로그아웃되면 로그인 화면으로 바뀌고, 이 안내가 그 화면에 남음
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
