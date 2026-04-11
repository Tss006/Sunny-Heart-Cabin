package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatHistory {
    private Long id;
    private Long user_id;
    private String chat_id;
    private String user_message;
    private String ai_reply;
    private LocalDateTime create_time;
}