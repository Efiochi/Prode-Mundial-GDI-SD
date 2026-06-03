import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminMatchForm from '@/components/AdminMatchForm'
import Navbar from '@/components/Navbar'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-6">Admin — Partidos</h1>
        <AdminMatchForm matches={matches ?? []} />
      </main>
    </div>
  )
}
