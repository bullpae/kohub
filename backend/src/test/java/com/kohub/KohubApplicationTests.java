package com.kohub;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class KohubApplicationTests {

    @Test
    @DisplayName("애플리케이션 컨텍스트 로드 테스트")
    void contextLoads() {
        // 컨텍스트가 정상적으로 로드되면 성공
    }
}
