package com.example.heartcabin.controller;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Counselor;
import com.example.heartcabin.entity.CounselorChat;
import com.example.heartcabin.service.CounselorChatService;
import com.example.heartcabin.service.CounselorService;

import org.springframework.beans.factory.annotation.Autowired;
/**
 * 心理咨询师模拟模块 Controller
 * 功能：获取咨询师列表、获取聊天记录、发送消息(自动回复)
 */
@RestController
@RequestMapping("/counselor")
public class CounselorController {

    @Autowired
    private CounselorService counselorService;

    @Autowired
    private CounselorChatService counselorChatService;

    /**
     * 1. 获取所有心理咨询师列表
     * 接口地址：/counselor/list
     */
    @GetMapping("/list")
    public Result<List<Counselor>> getCounselorList() {
        List<Counselor> counselorList = counselorService.listCounselors();
        return Result.success("查询成功", counselorList);
    }

    /**
     * 2. 获取聊天历史记录
     * 接口地址：/counselor/chat/history?userId=1&counselorId=1
     */
    @GetMapping("/chat/history")
    public Result<List<CounselorChat>> getChatHistory(@RequestParam(required = false) String userId,
                                                      @RequestParam(required = false) String counselorId) {
        return Result.success("查询成功", counselorChatService.getHistory(parseLong(userId), parseLong(counselorId)));
    }

    /**
     * 3. 获取咨询师当前的会话列表
     * 接口地址：/counselor/chat/sessions?counselorId=1
     */
    @GetMapping("/chat/sessions")
    public Result<List<Map<String, Object>>> getChatSessions(@RequestParam(required = false) String counselorId) {
        return Result.success("查询成功", counselorChatService.getSessions(parseLong(counselorId)));
    }

    /**
     * 4. 用户发送消息到咨询师
     * 接口地址：/counselor/chat/send
     * 请求方式：POST
     * 参数：{"content": "用户输入的消息"}
     */
    @PostMapping("/chat/send")
    public Result<Map<String, Object>> sendMessage(@RequestBody Map<String, Object> param) {
        Long userId = parseLong(param.get("userId"));
        Long counselorId = parseLong(param.get("counselorId"));
        String content = param.get("content") == null ? null : String.valueOf(param.get("content"));
        return Result.success("发送成功", counselorChatService.sendUserMessage(userId, counselorId, content));
    }

    /**
     * 5. 咨询师手动发送消息
     * 接口地址：/counselor/chat/reply
     * 请求方式：POST
     * 参数：{"content": "咨询师输入的消息"}
     */
    @PostMapping("/chat/reply")
    public Result<Map<String, Object>> replyMessage(@RequestBody Map<String, Object> param) {
        Long userId = parseLong(param.get("userId"));
        Long counselorId = parseLong(param.get("counselorId"));
        String content = param.get("content") == null ? null : String.valueOf(param.get("content"));
        return Result.success("发送成功", counselorChatService.sendManualMessage(userId, counselorId, content));
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            return Long.valueOf(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}