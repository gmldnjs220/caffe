<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<%
    title="카페 소개";
    active="about";
%>

<%@ include file="WEB-INF/jspf/header.jspf" %>

<main id="main" class="wrap page">
    <div class="page-heading"><span class="eyebrow">ABOUT ONE BOTTLE</span>
        <h1>카페 소개</h1>
        <p>안양예술공원의 원보틀을 소개합니다.</p>
    </div>
    <div class="about-image"><img src="<%=ctx%>/assets/space-2.svg" alt="실제 매장 사진을 대신하는 개발용 공간 일러스트"><span
            class="image-caption">개발용 대체 이미지 · 실제 매장 사진이 아닙니다</span></div>
    <section class="about-copy">
        <h2>원보틀</h2>
        <p><%=esc(intro)%></p>
    </section>
    <div class="gallery">
        <figure><img src="<%=ctx%>/assets/space-1.svg" alt="매장 내부 사진 대체 일러스트">
            <figcaption>내부 사진 · 실제 자료 준비 중</figcaption>
        </figure>
        <figure><img src="<%=ctx%>/assets/space-3.svg" alt="매장 외부 사진 대체 일러스트">
            <figcaption>외부 사진 · 실제 자료 준비 중</figcaption>
        </figure>
    </div>
</main>
<%@ include file="WEB-INF/jspf/footer.jspf" %>
