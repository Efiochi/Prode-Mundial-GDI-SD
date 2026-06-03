'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  displayName: string
  userId: string
}

export default function ProfileEditForm({ displayName: initialName, userId }: Props) {
  const [displayName, setDisplayName] = useState(initialName)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function showMsg(msg: string, isError = false) {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  async function handleSaveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', userId)
    if (err) showMsg('Error al guardar el nombre.', true)
    else showMsg('Nombre actualizado ✓')
    setSavingName(false)
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) { showMsg('La contraseña debe tener al menos 6 caracteres.', true); return }
    if (newPassword !== confirmPassword) { showMsg('Las contraseñas no coinciden.', true); return }
    setSavingPwd(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) showMsg('Error: ' + err.message, true)
    else {
      showMsg('Contraseña actualizada ✓')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPwd(false)
  }

  const inputClass = 'w-full px-3 py-2 bg-[#F0F7FF] border border-[#BBD9EE] rounded-lg text-[#003049] text-sm focus:outline-none focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all'

  return (
    <div className="space-y-6">
      {/* Display name */}
      <div>
        <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-2">
          Nombre para mostrar
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className={inputClass + ' flex-1'}
          />
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="px-4 py-2 bg-[#236391] text-white text-xs font-bold rounded-lg hover:bg-[#1a4f73] disabled:opacity-60 transition-all"
          >
            {savingName ? '...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-mono font-semibold text-[#4A6270] uppercase tracking-widest mb-2">
          Cambiar contraseña
        </label>
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={handleChangePassword}
            disabled={savingPwd || !newPassword}
            className="w-full py-2 bg-[#003049] text-white text-xs font-bold rounded-lg hover:bg-[#001929] disabled:opacity-60 transition-all"
          >
            {savingPwd ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>

      {message && (
        <p className="text-green-600 text-sm font-medium text-center">{message}</p>
      )}
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
