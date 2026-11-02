<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<%
    title = "오시는 길";
    active = "directions";
%>

<%@ include file="WEB-INF/jspf/header.jspf" %>

<main id="main" class="wrap page">
    <div class="page-heading">
        <span class="eyebrow">FIND US</span>
        <h1>오시는 길</h1>
        <p>원보틀에서 만나요.</p>
    </div>

    <!-- 실제 지도 연결 시 이 영역을 지도 컨테이너로 교체합니다. -->
    <section class="map-placeholder" aria-labelledby="map-heading">
        <span class="map-placeholder-icon" aria-hidden="true">⌖</span>
        <h2 id="map-heading">지도가 들어갈 공간</h2>
        <p>매장 위치를 안내할 지도를 준비하고 있습니다.</p>
        <span class="map-placeholder-address"><%=esc(address)%></span>
    </section>

    <section class="directions-details" aria-labelledby="visit-heading">
        <div>
            <span class="eyebrow">VISIT ONE BOTTLE</span>
            <h2 id="visit-heading">방문 안내</h2>
        </div>
        <div class="visit">
            <span class="mini-label">ADDRESS</span>
            <p id="address" tabindex="0"><%=esc(address)%></p>
            <button class="outline-button" type="button" data-copy>
                주소 복사 <span aria-hidden="true">⧉</span>
            </button>
            <p data-copy-status role="status" class="copy-status"></p>
            <dl>
                <div>
                    <dt>주차</dt>
                    <dd><%=esc(site.getProperty("parking"))%></dd>
                </div>
                <div>
                    <dt>대중교통</dt>
                    <dd><%=esc(site.getProperty("transport"))%></dd>
                </div>
            </dl>
        </div>
    </section>
</main>

<%@ include file="WEB-INF/jspf/footer.jspf" %>
