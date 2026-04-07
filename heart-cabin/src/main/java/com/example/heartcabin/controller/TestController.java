package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.TestQuestion;
import com.example.heartcabin.entity.TestHistory;
import com.example.heartcabin.service.TestService;
import com.example.heartcabin.service.TestHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private TestService testService;

    @Autowired
    private TestHistoryService testHistoryService;

    // 获取20道心理测试题（SAS焦虑自评量表标准题）
    @GetMapping("/questions")
    public Result<List<TestQuestion>> getQuestions() {
        List<TestQuestion> list = testService.getQuestions();
        return Result.success("获取题目成功", list);
    }

    // 提交答案 → 自动算分 + 生成测评报告
    @PostMapping("/submit")
    public Result<Map<String, Object>> submit(@RequestParam Long userId, @RequestBody List<Integer> answers) {
        // 1. 计算总分
        int totalScore = testService.calculateScore(answers);

        // 2. 生成等级和建议
        Map<String, String> result = testService.generateResult(totalScore);
        String level = result.get("level");
        String advice = result.get("advice");

        // 3. 自动保存到测评历史
        TestHistory history = new TestHistory();
        history.setUserId(userId);
        history.setTotalScore(totalScore);
        history.setLevel(level);
        history.setAdvice(advice);
        testHistoryService.save(history);

        // 4. 封装返回
        Map<String, Object> response = new HashMap<>();
        response.put("score", totalScore);
        response.put("level", level);
        response.put("advice", advice);

        return Result.success("测评完成", response);
    }
}