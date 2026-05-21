import { pool } from "../../db";


const createIssueIntoDB = async (issueData: any) => {
  const { title, description, type, priority, reporter_id } = issueData;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, priority, reporter_id) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, priority, reporter_id]
  );
  return result.rows[0];
};

const getAllIssuesFromDB = async (query: Record<string, any>) => {
  const { sort = "newest", type, status } = query;

  let queryText = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
  const queryParams: any[] = [];
  const conditions: string[] = [];

  if (type) {
    queryParams.push(type);
    conditions.push(`type = $${queryParams.length}`);
  }

  if (status) {
    queryParams.push(status);
    conditions.push(`status = $${queryParams.length}`);
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ` + conditions.join(" AND ");
  }

  const sortOrder = sort === "oldest" ? "ASC" : "DESC";
  queryText += ` ORDER BY created_at ${sortOrder}`;

  const issueResult = await pool.query(queryText, queryParams);
  const issues = issueResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const userQueryText = `
    SELECT id, name, role 
    FROM users 
    WHERE id = ANY($1::int[])
  `;
  const userResult = await pool.query(userQueryText, [reporterIds]);
  const users = userResult.rows;

  const userMap = users.reduce((acc: Record<number, any>, user) => {
    acc[user.id] = {
      id: user.id,
      name: user.name,
      role: user.role,
    };
    return acc;
  }, {});

  const formattedIssues = issues.map((issue) => {
    const { reporter_id, ...restIssueData } = issue;
    return {
      ...restIssueData,
      reporter: userMap[reporter_id] || null,
    };
  });

  return formattedIssues;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};