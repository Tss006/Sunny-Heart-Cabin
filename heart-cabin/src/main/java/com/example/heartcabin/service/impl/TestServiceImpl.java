package com.example.heartcabin.service.impl;

import com.example.heartcabin.entity.TestQuestion;
import com.example.heartcabin.mapper.TestQuestionMapper;
import com.example.heartcabin.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TestServiceImpl implements TestService {

    @Autowired
    private TestQuestionMapper testQuestionMapper;

    @Override
    public List<TestQuestion> getQuestions() {
        return testQuestionMapper.selectAll();
    }

    @Override
    public int calculateScore(List<Integer> answers) {
        // 累加所有选项分值，得到总分
        return answers.stream().mapToInt(Integer::intValue).sum();
    }

    @Override
    public Map<String, String> generateResult(int totalScore) {
        Map<String, String> result = new HashMap<>();
        String level;
        String advice;

        // 按SAS量表标准分级（20题，满分80分）
        if (totalScore <= 25) {
            level = "心理健康状态优秀";
            advice = "情绪稳定，抗压能力强，继续保持积极阳光的心态！";
        } else if (totalScore <= 40) {
            level = "心理健康状态良好";
            advice = "整体状态不错，偶尔小情绪属于正常，适当放松就好～";
        } else if (totalScore <= 55) {
            level = "存在轻度焦虑/压力";
            advice = "近期压力有些明显，建议多运动、多倾诉、保持规律作息。";
        } else {
            level = "焦虑/压力偏高，需及时调节";
            advice = "情绪与压力较突出，记得减少内耗，多与他人沟通，必要时寻求专业帮助。";
        }

        result.put("level", level);
        result.put("advice", advice);
        return result;
    }
}