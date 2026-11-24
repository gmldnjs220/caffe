// 화면 문구와 공지사항을 Supabase에서 읽어 와서 바꿔 끼움 (모든 방문자)
//
// - 화면 문구: HTML에서 data-text-key="키" 가 붙은 곳. Supabase site_texts 테이블에 그 키가 있으면 그 문구로 바꿈
//   행이 없으면 HTML에 적힌 원래 문구가 그대로 보여요 (관리자 화면에서 "원래 문구로" 누르면 행이 지워짐)
//   - data-text-template="call / {}" : {} 자리에 문구를 넣어서 보여 줌
//   - data-text-href="tel"           : 링크 주소도 tel:번호 로 같이 바꿈
// - 공지사항: notice.html 의 .notices 안. Supabase notices 테이블의 공개된 공지로 바꿈
//   ("요일별 영업시간 안내"(#hours)는 js/hours.js 값으로 만들어서 그대로 둠)
// - 문구 쓰는 법: 줄바꿈은 그대로, *글자* 는 강조, [글자](주소) 는 링크
// - Supabase에 연결하지 못하거나 테이블이 아직 없으면 HTML 그대로 보여요
// - 관리자 화면(js/admin-edit.js)이 window.siteContent 를 같이 씀

(function () {
  const config = window.SUPABASE_CONFIG || {};
  const TEXT_CACHE = 'onebottle-site-texts-v1';
  const NOTICE_CACHE = 'onebottle-notices-v1';

  const safe = (fn, fallback = null) => { try { return fn(); } catch (err) { return fallback; } };
  const readJson = (key) => safe(() => JSON.parse(localStorage.getItem(key)));
  const writeJson = (key, value) => safe(() => localStorage.setItem(key, JSON.stringify(value)));

  /* ---------- 문구 → 화면 ---------- */

  const SAFE_URL = /^(https?:\/\/|tel:|mailto:|[\w-]+\.html(#[\w-]*)?$|#[\w-]+$)/i;
  const TOKEN = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*([^*\n]+)\*|\n/g;

  // 글자를 화면 조각으로: 줄바꿈 → <br>, *강조* → <em>, [글자](주소) → <a>. HTML 태그는 글자 그대로 보임
  function format(value) {
    const frag = document.createDocumentFragment();
    const text = String(value ?? '');
    let last = 0;
    text.replace(TOKEN, (match, linkText, url, em, offset) => {
      if (offset > last) frag.append(text.slice(last, offset));
      if (match === '\n') {
        frag.append(document.createElement('br'));
      } else if (em != null) {
        const node = document.createElement('em');
        node.textContent = em;
        frag.append(node);
      } else if (SAFE_URL.test(url)) {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = linkText;
        frag.append(a);
      } else {
        frag.append(match);
      }
      last = offset + match.length;
      return match;
    });
    if (last < text.length) frag.append(text.slice(last));
    return frag;
  }

  // 빈 줄로 나눈 문단마다 <p>
  function formatParagraphs(value) {
    const frag = document.createDocumentFragment();
    String(value ?? '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).forEach((para) => {
      const p = document.createElement('p');
      p.append(format(para));
      frag.append(p);
    });
    return frag;
  }

  // 화면 → 글자 (위 format의 반대). 관리자 화면에서 원래 문구를 수정 칸에 넣을 때 씀
  function domToText(root) {
    let out = '';
    root.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.textContent.replace(/\s+/g, ' ');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.hasAttribute('data-admin-ui')) return;
        const tag = node.tagName;
        if (tag === 'BR') out += '\n';
        else if (tag === 'EM' || tag === 'STRONG') out += `*${node.textContent.trim()}*`;
        else if (tag === 'A') out += `[${node.textContent.trim()}](${node.getAttribute('href')})`;
        else if (tag === 'P') out += `${domToText(node).trim()}\n\n`;
        else out += domToText(node);
      }
    });
    return out;
  }

  const tidy = (text) => text.split('\n').map((line) => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  /* ---------- 화면 문구 ---------- */

  let texts = {};

  function defaultOf(el) {
    if (el.dataset.textDefault == null) el.dataset.textDefault = tidy(domToText(el));
    return el.dataset.textDefault;
  }

  function applyTexts(root = document) {
    root.querySelectorAll('[data-text-key]').forEach((el) => {
      const fallback = defaultOf(el);
      const key = el.dataset.textKey;
      const value = Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : fallback;
      const template = el.dataset.textTemplate;
      const ui = [...el.querySelectorAll(':scope > [data-admin-ui]')];
      el.replaceChildren(template ? template.replace('{}', value) : format(value), ...ui);
      if (el.dataset.textHref === 'tel' && el.tagName === 'A') {
        el.href = `tel:${value.replace(/[^0-9+-]/g, '')}`;
      }
    });
    document.dispatchEvent(new CustomEvent('site-texts-applied'));
  }

  function setTexts(rows) {
    texts = {};
    rows.forEach((row) => { texts[row.key] = row.value; });
  }

  /* ---------- 공지사항 ---------- */

  const noticeBox = document.querySelector('.notices');
  let notices = null; // null = HTML 공지를 그대로 쓰는 중

  const dotDate = (iso) => String(iso).slice(0, 10).replace(/-/g, '.');

  function noticeEl(n) {
    const details = document.createElement('details');
    details.dataset.noticeId = String(n.id);
    if (n.is_published === false) details.classList.add('is-unpublished');
    const summary = document.createElement('summary');
    const strong = document.createElement('strong');
    strong.textContent = n.title;
    const time = document.createElement('time');
    time.dateTime = String(n.posted_on).slice(0, 10);
    time.textContent = dotDate(n.posted_on);
    summary.append(strong, ' ', time);
    const body = document.createElement('div');
    body.className = 'notice-body';
    body.append(formatParagraphs(n.body));
    details.append(summary, body);
    return details;
  }

  const byDateDesc = (a, b) => String(b.posted_on).localeCompare(String(a.posted_on)) || b.id - a.id;

  function renderNotices(list) {
    if (!noticeBox || !Array.isArray(list)) return;
    notices = [...list].sort(byDateDesc);
    // 열려 있던 공지는 다시 그려도 열린 채로
    const open = new Set([...noticeBox.querySelectorAll('details[open][data-notice-id]')].map((d) => d.dataset.noticeId));
    noticeBox.querySelectorAll('details:not(#hours)').forEach((d) => d.remove());
    notices.forEach((n) => {
      const d = noticeEl(n);
      if (open.has(String(n.id))) d.open = true;
      noticeBox.append(d);
      if (window.setupNotice) window.setupNotice(d);
    });
    document.dispatchEvent(new CustomEvent('notices-rendered'));
  }

  // HTML에 적힌 공지 (Supabase에 아직 공지 테이블이 없을 때 그대로 보이는 것)
  function htmlNotices() {
    if (!noticeBox) return [];
    return [...noticeBox.querySelectorAll('details:not(#hours)')].map((d, i) => ({
      id: -(i + 1),
      title: d.querySelector('summary strong')?.textContent.trim() || '',
      posted_on: d.querySelector('summary time')?.getAttribute('datetime') || '',
      body: tidy(domToText(d.querySelector('.notice-body') || d)),
    }));
  }

  /* ---------- Supabase에서 읽기 (라이브러리 없이 주소로 바로 읽음) ---------- */

  async function rest(path) {
    const res = await fetch(`${config.url}/rest/v1/${path}`, { headers: { apikey: config.key } });
    if (!res.ok) throw new Error(`${path.split('?')[0]}: ${res.status}`);
    return res.json();
  }

  async function load() {
    if (!config.url || !config.key) return;
    const jobs = [
      rest('site_texts?select=key,value').then((rows) => {
        setTexts(rows);
        writeJson(TEXT_CACHE, rows);
        applyTexts();
      }),
    ];
    if (noticeBox) {
      jobs.push(rest('notices?select=id,title,body,posted_on&is_published=eq.true').then((rows) => {
        writeJson(NOTICE_CACHE, rows);
        renderNotices(rows);
      }));
    }
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => {
      if (r.status === 'rejected') console.info('[site-content] Supabase 문구/공지를 읽지 못해서 HTML 그대로 보여요.', r.reason.message);
    });
  }

  // 1) 지난번 문구·공지로 먼저 바꾸고  2) Supabase에서 최신 값을 받아 다시 바꿈
  const cachedTexts = readJson(TEXT_CACHE);
  if (Array.isArray(cachedTexts)) setTexts(cachedTexts);
  applyTexts();
  const cachedNotices = readJson(NOTICE_CACHE);
  if (Array.isArray(cachedNotices)) renderNotices(cachedNotices);

  window.siteContent = {
    format,
    formatParagraphs,
    domToText,
    tidy,
    defaultOf,
    applyTexts,
    getText: (key) => texts[key],
    hasText: (key) => Object.prototype.hasOwnProperty.call(texts, key),
    setText(key, value) {
      if (value == null) delete texts[key];
      else texts[key] = value;
      writeJson(TEXT_CACHE, Object.entries(texts).map(([k, v]) => ({ key: k, value: v })));
      applyTexts();
    },
    get notices() { return notices || htmlNotices(); },
    get usingHtmlNotices() { return notices == null; },
    renderNotices,
    cacheNotices: (rows) => writeJson(NOTICE_CACHE, rows.filter((n) => n.is_published !== false)),
    ready: load(),
  };
}());
