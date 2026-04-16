package com.example.heartcabin.service;

import com.example.heartcabin.common.BusinessException;
import com.example.heartcabin.entity.CounselorChat;
import com.example.heartcabin.mapper.CounselorChatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CounselorChatService {

	@Autowired
	private CounselorChatMapper counselorChatMapper;

	@Autowired
	private CounselorService counselorService;

	public List<CounselorChat> getHistory(Long user_id, Long counselor_id) {
		if (user_id == null || counselor_id == null) {
			return List.of();
		}
		return counselorChatMapper.selectHistory(user_id, counselor_id);
	}

	public List<Map<String, Object>> getSessions(Long counselor_id) {
		if (counselor_id == null) {
			return List.of();
		}
		return counselorChatMapper.selectSessions(counselor_id);
	}

	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> sendUserMessage(Long user_id, Long counselor_id, String content) {
		if (user_id == null || counselor_id == null) {
			throw new BusinessException("用户和咨询师信息不能为空");
		}
		if (content == null || content.trim().isEmpty()) {
			throw new BusinessException("聊天内容不能为空");
		}
		if (counselorService.getById(counselor_id) == null) {
			throw new BusinessException("咨询师不存在");
		}

		String cleanedContent = content.trim();
		CounselorChat userChat = new CounselorChat();
		userChat.setCounselor_id(counselor_id);
		userChat.setUser_id(user_id);
		userChat.setContent(cleanedContent);
		userChat.setSender(1);
		counselorChatMapper.insert(userChat);

		Map<String, Object> result = new HashMap<>();
		result.put("userId", user_id);
		result.put("counselorId", counselor_id);
		result.put("content", cleanedContent);
		result.put("sender", 1);
		result.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
		return result;
	}

	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> sendManualMessage(Long user_id, Long counselor_id, String content) {
		if (user_id == null || counselor_id == null) {
			throw new BusinessException("用户和咨询师信息不能为空");
		}
		if (content == null || content.trim().isEmpty()) {
			throw new BusinessException("聊天内容不能为空");
		}
		if (counselorService.getById(counselor_id) == null) {
			throw new BusinessException("咨询师不存在");
		}

		String cleanedContent = content.trim();

		CounselorChat userChat = new CounselorChat();
		userChat.setCounselor_id(counselor_id);
		userChat.setUser_id(user_id);
		userChat.setContent(cleanedContent);
		userChat.setSender(2);
		counselorChatMapper.insert(userChat);

		Map<String, Object> result = new HashMap<>();
		result.put("userId", user_id);
		result.put("counselorId", counselor_id);
		result.put("content", cleanedContent);
		result.put("sender", 2);
		result.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
		return result;
	}
}
