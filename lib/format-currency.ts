/**
 * Formatea un número como precio en pesos colombianos (COP)
 * @param amount - Cantidad a formatear
 * @param includeDecimals - Si debe incluir decimales (por defecto false)
 * @returns String formateado como "$XX.XXX" o "$XX.XXX,XX"
 */
export function formatCOP(amount: number, includeDecimals: boolean = false): string {
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0,
    });

    return formatter.format(amount);
}

/**
 * Formatea un número sin símbolo de moneda (para inputs)
 * @param amount - Cantidad a formatear  
 * @returns String formateado como "XX.XXX"
 */
export function formatNumber(amount: number): string {
    return new Intl.NumberFormat('es-CO').format(amount);
}
