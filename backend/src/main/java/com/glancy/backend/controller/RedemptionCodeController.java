package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.redemption.RedemptionCodeCreateRequest;
import com.glancy.backend.dto.redemption.RedemptionCodeResponse;
import com.glancy.backend.dto.redemption.RedemptionRedeemRequest;
import com.glancy.backend.dto.redemption.RedemptionRedeemResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.redemption.RedemptionCodeService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@Slf4j
@RestController
@RequestMapping("/api/redemption-codes")
public class RedemptionCodeController {

    private final RedemptionCodeService redemptionCodeService;

    public RedemptionCodeController(RedemptionCodeService redemptionCodeService) {
        this.redemptionCodeService = redemptionCodeService;
    }

    /**
     * 意图：创建兑换码配置。
     */
    @PostMapping
    public ResponseEntity<RedemptionCodeResponse> createCode(@Valid @RequestBody RedemptionCodeCreateRequest request) {
        log.info("Creating redemption code {}", request.code());
        RedemptionCodeResponse response = redemptionCodeService.createCode(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * 意图：根据编码获取兑换码详情。
     */
    @GetMapping("/{code}")
    public ResponseEntity<RedemptionCodeResponse> findByCode(@PathVariable("code") String code) {
        log.info("Fetching redemption code {}", code);
        RedemptionCodeResponse response = redemptionCodeService.findByCode(code);
        return ResponseEntity.ok(response);
    }

    /**
     * 意图：执行兑换流程。
     */
    @PostMapping("/redeem")
    public ResponseEntity<RedemptionRedeemResponse> redeem(
        @AuthenticatedUser User user,
        @Valid @RequestBody RedemptionRedeemRequest request
    ) {
        log.info("User {} redeeming code {}", user.getId(), request.code());
        RedemptionRedeemResponse response = redemptionCodeService.redeem(user.getId(), request);
        return ResponseEntity.ok(response);
    }
}
