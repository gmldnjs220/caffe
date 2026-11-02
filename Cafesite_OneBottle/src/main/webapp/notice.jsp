<%@ page pageEncoding="UTF-8" %>

<%@ include file="WEB-INF/jspf/common.jspf" %>

<%
    title="공지사항";
    active="notice";
    Map<String,Object> notice=null;
    long id=positiveId(request.getParameter("id"));
    try{
        if(id>0){
            List<Map<String,Object>> rows=query(application,"SELECT title,content,created_at FROM NOTICE WHERE notice_id=? AND is_published=TRUE",id);
            if(!rows.isEmpty())notice=rows.get(0);
        }
    }
    catch(Exception e){
        application.log("Notice detail query failed",e);
        response.setStatus(500);
        request.getRequestDispatcher("/error.jsp").forward(request,response);
        return;
    }
    if(notice==null)response.setStatus(404);
%>

<%@ include file="WEB-INF/jspf/header.jspf" %>
<main id="main" class="wrap page detail">
    <% if(notice==null){ %>
    <div class="page-heading"><span class="eyebrow">404</span>
        <h1>공지를 찾을 수 없습니다.</h1>
        <p>존재하지 않거나 공개되지 않은 공지입니다.</p>
    </div>
    <%
        }
        else{
    %>
    <div class="page-heading"><span class="eyebrow">NOTICE</span>
        <h1><%=esc(notice.get("title"))%></h1>
        <p><%=esc(notice.get("created_at").toString().substring(0,10))%></p>
    </div>
    <div class="notice-body"><%=esc(notice.get("content"))%></div>
    <% } %>
    <a class="outline-button" href="<%=ctx%>/notices.jsp">← 목록으로</a>
</main>
<%@ include file="WEB-INF/jspf/footer.jspf" %>
