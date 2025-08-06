package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.GeneratePresignedUrlRequest;
import com.glancy.backend.config.OssProperties;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Simple tests for OssAvatarStorage.
 */
class OssAvatarStorageTest {

    /**
     * 测试 uploadWithoutClientThrows 接口
     */
    @Test
    void uploadWithoutClientThrows() {
        OssProperties props = new OssProperties();
        props.setEndpoint("https://oss-cn-beijing.aliyuncs.com");
        props.setBucket("bucket");
        props.setAccessKeyId("");
        props.setAccessKeySecret("");
        props.setAvatarDir("avatars/");
        OssAvatarStorage storage = new OssAvatarStorage(props);
        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        assertThrows(IllegalStateException.class, () -> storage.upload(file));
    }

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

        OssAvatarStorage storage = new OssAvatarStorage(props);

        OSS client = mock(OSS.class);
        when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        OSSException ex = new OSSException("AccessDenied");
        doThrow(ex).when(client).setObjectAcl(eq("bucket"), anyString(), eq(CannedAccessControlList.PublicRead));
        when(client.generatePresignedUrl(eq("bucket"), anyString(), any(Date.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        var field = OssAvatarStorage.class.getDeclaredField("ossClient");
        field.setAccessible(true);
        field.set(storage, client);

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        storage.upload(file);
        verify(client).setObjectAcl(eq("bucket"), anyString(), eq(CannedAccessControlList.PublicRead));
        verify(client).generatePresignedUrl(eq("bucket"), anyString(), any(Date.class));
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

        OssAvatarStorage storage = new OssAvatarStorage(props);

        OSS client = mock(OSS.class);
        when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        when(client.generatePresignedUrl(eq("bucket"), anyString(), any(Date.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        var field = OssAvatarStorage.class.getDeclaredField("ossClient");
        field.setAccessible(true);
        field.set(storage, client);

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        storage.upload(file);
        verify(client, never()).setObjectAcl(eq("bucket"), anyString(), any());
        verify(client).generatePresignedUrl(eq("bucket"), anyString(), any(Date.class));
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

        OssAvatarStorage storage = new OssAvatarStorage(props);

        OSS client = mock(OSS.class);
        when(client.putObject(eq("bucket"), anyString(), any(java.io.InputStream.class))).thenReturn(null);
        when(client.generatePresignedUrl(any(GeneratePresignedUrlRequest.class))).thenReturn(
            new java.net.URL("https://example.com")
        );

        var field = OssAvatarStorage.class.getDeclaredField("ossClient");
        field.setAccessible(true);
        field.set(storage, client);

        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "data".getBytes());
        storage.upload(file);
        verify(client, never()).setObjectAcl(eq("bucket"), anyString(), any());
        verify(client).generatePresignedUrl(any(GeneratePresignedUrlRequest.class));
    }
}
