package com.example.heartcabin.controller;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.common.JwtUtil;
import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Appointment;
import com.example.heartcabin.entity.CounselorAvailableTime;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.AppointmentService;
import com.example.heartcabin.service.CounselorService;
import com.example.heartcabin.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointment")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserService userService;

    @Autowired
    private CounselorService counselorService;

    @PostMapping
    public Result<Map<String, Object>> createAppointment(@RequestHeader(value = "token", required = false) String token,
                                                         @RequestBody Map<String, Object> payload) {
        CurrentAccount account = resolveAccount(token);
        if (!"user".equals(account.role)) {
            return Result.fail("只有普通用户才能提交预约");
        }

        Long counselorId = parseLong(firstNonNull(payload, "counselorId", "counselor_id"));
        String appointmentTime = firstString(payload, "appointmentTime", "appointment_time");
        String reason = firstString(payload, "reason");
        if (counselorId == null) {
            return Result.fail("咨询师不能为空");
        }
        if (appointmentTime == null || appointmentTime.trim().isEmpty()) {
            return Result.fail("预约时间不能为空");
        }
        Map<String, Object> result = appointmentService.createAppointment(account.id, counselorId, appointmentTime, reason);
        return Result.success("预约成功", result);
    }

    @GetMapping
    public Result<List<Appointment>> getMyAppointments(@RequestHeader(value = "token", required = false) String token) {
        CurrentAccount account = resolveAccount(token);
        if (!"user".equals(account.role)) {
            return Result.fail("只有普通用户才能查看个人预约");
        }
        return Result.success("查询成功", appointmentService.listUserAppointments(account.id));
    }

    @GetMapping("/counselor")
    public Result<List<Appointment>> getCounselorAppointments(@RequestHeader(value = "token", required = false) String token) {
        CurrentAccount account = resolveAccount(token);
        if (!"counselor".equals(account.role)) {
            return Result.fail("只有咨询师才能查看预约管理");
        }
        return Result.success("查询成功", appointmentService.listCounselorAppointments(account.id));
    }

    @PutMapping("/{appointmentId}/status")
    public Result<Map<String, Object>> updateAppointmentStatus(@RequestHeader(value = "token", required = false) String token,
                                                               @RequestBody Map<String, Object> payload,
                                                               @org.springframework.web.bind.annotation.PathVariable("appointmentId") Long appointmentId) {
        CurrentAccount account = resolveAccount(token);
        if (!"counselor".equals(account.role)) {
            return Result.fail("只有咨询师才能处理预约");
        }
        String status = firstString(payload, "status");
        Map<String, Object> result = appointmentService.updateStatus(appointmentId, account.id, status);
        return Result.success("更新成功", result);
    }

    @GetMapping("/available-times")
    public Result<List<CounselorAvailableTime>> getAvailableTimes(@RequestHeader(value = "token", required = false) String token,
                                                                  @RequestParam(value = "counselorId", required = false) Long counselorId) {
        CurrentAccount account = resolveAccount(token);
        Long targetCounselorId = counselorId;
        if (targetCounselorId == null && "counselor".equals(account.role)) {
            targetCounselorId = account.id;
        }
        return Result.success("查询成功", appointmentService.listAvailableTimes(targetCounselorId));
    }

    @PostMapping("/available-times")
    public Result<CounselorAvailableTime> saveAvailableTime(@RequestHeader(value = "token", required = false) String token,
                                                            @RequestBody Map<String, Object> payload) {
        CurrentAccount account = resolveAccount(token);
        if (!"counselor".equals(account.role)) {
            return Result.fail("只有咨询师才能维护可预约时间");
        }
        String dayOfWeek = firstString(payload, "dayOfWeek", "day_of_week");
        String startTime = firstString(payload, "startTime", "start_time");
        String endTime = firstString(payload, "endTime", "end_time");
        Boolean isAvailable = parseBoolean(firstNonNull(payload, "isAvailable", "is_available"));
        if (dayOfWeek == null || dayOfWeek.trim().isEmpty()) {
            return Result.fail("星期不能为空");
        }
        if (startTime == null || startTime.trim().isEmpty() || endTime == null || endTime.trim().isEmpty()) {
            return Result.fail("开始时间和结束时间不能为空");
        }
        CounselorAvailableTime result = appointmentService.saveAvailableTime(account.id, dayOfWeek, startTime, endTime, isAvailable);
        return Result.success("保存成功", result);
    }

    private CurrentAccount resolveAccount(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new BusinessException("未登录或token缺失");
        }
        Claims claims = JwtUtil.parseToken(token);
        Long userId = parseLong(claims.get("userId"));
        if (userId == null) {
            throw new BusinessException("登录信息无效");
        }
        String role = claims.get("role", String.class);
        if (role == null || role.trim().isEmpty()) {
            User user = userService.getById(userId);
            if (user == null && counselorService.getById(userId) == null) {
                throw new BusinessException("账号不存在");
            }
            if (counselorService.getById(userId) != null && user == null) {
                role = "counselor";
            } else {
                role = "user";
            }
        }
        if ("user".equalsIgnoreCase(role) && userService.getById(userId) == null) {
            throw new BusinessException("普通用户账号不存在");
        }
        if ("counselor".equalsIgnoreCase(role) && counselorService.getById(userId) == null) {
            throw new BusinessException("咨询师账号不存在");
        }
        return new CurrentAccount(userId, role.toLowerCase());
    }

    private Object firstNonNull(Map<String, Object> payload, String... keys) {
        if (payload == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            if (payload.containsKey(key) && payload.get(key) != null) {
                return payload.get(key);
            }
        }
        return null;
    }

    private String firstString(Map<String, Object> payload, String... keys) {
        Object value = firstNonNull(payload, keys);
        return value == null ? null : String.valueOf(value);
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            return Long.valueOf(text);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Boolean parseBoolean(Object value) {
        if (value == null) {
            return Boolean.TRUE;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        String text = String.valueOf(value).trim().toLowerCase();
        if (text.isEmpty()) {
            return Boolean.TRUE;
        }
        return !("false".equals(text) || "0".equals(text) || "no".equals(text));
    }

    private static class CurrentAccount {
        private final Long id;
        private final String role;

        private CurrentAccount(Long id, String role) {
            this.id = id;
            this.role = role;
        }
    }
}
