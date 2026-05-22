import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";
import type { ICurrentUser } from "./issue.interface";
import sendResponse from "../../utils/sendResponse";

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

   
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const result = await issueService.getAllIssuesFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result, 
    });
  } catch (error) {
    next(error);
  }
};


const getSingleIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
      return;
    }
      sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result, 
    });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user; 

    
    const result = await issueService.updateIssueInDB(id as string, req.body, currentUser as ICurrentUser);

    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    
    await issueService.deleteIssueFromDB(id as string, currentUser as ICurrentUser);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: undefined, 
    });
  } catch (error) {
    next(error);
  }
};

export const issueController = {
  createIssue,getAllIssues,getSingleIssue,updateIssue,deleteIssue
};