package com.glancy.backend.repository;

import com.glancy.backend.entity.*;
import java.time.LocalDateTime;
import java.util.Collections;

/**
 * Helper factory creating test entities with sensible defaults.
 */
final class TestEntityFactory {

    private TestEntityFactory() {}

    static User user(int idx) {
        User user = new User();
        user.setUsername("user" + idx);
        user.setPassword("pass" + idx);
        user.setEmail("user" + idx + "@example.com");
        user.setPhone("1000" + idx);
        user.setMember(false);
        return user;
    }

    static SearchRecord searchRecord(User user, String term, Language language, LocalDateTime createdAt) {
        SearchRecord record = new SearchRecord();
        record.setUser(user);
        record.setTerm(term);
        record.setLanguage(language);
        record.setFlavor(DictionaryFlavor.BILINGUAL);
        record.setCreatedAt(createdAt);
        return record;
    }

    static Word word(String term, Language language) {
        Word word = new Word();
        word.setTerm(term);
        word.setLanguage(language);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(Collections.singletonList("def"));
        return word;
    }

    static Notification notification(User user, String msg, boolean system, LocalDateTime createdAt) {
        Notification n = new Notification();
        n.setUser(user);
        n.setMessage(msg);
        n.setSystemLevel(system);
        n.setCreatedAt(createdAt);
        return n;
    }

    static ContactMessage contactMessage(String name) {
        ContactMessage msg = new ContactMessage();
        msg.setName(name);
        msg.setEmail(name + "@example.com");
        msg.setMessage("hello");
        return msg;
    }

    static LoginDevice loginDevice(User user, String device, LocalDateTime time) {
        LoginDevice deviceEntity = new LoginDevice();
        deviceEntity.setUser(user);
        deviceEntity.setDeviceInfo(device);
        deviceEntity.setLoginTime(time);
        return deviceEntity;
    }

    static UserPreference userPreference(User user) {
        UserPreference pref = new UserPreference();
        pref.setUser(user);
        pref.setTheme("light");
        pref.setSystemLanguage("en");
        pref.setSearchLanguage("en");
        return pref;
    }

    static ThirdPartyAccount thirdPartyAccount(User user, String provider, String externalId) {
        ThirdPartyAccount tpa = new ThirdPartyAccount();
        tpa.setUser(user);
        tpa.setProvider(provider);
        tpa.setExternalId(externalId);
        return tpa;
    }

    static UserProfile userProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setJob("engineer");
        profile.setDailyWordTarget(30);
        return profile;
    }
}
