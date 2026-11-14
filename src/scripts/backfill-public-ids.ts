import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "../config/database.js";
import {
  User,
  Application,
  Organization,
  Membership,
  Business,
  AuditLog,
} from "../modules/auth/auth.models.js";

// Run before deploying UUID-only clients. Internal references and sessions are unchanged.
try {
  await connectDB();
  for (const model of [
    User,
    Application,
    Organization,
    Membership,
    Business,
    AuditLog,
  ]) {
    const collection = mongoose.connection.collection(model.collection.name);
    let updated = 0;
    for await (const record of collection.find(
      { publicId: { $exists: false } },
      { projection: { _id: 1 } },
    )) {
      const result = await collection.updateOne(
        { _id: record._id, publicId: { $exists: false } },
        { $set: { publicId: randomUUID() } },
      );
      updated += result.modifiedCount;
    }
    await collection.createIndex(
      { publicId: 1 },
      { unique: true, sparse: true },
    );
    console.info(`${model.modelName}: assigned ${updated} public identifiers.`);
  }
} finally {
  await mongoose.disconnect();
}
