package com.glancy.backend.llm.service;

/**
 * 背景： - Prompt 片段此前存储在磁盘文本文件中，运行期频繁读取导致 IO 开销且不利于版本化管理。 目的： - 以集中常量类的形式管理所有词典 Prompt 文本，实现零磁盘读写并便于
 * IDE 级检索与重构。 关键决策与取舍： - 直接使用 Java Text Block 表达多行模板，避免手工拼接换行符；调用方以常量引用确保唯一来源。 影响范围： -
 * 模板渲染逻辑改为依赖内存常量，删除类路径资源文件，部署包体积略有下降。 演进与TODO： - 若后续需要多版本或动态模板，可在此类增加命名空间或配置化加载能力。
 */
public final class WordPromptTemplateConstants {

    private WordPromptTemplateConstants() {}

    public static final String PERSONA_BASE =
            """
        你正在为{{personaDescriptor}}提供词汇讲解{{toneClause}}{{goalClause}}{{interestsClause}}。
        """;

    public static final String PERSONA_TONE_CLAUSE = """
        ，请保持{{tone}}的语气
        """;

    public static final String PERSONA_GOAL_CLAUSE = """
        ，学习目标是{{goal}}
        """;

    public static final String PERSONA_INTERESTS_CLAUSE = """
        ，关注领域包含{{interests}}
        """;

    public static final String USER_CHINESE_PAYLOAD =
            """
        查询词汇：{{term}}
        条目结构定位：{{entryType}}
        写作指引：{{entryGuidance}}
        结构要求：{{structureRequirement}}
        {{recentTermsSection}}{{goalSection}}{{toneDirective}}
        """;

    public static final String USER_ENGLISH_PAYLOAD =
            """
        查询词汇：{{term}}
        结构要求：{{structureRequirement}}
        {{recentTermsSection}}{{goalSection}}{{toneDirective}}
        """;

    public static final String USER_RECENT_TERMS = """
        近期检索：{{terms}}
        """;

    public static final String USER_GOAL = """
        学习目标：{{goal}}
        """;

    public static final String TONE_ENGLISH_DEFAULT =
            """
        请保持语气亲切且专业，所有内容须使用英文。
        请确保释义、用法说明与示例完整。
        """;

    public static final String TONE_ENGLISH_PERSONALIZED = """
        请结合画像输出结构化释义与语义差异（英文表达）。
        """;

    public static final String TONE_CHINESE_DEFAULT = """
        请保持语气亲切且专业，使用中文完成所有章节，确保释义、用法说明与示例完整。
        """;

    public static final String TONE_CHINESE_PERSONALIZED = """
        请结合画像输出结构化释义与语义差异（中文表达）。
        """;

    public static final String TONE_BILINGUAL_DEFAULT = """
        请确保释义、用法说明与示例完整。
        """;

    public static final String TONE_BILINGUAL_PERSONALIZED = """
        请结合画像输出结构化释义与语义差异。
        """;

    public static final String TONE_NEUTRAL_DEFAULT = """
        请确保释义、用法说明与示例完整。
        """;

    public static final String TONE_NEUTRAL_PERSONALIZED = """
        请结合画像输出结构化释义与语义差异。
        """;

    public static final String FLAVOR_ENGLISH_MONOLINGUAL =
            """
        你正在输出高端英语词典条目，请严格使用英文完成所有章节，避免出现任何中文或翻译提示。
        """;

    public static final String FLAVOR_ENGLISH_BILINGUAL =
            """
        请确保每个章节都提供精准的中文译文与注释，让读者能在英语释义旁同步获得优雅的中文理解。
        """;

    public static final String FLAVOR_CHINESE_MONOLINGUAL =
            """
        你正在为高级中文辞书撰写条目，请全程使用中文呈现所有章节，避免加入英文解释或翻译。
        """;

    public static final String STRUCTURE_CHINESE_MONOLINGUAL =
            """
        请以中文为主线编写释义、例句与用法说明，遵循模板并以 <END> 收尾。
        """;

    public static final String STRUCTURE_CHINESE_BILINGUAL =
            """
        请以英文释义为主，配套中文例句与 English Rendering，对齐模板并以 <END> 收尾。
        """;

    public static final String STRUCTURE_ENGLISH_MONOLINGUAL =
            """
        保持模板的分层释义、例句与语法说明，并以 <END> 结尾。
        输出语言：仅使用英文完成释义、例句与所有说明，严禁出现中文或其他语言翻译。
        """;

    public static final String STRUCTURE_ENGLISH_BILINGUAL = """
        保持模板的分层释义、例句与语法说明，并以 <END> 结尾。
        """;

    public static final String ENTRY_LABEL_DEFAULT = """
        General Entry
        """;

    public static final String ENTRY_GUIDANCE_DEFAULT = """
        请按照标准词典条目结构给出释义、搭配与示例。
        """;

    public static final String ENTRY_LABEL_CHINESE_SINGLE = """
        Single Character
        """;

    public static final String ENTRY_LABEL_CHINESE_MULTI = """
        Multi-character Word
        """;

    public static final String ENTRY_GUIDANCE_CHINESE_SINGLE = """
        请拆解字源、构形与历史演变，再补充当代主流义项与用例。
        """;

    public static final String ENTRY_GUIDANCE_CHINESE_MULTI = """
        标准汉语词语，请分层呈现核心义项与常见搭配。
        """;

    public static final String ENTRY_GUIDANCE_CHINESE_MIXED =
            """
        含汉字与其他符号混写，需补充借词背景，同时仍按词语结构组织英文释义。
        """;

    public static final String ENTRY_GUIDANCE_CHINESE_NON_HAN =
            """
        包含非汉字字符，请解释其在中文语境中的意义来源，并提供英文释义。
        """;

    public static final String ENTRY_GUIDANCE_CHINESE_UNKNOWN = """
        未识别输入，按常规汉语词语处理，突出现代义项与搭配。
        """;
}
