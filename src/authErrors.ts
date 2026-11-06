// Tłumaczenie typowych błędów Supabase Auth na polski
export const translateError = (msg: string) => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.'
  if (m.includes('already registered')) return 'Konto z takim e-mailem już istnieje.'
  if (m.includes('password should be at least')) return 'Hasło musi mieć co najmniej 6 znaków.'
  if (m.includes('email not confirmed')) return 'Potwierdź e-mail, klikając link w wiadomości.'
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'Podaj poprawny adres e-mail.'
  if (m.includes('rate limit')) return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
  return msg
}
