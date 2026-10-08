import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenAI } from '@google/genai';

export interface PythonExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time: number; // in seconds (e.g. 0.045)
  python_version: string;
  timed_out: boolean;
  error?: string;
}

let cachedPythonVersion: string | null = null;

/**
 * Detects the real Python version on the host system.
 */
export function getPythonVersion(): string {
  if (cachedPythonVersion) return cachedPythonVersion;
  try {
    const stdout = execSync('python3 --version || python --version', { encoding: 'utf8' }).trim();
    cachedPythonVersion = stdout || 'Python 3.12.0';
    return cachedPythonVersion;
  } catch (err) {
    cachedPythonVersion = 'Python 3.12.0';
    return cachedPythonVersion;
  }
}

/**
 * Executes arbitrary Python code in an isolated subprocess sandbox.
 * - Strips sensitive environment variables (e.g. API keys, DB credentials).
 * - Implements a strict timeout (5 seconds default).
 * - Captures real stdout and stderr.
 * - Supports stdin input for input() prompts.
 * - Safely cleans up temporary execution directories upon completion.
 */
export async function runPythonCode(
  code: string,
  stdinInput: string = '',
  timeoutMs: number = 5000,
  filename: string = 'main.py'
): Promise<PythonExecutionResult> {
  const pythonVersion = getPythonVersion();
  const startTime = process.hrtime.bigint();

  // Validate filename
  const safeFilename = path.basename(filename) || 'main.py';

  // Create isolated temp workspace
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'py_sandbox_'));
  const scriptPath = path.join(tempDir, safeFilename);

  try {
    await fs.promises.writeFile(scriptPath, code, 'utf8');

    // Build isolated environment: strip all app secrets & credentials
    const cleanEnv: Record<string, string> = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      PYTHONUNBUFFERED: '1',
      PYTHONDONTWRITEBYTECODE: '1',
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
      TEMP: tempDir,
      TMP: tempDir,
      HOME: tempDir,
    };

    return await new Promise<PythonExecutionResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimeout = false;
      let isResolved = false;

      // Spawn real Python interpreter in unbuffered mode (-u)
      const child = spawn('python3', ['-u', safeFilename], {
        cwd: tempDir,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Max buffer size to protect memory (512 KB)
      const MAX_OUTPUT_SIZE = 512 * 1024;

      child.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_OUTPUT_SIZE) {
          stdout += chunk.toString('utf8');
        }
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_OUTPUT_SIZE) {
          stderr += chunk.toString('utf8');
        }
      });

      // Handle stdin if provided
      if (stdinInput && stdinInput.length > 0) {
        child.stdin.write(stdinInput);
      }
      child.stdin.end();

      // Enforce execution timeout limit
      const timer = setTimeout(() => {
        isTimeout = true;
        try {
          child.kill('SIGKILL');
        } catch (e) {
          // ignore
        }
      }, timeoutMs);

      child.on('error', (err) => {
        clearTimeout(timer);
        if (isResolved) return;
        isResolved = true;

        const endTime = process.hrtime.bigint();
        const durationSec = Number(endTime - startTime) / 1e9;

        resolve({
          success: false,
          stdout,
          stderr: `Execution System Error: ${err.message}`,
          exit_code: 1,
          execution_time: Math.round(durationSec * 1000) / 1000,
          python_version: pythonVersion,
          timed_out: false,
        });
      });

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        if (isResolved) return;
        isResolved = true;

        const endTime = process.hrtime.bigint();
        const durationSec = Number(endTime - startTime) / 1e9;

        if (isTimeout) {
          return resolve({
            success: false,
            stdout,
            stderr: `Execution terminated.\n\nReason: Time limit exceeded (${(timeoutMs / 1000).toFixed(1)} seconds).\nPossible cause: Infinite loop or blocking input call.`,
            exit_code: null,
            execution_time: Math.round(durationSec * 1000) / 1000,
            python_version: pythonVersion,
            timed_out: true,
          });
        }

        resolve({
          success: code === 0 && !stderr.includes('Traceback (most recent call last):'),
          stdout,
          stderr,
          exit_code: code,
          execution_time: Math.round(durationSec * 1000) / 1000,
          python_version: pythonVersion,
          timed_out: false,
        });
      });
    });
  } catch (err: any) {
    const endTime = process.hrtime.bigint();
    const durationSec = Number(endTime - startTime) / 1e9;
    return {
      success: false,
      stdout: '',
      stderr: `Runner Error: ${err.message}`,
      exit_code: 1,
      execution_time: Math.round(durationSec * 1000) / 1000,
      python_version: pythonVersion,
      timed_out: false,
    };
  } finally {
    // Clean up temporary execution sandbox directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore cleanup errors
    }
  }
}

/**
 * Formats Python source code using Python's internal ast & parser or clean indentation rules.
 */
export async function formatPythonCode(code: string): Promise<{ formatted: string; changed: boolean; error?: string }> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'py_fmt_'));
  const tempScript = path.join(tempDir, 'format_tool.py');
  const codeFile = path.join(tempDir, 'target.py');

  const formatterPy = `
import sys
import ast

def format_python_code(source_code):
    try:
        # Validate syntax
        parsed = ast.parse(source_code)
        
        # If Python 3.9+ ast.unparse is available
        if hasattr(ast, 'unparse'):
            formatted = ast.unparse(parsed)
            return formatted
    except Exception as e:
        pass
    
    # Fallback line-by-line cleaner
    lines = source_code.splitlines()
    cleaned = []
    indent_level = 0
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            cleaned.append("")
            continue
        
        # Dedent closing blocks or elif/except/finally
        if stripped.startswith(('elif ', 'else:', 'except', 'finally:')):
            current_indent = max(0, indent_level - 1)
        else:
            current_indent = indent_level
            
        cleaned.append(('    ' * current_indent) + stripped)
        
        # Adjust next indent
        if stripped.endswith(':'):
            indent_level += 1
        elif stripped.startswith(('return', 'break', 'continue', 'raise', 'pass')) and indent_level > 0:
            pass
            
    return "\\n".join(cleaned)

if __name__ == '__main__':
    with open(sys.argv[1], 'r', encoding='utf8') as f:
        src = f.read()
    res = format_python_code(src)
    with open(sys.argv[1], 'w', encoding='utf8') as f:
        f.write(res)
`;

  try {
    await fs.promises.writeFile(tempScript, formatterPy, 'utf8');
    await fs.promises.writeFile(codeFile, code, 'utf8');

    execSync(`python3 "${tempScript}" "${codeFile}"`, {
      timeout: 3000,
      env: { PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
    });

    const formatted = await fs.promises.readFile(codeFile, 'utf8');
    return { formatted, changed: formatted !== code };
  } catch (err: any) {
    return { formatted: code, changed: false, error: err.message };
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

/**
 * AI-powered Python error analyzer & fixer using Gemini 3.7 Flash.
 */
export async function explainAndFixPythonError(
  ai: GoogleGenAI | null,
  code: string,
  errorMessage: string,
  filename: string = 'main.py'
): Promise<{
  errorType: string;
  lineNumber: number | null;
  explanation: string;
  suggestedFix: string;
  correctedCode: string;
}> {
  const parseFallback = () => {
    let errorType = 'RuntimeError';
    let lineNum: number | null = null;
    let suggestedFix = 'Review the line where the error occurred and ensure all variables, brackets, and types match Python syntax conventions.';
    let correctedCode = code;

    const lineMatch = errorMessage.match(/line (\d+)/i);
    if (lineMatch) {
      lineNum = parseInt(lineMatch[1], 10);
    }

    if (errorMessage.includes('SyntaxError')) {
      errorType = 'SyntaxError';
      if (errorMessage.includes("was never closed") || errorMessage.includes("unexpected EOF")) {
        suggestedFix = 'Add the missing closing bracket/parenthesis or quote to properly close the statement.';
        // Attempt simple auto-closure
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens > closeParens) {
          correctedCode = code + ')'.repeat(openParens - closeParens);
        }
      }
    } else if (errorMessage.includes('ZeroDivisionError')) {
      errorType = 'ZeroDivisionError';
      suggestedFix = 'Ensure the denominator is not zero before dividing (e.g., check `if denominator != 0: ...`).';
      correctedCode = code.replace(/\/ 0/g, '/ 1').replace(/\/0/g, '/1');
    } else if (errorMessage.includes('NameError')) {
      errorType = 'NameError';
      const nameMatch = errorMessage.match(/name '(\w+)' is not defined/);
      if (nameMatch) {
        const undefinedName = nameMatch[1];
        if (undefinedName === 'pritn' || undefinedName === 'prnt') {
          suggestedFix = `Python cannot find a function named "${undefinedName}". You probably meant "print".`;
          correctedCode = code.replace(new RegExp(`\\b${undefinedName}\\b`, 'g'), 'print');
        } else {
          suggestedFix = `Variable or function "${undefinedName}" is referenced before being defined. Ensure it is initialized before this line.`;
        }
      }
    } else if (errorMessage.includes('TypeError')) {
      errorType = 'TypeError';
      suggestedFix = 'Check that operators and function arguments are applied to compatible data types (e.g. converting strings to int/float).';
    } else if (errorMessage.includes('IndexError')) {
      errorType = 'IndexError';
      suggestedFix = 'Check that your list index is within bounds (0 to len(list) - 1).';
    } else if (errorMessage.includes('IndentationError')) {
      errorType = 'IndentationError';
      suggestedFix = 'Ensure consistent 4-space indentation across blocks following a colon `:`.';
    }

    return {
      errorType,
      lineNumber: lineNum,
      explanation: `Python encountered a ${errorType}${lineNum ? ` on line ${lineNum}` : ''}: ${errorMessage.split('\n').filter(Boolean).pop() || errorMessage}`,
      suggestedFix,
      correctedCode,
    };
  };

  if (!ai) {
    return parseFallback();
  }

  const prompt = `You are an expert Python tutor and compiler diagnostics assistant.
A student wrote this Python program (${filename}) and received an execution error.

=== STUDENT CODE ===
${code}

=== PYTHON ERROR TRACEBACK ===
${errorMessage}

Analyze the error thoroughly and return a JSON object with these exact keys:
1. "errorType": (string, e.g. "SyntaxError", "ZeroDivisionError", "NameError", "TypeError", "IndentationError")
2. "lineNumber": (number or null, the exact line number where the failure originated)
3. "explanation": (string, friendly, crystal-clear 2-4 sentence explanation for a student of why this error happened)
4. "suggestedFix": (string, short explanation of how to correct it)
5. "correctedCode": (string, the COMPLETE valid Python program with the bug completely fixed and clean formatting)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      errorType: parsed.errorType || 'ExecutionError',
      lineNumber: parsed.lineNumber || null,
      explanation: parsed.explanation || 'An error occurred during Python execution.',
      suggestedFix: parsed.suggestedFix || 'Check syntax and logic.',
      correctedCode: parsed.correctedCode || code,
    };
  } catch (e: any) {
    return parseFallback();
  }
}
