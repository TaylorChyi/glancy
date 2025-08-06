package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.ContactMessage;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class ContactMessageRepositoryTest {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    @Test
    void saveAndFind() {
        ContactMessage msg = TestEntityFactory.contactMessage("alice");
        contactMessageRepository.save(msg);

        Optional<ContactMessage> found = contactMessageRepository.findById(msg.getId());
        assertTrue(found.isPresent());
        assertEquals("alice", found.get().getName());
    }
}
