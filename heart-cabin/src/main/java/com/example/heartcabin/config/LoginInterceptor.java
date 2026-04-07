package com.example.heartcabin.config;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.common.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.web.servlet.HandlerInterceptor;

// 这里改成 jakarta ！！！
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
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
}