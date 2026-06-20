from prometheus_client import Counter, Histogram, Gauge

# Counters
EXECUTOR_REQUESTS_TOTAL = Counter(
    "executor_requests_total",
    "Total number of processed tasks by the executor",
    ["status"] # success, failure, 429
)

EXECUTOR_RETRIES_TOTAL = Counter(
    "executor_retries_total",
    "Total number of retried tasks"
)

# Histograms
EXECUTOR_LATENCY_SECONDS = Histogram(
    "executor_latency_seconds",
    "HTTP request latency in seconds",
    ["method"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Gauges
EXECUTOR_ACTIVE_WORKERS = Gauge(
    "executor_active_workers",
    "Number of active worker engine tasks running"
)

EXECUTOR_QUEUE_DEPTH = Gauge(
    "executor_queue_depth",
    "Number of tasks in the queue",
    ["priority"] # critical, high, medium, low
)
from prometheus_client import Counter, Histogram, Gauge

# Counters
TASKS_PROCESSED_TOTAL = Counter(
    "tasks_processed_total",
    "Total number of processed tasks",
    ["status"] # e.g. success, failed, error
)

TASKS_RETRIED_TOTAL = Counter(
    "tasks_retried_total",
    "Total number of retried tasks"
)

# Histograms
HTTP_REQUEST_LATENCY = Histogram(
    "http_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "status_code"],
    buckets=[0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

# Gauges
ACTIVE_WORKERS = Gauge(
    "active_workers",
    "Number of active workers"
)

QUEUE_DEPTH = Gauge(
    "queue_depth",
    "Number of tasks in the queue",
    ["queue_name"]
)
