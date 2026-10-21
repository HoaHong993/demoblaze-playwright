# DemoBlaze – QA Automation Challenge

End-to-end test automation framework for [DemoBlaze](https://www.demoblaze.com), built with **Playwright + TypeScript**.

It covers the **Login** and **Cart / Place Order** features with UI, API, regression and performance tests, runs on desktop and mobile browsers, and ships ready-to-use pipelines for **GitHub Actions**, **Jenkins** and **GitLab CI**.

| Deliverable | Location |
|---|---|
| Test case suite (Excel) | [`docs/DemoBlaze_Test_Cases.xlsx`](docs/DemoBlaze_Test_Cases.xlsx) |
| Automation framework & demo scripts | this repository |
| Documentation | this README |

---

## 1. Quick start

**Prerequisites:** Node.js 18+ (20 LTS recommended), Git.

```bash
git clone https://github.com/HoaHong993/demoblaze-playwright.git
cd demoblaze-playwright
npm install
npx playwright install --with-deps   # downloads Chromium, Firefox, WebKit
cp .env.example .env                 # optional, all values have defaults
```

Run the two demo scenarios required by the challenge (Chromium, headed so you can watch):

```bash
npx playwright test tests/ui/login.spec.ts tests/ui/place-order.spec.ts --project=chromium --headed
```

Open the HTML report:

```bash
npm run report
```

> No account is needed. Before the run, a fresh user is created through the DemoBlaze sign-up API (see [Test data strategy](#5-test-data-strategy)). To use your own account, set `TEST_USERNAME` and `TEST_PASSWORD` in `.env`.

---

## 2. Commands

| Command | What it runs |
|---|---|
| `npm test` | Everything: all projects |
| `npm run test:ui` | UI tests on Chromium, Firefox and WebKit |
| `npm run test:chromium` | UI tests on Chromium only |
| `npm run test:mobile` | `@smoke` UI tests on Pixel 7 and iPhone 14 emulation |
| `npm run test:api` | API tests only (no browser) |
| `npm run test:perf` | Performance budget tests |
| `npm run test:smoke` | Every test tagged `@smoke` |
| `npm run test:regression` | Every test tagged `@regression` |
| `npm run test:headed` | Chromium with a visible browser |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | TypeScript compile check |
| `npm run perf:k6` | Optional k6 load test (requires [k6](https://k6.io)) |

Useful Playwright options:

```bash
npx playwright test --grep "TC_ORDER_01"      # one test by ID
npx playwright test --project=firefox --debug  # step-by-step debugger
npx playwright test --ui                       # interactive UI mode
```

---

## 3. Project structure

```
demoblaze-playwright/
├── config/
│   └── environments.ts        # env selection + every configurable parameter (.env driven)
├── src/
│   ├── api/
│   │   └── DemoblazeApi.ts     # typed client for api.demoblaze.com (auth, catalog, cart)
│   ├── pages/                  # Page Object Model
│   │   ├── BasePage.ts         # shared navbar (incl. mobile hamburger menu)
│   │   ├── HomePage.ts
│   │   ├── LoginModal.ts
│   │   ├── SignUpModal.ts
│   │   ├── ProductPage.ts
│   │   ├── CartPage.ts
│   │   └── PlaceOrderModal.ts  # order form + purchase confirmation parser
│   ├── fixtures/
│   │   └── test-fixtures.ts    # injects page objects, API client, users, reusable flows
│   ├── data/
│   │   └── test-data.ts        # products, expected messages, order data
│   └── utils/                  # alert handling, price parsing, unique data, credentials
├── tests/
│   ├── global.setup.ts         # creates / verifies the shared test account
│   ├── ui/
│   │   ├── login.spec.ts
│   │   ├── cart.spec.ts
│   │   └── place-order.spec.ts # includes the full E2E demo (TC_ORDER_01)
│   ├── api/
│   │   ├── auth.api.spec.ts
│   │   └── cart.api.spec.ts
│   └── performance/
│       └── page-load.perf.spec.ts
├── perf/k6/load-test.js        # optional load test
├── docs/DemoBlaze_Test_Cases.xlsx
├── playwright.config.ts        # projects, browsers, reporters, retries, artifacts
├── .github/workflows/playwright.yml
├── Jenkinsfile
├── .gitlab-ci.yml
└── .env.example
```

---

## 4. Design rationale

### Layered, modular design

```
tests (what to verify)  →  fixtures (wiring + reusable flows)  →  page objects / API client (how)  →  config & data
```

- **Tests read like test cases.** They only describe steps and assertions; there are no selectors in spec files. Each test name starts with the ID from the Excel suite (e.g. `TC_LOGIN_05`), so automated and manual cases trace both ways.
- **Page Object Model.** Every page or modal owns its selectors and actions. When the UI changes, one file changes. Modals (Login, Sign up, Place order) are separate objects because they are independent UI components.
- **Custom fixtures** (`src/fixtures/test-fixtures.ts`) inject page objects, the API client and test users into tests, and expose reusable flows such as `loginAs()` and `addProductToCart()`. Tests don't need `new XxxPage(page)` boilerplate, and new pages are added in one place.
- **API client reused for setup.** The same `DemoblazeApi` class powers the API tests and fast data setup for UI tests: creating users, seeding a cart. UI tests only drive the UI for the behaviour they actually verify.

### Handling DemoBlaze specifics

- **Native `alert()` dialogs.** Login errors, "Product added" and form validation are browser alerts. `waitForAlert()` starts listening *before* the click, then accepts the dialog and returns its text, so tests can assert exact messages without flaky timing.
- **Asynchronous cart rendering.** Cart rows and the total load after an XHR. The framework uses web-first assertions (`toHaveCount`, `expect.poll`) instead of fixed sleeps.
- **Prices are read at runtime**, not hard-coded. Totals are compared against the sum of the rows, so a catalog price change does not break tests.
- **Mobile layout.** On small screens the navbar collapses; `BasePage` opens the hamburger menu automatically, so the same tests run on desktop and mobile.

### Cross-browser / cross-platform

`playwright.config.ts` defines projects for **Chromium, Firefox, WebKit** (desktop), **Pixel 7 and iPhone 14** (mobile emulation, `@smoke` subset), **api** (no browser) and **performance**. A `setup` project runs first as a dependency.

### Configurable parameters

All runtime settings live in `config/environments.ts` and can be overridden by environment variables or `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `TEST_ENV` | `prod` | Environment key (structure ready for staging/uat) |
| `BASE_URL` / `API_URL` | DemoBlaze URLs | Override target URLs |
| `TEST_USERNAME` / `TEST_PASSWORD` | *(empty → auto-created)* | Fixed account |
| `HEADLESS` | `true` | Headed/headless |
| `WORKERS` | `4` (2 on CI) | Parallelism |
| `RETRIES` | `1` (2 on CI) | Retries for flaky network |
| `PERF_PAGE_LOAD_BUDGET_MS` | `5000` | Page load budget |
| `PERF_API_BUDGET_MS` | `2000` | API response budget |

### Reporting

Every run produces:

- **HTML report** (`playwright-report/`) with steps, screenshots, videos and traces for failed tests. Performance timings are attached as JSON.
- **JUnit XML** (`test-results/junit.xml`) for Jenkins and GitLab test dashboards.
- **JSON** (`test-results/results.json`) for custom dashboards.

### Test types

| Type | How |
|---|---|
| UI | `tests/ui/*` |
| API | `tests/api/*`, using Playwright `request` (no extra library) |
| Regression | `@regression` tag; nightly schedule in CI |
| Smoke | `@smoke` tag; also used for the mobile run |
| Performance | Navigation Timing + API response-time budgets in Playwright, plus an optional k6 load script |

---

## 5. Test data strategy

- **Shared account** (`tests/global.setup.ts`): created once per run via the sign-up API and saved to `.auth/user.json` (git-ignored). It is used by read-only tests such as login.
- **Fresh account per cart test** (`freshUser` fixture): every test that changes a cart gets its own new user. Tests stay fully isolated and can run in parallel and in any order, with no cleanup races.
- Usernames are unique (`timestamp + random hex`), so CI re-runs never collide.

---

## 6. CI/CD

| Platform | File | What it does |
|---|---|---|
| GitHub Actions | `.github/workflows/playwright.yml` | On push/PR, nightly at 08:00 ICT, and manually (optional `@tag` filter): type-check, API job, UI matrix (Chromium/Firefox/WebKit), mobile smoke, performance (non-blocking). Reports uploaded as artifacts. |
| Jenkins | `Jenkinsfile` | Runs in the official Playwright Docker image; parameters `PROJECT`, `GREP`, `WORKERS`; nightly cron; publishes JUnit and the HTML report. Needs the Docker Pipeline, JUnit and HTML Publisher plugins. |
| GitLab CI | `.gitlab-ci.yml` | API, UI browser matrix and performance jobs, with JUnit report integration. |

Optional secrets `TEST_USERNAME` / `TEST_PASSWORD` can be added in the CI settings; without them, accounts are generated automatically.

---

## 7. Test coverage

The full manual suite is in [`docs/DemoBlaze_Test_Cases.xlsx`](docs/DemoBlaze_Test_Cases.xlsx). Its *Automated* column maps each case to its spec.

Automated demo scenarios required by the challenge:

| Scenario | Test |
|---|---|
| Log in with valid credentials | `TC_LOGIN_01` (+ session persistence, logout) |
| Add to cart, then place an order | `TC_ORDER_01`: login → add 2 products → verify cart and total → fill order → verify confirmation (id, amount, card, name) → verify cart emptied |
| Edge and negative cases | Wrong password, unknown user, empty fields, SQL-injection payload, duplicate items, delete items, empty order form, missing name/card, closing modals |

---

## 8. Known issues & notes

DemoBlaze is a public demo application with intentional weaknesses. The Excel suite records the expected (correct) behaviour. Behaviours commonly reported for DemoBlaze that contradict it are marked as *potential defects* (to be confirmed during execution) instead of being automated as "expected", for example:

- An order can be placed with an **empty cart** (amount 0).
- **Credit card, month and year are not validated** (any text is accepted).
- The purchase confirmation **date shows the month off by one** (JavaScript 0-based month).

Because the site is shared and public, response times vary. That's why the performance job is non-blocking and the budgets are configurable.
