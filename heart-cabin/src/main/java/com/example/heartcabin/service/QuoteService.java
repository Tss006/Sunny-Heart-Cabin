package com.example.heartcabin.service;

import com.example.heartcabin.entity.Quote;
import com.example.heartcabin.mapper.QuoteMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class QuoteService {

	@Autowired
	private QuoteMapper quoteMapper;

	public Quote getRandomQuote() {
		Quote quote = quoteMapper.selectRandom();
		if (quote == null) {
			Quote fallback = new Quote();
			fallback.setContent("你无法阻止风来，但可以调整帆。");
			fallback.setAuthor("佚名");
			return fallback;
		}
		return quote;
	}
}
