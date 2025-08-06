package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Data for creating a FAQ entry.
 */
@Data
public class FaqRequest {

    @NotBlank(message = "{validation.faq.question.notblank}")
    private String question;

    @NotBlank(message = "{validation.faq.answer.notblank}")
    private String answer;
}
