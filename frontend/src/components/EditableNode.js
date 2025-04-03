// src/components/EditableNode.js
import React, { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";

const EditableNode = ({ data, id, selected, setNodes }) => {
  const [label, setLabel] = useState(data.label || "");
  const [statements, setStatements] = useState(data.statements || []);

  // Update global node state on edit
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, label, statements },
            }
          : node
      )
    );
  }, [label, statements, id, setNodes]);

  const handleStatementChange = (index, value) => {
    const updated = [...statements];
    updated[index] = value;
    setStatements(updated);
  };

  const addStatement = () => setStatements([...statements, ""]);
  const deleteStatement = (index) => {
    const updated = statements.filter((_, i) => i !== index);
    setStatements(updated);
  };

  return (
    <div style={{ padding: 10, backgroundColor: selected ? "#eef" : "#fff", borderRadius: 5, border: "1px solid #999", minWidth: 180 }}>
      <Handle type="target" position={Position.Top} />
      <input
        className="form-control form-control-sm mb-2"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Node Label"
      />
      {statements.map((stmt, idx) => (
        <div key={idx} className="input-group input-group-sm mb-1">
          <input
            type="text"
            className="form-control"
            value={stmt}
            onChange={(e) => handleStatementChange(idx, e.target.value)}
            placeholder={`Statement ${idx + 1}`}
          />
          <button className="btn btn-outline-danger btn-sm" onClick={() => deleteStatement(idx)}>🗑️</button>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm w-100" onClick={addStatement}>➕ Add Statement</button>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default EditableNode;
