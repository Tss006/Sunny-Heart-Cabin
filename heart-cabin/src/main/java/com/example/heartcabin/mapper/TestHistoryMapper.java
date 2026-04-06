package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.TestHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface TestHistoryMapper {

    @Insert("INSERT INTO test_history(user_id,score,level,advice) " +
            "VALUES(#{userId},#{score},#{level},#{advice})")
    int add(TestHistory history);

    @Select("SELECT * FROM test_history WHERE user_id=#{userId} ORDER BY create_time DESC")
    List<TestHistory> getByUserId(Long userId);
}