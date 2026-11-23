// 메뉴 페이지: 카테고리 필터 + 메뉴 상세 보기 (menu-api.js 다음에 실행)
// 메뉴 데이터는 loadMenu()가 Supabase에서 읽어 와요. 연결이 안 되면 menu-data.js 를 써요.

const filterEl = document.querySelector('.js-filter');
const boardEl = document.querySelector('.js-board');
const sheet = document.querySelector('.js-sheet');

let menuGroups = [];
let menuCats = [];

const short = (p) => (p == null ? '-' : p.toFixed(1));
const won = (p) => `${Math.round(p * 1000).toLocaleString('ko-KR')}원`;

const TEMP_LABEL = {
  both: [{ text: 'HOT', cls: 'hot' }, { text: 'ICE', cls: 'ice' }],
  ice: [{ text: 'ICE ONLY', cls: 'ice' }],
  hot: [{ text: 'HOT ONLY', cls: 'hot' }],
};

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('data-') || key.startsWith('aria-') || key === 'type' || key === 'hidden') node.setAttribute(key, value);
    else node[key] = value;
  });
  [].concat(children).forEach((child) => child && node.append(child));
  return node;
}

/* ---------- 카테고리 버튼 ---------- */

function chip(id, label, count) {
  return el('button', { type: 'button', class: 'chip', 'data-filter': id, 'aria-pressed': 'false' }, [
    el('span', { text: label }),
    count != null ? el('span', { class: 'chip__count', text: String(count) }) : null,
  ]);
}

function renderMenu() {
  filterEl.append(chip('all', '전체'));
  menuGroups.forEach((group) => {
    menuCats.filter((c) => c.group === group.id).forEach((c) => {
      filterEl.append(chip(c.id, c.ko, c.items.length));
    });
  });

  /* ---------- 메뉴판 ---------- */

  menuGroups.forEach((group) => {
    const cats = menuCats.filter((c) => c.group === group.id);
    const cols = el('div', { class: 'menu-group__cols' });

    cats.forEach((cat) => {
      const list = el('ul', { class: 'menu-list' });
      cat.items.forEach((item, idx) => {
        const price = item.variants
          ? item.variants.map((v) => short(v.price)).join(' / ')
          : short(item.price);
        list.append(el('li', {}, el('button', {
          type: 'button', class: 'menu-item', 'data-cat': cat.id, 'data-idx': String(idx),
          'aria-haspopup': 'dialog',
        }, [
          el('span', { class: 'menu-item__name', text: item.name }),
          el('span', { class: 'menu-item__lead', 'aria-hidden': 'true' }),
          el('span', { class: 'menu-item__price', text: price }),
        ])));
      });

      const meta = cat.note || (cat.temp ? TEMP_LABEL[cat.temp].map((t) => t.text).join(' / ') : '');
      cols.append(el('section', { class: 'menu-cat', 'data-cat': cat.id, 'aria-labelledby': `cat-${cat.id}` }, [
        el('header', { class: 'menu-cat__head' }, [
          el('h3', { class: 'menu-cat__title', id: `cat-${cat.id}`, text: cat.en }),
          el('span', { class: 'menu-cat__ko', text: cat.ko }),
          meta ? el('span', { class: 'menu-cat__meta', text: meta }) : null,
        ]),
        list,
      ]));
    });

    boardEl.append(el('section', { class: 'menu-group', 'data-group': group.id }, [
      el('h2', { class: 'menu-group__title' }, [
        el('span', { class: 'menu-group__en', text: group.en }),
        el('span', { class: 'menu-group__ko', text: group.ko }),
      ]),
      cols,
    ]));
  });
}

/* ---------- 필터 동작 ---------- */

let validIds = new Set(['all']);

function applyFilter(id) {
  const filter = validIds.has(id) ? id : 'all';

  filterEl.querySelectorAll('.chip').forEach((btn) => {
    const on = btn.dataset.filter === filter;
    btn.setAttribute('aria-pressed', String(on));
    if (on) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  });

  boardEl.querySelectorAll('.menu-cat').forEach((sec) => {
    sec.hidden = filter !== 'all' && sec.dataset.cat !== filter;
  });
  boardEl.querySelectorAll('.menu-group').forEach((grp) => {
    grp.hidden = !grp.querySelector('.menu-cat:not([hidden])');
  });

  boardEl.classList.toggle('is-filtered', filter !== 'all');
  boardEl.classList.remove('is-entering');
  void boardEl.offsetWidth; // 애니메이션 재시작
  boardEl.classList.add('is-entering');

  const hash = filter === 'all' ? '' : `#${filter}`;
  if (location.hash !== hash) {
    history.replaceState(null, '', hash || location.href.split('#')[0]);
  }
}

filterEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  applyFilter(btn.dataset.filter);
  const top = boardEl.getBoundingClientRect().top + window.scrollY - filterEl.offsetHeight - 120;
  if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
});

window.addEventListener('hashchange', () => applyFilter(location.hash.slice(1)));

/* ---------- 시작 ---------- */

async function initMenu() {
  boardEl.setAttribute('aria-busy', 'true');
  try {
    const { groups, categories, source } = await window.loadMenu();
    menuGroups = groups;
    menuCats = categories;
    boardEl.dataset.source = source;
    validIds = new Set(['all', ...menuCats.map((c) => c.id)]);
    renderMenu();
    applyFilter(location.hash.slice(1) || 'all');
  } catch (err) {
    console.error('[menu] 메뉴를 불러오지 못했어요.', err);
    boardEl.replaceChildren(el('p', { class: 'menu-board__error', text: '메뉴를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }));
  } finally {
    boardEl.removeAttribute('aria-busy');
  }
}

initMenu();

/* ---------- 상세 보기 ---------- */

const sheetCat = sheet.querySelector('.js-sheet-cat');
const sheetTitle = sheet.querySelector('#sheet-title');
const sheetPrice = sheet.querySelector('.js-sheet-price');
const sheetTags = sheet.querySelector('.js-sheet-tags');
const sheetDesc = sheet.querySelector('.js-sheet-desc');
const sheetOptions = sheet.querySelector('.js-sheet-options');

function openSheet(cat, item) {
  const temp = 'temp' in item ? item.temp : cat.temp;
  const caffeine = 'caffeine' in item ? item.caffeine : cat.caffeine;

  sheetCat.textContent = `${cat.en} · ${cat.ko}`;
  sheetTitle.textContent = item.name;

  sheetPrice.replaceChildren(
    ...(item.variants
      ? item.variants.map((v) => el('div', { class: 'sheet__variant' }, [
        el('span', { text: v.label }),
        el('strong', { text: won(v.price) }),
      ]))
      : [el('strong', { text: won(item.price) })]),
  );
  sheetPrice.classList.toggle('has-variants', Boolean(item.variants));

  const tags = [];
  if (temp) TEMP_LABEL[temp].forEach((t) => tags.push(el('li', { class: `tag tag--${t.cls}`, text: t.text })));
  if (caffeine === true) tags.push(el('li', { class: 'tag', text: '카페인' }));
  if (caffeine === false) tags.push(el('li', { class: 'tag', text: '논카페인' }));
  if (item.milk) tags.push(el('li', { class: 'tag', text: '우유 포함' }));
  if (cat.note) cat.note.split('·').forEach((n) => tags.push(el('li', { class: 'tag', text: n.trim() })));
  sheetTags.replaceChildren(...tags);
  sheetTags.hidden = tags.length === 0;

  sheetDesc.textContent = item.desc;

  if (item.options) {
    sheetOptions.replaceChildren(
      el('h3', { class: 'sheet__sub', text: '추가 옵션' }),
      el('ul', {}, item.options.map((o) => el('li', {}, [
        el('span', { text: o.label }),
        el('span', { text: `+${won(o.price)}` }),
      ]))),
    );
    sheetOptions.hidden = false;
  } else {
    sheetOptions.replaceChildren();
    sheetOptions.hidden = true;
  }

  sheet.showModal();
}

boardEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.menu-item');
  if (!btn) return;
  const cat = menuCats.find((c) => c.id === btn.dataset.cat);
  openSheet(cat, cat.items[Number(btn.dataset.idx)]);
});

sheet.querySelector('.js-sheet-close').addEventListener('click', () => sheet.close());

// 바깥(어두운 배경)을 누르면 닫기
sheet.addEventListener('click', (e) => {
  if (e.target === sheet) sheet.close();
});
