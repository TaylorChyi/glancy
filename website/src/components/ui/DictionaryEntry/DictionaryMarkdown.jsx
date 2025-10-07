import { useMemo } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import MarkdownStream from "@/components/ui/MarkdownStream";
import { STREAM_SEGMENTATION_PROP } from "@/components/ui/MarkdownStream/streamSegmentationProp.js";
import styles from "./DictionaryMarkdown.module.css";

function joinClassNames(...tokens) {
  return tokens.filter(Boolean).join(" ");
}

const headingFactory = (level) => {
  const className =
    level === 1
      ? styles["heading-primary"]
      : level === 2
        ? styles["heading-secondary"]
        : styles["heading-tertiary"];
  return function Heading({ className: incoming, children, ...props }) {
    const Tag = `h${level}`;
    return (
      <Tag
        {...props}
        className={joinClassNames(className, styles.heading, incoming)}
      >
        {children}
      </Tag>
    );
  };
};

const dictionaryMarkdownComponents = {
  h1: headingFactory(1),
  h2: headingFactory(2),
  h3: headingFactory(3),
  h4: headingFactory(4),
  h5: headingFactory(5),
  h6: headingFactory(6),
  p({ className, children, ...props }) {
    return (
      <p {...props} className={joinClassNames(styles.paragraph, className)}>
        {children}
      </p>
    );
  },
  ol({ className, children, ...props }) {
    return (
      <ol
        {...props}
        className={joinClassNames(styles["ordered-list"], className)}
      >
        {children}
      </ol>
    );
  },
  ul({ className, children, ...props }) {
    return (
      <ul
        {...props}
        className={joinClassNames(styles["unordered-list"], className)}
      >
        {children}
      </ul>
    );
  },
  li({ className, children, ...props }) {
    return (
      <li {...props} className={joinClassNames(styles["list-item"], className)}>
        {children}
      </li>
    );
  },
  blockquote({ className, children, ...props }) {
    return (
      <blockquote
        {...props}
        className={joinClassNames(styles.blockquote, className)}
      >
        {children}
      </blockquote>
    );
  },
  strong({ className, children, ...props }) {
    return (
      <strong {...props} className={joinClassNames(styles.strong, className)}>
        {children}
      </strong>
    );
  },
  em({ className, children, ...props }) {
    return (
      <em {...props} className={joinClassNames(styles.emphasis, className)}>
        {children}
      </em>
    );
  },
  code({ className, children, ...props }) {
    return (
      <code {...props} className={joinClassNames(styles.code, className)}>
        {children}
      </code>
    );
  },
  hr({ className, ...props }) {
    return (
      <hr {...props} className={joinClassNames(styles.divider, className)} />
    );
  },
};

export default function DictionaryMarkdown({ children, className }) {
  if (!children) return null;
  const wrapperClassName = joinClassNames(styles.wrapper, className);
  return (
    <div className={wrapperClassName}>
      <MarkdownRenderer components={dictionaryMarkdownComponents}>
        {children}
      </MarkdownRenderer>
    </div>
  );
}

function createDictionaryMarkdownStreamRenderer(additionalClassName) {
  return function DictionaryMarkdownStreamRenderer({
    className,
    children,
    ...rendererProps
  }) {
    const wrapperClassName = joinClassNames(
      styles.wrapper,
      additionalClassName,
      className,
    );
    const streamRenderer = (
      <div className={wrapperClassName}>
        <MarkdownRenderer
          {...rendererProps}
          components={dictionaryMarkdownComponents}
        >
          {children}
        </MarkdownRenderer>
      </div>
    );
    return streamRenderer;
  };
}

export function DictionaryMarkdownStream({ text, className }) {
  const Renderer = useMemo(() => {
    const renderer = createDictionaryMarkdownStreamRenderer(className);
    renderer[STREAM_SEGMENTATION_PROP] = true;
    return renderer;
  }, [className]);

  if (!text) return null;

  return <MarkdownStream text={text} renderer={Renderer} />;
}
