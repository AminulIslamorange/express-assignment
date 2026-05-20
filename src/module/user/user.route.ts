import { Router } from "express";
import { userController } from "./user.controller";


const router = Router();


router.post("/signup", userController.signup);


router.post("/login", userController.login);

export const userRouter = router;