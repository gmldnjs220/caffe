-- 자동 생성 파일: node db/make-seed.js > db/seed.sql
-- schema.sql 실행 후에 실행하세요.
BEGIN;

-- 그룹
INSERT INTO menu_groups (id, name_en, name_ko, sort_order) VALUES ('drinks', 'DRINKS', '음료', 1);
INSERT INTO menu_groups (id, name_en, name_ko, sort_order) VALUES ('dessert', 'DESSERT', '디저트', 2);

-- 커피
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('coffee', 'drinks', 'COFFEE', '커피', 'both', true, NULL, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '에스프레소', '진하게 추출한 커피 원액 한 잔. 원두 본연의 향과 묵직한 바디감을 그대로 느낄 수 있어요.', 4500, NULL, NULL, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '아메리카노', '에스프레소에 물을 더해 깔끔하게 즐기는 기본 커피.', 5500, NULL, NULL, false, 2);
INSERT INTO menu_options (menu_id, label, extra_price) VALUES ((SELECT id FROM menus WHERE category_id = 'coffee' AND name = '아메리카노'), '헤이즐넛 시럽 추가', 1000);
INSERT INTO menu_options (menu_id, label, extra_price) VALUES ((SELECT id FROM menus WHERE category_id = 'coffee' AND name = '아메리카노'), '샷 추가', 1000);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '아메리카노 벤티', '넉넉한 사이즈로 오래 즐기는 아메리카노.', 6500, NULL, NULL, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '카페라떼', '에스프레소와 부드러운 우유가 어우러진 라떼.', 6000, NULL, NULL, true, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '카푸치노', '풍성한 우유 거품을 올린 에스프레소 음료.', 6500, NULL, NULL, true, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '카페모카', '에스프레소에 초콜릿과 우유를 더한 달콤쌉싸름한 커피.', 6500, NULL, NULL, true, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '바닐라라떼', '바닐라의 은은한 단맛을 더한 카페라떼.', 6500, NULL, NULL, true, 7);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '카라멜마끼아또', '부드러운 라떼 위에 카라멜 소스를 올린 달콤한 커피.', 6500, NULL, NULL, true, 8);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '흑당라떼', '진한 흑당 시럽과 우유, 에스프레소가 어우러진 라떼.', 6500, NULL, NULL, true, 9);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '연유라떼', '연유의 고소한 단맛이 어우러진 부드러운 라떼.', 6500, NULL, NULL, true, 10);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '헤이즐넛라떼', '고소한 헤이즐넛 향을 더한 카페라떼.', 6500, NULL, NULL, true, 11);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '달고나라떼', '쌉싸름하고 달콤한 달고나를 더한 라떼.', 6800, NULL, NULL, true, 12);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('coffee', '아포가토', '바닐라 아이스크림 위에 에스프레소를 부어 즐기는 디저트 커피.', 6800, 'none', NULL, false, 13);

-- 라떼
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('latte', 'drinks', 'LATTE', '라떼', 'both', NULL, NULL, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '초코라떼', '진한 초콜릿과 우유로 만든 달콤한 라떼.', 6500, NULL, NULL, true, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '녹차라떼', '쌉싸름한 녹차와 우유가 어우러진 라떼.', 6500, NULL, true, true, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '홍차라떼', '홍차의 향을 우유에 부드럽게 담은 라떼.', 6500, NULL, true, true, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '고구마라떼', '달콤한 고구마를 곱게 갈아 넣은 든든한 라떼.', 6500, NULL, NULL, true, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '민트초코라떼', '상쾌한 민트와 진한 초콜릿의 조합.', 6500, NULL, NULL, true, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '밀크티', '진하게 우린 홍차에 우유를 더한 밀크티.', 6500, NULL, true, true, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('latte', '곡물라떼', '여러 곡물의 고소함을 담은 라떼.', 6500, NULL, NULL, true, 7);

-- 티
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('tea', 'drinks', 'TEA', '티', 'both', NULL, NULL, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 진주자스민', '둥글게 말린 찻잎에 자스민 꽃향을 입힌 녹차.', 6000, NULL, true, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 얼그레이', '베르가못 향이 감도는 클래식 홍차.', 6000, NULL, true, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 카모마일', '은은하고 부드러운 향의 허브티.', 6000, NULL, false, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 페퍼민트', '화한 청량감이 있는 허브티.', 6000, NULL, false, false, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 로즈마리', '향긋하고 깔끔한 허브티.', 6000, NULL, false, false, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 히비스커스', '붉은 빛깔에 새콤한 맛이 나는 허브티.', 6000, NULL, false, false, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유기농 녹차', '산뜻하고 깔끔한 녹차.', 6000, NULL, true, false, 7);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '유자/자몽/레몬티', '과일청으로 만든 차. 유자, 자몽, 레몬 중에서 골라 주세요.', 6000, NULL, NULL, false, 8);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '생강차', '알싸한 생강 향이 몸을 따뜻하게 해주는 전통차.', 6500, NULL, NULL, false, 9);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('tea', '대추차', '대추를 진하게 달여 깊은 단맛이 나는 전통차.', 6500, NULL, NULL, false, 10);

-- 에이드 · 아이스티
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('ade', 'drinks', 'ADE', '에이드 · 아이스티', 'ice', NULL, NULL, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '유자에이드', '향긋한 유자에 탄산수를 더한 에이드.', 6800, NULL, NULL, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '자몽에이드', '쌉싸름하고 상큼한 자몽 에이드.', 6800, NULL, NULL, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '레몬에이드', '새콤한 레몬으로 만든 기본 에이드.', 6800, NULL, NULL, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '체리에이드', '달콤한 체리 향의 에이드.', 6800, NULL, NULL, false, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '블루레몬에이드', '푸른 빛깔이 시원한 블루레몬 에이드.', 6800, NULL, NULL, false, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '깔라만시에이드', '새콤한 깔라만시로 만든 상큼한 에이드.', 6800, NULL, NULL, false, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '청포도에이드', '달콤한 청포도 향의 에이드.', 6800, NULL, NULL, false, 7);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '체리 아이스티', '체리 향을 더한 시원한 아이스티.', 6500, NULL, NULL, false, 8);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '복숭아 아이스티', '달콤한 복숭아 아이스티.', 6500, NULL, NULL, false, 9);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('ade', '어린이 음료', '아이들을 위한 메뉴예요. 뽀로로 음료 또는 아이스크림 중에서 골라 주세요.', NULL, 'none', NULL, false, 10);
INSERT INTO menu_variants (menu_id, label, price, sort_order) VALUES ((SELECT id FROM menus WHERE category_id = 'ade' AND name = '어린이 음료'), '뽀로로 음료', 3500, 1);
INSERT INTO menu_variants (menu_id, label, price, sort_order) VALUES ((SELECT id FROM menus WHERE category_id = 'ade' AND name = '어린이 음료'), '아이스크림', 5000, 2);

-- 스무디
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('smoothie', 'drinks', 'SMOOTHIE', '스무디', 'ice', NULL, NULL, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('smoothie', '플레인요거트 스무디', '새콤한 플레인 요거트를 시원하게 갈아 만든 스무디.', 7000, NULL, NULL, true, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('smoothie', '딸기스무디', '달콤한 딸기를 듬뿍 넣어 시원하게 간 스무디.', 7000, NULL, NULL, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('smoothie', '망고스무디', '진한 망고의 단맛을 담은 스무디.', 7000, NULL, NULL, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('smoothie', '블루베리스무디', '새콤달콤한 블루베리 스무디.', 7000, NULL, NULL, false, 4);

-- 프라페
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('frappe', 'drinks', 'FRAPPE', '프라페', 'ice', NULL, NULL, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('frappe', '바닐라프라페', '부드러운 바닐라 향의 얼음 블렌디드 음료.', 7200, NULL, NULL, true, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('frappe', '녹차프라페', '쌉싸름한 녹차를 시원하게 갈아 만든 프라페.', 7200, NULL, true, true, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('frappe', '자바칩프라페', '초콜릿 칩이 씹히는 진한 초코 프라페.', 7200, NULL, NULL, true, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('frappe', '민트초코프라페', '상쾌한 민트와 초콜릿을 함께 간 프라페.', 7200, NULL, NULL, true, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('frappe', '블루베리프라페', '새콤달콤한 블루베리 프라페.', 7200, NULL, NULL, true, 5);

-- 베이커리
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('bakery', 'dessert', 'BAKERY', '베이커리', 'none', NULL, NULL, 7);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '모카번', '커피 향 가득한 바삭한 겉면과 촉촉한 속의 번.', 4500, NULL, NULL, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '에그듬뿍 샌드위치', '부드러운 에그 샐러드를 듬뿍 넣은 샌드위치.', 4500, NULL, NULL, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '햄치즈샌드위치', '햄과 치즈를 넣은 든든한 샌드위치.', 4500, NULL, NULL, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '치즈베이글', '쫄깃한 베이글에 치즈를 더했어요.', 5500, NULL, NULL, false, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '크로크무슈', '햄과 치즈를 넣고 노릇하게 구운 프랑스식 샌드위치.', 5500, NULL, NULL, false, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '크로플(아이스크림)', '크루아상 반죽을 와플 틀에 구워 아이스크림을 곁들인 디저트.', 6500, NULL, NULL, false, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bakery', '호두 타르트', '고소한 호두를 가득 올린 타르트.', 7800, NULL, NULL, false, 7);

-- 케이크
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('cake', 'dessert', 'CAKE', '케이크', 'none', NULL, NULL, 8);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '치즈케이크', '진하고 부드러운 크림치즈 케이크.', 6500, NULL, NULL, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '초코무스케이크', '입에서 사르르 녹는 초콜릿 무스 케이크.', 6500, NULL, NULL, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '당근케이크', '촉촉한 당근 시트에 크림치즈 프로스팅을 올린 케이크.', 7500, NULL, NULL, false, 3);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '크림카스테라', '폭신한 카스테라에 부드러운 크림을 채웠어요.', 7500, NULL, NULL, false, 4);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '티라미수', '에스프레소에 적신 시트와 마스카포네 크림을 쌓은 이탈리아 디저트.', 7500, NULL, NULL, false, 5);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '한라봉홍차케이크', '상큼한 한라봉과 은은한 홍차 향의 케이크.', 7500, NULL, NULL, false, 6);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '바스크 치즈케이크', '겉은 진하게 그을리고 속은 촉촉한 치즈케이크.', 7500, NULL, NULL, false, 7);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '밀크레이프', '얇은 크레이프와 크림을 여러 겹 쌓은 케이크.', 7800, NULL, NULL, false, 8);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '헤이즐넛 초코케이크', '고소한 헤이즐넛과 진한 초콜릿의 케이크.', 7800, NULL, NULL, false, 9);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '딸기 티라미수', '딸기의 상큼함을 더한 티라미수.', 7800, NULL, NULL, false, 10);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('cake', '레인보우케이크', '알록달록한 시트를 겹겹이 쌓은 케이크.', 8000, NULL, NULL, false, 11);

-- 빙수
INSERT INTO categories (id, group_id, name_en, name_ko, default_temp, default_caffeine, note, sort_order) VALUES ('bingsu', 'dessert', 'SUMMER MENU', '빙수', 'none', NULL, '2인 기준 · 여름 한정', 9);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bingsu', '팥빙수', '곱게 간 얼음 위에 달콤한 팥을 올린 전통 빙수.', 15000, NULL, NULL, false, 1);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bingsu', '인절미빙수', '고소한 콩고물과 인절미를 올린 빙수.', 15000, NULL, NULL, false, 2);
INSERT INTO menus (category_id, name, description, price, temp, has_caffeine, has_milk, sort_order) VALUES ('bingsu', '망고빙수', '달콤한 망고를 듬뿍 올린 빙수.', 16000, NULL, NULL, false, 3);

-- 추천용 기본 취향 태그 (메뉴 연결은 menu_tags에 직접 추가)
INSERT INTO tags (name, type) VALUES ('달콤한', 'taste');
INSERT INTO tags (name, type) VALUES ('상큼한', 'taste');
INSERT INTO tags (name, type) VALUES ('고소한', 'taste');
INSERT INTO tags (name, type) VALUES ('쌉싸름한', 'taste');
INSERT INTO tags (name, type) VALUES ('시원한', 'taste');
INSERT INTO tags (name, type) VALUES ('든든한', 'taste');

COMMIT;
