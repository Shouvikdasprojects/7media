export const onRequest = async (context: any) => {
  const url = new URL(context.request.url)
  
  if (url.pathname === '/google3c0b6378db7cdc4f.html') {
    return new Response('google-site-verification: google3c0b6378db7cdc4f.html', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  const backendHost = 'sevenmedia.onrender.com'
  url.hostname = backendHost
  url.protocol = 'https:'
  url.port = ''

  const modifiedHeaders = new Headers(context.request.headers)
  modifiedHeaders.set('x-forwarded-host', context.request.headers.get('host') || url.hostname)
  modifiedHeaders.set('x-forwarded-proto', 'https')

  const proxyRequest = new Request(url.toString(), {
    method: context.request.method,
    headers: modifiedHeaders,
    body: context.request.body,
    redirect: 'follow',
  })

  try {
    const response = await fetch(proxyRequest)
    const responseHeaders = new Headers(response.headers)
    
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/')) {
      responseHeaders.set('cache-control', 'public, max-age=31536000, immutable')
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (err: any) {
    return new Response('7MEDIA Edge Gateway Connecting to Server... Please reload in 5 seconds.', {
      status: 502,
      headers: { 'content-type': 'text/plain' },
    })
  }
}
