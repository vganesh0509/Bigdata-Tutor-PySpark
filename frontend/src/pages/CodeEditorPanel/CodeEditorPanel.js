// CodeEditorPanel.js (Extended Version with File Upload & Input Injection)
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function CodeEditorPanel() {
  // const [code, setCode] = useState("# Write your PySpark code here\n");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputFiles, setInputFiles] = useState([]);
  const [language, setLanguage] = useState("python"); // Default language
  const location = useLocation();
  const navigate = useNavigate();
  const generatedCode = location.state?.code || ""; // fallback to empty string if not provided
  const [code, setCode] = useState(generatedCode);
  const selectedDropdownValue = location.state?.selectedDropdownValue || ""; // ✅ Get selected dropdown value
  const nodes = location.state?.nodes || {}; // ✅ Get selected dropdown value
  const edges = location.state?.edges || {}; // ✅ Get selected dropdown value
  console.log( "Question:", selectedDropdownValue );
  

  const handleRunCode = async () => {
    const formData = new FormData();
    formData.append("code", code); // PySpark code from editor
    console.log( inputText );
    formData.append("manualInput", inputText); // PySpark code from editor
    formData.append("language", language); // 👈 Attach selected language

    inputFiles.forEach((file) => {
      formData.append("files", file); // multiple files
    });
  
    try {
      const response = await axios.post("http://localhost:5000/api/run_pyspark", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("Execution Output:", response.data.output);
      console.log("Execution Output:", response.data);
       // Set output and error
       setOutput(response.data.output || "");
       setError(response.data.error || "");
    } catch (error) {
      console.error("Execution Error:", error);
    }
  };

  // ✅ Function to navigate back to Workflow Editor
  const handleReturnToWorkflowEditor = () => {
    navigate("/workflow-editor", {
      state: {
        code,                      // ✅ Send back current code
        selectedDropdownValue,     // ✅ Send back selected dropdown value
        nodes,              // ✅ Send back current React Flow data
        edges
      },
    });
  };
  
  

  return (
    
    <div>
      {/* ✅ Return to Workflow Editor Button */}
      <button
        onClick={handleReturnToWorkflowEditor} // ✅ Navigate to workflow editor route
        style={{ marginBottom: "10px", backgroundColor: "#f0f0f0", padding: "8px", borderRadius: "5px" , float: "right"}}
      >
        🔙 Return to Workflow Editor
      </button>
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="language">Choose Language: </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: "5px", fontSize: "14px" }}
        >
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>
      <Editor
        height="300px"
        defaultLanguage="python"
        value={code}
        onChange={(value) => setCode(value)}
      />

      <textarea
        placeholder="Enter input to be passed into your code"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={4}
        style={{ width: "100%", marginTop: "10px" }}
      />

        <input
        type="file"
        multiple
        onChange={(e) => setInputFiles([...e.target.files])}
        />


      <button onClick={handleRunCode} style={{ marginTop: "10px" }}>🚀 Execute</button>
      <div style={{ marginTop: "20px" }}>
        <h3>🔍 Output:</h3>
        <pre style={{ backgroundColor: "#e6ffe6", padding: "10px" }}>{output}</pre>

        {error && (
          <>
            <h3>⚠️ Error:</h3>
            <pre style={{ backgroundColor: "#ffe6e6", padding: "10px" }}>{error}</pre>
          </>
        )}
      </div>
    </div>
  );
}

export default CodeEditorPanel;