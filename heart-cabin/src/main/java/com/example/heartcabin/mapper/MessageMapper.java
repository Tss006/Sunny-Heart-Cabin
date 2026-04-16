package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Message;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MessageMapper {

	@Select("SELECT id, userId, nickname, message, anonymous, createdTime FROM messages ORDER BY RAND() LIMIT #{count}")
	List<Message> selectRandom(@Param("count") int count);

	@Insert("INSERT INTO messages(userId, nickname, message, anonymous, createdTime) VALUES(#{userId}, #{nickname}, #{message}, #{anonymous}, NOW())")
	void insert(Message message);
}
