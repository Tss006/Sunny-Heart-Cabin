package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Diary {
    private Long id;
    private Long user_id; // 确保字段命名与前端一致
    private String content;
    private String mood;
    private LocalDateTime create_time; // 确保字段命名与前端一致
    private String title;
    private String diary_id; // 将 chat_id 修改为 diary_id
    private String weather;
}