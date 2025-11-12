package com.glancy.backend.service.personalization;

import java.util.Optional;

interface PersonaClassifier {
    Optional<PersonaProfile> classify(PersonaInput input);
}
