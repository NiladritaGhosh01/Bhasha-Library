/**
 * Auto-Classification Script for Bhasha Library
 * 
 * Scans Windows Downloads folder for PDF story/book files, extracts introductory
 * text using pdf-parse, classifies them by genre using Gemini API, copies valid
 * literary books to public/books/<Genre>/, and writes booksDatabase.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';

// 1. Setup paths and environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Native zero-dependency env loader
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));
loadEnvFile(path.join(PROJECT_ROOT, '.env'));

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY is missing from .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Possible download folders to search
const DOWNLOAD_PATHS = [
  'C:\\Users\\basus\\Downloads\\BOOK DATABASE',
  'C:\\Users\\basus\\Downloads',
  'C:\\Users\\ABHIRUP NAG\\Downloads'
];

// Helper to normalize genre into clean standard categories
function normalizeGenre(genreStr, title = '') {
  const combined = `${genreStr || ''} ${title || ''}`.toLowerCase();
  if (combined.includes('historical') || combined.includes('history') || combined.includes('anandamath') || combined.includes('আনন্দমঠ')) {
    return 'Historical';
  }
  if (combined.includes('adventure') || combined.includes('chander pahar') || combined.includes('চাঁদের পাহাড়') || combined.includes('exploration')) {
    return 'Adventure';
  }
  if (combined.includes('kopalkundala') || combined.includes('kapalkundala') || combined.includes('কপালকুণ্ডলা') || combined.includes('kopalkundola')) {
    return 'Gothic Romance';
  }
  if (combined.includes('romance') || combined.includes('devdas') || combined.includes('দেবদাস') || combined.includes('love')) {
    return 'Romance';
  }
  if (combined.includes('thriller') || combined.includes('mystery') || combined.includes('gothic') || combined.includes('detective')) {
    return 'Thriller';
  }
  if (combined.includes('poetry') || combined.includes('poem') || combined.includes('gitanjali') || combined.includes('গীতাঞ্জলি')) {
    return 'Poetry';
  }
  if (combined.includes('sci-fi') || combined.includes('science fiction')) {
    return 'Sci-Fi';
  }
  if (combined.includes('folklore') || combined.includes('mythology') || combined.includes('folk')) {
    return 'Folklore';
  }
  if (combined.includes('drama') || combined.includes('tragedy')) {
    return 'Drama';
  }
  return 'Classic Literature';
}

// Helper to create a clean unique slug/id
function createSlug(title, filename) {
  const base = (title || filename || 'book')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  return base || `book-${Date.now()}`;
}

// Recursive PDF scanner
function findPdfFiles(directory, maxDepth = 2, currentDepth = 0) {
  const results = [];
  if (!fs.existsSync(directory) || currentDepth > maxDepth) return results;

  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        results.push(...findPdfFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Cannot read directory ${directory}:`, err.message);
  }
  return results;
}

// Extract text snippet from first 2-3 pages using pdf-parse
async function extractPdfSnippet(filePath) {
  let parser = null;
  try {
    const buffer = fs.readFileSync(filePath);
    if (!buffer || buffer.length === 0) return { snippet: '', totalPages: 0 };

    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const totalPages = parsed.total || (parsed.pages ? parsed.pages.length : 1);

    let snippet = '';
    if (parsed.pages && parsed.pages.length > 0) {
      snippet = parsed.pages
        .slice(0, 3)
        .map(p => p.text || '')
        .join('\n')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
    } else if (parsed.text) {
      snippet = parsed.text.replace(/\s+/g, ' ').trim().slice(0, 2000);
    }

    return { snippet, totalPages };
  } catch (err) {
    return { snippet: '', totalPages: 0, error: err.message };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {}
    }
  }
}

// Call Gemini to classify the PDF
async function classifyWithGemini(fileName, snippet, totalPages) {
  const prompt = `You are a precision literary cataloguer for Bhasha Library.
Analyze the following PDF file information:
File Name: "${fileName}"
Total Pages: ${totalPages}
Text Snippet (Opening Pages):
"""
${snippet || '[Scanned document without OCR layer, evaluate primarily based on title/author/filename]'}
"""

Determine if this is a genuine literary book (novel, story collection, poetry, historical epic, drama, folklore, or literary classic) or if it is non-literary (such as an academic science/math textbook, college lecture notes, syllabus, exam paper, job application form, payment receipt, gaming guide, or manual).

Respond with ONLY a valid, strict JSON object and NO markdown formatting (no backticks, no code block):
{
  "isLiteraryBook": true or false,
  "title": "Clean, proper title of the book in Bengali and/or English",
  "author": "Author name if detected or known",
  "genre": "Detected Genre (e.g. Romance, Thriller, Poetry, Historical, Sci-Fi, Drama, Folklore, Adventure, Classic Literature)",
  "summaryKeywords": "Two-sentence summary describing the core narrative and literary themes"
}`;

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter(Boolean);
  const uniqueModels = [...new Set(models)];

  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          topP: 0.95
        }
      });

      if (res && res.text) {
        const raw = res.text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini classification failed on all candidate models');
}

// Main execution function
async function main() {
  console.log('======================================================');
  console.log('Bhasha Library: Auto-Classify PDFs into Genre Database');
  console.log('======================================================\n');

  // Collect all PDFs across known paths without duplicates
  const allPdfPaths = [];
  const seenPaths = new Set();

  for (const dir of DOWNLOAD_PATHS) {
    if (fs.existsSync(dir)) {
      console.log(`Scanning directory: ${dir}`);
      const files = findPdfFiles(dir, 1);
      for (const f of files) {
        const normalized = path.resolve(f);
        if (!seenPaths.has(normalized)) {
          seenPaths.add(normalized);
          allPdfPaths.push(normalized);
        }
      }
    } else {
      console.log(`Directory does not exist (skipping): ${dir}`);
    }
  }

  console.log(`\nFound a total of ${allPdfPaths.length} PDF files.`);

  // Comprehensive pattern filter for non-literary academic/administrative files
  const isObviousNonBook = (fileName, fullPath) => {
    if (fullPath.includes('BOOK DATABASE')) return false; // Never skip files in BOOK DATABASE
    const f = fileName.toLowerCase();
    const nonBookPatterns = [
      'admit card', 'admit', 'application form', 'application', 'receipt', 'recipt',
      'payment', 'syllabus', 'programme', 'pyq', 'question', 'rulebook', 'cert',
      'notice', 'suggestion', 'roadmap', 'eval', 'colligative', 'mechanism',
      'electrophilic', 'quantum', 'photoelectric', 'wave', 'postulates',
      's-block', 'p-block', 'p block', 'co - ordination', 'inorganic',
      'organic-chemistry', 'physical-chemistry', 'algebra', 'differential-equations',
      'thermal physics', 'theory of numbers', 'money and banking', 'carbonyl',
      'active methylene', 'band theory', 'bgmi', 'cc-10', 'cc-6', 'cc-8',
      'cy2023', 'cy2024', 'cy2025', 'de broglie', 'covalent bond', 'wa0003',
      'docscanner', 'doc1', 'book2', 'document 2', 'document 23', 'forces',
      'fortran', 'goal seek', 'heat-and', 'higher algebra', 'hrm',
      'hydrogen bond', 'iit jam', 'introductorycou', 'jayanta bhattachariya',
      'jee-mains', 'koopman', 'lattice defects', 'life esports', 'miessler',
      'minor_sem', 'molecular orbital', 'molecular_orbital', 'ms chouhan',
      'n6261', 'n7261', 'ntpc', 'station master', 'polymers', 'public service',
      'qm_sb', 'receptor guest', 'rrb', 'sample questions', 'sem iv', 'sem3',
      'vdoc.pub', 'toaz.info', 'what to study', 'y_sathi', 'maxwell',
      'chemistry', 'physics', 'math', 'diff between', 'group_17', 'compton',
      'contemporary', 'definition of bonds', 'thermal', 'toaz'
    ];
    return nonBookPatterns.some(pat => f.includes(pat));
  };

  // Prioritize files in BOOK DATABASE first
  const prioritizedPdfs = allPdfPaths.sort((a, b) => {
    const aIsBookFolder = a.includes('BOOK DATABASE');
    const bIsBookFolder = b.includes('BOOK DATABASE');
    if (aIsBookFolder && !bIsBookFolder) return -1;
    if (!aIsBookFolder && bIsBookFolder) return 1;
    return 0;
  });

  const classifiedBooks = [];
  const genreCounts = {};
  let processedCount = 0;
  let skippedCount = 0;

  for (const filePath of prioritizedPdfs) {
    const fileName = path.basename(filePath);
    processedCount++;

    // Skip administrative exam/notes/forms
    if (isObviousNonBook(fileName, filePath)) {
      skippedCount++;
      console.log(`[${processedCount}/${prioritizedPdfs.length}] Skipped (Academic/Administrative): "${fileName}"`);
      continue;
    }

    console.log(`\n[${processedCount}/${prioritizedPdfs.length}] Inspecting: "${fileName}"...`);
    const { snippet, totalPages } = await extractPdfSnippet(filePath);

    try {
      console.log(`  -> Classifying with Gemini...`);
      const classification = await classifyWithGemini(fileName, snippet, totalPages);

      console.log(`  -> Result: isLiterary=${classification.isLiteraryBook}, Genre="${classification.genre}", Title="${classification.title}"`);

      if (classification.isLiteraryBook) {
        const cleanGenre = normalizeGenre(classification.genre, classification.title);
        const genreDir = path.join(PROJECT_ROOT, 'public', 'books', cleanGenre);

        // Ensure genre folder in public/books/<Genre>/ exists
        if (!fs.existsSync(genreDir)) {
          fs.mkdirSync(genreDir, { recursive: true });
        }

        // Clean target file name (preserving unicode letters & combining marks)
        let cleanFileName = fileName
          .replace(/\.pdf\.pdf$/i, '.pdf')
          .replace(/[^\p{L}\p{M}\p{N}\s._-]/gu, '_')
          .replace(/\s+/g, ' ')
          .trim();
        if (!cleanFileName.toLowerCase().endsWith('.pdf')) {
          cleanFileName += '.pdf';
        }

        const destPath = path.join(genreDir, cleanFileName);

        // Copy file safely (never delete or move the original)
        fs.copyFileSync(filePath, destPath);
        console.log(`  -> Copied to: public/books/${cleanGenre}/${cleanFileName}`);

        const bookId = createSlug(classification.title, fileName);
        const webPath = `/books/${encodeURIComponent(cleanGenre)}/${encodeURIComponent(cleanFileName)}`;

        const bookEntry = {
          id: bookId,
          title: classification.title,
          author: classification.author || 'Unknown',
          genre: cleanGenre,
          filePath: webPath,
          localFilePath: path.relative(PROJECT_ROOT, destPath).replace(/\\/g, '/'),
          fileName: cleanFileName,
          summaryKeywords: classification.summaryKeywords || '',
          pageCount: totalPages,
          sourcePath: filePath
        };

        classifiedBooks.push(bookEntry);
        genreCounts[cleanGenre] = (genreCounts[cleanGenre] || 0) + 1;
      }
    } catch (err) {
      console.warn(`  -> Classification error for "${fileName}":`, err.message);
    }

    // Free-tier rate limit pause: 2000ms delay between Gemini calls
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Write booksDatabase.json in project root, public/, and src/data/
  const dbPath = path.join(PROJECT_ROOT, 'booksDatabase.json');
  fs.writeFileSync(dbPath, JSON.stringify(classifiedBooks, null, 2), 'utf-8');

  const publicDbPath = path.join(PROJECT_ROOT, 'public', 'booksDatabase.json');
  fs.writeFileSync(publicDbPath, JSON.stringify(classifiedBooks, null, 2), 'utf-8');

  const srcDbDir = path.join(PROJECT_ROOT, 'src', 'data');
  if (!fs.existsSync(srcDbDir)) {
    fs.mkdirSync(srcDbDir, { recursive: true });
  }
  const srcDbPath = path.join(srcDbDir, 'booksDatabase.json');
  fs.writeFileSync(srcDbPath, JSON.stringify(classifiedBooks, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`Classification Complete! Processed ${processedCount} files (Skipped ${skippedCount} non-literary files).`);
  console.log(`Saved ${classifiedBooks.length} literary books to: ${dbPath}`);
  console.log(`======================================================`);

  console.log('\n--- Genre Breakdown ---');
  for (const [g, count] of Object.entries(genreCounts)) {
    console.log(`  * ${g}: ${count} book(s)`);
  }

  console.log('\n--- Cataloged Books ---');
  classifiedBooks.forEach((b, idx) => {
    console.log(`  ${idx + 1}. [${b.genre}] "${b.title}" by ${b.author}`);
    console.log(`     Path: ${b.filePath}`);
    console.log(`     Summary: ${b.summaryKeywords}`);
  });
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
