import type { RequestOptions } from 'https'
import https from 'https'
import http from 'http'
import { exec } from 'child_process'

export async function execCmd(cmd: string, cwd: string) {
  const result = await new Promise<string | undefined>((rs, rj) => {
    exec(cmd, {cwd}, (e: Error | null, output: string) => {
      if(e) {
        rj(e)
      } else {
        const result = output.trim() === 'undefined' ? undefined : output.trim()
        rs(result)
      }
    })
  })
  return result
}

/** size unit: B */
export function formatByteSize(size: number) {
  if (Math.log10(size) < 3) {
    return size + 'B'
  } else if (Math.log10(size) < 6) {
    return (size / 1024).toFixed(1) + 'kB'
  } else {
    return (size/1024/1024).toFixed(1) + 'MB'
  }
}

export function formatTimeBySize(size: number) {
  // 4G download speed(KB/s), data from http://www.webpagetest.org/
  const downloadSpeed = 7000 / 8 
  const time = size / 1024 / downloadSpeed
  if (time < 0.0005) {
    return Math.round(time * 1000000) + 'μs'
  } else if (time < 0.5) {
    return Math.round(time * 1000) + 'ms'
  } else {
    return Math.round(time) + 's'
  }
}

export function formatTexts2Table(texts: string[][]) {
  const head = `
| <!-- --> | <!-- --> |
|----------|----------|
  `
  const body = texts.map(text => '| ' + text.join(' | ') + ' |\n').join('')
  return head + body
}

export function alignTexts(texts: string[][]) {
  const maxTitleLength = texts.reduce((length, [title]) => Math.max(title.length, length), 0)
  const paddedText = texts.map(([title, desc]) => [padText(title, maxTitleLength), desc].join('')).join('\n')
  return paddedText

  function padText(text: string, length: number) {
    let paddedText = text
    for(let i = text.length; i < length; i++) {
      paddedText += '&nbsp;'
    }
    return paddedText
  }
}

export function fetch(url: string, options?: RequestOptions): Promise<Record<string, any>> {
  const client = url.startsWith('https:') ? https : http
  const opts = { headers: { 'Content-Type': 'application/json', }, ...options }
  return new Promise((resolve, reject) => {
    const req = client.request(url, opts, res => {
        const { statusCode, headers } = res
        if(statusCode && statusCode >= 200 && statusCode < 300) {
          let data = ''
          res.on('data', chunk => data += chunk)
            .on('end', () => {
              try {
                const json = JSON.parse(data)
                resolve(json)
              } catch(e) {
                reject(e)
              }
            })
            .on('error', e => reject(e))
        } else if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
          // follow redirects
          // The location for some (most) redirects will only contain the path,  not the hostname;
          // detect this and add the host to the path.
          const withHost = /http(s?):/.test(headers.location)
          const redirectUrl = withHost 
            ? headers.location
            : new URL(headers.location, req.getHeader('host') as string).href
          fetch(redirectUrl, options).then(resolve, reject)
        } else {
          reject(res)
        }
      }
    )
    req.end()
  })
}

export function createReg(regRaw: string) {
  const [_raw, _prefix, reg, flags] = String(regRaw).match(/(\/?)(.+)\1([a-z]*)/i)!
  return new RegExp(reg, flags)
}