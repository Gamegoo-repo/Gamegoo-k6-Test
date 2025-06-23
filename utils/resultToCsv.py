import json
import csv

with open("results/summary.json") as f:
    summary = json.load(f)

metrics = summary["metrics"]

with open("data/results_summary.csv", "w", newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["metric", "avg", "p(95)", "max", "min", "count/rate"])

    for key, metric in metrics.items():
        writer.writerow([
            key,
            metric.get("avg", ""),
            metric.get("p(95)", ""),
            metric.get("max", ""),
            metric.get("min", ""),
            metric.get("count", metric.get("value", metric.get("rate", "")))
        ])