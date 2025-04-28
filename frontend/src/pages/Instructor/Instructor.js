import React, { useState, useEffect } from "react";
import Navmenu from "../../components/Navmenu";
import { getQuestions, submitWorkflow, postQuestion } from "../../api/authApi";
import TextareaAutosize from 'react-textarea-autosize';

const Instructor = ({ handleLogout }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [tasks, setTasks] = useState([{ name: "", statements: [""] }]);
  const [newQuestion, setNewQuestion] = useState(""); // For adding a new question
  const [userRole, setUserRole] = useState(); // Store the role of the logged-in user

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role); // Get the role from localStorage

    fetchQuestions();
  }, []);

  // Fetch available questions from instructor
  const fetchQuestions = async () => {
    try {
      const response = await getQuestions();
      console.log( response );
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  // Handle task input change
  const handleTaskChange = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index].name = value;
    setTasks(newTasks);
  };

  // Handle statement input change
  const handleStatementChange = (taskIndex, statementIndex, value) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].statements[statementIndex] = value;
    setTasks(newTasks);
  };

  // Add a new task
  const addTask = () => {
    setTasks([...tasks, { name: "", statements: [""] }]);
  };

  // Add a new statement to a task
  const addStatement = (taskIndex) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].statements.push("");
    setTasks(newTasks);
  };

  // Remove a task
  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  // Remove a statement from a task
  const removeStatement = (taskIndex, statementIndex) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].statements = newTasks[taskIndex].statements.filter((_, i) => i !== statementIndex);
    setTasks(newTasks);
  };

  // Submit workflow to the backend
  const handleSubmit = async () => {
    if (!selectedQuestion) {
      alert("Please select a question before submitting.");
      return;
    }

    try {
      await submitWorkflow({ question_id: selectedQuestion, tasks });
      alert("Workflow submitted successfully!");
      setTasks([{ name: "", statements: [""] }]); // Reset form
    } catch (error) {
      console.error("Error submitting workflow:", error);
    }
  };

  // Handle new question submission (for instructors)
  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      alert("Question title is required.");
      return;
    }
  
    try {
      const response = await postQuestion({ questionText: newQuestion });  // Send the new question
      setNewQuestion(""); // Reset question input field
      fetchQuestions(); // Refresh the list of questions
      console.log( response );
      alert("Question added successfully!");
    } catch (error) {
      console.error("Error posting question:", error);
    }
  };
  

  return (
    <div>
        <Navmenu handleLogout={handleLogout} setUserRole={setUserRole}/>
    
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        
      <h2>{userRole === "instructor" ? "Add a Question" : "Submit Your Workflow"}</h2>

      {/* Instructor: Add a new question */}
      {userRole === "instructor" && (
        <div>
          <TextareaAutosize
            placeholder="Enter a new question"
            value={newQuestion}
            minRows={4}
            onChange={(e) => setNewQuestion(e.target.value)}
            style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                resize: "vertical"  // This lets the user resize vertically
            }}
            />
          <button onClick={handleAddQuestion} style={{ marginBottom: "10px" }}>
            Add Question
          </button>
        </div>
      )}

      {/* Question Selection (both for instructor view and student view) */}
      {(userRole === "student" || userRole === "instructor") && (
        <>
          <label>Select a Question:</label>
          <select
            value={selectedQuestion || ""}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          >
            <option value="">-- Select a Question --</option>
            {questions.map((q) => (
              <option key={q._id} value={q._id}>
                {q.questionText}
              </option>
            ))}
          </select>

          {/* Student View: Tasks and Statements */}
          {userRole === "student" && (
            <>
              {tasks.map((task, taskIndex) => (
                <div key={taskIndex} style={{ marginBottom: "15px", border: "1px solid #ddd", padding: "10px" }}>
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={task.name}
                    onChange={(e) => handleTaskChange(taskIndex, e.target.value)}
                    style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
                  />
                  <button onClick={() => removeTask(taskIndex)} style={{ marginBottom: "10px", color: "red" }}>
                    ❌ Remove Task
                  </button>

                  {task.statements.map((statement, statementIndex) => (
                    <div key={statementIndex} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                      <input
                        type="text"
                        placeholder="Enter statement"
                        value={statement}
                        onChange={(e) => handleStatementChange(taskIndex, statementIndex, e.target.value)}
                        style={{ flexGrow: 1, padding: "8px" }}
                      />
                      <button onClick={() => removeStatement(taskIndex, statementIndex)} style={{ marginLeft: "5px", color: "red" }}>
                        ❌
                      </button>
                    </div>
                  ))}

                  <button onClick={() => addStatement(taskIndex)}>➕ Add Statement</button>
                </div>
              ))}

              <button onClick={addTask} style={{ marginBottom: "10px" }}>➕ Add Task</button>

              <button onClick={handleSubmit} style={{ marginTop: "10px" }}>Submit Workflow</button>
            </>
          )}
        </>
      )}
    </div>
    </div>
  );
};

export default Instructor;
