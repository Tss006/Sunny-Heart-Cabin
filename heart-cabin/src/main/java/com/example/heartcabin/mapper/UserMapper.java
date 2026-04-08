package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface UserMapper {

    @Select("select * from user where username=#{username}")
    User getByUsername(String username);

    @Insert("insert into user(username,password,nickname,avatar,phone,role,status,create_time) values(#{username},#{password},#{nickname},#{avatar},#{phone},#{role},#{status},now())")
    void insert(User user);

    @Select("select * from user where id=#{id}")
    User getById(Long id);

    @Update("update user set nickname=#{nickname},avatar=#{avatar},phone=#{phone} where id=#{id}")
    void updateById(User user);
}