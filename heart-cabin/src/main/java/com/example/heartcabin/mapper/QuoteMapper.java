package com.example.heartcabin.mapper;

import com.example.heartcabin.entity.Quote;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface QuoteMapper {

	@Select("SELECT id, content, author FROM quotes ORDER BY RAND() LIMIT 1")
	Quote selectRandom();
}
