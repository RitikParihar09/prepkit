import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables before running pipeline
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Enable local URL fetching for evaluator test cases (e.g. http://localhost:8099/acme/)
process.env.ALLOW_LOCAL_URLS = 'true';

import { KitCoordinator } from '../backend/src/services/kits/kitCoordinator.js';
import { stripInternalMetadata } from '../backend/src/services/validation/kitSchema.js';

interface TestCase {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

interface EvaluatorResultItem {
  id: string;
  status: 'ok' | 'failed';
  kit: any | null;
  error: {
    code: string;
    message: string;
  } | null;
}

async function runEvaluator() {
  const args = process.argv.slice(2);
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!inputPath || !outputPath) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const resolvedInput = path.resolve(process.cwd(), inputPath);
  const resolvedOutput = path.resolve(process.cwd(), outputPath);

  if (!fs.existsSync(resolvedInput)) {
    console.error(`[Evaluator Error] Input file not found at: ${resolvedInput}`);
    process.exit(1);
  }

  console.log(`[Evaluator] Reading input cases from ${resolvedInput}...`);
  const rawInput = fs.readFileSync(resolvedInput, 'utf-8');
  const cases: TestCase[] = JSON.parse(rawInput);

  if (!Array.isArray(cases)) {
    console.error('[Evaluator Error] Input JSON must contain an array of test cases.');
    process.exit(1);
  }

  console.log(`[Evaluator] Running pipeline for ${cases.length} test case(s)...`);

  const results: EvaluatorResultItem[] = [];

  for (const c of cases) {
    console.log(`\n--- [Evaluator] Processing Case: ${c.id} (${c.company_url}, ${c.days} days) ---`);
    try {
      const generatedKit = await KitCoordinator.generateKit(
        c.jd,
        c.company_url,
        c.days,
        (_status, msg, percent) => {
          console.log(`  [${c.id}] ${percent}% - ${msg}`);
        }
      );

      // Strip internal _meta tags for strict Appendix A output compliance in batch output
      const cleanKit = stripInternalMetadata(generatedKit);

      results.push({
        id: c.id,
        status: 'ok',
        kit: cleanKit,
        error: null
      });
      console.log(`  [${c.id}] SUCCESS: Kit generated.`);
    } catch (err: any) {
      console.error(`  [${c.id}] FAILED: ${err.message}`);
      results.push({
        id: c.id,
        status: 'failed',
        kit: null,
        error: {
          code: err.code || 'GENERATION_FAILED',
          message: err.message || 'Kit generation failed.'
        }
      });
    }
  }

  const outputPayload = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results
  };

  const outputDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutput, JSON.stringify(outputPayload, null, 2), 'utf-8');
  console.log(`\n[Evaluator] Completed batch processing! Output written to: ${resolvedOutput}`);
}

runEvaluator().catch(err => {
  console.error('[Evaluator Fatal Error]:', err);
  process.exit(1);
});
