package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    // 登录
    @PostMapping("/login")
    public Result<User> login(@RequestBody User user) {
        System.out.println("正在登录");
        User loginUser = userService.login(user.getUsername(), user.getPassword());
        if (loginUser != null) {
            return Result.success("登录成功", loginUser);
        } else {
            return Result.fail("账号或密码错误");
        }
    }

    // 注册
    @PostMapping("/register")
    public Result<?> register(@RequestBody User user) {
        boolean ok = userService.register(user);
        if (ok) {
            return Result.success("注册成功", null);
        } else {
            return Result.fail("注册失败");
        }
    }

    // 修改密码
    @PostMapping("/updatePassword")
    public Result<?> updatePassword(
            @RequestParam Long id,
            @RequestParam String password) {
        boolean ok = userService.updatePassword(id, password);
        if (ok) {
            return Result.success("修改密码成功", null);
        } else {
            return Result.fail("修改失败");
        }
    }

    // 修改昵称
    @PostMapping("/updateNickname")
    public Result<?> updateNickname(
            @RequestParam Long id,
            @RequestParam String nickname) {
        boolean ok = userService.updateNickname(id, nickname);
        if (ok) {
            return Result.success("修改昵称成功", null);
        } else {
            return Result.fail("修改失败");
        }
    }
}