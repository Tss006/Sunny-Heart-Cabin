package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.common.JwtUtil;
import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;


    // 注册（密码加密）
    @PostMapping("/register")
    public Result<?> register(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            return Result.fail("用户名不能为空");
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return Result.fail("密码长度不能少于6位");
        }
        if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
            return Result.fail("昵称不能为空");
        }
        User exist = userService.getByUsername(user.getUsername());
        if (exist != null) {
            return Result.fail("用户名已存在");
        }
        // 明文存储密码（不推荐，仅为演示）
        user.setPassword(user.getPassword());
        user.setRole("user");
        user.setStatus(1);
        userService.register(user);
        return Result.success("注册成功");
    }

    // 登录（返回token）
    @PostMapping("/login")
    public Result<?> login(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            return Result.fail("用户名不能为空");
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return Result.fail("密码长度不能少于6位");
        }
        User dbUser = userService.getByUsername(user.getUsername());
        if (dbUser == null) {
            return Result.fail("用户名不存在");
        }
        // 明文密码比对（不推荐，仅为演示）
        if (!Objects.equals(user.getPassword(), dbUser.getPassword())) {
            return Result.fail("密码错误");
        }
        if (dbUser.getStatus() == 0) {
            return Result.fail("账号已禁用");
        }
        // 生成JWT token
        Map<String, Object> map = new HashMap<>();
        map.put("userId", dbUser.getId());
        map.put("username", dbUser.getUsername());
        String token = JwtUtil.createToken(map);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", dbUser);
        return Result.success("登录成功", result);
    }

    // 获取当前登录用户信息
    @GetMapping("/info")
    public Result<?> info(@RequestHeader("token") String token) {
        if (token == null || token.isEmpty()) {
            return Result.fail("未登录或token缺失");
        }
        Long userId = JwtUtil.parseToken(token).get("userId", Long.class);
        User user = userService.getById(userId);
        user.setPassword(null);
        return Result.success(user);
    }

    // 修改昵称
    @PostMapping("/info/update")
    public Result<?> updateInfo(@RequestBody User user) {
        userService.updateById(user);
        return Result.success("修改成功");
    }

    // 修改密码
    @PostMapping("/password/update")
    public Result<?> updatePwd(@RequestBody User user) {
        User dbUser = userService.getById(user.getId());
        dbUser.setPassword(user.getPassword());
        userService.updateById(dbUser);
        return Result.success("密码修改成功");
    }
}