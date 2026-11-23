// 모바일: 사이드바 메뉴 열고 닫기
(function () {
  const sidebar = document.querySelector('.js-sidebar');
  const toggle = document.querySelector('.js-sidebar-toggle');
  if (!sidebar || !toggle) return;

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.visually-hidden').textContent = open ? '메뉴 닫기' : '메뉴 열기';
  }

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

// 메뉴 클릭 → 블러가 화면 끝까지 펼쳐지고, 그 위에 해당 페이지 내용이 페이드 인
(function () {
  const body = document.body;
  const layer = document.querySelector('.js-page-layer');
  const frame = document.querySelector('.js-page-frame');
  const closeBtn = document.querySelector('.js-page-close');
  const sidebar = document.querySelector('.js-sidebar');
  if (!layer || !frame || !sidebar) return;

  const PAGES = ['about', 'notice', 'location', 'menu', 'login'];
  const pageOf = (href) => (href || '').split('#')[0].replace('.html', '');
  const isPage = (href) => PAGES.includes(pageOf(href));
  let current = null;

  // iframe 주소를 바꿀 때 브라우저 기록이 쌓이지 않게(뒤로가기가 한 번에 되도록) replace 사용
  function setFrame(url) {
    const abs = new URL(url, location.href).href;
    try {
      frame.contentWindow.location.replace(abs);
    } catch (err) {
      frame.src = abs;
    }
  }

  // 휴대폰: 위쪽 로고 바 높이만큼 내용을 내려서 겹치지 않게
  function updateBarHeight() {
    document.documentElement.style.setProperty('--bar-h', sidebar.offsetHeight + 'px');
  }

  // 사이드바 메뉴에서 지금 열린 페이지 표시
  function markCurrent(page) {
    sidebar.querySelectorAll('.sidebar__nav a').forEach((a) => {
      if (pageOf(a.getAttribute('href')) === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function closeMobileMenu() {
    if (!sidebar.classList.contains('is-open')) return;
    sidebar.classList.remove('is-open');
    const toggle = sidebar.querySelector('.js-sidebar-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.visually-hidden').textContent = '메뉴 열기';
    }
  }

  function openPage(href, push = true) {
    const page = pageOf(href);
    if (page === current) return;

    if (body.classList.contains('is-page-open')) {
      // 이미 열려 있으면 잠깐 흐려졌다가 새 페이지로 교체
      layer.classList.add('is-swapping');
      setTimeout(() => { setFrame(href); }, 250);
    } else {
      setFrame(href);
    }

    current = page;
    closeMobileMenu();
    updateBarHeight();
    markCurrent(page);
    body.classList.add('is-page-open');
    if (push) history.pushState({ page: href }, '', '#' + page);
  }

  function closePage(push = true) {
    if (!body.classList.contains('is-page-open')) return;
    current = null;
    markCurrent(null);
    body.classList.remove('is-page-open');
    if (push) history.pushState(null, '', location.pathname + location.search);
    // 사라지는 애니메이션이 끝난 뒤 내용을 비움
    setTimeout(() => {
      if (!body.classList.contains('is-page-open')) setFrame('about:blank');
    }, 400);
  }

  frame.addEventListener('load', () => layer.classList.remove('is-swapping'));

  // 사이드바 안의 about / notice / location / menu / login 링크는 메인 안에서 열기
  sidebar.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (isPage(href)) {
      e.preventDefault();
      openPage(href);
    } else if (href === 'index.html' && body.classList.contains('is-page-open')) {
      e.preventDefault(); // 로고를 누르면 메인으로 돌아오기
      closePage();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', () => closePage());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePage();
  });

  // 열린 페이지 안에서 다른 페이지로 이동하면(예: 소개 → 오시는 길) 메뉴 표시도 맞춤
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'onebottle-page') return;
    const page = pageOf(e.data.path);
    if (!PAGES.includes(page) || page === current) return;
    current = page;
    markCurrent(page);
    history.replaceState({ page: e.data.path }, '', '#' + page);
  });

  // 브라우저 뒤로가기 / 앞으로가기
  window.addEventListener('popstate', () => {
    const page = location.hash.slice(1);
    if (PAGES.includes(page)) openPage(page + '.html', false);
    else closePage(false);
  });

  window.addEventListener('resize', updateBarHeight);

  // index.html#menu 처럼 주소로 바로 들어온 경우
  const first = location.hash.slice(1);
  if (PAGES.includes(first)) openPage(first + '.html', false);
})();

// 메인 대문 슬라이드 — 자동으로 넘어가지 않고, 스크롤(휠), 스와이프, 화살표 키, 점으로 넘김
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll('.slide'));
  const dotsWrap = hero.querySelector('.hero__dots');
  const currentEl = hero.querySelector('.js-current');
  const totalEl = hero.querySelector('.js-total');
  const sidebar = document.querySelector('.js-sidebar');
  const pad = (n) => String(n).padStart(2, '0');
  const LOCK_MS = 1100; // 한 번 넘긴 뒤 다음 스크롤을 받기까지 기다리는 시간

  if (slides.length < 2) return;

  totalEl.textContent = pad(slides.length);

  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hero__dot';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `${i + 1}번째 사진`);
    btn.appendChild(document.createElement('span'));
    btn.addEventListener('click', () => go(i));
    dotsWrap.appendChild(btn);
    return btn;
  });

  let index = 0;
  let locked = false;

  // 사진은 차례가 오기 직전에 불러와서 첫 화면 로딩을 가볍게 함
  function load(i) {
    const slide = slides[i];
    const img = slide && slide.querySelector('img[data-src]');
    if (img) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  }

  function go(next) {
    // 처음과 마지막에서는 더 넘어가지 않음 (페이지 스크롤처럼)
    index = Math.max(0, Math.min(slides.length - 1, next));

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });

    currentEl.textContent = pad(index + 1);
    load(index - 1);
    load(index);
    load(index + 1);
  }

  // 스크롤이나 스와이프 한 번에 한 장씩만 넘어가도록 잠깐 잠금
  const pageOpen = () => document.body.classList.contains('is-page-open');

  function step(dir) {
    if (locked || pageOpen()) return;
    if (sidebar && sidebar.classList.contains('is-open')) return; // 모바일 메뉴가 열려 있으면 무시
    const before = index;
    go(index + dir);
    if (index !== before) {
      locked = true;
      setTimeout(() => { locked = false; }, LOCK_MS);
    }
  }

  // 마우스 휠 / 노트북 터치패드 스크롤
  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 10) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  // 키보드: 화살표, PageUp/PageDown, 스페이스
  document.addEventListener('keydown', (e) => {
    if (pageOpen()) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(index + 1); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(index - 1); }
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(slides.length - 1);
  });

  // 휴대폰: 위아래 또는 좌우로 밀어서 넘기기
  let startX = null;
  let startY = null;
  hero.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const d = Math.abs(dy) > Math.abs(dx) ? dy : dx;
    if (Math.abs(d) > 50) step(d < 0 ? 1 : -1);
    startX = null;
    startY = null;
  });

  go(0);
})();
