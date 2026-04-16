package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface UserMapper {

    @Select("select * from user where username=#{username}")
    User getByUsername(String username);

    @Insert("insert into user(username,password,nickname,avatar,phone,role,status,create_time,age,gender,signature,test_num,music_num,diary_num) values(#{username},#{password},#{nickname},#{avatar},#{phone},#{role},#{status},now(),#{age},#{gender},#{signature},#{test_num},#{music_num},#{diary_num})")
    void insert(User user);

    @Select("select * from user where id=#{id}")
    User getById(Long id);

    @Update("update user set nickname=#{nickname},avatar=#{avatar},phone=#{phone},age=#{age},signature=#{signature},gender=#{gender},test_num=#{test_num},music_num=#{music_num},diary_num=#{diary_num} where id=#{id}")
    void updateById(User user);
}