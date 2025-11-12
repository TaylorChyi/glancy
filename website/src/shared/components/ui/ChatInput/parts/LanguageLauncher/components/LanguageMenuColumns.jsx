import PropTypes from "prop-types";
import LanguageVariantsColumn from "./LanguageVariantsColumn.jsx";
import LanguageOptionsColumn from "./LanguageOptionsColumn.jsx";

export default function LanguageMenuColumns({
  variants,
  activeKey,
  onVariantEnter,
  swapAction,
  onSwap,
  activeVariant,
  onSelect,
}) {
  return (
    <>
      <LanguageVariantsColumn
        variants={variants}
        activeKey={activeKey}
        onVariantEnter={onVariantEnter}
        swapAction={swapAction}
        onSwap={onSwap}
      />
      <LanguageOptionsColumn variant={activeVariant} onSelect={onSelect} />
    </>
  );
}

LanguageMenuColumns.propTypes = {
  variants: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeKey: PropTypes.oneOf(["source", "target"]),
  onVariantEnter: PropTypes.func.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }),
  onSwap: PropTypes.func,
  activeVariant: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

LanguageMenuColumns.defaultProps = {
  activeKey: undefined,
  swapAction: null,
  onSwap: undefined,
  activeVariant: null,
};
