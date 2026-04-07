package com.example.heartcabin.service;

import com.example.heartcabin.entity.User;

public interface UserService {
    User getByUsername(String username);
    void register(User user);
    User getById(Long id);
    void updateById(User user);
}