import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";
import type { IUser } from "./user.interface";


const registerUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;


  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

 
  const hashedPassword = await bcrypt.hash(password!, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || 'contributor'] 
  );

  return result.rows[0];
};

const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

 
  const result = await pool.query(
    "SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

 
  const isPasswordMatched = await bcrypt.compare(password!, user.password);
  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

 
  const token = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  
  delete user.password;

  return {
    token,
    user,
  };
};

export const userService = {
  registerUserIntoDB,
  loginUser,
};