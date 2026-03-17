export const randomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}

export const startArgs = (x1: number, x2: number): [x1: bigint, x2: bigint] => {
    return [BigInt(x1), BigInt(x2)];
}