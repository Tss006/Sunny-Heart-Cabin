package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Music {
    private Long id;
    private String title;
    private String author;
    private String type;
    private String url;
    private LocalDateTime createTime;
}