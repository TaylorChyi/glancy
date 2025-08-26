package com.glancy.backend.repository;

import com.glancy.backend.entity.ThirdPartyAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repository storing external authentication bindings for users. */
@Repository
public interface ThirdPartyAccountRepository extends JpaRepository<ThirdPartyAccount, Long> {
  Optional<ThirdPartyAccount> findByProviderAndExternalId(String provider, String externalId);
}
