export type DayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeekCode = number;
export type ResourceType = 5000 | 6500 | 7000 | 7500;
export type SessionType = 81500 | 81501 | 81502;
export type ExportMode = 'calendrier' | 'detaille' | 'detaille-mensuel';
export type TimeString = `${number}${number}:${number}${number}`;

export interface RawPlanningData {
	configuration: {
		modeAffichage: number;
		orientationPaysage: boolean;
		autoSize: boolean;
		zoom: number;
		afficheContraintes: boolean;
		couleurSeanceRegroupement: string;
		afficheTitreEnteteLigne: boolean;
		afficheTitreEnteteColonne: boolean;
		minuteDebut: number;
		minuteFin: number;
		jours: number[];
	};
	semaines: Array<{
		code: number;
		libelle: string;
		dateDebut: string;
		ressources: Array<{
			code: number;
			type: number;
			libelle: string;
			libelleType: string;
			seances: Array<{
				code: number;
				type: number;
				couleur: string;
				libelle: string;
				numJour: number;
				minuteDebut: number;
				duree: number;
				numSemaine: number;
				classes: string;
				contextualMenu: string;
				detail: string[];
				icones: Array<{
					libelle: string;
					classe: string;
				}>;
				metadatas: {
					codeMatiere: number;
					coeff: number;
					codesGroupes: number[];
				};
			}>;
			contraintes: Array<{
				numSemaine: number;
				numJour: number;
				minuteDebut: number;
				duree: number;
				couleur: string;
			}>;
		}>;
	}>;
}
