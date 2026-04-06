package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.TestQuestion;
import com.example.heartcabin.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private TestService testService;

    // 获取20道心理测试题
    @GetMapping("/questions")
    public Result<?> getQuestions() {
        return Result.success("获取题目成功", testService.getQuestions());
    }

    // 提交分数 → 生成测评报告
    @PostMapping("/submit")
    public Result<Map<String, Object>> submit(@RequestParam Integer totalScore) {
        Map<String, Object> result = new HashMap<>();
        String level;
        String advice;

        if (totalScore <= 15) {
            level = "心理健康状态优秀";
            advice = "情绪稳定，抗压能力强，继续保持积极阳光的心态！";
        } else if (totalScore <= 30) {
            level = "心理健康状态良好";
            advice = "整体状态不错，偶尔小情绪属于正常，适当放松就好～";
        } else if (totalScore <= 45) {
            level = "存在轻微心理压力";
            advice = "近期压力有些明显，建议多运动、多倾诉、保持规律作息。";
        } else {
            level = "心理压力偏高，需及时调节";
            advice = "情绪与压力较突出，记得减少内耗，多与他人沟通，必要时寻求帮助。";
        }

        result.put("score", totalScore);
        result.put("level", level);
        result.put("advice", advice);

        return Result.success("测评完成", result);
    }
}