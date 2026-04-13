package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Diary;
import com.example.heartcabin.service.DiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/diary")
public class DiaryController {

    @Autowired
    private DiaryService diaryService;

    // 发布日记
    @PostMapping("/add")
    public Result<?> add(@RequestBody Diary diary) {
        if (diary == null || diary.getUser_id() == null) {
            return Result.fail("用户信息缺失，请重新登录");
        }
        if (diary.getTitle() == null || diary.getTitle().trim().isEmpty()) {
            return Result.fail("日记标题不能为空");
        }
        if (diary.getContent() == null || diary.getContent().trim().isEmpty()) {
            return Result.fail("日记内容不能为空");
        }
        if (diary.getMood() == null || diary.getMood().trim().isEmpty()) {
            diary.setMood("");
        }
        diary.setCreate_time(java.time.LocalDateTime.now()); // 设置创建时间
        diary.setDiary_id(UUID.randomUUID().toString()); // 生成唯一 diary_id
        boolean ok = diaryService.addDiary(diary);
        if (ok) {
            return Result.success("发布成功", null);
        } else {
            return Result.fail("发布失败");
        }
    }

    // 查询我的日记
    @GetMapping("/list")
    public Result<List<Diary>> list(@RequestParam Long user_id) {
        List<Diary> list = diaryService.getList(user_id);
        return Result.success("查询成功", list);
    }

    // 通过 diary_id 查询日记
    @GetMapping("/getByDiaryId")
    public Result<Diary> getByDiaryId(@RequestParam String diary_id) {
        Diary diary = diaryService.getByDiaryId(diary_id);
        if (diary != null) {
            return Result.success("查询成功", diary);
        } else {
            return Result.fail("未找到对应日记");
        }
    }

    // 删除日记
    @PostMapping("/delete")
    public Result<?> delete(@RequestParam Long id, @RequestParam Long user_id) {
        boolean ok = diaryService.delete(id, user_id);
        if (ok) {
            return Result.success("删除成功", null);
        } else {
            return Result.fail("删除失败");
        }
    }
}