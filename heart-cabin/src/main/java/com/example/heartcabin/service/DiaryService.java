package com.example.heartcabin.service;

import com.example.heartcabin.entity.Diary;
import com.example.heartcabin.mapper.DiaryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DiaryService {

    @Autowired
    private DiaryMapper diaryMapper;

    public boolean addDiary(Diary diary) {
        return diaryMapper.add(diary) > 0;
    }

    public List<Diary> getList(Long userId) {
        return diaryMapper.listByUserId(userId);
    }

    public boolean delete(Long id, Long userId) {
        return diaryMapper.delete(id, userId) > 0;
    }
}