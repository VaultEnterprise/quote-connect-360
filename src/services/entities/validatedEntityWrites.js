import { base44 } from "@/api/base44Client";
import { validateEntityWrite } from "@/validation/schemaWriteValidator";

export function createValidatedEntityRecord(entityName, payload, requiredKeys = []) {
  return base44.entities[entityName].create(validateEntityWrite(entityName, payload, requiredKeys));
}

export function updateValidatedEntityRecord(entityName, id, payload, requiredKeys = []) {
  return base44.entities[entityName].update(id, validateEntityWrite(entityName, payload, requiredKeys));
}

export function updateManyValidatedEntityRecords(entityName, updates) {
  return Promise.all(
    updates.map(({ id, payload, requiredKeys = [] }) =>
      updateValidatedEntityRecord(entityName, id, payload, requiredKeys)
    )
  );
}

export function deleteManyEntityRecords(entityName, ids) {
  return Promise.all(ids.map((id) => base44.entities[entityName].delete(id)));
}