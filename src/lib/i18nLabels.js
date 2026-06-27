// Translate DB/constant values (status strings, category names) for display.
//
// The raw value stays the canonical key everywhere in logic (filters, weights,
// color lookups, what's stored in the DB). These helpers only affect what the
// user sees, and fall back to the raw value when no translation exists — so
// user-added categories still render fine.

export function translateStatus(messages, value) {
  return messages?.status?.[value] ?? value
}

export function translateCategory(messages, value) {
  return messages?.categories?.[value] ?? value
}
