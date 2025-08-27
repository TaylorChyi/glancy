package com.glancy.backend.config;

import java.util.Arrays;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * A cross-cutting concern that logs all public methods within the service layer. By centralizing
 * this logic we keep service classes focused on business behaviour while still providing consistent
 * observability across the application.
 */
@Aspect
@Component
public class ServiceLoggingAspect {

  @Around("execution(public * com.glancy.backend.service..*(..))")
  public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
    long start = System.currentTimeMillis();
    Object result = joinPoint.proceed();
    long duration = System.currentTimeMillis() - start;

    Logger logger = LoggerFactory.getLogger(joinPoint.getTarget().getClass());
    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    String args = Arrays.toString(joinPoint.getArgs());
    String returnValue =
        signature.getReturnType().equals(Void.TYPE) ? "void" : String.valueOf(result);

    logger.info(
        "Service method {}.{} called with args {} returned {} in {}ms",
        signature.getDeclaringType().getSimpleName(),
        signature.getName(),
        args,
        returnValue,
        duration);

    return result;
  }
}
