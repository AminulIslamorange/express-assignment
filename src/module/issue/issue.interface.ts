// export interface IIssue {
//   id?: number;
//   title: string;
//   description: string;
//   type: 'bug' | 'feature_request';
//   status?: 'open' | 'in_progress' | 'resolved' | 'closed';
//   priority: 'low' | 'medium' | 'high';
//   reporter_id: number;
//   assignee_id?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
// }

export interface IIssue {
  id?: number;
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  reporter_id: number;
  assignee_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICreateIssueInput {
  title: string;
  description: string;
  type: "bug" | "feature_request";
  priority: 'low' | 'medium' | 'high';
  reporter_id: number;
}

export interface IGetAllIssuesQuery {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved" | "closed";
}

export interface IUpdateIssueInput {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
}

export interface ICurrentUser {
  id: number;
  role: "contributor" | "maintainer";
}