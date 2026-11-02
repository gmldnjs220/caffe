document.querySelectorAll("[data-menu-image]").forEach((img) =>
    img.addEventListener("error", () => {
        if (!img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = new URL(
                "menu-placeholder.svg",
                document.querySelector('link[rel="stylesheet"]').href,
            ).href;
        }
    }),
);
const hero = document.querySelector("[data-slideshow]");
if (hero) {
    const slides = [...hero.querySelectorAll(".slide")],
        controls = hero.querySelector(".slide-controls");
    if (slides.length > 1) {
        let current = 0,
            manualPause = matchMedia("(prefers-reduced-motion: reduce)").matches,
            timer = null,
            hovered = false,
            focused = false;
        const play = hero.querySelector("[data-play]");
        const update = () => {
            slides.forEach((s, i) => {
                s.classList.toggle("visible", i === current);
                s.setAttribute("aria-hidden", String(i !== current));
            });
            hero.querySelector("[data-slide-count]").textContent =
                `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        };
        const schedule = () => {
            clearInterval(timer);
            timer = null;
            play.textContent = manualPause ? "자동 재생 시작" : "자동 재생 정지";
            if (!manualPause && !hovered && !focused && !document.hidden)
                timer = setInterval(() => {
                    current = (current + 1) % slides.length;
                    update();
                }, 6000);
        };
        hero.querySelector("[data-prev]").addEventListener("click", () => {
            current = (current - 1 + slides.length) % slides.length;
            update();
            schedule();
        });
        hero.querySelector("[data-next]").addEventListener("click", () => {
            current = (current + 1) % slides.length;
            update();
            schedule();
        });
        play.addEventListener("click", () => {
            manualPause = !manualPause;
            schedule();
        });
        hero.addEventListener("mouseenter", () => {
            hovered = true;
            schedule();
        });
        hero.addEventListener("mouseleave", () => {
            hovered = false;
            schedule();
        });
        hero.addEventListener("focusin", () => {
            focused = true;
            schedule();
        });
        hero.addEventListener("focusout", () =>
            setTimeout(() => {
                focused = hero.contains(document.activeElement);
                schedule();
            }, 0),
        );
        document.addEventListener("visibilitychange", schedule);
        update();
        schedule();
    } else if (controls) controls.hidden = true;
}
document.querySelector("[data-copy]")?.addEventListener("click", async () => {
    const address = document.querySelector("#address"),
        status = document.querySelector("[data-copy-status]");
    try {
        await navigator.clipboard.writeText(address.textContent.trim());
        status.textContent = "주소를 복사했습니다.";
    } catch {
        status.textContent = "복사하지 못했습니다. 선택된 주소를 직접 복사해 주세요.";
        const range = document.createRange();
        range.selectNodeContents(address);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        address.focus();
    }
});

const menuFilters = document.querySelector(".filters");

if (menuFilters) {
    const page = menuFilters.closest("main");
    const results = page.querySelector("[data-menu-results]");
    const status = page.querySelector("[data-filter-status]");
    let pendingRequest;

    async function changeCategory(url, updateHistory) {
        pendingRequest?.abort();
        const request = new AbortController();
        pendingRequest = request;
        results.setAttribute("aria-busy", "true");
        status.textContent = "메뉴를 불러오는 중입니다.";

        try {
            const response = await fetch(url, { signal: request.signal });
            if (!response.ok) throw new Error("Menu request failed");

            const documentFragment = new DOMParser().parseFromString(
                await response.text(),
                "text/html",
            );
            const nextResults = documentFragment.querySelector("[data-menu-results]");
            const nextFilters = documentFragment.querySelector(".filters");
            if (!nextResults || !nextFilters) throw new Error("Menu results missing");
            if (request.signal.aborted) return;

            // Keep the page tall enough to prevent scroll clamping for shorter categories.
            page.style.minHeight = `${page.getBoundingClientRect().height}px`;
            results.replaceChildren(...nextResults.childNodes);

            const selectedUrl = nextFilters.querySelector("[aria-current]")?.getAttribute("href");
            menuFilters.querySelectorAll("a").forEach((link) => {
                if (link.getAttribute("href") === selectedUrl) {
                    link.setAttribute("aria-current", "true");
                } else {
                    link.removeAttribute("aria-current");
                }
            });

            results.querySelectorAll("[data-menu-image]").forEach((image) => {
                image.addEventListener("error", () => {
                    if (image.dataset.fallback) return;
                    image.dataset.fallback = "1";
                    image.src = new URL(
                        "menu-placeholder.svg",
                        document.querySelector('link[rel="stylesheet"]').href,
                    ).href;
                });
            });

            if (updateHistory) history.pushState(null, "", url);
            status.textContent = results.querySelector(".results").textContent;
        } catch (error) {
            if (error.name !== "AbortError") {
                status.textContent = "메뉴를 불러오지 못했습니다. 카테고리를 다시 선택해 주세요.";
            }
        } finally {
            if (pendingRequest === request) results.removeAttribute("aria-busy");
        }
    }

    menuFilters.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        changeCategory(link.href, true);
    });

    window.addEventListener("popstate", () => changeCategory(location.href, false));
}
