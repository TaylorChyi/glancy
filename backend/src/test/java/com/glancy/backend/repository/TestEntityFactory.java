package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.ThirdPartyAccount;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.entity.Word;
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
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return user;
    }

    static SearchRecord searchRecord(User user, String term, Language language, LocalDateTime createdAt) {
        SearchRecord record = new SearchRecord();
        record.setUser(user);
        record.setTerm(term);
        record.setLanguage(language);
        record.setFlavor(DictionaryFlavor.BILINGUAL);
        record.setCreatedAt(createdAt);
        record.setUpdatedAt(createdAt);
        return record;
    }

    static Word word(String term, Language language) {
        Word word = new Word();
        word.setTerm(term);
        word.setNormalizedTerm(term.toLowerCase());
        word.setLanguage(language);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(Collections.singletonList("def"));
        return word;
    }

    static LoginDevice loginDevice(User user, String device, LocalDateTime time) {
        LoginDevice deviceEntity = new LoginDevice();
        deviceEntity.setUser(user);
        deviceEntity.setDeviceInfo(device);
        deviceEntity.setLoginTime(time);
        return deviceEntity;
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
