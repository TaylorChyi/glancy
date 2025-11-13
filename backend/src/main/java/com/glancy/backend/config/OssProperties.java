package com.glancy.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "oss")
public class OssProperties {

    private String endpoint;
    private String bucket;
    private String accessKeyId;
    private String accessKeySecret;

    /** Optional security token when using STS temporary credentials. */
    private String securityToken;

    private String avatarDir = "avatars/";

    /** Whether uploaded objects should be publicly readable. */
    private boolean publicRead = true;

    /**
     * Whether the service should verify the bucket location at startup. Some cross-account buckets
     * may not allow this operation.
     */
    private boolean verifyLocation = true;

    /** Expiration time in minutes for generated presigned URLs when objects are not public. */
    private long signedUrlExpirationMinutes = 1440;
}
