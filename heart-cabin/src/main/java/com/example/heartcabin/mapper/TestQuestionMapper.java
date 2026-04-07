package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.TestQuestion;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface TestQuestionMapper {

    // 查询所有20道测评题目
    @Select("select * from test_question order by id asc")
    List<TestQuestion> selectAll();
}