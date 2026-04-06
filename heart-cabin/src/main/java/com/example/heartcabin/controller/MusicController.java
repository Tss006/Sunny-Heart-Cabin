package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Music;
import com.example.heartcabin.service.MusicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/music")
public class MusicController {

    @Autowired
    private MusicService musicService;

    @GetMapping("/all")
    public Result<List<Music>> getAll() {
        List<Music> musicList = musicService.getAll();
        return Result.success("获取音乐列表成功", musicList);
    }

    @GetMapping("/type")
    public Result<List<Music>> getByType(@RequestParam String type) {
        List<Music> musicList = musicService.getByType(type);
        return Result.success("获取分类音乐成功", musicList);
    }
}