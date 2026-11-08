use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::Utc;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

#[derive(Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Default)]
pub struct NoteStore {
    notes: Vec<Note>,
    db_path: PathBuf,
}

pub type SharedNoteStore = Mutex<NoteStore>;

#[derive(Deserialize)]
pub struct CreateNoteInput {
    pub title: String,
    pub content: String,
}

#[derive(Deserialize)]
pub struct UpdateNoteInput {
    pub title: Option<String>,
    pub content: Option<String>,
    pub completed: Option<bool>,
}

fn open_connection(db_path: &Path) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| {
        format!(
            "failed to open notes database at {}: {e}",
            db_path.display()
        )
    })
}

fn ensure_schema(connection: &Connection) -> Result<(), String> {
    connection
        .execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("failed to create notes table: {e}"))?;

    let mut statement = connection
        .prepare("PRAGMA table_info(notes)")
        .map_err(|e| format!("failed to inspect notes schema: {e}"))?;
    let column_names = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| format!("failed to read notes schema: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("failed to parse notes schema: {e}"))?;

    if !column_names.iter().any(|name| name == "completed") {
        connection
            .execute(
                "ALTER TABLE notes ADD COLUMN completed INTEGER NOT NULL DEFAULT 0",
                [],
            )
            .map_err(|e| format!("failed to add completed column: {e}"))?;
    }

    Ok(())
}

fn load_notes(connection: &Connection) -> Result<Vec<Note>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, title, content, completed, created_at, updated_at
             FROM notes
             ORDER BY updated_at DESC",
        )
        .map_err(|e| format!("failed to prepare notes query: {e}"))?;

    let rows = statement
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                completed: row.get::<_, i64>(3)? != 0,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("failed to query notes: {e}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("failed to read notes: {e}"))
}

pub fn initialize_note_store(app: &AppHandle) -> Result<SharedNoteStore, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data directory: {e}"))?;

    fs::create_dir_all(&data_dir).map_err(|e| {
        format!(
            "failed to create app data directory at {}: {e}",
            data_dir.display()
        )
    })?;

    let db_path = data_dir.join("notes.db");
    let connection = open_connection(&db_path)?;
    ensure_schema(&connection)?;
    let notes = load_notes(&connection)?;

    Ok(Mutex::new(NoteStore { notes, db_path }))
}

#[tauri::command]
pub fn create_note(
    store: State<'_, SharedNoteStore>,
    input: CreateNoteInput,
) -> Result<Note, String> {
    let mut note_store = store
        .lock()
        .map_err(|_| String::from("failed to acquire note store lock"))?;

    let now = Utc::now().to_rfc3339();
    let id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("failed to create note id: {e}"))?
        .as_nanos()
        .to_string();

    let note = Note {
        id,
        title: input.title,
        content: input.content,
        completed: false,
        created_at: now.clone(),
        updated_at: now,
    };

    let connection = open_connection(&note_store.db_path)?;
    connection
        .execute(
            "INSERT INTO notes (id, title, content, completed, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                &note.id,
                &note.title,
                &note.content,
                if note.completed { 1 } else { 0 },
                &note.created_at,
                &note.updated_at
            ],
        )
        .map_err(|e| format!("failed to insert note: {e}"))?;

    note_store.notes.push(note.clone());
    Ok(note)
}

#[tauri::command]
pub fn list_notes(store: State<'_, SharedNoteStore>) -> Result<Vec<Note>, String> {
    let note_store = store
        .lock()
        .map_err(|_| String::from("failed to acquire note store lock"))?;

    Ok(note_store.notes.clone())
}

#[tauri::command]
pub fn get_note(store: State<'_, SharedNoteStore>, id: String) -> Result<Note, String> {
    let note_store = store
        .lock()
        .map_err(|_| String::from("failed to acquire note store lock"))?;

    note_store
        .notes
        .iter()
        .find(|note| note.id == id)
        .cloned()
        .ok_or_else(|| format!("note not found: {id}"))
}

#[tauri::command]
pub fn update_note(
    store: State<'_, SharedNoteStore>,
    id: String,
    input: UpdateNoteInput,
) -> Result<Note, String> {
    let mut note_store = store
        .lock()
        .map_err(|_| String::from("failed to acquire note store lock"))?;

    let note_index = note_store
        .notes
        .iter()
        .position(|note| note.id == id)
        .ok_or_else(|| format!("note not found: {id}"))?;

    let mut updated_note = note_store.notes[note_index].clone();

    if let Some(title) = input.title {
        updated_note.title = title;
    }

    if let Some(content) = input.content {
        updated_note.content = content;
    }

    if let Some(completed) = input.completed {
        updated_note.completed = completed;
    }

    updated_note.updated_at = Utc::now().to_rfc3339();

    let connection = open_connection(&note_store.db_path)?;
    connection
        .execute(
            "UPDATE notes
             SET title = ?1, content = ?2, completed = ?3, updated_at = ?4
             WHERE id = ?5",
            params![
                &updated_note.title,
                &updated_note.content,
                if updated_note.completed { 1 } else { 0 },
                &updated_note.updated_at,
                &updated_note.id
            ],
        )
        .map_err(|e| format!("failed to update note: {e}"))?;

    note_store.notes[note_index] = updated_note.clone();
    Ok(updated_note)
}

#[tauri::command]
pub fn delete_note(store: State<'_, SharedNoteStore>, id: String) -> Result<(), String> {
    let mut note_store = store
        .lock()
        .map_err(|_| String::from("failed to acquire note store lock"))?;

    let position = note_store
        .notes
        .iter()
        .position(|note| note.id == id)
        .ok_or_else(|| format!("note not found: {id}"))?;

    let connection = open_connection(&note_store.db_path)?;
    connection
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|e| format!("failed to delete note: {e}"))?;

    note_store.notes.remove(position);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_db_path(test_name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time before unix epoch")
            .as_nanos();
        std::env::temp_dir().join(format!("jot-{test_name}-{unique}.sqlite"))
    }

    #[test]
    fn ensure_schema_adds_completed_column_for_legacy_table() {
        let db_path = test_db_path("migration");
        let connection = Connection::open(&db_path).expect("open db");

        connection
            .execute(
                "CREATE TABLE notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )",
                [],
            )
            .expect("create legacy schema");

        ensure_schema(&connection).expect("apply schema");

        let has_completed: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('notes') WHERE name = 'completed'",
                [],
                |row| row.get(0),
            )
            .expect("read schema");

        assert_eq!(has_completed, 1);
        let _ = std::fs::remove_file(db_path);
    }

    #[test]
    fn load_notes_reads_completed_and_orders_by_updated_at_desc() {
        let db_path = test_db_path("load");
        let connection = Connection::open(&db_path).expect("open db");
        ensure_schema(&connection).expect("create schema");

        connection
            .execute(
                "INSERT INTO notes (id, title, content, completed, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    "1",
                    "Old note",
                    "first",
                    0,
                    "2026-01-01T10:00:00Z",
                    "2026-01-01T10:00:00Z"
                ],
            )
            .expect("insert first note");

        connection
            .execute(
                "INSERT INTO notes (id, title, content, completed, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    "2",
                    "New note",
                    "second",
                    1,
                    "2026-01-01T11:00:00Z",
                    "2026-01-01T11:00:00Z"
                ],
            )
            .expect("insert second note");

        let notes = load_notes(&connection).expect("load notes");

        assert_eq!(notes.len(), 2);
        assert_eq!(notes[0].id, "2");
        assert!(notes[0].completed);
        assert_eq!(notes[1].id, "1");
        assert!(!notes[1].completed);

        let _ = std::fs::remove_file(db_path);
    }
}
