package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Music;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface MusicMapper {
    @Select("SELECT * FROM music")
    List<Music> getAll();

    @Select("SELECT * FROM music WHERE type=#{type}")
    List<Music> getByType(String type);
}