import streamlit as st
import os
import sys
import json
import re
import tempfile
from datetime import datetime

# Ensure the backend directory is in the python path to reuse existing extraction and prompt logic
# Since this file is in src/, we go up one level to find the backend folder
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

# Load env variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env"))

# Import backend helper functions
try:
    import app as backend_app
except ImportError as e:
    st.error(f"Failed to import backend module: {e}")

# Set page configurations
st.set_page_config(
    page_title="PrepWise AI - Personalized Exam Success",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium CSS injection for beautiful dark mode styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    /* Global font override */
    html, body, [class*="css"], .stMarkdown {
        font-family: 'Outfit', sans-serif !important;
    }
    
    /* Custom main header gradient */
    .hero-title {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.8rem;
        text-align: center;
        margin-bottom: 0.2rem;
        padding-top: 1rem;
    }
    
    .hero-subtitle {
        text-align: center;
        color: #94a3b8;
        font-size: 1.1rem;
        margin-bottom: 2rem;
        font-weight: 300;
    }
    
    /* Styled Premium Cards */
    .premium-card {
        background: rgba(30, 41, 59, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .card-header {
        font-weight: 600;
        color: #f8fafc;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .card-body {
        color: #cbd5e1;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    /* Flashcard custom visualization */
    .flashcard-box {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #3b82f6;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        margin: 1rem 0;
    }
    
    .flashcard-front {
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
    }
    
    .flashcard-back {
        font-size: 1.1rem;
        color: #93c5fd;
        margin-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.15);
        padding-top: 1rem;
        width: 100%;
    }
    
    /* Highlight pill */
    .pill {
        display: inline-block;
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 9999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }
    
    .pill-red {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .pill-green {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .pill-yellow {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SESSION STATE INITS -----------------
if "extracted_text" not in st.session_state:
    st.session_state.extracted_text = ""
if "filename" not in st.session_state:
    st.session_state.filename = ""
if "topic" not in st.session_state:
    st.session_state.topic = ""
if "summary_data" not in st.session_state:
    st.session_state.summary_data = None
if "revision_data" not in st.session_state:
    st.session_state.revision_data = None
if "flashcards_data" not in st.session_state:
    st.session_state.flashcards_data = None
if "quiz_data" not in st.session_state:
    st.session_state.quiz_data = None
if "night_before_data" not in st.session_state:
    st.session_state.night_before_data = None
if "study_plan_data" not in st.session_state:
    st.session_state.study_plan_data = None
    
# Quiz states
if "quiz_answers" not in st.session_state:
    st.session_state.quiz_answers = {}
if "quiz_submitted" not in st.session_state:
    st.session_state.quiz_submitted = False
if "quiz_score" not in st.session_state:
    st.session_state.quiz_score = 0
    
# Flashcard states
if "flashcard_index" not in st.session_state:
    st.session_state.flashcard_index = 0
if "reveal_flashcard" not in st.session_state:
    st.session_state.reveal_flashcard = False
    
# Chat states
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

def reset_study_states():
    st.session_state.summary_data = None
    st.session_state.revision_data = None
    st.session_state.flashcards_data = None
    st.session_state.quiz_data = None
    st.session_state.night_before_data = None
    st.session_state.study_plan_data = None
    st.session_state.quiz_answers = {}
    st.session_state.quiz_submitted = False
    st.session_state.quiz_score = 0
    st.session_state.flashcard_index = 0
    st.session_state.reveal_flashcard = False
    st.session_state.chat_history = []

# ----------------- SIDEBAR CONFIGURATION -----------------
st.sidebar.markdown("""
<div style="text-align: center; margin-bottom: 1rem;">
    <h2 style="margin: 0; color: #a855f7;">🎓 PrepWise AI</h2>
    <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.2rem;">"Transform lecture notes into personalized exam success."</p>
</div>
<hr style="margin-top: 0; border-color: rgba(255,255,255,0.1);"/>
""", unsafe_allow_html=True)

# API Key Configurator
st.sidebar.subheader("🔑 API Configuration")
api_key_env = os.environ.get("GEMINI_API_KEY", "")

# Show masking for the existing env key
key_placeholder = ""
if api_key_env:
    key_placeholder = "••••••••••••••••••••••••"
    
user_api_key = st.sidebar.text_input(
    "Gemini API Key",
    type="password",
    placeholder=key_placeholder,
    help="Provided automatically via Space Secrets. Insert a custom key to override."
)

# Set Gemini configurations dynamically based on input or environment variables
active_api_key = user_api_key if user_api_key else api_key_env
if active_api_key:
    try:
        backend_app.genai.configure(api_key=active_api_key)
        backend_app.is_gemini_active = True
        st.sidebar.markdown('<div class="pill pill-green">● Gemini API Active</div>', unsafe_allow_html=True)
    except Exception as e:
        backend_app.is_gemini_active = False
        st.sidebar.markdown(f'<div class="pill pill-red">● API Error: {str(e)[:15]}...</div>', unsafe_allow_html=True)
else:
    backend_app.is_gemini_active = False
    st.sidebar.markdown('<div class="pill pill-yellow">● Fallback Mock Mode Active</div>', unsafe_allow_html=True)

st.sidebar.markdown("""
<div style="font-size: 0.8rem; color: #64748b; padding: 0.5rem; background: rgba(30,41,59,0.3); border-radius: 8px;">
    <strong>Mock Fallback topics supported:</strong> Databases, Operating Systems, Machine Learning, Computer Networks, Biology, Physics. Any other topics will serve the standard CS mock.
</div>
""", unsafe_allow_html=True)

# ----------------- CORE GENERATORS -----------------
def generate_summary(text):
    if st.session_state.summary_data is not None:
        return st.session_state.summary_data
        
    topic = backend_app.detect_topic(text)
    if backend_app.is_gemini_active:
        with st.spinner("Generating Study Kit Summary..."):
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
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.summary_data = json.loads(clean_json.strip())
                    return st.session_state.summary_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    # Fallback to mock
    st.session_state.summary_data = backend_app.get_topic_mock_data(topic)["summary"]
    return st.session_state.summary_data

def generate_revision(text):
    if st.session_state.revision_data is not None:
        return st.session_state.revision_data
        
    topic = backend_app.detect_topic(text)
    if backend_app.is_gemini_active:
        with st.spinner("Compiling Revision Notes..."):
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
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.revision_data = json.loads(clean_json.strip())
                    return st.session_state.revision_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    st.session_state.revision_data = backend_app.get_topic_mock_data(topic)["revision"]
    return st.session_state.revision_data

def generate_flashcards(text):
    if st.session_state.flashcards_data is not None:
        return st.session_state.flashcards_data
        
    topic = backend_app.detect_topic(text)
    if backend_app.is_gemini_active:
        with st.spinner("Creating Interactive Flashcards..."):
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
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.flashcards_data = json.loads(clean_json.strip())
                    return st.session_state.flashcards_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    st.session_state.flashcards_data = backend_app.get_topic_mock_data(topic)["flashcards"]
    return st.session_state.flashcards_data

def generate_quiz(text):
    if st.session_state.quiz_data is not None:
        return st.session_state.quiz_data
        
    topic = backend_app.detect_topic(text)
    if backend_app.is_gemini_active:
        with st.spinner("Building Interactive Quiz..."):
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
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.quiz_data = json.loads(clean_json.strip())
                    return st.session_state.quiz_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    st.session_state.quiz_data = backend_app.get_topic_mock_data(topic)["quiz"]
    return st.session_state.quiz_data

def generate_night_before(text, time_left="4 hours"):
    if st.session_state.night_before_data is not None:
        return st.session_state.night_before_data
        
    topic = backend_app.detect_topic(text)
    if backend_app.is_gemini_active:
        with st.spinner("Generating Night Before Exam Mode Cram Sheet..."):
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
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.night_before_data = json.loads(clean_json.strip())
                    return st.session_state.night_before_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    st.session_state.night_before_data = backend_app.get_topic_mock_data(topic)["night_before"]
    return st.session_state.night_before_data

def generate_study_plan(subjects, days_left=7, hours_per_day=2):
    if st.session_state.study_plan_data is not None:
        return st.session_state.study_plan_data
        
    if backend_app.is_gemini_active:
        with st.spinner("Structuring Custom Study Plan..."):
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
                    }}
                ]
            }}
            
            Limit schedule array length to the number of days left (max 7 days for the schedule overview, or group days if days_left > 7).
            """
            response_text = backend_app.generate_with_gemini(prompt, response_schema=True)
            if response_text:
                try:
                    clean_json = re.sub(r"^```json|```$", "", response_text.strip(), flags=re.MULTILINE)
                    st.session_state.study_plan_data = json.loads(clean_json.strip())
                    return st.session_state.study_plan_data
                except Exception as e:
                    st.warning(f"Error parsing AI response. Falling back to mock data. ({e})")
                    
    # Mock fallback
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
        tasks = tasks_pool[i % len(tasks_pool)]
        plan["schedule"].append({
            "day": i,
            "focus": f"{subject} Deep Dive",
            "tasks": tasks,
            "hours": hours_per_day
        })
    st.session_state.study_plan_data = plan
    return st.session_state.study_plan_data

# ----------------- MAIN LAYOUT -----------------
st.markdown('<div class="hero-title">PrepWise AI</div>', unsafe_allow_html=True)
st.markdown('<div class="hero-subtitle">Transform lecture notes into personalized exam success.</div>', unsafe_allow_html=True)

# Loading mock databases pdf automatically if requested
load_mock_sample = st.button("📂 Load Sample Database Notes (Quick Test)", help="Instantly test all features without uploading your own PDF.")
if load_mock_sample:
    try:
        sample_path = "sample.pdf"
        if not os.path.exists(sample_path):
            sample_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample.pdf")
            
        if os.path.exists(sample_path):
            st.session_state.extracted_text = backend_app.extract_pdf_text(sample_path)
            st.session_state.filename = "sample.pdf"
            st.session_state.topic = "databases"
            reset_study_states()
            st.toast("Loaded sample Relational Databases PDF!", icon="✅")
        else:
            # Fallback text if pdf not found
            st.session_state.extracted_text = "Database Management Systems (DBMS), focusing on relational database design, Normalization (1NF, 2NF, 3NF, BCNF), and SQL querying. ACID transactions."
            st.session_state.filename = "relational_databases_notes.txt"
            st.session_state.topic = "databases"
            reset_study_states()
            st.toast("Loaded database sample text!", icon="ℹ️")
    except Exception as e:
        st.error(f"Failed to load sample: {e}")

# Main File Uploader
uploaded_file = st.file_uploader("Upload your lecture notes (PDF format)", type=["pdf"])

if uploaded_file is not None:
    if st.session_state.filename != uploaded_file.name:
        reset_study_states()
        st.session_state.filename = uploaded_file.name
        
        # Save file to temp folder to run the backend extraction
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(uploaded_file.read())
            temp_path = temp_file.name
            
        try:
            with st.spinner("Extracting text from PDF..."):
                extracted_text = backend_app.extract_pdf_text(temp_path)
                st.session_state.extracted_text = extracted_text
                st.session_state.topic = backend_app.detect_topic(extracted_text)
                st.toast("PDF successfully parsed!", icon="🚀")
        except Exception as e:
            st.error(f"Error parsing PDF: {e}")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

# Show main interactive workspace if text is extracted
if st.session_state.extracted_text:
    st.markdown(f"""
    <div style="padding: 0.8rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <strong>File:</strong> <code>{st.session_state.filename}</code> | 
            <strong>Characters:</strong> <code>{len(st.session_state.extracted_text)}</code>
        </div>
        <div class="pill pill-green">
            Topic Detected: {st.session_state.topic.upper().replace('_', ' ')}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Pre-fetch generators so switching tabs is instant
    summary = generate_summary(st.session_state.extracted_text)
    revision = generate_revision(st.session_state.extracted_text)
    flashcards = generate_flashcards(st.session_state.extracted_text)
    quiz = generate_quiz(st.session_state.extracted_text)
    night_before = generate_night_before(st.session_state.extracted_text)
    
    # Main feature tabs
    tab_summary, tab_revision, tab_flashcards, tab_quiz, tab_night, tab_planner, tab_tutor = st.tabs([
        "📚 Study Summary", 
        "📝 Revision Notes", 
        "🎴 Flashcards", 
        "❓ Practice Quiz", 
        "⚡ Night Before Exam",
        "📅 Study Planner",
        "🤖 Ask AI Tutor"
    ])
    
    # ----------------- 1. STUDY SUMMARY TAB -----------------
    with tab_summary:
        st.subheader("📚 Study Kit Summary")
        
        # Display main summary paragraph
        st.markdown(f"""
        <div class="premium-card">
            <div class="card-header">📖 Overall Summary</div>
            <div class="card-body">{summary.get("summary", "")}</div>
        </div>
        """, unsafe_allow_html=True)
        
        col_concepts, col_defs_forms = st.columns([1, 1])
        
        with col_concepts:
            st.markdown('<div class="premium-card" style="height: 100%;">', unsafe_allow_html=True)
            st.markdown('<div class="card-header">💡 Key Concepts</div>', unsafe_allow_html=True)
            for concept in summary.get("key_concepts", []):
                st.markdown(f"- {concept}")
            st.markdown('</div>', unsafe_allow_html=True)
            
        with col_defs_forms:
            # Definitions
            st.markdown('<div class="premium-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-header">🔑 Terms & Definitions</div>', unsafe_allow_html=True)
            for d in summary.get("definitions", []):
                st.markdown(f"**{d.get('term')}**: {d.get('definition')}")
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Formulas (if any)
            formulas = summary.get("formulas", [])
            if formulas:
                st.markdown('<div class="premium-card">', unsafe_allow_html=True)
                st.markdown('<div class="card-header">📐 Formulas & Equations</div>', unsafe_allow_html=True)
                for f in formulas:
                    st.markdown(f"**{f.get('name')}**")
                    st.latex(f.get("formula"))
                    st.caption(f.get("description"))
                st.markdown('</div>', unsafe_allow_html=True)
                
    # ----------------- 2. REVISION NOTES TAB -----------------
    with tab_revision:
        st.subheader("📝 Revision Notes")
        
        rev_tabs = st.tabs(["⚡ 2-Min Quick Cram", "📖 10-Min Standard Guide", "🏆 High-Yield Exam Night"])
        
        with rev_tabs[0]:
            st.markdown(revision.get("quick", "No quick revision notes available."))
            
        with rev_tabs[1]:
            st.markdown(revision.get("standard", "No standard revision notes available."))
            
        with rev_tabs[2]:
            st.markdown(revision.get("exam_night", "No high-yield exam notes available."))
            
    # ----------------- 3. INTERACTIVE FLASHCARDS TAB -----------------
    with tab_flashcards:
        st.subheader("🎴 Clickable Study Flashcards")
        
        if flashcards:
            total_cards = len(flashcards)
            card_idx = st.session_state.flashcard_index
            
            # Boundary check
            if card_idx >= total_cards:
                card_idx = total_cards - 1
                st.session_state.flashcard_index = card_idx
                
            card = flashcards[card_idx]
            
            # Layout for navigation and card
            col_nav_left, col_card_body, col_nav_right = st.columns([1, 4, 1])
            
            with col_nav_left:
                st.write("")
                st.write("")
                st.write("")
                if st.button("⬅️ Prev", disabled=(card_idx == 0), use_container_width=True):
                    st.session_state.flashcard_index -= 1
                    st.session_state.reveal_flashcard = False
                    st.rerun()
                    
            with col_card_body:
                st.markdown(f"<div style='text-align:center; color:#64748b;'>Card {card_idx + 1} of {total_cards}</div>", unsafe_allow_html=True)
                
                if st.session_state.reveal_flashcard:
                    st.markdown(f"""
                    <div class="flashcard-box">
                        <div class="pill">Question</div>
                        <div class="flashcard-front">{card.get("front")}</div>
                        <div class="flashcard-back">{card.get("back")}</div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    if st.button("🔄 Hide Answer", use_container_width=True):
                        st.session_state.reveal_flashcard = False
                        st.rerun()
                else:
                    st.markdown(f"""
                    <div class="flashcard-box">
                        <div class="pill">Question</div>
                        <div class="flashcard-front">{card.get("front")}</div>
                        <div style="height:1.1rem; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.05);"></div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    if st.button("💡 Reveal Answer", use_container_width=True, type="primary"):
                        st.session_state.reveal_flashcard = True
                        st.rerun()
                        
            with col_nav_right:
                st.write("")
                st.write("")
                st.write("")
                if st.button("Next ➡️", disabled=(card_idx == total_cards - 1), use_container_width=True):
                    st.session_state.flashcard_index += 1
                    st.session_state.reveal_flashcard = False
                    st.rerun()
        else:
            st.info("No flashcards found for this document.")
            
    # ----------------- 4. PRACTICE QUIZ TAB -----------------
    with tab_quiz:
        st.subheader("❓ Practice Quiz & Feedback")
        
        if quiz:
            quiz_score_counter = 0
            
            for idx, q in enumerate(quiz):
                q_type = q.get("type", "mcq")
                question_text = q.get("question", "")
                options = q.get("options", [])
                correct_ans = q.get("correctAnswer", "")
                explanation = q.get("explanation", "")
                
                st.markdown(f"##### Q{idx + 1}. {question_text}")
                
                if q_type == "mcq":
                    stored_answer = st.session_state.quiz_answers.get(idx, None)
                    select_idx = None
                    if stored_answer is not None and stored_answer in options:
                        select_idx = options.index(stored_answer)
                        
                    user_select = st.radio(
                        f"Select your answer for Q{idx+1}", 
                        options, 
                        index=select_idx,
                        key=f"q_radio_{idx}", 
                        label_visibility="collapsed",
                        disabled=st.session_state.quiz_submitted
                    )
                    st.session_state.quiz_answers[idx] = user_select
                    
                elif q_type == "tf":
                    stored_answer = st.session_state.quiz_answers.get(idx, None)
                    select_idx = None
                    if stored_answer in ["True", "False"]:
                        select_idx = ["True", "False"].index(stored_answer)
                        
                    user_select = st.radio(
                        f"Select True or False for Q{idx+1}", 
                        ["True", "False"], 
                        index=select_idx,
                        key=f"q_radio_{idx}", 
                        label_visibility="collapsed",
                        disabled=st.session_state.quiz_submitted
                    )
                    st.session_state.quiz_answers[idx] = user_select
                    
                elif q_type == "short":
                    stored_answer = st.session_state.quiz_answers.get(idx, "")
                    user_select = st.text_input(
                        f"Type your answer for Q{idx+1}", 
                        value=stored_answer,
                        key=f"q_text_{idx}", 
                        label_visibility="collapsed",
                        disabled=st.session_state.quiz_submitted
                    )
                    st.session_state.quiz_answers[idx] = user_select.strip()
                
                if st.session_state.quiz_submitted:
                    user_ans = st.session_state.quiz_answers.get(idx, "")
                    is_correct = False
                    
                    if q_type in ["mcq", "tf"]:
                        is_correct = (user_ans == correct_ans)
                    else:
                        is_correct = (user_ans.lower() == correct_ans.lower())
                        
                    if is_correct:
                        st.markdown(f'<div class="pill pill-green">✓ Correct: Your Answer: {user_ans}</div>', unsafe_allow_html=True)
                        quiz_score_counter += 1
                    else:
                        st.markdown(f'<div class="pill pill-red">✗ Incorrect. Your Answer: {user_ans or "[None]"} | Correct: {correct_ans}</div>', unsafe_allow_html=True)
                        
                    st.markdown(f"""
                    <div style="font-size:0.85rem; color:#94a3b8; background:rgba(30,41,59,0.3); border-left:3px solid #3b82f6; padding:0.5rem 1rem; margin-top:0.4rem; margin-bottom:1rem; border-radius:0 8px 8px 0;">
                        <strong>Explanation:</strong> {explanation}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.write("")
                    
            st.session_state.quiz_score = quiz_score_counter
            st.write("---")
            if not st.session_state.quiz_submitted:
                if st.button("📤 Submit Quiz", type="primary", use_container_width=True):
                    st.session_state.quiz_submitted = True
                    st.rerun()
            else:
                pct = round((st.session_state.quiz_score / len(quiz)) * 100)
                st.markdown(f"""
                <div style="padding:1rem; border-radius:12px; text-align:center; background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16,185,129,0.3); margin-bottom:1rem;">
                    <h3 style="margin:0; color:#34d399;">Quiz Completed!</h3>
                    <p style="margin:0.5rem 0 0 0; font-size:1.2rem;">Score: <strong>{st.session_state.quiz_score} / {len(quiz)} ({pct}%)</strong></p>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button("🔄 Retake Quiz", use_container_width=True):
                    st.session_state.quiz_submitted = False
                    st.session_state.quiz_answers = {}
                    st.session_state.quiz_score = 0
                    st.rerun()
        else:
            st.info("No quiz questions found for this document.")
            
    # ----------------- 5. NIGHT BEFORE EXAM TAB -----------------
    with tab_night:
        st.subheader("⚡ Night Before Exam Cram Sheet")
        
        time_cram = st.select_slider(
            "Select how many hours you have left to study:",
            options=["1 hour", "2 hours", "4 hours", "8 hours", "12 hours"],
            value="4 hours"
        )
        
        if "cram_time_slider" not in st.session_state or st.session_state.cram_time_slider != time_cram:
            st.session_state.cram_time_slider = time_cram
            st.session_state.night_before_data = None
            st.rerun()
            
        col_left, col_right = st.columns([1, 1])
        
        with col_left:
            st.markdown('<div class="premium-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-header pill-red">🔥 MUST STUDY (High-Yield Core)</div>', unsafe_allow_html=True)
            for item in night_before.get("must_study", []):
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
            
            st.markdown('<div class="premium-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-header pill-yellow">🎯 Likely Exam Questions</div>', unsafe_allow_html=True)
            for item in night_before.get("likely_areas", []):
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
            
        with col_right:
            st.markdown('<div class="premium-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-header pill-green">✓ Quick Memory Checklist</div>', unsafe_allow_html=True)
            for item in night_before.get("checklist", []):
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
            
            st.markdown('<div class="premium-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-header" style="color: #64748b;">💤 CAN SKIP (Low-Yield Details)</div>', unsafe_allow_html=True)
            for item in night_before.get("can_skip", []):
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
            
    # ----------------- 6. STUDY PLANNER TAB -----------------
    with tab_planner:
        st.subheader("📅 Personalized Study Planner")
        
        with st.form("planner_config"):
            col_subj, col_days, col_hrs = st.columns([3, 1, 1])
            with col_subj:
                subject_input = st.text_input("Subjects to schedule (comma separated)", value=st.session_state.filename.replace(".pdf", ""))
            with col_days:
                days_left = st.number_input("Days to Exam", min_value=1, max_value=30, value=7)
            with col_hrs:
                hours_per_day = st.number_input("Hours/Day", min_value=1, max_value=12, value=2)
                
            submitted = st.form_submit_button("📅 Generate Study Plan")
            if submitted:
                st.session_state.study_plan_data = None
                
        subjects = [s.strip() for s in subject_input.split(",") if s.strip()]
        if not subjects:
            subjects = ["Exam Subject"]
            
        plan = generate_study_plan(subjects, days_left, hours_per_day)
        
        st.markdown('<div class="premium-card">', unsafe_allow_html=True)
        st.markdown('<div class="card-header">🧠 Strategy Recommendations</div>', unsafe_allow_html=True)
        for rec in plan.get("priorityRecommendations", []):
            st.markdown(f"- {rec}")
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown("##### 📅 Daily Study Schedule")
        for day in plan.get("schedule", []):
            with st.expander(f"Day {day.get('day')} - {day.get('focus')} ({day.get('hours')} hours)"):
                st.write("**Target study tasks:**")
                for task in day.get("tasks", []):
                    st.markdown(f"- [ ] {task}")
                    
    # ----------------- 7. AI TUTOR CHATBOT TAB -----------------
    with tab_tutor:
        st.subheader("🤖 Ask PrepWise AI Tutor")
        
        tutor_mode = st.selectbox(
            "Customize AI Explanation Mode:",
            options=["Normal", "Simple Language", "Explain Like I'm 10 (ELI10)", "Tanglish (Tamil + English)", "Exam Oriented Tips"],
            index=0
        )
        
        mode_mapping = {
            "Normal": "normal",
            "Simple Language": "simple",
            "Explain Like I'm 10 (ELI10)": "eli10",
            "Tanglish (Tamil + English)": "mixed_tamil",
            "Exam Oriented Tips": "exam_oriented"
        }
        active_mode = mode_mapping[tutor_mode]
        
        for msg in st.session_state.chat_history:
            role_icon = "👤" if msg["role"] == "user" else "🤖"
            with st.chat_message(msg["role"], avatar=role_icon):
                st.write(msg["content"])
                
        user_query = st.chat_input("Ask a question about your uploaded materials...")
        if user_query:
            st.session_state.chat_history.append({"role": "user", "content": user_query})
            with st.chat_message("user", avatar="👤"):
                st.write(user_query)
                
            with st.chat_message("assistant", avatar="🤖"):
                with st.spinner("AI Tutor is typing..."):
                    if backend_app.is_gemini_active:
                        system_instruction = "You are PrepWise AI Tutor, a friendly academic assistant. Help the student understand their materials."
                        context = st.session_state.extracted_text
                        if context:
                            system_instruction += f"\nUse the following student's study material as your source of truth: \n{context[:6000]}"
                            
                        if active_mode == "simple":
                            system_instruction += "\nStyle Instruction: Explain in simple terms, breaking down jargon."
                        elif active_mode == "eli10":
                            system_instruction += "\nStyle Instruction: Explain like I am 10 years old. Use simple analogies."
                        elif active_mode == "mixed_tamil":
                            system_instruction += "\nStyle Instruction: Answer in conversational Tanglish (mixed Tamil and English)."
                        elif active_mode == "exam_oriented":
                            system_instruction += "\nStyle Instruction: Focus strictly on exam strategies, scoring points, and typical pitfalls."
                            
                        try:
                            model = backend_app.genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
                            h_formatted = [
                                {"role": "user" if h["role"] == "user" else "model", "parts": [h["content"]]}
                                for h in st.session_state.chat_history[:-1] if h.get("content")
                            ]
                            chat = model.start_chat(history=h_formatted)
                            reply = chat.send_message(user_query).text
                        except Exception as e:
                            st.warning(f"Gemini generation error: {e}")
                            reply = None
                    else:
                        reply = None
                        
                    if not reply:
                        tutor_replies = {
                            "normal": "This is a great question. In the uploaded material, we learn that this concept is fundamental to the subject. Let me break down the details: it involves coordination between resources, following protocols, and ensuring consistency. For exams, remember that this prevents data errors and deadlocks.",
                            "simple": "Let me explain this simply: It is like a system of rules that makes sure everything happens in order. If two things try to change the same memory at the same time, this system steps in to say: 'Wait, one at a time!'",
                            "eli10": "Imagine you and your friend are sharing a box of crayons. If both of you grab the red crayon at the exact same time, you might break it! An Operating System is like a nice teacher who says: 'Timmy, you use the red crayon first, then Sarah gets a turn.' This keeps things happy and safe!",
                            "mixed_tamil": "In case check pannitingana, idhu romba simple dhaan. Database normalization-la schema redundancy-ah avoid panna tables-ah break panrom. Transitive dependency irundha 3NF clear aagathu, so inner tables core keys split panni, reference constraints foreign keys create panrom. Puriyudha, simple ah code write panni structure design panna easy-a score pannalaam!",
                            "exam_oriented": "EXAM PREP ALERT: This is a high-yield question. When asked about this on exams, make sure you write down the 3 core requirements. 1. Mutual exclusion must be maintained. 2. Progress must happen. 3. Bounded waiting must be guaranteed. You will lose points if you omit 'bounded waiting'!"
                        }
                        reply = tutor_replies.get(active_mode, tutor_replies["normal"])
                        
                    st.write(reply)
                    st.session_state.chat_history.append({"role": "assistant", "content": reply})
                    
else:
    st.markdown("""
    <div style="background: rgba(30, 41, 59, 0.5); border: 2px dashed rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 3rem; text-align: center; max-width: 800px; margin: 2rem auto;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🎓</div>
        <h2 style="color: #f8fafc; margin-bottom: 0.5rem; font-weight: 700;">Welcome to PrepWise AI</h2>
        <p style="color: #94a3b8; font-size: 1.1rem; line-height: 1.6; max-width: 600px; margin: 0 auto 1.5rem auto;">
            Get ready for your exams in seconds. Drag and drop your lecture notes (PDF) above, or load our preconfigured sample database notes below to unlock your automated study suite.
        </p>
        <div style="color: #a855f7; font-weight: 600; font-size: 0.95rem; margin-bottom: 1.5rem;">
            ⚡ Summaries | 📝 Revision Guides | 🎴 Flashcards | ❓ Stateful Quizzes | 🔥 Cram Mode
        </div>
    </div>
    """, unsafe_allow_html=True)
