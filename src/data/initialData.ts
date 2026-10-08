import { Subject, StudyPlan, Task, Note, ProgressLog, AIRecommendation, CodingProblem, User } from '../types';

export const initialUser: User = {
  id: 'usr_1',
  name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  major: 'Computer Science & Engineering',
  targetGpa: '3.90',
  semester: 'Fall 2026',
};

export const initialSubjects: Subject[] = [
  {
    id: 1,
    name: 'Data Structures & Algorithms',
    code: 'CS 301',
    color: '#7C3AED',
    exam_date: '2026-09-18',
    priority: 'high',
    target_grade: 'A',
    credit_hours: 4,
    syllabus: 'Binary Search Trees, Graph Traversals (DFS/BFS), Dijkstra, Dynamic Programming, Heap/Priority Queues, Hash Maps collision resolution.',
    created_at: '2026-08-01',
  },
  {
    id: 2,
    name: 'Database Management Systems',
    code: 'CS 340',
    color: '#3B82F6',
    exam_date: '2026-09-28',
    priority: 'high',
    target_grade: 'A',
    credit_hours: 3,
    syllabus: 'Relational Algebra, SQL subqueries, B+ Tree Indexing, ACID Properties, 2PL Concurrency Control, Normalization (1NF to BCNF).',
    created_at: '2026-08-01',
  },
  {
    id: 3,
    name: 'Computer Systems & OS',
    code: 'CS 320',
    color: '#5B21B6',
    exam_date: '2026-10-08',
    priority: 'medium',
    target_grade: 'A-',
    credit_hours: 4,
    syllabus: 'Process Management, Threads, Mutex/Semaphores, Virtual Memory & Paging, Page Replacement (LRU), File Systems inode allocation.',
    created_at: '2026-08-01',
  },
  {
    id: 4,
    name: 'Probability & Engineering Statistics',
    code: 'MATH 310',
    color: '#2563EB',
    exam_date: '2026-10-15',
    priority: 'medium',
    target_grade: 'A',
    credit_hours: 3,
    syllabus: 'Bayes Theorem, Random Variables, Normal/Poisson Distributions, Central Limit Theorem, Hypothesis Testing, Confidence Intervals.',
    created_at: '2026-08-01',
  },
  {
    id: 5,
    name: 'Applied Machine Learning',
    code: 'CS 480',
    color: '#06B6D4',
    exam_date: '2026-11-04',
    priority: 'low',
    target_grade: 'A',
    credit_hours: 3,
    syllabus: 'Linear/Logistic Regression, Decision Trees, Gradient Boosting, Neural Networks, Backpropagation, Cross-Validation & Regularization.',
    created_at: '2026-08-01',
  },
];

export const initialPlans: StudyPlan[] = [
  {
    id: 1,
    subject_id: 1,
    plan_name: 'Midterm Mastery: Trees & Dynamic Programming',
    start_date: '2026-08-10',
    end_date: '2026-09-16',
    total_hours: 32,
    status: 'in-progress',
    notes: 'Focus heavily on memoization, tabulation patterns, and LeetCode medium graph questions.',
    daily_breakdown: [
      { day: 1, date: '2026-08-10', topic: 'AVL & Red-Black Tree Balancing', target_hours: 2.5, completed: true },
      { day: 2, date: '2026-08-12', topic: 'Graph Adjacency Matrix & DFS/BFS', target_hours: 3, completed: true },
      { day: 3, date: '2026-08-14', topic: 'Dijkstra and Topological Sort', target_hours: 3, completed: true },
      { day: 4, date: '2026-08-16', topic: '0/1 Knapsack & Subset Sum DP', target_hours: 3.5, completed: false },
      { day: 5, date: '2026-08-18', topic: 'Longest Common Subsequence & Edit Distance', target_hours: 3.5, completed: false },
    ],
  },
  {
    id: 2,
    subject_id: 2,
    plan_name: 'SQL Query Optimization & B+ Tree Indexing',
    start_date: '2026-08-15',
    end_date: '2026-09-25',
    total_hours: 24,
    status: 'pending',
    notes: 'Cover query execution plans, nested loops vs hash join, and transaction isolation levels.',
  },
  {
    id: 3,
    subject_id: 3,
    plan_name: 'Virtual Memory & Page Replacement Deep Dive',
    start_date: '2026-08-01',
    end_date: '2026-08-12',
    total_hours: 18,
    status: 'completed',
    notes: 'Reviewed TLB miss handling, page faults, and multi-level page tables.',
  },
];

export const initialTasks: Task[] = [
  {
    id: 101,
    subject_id: 1,
    plan_id: 1,
    task_name: 'Implement Dijkstra & Bellman-Ford in Python',
    description: 'Write custom adjacency list representation with min-heap priority queue and benchmark running times.',
    due_date: '2026-08-16',
    estimated_hours: 3.0,
    actual_hours: 2.5,
    status: 'in-progress',
    priority: 'high',
    tags: ['Coding', 'Algorithms', 'Graphs'],
    subtasks: [
      { id: 'st1', title: 'Construct graph representation', completed: true },
      { id: 'st2', title: 'Implement PriorityQueue Dijkstra', completed: true },
      { id: 'st3', title: 'Handle negative weight cycles detection', completed: false },
    ],
  },
  {
    id: 102,
    subject_id: 2,
    plan_id: 2,
    task_name: 'Write Complex SQL Aggregations & Window Functions',
    description: 'Solve 10 LeetCode Database Medium problems using ROW_NUMBER, RANK, DENSE_RANK, and CTEs.',
    due_date: '2026-08-18',
    estimated_hours: 2.5,
    actual_hours: 0,
    status: 'pending',
    priority: 'high',
    tags: ['Databases', 'SQL', 'Practice'],
    subtasks: [
      { id: 'st4', title: 'Window partition queries', completed: false },
      { id: 'st5', title: 'Recursive CTE hierarchy queries', completed: false },
    ],
  },
  {
    id: 103,
    subject_id: 4,
    plan_id: null,
    task_name: 'Solve Probability Distribution Problem Set 4',
    description: 'Problems 14-28 on Poisson approximation, Exponential distribution, and joint PDF integrations.',
    due_date: '2026-08-19',
    estimated_hours: 2.0,
    actual_hours: 0,
    status: 'pending',
    priority: 'medium',
    tags: ['Math', 'Homework'],
  },
  {
    id: 104,
    subject_id: 3,
    plan_id: 3,
    task_name: 'Read OS Chapter 9: Virtual Memory Architectures',
    description: 'Summarize page table inversion, TLB cache coherence, and working set models in Notes.',
    due_date: '2026-08-12',
    estimated_hours: 2.0,
    actual_hours: 2.0,
    status: 'completed',
    priority: 'medium',
    tags: ['Reading', 'Theory'],
    completed_at: '2026-08-12T16:30:00Z',
  },
  {
    id: 105,
    subject_id: 5,
    plan_id: null,
    task_name: 'Train and Tune Random Forest Classifier on Titanic Dataset',
    description: 'Evaluate feature importances, ROC-AUC curves, and perform 5-fold GridSearchCV hyperparameter tuning.',
    due_date: '2026-08-22',
    estimated_hours: 3.5,
    actual_hours: 0,
    status: 'pending',
    priority: 'low',
    tags: ['Machine Learning', 'Python'],
  },
];

export const initialNotes: Note[] = [
  {
    id: 301,
    subject_id: 1,
    title: 'Dynamic Programming Patterns Cheat Sheet',
    content: `# Dynamic Programming Core Frameworks

## 1. State Formulation & Recurrence
Every DP problem requires:
- **State Definition**: What does \`dp[i][w]\` represent? (e.g. max value using first $i$ items with capacity $w$)
- **Base Cases**: When $i=0$ or $w=0$, $\\text{val} = 0$.
- **Transition Equation**:
  $$\\text{dp}[i][w] = \\max(\\text{dp}[i-1][w], \\text{dp}[i-1][w - \\text{wt}[i]] + \\text{val}[i])$$

## 2. Classic Patterns
1. **0/1 Knapsack**: Pick or skip, iterate capacity backwards in 1D array optimization.
2. **Unbounded Knapsack / Coin Change**: Iterate forward in 1D array.
3. **Longest Common Subsequence (LCS)**: If $s1[i] == s2[j] \\implies dp[i-1][j-1] + 1$, else $\\max(dp[i-1][j], dp[i][j-1])$.
4. **Interval DP**: Matrix chain multiplication, burst balloons ($O(N^3)$).
5. **State Machine / Buy-Sell Stock**: Track \`held\`, \`sold\`, \`cooldown\` states.

## 3. Complexity Optimization
- Space optimization from $O(N \\times W)$ to $O(W)$ using rolling arrays.`,
    tags: ['Algorithms', 'Cheat Sheet', 'DP'],
    created_at: '2026-08-11T14:20:00Z',
    ai_summary: 'Comprehensive cheat sheet covering 0/1 knapsack, unbounded knapsack, LCS, interval DP, and state compression.',
    key_takeaways: [
      'Always clarify the exact sub-problem state definition before writing loops',
      'For 0/1 knapsack 1D space optimization, iterate capacities in reverse order',
      'Use state-machine DP for multi-stage decision flows like stock trading with cooldown',
    ],
  },
  {
    id: 302,
    subject_id: 2,
    title: 'B+ Tree vs Hash Indexing Comparison',
    content: `# Database Indexing Mechanisms

### B+ Tree Index
- **Structure**: Multi-way balanced search tree where all data pointers live exclusively in leaf nodes. Leaves are doubly linked for sequential range scans.
- **Complexity**: $O(\\log_B N)$ for search, insertion, and deletion.
- **Best for**: Range queries (\`BETWEEN 10 AND 50\`), sorting (\`ORDER BY\`), and prefix matching (\`LIKE 'Smith%'\`).

### Hash Index
- **Structure**: Hash table with bucket chains.
- **Complexity**: Average $O(1)$ lookup, worst case $O(N)$ during high hash collisions.
- **Limitation**: Cannot support range queries or sorting; only strict equality (\`=\`).

### Composite Index Leftmost Prefix Rule
If index is created on \`(dept_id, salary, hire_date)\`:
- Queries on \`dept_id\` or \`(dept_id, salary)\` use the index.
- Queries ONLY on \`salary\` cannot utilize the B+ tree root path!`,
    tags: ['Databases', 'Indexing', 'SQL'],
    created_at: '2026-08-13T10:00:00Z',
    ai_summary: 'B+ Trees provide $O(\\log N)$ balanced access with doubly-linked leaves for range scans, while Hash indices offer $O(1)$ point lookups but zero range capability.',
    key_takeaways: [
      'B+ tree leaf nodes are linked in order for fast sequential range scans',
      'Composite indexes strictly follow the leftmost prefix rule',
      'Hash indexes are purely point-query lookups ($O(1)$)',
    ],
  },
];

export const initialProgress: ProgressLog[] = [
  {
    id: 201,
    subject_id: 1,
    date: '2026-08-08',
    hours: 2.5,
    topics: 'Binary Trees & Tree Traversals (Inorder, Preorder, Postorder, Morris)',
    notes: 'Solved 4 LeetCode tree problems. Morris traversal is neat for $O(1)$ space!',
    rating: 5,
    session_type: 'coding',
  },
  {
    id: 202,
    subject_id: 2,
    date: '2026-08-09',
    hours: 2.0,
    topics: 'Relational Calculus & Advanced Group By Clauses',
    notes: 'Reviewed tuple relational calculus formulas and practicing HAVING subqueries.',
    rating: 4,
    session_type: 'revision',
  },
  {
    id: 203,
    subject_id: 3,
    date: '2026-08-10',
    hours: 3.0,
    topics: 'Process Scheduling: Round Robin, SJF, Multilevel Feedback Queue',
    notes: 'Calculated turnaround time and waiting time matrices for 5 test workloads.',
    rating: 4,
    session_type: 'lecture',
  },
  {
    id: 204,
    subject_id: 1,
    date: '2026-08-11',
    hours: 3.5,
    topics: 'Dynamic Programming: Memoization & 0/1 Knapsack',
    notes: 'Deep session with Pomodoro timer. Formulated space reduction to 1D array.',
    rating: 5,
    session_type: 'pomodoro',
  },
  {
    id: 205,
    subject_id: 4,
    date: '2026-08-12',
    hours: 2.0,
    topics: 'Continuous Random Variables & Probability Density Functions',
    notes: 'Derived expected value and variance for Gaussian and Exponential distributions.',
    rating: 4,
    session_type: 'practice',
  },
  {
    id: 206,
    subject_id: 1,
    date: '2026-08-13',
    hours: 2.5,
    topics: 'Graph Algorithms: Breadth-First Search & Bipartite Checking',
    notes: 'Implemented BFS level tracking and 2-coloring bipartite graph check in Python.',
    rating: 5,
    session_type: 'coding',
  },
  {
    id: 207,
    subject_id: 2,
    date: '2026-08-14',
    hours: 1.5,
    topics: 'Database Normalization & Functional Dependencies',
    notes: 'Practiced decomposition up to BCNF without losing dependency preservation.',
    rating: 4,
    session_type: 'pomodoro',
  },
];

export const initialRecommendations: AIRecommendation[] = [
  {
    id: 401,
    title: 'High-Impact Focus: Algorithms Midterm in 35 Days',
    text: 'Data Structures & Algorithms has your nearest high-priority exam on Sept 18. You have completed 3/5 milestones on your Tree & DP plan.',
    details: 'Recommendation: Schedule a 90-minute block for 0/1 Knapsack variations and topological sort before moving to graph shortest paths.',
    category: 'urgent',
    generated_date: '2026-08-14T09:00:00Z',
    action_label: 'View Study Plan',
    action_page: 'planner',
  },
  {
    id: 402,
    title: 'Study Velocity Analysis',
    text: 'You logged 17.0 hours over the last 7 days! Peak productivity detected during morning sessions between 9:00 AM and 12:30 PM.',
    details: 'Consistency is strong at 6 consecutive active study days. Maintain your 25/5 Pomodoro rhythm.',
    category: 'praise',
    generated_date: '2026-08-14T08:30:00Z',
    action_label: 'Track Progress',
    action_page: 'progress',
  },
  {
    id: 403,
    title: 'Database SQL Window Functions Opportunity',
    text: 'You have 1 pending task for Database Systems due in 4 days. Practicing LeetCode SQL window queries will cement B+ tree knowledge.',
    details: 'Suggested practice: RANK vs DENSE_RANK partition queries and cumulative running sums.',
    category: 'schedule',
    generated_date: '2026-08-13T18:00:00Z',
    action_label: 'Open Task',
    action_page: 'tasks',
  },
];

export const codingProblemsList: CodingProblem[] = [
  {
    id: 'p1',
    title: 'Two Sum (Hash Map Approach)',
    difficulty: 'Easy',
    language: 'python',
    prompt: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target` in O(n) time.',
    starterCode: `def two_sum(nums, target):
    # Use a dictionary to store complement indices
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test run
print("Result for [2, 7, 11, 15], target=9:", two_sum([2, 7, 11, 15], 9))
print("Result for [3, 2, 4], target=6:", two_sum([3, 2, 4], 6))`,
    testCases: [
      { input: '[2, 7, 11, 15], target=9', expected: '[0, 1]' },
      { input: '[3, 2, 4], target=6', expected: '[1, 2]' },
    ],
  },
  {
    id: 'p2',
    title: 'Dijkstra Shortest Path Algorithm',
    difficulty: 'Medium',
    language: 'python',
    prompt: 'Implement Dijkstra algorithm using a min-heap priority queue to find the shortest distance from node 0 to all other nodes.',
    starterCode: `import heapq

def dijkstra(n, edges, start_node):
    # graph: adjacency list of (neighbor, weight)
    graph = {i: [] for i in range(n)}
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))
        
    distances = {i: float('inf') for i in range(n)}
    distances[start_node] = 0
    pq = [(0, start_node)] # (cost, node)
    
    while pq:
        curr_dist, u = heapq.heappop(pq)
        if curr_dist > distances[u]:
            continue
            
        for v, weight in graph[u]:
            if distances[u] + weight < distances[v]:
                distances[v] = distances[u] + weight
                heapq.heappush(pq, (distances[v], v))
                
    return distances

# 4 nodes: 0, 1, 2, 3
edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1), (2, 3, 5)]
print("Shortest paths from 0:", dijkstra(4, edges, 0))`,
    testCases: [
      { input: '4 nodes, start 0', expected: '{0: 0, 1: 3, 2: 1, 3: 4}' },
    ],
  },
  {
    id: 'p3',
    title: 'LRU Cache (Least Recently Used)',
    difficulty: 'Hard',
    language: 'python',
    prompt: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put operations.',
    starterCode: `class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {} # key -> node
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add(self, node):
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

lru = LRUCache(2)
lru.put(1, 1)
lru.put(2, 2)
print("Get 1:", lru.get(1))
lru.put(3, 3) # evicts key 2
print("Get 2 (should be -1):", lru.get(2))
print("Get 3:", lru.get(3))`,
    testCases: [],
  },
];
