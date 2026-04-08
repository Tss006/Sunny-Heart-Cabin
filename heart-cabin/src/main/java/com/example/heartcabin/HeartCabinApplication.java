package com.example.heartcabin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication
@MapperScan("com.example.heartcabin.mapper") // 就是这行！
public class HeartCabinApplication {
    public static void main(String[] args) {
        SpringApplication.run(HeartCabinApplication.class, args);
    }
}