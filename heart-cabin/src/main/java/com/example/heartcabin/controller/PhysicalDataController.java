package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.PhysicalData;
import com.example.heartcabin.service.PhysicalDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/report")
public class PhysicalDataController {

    @Autowired
    private PhysicalDataService physicalDataService;

    @GetMapping("/data")
    public Result<List<PhysicalData>> getData(@RequestParam Long userId) {
        List<PhysicalData> dataList = physicalDataService.getList(userId);
        return Result.success("查询成功", dataList);
    }
}