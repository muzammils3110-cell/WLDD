import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  updateSubmissionViews,
} from "../controllers/submission.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.post("/", authenticate, requireRole("creator"), createSubmission);
router.get("/mine", authenticate, requireRole("creator"), getMySubmissions);

// Simulates platform data ingestion, so there is deliberately no auth here (per the brief)
router.patch("/:id/views", updateSubmissionViews);

export default router;