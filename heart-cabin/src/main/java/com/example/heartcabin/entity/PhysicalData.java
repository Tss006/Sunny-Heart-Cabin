package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PhysicalData {
    private Long id;
    private Long userId;
    private Integer heartRate;      // 心率
    private Integer sleepHours;     // 睡眠时长
    private Integer steps;          // 步数
    private String recordDate;      // 记录日期：yyyy-MM-dd
    private LocalDateTime createTime;
}