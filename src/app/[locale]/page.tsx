import { redirect } from 'next/navigation'

type Params = Promise<{ locale: string }>

export default async function Home({ params }: { params: Params }) {
  const { locale } = await params
  redirect(`/${locale}/dashboard`)
}
