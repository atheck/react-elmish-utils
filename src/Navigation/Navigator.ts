// Anforderungen:
// * Nested Pages
// * Konfiguration für Pages
// * Parameter für Pages
// * Events bei Navigation - Page bekommt nur Events für Navigation innerhalb seines Page Trees
// * Navigation von jeder Seite auf jede andere Seite
// * Globales Back - muss unterbrochen werden können (Validierung, Abbrechen, ...)

// export type Page =
//     | "ProjectsOverview"
//     | "ResourceOverview"
//     | "Login"
//     | "Config"
//     | "Sync"
//     | "Project"
//     | "ProjectsSearch"
//     | "EditResourceLine"
//     | "EditItemLine"
//     | "EditPictures"
//     | "EditExamDeficiency"
//     | "EditOperatingData"
//     | "Settings"
//     | "Changelog"
//     | "Documents"
//     | "Help";

// interface PageConfig {
//     menuAllowed: boolean,
// }

// export type PageNameAndConfig = {
//     name: Page,
// } & PageConfig;

// const pageConfigs: Record<Page, PageConfig> = {
//     ProjectsOverview: { menuAllowed: true },
//     ResourceOverview: { menuAllowed: true },
//     Login: { menuAllowed: true },
//     Config: { menuAllowed: true },
//     Sync: { menuAllowed: true },
//     Project: { menuAllowed: true },
//     ProjectsSearch: { menuAllowed: true },
//     EditResourceLine: { menuAllowed: false },
//     EditItemLine: { menuAllowed: false },
//     EditPictures: { menuAllowed: true },
//     EditExamDeficiency: { menuAllowed: false },
//     EditOperatingData: { menuAllowed: false },
//     Settings: { menuAllowed: true },
//     Changelog: { menuAllowed: true },
//     Documents: { menuAllowed: true },
//     Help: { menuAllowed: true },
// };

type BackHandlerFunc = () => void;
type PreCheckFunc = () => boolean;

const handlers = new Map<string, BackHandlerFunc>();
const preChecks = new Map<string, PreCheckFunc>();
let currentPage: Page = "ProjectsOverview";

type PageChangeHandler = (page: PageNameAndConfig) => void;

let pageChangeHandlers: PageChangeHandler [] = [];

interface SubPage<TPageConfig> {
    name: string,
    // config: TPageConfig,
    subPages?: SubPage<TPageConfig>,
    [key: string]: unknown,
}

interface PageConfig {
    menuAllowed: boolean,
}

type NoSubPages = undefined;

type BasePages =
    | { name: "BasePage1" };

type SubPages =
    | { name: "Page1", id: string }
    | { name: "Page2", no: number }
    | { name: "Base", subPages?: BasePages };

const nav = new Navigator<PageConfig, SubPages>();

// const pages: SubPages [] = [
//     {
//         name: "Page1",
//         config: {},
//         id: "1234",
//     },
//     {
//         name: "Page2",
//         config: {},
//         no: 0,
//     },
// ];

const pages2: Record<SubPages["name"], PageConfig> = {
    Page1: { menuAllowed: true },
    Page2: { menuAllowed: true },
    Base: { menuAllowed: true },
};

function navigateTo (page: SubPages): void {

}

navigateTo({ name: "Page1", id: "1234" });
navigateTo({ name: "Base", subPages: { name: "BasePage1" } });

type PageName<TPageConfig> = SubPage<TPageConfig>["name"];

class Navigator<TPageConfig, TSubPage extends SubPage<TPageConfig>> {
    private handlers = new Map<string, BackHandlerFunc>();
    private preChecks = new Map<string, PreCheckFunc>();

    public registerBackHandler (pageName: PageName<TPageConfig> | "global", handler: BackHandlerFunc, preCheck?: PreCheckFunc): void {
        this.handlers.set(pageName, handler);
        if (preCheck) {
            this.preChecks.set(pageName, preCheck);
        }
    }

    public unregisterBackHandler (pageName: PageName<TPageConfig>): void {
        this.handlers.delete(pageName);
        this.preChecks.delete(pageName);
    }
}

/**
 * Stellt Funktionen für die globale Navigation dar.
 */
const Navigation = {
    /**
     * Registriert einen Handler für die Rückwärts-Navigation.
     * @param pageName Der Name der aktuellen Page.
     * @param handler Die Handler-Funktion.
     * @param preCheck Optional: Wird vor dem Handler aufgerufen und prüft, ob derzeit die Rückwärts-Navigation zur Verfügung steht.
     */
    registerBackHandler (pageName: Page | "global", handler: BackHandlerFunc, preCheck?: PreCheckFunc): void {
        handlers.set(pageName, handler);
        if (preCheck) {
            preChecks.set(pageName, preCheck);
        }
    },

    /**
     * Entfernt den Handler für die Rückwärts-Navigation.
     * @param pageName Der Name der aktuellen Page.
     */
    unregisterBackHandler (pageName: Page): void {
        handlers.delete(pageName);
        preChecks.delete(pageName);
    },

    /**
     * Führt die Navigation zurück aus.
     */
    goBack (): boolean {
        const preCheck = preChecks.get(currentPage);

        let callHandler = true;

        if (preCheck) {
            callHandler = preCheck();
        }

        const handler = handlers.get(currentPage);

        if (callHandler && handler) {
            handler();

            return true;
        }

        return false;
    },

    /**
     * Führt die globale, seiten-unabhängige Rückwärts-Navigation aus.
     */
    globalBack (): boolean {
        const handler = handlers.get("global");

        if (handler) {
            handler();

            return true;
        }

        return false;
    },

    /**
     * Gibt zurück, ob für die Seite ein Handler registriert ist.
     * @param pageName Der Name der aktuellen Page.
     */
    isRegistered (pageName: Page): boolean {
        const preCheck = preChecks.get(pageName);

        if (preCheck) {
            return preCheck();
        }

        return handlers.has(pageName);
    },

    /**
     * Legt die aktuelle Page fest.
     * @param pageName Der Name der Page.
     */
    setCurrentPage (pageName: Page): void {
        currentPage = pageName;

        const page: PageNameAndConfig = {
            name: pageName,
            ...pageConfigs[pageName],
        };

        for (const handler of pageChangeHandlers) {
            handler(page);
        }
    },

    registerPageChangeHandler (pageChangeHandler: PageChangeHandler): void {
        pageChangeHandlers.push(pageChangeHandler);
    },

    unregisterPageChangeHandler (pageChangeHandler: PageChangeHandler): void {
        pageChangeHandlers = pageChangeHandlers.filter(handler => handler !== pageChangeHandler);
    },
};

export default Navigation;