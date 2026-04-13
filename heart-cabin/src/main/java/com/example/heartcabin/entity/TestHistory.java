package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TestHistory {
    private Long id;
    private Long user_id;
    private Integer score;  // 总得分
    private String level;        // 压力等级
    private String advice;       // 专业建议
    private LocalDateTime create_time;
}