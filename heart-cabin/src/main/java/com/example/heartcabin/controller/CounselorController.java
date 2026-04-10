package com.example.heartcabin.controller;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.example.heartcabin.common.Result;
/**
 * 心理咨询师模拟模块 Controller
 * 功能：获取咨询师列表、获取聊天记录、发送消息(自动回复)
 */
@RestController
@RequestMapping("/counselor")
public class CounselorController {

    /**
     * 1. 获取所有心理咨询师列表
     * 接口地址：/counselor/list
     */
    @GetMapping("/list")
    public Result getCounselorList() {
        List<Map<String, Object>> counselorList = new ArrayList<>();

        // 咨询师 1
        Map<String, Object> counselor1 = new HashMap<>();
        counselor1.put("id", 1L);
        counselor1.put("name", "张老师");
        counselor1.put("title", "心理咨询师");
        counselor1.put("intro", "专注焦虑缓解、压力管理、睡眠疏导");
        counselor1.put("avatar", "https://picsum.photos/200");
        counselor1.put("status", 1); // 1表示在线

        // 咨询师 2
        Map<String, Object> counselor2 = new HashMap<>();
        counselor2.put("id", 2L);
        counselor2.put("name", "李老师");
        counselor2.put("title", "资深心理师");
        counselor2.put("intro", "擅长情绪调节、学习压力缓解、人际关系辅导");
        counselor2.put("avatar", "https://picsum.photos/200");
        counselor2.put("status", 1);

        counselorList.add(counselor1);
        counselorList.add(counselor2);

        return Result.success(counselorList);
    }

    /**
     * 2. 获取聊天历史记录
     * 接口地址：/counselor/chat/history?userId=1&counselorId=1
     */
    @GetMapping("/chat/history")
    public Result getChatHistory(Long userId, Long counselorId) {
        List<Map<String, Object>> chatHistory = new ArrayList<>();

        // 模拟消息 1 (用户发送)
        Map<String, Object> msg1 = new HashMap<>();
        msg1.put("content", "老师，我最近压力很大，睡不好觉。");
        msg1.put("sender", 1); // 1代表用户
        msg1.put("time", "2026-04-07 10:10:00");
        chatHistory.add(msg1);

        // 模拟消息 2 (咨询师回复)
        Map<String, Object> msg2 = new HashMap<>();
        msg2.put("content", "别担心，我来帮你慢慢疏导。焦虑是很正常的情绪，试着深呼吸放松一下。");
        msg2.put("sender", 2); // 2代表咨询师
        msg2.put("time", "2026-04-07 10:11:00");
        chatHistory.add(msg2);

        return Result.success(chatHistory);
    }

    /**
     * 3. 发送消息给咨询师 (模拟自动回复)
     * 接口地址：/counselor/chat/send
     * 请求方式：POST
     * 参数：{"content": "用户输入的消息"}
     */
    @PostMapping("/chat/send")
    public Result sendMessage(@RequestBody Map<String, String> param) {
        String userMsg = param.get("content");

        // 定义一些咨询师的自动回复语料
        String[] replies = {
                "我能感受到你的压力，慢慢说，我在这里认真听着。",
                "学习和比赛确实很辛苦，但别忘了劳逸结合。配合手环的睡眠数据，咱们一起调整作息。",
                "你已经做得很好了，别给自己太大压力，试着听点轻音乐放松心情。",
                "这种时候需要给自己一个拥抱，深呼吸，吸气...呼气...一切都会好起来的。"
        };

        // 随机选一个回复
        String counselorReply = replies[new Random().nextInt(replies.length)];

        // 构造返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("yourMsg", userMsg);
        result.put("counselorMsg", counselorReply);
        result.put("time", new java.text.SimpleDateFormat("HH:mm:ss").format(new Date()));

        return Result.success(result);
    }
}