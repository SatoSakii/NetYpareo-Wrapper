import { YpareoUrls } from "../types";

export const DEFAULTS_URLS: YpareoUrls = {
	login: "/index.php/login",
	auth: "/index.php/authentication",
	home: "/index.php/apprenant/accueil",
	planning: {
		default: "/index.php/apprenant/planning/courant",
		pdf: "/index.php/apprenant/planning/hebdo/pdf",
	},
	attendance: "/index.php/apprenant/assiduite"
}