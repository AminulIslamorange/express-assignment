import { Router } from "express";


import { issueController } from "./issue.controller";
import auth from "../../midleware/auth";


const router = Router();

router.post("/", auth("contributor", "maintainer"), issueController.createIssue);

//{For unautorized access we need to add auth(but requirement is api will be pubic)that why I commented this line}

//router.get("/", auth("contributor", "maintainer"), issueController.getAllIssues);



router.get("/",  issueController.getAllIssues);

router.get("/:id", issueController.getSingleIssue);

router.patch("/:id", auth("contributor", "maintainer"), issueController.updateIssue);

router.delete("/:id", auth("maintainer"), issueController.deleteIssue);

export const issueRoutes = router;