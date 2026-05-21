import type { NextFunction, Request, Response } from "express";

 export const globalErrorHanlder=(err:any, req:Request, res:Response, next:NextFunction) => {
  //console.error(err.stack); // Log the error

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}