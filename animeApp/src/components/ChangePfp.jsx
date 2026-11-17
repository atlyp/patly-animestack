import { UnsetPfp } from "./UnsetPfp";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { UploadFile } from "./UploadFile";
import { profileImageUrl } from "../api";

export const ChangePfp = ({ user }) => {
     const [changingPfp, setChangingPfp] = useState(false);

     return (
          <>
               <div className="changePfp">
                    {user.profileImgPath !== "none" && (
                         <img
                              className="pfp"
                              style={{ width: `${changingPfp ? "65%" : "40%"}` }}
                              src={profileImageUrl(user.profileImgPath)}
                              alt=""
                         />
                    )}
                    {user.profileImgPath == "none" && <UnsetPfp styles={{ fontSize: "6rem" }} />}
                    <Button onClick={() => setChangingPfp((prevchanging) => !prevchanging)}>
                         {changingPfp ? "cancel" : " Change your pfp"}
                    </Button>
                    {changingPfp ? <UploadFile /> : ""}
               </div>
          </>
     );
};
