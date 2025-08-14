package com.glancy.backend.service;

import com.aliyun.oss.ClientException;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import com.glancy.backend.config.OssProperties;
import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.util.Date;
import java.util.Objects;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Handles uploading avatar images to Alibaba Cloud OSS.
 */
@Service
@Slf4j
public class OssAvatarStorage implements AvatarStorage {

    private final OSS ossClient;
    private final String bucket;
    private final String securityToken;
    private final String avatarDir;
    private final boolean publicRead;
    private final long signedUrlExpirationMinutes;
    private final String urlPrefix;

    public OssAvatarStorage(OSS ossClient, OssProperties properties) {
        this.ossClient = Objects.requireNonNull(ossClient, "OSS client must not be null");
        this.bucket = properties.getBucket();
        this.securityToken = properties.getSecurityToken();
        this.avatarDir = properties.getAvatarDir();
        this.publicRead = properties.isPublicRead();
        this.signedUrlExpirationMinutes = properties.getSignedUrlExpirationMinutes();
        this.urlPrefix = String.format("https://%s.%s/", bucket, removeProtocol(properties.getEndpoint()));
    }

    /**
     * Upload the avatar and return the public URL.
     */
    public String upload(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String objectName = avatarDir + UUID.randomUUID() + ext;
        ossClient.putObject(bucket, objectName, file.getInputStream());
        boolean isPublic = setPublicReadAcl(objectName);
        String url;
        if (isPublic) {
            url = urlPrefix + objectName;
        } else {
            url = generatePresignedUrl(objectName);
        }
        log.info("Avatar stored as {}. URL returned: {}", objectName, url);
        return url;
    }

    /**
     * Attempt to mark the uploaded object as publicly readable.
     * Some buckets do not allow changing object ACLs. If an access error occurs
     * we simply log a warning and continue using the bucket's default ACL.
     */
    private boolean setPublicReadAcl(String objectName) {
        if (!publicRead) {
            return false;
        }
        try {
            ossClient.setObjectAcl(bucket, objectName, CannedAccessControlList.PublicRead);
            return true;
        } catch (OSSException | ClientException e) {
            log.warn("Unable to set public ACL for {}: {}", objectName, e.getMessage());
            return false;
        }
    }

    private String generatePresignedUrl(String objectName) {
        Date expiration = new Date(
            System.currentTimeMillis() + Duration.ofMinutes(signedUrlExpirationMinutes).toMillis()
        );
        GeneratePresignedUrlRequest req = new GeneratePresignedUrlRequest(bucket, objectName, HttpMethod.GET);
        req.setExpiration(expiration);
        if (securityToken != null && !securityToken.isEmpty()) {
            req.addQueryParameter("security-token", securityToken);
        }
        URL url = ossClient.generatePresignedUrl(req);
        String result = url.toString();
        log.info("Generated presigned URL: {}", result);
        return result;
    }

    private static String removeProtocol(String url) {
        return url.replaceFirst("https?://", "");
    }
}
