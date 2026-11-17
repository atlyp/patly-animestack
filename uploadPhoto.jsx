// Import React hooks.
//
// useState
// Allows components to store data that changes over time.
//
// useEffect
// Allows code to run when the component loads or when state changes.
import React, { useState, useEffect } from "react";

function Metadata() {

  // =====================================================
  // STATE
  // =====================================================

  // Stores every user returned from MongoDB.
  //
  // Example:
  //
  // [
  //   {
  //     _id: "...",
  //     name: "Alex",
  //     photoPath: "/uploads/cat.jpg"
  //   }
  // ]
  //
  // When this state changes React automatically re-renders.
  const [users, setUsers] = useState([]);

  // Stores the text currently typed into the name input.
  //
  // Example:
  //
  // "Alex"
  const [userName, setUserName] = useState("");

  // Stores the actual file selected by the user.
  //
  // Example:
  //
  // File {
  //   name: "cat.jpg",
  //   size: 100000
  // }
  //
  // Initially no file is selected.
  const [selectedFile, setSelectedFile] = useState(null);


  // =====================================================
  // GET USERS FROM THE BACKEND
  // =====================================================

  // This function retrieves every user from MongoDB.
  //
  // React
  //   ↓
  // GET /users
  //   ↓
  // Express
  //   ↓
  // MongoDB
  //   ↓
  // Users returned
  //
  const fetchUsers = async () => {
    try {

      // Make a GET request to our Express server.
      //
      // Route:
      //
      // app.get("/users")
      const response = await fetch(
        "http://localhost:3000/users"
      );

      // Convert JSON response into a JavaScript array.
      const data = await response.json();

      // Save users into state.
      //
      // This causes React to re-render.
      setUsers(data);

    } catch (error) {

      console.error(error);

    }
  };


  // =====================================================
  // HANDLE FORM SUBMISSION
  // =====================================================

  // Runs when the user clicks Upload.
  const handleSubmit = async (e) => {

    // Prevent browser refresh.
    //
    // Without this, the page would reload
    // and React state would disappear.
    e.preventDefault();

    // Safety check.
    //
    // Do not submit if:
    // - no image selected
    // - no username entered
    if (!selectedFile) {
      return;
    }

    // ===================================================
    // CREATE FORMDATA
    // ===================================================

    // Files cannot be sent as JSON.
    //
    // Instead we use FormData.
    //
    // Think:
    //
    // JSON -> text only
    // FormData -> text + files
    const formData = new FormData();

    // Add text field.
    //
    // Backend receives:
    //
    // req.body.name
    formData.append("name", userName);

    // Add image file.
    //
    // Backend receives:
    //
    // req.file
    formData.append("photo", selectedFile);

    try {

      // Send FormData to Express.
      //
      // Route:
      //
      // POST /users
      //
      // Multer intercepts this request,
      // saves the image to disk,
      // and creates req.file.
      await fetch(
        "http://localhost:3000/users",
        {
          method: "POST",

          // Notice:
          //
          // We do NOT use JSON.stringify().
          //
          // FormData automatically handles
          // files and multipart requests.
          body: formData,
        }
      );

      // Clear the text input.
      setUserName("");

      // Clear the selected file.
      //
      // State becomes:
      //
      // null
      setSelectedFile(null);

      // Immediately re-fetch all users.
      //
      // This updates the UI with the
      // newly uploaded user.
      fetchUsers();

    } catch (error) {

      console.error(error);

    }
  };


  // =====================================================
  // COMPONENT LOAD
  // =====================================================

  // Runs one time when the component first appears.
  //
  // Similar to:
  //
  // componentDidMount()
  //
  // in class components.
  useEffect(() => {

    // Load all users immediately.
    fetchUsers();

  }, []);

  // Empty dependency array means:
  //
  // Run once when component mounts.
  //
  // NOT every render.


  // =====================================================
  // JSX
  // =====================================================

  return (
    <div>

      {/* Page title */}
      <h1>User Photo Upload</h1>

      {/* ==========================================
          FORM
      ========================================== */}

      <form onSubmit={handleSubmit}>

        {/* -------------------------------
            USERNAME INPUT
        ------------------------------- */}

        <input
          type="text"

          placeholder="Enter user name"

          // Controlled Input:
          //
          // React controls the value.
          value={userName}

          onChange={(e) =>
            setUserName(e.target.value)
          }
        />

        {/* -------------------------------
            FILE INPUT
        ------------------------------- */}

        <input
          type="file"

          onChange={(e) =>

            // e.target.files is an array-like object.
            //
            // We only want the first file.
            setSelectedFile(
              e.target.files[0]
            )
          }
        />

        <button type="submit">
          Upload
        </button>

      </form>

      <hr />

      {/* ==========================================
          DISPLAY USERS
      ========================================== */}

      {/* Loop through every user in state. */}
      {users.map((user) => (

        <div key={user._id}>

          {/* User name */}
          <h3>{user.name}</h3>

          {/* User image */}
          <img

            // photoPath from MongoDB:
            //
            // /uploads/123-cat.jpg
            //
            // We prepend the backend URL.
            //
            // Result:
            //
            // http://localhost:3000/uploads/123-cat.jpg
            src={`http://localhost:3000${user.photoPath}`}

            alt={user.name}

            width="200"
          />

        </div>

      ))}

    </div>
  );
}

export default Metadata;