import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Terminal as TerminalIcon,
  FileCode2,
  FolderTree,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  Download,
  Search,
  Wand2,
  Cpu,
  HelpCircle,
  Code2,
  Send,
  Loader2,
  History,
  BookOpen,
} from 'lucide-react';
import { CodingState, CodeFile, ExecutionRecord, AIDebugResult } from '../types';

interface CodingWorkspaceViewProps {
  codingState: CodingState;
  onUpdateCodingState: (updater: (prev: CodingState) => CodingState) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_STARTER_FILES: CodeFile[] = [
  {
    id: 'file-1',
    name: 'main.py',
    language: 'python',
    isEntry: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `# Welcome to Coding Space (Python 3.12)
# Write, run, and debug Python code with real execution.

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to the Python 3.12 IDE."

# Example calculations
numbers = [10, 20, 30, 40, 50]
total = sum(numbers)
average = total / len(numbers)

print(greet("Student"))
print(f"Dataset: {numbers}")
print(f"Total Sum: {total}")
print(f"Average: {average:.2f}")
`,
  },
  {
    id: 'file-2',
    name: 'input_demo.py',
    language: 'python',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `# Interactive Input Demonstration
# Enter your input in the STDIN input box below the terminal.

name = input("Enter your name: ")
age = int(input("Enter your age: "))
major = input("Enter your major / subject: ")

print("--- User Profile ---")
print(f"Name:  {name}")
print(f"Age:   {age} years old")
print(f"Major: {major}")
print(f"Next year you will be {age + 1}!")
`,
  },
  {
    id: 'file-3',
    name: 'algorithms.py',
    language: 'python',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `import math

def two_sum(nums: list[int], target: int) -> list[int]:
    """Finds two indices such that their values sum to target in O(N) time."""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

def is_prime(n: int) -> bool:
    if n <= 1: return False
    for i in range(2, int(math.isqrt(n)) + 1):
        if n % i == 0: return False
    return True

# Test cases
arr = [2, 7, 11, 15]
target = 9
print("Two Sum Result:", two_sum(arr, target)) # [0, 1]

primes = [x for x in range(2, 30) if is_prime(x)]
print("Primes under 30:", primes)
`,
  },
  {
    id: 'file-4',
    name: 'README.md',
    language: 'markdown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `# Python 3.12 Educational IDE

### Keyboard Shortcuts
- **Ctrl + Enter** (or **Cmd + Enter**): Run active Python code
- **Ctrl + S** (or **Cmd + S**): Save file
- **Ctrl + /**: Toggle line comment
- **Tab**: Indent 4 spaces

### Features
1. **Real Subprocess Execution**: Code runs against standard CPython interpreter.
2. **Interactive STDIN**: Provide inputs for \`input()\` calls.
3. **AI Error Debugger**: Gemini 3.7 Flash analyzes syntax & runtime errors.
4. **Code Formatter**: Formats Python code with clean PEP 8 indentation.
`,
  },
];

const PRESET_TEMPLATES = [
  {
    title: 'Two Sum (Hash Map O(N))',
    category: 'Algorithms',
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test 1
res1 = two_sum([2, 7, 11, 15], 9)
print("Test 1 [2, 7, 11, 15], target=9 ->", res1)

# Test 2
res2 = two_sum([3, 2, 4], 6)
print("Test 2 [3, 2, 4], target=6 ->", res2)
`,
  },
  {
    title: 'Dijkstra Shortest Path',
    category: 'Graphs',
    code: `import heapq

def dijkstra(n: int, edges: list[tuple[int, int, int]], start: int) -> dict[int, float]:
    graph = {i: [] for i in range(n)}
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))
        
    dist = {i: float('inf') for i in range(n)}
    dist[start] = 0
    pq = [(0, start)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, weight in graph[u]:
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                heapq.heappush(pq, (dist[v], v))
    return dist

# 4 nodes: 0, 1, 2, 3
edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1), (2, 3, 5)]
print("Shortest paths from node 0:", dijkstra(4, edges, 0))
`,
  },
  {
    title: 'LRU Cache Implementation',
    category: 'Data Structures',
    code: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {} # preserves insertion order in Python 3.7+

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value

cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
print("Get 1:", cache.get(1))  # Returns 1
cache.put(3, 3)                # Evicts key 2
print("Get 2 (evicted):", cache.get(2))  # Returns -1
print("Get 3:", cache.get(3))  # Returns 3
`,
  },
  {
    title: 'Math & Matrix Transformations',
    category: 'Math / Science',
    code: `import math

def quadratic_roots(a: float, b: float, c: float):
    disc = b**2 - 4*a*c
    if disc < 0:
        return f"Complex roots: {-b/(2*a):.2f} ± {math.sqrt(-disc)/(2*a):.2f}i"
    elif disc == 0:
        return f"One real root: {-b/(2*a):.2f}"
    else:
        r1 = (-b + math.sqrt(disc)) / (2*a)
        r2 = (-b - math.sqrt(disc)) / (2*a)
        return f"Two real roots: {r1:.2f} and {r2:.2f}"

print("Equation: 1x^2 - 5x + 6 = 0 ->", quadratic_roots(1, -5, 6))
print("Equation: 1x^2 + 2x + 5 = 0 ->", quadratic_roots(1, 2, 5))
`,
  },
  {
    title: 'Error Diagnostics Test (Syntax & ZeroDiv)',
    category: 'Diagnostics',
    code: `# Intentional error test to inspect AI Debugger
def calculate_metrics():
    total = 100
    count = 0
    # This will trigger ZeroDivisionError:
    return total / count

print("Starting calculation...")
print(calculate_metrics())
`,
  },
];

export const CodingWorkspaceView: React.FC<CodingWorkspaceViewProps> = ({
  codingState,
  onUpdateCodingState,
  onShowToast,
}) => {
  // File & Project State (persisted to localStorage)
  const [files, setFiles] = useState<CodeFile[]>(() => {
    try {
      const saved = localStorage.getItem('studyai_python_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return codingState.files && codingState.files.length > 0 ? codingState.files : DEFAULT_STARTER_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('studyai_python_active_file');
      if (savedId && files.some((f) => f.id === savedId)) return savedId;
    } catch (e) {}
    return files[0]?.id || 'file-1';
  });

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || DEFAULT_STARTER_FILES[0];
  const [code, setCode] = useState<string>(activeFile?.content || '');

  // Python Environment version
  const [pythonVersion, setPythonVersion] = useState<string>('Python 3.12');
  const [stdinInput, setStdinInput] = useState<string>('');
  const [showStdinDrawer, setShowStdinDrawer] = useState<boolean>(false);

  // Execution Output
  const [terminalOutput, setTerminalOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    executionTime: number | null;
    status: 'idle' | 'running' | 'success' | 'error' | 'timeout';
  }>({
    stdout: 'Ready to execute. Click "▶ Run Code" (Ctrl + Enter) to run your Python program.',
    stderr: '',
    exitCode: null,
    executionTime: null,
    status: 'idle',
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'stdin' | 'ai-debug' | 'history' | 'templates'>('terminal');

  // AI Debugger
  const [aiDebugResult, setAiDebugResult] = useState<AIDebugResult | null>(null);
  const [isAiDebugging, setIsAiDebugging] = useState<boolean>(false);

  // Execution History
  const [history, setHistory] = useState<ExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('studyai_python_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return codingState.history || [];
  });

  // Find & Replace bar
  const [showFindBar, setShowFindBar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');

  // New file modal
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch real Python version on mount
  useEffect(() => {
    fetch('/api/python/version')
      .then((res) => res.json())
      .then((data) => {
        if (data.python_version) {
          setPythonVersion(data.python_version);
        }
      })
      .catch(() => {});
  }, []);

  // Sync active file content changes to state & localStorage
  useEffect(() => {
    const target = files.find((f) => f.id === activeFileId);
    if (target && target.content !== code) {
      setCode(target.content);
    }
  }, [activeFileId]);

  // Persist files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studyai_python_files', JSON.stringify(files));
      localStorage.setItem('studyai_python_active_file', activeFileId);
    } catch (e) {}
  }, [files, activeFileId]);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studyai_python_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {}
  }, [history]);

  const handleUpdateCode = (newCode: string) => {
    setCode(newCode);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, content: newCode, updatedAt: new Date().toISOString() }
          : f
      )
    );
  };

  // Keyboard Shortcuts in Textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Ctrl + Enter or Cmd + Enter: Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // 2. Ctrl + S or Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onShowToast(`File "${activeFile.name}" saved!`, 'success');
      return;
    }

    // 3. Ctrl + F: Find
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowFindBar((prev) => !prev);
      return;
    }

    // 4. Tab key: Indent 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const newCode = val.substring(0, start) + '    ' + val.substring(end);
      handleUpdateCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
      return;
    }

    // 5. Enter key: Auto-indentation
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const val = textarea.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';

      // If line ended with ':', add 4 extra spaces
      if (currentLine.trim().endsWith(':')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newCode = val.substring(0, start) + '\n' + indent + val.substring(start);
        handleUpdateCode(newCode);

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Run Real Python Code
  const handleRunCode = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setActiveTab('terminal');
    setAiDebugResult(null);

    setTerminalOutput({
      stdout: '',
      stderr: '',
      exitCode: null,
      executionTime: null,
      status: 'running',
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/python/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          code,
          input: stdinInput,
          filename: activeFile.name,
          timeout: 5000,
        }),
      });

      const data = await res.json();

      const status = data.timed_out
        ? 'timeout'
        : data.success
        ? 'success'
        : 'error';

      setTerminalOutput({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exit_code,
        executionTime: data.execution_time,
        status,
      });

      // Record in execution history
      const newRecord: ExecutionRecord = {
        id: `exec_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        filename: activeFile.name,
        code,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exit_code,
        executionTime: data.execution_time,
        status,
        pythonVersion: data.python_version || pythonVersion,
      };

      setHistory((prev) => [newRecord, ...prev.slice(0, 24)]);

      // If program failed with error or traceback, offer 1-click AI diagnostics
      if (status === 'error' || status === 'timeout') {
        onShowToast(`Execution failed: ${data.stderr ? data.stderr.split('\n')[0] : 'Error'}`, 'error');
      } else {
        // Increment solved problem stats
        onUpdateCodingState((prev) => ({
          ...prev,
          solved: prev.solved + 1,
          streak: Math.max(prev.streak, 1),
        }));
        onShowToast(`Execution completed in ${data.execution_time}s ✓`, 'success');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setTerminalOutput({
          stdout: '',
          stderr: 'Execution stopped by user.',
          exitCode: 130,
          executionTime: 0,
          status: 'error',
        });
        onShowToast('Execution aborted', 'info');
      } else {
        setTerminalOutput({
          stdout: '',
          stderr: `Network / Request Error: ${err.message}`,
          exitCode: 1,
          executionTime: 0,
          status: 'error',
        });
        onShowToast('Failed to reach Python backend', 'error');
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Running Execution
  const handleStopExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Format Code with PEP 8
  const handleFormatCode = async () => {
    try {
      const res = await fetch('/api/python/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.formatted) {
        handleUpdateCode(data.formatted);
        onShowToast('Python code formatted successfully ✨', 'success');
      }
    } catch (e) {
      onShowToast('Unable to format code', 'error');
    }
  };

  // AI Error Debugger & Fixer
  const handleAiDebug = async () => {
    if (!terminalOutput.stderr && terminalOutput.status !== 'error' && terminalOutput.status !== 'timeout') {
      onShowToast('Run the code first or trigger an error to inspect', 'info');
      return;
    }

    setIsAiDebugging(true);
    setActiveTab('ai-debug');

    try {
      const res = await fetch('/api/python/ai-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          error: terminalOutput.stderr || 'Runtime failed',
          filename: activeFile.name,
        }),
      });

      const data: AIDebugResult = await res.json();
      setAiDebugResult(data);
      onShowToast('AI error explanation generated!', 'success');
    } catch (e: any) {
      onShowToast('AI Debugger failed to analyze error', 'error');
    } finally {
      setIsAiDebugging(false);
    }
  };

  // Apply AI corrected code to editor
  const handleApplyAiFix = (correctedCode: string) => {
    handleUpdateCode(correctedCode);
    onShowToast('Applied AI corrected code to editor! 🚀', 'success');
  };

  // File System Management
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes('.')) name += '.py';

    const newFile: CodeFile = {
      id: `file_${Date.now()}`,
      name,
      language: name.endsWith('.md') ? 'markdown' : name.endsWith('.txt') ? 'text' : 'python',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: name.endsWith('.py')
        ? `# ${name}\n# Write your Python code here.\n\nprint("Hello from ${name}!")\n`
        : `# ${name}\n`,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setCode(newFile.content);
    setNewFileName('');
    setIsCreatingFile(false);
    onShowToast(`Created file "${name}"`, 'success');
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    if (files.length <= 1) {
      onShowToast('Cannot delete the only file in project', 'error');
      return;
    }
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
      setCode(remaining[0].content);
    }
    onShowToast(`Deleted "${fileName}"`, 'info');
  };

  const handleRenameFile = (fileId: string) => {
    if (!editingFileName.trim()) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: editingFileName.trim() } : f))
    );
    setEditingFileId(null);
    setEditingFileName('');
    onShowToast('File renamed', 'success');
  };

  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${activeFile.name}`, 'success');
  };

  // Find and Replace Handler
  const handleReplace = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery, 'g');
    const newCode = code.replace(regex, replaceQuery);
    handleUpdateCode(newCode);
    onShowToast(`Replaced all occurrences of "${searchQuery}"`, 'info');
  };

  // Calculate lines for gutter
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl ai-gradient text-white flex items-center justify-center vibrant-shadow-sm">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-[#0F172A] tracking-tight">Python IDE & Coding Space</h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#10B981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                {pythonVersion}
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-medium">Real CPython execution engine with STDIN support & Gemini error debugger</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap text-xs font-semibold tabular-nums">
          <div className="flex items-center gap-1.5 text-[#0F172A]">
            <Flame className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{codingState.streak} Day Streak</span>
          </div>
          <span className="text-[#64748B]" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5 text-[#7C3AED]">
            <Award className="w-4 h-4 text-[#7C3AED]" />
            <span>{codingState.solved} Executions</span>
          </div>
        </div>
      </div>

      {/* Main IDE Layout Grid: Project Explorer (2.5) + Editor (5.5) + Terminal / AI Debugger (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Project File Explorer & Templates (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* File Explorer Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#7C3AED]" /> Project Files
              </span>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1.5 rounded-lg text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                title="New File"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Create File Input */}
            {isCreatingFile && (
              <div className="p-2.5 bg-violet-50/70 rounded-2xl border border-violet-200 space-y-2">
                <input
                  type="text"
                  placeholder="e.g. test.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-white border border-violet-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-200/60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFile}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-1">
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                const isEditing = editingFileId === file.id;

                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (!isEditing) {
                        setActiveFileId(file.id);
                        setCode(file.content);
                      }
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-violet-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-violet-500'}`} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFile(file.id);
                            if (e.key === 'Escape') setEditingFileId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1.5 py-0.5 text-xs text-slate-900 bg-white rounded border border-violet-400 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{file.name}</span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFileId(file.id);
                            setEditingFileName(file.name);
                          }}
                          className={`p-1 rounded hover:bg-black/10 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-700'}`}
                          title="Rename File"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id, file.name);
                            }}
                            className={`p-1 rounded hover:bg-black/10 ${isActive ? 'text-white' : 'text-slate-400 hover:text-rose-600'}`}
                            title="Delete File"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Problem Templates & Snippets */}
          <div className="bg-white/95 rounded-3xl p-4 border border-violet-100 shadow-xs space-y-2.5">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-600" /> Starter Programs
            </span>
            <div className="space-y-1.5">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleUpdateCode(tmpl.code);
                    onShowToast(`Loaded "${tmpl.title}" into editor`, 'info');
                  }}
                  className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-violet-50/80 border border-slate-200/60 hover:border-violet-200 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 group-hover:text-violet-700">
                    <span className="truncate">{tmpl.title}</span>
                    <span className="text-[10px] font-normal text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                      {tmpl.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Editor Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[680px]">
            {/* Editor Toolbar Header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs font-mono font-bold text-slate-300 ml-1">
                  {activeFile.name}
                </span>
              </div>

              {/* Toolbar Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowFindBar((prev) => !prev)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    showFindBar ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Find & Replace (Ctrl + F)"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleFormatCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-300 text-xs font-mono font-semibold transition-all cursor-pointer"
                  title="Format Code (PEP 8)"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Format</span>
                </button>

                {isRunning ? (
                  <button
                    onClick={handleStopExecution}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    id="btn-run-code"
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Code</span>
                  </button>
                )}
              </div>
            </div>

            {/* Find & Replace Bar */}
            {showFindBar && (
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 flex-wrap text-xs font-mono">
                <input
                  type="text"
                  placeholder="Find..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-700 focus:outline-none focus:border-violet-500"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-700 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleReplace}
                  className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold cursor-pointer"
                >
                  Replace All
                </button>
              </div>
            )}

            {/* Editor Canvas with Line Numbers */}
            <div className="flex-1 flex overflow-hidden relative font-mono text-xs">
              {/* Line Gutter */}
              <div className="w-12 bg-slate-950 text-slate-600 text-right pr-3 pt-3 select-none border-r border-slate-900 overflow-hidden leading-relaxed">
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <div className="flex-1 relative bg-slate-950">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleUpdateCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  className="w-full h-full p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-violet-900/70"
                />
              </div>
            </div>

            {/* Editor Status Footer */}
            <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Python 3.12 • UTF-8</span>
              <span>Lines: {lineCount} • Chars: {code.length}</span>
            </div>
          </div>
        </div>

        {/* Right: Terminal / Output / STDIN / AI Debugger (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[680px]">
            {/* Terminal Tab Bar */}
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'terminal'
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Terminal</span>
                </button>

                <button
                  onClick={() => setActiveTab('stdin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'stdin'
                      ? 'bg-slate-800 text-violet-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>STDIN Input</span>
                  {stdinInput && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>History</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setTerminalOutput({
                      stdout: '',
                      stderr: '',
                      exitCode: null,
                      executionTime: null,
                      status: 'idle',
                    })
                  }
                  className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  title="Clear Terminal"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 space-y-3 bg-slate-950">
              {activeTab === 'terminal' && (
                <>
                  <div className="text-slate-500 text-[11px] pb-1 border-b border-slate-900 flex items-center justify-between">
                    <span>$ python {activeFile.name}</span>
                    {terminalOutput.status === 'running' && (
                      <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Running...
                      </span>
                    )}
                  </div>

                  {/* Standard Output */}
                  {terminalOutput.stdout && (
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {terminalOutput.stdout}
                    </div>
                  )}

                  {/* Standard Error / Traceback */}
                  {terminalOutput.stderr && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-300 whitespace-pre-wrap leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <AlertTriangle className="w-4 h-4" /> Execution Error
                      </div>
                      <div>{terminalOutput.stderr}</div>

                      {/* 1-Click AI Error Explainer Button */}
                      <div className="pt-2">
                        <button
                          onClick={handleAiDebug}
                          disabled={isAiDebugging}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isAiDebugging ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing with Gemini...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Explain & Fix with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Execution Status Footer */}
                  {terminalOutput.status !== 'idle' && terminalOutput.status !== 'running' && (
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-900 flex items-center justify-between">
                      <span className={terminalOutput.status === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {terminalOutput.status === 'success'
                          ? '✓ Process finished with exit code 0'
                          : `✕ Process failed (Exit Code: ${terminalOutput.exitCode ?? 1})`}
                      </span>
                      {terminalOutput.executionTime !== null && (
                        <span>Runtime: {terminalOutput.executionTime}s</span>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* STDIN Input Tab */}
              {activeTab === 'stdin' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Provide input lines for programs calling <code className="text-violet-300">input()</code>. Each line corresponds to one prompt response.
                  </div>
                  <textarea
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Enter input lines here (e.g.&#10;Alice&#10;21&#10;Computer Science)"
                    className="w-full h-48 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setStdinInput('');
                        onShowToast('STDIN cleared', 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Clear Input
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('terminal');
                        handleRunCode();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run with this STDIN</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AI Diagnostics & Fix Tab */}
              {activeTab === 'ai-debug' && (
                <div className="space-y-4">
                  {isAiDebugging ? (
                    <div className="p-8 text-center space-y-3">
                      <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Gemini 3.7 Flash is analyzing error traceback...</p>
                    </div>
                  ) : aiDebugResult ? (
                    <div className="space-y-3">
                      {/* Diagnostic Card */}
                      <div className="p-3.5 bg-violet-950/40 border border-violet-800/80 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-300" /> {aiDebugResult.errorType}
                          </span>
                          {aiDebugResult.lineNumber && (
                            <span className="px-2 py-0.5 rounded bg-violet-900/60 border border-violet-700 text-[10px]">
                              Line {aiDebugResult.lineNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{aiDebugResult.explanation}</p>
                      </div>

                      {/* Suggested Fix */}
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Fix</span>
                        <p className="text-xs text-emerald-300">{aiDebugResult.suggestedFix}</p>
                      </div>

                      {/* Corrected Code Action */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">Fixed Code Snippet</span>
                          <button
                            onClick={() => handleApplyAiFix(aiDebugResult.correctedCode)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Apply Fix to Editor</span>
                          </button>
                        </div>
                        <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto max-h-48">
                          {aiDebugResult.correctedCode}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No current error. Run your code, and if a syntax or runtime error occurs, click "Explain & Fix with AI".
                    </div>
                  )}
                </div>
              )}

              {/* Execution History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-900">
                    Recent Executions ({history.length})
                  </div>
                  {history.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">No execution history recorded yet.</div>
                  ) : (
                    history.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          setTerminalOutput({
                            stdout: rec.stdout,
                            stderr: rec.stderr,
                            exitCode: rec.exitCode,
                            executionTime: rec.executionTime,
                            status: rec.status,
                          });
                          setActiveTab('terminal');
                        }}
                        className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{rec.filename}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'success'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {rec.status.toUpperCase()} ({rec.executionTime}s)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{rec.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
