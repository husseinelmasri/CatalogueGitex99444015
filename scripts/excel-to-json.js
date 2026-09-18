import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// -------- CONFIG: change these if your column names differ --------
const NAME_COL = 'ItemName';
const PRICE_COL = 'Price';
const CATEGORY_COL = 'Category';
const IMAGE_COL = 'Image'; // optional — leave as-is if you have it
// ------------------------------------------------------------------

const wb = XLSX.readFile('items.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
console.log('=== DEBUG ===');
console.log('Sheet names:', wb.SheetNames);
console.log('Using sheet:', wb.SheetNames[0]);
console.log('Rows found:', rows.length);
console.log('First row:', JSON.stringify(rows[0], null, 2));
console.log('=== END DEBUG ===');
// Turn "Basmati Rice 5kg" into "basmati-rice-5kg"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const items = rows
  .map((row, i) => {
    const name = row[NAME_COL];
    if (!name) return null;

    const price = Number(row[PRICE_COL]) || 0;

    const rawImage = row[IMAGE_COL];
    const imageFile = rawImage
      ? String(rawImage).trim()
      : slugify(name) + '.jpg';

    return {
      id: i + 1,
      name: String(name).trim(),
      price: price,
      image: '/images/' + imageFile,
      category: row[CATEGORY_COL] ? String(row[CATEGORY_COL]).trim() : 'Other',
    };
  })
  .filter(Boolean);

fs.writeFileSync('src/data/items.json', JSON.stringify(items, null, 2));

console.log(`✅ Wrote ${items.length} items to src/data/items.json`);
