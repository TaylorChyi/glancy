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
        Map<String, Object> params = buildParameterMap(signature, joinPoint.getArgs());
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
        if (names == null && args != null) {
            names = IntStream.range(0, args.length)
                .mapToObj(i -> "arg" + i)
                .toArray(String[]::new);
        }
        return names;
    }

    private Map<String, Object> buildParameterMap(MethodSignature signature, Object[] args) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (args == null) {
            return params;
        }
        String[] paramNames = resolveParameterNames(signature, args);
        int nameLength = paramNames != null ? paramNames.length : 0;
        if (paramNames != null && nameLength != args.length) {
            log.debug("Parameter name count {} does not match argument count {}", nameLength, args.length);
        }
        for (int i = 0; i < args.length; i++) {
            params.put(resolveParamName(paramNames, nameLength, i), args[i]);
        }
        return params;
    }

    private String resolveParamName(String[] paramNames, int nameLength, int index) {
        if (paramNames != null && index < nameLength) {
            return paramNames[index];
        }
        return "arg" + index;
    }
}
