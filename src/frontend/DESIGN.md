# Frontend Design

## Direction

The current UI direction is a warm, rounded, game-like family learning interface based on `animal-island-ui`.

The child experience should feel like completing island missions: friendly, tactile, and motivating, while still keeping the task flow obvious. The parent experience should stay light and managerial: clear counts, fast filtering, and low visual noise.

## Dependencies

- `animal-island-ui`
- Global style import in `app/layout.tsx`:

```ts
import "animal-island-ui/style";
```

Use the package API only through local wrappers in `components/ui/` wherever possible.

## UI Wrappers

Project wrappers:

- `AppButton` / `AppButtonLink`: wraps `animal-island-ui` button styles and maps app variants to valid package props.
- `AppCard` / `AppCardTitle`: wraps `animal-island-ui` cards and restricts colors to official `CardColor` values.
- `AppModal`: wraps `animal-island-ui` modal; `open` is always required and `typewriter` defaults to `false` for dynamic app content.
- `AppConfirmModal`: wraps `AppModal` for destructive or irreversible confirmation flows. Use it instead of `window.confirm`; pass business copy, optional detail, loading state, and `tone="danger"` for deletion.
- `AppTabs`: wraps `animal-island-ui` tabs.
- `AppSelect`: wraps controlled `animal-island-ui` select.

Do not call `animal-island-ui` components directly from business pages unless a new wrapper is intentionally added.

## Visual System

### Atmosphere

- Warm parchment page background.
- Soft dotted texture, not dense decoration.
- Rounded cards with gentle bottom shadows.
- Mobile-first single-column task flow.
- Child pages use more playful labels such as "Island mission" and "Mission report".
- Parent pages use the same warmth but fewer decorative elements.

### Color Usage

Use official `animal-island-ui` card colors through `AppCard`:

- `default`
- `app-yellow`
- `app-teal`
- `purple`
- `warm-peach-pink`
- `app-green`
- `app-pink`

Supporting CSS colors used by the app:

- Parchment surface: `#fffdf2`
- Warm text: `#725d42`
- Mint action: `#82d5bb`
- Mission yellow: `#f7cd67`
- Soft border: `#eadfc3`

Avoid adding many new colors. Keep child pages warm and mission-like; keep parent pages clear and scan-friendly.

### Typography

- Body font follows `animal-island-ui` bundled fonts: `"Noto Sans SC"`, `"Nunito"`, system fallback.
- Display text should use normal letter spacing in refactored task pages.
- Avoid oversized hero typography inside task cards and management surfaces.

### Layout

- Child pages: `max-w-lg`, mobile-first, stacked cards.
- Check-in and result pages: `max-w-lg`, clear primary action at the bottom of the form/card.
- Parent dashboard: responsive management layout, compact summary grid, list rows in rounded cards.
- Touch targets should be at least 44px high.

## Page Rules

### Child Today Page

- Present the list as island missions.
- Keep the task number and entry action visible.
- Use tabs for task views:
  - today
  - overdue catch-up
  - completed/result view
- Submitted tasks route to the result page instead of check-in.

### Check-In Page

- Keep existing validation and submit flow.
- The completion checkbox, file upload, note, and submit button stay in one form.
- Photo previews are file summary chips before upload.

### Submission Result

- Show status, due time, submitted time, image count, note, and parent confirmation state.
- AI check is shown through `AppModal`.
- AI output remains auxiliary; parent confirmation is authoritative.

### Parent Dashboard

- Keep management clear and lightweight.
- Use summary cards for totals.
- Use controlled `AppSelect` for status filtering.
- Use native date input for date filtering.
- Use `AppConfirmModal` for deleting tasks from the list; keep the task title visible in the modal detail.
- Avoid playful copy that would slow down parent review.

## Constraints

- Do not change backend APIs for visual refactors.
- Do not put business logic directly in `page.tsx`.
- Any interactive wrapper or page component must include `"use client"`.
- Do not expose secrets to client components.
- `animal-island-ui` prop rules:
  - `Button.type` only accepts `primary | default | dashed | text | link`; native button type maps to `htmlType`.
  - `Modal.open` is required.
  - `Select` is controlled and requires `value` and `onChange`.
  - `Card.color` must be an official package color.
