package com.example.heartcabin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class QuoteSchemaInitializer implements CommandLineRunner {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) {
		jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS quote (" +
				"id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
				"content VARCHAR(500) NOT NULL, " +
				"author VARCHAR(100) NOT NULL" +
				") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='名言名句表'");

		Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM quote", Integer.class);
		if (count != null && count > 0) {
			return;
		}

		Object[][] quotes = new Object[][] {
				{"世界上只有一种真正的英雄主义，那就是在认清生活的真相后依然热爱生活。", "罗曼·罗兰"},
				{"生活的理想，就是为了理想的生活。", "张闻天"},
				{"千里之行，始于足下。", "老子"},
				{"黑夜无论怎样悠长，白昼总会到来。", "莎士比亚"},
				{"真正的勇气，不是没有恐惧，而是带着恐惧继续前行。", "佚名"},
				{"你无法阻止风来，但可以调整帆。", "佚名"},
				{"允许自己慢一点，也是一种进步。", "佚名"},
				{"情绪会流动，今天的低谷不会定义明天。", "佚名"}
		};

		for (Object[] item : quotes) {
			jdbcTemplate.update("INSERT INTO quote(content, author) VALUES (?, ?)", item[0], item[1]);
		}
	}
}