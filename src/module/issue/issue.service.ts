import { pool } from "../../db";
import type { ICreateIssueInput, ICurrentUser, IGetAllIssuesQuery, IUpdateIssueInput } from "./issue.interface";



const createIssueIntoDB = async (issueData: ICreateIssueInput) => {
  const { title, description, type, priority, reporter_id } = issueData;
  
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, priority, reporter_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, priority, reporter_id]
  );
  
  return result.rows[0];
};


const getAllIssuesFromDB = async (query: IGetAllIssuesQuery) => {
  const { type, status, sort } = query;
  const orderSQL = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  if (type && status) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE type = $1 AND status = $2 ${orderSQL}`,
      [type, status]
    );
    return formatIssuesWithReporters(result.rows);
  } 
  
  if (type) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE type = $1 ${orderSQL}`,
      [type]
    );
    return formatIssuesWithReporters(result.rows);
  } 
  
  if (status) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE status = $1 ${orderSQL}`,
      [status]
    );
    return formatIssuesWithReporters(result.rows);
  }

  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues ${orderSQL}`
  );
  return formatIssuesWithReporters(result.rows);
};


const formatIssuesWithReporters = async (issues: Record<string, unknown>[]) => {
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id as number))];
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );

  const userMap: Record<number, { id: number; name: string; role: string }> = {};
  userResult.rows.forEach((user) => {
    userMap[user.id] = user;
  });

  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap[issue.reporter_id as number] || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));
};


const getSingleIssueFromDB = async (id: string) => {
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
    updated_at: issue.updated_at,
  };
};


const updateIssueInDB = async (id: string, updateData: IUpdateIssueInput, currentUser: ICurrentUser) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  const issue = issueResult.rows[0];

  if (!issue) {
    const error = new Error("Issue not found!");
    (error as any).statusCode = 404; 
    throw error;
  }

  if (currentUser.role === "contributor") {
    if (issue.reporter_id !== currentUser.id || issue.status !== "open") {
      const error = new Error("Forbidden! You can only update your own open issues.");
      (error as any).statusCode = 403;
      throw error;
    }
  }

 
  const { title, description, type, status } = updateData as IUpdateIssueInput;

  const updatedResult = await pool.query(
    `UPDATE issues SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       status = COALESCE($4, status), 
       updated_at = NOW() 
     WHERE id = $5 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, status, id]
  );

  return updatedResult.rows[0];
};


const deleteIssueFromDB = async (id: string, currentUser: ICurrentUser) => {
  if (currentUser.role !== "maintainer") {
    const error = new Error("Forbidden! Only maintainers can delete issues.");
    (error as any).statusCode = 403;
    throw error;
  }

  const issueResult = await pool.query(`SELECT id FROM issues WHERE id = $1`, [id]);
  if (issueResult.rows.length === 0) {
    const error = new Error("Issue not found!");
    (error as any).statusCode = 404;
    throw error;
  }

  await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  return true;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};