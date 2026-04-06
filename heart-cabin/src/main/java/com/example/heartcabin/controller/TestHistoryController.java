package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.TestHistory;
import com.example.heartcabin.service.TestHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/test/history")
public class TestHistoryController {

    @Autowired
    private TestHistoryService testHistoryService;

    // 保存测评报告
    @PostMapping("/save")
    public Result<?> save(@RequestBody TestHistory history) {
        boolean ok = testHistoryService.save(history);
        if (ok) {
            return Result.success("报告已保存", null);
        } else {
            return Result.fail("保存失败");
        }
    }

    // 查看我的测评历史
    @GetMapping("/list")
    public Result<List<TestHistory>> list(@RequestParam Long userId) {
        List<TestHistory> historyList = testHistoryService.getList(userId);
        return Result.success("查询成功", historyList);
    }
}