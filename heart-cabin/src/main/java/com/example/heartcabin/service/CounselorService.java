package com.example.heartcabin.service;
import com.example.heartcabin.entity.Counselor;
import com.example.heartcabin.mapper.CounselorMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CounselorService {

	@Autowired
	private CounselorMapper counselorMapper;

	public List<Counselor> listCounselors() {
		return counselorMapper.selectAll();
	}

	public Counselor getById(Long id) {
		if (id == null) {
			return null;
		}
		return counselorMapper.selectById(id);
	}

	public Counselor getByUsername(String username) {
		if (username == null || username.trim().isEmpty()) {
			return null;
		}
		return counselorMapper.selectByUsername(username);
	}
}
