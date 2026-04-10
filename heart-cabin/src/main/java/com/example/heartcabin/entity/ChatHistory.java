package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatHistory {
    private Long id;
    private Long userId;
    private Long chat_id;
    private String userMessage;
    private String aiReply;
    private LocalDateTime createTime;
}