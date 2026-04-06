package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Diary;
import com.example.heartcabin.service.DiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/diary")
public class DiaryController {

    @Autowired
    private DiaryService diaryService;

    // 发布日记
    @PostMapping("/add")
    public Result<?> add(@RequestBody Diary diary) {
        boolean ok = diaryService.addDiary(diary);
        if (ok) {
            return Result.success("发布成功", null);
        } else {
            return Result.fail("发布失败");
        }
    }

    // 查询我的日记
    @GetMapping("/list")
    public Result<List<Diary>> list(@RequestParam Long userId) {
        List<Diary> list = diaryService.getList(userId);
        return Result.success("查询成功", list);
    }

    // 删除日记
    @PostMapping("/delete")
    public Result<?> delete(@RequestParam Long id, @RequestParam Long userId) {
        boolean ok = diaryService.delete(id, userId);
        if (ok) {
            return Result.success("删除成功", null);
        } else {
            return Result.fail("删除失败");
        }
    }
}