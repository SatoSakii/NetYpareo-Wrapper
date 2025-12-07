import * as cheerio from 'cheerio'

import type { PlanningManager } from '../../managers'
import { DayNumber, ResourceType, SessionType } from '../../models'
import { Configuration } from '../../models/planning/Configuration'
import { Constraint } from '../../models/planning/Constraint'
import { Icon } from '../../models/planning/Icon'
import { Metadata } from '../../models/planning/Metadata'
import { Planning } from '../../models/planning/Planning'
import { Resource } from '../../models/planning/Resource'
import { Session } from '../../models/planning/Session'
import { Week } from '../../models/planning/Week'

interface RawPlanningData {
    configuration: {
        modeAffichage: number
        orientationPaysage: boolean
        autoSize: boolean
        zoom: number
        afficheContraintes: boolean
        couleurSeanceRegroupement: string
        afficheTitreEnteteLigne: boolean
        afficheTitreEnteteColonne: boolean
        minuteDebut: number
        minuteFin: number
        jours: number[]
    }
    semaines: Array<{
        code: number
        libelle: string
        dateDebut: string
        ressources: Array<{
            code: number
            type: number
            libelle: string
            libelleType: string
            seances: Array<{
                code: number
                type: number
                couleur: string
                libelle: string
                numJour: number
                minuteDebut: number
                duree: number
                numSemaine: number
                classes: string
                contextualMenu: string
                detail: string[]
                icones: Array<{
                    libelle: string
                    classe: string
                }>
                metadatas: {
                    codeMatiere: number
                    coeff: number
                    codesGroupes: number[]
                }
            }>
            contraintes: Array<{
                numSemaine: number
                numJour: number
                minuteDebut: number
                duree: number
                couleur: string
            }>
        }>
    }>
}

/**
 * Parses the planning data from the provided HTML content.
 * @param html The HTML content containing the planning data.
 * @param manager The PlanningManager instance.
 * @returns The parsed Planning instance.
 */
export function parsePlanning(
    html: string,
    manager: PlanningManager
): Planning {
    const raw = extractPlanningJSON(html)
    return buildPlanning(raw, manager)
}

function extractPlanningJSON(html: string): RawPlanningData {
    const $ = cheerio.load(html)

    let planningData: RawPlanningData | null = null

    $('script').each((_, script) => {
        const content = $(script).html()
        if (content?.includes('var planningJSON')) {
            const match = content.match(/var planningJSON\s*=\s*({.*?});/s)
            if (match) {
                try {
                    planningData = JSON.parse(match[1])
                } catch (error) {
                    throw new Error(`Failed to parse planning JSON: ${error}`)
                }
            }
        }
    })

    if (!planningData) throw new Error('Planning JSON not found in HTML')

    return planningData
}

function buildPlanning(
    raw: RawPlanningData,
    manager: PlanningManager
): Planning {
    const configuration = new Configuration(
        raw.configuration.modeAffichage,
        raw.configuration.orientationPaysage,
        raw.configuration.autoSize,
        raw.configuration.zoom,
        raw.configuration.afficheContraintes,
        raw.configuration.couleurSeanceRegroupement,
        raw.configuration.afficheTitreEnteteLigne,
        raw.configuration.afficheTitreEnteteColonne,
        raw.configuration.minuteDebut,
        raw.configuration.minuteFin,
        raw.configuration.jours
    )

    const weeks = raw.semaines.map((weekData) => {
        const resources = weekData.ressources.map((resourceData) => {
            const sessions = resourceData.seances.map((sessionData) => {
                const icons = sessionData.icones.map(
                    (iconData) => new Icon(iconData.libelle, iconData.classe)
                )

                const metadata = new Metadata(
                    sessionData.metadatas.codeMatiere,
                    sessionData.metadatas.coeff,
                    sessionData.metadatas.codesGroupes
                )

                return new Session(
                    sessionData.code,
                    sessionData.type as SessionType,
                    sessionData.couleur,
                    sessionData.libelle,
                    sessionData.numJour as DayNumber,
                    sessionData.minuteDebut,
                    sessionData.duree,
                    sessionData.numSemaine,
                    sessionData.detail,
                    icons,
                    metadata,
                    sessionData.classes,
                    sessionData.contextualMenu
                )
            })

            const constraints = resourceData.contraintes.map(
                (constraintData) =>
                    new Constraint(
                        constraintData.numSemaine,
                        constraintData.numJour as DayNumber,
                        constraintData.minuteDebut,
                        constraintData.duree,
                        constraintData.couleur
                    )
            )

            return new Resource(
                resourceData.code,
                resourceData.type as ResourceType,
                resourceData.libelle,
                resourceData.libelleType,
                sessions,
                constraints
            )
        })

        return new Week(
            weekData.code,
            weekData.libelle,
            weekData.dateDebut,
            resources
        )
    })

    return new Planning(configuration, weeks, manager)
}
