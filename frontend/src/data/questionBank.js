export const questionBank = {
  ds: [
    {
      id: "ds-dsa-1",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Linked Lists",
      question: "Given a singly linked list, which of the following algorithms can detect a cycle using constant O(1) auxiliary space complexity?",
      options: [
        "Floyd's Tortoise and Hare Cycle-Finding Algorithm",
        "Depth-First Search (DFS) with a visited Hash Set",
        "Kahn's Topological Sort algorithm",
        "Reversing the linked list in-place and checking head pointers"
      ],
      answer: 0,
      explanation: "Floyd's cycle-finding algorithm uses two pointers (slow and fast moving at different speeds). If a cycle exists, they must eventually meet, requiring only O(1) space. Using a hash set requires O(n) space."
    },
    {
      id: "ds-dsa-2",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Trees",
      question: "Why does an AVL tree maintain a stricter balance factor than a Red-Black tree, and how does this affect runtime performance?",
      options: [
        "AVL trees have a balance factor of absolute height diff <= 1, making lookups faster (more balanced) but insertions/deletions more expensive due to frequent rotations.",
        "AVL trees do not require rotations during updates, making inserts faster than Red-Black trees.",
        "AVL trees are unbalanced, resulting in O(N) search time in the worst-case scenario.",
        "AVL trees rely on random probability to balance themselves, similar to skip lists."
      ],
      answer: 0,
      explanation: "AVL trees strictly balance heights within diff <= 1, which results in slightly shorter maximum heights and faster search times, but requires more rotations during inserts and deletes compared to Red-Black trees."
    },
    {
      id: "ds-dsa-3",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Dynamic Programming",
      question: "Which of the following describes the core difference between Memoization (Top-Down) and Tabulation (Bottom-Up) in dynamic programming?",
      options: [
        "Memoization uses recursion and solves subproblems on-demand, caching results; Tabulation uses iteration to fill an n-dimensional table from the base cases up.",
        "Memoization is iterative and uses less memory than bottom-up Tabulation.",
        "Tabulation suffers from recursion stack overflow errors when inputs are extremely large.",
        "Memoization completely avoids subproblem overlapping, while Tabulation does not."
      ],
      answer: 0,
      explanation: "Memoization is top-down (starts with the main problem and recursively solves subproblems, storing results in a lookup table), whereas Tabulation is bottom-up (starts from base cases and iteratively solves subproblems, filling a table sequentially)."
    },
    {
      id: "ds-dsa-4",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Graphs",
      question: "In Dijkstra's shortest-path algorithm implemented with a binary min-heap, what is the worst-case time complexity, assuming a graph with V vertices and E edges?",
      options: [
        "O((V + E) log V)",
        "O(V * E)",
        "O(V^2)",
        "O(E^2 log V)"
      ],
      answer: 0,
      explanation: "With a binary min-heap, extracting the minimum vertex takes O(log V) and updating the keys of all neighbors takes O(E log V), leading to a total time complexity of O((V + E) log V)."
    }
  ],
  dbms: [
    {
      id: "dbms-nf-1",
      type: "MCQ",
      difficulty: "medium",
      subtopic: "Normalization",
      question: "A table has a primary key (A, B) and a non-prime attribute C. C depends entirely on B, which is a proper subset of the primary key. Which normal form does this relation violate?",
      options: [
        "Second Normal Form (2NF)",
        "First Normal Form (1NF)",
        "Third Normal Form (3NF)",
        "Boyce-Codd Normal Form (BCNF)"
      ],
      answer: 0,
      explanation: "A partial dependency exists when a non-prime attribute (C) is functionally dependent on a part of a composite primary key (B). This violates Second Normal Form (2NF), which requires all non-key attributes to be fully functionally dependent on the entire primary key."
    },
    {
      id: "dbms-tx-1",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Concurrency Control",
      question: "Which of the following database isolation levels completely prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?",
      options: [
        "Serializable",
        "Read Committed",
        "Repeatable Read",
        "Read Uncommitted"
      ],
      answer: 0,
      explanation: "Serializable is the highest isolation level. It forces transactions to occur sequentially or in a way that yields equivalent serial execution, completely preventing all concurrency anomalies including Dirty Reads, Non-Repeatable Reads, and Phantom Reads."
    }
  ],
  os: [
    {
      id: "os-mem-1",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Virtual Memory",
      question: "What is 'Thrashing' in an Operating System, and how can it be resolved?",
      options: [
        "It occurs when a system spends more time swapping pages in and out of memory than executing processes. It is resolved by reducing the degree of multiprogramming.",
        "It is a state where the CPU crashes due to low power. It is resolved by upgrading the hardware processor.",
        "It happens when two processes deadlock on disk drives. It is resolved by aborting both processes.",
        "It refers to disk sectors wearing out. It is resolved by defragmenting the drive."
      ],
      answer: 0,
      explanation: "Thrashing occurs when the virtual memory page-fault rate is very high, causing the CPU to spend its time swapping pages rather than processing instructions. Reducing the number of concurrent processes (multiprogramming) or adding physical memory resolves it."
    },
    {
      id: "os-sync-1",
      type: "MCQ",
      difficulty: "medium",
      subtopic: "Deadlocks",
      question: "Which of the following is NOT one of Coffman's four necessary and sufficient conditions for a system deadlock to occur?",
      options: [
        "Preemption",
        "Mutual Exclusion",
        "Hold and Wait",
        "Circular Wait"
      ],
      answer: 0,
      explanation: "The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. 'Preemption' is the cure; the condition for deadlock is 'No Preemption'."
    }
  ],
  cn: [
    {
      id: "cn-tcp-1",
      type: "MCQ",
      difficulty: "advanced",
      subtopic: "Transport Layer",
      question: "During TCP congestion control, what triggers the transition from 'Slow Start' phase to 'Congestion Avoidance' phase?",
      options: [
        "The congestion window size exceeds the slow start threshold (ssthresh)",
        "The receiver's window buffer becomes completely full",
        "A triple duplicate ACK is received by the sender",
        "A hard timeout occurs waiting for an ACK"
      ],
      answer: 0,
      explanation: "In TCP congestion control, the slow start phase doubles the congestion window size (cwnd) every RTT. When cwnd reaches or exceeds ssthresh, the algorithm switches to congestion avoidance to grow cwnd linearly (+1 MSS per RTT) to avoid overloading the network."
    }
  ],
  aiml: [
    {
      id: "ml-fit-1",
      type: "MCQ",
      difficulty: "medium",
      subtopic: "Overfitting",
      question: "Which of the following techniques directly acts as a regularizer to mitigate overfitting in a Deep Neural Network?",
      options: [
        "Dropout",
        "Using a higher learning rate",
        "Removing all activation functions",
        "Multiplying weights by a random scalar factor"
      ],
      answer: 0,
      explanation: "Dropout randomly deactivates a fraction of neurons during each training step, forcing the network to learn robust, co-independent features rather than memorizing noise, which acts as a powerful regularization technique."
    }
  ],
  general: [
    {
      id: "gen-cog-1",
      type: "MCQ",
      difficulty: "basic",
      subtopic: "Proctoring Metrics",
      question: "Which pattern is most indicative of deliberate tab switching during an online proctored coding examination?",
      options: [
        "Repeated browser window 'blur' events accompanied by prolonged keyboard silence followed by sudden copy-paste activities",
        "Gazing directly at the camera while explaining the code aloud",
        "A slow, steady increase in typing speed over a 15-minute interval",
        "Occasional micro-expressions of hesitation while thinking through an algorithm"
      ],
      answer: 0,
      explanation: "Deliberate tab switching generates window blur events on the DOM, accompanied by an absence of keyboard activity (while reading external resources) followed by sudden pastes of code blocks, representing high-probability integrity anomalies."
    }
  ]
};
