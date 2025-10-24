package com.glancy.backend.config.logging;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.IntStream;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.stereotype.Component;

/**
 * Aspect that logs controller method entry and exit using structured logging.
 */
@Aspect
@Component
public class ControllerLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(ControllerLoggingAspect.class);

    private final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String method = signature.getDeclaringType().getSimpleName() + "." + signature.getName();
        Object[] args = joinPoint.getArgs();
        String[] paramNames = resolveParameterNames(signature, args);
        Map<String, Object> params = new LinkedHashMap<>();
        if (args != null) {
            int nameLength = paramNames.length;
            if (nameLength != args.length) {
                log.debug("Parameter name count {} does not match argument count {}", nameLength, args.length);
            }
            for (int i = 0; i < args.length; i++) {
                String candidate = (i < nameLength) ? paramNames[i] : null;
                String resolved = (candidate == null || candidate.isBlank()) ? "arg" + i : candidate;
                params.put(resolved, args[i]);
            }
        }
        log.info("controller.entry method={} params={}", method, params);
        try {
            Object result = joinPoint.proceed();
            log.info("controller.exit method={} result={}", method, result);
            return result;
        } catch (Throwable ex) {
            log.error("controller.error method={} message={}", method, ex.getMessage(), ex);
            throw ex;
        }
    }

    private String[] resolveParameterNames(MethodSignature signature, Object[] args) {
        String[] names = signature.getParameterNames();
        if (names == null) {
            names = parameterNameDiscoverer.getParameterNames(signature.getMethod());
        }
        if (names != null) {
            return names;
        }
        int argLength = args != null ? args.length : 0;
        if (argLength == 0) {
            return new String[0];
        }
        return IntStream.range(0, argLength)
            .mapToObj(i -> "arg" + i)
            .toArray(String[]::new);
    }
}
