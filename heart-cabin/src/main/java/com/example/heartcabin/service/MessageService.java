package com.example.heartcabin.service;

import com.example.heartcabin.entity.Message;
import com.example.heartcabin.mapper.MessageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

	@Autowired
	private MessageMapper messageMapper;

	public List<Message> getRandomMessages(int count) {
		int safeCount = Math.max(1, Math.min(count, 3));
		List<Message> messages = messageMapper.selectRandom(safeCount);
		return messages == null ? List.of() : messages;
	}

	public void submitMessage(Message message) {
		if (message == null || message.getMessage() == null || message.getMessage().trim().isEmpty()) {
			throw new IllegalArgumentException("留言内容不能为空");
		}
		String nickname = message.getNickname();
		if (Boolean.TRUE.equals(message.getAnonymous())) {
			nickname = "匿名用户";
		} else if (nickname == null || nickname.trim().isEmpty()) {
			nickname = "心晴用户";
		}
		message.setNickname(nickname);
		message.setMessage(message.getMessage().trim());
		messageMapper.insert(message);
	}
}
