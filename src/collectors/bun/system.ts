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
    agg.observe(
      "bun_memory_current",
      "gauge",
      "Current memory usage in bytes",
      [{ value: mem.current }],
    );
    agg.observe(
      "bun_memory_current_commit",
      "gauge",
      "Current committed memory in bytes",
      [{ value: mem.currentCommit }],
    );
    agg.observe(
      "bun_memory_peak",
      "gauge",
      "Peak memory usage in bytes",
      [{ value: mem.peak }],
    );
    agg.observe(
      "bun_memory_peak_commit",
      "gauge",
      "Peak committed memory in bytes",
      [{ value: mem.peakCommit }],
    );
    agg.observe(
      "bun_memory_page_faults",
      "counter",
      "Number of page faults",
      [{ value: mem.pageFaults }],
    );
  }

  private observeHeap(agg: Aggregator) {
    const heap = jsc.heapStats();

    agg.observe(
      "bun_heap_heap_size",
      "gauge",
      "Current heap size in bytes",
      [{ value: heap.heapSize }],
    );
    agg.observe(
      "bun_heap_heap_capacity",
      "gauge",
      "Current heap capacity in bytes",
      [{ value: heap.heapCapacity }],
    );
    agg.observe(
      "bun_heap_extra_memory_size",
      "gauge",
      "Extra memory size in bytes",
      [{ value: heap.extraMemorySize }],
    );

    agg.observe(
      "bun_heap_object_count",
      "gauge",
      "Number of objects in the heap by type",
      Object.entries(heap.objectTypeCounts).map(
        ([type, count]) => ({ value: count, labels: { type } }),
      ),
    );
    agg.observe(
      "bun_heap_object_count_total",
      "gauge",
      "Number of objects in the heap",
      [{ value: heap.objectCount }],
    );

    agg.observe(
      "bun_heap_protected_object_count",
      "gauge",
      "Number of protected objects in the heap by type",
      Object.entries(heap.protectedObjectTypeCounts).map(
        ([type, count]) => ({ value: count, labels: { type } }),
      ),
    );
    agg.observe(
      "bun_heap_protected_object_count_total",
      "gauge",
      "Number of protected objects in the heap",
      [{ value: heap.protectedObjectCount }],
    );

    agg.observe(
      "bun_heap_global_object_count",
      "gauge",
      "Number of global objects in the heap",
      [{ value: heap.globalObjectCount }],
    );
    agg.observe(
      "bun_heap_protected_global_object_count",
      "gauge",
      "Number of protected global objects in the heap",
      [{ value: heap.protectedGlobalObjectCount }],
    );
  }

  private observeCpu(agg: Aggregator) {
    const cpu = process.cpuUsage();
    agg.observe(
      "bun_cpu_usage",
      "counter",
      "CPU time spent in user mode in microseconds",
      [{ value: cpu.user, labels: { mode: "user" } }],
    );
    agg.observe(
      "bun_cpu_usage",
      "counter",
      "CPU time spent in system mode in microseconds",
      [{ value: cpu.system, labels: { mode: "system" } }],
    );
  }

  private observeUptime(agg: Aggregator) {
    agg.observe(
      "bun_process_uptime_seconds",
      "gauge",
      "Process uptime in seconds",
      [{ value: process.uptime() }],
    );
  }
}
