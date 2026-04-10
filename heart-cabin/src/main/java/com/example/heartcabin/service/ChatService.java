
package com.example.heartcabin.service;

import com.example.heartcabin.entity.ChatHistory;
import com.example.heartcabin.mapper.ChatHistoryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
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

    public ChatHistory sendMessage(Long userId, String userMessage) {
        try {
            // 1. 构造请求
            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen-turbo");

            Map<String, Object> input = new HashMap<>();
            input.put("messages", new Object[]{
                    Map.of("role", "system", "content", "你是心晴小屋专业AI心理师，温柔、耐心、专业。"),
                    Map.of("role", "user", "content", userMessage)
            });

            body.put("input", input);
            body.put("parameters", Map.of("result_format", "message"));

            // 2. 发送请求
            Map<String, Object> response = restTemplate.postForObject(
                    URL,
                    new org.springframework.http.HttpEntity<>(body,
                            new org.springframework.http.HttpHeaders() {{
                                set("Authorization", "Bearer " + API_KEY);
                                set("Content-Type", "application/json");
                            }}),
                    Map.class
            );

            // 3. 解析结果
            Map<String, Object> output = (Map<String, Object>) response.get("output");
            List<Map<String, Object>> choices = (List<Map<String, Object>>) output.get("choices");
            Map<String, Object> choice = choices.get(0);
            Map<String, String> message = (Map<String, String>) choice.get("message");
            String aiReply = message.get("content");

            // 4. 保存记录
            ChatHistory chat = new ChatHistory();
            chat.setUserId(userId);
            chat.setUserMessage(userMessage);
            chat.setAiReply(aiReply);
            chatHistoryMapper.add(chat);

            return chat;

        } catch (Exception e) {
            // 出错时返回友好提示
            ChatHistory chat = new ChatHistory();
            chat.setUserId(userId);
            chat.setUserMessage(userMessage);
            chat.setAiReply("我在这里听你说，有任何情绪都可以告诉我，我会一直陪着你。");
            return chat;
        }
    }

    public List<ChatHistory> getHistory(Long userId) {
        return chatHistoryMapper.getByUserId(userId);
    }

        /**
     * AI总结历史内容
     */
    public ChatHistory summarizeHistory(Long userId, String historyText) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", "qwen-turbo");
            Map<String, Object> input = new HashMap<>();
            input.put("messages", new Object[]{
                    Map.of("role", "system", "content", "你是心晴小屋专业AI心理师，请你将以下聊天内容进行简要总结，突出用户的主要情绪和问题，字数不超过60字："),
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
            chat.setUserId(userId);
            chat.setUserMessage("[历史总结]");
            chat.setAiReply(summary);
            chatHistoryMapper.add(chat);
            return chat;
        } catch (Exception e) {
            ChatHistory chat = new ChatHistory();
            chat.setUserId(userId);
            chat.setUserMessage("[历史总结]");
            chat.setAiReply("AI总结失败");
            return chat;
        }
    }
}