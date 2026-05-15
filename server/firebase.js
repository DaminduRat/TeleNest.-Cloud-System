const admin = require('firebase-admin');

// We'll use environment variables for Firebase initialization.
// The private key needs to handle escaped newlines.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (err) {
    console.error('Firebase initialization error:', err.message);
  }
} else {
  console.warn('Firebase environment variables missing. Firestore functionality will be disabled.');
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { db, admin };
