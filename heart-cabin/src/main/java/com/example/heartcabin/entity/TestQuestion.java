package com.example.heartcabin.entity;

import lombok.Data;

@Data
public class TestQuestion {
    private Long id;
    private String question;  // 题目内容
    private Integer score;    // 对应分值（1-4分，对应SAS量表标准）
}