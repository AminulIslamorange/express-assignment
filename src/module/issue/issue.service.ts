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
  const { type, status } = query;

  
  if (type && status) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
       FROM issues 
       WHERE type = $1 AND status = $2`,
      [type, status]
    );
    return result.rows;
  } 
  
 
  if (type) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
       FROM issues 
       WHERE type = $1`,
      [type]
    );
    return result.rows;
  } 
  
  
  if (status) {
    const result = await pool.query(
      `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
       FROM issues 
       WHERE status = $1`,
      [status]
    );
    return result.rows;
  }

 
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
     FROM issues`
  );
  return result.rows;
};


const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
     FROM issues 
     WHERE id = $1`,
    [id]
  );
  
  return result.rows[0];
};

// ৪. ইস্যু আপডেট করা
const updateIssueInDB = async (id: string, updateData: IUpdateIssueInput, currentUser: ICurrentUser) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  const issue = issueResult.rows[0];

  if (!issue) {
    throw new Error("Issue not found!");
  }

  if (currentUser.role === "contributor") {
    if (issue.reporter_id !== currentUser.id || issue.status !== "open") {
      throw new Error("Forbidden! You can only update your own open issues.");
    }
  }

  const { title, description, type } = updateData;
  const updatedResult = await pool.query(
    `UPDATE issues SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       updated_at = NOW() 
     WHERE id = $4 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, id]
  );

  return updatedResult.rows[0];
};


const deleteIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(`SELECT id FROM issues WHERE id = $1`, [id]);
  
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found!");
  }

  const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};