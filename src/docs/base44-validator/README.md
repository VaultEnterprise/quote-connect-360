# Base44 Validator Repo

This folder contains a strict response contract and two runtime validators for Base44 remediation reports.

## Files

- `schema.json` — machine-checkable JSON schema
- `base44_validator.py` — Python validator
- `base44-validator.js` — Node validator
- `sample_response.json` — valid sample payload

## Python

Install:

```bash
pip install jsonschema
```

Run:

```bash
python base44_validator.py sample_response.json
```

Or:

```bash
cat sample_response.json | python base44_validator.py
```

## Node

Install:

```bash
npm install ajv ajv-formats
```

Run:

```bash
node base44-validator.js sample_response.json
```

Or:

```bash
cat sample_response.json | node base44-validator.js
```

## Behavior

The validators:

1. Parse JSON
2. Validate against `schema.json`
3. Apply semantic enforcement checks
4. Exit with non-zero status on rejection

## Exit Codes

- `0` = accepted
- `1` = rejected
- `2` = usage or input error