# LLM Connectors, Local Models, and Noj

## What Changed in the Code

The shared LLM transport layer now lives in [`src/com/little_trader/llm/connector.clj`](/Users/victorinacio/4coders/little-trader/src/com/little_trader/llm/connector.clj).

It defines one protocol for:

- Anthropic
- OpenAI
- Local OpenAI-compatible runtimes
- Mock mode

The chat API in [`src/com/little_trader/server/learn_api.clj`](/Users/victorinacio/4coders/little-trader/src/com/little_trader/server/learn_api.clj) now uses that connector instead of hardcoded provider branches.

## Provider Contract

Normalized request:

```clojure
{:system-prompt "You are a helpful assistant."
 :messages [{:role "user" :content "Hello"}]
 :model "..."
 :temperature 0.2
 :max-tokens 2048
 :timeout-ms 30000
 :metadata {...}}
```

Normalized response:

```clojure
{:provider :openai
 :model "gpt-4.1"
 :response "..."
 :text "..."
 :usage {...}
 :raw {...}}
```

## Noj Scan

The important boundary is this:

- Noj is the Clojure data toolkit, not a single built-in local LLM runtime
- The Scicloj LLM tutorial shows direct OpenAI API use, Bosquet, and langchain4j, which means Noj sits well around LLM workflows but does not itself promise "run any model locally"
- The Noj ecosystem points to companion libraries for higher-level model workflows rather than one native inference backend

Primary sources:

- [Noj homepage](https://scicloj.github.io/noj/)
- [Noj recommended libraries](https://scicloj.github.io/noj/noj_book.recommended_libraries.html)
- [Using LLMs from Clojure](https://scicloj.github.io/clojure-data-tutorials/projects/ml/llm/llms.html)

## What Noj Gives Us

Practical strengths around the local-model story:

- Data preparation and transformation for prompts, market context, labels, and evaluation
- Notebook and research workflow support for strategy iteration
- A broad Clojure data-science stack that can sit next to LLM orchestration
- Access to companion libraries such as Bosquet for higher-level LLM application patterns

From Noj documentation and tutorials, the local-model path is indirect, not monolithic.

## Apple Silicon Local Run

For Apple Silicon, the cleanest path today is:

1. Run a local model server backed by `llama.cpp`
2. Point `LOCAL_LLM_API_BASE` at its OpenAI-compatible `chat/completions` endpoint
3. Keep Noj in the surrounding data/evaluation loop

Why this path is practical:

- [`llama.cpp`](https://github.com/ggml-org/llama.cpp) states that Apple silicon is a first-class target, optimized with ARM NEON, Accelerate, and Metal
- The same project ships an OpenAI-compatible HTTP server via `llama-server`
- [`llama.clj`](https://phronmophobic.github.io/llama.clj/) gives a Clojure-facing route to `llama.cpp`

That means the connector added here can talk to a local Apple Silicon runtime immediately, while leaving room for a later direct `llama.clj` execution mode.

## Recommended Modes

### 1. Best near-term production/dev mode

- `LLM_PROVIDER=local`
- `LOCAL_LLM_API_BASE=http://127.0.0.1:8081/v1/chat/completions`
- `LOCAL_LLM_MODEL=<your-gguf-model-name>`

This is the lowest-risk way to make local inference usable from the app.

### 2. Best next implementation step

Add a direct `llama.clj`-backed connector implementation behind the same protocol.

That would remove the extra HTTP hop while keeping the rest of the app unchanged.

### 3. Broader "arbitrary model" route

Inference, not an explicit Noj feature claim:

- If you need model families outside the typical GGUF/`llama.cpp` path, the broader Scicloj/JVM toolchain can likely bridge into Python ecosystems through `libpython-clj`
- On Apple Silicon, that opens a plausible route to MLX-backed inference

That is a viable architecture direction, but it is not the same as saying Noj alone already provides arbitrary local-model execution.
