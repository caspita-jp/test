document.documentElement.classList.add("js");

const navigationToggle = document.querySelector(".nav-toggle");
const pageNavigation = document.querySelector("#page-navigation");
const navigationToggleLabel = navigationToggle?.querySelector(".nav-toggle-label");
const navigationToggleIcon = navigationToggle?.querySelector(".nav-toggle-icon");

if (
    navigationToggle instanceof HTMLButtonElement &&
    pageNavigation instanceof HTMLElement &&
    navigationToggleLabel instanceof HTMLElement &&
    navigationToggleIcon instanceof HTMLElement
) {
    const mobileNavigation = window.matchMedia("(max-width: 760px)");
    const setNavigationOpen = (isOpen) => {
        navigationToggle.setAttribute("aria-expanded", String(isOpen));
        pageNavigation.classList.toggle("is-open", isOpen);
        navigationToggleLabel.textContent = isOpen ? "閉じる" : "メニュー";
        navigationToggleIcon.textContent = isOpen ? "×" : "☰";
    };

    navigationToggle.addEventListener("click", () => {
        setNavigationOpen(navigationToggle.getAttribute("aria-expanded") !== "true");
    });

    pageNavigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            setNavigationOpen(false);
        }
    });

    navigationToggle.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setNavigationOpen(false);
    });
    pageNavigation.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setNavigationOpen(false);
            navigationToggle.focus();
        }
    });

    mobileNavigation.addEventListener("change", (event) => {
        if (!event.matches) setNavigationOpen(false);
    });
}

const readingProgress = document.createElement("div");
readingProgress.className = "reading-progress";
readingProgress.setAttribute("role", "progressbar");
readingProgress.setAttribute("aria-label", "ページの読書進捗");
readingProgress.setAttribute("aria-valuemin", "0");
readingProgress.setAttribute("aria-valuemax", "100");
readingProgress.setAttribute("aria-valuenow", "0");

const readingProgressFill = document.createElement("span");
readingProgressFill.setAttribute("aria-hidden", "true");
readingProgress.append(readingProgressFill);
document.body.prepend(readingProgress);

const scrollTopButton = document.querySelector(".scroll-top");
if (scrollTopButton) {
    scrollTopButton.addEventListener("click", () => {
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth",
        });
    });
}

const mapToggleButton = document.querySelector(".map-link");
const mapFrame = document.querySelector("#abiko-map");
const mapToggleLabel = mapToggleButton?.querySelector(".map-link-label");

if (
    mapToggleButton instanceof HTMLButtonElement &&
    mapFrame instanceof HTMLIFrameElement &&
    mapToggleLabel instanceof HTMLElement
) {
    mapToggleButton.addEventListener("click", () => {
        const isOpening = mapFrame.hidden;
        mapFrame.hidden = !isOpening;
        mapToggleButton.setAttribute("aria-expanded", String(isOpening));
        mapToggleLabel.textContent = isOpening ? "地図を閉じる" : "地図を表示";

        if (isOpening) {
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;

            mapFrame.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "center",
            });
        }
    });
}

let progressUpdateScheduled = false;
const updateReadingProgress = () => {
    const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
    const progress =
        scrollableHeight > 0
            ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100))
            : 0;

    readingProgressFill.style.transform = `scaleX(${progress / 100})`;
    readingProgress.setAttribute("aria-valuenow", String(Math.round(progress)));
};

const scheduleReadingProgressUpdate = () => {
    if (progressUpdateScheduled) return;

    progressUpdateScheduled = true;
    window.requestAnimationFrame(() => {
        updateReadingProgress();
        progressUpdateScheduled = false;
    });
};

window.addEventListener("scroll", scheduleReadingProgressUpdate, {
    passive: true,
});
window.addEventListener("resize", scheduleReadingProgressUpdate);
updateReadingProgress();

const navigationLinks = [...document.querySelectorAll('nav a[href^="#"]')];

const linkTargets = navigationLinks
    .map((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return null;

        let targetId;
        try {
            targetId = decodeURIComponent(href.slice(1));
        } catch {
            return null;
        }

        const section = document.getElementById(targetId);
        return section instanceof HTMLElement ? { link, section } : null;
    })
    .filter((item) => item !== null);

const sections = [...new Set(linkTargets.map(({ section }) => section))].sort(
    (first, second) =>
        first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1,
);

if (sections.length > 0) {
    const scrollOffset = 80;

    const updateCurrentLink = () => {
        const activationLine = window.innerHeight * 0.3;
        const isAtPageEnd =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 1;
        let currentSection = sections[0];

        for (const section of sections) {
            if (section.getBoundingClientRect().top <= activationLine) {
                currentSection = section;
            } else {
                break;
            }
        }

        if (isAtPageEnd) {
            currentSection = sections[sections.length - 1];
        }

        linkTargets.forEach(({ link, section }) => {
            const isCurrent = section === currentSection;
            link.classList.toggle("is-active", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    let updateScheduled = false;
    const scheduleUpdate = () => {
        if (updateScheduled) return;

        updateScheduled = true;
        window.requestAnimationFrame(() => {
            updateCurrentLink();
            updateScheduled = false;
        });
    };

    linkTargets.forEach(({ link, section }) => {
        link.addEventListener("click", (event) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                (link.target && link.target !== "_self") ||
                link.hasAttribute("download")
            ) {
                return;
            }

            event.preventDefault();
            history.pushState(null, "", link.hash);

            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            const top =
                section.getBoundingClientRect().top +
                window.scrollY -
                scrollOffset;

            window.scrollTo({
                top: Math.max(0, top),
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });

            const focusTarget =
                section.querySelector("h1, h2, h3, h4, h5, h6") ?? section;
            if (!focusTarget.hasAttribute("tabindex")) {
                focusTarget.setAttribute("tabindex", "-1");
            }
            focusTarget.focus({ preventScroll: true });
        });
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(scheduleUpdate, {
            rootMargin: "-30% 0px -69% 0px",
        });

        sections.forEach((section) => observer.observe(section));
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    window.addEventListener("popstate", scheduleUpdate);

    updateCurrentLink();
}
