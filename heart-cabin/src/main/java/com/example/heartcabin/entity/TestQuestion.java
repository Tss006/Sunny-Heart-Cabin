package com.example.heartcabin.entity;

import lombok.Data;

@Data
public class TestQuestion {
    private Long id;
    private String title;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer scoreA;
    private Integer scoreB;
    private Integer scoreC;
    private Integer scoreD;
}