// 리뷰 페이지: 리뷰 목록 + 리뷰 쓰기 (review-data.js 다음에 실행)
// - 목록: 손님이 직접 쓴 리뷰(Supabase reviews) → review-data.js 리뷰 순서. 10개씩 페이지로 나눔
// - 쓰기: 주문할 때 적은 휴대폰 번호로 그 번호의 주문을 불러와서(get_reviewable_orders)
//         고른 주문 한 건에 리뷰 하나 (write_review). 번호는 공개 안 됨

const $ = (sel) => document.querySelector(sel);
const listEl = $('.js-list');
const pagerEl = $('.js-pager');

const PAGE_SIZE = 10;
let currentPage = 1;

// review-data.js 리뷰
const pickedReviews = REVIEWS;
// Supabase에서 읽은 손님 리뷰
let guestReviews = [];
const allReviews = () => [...guestReviews, ...pickedReviews];

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('data-') || key.startsWith('aria-') || ['type', 'datetime', 'value'].includes(key)) node.setAttribute(key, value);
    else node[key] = value;
  });
  [].concat(children).forEach((child) => child && node.append(child));
  return node;
}

const num = (n) => n.toLocaleString('ko-KR');
const dateText = (d) => d.replaceAll('-', '.');

/* ---------- 위쪽: 리뷰 수 ---------- */

$('.js-naver').href = REVIEW_SOURCE.url;

/* ---------- 리뷰 목록 ---------- */

function card(r) {
  const body = el('p', { class: 'review-card__text', text: r.text });
  return el('li', { class: 'review-card' }, [
    el('header', { class: 'review-card__head' }, [
      el('span', { class: 'review-card__avatar', 'aria-hidden': 'true', text: r.author.charAt(0) }),
      el('div', { class: 'review-card__who' }, [
        el('strong', { class: 'review-card__author', text: r.author }),
        el('span', { class: 'review-card__date' }, [
          r.rating ? el('span', { class: 'review-card__stars', 'aria-label': `별점 ${r.rating}점`, text: '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) }) : null,
          r.rating ? ' ' : null,
          r.written ? '작성 ' : '방문 ',
          el('time', { datetime: r.visited, text: dateText(r.visited) }),
        ]),
      ]),
    ]),
    body,
    el('button', { type: 'button', class: 'review-card__more', hidden: true, 'aria-expanded': 'false', text: '더보기' }),
    r.menu ? el('ul', { class: 'review-card__tags' }, [
      el('li', { class: 'review-tag review-tag--menu', text: r.menu }),
    ]) : null,
  ]);
}

// 여섯 줄이 넘는 긴 리뷰에만 "더보기" 버튼 보이기
function updateMoreButtons() {
  listEl.querySelectorAll('.review-card').forEach((c) => {
    const text = c.querySelector('.review-card__text');
    const btn = c.querySelector('.review-card__more');
    if (btn.getAttribute('aria-expanded') === 'true') return;
    btn.hidden = text.scrollHeight <= text.clientHeight + 1;
  });
}

// 1, 2, 3 … 페이지 번호 (10개 이하면 숨김)
function renderPager(total) {
  const pages = Math.ceil(total / PAGE_SIZE);
  pagerEl.hidden = pages <= 1;
  pagerEl.replaceChildren(...Array.from({ length: pages }, (_, i) => el('button', {
    type: 'button',
    class: 'pager__btn',
    'data-page': String(i + 1),
    'aria-current': i + 1 === currentPage ? 'page' : null,
    'aria-label': `${i + 1}페이지`,
    text: String(i + 1),
  })));
}

function render(page = 1) {
  const items = allReviews();
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, page), pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  listEl.replaceChildren(...items.slice(start, start + PAGE_SIZE).map(card));
  renderPager(items.length);
  updateMoreButtons();
}

pagerEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.pager__btn');
  if (!btn) return;
  render(Number(btn.dataset.page));
  $('#review-list-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.review-card__more');
  if (!btn) return;
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.closest('.review-card').classList.toggle('is-open', open);
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? '접기' : '더보기';
});

window.addEventListener('resize', updateMoreButtons);
// 글꼴이 늦게 불러와지면 줄 수가 바뀔 수 있어서 한 번 더 확인
if (document.fonts) document.fonts.ready.then(updateMoreButtons);

render();

/* ---------- Supabase: 손님 리뷰 읽기 ---------- */

// supabase-client.js 가 window.sb 를 만들 때까지 기다림 (못 불러와도 페이지 load 때는 넘어감)
function whenSupabaseReady() {
  if ('sb' in window) return Promise.resolve(window.sb);
  return new Promise((resolve) => {
    const done = () => resolve(window.sb || null);
    window.addEventListener('sb-ready', done, { once: true });
    window.addEventListener('load', done, { once: true });
  });
}

let menuNames = new Map();

async function loadGuestReviews() {
  const sb = await whenSupabaseReady();
  if (!sb) return;
  try {
    const [reviews, menus] = await Promise.all([
      sb.from('reviews').select('id, menu_id, order_menus, nickname, rating, content, created_at')
        .eq('is_hidden', false).order('created_at', { ascending: false }).limit(300),
      sb.from('menus').select('id, name').order('id'),
    ]);
    if (menus.data) menuNames = new Map(menus.data.map((m) => [m.id, m.name]));
    if (reviews.error) throw reviews.error;
    guestReviews = reviews.data.map((r) => ({
      author: r.nickname || '손님',
      visited: r.created_at.slice(0, 10),
      written: true,
      text: r.content,
      rating: r.rating,
      tags: [],
      menu: r.order_menus || menuNames.get(r.menu_id), // 주문 리뷰는 그 주문의 메뉴 이름
    }));
    render(currentPage);
  } catch (err) {
    console.warn('[review] 손님 리뷰를 불러오지 못했어요.', err);
  }
}

loadGuestReviews();

/* ---------- 리뷰 쓰기 ---------- */

const writeDlg = $('.js-write');
const writeForm = $('.js-write-form');
const writeError = $('.js-write-error');
const writeSubmit = $('.js-write-submit');
const writeCount = $('.js-write-count');
const lookupBtn = $('.js-write-lookup');
const itemSelect = $('#write-item'); // writeForm.elements.item 은 이름이 겹치는 기본 함수라서 id로 찾음
const phoneDigits = (v) => v.replace(/[^0-9]/g, '');
const isPhone = (digits) => /^01[0-9]{8,9}$/.test(digits);
let lookedUpPhone = '';

// 예: "2026.11.24 · 주문번호 12 · 아메리카노, 카페라떼"
function orderLabel(o) {
  const menus = o.menus || '';
  const short = menus.length > 28 ? `${menus.slice(0, 28)}…` : menus;
  return `${dateText(o.order_date)} · 주문번호 ${o.order_no}${short ? ` · ${short}` : ''}`;
}

function setItemOptions(placeholder, items = []) {
  itemSelect.replaceChildren(
    el('option', { value: '', text: placeholder }),
    ...items.map((o) => el('option', { value: String(o.order_id), text: orderLabel(o) })),
  );
  itemSelect.disabled = items.length === 0;
}

// 번호로 한 주문 중 아직 리뷰 안 쓴 것 불러오기
async function lookupItems() {
  const phone = phoneDigits(writeForm.elements.phone.value);
  if (!isPhone(phone)) {
    showWriteError('휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)');
    writeForm.elements.phone.focus();
    return;
  }
  const sb = await whenSupabaseReady();
  if (!sb) { showWriteError('리뷰 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'); return; }

  lookupBtn.disabled = true;
  setItemOptions('주문을 찾는 중…');
  try {
    const { data, error } = await sb.rpc('get_reviewable_orders', { p_phone: phone });
    if (error) throw error;
    lookedUpPhone = phone;
    if (data.length) {
      setItemOptions('주문을 골라 주세요', data);
      if (data.length === 1) itemSelect.value = String(data[0].order_id);
    } else {
      setItemOptions('리뷰를 쓸 수 있는 주문이 없어요');
      showWriteError('이 번호로 최근 30일 안에 한 주문이 없거나, 이미 모두 리뷰를 썼어요.');
    }
  } catch (err) {
    console.error('[review]', err);
    setItemOptions('번호를 넣고 주문 찾기를 눌러 주세요');
    showWriteError(err.message || '주문을 불러오지 못했어요.');
  } finally {
    lookupBtn.disabled = false;
  }
}

lookupBtn.addEventListener('click', lookupItems);
// 번호를 바꾸면 불러온 주문은 다시 찾아야 함
writeForm.elements.phone.addEventListener('input', () => {
  if (lookedUpPhone && phoneDigits(writeForm.elements.phone.value) !== lookedUpPhone) {
    lookedUpPhone = '';
    setItemOptions('번호를 넣고 주문 찾기를 눌러 주세요');
  }
});
writeForm.elements.phone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); lookupItems(); }
});

function showWriteError(text) {
  writeError.textContent = text;
  writeError.hidden = !text;
}

$('.js-write-open').addEventListener('click', () => {
  showWriteError('');
  writeDlg.showModal();
});
writeDlg.querySelectorAll('.js-write-close').forEach((b) => b.addEventListener('click', () => writeDlg.close()));
writeDlg.addEventListener('click', (e) => { if (e.target === writeDlg) writeDlg.close(); });
writeForm.elements.content.addEventListener('input', (e) => { writeCount.textContent = String(e.target.value.length); });
writeForm.addEventListener('input', () => showWriteError(''));

writeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = writeForm.elements;
  const nickname = f.nickname.value.trim();
  const phone = phoneDigits(f.phone.value);
  const content = f.content.value.trim();
  const rating = Number(f.rating.value);

  if (!isPhone(phone)) { showWriteError('휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)'); f.phone.focus(); return; }
  if (phone !== lookedUpPhone || !itemSelect.value) { showWriteError('주문 찾기를 누르고 리뷰 쓸 주문을 골라 주세요.'); (phone !== lookedUpPhone ? lookupBtn : itemSelect).focus(); return; }
  if (!nickname) { showWriteError('닉네임을 적어 주세요.'); f.nickname.focus(); return; }
  if (content.length < 5) { showWriteError('리뷰를 5자 이상 적어 주세요.'); f.content.focus(); return; }

  const sb = await whenSupabaseReady();
  if (!sb) { showWriteError('리뷰 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'); return; }

  writeSubmit.disabled = true;
  writeSubmit.textContent = '등록하는 중…';
  try {
    const { error } = await sb.rpc('write_review', {
      p_phone: phone,
      p_nickname: nickname,
      p_rating: rating,
      p_content: content,
      p_order_id: Number(itemSelect.value),
    });
    if (error) throw error;
    writeForm.reset();
    writeCount.textContent = '0';
    lookedUpPhone = '';
    setItemOptions('번호를 넣고 주문 찾기를 눌러 주세요');
    writeDlg.close();
    await loadGuestReviews();
    render(1);
    $('#review-list-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('[review]', err);
    showWriteError(err.message || '리뷰를 등록하지 못했어요. 잠시 후 다시 시도해 주세요.');
  } finally {
    writeSubmit.disabled = false;
    writeSubmit.textContent = '등록하기';
  }
});
