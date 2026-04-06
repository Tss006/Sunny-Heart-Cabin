package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TestHistory {
    private Long id;
    private Long userId;
    private Integer score;
    private String level;
    private String advice;
    private LocalDateTime createTime;
}