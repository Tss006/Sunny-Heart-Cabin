package com.example.heartcabin.service;

import com.example.heartcabin.entity.Music;
import com.example.heartcabin.mapper.MusicMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MusicService {
    @Autowired
    private MusicMapper musicMapper;

    public List<Music> getAll() {
        return musicMapper.getAll();
    }

    public List<Music> getByType(String type) {
        return musicMapper.getByType(type);
    }
}