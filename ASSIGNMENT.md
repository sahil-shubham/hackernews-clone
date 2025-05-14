Hi there,

Thank you again for your interest in joining our team\! As the next step in our interview process, we’d like you to complete a take-home assignment. Below you’ll find the problem statement, expectations, and submission guidelines.

## **📝 Problem Statement**

Build a **Hacker News clone**. You may choose to build either the **backend API**, the **frontend**, or both. Bonus points will be awarded if you complete both components.

* **Backend** should expose REST API endpoints.  
* **Frontend** should be built using React and may use full stack frameworks like React Router or Next.js. If you are only building the frontend, you can use the publicly available Hacker News API or fake the APIs.

**Core Features (for both Backend and Frontend)**:

1. **User Authentication**  
   * Sign up, log in, and log out  
   * Secure password storage (e.g., hashing)  
2. **Post Feed**  
   * Paginated or infinite-scroll post list  
   * Display title, URL/text, author, points, and comment count  
   * Up/down vote functionality  
3. **Submission**  
   * Authenticated users can submit new posts (URL or text-based)  
4. **Comments**  
   * Threaded comments  
   * Users manage their own comments (add, edit, delete)  
5. **Sorting & Search**  
   * Sort by "new," "top," and "best"  
   * Basic search functionality  
6. **Bonus Points (optional)**  
   * If you do both frontend and backend  
   * Notifications  
   * Rate limiting or spam protection  
   * Dockerization and CI/CD  
   * Mobile-responsive UI

## 

## **📂 What We Expect**

### **1\. GitHub Repository**

* Public repo  
* Clear `README.md` covering:  
  * Setup instructions  
  * Environment variables/dependencies  
  * AI tools used (e.g., GitHub Copilot, ChatGPT, Cursor, Windsurf)  
  * Explanation of how AI assisted your development  
* Clear API Documentation in an API.md file *(Required only if building backend)*

API Documentation Example:

```
GET /posts
Request params:
- page: integer (optional, default: 1)
- sort: string (optional, options: 'new', 'top', 'best')

Response:
{
  posts: [{
    id: integer,
    title: string,
    url: string | null,
    text: string | null,
    author: string,
    points: integer,
    comments_count: integer
  }],
  page: integer,
  total_pages: integer
}
```

### 

### **2\. Technology Stack**

* **Backend**: Python / Node.js / Go  
* **Frontend**: React \+ Tailwind CSS (any framework allowed)  
* **Database**: PostgreSQL / MongoDB

### **3\. Code Quality**

* Maintainable, well-commented code

## 

## **💡 Encouragement to Leverage AI**

We strongly encourage using AI coding assistants such as GitHub Copilot, ChatGPT, Cursor, and Windsurf. Clearly mention the AI tools you used and describe how they helped you in your README.

