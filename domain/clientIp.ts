export function clientIpFrom(headers: {
  get(name: string): string | null;
}): string | null {
  const realHeader = headers.get("x-real-ip");
  if (realHeader !== null && realHeader.trim() !== "") {
    return publicAddress(realHeader);
  }
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded === null || forwarded.trim() === "") {
    return null;
  }
  const hops = forwarded.split(",");
  for (let i = hops.length - 1; i >= 0; i -= 1) {
    const ip = publicAddress(hops[i] ?? "");
    if (ip !== null) {
      return ip;
    }
  }
  return null;
}

function publicAddress(value: string): string | null {
  const ip = firstAddress(value);
  if (ip === null || !isPublicIp(ip)) {
    return null;
  }
  return ip;
}

function firstAddress(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const zone = trimmed.indexOf("%");
  const withoutZone = zone === -1 ? trimmed : trimmed.slice(0, zone);
  if (withoutZone.startsWith("[")) {
    const end = withoutZone.indexOf("]");
    if (end > 1) {
      return withoutZone.slice(1, end);
    }
  }
  const colonCount = (withoutZone.match(/:/g) ?? []).length;
  if (colonCount === 1) {
    return withoutZone.slice(0, withoutZone.lastIndexOf(":"));
  }
  return withoutZone;
}

function isPublicIp(ip: string): boolean {
  if (ip.includes(":")) {
    return isPublicIpv6(ip.toLowerCase());
  }
  return isPublicIpv4(ip);
}

function isPublicIpv6(ip: string): boolean {
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    return false;
  }
  if (ip.startsWith("::ffff:")) {
    return isPublicIpv4(ip.slice("::ffff:".length));
  }
  if (/^fe[89ab][0-9a-f]:/.test(ip)) {
    return false;
  }
  if (/^f[cd][0-9a-f]{2}:/.test(ip)) {
    return false;
  }
  return true;
}

function isPublicIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return false;
  }
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }
    const n = Number.parseInt(part, 10);
    if (n > 255) {
      return false;
    }
    octets.push(n);
  }
  const a = octets[0];
  const b = octets[1];
  if (a === undefined || b === undefined) {
    return false;
  }
  if (a === 127 || a === 10) {
    return false;
  }
  if (a === 192 && b === 168) {
    return false;
  }
  if (a === 169 && b === 254) {
    return false;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return false;
  }
  return true;
}
