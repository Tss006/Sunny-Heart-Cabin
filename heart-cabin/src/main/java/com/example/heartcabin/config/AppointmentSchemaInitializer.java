package com.example.heartcabin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AppointmentSchemaInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS appointment (" +
                "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
                "user_id BIGINT NOT NULL, " +
                "counselor_id BIGINT NOT NULL, " +
                "appointment_time DATETIME NOT NULL, " +
                "status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', " +
                "reason VARCHAR(500) NULL, " +
                "create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                "update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                "INDEX idx_user_id (user_id), " +
                "INDEX idx_counselor_id (counselor_id), " +
                "INDEX idx_appointment_time (appointment_time), " +
                "CONSTRAINT fk_appointment_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE, " +
                "CONSTRAINT fk_appointment_counselor FOREIGN KEY (counselor_id) REFERENCES counselor (id) ON DELETE CASCADE" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约咨询表'");

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS counselor_available_time (" +
                "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
                "counselor_id BIGINT NOT NULL, " +
                "day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL, " +
                "start_time TIME NOT NULL, " +
                "end_time TIME NOT NULL, " +
                "is_available TINYINT(1) NOT NULL DEFAULT 1, " +
                "create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                "update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                "UNIQUE KEY uk_counselor_time (counselor_id, day_of_week, start_time, end_time), " +
                "INDEX idx_counselor_available (counselor_id, is_available), " +
                "CONSTRAINT fk_counselor_available_time_counselor FOREIGN KEY (counselor_id) REFERENCES counselor (id) ON DELETE CASCADE" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='咨询师可预约时间表'");

        seedDefaultAvailableTimes();
    }

    private void seedDefaultAvailableTimes() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM counselor_available_time", Integer.class);
        if (count != null && count > 0) {
            return;
        }

        List<Map<String, Object>> counselors = jdbcTemplate.queryForList("SELECT id FROM counselor WHERE status IS NULL OR status <> 0");
        if (counselors.isEmpty()) {
            return;
        }

        Object[][] defaultSlots = new Object[][]{
                {"Monday", "09:00:00", "12:00:00"},
                {"Monday", "14:00:00", "17:00:00"},
                {"Tuesday", "09:00:00", "12:00:00"},
                {"Tuesday", "14:00:00", "17:00:00"},
                {"Wednesday", "09:00:00", "12:00:00"},
                {"Wednesday", "14:00:00", "17:00:00"},
                {"Thursday", "09:00:00", "12:00:00"},
                {"Thursday", "14:00:00", "17:00:00"},
                {"Friday", "09:00:00", "12:00:00"},
                {"Friday", "14:00:00", "17:00:00"}
        };

        for (Map<String, Object> counselor : counselors) {
            Object counselorId = counselor.get("id");
            if (counselorId == null) {
                continue;
            }
            for (Object[] slot : defaultSlots) {
                jdbcTemplate.update(
                        "INSERT INTO counselor_available_time (counselor_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, 1)",
                        counselorId,
                        slot[0],
                        slot[1],
                        slot[2]
                );
            }
        }
    }
}
