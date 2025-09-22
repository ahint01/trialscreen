export interface Trial {
  id: string;
  user_id: string;
  title: string;
  description: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  created_at: Date;
  updated_at: Date;
}
