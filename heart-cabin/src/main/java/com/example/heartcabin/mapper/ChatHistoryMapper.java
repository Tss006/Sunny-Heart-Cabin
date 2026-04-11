
package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.ChatHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface ChatHistoryMapper {

    @Insert("INSERT INTO chat_history(user_id,user_message,ai_reply,chat_id) VALUES(#{user_id},#{user_message},#{ai_reply},#{chat_id})")
    int add(ChatHistory chatHistory);

    // 获取所有历史总结（每个 chatId 最新一条 userMessage 为 History_Summarize 或 [历史总结] 的记录）
    @Select("SELECT t.* FROM chat_history t INNER JOIN (SELECT chat_id, MAX(id) AS max_id FROM chat_history WHERE user_id=#{user_id} AND (user_message='History_Summarize' OR user_message='[历史总结]') GROUP BY chat_id) x ON t.id = x.max_id ORDER BY t.create_time DESC")
    List<ChatHistory> getSummaries(Long user_id);

    // 获取指定 chatId 的所有聊天记录
    @Select("SELECT * FROM chat_history WHERE user_id=#{user_id} AND chat_id=#{chat_id} ORDER BY create_time ASC")
    List<ChatHistory> getByUserIdAndChatId(Long user_id, String chat_id);
}