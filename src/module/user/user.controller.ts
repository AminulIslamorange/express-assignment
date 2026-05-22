import type { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../utils/sendResponse";


const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.registerUserIntoDB(req.body);

   
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result, 
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.loginUser(req.body);

   
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  signup,
  login,
};