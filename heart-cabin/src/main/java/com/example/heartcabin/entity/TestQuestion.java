package com.example.heartcabin.entity;

import lombok.Data;

@Data
public class TestQuestion {
    private Long id;
    private String question;  // 题目内容
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer scoreA;
    private Integer scoreB;
    private Integer scoreC;
    private Integer scoreD;
        // 对应分值（1-4分，对应SAS量表标准）
}