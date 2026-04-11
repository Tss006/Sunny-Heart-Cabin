
    
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
        System.out.println("zzzz");
        Long user_id = param.get("user_id") == null ? null : Long.valueOf(param.get("user_id").toString());
        String chat_id = param.get("chat_id") == null ? null : param.get("chat_id").toString();
        String historyText = param.get("historyText") == null ? "" : param.get("historyText").toString();
        ChatHistory summary = chatService.summarizeHistory(user_id, chat_id, historyText);
        return Result.success("总结成功", summary);
    }


    @GetMapping("/chat")
    public Result<ChatHistory> chat(Long user_id, String chat_id, String message) {
        ChatHistory history = chatService.sendMessage(user_id, chat_id, message);
        return Result.success("对话成功", history);
    }

        /**
     * 获取所有历史总结（左侧会话栏）
     */
    @GetMapping("/summaries")
    public Result<List<ChatHistory>> getSummaries(Long user_id) {
        List<ChatHistory> summaries = chatService.getSummaries(user_id);
        return Result.success("查询成功", summaries);
    }

    /**
     * 获取指定 chatId 的所有聊天记录
     */
    @GetMapping("/historyByChatId")
    public Result<List<ChatHistory>> getHistoryByChatId(Long user_id, String chat_id) {
        System.out.println(user_id+" "+chat_id);
        List<ChatHistory> historyList = chatService.getHistoryByChatId(user_id, chat_id);
        System.out.println(historyList);
        return Result.success("查询成功", historyList);
    }

}