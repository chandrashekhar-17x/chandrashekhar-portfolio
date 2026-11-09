/**
 * Which context label the custom cursor shows for the element under the pointer:
 * an explicit data-cursor="…" wins, links and buttons say "click", text fields hide it.
 * Pure (takes the element), so it is unit-testable.
 */
export function cursorLabelFor(target: Element | null): { label: string; hidden: boolean } {
  if (!target) return { label: '', hidden: false };
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return { label: '', hidden: true }; // the text caret is more useful here
  }
  const tagged = target.closest<HTMLElement>('[data-cursor]');
  if (tagged?.dataset['cursor']) return { label: tagged.dataset['cursor'], hidden: false };
  if (target.closest('a, button, [role="button"], [role="option"]')) {
    return { label: 'click', hidden: false };
  }
  return { label: '', hidden: false };
}
