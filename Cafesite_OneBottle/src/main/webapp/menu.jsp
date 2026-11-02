<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<%
    title="메뉴";
    active="menu";
    List<Map<String,Object>> categories,menus;
    String selected=request.getParameter("category");
    long category=selected==null?0:positiveId(selected);
    try {
        categories=query(application,"SELECT category_id,name FROM MENU_CATEGORY ORDER BY sort_order,category_id");
        String sql="SELECT m.* FROM MENU m JOIN MENU_CATEGORY c ON c.category_id=m.category_id WHERE m.is_published=TRUE";
        if(selected!=null) sql+=" AND m.category_id=?";
        sql+=" ORDER BY c.sort_order,c.category_id,m.sort_order,m.menu_id";
        menus=selected==null?query(application,sql):query(application,sql,category);
    }
    catch(Exception e){
        application.log("Menu query failed",e);
        response.setStatus(500);
        request.getRequestDispatcher("/error.jsp").forward(request,response);
        return;
    }
%>

<%@ include file="WEB-INF/jspf/header.jspf" %>
<main id="main" class="wrap page">
    <div class="page-heading"><span class="eyebrow">COFFEE &amp; DESSERT</span>
        <h1>메뉴</h1>
        <p>한 잔의 여유를 골라 보세요.</p>
    </div>
    <p class="sample-note">개발용 샘플 메뉴·가격·분류 및 대체 이미지가 포함되어 있습니다.</p>
    <nav class="filters" aria-label="메뉴 분류"><a class="filter" href="<%=ctx%>/menu.jsp"
            <%=selected==null?"aria-current=\"true\"":""%>>전체</a>

        <% for(Map<String,Object> c:categories){ %>
        <a class="filter" href="<%=ctx%>/menu.jsp?category=<%=esc(c.get("category_id"))%>"
            <%=positiveId(c.get("category_id").toString())==category?"aria-current=\"true\"":""%>><%=esc(c.get("name"))%></a>
        <% } %>
    </nav>
    <p data-filter-status role="status" class="sr-only"></p>
    <div data-menu-results>
    <p class="results" aria-live="polite">총 <strong><%=menus.size()%></strong>개의 메뉴</p>
    <div class="menu-grid">
        <% for(Map<String,Object> m:menus){ %>
        <article class="menu-card">
            <div class="menu-image"><img src="<%=esc(image(m.get("image_path"),ctx))%>"
                    alt="메뉴 대체 이미지: <%=esc(m.get("name"))%>" loading="lazy" data-menu-image><span>개발용 대체 이미지</span>
            </div>
            <div class="menu-copy">
                <h2><%=esc(m.get("name"))%></h2>
                <p><%=esc(m.get("description"))%></p>
                <strong><%=NumberFormat.getIntegerInstance(Locale.KOREA).format(m.get("price"))%><small>
                        원</small></strong>
            </div>
        </article>
        <% } %>
    </div>
    <% if(menus.isEmpty()){ %>
    <p class="empty">등록된 메뉴가 없습니다.</p>
    <% } %>
    </div>
</main>
<%@ include file="WEB-INF/jspf/footer.jspf" %>
