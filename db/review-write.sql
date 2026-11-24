-- 리뷰 쓰기 기능 추가 (이미 schema.sql을 실행한 Supabase에 실행. 여러 번 실행해도 괜찮아요)
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run
-- 처음부터 새로 만들 때는 schema.sql에 이미 들어 있어서 이 파일은 필요 없어요.

-- 비회원도 쓸 수 있게: 회원 id는 없어도 되고, 닉네임과 전화번호 칸 추가
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN menu_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS nickname VARCHAR(30);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
-- 주문 한 건에 리뷰 하나: 어떤 주문의 리뷰인지와 그 주문의 메뉴 이름
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id INT UNIQUE REFERENCES public.orders(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_menus VARCHAR(200);

-- 이전 버전 함수가 있으면 지우고 다시 만듦
DROP FUNCTION IF EXISTS public.write_review(text, text, int, text, int);
DROP FUNCTION IF EXISTS public.get_reviewable_items(text);
DROP FUNCTION IF EXISTS public.get_reviewable_orders(text);

-- 리뷰 쓸 수 있는 주문 (회원·비회원 공통): 주문할 때 적은 휴대폰 번호로 조회
-- - 최근 30일 주문 중 취소 안 됐고, 아직 리뷰를 안 쓴 주문만 (주문 한 건에 리뷰 하나)
-- - 주문 날짜, 그날의 주문번호, 메뉴 이름 요약만 돌려줌 (가격 등은 안 보냄)
CREATE FUNCTION public.get_reviewable_orders(p_phone text)
RETURNS TABLE (order_id int, order_no int, order_date date, menus text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.id, o.order_no::int, o.order_date,
         (SELECT string_agg(oi.menu_name, ', ' ORDER BY oi.id) FROM public.order_items oi WHERE oi.order_id = o.id)
    FROM public.orders o
   WHERE o.contact_phone = regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
     AND o.status <> 'canceled'
     AND o.order_date >= (now() AT TIME ZONE 'Asia/Seoul')::date - 30
     AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.order_id = o.id)
   ORDER BY o.id DESC
   LIMIT 30;
$$;

-- 리뷰 쓰기 (회원·비회원 공통): 주문 한 건에 리뷰 하나
-- - 그 주문이 이 휴대폰 번호로 한 주문이어야 함 (구매 인증). 번호는 화면에 공개되지 않음
-- - 리뷰에는 그 주문의 메뉴 이름을 같이 저장 (order_menus, 화면에 메뉴 태그로 보임)
CREATE FUNCTION public.write_review(
  p_phone    text,
  p_nickname text,
  p_rating   int,
  p_content  text,
  p_order_id int
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_phone    text := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_nickname text := NULLIF(trim(COALESCE(p_nickname, '')), '');
  v_content  text := trim(COALESCE(p_content, ''));
  v_menus    text;
  v_id       int;
BEGIN
  IF v_phone !~ '^01[0-9]{8,9}$' THEN
    RAISE EXCEPTION '전화번호 형식이 올바르지 않습니다.';
  END IF;

  PERFORM 1 FROM public.orders o
   WHERE o.id = p_order_id AND o.contact_phone = v_phone AND o.status <> 'canceled';
  IF NOT FOUND THEN
    RAISE EXCEPTION '이 번호로 한 주문만 리뷰를 쓸 수 있어요.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.reviews r WHERE r.order_id = p_order_id) THEN
    RAISE EXCEPTION '이 주문은 이미 리뷰를 썼어요.';
  END IF;

  IF v_nickname IS NULL OR length(v_nickname) > 30 THEN
    RAISE EXCEPTION '닉네임을 30자 안으로 적어 주세요.';
  END IF;
  IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION '별점을 골라 주세요.';
  END IF;
  IF length(v_content) < 5 OR length(v_content) > 1000 THEN
    RAISE EXCEPTION '리뷰는 5자 이상 1000자 이하로 적어 주세요.';
  END IF;

  SELECT left(string_agg(oi.menu_name, ', ' ORDER BY oi.id), 200) INTO v_menus
    FROM public.order_items oi WHERE oi.order_id = p_order_id;

  INSERT INTO public.reviews (user_id, order_id, order_menus, nickname, contact_phone, rating, content)
  VALUES (auth.uid(), p_order_id, v_menus, v_nickname, v_phone, p_rating, v_content)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_reviewable_orders(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.write_review(text, text, int, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reviewable_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.write_review(text, text, int, text, int) TO anon, authenticated;

-- 리뷰 읽기: 전화번호(contact_phone)는 빼고 필요한 칸만 공개
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, menu_id, order_menus, nickname, rating, content, is_hidden, created_at) ON public.reviews TO anon, authenticated;
