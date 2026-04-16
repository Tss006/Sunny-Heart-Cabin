package com.example.heartcabin.entity;


import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CounselorChat {
    private Long id;
    private Long counselor_id;
    private Long user_id;
    private String content;
    private Integer sender; //1是用户所发，2是咨询师所发
    private LocalDateTime create_time;


}
