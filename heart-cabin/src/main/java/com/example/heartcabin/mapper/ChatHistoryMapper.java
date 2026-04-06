package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.ChatHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface ChatHistoryMapper {

    @Insert("INSERT INTO chat_history(user_id,user_message,ai_reply) VALUES(#{userId},#{userMessage},#{aiReply})")
    int add(ChatHistory chatHistory);

    @Select("SELECT * FROM chat_history WHERE user_id=#{userId} ORDER BY create_time ASC")
    List<ChatHistory> getByUserId(Long userId);
}