# Executor Heavy Job Execution

This document covers optimization, training, large backfills, and other heavy workloads that should not run by default inside the interactive renderer.

## Problem

The Executor supports both:

- interactive runs
- long-running jobs

These are not the same thing.

Interactive runs optimize for:

- feedback speed
- inspectability
- chart coupling

Heavy jobs optimize for:

- throughput
- checkpointing
- resumability
- resource isolation

## Workload Classes

### Class A: interactive

Examples:

- simulate 5k to 50k bars
- compare two parameter sets
- inspect one training window

Default target:

- browser or local daemon

### Class B: workstation

Examples:

- longer simulations
- optimization over tens to hundreds of parameter combinations
- local training jobs

Default target:

- local daemon

### Class C: heavy

Examples:

- optimization batches over thousands of runs
- multi-model training
- long feature generation pipelines
- large market-universe backfills

Default target:

- local daemon if machine allows
- remote server when scale or shared execution is needed

## Job Model

Heavy work should run as explicit jobs, not implicit side effects.

A job should have:

- job ID
- execution spec
- runtime target
- resource class
- checkpoint state
- progress metrics
- result artifacts

Example:

```clojure
{:job/id ...
 :job/type :optimize
 :job/runtime-target :local-daemon
 :job/status :running
 :job/checkpoint {:completed-runs 480
                  :remaining-runs 1520}
 :job/artifacts [{:artifact/type :metrics-summary
                  :artifact/ref "opt-run-2026-04-03-summary"}]}
```

## Local Daemon Role

The local daemon is the preferred heavy-job runtime because it:

- sits near the local data plane
- avoids browser lifecycle problems
- can checkpoint durably
- can serve both UI and CLI launches

The local daemon should own:

- backfill jobs
- optimization jobs
- training jobs
- large replay jobs
- materialization jobs

## Remote Offload

Remote execution should exist, but it should remain optional.

Use remote when:

- job size exceeds local resource budgets
- the user asks for team-scale or shared execution
- the job is non-latency-sensitive and compute-heavy

Remote jobs should still consume:

- the same execution spec format
- the same lineage conventions
- the same artifact model

## Resource Budgets

These are planning budgets, not measured limits.

| Runtime | Best use | Practical cap |
|---|---|---|
| browser | short interactive runs | bounded CPU, memory, and tab lifetime |
| local daemon | workstation-class jobs | bounded by local machine resources |
| remote server | heavy scale-out batches | bounded by infra budget and queue policy |

## Checkpointing

Heavy jobs must checkpoint.

Checkpoint examples:

- optimization run index
- last processed chunk
- current model epoch
- last persisted artifact
- last sync acknowledgement

Checkpointing enables:

- pause/resume
- crash recovery
- UI reconnection
- migration between local and remote execution

## Data Locality

Heavy jobs should execute near data.

That means:

- local jobs read local chunks directly
- remote jobs should not fetch tiny fragments repeatedly over chatty APIs
- the UI should request the job, not stream all raw data itself

This matters most for:

- optimization
- training
- feature generation

## Job Output

Heavy jobs should emit:

- progress events
- checkpoint updates
- summary metrics
- artifact manifests
- lineage references

The UI should render summaries and let users inspect artifacts, not force the renderer to own the full heavy-job memory footprint.

## Scheduling Policy

Initial policy should be simple:

- one live strategy per symbol/runtime lane
- bounded concurrent heavy jobs
- explicit priority for live mode over optimization and training
- backfill and materialization can be preempted or throttled

## Security and Safety

Heavy jobs should not imply unrestricted code execution.

Separate:

- bounded executor actions from the product UI
- local CLI and REPL power-user access
- remote job worker capabilities

This keeps optimization and training powerful without turning the product UI into a general remote-code tunnel.

## Relation to DevOps

This document covers the execution theory and architecture.

For the current cloud and worker operations, use:

- [FastStreaming Cloud DevOps](./FastStreamingCloudDevOps.md)
