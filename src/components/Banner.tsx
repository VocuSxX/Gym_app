import { bannerError, bannerSuccess } from '../ui'

export default function Banner({ type, message }: { type: 'error' | 'success'; message: string }) {
  if (!message) return null
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={type === 'error' ? bannerError : bannerSuccess}>
      {message}
    </div>
  )
}
