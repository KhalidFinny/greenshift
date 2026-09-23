/* The Step 2 figures, in the shape every reader of the funding case takes them.
 *
 * The wizard holds them as typed text and parses them once at the boundary; the
 * API stores them as numbers and returns them as numbers. One interface, so the
 * forecast, the reading and the summary panel cannot disagree about what the
 * project's money is.
 */
export interface ProjectFunding {
	capexRp: number | null;
	tenorTahun: number | null;
	penghematanRp: number | null;
	pendapatanRp: number | null;
}
