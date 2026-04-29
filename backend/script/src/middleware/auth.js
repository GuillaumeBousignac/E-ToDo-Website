import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT error:", err.name, err.message);
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        } else {
            return res.status(403).json({ error: "Invalid token" });
        }
    }
}
