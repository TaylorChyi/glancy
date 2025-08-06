package com.glancy.backend.repository;

import com.glancy.backend.entity.LoginDevice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository tracking devices used for user logins.
 */
@Repository
public interface LoginDeviceRepository extends JpaRepository<LoginDevice, Long> {
    List<LoginDevice> findByUserIdOrderByLoginTimeAsc(Long userId);
}
