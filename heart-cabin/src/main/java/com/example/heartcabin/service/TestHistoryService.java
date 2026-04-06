package com.example.heartcabin.service;

import com.example.heartcabin.entity.TestHistory;
import com.example.heartcabin.mapper.TestHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TestHistoryService {

    @Autowired
    private TestHistoryMapper testHistoryMapper;

    public boolean save(TestHistory history) {
        return testHistoryMapper.add(history) > 0;
    }

    public List<TestHistory> getList(Long userId) {
        return testHistoryMapper.getByUserId(userId);
    }
}