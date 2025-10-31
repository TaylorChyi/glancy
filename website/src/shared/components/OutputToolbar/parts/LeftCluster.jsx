/**
 * 背景：
 *  - 工具栏左侧需按需组合语音与重播按钮，原实现内联在主组件导致层级臃肿。
 * 目的：
 *  - 提供单一职责的展示组件，承载左侧动作的渲染与可访问性语义。
 * 关键决策与取舍：
 *  - 采用展示组件 + 依赖注入（Strategy）方式接收 TTS 具体实现，确保未来可替换；
 *  - 不在组件内部持有状态，使其保持纯函数属性，便于测试。
 * 影响范围：
 *  - OutputToolbar 左侧按钮簇的渲染结构。
 * 演进与TODO：
 *  - 后续可扩展更多播放控制时，在此组件内部新增组合逻辑。
 */
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "../styles/index.js";

function LeftCluster({
  showTts,
  showReplay,
  ttsComponent,
  term,
  lang,
  speakableTerm,
  disabled,
  onReoutput,
  baseToolButtonClass,
  reoutputLabel,
}) {
  if (!showTts && !showReplay) {
    return null;
  }

  const TtsComponent = ttsComponent;

  return (
    <div className={styles["left-cluster"]}>
      {showTts ? (
        <TtsComponent
          text={term}
          lang={lang}
          size={20}
          disabled={!speakableTerm}
        />
      ) : null}
      {showReplay ? (
        <button
          type="button"
          className={`${baseToolButtonClass} ${styles["tool-button-replay"]}`}
          onClick={onReoutput}
          disabled={disabled || !speakableTerm}
          aria-label={reoutputLabel}
        >
          <ThemeIcon name="refresh" width={16} height={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

LeftCluster.propTypes = {
  showTts: PropTypes.bool.isRequired,
  showReplay: PropTypes.bool.isRequired,
  ttsComponent: PropTypes.elementType.isRequired,
  term: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  speakableTerm: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
    .isRequired,
  disabled: PropTypes.bool.isRequired,
  onReoutput: PropTypes.func,
  baseToolButtonClass: PropTypes.string.isRequired,
  reoutputLabel: PropTypes.string.isRequired,
};

LeftCluster.defaultProps = {
  onReoutput: undefined,
};

export default LeftCluster;
