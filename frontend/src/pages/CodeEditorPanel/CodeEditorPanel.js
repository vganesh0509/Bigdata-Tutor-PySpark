// CodeEditorPanel.js (Extended Version with File Upload & Input Injection)
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

function CodeEditorPanel() {
  const [code, setCode] = useState("# Write your PySpark code here\n");
  const [output, setOutput] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputFiles, setInputFiles] = useState([]);


  const handleRunCode = async () => {
    const formData = new FormData();
    formData.append("code", code); // PySpark code from editor
  
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
    } catch (error) {
      console.error("Execution Error:", error);
    }
  };
  
  

  return (
    <div>
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

      <pre style={{ backgroundColor: "#f0f0f0", padding: "10px" }}>{output}</pre>
    </div>
  );
}

export default CodeEditorPanel;