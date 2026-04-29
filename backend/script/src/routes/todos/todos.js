import express from "express";
import auth from "../../middleware/auth.js";
import {
  getAllTodos,
  createTodo as createTodoQuery,
  updateTodo as updateTodoQuery,
  deleteTodo as deleteTodoQuery
} from './todos.query.js';

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const todos = await getAllTodos(req.user.id);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  const { title, start, end, status } = req.body;
  if (!title || !start) {
    return res.status(400).json({ error: "Title and start date are required" });
  }

  try {
    const id = await createTodoQuery(req.user.id, title, start, end, null, status);
    res.status(201).json({ id, title, start, end, status, user_id: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  const { title, start, end, status } = req.body;
  if (!title || !start) {
    return res.status(400).json({ error: "Title and start date are required" });
  }

  try {
    await updateTodoQuery(req.params.id, title, start, end, status, req.user.id);
    res.json({ message: "Event updated" });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await deleteTodoQuery(req.params.id, req.user.id);
    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
