// 관리자 화면: 관리자 계정으로 로그인하면 지금 화면 그대로, 고칠 수 있는 곳마다 ✏️ 버튼이 생김
//
// - 관리자: Supabase users.role = 'admin' 인 회원 (만드는 법은 db/admin-edit.sql 맨 위)
// - 오른쪽 아래 "관리자 편집" 스위치로 ✏️ 버튼을 켜고 끔 (끄면 손님이 보는 화면과 같음)
// - 고칠 수 있는 것
//   · 화면 문구 (HTML의 data-text-key)  → site_texts 테이블
//   · 공지사항 (notice.html)            → notices 테이블 (추가·수정·숨기기·삭제)
//   · 메뉴 이름·설명·가격·품절, 카테고리 이름·안내 문구 (menu.html) → menus, menu_variants, menu_options, categories
// - 저장할 수 있는지는 화면이 아니라 Supabase 보안 규칙(RLS, public.is_admin())이 정해요.
//   이 파일은 관리자에게만 버튼을 보여 줄 뿐이라, 다른 사람이 버튼을 억지로 띄워도 저장은 안 돼요.

import { getSupabaseOrNull } from './supabase-auth.js';

const SWITCH_KEY = 'onebottle-admin-edit';
const isEmbed = window.self !== window.top;
const root = document.documentElement;

let sb = null;
let userId = null;
let active = false; // 관리자로 확인됨

const safe = (fn, fallback = null) => { try { return fn(); } catch (err) { return fallback; } };
const switchOn = () => safe(() => localStorage.getItem(SWITCH_KEY) !== '0', true);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key in node && typeof node[key] !== 'object') node[key] = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  [].concat(children).forEach((child) => child != null && child !== false && node.append(child));
  return node;
}

/* ---------- 관리자인지 확인 ---------- */

async function checkAdmin(session) {
  if (!session) return false;
  // 1) public.is_admin() 함수로 확인 (db/admin-edit.sql 이 로그인 회원에게 실행 권한을 줌)
  //    users 테이블은 Supabase 설정에 따라 로그인 회원도 못 읽을 수 있어서 이쪽을 먼저 씀
  const rpc = await sb.rpc('is_admin');
  if (!rpc.error) return rpc.data === true;
  // 2) 함수를 못 부르면 내 회원 정보의 role 로 확인
  const { data, error } = await sb.from('users').select('role').eq('id', session.user.id).maybeSingle();
  if (error) {
    console.warn('[admin] 권한을 확인하지 못했어요.', error.message);
    return false;
  }
  return data?.role === 'admin';
}

/* ---------- 스위치 (오른쪽 아래) ---------- */

function applySwitch() {
  root.classList.toggle('admin-on', active && switchOn());
  const input = document.querySelector('.admin-bar input');
  if (input) input.checked = switchOn();
}

function renderBar() {
  if (isEmbed || document.querySelector('.admin-bar')) return; // 홈 화면 안(iframe)에서는 바깥 화면의 스위치를 같이 씀
  const input = el('input', {
    type: 'checkbox',
    checked: switchOn(),
    onchange: () => {
      safe(() => localStorage.setItem(SWITCH_KEY, input.checked ? '1' : '0'));
      applySwitch();
    },
  });
  document.body.append(el('div', { class: 'admin-bar', 'data-admin-ui': true, role: 'region', 'aria-label': '관리자 편집' }, [
    el('span', { class: 'admin-bar__badge', text: '관리자' }),
    el('label', { class: 'admin-bar__switch' }, [input, el('span', { class: 'admin-bar__track', 'aria-hidden': 'true' }), ' ✏️ 편집']),
  ]));
}

// 다른 탭이나 홈 화면 안(iframe)에서 스위치를 바꾸면 여기도 같이
window.addEventListener('storage', (e) => { if (e.key === SWITCH_KEY) applySwitch(); });

/* ---------- 수정 창 ---------- */

let dialog = null;

function openDialog({ title, fields, onSave, extraButtons = [] }) {
  if (!dialog) {
    dialog = el('dialog', { class: 'admin-dialog', 'data-admin-ui': true });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    document.body.append(dialog);
  }
  const message = el('p', { class: 'admin-dialog__msg', role: 'status' });
  const saveBtn = el('button', { type: 'submit', class: 'admin-btn admin-btn--primary', text: '저장' });
  const form = el('form', { class: 'admin-dialog__form', method: 'dialog' }, [
    el('h2', { class: 'admin-dialog__title', text: title }),
    ...fields,
    message,
    el('div', { class: 'admin-dialog__actions' }, [
      ...extraButtons,
      el('span', { class: 'admin-dialog__spacer' }),
      el('button', { type: 'button', class: 'admin-btn', text: '취소', onclick: () => dialog.close() }),
      saveBtn,
    ]),
  ]);

  const run = async (job, doneText) => {
    message.textContent = '저장하는 중…';
    message.classList.remove('is-error');
    form.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      await job();
      message.textContent = doneText || '저장했어요.';
      setTimeout(() => dialog.open && dialog.close(), 500);
    } catch (err) {
      console.error('[admin]', err);
      message.textContent = err.message || String(err);
      message.classList.add('is-error');
    } finally {
      form.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    run(() => onSave(form));
  });
  form.run = run;

  dialog.replaceChildren(form);
  dialog.showModal();
  const first = form.querySelector('input, textarea');
  if (first) first.focus();
  return form;
}

function field(label, control, hint) {
  return el('label', { class: 'admin-field' }, [
    el('span', { class: 'admin-field__label', text: label }),
    control,
    hint ? el('span', { class: 'admin-field__hint', text: hint }) : null,
  ]);
}

const textInput = (name, value, extra = {}) => el('input', { type: 'text', name, value: value ?? '', ...extra });
const numberInput = (name, value, extra = {}) => el('input', { type: 'number', name, value: value ?? '', min: 0, step: 100, inputMode: 'numeric', ...extra });
const textArea = (name, value, extra = {}) => el('textarea', { name, rows: Math.min(10, Math.max(3, String(value ?? '').split('\n').length + 1)), ...extra }, String(value ?? ''));

// 두 번 눌러야 실행되는 버튼 (실수로 지우지 않게)
function confirmButton(label, confirmLabel, action) {
  let armed = false;
  const btn = el('button', {
    type: 'button',
    class: 'admin-btn admin-btn--danger',
    text: label,
    onclick: () => {
      if (!armed) {
        armed = true;
        btn.textContent = confirmLabel;
        setTimeout(() => { armed = false; btn.textContent = label; }, 4000);
        return;
      }
      action();
    },
  });
  return btn;
}

// 고친 행이 0개면 RLS가 막은 것 (관리자 권한이 없거나 admin-edit.sql을 아직 안 돌림)
function check({ error, data }, what) {
  if (error) {
    if (error.code === '42501' || /permission denied/i.test(error.message)) {
      throw new Error(`${what}: 저장 권한이 없어요. Supabase에서 db/admin-edit.sql을 실행했는지 확인해 주세요.`);
    }
    if (error.code === '42P01' || /does not exist|schema cache/i.test(error.message)) {
      throw new Error(`${what}: 테이블이 아직 없어요. Supabase에서 db/admin-edit.sql을 실행해 주세요.`);
    }
    throw new Error(`${what}: ${error.message}`);
  }
  if (Array.isArray(data) && data.length === 0) {
    throw new Error(`${what}: 저장되지 않았어요. 관리자 계정으로 로그인했는지 확인해 주세요.`);
  }
  return data;
}

/* ---------- ✏️ 버튼 ---------- */

function pen(label, onClick) {
  return el('button', {
    type: 'button',
    class: 'admin-pen',
    'data-admin-ui': true,
    title: `${label} 수정`,
    'aria-label': `${label} 수정`,
    text: '✏️',
    onclick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    },
  });
}

/* ---------- 1. 화면 문구 ---------- */

const TEXT_HINT = '줄바꿈은 그대로 보여요. *글자* 는 강조, [글자](주소) 는 링크';

function editText(target) {
  const content = window.siteContent;
  const key = target.dataset.textKey;
  const label = target.dataset.textLabel || key;
  const current = content.hasText(key) ? content.getText(key) : content.defaultOf(target);
  const single = target.dataset.textSingle != null;
  const input = single ? textInput('value', current, { required: true }) : textArea('value', current, { required: true });

  const extra = [];
  if (content.hasText(key)) {
    extra.push(el('button', {
      type: 'button',
      class: 'admin-btn',
      text: '처음 문구로',
      title: `HTML에 적힌 문구: ${content.defaultOf(target)}`,
      onclick: () => form.run(async () => {
        check(await sb.from('site_texts').delete().eq('key', key).select('key'), label);
        content.setText(key, null);
      }, '처음 문구로 되돌렸어요.'),
    }));
  }

  const form = openDialog({
    title: label,
    fields: [field('문구', input, single ? null : TEXT_HINT)],
    extraButtons: extra,
    onSave: async () => {
      const value = single ? input.value.trim() : content.tidy(input.value);
      if (!value) throw new Error('문구를 적어 주세요.');
      check(await sb.from('site_texts').upsert({ key, value, updated_by: userId }).select('key'), label);
      content.setText(key, value);
    },
  });
}

function decorateTexts() {
  document.querySelectorAll('[data-text-key]').forEach((target) => {
    const label = target.dataset.textLabel || target.dataset.textKey;
    const interactive = target.matches('a, button');
    const existing = interactive ? target.nextElementSibling : target.querySelector(':scope > .admin-pen');
    if (existing && existing.classList.contains('admin-pen')) return;
    const btn = pen(label, () => editText(target));
    if (interactive) target.after(btn);
    else target.append(btn);
  });
}

/* ---------- 2. 공지사항 ---------- */

async function reloadNotices() {
  const { data, error } = await sb.from('notices').select('id, title, body, posted_on, is_published');
  check({ error }, '공지사항');
  window.siteContent.renderNotices(data);
  window.siteContent.cacheNotices(data);
}

const today = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // 한국 날짜

function editNotice(notice) {
  const isNew = !notice;
  const n = notice || { title: '', body: '', posted_on: today(), is_published: true };
  const title = textInput('title', n.title, { required: true, maxLength: 100 });
  const date = el('input', { type: 'date', name: 'posted_on', value: String(n.posted_on).slice(0, 10), required: true });
  const body = textArea('body', n.body, { rows: 6 });
  const published = el('input', { type: 'checkbox', name: 'is_published', checked: n.is_published !== false });

  const extra = [];
  if (!isNew) {
    extra.push(confirmButton('삭제', '한 번 더 누르면 삭제', () => form.run(async () => {
      check(await sb.from('notices').delete().eq('id', n.id).select('id'), '공지 삭제');
      await reloadNotices();
    }, '삭제했어요.')));
  }

  const form = openDialog({
    title: isNew ? '공지 추가' : '공지 수정',
    fields: [
      field('제목', title),
      field('날짜', date),
      field('내용', body, `${TEXT_HINT}. 빈 줄로 문단을 나눠요`),
      el('label', { class: 'admin-check' }, [published, ' 손님에게 보이기 (끄면 관리자만 보여요)']),
    ],
    extraButtons: extra,
    onSave: async () => {
      const row = {
        title: title.value.trim(),
        body: window.siteContent.tidy(body.value),
        posted_on: date.value,
        is_published: published.checked,
      };
      if (isNew) check(await sb.from('notices').insert({ ...row, created_by: userId }).select('id'), '공지 추가');
      else check(await sb.from('notices').update(row).eq('id', n.id).select('id'), '공지 수정');
      await reloadNotices();
    },
  });
}

function decorateNotices() {
  const box = document.querySelector('.notices');
  if (!box) return;
  const content = window.siteContent;
  box.querySelectorAll('details:not(#hours)').forEach((d) => {
    const summary = d.querySelector('summary');
    if (summary.querySelector('.admin-pen')) return;
    if (d.classList.contains('is-unpublished') && !summary.querySelector('.admin-tag')) {
      summary.querySelector('strong').after(el('span', { class: 'admin-tag', 'data-admin-ui': true, text: '숨김' }));
    }
    summary.append(pen('공지', () => {
      if (content.usingHtmlNotices) {
        alertDialog('공지 수정', '공지사항 테이블이 아직 없어서 HTML에 적힌 공지를 보여 주는 중이에요. Supabase에서 db/admin-edit.sql을 실행한 뒤 새로고침해 주세요.');
        return;
      }
      editNotice(content.notices.find((n) => String(n.id) === d.dataset.noticeId));
    }));
  });
  const hours = box.querySelector('#hours summary');
  if (hours && !hours.querySelector('.admin-tag')) {
    hours.querySelector('strong').after(el('span', {
      class: 'admin-tag', 'data-admin-ui': true, text: 'js/hours.js', title: '영업시간은 아직 js/hours.js 파일에서 고쳐요',
    }));
  }
  if (!box.nextElementSibling || !box.nextElementSibling.classList.contains('admin-add')) {
    box.after(el('button', {
      type: 'button',
      class: 'admin-btn admin-add',
      'data-admin-ui': true,
      text: '✏️ 공지 추가',
      onclick: () => {
        if (content.usingHtmlNotices) {
          alertDialog('공지 추가', 'Supabase에서 db/admin-edit.sql을 실행한 뒤 새로고침하면 공지를 추가할 수 있어요.');
          return;
        }
        editNotice(null);
      },
    }));
  }
}

function alertDialog(title, text) {
  openDialog({ title, fields: [el('p', { class: 'admin-dialog__text', text })], onSave: async () => {} })
    .querySelector('[type="submit"]').hidden = true;
}

/* ---------- 3. 메뉴 ---------- */

const toWon = (k) => (k == null ? '' : Math.round(k * 1000));
const wonValue = (input, what) => {
  const n = Number(input.value);
  if (input.value === '' || !Number.isInteger(n) || n < 0) throw new Error(`${what}: 가격을 0 이상 숫자(원)로 적어 주세요.`);
  return n;
};

function editMenuItem(cat, item) {
  const name = textInput('name', item.name, { required: true, maxLength: 50 });
  const desc = textArea('description', item.desc, { rows: 3 });
  const available = el('input', { type: 'checkbox', name: 'is_available', checked: !item.soldOut });
  const price = item.variants ? null : numberInput('price', toWon(item.price), { required: true });
  const variants = (item.variants || []).map((v) => ({
    v,
    label: textInput('variant_label', v.label, { required: true, maxLength: 30 }),
    price: numberInput('variant_price', toWon(v.price), { required: true }),
  }));
  const options = (item.options || []).map((o) => ({
    o,
    label: textInput('option_label', o.label, { required: true, maxLength: 30 }),
    price: numberInput('option_price', toWon(o.price), { required: true }),
  }));

  const pair = ({ label, price: p }) => el('div', { class: 'admin-pair' }, [label, p, el('span', { class: 'admin-pair__unit', text: '원' })]);

  openDialog({
    title: `${cat.ko} · 메뉴 수정`,
    fields: [
      field('메뉴 이름', name),
      price ? field('가격 (원)', price) : null,
      variants.length ? el('fieldset', { class: 'admin-group' }, [el('legend', { text: '종류별 가격 (원)' }), ...variants.map(pair)]) : null,
      options.length ? el('fieldset', { class: 'admin-group' }, [el('legend', { text: '추가 옵션 (원)' }), ...options.map(pair)]) : null,
      field('설명', desc),
      el('label', { class: 'admin-check' }, [available, ' 판매 중 (끄면 "품절" 표시)']),
    ].filter(Boolean),
    onSave: async () => {
      const row = {
        name: name.value.trim(),
        description: desc.value.trim() || null,
        is_available: available.checked,
      };
      if (price) row.price = wonValue(price, '가격');
      const variantRows = variants.map((x) => ({ id: x.v.id, label: x.label.value.trim(), price: wonValue(x.price, x.v.label) }));
      const optionRows = options.map((x) => ({ id: x.o.id, label: x.label.value.trim(), extra_price: wonValue(x.price, x.o.label) }));

      check(await sb.from('menus').update(row).eq('id', item.id).select('id'), '메뉴');
      for (const v of variantRows) {
        check(await sb.from('menu_variants').update({ label: v.label, price: v.price }).eq('id', v.id).select('id'), `종류 ${v.label}`);
      }
      for (const o of optionRows) {
        check(await sb.from('menu_options').update({ label: o.label, extra_price: o.extra_price }).eq('id', o.id).select('id'), `옵션 ${o.label}`);
      }
      await window.menuPage.reload();
    },
  });
}

function editCategory(cat) {
  const ko = textInput('name_ko', cat.ko, { required: true, maxLength: 30 });
  const en = textInput('name_en', cat.en, { required: true, maxLength: 30 });
  const note = textInput('note', cat.note || '', { maxLength: 100 });
  openDialog({
    title: '카테고리 수정',
    fields: [
      field('한글 이름', ko),
      field('영어 이름', en),
      field('안내 문구', note, '비우면 HOT / ICE 표시가 보여요. 예: 매장 직접 제조 · 1인 1잔'),
    ],
    onSave: async () => {
      check(await sb.from('categories').update({
        name_ko: ko.value.trim(),
        name_en: en.value.trim(),
        note: note.value.trim() || null,
      }).eq('id', cat.id).select('id'), '카테고리');
      await window.menuPage.reload();
    },
  });
}

function decorateMenu() {
  const page = window.menuPage;
  const board = document.querySelector('.js-board');
  if (!page || !board) return;
  const cats = page.categories;

  board.querySelectorAll('.menu-cat').forEach((section) => {
    const head = section.querySelector('.menu-cat__head');
    if (!head || head.querySelector('.admin-pen')) return;
    const cat = cats.find((c) => c.id === section.dataset.cat);
    if (cat) head.append(pen(`${cat.ko} 카테고리`, () => editCategory(cat)));
  });

  board.querySelectorAll('.menu-item').forEach((btn) => {
    const li = btn.parentElement;
    if (li.querySelector('.admin-pen')) return;
    const cat = cats.find((c) => c.id === btn.dataset.cat);
    const item = cat && cat.items[Number(btn.dataset.idx)];
    if (!item) return;
    const p = pen(item.name, () => {
      if (item.id == null) {
        alertDialog('메뉴 수정', 'Supabase 메뉴를 아직 불러오지 못해서 js/menu-data.js 의 메뉴를 보여 주는 중이에요. 잠시 뒤 새로고침해 주세요.');
        return;
      }
      editMenuItem(cat, item);
    });
    li.classList.add('admin-row');
    li.append(p);
  });
}

/* ---------- 시작 ---------- */

function decorateAll() {
  if (!active) return;
  if (window.siteContent) {
    decorateTexts();
    decorateNotices();
  }
  decorateMenu();
}

function injectCss() {
  if (document.querySelector('link[data-admin-css]')) return;
  document.head.append(el('link', { rel: 'stylesheet', href: 'css/admin.css', 'data-admin-css': true }));
}

function deactivate() {
  active = false;
  dialog = null;
  root.classList.remove('admin-on', 'is-admin');
  document.querySelectorAll('[data-admin-ui]').forEach((node) => node.remove());
  document.querySelectorAll('.admin-row').forEach((node) => node.classList.remove('admin-row'));
}

async function activate(session) {
  const ok = await checkAdmin(session);
  if (!ok) {
    if (active) deactivate();
    return;
  }
  userId = session.user.id;
  if (active) return;
  active = true;
  injectCss();
  root.classList.add('is-admin');
  renderBar();
  applySwitch();
  decorateAll();
  // 관리자는 숨긴 공지도 보이게 다시 읽음
  if (document.querySelector('.notices') && window.siteContent) {
    window.siteContent.ready.then(() => reloadNotices()).catch((err) => console.info('[admin] 공지를 읽지 못했어요.', err.message));
  }
}

['site-texts-applied', 'notices-rendered', 'menu-rendered'].forEach((name) => {
  document.addEventListener(name, decorateAll);
});

(async () => {
  try {
    sb = await getSupabaseOrNull();
    if (!sb) return;
    let last = null;
    sb.auth.onAuthStateChange((event, session) => {
      const id = session?.user?.id || null;
      if (id === last && event !== 'SIGNED_IN') return;
      last = id;
      // onAuthStateChange 안에서 바로 Supabase를 부르면 멈출 수 있어서 한 박자 뒤에
      setTimeout(() => {
        if (session) activate(session);
        else deactivate();
      }, 0);
    });
  } catch (err) {
    console.error('[admin]', err);
  }
})();
