import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes are mounted here as we build them:
// app.use("/api/auth", authRoutes);
// app.use("/api/campaigns", campaignRoutes);
// app.use("/api/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;