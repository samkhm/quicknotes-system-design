# QuickNotes Data Model

## Design choice

QuickNotes is a relational application: users own notes, and notes can have multiple tags while tags can label multiple notes. PostgreSQL is a good default because foreign keys, transactions, unique constraints, and joins enforce these relationships reliably. JSON fields can still hold flexible note metadata when needed, but the core entities and relationships benefit from a normalized SQL schema.

## Entities and relationships

- **users**: one user can own many notes and create many tags (`users 1:N notes`, `users 1:N tags`).
- **notes**: each note belongs to exactly one user.
- **tags**: each tag belongs to one user, allowing users to reuse tag names privately.
- **note_tags**: junction table joining notes and tags. Notes and tags have a many-to-many relationship (`notes M:N tags`). Composite primary key prevents attaching the same tag twice to one note.

## PostgreSQL schema

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notes_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tags_user_name_unique UNIQUE (user_id, name),
    CONSTRAINT tags_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);
```

### Columns, types and keys summary

| Entity | Columns and types | Primary key | Foreign keys |
|---|---|---|---|
| users | `id BIGINT`, `email VARCHAR(320)`, `password_hash TEXT`, `display_name VARCHAR(120)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ` | `id` | None |
| notes | `id BIGINT`, `user_id BIGINT`, `title VARCHAR(100)`, `body TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ` | `id` | `user_id → users.id` |
| tags | `id BIGINT`, `user_id BIGINT`, `name VARCHAR(50)`, `created_at TIMESTAMPTZ` | `id` | `user_id → users.id` |
| note_tags | `note_id BIGINT`, `tag_id BIGINT`, `created_at TIMESTAMPTZ` | `(note_id, tag_id)` | `note_id → notes.id`, `tag_id → tags.id` |

## Indexes

```sql
-- Supports the common query: list a user's newest/most recently edited notes.
CREATE INDEX idx_notes_user_updated
    ON notes (user_id, updated_at DESC, id DESC);

-- Supports looking up all notes associated with a tag.
CREATE INDEX idx_note_tags_tag
    ON note_tags (tag_id, note_id);
```

The first index supports the user's paginated note feed and ordering. The second supports reverse lookups from a tag to its notes. The unique constraints already create indexes for `users.email` and `(tags.user_id, tags.name)`.

## Example SQL queries

### 1. List the newest notes for one user

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
ORDER BY updated_at DESC, id DESC
LIMIT 20 OFFSET 0;
```

### 2. JOIN notes to tags

```sql
SELECT n.id, n.title, t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = $1
ORDER BY n.updated_at DESC;
```

### 3. Create a note safely and return it

```sql
INSERT INTO notes (user_id, title, body)
VALUES ($1, $2, COALESCE($3, ''))
RETURNING id, user_id, title, body, created_at, updated_at;
```

### 4. Count notes per user

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

Use parameterized queries (`$1`, `$2`, etc.) rather than concatenating user input into SQL. In the tag-attachment operation, the service must also verify that the note and tag belong to the same user; foreign keys alone do not enforce same-owner membership.
