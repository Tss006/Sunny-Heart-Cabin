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

    public List<Diary> getList(Long user_id) {
        return diaryMapper.listByUserId(user_id);
    }

    public Diary getByDiaryId(String diary_id) {
        return diaryMapper.getByDiaryId(diary_id);
    }

    public boolean delete(Long id, Long user_id) {
        return diaryMapper.delete(id, user_id) > 0;
    }
}