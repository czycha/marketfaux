import Cookies from 'js-cookie'
import Url from 'url-parse'
import wretch from 'wretch'

function isFormElement (element: unknown): element is HTMLFormElement {
  return typeof element === 'object' && element != null && element.constructor.name === 'HTMLFormElement'
}

function dupes<T> (arr: T[]): T[] {
  const duplicates: T[] = []
  const originals: T[] = []
  for (const item of arr) {
    if (originals.indexOf(item) === -1) {
      originals.push(item)
    } else if (duplicates.indexOf(item) === -1) {
      duplicates.push(item)
    }
  }
  return duplicates
}

function bracketize (data: FormData): FormData {
  const res = new FormData()
  const duplicates = dupes([...data.keys()])
  for (const entry of data.entries()) {
    const [key, value] = entry
    if (duplicates.indexOf(key) !== -1 && !/\[\]$/.test(key)) {
      res.append(`${key}[]`, value)
    } else {
      res.append(key, value)
    }
  }
  return res
}

/**
 * Send Marketo form data.
 *
 * @example
 * sendData("//app-sjqe.marketo.com", "718-GIV-198", 621, { FirstName: "Billy", LastName: "Eyelash" })
 *
 * @see {@link https://npm.im/wretch|wretch}
 */
export function sendData (domain: string, munchkinId: string, formId: number | string, formData: Record<string, any> | FormData) {
  const { Munchkin } = window as any
  if (Munchkin) {
    try {
      Munchkin.createTrackingCookie(true);
    } catch (e) { }
  }
  const url = new Url(domain)
  url.set('pathname', '/index.php/leadCapture/save2')
  const trackingToken = Cookies.get('_mkto_trk')
  let req = wretch(url.href)
    .options({ mode: 'cors', credentials: 'same-origin' })
    .accept('application/json')
  if (formData instanceof FormData) {
    const newData = bracketize(formData)
    newData.append('formid', formId.toString())
    newData.append('munchkinId', munchkinId)
    newData.append('formVid', formId.toString())
    if (trackingToken != null) {
      newData.append('_mkt_trk', trackingToken)
    }
    newData.append('_mktoReferrer', window.location.href)
    req = req.body(newData)
  } else if (typeof formData === 'object') {
    req = req.formData({
      ...formData,
      formid: formId,
      munchkinId,
      formVid: formId,
      '_mkt_trk': trackingToken,
      '_mktoReferrer': window.location.href
    })
  } else {
    throw new Error('Invalid form data. Must either be a key-value object or an instance of FormData.')
  }
  return req.post()
}

/**
 * Send Marketo form data based on an HTML form element.
 *
 * @example
 * sendForm("//app-sjqe.marketo.com", "718-GIV-198", 621, document.querySelector('form#my-form'));
 * @example
 * sendForm("//app-sjqe.marketo.com", "718-GIV-198", 621, 'form#my-form');
 *
 * @see {@link https://npm.im/wretch|wretch}
 */
export function sendForm (domain: string, munchkinId: string, formId: number | string, form: HTMLFormElement | string) {
  const el = typeof form === 'string' ? document.querySelector(form) : form
  if (el == null || !isFormElement(el)) {
    throw new Error('Invalid form element')
  }
  const formData = new FormData(el)
  return sendData(domain, munchkinId, formId, formData)
}

/**
 * Send Marketo form data based on either an HTML form element or raw data.
 *
 * @example
 * send("//app-sjqe.marketo.com", "718-GIV-198", 621, document.querySelector('form#my-form'));
 * @example
 * send("//app-sjqe.marketo.com", "718-GIV-198", 621, { FirstName: "Billy", LastName: "Eyelash" }))
 *
 * @see {@link https://npm.im/wretch|wretch}
 */
export function send (domain: string, munchkinId: string, formId: number | string, payload: HTMLFormElement | string | FormData | Record<string, any>) {
  if (typeof payload === 'string' || isFormElement(payload)) {
    return sendForm(domain, munchkinId, formId, payload)
  } else if (payload instanceof FormData || typeof payload === 'object') {
    return sendData(domain, munchkinId, formId, payload)
  } else {
    throw new Error('Unknown payload type')
  }
}
