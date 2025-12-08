/**
 * Converts a Buffer, ArrayBuffer, or string to an HTML string.
 * @param data - The data to convert.
 * @param encoding - The encoding to use when converting Buffer or ArrayBuffer. Defaults to 'latin1'.
 * @returns The HTML string.
 */
export function bufferToHtml(
    data: any,
    encoding: BufferEncoding = 'latin1'
): string {
    if (Buffer.isBuffer(data)) return data.toString(encoding);
    if (data instanceof ArrayBuffer)
        return Buffer.from(data).toString(encoding);
    if (typeof data === 'string') return data;

    throw new TypeError('Data must be a Buffer, ArrayBuffer, or string');
}
