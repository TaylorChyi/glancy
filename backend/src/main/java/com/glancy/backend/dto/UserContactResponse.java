package com.glancy.backend.dto;

/** 返回用户最新的联系方式。 */
public record UserContactResponse(
    /** 已更新的用户邮箱。 */
    String email,
    /** 已更新的用户手机号。 */
    String phone) {}
