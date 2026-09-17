const fs = require('fs')
const path = require('path')
const webpush = require('web-push')
const dotenv = require('dotenv')
const file = path.join(__dirname, '..', '.env')
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const env = dotenv.parse(text)
const subject = process.argv[2] || env.VAPID_SUBJECT
if (!subject || !/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject)) {
  console.error(
    'Usage: npm run push:setup -- mailto:you@your-domain.com (or your public HTTPS URL)'
  )
  process.exit(1)
}
if (!!env.VAPID_PUBLIC_KEY !== !!env.VAPID_PRIVATE_KEY) {
  console.error(
    'Incomplete VAPID key pair in .env; restore the missing key before continuing.'
  )
  process.exit(1)
}
const keys = env.VAPID_PUBLIC_KEY
  ? { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY }
  : webpush.generateVAPIDKeys()
const retained = text
  .split('\n')
  .filter((line) => !/^VAPID_(PUBLIC_KEY|PRIVATE_KEY|SUBJECT)=/.test(line))
  .join('\n')
  .trimEnd()
fs.writeFileSync(
  file,
  `${retained}\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=${subject}\n`,
  { mode: 0o600 }
)
console.log(
  'Push configuration saved to backend/.env. Existing keys preserved; no keys printed.'
)
