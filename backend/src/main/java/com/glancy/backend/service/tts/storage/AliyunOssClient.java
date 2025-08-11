package com.glancy.backend.service.tts.storage;

import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.OSS;
import java.io.ByteArrayInputStream;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Adapter that stores objects in Aliyun OSS and issues pre-signed URLs
 * for temporary access. The implementation intentionally keeps the
 * footprint small so it can be easily swapped for a different provider
 * if needed in the future.
 */
@Component
public class AliyunOssClient implements ObjectStorageClient {

    private final OSS oss;
    private final String bucket;

    public AliyunOssClient(OSS oss, @Value("${oss.bucket}") String bucket) {
        this.oss = oss;
        this.bucket = bucket;
    }

    @Override
    public void putObject(String key, byte[] content) {
        oss.putObject(bucket, key, new ByteArrayInputStream(content));
    }

    @Override
    public String generatePresignedGetUrl(String key, Duration ttl) {
        Date expiration = Date.from(Instant.now().plus(ttl));
        URL url = oss.generatePresignedUrl(bucket, key, expiration, HttpMethod.GET);
        return url.toString();
    }
}
