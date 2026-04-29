import express from "express";
import pool from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", async (req, res) => {
    const { email, password, name, firstname } = req.body;
    if (!email || !password || !name || !firstname)
        return res.status(400).json({ error: "Missing fields" });

    try {
        const hashed = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO user (email, password, name, firstname) VALUES (?, ?, ?, ?)",
            [email, hashed, name, firstname]
        );
        res.json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Missing fields" });

    try {
        const [[user]] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
        if (!user) return res.status(404).json({ error: "User not found" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                firstname: user.firstname
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
