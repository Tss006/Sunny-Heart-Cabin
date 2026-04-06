package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PhysicalData {
    private Long id;
    private Long userId;
    private Integer heartRate;
    private Double sleep;
    private Integer steps;
    private LocalDateTime createTime;
}