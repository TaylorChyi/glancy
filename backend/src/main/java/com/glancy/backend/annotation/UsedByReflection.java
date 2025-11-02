/**
 * 背景：
 *  - 引入基于调用图的不可达检测后，部分依赖框架反射或运行时代理调用的方法会被误报。
 * 目的：
 *  - 提供显式白名单注解，标记那些虽无静态调用路径但由框架或配置在运行时访问的代码单元。
 * 关键决策与取舍：
 *  - 选择声明注解而非集中维护外部名单，保持标记与代码共存以便维护者理解上下文；
 *  - 支持作用于类、方法、构造器与字段，覆盖序列化、AOP 切面、配置绑定等常见反射入口。
 * 影响范围：
 *  - jQAssistant 的“不可达”约束会跳过被该注解标记的节点；CI 报告将引用此注解解释豁免理由。
 * 演进与TODO：
 *  - 若后续需要细分反射来源，可扩展属性以注明来源组件或使用场景。
 */
package com.glancy.backend.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 意图：为反射访问的代码提供显式标记，帮助静态分析识别白名单。
 * 输入：无显式输入。
 * 输出：标记元信息供 jQAssistant 与其他静态扫描工具使用。
 * 流程：
 *  1) 开发者在需要保留的成员上添加本注解；
 *  2) 静态分析规则遇到注解后跳过违规判定；
 *  3) CI 报告保留上下文信息，供审核者确认合理性。
 * 错误处理：注解为元信息，不涉及运行时异常处理。
 * 复杂度：O(1)。
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.TYPE, ElementType.FIELD, ElementType.METHOD, ElementType.CONSTRUCTOR })
public @interface UsedByReflection {}
