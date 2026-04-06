package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.ChatHistory;
import com.example.heartcabin.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/chat")
    public Result<ChatHistory> chat(Long userId, String message) {
        ChatHistory history = chatService.sendMessage(userId, message);
        return Result.success("对话成功", history);
    }

    @GetMapping("/history")
    public Result<List<ChatHistory>> history(Long userId) {
        List<ChatHistory> historyList = chatService.getHistory(userId);
        return Result.success("查询成功", historyList);
    }
}