package com.kohub.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 현재 인증된 사용자 정보를 주입받기 위한 어노테이션
 * 
 * 사용 예:
 * <pre>
 * @GetMapping("/me")
 * public UserResponse getMe(@CurrentUser AuthenticatedUser user) {
 *     return userService.getById(user.getUserId());
 * }
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {
}
