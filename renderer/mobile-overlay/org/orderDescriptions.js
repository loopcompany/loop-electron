// Keep free-text details beside their selection in previews and submitted summaries.
export const selectionDescription = (entry) => entry && typeof entry === 'object'
  ? [...new Set(['desc', 'description', 'note'].map((key) => String(entry[key] || '').trim()).filter(Boolean))].join('\n')
  : '';

export const describeQuantity = (quantity, entry, label = 'توضیحات') => {
  const description = selectionDescription(entry);
  return description ? `${quantity}\n${label}: ${description}` : quantity;
};
