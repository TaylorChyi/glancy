import { memo } from "react";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import {
  profilePageLayoutPropTypes,
  profilePageLayoutDefaultProps,
} from "./ProfileView.propTypes.js";

const ProfileLayout = memo(function ProfileLayout({ title, popup, children }) {
  return (
    <div className="app">
      <h2>{title}</h2>
      {children}
      <FeedbackHub popup={popup} />
    </div>
  );
});

ProfileLayout.propTypes = profilePageLayoutPropTypes;
ProfileLayout.defaultProps = profilePageLayoutDefaultProps;

export default ProfileLayout;
