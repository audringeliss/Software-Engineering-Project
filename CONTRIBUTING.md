# Team Contribution Guidelines ("Guess Who?")

---

## 1. Branch Naming Strategy

All branches are created off the `main` branch, and completed work is merged back via Pull Requests (PRs). Direct pushes to `main` are strictly prohibited.

**Pattern:** `[initials]/[short-title]`

### Team Member Prefixes:
* **Audringa Daškevičiūtė:** `ad/` (e.g., `ad/add-signalr-hubs`)
* **Girius Frankonis:** `gf/` (e.g., `gf/card-flip-animation`)
* **Laura Kanapienytė:** `lk/` (e.g., `lk/user-authentication-api`)

---

## 2. Code Formatting & Quality Standards

To keep the codebase consistent across all developers, follow these standards:

* **Backend (C# / ASP.NET Core):** 
  * Always run `dotnet format` locally prior to committing.
  * Enable **"Format on Save"** in your IDE (VS Code, Visual Studio or Rider).
* **Frontend (React / TypeScript / JS):**
  * Format code according to the styles established under `guesswho.client/src`.
  * Use Prettier and ESLint with "Format on Save" enabled in your editor.

---

## 3. Pull Request (PR) & Review Process

* **Creating PRs:** Every code change must be submitted as a PR into `main`.
* **PR Template:** Complete all sections of the auto-filled template from `.github/pull_request_template.md` (do not leave blank placeholders).
* **Code Ownership (`CODEOWNERS`):** Review requests are automatically assigned based on `.github/CODEOWNERS`:
  * **Backend (`/GuessWho.Server/`, `/Controllers/`, `Program.cs`):** Reviewed by Audringa (`@audringeliss`) and Girius (`@giriusfrank`).
  * **Backend (`/Models/`):** Accessible to all team members (`@audringeliss`, `@giriusfrank`, `@laurakanap`).
  * **Frontend (`/guesswho.client/`):** Reviewed by Audringa (`@audringeliss`) and Laura (`@laurakanap`).
  * **Docs & Configuration (`/docs/`, `/.github/`, `CONTRIBUTING.md`):** Accessible to all team members.
* **Approval:** At least 1 approving review from a designated code owner is required before merging into `main`.

---

## 4. Filing Issues (GitHub Issues)

* Use **GitHub Issues** to track all tasks, bugs, questions, and roadmap items across the Alpha, Beta, and Final versions.
* **Titles:** Use short, clear, and specific titles.
* **Descriptions:** Add detailed requirements or technical context in the first comment under the issue.