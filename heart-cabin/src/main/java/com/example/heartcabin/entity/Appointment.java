package com.example.heartcabin.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Appointment {
    private Long id;
    private Long userId;
    private Long counselorId;
    private LocalDateTime appointmentTime;
    private String status;
    private String reason;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String counselorName;
    private String userName;
}
