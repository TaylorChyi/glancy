package com.glancy.backend.service;

import com.glancy.backend.dto.ContactRequest;
import com.glancy.backend.dto.ContactResponse;
import com.glancy.backend.entity.ContactMessage;
import com.glancy.backend.repository.ContactMessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles persistence of contact messages sent from the front-end
 * contact form.
 */
@Slf4j
@Service
public class ContactService {

    private final ContactMessageRepository contactMessageRepository;

    public ContactService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    /**
     * Save an incoming contact message.
     */
    @Transactional
    public ContactResponse submit(ContactRequest request) {
        log.info("Submitting contact message from {}", request.getEmail());
        ContactMessage message = new ContactMessage();
        message.setName(request.getName());
        message.setEmail(request.getEmail());
        message.setMessage(request.getMessage());
        ContactMessage saved = contactMessageRepository.save(message);
        return new ContactResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getMessage());
    }
}
