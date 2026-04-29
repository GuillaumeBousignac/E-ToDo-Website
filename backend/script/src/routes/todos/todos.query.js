import pool from '../../config/db.js';

const formatDate = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

export const getAllTodos = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM todo WHERE user_id = ?', 
    [userId]
  );

  return rows.map(t => ({
    id: String(t.id),
    title: t.title,
    start: t.start_date,
    end: t.end_date,
    status: t.status || 'todo'
  }));
};

export const getTodoById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM todo WHERE id = ?', 
    [id]
  );
  return rows[0];
};

export const createTodo = async (userId, title, start, end, description = null, status = 'todo') => {
  const allowedStatus = ['not started','todo','in progress','done'];
  const safeStatus = allowedStatus.includes(status) ? status : 'todo';

  const [result] = await pool.query(
    'INSERT INTO todo (user_id, title, start_date, end_date, status, description) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, title, start, end, status || 'todo', description]
  );
  return result.insertId;
};

export const updateTodo = async (id, title, start, end, status, userId) => {
  const allowedStatus = ['not started','todo','in progress','done'];
  const safeStatus = allowedStatus.includes(status) ? status : 'todo';

  const [result] = await pool.query(
    'UPDATE todo SET title = ?, start_date = ?, end_date = ?, status = ? WHERE id = ? AND user_id = ?',
    [title, start, end, status || 'todo', id, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("You are not allowed to edit this todo or it does not exist.");
  }
};

export const deleteTodo = async (id, userId) => {
  await pool.query('DELETE FROM todo WHERE id = ? AND user_id = ?', [id, userId]);
};
