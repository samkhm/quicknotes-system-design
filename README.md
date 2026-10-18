# QuickNotes System Design

QuickNotes is a small browser-based API client and system-design exercise. The client uses JSONPlaceholder to practise REST requests for listing, creating, and deleting notes. The `docs/` directory proposes the production API, PostgreSQL data model, and architecture for a service planned for one million registered users.

> **Practice API limitation:** JSONPlaceholder simulates POST and DELETE responses but does not permanently save those changes. The UI updates locally after a successful simulated request.

## Project files

- `index.html` — semantic HTML5 interface and note form.
- `style.css` — responsive styling and distinct success/error states.
- `api.js` — reusable fetch wrapper, GET/POST/DELETE operations, validation, status feedback, and safe text rendering.
- `docs/api-design.md` — production REST endpoint design and JSON/error examples.
- `docs/data-model.md` — PostgreSQL entities, relationships, schema, indexes, and SQL queries.
- `docs/architecture.md` — requirements, workload estimates, architecture diagram, request flows, and trade-offs.

## Run the API client

1. Clone or download this repository.
2. Open the project folder in a terminal.
3. Start a local static web server. If Python is installed, run:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000` in your browser.
5. Select **Load notes**, or enter a title and optional body and select **Create note**.
6. Use a note's **Delete** button to test the DELETE request.

A local server is recommended instead of opening the HTML file directly. An internet connection is required to reach JSONPlaceholder. No API key or backend installation is required for this practice client.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How to structure a reusable `fetch` request helper, check HTTP response status, and handle asynchronous loading, success, empty, and error states.
- How REST methods and status codes communicate resource operations, including `GET`, `POST`, `DELETE`, `201 Created`, and `204 No Content`.
- How relational primary keys, foreign keys, constraints, indexes, and a junction table model one-to-many and many-to-many relationships.
- How to estimate average request rates and annual storage from explicit traffic assumptions.
- How load balancing, caching, read replicas, queues, workers, backups, and failover address different scalability and reliability concerns.
- Why a practice API's simulated writes are not equivalent to a production backend with durable storage.

## Git history

The assignment requires at least five meaningful commits. Suggested sequence:

1. `Add API client with GET`
2. `Add create note with POST`
3. `Add delete with DELETE`
4. `Add API design doc`
5. `Add data model doc`
6. `Add architecture doc`
7. `Add README`

## Submission

After pushing the repository publicly to GitHub, submit its URL, for example `https://github.com/YOUR-USERNAME/quicknotes-system-design`.
