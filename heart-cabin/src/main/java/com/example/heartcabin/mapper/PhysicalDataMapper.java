package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.PhysicalData;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface PhysicalDataMapper {

    @Select("SELECT * FROM physical_data WHERE user_id=#{userId} ORDER BY create_time ASC")
    List<PhysicalData> getByUserId(Long userId);
}