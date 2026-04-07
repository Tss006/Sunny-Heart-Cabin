package com.example.heartcabin.service.impl;

import com.example.heartcabin.entity.User;
import com.example.heartcabin.mapper.UserMapper;
import com.example.heartcabin.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired; // 换成这个

@Service
public class UserServiceImpl implements UserService {

    @Autowired  // 这里也改
    private UserMapper userMapper;

    @Override
    public User getByUsername(String username) {
        return userMapper.getByUsername(username);
    }

    @Override
    public void register(User user) {
        userMapper.insert(user);
    }

    @Override
    public User getById(Long id) {
        return userMapper.getById(id);
    }

    @Override
    public void updateById(User user) {
        userMapper.updateById(user);
    }
}