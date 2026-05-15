const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('./server/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function wipe() {
  console.log('Wiping users collection...');
  await deleteCollection('users', 10);
  console.log('Wiping configs collection...');
  await deleteCollection('configs', 10);
  console.log('Database wiped successfully!');
  process.exit(0);
}

wipe().catch(err => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
