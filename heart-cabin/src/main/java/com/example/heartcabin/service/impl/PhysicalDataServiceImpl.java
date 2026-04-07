package com.example.heartcabin.service.impl;

import com.example.heartcabin.entity.PhysicalData;
import com.example.heartcabin.mapper.PhysicalDataMapper;
import com.example.heartcabin.service.PhysicalDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PhysicalDataServiceImpl implements PhysicalDataService {

    @Autowired
    private PhysicalDataMapper physicalDataMapper;

    @Override
    public boolean add(PhysicalData data) {
        return physicalDataMapper.insert(data) > 0;
    }

    @Override
    public List<PhysicalData> getList(Long userId) {
        return physicalDataMapper.selectByUserId(userId);
    }

    @Override
    public List<Map<String, Object>> statisticsByDate(Long userId) {
        return physicalDataMapper.statisticsByDate(userId);
    }
}