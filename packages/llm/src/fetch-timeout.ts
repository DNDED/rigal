export function createFetchSignal(signal?: AbortSignal, timeoutMs = 120000): AbortSignal {
  if (!signal) return AbortSignal.timeout(timeoutMs)

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
  }

  const controller = new AbortController()
  const onAbort = () => controller.abort((signal as any)?.reason)

  signal.addEventListener("abort", onAbort, { once: true })
  const timer = setTimeout(() => {
    signal.removeEventListener("abort", onAbort)
    controller.abort(new DOMException("Fetch timed out", "TimeoutError"))
  }, timeoutMs)

  return controller.signal
}
