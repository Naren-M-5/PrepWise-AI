# 🚀 Production Deployment Guide — PrepWise AI

This guide provides step-by-step instructions to deploy PrepWise AI to production using **Render** for the Flask backend API and **Vercel** for the React frontend client.

---

## 1. Backend Deployment (Render)

Render hosts the Flask backend application inside a secure Python container utilizing **Gunicorn** for production-grade request handling.

### Step-by-Step Instructions

1.  **Create a Render Account**: Sign up at [Render](https://render.com/).
2.  **Connect GitHub Repository**: Click **New +** on the dashboard, select **Web Service**, and link your GitHub account. Select your `PrepWise-AI` repository.
3.  **Configure Web Service Settings**:
    *   **Name**: `prepwise-ai-backend` (or a custom name).
    *   **Environment**: `Python` (Render auto-detects this).
    *   **Root Directory**: `backend` (CRITICAL: Tell Render to build inside the backend folder).
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
4.  **Add Environment Variables**: Under the **Advanced** section, add the following key-value pairs:
    *   `FLASK_ENV` = `production`
    *   `GEMINI_API_KEY` = `your_gemini_api_key` *(If omitted or invalid, the API will automatically fall back to local mock data).*
    *   `PORT` = `10000` *(Render binds to this port automatically).*
5.  **Health Check Endpoint**: Set the health check path to `/health` to allow Render's load balancer to monitor container start-ups.
6.  **Deploy**: Click **Create Web Service**. Wait for the container to build and deploy.
7.  **Get Live URL**: Once deployed, copy your service's public URL (e.g., `https://prepwise-ai-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Vercel hosts the React/Vite frontend client, building static assets and hosting them on their edge CDN.

### Step-by-Step Instructions

1.  **Create a Vercel Account**: Sign up at [Vercel](https://vercel.com/).
2.  **Import Project**: Click **Add New**, select **Project**, and import your `PrepWise-AI` repository.
3.  **Configure Build & Development Settings**:
    *   **Framework Preset**: `Vite` (Vercel auto-detects this).
    *   **Root Directory**: Click *Edit* and select the `frontend` folder (CRITICAL).
4.  **Set Environment Variables**: Expand the **Environment Variables** section and add:
    *   `VITE_API_BASE_URL` = `https://your-render-backend-url.onrender.com` *(Paste the URL copied from Render)*
    *   `VITE_USE_FIREBASE` = `false`
5.  **Deploy**: Click **Deploy**. Vercel will run `tsc -b && vite build` and serve the application.
6.  **Update backend CORS (Optional)**: If you implement strict CORS lists, configure your Render service environment variables to allow requests from your Vercel deployment URL (e.g., `https://prepwise-ai.vercel.app`).

---

## 📋 Deployment Verification Checklist

Verify that the following features function correctly post-deployment:

- [ ] **Health Endpoint**: Hitting `https://your-backend.onrender.com/health` returns `{"status": "ok"}`.
- [ ] **Vercel Live Access**: Open your live Vercel URL, confirming the dashboard displays correctly.
- [ ] **PDF Upload & Text Extraction**: Upload the relational database PDF (`sample.pdf`), confirming the steps show "Document Parsing: Success".
- [ ] **Study Kit Compilation**: Confirm that summaries, definitions, cheat sheets, flashcards, and practice quizzes generate and render successfully.
- [ ] **Interactive Quiz**: Solve the MCQs, verify the confetti animations trigger, and check that the Insights tab charts your score using Recharts.
- [ ] **AI Tutor Conversations**: Send a chat message, confirming that the AI Tutor responds (and adapts when selecting ELI10 or mixed Tamil-English styles).
- [ ] **Cram Mode**: Open *Night Before Exam Mode*, select your session, and confirm that the emergency cram sheet compiles successfully.

---

## 💡 Cost Estimations & Scalability

### Estimated Monthly Cost

| Service | Tier | Purpose | Cost |
|---|---|---|---|
| **Vercel** | Hobby Tier | Frontend Hosting & Build pipelines | **$0.00** |
| **Render** | Free Tier | Flask backend server API | **$0.00** |
| **Google AI Studio** | Free Tier | Gemini 1.5 Flash API queries | **$0.00** |
| **Total** | | | **$0.00 / month** |

### Free Tier Limitations & Workarounds
*   **Render Cold Starts**: Render puts free web services to sleep after 15 minutes of inactivity. When a new request arrives, Render spins up the container from scratch, which can take **up to 50 seconds**.
    *   *Our Solution*: We configured a client-side connection timeout of **45 seconds** using an `AbortController` in [api.ts](file:///C:/Users/Nithish/Desktop/study_buddy/frontend/src/services/api.ts). If the connection times out, the frontend alerts the user about the cold start and offers a **Retry** button so they do not lose their current context.
*   **LocalStorage Limits**: Browsers restrict LocalStorage to **5MB**.
    *   *Recommendation*: If users upload dozens of large PDFs, they may exceed this limit. For production scale, enable Firebase Firestore configuration by setting `VITE_USE_FIREBASE=true` in the frontend env settings.

### Production Scaling Recommendations
If this application goes viral or receives high concurrency:
1.  **Upgrade Render to Paid Web Service ($7/month)**: Eliminates cold starts, ensures 100% uptime, and doubles memory allocation (512MB RAM).
2.  **Enable Firebase Firestore**: Seamlessly transitions user study profiles, flashcards, and quiz score logs from browser LocalStorage to a cloud database, enabling multi-device syncing.
3.  **Upgrade to Gemini Pay-As-You-Go**: Increases rate limits (requests per minute) to support concurrent AI generation calls.
