package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.PhysicalData;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

public interface PhysicalDataMapper {

    @Insert("insert into physical_data(user_id, heart_rate, sleep_hours, steps, record_date, create_time) " +
            "values(#{userId}, #{heartRate}, #{sleepHours}, #{steps}, #{recordDate}, now())")
    int insert(PhysicalData data);

    @Select("select * from physical_data where user_id = #{userId} order by record_date desc")
    List<PhysicalData> selectByUserId(Long userId);

    @Select("select record_date, avg(heart_rate) as heartRate, avg(sleep_hours) as sleepHours, sum(steps) as steps " +
            "from physical_data where user_id = #{userId} group by record_date order by record_date asc")
    List<Map<String, Object>> statisticsByDate(Long userId);
}