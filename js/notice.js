// 공지사항: 항목을 누르면 부드럽게 펼쳐지고 접히는 애니메이션
(function () {
  const DURATION = 380; // 펼치고 접는 시간 (ms)
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.notices details').forEach((details) => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.notice-body');
    if (!summary || !body) return;

    let running = null;

    // 내용 상자의 현재 높이와 아래 여백 (여백까지 같이 줄여야 끝에서 툭 끊기지 않음)
    const full = () => ({
      height: body.offsetHeight + 'px',
      paddingBottom: getComputedStyle(body).paddingBottom,
      opacity: 1,
      transform: 'translateY(0)',
    });
    const empty = { height: '0px', paddingBottom: '0px', opacity: 0, transform: 'translateY(-6px)' };

    summary.addEventListener('click', (e) => {
      if (reduceMotion) return; // 동작 줄이기 설정이면 기본 동작 그대로
      e.preventDefault();

      // 애니메이션 도중에 다시 누르면, 지금 보이는 높이에서 이어서 반대로 움직임
      let from = null;
      if (running) {
        from = { height: body.offsetHeight + 'px', paddingBottom: getComputedStyle(body).paddingBottom, opacity: getComputedStyle(body).opacity };
        running.cancel();
        running = null;
      }

      const closing = details.open && !details.classList.contains('is-closing');

      if (!closing) {
        // 펼치기
        details.classList.remove('is-closing');
        details.open = true;
        const to = full();
        running = body.animate([from || empty, to], { duration: DURATION, easing: EASE });
        running.onfinish = () => { running = null; };
      } else {
        // 접기: 높이, 여백, 투명도를 끝까지 줄인 상태를 유지(fill)한 채로 닫음
        details.classList.add('is-closing');
        running = body.animate([from || full(), empty], { duration: DURATION * 0.85, easing: EASE, fill: 'forwards' });
        running.onfinish = () => {
          details.open = false;
          details.classList.remove('is-closing');
          running.cancel(); // 닫힌 뒤에 고정해 둔 스타일을 풀어줌
          running = null;
        };
      }
    });
  });
})();
