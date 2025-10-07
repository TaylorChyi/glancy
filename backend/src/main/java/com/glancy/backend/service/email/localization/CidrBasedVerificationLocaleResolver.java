package com.glancy.backend.service.email.localization;

import com.glancy.backend.config.EmailVerificationProperties;
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 需要通过 IP 地址快速推导验证码邮件的语言环境，避免在业务层写死条件。
 * 目的：
 *  - 基于配置的 CIDR 列表实现语言解析策略，支持 IPv4/IPv6 并提供默认回退。
 * 关键决策与取舍：
 *  - 采用 BigInteger 统一处理两类地址，避免引入额外依赖；
 *  - 配置驱动，便于在无需发版的情况下调整地理映射；
 *  - 对解析失败场景写日志并降级为默认语言，保证主流程可用性。
 * 影响范围：
 *  - 邮件验证码本地化策略；依赖配置项 `mail.verification.localization`。
 * 演进与TODO：
 *  - 后续可增加缓存或外部 GeoIP 数据源，以覆盖更细粒度的地理信息。
 */
@Slf4j
@Component
public class CidrBasedVerificationLocaleResolver implements VerificationLocaleResolver {

    private final Locale defaultLocale;
    private final List<ResolvedRule> rules;

    public CidrBasedVerificationLocaleResolver(EmailVerificationProperties properties) {
        Objects.requireNonNull(properties, "properties");
        EmailVerificationProperties.Localization localization = properties.getLocalization();
        this.defaultLocale = Locale.forLanguageTag(localization.getDefaultLanguageTag());
        this.rules = new ArrayList<>();
        for (EmailVerificationProperties.Localization.Rule rule : localization.getRules()) {
            this.rules.add(ResolvedRule.from(rule));
        }
    }

    @Override
    public Locale resolve(String clientIp) {
        if (!StringUtils.hasText(clientIp)) {
            return defaultLocale;
        }
        for (ResolvedRule rule : rules) {
            if (rule.matches(clientIp)) {
                return rule.locale();
            }
        }
        return defaultLocale;
    }

    private record ResolvedRule(CidrBlock block, Locale locale) {
        private static ResolvedRule from(EmailVerificationProperties.Localization.Rule rule) {
            Locale locale = Locale.forLanguageTag(rule.getLanguageTag());
            return new ResolvedRule(CidrBlock.parse(rule.getCidr()), locale);
        }

        private boolean matches(String candidate) {
            return block.contains(candidate);
        }
    }

    private record CidrBlock(BigInteger network, BigInteger mask, int totalBits) {
        private static final BigInteger MAX_IPV4 = BigInteger.ONE.shiftLeft(32).subtract(BigInteger.ONE);

        private static CidrBlock parse(String cidr) {
            String[] parts = cidr.split("/");
            if (parts.length != 2) {
                throw new IllegalStateException("Invalid CIDR expression: " + cidr);
            }
            InetAddress address = parseAddress(parts[0], cidr);
            int prefixLength = parsePrefix(parts[1], address.getAddress().length * 8, cidr);
            BigInteger base = new BigInteger(1, address.getAddress());
            int totalBits = address.getAddress().length * 8;
            BigInteger mask = prefixLength == 0
                ? BigInteger.ZERO
                : BigInteger.ONE.shiftLeft(prefixLength).subtract(BigInteger.ONE).shiftLeft(totalBits - prefixLength);
            BigInteger network = base.and(mask);
            return new CidrBlock(network, mask, totalBits);
        }

        private static InetAddress parseAddress(String value, String cidr) {
            try {
                InetAddress address = InetAddress.getByName(value);
                if (address.getAddress().length != 4 && address.getAddress().length != 16) {
                    throw new IllegalStateException("Unsupported IP length for CIDR " + cidr);
                }
                return address;
            } catch (UnknownHostException ex) {
                throw new IllegalStateException("Invalid IP address in CIDR " + cidr, ex);
            }
        }

        private static int parsePrefix(String prefix, int totalBits, String cidr) {
            try {
                int parsed = Integer.parseInt(prefix);
                if (parsed < 0 || parsed > totalBits) {
                    throw new IllegalStateException("CIDR prefix out of range in " + cidr);
                }
                return parsed;
            } catch (NumberFormatException ex) {
                throw new IllegalStateException("Invalid CIDR prefix in " + cidr, ex);
            }
        }

        private boolean contains(String ip) {
            Optional<BigInteger> candidate = toBigInteger(ip);
            if (candidate.isEmpty()) {
                log.warn("无法解析 IP {}，回退默认语言", ip);
                return false;
            }
            BigInteger normalized = candidate.get();
            if (totalBits == 32 && normalized.compareTo(MAX_IPV4) > 0) {
                // IPv4-mapped IPv6 need to be trimmed。
                normalized = normalized.and(MAX_IPV4);
            }
            return normalized.and(mask).equals(network);
        }

        private Optional<BigInteger> toBigInteger(String ip) {
            try {
                InetAddress address = InetAddress.getByName(ip);
                byte[] bytes = address.getAddress();
                return Optional.of(new BigInteger(1, bytes));
            } catch (UnknownHostException ex) {
                return Optional.empty();
            }
        }
    }
}
