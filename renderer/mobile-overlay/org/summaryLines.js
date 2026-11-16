import { describeQuantity, selectionDescription } from './orderDescriptions';
export const counterLines = (entries = {}, items = [], L = (s) => s) => items.flatMap((item) => {
  const entry = entries[item.id];
  return Number(entry?.count) > 0 ? [{ label: L(item.title), value: describeQuantity(entry.count, entry, L('توضیحات')) }] : [];
});
export const procurementLines = (entries = {}, items = [], L = (s) => s) => items.flatMap((item) => {
  const entry = entries[item.id] || {};
  const lines = [];
  if (entry.new > 0) lines.push({ label: `${L(item.title)} / ${L('آکبند')}`, value: entry.new });
  if (entry.used > 0) lines.push({ label: `${L(item.title)} / ${L('کارکرده')}`, value: entry.used });
  if (selectionDescription(entry)) lines.push({ label: `${L(item.title)} — ${L('توضیحات')}`, value: selectionDescription(entry) });
  return lines;
});
