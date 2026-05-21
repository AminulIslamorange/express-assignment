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


const getSingleIssueFromDB = async (id: string) => {
  
  const issueResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
     FROM issues 
     WHERE id = $1`,
    [id]
  );

  const issue = issueResult.rows[0];

 
  if (!issue) {
    return null;
  }

 
  const userResult = await pool.query(
    `SELECT id, name, role 
     FROM users 
     WHERE id = $1`,
    [issue.reporter_id]
  );

  const user = userResult.rows[0];

  
  const { reporter_id, ...restIssueData } = issue;
  
  return {
    ...restIssueData,
    reporter: user ? {
      id: user.id,
      name: user.name,
      role: user.role,
    } : null,
  };
};
const updateIssueInDB = async (id: string, updateData: any, currentUser: any) => {
  // ১. প্রথমে ডাটাবেজ থেকে ইস্যুটি খুঁজে বের করি
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  const issue = issueResult.rows[0];

  if (!issue) {
    const error: any = new Error("Issue not found!");
    error.statusCode = 404;
    throw error;
  }

  // ২. অ্যাক্সেস কন্ট্রোল লজিক চেক
  if (currentUser.role === "contributor") {
    // নিজের ইস্যু কি না চেক
    if (issue.reporter_id !== currentUser.id) {
      const error: any = new Error("You can only update your own issues!");
      error.statusCode = 403;
      throw error;
    }
    // স্ট্যাটাস open আছে কি না চেক
    if (issue.status !== "open") {
      const error: any = new Error("You can only update issues when the status is open!");
      error.statusCode = 403;
      throw error;
    }
  }

  // ৩. ডাইনামিক আপডেট কুয়েরি তৈরি (Title, Description, Type)
  const { title, description, type } = updateData;
  const finalTitle = title !== undefined ? title : issue.title;
  const finalDescription = description !== undefined ? description : issue.description;
  const finalType = type !== undefined ? type : issue.type;

  const updatedResult = await pool.query(
    `UPDATE issues 
     SET title = $1, description = $2, type = $3, updated_at = NOW() 
     WHERE id = $4 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [finalTitle, finalDescription, finalType, id]
  );

  return updatedResult.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,getSingleIssueFromDB,updateIssueInDB
};