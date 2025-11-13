package com.glancy.backend.repository;

import com.glancy.backend.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Accessor for {@link Notification} entities used by notification services. */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findBySystemLevelTrue();

    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findBySystemLevelTrueOrderByCreatedAtDesc();
}
