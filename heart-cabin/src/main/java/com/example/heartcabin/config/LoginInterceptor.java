package com.example.heartcabin.config;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.common.JwtUtil;
import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.UserService;
import com.example.heartcabin.service.impl.UserServiceImpl;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerInterceptor;

// 这里改成 jakarta ！！！
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
@RestController
@RequestMapping("/user")
public class LoginInterceptor implements HandlerInterceptor {
    @Autowired
    private UserServiceImpl userService;
    @PostMapping("/login")
    public Result<User> login(@RequestBody User user){

        User user2= userService.getByUsername(user.getUsername());
        if(user2.getPassword().equals(user.getPassword())){
            return Result.success(user);
        }
        else {
            return Result.fail();
        }
    }
    @PostMapping("/register")
    public Result<User> register(@RequestBody User user){
        UserServiceImpl userService = new UserServiceImpl();
        userService.register(user);
        return Result.success(user);
    }
}