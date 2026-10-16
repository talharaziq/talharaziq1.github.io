/* =========================================================
   TALHA RAZIQ — PORTFOLIO
   Vanilla JavaScript. No libraries.

   The page works without this file. It only adds:
   - scroll reveal for [data-reveal] elements
   - scroll progress bar
   - header state after scrolling
   - active section highlight in the navigation
   - mobile menu closing behavior
   - cursor light and card spotlight (mouse only)
   ========================================================= */

(function () {
    "use strict";

    var root = document.documentElement;

    var header = document.getElementById("site-header");
    var progressBar = document.getElementById("scroll-progress-bar");
    var cursorGlow = document.getElementById("cursor-glow");
    var mobileMenu = document.getElementById("mobile-menu");

    var finePointer = window.matchMedia
        ? window.matchMedia("(hover: hover) and (pointer: fine)")
        : { matches: false };

    var reducedMotion = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false };


    /* -----------------------------------------------------
       1. Scroll reveal
       ----------------------------------------------------- */

    function showElement(element) {
        element.classList.add("is-visible");
    }

    function initReveal() {
        var items = Array.prototype.slice.call(
            document.querySelectorAll("[data-reveal]")
        );

        // The "js" class is what lets the stylesheet hide these
        // elements. It is only added once this script is running.
        root.classList.add("js");

        if (!items.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            items.forEach(showElement);
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        showElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -6% 0px"
            }
        );

        var viewportHeight = window.innerHeight || root.clientHeight;

        items.forEach(function (item) {
            var rect = item.getBoundingClientRect();
            var alreadyInView =
                rect.top < viewportHeight * 0.94 && rect.bottom > 0;

            // Elements on screen at load are revealed right away so
            // they do not flash visible and then hide again.
            if (alreadyInView) {
                showElement(item);
            } else {
                observer.observe(item);
            }
        });
    }


    /* -----------------------------------------------------
       2. Scroll progress, header state, active section
       ----------------------------------------------------- */

    var navLinks = Array.prototype.slice.call(
        document.querySelectorAll(
            '.nav-links a[href^="#"], .mobile-menu-links a[href^="#"]'
        )
    );

    var sections = [];
    var currentSectionId = null;
    var scrollQueued = false;

    function collectSections() {
        var seen = {};

        navLinks.forEach(function (link) {
            var id = link.getAttribute("href").slice(1);

            if (!id || id === "top" || seen[id]) {
                return;
            }

            var section = document.getElementById(id);

            if (section) {
                seen[id] = true;
                sections.push(section);
            }
        });

        // Keep sections in page order, whatever the link order is.
        sections.sort(function (a, b) {
            return a.compareDocumentPosition(b) &
                Node.DOCUMENT_POSITION_FOLLOWING
                ? -1
                : 1;
        });
    }

    function updateProgress() {
        if (!progressBar) {
            return;
        }

        var scrollable = root.scrollHeight - window.innerHeight;
        var progress = scrollable > 0 ? window.scrollY / scrollable : 0;

        progress = Math.min(1, Math.max(0, progress));

        progressBar.style.setProperty("--progress", progress.toFixed(4));
    }

    function updateHeader() {
        if (header) {
            header.classList.toggle("is-scrolled", window.scrollY > 8);
        }
    }

    function updateActiveSection() {
        if (!sections.length) {
            return;
        }

        var headerHeight = header ? header.offsetHeight : 72;
        var offset = headerHeight + 40;
        var current = null;

        sections.forEach(function (section) {
            if (section.getBoundingClientRect().top <= offset) {
                current = section.id;
            }
        });

        var atBottom =
            window.innerHeight + window.scrollY >= root.scrollHeight - 4;

        if (atBottom) {
            current = sections[sections.length - 1].id;
        }

        if (current === currentSectionId) {
            return;
        }

        currentSectionId = current;

        navLinks.forEach(function (link) {
            var isCurrent =
                current !== null && link.getAttribute("href") === "#" + current;

            link.classList.toggle("is-active", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    function onScrollFrame() {
        scrollQueued = false;
        updateProgress();
        updateHeader();
        updateActiveSection();
    }

    function queueScrollUpdate() {
        if (!scrollQueued) {
            scrollQueued = true;
            window.requestAnimationFrame(onScrollFrame);
        }
    }

    function initScroll() {
        collectSections();
        onScrollFrame();

        window.addEventListener("scroll", queueScrollUpdate, {
            passive: true
        });

        window.addEventListener("resize", queueScrollUpdate);
        window.addEventListener("load", queueScrollUpdate);
        window.addEventListener("pageshow", queueScrollUpdate);
    }


    /* -----------------------------------------------------
       3. Mobile menu
       The menu is a native <details> element, so it already
       opens and closes with touch, Enter and Space. This only
       adds the closing behavior people expect.
       ----------------------------------------------------- */

    function initMobileMenu() {
        if (!mobileMenu) {
            return;
        }

        var toggle = mobileMenu.querySelector("summary");

        function closeMenu() {
            if (mobileMenu.open) {
                mobileMenu.open = false;
            }
        }

        // Keep the button label in step with the menu state.
        mobileMenu.addEventListener("toggle", function () {
            if (toggle) {
                toggle.setAttribute(
                    "aria-label",
                    mobileMenu.open
                        ? "Close navigation menu"
                        : "Open navigation menu"
                );
            }
        });

        // Close after choosing a link. The jump to the section
        // still happens, because the link's own action is untouched.
        mobileMenu.addEventListener("click", function (event) {
            if (event.target.closest && event.target.closest("a")) {
                closeMenu();
            }
        });

        // Close on Escape and return focus to the menu button.
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && mobileMenu.open) {
                closeMenu();

                if (toggle) {
                    toggle.focus();
                }
            }
        });

        // Close when tapping or clicking anywhere outside the menu.
        document.addEventListener("click", function (event) {
            if (mobileMenu.open && !mobileMenu.contains(event.target)) {
                closeMenu();
            }
        });

        // Close when keyboard focus moves out of the menu.
        mobileMenu.addEventListener("focusout", function (event) {
            var next = event.relatedTarget;

            if (next && !mobileMenu.contains(next)) {
                closeMenu();
            }
        });

        // Close if the window grows to the desktop layout.
        if (window.matchMedia) {
            var desktop = window.matchMedia("(min-width: 901px)");

            var onChange = function (event) {
                if (event.matches) {
                    closeMenu();
                }
            };

            if (desktop.addEventListener) {
                desktop.addEventListener("change", onChange);
            } else if (desktop.addListener) {
                desktop.addListener(onChange);
            }
        }
    }


    /* -----------------------------------------------------
       4. Cursor light and card spotlight
       Mouse only. Skipped on touch screens and when the
       visitor asks for reduced motion.
       ----------------------------------------------------- */

    var glowTargetX = 0;
    var glowTargetY = 0;
    var glowX = 0;
    var glowY = 0;
    var glowRunning = false;
    var glowStarted = false;

    function paintGlow() {
        if (cursorGlow) {
            cursorGlow.style.setProperty("--cx", glowX.toFixed(1) + "px");
            cursorGlow.style.setProperty("--cy", glowY.toFixed(1) + "px");
        }
    }

    function glowStep() {
        glowX += (glowTargetX - glowX) * 0.2;
        glowY += (glowTargetY - glowY) * 0.2;

        paintGlow();

        var stillMoving =
            Math.abs(glowTargetX - glowX) > 0.3 ||
            Math.abs(glowTargetY - glowY) > 0.3;

        if (stillMoving) {
            window.requestAnimationFrame(glowStep);
        } else {
            glowX = glowTargetX;
            glowY = glowTargetY;
            paintGlow();
            glowRunning = false;
        }
    }

    function moveGlow(x, y) {
        if (!cursorGlow) {
            return;
        }

        glowTargetX = x;
        glowTargetY = y;

        if (!glowStarted) {
            // First movement: place the light under the pointer
            // instead of sweeping in from the corner.
            glowStarted = true;
            glowX = x;
            glowY = y;
            paintGlow();
        }

        cursorGlow.classList.add("is-active");

        if (!glowRunning) {
            glowRunning = true;
            window.requestAnimationFrame(glowStep);
        }
    }

    var lastPointerEvent = null;
    var pointerQueued = false;

    function onPointerFrame() {
        pointerQueued = false;

        var event = lastPointerEvent;

        if (!event) {
            return;
        }

        if (!reducedMotion.matches) {
            moveGlow(event.clientX, event.clientY);
        }

        var target = event.target;
        var card =
            target && target.closest ? target.closest("[data-spotlight]") : null;

        if (card) {
            var rect = card.getBoundingClientRect();

            card.style.setProperty("--mx", event.clientX - rect.left + "px");
            card.style.setProperty("--my", event.clientY - rect.top + "px");
        }
    }

    function initPointerEffects() {
        document.addEventListener(
            "pointermove",
            function (event) {
                if (event.pointerType !== "mouse" || !finePointer.matches) {
                    return;
                }

                lastPointerEvent = event;

                if (!pointerQueued) {
                    pointerQueued = true;
                    window.requestAnimationFrame(onPointerFrame);
                }
            },
            { passive: true }
        );

        function hideGlow() {
            if (cursorGlow) {
                cursorGlow.classList.remove("is-active");
            }
        }

        root.addEventListener("mouseleave", hideGlow);
        window.addEventListener("blur", hideGlow);
    }


    /* -----------------------------------------------------
       Start
       ----------------------------------------------------- */

    function init() {
        initReveal();
        initScroll();
        initMobileMenu();
        initPointerEffects();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
