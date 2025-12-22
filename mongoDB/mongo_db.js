const dbName = "db_slaido";
const db = db.getSiblingDB(dbName);

/**
 * Collection: input
 * Stores incoming words for processing.
 */
db.createCollection("input", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["word"],
      properties: {
        word: {
          bsonType: "string",
          description: "Required: The word to be processed.",
        },
      },
    },
  },
  validationAction: "error",
});

/**
 * Collection: output
 * Stores processed words along with their assigned group numbers.
 */
db.createCollection("output", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["word", "group_number"],
      properties: {
        word: {
          bsonType: "string",
          description: "Required: The processed word.",
        },
        group_number: {
          bsonType: "int",
          description: "Required: The group number identifier.",
        },
      },
    },
  },
  validationAction: "error",
});

print(`Database '${dbName}' initialized with 'input' and 'output' collections.`);
