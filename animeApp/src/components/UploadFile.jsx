import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { API_BASE } from "../api";

export const UploadFile = ( ) => {
     const [selectedFile, setSelectedFile] = useState(null);
     const { userLoggedIn } = useSelector((state) => state.userKey);
     const handleChange = async (e) => {
          setSelectedFile(e.target.files[0]);
     };
     //  console.log(selectedFile);
     const handleSubmit = async (e) => {
          e.preventDefault();
          if (!selectedFile) {
               // Do not submit if:
               // - no image selected
               return;
          }
          //  otherwise -> we know that files cannot be sent as JSON
          //  instead we use "form DATERRR"
          //  JSON - > text only
          //  formData -> text + filess
          const formData = new FormData();
          //  The FormData interface provides a way to construct a set of key/value pairs representing form fields and their values, which can be sent using the fetch()
          formData.append("photo", selectedFile);
          const options = {
               method: "post",
               body: formData,
          };
          try {
               const resp = await fetch(`${API_BASE}/user/profileImg/${userLoggedIn._id}`, options);
               const data = await resp.json();
               if (!resp.ok || data.error) throw new Error(data.error || `Upload failed (${resp.status}).`);
               window.location.reload();
               setSelectedFile(null);
          } catch (e) {
               console.error("Unable to upload profile image:", e);
          }
     };
     const fileInputRef = useRef();
     useEffect(() => {
          fileInputRef.current.click();
     }, []);
     return (
          <Form noValidate onSubmit={handleSubmit}>
               <Form.Group className="position-relative mb-3">
                    <Form.Label>File</Form.Label>
                    <Form.Control
                         ref={fileInputRef}
                         type="file"
                         required
                         name="file"
                         onChange={(e) => handleChange(e)}
                         isInvalid={false}
                    />
                    <Form.Control.Feedback type="invalid" tooltip>
                         error with your file
                    </Form.Control.Feedback>
                    {selectedFile ? (
                         <Button variant="success" type="submit">
                              Change!
                         </Button>
                    ) : (
                         <span>Pick a file to upload</span>
                    )}
               </Form.Group>
          </Form>
     );
};
