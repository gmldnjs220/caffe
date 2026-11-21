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
  function step(dir) {
    if (locked) return;
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
