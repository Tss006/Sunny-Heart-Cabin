package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.TestQuestion;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface TestMapper {

    @Select("SELECT * FROM test_question")
    List<TestQuestion> getQuestions();
}