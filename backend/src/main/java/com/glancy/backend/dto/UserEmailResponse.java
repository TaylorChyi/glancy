package com.glancy.backend.dto;

/**
 * 返回用户当前绑定邮箱的响应体。
 */
public record UserEmailResponse(/** 用户当前绑定的邮箱，未绑定时为 null。 */ String email) {}
