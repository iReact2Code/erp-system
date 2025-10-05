import { redirect } from 'next/navigation'

export default function RootRedirect() {
  // Redirect bare root to the default locale root. Middleware handles detection; default is 'en'.
  redirect('/en')
}
