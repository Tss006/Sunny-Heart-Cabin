package com.example.heartcabin.service;

import com.example.heartcabin.entity.ChatHistory;
import com.example.heartcabin.mapper.ChatHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Autowired
    private ChatHistoryMapper chatHistoryMapper;

    // 把你自己的 KEY 粘贴进来
    private static final String API_KEY = "sk-b9f81a8adba049959f279b06b775bc7b";
    private static final String URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    private final RestTemplate restTemplate = new RestTemplate();


        /**
     * 获取所有历史总结（每个 chatId 最新一条总结）
     */
    public List<ChatHistory> getSummaries(Long user_id) {
        return chatHistoryMapper.getSummaries(user_id);
    }

    /**
     * 获取指定 chatId 的所有聊天记录
     */

    public List<ChatHistory> getHistoryByChatId(Long user_id, String chat_id) {
        return chatHistoryMapper.getByUserIdAndChatId(user_id, chat_id);
    }


    public ChatHistory sendMessage(Long user_id, String chat_id, String user_message) {
        try {
            // 1. 获取历史聊天记录作为上下文
            List<ChatHistory> history = chatHistoryMapper.getByUserIdAndChatId(user_id, chat_id);
            List<Map<String, String>> contextMessages = new ArrayList<>();

            // 限制上下文长度（例如最多 10 条记录）
            int contextLimit = 10;
            int start = Math.max(0, history.size() - contextLimit);
            for (int i = start; i < history.size(); i++) {
                ChatHistory record = history.get(i);
                contextMessages.add(Map.of("role", "user", "content", record.getUser_message()));
                contextMessages.add(Map.of("role", "assistant", "content", record.getAi_reply()));
            }

            // 添加当前用户消息到上下文
            contextMessages.add(Map.of("role", "user", "content", user_message));

            // 添加系统消息，定义 AI 的身份
            contextMessages.add(0, Map.of("role", "system", "content", "你是‘心情小屋’的专业心理咨询师，擅长倾听、共情和提供心理支持。你温柔、耐心、专业，能够帮助用户缓解情绪、解决心理困扰，并提供科学的心理建议。"));

            // 2. 构造请求
            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen-turbo");
            body.put("input", Map.of("messages", contextMessages));
            body.put("parameters", Map.of("result_format", "message"));

            // 3. 发送请求
            Map<String, Object> response = restTemplate.postForObject(
            URL,
            new org.springframework.http.HttpEntity<>(body,
                new org.springframework.http.HttpHeaders() {{
                    set("Authorization", "Bearer " + API_KEY);
                    set("Content-Type", "application/json");
                }}),
            Map.class
        );

        // 4. 解析结果
        Map<String, Object> output = (Map<String, Object>) response.get("output");
        List<Map<String, Object>> choices = (List<Map<String, Object>>) output.get("choices");
        Map<String, Object> choice = choices.get(0);
        Map<String, String> message = (Map<String, String>) choice.get("message");
        String aiReply = message.get("content");

        // 5. 保存记录
        ChatHistory chat = new ChatHistory();
        chat.setUser_id(user_id);
        chat.setUser_message(user_message);
        chat.setAi_reply(aiReply);
        chat.setChat_id(chat_id);
        chatHistoryMapper.add(chat);

        return chat;

    } catch (Exception e) {
        // 出错时返回友好提示
        System.out.println(e.getMessage());
        ChatHistory chat = new ChatHistory();
        chat.setUser_id(user_id);
        chat.setUser_message(user_message);
        chat.setAi_reply("ai暂时无法使用");
        return chat;
    }
}


        /**
     * AI总结历史内容
     */
    public ChatHistory summarizeHistory(Long user_id, String chat_id, String historyText) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen-turbo");
            Map<String, Object> input = new HashMap<>();
            input.put("messages", new Object[]{
                    Map.of("role", "system", "content", "你是心晴小屋专业AI心理师，请你将以下聊天内容进行主题总结，字数不超过10个字"),
                    Map.of("role", "user", "content", historyText)
            });
            body.put("input", input);
            body.put("parameters", Map.of("result_format", "message"));

            Map<String, Object> response = restTemplate.postForObject(
                    URL,
                    new org.springframework.http.HttpEntity<>(body,
                            new org.springframework.http.HttpHeaders() {{
                                set("Authorization", "Bearer " + API_KEY);
                                set("Content-Type", "application/json");
                            }}),
                    Map.class
            );
            Map<String, Object> output = (Map<String, Object>) response.get("output");
            List<Map<String, Object>> choices = (List<Map<String, Object>>) output.get("choices");
            Map<String, Object> choice = choices.get(0);
            Map<String, String> message = (Map<String, String>) choice.get("message");
            String summary = message.get("content");

            ChatHistory chat = new ChatHistory();
            chat.setUser_id(user_id);
            chat.setChat_id(chat_id);
            chat.setUser_message("History_Summarize");
            chat.setAi_reply(summary);
            chatHistoryMapper.add(chat);
            return chat;
        } catch (Exception e) {
            System.out.println("总结对话历史失败: " + e.getMessage());
            ChatHistory chat = new ChatHistory();
            chat.setUser_id(user_id);
            chat.setUser_message("[历史总结]");
            chat.setAi_reply("AI总结失败");
            return chat;
        }
    }
}