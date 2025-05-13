import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { saveWorkflow, getWorkflows, runWorkflow } from "../api/workflowApi"; // Import API functions
import Modal from "react-modal"; // Import Modal
import ChatBot from "./ChatBot";
import "./WorkflowEditor.css"; // Optional custom styles
import EditableNode from "./EditableNode";
import { useMemo } from "react";
import { getQuestions } from "../api/authApi";
import Navmenu from "./Navmenu";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";  // For image export

Modal.setAppElement("#root");

const initialNodes = [
  { id: "start", type: "input", position: { x: 250, y: 50 }, data: { label: "Start", statements: [] } },
  { id: "end", type: "output", position: { x: 250, y: 400 }, data: { label: "End", statements: [] } },
];

const initialEdges = [];



const WorkflowEditor = ({ userRole }) => {
  const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    console.log( "QUESTION:", selectedQuestion );
    
  const [nodes, setNodes] = 
  useState(
    location?.state?.nodes || initialNodes
  );
  // useState(initialNodes);
  const [edges, setEdges] = useState(
    location?.state?.edges || initialEdges
  );
  // useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflows, setWorkflows] = useState([]); // Stores fetched workflows
  const [selectedWorkflow, setSelectedWorkflow] = useState(
    location?.state?.selectedDropdownValue || null
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [statements, setStatements] = useState([]);
  const [selectedNodeName, setSelectedNodeName] = useState("");
  const [codeModalIsOpen, setCodeModalIsOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(""); // Store generated PySpark code
  const navigate = useNavigate()
  // ✅ Fetch workflows from MongoDB on page load
  useEffect(() => {
    fetchWorkflows();
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

    const handleQuestionSelect = (e) => {
      const questionId = e.target.value;
      const question = questions.find((q) => q._id === questionId);
      setSelectedQuestion(question);
    };
  

  const fetchWorkflows = async () => {
    try {
      const allWorkflows = await getWorkflows();
      console.log("Fetched Workflows:", allWorkflows); // ✅ Debugging fetched data

      // ✅ Filter only workflows created by this user
      const userWorkflows = allWorkflows;
      setWorkflows(userWorkflows);
    } catch (error) {
      console.error("❌ Error fetching workflows:", error);
    }
  };

  
  const nodeTypes = useMemo(() => ({
    editableNode: (props) => <EditableNode {...props} setNodes={setNodes} />,
  }), [setNodes]);
  

  // ✅ Handle loading a selected workflow
  const handleLoadWorkflow = (workflowName) => {
    console.log( workflowName );
    if (!workflowName) return;

    const selected = workflows.find((wf) => wf.workflow.name === workflowName);
    if (selected) {
      console.log( selected );
      setNodes(selected.workflow.nodes || []);
      setEdges(selected.workflow.edges || []);
      setSelectedWorkflow(workflowName);
    }
  };

  // ✅ Handle node changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // ✅ Handle edge changes
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // ✅ Handle adding new edges
  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  // ✅ Add a new node
  const addNode = () => {
    const newNode = {
      id: uuidv4(),
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: { label: `Node ${nodes.length}`, statements: [] },
      type: "editableNode",
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  // ✅ Delete selected node
  const deleteNode = () => {
    if (!selectedNode || selectedNode.id === "start" || selectedNode.id === "end") return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
    setSelectedNodeName("");
  };

  const openEditModal = () => {
    console.log( selectedNode );
    if (!selectedNode) return;
    setStatements(selectedNode.data.statements || []);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleStatementChange = (index, value) => {
    const newStatements = [...statements];
    newStatements[index] = value;
    setStatements(newStatements);
  };

  const addStatement = () => {
    setStatements([...statements, ""]);
  };

  const deleteStatement = (index) => {
    const newStatements = statements.filter((_, i) => i !== index);
    setStatements(newStatements);
  };


  const saveStatements = () => {
    editNode();
    console.log( statements );
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, statements } } : node
      )
    );
    closeModal();
  };

  // ✅ Edit node label
  const editNode = () => {
    console.log(  selectedNode );
    if (!selectedNode) return;
    const newLabel = selectedNodeName;
    if (newLabel) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data: { ...node.data, label: newLabel } } : node
        )
      );
    }
  };

  // ✅ Save workflow to MongoDB with user input name
  const handleSave = async () => {
    const workflowName = prompt("Enter a name for your workflow:");
    if (!workflowName) {
      alert("❌ Workflow name is required!");
      return;
    }

    const workflowData = { name: workflowName, nodes, edges };
    console.log( workflowData );
    try {
      await saveWorkflow(workflowData);
      alert(`✅ Workflow "${workflowName}" saved to MongoDB!`);
      fetchWorkflows(); // Refresh workflow list after saving
    } catch (error) {
      alert("❌ Failed to save workflow.");
      console.error("Error saving workflow:", error);
    }
  };

  const getOrderedAccumulatedStatements = (nodes, edges) => {
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, { ...node }]));
  
    // Map target → [source1, source2, ...]
    const incomingMap = {};
    const outgoingMap = {};
  
    edges.forEach(({ source, target }) => {
      if (!incomingMap[target]) incomingMap[target] = [];
      if (!outgoingMap[source]) outgoingMap[source] = [];
      incomingMap[target].push(source);
      outgoingMap[source].push(target);
    });
  
    const visited = new Set();
    const result = [];
  
    // Get topologically sorted nodes by depth (basic Kahn’s algorithm with LTR sort)
    const getExecutionOrder = () => {
      const inDegree = {};
      nodes.forEach((node) => (inDegree[node.id] = 0));
      edges.forEach(({ target }) => {
        inDegree[target]++;
      });
  
      const queue = nodes
        .filter((node) => inDegree[node.id] === 0)
        .sort((a, b) => a.position.x - b.position.x); // Start left to right
  
      const ordered = [];
  
      while (queue.length > 0) {
        const node = queue.shift();
        ordered.push(node);
  
        (outgoingMap[node.id] || []).forEach((childId) => {
          inDegree[childId]--;
          if (inDegree[childId] === 0) {
            queue.push(nodeMap[childId]);
            queue.sort((a, b) => a.position.x - b.position.x);
          }
        });
      }
  
      return ordered;
    };
  
    const orderedNodes = getExecutionOrder();
  
    // Build cumulative statements
    for (const node of orderedNodes) {
      const currentId = node.id;
      const currentStatements = node.data.statements || [];
  
      // Merge all parent cumulative statements
      const parentIds = incomingMap[currentId] || [];
      const parentCumulative = parentIds.flatMap(
        (parentId) => nodeMap[parentId].data.cumulativeStatements || []
      );
  
      const cumulativeStatements = [...parentCumulative, ...currentStatements];
      nodeMap[currentId].data.cumulativeStatements = cumulativeStatements;
    }
  
    return Object.values(nodeMap);
  };
  
  const goToCodeEditor = () => {
    navigate("/code-editor", { state: { code: generatedCode } });
  }

  
  const handleRun = async () => {
    try{
      const enrichedNodes = getOrderedAccumulatedStatements(nodes, edges);

      console.log( enrichedNodes )

      const workflowData = { enrichedNodes, edges };
      console.log( workflowData );      
      const response = await runWorkflow(workflowData);
      if (response.pyspark_code) {
        alert("✅ Workflow executed! PySpark code generated.");
        setGeneratedCode(response.pyspark_code);  // Store the generated PySpark code
        // setCodeModalIsOpen(true);  // Open modal to display code
        console.log( selectedQuestion )
        navigate("/code-editor", { state: { code: response.pyspark_code, selectedDropdownValue: selectedWorkflow, nodes: nodes, edges: edges  } });
      } else {
        alert("❌ Failed to generate PySpark code.");
      }
    } catch( error ){
      console.log( error );
      alert('FAIL');
    }
  }



  // Export workflow as JSON
const exportWorkflowAsJSON = () => {
  const workflow = { nodes, edges };
  const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "workflow.json";
  link.click();
};

// Import workflow from a selected JSON file
const importWorkflowFromJSON = (event) => {
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    const content = JSON.parse(e.target.result);
    setNodes(content.nodes || []);
    setEdges(content.edges || []);
  };
  fileReader.readAsText(event.target.files[0]);
};


// Export workflow canvas as image
const exportWorkflowAsImage = async () => {
  const canvas = await html2canvas(document.querySelector(".react-flow"));
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "workflow.png";
  link.click();
};

  
    // ✅ Function to copy PySpark code to clipboard
    const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedCode);
      alert("✅ Code copied to clipboard!");
    };

    return (
      <>
      <Navmenu setUserRole={userRole} />
      { userRole === `student` ?
        (
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        
        <>
          <label>Select a Question:</label>
          <select
            value={selectedQuestion ? selectedQuestion._id : ""}
            onChange={handleQuestionSelect}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis", // Truncate the dropdown text
            }}
          >
            <option value="">-- Select a Question --</option>
            {questions.map((q) => (
              <option key={q._id} value={q._id}>
                {q.questionText}
              </option>
            ))}
          </select>

          {/* Display the selected question in a div below the dropdown */}
          {selectedQuestion && (
            <div
            style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#f1f1f1",
              borderRadius: "5px",
              border: "1px solid #ddd",
              wordWrap: "break-word", // Allow text to break into multiple lines
              whiteSpace: "normal", // Allow text to wrap
            }}

            >
              <strong>Selected Question:</strong>
              <p>{selectedQuestion.questionText}</p>
            </div>
          )}

          
          </>
        <div className="p-2 bg-light d-flex gap-2 align-items-center flex-wrap"
        style={{ overflowX: "auto", flexWrap: "wrap" }}
        >
          <button className="btn btn-primary btn-sm" onClick={addNode}>➕ Add Node</button>
          <button className="btn btn-warning btn-sm" onClick={openEditModal} disabled={!selectedNode || selectedNode.id === "start" || selectedNode.id === "end"}>✏️ Edit Node</button>
          <button className="btn btn-danger btn-sm" onClick={deleteNode} disabled={!selectedNode || selectedNode.id === "start" || selectedNode.id === "end"}>🗑️ Delete Node</button>
          <button className="btn btn-success btn-sm" onClick={handleSave}>💾 Save Workflow</button>
          <button className="btn btn-info btn-sm" onClick={handleRun}>🚀 Run Workflow</button>
  
          <select className="form-select form-select-sm w-auto" onChange={(e) => handleLoadWorkflow(e.target.value)} value={selectedWorkflow}>
            <option value="">📂 Load Workflow</option>
            {workflows.map((workflow) => (
              <option key={workflow._id} value={workflow.workflow.name}>
                {workflow.workflow.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={exportWorkflowAsJSON}>⬇️ Export JSON</button>

          <label className="btn btn-secondary btn-sm" style={{ padding: "4px 12px" }}>
            📤 Import JSON
            <input type="file" accept=".json" onChange={importWorkflowFromJSON} hidden />
          </label>

          <button className="btn btn-secondary btn-sm" onClick={exportWorkflowAsImage}>🖼️ Export Image</button>

        </div>
  
        <div style={{ flex: 1 }}>
        <ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onNodeClick={(_, node) => {
    setSelectedNode(node);
    setSelectedNodeName(node?.data?.label);
  }}
  nodeTypes={nodeTypes}
  fitView
>
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
  
        {/* Edit Node Modal */}
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal-dialog" overlayClassName="modal-backdrop show d-block">
          <div className="modal-content p-3">
            <h5>Edit Node</h5>
            <input
              className="form-control mb-2"
              type="text"
              value={selectedNodeName}
              onChange={(e) => setSelectedNodeName(e.target.value)}
              placeholder="Node Label"
            />
            <h6>Statements</h6>
            {statements.map((statement, index) => (
              <div key={index} className="input-group mb-2">
                <input
                  className="form-control"
                  type="text"
                  value={statement}
                  onChange={(e) => handleStatementChange(index, e.target.value)}
                />
                <button className="btn btn-outline-danger" onClick={() => deleteStatement(index)}>🗑️</button>
              </div>
            ))}
            <div className="d-flex gap-2 justify-content-between mt-3">
              <button className="btn btn-secondary btn-sm" onClick={addStatement}>➕ Add Statement</button>
              <button className="btn btn-primary btn-sm" onClick={saveStatements}>✅ Save</button>
              <button className="btn btn-outline-dark btn-sm" onClick={closeModal}>❌ Cancel</button>
            </div>
          </div>
        </Modal>
  
        {/* Code Modal */}
        <Modal
  isOpen={codeModalIsOpen}
  onRequestClose={() => setCodeModalIsOpen(false)}
  className="modal-dialog"
  overlayClassName="modal-backdrop show d-block"
>
  <div
    className="modal-content p-3"
    style={{ backgroundColor: "black", color: "#f5f5f5", border: "1px solid #444" }}
  >
    <h5 style={{ color: "#ffffff" }}>🚀 Generated PySpark Code</h5>
    <pre
      className="p-2"
      style={{
        backgroundColor: "#2d2d2d",
        color: "#ffffff",
        maxHeight: "300px",
        overflowY: "auto",
        whiteSpace: "pre-wrap",
        borderRadius: "4px",
        border: "1px solid #444",
        fontSize: "0.9rem"
      }}
    >
      {generatedCode}
    </pre>
    <div className="d-flex gap-2 mt-2">
      <button className="btn btn-success btn-sm" onClick={copyToClipboard}>
        📋 Copy
      </button>
      <button className="btn btn-outline-light btn-sm" onClick={() => setCodeModalIsOpen(false)}>
        Close
      </button>
      <button className="btn btn-success btn-sm" onClick={goToCodeEditor}>
        Go to Code Editor
      </button>
    </div>
  </div>
</Modal>

  
        <ChatBot nodes={nodes} edges={edges}/>
      </div>
          )
      :
      (
      <>
        Enter
      </>
      )
    }
    </>
    )
  
};

export default WorkflowEditor;
