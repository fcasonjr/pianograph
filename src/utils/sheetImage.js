import { toBlob } from 'html-to-image'
import { downloadFile, fileBase } from './download'

// The element passed in is the bare paper (no card border or shadow), so no style overrides are needed.
const RENDER_OPTIONS = { pixelRatio: 2, backgroundColor: '#ffffff' }

export async function renderSheetPng(element) {
  // html-to-image can return a blank image on its first pass in Safari, so render twice and keep the second.
  await toBlob(element, RENDER_OPTIONS)
  const blob = await toBlob(element, RENDER_OPTIONS)
  if (!blob) throw new Error('Image rendering returned nothing')
  return blob
}

// True when the browser can hand an image file to a native share sheet.
export function canShareImageFiles() {
  try {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
    return navigator.canShare({ files: [new File([''], 'sheet.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

export function downloadSheetPng(blob, title) {
  downloadFile(`${fileBase(title)}.png`, blob, 'image/png')
}

// Must be called synchronously from a click handler with an already-rendered blob: iOS Safari only
// allows share() during a user gesture, and rendering the image after the tap can lose that activation.
export async function shareSheetPng(blob, title) {
  const file = new File([blob], `${fileBase(title)}.png`, { type: 'image/png' })
  try {
    await navigator.share({ files: [file], title: title.trim() || 'Pianograph' })
  } catch (error) {
    if (error?.name === 'AbortError') return // the user dismissed the share sheet
    downloadSheetPng(blob, title) // share failed for another reason: fall back to a download
  }
}
