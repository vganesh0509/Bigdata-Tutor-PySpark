import React, { useState } from "react";
import "./ChatBot.css";

const ChatBot = ({ nodes, edges }) => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Are you a *beginner* or *advanced* student? 😊" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentLevel, setStudentLevel] = useState(null); // Store the user level

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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Detect student level early
    if (!studentLevel) {
      if (input.toLowerCase().includes("beginner")) {
        setStudentLevel("beginner");
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Great! I’ll walk you through step-by-step. Ask your first question!" },
        ]);
        setLoading(false);
        return;
      } else if (input.toLowerCase().includes("advanced")) {
        setStudentLevel("advanced");
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Awesome! I’ll give you direct solutions. Ask your question!" },
        ]);
        setLoading(false);
        return;
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Please mention if you're a *beginner* or *advanced* student so I can assist better!" },
        ]);
        setLoading(false);
        return;
      }
    }

    const enrichedNodes = getOrderedAccumulatedStatements(nodes, edges);

    console.log( enrichedNodes )

    const workflowData = {enrichedNodes,edges};

    // Proceed to fetch chatbot response
    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          level: studentLevel, // send this to backend if you want to enhance later
          data: workflowData
        }),
      });

      const data = await response.json();
      const botReply = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "❌ Error fetching response." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-container">
      <div className="chat-window">
      {messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.sender}`}>
          {msg.text.includes("\n") ? (
            <pre>
              <code>{msg.text}</code>
            </pre>
          ) : (
            msg.text
          )}
        </div>
      ))}

        {loading && <div className="message bot">Thinking...</div>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;
