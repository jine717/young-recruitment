# 🧪 E2E Testing Guide for TestSprite

## Young Capital AI-Powered Recruitment Platform

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Environment Setup](#environment-setup)
3. [Known Limitations](#known-limitations)
4. [Test Suites](#test-suites)
   - [Suite 1: Public Navigation](#suite-1-public-navigation)
   - [Suite 2: Candidate Application Flow](#suite-2-candidate-application-flow)
   - [Suite 3: Recruiter Authentication](#suite-3-recruiter-authentication)
   - [Suite 4: Recruiter Dashboard](#suite-4-recruiter-dashboard)
   - [Suite 5: BCQ Portal](#suite-5-bcq-portal)
   - [Suite 6: Admin Panel](#suite-6-admin-panel)
5. [Test Data Setup](#test-data-setup)
6. [CSS Selectors Reference](#css-selectors-reference)
7. [Complete E2E Flows](#complete-e2e-flows)
8. [Special Considerations](#special-considerations)

---

## Introduction

This document provides comprehensive E2E testing instructions for the Young Capital AI-Powered Recruitment Platform. The testing suite is designed for TestSprite or similar E2E testing tools.

### Application Overview

| Aspect | Details |
|--------|---------|
| **Application Type** | React SPA with Supabase Backend |
| **Base URL (Production)** | `https://jhakdiqttnvwczyzoffu.lovableproject.com` |
| **Base URL (Local)** | `http://localhost:5173` |
| **Framework** | React 18 + Vite + TypeScript |
| **UI Library** | Tailwind CSS + Shadcn/UI |
| **Auth System** | Supabase Auth (Email/Password) |

### User Roles

| Role | Access Level |
|------|--------------|
| **Candidate** | Public pages + BCQ portal (token-based) |
| **Recruiter** | Dashboard + Candidates + Job management |
| **Admin** | Full system access + User management |
| **Management** | Analytics + Reports |

---

## Environment Setup

### Prerequisites

```bash
# Ensure the application is running
npm run dev

# Base URL for testing
BASE_URL=http://localhost:5173
```

### Test User Credentials

> ⚠️ **IMPORTANT**: Create these test users in the system before running authenticated tests.

```javascript
const TEST_USERS = {
  recruiter: {
    email: "recruiter-test@youngcapital.com",
    password: "TestPassword123!",
    role: "recruiter"
  },
  admin: {
    email: "admin-test@youngcapital.com", 
    password: "TestPassword123!",
    role: "admin"
  }
};
```

### Browser Configuration

```javascript
const BROWSER_CONFIG = {
  viewport: { width: 1280, height: 720 },
  defaultTimeout: 10000,
  waitForNavigation: "networkidle",
  locale: "es-ES"
};
```

---

## Known Limitations

### 1. Authentication-Protected Routes
Most dashboard and admin routes require authentication. TestSprite must:
- First complete login flow
- Store session/cookies between tests
- Use authenticated context for protected routes

### 2. Token-Based BCQ Access
The BCQ portal uses unique tokens per candidate. To test:
- Use a pre-generated valid token from database
- OR mock the token validation endpoint

### 3. Dynamic Content
Many elements load asynchronously:
- Wait for loading spinners to disappear
- Wait for skeleton loaders to resolve
- Use explicit waits for API responses

### 4. Role-Based Visibility
UI elements vary by user role:
- Admin sidebar shows different options than Recruiter
- Some buttons only visible to specific roles

---

## Test Suites

---

### Suite 1: Public Navigation

**Prerequisites**: None (unauthenticated access)

#### TC-PUB-001: Landing Page Load

```gherkin
Feature: Landing Page
  Scenario: User visits the landing page
    Given I am on the home page "/"
    Then I should see the navigation bar
    And I should see the hero section
    And I should see the "Ver Vacantes" button
    And I should see the company logo
```

**Test Steps:**
1. Navigate to `/`
2. Wait for page load (no loading spinner)
3. Verify navigation bar is visible
4. Verify hero section contains expected text
5. Verify "Ver Vacantes" or similar CTA button exists

**Selectors:**
```javascript
const LANDING_SELECTORS = {
  navbar: 'nav, [role="navigation"]',
  logo: 'img[alt*="logo"], .logo, header img',
  ctaButton: 'a[href="/jobs"], button:has-text("Vacantes"), a:has-text("Jobs")',
  heroSection: 'section:first-of-type, .hero, main > div:first-child'
};
```

**Expected Results:**
- Page loads within 3 seconds
- All major sections visible
- No console errors

---

#### TC-PUB-002: Navigate to Jobs List

```gherkin
Feature: Jobs Navigation
  Scenario: User navigates to job listings
    Given I am on the home page
    When I click on "Jobs" or "Vacantes" link
    Then I should be redirected to "/jobs"
    And I should see a list of job cards
```

**Test Steps:**
1. Start at `/`
2. Click jobs navigation link
3. Wait for `/jobs` route
4. Verify job cards are displayed

**Selectors:**
```javascript
const JOBS_LIST_SELECTORS = {
  jobsLink: 'a[href="/jobs"], nav a:has-text("Jobs")',
  jobCard: '[class*="card"], .job-card, article',
  jobTitle: 'h2, h3, [class*="title"]',
  jobLocation: '[class*="location"], span:has-text("Location")',
  applyButton: 'a[href*="/apply"], button:has-text("Apply")'
};
```

---

#### TC-PUB-003: View Job Detail

```gherkin
Feature: Job Detail Page
  Scenario: User views a specific job posting
    Given I am on the jobs list page
    When I click on a job card
    Then I should see the job detail page
    And I should see job title, description, requirements
    And I should see an "Apply" button
```

**Test Steps:**
1. Navigate to `/jobs`
2. Wait for job cards to load
3. Click first job card
4. Verify URL matches `/jobs/:id` pattern
5. Verify job details are displayed

**Selectors:**
```javascript
const JOB_DETAIL_SELECTORS = {
  jobTitle: 'h1',
  jobDescription: '[class*="description"], .prose, main p',
  requirements: 'ul li, [class*="requirements"]',
  benefits: '[class*="benefits"]',
  applyButton: 'a[href*="/apply"], button:has-text("Apply"), button:has-text("Aplicar")',
  backButton: 'a[href="/jobs"], button:has-text("Back")'
};
```

**Test Data - Known Job IDs:**
```javascript
// Query from database or use these if stable
const KNOWN_JOB_IDS = [
  "0e60f7eb-a636-4a62-b395-2ad tried-49d84fdef",
  // Add more stable job IDs here
];
```

---

#### TC-PUB-004: Pitch Deck Page

```gherkin
Feature: Pitch Deck
  Scenario: User views the company pitch deck
    Given I am on any page
    When I navigate to "/pitch-deck"
    Then I should see presentation slides
    And I should be able to navigate between slides
```

**Test Steps:**
1. Navigate to `/pitch-deck`
2. Verify presentation content loads
3. Test slide navigation if available

**Selectors:**
```javascript
const PITCH_DECK_SELECTORS = {
  slideContainer: '.slide, [class*="presentation"]',
  navigationArrows: 'button[aria-label*="next"], button[aria-label*="prev"]',
  slideIndicator: '[class*="indicator"], .dots'
};
```

---

### Suite 2: Candidate Application Flow

**Prerequisites**: None (public access)

#### TC-APP-001: Application Form Access

```gherkin
Feature: Application Form
  Scenario: Candidate accesses application form
    Given I am on a job detail page "/jobs/:id"
    When I click the "Apply" button
    Then I should be redirected to "/apply/:id"
    And I should see the application form
```

**Test Steps:**
1. Navigate to a known job: `/jobs/{JOB_ID}`
2. Click apply button
3. Verify redirect to `/apply/{JOB_ID}`
4. Verify form fields are present

**Selectors:**
```javascript
const APPLICATION_FORM_SELECTORS = {
  form: 'form',
  nameInput: 'input[name="name"], input[placeholder*="nombre"], #candidate-name',
  emailInput: 'input[type="email"], input[name="email"]',
  cvUpload: 'input[type="file"][accept*="pdf"], input[name="cv"]',
  discUpload: 'input[type="file"][name="disc"], input[accept*="pdf"]:nth-of-type(2)',
  submitButton: 'button[type="submit"], button:has-text("Submit"), button:has-text("Enviar")',
  successMessage: '[class*="success"], [class*="toast"], [role="alert"]'
};
```

---

#### TC-APP-002: Form Validation

```gherkin
Feature: Application Form Validation
  Scenario: Form shows validation errors for empty required fields
    Given I am on the application form
    When I click submit without filling required fields
    Then I should see validation error messages
```

**Test Steps:**
1. Navigate to `/apply/{JOB_ID}`
2. Click submit button immediately
3. Verify error messages appear
4. Verify form is not submitted

**Validation Rules:**
```javascript
const VALIDATION_RULES = {
  name: { required: true, minLength: 2 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  cv: { required: true, accept: ".pdf,.doc,.docx" }
};
```

---

#### TC-APP-003: Email Validation

```gherkin
Feature: Email Validation
  Scenario: Invalid email format shows error
    Given I am on the application form
    When I enter an invalid email "notanemail"
    And I click outside the email field
    Then I should see an email validation error
```

**Test Steps:**
1. Navigate to `/apply/{JOB_ID}`
2. Enter invalid email
3. Blur email field
4. Verify error message

**Test Data:**
```javascript
const EMAIL_TEST_CASES = [
  { input: "notanemail", valid: false },
  { input: "test@", valid: false },
  { input: "@domain.com", valid: false },
  { input: "valid@email.com", valid: true }
];
```

---

#### TC-APP-004: File Upload - CV

```gherkin
Feature: CV Upload
  Scenario: Candidate uploads CV file
    Given I am on the application form
    When I upload a PDF file as CV
    Then I should see the filename displayed
    And the upload indicator should show success
```

**Test Steps:**
1. Navigate to `/apply/{JOB_ID}`
2. Upload test PDF file
3. Verify filename appears
4. Verify no error messages

**Test Files:**
```javascript
const TEST_FILES = {
  validCV: {
    path: "./test-files/sample-cv.pdf",
    name: "sample-cv.pdf",
    type: "application/pdf",
    size: 102400 // 100KB
  },
  invalidFile: {
    path: "./test-files/image.png",
    name: "image.png",
    type: "image/png"
  }
};
```

---

#### TC-APP-005: Successful Application Submission

```gherkin
Feature: Application Submission
  Scenario: Candidate submits complete application
    Given I am on the application form
    And I have filled all required fields correctly
    When I click the submit button
    Then I should see a success message
    And I should see confirmation of my application
```

**Test Steps:**
1. Navigate to `/apply/{JOB_ID}`
2. Fill name: "Test Candidate"
3. Fill email: "test-candidate-{timestamp}@test.com"
4. Upload CV file
5. Click submit
6. Wait for success toast/message
7. Verify confirmation screen

**Selectors:**
```javascript
const SUBMISSION_SELECTORS = {
  successToast: '[class*="toast"], .sonner-toast, [role="status"]',
  confirmationScreen: '[class*="success"], [class*="confirmation"]',
  applicationId: '[class*="reference"], [class*="id"]'
};
```

---

### Suite 3: Recruiter Authentication

**Prerequisites**: Test recruiter user must exist in system

#### TC-AUTH-001: Login Page Access

```gherkin
Feature: Login Page
  Scenario: User accesses login page
    Given I navigate to "/auth"
    Then I should see the login form
    And I should see email and password fields
    And I should see a login button
```

**Test Steps:**
1. Navigate to `/auth`
2. Verify login form is visible
3. Verify email input exists
4. Verify password input exists
5. Verify submit button exists

**Selectors:**
```javascript
const AUTH_SELECTORS = {
  loginForm: 'form',
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  loginButton: 'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
  signupLink: 'a:has-text("Sign up"), button:has-text("Register")',
  errorMessage: '[class*="error"], [class*="alert-destructive"], [role="alert"]',
  forgotPasswordLink: 'a:has-text("Forgot"), a:has-text("forgot")'
};
```

---

#### TC-AUTH-002: Successful Login

```gherkin
Feature: Recruiter Login
  Scenario: Recruiter logs in with valid credentials
    Given I am on the login page
    When I enter valid recruiter email and password
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see the recruiter dashboard
```

**Test Steps:**
1. Navigate to `/auth`
2. Enter email: `recruiter-test@youngcapital.com`
3. Enter password: `TestPassword123!`
4. Click login button
5. Wait for navigation
6. Verify URL is `/dashboard`
7. Verify dashboard elements are visible

**Verification:**
```javascript
const DASHBOARD_VERIFICATION = {
  expectedUrl: '/dashboard',
  requiredElements: [
    'sidebar, nav[class*="sidebar"]',
    '[class*="stats"], [class*="card"]',
    'table, [class*="table"]'
  ]
};
```

---

#### TC-AUTH-003: Invalid Credentials

```gherkin
Feature: Login Error Handling
  Scenario: User enters invalid credentials
    Given I am on the login page
    When I enter invalid email or password
    And I click the login button
    Then I should see an error message
    And I should remain on the login page
```

**Test Steps:**
1. Navigate to `/auth`
2. Enter email: `wrong@email.com`
3. Enter password: `wrongpassword`
4. Click login
5. Wait for error message
6. Verify still on `/auth`

**Expected Error Messages:**
```javascript
const ERROR_MESSAGES = [
  "Invalid login credentials",
  "Email not confirmed",
  "Invalid email or password",
  "Credenciales inválidas"
];
```

---

#### TC-AUTH-004: Session Persistence

```gherkin
Feature: Session Persistence
  Scenario: User session persists after page refresh
    Given I am logged in as a recruiter
    When I refresh the page
    Then I should still be logged in
    And I should still see the dashboard
```

**Test Steps:**
1. Complete login flow
2. Store current URL
3. Refresh page
4. Verify not redirected to `/auth`
5. Verify dashboard still accessible

---

#### TC-AUTH-005: Logout

```gherkin
Feature: Logout
  Scenario: User logs out successfully
    Given I am logged in
    When I click the logout button
    Then I should be logged out
    And I should be redirected to the home page or login page
```

**Test Steps:**
1. Be logged in
2. Find and click logout button (usually in navbar dropdown or sidebar)
3. Verify redirect to `/` or `/auth`
4. Verify cannot access `/dashboard` without logging in again

**Selectors:**
```javascript
const LOGOUT_SELECTORS = {
  userMenu: '[class*="avatar"], [class*="user-menu"], button[class*="dropdown"]',
  logoutButton: 'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Cerrar")'
};
```

---

### Suite 4: Recruiter Dashboard

**Prerequisites**: Logged in as Recruiter

#### TC-DASH-001: Dashboard Access

```gherkin
Feature: Dashboard Access
  Scenario: Logged in recruiter sees dashboard
    Given I am logged in as a recruiter
    When I navigate to "/dashboard"
    Then I should see the recruiter dashboard
    And I should see statistics cards
    And I should see candidate table
```

**Test Steps:**
1. Login as recruiter
2. Navigate to `/dashboard`
3. Verify stats cards visible
4. Verify candidates table visible
5. Verify sidebar navigation visible

**Selectors:**
```javascript
const DASHBOARD_SELECTORS = {
  sidebar: '[class*="sidebar"], nav[class*="side"]',
  statsCards: '[class*="stats-card"], [class*="card"]:has([class*="stat"])',
  candidatesTable: 'table, [class*="table"]',
  tableRows: 'tbody tr, [class*="table-row"]',
  filterDropdown: 'select, [class*="filter"], button[class*="dropdown"]',
  searchInput: 'input[type="search"], input[placeholder*="search"], input[placeholder*="buscar"]'
};
```

---

#### TC-DASH-002: Statistics Display

```gherkin
Feature: Dashboard Statistics
  Scenario: Statistics are displayed correctly
    Given I am on the recruiter dashboard
    Then I should see total applications count
    And I should see pending reviews count
    And I should see interviews scheduled count
```

**Test Steps:**
1. Navigate to `/dashboard`
2. Wait for stats to load (no skeleton loaders)
3. Verify each stat card shows a number
4. Verify stat labels are visible

**Selectors:**
```javascript
const STATS_SELECTORS = {
  totalApplications: '[class*="stat"]:has-text("Total"), [class*="card"]:first-child',
  pendingReviews: '[class*="stat"]:has-text("Pending"), [class*="card"]:nth-child(2)',
  interviews: '[class*="stat"]:has-text("Interview"), [class*="card"]:nth-child(3)',
  statValue: '[class*="value"], h2, h3, .text-2xl, .text-3xl'
};
```

---

#### TC-DASH-003: Candidates Table

```gherkin
Feature: Candidates Table
  Scenario: Candidates table displays data
    Given I am on the recruiter dashboard
    When the data loads
    Then I should see a table with candidate information
    And each row should have name, email, job, status columns
```

**Test Steps:**
1. Navigate to `/dashboard`
2. Wait for table to load
3. Verify table headers exist
4. Verify at least one row exists (if data available)
5. Verify row contains expected columns

**Expected Columns:**
```javascript
const TABLE_COLUMNS = [
  { header: "Candidate", dataKey: "candidate_name" },
  { header: "Email", dataKey: "candidate_email" },
  { header: "Job", dataKey: "job_title" },
  { header: "Status", dataKey: "status" },
  { header: "AI Score", dataKey: "ai_score" },
  { header: "Actions", dataKey: "actions" }
];
```

---

#### TC-DASH-004: Filter by Status

```gherkin
Feature: Status Filter
  Scenario: Filter candidates by status
    Given I am on the recruiter dashboard
    When I select "Under Review" from the status filter
    Then only candidates with "Under Review" status should be displayed
```

**Test Steps:**
1. Navigate to `/dashboard`
2. Count total visible rows
3. Click status filter dropdown
4. Select "Under Review"
5. Wait for table refresh
6. Verify all visible rows have "Under Review" badge

**Status Values:**
```javascript
const APPLICATION_STATUSES = [
  "pending",
  "under_review", 
  "bcq_sent",
  "bcq_received",
  "pre_interview",
  "interview",
  "interviewed",
  "evaluated",
  "reviewed",
  "hired",
  "rejected"
];
```

---

#### TC-DASH-005: Navigate to Candidate Profile

```gherkin
Feature: Candidate Profile Navigation
  Scenario: Recruiter views candidate profile
    Given I am on the recruiter dashboard
    When I click on a candidate row or view button
    Then I should be navigated to the candidate profile page
    And I should see detailed candidate information
```

**Test Steps:**
1. Navigate to `/dashboard`
2. Click on first candidate row (or view button)
3. Verify URL changes to `/candidate/{id}` or `/applications/{id}`
4. Verify candidate details are displayed

**Selectors:**
```javascript
const CANDIDATE_PROFILE_SELECTORS = {
  candidateName: 'h1, [class*="header"] h1',
  statusBadge: '[class*="badge"], [class*="status"]',
  tabNavigation: '[role="tablist"], [class*="tabs"]',
  overviewTab: 'button:has-text("Overview"), [role="tab"]:first-child',
  bcqTab: 'button:has-text("BCQ"), [role="tab"]:has-text("Case")',
  interviewTab: 'button:has-text("Interview")',
  documentsSection: '[class*="documents"]',
  aiEvaluation: '[class*="ai-evaluation"], [class*="score"]'
};
```

---

### Suite 5: BCQ Portal

**Prerequisites**: Valid BCQ access token

#### TC-BCQ-001: Invalid Token Access

```gherkin
Feature: BCQ Token Validation
  Scenario: Invalid token shows error
    Given I have an invalid BCQ token
    When I navigate to "/bcq/invalid-token-here"
    Then I should see an error message
    And I should not see the questionnaire
```

**Test Steps:**
1. Navigate to `/bcq/invalid-token-12345`
2. Wait for validation response
3. Verify error message is displayed
4. Verify no video recorder visible

**Selectors:**
```javascript
const BCQ_ERROR_SELECTORS = {
  errorContainer: '[class*="error"], [class*="alert"]',
  errorMessage: 'p:has-text("Invalid"), p:has-text("expired"), h2:has-text("Error")'
};
```

---

#### TC-BCQ-002: Valid Token Access

```gherkin
Feature: BCQ Portal Access
  Scenario: Valid token grants access
    Given I have a valid BCQ access token
    When I navigate to "/bcq/{valid-token}"
    Then I should see the candidate welcome message
    And I should see the first business case question
```

**Test Steps:**
1. Get valid token from database:
   ```sql
   SELECT bcq_access_token FROM applications 
   WHERE bcq_access_token IS NOT NULL 
   AND business_case_completed = false 
   LIMIT 1;
   ```
2. Navigate to `/bcq/{token}`
3. Verify welcome message visible
4. Verify question card visible
5. Verify video recorder component present

**Selectors:**
```javascript
const BCQ_PORTAL_SELECTORS = {
  welcomeMessage: 'h1, [class*="welcome"]',
  questionCard: '[class*="question-card"], [class*="card"]:has(h2)',
  questionTitle: 'h2, [class*="question-title"]',
  questionDescription: 'p, [class*="description"]',
  videoRecorder: 'video, [class*="video-recorder"], [class*="webcam"]',
  recordButton: 'button:has-text("Record"), button:has-text("Grabar")',
  progressBar: '[class*="progress"], progress',
  submitButton: 'button:has-text("Submit"), button:has-text("Enviar")'
};
```

---

#### TC-BCQ-003: Question Navigation

```gherkin
Feature: BCQ Navigation
  Scenario: Candidate navigates between questions
    Given I am in the BCQ portal with a valid token
    And I have submitted an answer to the first question
    When I click next
    Then I should see the second question
```

**Test Steps:**
1. Access BCQ with valid token
2. Complete first question (record/submit)
3. Click next button
4. Verify question number changes
5. Verify new question content displayed

---

#### TC-BCQ-004: Completion Screen

```gherkin
Feature: BCQ Completion
  Scenario: Candidate completes all questions
    Given I am in the BCQ portal
    And I have answered all questions
    When I submit the last answer
    Then I should see a completion/thank you screen
```

**Selectors:**
```javascript
const COMPLETION_SELECTORS = {
  completionScreen: '[class*="completion"], [class*="success"], [class*="thank"]',
  checkIcon: 'svg[class*="check"], [class*="icon-success"]',
  completionMessage: 'h1:has-text("Complete"), h1:has-text("Thank"), h2:has-text("Gracias")'
};
```

---

### Suite 6: Admin Panel

**Prerequisites**: Logged in as Admin

#### TC-ADMIN-001: Admin Dashboard Access

```gherkin
Feature: Admin Dashboard
  Scenario: Admin accesses admin dashboard
    Given I am logged in as an admin
    When I navigate to "/admin"
    Then I should see the admin dashboard
    And I should see admin-specific menu options
```

**Test Steps:**
1. Login with admin credentials
2. Navigate to `/admin`
3. Verify admin dashboard loads
4. Verify admin menu items visible

**Selectors:**
```javascript
const ADMIN_SELECTORS = {
  adminNav: '[class*="admin-nav"], nav:has(a[href*="admin"])',
  jobsManagement: 'a[href="/admin/jobs"], a:has-text("Jobs")',
  usersManagement: 'a[href="/admin/users"], a:has-text("Users")',
  departmentsLink: 'a[href="/admin/departments"]',
  analyticsLink: 'a[href="/admin/analytics"]'
};
```

---

#### TC-ADMIN-002: Jobs Management

```gherkin
Feature: Jobs Management
  Scenario: Admin views and manages jobs
    Given I am on the admin dashboard
    When I click on "Jobs" in the admin menu
    Then I should see the jobs list
    And I should see edit/delete options for each job
```

**Test Steps:**
1. Navigate to `/admin/jobs`
2. Verify jobs table is visible
3. Verify each row has edit button
4. Verify create new job button exists

**Selectors:**
```javascript
const JOBS_MANAGEMENT_SELECTORS = {
  createJobButton: 'button:has-text("Create"), button:has-text("New Job"), a[href*="new"]',
  jobsTable: 'table',
  editButton: 'button:has-text("Edit"), button[aria-label="Edit"]',
  deleteButton: 'button:has-text("Delete"), button[aria-label="Delete"]',
  statusToggle: '[class*="switch"], input[type="checkbox"]'
};
```

---

#### TC-ADMIN-003: User Management

```gherkin
Feature: User Management
  Scenario: Admin manages users
    Given I am on the admin dashboard
    When I click on "Users"
    Then I should see the users list
    And I should be able to view user roles
```

**Test Steps:**
1. Navigate to `/admin/users`
2. Verify users table visible
3. Verify role column exists
4. Verify user actions available

---

#### TC-ADMIN-004: Analytics Dashboard

```gherkin
Feature: Analytics Dashboard
  Scenario: Admin views analytics
    Given I am on the admin dashboard  
    When I click on "Analytics"
    Then I should see charts and metrics
```

**Test Steps:**
1. Navigate to `/admin/analytics`
2. Verify charts are rendered
3. Verify date range selector works
4. Verify data loads without errors

**Selectors:**
```javascript
const ANALYTICS_SELECTORS = {
  chartsContainer: '[class*="chart"], .recharts-wrapper',
  dateRangePicker: '[class*="date-picker"], button:has-text("Date")',
  exportButton: 'button:has-text("Export"), button:has-text("Download")'
};
```

---

## Test Data Setup

### Database Queries for Test Data

```sql
-- Get a list of active jobs for testing
SELECT id, title, status FROM jobs WHERE status = 'published' LIMIT 5;

-- Get valid BCQ tokens for testing
SELECT 
  a.id as application_id,
  a.bcq_access_token,
  a.candidate_name,
  j.title as job_title
FROM applications a
JOIN jobs j ON a.job_id = j.id
WHERE a.bcq_access_token IS NOT NULL 
AND a.business_case_completed = false
LIMIT 3;

-- Get recruiter user for testing
SELECT u.id, u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'recruiter'
LIMIT 1;

-- Get admin user for testing
SELECT u.id, u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
LIMIT 1;
```

### Test Data Constants

```javascript
const TEST_DATA = {
  // Replace these with actual values from your database
  jobs: {
    publishedJobId: "INSERT_JOB_ID_HERE",
    draftJobId: "INSERT_DRAFT_JOB_ID_HERE"
  },
  
  bcqTokens: {
    validToken: "INSERT_VALID_TOKEN_HERE",
    expiredToken: "INSERT_EXPIRED_TOKEN_HERE"
  },
  
  candidates: {
    existingCandidateId: "INSERT_APPLICATION_ID_HERE"
  },
  
  testApplication: {
    name: "TestSprite Automated Test",
    email: `testsprite-${Date.now()}@test.com`,
    phone: "+1234567890"
  }
};
```

---

## CSS Selectors Reference

### Global Selectors

```javascript
const GLOBAL_SELECTORS = {
  // Loading states
  spinner: '[class*="spinner"], [class*="loading"], .animate-spin',
  skeleton: '[class*="skeleton"]',
  
  // Notifications
  toast: '.sonner-toast, [class*="toast"], [role="status"]',
  alert: '[role="alert"], [class*="alert"]',
  
  // Forms
  input: 'input, textarea, select',
  submitButton: 'button[type="submit"]',
  formError: '[class*="error"], .text-destructive',
  
  // Navigation
  navbar: 'nav, [role="navigation"]',
  sidebar: '[class*="sidebar"], aside',
  breadcrumb: '[class*="breadcrumb"]',
  
  // Tables
  table: 'table, [class*="table"]',
  tableHeader: 'thead th, [class*="table-header"]',
  tableRow: 'tbody tr, [class*="table-row"]',
  pagination: '[class*="pagination"]',
  
  // Modals/Dialogs
  dialog: '[role="dialog"], [class*="dialog"], [class*="modal"]',
  dialogClose: 'button[class*="close"], button:has-text("Close"), button:has-text("Cancel")',
  
  // Cards
  card: '[class*="card"]',
  
  // Badges
  badge: '[class*="badge"]',
  
  // Buttons
  primaryButton: 'button[class*="primary"], button[class*="default"]',
  secondaryButton: 'button[class*="secondary"]',
  dangerButton: 'button[class*="destructive"], button[class*="danger"]'
};
```

### Page-Specific Data-TestId Recommendations

For more reliable testing, these `data-testid` attributes should be added:

```javascript
const RECOMMENDED_TEST_IDS = {
  // Landing page
  'landing-hero': 'Hero section',
  'landing-cta': 'Main call-to-action button',
  
  // Jobs
  'jobs-list': 'Jobs list container',
  'job-card': 'Individual job card',
  'job-apply-btn': 'Apply button',
  
  // Application form
  'apply-form': 'Application form',
  'apply-name': 'Name input',
  'apply-email': 'Email input',
  'apply-cv': 'CV upload',
  'apply-submit': 'Submit button',
  
  // Auth
  'auth-email': 'Email input',
  'auth-password': 'Password input',
  'auth-submit': 'Login/Submit button',
  
  // Dashboard
  'dashboard-stats': 'Stats cards container',
  'dashboard-table': 'Candidates table',
  'dashboard-filter': 'Status filter',
  
  // BCQ
  'bcq-question': 'Current question',
  'bcq-recorder': 'Video recorder',
  'bcq-submit': 'Submit answer button',
  'bcq-progress': 'Progress indicator'
};
```

---

## Complete E2E Flows

### Flow 1: Candidate Application Journey

```javascript
const CANDIDATE_FLOW = {
  name: "Complete Candidate Application",
  steps: [
    { action: "navigate", target: "/" },
    { action: "click", target: "a[href='/jobs']" },
    { action: "wait", target: "[class*='card']" },
    { action: "click", target: "[class*='card']:first-child" },
    { action: "wait", target: "h1" },
    { action: "click", target: "a[href*='/apply']" },
    { action: "fill", target: "input[name='name']", value: "Test Candidate" },
    { action: "fill", target: "input[type='email']", value: "test@example.com" },
    { action: "upload", target: "input[type='file']", file: "sample-cv.pdf" },
    { action: "click", target: "button[type='submit']" },
    { action: "wait", target: "[class*='success'], [class*='toast']" },
    { action: "assert", condition: "success message visible" }
  ]
};
```

### Flow 2: Recruiter Review Journey

```javascript
const RECRUITER_FLOW = {
  name: "Recruiter Candidate Review",
  precondition: "Logged in as recruiter",
  steps: [
    { action: "navigate", target: "/dashboard" },
    { action: "wait", target: "table" },
    { action: "click", target: "tbody tr:first-child" },
    { action: "wait", target: "[class*='candidate-profile']" },
    { action: "click", target: "button:has-text('BCQ')" },
    { action: "wait", target: "[class*='bcq-response']" },
    { action: "scroll", target: "bottom" },
    { action: "click", target: "button:has-text('Interview')" },
    { action: "wait", target: "[class*='interview']" },
    { action: "assert", condition: "interview section visible" }
  ]
};
```

### Flow 3: Admin Job Creation

```javascript
const ADMIN_JOB_FLOW = {
  name: "Admin Creates New Job",
  precondition: "Logged in as admin",
  steps: [
    { action: "navigate", target: "/admin/jobs" },
    { action: "click", target: "button:has-text('Create'), button:has-text('New')" },
    { action: "wait", target: "form" },
    { action: "fill", target: "input[name='title']", value: "Test Position" },
    { action: "fill", target: "textarea[name='description']", value: "Test job description" },
    { action: "select", target: "select[name='type']", value: "full-time" },
    { action: "fill", target: "input[name='location']", value: "Remote" },
    { action: "click", target: "button[type='submit']" },
    { action: "wait", target: "[class*='success']" },
    { action: "assert", condition: "redirected to jobs list" }
  ]
};
```

---

## Special Considerations

### 1. Handling Modals and Dialogs

```javascript
const MODAL_HANDLING = {
  waitForOpen: "wait for [role='dialog'] to be visible",
  closeModal: "click button[class*='close'] or press Escape",
  confirmDialog: "click button:has-text('Confirm') or button:has-text('Yes')",
  cancelDialog: "click button:has-text('Cancel') or button:has-text('No')"
};
```

### 2. Loading States

```javascript
const LOADING_STATES = {
  pageLoad: {
    wait: "until no [class*='spinner'] visible",
    timeout: 10000
  },
  tableLoad: {
    wait: "until no [class*='skeleton'] visible",
    timeout: 5000
  },
  formSubmit: {
    wait: "until button[type='submit'] is not disabled",
    timeout: 5000
  }
};
```

### 3. Toast Notifications

```javascript
const TOAST_HANDLING = {
  success: {
    selector: ".sonner-toast[data-type='success'], [class*='toast-success']",
    waitTime: 3000,
    autoClose: true
  },
  error: {
    selector: ".sonner-toast[data-type='error'], [class*='toast-error']",
    waitTime: 5000,
    autoClose: false
  }
};
```

### 4. Responsive Testing

```javascript
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  largeDesktop: { width: 1920, height: 1080 }
};
```

### 5. Authentication State Management

```javascript
const AUTH_STATES = {
  saveSession: "store cookies and localStorage after login",
  restoreSession: "restore cookies and localStorage before protected tests",
  clearSession: "clear all auth data before logout tests"
};
```

---

## Appendix: Test Report Template

```markdown
# E2E Test Report

**Date**: YYYY-MM-DD
**Environment**: Production / Staging / Local
**Browser**: Chrome / Firefox / Safari
**Version**: X.X.X

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed | XX |
| Failed | XX |
| Skipped | XX |

## Failed Tests

### Test Case ID: TC-XXX-XXX
- **Error**: Description of error
- **Screenshot**: [link]
- **Steps to Reproduce**: ...
- **Expected**: ...
- **Actual**: ...

## Notes

- Any environmental issues
- Flaky tests observed
- Recommendations
```

---

## Contact & Support

For questions about testing this application:
- Review the PRD.md for feature documentation
- Check the codebase structure in the project files
- Consult the team for test user credentials

---

*Last Updated: December 2024*
*Version: 1.0.0*
