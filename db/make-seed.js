// js/menu-data.js 를 읽어서 메뉴 초기 데이터 SQL(db/seed.sql)을 만드는 스크립트
// 실행 (coffePark 폴더에서): node db/make-seed.js > db/seed.sql
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'menu-data.js'), 'utf8');
const ctx = {};
vm.runInNewContext(src + '\n;this.GROUPS = GROUPS; this.CATEGORIES = CATEGORIES;', ctx);
const { GROUPS, CATEGORIES } = ctx;

// 'O'Reilly' 같은 작은따옴표를 SQL용으로 이스케이프
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const b = (v) => (v === true ? 'true' : v === false ? 'false' : 'NULL');
const won = (p) => (p === undefined || p === null ? 'NULL' : Math.round(p * 1000)); // 4.5 → 4500
// menu-data.js: 값 없음 = 카테고리 따름(NULL), null = 표시 안 함('none')
const temp = (obj, key) => (!(key in obj) ? 'NULL' : obj[key] === null ? "'none'" : q(obj[key]));

const out = [];
out.push('-- 자동 생성 파일: node db/make-seed.js > db/seed.sql');
out.push('-- schema.sql 실행 후에 실행하세요.');
out.push('BEGIN;');
out.push('');

out.push('-- 그룹');
GROUPS.forEach((g, i) => {
  out.push(`INSERT INTO menu_groups (id, name_en, name_ko, sort_order) VALUES (${q(g.id)}, ${q(g.en)}, ${q(g.ko)}, ${i + 1});`);
});
out.push('');

CATEGORIES.forEach((c, ci) => {
  out.push(`-- ${c.ko}`);
  const dTemp = c.temp === null || c.temp === undefined ? "'none'" : q(c.temp);
  out.push(
    `INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ` +
      `(${q(c.id)}, ${q(c.group)}, ${q(c.en)}, ${q(c.ko)}, ${dTemp}, ${b(c.caffeine)}, ${q(c.note)}, ${ci + 1});`
  );

  c.items.forEach((m, mi) => {
    const hasVariants = Array.isArray(m.variants) && m.variants.length > 0;
    out.push(
      `INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ` +
        `(${q(c.id)}, ${q(m.name)}, ${q(m.desc)}, ${hasVariants ? 'NULL' : won(m.price)}, ${temp(m, 'temp')}, ` +
        `${b(m.caffeine)}, ${m.milk ? 'true' : 'false'}, ${mi + 1});`
    );
    const thisMenu = `(SELECT id FROM menus WHERE category_id = ${q(c.id)} AND name = ${q(m.name)})`;
    (m.variants || []).forEach((v, vi) => {
      out.push(`INSERT INTO menu_variants (menu_id, label, price, sort_order) VALUES (${thisMenu}, ${q(v.label)}, ${won(v.price)}, ${vi + 1});`);
    });
    (m.options || []).forEach((o) => {
      out.push(`INSERT INTO menu_options (menu_id, label, extra_price) VALUES (${thisMenu}, ${q(o.label)}, ${won(o.price)});`);
    });
  });
  out.push('');
});

out.push('-- 추천용 기본 취향 태그 (메뉴 연결은 menu_tags에 직접 추가)');
['달콤한', '상큼한', '고소한', '쌉싸름한', '시원한', '든든한'].forEach((t) => {
  out.push(`INSERT INTO tags (name, type) VALUES (${q(t)}, 'taste');`);
});
out.push('');
out.push('COMMIT;');

console.log(out.join('\n'));
