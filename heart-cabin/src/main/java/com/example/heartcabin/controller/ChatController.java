
    
package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.ChatHistory;
import com.example.heartcabin.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/summary")
    public Result<ChatHistory> summary(@RequestBody Map<String, Object> param) {
        Long userId = param.get("userId") == null ? null : Long.valueOf(param.get("userId").toString());
        String historyText = param.get("historyText") == null ? "" : param.get("historyText").toString();
        ChatHistory summary = chatService.summarizeHistory(userId, historyText);
        return Result.success("总结成功", summary);
    }

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