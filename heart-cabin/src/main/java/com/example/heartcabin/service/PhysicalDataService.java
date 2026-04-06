package com.example.heartcabin.service;

import com.example.heartcabin.entity.PhysicalData;
import com.example.heartcabin.mapper.PhysicalDataMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PhysicalDataService {

    @Autowired
    private PhysicalDataMapper physicalDataMapper;

    public List<PhysicalData> getList(Long userId) {
        return physicalDataMapper.getByUserId(userId);
    }
}