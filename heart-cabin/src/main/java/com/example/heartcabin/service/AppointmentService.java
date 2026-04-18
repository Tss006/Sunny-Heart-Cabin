package com.example.heartcabin.service;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.entity.Appointment;
import com.example.heartcabin.entity.Counselor;
import com.example.heartcabin.entity.CounselorAvailableTime;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.mapper.AppointmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AppointmentService {

    private static final Set<String> ALLOWED_STATUS = Set.of("pending", "confirmed", "completed", "cancelled");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter APPOINTMENT_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Autowired
    private AppointmentMapper appointmentMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private CounselorService counselorService;

    public List<Appointment> listUserAppointments(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return appointmentMapper.selectUserAppointments(userId);
    }

    public List<Appointment> listCounselorAppointments(Long counselorId) {
        if (counselorId == null) {
            return List.of();
        }
        return appointmentMapper.selectCounselorAppointments(counselorId);
    }

    public List<CounselorAvailableTime> listAvailableTimes(Long counselorId) {
        if (counselorId == null) {
            return List.of();
        }
        return appointmentMapper.selectAvailableTimes(counselorId);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createAppointment(Long userId, Long counselorId, String appointmentTimeText, String reason) {
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        Counselor counselor = counselorService.getById(counselorId);
        if (counselor == null) {
            throw new BusinessException("咨询师不存在");
        }
        if (counselor.getStatus() != null && counselor.getStatus() == 0) {
            throw new BusinessException("该咨询师已被禁用");
        }

        LocalDateTime appointmentTime = parseAppointmentTime(appointmentTimeText);
        if (appointmentTime == null) {
            throw new BusinessException("预约时间格式不正确");
        }
        if (appointmentTime.isBefore(LocalDateTime.now())) {
            throw new BusinessException("预约时间不能早于当前时间");
        }

        ensureTimeIsAvailable(counselorId, appointmentTime);

        Integer conflictCount = appointmentMapper.countConflictingAppointments(counselorId, appointmentTime);
        if (conflictCount != null && conflictCount > 0) {
            throw new BusinessException("该时间段已被预约");
        }

        Appointment appointment = new Appointment();
        appointment.setUserId(userId);
        appointment.setCounselorId(counselorId);
        appointment.setAppointmentTime(appointmentTime);
        appointment.setStatus("pending");
        appointment.setReason(normalizeReason(reason));
        appointmentMapper.insert(appointment);

        Map<String, Object> result = new HashMap<>();
        result.put("appointmentId", appointment.getId());
        result.put("status", appointment.getStatus());
        result.put("appointmentTime", appointmentTime.format(APPOINTMENT_TIME_FORMAT));
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> updateStatus(Long appointmentId, Long counselorId, String status) {
        if (appointmentId == null || counselorId == null) {
            throw new BusinessException("预约信息不能为空");
        }
        String normalizedStatus = normalizeStatus(status);
        Appointment appointment = appointmentMapper.selectByIdAndCounselor(appointmentId, counselorId);
        if (appointment == null) {
            throw new BusinessException("预约不存在");
        }
        appointmentMapper.updateStatus(appointmentId, normalizedStatus);

        Map<String, Object> result = new HashMap<>();
        result.put("appointmentId", appointmentId);
        result.put("status", normalizedStatus);
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public CounselorAvailableTime saveAvailableTime(Long counselorId,
                                                    String dayOfWeek,
                                                    String startTimeText,
                                                    String endTimeText,
                                                    Boolean isAvailable) {
        Counselor counselor = counselorService.getById(counselorId);
        if (counselor == null) {
            throw new BusinessException("咨询师不存在");
        }

        String normalizedDayOfWeek = normalizeDayOfWeek(dayOfWeek);
        String normalizedStartTime = normalizeTime(startTimeText);
        String normalizedEndTime = normalizeTime(endTimeText);
        if (LocalTime.parse(normalizedEndTime, TIME_FORMAT).isBefore(LocalTime.parse(normalizedStartTime, TIME_FORMAT)) || normalizedEndTime.equals(normalizedStartTime)) {
            throw new BusinessException("结束时间必须晚于开始时间");
        }

        CounselorAvailableTime existing = appointmentMapper.selectAvailableTimeByKey(counselorId, normalizedDayOfWeek, normalizedStartTime, normalizedEndTime);
        if (existing != null) {
            appointmentMapper.updateAvailableTimeStatus(existing.getId(), Boolean.TRUE.equals(isAvailable));
            existing.setIsAvailable(Boolean.TRUE.equals(isAvailable));
            return existing;
        }

        CounselorAvailableTime availableTime = new CounselorAvailableTime();
        availableTime.setCounselorId(counselorId);
        availableTime.setDayOfWeek(normalizedDayOfWeek);
        availableTime.setStartTime(normalizedStartTime);
        availableTime.setEndTime(normalizedEndTime);
        availableTime.setIsAvailable(Boolean.TRUE.equals(isAvailable));
        appointmentMapper.insertAvailableTime(availableTime);
        return availableTime;
    }

    private void ensureTimeIsAvailable(Long counselorId, LocalDateTime appointmentTime) {
        List<CounselorAvailableTime> availableTimes = appointmentMapper.selectAvailableTimes(counselorId);
        if (availableTimes.isEmpty()) {
            throw new BusinessException("该咨询师暂无可预约时间段");
        }

        String appointmentDay = appointmentTime.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        LocalTime selectedTime = appointmentTime.toLocalTime();
        boolean matched = false;

        for (CounselorAvailableTime slot : availableTimes) {
            if (!Boolean.TRUE.equals(slot.getIsAvailable())) {
                continue;
            }
            if (!appointmentDay.equalsIgnoreCase(slot.getDayOfWeek())) {
                continue;
            }
            LocalTime startTime = LocalTime.parse(slot.getStartTime(), TIME_FORMAT);
            LocalTime endTime = LocalTime.parse(slot.getEndTime(), TIME_FORMAT);
            if (!selectedTime.isBefore(startTime) && selectedTime.isBefore(endTime)) {
                matched = true;
                break;
            }
        }

        if (!matched) {
            throw new BusinessException("该时间不在咨询师可预约时间范围内");
        }
    }

    private LocalDateTime parseAppointmentTime(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        String normalized = text.trim();
        List<String> candidates = List.of(
                normalized,
                normalized.replace('T', ' '),
                normalized.replace(' ', 'T')
        );
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
                DateTimeFormatter.ISO_LOCAL_DATE_TIME
        );
        for (String candidate : candidates) {
            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDateTime.parse(candidate, formatter);
                } catch (DateTimeParseException ignored) {
                    // try next
                }
            }
        }
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDateTime.parse(normalized.replace('T', ' '), formatter);
            } catch (DateTimeParseException ignored) {
                // continue
            }
        }
        return null;
    }

    private String normalizeReason(String reason) {
        String text = reason == null ? "" : reason.trim();
        if (text.length() > 500) {
            return text.substring(0, 500);
        }
        return text;
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_STATUS.contains(value)) {
            throw new BusinessException("不支持的预约状态");
        }
        return value;
    }

    private String normalizeDayOfWeek(String dayOfWeek) {
        if (dayOfWeek == null) {
            throw new BusinessException("星期不能为空");
        }
        String normalized = dayOfWeek.trim();
        if (normalized.isEmpty()) {
            throw new BusinessException("星期不能为空");
        }
        for (DayOfWeek day : DayOfWeek.values()) {
            if (day.getDisplayName(TextStyle.FULL, Locale.ENGLISH).equalsIgnoreCase(normalized)) {
                return day.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            }
        }
        throw new BusinessException("星期格式不正确");
    }

    private String normalizeTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException("时间不能为空");
        }
        String text = value.trim();
        try {
            LocalTime time = LocalTime.parse(text.length() == 5 ? text + ":00" : text);
            return time.format(TIME_FORMAT);
        } catch (DateTimeParseException exception) {
            throw new BusinessException("时间格式不正确");
        }
    }
}
