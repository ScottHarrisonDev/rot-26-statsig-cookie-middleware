import { parse } from "cookie"

export interface Env {
  SITE_URL: string
}

const USER_COOKIE_NAME = 'userUUID'

// Node Crypto library is not supported in CF worker so use this quick one liner for now
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c === 'x' ? (Math.random() * 16 | 0) : (Math.random() * 16 | 0 & 0x3 | 0x8)).toString(16));

const getUserUUIDFromCookie = (req): string => {
  const cookies = parse(req.headers.get('Cookie') || '')

  return cookies[USER_COOKIE_NAME]
}

export default {
  async fetch(request, env, ctx) {

    let userUUID = getUserUUIDFromCookie(request)
    let cookieToSet: null | string = null

    const siteUrl = env.SITE_URL; // This is pointing to http://localhost:8788

    if (!userUUID) {
      userUUID = uuidv4()
      cookieToSet = `${USER_COOKIE_NAME}=${userUUID}`
    }

    let response = await fetch(`${siteUrl}${new URL(request.url).pathname}`, {
      method: 'GET',
      headers: {
        'Cookie': `${USER_COOKIE_NAME}=${userUUID}`
      },
    });

    let newResponse = new Response(response.body , {
      status: response.status,
      headers: response.headers
    });

    if (cookieToSet) {
      newResponse.headers.set("Set-Cookie", cookieToSet)
    }

    return newResponse
  },
}
