<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<%
    title="공지사항";
    active="notice";
    List<Map<String,Object>> notices;
    try{
        notices=query(application,"SELECT notice_id,title,created_at FROM NOTICE WHERE is_published=TRUE ORDER BY created_at DESC,notice_id DESC");
    }
    catch(Exception e){
        application.log("Notice query failed",e);
        response.setStatus(500);
        request.getRequestDispatcher("/error.jsp").forward(request,response);
        return;
    }
%>

<%@ include file="WEB-INF/jspf/header.jspf" %>
<main id="main" class="wrap page">
    <div class="page-heading"><span class="eyebrow">NOTICE</span>
        <h1>공지사항</h1>
        <p>원보틀의 소식을 전합니다.</p>
    </div>
    <p class="sample-note">[개발용 샘플] 표시는 화면 확인용 공지입니다.</p>
    <table class="notice-table">
        <caption class="sr-only">공개된 공지사항 목록</caption>
        <thead>
            <tr>
                <th scope="col">번호</th>
                <th scope="col">제목</th>
                <th scope="col">등록일</th>
            </tr>
        </thead>
        <tbody>

            <% for(Map<String,Object> n:notices){ %>
            <tr>
                <td><%=esc(n.get("notice_id"))%></td>
                <td><a href="<%=ctx%>/notice.jsp?id=<%=esc(n.get("notice_id"))%>"><%=esc(n.get("title"))%><span
                            aria-hidden="true">↗</span></a></td>
                <td><%=esc(n.get("created_at").toString().substring(0,10))%></td>
            </tr>
            <% } %>

            <% if(notices.isEmpty()){ %>
            <tr>
                <td colspan="3" class="empty">등록된 공지사항이 없습니다.</td>
            </tr>
            <% } %>
        </tbody>
    </table>
</main>
<%@ include file="WEB-INF/jspf/footer.jspf" %>
