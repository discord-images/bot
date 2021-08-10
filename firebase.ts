import admin = require("firebase-admin");
const serviceAccount = require("../admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export { db };
