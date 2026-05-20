import express, { type Application, type Request, type Response } from 'express';
import { userRouter } from './module/user/user.route';

const app:Application = express()
const port = 5000;




app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req:Request, res:Response) => {
  res.status(200).json({
    message:'Express server running'
  })
})

app.use("/api/auth", userRouter);



export default app;