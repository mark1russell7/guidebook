// The open cells of the coverage gate: each key and horizon from 5 minutes to 5 years that has no step yet.
// The coverage gate fails each of them. A test holds this list, so it can only get shorter.

/**
 * The cells with no step, as `<key>/<phase>`, in the sequence of the matrix.
 * Each cell is open until a cited step fills it. The items G8, G9 and G10 of the roadmap fill them.
 */
export const OPEN_CELLS: readonly string[] = [];
