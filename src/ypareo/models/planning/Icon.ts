export class Icon {
    /**
     * Creates a new Icon instance.
     * @param label - The label of the icon.
     * @param cssClass - The CSS class associated with the icon.
     */
    constructor(
        public readonly label: string,
        public readonly cssClass: string
    ) {}

    /**
     * Checks if the icon represents homework.
     * @returns True if the icon is for homework, false otherwise.
     */
    get isHomework(): boolean {
        return this.cssClass.includes('picto-blue-t')
    }

    /**
     * Converts the Icon instance to a JSON object.
     * @returns A JSON representation of the Icon instance.
     */
    toJSON(): Record<string, string | boolean> {
        return {
            label: this.label,
            cssClass: this.cssClass,
            isHomework: this.isHomework,
        }
    }
}
