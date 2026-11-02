<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<% active="home"; %>

<%@ include file="WEB-INF/jspf/header.jspf" %>

<main id="main">
    <section class="hero" aria-label="매장 이미지 슬라이드" data-slideshow>
        <div class="slides">

            <%
                String rawSlides=site.getProperty("slides","").trim();
                String[] slides=rawSlides.isEmpty()?new String[0]:rawSlides.split(",");
                for(int i=0;i<slides.length;i++){
            %>

            <img class="slide <%=i==0?"visible":""%>" src="<%=esc(image(slides[i].trim(),ctx))%>"
                alt="개발용 매장 대체 일러스트 <%=i+1%>" <%=i>0?"aria-hidden=\"true\"":""%>>
            <% } %>
        </div>
        <div class="hero-shade"></div>
        <div class="wrap hero-copy"><span class="eyebrow light">ONE BOTTLE · ANYANG</span>
            <h1>원보틀</h1>
            <p><%=esc(intro)%></p><a class="button light-button" href="<%=ctx%>/menu.jsp">전체 메뉴 보기 <span
                    aria-hidden="true">↗</span></a>
        </div>
        <span class="sample-label">개발용 대체 이미지 · 실제 매장 사진이 아닙니다</span>
        <div class="slide-controls" <%=slides.length<2?"hidden":""%>><button type="button" data-prev
                aria-label="이전 슬라이드">←</button><span data-slide-count aria-live="polite">01 /
                <%=String.format("%02d",slides.length)%></span><button type="button" data-next
                aria-label="다음 슬라이드">→</button><button type="button" data-play>자동 재생 정지</button></div>
    </section>
    <section class="menu-invitation wrap">
        <div><span class="eyebrow">OUR MENU</span>
            <h2>한 잔의 커피, 함께하는 디저트</h2>
            <p class="muted">원보틀의 전체 메뉴를 확인해 보세요.</p>
        </div><a class="text-link" href="<%=ctx%>/menu.jsp">전체 메뉴 보기 <span aria-hidden="true">↗</span></a>
    </section>
    <section class="hours">
        <div class="wrap info-grid">
            <div><span class="eyebrow">OPENING HOURS</span>
                <h2>영업 안내</h2>
            </div>
            <dl>
                <div>
                    <dt>영업시간</dt>
                    <dd><%=esc(site.getProperty("hours"))%></dd>
                </div>
                <div>
                    <dt>정기휴무</dt>
                    <dd><%=esc(site.getProperty("holiday"))%></dd>
                </div>
            </dl>
        </div>
    </section>
    <section id="directions" class="wrap directions">
        <div><span class="eyebrow">FIND US</span>
            <h2>오시는 길</h2>
            <p>원보틀에서 만나요.</p>
        </div>
        <div class="visit">
            <span class="mini-label">ADDRESS</span>
            <p class="home-address"><%=esc(address)%></p>
            <a class="outline-button" href="<%=ctx%>/directions.jsp">
                오시는 길 보기 <span aria-hidden="true">↗</span>
            </a>
        </div>
    </section>
</main>

<%@ include file="WEB-INF/jspf/footer.jspf" %>
