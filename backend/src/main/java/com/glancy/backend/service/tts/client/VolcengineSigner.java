package com.glancy.backend.service.tts.client;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/** Utility to compute Volcengine authorization headers. */
final class VolcengineSigner {

    private static final DateTimeFormatter X_DATE_FORMAT =
        DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    private VolcengineSigner() {}

    static void sign(HttpHeaders headers, URI uri, String body, VolcengineTtsProperties props) {
        String xDate = X_DATE_FORMAT.format(Instant.now());
        String contentSha256 = sha256Hex(body);
        headers.set("X-Date", xDate);
        headers.set("X-Content-Sha256", contentSha256);

        String canonicalQuery = canonicalQuery(uri);
        String canonicalHeaders =
            "content-type:" + MediaType.APPLICATION_JSON_VALUE + "\n" +
            "host:" + uri.getHost() + "\n" +
            "x-content-sha256:" + contentSha256 + "\n" +
            "x-date:" + xDate + "\n";
        String signedHeaders = "content-type;host;x-content-sha256;x-date";
        String canonicalRequest =
            "POST\n" +
            uri.getPath() + "\n" +
            canonicalQuery + "\n" +
            canonicalHeaders + "\n" +
            signedHeaders + "\n" +
            contentSha256;

        String date = xDate.substring(0, 8);
        String credentialScope = String.join("/", Arrays.asList(date, props.getRegion(), props.getService(), "request"));
        String stringToSign =
            "HMAC-SHA256\n" +
            xDate + "\n" +
            credentialScope + "\n" +
            sha256Hex(canonicalRequest);

        byte[] signingKey =
            hmacSha256(
                hmacSha256(
                    hmacSha256(
                        hmacSha256(("VOLC" + props.getSecretKey()).getBytes(StandardCharsets.UTF_8), date),
                        props.getRegion()
                    ),
                    props.getService()
                ),
                "request"
            );
        String signature = bytesToHex(hmacSha256(signingKey, stringToSign));
        String authorization =
            String.format(
                "HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
                props.getAccessKeyId(),
                credentialScope,
                signedHeaders,
                signature
            );
        headers.set(HttpHeaders.AUTHORIZATION, authorization);
    }

    private static String canonicalQuery(URI uri) {
        String raw = uri.getRawQuery();
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        return Arrays.stream(raw.split("&")).sorted().collect(Collectors.joining("&"));
    }

    private static String sha256Hex(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return bytesToHex(md.digest(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] hmacSha256(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
