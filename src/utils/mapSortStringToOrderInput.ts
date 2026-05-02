export type SortableField<T extends Record<string, unknown>> = (keyof T)[];
export type SortOrder = 'asc' | 'desc';
export type ParsedSort<T extends Record<string, unknown>> = {
  field: SortableField<T>[number];
  order: SortOrder;
}[];
/**
 * Parse "phoneNumber:asc,status:desc" → [{ field, order }, ...]
 * Silently drops any entry with an unrecognised field or direction.
 */
export function parseSortParam<T extends Record<string, unknown>>(
  raw: string | undefined,
  SORTABLE_FIELDS: SortableField<T> = [],
): ParsedSort<T> {
  if (!raw) return [];
  console.log('Parsing sort param:', raw.split(','));
  console.log('Recognised sortable fields:', SORTABLE_FIELDS);
  return raw
    .split(',')
    .map((s) => s.trim())
    .flatMap((segment) => {
      console.log('Parsing sort segment:', segment.split(':'));
      const [field, order = 'asc'] = segment.split(':');
      console.log('Parsed field:', field, 'order:', order);
      console.log(
        'Is field sortable?',
        SORTABLE_FIELDS.includes(field as SortableField<T>[number]),
      );
      console.log('Is order valid?', ['asc', 'desc'].includes(order));
      if (
        !SORTABLE_FIELDS.includes(field as SortableField<T>[number]) ||
        !['asc', 'desc'].includes(order)
      )
        return [];
      return [
        { field: field as SortableField<T>[number], order: order as SortOrder },
      ];
    });
}

export default function mapSortStringToOrderInput<
  T extends Record<string, unknown>,
>(raw: string | undefined, SORTABLE_FIELDS: SortableField<T> = []) {
  return parseSortParam<T>(raw, SORTABLE_FIELDS).map(({ field, order }) => ({
    [field]: order,
  }));
}
