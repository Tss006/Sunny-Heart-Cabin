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

    public User(String username,String password) {
        this.username = username;
        this.password = password;
    }

    public User(String nickname, String username, String password) {
        this.nickname = nickname;
        this.username = username;
        this.password = password;
        this.avatar="default";
        this.phone=null;
        this.role=null;
        this.status=null;
        this.createTime = LocalDateTime.now();
    }

    public User() {
    }
}