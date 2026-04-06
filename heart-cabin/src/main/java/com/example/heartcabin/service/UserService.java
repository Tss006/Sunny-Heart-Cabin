package com.example.heartcabin.service;

import com.example.heartcabin.entity.User;
import com.example.heartcabin.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    public boolean register(User user) {
        return userMapper.register(user) > 0;
    }

    public User login(String username, String password) {
        return userMapper.login(username, password);
    }

    public boolean updatePassword(Long id, String password) {
        return userMapper.updatePassword(id, password) > 0;
    }

    public boolean updateNickname(Long id, String nickname) {
        return userMapper.updateNickname(id, nickname) > 0;
    }
}