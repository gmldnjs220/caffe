// 리뷰 페이지: 리뷰 요약 + 키워드 + 리뷰 목록 (review-data.js 다음에 실행)

const $ = (sel) => document.querySelector(sel);
const listEl = $('.js-list');
const keywordsEl = $('.js-keywords');
const resetBtn = $('.js-reset');
const filterNote = $('.js-filter-note');

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('data-') || key.startsWith('aria-') || ['type', 'datetime'].includes(key)) node.setAttribute(key, value);
    else node[key] = value;
  });
  [].concat(children).forEach((child) => child && node.append(child));
  return node;
}

const num = (n) => n.toLocaleString('ko-KR');
const dateText = (d) => d.replaceAll('-', '.');

/* ---------- 위쪽: 출처, 예시 표시, 리뷰 수 ---------- */

$('.js-source').textContent = `${REVIEW_SOURCE.name}에 남겨 주신 이야기 · ${dateText(REVIEW_SOURCE.updated)} 기준`;
$('.js-sample').hidden = !REVIEW_SAMPLE;
$('.js-naver').href = REVIEW_SOURCE.url;

$('.js-count').append(
  el('div', { class: 'review-count__item' }, [
    el('dt', { text: '방문자 리뷰' }),
    el('dd', { text: num(REVIEW_SUMMARY.visitor) }),
  ]),
  el('div', { class: 'review-count__item' }, [
    el('dt', { text: '블로그 리뷰' }),
    el('dd', { text: num(REVIEW_SUMMARY.blog) }),
  ]),
);

/* ---------- 키워드 ("이런 점이 좋았어요") ---------- */

const maxCount = Math.max(...REVIEW_KEYWORDS.map((k) => k.count), 1);

REVIEW_KEYWORDS.forEach((k) => {
  const has = REVIEWS.some((r) => r.tags.includes(k.text));
  keywordsEl.append(el('li', {}, el('button', {
    type: 'button',
    class: 'keyword',
    'data-keyword': k.text,
    'aria-pressed': 'false',
    disabled: !has, // 이 키워드가 붙은 리뷰가 없으면 누를 수 없음
    title: has ? `"${k.text}" 리뷰만 보기` : null,
  }, [
    el('span', { class: 'keyword__bar', style: `--w: ${(k.count / maxCount) * 100}%`, 'aria-hidden': 'true' }),
    el('span', { class: 'keyword__text', text: k.text }),
    el('span', { class: 'keyword__count', text: num(k.count) }),
  ])));
});

/* ---------- 리뷰 목록 ---------- */

function card(r) {
  const body = el('p', { class: 'review-card__text', text: r.text });
  return el('li', { class: 'review-card' }, [
    el('header', { class: 'review-card__head' }, [
      el('span', { class: 'review-card__avatar', 'aria-hidden': 'true', text: r.author.charAt(0) }),
      el('div', { class: 'review-card__who' }, [
        el('strong', { class: 'review-card__author', text: r.author }),
        el('span', { class: 'review-card__date' }, [
          '방문 ',
          el('time', { datetime: r.visited, text: dateText(r.visited) }),
        ]),
      ]),
      REVIEW_SAMPLE ? el('span', { class: 'review-card__sample', text: '예시' }) : null,
    ]),
    body,
    el('button', { type: 'button', class: 'review-card__more', hidden: true, 'aria-expanded': 'false', text: '더보기' }),
    (r.menu || r.tags.length) ? el('ul', { class: 'review-card__tags' }, [
      r.menu ? el('li', { class: 'review-tag review-tag--menu', text: r.menu }) : null,
      ...r.tags.map((t) => el('li', { class: 'review-tag', text: t })),
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

function render(keyword) {
  const items = keyword ? REVIEWS.filter((r) => r.tags.includes(keyword)) : REVIEWS;
  listEl.replaceChildren(...items.map(card));
  updateMoreButtons();

  keywordsEl.querySelectorAll('.keyword').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.keyword === keyword));
  });
  resetBtn.hidden = !keyword;
  filterNote.textContent = keyword ? `"${keyword}" 키워드가 붙은 리뷰 ${items.length}개` : '';
}

keywordsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.keyword');
  if (!btn) return;
  render(btn.getAttribute('aria-pressed') === 'true' ? null : btn.dataset.keyword);
});

resetBtn.addEventListener('click', () => render(null));

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

render(null);
