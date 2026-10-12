import { Router } from "express";
import {
  createCampaign,
  getLiveCampaigns,
  getMyCampaigns,
} from "../controllers/campaign.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("brand"), createCampaign);
router.get("/mine", requireRole("brand"), getMyCampaigns);
router.get("/", getLiveCampaigns);

export default router;