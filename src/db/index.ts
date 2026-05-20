import config from "../config";
import { Pool } from "pg";


export const pool = new Pool({
  connectionString:config.connection_string
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
                  id SERIAL PRIMARY KEY,
                 name VARCHAR(50),
                email VARCHAR(100)UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                age INT,
                role VARCHAR(10) DEFAULT 'user',
                 created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
);
      `);
      await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles(
      id SERIAL PRIMARY KEY,
      user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,

      bio TEXT,
      address TEXT,
      phone VARCHAR(15),
      gender VARCHAR(10),

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )  
        `);
      console.log('Database connected succesfully')

  } catch (error) {
    console.log(error)

  }

}