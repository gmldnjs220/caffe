# 원보틀 JSP 프로토타입

기존 Eclipse Dynamic Web Project와 Tomcat 10.1, MySQL 8을 사용한다. DB 구조는 확정된 3개 테이블 그대로다. 관리자 기능은 구현하지 않았다.

## 실행

1. MySQL을 실행한다. 현재 연결 대상은 `localhost:3306/cafe_onebottle`이다.
2. `Cafesite_OneBottle/src/main/webapp/WEB-INF/db.properties.example`을 같은 폴더의 `db.properties`로 복사하고 접속 정보를 작성한다. 이 파일은 Git에서 제외되고 브라우저 접근이 차단되는 WEB-INF에 둔다. `ONEBOTTLE_DB_URL`, `ONEBOTTLE_DB_USER`, `ONEBOTTLE_DB_PASSWORD` 환경변수로도 설정할 수 있다.
3. PowerShell에서 `./tools/start-prototype.ps1`을 실행하고 [로컬 사이트](http://localhost:8061/Cafesite_OneBottle/)에 접속한다. 종료는 `./tools/stop-prototype.ps1`이다.

Eclipse에서는 기존 Tomcat 서버에 Cafesite_OneBottle을 추가하고 실행한다. 기존 서버 설정의 포트는 8060이다. 처음 생성되어 있던 NewFile.jsp도 홈으로 연결한다.

## 콘텐츠 교체

- 매장명·소개 원문·주소·영업 정보·슬라이드 경로: `WEB-INF/site.properties`
- 샘플 메뉴·가격·분류·공지 및 이미지 경로: `docs/database/seed.sql`에 모아 둠. 샘플은 빈 DB에 최초 1회만 적용했으며 앱이 실행될 때 자동 삽입하거나 재생성하지 않는다.
- 메뉴와 공지는 MySQL에서 관리한다. `is_published=1`인 항목만 서버에서 조회한다. 본문은 일반 텍스트로 출력한다.
- `assets/space-*.svg`, `assets/menu-*.svg`는 개발용 대체 일러스트다. 실제 매장 사진이 아니다. 실제 이미지 경로는 `assets/` 아래를 사용한다.
- 실제 영업시간·정기휴무·주차·교통은 준비 중으로 유지한다.

현재 범위: 홈 슬라이드, 카페 소개, 전체/분류별 메뉴, 공지 목록·상세, 영업 안내, 오시는 길 및 주소 복사. 주문·결제·지도·회원·관리자·삭제 기능은 포함하지 않는다. PC 우선 화면이며 모바일 정식 검수는 후속 범위다.

DB 오류가 발생하면 별도 오류 화면을 표시한다. 실제 데이터가 없는 경우 빈 목록을 안내하며 임의로 샘플을 대신 표시하지 않는다. 서버 로그는 `.local/tomcat/logs`에 기록한다.

오시는 길은 `directions.jsp`로 분리했다. 홈에는 주소 요약과 바로가기가 있고, 별도 페이지에 지도 대체 공간·주소 복사·주차 및 교통 안내가 있다. 실제 지도 API는 아직 연결하지 않았다.
