package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Appointment;
import com.example.heartcabin.entity.CounselorAvailableTime;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AppointmentMapper {

    @Results(id = "AppointmentResultMap", value = {
            @Result(column = "id", property = "id", id = true),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "counselor_id", property = "counselorId"),
            @Result(column = "appointment_time", property = "appointmentTime", javaType = LocalDateTime.class),
            @Result(column = "status", property = "status"),
            @Result(column = "reason", property = "reason"),
            @Result(column = "create_time", property = "createTime", javaType = LocalDateTime.class),
            @Result(column = "update_time", property = "updateTime", javaType = LocalDateTime.class),
            @Result(column = "counselor_name", property = "counselorName"),
            @Result(column = "user_name", property = "userName")
    })
    @Select("SELECT a.id, a.user_id, a.counselor_id, a.appointment_time, a.status, a.reason, a.create_time, a.update_time, COALESCE(NULLIF(c.name, ''), NULLIF(c.nickname, ''), c.username) AS counselor_name FROM appointment a LEFT JOIN counselor c ON c.id = a.counselor_id WHERE a.user_id = #{userId} ORDER BY a.appointment_time DESC, a.id DESC")
    List<Appointment> selectUserAppointments(@Param("userId") Long userId);

    @Results(id = "CounselorAppointmentResultMap", value = {
            @Result(column = "id", property = "id", id = true),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "counselor_id", property = "counselorId"),
            @Result(column = "appointment_time", property = "appointmentTime", javaType = LocalDateTime.class),
            @Result(column = "status", property = "status"),
            @Result(column = "reason", property = "reason"),
            @Result(column = "create_time", property = "createTime", javaType = LocalDateTime.class),
            @Result(column = "update_time", property = "updateTime", javaType = LocalDateTime.class),
            @Result(column = "counselor_name", property = "counselorName"),
            @Result(column = "user_name", property = "userName")
    })
        @Select("SELECT a.id, a.user_id, a.counselor_id, a.appointment_time, a.status, a.reason, a.create_time, a.update_time, COALESCE(NULLIF(c.name, ''), NULLIF(c.nickname, ''), c.username) AS counselor_name, COALESCE(NULLIF(u.nickname, ''), u.username) AS user_name FROM appointment a LEFT JOIN counselor c ON c.id = a.counselor_id LEFT JOIN `user` u ON u.id = a.user_id WHERE a.counselor_id = #{counselorId} ORDER BY a.appointment_time DESC, a.id DESC")
    List<Appointment> selectCounselorAppointments(@Param("counselorId") Long counselorId);

    @Select("SELECT COUNT(*) FROM appointment WHERE counselor_id = #{counselorId} AND appointment_time = #{appointmentTime} AND status IN ('pending', 'confirmed')")
    Integer countConflictingAppointments(@Param("counselorId") Long counselorId, @Param("appointmentTime") LocalDateTime appointmentTime);

    @Insert("INSERT INTO appointment (user_id, counselor_id, appointment_time, status, reason, create_time, update_time) VALUES (#{userId}, #{counselorId}, #{appointmentTime}, #{status}, #{reason}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(Appointment appointment);

    @Update("UPDATE appointment SET status = #{status}, update_time = NOW() WHERE id = #{appointmentId}")
    int updateStatus(@Param("appointmentId") Long appointmentId, @Param("status") String status);

    @Select("SELECT a.id, a.user_id, a.counselor_id, a.appointment_time, a.status, a.reason, a.create_time, a.update_time FROM appointment a WHERE a.id = #{appointmentId} AND a.counselor_id = #{counselorId} LIMIT 1")
    Appointment selectByIdAndCounselor(@Param("appointmentId") Long appointmentId, @Param("counselorId") Long counselorId);

    @Select("SELECT a.id, a.user_id, a.counselor_id, a.appointment_time, a.status, a.reason, a.create_time, a.update_time FROM appointment a WHERE a.id = #{appointmentId} AND a.user_id = #{userId} LIMIT 1")
    Appointment selectByIdAndUser(@Param("appointmentId") Long appointmentId, @Param("userId") Long userId);

    @Results(id = "CounselorAvailableTimeResultMap", value = {
            @Result(column = "id", property = "id", id = true),
            @Result(column = "counselor_id", property = "counselorId"),
            @Result(column = "counselor_name", property = "counselorName"),
            @Result(column = "day_of_week", property = "dayOfWeek"),
            @Result(column = "start_time", property = "startTime"),
            @Result(column = "end_time", property = "endTime"),
            @Result(column = "is_available", property = "isAvailable"),
            @Result(column = "create_time", property = "createTime", javaType = LocalDateTime.class),
            @Result(column = "update_time", property = "updateTime", javaType = LocalDateTime.class)
    })
    @Select("SELECT cat.id, cat.counselor_id, COALESCE(NULLIF(c.name, ''), NULLIF(c.nickname, ''), c.username) AS counselor_name, cat.day_of_week, cat.start_time, cat.end_time, cat.is_available, cat.create_time, cat.update_time FROM counselor_available_time cat LEFT JOIN counselor c ON c.id = cat.counselor_id WHERE cat.counselor_id = #{counselorId} ORDER BY FIELD(cat.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), cat.start_time, cat.id")
    List<CounselorAvailableTime> selectAvailableTimes(@Param("counselorId") Long counselorId);

    @Select("SELECT cat.id, cat.counselor_id, COALESCE(NULLIF(c.name, ''), NULLIF(c.nickname, ''), c.username) AS counselor_name, cat.day_of_week, cat.start_time, cat.end_time, cat.is_available, cat.create_time, cat.update_time FROM counselor_available_time cat LEFT JOIN counselor c ON c.id = cat.counselor_id WHERE cat.counselor_id = #{counselorId} AND cat.day_of_week = #{dayOfWeek} AND cat.start_time = #{startTime} AND cat.end_time = #{endTime} LIMIT 1")
    CounselorAvailableTime selectAvailableTimeByKey(@Param("counselorId") Long counselorId,
                                                     @Param("dayOfWeek") String dayOfWeek,
                                                     @Param("startTime") String startTime,
                                                     @Param("endTime") String endTime);

    @Insert("INSERT INTO counselor_available_time (counselor_id, day_of_week, start_time, end_time, is_available, create_time, update_time) VALUES (#{counselorId}, #{dayOfWeek}, #{startTime}, #{endTime}, #{isAvailable}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insertAvailableTime(CounselorAvailableTime availableTime);

    @Update("UPDATE counselor_available_time SET is_available = #{isAvailable}, update_time = NOW() WHERE id = #{id}")
    int updateAvailableTimeStatus(@Param("id") Long id, @Param("isAvailable") Boolean isAvailable);
}
