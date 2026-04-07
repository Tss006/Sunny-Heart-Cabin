package com.example.heartcabin.service;

import com.example.heartcabin.entity.TestQuestion;
import java.util.List;
import java.util.Map;

public interface TestService {
    // 获取题目列表
    List<TestQuestion> getQuestions();
    // 计算总分
    int calculateScore(List<Integer> answers);
    // 生成测评结果
    Map<String, String> generateResult(int totalScore);
}