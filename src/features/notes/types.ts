export type Note = {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  target_completion_at: string;
  created_at: string;
  updated_at: string;
};

export type CreateNoteInput = {
  title: string;
  content: string;
  target_completion_at?: string;
};

export type UpdateNoteInput = {
  title?: string;
  content?: string;
  completed?: boolean;
  target_completion_at?: string;
};
