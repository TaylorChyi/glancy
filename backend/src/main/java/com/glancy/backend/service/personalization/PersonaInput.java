package com.glancy.backend.service.personalization;

record PersonaInput(String job, Integer dailyWordTarget, String goal, String futurePlan) {
  static PersonaInput empty() {
    return new PersonaInput(null, null, null, null);
  }
}
