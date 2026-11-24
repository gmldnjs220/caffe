-- 회원 탈퇴 함수 (login.html 의 "회원 탈퇴하기" 버튼이 부름)
-- Supabase SQL Editor 에서 한 번 실행해 주세요. schema.sql 을 실행한 뒤에 실행해야 해요.
--
-- - 주문·후기 기록이 없으면: 로그인 계정(auth.users)을 지움 → users 프로필도 같이 지워짐 (ON DELETE CASCADE)
-- - 주문·후기 기록이 있으면: 기록은 매장 기록으로 남기고(deleted_at), 이름·이메일·전화번호는 지우고 로그인은 막음
--   같은 이메일로 다시 가입하면 새 계정으로 시작해요.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION '로그인이 필요해요' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders  WHERE user_id = v_uid)
     OR EXISTS (SELECT 1 FROM public.reviews WHERE user_id = v_uid) THEN
    UPDATE public.users
       SET nickname = '탈퇴회원', email = '', phone = '', deleted_at = now()
     WHERE id = v_uid;
    DELETE FROM public.user_taste_prefs WHERE user_id = v_uid;

    -- 로그인 계정: 이메일을 비워 다시 가입할 수 있게 하고, 로그인은 막음
    UPDATE auth.users
       SET email = v_uid::text || '@deleted.invalid',
           phone = NULL,
           raw_user_meta_data = '{}'::jsonb,
           encrypted_password = '',
           banned_until = 'infinity'
     WHERE id = v_uid;
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.sessions   WHERE user_id = v_uid;
  ELSE
    DELETE FROM auth.users WHERE id = v_uid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
