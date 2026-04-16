package com.example.heartcabin.entity;

import lombok.Data;

@Data
public class Message {
    private Long id;
    private Long userId;
    private String nickname;
    private String message;
    private Boolean anonymous;
    private String createdTime;
}
