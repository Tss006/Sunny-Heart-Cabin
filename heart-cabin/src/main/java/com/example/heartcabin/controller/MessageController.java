package com.example.heartcabin.controller;

import com.example.heartcabin.common.Result;
import com.example.heartcabin.entity.Message;
import com.example.heartcabin.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/message")
public class MessageController {

	@Autowired
	private MessageService messageService;

	@GetMapping("/random")
	public Result<List<Message>> random(@RequestParam(defaultValue = "3") int count) {
		return Result.success("查询成功", messageService.getRandomMessages(count));
	}

	@PostMapping("/submit")
	public Result<?> submit(@RequestBody Message message) {
		messageService.submitMessage(message);
		return Result.success("留言成功");
}
}
