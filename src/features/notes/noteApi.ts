import { invoke } from "@tauri-apps/api/core";
import type { CreateNoteInput, Note, UpdateNoteInput } from "./types";

export async function listNotes(): Promise<Note[]> {
  return invoke<Note[]>("list_notes");
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  return invoke<Note>("create_note", { input });
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  return invoke<Note>("update_note", { id, input });
}
