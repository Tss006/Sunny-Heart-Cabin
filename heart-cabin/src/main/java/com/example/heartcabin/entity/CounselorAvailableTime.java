package com.example.heartcabin.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CounselorAvailableTime {
    private Long id;
    private Long counselorId;
    private String counselorName;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private Boolean isAvailable;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
