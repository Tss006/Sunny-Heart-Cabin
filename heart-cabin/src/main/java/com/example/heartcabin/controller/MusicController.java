package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/music")
public class MusicController {

    /**
     * 以后你只需要往 static/music 里丢 mp3
     * 命名规则：类型_歌名.mp3
     * 例如：relax_晚风.mp3 、light_清晨.mp3
     * 不用改任何代码，自动识别
     */
    private List<Music> getMusicList() {
        List<Music> list = new ArrayList<>();

        String path = System.getProperty("user.dir") + "/src/main/resources/static/music/";
        File folder = new File(path);

        if (!folder.exists() || folder.listFiles() == null) return list;

        long id = 1;
        for (File file : Objects.requireNonNull(folder.listFiles())) {
            if (!file.getName().endsWith(".mp3")) continue;

            String fullName = file.getName().replace(".mp3", "");
            String type = "relax"; // 默认类型
            String name = fullName;

            // 格式：类型_歌名.mp3 自动拆分
            if (fullName.contains("_")) {
                String[] split = fullName.split("_", 2);
                type = split[0];
                name = split[1];
            }

            Music music = new Music();
            music.setId(id++);
            music.setName(name);
            music.setType(type);
            music.setMusicUrl("/music/" + file.getName());
            list.add(music);
        }
        return list;
    }

    @GetMapping("/all")
    public Result<List<Music>> getAll() {
        return Result.success("获取音乐列表成功", getMusicList());
    }

    @GetMapping("/type")
    public Result<List<Music>> getByType(@RequestParam String type) {
        List<Music> res = new ArrayList<>();
        for (Music m : getMusicList()) {
            if (m.getType().equalsIgnoreCase(type)) {
                res.add(m);
            }
        }
        return Result.success("获取分类音乐成功", res);
    }

    @GetMapping("/recommend")
    public Result<List<Music>> recommend(@RequestParam Integer totalScore) {
        String type;
        if (totalScore <= 25) {
            type = "relax";
        } else if (totalScore <= 40) {
            type = "light";
        } else if (totalScore <= 55) {
            type = "relieve";
        } else {
            type = "calm";
        }
        return getByType(type);
    }

    public static class Music {
        private Long id;
        private String name;
        private String type;
        private String musicUrl;

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getType() { return type; }
        public String getMusicUrl() { return musicUrl; }

        public void setId(Long id) { this.id = id; }
        public void setName(String name) { this.name = name; }
        public void setType(String type) { this.type = type; }
        public void setMusicUrl(String musicUrl) { this.musicUrl = musicUrl; }
    }
}