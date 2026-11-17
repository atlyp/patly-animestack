
import { UnsetPfp } from "./UnsetPfp";
import { profileImageUrl } from "../api";

export const ConditionalAvPic = ({ user }) => {
     return (
          <>
               {user.profileImgPath !== "none" && (
                    <span style={{ border: "none", backgroundColor: "unset", maxWidth: "1px" }}>
                         <img className="pfpnav" src={profileImageUrl(user.profileImgPath)} alt="" />
                    </span>
               )}
               {user.profileImgPath == "none" && <UnsetPfp />}
          </>
     );
};
