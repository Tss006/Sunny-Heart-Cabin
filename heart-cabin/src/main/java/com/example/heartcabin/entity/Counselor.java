package com.example.heartcabin.entity;

import lombok.Data;

@Data
public class Counselor {
    private Long id;//唯一id
    private String name;//真实姓名
    private String username;//账号
    private String password;//密码
    private String nickname;//昵称
    private String title;//头衔（如：职业咨询师，资深咨询师）
    private String avatar;//头像
    private String phone;
    private String role;        // 角色 user/counselor
    private Integer status;    // 0禁用 1正常
    private String create_time;
    private int age;
    private String gender;
    private String signature;//个性签名
}
