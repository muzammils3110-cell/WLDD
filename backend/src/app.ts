import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";

const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
// app.use("/api/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;