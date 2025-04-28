import React, { useState } from 'react';
import { MoreVertical, Plus, CheckCircle, Circle } from 'lucide-react';

// Button Component
const Button = ({ children, onClick, className = '', variant = 'default', size = '', ...props }) => {
  const base = 'px-4 py-2 rounded font-medium';
  const variants = {
    default: 'bg-green-700 text-white hover:bg-green-800',
    outline: 'border border-gray-400 text-gray-700 hover:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Card Component
const Card = ({ children, className = '' }) => (
  <div className={`border rounded shadow bg-white ${className}`}>{children}</div>
);

const CardContent = ({ children }) => <div className="p-4">{children}</div>;

// Dropdown Menu Components
const DropdownMenu = ({ children }) => <div className="relative inline-block">{children}</div>;
const DropdownMenuTrigger = ({ children }) => children;
const DropdownMenuContent = ({ children, className = '' }) => (
  <div className={`absolute right-0 mt-2 w-48 bg-white border shadow-lg z-50 ${className}`}>{children}</div>
);
const DropdownMenuItem = ({ children }) => (
  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{children}</div>
);

const Module = ({ title, tasks }) => {
  const [isPublished, setIsPublished] = useState(true);

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon">
            <Plus size={16} />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {['Edit','Delete',].map((item, index) => (
              <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent>
        {tasks.map((task, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b">
            <div className="flex items-center gap-2">
              {task.published ? <CheckCircle size={18} className="text-green-600" /> : <Circle size={18} className="text-gray-400" />}
              <span>{task.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                {['Edit', 'Assign To...', 'Duplicate', 'Move to...', 'Increase indent', 'Send To...', 'Copy To...', 'Share to Commons', 'Remove'].map((item, index) => (
                  <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const CanvasModules = () => {
  const modules = [
    {
      title: 'Module 0',
      tasks: [
        { name: 'Module 0 Overview', published: true },
        { name: 'To-do Checklist (Week 1)', published: true },
        { name: 'To-do Checklist [Week 1]', published: false },
        { name: 'Class material / activities', published: false },
        { name: 'Contact Infor and Office Hours', published: true },
        { name: 'Course policies and topics', published: true },
        { name: 'Mandatory Quiz on Syllabus and Course Policies', published: true },
        { name: 'Introductory Survey (Online Course)', published: false },
        { name: 'Content: Introduction to Database Systems and Data Abstraction', published: false }
      ]
    }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline">Collapse All</Button>
        <Button variant="outline">View Progress</Button>
        <Button variant="outline" className="flex items-center gap-1">
          <CheckCircle size={16} className="text-green-600" /> Publish All
        </Button>
        <Button variant="default" className="flex items-center gap-1">
          <Plus size={16} /> Module
        </Button>
      </div>

      {modules.map((module, index) => (
        <Module key={index} title={module.title} tasks={module.tasks} />
      ))}
    </div>
  );
};

export default CanvasModules;
