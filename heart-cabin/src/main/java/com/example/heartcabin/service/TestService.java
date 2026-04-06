package com.example.heartcabin.service;

import com.example.heartcabin.entity.TestQuestion;
import com.example.heartcabin.mapper.TestMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TestService {

    @Autowired
    private TestMapper testMapper;

    public List<TestQuestion> getQuestions() {
        return testMapper.getQuestions();
    }
}