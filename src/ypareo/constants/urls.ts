import { YpareoUrls } from "../types";

export const DEFAULTS_URLS: YpareoUrls = {
	login: "/index.php/login",
	auth: "/index.php/authentication",
	home: "/index.php/apprenant/accueil",
	planning: {
		planning: "/index.php/apprenant/planning/courant",
		pdf: "/index.php/apprenant/planning/hebdo/pdf",
		icalendar: "/index.php/planning/modal-icalendar-ressource"
	},
	attendance: "/index.php/apprenant/assiduite"
}