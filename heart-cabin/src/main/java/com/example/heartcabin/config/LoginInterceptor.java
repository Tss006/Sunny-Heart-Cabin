package com.example.heartcabin.config;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.common.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class LoginInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String uri = request.getRequestURI();

        // 放行登录、注册接口
        if (uri.equals("/user/login") || uri.equals("/user/register")) {
            return true;
        }

        // 其他 /user 接口必须登录
        if (uri.startsWith("/user/")) {
            String token = request.getHeader("token");
            if (token == null || token.isEmpty()) {
                throw new BusinessException("请先登录");
            }
            try {
                Claims claims = JwtUtil.parseToken(token);
                request.setAttribute("userId", claims.get("userId"));
                return true;
            } catch (Exception e) {
                throw new BusinessException("登录已失效");
            }
        }
        return true;
    }
}