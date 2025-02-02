import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { databases } from '../appwriteconfig';
import "./TodoList.css";

export const DATABASE_ID = "679f473500213f729a36";
export const COLLECTION_ID = "679f4753000b743d333d";

const TodoList = () => {
    const [state, setState] = useState({
        todos: [],
        newTodo: '',
        editingTodo: null,
        editText: '',
        menuOpen: {},
        loading: false,
        error: null,
    });

    /**
     * Fetches the list of todos from the database and updates the state.
     * Displays a loading indicator while fetching and handles errors if the request fails.
     */
    const fetchTodos = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
            setState((prev) => ({ ...prev, todos: response.documents, loading: false }));
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Failed to fetch todos', loading: false }));
            console.error(error);
        }
    }, []);

    // Automatically fetch todos when the component is mounted.
    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    /**
     * Adds a new todo to the list. Performs optimistic updates to the UI
     * and synchronizes with the database. Handles errors if the addition fails.
     */
    const addTodo = useCallback(async () => {
        if (!state.newTodo) return;
        try {
            const newTask = { title: state.newTodo, isCompleted: false };
            setState((prev) => ({
                ...prev,
                todos: [...prev.todos, newTask],
                newTodo: '',
                menuOpen: {},
            }));
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, 'unique()', newTask);
            fetchTodos();
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Failed to add todo' }));
            console.error(error);
        }
    }, [state.newTodo, fetchTodos]);

    const toggleCompletion = useCallback(async (id, isCompleted) => {
        try {
            setState((prev) => ({
                ...prev,
                todos: prev.todos.map((todo) =>
                    todo.$id === id ? { ...todo, isCompleted: !isCompleted } : todo
                ),
                menuOpen: {}, // Close all menus
            }));
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, { isCompleted: !isCompleted });
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Failed to toggle completion' }));
            console.error(error);
        }
    }, []);

    /**
     * Deletes a specific todo item from the list.
     * Removes it from both the UI and the database. Handles errors if deletion fails.
     */
    const deleteTodo = useCallback(async (id) => {
        try {
            setState((prev) => ({
                ...prev,
                todos: prev.todos.filter((todo) => todo.$id !== id),
                menuOpen: {}, 
            }));
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Failed to delete todo' }));
            console.error(error);
        }
    }, []);

    /**
     * Starts editing a specific todo item by setting its ID and title in state.
     */
    const startEditing = useCallback((todo) => {
        setState((prev) => ({
            ...prev,
            editingTodo: todo.$id,
            editText: todo.title,
            menuOpen: {},
        }));
    }, []);

    /**
     * Saves changes made to a specific todo item's title.
     * Updates both the UI and the database. Handles errors if saving fails.
     */
    const saveEdit = useCallback(async () => {
        if (!state.editText) return;
        try {
            setState((prev) => ({
                ...prev,
                todos: prev.todos.map((todo) =>
                    todo.$id === state.editingTodo ? { ...todo, title: state.editText } : todo
                ),
                editingTodo: null,
                editText: '',
                menuOpen: {},
            }));
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, state.editingTodo, { title: state.editText });
        } catch (error) {
            setState((prev) => ({ ...prev, error: 'Failed to save edit' }));
            console.error(error);
        }
    }, [state.editingTodo, state.editText]);

    /**
     * Cancels editing mode for a specific todo item by resetting related state variables.
     */
    const cancelEdit = useCallback(() => {
        setState((prev) => ({
            ...prev,
            editingTodo: null,
            editText: '',
            menuOpen: {}, 
        }));
    }, []);

    /**
     * Toggles the visibility of a dropdown menu for a specific todo item.
     */
    const toggleMenu = useCallback((id) => {
        setState((prev) => ({
            ...prev,
            menuOpen: { ...prev.menuOpen, [id]: !prev.menuOpen[id] },
        }));
    }, []);

    /**
     * Memoizes and renders the list of todos. Includes logic for displaying editing inputs,
     * dropdown menus for actions (complete/edit/delete), and conditional styling.
     */
    const renderedTodos = useMemo(
        () =>
            state.todos.map((todo) => (
                <li key={todo.$id} className={`todo-item ${state.editingTodo === todo.$id ? 'editing' : ''}`}>
                    {state.editingTodo === todo.$id ? (
                        <>
                            <input
                                type="text"
                                value={state.editText}
                                onChange={(e) =>
                                    setState((prev) => ({ ...prev, editText: e.target.value }))
                                }
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
                                    &#x22EE;
                                </button>
                                {state.menuOpen[todo.$id] && (
                                    <div className="dropdown-menu">
                                        <button
                                            onClick={() =>
                                                toggleCompletion(todo.$id, todo.isCompleted)
                                            }
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
            )),
        [
            state.todos,
            state.editingTodo,
            state.editText,
            state.menuOpen,
            saveEdit,
            cancelEdit,
            toggleMenu,
            toggleCompletion,
            startEditing,
            deleteTodo,
        ]
    );

    return (
        <div className="todo-container">
            <h1 className="todo-title">Todo List</h1>

            {state.error && <p className="error-text">{state.error}</p>}
            
            <div className="todo-input-container">
                <input
                    type="text"
                    value={state.newTodo}
                    onChange={(e) =>
                        setState((prev) => ({ ...prev, newTodo: e.target.value }))
                    }
                    placeholder="Add a new task"
                    className="todo-input"
                />
                <button onClick={addTodo} className="add-btn" disabled={state.loading}>
                    Add
                </button>
            </div>

            {state.loading ? (
                <p>Loading...</p>
            ) : (
                <ul className="todo-list">{renderedTodos}</ul>
            )}

            <p className="footer-text">© {new Date().getFullYear()} Pavan. All rights reserved.</p>
        </div>
    );
};

export default TodoList;
