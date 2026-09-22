Yes. If everything is self-hosted, I would design this as an AI Agent Operating System rather than a chatbot. The LLM becomes the orchestrator, while Playwright, OCR, search, and file tools do the actual work.

The core design principle is:

> Use the smallest capable open-source model for each step, not one giant model.

A 3,500-product task may execute thousands of AI calls. Using a 32B model for every step would be unnecessarily expensive even on your own GPUs.

# Product architecture

## Vision

StepPilot OS — Autonomous business agents that can:

* Browse websites with Playwright

* Search the internet

* Read PDFs, Excel, images

* Extract structured data

* Generate reports

* Operate admin dashboards

* Pause for human approval

* Resume automatically

The user gives one instruction:

> Update all SmartStore prices from Nigerian retailers.

The system plans and executes the workflow.

## High-level architecture

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20340%20220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22340%22%20height%3D%22220%22%20rx%3D%2216%22%20fill%3D%22%23F8FAFC%22%2F%3E%3Crect%20x%3D%2278%22%20y%3D%2210%22%20width%3D%22184%22%20height%3D%2226%22%20rx%3D%228%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%2227%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EUser%20Goal%3C%2Ftext%3E%3Cpath%20d%3D%22M170%2036%20V48%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%2248%22%20width%3D%22200%22%20height%3D%2228%22%20rx%3D%228%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%2266%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EPlanner%20LLM%3C%2Ftext%3E%3Cpath%20d%3D%22M170%2076%20V88%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2288%22%20width%3D%22220%22%20height%3D%2226%22%20rx%3D%228%22%20fill%3D%22%23F3E8FF%22%20stroke%3D%22%237C3AED%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%22105%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3EWorkflow%20Engine%3C%2Ftext%3E%3Cpath%20d%3D%22M170%20114%20V122%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%22122%22%20width%3D%2272%22%20height%3D%2236%22%20rx%3D%228%22%20fill%3D%22%23FDE68A%22%20stroke%3D%22%23B45309%22%2F%3E%3Ctext%20x%3D%2244%22%20y%3D%22137%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EBrowser%3C%2Ftext%3E%3Ctext%20x%3D%2244%22%20y%3D%22147%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EAgent%3C%2Ftext%3E%3Crect%20x%3D%2288%22%20y%3D%22122%22%20width%3D%2272%22%20height%3D%2236%22%20rx%3D%228%22%20fill%3D%22%23FCA5A5%22%20stroke%3D%22%23DC2626%22%2F%3E%3Ctext%20x%3D%22124%22%20y%3D%22137%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3ESearch%3C%2Ftext%3E%3Ctext%20x%3D%22124%22%20y%3D%22147%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EAgent%3C%2Ftext%3E%3Crect%20x%3D%22168%22%20y%3D%22122%22%20width%3D%2272%22%20height%3D%2236%22%20rx%3D%228%22%20fill%3D%22%23BFDBFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22204%22%20y%3D%22137%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EFile%3C%2Ftext%3E%3Ctext%20x%3D%22204%22%20y%3D%22147%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EAgent%3C%2Ftext%3E%3Crect%20x%3D%22248%22%20y%3D%22122%22%20width%3D%2284%22%20height%3D%2236%22%20rx%3D%228%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22290%22%20y%3D%22137%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EAPI%3C%2Ftext%3E%3Ctext%20x%3D%22290%22%20y%3D%22147%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EAgent%3C%2Ftext%3E%3Cpath%20d%3D%22M170%20158%20V170%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22170%22%20width%3D%22260%22%20height%3D%2218%22%20rx%3D%226%22%20fill%3D%22%23E5E7EB%22%20stroke%3D%22%236B7280%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%22182%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EMemory%20%E2%80%A2%20Vector%20DB%20%E2%80%A2%20Audit%3C%2Ftext%3E%3Cpath%20d%3D%22M170%20188%20V196%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%22196%22%20width%3D%22200%22%20height%3D%2214%22%20rx%3D%226%22%20fill%3D%22%23111827%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%22206%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23FFFFFF%22%3EReports%20%C2%B7%20CSV%20%C2%B7%20Dashboard%20Updates%3C%2Ftext%3E%3C%2Fsvg%3E)

The Planner never directly controls the browser. It issues steps to execution agents.

# Model selection (all open source)

## Recommended model stack

|
Responsibility

|

Model

|

Why

|
| --- | --- | --- |
|

Planner

|

Qwen3-32B-Instruct

|

Excellent reasoning, tool use

|
|

Browser reasoning

|

Qwen3-14B

|

Fast + strong instruction following

|
|

Vision/OCR

|

Qwen2.5-VL-7B

|

Reads screenshots and tables

|
|

Data extraction

|

Qwen2.5-VL-7B

|

Structured JSON extraction

|
|

Classification

|

Qwen3-4B

|

Cheap routing & tagging

|
|

Embeddings

|

BGE-M3

|

High-quality multilingual embeddings

|
|

Reranker

|

BGE-Reranker-v2

|

Improves retrieval accuracy

|
|

Speech (optional)

|

Whisper Large V3

|

Voice commands

|

This entire stack can be self-hosted on your GPU platform.

### Why not Llama?

For agent workflows, Qwen3 currently has stronger tool-calling behavior and better multilingual support than most comparable open models. Llama is still valuable, but I'd make Qwen the default orchestration model.

# Agent hierarchy

## 1. Planner Agent

Input:

> Find prices for 3,500 products and update SmartStore.

Output is not prose. It outputs structured steps.

JSON

```
[
  {
    "step": "load_catalog"
  },
  {
    "step": "search_product",
    "parallel": true
  },
  {
    "step": "extract_price"
  },
  {
    "step": "validate"
  },
  {
    "step": "generate_excel"
  },
  {
    "step": "update_dashboard"
  }
]
```

This becomes the execution graph.

## 2. Browser Agent (Playwright)

Playwright is the primary automation engine.

Capabilities:

* Chromium

* Firefox

* WebKit

* Screenshots

* Downloads

* Cookies

* Persistent sessions

Example internal API:

TypeScript

```
browser.open(url)
browser.click(selector)
browser.type(selector, value)
browser.wait()
browser.screenshot()
browser.download()
```

The LLM never manipulates HTML directly—it issues browser tool calls.

## 3. Vision Agent

Whenever Playwright encounters a difficult page:

1. Take screenshot

2. Send screenshot to Qwen2.5-VL

3. Receive coordinates + understanding

Example:

Screenshot

↓

Qwen2.5-VL

↓

JSON

```
{
  "price": "₦24,999",
  "currency": "NGN",
  "availability": "In Stock",
  "button": "Add to Cart"
}
```

This is much more reliable than CSS selectors alone.

## 4. Search Agent

Instead of opening random websites immediately:

Workflow:

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20320%2084%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%228%22%20y%3D%2222%22%20width%3D%2256%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%2236%22%20y%3D%2238%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EQuery%3C%2Ftext%3E%3Ctext%20x%3D%2236%22%20y%3D%2248%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3ESKU%3C%2Ftext%3E%3Cpath%20d%3D%22M64%2042%20H78%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2278%22%20y%3D%2222%22%20width%3D%2278%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22117%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3ESearch%3C%2Ftext%3E%3Ctext%20x%3D%22117%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EIndex%3C%2Ftext%3E%3Ctext%20x%3D%22117%22%20y%3D%2254%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3ETop%20URLs%3C%2Ftext%3E%3Cpath%20d%3D%22M156%2042%20H170%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22170%22%20y%3D%2222%22%20width%3D%2264%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23F3E8FF%22%20stroke%3D%22%237C3AED%22%2F%3E%3Ctext%20x%3D%22202%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3ERanked%3C%2Ftext%3E%3Ctext%20x%3D%22202%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3EURLs%3C%2Ftext%3E%3Cpath%20d%3D%22M234%2042%20H248%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22248%22%20y%3D%2222%22%20width%3D%2264%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23FDE68A%22%20stroke%3D%22%23B45309%22%2F%3E%3Ctext%20x%3D%22280%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EBrowser%3C%2Ftext%3E%3Ctext%20x%3D%22280%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EAgent%3C%2Ftext%3E%3C%2Fsvg%3E)

The browser only visits high-confidence pages.

# Workflow engine

Instead of linear execution, use a DAG (Directed Acyclic Graph).

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20320%20180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22320%22%20height%3D%22180%22%20rx%3D%2212%22%20fill%3D%22%23FFFFFF%22%20stroke%3D%22%23E5E7EB%22%2F%3E%3Crect%20x%3D%22100%22%20y%3D%2210%22%20width%3D%22120%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%2225%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3ELoad%20Catalog%3C%2Ftext%3E%3Cpath%20d%3D%22M160%2032%20V44%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22100%22%20y%3D%2244%22%20width%3D%22120%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%2259%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3ESearch%20URLs%3C%2Ftext%3E%3Cpath%20d%3D%22M160%2066%20V78%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M160%2078%20L54%2096%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M160%2078%20V96%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M160%2078%20L266%2096%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2296%22%20width%3D%2288%22%20height%3D%2228%22%20rx%3D%226%22%20fill%3D%22%23FDE68A%22%20stroke%3D%22%23B45309%22%2F%3E%3Ctext%20x%3D%2254%22%20y%3D%22108%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EExtract%3C%2Ftext%3E%3Ctext%20x%3D%2254%22%20y%3D%22118%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EPrice%3C%2Ftext%3E%3Crect%20x%3D%22116%22%20y%3D%2296%22%20width%3D%2288%22%20height%3D%2228%22%20rx%3D%226%22%20fill%3D%22%23F3E8FF%22%20stroke%3D%22%237C3AED%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22108%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3EVerify%3C%2Ftext%3E%3Ctext%20x%3D%22160%22%20y%3D%22118%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3EPrice%3C%2Ftext%3E%3Crect%20x%3D%22222%22%20y%3D%2296%22%20width%3D%2288%22%20height%3D%2228%22%20rx%3D%226%22%20fill%3D%22%23FCA5A5%22%20stroke%3D%22%23DC2626%22%2F%3E%3Ctext%20x%3D%22266%22%20y%3D%22108%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EStock%3C%2Ftext%3E%3Ctext%20x%3D%22266%22%20y%3D%22118%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EStatus%3C%2Ftext%3E%3Cpath%20d%3D%22M54%20124%20L160%20142%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M160%20124%20V142%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M266%20124%20L160%20142%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22100%22%20y%3D%22142%22%20width%3D%22120%22%20height%3D%2218%22%20rx%3D%226%22%20fill%3D%22%23E5E7EB%22%20stroke%3D%22%236B7280%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22154%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EGenerate%20CSV%3C%2Ftext%3E%3Cpath%20d%3D%22M160%20160%20V168%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%22168%22%20width%3D%22140%22%20height%3D%2210%22%20rx%3D%225%22%20fill%3D%22%23111827%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22176%22%20font-size%3D%227%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23FFFFFF%22%3EHuman%20Approval%3C%2Ftext%3E%3C%2Fsvg%3E)

Each node has:

TypeScript

```
{
  id,
  type,
  inputs,
  outputs,
  retries,
  timeout,
  parallelism
}
```

This lets thousands of steps run simultaneously.

# Parallel execution

For 3,500 products:

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20320%20140%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22320%22%20height%3D%22140%22%20rx%3D%2212%22%20fill%3D%22%23FFFFFF%22%20stroke%3D%22%23E5E7EB%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2210%22%20width%3D%22140%22%20height%3D%2220%22%20rx%3D%226%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%2224%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3E3%2C500%20Products%3C%2Ftext%3E%3Cpath%20d%3D%22M160%2030%20V40%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2240%22%20width%3D%22200%22%20height%3D%2218%22%20rx%3D%226%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%2253%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EDistributed%20Queue%3C%2Ftext%3E%3Cpath%20d%3D%22M160%2058%20V66%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2266%22%20width%3D%2248%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23F3F4F6%22%20stroke%3D%22%239CA3AF%22%2F%3E%3Ctext%20x%3D%2240%22%20y%3D%2280%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EW1%3C%2Ftext%3E%3Crect%20x%3D%2276%22%20y%3D%2266%22%20width%3D%2248%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23F3F4F6%22%20stroke%3D%22%239CA3AF%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%2280%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EW2%3C%2Ftext%3E%3Crect%20x%3D%22136%22%20y%3D%2266%22%20width%3D%2248%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23F3F4F6%22%20stroke%3D%22%239CA3AF%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%2280%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EW3%3C%2Ftext%3E%3Crect%20x%3D%22196%22%20y%3D%2266%22%20width%3D%2248%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23F3F4F6%22%20stroke%3D%22%239CA3AF%22%2F%3E%3Ctext%20x%3D%22220%22%20y%3D%2280%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EW4%3C%2Ftext%3E%3Crect%20x%3D%22256%22%20y%3D%2266%22%20width%3D%2248%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%23F3F4F6%22%20stroke%3D%22%239CA3AF%22%2F%3E%3Ctext%20x%3D%22280%22%20y%3D%2280%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EW5%3C%2Ftext%3E%3Ctext%20x%3D%22160%22%20y%3D%2296%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%236B7280%22%3E%E2%80%A620%20workers%3C%2Ftext%3E%3Cpath%20d%3D%22M160%20100%20V108%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%22108%22%20width%3D%22180%22%20height%3D%2220%22%20rx%3D%226%22%20fill%3D%22%23E5E7EB%22%20stroke%3D%22%236B7280%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22121%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EValidation%20%2B%20Storage%3C%2Ftext%3E%3C%2Fsvg%3E)

Each browser worker:

1. Opens retailer

2. Extracts price

3. Validates

4. Stores JSON

5. Picks next product

No LLM coordination is required after dispatch.

# Memory architecture

Use PostgreSQL + pgvector.

## Tables

|
Table

|

Purpose

|
| --- | --- |
|

tasks

|

User requests

|
|

steps

|

Individual actions

|
|

step_outputs

|

JSON results

|
|

browser_sessions

|

Cookies & auth

|
|

documents

|

Uploaded files

|
|

embeddings

|

Semantic memory

|
|

audit_logs

|

Every AI decision

|

Example memory:

```
User prefers Konga over Jumia.

↓

Embedding stored

↓

Future planner automatically prioritizes Konga.
```

# Browser intelligence

Instead of brittle CSS selectors, combine Playwright with vision.

## Step 1

Playwright loads page.

## Step 2

Screenshot.

## Step 3

Qwen2.5-VL understands layout.

## Step 4

Return semantic objects.

Example:

JSON

```
{
  "elements": [
    {
      "type": "price",
      "value": "₦18,500",
      "bbox": [220,310,290,340]
    },
    {
      "type": "button",
      "text": "Next Page",
      "bbox": [520,740,610,770]
    }
  ]
}
```

Playwright then clicks the returned coordinates.

This survives UI redesigns much better.

# File processing pipeline

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20320%2084%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%228%22%20y%3D%2222%22%20width%3D%2264%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23FCA5A5%22%20stroke%3D%22%23DC2626%22%2F%3E%3Ctext%20x%3D%2240%22%20y%3D%2236%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EPDF%3C%2Ftext%3E%3Ctext%20x%3D%2240%22%20y%3D%2246%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EExcel%3C%2Ftext%3E%3Cpath%20d%3D%22M72%2042%20H86%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2286%22%20y%3D%2222%22%20width%3D%2292%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22132%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EQwen2.5-VL%3C%2Ftext%3E%3Ctext%20x%3D%22132%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EOCR%20%2B%20Tables%3C%2Ftext%3E%3Cpath%20d%3D%22M178%2042%20H192%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22192%22%20y%3D%2222%22%20width%3D%2252%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22218%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EJSON%3C%2Ftext%3E%3Ctext%20x%3D%22218%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EData%3C%2Ftext%3E%3Cpath%20d%3D%22M244%2042%20H258%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22258%22%20y%3D%2222%22%20width%3D%2254%22%20height%3D%2240%22%20rx%3D%228%22%20fill%3D%22%23F3E8FF%22%20stroke%3D%22%237C3AED%22%2F%3E%3Ctext%20x%3D%22285%22%20y%3D%2234%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3EReport%3C%2Ftext%3E%3Ctext%20x%3D%22285%22%20y%3D%2244%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%235B21B6%22%3ECSV%3C%2Ftext%3E%3C%2Fsvg%3E)

Supported inputs:

* PDFs

* Receipts

* Scanned invoices

* Product catalogues

* Images

* Excel

* CSV

Output is always structured JSON first.

# Human approval system

Critical business actions require approval.

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20260%20220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22260%22%20height%3D%22220%22%20rx%3D%2212%22%20fill%3D%22%23FFFFFF%22%20stroke%3D%22%23E5E7EB%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%2212%22%20width%3D%22120%22%20height%3D%2228%22%20rx%3D%228%22%20fill%3D%22%23DBEAFE%22%20stroke%3D%22%232563EB%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%2229%22%20font-size%3D%229%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%231D4ED8%22%3EExecute%20Step%3C%2Ftext%3E%3Cpath%20d%3D%22M130%2040%20V52%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22130%2C52%20170%2C82%20130%2C112%2090%2C82%22%20fill%3D%22%23FDE68A%22%20stroke%3D%22%23B45309%22%20stroke-width%3D%221.5%22%20stroke-linejoin%3D%22round%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%2278%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%2392400E%22%3EDestructive%3F%3C%2Ftext%3E%3Ctext%20x%3D%22176%22%20y%3D%2266%22%20font-size%3D%227%22%20font-family%3D%22Arial%22%20fill%3D%22%23047857%22%3ENo%3C%2Ftext%3E%3Cpath%20d%3D%22M170%2082%20H208%22%20stroke%3D%22%23059669%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%22208%22%20y%3D%2268%22%20width%3D%2240%22%20height%3D%2228%22%20rx%3D%226%22%20fill%3D%22%23D1FAE5%22%20stroke%3D%22%23059669%22%2F%3E%3Ctext%20x%3D%22228%22%20y%3D%2280%22%20font-size%3D%227%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EAuto%3C%2Ftext%3E%3Ctext%20x%3D%22228%22%20y%3D%2288%22%20font-size%3D%227%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23065F46%22%3EGo%3C%2Ftext%3E%3Ctext%20x%3D%2284%22%20y%3D%22122%22%20font-size%3D%227%22%20font-family%3D%22Arial%22%20fill%3D%22%23B45309%22%3EYes%3C%2Ftext%3E%3Cpath%20d%3D%22M130%20112%20V132%22%20stroke%3D%22%23B45309%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2258%22%20y%3D%22132%22%20width%3D%22144%22%20height%3D%2230%22%20rx%3D%228%22%20fill%3D%22%23FCA5A5%22%20stroke%3D%22%23DC2626%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%22145%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3EReview%20Required%3C%2Ftext%3E%3Ctext%20x%3D%22130%22%20y%3D%22154%22%20font-size%3D%227%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23991B1B%22%3E3%2C487%20changes%3C%2Ftext%3E%3Cpath%20d%3D%22M130%20162%20V176%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2288%22%20y%3D%22176%22%20width%3D%2284%22%20height%3D%2226%22%20rx%3D%228%22%20fill%3D%22%23111827%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%22193%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23FFFFFF%22%3EApprove%3C%2Ftext%3E%3Cpath%20d%3D%22M130%20202%20V210%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ctext%20x%3D%22130%22%20y%3D%22217%22%20font-size%3D%227%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23374151%22%3EContinue%3C%2Ftext%3E%3C%2Fsvg%3E)

Examples requiring approval:

* Update website

* Delete records

* Send emails

* Submit payments

* Publish products

Everything else runs autonomously.

# GPU deployment

Since you're already building GPU infrastructure, deploy models independently.

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20340%20180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22340%22%20height%3D%22180%22%20rx%3D%2212%22%20fill%3D%22%230F172A%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2212%22%20width%3D%22160%22%20height%3D%2222%22%20rx%3D%226%22%20fill%3D%22%231D4ED8%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%2227%22%20font-size%3D%229%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20fill%3D%22%23FFFFFF%22%3EAPI%20Gateway%3C%2Ftext%3E%3Cg%20font-family%3D%22Arial%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%3E%3Crect%20x%3D%2210%22%20y%3D%2250%22%20width%3D%2296%22%20height%3D%2234%22%20rx%3D%226%22%20fill%3D%22%231F2937%22%20stroke%3D%22%2364748B%22%2F%3E%3Ctext%20x%3D%2258%22%20y%3D%2264%22%20fill%3D%22%23F9FAFB%22%3EQwen3%3C%2Ftext%3E%3Ctext%20x%3D%2258%22%20y%3D%2274%22%20fill%3D%22%23D1D5DB%22%3E32B%20Planner%3C%2Ftext%3E%3Crect%20x%3D%22122%22%20y%3D%2250%22%20width%3D%2296%22%20height%3D%2234%22%20rx%3D%226%22%20fill%3D%22%231F2937%22%20stroke%3D%22%2364748B%22%2F%3E%3Ctext%20x%3D%22170%22%20y%3D%2264%22%20fill%3D%22%23F9FAFB%22%3EQwen3%3C%2Ftext%3E%3Ctext%20x%3D%22170%22%20y%3D%2274%22%20fill%3D%22%23D1D5DB%22%3E14B%20Browser%3C%2Ftext%3E%3Crect%20x%3D%22234%22%20y%3D%2250%22%20width%3D%2296%22%20height%3D%2234%22%20rx%3D%226%22%20fill%3D%22%231F2937%22%20stroke%3D%22%2364748B%22%2F%3E%3Ctext%20x%3D%22282%22%20y%3D%2264%22%20fill%3D%22%23F9FAFB%22%3EQwen2.5-VL%3C%2Ftext%3E%3Ctext%20x%3D%22282%22%20y%3D%2274%22%20fill%3D%22%23D1D5DB%22%3EVision%3C%2Ftext%3E%3Crect%20x%3D%2266%22%20y%3D%22104%22%20width%3D%2296%22%20height%3D%2234%22%20rx%3D%226%22%20fill%3D%22%231F2937%22%20stroke%3D%22%2364748B%22%2F%3E%3Ctext%20x%3D%22114%22%20y%3D%22118%22%20fill%3D%22%23F9FAFB%22%3EBGE%3C%2Ftext%3E%3Ctext%20x%3D%22114%22%20y%3D%22128%22%20fill%3D%22%23D1D5DB%22%3EEmbeddings%3C%2Ftext%3E%3Crect%20x%3D%22178%22%20y%3D%22104%22%20width%3D%2296%22%20height%3D%2234%22%20rx%3D%226%22%20fill%3D%22%231F2937%22%20stroke%3D%22%2364748B%22%2F%3E%3Ctext%20x%3D%22226%22%20y%3D%22118%22%20fill%3D%22%23F9FAFB%22%3EPlaywright%3C%2Ftext%3E%3Ctext%20x%3D%22226%22%20y%3D%22128%22%20fill%3D%22%23D1D5DB%22%3EWorkers%3C%2Ftext%3E%3C%2Fg%3E%3Cg%20stroke%3D%22%2364748B%22%20stroke-width%3D%221%22%3E%3Cline%20x1%3D%22170%22%20y1%3D%2234%22%20x2%3D%2258%22%20y2%3D%2250%22%2F%3E%3Cline%20x1%3D%22170%22%20y1%3D%2234%22%20x2%3D%22170%22%20y2%3D%2250%22%2F%3E%3Cline%20x1%3D%22170%22%20y1%3D%2234%22%20x2%3D%22282%22%20y2%3D%2250%22%2F%3E%3Cline%20x1%3D%22170%22%20y1%3D%2234%22%20x2%3D%22114%22%20y2%3D%22104%22%2F%3E%3Cline%20x1%3D%22170%22%20y1%3D%2234%22%20x2%3D%22226%22%20y2%3D%22104%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E)

Recommended minimum cluster:

|
Service

|

GPU

|
| --- | --- |
|

Qwen3-32B

|

2× L40S / 2× A100

|
|

Qwen3-14B

|

1× L40S

|
|

Qwen2.5-VL

|

1× RTX 4090

|
|

Embeddings

|

CPU or small GPU

|
|

Playwright

|

CPU containers

|

Browser workers generally don't need GPUs.

# SmartStore example

## User command

> Compare prices of all Samsung phones across Jumia, Konga, Slot and Pointek. Update SmartStore and generate an Excel audit.

### Execution timeline

|
Stage

|

Worker

|
| --- | --- |
|

Load 3,500 SKUs

|

Planner

|
|

Find retailer URLs

|

Search Agent

|
|

Visit product pages

|

20 Playwright workers

|
|

Read prices

|

Vision Agent

|
|

Validate outliers

|

Qwen3-14B

|
|

Produce Excel

|

File Agent

|
|

Await approval

|

Human

|
|

Update SmartStore

|

Browser/API Agent

|

Estimated runtime:

* 3,500 products

* 20 workers

* ~8 seconds/product average

* 25–35 minutes total

# Developer SDK

Expose the platform as code.

TypeScript

```
const task = await agent.create({
  goal: "Update SmartStore prices",
  input: "products.csv"
})

await task.run()

console.log(task.artifacts)
```

Or YAML workflows:

YAML

```
name: Daily Fuel Price

schedule: "0 8 * * *"

steps:
  - search: "NNPC fuel price Lagos"

  - browse: official_site

  - extract:
      schema:
        price: number

  - excel: fuel.xlsx

  - email: ops@company.com
```

The planner can even generate this workflow automatically from English.

# The real moat

The competitive advantage is not Qwen. Anyone can download Qwen.

The moat is the execution runtime:

* Persistent browser sessions with Playwright

* Vision-guided browser automation

* Distributed step scheduler

* Retry & recovery engine

* Human approval checkpoints

* Audit trail of every AI action

* Connectors to business systems (SmartStore, ERP, Paystack, courier APIs)

This becomes an AI employee platform, where models are interchangeable but the workflow engine is proprietary.

I would build this before attempting a general-purpose AI assistant because it solves measurable business problems and creates clear enterprise value.


For **testing and MVP development**, yes, that **A40 (48GB VRAM) pod at $0.49/hr** is actually a very reasonable starting point.

The limitation is not storage—it's **GPU VRAM**.

### What can fit comfortably on a single A40?

| Model            | Approx VRAM (4-bit) | Fits? |
| ---------------- | ------------------: | ----- |
| Qwen3-4B         |              3–5 GB | ✅     |
| Qwen3-8B         |              6–8 GB | ✅     |
| Qwen3-14B        |            10–14 GB | ✅     |
| Qwen2.5-VL-7B    |             8–12 GB | ✅     |
| BGE-M3           |               <2 GB | ✅     |
| Whisper Large V3 |              3–5 GB | ✅     |
| Qwen3-32B        |            20–28 GB | ✅     |

Storage only affects:

* model downloads
* logs
* screenshots
* browser artifacts
* embeddings

You can always mount 100–200GB storage later.

---

# What I would do

For MVP testing:

### Load

```text
Qwen3-14B      (primary agent)
Qwen2.5-VL-7B  (vision)
BGE-M3         (embeddings)
```

This gives you:

* planning
* browsing
* OCR
* extraction
* RAG
* memory

all on one GPU.

---

# What I would NOT do

I would not run:

```text
Qwen3-32B
Qwen3-14B
Qwen2.5-VL
Whisper
BGE
```

simultaneously on the A40.

Technically possible with aggressive quantization, but:

* memory fragmentation
* slower inference
* model loading delays
* OOM risk

---

# Better approach

Use vLLM and keep only the active models loaded.

For example:

### Default loaded

```text
Qwen3-14B
Qwen2.5-VL-7B
```

When a big planning task arrives:

```text
Unload Qwen3-14B
Load Qwen3-32B
Run planning
Unload Qwen3-32B
Reload Qwen3-14B
```

Planning tasks are infrequent compared to execution tasks.

---

# Even better MVP architecture

For your first version I'd actually simplify:

### One model only

```text
Qwen3-14B
```

plus

```text
Playwright
```

You can build:

* browser automation
* website navigation
* extraction
* CSV generation
* SmartStore updates

without any other model.

Then add:

### Phase 2

```text
Qwen2.5-VL-7B
```

for screenshot understanding.

Then:

### Phase 3

```text
BGE-M3
```

for memory/RAG.

Then:

### Phase 4

```text
Qwen3-32B
```

for better planning.

---

# Storage recommendation

Your screenshot shows:

```text
Container Disk: 30GB
```

That's the first thing I'd increase.

For experimentation:

```text
100GB
```

minimum.

Reason:

```text
Qwen3-14B      ~10-15GB
Qwen2.5-VL     ~10-15GB
Embeddings     ~1GB
Playwright     ~3GB
Screenshots
Logs
Artifacts
```

30GB gets tight quickly.

---

# What I would deploy today

If your goal is to validate the product idea as cheaply as possible:

### RunPod A40

```text
GPU:
A40 48GB

Storage:
100GB

Models:
Qwen3-14B
Qwen2.5-VL-7B

Services:
vLLM
Playwright
PostgreSQL
Redis
Fastify API
```

This would be enough to demonstrate:

1. User uploads 3,500 products.
2. Agent searches websites.
3. Playwright visits pages.
4. AI extracts prices.
5. CSV generated.
6. SmartStore updated.

And all of that can run on a single ~$0.49/hr pod for MVP testing.

At that price:

```text
24 hrs/day × 30 days × $0.49
≈ $353/month
```

For development, you can start/stop the pod and likely spend **well under $100/month** while building. The browser workers themselves are mostly CPU-bound, so the A40's main task is serving the agent and vision models.
