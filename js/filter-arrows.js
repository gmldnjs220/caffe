// 카테고리 버튼 줄(.filter) 양쪽에 좌우 화살표를 붙임 (메뉴 페이지, 주문 페이지가 같이 씀)
// - 더 넘길 버튼이 없는 쪽 화살표는 숨김
// - 버튼은 menu.js / order.js 가 나중에 다시 그려도 화살표가 알아서 맞춰짐

(function () {
  const ARROW = {
    prev: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    next: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function arrowButton(dir) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `filter__arrow filter__arrow--${dir}`;
    btn.setAttribute('aria-label', dir === 'prev' ? '이전 카테고리 보기' : '다음 카테고리 보기');
    btn.hidden = true;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${ARROW[dir]}</svg>`;
    return btn;
  }

  document.querySelectorAll('.filter').forEach((filter) => {
    const scroller = filter.querySelector('.filter__scroll');
    if (!scroller) return;

    const prev = arrowButton('prev');
    const next = arrowButton('next');
    filter.prepend(prev);
    filter.append(next);

    function update() {
      const max = scroller.scrollWidth - scroller.clientWidth;
      prev.hidden = scroller.scrollLeft <= 1;
      next.hidden = scroller.scrollLeft >= max - 1;
    }

    // 한 번 누르면 보이는 폭의 70%만큼 넘김
    const move = (sign) => scroller.scrollBy({ left: sign * scroller.clientWidth * 0.7, behavior: 'smooth' });
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));

    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    new MutationObserver(update).observe(scroller, { childList: true });
    if (document.fonts) document.fonts.ready.then(update);
    update();
  });
}());
