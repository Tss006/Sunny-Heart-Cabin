package com.example.heartcabin.service;

import com.example.heartcabin.entity.PhysicalData;
import java.util.List;
import java.util.Map;

public interface PhysicalDataService {
    boolean add(PhysicalData data);
    List<PhysicalData> getList(Long userId);
    List<Map<String, Object>> statisticsByDate(Long userId);
}