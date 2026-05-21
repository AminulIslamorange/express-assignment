import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";
import type { ICurrentUser } from "./issue.interface";
import sendResponse from "../../utils/sendResponse";

// const createIssue = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const issueData = {
//       title: req.body.title,
//       description: req.body.description,
//       type: req.body.type,
//       priority: req.body.priority || "high", 
//       reporter_id: req.user.id,
//     };

//     const result = await issueService.createIssueIntoDB(issueData);

//     res.status(201).json({
//       success: true,
//       message: "Issue created successfully",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueData = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      priority: req.body.priority || "high", 
      reporter_id: req.user.id, // 🎯 রিকোয়ারমেন্টের হিন্ট অনুযায়ী ১০০% পারফেক্ট
    };

    const result = await issueService.createIssueIntoDB(issueData);

    // 🎯 অরিজিনাল রেসপন্স ও স্ট্যাটাস কোড (201) ঠিক রেখে sendResponse ব্যবহার করা হলো
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
// const getAllIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const result = await issueService.getAllIssuesFromDB(req.query);

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const getAllIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 🎯 কোয়েরি প্যারামিটারসহ (sort, type, status) সার্ভিস কল হচ্ছে যা আমরা একটু আগে সার্ভিসে ফিক্স করেছি
    const result = await issueService.getAllIssuesFromDB(req.query);

    // 🎯 রিকোয়ারমেন্টের ফরম্যাট (200 OK) এবং কোনো message ছাড়া শুধু data পাঠানো হলো
    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result, // 👈 এখানে message দেওয়া যাবে না, কারণ টিচারের সাকসেস রেসপন্সে message ফিল্ড নেই
    });
  } catch (error) {
    next(error);
  }
};
// const getSingleIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const result = await issueService.getSingleIssueFromDB(id as string);

//     if (!result) {
//       res.status(404).json({
//         success: false,
//         message: "Issue not found!",
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const getSingleIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id as string);

    // ❌ যদি ডাটাবেজে এই আইডি দিয়ে কোনো ইস্যু না পাওয়া যায় (৪0৪ Not Found)
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found!",
      });
      return;
    }

    // 🎯 রিকোয়ারমেন্টের ফরম্যাট (200 OK) অনুযায়ী কোনো message ছাড়া শুধু data পাঠানো হলো
    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result, // 👈 এখানেও কোনো message ফিল্ড হবে না, রিকোয়ারমেন্টের অবজেক্ট হুবহু মেইনটেইন করা হয়েছে
    });
  } catch (error) {
    next(error);
  }
};
// const updateIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const currentUser = req.user; 

//     const result = await issueService.updateIssueInDB(id as string, req.body, currentUser as ICurrentUser);

//     res.status(200).json({
//       success: true,
//       message: "Issue updated successfully",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const updateIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user; // 🎯 লগইন করা ইউজারকে নেওয়া হলো

    // 🎯 ডাটা, আইডি এবং কারেন্ট ইউজারকে সার্ভিসে পাঠানো হচ্ছে (সিকিউরিটি লজিকসহ)
    const result = await issueService.updateIssueInDB(id as string, req.body, currentUser as ICurrentUser);

    // 🎯 রিকোয়ারমেন্টের ফরম্যাট (200 OK) অনুযায়ী success, message এবং data তিনটিই পাঠানো হলো
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully", // 👈 রিকোয়ারমেন্ট অনুযায়ী মেসেজ ফিল্ড থাকবে
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const deleteIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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