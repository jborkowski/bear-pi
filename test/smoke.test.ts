import { bearcli } from '../src/bearcli';

async function run() {
  console.log('Testing BearCLI connection...');
  try {
    const notes = await bearcli.list(3);
    console.log(`Successfully retrieved ${notes.length} notes.`);
    if (notes.length > 0) {
      console.log('Sample note:', notes[0].title);
    }
    console.log('Smoke test passed!');
  } catch (error: any) {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  }
}

run();