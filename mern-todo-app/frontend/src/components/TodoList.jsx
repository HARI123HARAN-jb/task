// frontend/src/components/TodoList.jsx
// Renders a list of tasks, including nested child tasks for hierarchy, with indentation.

import React from 'react';
import TodoItem from './TodoItem'; // Import the TodoItem component

// TodoList component receives the hierarchical tasks array, handlers, and isAdmin status
function TodoList({ todos, onDelete, onUpdate, isAdmin }) { // Accepts isAdmin prop

  // --- Recursive Render Function ---
  // This function renders a single task item and then recursively renders its children.
  // It now accepts a 'level' prop to track nesting depth.
  const renderTaskItem = (task, level = 0) => ( // Added level parameter, defaults to 0 for top-level
    // Use the task's _id as the key
    <React.Fragment key={task._id}>
      {/* Render the individual task item */}
      {/* Pass the current level down to TodoItem */}
      <TodoItem
        todo={task} // Pass the current task object
        onDelete={onDelete} // Pass the delete handler down
        onUpdate={onUpdate} // Pass the update handler down
        isAdmin={isAdmin} // Pass the isAdmin status down to TodoItem
        nestingLevel={level} // Pass the current nesting level
      />
      {/* Check if the task has children and if the children array is not empty */}
      {task.children && task.children.length > 0 && (
        // Render a nested list for children.
        // Removed ml-4 here; indentation will be handled by TodoItem based on nestingLevel
        <ul className="list-group list-group-flush">
          {/* Map over the children and recursively call renderTaskItem for each child */}
          {/* Increment the level when rendering children */}
          {task.children.map(childTask => renderTaskItem(childTask, level + 1))}
        </ul>
      )}
    </React.Fragment>
  );
  // --- End Recursive Render Function ---


  return (
    // The main list container for the top-level tasks
    // The nested lists for children will be rendered within the recursive function
    <ul className="list-group">
      {/* Map over the top-level tasks and call the recursive render function for each */}
      {/* Start the nesting level at 0 for the top-level tasks */}
      {todos.map(topLevelTodo => renderTaskItem(topLevelTodo, 0))} // Start level at 0
    </ul>
  );
}

export default TodoList; // Export the TodoList component
