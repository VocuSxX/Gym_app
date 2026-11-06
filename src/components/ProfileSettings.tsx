import { useState } from 'react'
import Tabs from './Tabs'
import ProfileForm from './ProfileForm'
import AccountSettings from './AccountSettings'
import ReminderSettings from './ReminderSettings'
import TdeeCalculator from './TdeeCalculator'
import WeeklyGoalCard from './WeeklyGoalCard'

// Ustawienia: Profil, Cele, Przypomnienia i Konto (zakładki zależą od roli)
export default function ProfileSettings({ session, profile, initialData, fetchProfile }: any) {
  const isGym = profile?.role === 'gym'
  const tabs = [
    { key: 'profile', label: 'Profil' },
    ...(isGym ? [] : [{ key: 'goals', label: 'Cele' }, { key: 'reminders', label: 'Przypomnienia' }]),
    { key: 'account', label: 'Konto' },
  ]
  const [tab, setTab] = useState('profile')

  return (
    <div className="max-w-2xl w-full pb-20 flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ustawienia</h1>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>
      <div key={tab} className="animate-fade-in">
        {tab === 'profile' && <ProfileForm session={session} profile={profile} initialData={initialData} fetchProfile={fetchProfile} />}
        {tab === 'goals' && (
          <div className="flex flex-col gap-6">
            <WeeklyGoalCard session={session} profile={profile} fetchProfile={fetchProfile} />
            <TdeeCalculator session={session} profile={profile} fetchProfile={fetchProfile} />
          </div>
        )}
        {tab === 'reminders' && <ReminderSettings session={session} profile={profile} fetchProfile={fetchProfile} />}
        {tab === 'account' && <AccountSettings session={session} profile={profile} fetchProfile={fetchProfile} />}
      </div>
    </div>
  )
}
