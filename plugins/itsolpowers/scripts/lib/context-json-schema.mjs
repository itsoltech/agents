const SUPPORTED_KEYWORDS = new Set([
  "$defs",
  "$id",
  "$ref",
  "$schema",
  "additionalProperties",
  "const",
  "enum",
  "items",
  "maxItems",
  "maxLength",
  "maximum",
  "minItems",
  "minLength",
  "minimum",
  "pattern",
  "properties",
  "required",
  "title",
  "type",
  "uniqueItems",
]);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function resolveReference(rootSchema, reference) {
  if (!reference.startsWith("#/")) {
    fail(`unsupported JSON Schema reference: ${reference}`);
  }
  let current = rootSchema;
  for (const rawPart of reference.slice(2).split("/")) {
    const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObject(current) || !(part in current)) {
      fail(`unresolved JSON Schema reference: ${reference}`);
    }
    current = current[part];
  }
  return current;
}

function inspectSchema(schema, location = "$") {
  if (!isObject(schema)) {
    fail(`${location} schema must be an object`);
  }
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_KEYWORDS.has(keyword)) {
      fail(`${location} uses unsupported JSON Schema keyword: ${keyword}`);
    }
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const allowed = new Set([
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string",
    ]);
    if (types.length === 0 || types.some((type) => !allowed.has(type))) {
      fail(`${location}.type contains an unsupported type`);
    }
  }
  if (schema.pattern !== undefined) {
    try {
      new RegExp(schema.pattern);
    } catch (error) {
      fail(`${location}.pattern is invalid: ${error.message}`);
    }
  }
  for (const [name, child] of Object.entries(schema.properties ?? {})) {
    inspectSchema(child, `${location}.properties.${name}`);
  }
  if (schema.items !== undefined) {
    inspectSchema(schema.items, `${location}.items`);
  }
  for (const [name, child] of Object.entries(schema.$defs ?? {})) {
    inspectSchema(child, `${location}.$defs.${name}`);
  }
}

function validateNode(value, schema, rootSchema, location) {
  if (schema.$ref !== undefined) {
    validateNode(value, resolveReference(rootSchema, schema.$ref), rootSchema, location);
    return;
  }
  if (schema.const !== undefined && !Object.is(value, schema.const)) {
    fail(`${location} must equal ${JSON.stringify(schema.const)}`);
  }
  if (
    schema.enum !== undefined &&
    !schema.enum.some((candidate) => Object.is(candidate, value))
  ) {
    fail(`${location} is not an allowed enum value`);
  }
  if (schema.type !== undefined) {
    const actual = valueType(value);
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeMatches = expected.some(
      (type) =>
        type === actual ||
        (type === "number" && typeof value === "number" && Number.isFinite(value)),
    );
    if (!typeMatches) {
      fail(`${location} must have type ${expected.join("|")}; got ${actual}`);
    }
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      fail(`${location} is shorter than minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      fail(`${location} exceeds maxLength ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      fail(`${location} does not match pattern ${schema.pattern}`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      fail(`${location} is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      fail(`${location} exceeds maximum ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      fail(`${location} has fewer than minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      fail(`${location} exceeds maxItems ${schema.maxItems}`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) {
        fail(`${location} must contain unique items`);
      }
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) =>
        validateNode(item, schema.items, rootSchema, `${location}[${index}]`),
      );
    }
  }
  if (isObject(value)) {
    for (const required of schema.required ?? []) {
      if (!(required in value)) {
        fail(`${location} is missing required property: ${required}`);
      }
    }
    if (schema.additionalProperties === false) {
      const known = new Set(Object.keys(schema.properties ?? {}));
      const unknown = Object.keys(value).filter((key) => !known.has(key));
      if (unknown.length > 0) {
        fail(`${location} has unknown properties: ${unknown.join(", ")}`);
      }
    }
    for (const [name, childSchema] of Object.entries(schema.properties ?? {})) {
      if (name in value) {
        validateNode(value[name], childSchema, rootSchema, `${location}.${name}`);
      }
    }
  }
}

export function compileJsonSchema(schema, label = "schema") {
  inspectSchema(schema, label);
  return (value, valueLabel = "value") =>
    validateNode(value, schema, schema, valueLabel);
}
