export async function GET() {
  return new Response('google-site-verification: google3c0b6378db7cdc4f.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
