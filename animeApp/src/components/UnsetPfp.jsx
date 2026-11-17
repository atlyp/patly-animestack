import React from "react";
import { IoPersonSharp } from "react-icons/io5";

export const UnsetPfp = ({styles}) => {
     return (
          <>
               <span style={{ border: "none", width: "fit-content", backgroundColor: "unset" }} className="unsetPfp">
                    <IoPersonSharp style={styles} />
               </span>
          </>
     );
};
