package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Counselor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CounselorMapper {

	@Select("SELECT id, name, username, nickname, title, avatar, phone, role, status, create_time, age, gender, signatrue AS signature FROM counselor ORDER BY status DESC, id ASC")
	List<Counselor> selectAll();

	@Select("SELECT id, name, username, nickname, title, avatar, phone, role, status, create_time, age, gender, signatrue AS signature FROM counselor WHERE id=#{id}")
	Counselor selectById(Long id);

	@Select("SELECT id, name, username, password, nickname, title, avatar, phone, role, status, create_time, age, gender, signatrue AS signature FROM counselor WHERE username=#{username}")
	Counselor selectByUsername(String username);
}
