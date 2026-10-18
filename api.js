const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type ? `status ${type}` : "status";
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`The server returned ${response.status} ${response.statusText || "an error"}.`);
  }

  // DELETE responses from JSONPlaceholder can have an empty body.
  if (response.status === 204) return { data: null, status: response.status };
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  return { data, status: response.status };
}

function renderEmptyState(message = "No notes to display. Create a note or load notes from the server.") {
  notesList.replaceChildren();
  const item = document.createElement("li");
  item.className = "empty-state muted";
  item.textContent = message;
  notesList.append(item);
}

function renderNote(note, { prepend = false } = {}) {
  const item = document.createElement("li");
  item.className = "note-item";
  item.dataset.noteId = String(note.id);

  const top = document.createElement("div");
  top.className = "note-top";
  const content = document.createElement("div");
  const id = document.createElement("span");
  id.className = "note-id";
  id.textContent = `Note #${note.id}`;
  const title = document.createElement("h3");
  title.textContent = note.title || "(Untitled note)";
  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";
  content.append(id, title, body);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteNote(note.id, deleteButton));

  top.append(content, deleteButton);
  item.append(top);

  // Remove the empty-state placeholder before inserting the first note.
  const placeholder = notesList.querySelector(".empty-state");
  if (placeholder) placeholder.remove();
  if (prepend) notesList.prepend(item);
  else notesList.append(item);
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...");
  try {
    const { data: notes } = await request(`${API_URL}?_limit=10`);
    if (!Array.isArray(notes) || notes.length === 0) {
      renderEmptyState("No notes found. Create your first note below.");
      setStatus("The server returned no notes.", "success");
      return;
    }
    notesList.replaceChildren();
    notes.forEach((note) => renderNote(note));
    setStatus(`Loaded ${notes.length} notes from the server.`, "success");
  } catch (error) {
    setStatus(`Could not load notes. ${error.message} Please check your connection and try again.`, "error");
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title before creating a note.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...");
  try {
    const { data: created, status } = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 })
    });
    renderNote(created, { prepend: true });
    setStatus(`Note created (status ${status}, id ${created.id}). Note: JSONPlaceholder simulates writes; this note will not persist on its server.`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus(`Could not create the note. ${error.message} Please try again.`, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  const item = notesList.querySelector(`[data-note-id="${CSS.escape(String(id))}"]`);
  button.disabled = true;
  setStatus(`Deleting note #${id}...`);
  try {
    await request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });

    // JSONPlaceholder does not persist POSTs or DELETEs. We remove the item from
    // this browser's current view after its simulated DELETE succeeds.
    if (item) item.remove();
    if (notesList.querySelectorAll(".note-item").length === 0) {
      renderEmptyState("No notes to display. Load notes or create a new note.");
    }
    setStatus(`Note #${id} deleted from this view. JSONPlaceholder does not permanently store this change.`, "success");
  } catch (error) {
    setStatus(`Could not delete note #${id}. ${error.message} Please try again.`, "error");
    button.disabled = false;
  } finally {
    // A successful delete removes the button with its note; on error it is re-enabled.
    if (button.isConnected) button.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
