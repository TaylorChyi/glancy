package com.glancy.backend.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Centralizes creation of the Aliyun OSS client so that all services share
 * a single, properly configured instance.
 */
@Configuration
@Slf4j
public class OssClientConfig {

    @Bean(destroyMethod = "shutdown")
    public OSS ossClient(OssProperties properties) {
        OSS client = buildClient(properties.getEndpoint(), properties);
        if (properties.isVerifyLocation()) {
            try {
                String location = client.getBucketLocation(properties.getBucket());
                String expected = formatEndpoint(location);
                String configured = removeProtocol(properties.getEndpoint());
                if (!configured.contains(location)) {
                    client.shutdown();
                    client = buildClient(expected, properties);
                    properties.setEndpoint(expected);
                }
            } catch (Exception e) {
                log.warn("Failed to verify OSS endpoint: {}", e.getMessage());
            }
        }
        return client;
    }

    private OSS buildClient(String endpoint, OssProperties props) {
        OSSClientBuilder builder = new OSSClientBuilder();
        if (props.getSecurityToken() != null && !props.getSecurityToken().isEmpty()) {
            return builder.build(endpoint, props.getAccessKeyId(), props.getAccessKeySecret(), props.getSecurityToken());
        }
        return builder.build(endpoint, props.getAccessKeyId(), props.getAccessKeySecret());
    }

    private static String removeProtocol(String url) {
        return url.replaceFirst("https?://", "");
    }

    private static String formatEndpoint(String location) {
        String loc = location.startsWith("http") ? removeProtocol(location) : location;
        if (!loc.startsWith("oss-")) {
            loc = "oss-" + loc;
        }
        return "https://" + loc + ".aliyuncs.com";
    }
}
