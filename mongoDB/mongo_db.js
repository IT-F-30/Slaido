const dbName = "db_slaido";
const targetDb = db.getSiblingDB(dbName);

targetDb.createCollection("output", {
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

print("✓ Database initialization complete!");
