package com.glancy.backend.dto;

import lombok.Data;

/**
 * Encapsulates the login identifier text and its resolved type.
 */
@Data
public class LoginIdentifier {

    /**
     * Supported identifier types.
     */
    public enum Type {
        USERNAME,
        EMAIL,
        PHONE,
    }

    /** Identifier type, may be null if not provided. */
    private Type type;

    /** Raw identifier text entered by the user. */
    private String text;

    /**
     * Attempt to resolve the identifier type from the raw text.
     *
     * @param raw the raw identifier text
     * @return the detected type or USERNAME as default
     */
    public static Type resolveType(String raw) {
        if (raw == null) {
            return null;
        }
        if (raw.contains("@") && raw.contains(".")) {
            return Type.EMAIL;
        }
        if (raw.matches("^\\+?\\d+$")) {
            return Type.PHONE;
        }
        return Type.USERNAME;
    }
}
