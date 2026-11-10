import { useEffect } from 'react'

const SITE_NAME = 'iPhone Hub'
const DEFAULT_TITLE = 'iPhone Hub — Premium iPhones & Accessories in Myanmar'
const DEFAULT_DESCRIPTION =
  'Shop the latest iPhone 18, iPhone 17 and iPhone Air with genuine accessories at iPhone Hub. Free delivery over Ks 5,000,000, 7-day returns and 1-year warranty across Myanmar.'

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!content) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function absoluteUrl(value) {
  if (!value) return null
  return value.startsWith('http') ? value : new URL(value, window.location.origin).href
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image = '/og-image.png',
  url,
  type = 'website',
  noindex = false,
  jsonLd = null,
  keywords,
}) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    const fullTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`
      : DEFAULT_TITLE
    const canonical = absoluteUrl(url) || window.location.origin + window.location.pathname
    const imageUrl = absoluteUrl(image) || absoluteUrl('/og-image.png')

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('name', 'keywords', keywords)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setLink('canonical', canonical)

    document.getElementById('iphone-hub-jsonld')?.remove()
    if (jsonLdString) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'iphone-hub-jsonld'
      script.textContent = jsonLdString
      document.head.appendChild(script)
    }
  }, [title, description, image, url, type, noindex, keywords, jsonLdString])

  return null
}

export { DEFAULT_DESCRIPTION, DEFAULT_TITLE }
