// Firebase Configuration for Persistent Cloud Database
// This configuration enables data storage that persists across devices and browsers

// IMPORTANT: Replace these placeholder values with your actual Firebase configuration
// Get these values from your Firebase Console: https://console.firebase.google.com/
// Go to Project Settings → Your Apps → Web App → Configuration

const firebaseConfig = {
  apiKey: "YOUR-ACTUAL-API-KEY-HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Example of what your config should look like:
// const firebaseConfig = {
//   apiKey: "AIzaSyB1234567890abcdefg",
//   authDomain: "timetrackerpro-12345.firebaseapp.com",
//   projectId: "timetrackerpro-12345",
//   storageBucket: "timetrackerpro-12345.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdef123456"
// };

// Initialize Firebase
let app = null;
let db = null;
let auth = null;

// Initialize Firebase app if not already initialized
if (!app) {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
}

// Database service functions
const databaseService = {
  // Add data to the database
  async addData(collection, data) {
    try {
      const docRef = await db.collection(collection).add({
        ...data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser ? auth.currentUser.uid : 'anonymous'
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  // Get all data from a collection
  async getAllData(collection) {
    try {
      const querySnapshot = await db.collection(collection).get();
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (error) {
      console.error("Error getting documents: ", error);
      throw error;
    }
  },

  // Update existing data
  async updateData(collection, docId, data) {
    try {
      await db.collection(collection).doc(docId).update(data);
      return true;
    } catch (error) {
      console.error("Error updating document: ", error);
      throw error;
    }
  },

  // Delete data
  async deleteData(collection, docId) {
    try {
      await db.collection(collection).doc(docId).delete();
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  },

  // Real-time listener for data changes
  listenToData(collection, callback) {
    return db.collection(collection).onSnapshot((querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      callback(data);
    });
  }
};

// Authentication functions
const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in: ", error);
      throw error;
    }
  },

  // Sign up with email and password
  async signUp(email, password) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up: ", error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await auth.signOut();
      return true;
    } catch (error) {
      console.error("Error signing out: ", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

// Export services for use in other files
window.databaseService = databaseService;
window.authService = authService;
