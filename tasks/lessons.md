# 🧠 Agent Lessons Learned & Anti-Patterns

This file serves as the persistent memory for all AI agents working on the CORTEURBANO project.
**Rule:** Before starting any non-trivial task, the agent MUST review this file to avoid repeating past mistakes.

---

## 🚫 Critical Anti-Patterns (What NOT to do)

_List specific technical mistakes, architectural errors, or stylistic choices that were corrected by the user._

- **[DATE] - [TOPIC]:** [Short description of the mistake].
  - _Example: 2026-02-22 - Next.js Client Components: Don't use 'use client' at the top level of layout.tsx unless strictly necessary for Context Providers._
- **2026-02-22 - Business Context Mismatch:** Always verify the core business entity of the repository before writing a feature PRD. Avoid proposing "technical repair schemas" for standard barbery appointment booking systems like BarberKing.

---

## ✅ Best Practices & Project Preferences

_Patterns that have been proven to work specifically for this codebase._

- **Component Structure:** Use functional components with TypeScript interfaces defined above the component.
- **State Management:** Prioritize Server Actions for form mutations over client-side fetch calls.
- **Styling:** Stick strictly to Tailwind utility classes; avoid creating custom CSS files unless requested.

---

## 🛠️ Environment-Specific Gotchas

_Specific issues related to the local setup, deployment, or Skill Hooks._

- **Skill Hooks:** Always verify the return type of `get_order_status` hook; it returns `null` if the ID is not found, not an empty object.
- **Permissions:** The `.agent/skills` folder requires execution permissions on the local environment.
- **Supabase Realtime & RLS:** Realtime channel subscriptions strictly enforce Row Level Security policies. If a table only allows authenticated users to read rows (`auth.uid() = user_id`), then an unauthenticated visitor will *silently receive no updates* when subscribing. Always ensure authentication logic matches the tracking endpoints.

---

## 📈 Evolution Log (Self-Correction History)

| Date       | Issue             | Root Cause         | Preventive Rule Implemented    |
| :--------- | :---------------- | :----------------- | :----------------------------- |
| YYYY-MM-DD | Brief description | Why did it happen? | How will we stop it next time? |
|            |                   |                    |                                |
