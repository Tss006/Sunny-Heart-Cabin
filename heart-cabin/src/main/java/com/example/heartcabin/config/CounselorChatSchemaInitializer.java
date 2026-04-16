package com.example.heartcabin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CounselorChatSchemaInitializer implements CommandLineRunner {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) {
		jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS counselor_chat (" +
				"id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
				"counselor_id BIGINT NOT NULL, " +
				"user_id BIGINT NOT NULL, " +
				"content VARCHAR(1000) NOT NULL, " +
				"sender INT NOT NULL, " +
				"create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" +
				") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='咨询聊天记录表'");
	}
}