package com.example.heartcabin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class MessageSchemaInitializer implements CommandLineRunner {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) {
		jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS message (" +
				"id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
				"userId BIGINT NULL, " +
				"nickname VARCHAR(100) NOT NULL, " +
				"message VARCHAR(500) NOT NULL, " +
				"anonymous TINYINT(1) NOT NULL DEFAULT 1, " +
				"createdTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" +
				") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页留言表'");

		Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM message", Integer.class);
		if (count != null && count > 0) {
			return;
		}

		Object[][] seeds = new Object[][] {
				{null, "匿名用户", "今晚很难受的时候，记得先喝口水，再慢慢呼吸。", 1},
				{null, "小晴", "允许自己慢一点，真的没关系。", 1},
				{null, "阿木", "今天已经够努力了，先肯定自己。", 0},
				{null, "橘子", "情绪不是敌人，它只是想告诉你你累了。", 0},
				{null, "匿名用户", "你不是一个人，慢慢来就好。", 1},
				{null, "星河", "愿你在低谷里也能保留一点点光。", 0},
				{null, "匿名用户", "先照顾好自己，再去处理世界。", 1},
				{null, "小叶", "今天的你已经很棒了，真的。", 0}
		};

		for (Object[] seed : seeds) {
			jdbcTemplate.update("INSERT INTO message(userId, nickname, message, anonymous, createdTime) VALUES (?, ?, ?, ?, NOW())", seed[0], seed[1], seed[2], seed[3]);
		}
	}
}