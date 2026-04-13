package com.example.heartcabin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DiarySchemaInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureColumn("title", "ALTER TABLE diary ADD COLUMN title VARCHAR(255) NULL COMMENT '日记标题'");
        ensureColumn("mood", "ALTER TABLE diary ADD COLUMN mood VARCHAR(255) NULL COMMENT '心情标签'");
        ensureColumn("diary_id", "ALTER TABLE diary ADD COLUMN diary_id VARCHAR(64) NULL COMMENT '日记唯一标识'");
    }

    private void ensureColumn(String columnName, String alterSql) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'diary' AND column_name = ?",
                Integer.class,
                columnName
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute(alterSql);
        }
    }
}