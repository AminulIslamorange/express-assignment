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