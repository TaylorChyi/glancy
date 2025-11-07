import PropTypes from "prop-types";

import sendButtonAsset from "@assets/interface/controls/send-button.svg";
import sendButtonInline from "@assets/interface/controls/send-button.svg?raw";

import renderStaticIcon from "./renderStaticIcon.jsx";

const SEND_ICON_NAME = "send-button";

export default function SendIcon({ className }) {
  return renderStaticIcon({
    className,
    iconName: SEND_ICON_NAME,
    inline: sendButtonInline,
    src: sendButtonAsset,
  });
}

SendIcon.propTypes = {
  className: PropTypes.string.isRequired,
};
