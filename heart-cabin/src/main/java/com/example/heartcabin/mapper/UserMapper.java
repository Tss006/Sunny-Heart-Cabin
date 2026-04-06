package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.Param;

public interface UserMapper {

    // 注册
    @Insert("INSERT INTO user(username,password,nickname) VALUES(#{username},#{password},#{nickname})")
    int register(User user);

    // 登录
    @Select("SELECT * FROM user WHERE username=#{username} AND password=#{password}")
    User login(String username, String password);

    // 修改密码
    @Update("UPDATE user SET password=#{password} WHERE id=#{id}")
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    // 修改昵称
    @Update("UPDATE user SET nickname=#{nickname} WHERE id=#{id}")
    int updateNickname(@Param("id") Long id, @Param("nickname") String nickname);
}