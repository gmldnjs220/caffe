-- 원보틀 카페 DB 스키마 (Supabase / PostgreSQL)
-- 설계 문서: docs/DB-설계.md
-- 실행 순서 (Supabase SQL Editor):  schema.sql → seed.sql
-- 이미 예전 버전을 실행했다면: reset.sql → schema.sql → seed.sql

-- =========================================================
-- 1. ENUM 타입
-- =========================================================
CREATE TYPE temp_type    AS ENUM ('both','ice','hot','none');
CREATE TYPE user_role    AS ENUM ('customer','admin');
CREATE TYPE order_status AS ENUM ('pending','paid','preparing','ready','completed','canceled');
CREATE TYPE order_type   AS ENUM ('dine_in','takeout');

-- =========================================================
-- 2. 로그인 (회원 프로필)
--    이메일·비밀번호·소셜 로그인은 Supabase Auth(auth.users)가 관리.
--    이 테이블은 닉네임·전화번호·권한 같은 추가 정보만 가짐.
-- =========================================================
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      VARCHAR(100) NOT NULL,
  nickname   VARCHAR(30) NOT NULL,
  phone      VARCHAR(20) NOT NULL,          -- 가입 시 필수, 주문 시 자동 입력 (숫자만)
  role       user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 회원가입하면 users 프로필을 자동으로 만들어 줌
-- (가입할 때 options.data 에 nickname, phone 을 넣어서 보냄)
CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nickname', ''), split_part(COALESCE(NEW.email, '손님'), '@', 1)),
    regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 지금 로그인한 사람이 관리자인지
CREATE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- =========================================================
-- 3. 메뉴
-- =========================================================
CREATE TABLE menu_groups (
  id         VARCHAR(20) PRIMARY KEY,
  name_en    VARCHAR(30) NOT NULL,
  name_ko    VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id               VARCHAR(20) PRIMARY KEY,
  group_id         VARCHAR(20) NOT NULL REFERENCES menu_groups(id),
  name_en          VARCHAR(30) NOT NULL,
  name_ko          VARCHAR(30) NOT NULL,
  default_temp     temp_type NOT NULL DEFAULT 'none',
  default_caffeine BOOLEAN,
  note             VARCHAR(100),
  sort_order       INT NOT NULL DEFAULT 0
);

CREATE TABLE menus (
  id           SERIAL PRIMARY KEY,
  category_id  VARCHAR(20) NOT NULL REFERENCES categories(id),
  name         VARCHAR(50) NOT NULL,
  description  TEXT,
  price        INT CHECK (price >= 0),      -- 원 단위. variants가 있으면 NULL
  temp         temp_type,                   -- NULL = 카테고리 값 따름
  has_caffeine BOOLEAN,                     -- NULL = 카테고리 값 따름
  has_milk     BOOLEAN NOT NULL DEFAULT false,
  image_url    VARCHAR(255),
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE menu_variants (
  id         SERIAL PRIMARY KEY,
  menu_id    INT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  label      VARCHAR(30) NOT NULL,
  price      INT NOT NULL CHECK (price >= 0),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE menu_options (
  id          SERIAL PRIMARY KEY,
  menu_id     INT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  label       VARCHAR(30) NOT NULL,
  extra_price INT NOT NULL DEFAULT 0
);

-- =========================================================
-- 4. 추천
-- =========================================================
CREATE TABLE tags (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL DEFAULT 'taste'
);

CREATE TABLE menu_tags (
  menu_id INT REFERENCES menus(id) ON DELETE CASCADE,
  tag_id  INT REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (menu_id, tag_id)
);

CREATE TABLE user_taste_prefs (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tag_id  INT  REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE staff_picks (
  id         SERIAL PRIMARY KEY,
  menu_id    INT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- 등록한 관리자
  staff_name VARCHAR(30) NOT NULL,
  comment    VARCHAR(200),
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- =========================================================
-- 5. 주문
--    손님(회원·비회원)은 테이블에 직접 넣지 않고 place_order() 함수로만 주문.
--    가격은 함수가 DB의 메뉴 가격으로 계산 → 화면에서 가격을 조작해도 소용없음.
-- =========================================================
CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  order_no      SMALLINT NOT NULL CHECK (order_no BETWEEN 1 AND 100),
  order_date    DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date,  -- 한국 날짜 기준
  user_id       UUID REFERENCES users(id),          -- NULL = 비회원 주문
  status        order_status NOT NULL DEFAULT 'pending',
  order_type    order_type NOT NULL DEFAULT 'takeout',
  total_price   INT NOT NULL CHECK (total_price >= 0),
  contact_phone VARCHAR(20) NOT NULL,
  request_note  VARCHAR(200),
  pickup_time   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id    INT NOT NULL REFERENCES menus(id),
  variant_id INT REFERENCES menu_variants(id),
  menu_name  VARCHAR(50) NOT NULL,          -- 주문 당시 이름 복사본
  unit_price INT NOT NULL,                  -- 주문 당시 가격 복사본 (옵션 제외)
  temp       VARCHAR(3) CHECK (temp IN ('hot','ice')),
  quantity   INT NOT NULL CHECK (quantity > 0),
  line_total INT NOT NULL
);

CREATE TABLE order_item_options (
  id            SERIAL PRIMARY KEY,
  order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_id     INT REFERENCES menu_options(id) ON DELETE SET NULL,
  label         VARCHAR(30) NOT NULL,
  extra_price   INT NOT NULL
);

-- 결제: 테이블만 생성, 현재 미사용 (추후 PG 연동용)
CREATE TABLE payments (
  id             SERIAL PRIMARY KEY,
  order_id       INT NOT NULL UNIQUE REFERENCES orders(id),
  provider       VARCHAR(20) NOT NULL,
  provider_tx_id VARCHAR(100),
  amount         INT NOT NULL,
  status         VARCHAR(10) NOT NULL DEFAULT 'ready',
  approved_at    TIMESTAMPTZ
);

-- =========================================================
-- 6. 후기
-- =========================================================
CREATE TABLE reviews (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  menu_id       INT NOT NULL REFERENCES menus(id),
  order_item_id INT UNIQUE REFERENCES order_items(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content       TEXT NOT NULL,
  is_hidden     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE review_images (
  id         SERIAL PRIMARY KEY,
  review_id  INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url  VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- =========================================================
-- 7. 인덱스
-- =========================================================
CREATE INDEX idx_menus_category   ON menus(category_id);
CREATE INDEX idx_orders_user      ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_phone     ON orders(contact_phone, created_at DESC);
CREATE INDEX idx_order_items_menu ON order_items(menu_id);
CREATE INDEX idx_reviews_menu     ON reviews(menu_id, created_at DESC);
-- 진행 중인 주문끼리는 같은 주문번호를 못 쓰게
CREATE UNIQUE INDEX uq_orders_active_no ON orders(order_date, order_no)
  WHERE status NOT IN ('completed','canceled');

-- =========================================================
-- 8. 주문 함수
-- =========================================================
-- 주문하기 (회원·비회원 공통)
-- p_items 예시:
-- [{"menu_id": 2, "quantity": 2, "temp": "ice", "option_ids": [2]},
--  {"menu_id": 61, "variant_id": 1, "quantity": 1}]
CREATE FUNCTION public.place_order(
  p_phone      text,
  p_items      jsonb,
  p_order_type order_type DEFAULT 'takeout',
  p_note       text DEFAULT NULL
)
RETURNS TABLE (order_id int, order_no smallint, total_price int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_phone    text := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_today    date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_order_id int;
  v_no       smallint;
  v_last     smallint;
  v_total    int := 0;
  v_item     jsonb;
  v_menu     record;
  v_sel_temp text;
  v_price    int;
  v_qty      int;
  v_opt_sum  int;
  v_item_id  int;
  v_opt_id   int;
  v_opt      record;
  i          int;
BEGIN
  IF v_phone !~ '^01[0-9]{8,9}$' THEN
    RAISE EXCEPTION '전화번호 형식이 올바르지 않습니다.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION '주문할 메뉴가 없습니다.';
  END IF;

  -- 주문번호 발급: 동시에 두 명이 주문해도 같은 번호가 안 나오게 잠금
  PERFORM pg_advisory_xact_lock(hashtext('onebottle_order_no'));
  SELECT o.order_no INTO v_last FROM public.orders o
   WHERE o.order_date = v_today ORDER BY o.id DESC LIMIT 1;
  v_no := COALESCE(v_last % 100 + 1, 1);
  -- 그 번호가 아직 진행 중이면 다음 번호로
  FOR i IN 1..101 LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.order_date = v_today AND o.order_no = v_no
         AND o.status NOT IN ('completed','canceled'));
    IF i > 100 THEN RAISE EXCEPTION '지금은 주문이 너무 많습니다. 잠시 후 다시 시도해 주세요.'; END IF;
    v_no := v_no % 100 + 1;
  END LOOP;

  INSERT INTO public.orders (order_no, order_date, user_id, order_type, total_price, contact_phone, request_note)
  VALUES (v_no, v_today, auth.uid(), p_order_type, 0, v_phone, NULLIF(trim(p_note), ''))
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := COALESCE((v_item->>'quantity')::int, 1);
    IF v_qty < 1 OR v_qty > 50 THEN RAISE EXCEPTION '수량이 올바르지 않습니다.'; END IF;

    SELECT m.id, m.name, m.price, COALESCE(m.temp, c.default_temp)::text AS temp
      INTO v_menu
      FROM public.menus m JOIN public.categories c ON c.id = m.category_id
     WHERE m.id = (v_item->>'menu_id')::int AND m.is_available;
    IF NOT FOUND THEN RAISE EXCEPTION '주문할 수 없는 메뉴입니다. (menu_id=%)', v_item->>'menu_id'; END IF;

    -- 가격: 종류(variant)를 골랐으면 그 가격, 아니면 메뉴 가격
    IF NULLIF(v_item->>'variant_id', '') IS NOT NULL THEN
      SELECT v.price INTO v_price FROM public.menu_variants v
       WHERE v.id = (v_item->>'variant_id')::int AND v.menu_id = v_menu.id;
      IF NOT FOUND THEN RAISE EXCEPTION '메뉴 종류가 올바르지 않습니다.'; END IF;
    ELSE
      v_price := v_menu.price;
      IF v_price IS NULL THEN RAISE EXCEPTION '%: 종류를 선택해 주세요.', v_menu.name; END IF;
    END IF;

    -- 온도: 메뉴가 허용하는 값만
    v_sel_temp := lower(v_item->>'temp');
    IF v_menu.temp = 'both' THEN
      IF v_sel_temp IS NULL OR v_sel_temp NOT IN ('hot','ice') THEN
        RAISE EXCEPTION '%: HOT/ICE를 선택해 주세요.', v_menu.name;
      END IF;
    ELSIF v_menu.temp IN ('ice','hot') THEN v_sel_temp := v_menu.temp;
    ELSE v_sel_temp := NULL;
    END IF;

    INSERT INTO public.order_items (order_id, menu_id, variant_id, menu_name, unit_price, temp, quantity, line_total)
    VALUES (v_order_id, v_menu.id, NULLIF(v_item->>'variant_id', '')::int, v_menu.name, v_price, v_sel_temp, v_qty, 0)
    RETURNING id INTO v_item_id;

    -- 옵션: 그 메뉴의 옵션만 허용
    v_opt_sum := 0;
    IF jsonb_typeof(v_item->'option_ids') = 'array' THEN
      FOR v_opt_id IN SELECT x::int FROM jsonb_array_elements_text(v_item->'option_ids') AS t(x) LOOP
        SELECT o.id, o.label, o.extra_price INTO v_opt FROM public.menu_options o
         WHERE o.id = v_opt_id AND o.menu_id = v_menu.id;
        IF NOT FOUND THEN RAISE EXCEPTION '%: 선택할 수 없는 옵션입니다.', v_menu.name; END IF;
        INSERT INTO public.order_item_options (order_item_id, option_id, label, extra_price)
        VALUES (v_item_id, v_opt.id, v_opt.label, v_opt.extra_price);
        v_opt_sum := v_opt_sum + v_opt.extra_price;
      END LOOP;
    END IF;

    UPDATE public.order_items SET line_total = (v_price + v_opt_sum) * v_qty WHERE id = v_item_id;
    v_total := v_total + (v_price + v_opt_sum) * v_qty;
  END LOOP;

  UPDATE public.orders SET total_price = v_total WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_no, v_total;
END;
$$;

-- 비회원 주문 조회: 전화번호 + 주문번호로 오늘 주문 상태 확인
CREATE FUNCTION public.get_order_status(p_phone text, p_order_no int)
RETURNS TABLE (order_no smallint, status order_status, total_price int, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.order_no, o.status, o.total_price, o.created_at
    FROM public.orders o
   WHERE o.contact_phone = regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
     AND o.order_no = p_order_no
     AND o.order_date = (now() AT TIME ZONE 'Asia/Seoul')::date
   ORDER BY o.id DESC
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.place_order(text, jsonb, order_type, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_status(text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, jsonb, order_type, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(text, int) TO anon, authenticated;

-- =========================================================
-- 9. 보안 규칙 (RLS)
--    규칙이 없는 동작은 전부 막힘. 대시보드(Table Editor, SQL Editor)는 관리자 권한이라 영향 없음.
-- =========================================================
-- 방문자(anon)와 로그인 사용자가 메뉴 관련 테이블을 읽을 수 있는 기본 권한
-- (최근 Supabase 프로젝트는 이 권한을 자동으로 주지 않아요. 실제로 볼 수 있는 행은 아래 RLS 정책이 정해요)
GRANT SELECT ON public.menu_groups, public.categories, public.menus, public.menu_variants, public.menu_options, public.tags, public.menu_tags, public.staff_picks TO anon, authenticated;

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus              ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_taste_prefs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_picks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images      ENABLE ROW LEVEL SECURITY;

-- 메뉴·태그·직원 추천: 누구나 읽기, 관리자만 수정
CREATE POLICY "누구나 읽기" ON menu_groups   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON categories    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON menus         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON menu_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON menu_options  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON tags          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON menu_tags     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "누구나 읽기" ON staff_picks   FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "관리자 수정" ON menu_groups   FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON categories    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON menus         FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON menu_variants FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON menu_options  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON tags          FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON menu_tags     FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "관리자 수정" ON staff_picks   FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 회원 정보: 본인 것만 보기·수정 (닉네임·전화번호만 수정 가능, 권한(role)은 못 바꿈), 관리자는 전체 보기
CREATE POLICY "본인 보기" ON users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "본인 수정" ON users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON users FROM anon, authenticated;
GRANT UPDATE (nickname, phone) ON users TO authenticated;

-- 취향 태그: 본인 것만
CREATE POLICY "본인 취향" ON user_taste_prefs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 주문: 넣기는 place_order()로만. 회원은 내 주문 보기, 관리자는 전체 보기·상태 변경
CREATE POLICY "내 주문 보기" ON orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "관리자 상태 변경" ON orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "내 주문 메뉴 보기" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "내 주문 옵션 보기" ON order_item_options FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
                 WHERE oi.id = order_item_id AND (o.user_id = auth.uid() OR public.is_admin())));

-- 결제: 관리자만 보기 (현재 미사용)
CREATE POLICY "관리자 보기" ON payments FOR SELECT TO authenticated USING (public.is_admin());

-- 후기: 숨김 아닌 후기는 누구나 읽기. 쓰기·수정·삭제는 본인만 (구매 인증은 내 주문만)
CREATE POLICY "후기 읽기" ON reviews FOR SELECT TO anon, authenticated
  USING (NOT is_hidden OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "후기 쓰기" ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND is_hidden = false
    AND (order_item_id IS NULL OR EXISTS (
      SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = order_item_id AND oi.menu_id = reviews.menu_id AND o.user_id = auth.uid()))
  );
CREATE POLICY "후기 수정" ON reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "후기 삭제" ON reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "후기 사진 읽기" ON review_images FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id));
CREATE POLICY "후기 사진 관리" ON review_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND (r.user_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));
