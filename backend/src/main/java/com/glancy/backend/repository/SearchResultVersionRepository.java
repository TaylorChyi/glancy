package com.glancy.backend.repository;

import com.glancy.backend.entity.SearchResultVersion;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository storing immutable snapshots of dictionary search results.
 */
@Repository
public interface SearchResultVersionRepository extends JpaRepository<SearchResultVersion, Long> {
    List<SearchResultVersion> findBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(Long searchRecordId);

    Optional<SearchResultVersion> findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(Long searchRecordId);

    Optional<SearchResultVersion> findByIdAndSearchRecordIdAndDeletedFalse(Long id, Long searchRecordId);

    List<SearchResultVersion> findBySearchRecordIdInAndDeletedFalseOrderBySearchRecordIdAscVersionNumberDesc(
        Collection<Long> recordIds
    );

    @Modifying(clearAutomatically = true)
    @Query(
        "update SearchResultVersion v set v.deleted = true where v.searchRecord.id = :recordId and v.deleted = false"
    )
    int softDeleteBySearchRecordId(Long recordId);

    @Modifying(clearAutomatically = true)
    @Query(
        "update SearchResultVersion v set v.deleted = true " +
        "where v.searchRecord.id in (:recordIds) and v.deleted = false"
    )
    int softDeleteBySearchRecordIdIn(Collection<Long> recordIds);
}
