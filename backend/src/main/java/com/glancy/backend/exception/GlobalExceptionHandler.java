package com.glancy.backend.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.config.security.TokenTraceFilter;
import com.glancy.backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Handles application exceptions and logs them.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ObjectMapper mapper;
    private final HttpStatusAwareErrorMessageResolver messageResolver;

    @Autowired
    public GlobalExceptionHandler(ObjectMapper mapper) {
        this(mapper, HttpStatusAwareErrorMessageResolver.defaultResolver());
    }

    GlobalExceptionHandler(ObjectMapper mapper, HttpStatusAwareErrorMessageResolver messageResolver) {
        this.mapper = mapper;
        this.messageResolver = messageResolver;
    }

    private boolean isSseRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return false;
        }
        String accept = attrs.getRequest().getHeader(HttpHeaders.ACCEPT);
        return accept != null && accept.contains(MediaType.TEXT_EVENT_STREAM_VALUE);
    }

    private ResponseEntity<?> buildResponse(Object body, HttpStatus status) {
        Object sanitizedBody = sanitizeBody(body, status);
        if (isSseRequest()) {
            try {
                String json = mapper.writeValueAsString(sanitizedBody);
                String event = "event: error\n" + "data: " + json + "\n\n";
                return ResponseEntity.status(status).contentType(MediaType.TEXT_EVENT_STREAM).body(event);
            } catch (JsonProcessingException e) {
                String fallback = "event: error\ndata: {\"message\":\"serialization error\"}\n\n";
                return ResponseEntity.status(status).contentType(MediaType.TEXT_EVENT_STREAM).body(fallback);
            }
        }
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(sanitizedBody);
    }

    private Object sanitizeBody(Object body, HttpStatus status) {
        if (body instanceof ErrorResponse error) {
            String sanitized = messageResolver.resolve(status, error.getMessage());
            if (!sanitized.equals(error.getMessage())) {
                return new ErrorResponse(sanitized);
            }
        }
        return body;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<?> handleDuplicate(DuplicateResourceException ex) {
        log.error("Duplicate resource: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<?> handleInvalidRequest(InvalidRequestException ex) {
        log.error("Invalid request: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException ex) {
        log.error("Unauthorized access: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusiness(BusinessException ex) {
        log.error("Business exception: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({ MethodArgumentNotValidException.class, ConstraintViolationException.class })
    public ResponseEntity<?> handleValidation(Exception ex) {
        String msg = "请求参数不合法";
        log.error(msg, ex);
        return buildResponse(new ErrorResponse(msg), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler({ QuotaExceededException.class, ForbiddenException.class })
    public ResponseEntity<?> handleForbidden(BusinessException ex) {
        log.error("Forbidden: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<?> handleRateLimit(RateLimitExceededException ex) {
        log.warn("Rate limit exceeded: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.TOO_MANY_REQUESTS);
    }

    @ExceptionHandler(TtsFailedException.class)
    public ResponseEntity<?> handleTtsFailure(TtsFailedException ex) {
        String msg = "TTS provider error: " + ex.getMessage();
        log.error(msg, ex);
        return buildResponse(new ErrorResponse(msg), HttpStatus.FAILED_DEPENDENCY);
    }

    @ExceptionHandler(ServiceDegradedException.class)
    public ResponseEntity<?> handleServiceDegraded(ServiceDegradedException ex) {
        log.error("Service degraded: {}", ex.getMessage());
        return buildResponse(new ErrorResponse(ex.getMessage()), HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<?> handleMissingParam(MissingServletRequestParameterException ex) {
        log.error("Missing request parameter: {}", ex.getParameterName());
        String msg = "Missing required parameter: " + ex.getParameterName();
        return buildResponse(new ErrorResponse(msg), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.error("Invalid parameter: {}", ex.getName());
        String msg = "Invalid value for parameter: " + ex.getName();
        return buildResponse(new ErrorResponse(msg), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSize(MaxUploadSizeExceededException ex) {
        log.error("File upload too large: {}", ex.getMessage());
        return buildResponse(new ErrorResponse("上传文件过大"), HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<?> handleNoHandler(NoHandlerFoundException ex, HttpServletRequest req) {
        String rid = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_REQUEST_ID));
        String tokenStatus = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_TOKEN_STATUS));
        log.warn(
            "RID={}, real-404, path={}, method={}, tokenStatus={}",
            rid,
            ex.getRequestURL(),
            ex.getHttpMethod(),
            tokenStatus
        );
        return buildResponse(Map.of("message", "未找到资源", "rid", rid), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleSpringNotFound(NoResourceFoundException ex, HttpServletRequest request) {
        log.error(
            "Resource not found: method={}, path={}, msg={}",
            request.getMethod(),
            request.getRequestURI(),
            ex.getMessage()
        );
        return buildResponse(new ErrorResponse("未找到资源"), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildResponse(new ErrorResponse("内部服务器错误"), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
