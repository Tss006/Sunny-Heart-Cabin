package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Diary;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface DiaryMapper {

    @Insert("INSERT INTO diary(user_id,content,mood) VALUES(#{userId},#{content},#{mood})")
    int add(Diary diary);

    @Select("SELECT * FROM diary WHERE user_id=#{userId} ORDER BY create_time DESC")
    List<Diary> listByUserId(Long userId);

    @Delete("DELETE FROM diary WHERE id=#{id} AND user_id=#{userId}")
    int delete(@Param("id") Long id, @Param("userId") Long userId);
}