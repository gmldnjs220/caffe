-- 관리자 화면(펜 버튼으로 수정) 기능 추가
-- 이미 schema.sql을 실행한 Supabase에 실행. 여러 번 실행해도 괜찮아요.
-- Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 Run
--
-- 이 파일이 하는 일
-- 1) 화면 문구(site_texts)와 공지사항(notices) 테이블을 만듦
-- 2) 누구나 읽을 수 있고, 수정은 관리자(users.role = 'admin')만 할 수 있게 RLS를 검
-- 3) 메뉴 테이블에 "수정" 권한을 열어 줌. 실제로 고칠 수 있는 사람은 기존 RLS 정책
--    "관리자 수정"(public.is_admin())이 정해서, 일반 회원·방문자는 여전히 못 고침
--
-- 관리자 계정 만들기: 사이트에서 평소처럼 회원가입한 뒤, 아래 줄의 이메일을 바꿔서 실행
--   UPDATE public.users SET role = 'admin' WHERE email = '관리자이메일@example.com';
-- (회원은 자기 role을 바꿀 수 없어요. 이 SQL은 대시보드에서만 실행할 수 있어요)

-- =========================================================
-- 1. 화면 문구: 홈 문구, 소개글, 주소, 전화번호 등
--    key 는 HTML의 data-text-key 값과 같아요 (예: 'home.hero.desc')
--    행이 없으면 HTML에 적힌 원래 문구가 그대로 보여요
-- =========================================================
CREATE TABLE IF NOT EXISTS public.site_texts (
  key        VARCHAR(60) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 2. 공지사항 ("요일별 영업시간 안내"는 js/hours.js 값으로 자동으로 만들어서 여기 없음)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notices (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(100) NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  posted_on    DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 처음 한 번만: 지금 notice.html 에 있는 공지를 옮겨 둠
INSERT INTO public.notices (title, body, posted_on)
SELECT t.title, t.body, t.posted_on::date
  FROM (VALUES
    ('홈페이지를 새로 열었습니다',
     '원보틀 홈페이지에서 메뉴와 성분 정보, 영업시간을 편하게 확인하실 수 있습니다.',
     '2026-11-02'),
    ('여름 빙수 메뉴 판매 종료 안내',
     '팥빙수, 인절미빙수, 망고빙수는 시즌 메뉴로 10월부터 판매를 잠시 쉬어요.',
     '2026-10-01'),
    ('단체 주문 및 케이크 예약 안내',
     '음료 10잔 이상 단체 주문이나 케이크 예약은 하루 전까지 [031-471-3271](tel:031-471-3271)로 문의해 주세요.',
     '2026-09-15')
  ) AS t(title, body, posted_on)
 WHERE NOT EXISTS (SELECT 1 FROM public.notices);

-- 수정할 때 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_texts_touch ON public.site_texts;
CREATE TRIGGER trg_site_texts_touch BEFORE UPDATE ON public.site_texts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_notices_touch ON public.notices;
CREATE TRIGGER trg_notices_touch BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_menus_touch ON public.menus;
CREATE TRIGGER trg_menus_touch BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- 3. 보안 규칙 (RLS): 읽기는 누구나, 수정은 관리자만
-- =========================================================
ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "누구나 읽기" ON public.site_texts;
DROP POLICY IF EXISTS "관리자 수정" ON public.site_texts;
CREATE POLICY "누구나 읽기" ON public.site_texts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "관리자 수정" ON public.site_texts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 공지: 공개된 공지는 누구나, 숨긴 공지는 관리자만 보임
DROP POLICY IF EXISTS "공지 읽기" ON public.notices;
DROP POLICY IF EXISTS "관리자 수정" ON public.notices;
CREATE POLICY "공지 읽기" ON public.notices FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_admin());
CREATE POLICY "관리자 수정" ON public.notices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.site_texts, public.notices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_texts, public.notices TO authenticated;
GRANT USAGE ON SEQUENCE public.notices_id_seq TO authenticated;

-- 메뉴: 관리자 화면에서 이름·설명·가격·품절·카테고리 이름을 고칠 수 있게 UPDATE 권한
-- (누가 고칠 수 있는지는 schema.sql 의 "관리자 수정" 정책 = public.is_admin() 이 정함)
GRANT UPDATE ON public.menus, public.menu_variants, public.menu_options, public.categories TO authenticated;

-- 관리자 화면이 "지금 로그인한 사람이 관리자인지" 물어볼 때 씀
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
