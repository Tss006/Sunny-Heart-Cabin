package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.CounselorChat;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Mapper
public interface CounselorChatMapper {

	@Results(id = "CounselorChatMap", value = {
			@Result(column = "id", property = "id", id = true),
			@Result(column = "counselor_id", property = "counselor_id"),
			@Result(column = "user_id", property = "user_id"),
			@Result(column = "content", property = "content"),
			@Result(column = "sender", property = "sender"),
			@Result(column = "create_time", property = "create_time", javaType = LocalDateTime.class)
	})
	@Select("SELECT id, counselor_id, user_id, content, sender, create_time FROM counselor_chat WHERE user_id=#{user_id} AND counselor_id=#{counselor_id} ORDER BY create_time ASC, id ASC")
	List<CounselorChat> selectHistory(@Param("user_id") Long user_id, @Param("counselor_id") Long counselor_id);

	@Select("SELECT t.user_id AS userId, COALESCE(u.nickname, CONCAT('用户#', t.user_id)) AS nickname, t.content AS preview, t.create_time AS lastTime FROM counselor_chat t INNER JOIN (SELECT user_id, MAX(id) AS max_id FROM counselor_chat WHERE counselor_id=#{counselor_id} GROUP BY user_id) x ON t.id = x.max_id AND t.counselor_id=#{counselor_id} LEFT JOIN user u ON u.id = t.user_id ORDER BY t.create_time DESC, t.id DESC")
	List<Map<String, Object>> selectSessions(@Param("counselor_id") Long counselor_id);

	@Insert("INSERT INTO counselor_chat(counselor_id, user_id, content, sender, create_time) VALUES(#{counselor_id}, #{user_id}, #{content}, #{sender}, NOW())")
	@Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
	int insert(CounselorChat counselorChat);
}
