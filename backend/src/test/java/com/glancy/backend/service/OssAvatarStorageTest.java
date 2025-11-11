package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.*;

import org.mockito.Mockito;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import com.glancy.backend.config.OssProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Simple tests for OssAvatarStorage.
 */
class OssAvatarStorageTest {

    /**
     * 测试 setPublicReadAcl failure is swallowed
     */
    @Test
    void aclDeniedDoesNotThrow() throws Exception {
        OssProperties props = new OssProperties();
        props.setEndpoint("https://oss-cn-beijing.aliyuncs.com");
        props.setBucket("bucket");
        props.setAccessKeyId("id");
        props.setAccessKeySecret("secret");
        props.setAvatarDir("avatars/");
        props.setPublicRead(true);

        OSS client = Mockito.mock(OSS.class);
        OssAvatarStorage storage = new OssAvatarStorage(client, props);
        Mockito.when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        OSSException ex = new OSSException("AccessDenied");
        Mockito.doThrow(ex).when(client).setObjectAcl(eq("bucket"), anyString(), eq(CannedAccessControlList.PublicRead));
        Mockito.when(client.generatePresignedUrl(any(GeneratePresignedUrlRequest.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        String objectKey = storage.upload(file);
        storage.resolveUrl(objectKey);
        Mockito.verify(client).setObjectAcl(eq("bucket"), anyString(), eq(CannedAccessControlList.PublicRead));
        Mockito.verify(client).generatePresignedUrl(any(GeneratePresignedUrlRequest.class));
    }

    @Test
    void generateUrlWhenPrivate() throws Exception {
        OssProperties props = new OssProperties();
        props.setEndpoint("https://oss-cn-beijing.aliyuncs.com");
        props.setBucket("bucket");
        props.setAccessKeyId("id");
        props.setAccessKeySecret("secret");
        props.setAvatarDir("avatars/");
        props.setPublicRead(false);

        OSS client = Mockito.mock(OSS.class);
        OssAvatarStorage storage = new OssAvatarStorage(client, props);
        Mockito.when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        Mockito.when(client.generatePresignedUrl(any(GeneratePresignedUrlRequest.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        String objectKey = storage.upload(file);
        storage.resolveUrl(objectKey);
        Mockito.verify(client, Mockito.never()).setObjectAcl(eq("bucket"), anyString(), any());
        Mockito.verify(client).generatePresignedUrl(any(GeneratePresignedUrlRequest.class));
    }

    @Test
    void generateUrlWithSecurityToken() throws Exception {
        OssProperties props = new OssProperties();
        props.setEndpoint("https://oss-cn-beijing.aliyuncs.com");
        props.setBucket("bucket");
        props.setAccessKeyId("id");
        props.setAccessKeySecret("secret");
        props.setSecurityToken("token");
        props.setAvatarDir("avatars/");
        props.setPublicRead(false);

        OSS client = Mockito.mock(OSS.class);
        OssAvatarStorage storage = new OssAvatarStorage(client, props);
        Mockito.when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        Mockito.when(client.generatePresignedUrl(any(GeneratePresignedUrlRequest.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        String objectKey = storage.upload(file);
        storage.resolveUrl(objectKey);
        Mockito.verify(client, Mockito.never()).setObjectAcl(eq("bucket"), anyString(), any());
        Mockito.verify(client).generatePresignedUrl(any(GeneratePresignedUrlRequest.class));
    }
}
