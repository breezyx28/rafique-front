export function remainingPackages(meters: number, packageMeters: number) {
  const perPackage = Number(packageMeters) || 20
  if (perPackage <= 0) return 0
  return Number(meters) / perPackage
}

export function metersFromPackages(packages: number, packageMeters: number) {
  return Number(packages) * (Number(packageMeters) || 20)
}

export function formatPackages(value: number) {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function fabricStockLabel(name: string, meters: number, packageMeters: number) {
  return `${name} (${Number(meters).toLocaleString()} m · ${formatPackages(remainingPackages(meters, packageMeters))} pkg)`
}
