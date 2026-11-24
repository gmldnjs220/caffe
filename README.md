# ONE BOTTLE (원보틀) 웹사이트

안양예술공원(안양시 만안구 석수동) 카페 **원보틀**의 홈페이지입니다.
HTML, CSS, JavaScript로 만든 정적 사이트이고, 배포용 파일은 webpack으로 묶습니다.

---

## 1. 다른 컴퓨터에서 처음 실행하기

### 준비물

| 항목 | 버전 | 확인 방법 |
|---|---|---|
| Git | 아무 버전 | `git --version` |
| Node.js | **18.12 이상** (20 LTS 권장) | `node -v` |
| npm | Node.js와 함께 설치됨 | `npm -v` |
| 인터넷 연결 | 글꼴(Jost, Pretendard)을 CDN에서 불러옴 | |

Node.js는 https://nodejs.org 에서 LTS 버전을 설치하면 됩니다.

### 순서

```bash
# 1) 저장소 받기
git clone https://github.com/apqleifjc/onebottle.git
cd onebottle

# 2) 작업 브랜치로 이동
git checkout develop

# 3) 패키지 설치 (node_modules 폴더가 생김, 처음 한 번만)
npm install

# 4) 개발 서버 실행 → 브라우저가 자동으로 열림 (보통 http://localhost:8080)
npm start
```

개발 서버를 켜 둔 상태에서 HTML, CSS, JS를 고치고 저장하면 브라우저가 알아서 새로고침됩니다.
끌 때는 터미널에서 `Ctrl + C`를 누릅니다.

### 서버 없이 바로 보기

`index.html`을 더블클릭해서 브라우저로 열어도 대부분 동작합니다.
다만 개발 서버(`npm start`)로 보는 쪽이 실제 배포 환경과 더 비슷하니, 확인은 개발 서버로 하는 것을 권장합니다.

### 배포용 파일 만들기

```bash
npm run build
```

`dist/` 폴더에 배포용 파일이 만들어집니다. 이 폴더 안의 내용을 그대로 웹 호스팅에 올리면 됩니다.

---

## 2. 폴더 구조

```
.
├─ index.html          홈 (사진 슬라이드 + 왼쪽 사이드바)
├─ about.html          소개
├─ menu.html           메뉴
├─ order.html          주문 (메뉴 고르기 + 장바구니)
├─ notice.html         공지사항
├─ location.html       오시는 길
├─ login.html          로그인 / 회원가입 (Supabase Auth)
├─ 404.html            없는 페이지 안내
├─ css/
│  ├─ style.css        기본 초기화 스타일
│  ├─ main.css         모든 페이지 공통 (색, 글꼴, 머리글, 페이지 폭)
│  ├─ home.css         홈 화면 (사이드바, 블러, 슬라이드)
│  ├─ login.css        로그인 페이지
│  ├─ pages.css        소개, 공지사항, 오시는 길
│  ├─ menu.css         메뉴 페이지
│  └─ order.css        주문 페이지 (버튼, 팝업 모양은 menu.css를 같이 씀)
├─ js/
│  ├─ app.js           홈 화면 동작 (슬라이드, 페이지 열기/닫기)
│  ├─ login.js         로그인 페이지 동작 (이메일, 구글 로그인, 내 계정, 비밀번호 변경)
│  ├─ account-view.js  내 계정에 보여 줄 가입 정보 정리
│  ├─ auth-nav.js      모든 페이지 위쪽 메뉴: 로그인하면 "내 계정"으로 표시
│  ├─ supabase.js      Supabase 연결 (로그인 페이지와 위쪽 메뉴가 같이 씀)
│  ├─ supabase-config.js  Supabase Project URL, publishable key
│  ├─ supabase-client.js  메뉴 페이지용 Supabase 연결
│  ├─ menu-api.js      메뉴를 Supabase에서 읽기 (실패하면 menu-data.js)
│  ├─ menu-data.js     예비 메뉴 데이터 (이름, 가격, 설명)
│  ├─ menu.js          메뉴 페이지 동작 (필터, 상세 보기)
│  ├─ order.js         주문 페이지 동작 (옵션 고르기, 장바구니)
│  ├─ notice.js        공지사항 열기/닫기 애니메이션
│  └─ hours.js         영업시간 (홈 사이드바의 오늘 영업시간, 공지사항·오시는 길의 시간표)
├─ img/
│  ├─ logo-white.png           사이드바 로고
│  ├─ og-image.jpg             카카오톡/SNS 공유 미리보기 이미지
│  ├─ main/hero-XX.webp        홈 슬라이드 사진
│  └─ location/onebottle-map.webp  오시는 길 약도
├─ favicon.ico, icon.svg, icon.png   브라우저 탭 아이콘
├─ site.webmanifest    휴대폰 홈 화면 추가 정보
├─ webpack.common.js / webpack.config.dev.js / webpack.config.prod.js   빌드 설정
└─ package.json        npm 스크립트와 패키지 목록
```

### git에 올라가지 않는 것 (정상)

| 폴더/파일 | 이유 | 다른 컴퓨터에서는 |
|---|---|---|
| `node_modules/` | 패키지 설치 결과물 | `npm install`로 다시 생김 |
| `dist/` | 빌드 결과물 | `npm run build`로 다시 생김 |
| `.metadata/` | 편집기(이클립스 계열) 설정 | 필요 없음 |

---

## 3. 자주 고치는 곳

| 바꾸고 싶은 것 | 파일 | 찾을 내용 |
|---|---|---|
| 영업시간, 임시 휴무 | `js/hours.js` | 이 파일만 고치면 홈 사이드바(오늘 요일의 영업시간), 공지사항, 오시는 길에 모두 반영됨 |
| 전화번호, 주소 | `index.html`, `location.html` | `tel:`, `석수동` |
| 메뉴, 가격 | `js/menu-data.js` | 메뉴 이름으로 검색 |
| 홈 슬라이드 사진 | `index.html` | `hero__slides` 안의 `<figure class="slide">`. 첫 장만 `src`, 나머지는 `data-src`로 적어야 함 |
| 사이드바 블러 속도/번짐 | `css/home.css` | `.sidebar-bg`의 `--bg-speed`, `--feather` |
| 약도 크기 | `css/pages.css` | `.visit-map`의 `max-width` |
| 페이지 내용 폭 | `css/main.css` | `--page-w` |

### 탭 아이콘을 바꿨는데 그대로일 때

브라우저가 아이콘을 오래 기억합니다. 모든 HTML의 `favicon.ico?v=3`, `icon.svg?v=3`, `icon.png?v=3`에서 숫자를 하나 올리면(`v=4`) 새로 불러옵니다.

---

## 4. 참고 사항

- **이미지 경로는 모두 상대 경로**(`img/...`)입니다. 폴더 구조만 그대로 두면 어느 컴퓨터, 어느 주소에서도 사진이 보입니다. 사진을 새로 넣을 때도 `img/` 아래에 넣고 상대 경로로 적어 주세요.
- **파일 이름은 영어 소문자와 `-`만** 쓰는 것을 권장합니다. 한글이나 띄어쓰기가 들어간 파일 이름은 서버에 따라 깨질 수 있습니다.
- **글꼴은 인터넷(CDN)에서 불러옵니다.** 인터넷이 없으면 기본 글꼴로 보입니다.
- **지원 브라우저**: 최신 Chrome, Edge, Safari, Firefox. 사이드바 블러에 `backdrop-filter`, `mask-image`, `:has()`를 써서 아주 오래된 브라우저에서는 블러가 단순하게 보일 수 있습니다.
- **줄바꿈 형식**: 파일은 Windows 줄바꿈(CRLF)으로 저장되어 있습니다. `.gitattributes`가 git에서 알아서 맞춰 주니 따로 설정하지 않아도 됩니다.
- **빌드에 새 JS 파일을 추가했다면** `webpack.config.prod.js`의 `CopyPlugin` 목록에도 추가해야 `dist/`에 복사됩니다. `css/`와 `img/` 폴더는 통째로 복사되므로 따로 적지 않아도 됩니다.
- **공유 미리보기(og:image)**: 도메인이 정해지면 각 HTML의 `og:image`를 `https://도메인/img/og-image.jpg` 같은 절대 주소로 바꾸고 `og:url`을 추가해 주세요.

---

## 로그인 (Supabase Auth) 설정

`login.html`은 Supabase Auth로 이메일/비밀번호와 구글 계정 로그인을 처리합니다. 가입하면 DB의 `users` 테이블에 이름과 전화번호가 자동으로 저장됩니다(`db/schema.sql`의 `handle_new_user`). Supabase 대시보드(https://supabase.com/dashboard)에서 **처음 한 번만** 아래를 설정해야 합니다.

1. **Authentication → Sign In / Providers → Email**이 켜져 있는지 확인합니다. (가입 확인 메일을 보내려면 `Confirm email`도 켜 둡니다)
2. **Authentication → URL Configuration**
   - `Site URL`: 실제 사이트 주소 (예: `https://caffe-onebottle.web.app`)
   - `Redirect URLs`: `http://localhost:8080/**`, `https://caffe-onebottle.web.app/**`, `https://*.web.app/**` (PR 미리보기용)
   - 가입 확인 메일, 비밀번호 재설정 메일, 구글 로그인 뒤에 이 주소들로 돌아옵니다.
3. **SQL Editor**에서 `db/auth-delete-account.sql`을 한 번 실행합니다. (회원 탈퇴 기능)
4. (선택) 구글 로그인: **Authentication → Sign In / Providers → Google**을 켜고, Google Cloud Console에서 만든 OAuth 클라이언트 ID와 Secret을 넣습니다. Google 쪽 "승인된 리디렉션 URI"에는 Supabase 화면에 나오는 Callback URL을 넣습니다.

가입한 회원 목록은 **Authentication → Users**와 **Table Editor → users**에서 볼 수 있습니다.

---

## 5. 브랜치

| 브랜치 | 용도 |
|---|---|
| `main` | 기준 브랜치 |
| `develop` | 작업 브랜치. 다른 컴퓨터에서는 이 브랜치를 받아서 작업 |
