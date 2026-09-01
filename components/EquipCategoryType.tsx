'use client';

import { useState } from 'react';

// Category + subtype pair for the equipment filter bar. Client-side so the
// subtype dropdown appears the moment a category is picked (user report,
// 2 Sep: the server-rendered version only showed it after a full submit).
// Submitting still round-trips the same GET form as before.
export default function EquipCategoryType({
  initialCategory,
  initialType,
  categories,
  labels,
  typesByCategory,
  placeholders,
}: {
  initialCategory: string;
  initialType: string;
  categories: readonly string[];
  labels: Record<string, string>;
  typesByCategory: Record<string, readonly string[]>;
  placeholders: Record<string, string>;
}) {
  const [category, setCategory] = useState(initialCategory);
  const options = typesByCategory[category] ?? [];

  return (
    <>
      <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">ทุกหมวด</option>
        {categories.map((c) => (
          <option key={c} value={c}>{labels[c] ?? c}</option>
        ))}
      </select>
      {options.length > 0 && (
        // key resets the picked subtype when the category changes -- a Bow
        // filter must not survive a switch to armor.
        <select name="type" key={category} defaultValue={category === initialCategory ? initialType : ''} aria-label="ชนิด">
          <option value="">{placeholders[category] ?? 'ทุกชนิด'}</option>
          {options.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
    </>
  );
}
