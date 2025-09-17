import { exec } from 'child_process';
import path from 'path';
import { NextResponse } from 'next/server';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    // Resolve the absolute path to the Python script
    const projectRoot = process.cwd(); // /path/to/stock-web
    const scriptPath = path.resolve(projectRoot, '../all_scripts/vendors/ICICI/long_term_trading_bot.py');

    console.log("Executing Python script at:", scriptPath);

    // Run the Python file
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);

    console.log('stdout:', stdout);
    console.error('stderr:', stderr);

    return NextResponse.json({ message: 'File executed successfully', stdout, stderr }, { status: 200 });
    
  } catch (error) {
    console.error('Execution Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
