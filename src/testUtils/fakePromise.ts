export const fakePromise = <ResolveValue>(fn: any) => {
  return new Promise<ResolveValue>((resolve, reject) => {
    setTimeout(() => resolve(fn()), 0)
  })
}
