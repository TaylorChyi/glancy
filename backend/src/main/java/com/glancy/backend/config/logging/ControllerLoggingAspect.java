package com.glancy.backend.config.logging;

import java.util.LinkedHashMap;
import java.util.Map;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Aspect that logs controller method entry and exit using structured logging. */
@Aspect
@Component
public class ControllerLoggingAspect {

  private static final Logger log = LoggerFactory.getLogger(ControllerLoggingAspect.class);

  @Around("within(@org.springframework.web.bind.annotation.RestController *)")
  public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    String method = signature.getDeclaringType().getSimpleName() + "." + signature.getName();
    String[] paramNames = signature.getParameterNames();
    Object[] args = joinPoint.getArgs();
    Map<String, Object> params = new LinkedHashMap<>();
    for (int i = 0; i < paramNames.length; i++) {
      params.put(paramNames[i], args[i]);
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
}
