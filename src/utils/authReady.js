import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'

/** Resolve Firebase user after persistence has restored (first auth tick). */
export function getFirebaseUserWhenReady() {
  if (!auth) return Promise.resolve(null)
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}
