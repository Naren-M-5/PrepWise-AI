# 🚀 PrepWise AI

> **"Transform lecture notes into personalized exam success."**

PrepWise AI is a web application designed to help students study more efficiently. When preparing for exams, a lot of time is often wasted on organizing materials—summarizing slides, writing out flashcards, compiling formulas, and searching for practice questions. By the time the study guides are ready, you are already exhausted.

PrepWise AI automates this preparation phase. By parsing lecture notes PDFs, the app instantly compiles interactive summaries, multi-length revision sheets, active-recall flashcards, practice tests, and structured calendars, letting students spend less time on preparation and more time on actual studying.

---

## 💡 Why I Built This

As a student, I noticed a repeating pattern before every exam: my classmates and I spent hours copy-pasting slide contents into Google Docs, writing physical flashcards, and searching online for mock questions. It was repetitive, time-consuming, and took away energy that should have been used for actual learning.

I built PrepWise AI to remove that initial friction. I wanted an application that could take a raw lecture presentation or a textbook chapter and instantly turn it into structured, interactive study aids. By automating the summaries and quizzes, students can dive straight into active learning methods like active recall and self-testing on day one.

---

## 🛠️ Features

*   **📄 PDF Notes Upload**: Parses raw text from multi-page PDFs using a robust Python-based extraction pipeline.
*   **📝 Smart Summaries**: Extracts core definitions, key concepts, and formulas into a single, clean overview page.
*   **⚡ Revision Modes**: Adapts study notes to three different lengths—a 2-minute overview, standard revision notes, or a high-yield exam-night sheet.
*   **🃏 Flashcards**: Generates Q&A flashcards with interactive 3D flipping animations for active recall.
*   **❓ Interactive Quizzes**: Compiles mock exams consisting of MCQs, True/False, and short-answer questions, giving immediate explanation feedback.
*   **🧠 AI Tutor**: An interactive copilot that answers questions about the notes, supporting specialized styles like simplified explanations (ELI10) or a conversational Tamil-English (Tanglish) code-switch.
*   **📊 Learning Insights**: Logs quiz scores to visualize performance trends and generates a custom "Mini Revision Pack" targeting weak subject areas.
*   **📅 Study Planner**: Maps out a daily study calendar based on your available hours and target exam date.
*   **🎯 Night Before Exam Mode**: An emergency preparation mode that filters and structures topics by priority when time is short.

---

## 🎯 A Feature I'm Proud Of

### Night Before Exam Mode
We have all found ourselves in a situation where an exam is tomorrow morning and we only have a few hours left to prepare. Trying to cram a semester's worth of slides in one night is overwhelming.

To address this, I built the **Night Before Exam Mode**. When you enter your remaining time (e.g., "3 hours"), the backend analyzes the document and filters it into:
*   **Must Study**: The core concepts that are critical for passing.
*   **Can Skip**: Minor details, history, or secondary topics that are safe to ignore during a time crunch.
*   **Likely Exam Areas**: Frequently tested questions or calculations from the notes.
*   **Final Checklist**: Crucial formulas and warnings against common exam mistakes.

I wanted this feature to feel like getting a text message from a senior who took the exact same course last semester, telling you what actually matters and what you can safely ignore.

---

## 💻 Tech Stack

| Technology | Purpose | Reason for Selection |
| :--- | :--- | :--- |
| **React** | Frontend UI | Component-based rendering made it easy to build reusable tabs and interactive cards. |
| **TypeScript** | Static Type Safety | Eliminates runtime bugs by enforcing interface definitions for API payloads. |
| **Tailwind CSS** | Styling | Allowed me to quickly build a clean, responsive layout with support for dark mode. |
| **Flask** | Backend API | A lightweight, simple Python routing framework that integrates easily with document parsers. |
| **Python** | Data Extraction | The default choice for parsing PDF layouts, sanitizing text, and managing string operations. |
| **Gemini API** | Structured Generation | Provides fast, accurate summaries and outputs them in strict JSON matching the frontend layout. |
| **LocalStorage** | Persistence | Allows the app to run in a fully functional "Guest Mode" out of the box without database setup. |
| **Firebase** | Scaling (Optional) | Kept as an optional database layer if users want multi-device cloud syncing. |
| **pdfplumber** | PDF Parsing | Extracts text formatting and handles table layouts more reliably than other libraries. |

---

## 🧠 What I Learned

Building PrepWise AI taught me several practical lessons about software engineering and product decisions:

*   **Designing Graceful Fallbacks**: Third-party APIs can be unreliable due to rate limits, server timeouts, or regional blocks. I learned that you cannot let your app crash when an API fails. I built a local mock system. If the Gemini API is offline, the backend searches the text for keywords, detects the topic (e.g. database systems, operating systems, physics), and falls back to a high-quality local template so the user interface remains fully functional.
*   **Preventing Server Crashes**: Early in testing, the mock fallback crashed with a `KeyError` when notes triggered topics I hadn't explicitly handled in my mock database (like computer networks). I refactored the routes to use a safe getter helper that defaults unrecognized topics to a general CS layout, ensuring the backend never crashes.
*   **PDF Extraction Realities**: Parsing PDFs is messy. PDFs are designed for visual rendering, not data parsing, and text often comes out with garbled spacing and broken lines. I spent a lot of time testing different libraries and cleaning up extracted text before feeding it to the backend.
*   **Friction vs. Authenticating**: I originally planned to build a mandatory email login first. However, I realized that when students are stressed before an exam, they don't want to go through sign-up screens and email verifications. Storing sessions locally in `localStorage` made the app instantly usable, which was a better product decision.

---

## 🔮 Future Improvements

If I have more time to work on this, I want to add:
*   **OCR Support**: Integrate Tesseract or Google Vision to extract readable text from scanned images and handwritten notes.
*   **Spaced Repetition Scheduler**: Use a basic algorithm (like SM-2) to schedule flashcard reviews based on how difficult they were, helping with long-term retention.
*   **Collaborative Quiz Rooms**: Implement simple WebSockets so classmates can join the same room and attempt the study guides together.

---

## ⚙️ Running Locally

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure your environment:
    *   Create a `.env` file from the example:
        ```bash
        copy .env.example .env
        ```
    *   *(Optional)* Add your `GEMINI_API_KEY` from Google AI Studio. If left blank, the app will run using local mock files.
4.  Start the Flask server:
    ```bash
    python app.py
    ```
    *The backend runs at `http://localhost:5000`.*

### 2. Frontend Setup
1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *Open `http://localhost:5173` in your browser.*

---

## 👤 Author

**Naren**

Engineering student interested in exploring how AI can be applied to build practical products that solve everyday problems.

*   [GitHub](https://github.com/Naren-M-5)
*   [LinkedIn](https://linkedin.com/in/your-profile)
*   [Portfolio Website](https://your-portfolio.com)
