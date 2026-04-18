package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Diary;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface DiaryMapper {

    @Insert("INSERT INTO diary(user_id, title, content, mood, weather, create_time, diary_id) VALUES(#{user_id}, #{title}, #{content}, #{mood}, #{weather}, #{create_time}, #{diary_id})")
    int add(Diary diary);

    @Select("SELECT id, user_id, title, content, mood, weather, create_time, diary_id FROM diary WHERE user_id=#{user_id} ORDER BY create_time DESC")
    List<Diary> listByUserId(@Param("user_id") Long user_id);

    @Select("SELECT COUNT(*) FROM diary WHERE user_id=#{user_id}")
    Long countByUserId(@Param("user_id") Long user_id);

    @Select("SELECT id, user_id, title, content, mood, weather, create_time, diary_id FROM diary WHERE diary_id=#{diary_id}")
    Diary getByDiaryId(@Param("diary_id") String diary_id);

    @Delete("DELETE FROM diary WHERE id=#{id} AND user_id=#{user_id}")
    int delete(@Param("id") Long id, @Param("user_id") Long user_id);
}