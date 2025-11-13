package com.glancy.backend.repository;

import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository for {@link User} entities with helpers to check unique fields. */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndDeletedFalse(String username);

    Optional<User> findByEmailAndDeletedFalse(String email);

    Optional<User> findByPhoneAndDeletedFalse(String phone);

    long countByDeletedTrue();

    long countByDeletedFalse();

    @Query("SELECT COUNT(u) FROM User u "
            + "WHERE u.deleted = false AND u.membershipType <> 'NONE' "
            + "AND (u.membershipExpiresAt IS NULL OR u.membershipExpiresAt > :moment)")
    long countActiveMembers(@Param("moment") LocalDateTime moment);

    long countByDeletedFalseAndLastLoginAtAfter(LocalDateTime time);

    Optional<User> findByLoginToken(String loginToken);
}
