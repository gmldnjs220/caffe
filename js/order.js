// 주문 페이지: 메뉴 고르기 + 장바구니 (menu-data.js 다음에 실행)
// - 가격은 menu-data.js의 1,000원 단위 값을 원 단위 정수로 바꿔서 계산함 (소수점 오차 방지)
// - 장바구니는 이 브라우저에만 저장됨(localStorage). 다른 기기와는 공유되지 않음
// - 주문하기: 전화번호(필수)와 함께 Supabase place_order() 함수로 DB에 저장 (결제 단계는 아직 없음)

const filterEl = document.querySelector('.js-filter');
const gridEl = document.querySelector('.js-grid');

const toWon = (p) => Math.round(p * 1000);
const won = (n) => `${n.toLocaleString('ko-KR')}원`;
const MAX_QTY = 20;
const STORE_KEY = 'onebottle-cart';

const TEMP_TEXT = { hot: 'HOT', ice: 'ICE' };

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('data-') || key.startsWith('aria-') || ['type', 'name', 'value', 'for', 'id'].includes(key)) node.setAttribute(key, value);
    else node[key] = value;
  });
  [].concat(children).forEach((child) => child && node.append(child));
  return node;
}

// X 모양 아이콘 (svg는 createElementNS로 만들어야 그려짐)
function closeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
  return svg;
}

const findCat = (id) => CATEGORIES.find((c) => c.id === id);
const findItem = (cat, name) => cat && cat.items.find((i) => i.name === name);
const tempOf = (cat, item) => ('temp' in item ? item.temp : cat.temp);

// 품절 (menu-data.js의 soldOut: true). 종류(variants)가 모두 품절이면 메뉴 전체가 품절
const isSoldOut = (item) => Boolean(item.soldOut) || Boolean(item.variants && item.variants.every((v) => v.soldOut));
const lineSoldOut = (item, line) => isSoldOut(item)
  || Boolean(line.variant && item.variants && (item.variants.find((v) => v.label === line.variant) || {}).soldOut);

// 옵션 조합까지 반영한 한 잔(한 개) 가격
function unitPrice(item, choice) {
  const base = item.variants
    ? toWon((item.variants.find((v) => v.label === choice.variant) || item.variants[0]).price)
    : toWon(item.price);
  const extra = (item.options || [])
    .filter((o) => choice.options.includes(o.label))
    .reduce((sum, o) => sum + toWon(o.price), 0);
  return base + extra;
}

function choiceText(choice) {
  return [choice.temp && TEMP_TEXT[choice.temp], choice.variant, ...choice.options].filter(Boolean).join(' · ');
}

/* ---------- 카테고리 버튼(메뉴 페이지와 같은 모양) + 메뉴 목록 ---------- */

function chip(id, label, count) {
  return el('button', { type: 'button', class: 'chip', 'data-filter': id, 'aria-pressed': 'false' }, [
    el('span', { text: label }),
    count != null ? el('span', { class: 'chip__count', text: String(count) }) : null,
  ]);
}

filterEl.append(chip('all', '전체'));
GROUPS.forEach((group) => {
  CATEGORIES.filter((c) => c.group === group.id).forEach((c) => filterEl.append(chip(c.id, c.ko, c.items.length)));
});

CATEGORIES.forEach((cat) => {
  const list = el('ul', { class: 'order-grid__list' });
  cat.items.forEach((item) => {
    const soldOut = isSoldOut(item);
    const onSale = item.variants ? item.variants.filter((v) => !v.soldOut) : null;
    const price = item.variants
      ? `${won(Math.min(...(onSale.length ? onSale : item.variants).map((v) => toWon(v.price))))}~`
      : won(toWon(item.price));
    list.append(el('li', {}, el('button', {
      type: 'button',
      class: soldOut ? 'order-item is-soldout' : 'order-item',
      'data-cat': cat.id,
      'data-name': item.name,
      'aria-haspopup': soldOut ? null : 'dialog',
      disabled: soldOut,
    }, [
      el('span', { class: 'order-item__name', text: item.name }),
      el('span', { class: 'order-item__price', text: price }),
      soldOut
        ? el('span', { class: 'order-item__soldout', text: '품절' })
        : el('span', { class: 'order-item__add', 'aria-hidden': 'true', text: '+' }),
    ])));
  });

  gridEl.append(el('section', { class: 'order-cat', 'data-cat': cat.id, 'aria-labelledby': `ocat-${cat.id}` }, [
    el('h2', { class: 'order-cat__title', id: `ocat-${cat.id}` }, [
      el('span', { class: 'order-cat__en', text: cat.en }),
      el('span', { class: 'order-cat__ko', text: cat.ko }),
      cat.note ? el('span', { class: 'order-cat__note', text: cat.note }) : null,
    ]),
    list,
  ]));
});

const validIds = new Set(['all', ...CATEGORIES.map((c) => c.id)]);

function applyFilter(id) {
  const filter = validIds.has(id) ? id : 'all';
  filterEl.querySelectorAll('.chip').forEach((btn) => {
    const on = btn.dataset.filter === filter;
    btn.setAttribute('aria-pressed', String(on));
    if (on) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  });
  gridEl.querySelectorAll('.order-cat').forEach((sec) => {
    sec.hidden = filter !== 'all' && sec.dataset.cat !== filter;
  });
  const hash = filter === 'all' ? '' : `#${filter}`;
  if (location.hash !== hash) history.replaceState(null, '', hash || location.href.split('#')[0]);
}

filterEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (btn) applyFilter(btn.dataset.filter);
});
window.addEventListener('hashchange', () => applyFilter(location.hash.slice(1)));
applyFilter(location.hash.slice(1) || 'all');

/* ---------- 장바구니 데이터 ---------- */

// 한 줄 = { catId, name, temp, variant, options: [], qty }
let cart = [];

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cart));
  } catch (err) { /* 개인정보 보호 모드 등에서는 저장 없이 동작 */ }
}

// 장바구니를 불러오면서 없어진 메뉴는 버리고, 그사이 품절된 메뉴는 빼서 이름 목록으로 돌려줌
function load() {
  const removed = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    cart = Array.isArray(saved)
      ? saved.filter((line) => {
        const item = findItem(findCat(line.catId), line.name);
        if (!item || !(line.qty > 0)) return false;
        if (lineSoldOut(item, line)) {
          removed.push(line.name);
          return false;
        }
        return true;
      })
      : [];
  } catch (err) {
    cart = [];
  }
  if (removed.length) save();
  return removed;
}

const sameChoice = (a, b) => a.catId === b.catId && a.name === b.name && a.temp === b.temp
  && a.variant === b.variant && a.options.join('|') === b.options.join('|');

function addToCart(line) {
  const found = cart.find((l) => sameChoice(l, line));
  if (found) found.qty = Math.min(MAX_QTY, found.qty + line.qty);
  else cart.push(line);
  save();
  renderCart();
}

function lineTotal(line) {
  const item = findItem(findCat(line.catId), line.name);
  return unitPrice(item, line) * line.qty;
}

/* ---------- 장바구니 화면 ---------- */

const cartEl = document.querySelector('.js-cart');
const cartList = document.querySelector('.js-cart-list');
const cartEmpty = document.querySelector('.js-cart-empty');
const cartCount = document.querySelector('.js-cart-count');
const cartTotal = document.querySelector('.js-cart-total');
const cartSubmit = document.querySelector('.js-cart-submit');
const cartClear = document.querySelector('.js-cart-clear');
const bar = document.querySelector('.js-cart-bar');
const barCount = document.querySelector('.js-bar-count');
const barTotal = document.querySelector('.js-bar-total');
const dim = document.querySelector('.js-cart-dim');

function renderCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const total = cart.reduce((n, l) => n + lineTotal(l), 0);

  cartList.replaceChildren(...cart.map((line, i) => el('li', { class: 'cart-line' }, [
    el('div', { class: 'cart-line__info' }, [
      el('span', { class: 'cart-line__name', text: line.name }),
      choiceText(line) ? el('span', { class: 'cart-line__opt', text: choiceText(line) }) : null,
    ]),
    el('button', { type: 'button', class: 'cart-line__remove', 'data-remove': String(i), 'aria-label': `${line.name} 빼기` }, closeIcon()),
    el('div', { class: 'stepper stepper--sm' }, [
      el('button', { type: 'button', class: 'stepper__btn', 'data-dec': String(i), 'aria-label': `${line.name} 하나 줄이기`, text: '−' }),
      el('span', { class: 'stepper__value', text: String(line.qty) }),
      el('button', { type: 'button', class: 'stepper__btn', 'data-inc': String(i), 'aria-label': `${line.name} 하나 늘리기`, text: '+', disabled: line.qty >= MAX_QTY }),
    ]),
    el('strong', { class: 'cart-line__price', text: won(lineTotal(line)) }),
  ])));

  cartEmpty.hidden = cart.length > 0;
  cartClear.hidden = cart.length === 0;
  cartCount.textContent = String(count);
  cartTotal.textContent = won(total);
  cartSubmit.disabled = cart.length === 0;

  bar.hidden = cart.length === 0;
  barCount.textContent = String(count);
  barTotal.textContent = won(total);
  if (cart.length === 0) setCartOpen(false);
  fitCartList();
}

// 장바구니에 4줄보다 많이 담으면 4줄 높이까지만 보이고 나머지는 장바구니 안에서 스크롤
const CART_VISIBLE_LINES = 4;

function fitCartList() {
  const lines = cartList.children;
  cartList.style.maxHeight = lines.length > CART_VISIBLE_LINES
    ? `${lines[CART_VISIBLE_LINES].offsetTop - cartList.offsetTop}px`
    : '';
}

window.addEventListener('resize', fitCartList);

cartList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { inc, dec, remove } = btn.dataset;
  if (inc != null) cart[inc].qty = Math.min(MAX_QTY, cart[inc].qty + 1);
  if (dec != null) {
    cart[dec].qty -= 1;
    if (cart[dec].qty <= 0) cart.splice(dec, 1);
  }
  if (remove != null) cart.splice(remove, 1);
  save();
  renderCart();
});

cartClear.addEventListener('click', () => {
  if (!window.confirm('장바구니를 모두 비울까요?')) return;
  cart = [];
  save();
  renderCart();
});

// 휴대폰: 아래에서 올라오는 장바구니
function setCartOpen(open) {
  cartEl.classList.toggle('is-open', open);
  dim.hidden = !open;
  bar.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('is-cart-open', open);
}

bar.addEventListener('click', () => setCartOpen(true));
dim.addEventListener('click', () => setCartOpen(false));
document.querySelector('.js-cart-close').addEventListener('click', () => setCartOpen(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartEl.classList.contains('is-open')) setCartOpen(false);
});

/* ---------- 옵션 고르기 ---------- */

const pick = document.querySelector('.js-pick');
const pickCat = pick.querySelector('.js-pick-cat');
const pickTitle = pick.querySelector('#pick-title');
const pickDesc = pick.querySelector('.js-pick-desc');
const pickFields = pick.querySelector('.js-pick-fields');
const pickQty = pick.querySelector('.js-qty');
const pickTotal = pick.querySelector('.js-pick-total');
const qtyMinus = pick.querySelector('.js-qty-minus');
const qtyPlus = pick.querySelector('.js-qty-plus');

let picking = null; // { cat, item, choice, qty }

function radioGroup(title, name, values, checked, render = (v) => v) {
  return el('fieldset', { class: 'pick__group' }, [
    el('legend', { class: 'pick__label', text: title }),
    el('div', { class: 'pick__choices' }, values.map((v) => el('label', { class: v.soldOut ? 'choice is-soldout' : 'choice' }, [
      el('input', { type: 'radio', name, value: v.value, checked: v.value === checked, disabled: v.soldOut }),
      el('span', { class: 'choice__box' }, render(v)),
    ]))),
  ]);
}

function updatePickTotal() {
  pickQty.textContent = String(picking.qty);
  qtyMinus.disabled = picking.qty <= 1;
  qtyPlus.disabled = picking.qty >= MAX_QTY;
  pickTotal.textContent = won(unitPrice(picking.item, picking.choice) * picking.qty);
}

function openPick(cat, item) {
  const temp = tempOf(cat, item);
  const firstOnSale = item.variants && item.variants.find((v) => !v.soldOut);
  const choice = {
    temp: temp === 'both' ? 'ice' : (temp || null),
    variant: firstOnSale ? firstOnSale.label : null, // 품절이 아닌 첫 번째 종류를 미리 골라 둠
    options: [],
  };
  picking = { cat, item, choice, qty: 1 };

  pickCat.textContent = `${cat.en} · ${cat.ko}`;
  pickTitle.textContent = item.name;
  pickDesc.textContent = item.desc;

  const fields = [];
  if (temp === 'both') {
    fields.push(radioGroup('온도', 'temp', [
      { value: 'hot', label: 'HOT' }, { value: 'ice', label: 'ICE' },
    ], choice.temp, (v) => el('span', { class: `choice__temp choice__temp--${v.value}`, text: v.label })));
  } else if (temp) {
    fields.push(el('p', { class: 'pick__fixed' }, el('span', { class: `tag tag--${temp}`, text: `${TEMP_TEXT[temp]} ONLY` })));
  }
  if (item.variants) {
    fields.push(radioGroup('종류', 'variant', item.variants.map((v) => ({ value: v.label, price: v.price, soldOut: v.soldOut })), choice.variant,
      (v) => [el('span', { text: v.value }), el('span', { class: 'choice__price', text: v.soldOut ? '품절' : won(toWon(v.price)) })]));
  }
  if (item.options) {
    fields.push(el('fieldset', { class: 'pick__group' }, [
      el('legend', { class: 'pick__label', text: '추가 옵션' }),
      el('div', { class: 'pick__choices pick__choices--stack' }, item.options.map((o) => el('label', { class: 'choice' }, [
        el('input', { type: 'checkbox', name: 'option', value: o.label }),
        el('span', { class: 'choice__box' }, [
          el('span', { text: o.label }),
          el('span', { class: 'choice__price', text: `+${won(toWon(o.price))}` }),
        ]),
      ]))),
    ]));
  }
  pickFields.replaceChildren(...fields);
  pickFields.hidden = fields.length === 0;

  updatePickTotal();
  pick.showModal();
}

pickFields.addEventListener('change', (e) => {
  const input = e.target;
  if (input.name === 'temp') picking.choice.temp = input.value;
  if (input.name === 'variant') picking.choice.variant = input.value;
  if (input.name === 'option') {
    // 메뉴 데이터에 적힌 순서대로 정리해서 같은 조합이면 장바구니에서 한 줄로 합쳐지게 함
    const on = new Set([...pickFields.querySelectorAll('input[name="option"]:checked')].map((i) => i.value));
    picking.choice.options = picking.item.options.map((o) => o.label).filter((l) => on.has(l));
  }
  updatePickTotal();
});

qtyMinus.addEventListener('click', () => { picking.qty = Math.max(1, picking.qty - 1); updatePickTotal(); });
qtyPlus.addEventListener('click', () => { picking.qty = Math.min(MAX_QTY, picking.qty + 1); updatePickTotal(); });

function showToast(text) {
  const toast = document.querySelector('.js-toast') || document.body.appendChild(el('div', { class: 'toast js-toast', role: 'status' }));
  toast.textContent = text;
  toast.classList.remove('is-show');
  void toast.offsetWidth;
  toast.classList.add('is-show');
}

pick.querySelector('.js-pick-add').addEventListener('click', () => {
  const line = { catId: picking.cat.id, name: picking.item.name, ...picking.choice, qty: picking.qty };
  if (lineSoldOut(picking.item, line)) return; // 품절은 담지 않음 (보통은 버튼이 막혀 있어서 여기까지 안 옴)
  addToCart(line);
  pick.close();
  showToast(`${picking.item.name} ${picking.qty}개를 담았어요`);
});

pick.querySelector('.js-pick-close').addEventListener('click', () => pick.close());
pick.addEventListener('click', (e) => { if (e.target === pick) pick.close(); });

gridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.order-item');
  if (!btn) return;
  const cat = findCat(btn.dataset.cat);
  openPick(cat, findItem(cat, btn.dataset.name));
});

/* ---------- 주문 내역 확인 ---------- */

const confirmDlg = document.querySelector('.js-confirm');
const confirmMain = confirmDlg.querySelector('.js-confirm-main');
const confirmList = confirmDlg.querySelector('.js-confirm-list');
const confirmTotal = confirmDlg.querySelector('.js-confirm-total');
const confirmForm = confirmDlg.querySelector('.js-confirm-form');
const confirmError = confirmDlg.querySelector('.js-confirm-error');
const confirmDone = confirmDlg.querySelector('.js-confirm-done');
const phoneInput = confirmDlg.querySelector('.js-order-phone');
const complete = confirmDlg.querySelector('.js-complete');

// 숫자만 남긴 전화번호 (DB place_order()와 같은 규칙: 01로 시작하는 10~11자리)
const phoneDigits = (value) => value.replace(/[^0-9]/g, '');
const isPhone = (digits) => /^01[0-9]{8,9}$/.test(digits);

function showConfirmError(text) {
  confirmError.textContent = text;
  confirmError.hidden = !text;
}

// 로그인한 회원이면 가입할 때 적은 전화번호를 미리 넣어 둠 (users.phone)
async function fillMemberPhone() {
  if (!window.sb || phoneInput.value) return;
  try {
    const { data } = await window.sb.auth.getSession();
    const userId = data.session && data.session.user.id;
    if (!userId) return;
    const { data: me } = await window.sb.from('users').select('phone').eq('id', userId).maybeSingle();
    if (me && me.phone && !phoneInput.value) phoneInput.value = me.phone;
  } catch (err) { /* 못 불러오면 직접 입력 */ }
}

// 장바구니 한 줄(메뉴 이름·종류·옵션 이름)을 DB의 id로 바꿔서 place_order()에 넘길 모양으로 만듦
// p_items 예: [{ menu_id: 2, quantity: 2, temp: 'ice', option_ids: [2] }, { menu_id: 61, variant_id: 1, quantity: 1 }]
async function toOrderItems(lines) {
  const [menus, variants, options] = await Promise.all([
    window.sb.from('menus').select('id, category_id, name'),
    window.sb.from('menu_variants').select('id, menu_id, label'),
    window.sb.from('menu_options').select('id, menu_id, label'),
  ]);
  const failed = [menus, variants, options].find((r) => r.error);
  if (failed) throw failed.error;

  return lines.map((line) => {
    const menu = menus.data.find((m) => m.category_id === line.catId && m.name === line.name);
    if (!menu) throw new Error(`${line.name}: 지금은 주문할 수 없는 메뉴예요.`);
    const item = { menu_id: menu.id, quantity: line.qty };
    if (line.temp) item.temp = line.temp;
    if (line.variant) {
      const variant = variants.data.find((v) => v.menu_id === menu.id && v.label === line.variant);
      if (!variant) throw new Error(`${line.name}: ${line.variant}은(는) 지금 주문할 수 없어요.`);
      item.variant_id = variant.id;
    }
    if (line.options.length) {
      item.option_ids = line.options.map((label) => {
        const option = options.data.find((o) => o.menu_id === menu.id && o.label === label);
        if (!option) throw new Error(`${line.name}: ${label} 옵션은 지금 선택할 수 없어요.`);
        return option.id;
      });
    }
    return item;
  });
}

cartSubmit.addEventListener('click', () => {
  confirmList.replaceChildren(...cart.map((line) => el('li', {}, [
    el('div', {}, [
      el('span', { class: 'cart-line__name', text: `${line.name} × ${line.qty}` }),
      choiceText(line) ? el('span', { class: 'cart-line__opt', text: choiceText(line) }) : null,
    ]),
    el('strong', { text: won(lineTotal(line)) }),
  ])));
  confirmTotal.textContent = won(cart.reduce((n, l) => n + lineTotal(l), 0));
  confirmMain.hidden = false;
  complete.hidden = true;
  showConfirmError('');
  setCartOpen(false);
  confirmDlg.showModal();
  fillMemberPhone();
});

confirmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = phoneDigits(phoneInput.value);
  if (!isPhone(phone)) {
    showConfirmError('휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)');
    phoneInput.focus();
    return;
  }
  if (!window.sb) {
    showConfirmError('주문 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    return;
  }

  showConfirmError('');
  confirmDone.disabled = true;
  confirmDone.textContent = '주문하는 중…';
  try {
    const items = await toOrderItems(cart);
    // 가격은 DB가 메뉴 가격으로 다시 계산해서 저장함 (orders, order_items, order_item_options)
    const { data, error } = await window.sb.rpc('place_order', { p_phone: phone, p_items: items });
    if (error) throw error;
    const order = Array.isArray(data) ? data[0] : data;

    cart = [];
    save();
    renderCart();
    complete.querySelector('.js-complete-no').textContent = order ? String(order.order_no) : '-';
    confirmMain.hidden = true;
    complete.hidden = false;
  } catch (err) {
    console.error('[order]', err);
    showConfirmError(err.message || '주문을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
  } finally {
    confirmDone.disabled = false;
    confirmDone.textContent = '주문하기';
  }
});

phoneInput.addEventListener('input', () => showConfirmError(''));
confirmDlg.querySelector('.js-confirm-close').addEventListener('click', () => confirmDlg.close());
confirmDlg.querySelector('.js-confirm-back').addEventListener('click', () => confirmDlg.close());
complete.querySelector('.js-complete-close').addEventListener('click', () => confirmDlg.close());
confirmDlg.addEventListener('click', (e) => { if (e.target === confirmDlg) confirmDlg.close(); });

const removedSoldOut = load();
renderCart();
if (removedSoldOut.length) {
  showToast(`품절된 메뉴(${[...new Set(removedSoldOut)].join(', ')})를 장바구니에서 뺐어요`);
}
