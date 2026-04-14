# Learn Tab — Product Specification

## Purpose

Expose `/learn` inside the product as a **first-class surface**.

This is not documentation navigation.
This is an **interactive thinking environment**.

---

## Position in UI

Top-level tabs:

- Dashboard
- Strategies
- REPL
- Copilot
- **Learn** ← new

---

## Core Concept

Learn is where the user:

- builds mental models
- understands decisions
- improves judgment

---

## Layout

### Left Panel

- Learning paths
- Sections:
  - Getting Started
  - REPL Thinking
  - Strategy Thinking
  - System Understanding

### Main Panel

- Markdown content (from /learn)
- Interactive blocks (future):
  - "Run in REPL"
  - "Ask Copilot"
  - "Simulate scenario"

### Right Panel (Contextual Assistant)

- Copilot anchored to current lesson
- Prompts like:
  - "Explain this in simpler terms"
  - "Show real example"
  - "Test this assumption"

---

## Interaction Patterns

### 1. Learn → REPL

User reads something → clicks "Inspect" → opens REPL with prefilled snippet

### 2. Learn → Copilot

User highlights text → asks question → Copilot answers in context

### 3. Learn → System

User clicks "Show in system" → navigates to real feature

---

## Example Flow

1. User opens Learn tab
2. Clicks "REPL Thinking"
3. Reads principle
4. Clicks "Run example"
5. REPL opens with snippet
6. User modifies and learns

---

## Future Extensions

- Progress tracking
- Skill levels
- Strategy certification paths
- AI-generated lessons based on behavior

---

## Key Principle

> The product should not only execute trades.
>
> It should train the mind that executes them.
