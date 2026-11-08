import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotesApp } from "./NotesApp";
import { makeStore } from "../../store";
import type { Note } from "./types";

const noteApiMock = vi.hoisted(() => ({
  listNotes: vi.fn<() => Promise<Note[]>>(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
}));

vi.mock("./noteApi", () => noteApiMock);

function buildNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "1",
    title: "Draft roadmap",
    content: "Write product roadmap note",
    completed: false,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("NotesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderApp() {
    const store = makeStore();
    return render(
      <Provider store={store}>
        <NotesApp />
      </Provider>,
    );
  }

  it("loads and renders note cards", async () => {
    noteApiMock.listNotes.mockResolvedValue([buildNote(), buildNote({ id: "2", title: "Sync" })]);

    renderApp();

    await screen.findByText("Draft roadmap");
    expect(screen.getByText("Sync")).toBeInTheDocument();
    expect(noteApiMock.listNotes).toHaveBeenCalledTimes(1);
  });

  it("creates a new note and prepends it to cards", async () => {
    const existing = buildNote();
    const created = buildNote({
      id: "3",
      title: "Daily standup",
      content: "Capture standup notes",
    });

    noteApiMock.listNotes.mockResolvedValue([existing]);
    noteApiMock.createNote.mockResolvedValue(created);

    renderApp();
    await screen.findByText("Draft roadmap");

    await userEvent.type(screen.getByPlaceholderText("Note title"), "Daily standup");
    await userEvent.type(
      screen.getByPlaceholderText("Note description"),
      "Capture standup notes",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create note" }));

    await screen.findByText("Daily standup");
    expect(noteApiMock.createNote).toHaveBeenCalledWith({
      title: "Daily standup",
      content: "Capture standup notes",
    });
  });

  it("toggles completion state", async () => {
    const initial = buildNote();
    const updated = buildNote({
      completed: true,
      updated_at: "2026-01-01T12:00:00Z",
    });

    noteApiMock.listNotes.mockResolvedValue([initial]);
    noteApiMock.updateNote.mockResolvedValue(updated);

    renderApp();
    await screen.findByText("Draft roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Mark completed" }));

    await waitFor(() => {
      expect(noteApiMock.updateNote).toHaveBeenCalledWith("1", { completed: true });
    });
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument();
  });

  it("shows and hides completed notes only", async () => {
    const done = buildNote({ id: "1", title: "Done task", completed: true });
    const todo = buildNote({ id: "2", title: "Todo task", completed: false });
    noteApiMock.listNotes.mockResolvedValue([done, todo]);

    renderApp();
    await screen.findByText("Done task");
    expect(screen.getByText("Todo task")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Hide completed notes" }));
    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
    expect(screen.getByText("Todo task")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show completed notes" }));
    expect(screen.getByText("Done task")).toBeInTheDocument();
  });

  it("opens and closes a full note overlay on card click", async () => {
    const longNote = buildNote({
      title: "Architecture notes",
      content:
        "Line 1: service boundaries.\nLine 2: event flow.\nLine 3: persistence and retries.",
    });

    noteApiMock.listNotes.mockResolvedValue([longNote]);

    renderApp();
    await screen.findByText("Architecture notes");

    await userEvent.click(screen.getByText("Architecture notes"));
    expect(screen.getByDisplayValue("Architecture notes")).toBeInTheDocument();
    const markdownInput = screen.getByLabelText("Description (Markdown)") as HTMLTextAreaElement;
    expect(markdownInput.value).toContain("Line 1: service boundaries.");
    expect(markdownInput.value).toContain("Line 2: event flow.");
    expect(markdownInput.value).toContain("Line 3: persistence and retries.");

    await userEvent.click(screen.getByRole("button", { name: "Close note details" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Close note details" })).not.toBeInTheDocument();
    });
  });

  it("edits and saves note details from overlay", async () => {
    const initial = buildNote();
    const updated = buildNote({
      title: "Updated roadmap",
      content: "# Heading\nNew plan details",
      updated_at: "2026-01-01T12:00:00Z",
    });
    noteApiMock.listNotes.mockResolvedValue([initial]);
    noteApiMock.updateNote.mockResolvedValue(updated);

    renderApp();
    await screen.findByText("Draft roadmap");

    await userEvent.click(screen.getByText("Draft roadmap"));
    const titleInput = screen.getByLabelText("Title") as HTMLInputElement;
    const contentInput = screen.getByLabelText("Description (Markdown)") as HTMLTextAreaElement;

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated roadmap");
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, "# Heading{enter}New plan details");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(noteApiMock.updateNote).toHaveBeenCalledWith("1", {
        title: "Updated roadmap",
        content: "# Heading\nNew plan details",
      });
    });
    await waitFor(() => {
      expect(screen.queryByLabelText("Description (Markdown)")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Note updated successfully.")).toBeInTheDocument();
  });

  it("shows failure toast when note update fails and closes overlay", async () => {
    const initial = buildNote();
    noteApiMock.listNotes.mockResolvedValue([initial]);
    noteApiMock.updateNote.mockRejectedValue(new Error("Failed to update note"));

    renderApp();
    await screen.findByText("Draft roadmap");

    await userEvent.click(screen.getByText("Draft roadmap"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Description (Markdown)")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Failed to update note")).toBeInTheDocument();
  });

  it("discards overlay edits and closes on escape", async () => {
    const initial = buildNote({ content: "original content" });
    noteApiMock.listNotes.mockResolvedValue([initial]);

    renderApp();
    await screen.findByText("Draft roadmap");

    await userEvent.click(screen.getByText("Draft roadmap"));
    const contentInput = screen.getByLabelText("Description (Markdown)") as HTMLTextAreaElement;
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, "unsaved update");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByLabelText("Description (Markdown)")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Draft roadmap"));
    expect(screen.getByLabelText("Description (Markdown)")).toHaveValue("original content");
  });

  it("switches editor between write and preview modes", async () => {
    noteApiMock.listNotes.mockResolvedValue([buildNote()]);

    renderApp();
    await screen.findByText("Draft roadmap");
    await userEvent.click(screen.getByText("Draft roadmap"));

    expect(screen.getByLabelText("Description (Markdown)")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Markdown Preview")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description (Markdown)")).not.toBeInTheDocument();
  });

  it("renders markdown content in note cards", async () => {
    noteApiMock.listNotes.mockResolvedValue([
      buildNote({ content: "this is **another** test note", title: "Markdown card" }),
    ]);

    renderApp();
    await screen.findByText("Markdown card");

    expect(screen.getByText("another")).toBeInTheDocument();
    expect(screen.queryByText("this is **another** test note")).not.toBeInTheDocument();
  });
});
