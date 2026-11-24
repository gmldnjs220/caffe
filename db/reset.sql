-- 원보틀 DB 전체 삭제 (처음부터 다시 만들 때)
-- 주의: 메뉴·주문·후기 데이터가 전부 지워집니다. 회원 계정(auth.users)은 남습니다.
-- 실행 후 schema.sql → seed.sql 순서로 다시 실행하세요.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS
  review_images, reviews, payments, order_item_options, order_items, orders,
  staff_picks, user_taste_prefs, menu_tags, tags,
  menu_options, menu_variants, menus, categories, menu_groups, users
  CASCADE;

DROP FUNCTION IF EXISTS public.place_order(text, jsonb, order_type, text);
DROP FUNCTION IF EXISTS public.get_order_status(text, int);
DROP FUNCTION IF EXISTS public.write_review(text, text, int, text, int);
DROP FUNCTION IF EXISTS public.get_reviewable_items(text);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TYPE IF EXISTS temp_type, user_role, auth_provider, order_status, order_type;
