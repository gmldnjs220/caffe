// 메뉴 데이터 불러오기
// Supabase(menu_groups, categories, menus, menu_variants, menu_options)에서 읽어서
// menu-data.js 와 똑같은 모양({ groups, categories })으로 바꿔 줘요.
// Supabase에 연결할 수 없으면 menu-data.js 의 GROUPS / CATEGORIES 를 대신 써요.

(function () {
  // DB 가격은 원 단위, 화면은 1,000원 단위
  const toK = (won) => won / 1000;

  // DB temp_type: 'both' | 'ice' | 'hot' | 'none'  →  화면: 'both' | 'ice' | 'hot' | null
  const toTemp = (t) => (t === 'none' ? null : t);

  function bySort(a, b) {
    return (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id > b.id ? 1 : a.id < b.id ? -1 : 0);
  }

  async function select(table, columns) {
    const { data, error } = await window.sb.from(table).select(columns);
    if (error) throw new Error(`${table}: ${error.message}`);
    return data || [];
  }

  async function fromSupabase() {
    const [groups, categories, menus, variants, options] = await Promise.all([
      select('menu_groups', 'id, name_en, name_ko, sort_order'),
      select('categories', 'id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order'),
      select('menus', 'id, category_id, name, description, price, temp, has_caffeine, has_milk, is_available, sort_order'),
      select('menu_variants', 'id, menu_id, label, price, sort_order'),
      select('menu_options', 'id, menu_id, label, extra_price'),
    ]);

    const variantsByMenu = new Map();
    variants.sort(bySort).forEach((v) => {
      if (!variantsByMenu.has(v.menu_id)) variantsByMenu.set(v.menu_id, []);
      variantsByMenu.get(v.menu_id).push({ label: v.label, price: toK(v.price) });
    });

    const optionsByMenu = new Map();
    options.sort(bySort).forEach((o) => {
      if (!optionsByMenu.has(o.menu_id)) optionsByMenu.set(o.menu_id, []);
      optionsByMenu.get(o.menu_id).push({ label: o.label, price: toK(o.extra_price) });
    });

    const itemsByCat = new Map();
    menus.sort(bySort).forEach((m) => {
      const item = {
        id: m.id,
        name: m.name,
        desc: m.description || '',
        available: m.is_available,
      };
      if (m.price != null) item.price = toK(m.price);
      // 메뉴에 값이 있을 때만 넣어요. 없으면 카테고리 값을 따라가요 (menu.js 의 'temp' in item 규칙)
      if (m.temp != null) item.temp = toTemp(m.temp);
      if (m.has_caffeine != null) item.caffeine = m.has_caffeine;
      if (m.has_milk) item.milk = true;
      if (variantsByMenu.has(m.id)) item.variants = variantsByMenu.get(m.id);
      if (optionsByMenu.has(m.id)) item.options = optionsByMenu.get(m.id);

      if (!itemsByCat.has(m.category_id)) itemsByCat.set(m.category_id, []);
      itemsByCat.get(m.category_id).push(item);
    });

    return {
      groups: groups.sort(bySort).map((g) => ({ id: g.id, en: g.name_en, ko: g.name_ko })),
      categories: categories.sort(bySort).map((c) => {
        const cat = {
          id: c.id,
          group: c.group_id,
          en: c.name_en,
          ko: c.name_ko,
          temp: toTemp(c.default_temp),
          items: itemsByCat.get(c.id) || [],
        };
        if (c.default_caffeine != null) cat.caffeine = c.default_caffeine;
        if (c.note) cat.note = c.note;
        return cat;
      }),
      source: 'supabase',
    };
  }

  function fromLocalFile() {
    if (typeof GROUPS === 'undefined' || typeof CATEGORIES === 'undefined') {
      throw new Error('menu-data.js 를 찾을 수 없어요.');
    }
    return { groups: GROUPS, categories: CATEGORIES, source: 'menu-data.js' };
  }

  // 마지막으로 Supabase에서 받은 메뉴를 브라우저에 저장해 두고, 다음에 열 때 먼저 보여 줘요
  const CACHE_KEY = 'onebottle-menu-cache-v1';

  function readCache() {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (saved && saved.categories && saved.categories.length) return { ...saved, source: 'cache' };
    } catch (err) { /* 저장된 값이 없거나 깨졌으면 무시 */ }
    return null;
  }

  function writeCache(result) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ groups: result.groups, categories: result.categories }));
    } catch (err) { /* 저장이 막힌 브라우저에서도 화면은 그대로 동작 */ }
  }

  // supabase-client.js 가 window.sb 를 만들 때까지 기다림 (라이브러리를 못 불러와도 페이지 load 때는 넘어감)
  function whenSupabaseReady() {
    if ('sb' in window) return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener('sb-ready', resolve, { once: true });
      window.addEventListener('load', resolve, { once: true });
    });
  }

  // 1단계: 기다리지 않고 바로 보여 줄 메뉴 (지난번 DB 메뉴 → 없으면 menu-data.js)
  window.loadMenuQuick = function loadMenuQuick() {
    return readCache() || fromLocalFile();
  };

  // 2단계: Supabase에서 최신 메뉴 읽기. 못 읽으면 null
  window.loadMenu = async function loadMenu() {
    await whenSupabaseReady();
    if (!window.sb) return null;
    try {
      const result = await fromSupabase();
      if (result.categories.length) {
        writeCache(result);
        return result;
      }
      console.warn('[menu] Supabase에 메뉴가 없어서 지금 메뉴를 그대로 써요.');
    } catch (err) {
      console.warn('[menu] Supabase에서 메뉴를 읽지 못해서 지금 메뉴를 그대로 써요.', err);
    }
    return null;
  };
}());
