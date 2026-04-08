package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.common.JwtUtil;
import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.entity.User;
import com.example.heartcabin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;





}