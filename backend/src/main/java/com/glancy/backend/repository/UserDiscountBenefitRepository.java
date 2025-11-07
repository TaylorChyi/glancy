package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.UserDiscountBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface UserDiscountBenefitRepository extends JpaRepository<UserDiscountBenefit, Long> {}
