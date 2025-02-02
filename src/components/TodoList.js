import React, { useEffect, useState } from 'react';
import { databases } from '../appwriteconfig';
import "./TodoList.css";

export const DATABASE_ID = "679f473500213f729a36";
export const COLLECTION_ID = "679f4753000b743d333d";

const TodoList = () => {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [editingTodo, setEditingTodo] = useState(null);
    const [editText, setEditText] = useState('');
    const [menuOpen, setMenuOpen] = useState({});

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
            setTodos(response.documents);
        } catch (error) {
            console.error(error);
        }
    };

    const addTodo = async () => {
        if (!newTodo) return;
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, 'unique()', { title: newTodo, isCompleted: false });
            setNewTodo('');
            fetchTodos();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleCompletion = async (id, isCompleted) => {
        try {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, { isCompleted: !isCompleted });
            fetchTodos();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
            fetchTodos();
        } catch (error) {
            console.error(error);
        }
    };

    const startEditing = (todo) => {
        setEditingTodo(todo.$id);
        setEditText(todo.title);
    };

    const saveEdit = async () => {
        if (!editText) return;
        try {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, editingTodo, { title: editText });
            setEditingTodo(null);
            setEditText('');
            fetchTodos();
        } catch (error) {
            console.error(error);
        }
    };

    const cancelEdit = () => {
        setEditingTodo(null);
        setEditText('');
    };

    const toggleMenu = (id) => {
        setMenuOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="todo-container">
            <h1 className="todo-title">Todo List</h1>

            <div className="todo-input-container">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a new task"
                    className="todo-input"
                />
                <button onClick={addTodo} className="add-btn">Add</button>
            </div>

            <ul className="todo-list">
                {todos.map((todo) => (
                    <li key={todo.$id} className="todo-item">
                        {editingTodo === todo.$id ? (
                            <>
                                <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="edit-input"
                                />
                                <button onClick={saveEdit} className="save-btn">Save</button>
                                <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                            </>
                        ) : (
                            <>
                                <span className={`todo-text ${todo.isCompleted ? 'completed' : ''}`}>
                                    {todo.title}
                                </span>
                                <div className="menu-container">
                                    <button
                                        className="menu-button"
                                        onClick={() => toggleMenu(todo.$id)}
                                    >
                                        &#x22EE; {/* Three vertical dots */}
                                    </button>
                                    {menuOpen[todo.$id] && (
                                        <div className="dropdown-menu">
                                            <button
                                                onClick={() => toggleCompletion(todo.$id, todo.isCompleted)}
                                            >
                                                {todo.isCompleted ? 'Undo' : 'Complete'}
                                            </button>
                                            <button onClick={() => startEditing(todo)}>Edit</button>
                                            <button onClick={() => deleteTodo(todo.$id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            <p className="footer-text">© {new Date().getFullYear()} Pavan. All rights reserved.</p>

        </div>
    );
};

export default TodoList;
