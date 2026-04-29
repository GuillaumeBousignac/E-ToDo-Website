import db from '../../config/db.js';

export async function getAllUsers() {
    const [rows] = await db.query('SELECT * FROM user');
    return rows;
}

export async function createUser(data) {
    const { name, email, password} = data;
    const [result] = await db.query(
        'INSERT INTO user (name, email, password) VALUES (?, ?, ?)',
        [name, email, password]
    );
    return { id: result.insertId, name, email };
}

export async function getUserById(id) {
    const [rows] = await db.query('SELECT * FROM user WHERE id = ?', [id]);
    return rows[0];
}
