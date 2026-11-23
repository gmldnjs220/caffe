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
├─ notice.html         공지사항
├─ location.html       오시는 길
├─ login.html          로그인 / 회원가입 (Firebase Authentication)
├─ 404.html            없는 페이지 안내
├─ css/
│  ├─ style.css        기본 초기화 스타일
│  ├─ main.css         모든 페이지 공통 (색, 글꼴, 머리글, 페이지 폭)
│  ├─ home.css         홈 화면 (사이드바, 블러, 슬라이드)
│  ├─ login.css        로그인 페이지
│  ├─ pages.css        소개, 공지사항, 오시는 길
│  └─ menu.css         메뉴 페이지
├─ js/
│  ├─ app.js           홈 화면 동작 (슬라이드, 페이지 열기/닫기)
│  ├─ login.js         로그인 페이지 동작 (이메일, 구글 로그인, 내 계정, 비밀번호 변경)
│  ├─ account-view.js  내 계정에 보여 줄 가입 정보 정리
│  ├─ auth-nav.js      모든 페이지 위쪽 메뉴: 로그인하면 "내 계정"으로 표시
│  ├─ firebase.js      Firebase 연결 (로그인 페이지와 위쪽 메뉴가 같이 씀)
│  ├─ firebase-config.js  Firebase 웹 앱 설정값 (로그인에 필요)
│  ├─ menu-data.js     메뉴 데이터 (이름, 가격, 설명)
│  ├─ menu.js          메뉴 페이지 동작 (필터, 상세 보기)
│  └─ notice.js        공지사항 열기/닫기 애니메이션
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
| 영업시간 | `notice.html`, `location.html`, `index.html` | 세 곳 모두 같이 고쳐야 함 (공지사항 `id="hours"`, 오시는 길 `visit-hours`, 홈 사이드바 `sidebar__info`) |
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

## 로그인 (Firebase Authentication) 설정

`login.html`은 Firebase Authentication으로 이메일/비밀번호와 구글 계정 로그인을 처리합니다. Firebase 콘솔(https://console.firebase.google.com)의 `caffe-onebottle` 프로젝트에서 **처음 한 번만** 아래를 설정해야 동작합니다.

1. **Authentication → 시작하기**를 누릅니다.
2. **Authentication → 로그인 방법**에서 `이메일/비밀번호`와 `Google`을 **사용 설정**합니다. (Google은 프로젝트 지원 이메일을 고르라고 나옵니다)
3. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱**에 웹 앱(`</>`)이 없으면 하나 등록합니다.
4. 로컬(`npm start`)에서도 로그인을 시험하려면, 같은 화면의 **SDK 설정 및 구성 → 구성** 값을 `js/firebase-config.js`에 붙여 넣습니다. 이 값은 비밀번호가 아니라서 저장소에 올려도 됩니다.
   - 비워 두면 Firebase Hosting에 배포된 사이트(PR 미리보기 포함)에서만 설정을 자동으로 불러옵니다.
5. 로그인이 "이 주소에서는 로그인할 수 없어요"라고 나오면 **Authentication → 설정 → 승인된 도메인**에 그 주소를 추가합니다. (`localhost`와 `*.web.app`, `*.firebaseapp.com`은 기본으로 들어 있음. PR 미리보기 주소도 `web.app`이라 보통은 그대로 됩니다)

가입한 회원 목록은 Firebase 콘솔의 **Authentication → 사용자**에서 볼 수 있습니다.

---

## 5. 브랜치

| 브랜치 | 용도 |
|---|---|
| `main` | 기준 브랜치 |
| `develop` | 작업 브랜치. 다른 컴퓨터에서는 이 브랜치를 받아서 작업 |
