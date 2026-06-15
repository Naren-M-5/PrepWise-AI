import os
import json
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env in the same directory as app.py
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes to support local and frontend deployment domains
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
is_gemini_active = False

if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        is_gemini_active = True
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
else:
    print("Gemini API key not found or is a placeholder. Using mock responses for demo.")

# Helper function to extract text from PDF
def extract_pdf_text(file_path):
    text = ""
    # Try pdfplumber first
    try:
        import pdfplumber
        print("Extracting with pdfplumber...")
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        print(f"pdfplumber failed: {e}. Trying PyPDF2 fallback...")
    
    # Try PyPDF2 fallback
    try:
        import PyPDF2
        print("Extracting with PyPDF2...")
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"PyPDF2 fallback failed: {e}")
        raise RuntimeError(f"Failed to extract text from PDF: {str(e)}")

# Detect topic to serve relevant mock data if Gemini is disabled
def detect_topic(text):
    text_lower = text.lower()
    if any(k in text_lower for k in ["database", "sql", "query", "schema", "table"]):
        return "databases"
    elif any(k in text_lower for k in ["os", "process", "scheduling", "thread", "kernel", "deadlock"]):
        return "operating_systems"
    elif any(k in text_lower for k in ["network", "tcp", "ip", "dns", "http", "routing"]):
        return "computer_networks"
    elif any(k in text_lower for k in ["neural", "machine learning", "ai", "deep learning", "gradient"]):
        return "machine_learning"
    elif any(k in text_lower for k in ["cell", "dna", "biology", "mitosis", "gene", "protein"]):
        return "biology"
    elif any(k in text_lower for k in ["force", "gravity", "energy", "velocity", "physics", "newton"]):
        return "physics"
    return "default_cs"

# Mock database of high-quality study materials
MOCK_DATA = {
    "databases": {
        "summary": {
            "summary": "This study guide covers Database Management Systems (DBMS), focusing on relational database design, Normalization (1NF, 2NF, 3NF, BCNF), and SQL querying. It highlights the importance of structured data storage, ACID transactions (Atomicity, Consistency, Isolation, Durability), and efficient index mechanisms to prevent data redundancy and anomalies.",
            "key_concepts": [
                "Relational Model: Data represented as tables (relations) of tuples.",
                "ACID Properties: Ensures reliability in transactions.",
                "Normalization: Multi-stage process to eliminate redundancy and update anomalies.",
                "Indexes: Data structures (e.g., B-Trees) that accelerate search operations."
            ],
            "definitions": [
                {"term": "Primary Key", "definition": "A unique identifier for a database record in a table, containing no null values."},
                {"term": "Foreign Key", "definition": "A field in one table that uniquely identifies a row of another table, enforcing referential integrity."},
                {"term": "Normalization", "definition": "The process of organizing data to minimize redundancy by dividing large tables into smaller, related ones."}
            ],
            "formulas": [
                {"name": "Database Selectivity", "formula": "Selectivity = (Number of Distinct Values) / (Total Number of Records)", "description": "Measures index effectiveness. Values closer to 1 indicate highly selective and useful indexes."}
            ]
        },
        "revision": {
            "quick": "• Databases organize structured data in tables (relations).\n• ACID properties guarantee transaction safety: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (independent concurrent execution), Durability (persisted commits).\n• Normalization reduces redundancy: 1NF removes repeating groups; 2NF removes partial dependencies; 3NF removes transitive dependencies.\n• SQL joins (INNER, LEFT, RIGHT, OUTER) merge records based on keys.",
            "standard": "### Database Management Systems (DBMS)\n\n#### Relational Model\nDatabases use tables of rows (tuples) and columns (attributes) linked by keys. Enforces data integrity rules.\n\n#### Transaction Management\nA transaction is a sequence of SQL queries treated as a single unit of work. Relational databases enforce **ACID** properties:\n- **Atomicity**: The transaction completes fully or is rolled back completely.\n- **Consistency**: Data moves from one valid state to another, obeying all constraints.\n- **Isolation**: Concurrent transactions do not interfere with one another.\n- **Durability**: Once written, data persists even during system crashes.\n\n#### Normalization Stages\n1. **First Normal Form (1NF)**: Every cell contains atomic values; no duplicate rows.\n2. **Second Normal Form (2NF)**: Meets 1NF, and all non-key attributes are fully functionally dependent on the entire primary key (no partial dependency).\n3. **Third Normal Form (3NF)**: Meets 2NF, and no non-key attribute transitively depends on the primary key (no transitive dependency).",
            "exam_night": "• **EXAM TIP**: Expected question on 3NF vs BCNF. BCNF is stricter: for any functional dependency A -> B, A must be a super key.\n• **ACID Quick Recall**: Know the definitions of Atomicity and Isolation. Deadlocks happen when transactions hold resources needed by each other.\n• **Indexing**: B-Tree indexes are excellent for range queries, while Hash indexes are faster for point lookups (O(1) average time) but fail at range searches."
        },
        "flashcards": [
            {"front": "What does the 'A' in ACID stand for and mean?", "back": "Atomicity. It guarantees that all operations within a transaction succeed, or they all fail (all-or-nothing)."},
            {"front": "What is a Transitive Dependency?", "back": "A functional dependency in which A -> B and B -> C, meaning A -> C transitively. 3NF outlaws this for non-key attributes."},
            {"front": "How does a LEFT JOIN differ from an INNER JOIN?", "back": "INNER JOIN returns only matching rows. LEFT JOIN returns all rows from the left table and matched rows from the right table, filling mismatches with NULL."}
        ],
        "quiz": [
            {
                "type": "mcq",
                "question": "Which normal form requires the removal of transitive dependencies?",
                "options": ["1NF", "2NF", "3NF", "BCNF"],
                "correctAnswer": "3NF",
                "explanation": "Third Normal Form (3NF) requires that the schema is in 2NF and has no transitive dependencies for non-prime attributes."
            },
            {
                "type": "tf",
                "question": "A Primary Key can contain NULL values as long as they are unique.",
                "options": ["True", "False"],
                "correctAnswer": "False",
                "explanation": "Primary keys uniquely identify records and must NOT contain NULL values, enforcing entity integrity."
            },
            {
                "type": "short",
                "question": "Name the database transaction property that ensures concurrent transactions do not interfere with each other.",
                "correctAnswer": "Isolation",
                "explanation": "Isolation guarantees that concurrent execution of transactions leaves the database in the same state as if they were executed serially."
            }
        ],
        "night_before": {
            "must_study": ["Normalization rules (1NF, 2NF, 3NF, BCNF) and how to decompose tables.", "ACID transaction guarantees and concurrency issues (dirty reads, phantom reads).", "SQL Query structures, specifically GROUP BY, HAVING, and JOINs."],
            "can_skip": ["Physical block storage architectures.", "History of hierarchical database engines (pre-relational)."],
            "likely_areas": ["Decomposition of a relation into 3NF/BCNF with dependency preservation.", "Explaining the difference between Clustered and Non-Clustered Indexes."],
            "checklist": ["Remember: BCNF requires that in X -> Y, X must be a superkey.", "Formulas: Selectivity = distinct values / total values.", "Common mistake: Putting aggregate functions (like SUM, AVG) in the WHERE clause instead of HAVING."]
        }
    },
    "operating_systems": {
        "summary": {
            "summary": "This study guide introduces Operating System concepts, covering process and thread management, CPU scheduling algorithms, memory management (paging, virtual memory), and deadlocks. It highlights how the OS acts as an intermediary, managing resource allocation and system calls.",
            "key_concepts": [
                "Process vs Thread: Process is an executing program instance with isolated memory; Thread is a lightweight execution unit sharing memory.",
                "CPU Scheduling: Algorithms like Round Robin, FIFO, and Shortest Job First allocate core execution time.",
                "Virtual Memory & Paging: Splitting memory into pages to prevent external fragmentation and run larger apps.",
                "Deadlocks: Mutual blockages resolved by prevention, avoidance (Banker's Algorithm), or detection."
            ],
            "definitions": [
                {"term": "Kernel", "definition": "The core program of an OS that manages system resources and coordinates hardware communication."},
                {"term": "Thrashing", "definition": "A state where the CPU spends more time swapping pages in and out of virtual memory than executing actual instructions."},
                {"term": "System Call", "definition": "The programmatic interface that allows user-level applications to request services directly from the kernel."}
            ],
            "formulas": [
                {"name": "CPU Utilization", "formula": "Utilization = 1 - p^n", "description": "Computes CPU utilization given 'n' processes, each spending a fraction 'p' of its time waiting for I/O."}
            ]
        },
        "revision": {
            "quick": "• Process: Active program with code, data, heap, stack. Thread: Executes within process, sharing address space.\n• CPU Schedulers balance throughput and latency. Round Robin uses time slices; Shortest Job First is optimal for average wait time but prone to starvation.\n• Paging translates virtual addresses to physical ones. Page faults occur when requested page isn't in RAM.\n• Deadlock requires 4 conditions simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.",
            "standard": "### Operating Systems Concepts\n\n#### CPU Scheduling\nCPU schedulers decide which process runs when the CPU is idle:\n- **First-Come, First-Served (FCFS)**: Simple but suffers from the 'Convoy Effect'.\n- **Shortest Job First (SJF)**: Minimizes average waiting time but requires predicting future CPU burst lengths.\n- **Round Robin (RR)**: Preemptive algorithm using time-quanta. Fair, but response times depend heavily on quantum size.\n\n#### Memory Management\nModern systems use Virtual Memory to abstract physical RAM:\n- **Paging**: Physical memory is broken into fixed-size blocks (frames), and logical memory into pages. A Page Table translates logical addresses to physical.\n- **Page Fault**: Triggered by the Memory Management Unit (MMU) when an address is accessed whose page is not in physical memory. The OS fetches it from disk.\n\n#### Deadlock Conditions (Coffman Conditions)\nDeadlocks occur when all four conditions are met:\n1. **Mutual Exclusion**: At least one resource must be held in non-shareable mode.\n2. **Hold and Wait**: Process holds a resource while waiting for another.\n3. **No Preemption**: Resources cannot be forcibly taken from a process.\n4. **Circular Wait**: A closed chain of processes exists where each process waits for a resource held by the next.",
            "exam_night": "• **EXAM TIP**: Memorize the Coffman Conditions! They are extremely likely to appear.\n• **Paging calculations**: Given address space size and page size, calculate number of offset bits. (Offset bits = log2(page_size)).\n• **Starvation vs Deadlock**: Starvation is a process waiting indefinitely for a resource (active state). Deadlock is a static circular block (frozen state)."
        },
        "flashcards": [
            {"front": "What is the difference between a process and a thread?", "back": "A process has its own isolated memory space. A thread is a path of execution within a process and shares resources (memory, files) with sister threads."},
            {"front": "What is Context Switching?", "back": "The process of saving the state of a running CPU process/thread so that it can be paused, and restoring the state of another process to resume execution."},
            {"front": "What is the purpose of the Banker's Algorithm?", "back": "It is a deadlock avoidance algorithm that dynamically checks resource allocation state to ensure the system remains in a 'safe state' before granting requests."}
        ],
        "quiz": [
            {
                "type": "mcq",
                "question": "Which CPU scheduling algorithm is optimal for minimizing average process waiting time?",
                "options": ["First-Come First-Served (FCFS)", "Round Robin (RR)", "Shortest Job First (SJF)", "Priority Scheduling"],
                "correctAnswer": "Shortest Job First (SJF)",
                "explanation": "Shortest Job First (SJF) always schedules the shortest tasks next, which mathematically minimizes the average waiting time."
            },
            {
                "type": "tf",
                "question": "Increasing physical RAM size will always eliminate page faults completely.",
                "options": ["True", "False"],
                "correctAnswer": "False",
                "explanation": "While more RAM reduces swapping, some page faults (compulsory faults) are inevitable when a page is accessed for the first time."
            },
            {
                "type": "short",
                "question": "How many Coffman conditions must be met simultaneously for a deadlock to occur?",
                "correctAnswer": "4",
                "explanation": "All 4 conditions (Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait) must hold true at the same time."
            }
        ],
        "night_before": {
            "must_study": ["4 Coffman conditions for deadlocks.", "Paging address translation mathematics.", "Round Robin vs SJF Scheduling simulation tasks."],
            "can_skip": ["Historical operating systems like MS-DOS or OS/360 details.", "Writing device drivers for generic storage blocks."],
            "likely_areas": ["Calculating page hits/faults using FIFO, LRU, and Optimal replacement algorithms.", "Tracing Banker's Algorithm safety vectors."],
            "checklist": ["Logical Address = (Page Number, Offset).", "Formula: Effective Access Time = (1-p)*RAM_AccessTime + p*PageFaultTime.", "Common mistake: Forgetting that SJF can cause starvation for longer jobs."]
        }
    },
    "default_cs": {
        "summary": {
            "summary": "This study guide covers Core Computer Science foundations, explaining fundamental Data Structures (Arrays, Linked Lists, Trees, Graphs), Algorithm Complexity (Big-O Notation), and efficiency tradeoffs. It details how selecting correct storage models optimizes system performance.",
            "key_concepts": [
                "Time Complexity: Notation expressing execution growth relative to inputs (O(1), O(N), O(N log N), O(N^2)).",
                "Dynamic Arrays: Contiguous elements with O(1) random access but O(N) worst-case insertions.",
                "Trees & BSTs: Hierarchical models facilitating log-time searching and sorted traversals.",
                "Hash Tables: Key-value stores using hash functions for O(1) average dictionary operations."
            ],
            "definitions": [
                {"term": "Big-O Notation", "definition": "A mathematical representation that describes the upper bound of an algorithm's running time or space requirements in the worst case."},
                {"term": "Binary Search Tree", "definition": "A node-based tree structure where the left subtree contains values less than the parent, and the right contains values greater."},
                {"term": "Hash Collision", "definition": "A situation where two distinct search keys produce the exact same index output from a hashing function."}
            ],
            "formulas": [
                {"name": "Array Memory Address", "formula": "Addr(A[i]) = BaseAddress + i * ElementSize", "description": "Calculates the physical RAM location of an array index in O(1) time."}
            ]
        },
        "revision": {
            "quick": "• Big-O measures scaling: O(1) is constant; O(log N) is binary search; O(N) is linear scans; O(N log N) is merge sort.\n• Arrays: Fast lookups (O(1)), slow insertions (O(N)). Linked Lists: Slow lookups (O(N)), fast insertions/deletions once pointer is found (O(1)).\n• BSTs search in O(log N) average, but O(N) if unbalanced. Self-balancing trees (AVL, Red-Black) guarantee O(log N).\n• Hash tables average O(1) lookup, but resolve collisions via chaining or open addressing.",
            "standard": "### Data Structures & Algorithms\n\n#### Time Complexity & Big-O\nWe analyze algorithms based on runtime growth:\n- **O(1)**: Constant time (e.g., retrieving from array index).\n- **O(log N)**: Logarithmic time (e.g., Binary Search).\n- **O(N)**: Linear time (e.g., searching an unsorted array).\n- **O(N log N)**: Linearithmic time (e.g., Merge Sort, Quick Sort average).\n- **O(N^2)**: Quadratic time (e.g., Bubble Sort, Insertion Sort worst case).\n\n#### Essential Data Structures\n1. **Array**: Contiguous memory blocks. Offers constant-time random access, but resizing requires copying all elements (O(N)).\n2. **Linked List**: Nodes linked by pointers. Allows efficient insertions/deletions at ends (O(1)), but requires linear scans to find elements.\n3. **Hash Table**: Maps keys to indexes using a hash function. Collisions are handled via:\n   - *Chaining*: Storing collided elements in a linked list at that index.\n   - *Open Addressing*: Searching for the next empty slot (linear probing, quadratic probing).\n\n#### Binary Search Trees (BST)\nFor every node: values in left subtree < node value < values in right subtree.\n- **In-Order Traversal** (Left, Root, Right) outputs BST keys in sorted order.\n- Search time is O(h) where h is tree height. Best height is O(log N); worst height is O(N) (skewed tree).",
            "exam_night": "• **EXAM TIP**: Don't confuse Merge Sort and Quick Sort space complexities. Merge Sort is O(N) auxiliary space; Quick Sort is O(log N) in-place stack space.\n• **Tree Traversals**: In-order = sorted. Pre-order = copy tree. Post-order = delete tree / evaluate mathematical expressions.\n• **Hashing**: Load factor α = N/M. When α exceeds threshold (usually 0.75), tables must be resized and rehashed."
        },
        "flashcards": [
            {"front": "What is the worst-case time complexity of searching in a Binary Search Tree?", "back": "O(N). This occurs when the tree is skewed (looks like a linked list) and unbalanced."},
            {"front": "What is the key advantage of a Linked List over an Array?", "back": "Dynamic sizing and O(1) insertion/deletion at arbitrary nodes without shifting memory elements, whereas arrays require contiguous space."},
            {"front": "What is the difference between Stable and Unstable sorting algorithms?", "back": "A stable sort preserves the relative order of records with equal keys. Unstable sorts (like Quick Sort) can reorder them."}
        ],
        "quiz": [
            {
                "type": "mcq",
                "question": "What is the worst-case time complexity of Quick Sort?",
                "options": ["O(N)", "O(N log N)", "O(N^2)", "O(2^N)"],
                "correctAnswer": "O(N^2)",
                "explanation": "Quick Sort runs in quadratic time O(N^2) when the pivot divides the array unevenly, such as when the array is already sorted and the extreme element is chosen."
            },
            {
                "type": "tf",
                "question": "Retrieving an item from a Hash Table is always O(1) in the worst-case.",
                "options": ["True", "False"],
                "correctAnswer": "False",
                "explanation": "In the worst case, if all items collide into the same slot (chaining), lookup degrades to O(N)."
            },
            {
                "type": "short",
                "question": "Which traversal of a Binary Search Tree produces values in sorted, ascending order?",
                "correctAnswer": "In-order",
                "explanation": "In-order traversal visits the left subtree, then the root, then the right subtree, resulting in sorted output for BSTs."
            }
        ],
        "night_before": {
            "must_study": ["Big-O limits of common sorting algorithms (Merge, Quick, Heap).", "BST operations and balancing techniques.", "Hash collision resolution methodologies."],
            "can_skip": ["B+ Tree disk partition specifications.", "Writing low-level assembly memory allocations."],
            "likely_areas": ["Tracing sorting partitions (e.g., Quick Sort partition step).", "Solving address calculations for multidimensional arrays."],
            "checklist": ["Checklist: O(log N) is faster than O(N).", "Formulas: Height of balanced BST = log2(N).", "Common mistake: Forgetting that a priority queue uses a binary heap (not a BST) for optimal retrieval."]
        }
    }
}

# Add fallback mocks for biology, physics, chemistry
MOCK_DATA["biology"] = {
    "summary": {
        "summary": "This study guide covers fundamental Cell Biology, including structure, functions, and divisions. It details differences between prokaryotic and eukaryotic cells, cell membrane transport, and cellular reproduction cycles (Mitosis vs Meiosis).",
        "key_concepts": [
            "Prokaryote vs Eukaryote: Prokaryotes lack a defined nucleus; Eukaryotes contain double-membraned organelles.",
            "Cell Membrane: Phospholipid bilayer regulating substance exchange via passive/active transport.",
            "Mitosis: Somatic cell division producing 2 identical diploid daughter cells.",
            "Meiosis: Germ cell division yielding 4 unique haploid gametes for reproduction."
        ],
        "definitions": [
            {"term": "Organelle", "definition": "A specialized subunit within a cell that has a specific metabolic function, analogous to an organ in the body."},
            {"term": "Active Transport", "definition": "The movement of ions or molecules across a cell membrane into a region of higher concentration, assisted by enzymes and requiring energy (ATP)."},
            {"term": "Somatic Cell", "definition": "Any cell of a living organism other than the reproductive germ cells."}
        ],
        "formulas": [
            {"name": "Mitotic Index", "formula": "Mitotic Index = (Number of Cells in Mitosis) / (Total Number of Cells)", "description": "Calculates cell proliferation rate, highly relevant in cancer research."}
        ]
    },
    "revision": {
        "quick": "• Cells: Basic unit of life. Prokaryotes (simple, no nucleus) vs Eukaryotes (complex, nucleus & organelles).\n• Membrane: Double lipid layers. Passive transport needs no energy (diffusion/osmosis); active transport uses ATP.\n• Mitosis: PMAT (Prophase, Metaphase, Anaphase, Telophase). Somatic cells, 2n -> 2n.\n• Meiosis: Double division, generates gametes, 2n -> 1n.",
        "standard": "### Cell Biology & Replication\n\n#### Cellular Classification\n- **Prokaryotes**: Bacteria/Archaea. Circular DNA in nucleoid, small, no membrane-bound organelles.\n- **Eukaryotes**: Plants/Animals/Fungi. Linear DNA inside nucleus, large, specialized organelles (mitochondria, chloroplasts).\n\n#### Membrane Mechanics\n- **Passive Transport**: Down concentration gradient. Includes simple diffusion, facilitated diffusion (using protein channels), and osmosis (water flow).\n- **Active Transport**: Up gradient. Uses transporter proteins and chemical energy (ATP). Example: Sodium-Potassium Pump (Na+/K+-ATPase).\n\n#### Cell Division Cycles\n- **Mitosis (Somatic Division)**:\n  - *Prophase*: Chromatin condenses into chromosomes; spindle fibers form.\n  - *Metaphase*: Chromosomes line up along the equatorial plate.\n  - *Anaphase*: Sister chromatids pulled to opposite poles.\n  - *Telophase*: Nuclear envelopes reform.\n- **Meiosis (Germ Division)**: Involves crossover/recombination in Prophase I, leading to high genetic diversity. Results in 4 non-identical haploid gametes.",
        "exam_night": "• **EXAM TIP**: Expected question on Mitosis vs Meiosis. Know that crossing over happens *only* in Prophase I of Meiosis.\n• **Active Transport Example**: Memorize Na+/K+ pump numbers: 3 Na+ out, 2 K+ in, using 1 ATP.\n• **Cell Wall**: Plants have cellulose walls; fungi have chitin; animals have none."
    },
    "flashcards": [
        {"front": "What is the primary function of the Mitochondria?", "back": "Powerhouse of the cell. Generates adenosine triphosphate (ATP) through cellular respiration."},
        {"front": "What occurs during the S-phase of the Cell Cycle?", "back": "Synthesis phase. The cell replicates its DNA so each chromosome has two sister chromatids before division."},
        {"front": "Explain Facilitated Diffusion.", "back": "A type of passive transport where molecules move down their gradient with the help of membrane transport proteins, without using ATP."}
    ],
    "quiz": [
        {
            "type": "mcq",
            "question": "Which organelle is responsible for sorting, modifying, and packaging proteins?",
            "options": ["Rough Endoplasmic Reticulum", "Golgi Apparatus", "Lysosome", "Ribosome"],
            "correctAnswer": "Golgi Apparatus",
            "explanation": "The Golgi apparatus receives proteins from the ER, refines them, and routes them to their final destinations."
        },
        {
            "type": "tf",
            "question": "Facilitated diffusion requires the expenditure of cellular energy (ATP).",
            "options": ["True", "False"],
            "correctAnswer": "False",
            "explanation": "Facilitated diffusion is passive transport. It uses channels but requires no energy since molecules move down their concentration gradients."
        },
        {
            "type": "short",
            "question": "In which phase of mitosis do sister chromatids separate and move to opposite poles?",
            "correctAnswer": "Anaphase",
            "explanation": "During Anaphase, the centromeres split and sister chromatids are pulled apart toward opposite poles by spindle fibers."
        }
    ],
    "night_before": {
        "must_study": ["Mitosis phases and chromosome numbers at each stage.", "Difference between active and passive transport mechanisms.", "Functions of primary organelles."],
        "can_skip": ["History of the microscope invention.", "Detailed biochemical pathways of non-essential secondary metabolites."],
        "likely_areas": ["Comparing the processes of Mitosis and Meiosis in a table.", "Explaining how osmosis affects animal cells vs plant cells (turgidity)."],
        "checklist": ["Remember: Plants have chloroplasts, animal cells do not.", "Formulas: Mitotic Index = dividing cells / total cells.", "Common mistake: Thinking DNA replication happens during Prophase. It happens in Interphase (S-phase)."]
    }
}

MOCK_DATA["physics"] = {
    "summary": {
        "summary": "This study guide covers Classical Mechanics, focusing on Newtonian Dynamics, Kinematics, Energy Conservation, and Momentum. It outlines how external forces determine motion states, and how energy translates between potential and kinetic forms.",
        "key_concepts": [
            "Newton's Laws: Governs force-motion relationships.",
            "Work-Energy Theorem: Net work done equals change in kinetic energy.",
            "Conservation of Momentum: Total momentum remains constant in isolated systems.",
            "Projectile Motion: Splitting two-dimensional motion into independent horizontal and vertical vectors."
        ],
        "definitions": [
            {"term": "Inertia", "definition": "The tendency of an object to resist changes in its state of motion."},
            {"term": "Conservative Force", "definition": "A force where the work done in moving an object between two points is independent of the path taken (e.g., gravity)."},
            {"term": "Impulse", "definition": "The product of the average net force and the time interval over which it acts, equivalent to the change in momentum."}
        ],
        "formulas": [
            {"name": "Kinetic Energy", "formula": "KE = 1/2 * m * v^2", "description": "Calculates the energy of an object in motion with mass 'm' and velocity 'v'."},
            {"name": "Newton's Second Law", "formula": "F = m * a", "description": "Expresses net force 'F' as product of mass 'm' and acceleration 'a'."}
        ]
    },
    "revision": {
        "quick": "• Kinematics: Equations require constant acceleration. F = ma governs motion.\n• Work W = Fd cos(θ). KE = 1/2 mv^2. PE = mgh. Energy is conserved.\n• Momentum p = mv. Conserved in all collisions. Kinetic energy is conserved *only* in elastic collisions.\n• Projectile motion: ax = 0 (constant vx), ay = -g (constant downward acceleration).",
        "standard": "### Classical Mechanics\n\n#### Newton's Laws of Motion\n1. **First Law (Inertia)**: An object remains at rest or in uniform motion unless acted upon by a net external force.\n2. **Second Law (Dynamics)**: The acceleration of an object is directly proportional to the net force and inversely proportional to its mass: **F_net = ma**.\n3. **Third Law (Action-Reaction)**: For every action, there is an equal and opposite reaction force.\n\n#### Energy Conservation\nEnergy cannot be created or destroyed, only transformed. In conservative systems:\n- **Total Mechanical Energy E = KE + PE = constant**.\n- **Kinetic Energy (KE)**: Energy of motion: `1/2 * m * v^2`.\n- **Gravitational Potential Energy (PE)**: Energy of position: `m * g * h`.\n- **Work-Energy Theorem**: `W_net = ΔKE = KE_final - KE_initial`.\n\n#### Momentum and Collisions\nLinear momentum `p = mv` is a vector. For any collision in an isolated system, **total momentum is conserved**:\n- **Elastic Collision**: Momentum is conserved, and kinetic energy is conserved. Objects bounce apart without deformation.\n- **Inelastic Collision**: Momentum is conserved, but kinetic energy is lost to heat/deformation. Objects may stick together (perfectly inelastic).",
        "exam_night": "• **EXAM TIP**: Friction always opposes relative motion. Force of static friction Fs <= μs * N.\n• **Elastic collision formula helper**: Use relative velocity of approach = relative velocity of separation: (v1 - v2) = (v2' - v1').\n• **G-constant**: Make sure to use g = 9.8 m/s^2 unless the exam specifies 10 m/s^2."
    },
    "flashcards": [
        {"front": "State Newton's Third Law of Motion.", "back": "For every action force, there is an equal and opposite reaction force. Forces always occur in matched action-reaction pairs."},
        {"front": "What is the difference between elastic and inelastic collisions?", "back": "In both, total momentum is conserved. In elastic, kinetic energy is also conserved. In inelastic, kinetic energy is lost (usually to heat, sound, or structural deformation)."},
        {"front": "Define a Conservative Force.", "back": "A force is conservative if the work done by it on an object is path-independent (e.g. Gravity, spring forces)."}
    ],
    "quiz": [
        {
            "type": "mcq",
            "question": "A 2 kg block is pushed with a net force of 10 N. What is its acceleration?",
            "options": ["2 m/s^2", "5 m/s^2", "10 m/s^2", "20 m/s^2"],
            "correctAnswer": "5 m/s^2",
            "explanation": "Using Newton's Second Law: a = F / m = 10 N / 2 kg = 5 m/s^2."
        },
        {
            "type": "tf",
            "question": "In a perfectly inelastic collision, kinetic energy is fully conserved.",
            "options": ["True", "False"],
            "correctAnswer": "False",
            "explanation": "In an inelastic collision, some kinetic energy is always converted into other forms of energy (like heat or internal energy). Only momentum is conserved."
        },
        {
            "type": "short",
            "question": "What is the term for the product of mass and velocity?",
            "correctAnswer": "Momentum",
            "explanation": "Momentum (p) is defined mathematically as the product of an object's mass (m) and its velocity (v)."
        }
    ],
    "night_before": {
        "must_study": ["Solving kinematics equations for projectile trajectories.", "Work-energy theorem problems with friction.", "Elastic vs inelastic collision setups."],
        "can_skip": ["Aviation aerodynamics details.", "Historical derivations of gravity metrics before Kepler."],
        "likely_areas": ["Calculating velocity of blocks on a frictionless inclined plane.", "Determining impulse from a Force-Time graph."],
        "checklist": ["Formulas: v^2 = u^2 + 2as.", "Formulas: Momentum p = mv; Impulse J = F*Δt = Δp.", "Common mistake: Mixing up mass (kg) and weight (Newtons, mg)."]
    }
}

# Helper to safely fetch mock data for a topic
def get_topic_mock_data(topic):
    if topic in MOCK_DATA:
        return MOCK_DATA[topic]
    return MOCK_DATA["default_cs"]

# AI Prompts Helper
def generate_with_gemini(prompt, response_schema=None):
    if not is_gemini_active:
        return None
    
    try:
        # We specify the model to be gemini-1.5-flash
        # If a JSON response schema is preferred, we use response_mime_type
        generation_config = {}
        if response_schema:
            generation_config = {
                "response_mime_type": "application/json"
            }
            
        model = genai.GenerativeModel("gemini-1.5-flash", generation_config=generation_config)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API invocation failed: {e}")
        return None

# Endpoints
@app.route("/api/extract-text", methods=["POST"])
def api_extract_text():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400
    
    try:
        # Create temp folder inside workspace if it doesn't exist
        temp_dir = os.path.join(os.path.dirname(__file__), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        filename = secure_filename(file.filename)
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        extracted_text = extract_pdf_text(temp_path)
        
        # Clean up file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if not extracted_text:
            return jsonify({"error": "Could not extract any text from the PDF. Ensure it is not an image-only PDF."}), 422
            
        return jsonify({
            "filename": filename,
            "textLength": len(extracted_text),
            "extractedText": extracted_text
        })
    except Exception as e:
        print(f"Error in extract-text endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/generate-summary", methods=["POST"])
def api_generate_summary():
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    topic = detect_topic(text)
    
    if is_gemini_active:
        prompt = f"""
        You are an expert study assistant. Analyze the following study material and generate a complete Study Kit Summary in JSON format.
        
        The JSON output must follow this strict structure:
        {{
            "summary": "A concise, detailed summary paragraphs of the material.",
            "key_concepts": [
                "Concept 1: Short explanation",
                "Concept 2: Short explanation"
            ],
            "definitions": [
                {{"term": "Term 1", "definition": "Clear concise definition"}},
                {{"term": "Term 2", "definition": "Clear concise definition"}}
            ],
            "formulas": [
                {{"name": "Formula Name", "formula": "math formula (e.g. F = ma)", "description": "What it represents"}}
            ]
        }}
        
        If there are no formulas in the text, you may leave the "formulas" array empty. Do not include markdown wraps around the JSON.
        
        Study Material:
        {text[:8000]}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                # Clean up any potential markdown formatting from response
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for summary: {e}, text: {response_text}")
                
    # Fallback to mock data
    return jsonify(get_topic_mock_data(topic)["summary"])

@app.route("/api/generate-revision", methods=["POST"])
def api_generate_revision():
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    topic = detect_topic(text)
    
    if is_gemini_active:
        prompt = f"""
        You are an expert tutor. Create revision notes for the study material below in three separate lengths.
        Return your response in JSON format matching this strict schema:
        {{
            "quick": "A 2-minute bulleted quick overview covering key concepts.",
            "standard": "A 10-minute study guide structured with markdown headings and concise notes.",
            "exam_night": "A high-yield 'Night Before Exam' revision containing only critical, high-yield items."
        }}
        
        Ensure the output values are correctly formatted markdown.
        
        Study Material:
        {text[:8000]}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for revision: {e}")
                
    # Fallback to mock data
    return jsonify(get_topic_mock_data(topic)["revision"])

@app.route("/api/generate-flashcards", methods=["POST"])
def api_generate_flashcards():
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    topic = detect_topic(text)
    
    if is_gemini_active:
        prompt = f"""
        Analyze the study material below and generate 6-10 flashcards in JSON array format.
        Each flashcard must contain a "front" (Question or Concept name) and a "back" (Explanation or Answer).
        
        Return ONLY a JSON array matching this format:
        [
            {{"front": "Question 1?", "back": "Answer 1"}},
            {{"front": "Question 2?", "back": "Answer 2"}}
        ]
        
        Study Material:
        {text[:8000]}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for flashcards: {e}")
                
    # Fallback to mock data
    return jsonify(get_topic_mock_data(topic)["flashcards"])

@app.route("/api/generate-quiz", methods=["POST"])
def api_generate_quiz():
    data = request.json or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    topic = detect_topic(text)
    
    if is_gemini_active:
        prompt = f"""
        Generate a comprehensive, challenging quiz from the study material below.
        You must generate 6-8 questions consisting of a mix of Multiple Choice (mcq), True/False (tf), and Short Answer (short) questions.
        
        Return the result in JSON format matching this schema:
        [
            {{
                "type": "mcq",
                "question": "Question text here?",
                "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
                "correctAnswer": "Choice B",
                "explanation": "Detailed explanation of why Choice B is correct and others are wrong."
            }},
            {{
                "type": "tf",
                "question": "Statement here...",
                "options": ["True", "False"],
                "correctAnswer": "True",
                "explanation": "Reasoning statement..."
            }},
            {{
                "type": "short",
                "question": "Question asking for a short answer term?",
                "correctAnswer": "AcceptableTerm",
                "explanation": "Explanation explaining the term..."
            }}
        ]
        
        Study Material:
        {text[:8000]}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for quiz: {e}")
                
    # Fallback to mock data
    return jsonify(get_topic_mock_data(topic)["quiz"])

@app.route("/api/chat-tutor", methods=["POST"])
def api_chat_tutor():
    data = request.json or {}
    context = data.get("context", "")
    history = data.get("history", []) # list of {"role": "user"/"model", "content": "..."}
    message = data.get("message", "")
    mode = data.get("mode", "normal") # normal, simple, eli10, mixed_tamil, exam_oriented
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
        
    system_instruction = "You are PrepWise AI Tutor, a friendly academic assistant. Help the student understand their materials."
    
    if context:
        system_instruction += f"\nUse the following student's study material as your primary source of truth. Rely on it and avoid answering outside its scope unless asked: \n--- START STUDY MATERIAL ---\n{context[:6000]}\n--- END STUDY MATERIAL ---"
    
    if mode == "simple":
        system_instruction += "\nStyle Instruction: Explain the concepts in very simple terms, breaking down jargon into clear sentences."
    elif mode == "eli10":
        system_instruction += "\nStyle Instruction: Explain like I am 10 years old (ELI10). Use simple analogies, short sentences, and everyday objects."
    elif mode == "mixed_tamil":
        system_instruction += "\nStyle Instruction: Answer in a friendly, conversational mixed Tamil-English style (commonly known as Tanglish or Tamil-English code-switching). Use common Tamil expressions combined with English technical terms."
    elif mode == "exam_oriented":
        system_instruction += "\nStyle Instruction: Focus strictly on exam strategies, key scoring points, typical question structures, and potential exam pitfalls."
        
    if is_gemini_active:
        try:
            # Build conversation format
            model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
            
            # Convert simple history representation to Gemini Chat format
            chat = model.start_chat(history=[
                {"role": "user" if h["role"] == "user" else "model", "parts": [h["content"]]}
                for h in history if h.get("content")
            ])
            
            response = chat.send_message(message)
            return jsonify({"response": response.text})
        except Exception as e:
            print(f"Gemini chat failed: {e}")
            
    # Mock fallback
    tutor_replies = {
        "normal": "This is a great question. In the uploaded material, we learn that this concept is fundamental to the subject. Let me break down the details: it involves coordination between resources, following protocols, and ensuring consistency. For exams, remember that this prevents data errors and deadlocks.",
        "simple": "Let me explain this simply: It is like a system of rules that makes sure everything happens in order. If two things try to change the same memory at the same time, this system steps in to say: 'Wait, one at a time!'",
        "eli10": "Imagine you and your friend are sharing a box of crayons. If both of you grab the red crayon at the exact same time, you might break it! An Operating System is like a nice teacher who says: 'Timmy, you use the red crayon first, then Sarah gets a turn.' This keeps things happy and safe!",
        "mixed_tamil": "In case check pannitingana, idhu romba simple dhaan. Database normalization-la schema redundancy-ah avoid panna tables-ah break panrom. Transitive dependency irundha 3NF clear aagathu, so inner tables core keys split panni, reference constraints foreign keys create panrom. Puriyudha, simple ah code write panni structure design panna easy-a score pannalaam!",
        "exam_oriented": "EXAM PREP ALERT: This is a high-yield question. When asked about this on exams, make sure you write down the 3 core requirements. 1. Mutual exclusion must be maintained. 2. Progress must happen. 3. Bounded waiting must be guaranteed. You will lose points if you omit 'bounded waiting'!"
    }
    
    response_mode = mode if mode in tutor_replies else "normal"
    return jsonify({"response": tutor_replies[response_mode]})

@app.route("/api/generate-learning-insights", methods=["POST"])
def api_generate_learning_insights():
    data = request.json or {}
    results = data.get("quizResults", [])
    
    if not results:
        # Default mock response for first-time dashboard insights
        return jsonify({
            "weaknessSummary": "No quiz results recorded yet. Complete a quiz to analyze your weak spots!",
            "chartData": [
                {"subject": "Quizzes", "score": 0, "fullMark": 100}
            ],
            "miniRevisionPack": {
                "concept": "Introduction to PrepWise AI",
                "explanation": "Upload your study notes, complete custom quizzes, and let the AI analyze your strengths and weaknesses to construct these custom Revision Packs.",
                "flashcards": [
                    {"front": "How do I start studying?", "back": "Drag and drop a PDF on the Upload Notes page to unlock the Study Kit!"}
                ],
                "quizzes": [
                    {
                        "type": "mcq",
                        "question": "Which button unlocks custom materials?",
                        "options": ["Dashboard", "Upload Notes", "Study Planner", "Ask Tutor"],
                        "correctAnswer": "Upload Notes",
                        "explanation": "Uploading notes parses your document and makes custom study aids available."
                    }
                ]
            }
        })
        
    # Process results to identify weaknesses and generate chart values
    # For a real application, we would aggregate the scores. Let's do that!
    topic_scores = {}
    for res in results:
        subject = res.get("subject", "General")
        score = res.get("score", 0)
        total = res.get("totalQuestions", 1)
        pct = (score / total) * 100
        
        if subject not in topic_scores:
            topic_scores[subject] = []
        topic_scores[subject].append(pct)
        
    chart_data = []
    weakest_topic = "General Study Techniques"
    lowest_avg = 100
    
    for subj, scores in topic_scores.items():
        avg = sum(scores) / len(scores)
        chart_data.append({
            "subject": subj,
            "score": round(avg),
            "fullMark": 100
        })
        if avg < lowest_avg:
            lowest_avg = avg
            weakest_topic = subj
            
    # Set up prompt to generate the Mini Revision Pack for the weakest topic
    if is_gemini_active:
        prompt = f"""
        The student is struggling with the topic: '{weakest_topic}' (Average Quiz Score: {lowest_avg}%).
        Generate a personalized Mini Revision Pack in JSON format to help them master this.
        
        The output must follow this strict schema:
        {{
            "weaknessSummary": "A friendly analysis of why this topic is difficult and what to focus on.",
            "miniRevisionPack": {{
                "concept": "Core Concept Name",
                "explanation": "A simplified, highly clear 2-paragraph explanation of the core concept.",
                "flashcards": [
                    {{"front": "Question 1?", "back": "Answer 1"}},
                    {{"front": "Question 2?", "back": "Answer 2"}},
                    {{"front": "Question 3?", "back": "Answer 3"}}
                ],
                "quizzes": [
                    {{
                        "type": "mcq",
                        "question": "Question 1?",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswer": "Answer content",
                        "explanation": "Explanation..."
                    }},
                    {{
                        "type": "mcq",
                        "question": "Question 2?",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswer": "Answer content",
                        "explanation": "Explanation..."
                    }},
                    {{
                        "type": "mcq",
                        "question": "Question 3?",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswer": "Answer content",
                        "explanation": "Explanation..."
                    }}
                ]
            }}
        }}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                parsed = json.loads(clean_json.strip())
                parsed["chartData"] = chart_data
                return jsonify(parsed)
            except Exception as e:
                print(f"Failed to parse Gemini JSON for insights: {e}")
                
    # Fallback response for mock
    mock_packs = {
        "databases": {
            "weaknessSummary": f"Your performance indicates struggles with Relational Joins and Normalization in '{weakest_topic}'. Let's reinforce primary key definitions and table decomposition.",
            "miniRevisionPack": {
                "concept": "Third Normal Form (3NF)",
                "explanation": "3NF requires a table to be in 2NF, and all non-key columns must be independent of other non-key columns. In short: Every non-key attribute must provide a fact about the key, the whole key, and nothing but the key (so help me Codd!).",
                "flashcards": [
                    {"front": "What is transitive dependency?", "back": "When A determines B, and B determines C, meaning A transitively determines C. This is prohibited in 3NF."},
                    {"front": "Who invented normalization?", "back": "Edgar F. Codd, who also proposed the relational database model in 1970."},
                    {"front": "What is a candidate key?", "back": "A minimal set of attributes that can uniquely identify any tuple in a table."}
                ],
                "quizzes": [
                    {
                        "type": "mcq",
                        "question": "If A -> B and B -> C, what type of dependency is present between A and C?",
                        "options": ["Trivial Dependency", "Transitive Dependency", "Partial Dependency", "Multivalued Dependency"],
                        "correctAnswer": "Transitive Dependency",
                        "explanation": "Since A determines B and B determines C, A transitively determines C through B."
                    },
                    {
                        "type": "mcq",
                        "question": "A table is in 2NF if it is in 1NF and does not contain which of the following?",
                        "options": ["Transitive dependencies", "Partial functional dependencies", "Multivalued attributes", "Foreign keys"],
                        "correctAnswer": "Partial functional dependencies",
                        "explanation": "Second Normal Form (2NF) specifically requires the removal of partial dependencies (where a non-prime attribute depends on only a part of a composite primary key)."
                    },
                    {
                        "type": "mcq",
                        "question": "What does BCNF stand for?",
                        "options": ["Basic Codependent Normal Form", "Boyce-Codd Normal Form", "Binary Condition Normal Form", "Base-Constraints Normal Form"],
                        "correctAnswer": "Boyce-Codd Normal Form",
                        "explanation": "BCNF stands for Boyce-Codd Normal Form, a slightly stronger version of 3NF created by Raymond Boyce and Edgar Codd."
                    }
                ]
            }
        },
        "operating_systems": {
            "weaknessSummary": f"You are losing points on Process Synchronization and CPU Scheduling in '{weakest_topic}'. Pay attention to waiting times and preemption concepts.",
            "miniRevisionPack": {
                "concept": "Mutual Exclusion & Semaphores",
                "explanation": "Mutual exclusion ensures that only one process can enter a critical section at a time. A semaphore is an integer variable used for signaling, controlled via wait() (decrement) and signal() (increment) operations.",
                "flashcards": [
                    {"front": "What is a Critical Section?", "back": "A segment of code where shared resources (memory, files) are accessed, which must be protected from concurrent access."},
                    {"front": "What is a Binary Semaphore?", "back": "A semaphore that can only take values 0 and 1, acting similarly to a Mutex lock."},
                    {"front": "What is Starvation?", "back": "A process is ready to run but is perpetually denied access to resources or CPU time due to scheduler bias."}
                ],
                "quizzes": [
                    {
                        "type": "mcq",
                        "question": "What operation is used to acquire a lock using a semaphore?",
                        "options": ["wait()", "signal()", "post()", "release()"],
                        "correctAnswer": "wait()",
                        "explanation": "The wait() (historically P) operation decrements the semaphore value. If it becomes negative, the calling process blocks."
                    },
                    {
                        "type": "mcq",
                        "question": "Which of the following is NOT a requirement for solving the Critical Section Problem?",
                        "options": ["Mutual Exclusion", "Progress", "Bounded Waiting", "Preemption"],
                        "correctAnswer": "Preemption",
                        "explanation": "The three requirements are Mutual Exclusion, Progress, and Bounded Waiting. Preemption is a scheduling attribute, not a critical section solution requirement."
                    },
                    {
                        "type": "mcq",
                        "question": "What is a race condition?",
                        "options": ["A hardware loop failure", "Multiple threads writing to shared data concurrently with output depending on execution order", "CPU scheduling speed race", "A deadlock state"],
                        "correctAnswer": "Multiple threads writing to shared data concurrently with output depending on execution order",
                        "explanation": "Race conditions happen when concurrent threads read and write shared state without synchronization, yielding unpredictable outcomes."
                    }
                ]
            }
        }
    }
    
    # Select fallback matching topic, default to general fallback
    topic_key = "operating_systems" if weakest_topic == "operating_systems" else "databases"
    res = mock_packs[topic_key]
    res["chartData"] = chart_data
    return jsonify(res)

@app.route("/api/generate-study-plan", methods=["POST"])
def api_generate_study_plan():
    data = request.json or {}
    subjects = data.get("subjects", [])
    exam_date_str = data.get("examDate", "")
    hours_per_day = data.get("hoursPerDay", 2)
    
    if not subjects:
        return jsonify({"error": "No subjects provided"}), 400
        
    # Parse days left
    days_left = 7
    if exam_date_str:
        try:
            exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d")
            delta = exam_date - datetime.now()
            days_left = max(1, delta.days)
        except Exception:
            pass
            
    if is_gemini_active:
        prompt = f"""
        Create a personalized study schedule for a student.
        Subjects to study: {', '.join(subjects)}
        Days until exam: {days_left} days
        Available study hours per day: {hours_per_day} hours
        
        Generate a detailed study schedule in JSON format. The output must match this strict schema:
        {{
            "priorityRecommendations": [
                "Focus recommendation 1",
                "Focus recommendation 2"
            ],
            "schedule": [
                {{
                    "day": 1,
                    "focus": "Topic/Subject to study",
                    "tasks": ["Read Summary", "Complete MCQ Quiz"],
                    "hours": 2
                }},
                {{
                    "day": 2,
                    "focus": "Topic/Subject to study",
                    "tasks": ["Generate Flashcards", "Ask Tutor Questions"],
                    "hours": 2
                }}
            ]
        }}
        
        Limit schedule array length to the number of days left (max 7 days for the schedule overview, or group days if days_left > 7).
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for study plan: {e}")
                
    # Fallback Mock Study Plan
    plan = {
        "priorityRecommendations": [
            f"Allocate 60% of your time to {subjects[0]} since it forms the core framework.",
            "Complete quizzes daily to flag memory retention gaps.",
            "Take mock exam sets 48 hours before the actual test date."
        ],
        "schedule": []
    }
    
    tasks_pool = [
        ["Read Study Kit Summary", "Highlight Key Definitions", "Do Flashcard review"],
        ["Attempt MCQs in Quiz Tab", "Review Incorrect Answers", "Ask AI Tutor to explain weak spots"],
        ["Review formulas and calculations", "Attempt Short Answer Quiz", "Complete a mock revision sheet"],
        ["Do Night Before Exam checklist", "Rest and sleep well"]
    ]
    
    for i in range(1, min(days_left + 1, 8)):
        subject = subjects[(i - 1) % len(subjects)]
        tasks = tasks_pool[0]
        if i == days_left:
            tasks = tasks_pool[3]
        elif i % 2 == 0:
            tasks = tasks_pool[1]
        elif i % 3 == 0:
            tasks = tasks_pool[2]
            
        plan["schedule"].append({
            "day": i,
            "focus": f"{subject} Deep Dive",
            "tasks": tasks,
            "hours": hours_per_day
        })
        
    return jsonify(plan)

@app.route("/api/night-before-exam", methods=["POST"])
def api_night_before_exam():
    data = request.json or {}
    text = data.get("text", "")
    time_left = data.get("timeLeft", "4 hours")
    
    topic = detect_topic(text)
    
    if is_gemini_active:
        prompt = f"""
        The student has an exam tomorrow and has only {time_left} left to study!
        Using the study material context below, generate a high-yield 'Night Before Exam Mode' study sheet in JSON format.
        
        Return the result matching this strict JSON schema:
        {{
            "must_study": [
                "Topic 1: 1-sentence critical note.",
                "Topic 2: 1-sentence critical note."
            ],
            "can_skip": [
                "Concept 1: Why it is safe to skip for a cram session.",
                "Concept 2: Why it is safe to skip."
            ],
            "likely_areas": [
                "Frequently tested area 1.",
                "Frequently tested area 2."
            ],
            "checklist": [
                "Definition to memorize.",
                "Key formula or rule to remember."
            ]
        }}
        
        Study Material:
        {text[:8000]}
        """
        response_text = generate_with_gemini(prompt, response_schema=True)
        if response_text:
            try:
                clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                return jsonify(json.loads(clean_json.strip()))
            except Exception as e:
                print(f"Failed to parse Gemini JSON for night before exam: {e}")
                
    # Fallback Mock response
    return jsonify(get_topic_mock_data(topic)["night_before"])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Run server locally on 0.0.0.0 to enable network/device testing if needed
    app.run(host="0.0.0.0", port=port, debug=True)
