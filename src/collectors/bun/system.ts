import jsc from "bun:jsc";

import type { Aggregator } from "../../aggregator";
import type Collector from "../../collector";

export class SystemMetricsCollector implements Collector {
  aggregate<T extends Aggregator>(agg: T) {
    this.observeAll(agg);
    return agg;
  }

  private observeAll(agg: Aggregator) {
    this.observeUptime(agg);
    this.observeMemory(agg);
    this.observeHeap(agg);
    this.observeCpu(agg);
  }

  private observeMemory(agg: Aggregator) {
    const mem = jsc.memoryUsage();
    agg.observe({
      name: "bun_memory_current",
      type: "gauge",
      description: "Current memory usage in bytes",
      value: mem.current,
    });
    agg.observe({
      name: "bun_memory_current_commit",
      type: "gauge",
      description: "Current committed memory in bytes",
      value: mem.currentCommit,
    });
    agg.observe({
      name: "bun_memory_peak",
      type: "gauge",
      description: "Peak memory usage in bytes",
      value: mem.peak,
    });
    agg.observe({
      name: "bun_memory_peak_commit",
      type: "gauge",
      description: "Peak committed memory in bytes",
      value: mem.peakCommit,
    });
    agg.observe({
      name: "bun_memory_page_faults",
      type: "counter",
      description: "Number of page faults",
      value: mem.pageFaults,
    });
  }

  private observeHeap(agg: Aggregator) {
    const heap = jsc.heapStats();

    agg.observe({
      name: "bun_heap_heap_size",
      type: "gauge",
      description: "Current heap size in bytes",
      value: heap.heapSize,
    });
    agg.observe({
      name: "bun_heap_heap_capacity",
      type: "gauge",
      description: "Current heap capacity in bytes",
      value: heap.heapCapacity,
    });
    agg.observe({
      name: "bun_heap_extra_memory_size",
      type: "gauge",
      description: "Extra memory size in bytes",
      value: heap.extraMemorySize,
    });

    for (const [type, count] of Object.entries(heap.objectTypeCounts)) {
      agg.observe({
        name: "bun_heap_object_count",
        type: "gauge",
        description: "Number of objects in the heap by type",
        value: count,
        labels: { type },
      });
    }
    agg.observe({
      name: "bun_heap_object_count_total",
      type: "gauge",
      description: "Number of objects in the heap",
      value: heap.objectCount,
    });

    for (
      const [type, count] of Object.entries(heap.protectedObjectTypeCounts)
    ) {
      agg.observe({
        name: "bun_heap_protected_object_count",
        type: "gauge",
        description: "Number of protected objects in the heap by type",
        value: count,
        labels: { type },
      });
    }
    agg.observe({
      name: "bun_heap_protected_object_count_total",
      type: "gauge",
      description: "Number of protected objects in the heap",
      value: heap.protectedObjectCount,
    });

    agg.observe({
      name: "bun_heap_global_object_count",
      type: "gauge",
      description: "Number of global objects in the heap",
      value: heap.globalObjectCount,
    });
    agg.observe({
      name: "bun_heap_protected_global_object_count",
      type: "gauge",
      description: "Number of protected global objects in the heap",
      value: heap.protectedGlobalObjectCount,
    });
  }

  private observeCpu(agg: Aggregator) {
    const cpu = process.cpuUsage();
    agg.observe({
      name: "bun_cpu_usage",
      type: "counter",
      description: "CPU time spent in user mode in microseconds",
      value: cpu.user,
      labels: { mode: "user" },
    });
    agg.observe({
      name: "bun_cpu_usage",
      type: "counter",
      description: "CPU time spent in system mode in microseconds",
      value: cpu.system,
      labels: { mode: "system" },
    });
  }

  private observeUptime(agg: Aggregator) {
    agg.observe({
      name: "bun_process_uptime_seconds",
      type: "gauge",
      description: "Process uptime in seconds",
      value: process.uptime(),
    });
  }
}
