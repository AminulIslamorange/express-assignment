import express, { type Application, type Request, type Response } from 'express';
import { userRouter } from './module/user/user.route';
import { globalErrorHanlder } from './midleware/golbalErrorHandlar';

const app:Application = express()
const port = 5000;

import cors from 'cors'
import { issueRoutes } from './module/issue/issue.route';
const corsOptions = {
  origin: 'http://localhost:5000',
 
}

app.use(cors(corsOptions));


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req:Request, res:Response) => {
  res.status(200).json({
    message:'Express server running'
  })
})



app.use("/api/auth", userRouter);
app.use("/api/issues", issueRoutes);









// Global Error Handling Middleware
app.use(globalErrorHanlder);

export default app;