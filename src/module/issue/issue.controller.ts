import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueData = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      priority: req.body.priority || "high", 
      reporter_id: req.user.id,
    };

    const result = await issueService.createIssueIntoDB(issueData);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
const getAllIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const issueController = {
  createIssue,getAllIssues,
};