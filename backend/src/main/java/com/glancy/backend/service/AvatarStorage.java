package com.glancy.backend.service;

import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

/** Strategy interface for storing avatar images. */
public interface AvatarStorage {
  /** Upload the avatar file and return the object key inside the OSS bucket. */
  String upload(MultipartFile file) throws IOException;

  /** Resolve the externally accessible URL for the provided object key. */
  String resolveUrl(String objectKey);
}
