package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.PhysicalData;
import com.example.heartcabin.service.PhysicalDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Random;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/report")
public class PhysicalDataController {

    @Autowired
    private PhysicalDataService physicalDataService;

    // 新增生理数据（手环上传）
    @PostMapping("/add")
    public Result<?> add(@RequestBody PhysicalData data) {
        if (data.getRecordDate() == null || data.getRecordDate().trim().isEmpty()) {
            data.setRecordDate(LocalDate.now().toString());
        }
        if (data.getDataSource() == null || data.getDataSource().trim().isEmpty()) {
            data.setDataSource("manual");
        }
        boolean ok = physicalDataService.add(data);
        return ok ? Result.success("上传成功", null) : Result.fail("上传失败");
    }

    // 查询我的所有数据
    @GetMapping("/data")
    public Result<List<PhysicalData>> getData(@RequestParam Long userId) {
        List<PhysicalData> list = physicalDataService.getList(userId);
        return Result.success("查询成功", list);
    }

    // 按日期统计（给ECharts折线图）
    @GetMapping("/statistics")
    public Result<List<Map<String, Object>>> statistics(@RequestParam Long userId) {
        List<Map<String, Object>> list = physicalDataService.statisticsByDate(userId);
        return Result.success("统计成功", list);
    }
    // 模拟小米手环实时数据（物联网演示专用）
    @GetMapping("/simulate/realtime")
    public Result getRealtimeSimulateData() {
        Random random = new Random();
        Map<String, Object> data = new HashMap<>();

        data.put("deviceName", "小米手环 9 Pro");
        data.put("heartRate", 60 + random.nextInt(40));
        data.put("steps", 6000 + random.nextInt(6000));
        data.put("sleepHours", 5.5 + random.nextDouble() * 3);
        data.put("battery", 70 + random.nextInt(30));
        data.put("syncTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        return Result.success(data);
    }
}