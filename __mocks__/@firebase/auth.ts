export const auth = {
  currentUser: null,
};

export async function signInWithEmailAndPassword() {
  return { user: { uid: "test-user" } };
}

export async function signOut() {
  auth.currentUser = null;
}