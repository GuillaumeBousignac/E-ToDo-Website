import express from "express";
import auth from "../../middleware/auth.js";
import { getUserById } from "./user.query.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
