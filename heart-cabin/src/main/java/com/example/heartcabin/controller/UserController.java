package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.common.JwtUtil;
import com.example.heartcabin.entity.Counselor;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.CounselorService;
import com.example.heartcabin.service.DiaryService;
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

    @Autowired
    private DiaryService diaryService;

    @Autowired
    private CounselorService counselorService;

    private User getCurrentUser(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        try {
            Long userId = JwtUtil.parseToken(token).get("userId", Long.class);
            if (userId == null) {
                return null;
            }
            return userService.getById(userId);
        } catch (Exception exception) {
            return null;
        }
    }

    private long normalizeCount(Long value) {
        return value == null ? 0L : value;
    }


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
        user.setTest_num(0L);
        user.setMusic_num(0L);
        user.setDiary_num(0L);
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
            Counselor counselor = counselorService.getByUsername(user.getUsername());
            if (counselor == null) {
                return Result.fail("用户名不存在");
            }
            if (!Objects.equals(user.getPassword(), counselor.getPassword())) {
                return Result.fail("密码错误");
            }
            if (counselor.getStatus() != null && counselor.getStatus() == 0) {
                return Result.fail("账号已禁用");
            }
            counselor.setPassword(null);
            Map<String, Object> map = new HashMap<>();
            map.put("userId", counselor.getId());
            map.put("username", counselor.getUsername());
            map.put("role", counselor.getRole() == null ? "counselor" : counselor.getRole());
            String token = JwtUtil.createToken(map);

            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("user", counselor);
            return Result.success("登录成功", result);
        }
        // 明文密码比对（不推荐，仅为演示）
        if (!Objects.equals(user.getPassword(), dbUser.getPassword())) {
            return Result.fail("密码错误");
        }
        if (dbUser.getStatus() == 0) {
            return Result.fail("账号已禁用");
        }
        dbUser.setPassword(null);
        // 生成JWT token
        Map<String, Object> map = new HashMap<>();
        map.put("userId", dbUser.getId());
        map.put("username", dbUser.getUsername());
        map.put("role", dbUser.getRole() == null ? "user" : dbUser.getRole());
        String token = JwtUtil.createToken(map);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", dbUser);
        return Result.success("登录成功", result);
    }

    // 获取当前登录用户信息
    @GetMapping("/info")
    public Result<?> info(@RequestHeader("token") String token) {
        User user = getCurrentUser(token);
        if (user == null) {
            return Result.fail("未登录或token缺失");
        }

        Long diaryCount = diaryService.countByUserId(user.getId());
        user.setDiary_num(normalizeCount(diaryCount));
        user.setTest_num(normalizeCount(user.getTest_num()));
        user.setMusic_num(normalizeCount(user.getMusic_num()));
        user.setPassword(null);
        return Result.success(user);
    }

    // 修改昵称
    @PostMapping("/info/update")
    public Result<?> updateInfo(@RequestHeader("token") String token, @RequestBody User user) {
        User dbUser = getCurrentUser(token);
        if (dbUser == null) {
            return Result.fail("未登录或token缺失");
        }
        if (user.getNickname() != null) {
            dbUser.setNickname(user.getNickname());
        }
        if (user.getAge() > 0) {
            dbUser.setAge(user.getAge());
        }
        if (user.getGender() != null) {
            dbUser.setGender(user.getGender());
        }
        if (user.getSignature() != null) {
            dbUser.setSignature(user.getSignature());
        }
        if (user.getAvatar() != null) {
            dbUser.setAvatar(user.getAvatar());
        }
        if (user.getPhone() != null) {
            dbUser.setPhone(user.getPhone());
        }
        userService.updateById(dbUser);
        return Result.success("修改成功");
    }

    @PostMapping("/stat/increase")
    public Result<?> increaseStat(@RequestHeader("token") String token, @RequestParam String field) {
        User user = getCurrentUser(token);
        if (user == null) {
            return Result.fail("未登录或token缺失");
        }

        long nextValue;
        switch (field) {
            case "test_num":
                nextValue = normalizeCount(user.getTest_num()) + 1;
                user.setTest_num(nextValue);
                break;
            case "diary_num":
                nextValue = normalizeCount(user.getDiary_num()) + 1;
                user.setDiary_num(nextValue);
                break;
            case "music_num":
                nextValue = normalizeCount(user.getMusic_num()) + 1;
                user.setMusic_num(nextValue);
                break;
            default:
                return Result.fail("不支持的统计类型");
        }

        userService.updateById(user);

        Map<String, Object> result = new HashMap<>();
        result.put("field", field);
        result.put("value", nextValue);
        return Result.success("统计已更新", result);
    }

    // 修改密码
    @PostMapping("/password/update")
    public Result<?> updatePwd(@RequestHeader("token") String token, @RequestBody Map<String, Object> payload) {
        User currentUser = getCurrentUser(token);
        if (currentUser == null) {
            return Result.fail("未登录或token缺失");
        }
        Object idValue = payload.get("id");
        if (idValue == null) {
            return Result.fail("用户ID不能为空");
        }
        Long userId = Long.valueOf(String.valueOf(idValue));
        if (!Objects.equals(currentUser.getId(), userId)) {
            return Result.fail("无权修改该用户密码");
        }
        String oldPassword = Objects.toString(payload.get("oldPassword"), "");
        String newPassword = Objects.toString(payload.get("newPassword"), "");
        if (newPassword.isEmpty()) {
            newPassword = Objects.toString(payload.get("password"), "");
        }
        if (oldPassword.isEmpty()) {
            return Result.fail("原密码不能为空");
        }
        if (newPassword.isEmpty()) {
            return Result.fail("新密码不能为空");
        }

        User dbUser = userService.getById(userId);
        if (dbUser == null) {
            return Result.fail("用户不存在");
        }
        if (!oldPassword.isEmpty() && !Objects.equals(dbUser.getPassword(), oldPassword)) {
            return Result.fail("原密码错误");
        }
        dbUser.setPassword(newPassword);
        userService.updateById(dbUser);
        return Result.success("密码修改成功");
    }
}