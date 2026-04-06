package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Diary {
    private Long id;
    private Long userId;
    private String content;
    private String mood;
    private LocalDateTime createTime;
}