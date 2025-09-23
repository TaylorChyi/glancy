package com.glancy.backend.repository;

import com.glancy.backend.entity.SearchResultVersion;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SearchResultVersionRepository extends JpaRepository<SearchResultVersion, Long> {
    List<SearchResultVersion> findBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(Long searchRecordId);

    Optional<SearchResultVersion> findByIdAndDeletedFalse(Long id);

    Optional<SearchResultVersion> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    Optional<SearchResultVersion> findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(Long searchRecordId);

    @Modifying
    @Query("update SearchResultVersion v set v.deleted = true where v.searchRecord.id = :searchRecordId")
    void softDeleteBySearchRecordId(Long searchRecordId);

    @Modifying
    @Query("update SearchResultVersion v set v.deleted = true where v.searchRecord.id in :recordIds")
    void softDeleteBySearchRecordIds(Collection<Long> recordIds);
}
