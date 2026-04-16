#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("Missing dependency: jsonschema", file=sys.stderr)
    print("Install with: pip install jsonschema", file=sys.stderr)
    sys.exit(2)

SCHEMA = json.loads(Path(__file__).with_name("schema.json").read_text(encoding="utf-8"))
WEAK_PATTERNS = [
    r"\bfixed issue\b",
    r"\bresolved bug\b",
    r"\bupdated logic\b",
    r"\bmade improvements\b",
    r"\bcleaned up\b",
    r"\bworking as expected\b",
    r"\bminor refactor\b",
    r"\bgeneral fix\b",
]
SYMPTOM_PATTERNS = [
    r"\bpage did not load\b",
    r"\bbutton was broken\b",
    r"\brender error\b",
    r"\bapi failed\b",
    r"\bnull error\b",
    r"\broute issue\b",
]

def load_json_from_input():
    if len(sys.argv) > 2:
        print("Usage: python base44_validator.py [response.json]", file=sys.stderr)
        sys.exit(2)
    try:
        if len(sys.argv) == 2:
            return json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        raw = sys.stdin.read()
        if not raw.strip():
            raise ValueError("No input provided.")
        return json.loads(raw)
    except FileNotFoundError as exc:
        print(f"File read error: {exc}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Input error: {exc}", file=sys.stderr)
        sys.exit(2)

def schema_errors(data):
    validator = Draft202012Validator(SCHEMA)
    errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))
    msgs = []
    for err in errors:
        path = ".".join(str(p) for p in err.absolute_path) or "<root>"
        msgs.append(f"{path}: {err.message}")
    return msgs

def has_weak_language(text):
    lowered = (text or "").lower()
    return any(re.search(p, lowered) for p in WEAK_PATTERNS)

def looks_like_symptom_not_root_cause(text):
    lowered = (text or "").lower().strip()
    return any(re.search(p, lowered) for p in SYMPTOM_PATTERNS)

def semantic_checks(data):
    errors = []
    pr = data["page_review"]
    if pr["review_sequence"] == 1 and pr["page_name"] != "Dashboard":
        errors.append("First reviewed page must be 'Dashboard'.")
    if pr["review_status"] != pr["final_status"]["disposition"]:
        errors.append("review_status must match final_status.disposition.")
    if pr["final_status"]["disposition"] == "complete" and pr["final_status"]["remaining_issues"]:
        errors.append("A complete disposition cannot include remaining_issues.")
    if pr["final_status"]["disposition"] in {"partial", "failed"} and not pr["final_status"]["remaining_issues"]:
        errors.append("A partial/failed disposition must include remaining_issues.")
    clean = pr["console_and_server_cleanliness"]
    if not clean["console_errors_present"] and not clean["network_errors_present"] and not clean["server_exceptions_present"] and not clean["silent_failures_present"]:
        if not re.search(r"(none|clean|no active errors|no active exceptions)", clean["details"], re.I):
            errors.append("Cleanliness details should explicitly state no active errors/exceptions/clean state.")
    esc = pr["enterprise_standard_confirmation"]
    false_flags = [k for k, v in esc.items() if k != "notes" and v is False]
    if pr["final_status"]["disposition"] == "complete" and false_flags:
        errors.append(f"Disposition cannot be complete when enterprise standards are false: {', '.join(false_flags)}.")
    for section, items in pr["dependency_map"].items():
        for item in items:
            if len(item.strip()) < 3:
                errors.append(f"dependency_map.{section} contains weak/empty entry.")
    seen_fp = set()
    for fp in pr["failure_point_inventory"]:
        if fp["failure_id"] in seen_fp:
            errors.append(f"Duplicate failure_id: {fp['failure_id']}")
        seen_fp.add(fp["failure_id"])
        if has_weak_language(fp["evidence"]):
            errors.append(f"{fp['failure_id']}: evidence is too vague.")
    seen_issues = set()
    for issue in pr["issues"]:
        if issue["issue_id"] in seen_issues:
            errors.append(f"Duplicate issue_id: {issue['issue_id']}")
        seen_issues.add(issue["issue_id"])
        if looks_like_symptom_not_root_cause(issue["root_cause"]):
            errors.append(f"{issue['issue_id']}: root_cause appears to describe a symptom, not a technical cause.")
        for field_name in ["root_cause", "failure_mechanism", "fix_implemented", "why_fix_is_correct", "impact"]:
            if has_weak_language(issue[field_name]):
                errors.append(f"{issue['issue_id']}: {field_name} contains weak/generic language.")
        if issue["status"] == "unresolved" and pr["final_status"]["disposition"] == "complete":
            errors.append(f"{issue['issue_id']}: unresolved issue cannot exist when disposition is complete.")
        if issue["status"] in {"fixed", "partially_fixed"} and not issue["validation_evidence"]:
            errors.append(f"{issue['issue_id']}: fixed/partially_fixed issue must include validation_evidence.")
    for key, block in pr["validation"].items():
        if block["reviewed"] is not True:
            errors.append(f"{key}: reviewed must be true.")
        if len(block["checks"]) < 2:
            errors.append(f"{key}: must include at least 2 checks.")
        for check in block["checks"]:
            if has_weak_language(check):
                errors.append(f"{key}: check contains weak language.")
    if len(pr["downstream_impact_analysis"]["regression_checks"]) < 2:
        errors.append("downstream_impact_analysis.regression_checks must include at least 2 items.")
    reviewed_layers = {fp["layer"] for fp in pr["failure_point_inventory"]}
    issue_layers = {i["layer"] for i in pr["issues"]}
    if len(pr["issues"]) >= 3 and not any(layer in issue_layers for layer in reviewed_layers):
        errors.append("Failure points were reviewed, but issues do not map to any reviewed layer.")
    return errors

def main():
    data = load_json_from_input()
    errors = schema_errors(data)
    if not errors:
        errors.extend(semantic_checks(data))
    if errors:
        print(json.dumps({"accepted": False, "rejection_count": len(errors), "reasons": errors}, indent=2))
        sys.exit(1)
    print(json.dumps({"accepted": True, "message": "Base44 response passed schema and enforcement validation."}, indent=2))
    sys.exit(0)

if __name__ == "__main__":
    main()