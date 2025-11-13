package com.glancy.backend.migration;

import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.support.AvatarReferenceResolver;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** One-off migration that converts legacy avatar URLs into pure OSS object keys. */
@Component
@Slf4j
public class AvatarDataMigration implements ApplicationRunner {

    private final UserRepository userRepository;
    private final AvatarReferenceResolver avatarReferenceResolver;
    private final TransactionTemplate transactionTemplate;

    public AvatarDataMigration(
            UserRepository userRepository,
            AvatarReferenceResolver avatarReferenceResolver,
            PlatformTransactionManager transactionManager) {
        this.userRepository = userRepository;
        this.avatarReferenceResolver = avatarReferenceResolver;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(ApplicationArguments args) {
        transactionTemplate.execute(status -> {
            migrateLegacyAvatars();
            return null;
        });
    }

    private void migrateLegacyAvatars() {
        List<User> users = userRepository.findAll();
        List<User> updated = new ArrayList<>();
        for (User user : users) {
            String avatar = user.getAvatar();
            if (avatar == null || avatar.isBlank()) {
                continue;
            }
            if (!avatarReferenceResolver.isFullUrl(avatar)) {
                continue;
            }
            Optional<String> normalized = avatarReferenceResolver.normalizeToObjectKey(avatar);
            if (normalized.isEmpty()) {
                log.warn("Unable to normalize avatar {} for user {}", avatar, user.getId());
                continue;
            }
            String objectKey = normalized.get();
            if (objectKey.equals(avatar)) {
                continue;
            }
            user.setAvatar(objectKey);
            updated.add(user);
        }
        if (!updated.isEmpty()) {
            userRepository.saveAll(updated);
            log.info("Migrated {} avatar references to OSS object keys", updated.size());
        } else {
            log.info("No avatar references required migration");
        }
    }
}
