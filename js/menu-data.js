// 원보틀 메뉴 데이터 (매장 메뉴판 기준, 가격 단위: 1,000원)
// - temp: 'both' (HOT/ICE) | 'ice' | 'hot' | null(표시 안 함). 항목에 없으면 카테고리 값을 따름
// - caffeine: true(카페인) | false(논카페인) | 없음(표시 안 함)
// - milk: true면 '우유 포함' 표시
// - options: 추가 옵션 [{ label, price }]
// - variants: 같은 메뉴에 가격이 여러 개일 때 [{ label, price }]. 그중 하나만 품절이면 그 항목에 soldOut: true
// - soldOut: true면 '품절' 표시 (메뉴판, 주문 페이지). 다시 팔 때는 줄을 지우거나 false로
//     예) { name: '당근케이크', price: 7.5, soldOut: true, desc: '...' },

const GROUPS = [
  { id: 'drinks', en: 'DRINKS', ko: '음료' },
  { id: 'dessert', en: 'DESSERT', ko: '디저트' },
];

const CATEGORIES = [
  {
    id: 'coffee', group: 'drinks', en: 'COFFEE', ko: '커피', temp: 'both', caffeine: true,
    items: [
      { name: '에스프레소', price: 4.5, desc: '진하게 추출한 커피 원액 한 잔. 원두 본연의 향과 묵직한 바디감을 그대로 느낄 수 있어요.' },
      {
        name: '아메리카노', price: 5.5, desc: '에스프레소에 물을 더해 깔끔하게 즐기는 기본 커피.',
        options: [{ label: '헤이즐넛 시럽 추가', price: 1.0 }, { label: '샷 추가', price: 1.0 }],
      },
      { name: '아메리카노 벤티', price: 6.5, desc: '넉넉한 사이즈로 오래 즐기는 아메리카노.' },
      { name: '카페라떼', price: 6.0, milk: true, desc: '에스프레소와 부드러운 우유가 어우러진 라떼.' },
      { name: '카푸치노', price: 6.5, milk: true, desc: '풍성한 우유 거품을 올린 에스프레소 음료.' },
      { name: '카페모카', price: 6.5, milk: true, desc: '에스프레소에 초콜릿과 우유를 더한 달콤쌉싸름한 커피.' },
      { name: '바닐라라떼', price: 6.5, milk: true, desc: '바닐라의 은은한 단맛을 더한 카페라떼.' },
      { name: '카라멜마끼아또', price: 6.5, milk: true, desc: '부드러운 라떼 위에 카라멜 소스를 올린 달콤한 커피.' },
      { name: '흑당라떼', price: 6.5, milk: true, desc: '진한 흑당 시럽과 우유, 에스프레소가 어우러진 라떼.' },
      { name: '연유라떼', price: 6.5, milk: true, desc: '연유의 고소한 단맛이 어우러진 부드러운 라떼.' },
      { name: '헤이즐넛라떼', price: 6.5, milk: true, desc: '고소한 헤이즐넛 향을 더한 카페라떼.' },
      { name: '달고나라떼', price: 6.8, milk: true, desc: '쌉싸름하고 달콤한 달고나를 더한 라떼.' },
      { name: '아포가토', price: 6.8, temp: null, desc: '바닐라 아이스크림 위에 에스프레소를 부어 즐기는 디저트 커피.' },
    ],
  },
  {
    id: 'latte', group: 'drinks', en: 'LATTE', ko: '라떼', temp: 'both',
    items: [
      { name: '초코라떼', price: 6.5, milk: true, desc: '진한 초콜릿과 우유로 만든 달콤한 라떼.' },
      { name: '녹차라떼', price: 6.5, milk: true, caffeine: true, desc: '쌉싸름한 녹차와 우유가 어우러진 라떼.' },
      { name: '홍차라떼', price: 6.5, milk: true, caffeine: true, desc: '홍차의 향을 우유에 부드럽게 담은 라떼.' },
      { name: '고구마라떼', price: 6.5, milk: true, desc: '달콤한 고구마를 곱게 갈아 넣은 든든한 라떼.' },
      { name: '민트초코라떼', price: 6.5, milk: true, desc: '상쾌한 민트와 진한 초콜릿의 조합.' },
      { name: '밀크티', price: 6.5, milk: true, caffeine: true, desc: '진하게 우린 홍차에 우유를 더한 밀크티.' },
      { name: '곡물라떼', price: 6.5, milk: true, desc: '여러 곡물의 고소함을 담은 라떼.' },
    ],
  },
  {
    id: 'tea', group: 'drinks', en: 'TEA', ko: '티', temp: 'both',
    items: [
      { name: '유기농 진주자스민', price: 6.0, caffeine: true, desc: '둥글게 말린 찻잎에 자스민 꽃향을 입힌 녹차.' },
      { name: '유기농 얼그레이', price: 6.0, caffeine: true, desc: '베르가못 향이 감도는 클래식 홍차.' },
      { name: '유기농 카모마일', price: 6.0, caffeine: false, desc: '은은하고 부드러운 향의 허브티.' },
      { name: '유기농 페퍼민트', price: 6.0, caffeine: false, desc: '화한 청량감이 있는 허브티.' },
      { name: '유기농 로즈마리', price: 6.0, caffeine: false, desc: '향긋하고 깔끔한 허브티.' },
      { name: '유기농 히비스커스', price: 6.0, caffeine: false, desc: '붉은 빛깔에 새콤한 맛이 나는 허브티.' },
      { name: '유기농 녹차', price: 6.0, caffeine: true, desc: '산뜻하고 깔끔한 녹차.' },
      { name: '유자/자몽/레몬티', price: 6.0, desc: '과일청으로 만든 차. 유자, 자몽, 레몬 중에서 골라 주세요.' },
      { name: '생강차', price: 6.5, desc: '알싸한 생강 향이 몸을 따뜻하게 해주는 전통차.' },
      { name: '대추차', price: 6.5, desc: '대추를 진하게 달여 깊은 단맛이 나는 전통차.' },
    ],
  },
  {
    id: 'ade', group: 'drinks', en: 'ADE', ko: '에이드 · 아이스티', temp: 'ice',
    items: [
      { name: '유자에이드', price: 6.8, desc: '향긋한 유자에 탄산수를 더한 에이드.' },
      { name: '자몽에이드', price: 6.8, desc: '쌉싸름하고 상큼한 자몽 에이드.' },
      { name: '레몬에이드', price: 6.8, desc: '새콤한 레몬으로 만든 기본 에이드.' },
      { name: '체리에이드', price: 6.8, desc: '달콤한 체리 향의 에이드.' },
      { name: '블루레몬에이드', price: 6.8, desc: '푸른 빛깔이 시원한 블루레몬 에이드.' },
      { name: '깔라만시에이드', price: 6.8, desc: '새콤한 깔라만시로 만든 상큼한 에이드.' },
      { name: '청포도에이드', price: 6.8, desc: '달콤한 청포도 향의 에이드.' },
      { name: '체리 아이스티', price: 6.5, desc: '체리 향을 더한 시원한 아이스티.' },
      { name: '복숭아 아이스티', price: 6.5, desc: '달콤한 복숭아 아이스티.' },
      {
        name: '어린이 음료', temp: null, desc: '아이들을 위한 메뉴예요. 뽀로로 음료 또는 아이스크림 중에서 골라 주세요.',
        variants: [{ label: '뽀로로 음료', price: 3.5 }, { label: '아이스크림', price: 5.0, soldOut: true }], // 예시 품절 (종류 하나만)
      },
    ],
  },
  {
    id: 'smoothie', group: 'drinks', en: 'SMOOTHIE', ko: '스무디', temp: 'ice',
    items: [
      { name: '플레인요거트 스무디', price: 7.0, milk: true, desc: '새콤한 플레인 요거트를 시원하게 갈아 만든 스무디.' },
      { name: '딸기스무디', price: 7.0, desc: '달콤한 딸기를 듬뿍 넣어 시원하게 간 스무디.' },
      { name: '망고스무디', price: 7.0, soldOut: true, desc: '진한 망고의 단맛을 담은 스무디.' }, // 예시 품절
      { name: '블루베리스무디', price: 7.0, desc: '새콤달콤한 블루베리 스무디.' },
    ],
  },
  {
    id: 'frappe', group: 'drinks', en: 'FRAPPE', ko: '프라페', temp: 'ice',
    items: [
      { name: '바닐라프라페', price: 7.2, milk: true, desc: '부드러운 바닐라 향의 얼음 블렌디드 음료.' },
      { name: '녹차프라페', price: 7.2, milk: true, caffeine: true, desc: '쌉싸름한 녹차를 시원하게 갈아 만든 프라페.' },
      { name: '자바칩프라페', price: 7.2, milk: true, desc: '초콜릿 칩이 씹히는 진한 초코 프라페.' },
      { name: '민트초코프라페', price: 7.2, milk: true, desc: '상쾌한 민트와 초콜릿을 함께 간 프라페.' },
      { name: '블루베리프라페', price: 7.2, milk: true, desc: '새콤달콤한 블루베리 프라페.' },
    ],
  },
  {
    id: 'bakery', group: 'dessert', en: 'BAKERY', ko: '베이커리', temp: null,
    items: [
      { name: '모카번', price: 4.5, desc: '커피 향 가득한 바삭한 겉면과 촉촉한 속의 번.' },
      { name: '에그듬뿍 샌드위치', price: 4.5, desc: '부드러운 에그 샐러드를 듬뿍 넣은 샌드위치.' },
      { name: '햄치즈샌드위치', price: 4.5, desc: '햄과 치즈를 넣은 든든한 샌드위치.' },
      { name: '치즈베이글', price: 5.5, desc: '쫄깃한 베이글에 치즈를 더했어요.' },
      { name: '크로크무슈', price: 5.5, desc: '햄과 치즈를 넣고 노릇하게 구운 프랑스식 샌드위치.' },
      { name: '크로플(아이스크림)', price: 6.5, desc: '크루아상 반죽을 와플 틀에 구워 아이스크림을 곁들인 디저트.' },
      { name: '호두 타르트', price: 7.8, soldOut: true, desc: '고소한 호두를 가득 올린 타르트.' }, // 예시 품절
    ],
  },
  {
    id: 'cake', group: 'dessert', en: 'CAKE', ko: '케이크', temp: null,
    items: [
      { name: '치즈케이크', price: 6.5, desc: '진하고 부드러운 크림치즈 케이크.' },
      { name: '초코무스케이크', price: 6.5, desc: '입에서 사르르 녹는 초콜릿 무스 케이크.' },
      { name: '당근케이크', price: 7.5, soldOut: true, desc: '촉촉한 당근 시트에 크림치즈 프로스팅을 올린 케이크.' }, // 예시 품절
      { name: '크림카스테라', price: 7.5, desc: '폭신한 카스테라에 부드러운 크림을 채웠어요.' },
      // TODO: 메뉴판 사진에서 가격이 마우스 커서에 가려져 있음 — 확인 필요
      { name: '티라미수', price: 7.5, desc: '에스프레소에 적신 시트와 마스카포네 크림을 쌓은 이탈리아 디저트.' },
      { name: '한라봉홍차케이크', price: 7.5, desc: '상큼한 한라봉과 은은한 홍차 향의 케이크.' },
      { name: '바스크 치즈케이크', price: 7.5, desc: '겉은 진하게 그을리고 속은 촉촉한 치즈케이크.' },
      { name: '밀크레이프', price: 7.8, desc: '얇은 크레이프와 크림을 여러 겹 쌓은 케이크.' },
      { name: '헤이즐넛 초코케이크', price: 7.8, desc: '고소한 헤이즐넛과 진한 초콜릿의 케이크.' },
      { name: '딸기 티라미수', price: 7.8, desc: '딸기의 상큼함을 더한 티라미수.' },
      { name: '레인보우케이크', price: 8.0, desc: '알록달록한 시트를 겹겹이 쌓은 케이크.' },
    ],
  },
  {
    id: 'bingsu', group: 'dessert', en: 'SUMMER MENU', ko: '빙수', temp: null, note: '2인 기준 · 여름 한정',
    items: [
      { name: '팥빙수', price: 15.0, desc: '곱게 간 얼음 위에 달콤한 팥을 올린 전통 빙수.' },
      { name: '인절미빙수', price: 15.0, desc: '고소한 콩고물과 인절미를 올린 빙수.' },
      { name: '망고빙수', price: 16.0, desc: '달콤한 망고를 듬뿍 올린 빙수.' },
    ],
  },
];
