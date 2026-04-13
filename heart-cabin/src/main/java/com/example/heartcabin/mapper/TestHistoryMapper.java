package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.TestHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface TestHistoryMapper {

    @Insert("INSERT INTO test_history(user_id,score,level,advice) " +
            "VALUES(#{user_id},#{score},#{level},#{advice})")
    int add(TestHistory history);

        @Select("SELECT * FROM test_history WHERE user_id=#{user_id} ORDER BY create_time DESC")
        List<TestHistory> getByUserId(@Param("user_id") Long user_id);
}