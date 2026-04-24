# BFHL Graph Processor 

Submission for the **SRM Full Stack Engineering Challenge (Round 1)** for Bajaj Finserv Health Limited. 

This project features a single-page frontend and a REST API designed to process hierarchical relationships, build tree structures, detect cyclic dependencies, and return structured insights from an array of node strings.

## 🚀 Live Links
* **Frontend Application:** [Insert your Vercel Frontend URL here]
* **API Base URL:** [Insert your Vercel API URL here]

## 🛠️ Tech Stack
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS
* **Hosting:** Vercel
* **Language:** JavaScript

## ✨ Features
* **Graph Traversal:** Accurately builds multiple independent trees from a list of edges.
* **Cycle Detection:** Identifies and flags pure cyclic dependencies within node groups.
* **Multi-Parent Resolution:** Silently handles diamond/multi-parent scenarios by favoring the first-encountered edge.
* **Interactive UI:** A modern, dark-themed interface with immediate visual feedback, structured data presentation, and error handling.
* **CORS Enabled:** API securely accepts cross-origin POST requests.

## 📡 API Reference

### `POST /api/bfhl`
Processes an array of node edges and returns structured tree and summary data.

**Request Body** (`application/json`)
\`\`\`json
{
  "data": ["A->B", "A->C", "B->D"]
}
\`\`\`

**Expected Response**
\`\`\`json
{
  "user_id": "suryajayeshsubha_29052005",
  "email_id": "sj6260@srmist.edu.in",
  "college_roll_number": "RA2311047010119",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
\`\`\`

## 💻 Running Locally

1. Clone the repository:
   \`\`\`bash
   git clone [Insert your GitHub Repo URL here]
   \`\`\`
2. Navigate into the directory:
   \`\`\`bash
   cd bfhl-challenge
   \`\`\`
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---
*Developed by Surya JS*
