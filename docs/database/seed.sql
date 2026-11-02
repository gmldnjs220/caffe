-- 개발용 샘플 데이터. 실제 메뉴/가격/분류/공지가 아님.
-- 세 테이블이 모두 비어 있는지 확인한 후 최초 1회만 적용한다.
START TRANSACTION;
INSERT INTO MENU_CATEGORY (category_id,name,sort_order) VALUES
(1,'커피',1),(2,'티 · 음료',2),(3,'디저트',3);
INSERT INTO MENU (category_id,name,description,price,image_path,is_published,sort_order) VALUES
(1,'아메리카노','[개발용 샘플] 커피의 기본을 담은 한 잔',4500,'assets/menu-coffee.svg',1,1),
(1,'카페 라떼','[개발용 샘플] 우유와 에스프레소의 부드러운 조화',5000,'assets/menu-latte.svg',1,2),
(1,'바닐라 라떼','[개발용 샘플] 은은한 바닐라 향의 라떼',5500,'assets/menu-latte.svg',1,3),
(2,'얼그레이 티','[개발용 샘플] 향긋하게 즐기는 따뜻한 차',5000,'assets/menu-tea.svg',1,1),
(2,'레몬 티','[개발용 샘플] 산뜻한 레몬 향의 음료',5500,'assets/menu-tea.svg',1,2),
(3,'치즈 케이크','[개발용 샘플] 커피와 함께 즐기는 디저트',6500,'assets/menu-dessert.svg',1,1),
(1,'비공개 검증용 메뉴','화면에 노출되면 안 되는 샘플',0,NULL,0,99);
INSERT INTO NOTICE (title,content,is_published) VALUES
('[개발용 샘플] 원보틀 홈페이지 안내','홈페이지 화면 확인을 위한 개발용 샘플 공지입니다.\n\n메뉴명, 가격, 분류 및 이미지는 실제 매장 정보가 아니며 추후 제공되는 자료로 교체됩니다.',1),
('[개발용 샘플] 메뉴 안내','전체 메뉴에서 분류별로 샘플 메뉴를 확인할 수 있습니다.\n영업시간, 주차 및 대중교통 안내는 실제 자료를 받은 후 등록됩니다.',1),
('[개발용 샘플] 비공개 검증용 공지','비공개 검증용 본문입니다. 방문자에게 노출되면 안 됩니다.',0);
COMMIT;
