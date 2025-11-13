package com.glancy.backend.service.personalization;

import org.springframework.util.StringUtils;

record PersonaProfile(String descriptor, String audience, String preferredTone, boolean derivedFromProfile) {
    PersonaProfile {
        descriptor = normalizeField(descriptor, "保持好奇的学习者");
        audience = normalizeField(audience, "身边的朋友");
        preferredTone = normalizeField(preferredTone, "温和而自信");
    }

    private static String normalizeField(String candidate, String fallback) {
        return StringUtils.hasText(candidate) ? candidate.trim() : fallback;
    }

    static PersonaProfile fallback() {
        return new PersonaProfile("保持好奇的学习者", "身边的朋友", "温和而自信", false);
    }
}
