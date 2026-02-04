package com.kohub.adapter;

import com.kohub.adapter.uptime.UptimeKumaAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 어댑터 설정
 */
@Configuration
public class AdapterConfig {

    /**
     * 어댑터 맵 (이름 → 어댑터)
     */
    @Bean
    public Map<String, ToolAdapter> adapters(List<ToolAdapter> adapterList) {
        Map<String, ToolAdapter> adapterMap = new HashMap<>();
        for (ToolAdapter adapter : adapterList) {
            adapterMap.put(adapter.getName(), adapter);
        }
        return adapterMap;
    }
}
