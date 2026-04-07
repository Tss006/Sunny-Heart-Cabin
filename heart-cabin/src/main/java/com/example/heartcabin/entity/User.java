package com.example.heartcabin.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String password;
    private String nickname;
    private String avatar;
    private String phone;
    private String role;        // 角色 user/admin
    private Integer status;    // 0禁用 1正常
    private LocalDateTime createTime;
}