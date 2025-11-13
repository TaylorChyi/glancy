package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Aggregated statistics about user accounts. */
@Data
@AllArgsConstructor
public class UserStatisticsResponse {

    private long totalUsers;
    private long memberUsers;
    private long deletedUsers;
}
