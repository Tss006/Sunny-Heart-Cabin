package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PhysicalData {
    private Long id;
    private Long userId;
    private Integer heartRate;      // 心率
    private Double sleepHours;      // 睡眠时长
    private Integer steps;          // 步数
    private String recordDate;      // 记录日期：yyyy-MM-dd
    private String dataSource;      // 数据来源：bluetooth / health_connect / manual
    private LocalDateTime createTime;
}