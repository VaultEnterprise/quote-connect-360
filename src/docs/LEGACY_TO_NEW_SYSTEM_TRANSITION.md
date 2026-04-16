# Legacy to New System Transition

## Legacy System Strategy
The current app should be treated as the legacy reference implementation, not the final foundation.

## Preserve
- current route vocabulary
- major entity names where still domain-correct
- business workflow intent
- high-value UI patterns
- user expectations around modules

## Replace
- page-owned business rules
- duplicated summary logic
- partial downstream mappings
- inline-only pricing version history
- incomplete integration behavior
- large page files as orchestration owners

## Transition Approach
1. Document legacy behavior.
2. Build new shared services and normalized data contracts.
3. Rebuild one module at a time on new architecture.
4. Cut pages over gradually to new services.
5. Validate each workflow before replacing the legacy version.

## Migration Guardrails
- no direct copy/paste of legacy page logic as final architecture
- every rebuilt page must depend on shared services
- every financial result must be traceable
- every workflow transition must be policy-driven
- every critical change must be auditable