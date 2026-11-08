export type Note = {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateNoteInput = {
  title: string;
  content: string;
};

export type UpdateNoteInput = {
  title?: string;
  content?: string;
  completed?: boolean;
};
