import express from "express";
import protect from "../middleware/authMiddleware";
import {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} from "../controllers/applicationController";

const router = express.Router();

router.post("/", protect, createApplication);
router.get("/", protect, getApplications);
router.put("/:id", protect, updateApplication);
router.delete("/:id", protect, deleteApplication);

export default router;