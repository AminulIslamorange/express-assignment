import { Router } from "express";


import { issueController } from "./issue.controller";
import auth from "../../midleware/auth";


const router = Router();

router.post("/", auth("contributor", "maintainer"), issueController.createIssue);
router.get("/", issueController.getAllIssues);

export const issueRoutes = router;