

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/module/user/user.route.ts
import { Router } from "express";

// src/module/user/user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database Failed:", error.message);
    throw error;
  }
};

// src/module/user/user.service.ts
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || "contributor"]
  );
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query(
    "SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  delete user.password;
  return {
    token,
    user
  };
};
var userService = {
  registerUserIntoDB,
  loginUser
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data
  });
};
var sendResponse_default = sendResponse;

// src/module/user/user.controller.ts
var signup = async (req, res, next) => {
  try {
    const result = await userService.registerUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var login = async (req, res, next) => {
  try {
    const result = await userService.loginUser(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var userController = {
  signup,
  login
};

// src/module/user/user.route.ts
var router = Router();
router.post("/signup", userController.signup);
router.post("/login", userController.login);
var userRouter = router;

// src/midleware/golbalErrorHandlar.ts
var globalErrorHanlder = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

// src/app.ts
import cors from "cors";

// src/module/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/module/issue/issue.service.ts
var createIssueIntoDB = async (issueData) => {
  const { title, description, type, priority, reporter_id } = issueData;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, priority, reporter_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, priority, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { type, status, sort } = query;
  const orderSQL = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
  if (type && status) {
    const result2 = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE type = $1 AND status = $2 ${orderSQL}`,
      [type, status]
    );
    return await formatIssuesWithReporters(result2.rows);
  }
  if (type) {
    const result2 = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE type = $1 ${orderSQL}`,
      [type]
    );
    return await formatIssuesWithReporters(result2.rows);
  }
  if (status) {
    const result2 = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE status = $1 ${orderSQL}`,
      [status]
    );
    return await formatIssuesWithReporters(result2.rows);
  }
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues ${orderSQL}`
  );
  return await formatIssuesWithReporters(result.rows);
};
var formatIssuesWithReporters = async (issues) => {
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );
  const userMap = {};
  userResult.rows.forEach((user) => {
    userMap[user.id] = user;
  });
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap[issue.reporter_id] || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE id = $1`,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) return null;
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const user = userResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user ? { id: user.id, name: user.name, role: user.role } : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueInDB = async (id, updateData, currentUser) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  const issue = issueResult.rows[0];
  if (!issue) {
    const error = new Error("Issue not found!");
    error.statusCode = 404;
    throw error;
  }
  if (currentUser.role === "contributor") {
    if (issue.reporter_id !== currentUser.id || issue.status !== "open") {
      const error = new Error("Forbidden! You can only update your own open issues.");
      error.statusCode = 403;
      throw error;
    }
  }
  const { title, description, type, status } = updateData;
  const dbStatus = status !== void 0 ? status : null;
  const updatedResult = await pool.query(
    `UPDATE issues SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       status = COALESCE($4, status), 
       updated_at = NOW() 
     WHERE id = $5 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    //[title, description, type, status,dbStatus, id]
    [title, description, type, dbStatus, id]
  );
  return updatedResult.rows[0];
};
var deleteIssueFromDB = async (id, currentUser) => {
  if (currentUser.role !== "maintainer") {
    const error = new Error("Forbidden! Only maintainers can delete issues.");
    error.statusCode = 403;
    throw error;
  }
  const issueResult = await pool.query(`SELECT id FROM issues WHERE id = $1`, [id]);
  if (issueResult.rows.length === 0) {
    const error = new Error("Issue not found!");
    error.statusCode = 404;
    throw error;
  }
  await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  return true;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/module/issue/issue.controller.ts
var createIssue = async (req, res, next) => {
  try {
    const issueData = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      priority: req.body.priority || "high",
      reporter_id: req.user.id
    };
    const result = await issueService.createIssueIntoDB(issueData);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found!"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const result = await issueService.updateIssueInDB(id, req.body, currentUser);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    await issueService.deleteIssueFromDB(id, currentUser);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
      data: void 0
    });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/midleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access"
        });
        return;
      }
      const decoded = jwt2.verify(token, config_default.secret);
      const userData = await pool.query(
        `SELECT * FROM users WHERE id=$1`,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
        return;
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden Access!!"
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/module/issue/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default("contributor", "maintainer"), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default("contributor", "maintainer"), issueController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), issueController.deleteIssue);
var issueRoutes = router2;

// src/app.ts
var app = express();
var corsOptions = {
  origin: "http://localhost:5000"
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express server running"
  });
});
app.use("/api/auth", userRouter);
app.use("/api/issues", issueRoutes);
app.use(globalErrorHanlder);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`server running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map