import express from "express";
import protect from "../middleware/authMiddleware";
import { parseJD, getResumeSuggestions } from "../controllers/aiController";

const router = express.Router();

router.post("/parse", protect, parseJD);
router.post("/resume", protect, getResumeSuggestions);

export default router;